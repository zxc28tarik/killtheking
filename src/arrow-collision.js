/*
 * Kill the King — continuous arrow collision (no frame-end-only hits).
 * Pure geometry: Three.js renderer, DOM, and materials are deliberately excluded.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.ArenaArrowCollision = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const EPSILON = 1e-8;

    function pointAt(a, b, t) {
        return { x: a.x + (b.x - a.x) * t,
                 y: a.y + (b.y - a.y) * t,
                 z: a.z + (b.z - a.z) * t };
    }

    function sphereFraction(a, b, center, radius) {
        const x = a.x - center.x, y = a.y - center.y, z = a.z - center.z;
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const coefficient = dx * dx + dy * dy + dz * dz;
        const c = x * x + y * y + z * z - radius * radius;
        if (c <= 0) return 0;
        if (coefficient <= EPSILON) return null;
        const halfB = x * dx + y * dy + z * dz;
        const discriminant = halfB * halfB - coefficient * c;
        if (discriminant < 0) return null;
        const t = (-halfB - Math.sqrt(discriminant)) / coefficient;
        return t >= 0 && t <= 1 ? t : null;
    }

    // Exact intersection against a vertical cylinder, including top and bottom.
    function cylinderFraction(a, b, center, radius, minY, maxY) {
        const px = a.x - center.x, pz = a.z - center.z;
        const vx = b.x - a.x, vz = b.z - a.z;
        const quadraticA = vx * vx + vz * vz;
        const quadraticB = 2 * (px * vx + pz * vz);
        const quadraticC = px * px + pz * pz - radius * radius;
        let enter = 0, exit = 1;
        if (quadraticA <= EPSILON) {
            if (quadraticC > 0) return null;
        } else {
            const discriminant = quadraticB * quadraticB - 4 * quadraticA * quadraticC;
            if (discriminant < 0) return null;
            const root = Math.sqrt(Math.max(0, discriminant));
            enter = Math.max(enter, (-quadraticB - root) / (2 * quadraticA));
            exit = Math.min(exit, (-quadraticB + root) / (2 * quadraticA));
        }
        const bottom = center.y + minY, top = center.y + maxY;
        const vy = b.y - a.y;
        if (Math.abs(vy) <= EPSILON) {
            if (a.y < bottom || a.y > top) return null;
        } else {
            const ta = (bottom - a.y) / vy, tb = (top - a.y) / vy;
            enter = Math.max(enter, Math.min(ta, tb));
            exit = Math.min(exit, Math.max(ta, tb));
        }
        return enter <= exit + EPSILON && enter <= 1 && exit >= 0 ? Math.max(0, enter) : null;
    }

    // Candidate order on an exact tie: wall, ground, barrel, bot.
    function sweep(start, end, options) {
        const length = Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
        if (length <= EPSILON) return null;
        let nearest = null;
        function consider(type, target, fraction) {
            if (fraction == null || !Number.isFinite(fraction) || fraction < 0 || fraction > 1) return;
            if (nearest && fraction >= nearest.fraction - EPSILON) return;
            nearest = { type, target, fraction, point: pointAt(start, end, fraction) };
        }

        if (options.worldHit) {
            const hit = options.worldHit(start, end);
            if (hit) consider('world', hit.object || null, hit.distance / length);
        }
        const groundY = options.groundY == null ? 0.15 : options.groundY;
        if (start.y <= groundY) consider('ground', null, 0);
        else if (end.y <= groundY) consider('ground', null, (start.y - groundY) / (start.y - end.y));

        for (const barrel of options.barrels || []) {
            if (!barrel.active) continue;
            const center = { x: barrel.pos.x, y: barrel.pos.y + 1.1, z: barrel.pos.z };
            consider('barrel', barrel, sphereFraction(start, end, center, 1.15));
        }
        for (const bot of options.bots || []) {
            if (bot.dead) continue;
            consider('bot', bot, cylinderFraction(start, end, bot.mesh.position, 0.9, 0, 3.1));
        }
        return nearest;
    }

    return { sweep, sphereFraction, cylinderFraction };
});
