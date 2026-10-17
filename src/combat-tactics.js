/* Kill the King — deterministic class-specific arena combat movement decisions.
 * Pure targeting/movement planning; never assigns a new opponent or damages actors.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.ArenaCombatTactics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const TOL = 1e-6;
    const sqrtHalf = Math.SQRT1_2;
    const DIRECTIONS = [[1,0],[sqrtHalf,sqrtHalf],[0,1],[-sqrtHalf,sqrtHalf],[-1,0],[-sqrtHalf,-sqrtHalf],[0,-1],[sqrtHalf,-sqrtHalf]];
    function plan({role, from, target, range, hasLineOfSight, navigator, canSeeFrom,
        seed = 0, underPressure = false}) {
        const dx = target.x - from.x, dz = target.z - from.z;
        const distance = Math.hypot(dx, dz);
        const nx = distance > TOL ? dx / distance : 1, nz = distance > TOL ? dz / distance : 0;
        const point = (x, z) => ({x, z, y: navigator.heightAt(x, z)});
        const valid = candidate => navigator.walkableAt(candidate.x, candidate.z, candidate.y);
        // A position that is visible but disconnected from the bot is not a
        // valid firing or retreat destination. Older mocks lack isReachable.
        const accessible = candidate => typeof navigator.isReachable !== 'function' ||
            navigator.isReachable(from, candidate);
        const result = (mode, goal) => ({mode, goal});
        const hold = () => result('hold', null);
        const approach = () => result('advance', point(target.x, target.z));
        // Each candidate must be physically walkable; movement will still use A* and safeAdvance.
        function dodge(away, spacing) {
            const direction = away ? -1 : 1;
            const start = point(from.x, from.z);
            const sign = (seed & 1) ? 1 : -1;
            const side1 = [-nz * sign, nx * sign];
            const side2 = [nz * sign, -nx * sign];
            const angled1 = [nx * direction * 0.65 - nz * 0.76 * sign,
                nz * direction * 0.65 + nx * 0.76 * sign];
            const angled2 = [nx * direction * 0.65 + nz * 0.76 * sign,
                nz * direction * 0.65 - nx * 0.76 * sign];
            // Retreat gets distance first; evasive strafe must try lateral lanes
            // before moving TOWARD the opponent, especially under fire.
            const vectors = away
                ? [[nx * direction, nz * direction],side1,side2,angled1,angled2]
                : [side1,side2,angled1,angled2,[nx,nz]];
            for (const [vx,vz] of vectors) {
                for (const scale of [1, 0.6]) {
                    const candidate = point(from.x + vx * spacing * scale, from.z + vz * spacing * scale);
                    if (valid(candidate) && navigator.clearSegment(start, candidate) && accessible(candidate))
                        return result(away ? 'retreat' : 'strafe', candidate);
                }
            }
            return hold();
        }
        if (role === 'knight') return distance > Math.min(2.8, range * 0.72) ? approach() : hold();
        if (role === 'pikeman') {
            if (distance < 3.1) return dodge(true, 3.5);
            return distance > range * 0.79 ? approach() : hold();
        }
        const ranged = role === 'archer' || role === 'musket';
        if (!ranged) return approach();
        const minimum = role === 'archer' ? 10.5 : 9;
        const preferred = role === 'archer' ? 18 : 16;
        // Crowding takes priority over a currently clear shot.
        if (distance < minimum) return dodge(true, 6);
        if (!hasLineOfSight) {
            const possible = [];
            // Sample bounded vantage positions around THIS bot; no player-specific targeting.
            for (const [ox,oz] of DIRECTIONS) {
                for (const radius of [5,9]) {
                    const candidate = point(from.x + ox * radius, from.z + oz * radius);
                    if (!valid(candidate) || !accessible(candidate) || !canSeeFrom(candidate, target)) continue;
                    const aimDist = Math.hypot(target.x - candidate.x, target.z - candidate.z);
                    if (aimDist > range * 0.93 || aimDist < minimum * 0.7) continue;
                    const travel = Math.hypot(candidate.x-from.x,candidate.z-from.z);
                    const score = travel + Math.abs(aimDist - preferred) * 0.45;
                    possible.push({candidate, score});
                }
            }
            possible.sort((a,b)=>a.score-b.score);
            if (possible.length) return result('seek-shot', possible[0].candidate);
            return approach();
        }
        if (distance > Math.min(range * 0.76, preferred + 5)) return approach();
        // Keep a pressured archer/musketeer moving while still using validated
        // A* reachable positions; never grant extra damage or see through walls.
        if (underPressure) return dodge(false, 4.5);
        return hold();
    }
    return {plan};
});
