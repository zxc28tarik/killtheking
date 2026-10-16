/* Kill the King - timed, facing-dependent defense for knight shields.
 * Pure combat math, independent of Three.js and browser. */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.ArenaCombatDefense = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const FACING_COSINE = Math.cos(70 * Math.PI / 180);
    const PARRY_DURATION = 0.24;
    const PARRY_COOLDOWN = 1.15;
    const STAGGER_DURATION = 0.72;

    function assessShield({shielding, defender, attacker, yaw, parryTime = 0, melee = false}) {
        const clear = { kind: 'hit', multiplier: 1, facing: false };
        if (!shielding || !defender || !attacker) return clear;
        const dx = attacker.x - defender.x;
        const dz = attacker.z - defender.z;
        const length = Math.hypot(dx, dz);
        if (length < 0.001) return clear;
        // Camera forward is (0, 0, -1) rotated around the Y axis by yaw.
        const forwardX = -Math.sin(yaw), forwardZ = -Math.cos(yaw);
        const facing = (dx * forwardX + dz * forwardZ) / length >= FACING_COSINE;
        if (!facing) return clear;
        if (melee && parryTime > 0) return {kind:'parry',multiplier:0,facing:true};
        return {kind:'block',multiplier:0.25,facing:true};
    }
    return {assessShield, PARRY_DURATION, PARRY_COOLDOWN, STAGGER_DURATION};
});
