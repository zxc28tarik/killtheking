# P0: 3D Hit Resolution & Ranged Animation — Acceptance Gate

**Status:** Implemented on branch `codex/p0-3d-hitboxes-and-attack-poses`. GPU/WebGL acceptance remains OPEN; these are engineering/test claims, not verified gameplay observations.

## Real 3D hit detection
- **Bot-to-bot ranged attacks:** cast a ray through the actual character's animated Three.js meshes, using the existing `hitZone` metadata for body/head/arms/legs; equipment tagged `ignore` is excluded. Character position, scale and animation transforms apply in world space.
- **Bot-to-player ranged attacks:** the FPS character mesh is usually hidden, so construct separately intersectable Three.js 3D boxes for head, torso, arms and legs at the *current world position*. The hit volumes shrink on slide. Unlike the previous silhouette-only heuristic, each hit requires an actual ray-box intersection.
- An approximate `aimedShot` still determines intentional spread, but **cannot** grant damage: both actor geometry and the existing solid-wall occlusion check must succeed. The tracer uses a resolved impact point when an actor is hit.
- **Confirmed zones** use the unchanged shared weapon damage table: sword 20/30/16, spear 35/52.5/28, bow draw-dependent, musket 90/135/80, dagger 10/15/8. Bow and musket 4/15 second minimum intervals remain unchanged.
- No change to the accepted castle meshes, visuals, six bot FFA selection, player collision, FPS/TPS movement or slide-hop.

## Ranged pose
- Archer and musket AI windups now feed a dedicated two-arm aiming pose in the existing procedural rig. No replacement sprites, models or movement physics.
- Existing sword/spear windup, shield, hit, death and stagger layers remain.

## Balance measurements
- Match-local counters record ranged shots, confirmed ray hits and head/body/arm/leg events per archer/musket role.
- `window.krunkerArenaBalanceReport().rangedFireAccuracy` reports shots, hits, ratio (null until fired) and impact zones. The existing end-of-round JSON export includes the counters. They reset only at the beginning of a new match and do not alter skill, damage or target choice.
- One player's and six autonomous bot participants continue independent FFA.

## Chrome/Edge acceptance — still required
1. Run a complete 4-minute match, then replay and menu; confirm zero black screens.
2. On castle stairs/sur tops and courtyard, visually compare the AI tracer with the actual limb/head/torso at impact. Test from elevated and diagonal camera positions.
3. Verify a moving/sliding player can dodge ranged shots; shots around walls or equipment do no damage.
4. Hold TAB and inspect `rangedFireAccuracy` in exported JSON. Confirm archer uses at least 4 seconds between shots, musketeer at least 15 seconds, including after respawn.
5. Confirm bot-vs-bot FFA targeting, parry, defense and the accepted movement feel.
6. Verify FPS/TPS poses of all four classes, especially the new pre-shot arm motion.

**Next:** Only after browser feedback, tune ranged attack accuracy; then the separate optional TDM system can be safely integrated. The `src/arena-teams.js` scaffold by itself is not an available game mode.
