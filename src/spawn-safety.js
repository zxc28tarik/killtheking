/* Choose relatively safe positions from the game's existing, pre-authored spawn pools. */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.ArenaSpawnSafety = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    function chooseSpawn(pool, threats) {
        if (!Array.isArray(pool) || !pool.length) throw new Error('Spawn pool must not be empty');
        if (!threats || !threats.length) return pool[Math.floor(Math.random() * pool.length)];
        let best = -Infinity;
        let candidates = [];
        for (const spawn of pool) {
            let closest = Infinity;
            let distanceTotal = 0;
            for (const threat of threats) {
                if (!threat) continue;
                // Horizontal proximity dominates; height alone does not make a spawn safe.
                const flat = Math.hypot(spawn.x - threat.x, spawn.z - threat.z);
                const adjusted = flat + Math.min(5, Math.abs(spawn.y - threat.y) * 0.20);
                closest = Math.min(closest, adjusted);
                distanceTotal += adjusted;
            }
            // Maximize clearance from the nearest attacker; avoid crowded areas on ties.
            const score = Math.min(100, closest) * 10 + distanceTotal / threats.length;
            if (score > best + 1e-6) { best = score; candidates = [spawn]; }
            else if (Math.abs(score - best) <= 1e-6) candidates.push(spawn);
        }
        return candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
    }
    return { chooseSpawn };
});
