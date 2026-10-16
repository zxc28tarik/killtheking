# Combat 2.0 — Visible weapon swing / gameplay trace alignment (phase 5)

## Problem
The sword attack's visual roll was based on a one-sided sinusoidal bounce, while its gameplay collision traced an alternating left-to-right/right-to-left arc. A player could see the blade go one direction while the hit proxy sampled a different direction. The spear's thrust was also independently driven by a different expression, creating future drift risk.

## Changes
- `ArenaWeaponSweep.visualPose(kind, side, progress)` computes viewmodel rotation/offset from the **same 0–1 attack phase** as the gameplay contact pose.
- The sword trace now fades lateral width at the start and finish of the swing, matching a blade that returns to rest; sword visual roll follows the opposite X-axis displacement of a vertical blade's tip.
- Alternate combo strikes really move their blade model left-to-right and right-to-left. Existing attack kick, shield position, sound effects and geometric assets remain unchanged.
- Spear's viewmodel thrust uses the same phase as its contact-extension peak; no separate time curve can drift.
- Added invisible `THREE.Object3D` tip anchors to the **existing** sword and spear groups and a read-only `krunkerArenaStatus().visualWeaponTip` camera-relative coordinate diagnostic. These are neither visible meshes nor new art.
- Gameplay weapon distance, class damage values, headshot rules, frame-to-frame sweep, single-hit policy, projectiles, bot shields and FFA targets remain unchanged.

## Validation
- 7 new Node tests: sword direction sign agreement, endpoint neutral poses, actual Three.js model tip lateral movement, spear extension timing, synchronized source integration, hidden QA anchors, original hit logic retained.
- Local Node suite **92/92 tests PASS**, game and sweep syntax PASS. GitHub CI runs separately and must pass before merge.

## Honest limits
- The gameplay hit proxy now matches the rendered swing's **phase and left/right direction**, but it is not yet literally driven by the real blade-bone tip at every 3D coordinate.
- The invisible visual tip marker is available for instrumenting **real GPU browser tests**; no WebGL-backed first-person/TPS playthrough or visual alignment screenshots were verified here.
- Dynamic enemy positions, viewmodel recoil, camera sway and differing eye-to-mesh depths can still create visual contact discrepancies. Calibrate on real footage before calling pixel-perfect.
- This phase should not be used as evidence of FPS/GC performance improvement.

## Next
Desktop Chrome/Edge with WebGL: 10+ minutes, all four classes, 6 bots, alternate sword combos and spear charge. Record `krunkerArenaStatus()` tip coords and `lastWeaponSwingRaycasts`. Tune hit-proxy depth/range only after observing visible weapon behavior.
