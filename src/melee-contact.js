/* Kill the King — collision-aware melee fan (sword arc versus spear thrust).
 * A sampled contact arc, not an animation-time physics sweep.
 */
(function(root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.ArenaMeleeContact = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const ANGLES = Object.freeze({
        sword: [-0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30],
        spear: [-0.075, 0, 0.075],
        dagger: [-0.16, 0, 0.16]
    });
    function selectContact({kind, reach, castRay}) {
        if (!Number.isFinite(reach) || reach <= 0 || typeof castRay !== 'function') return null;
        const samples = ANGLES[kind] || ANGLES.sword;
        let best = null;
        for (const angle of samples) {
            // castRay returns the FIRST intersected object on that ray,
            // including walls and barrels, not an enemy behind a nearer wall.
            const hit = castRay(angle, reach);
            if (!hit || !Number.isFinite(hit.distance) || hit.distance < 0 || hit.distance > reach) continue;
            if (hit.kind !== 'bot' && hit.kind !== 'barrel') continue;
            const score = hit.distance + Math.abs(angle) * 2.5;
            if (!best || score < best.score) best = {...hit, angle, score};
        }
        // Resolve a single chosen target per attack regardless of ray count.
        return best;
    }
    return {ANGLES, selectContact};
});
