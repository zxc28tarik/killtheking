# Animation 2.0 — Phase 1: blended bot motion (2026-10)

## Implemented
- New pure JavaScript `src/character-motion.js` provides procedural animation on **existing articulated Three.js bot rigs**, without replacing approved textures, character models, weapons or the castle.
- Leg gait advances from actual **distance traversed on the ground**, rather than from frame time alone. If navigation stops a bot at a wall or while aiming, its legs ease into idle instead of running in place.
- Smoothed blend weight for walk→idle and idle→walk; opposing leg positions, modest arm swing, torso/head recoil and cape follow-through. Animation does not alter world position or combat decisions.
- Knight shield pose is prioritized above locomotion for the left arm. Melee wind-up and post-attack recovery have distinct right-arm movement, with a short strike-pose timer triggered when the existing hit code attacks.
- Short stagger interrupts the animation and damps walking. Existing hit reaction is augmented by local torso/head recoil, rather than changing hit damage.
- Death collapse now articulates legs, arms, head and torso as well as retaining the existing whole-body fall. Respawn resets animator state.
- Uses **one** per-bot pose evaluation, with the existing pose transform groups, after AI movement and attack logic; retains all underlying hit/contact calculations and bot-vs-bot free-for-all targets.
- Exposes `walkBlend` and `strikePoseTime` through read-only `krunkerArenaStatus()` for future animation QA.

## Tests
- Existing 100 game unit tests retained. The old guard-animation assertion now verifies that the procedural animator owns the left-arm guard pose.
- 9 new tests for distance-driven walking, idle settling, opposing legs, guard precedence, visible wind-up/release, stagger damping, hit reaction, death fall and in-game integration.
- Local checks: **109/109 Node tests PASS**, game/animation script syntax PASS.
- GitHub Actions must pass before merging.

## Limitations and follow-up
- This is procedural **bot** animation blending, not authored keyframed humanoid animation or a new character rig.
- First-person weapon motion is unchanged; third-person **player** motion remains on the existing implementation and can be migrated after checking bot rig quality.
- Real GPU-backed browser movement, stair/ramp foot sliding, six-bot long-session FPS, and visual hit/animation matching remain unverified. Node tests validate code math and structure, not rendered play.
- Before stronger torso rotations and new keyframed poses, capture a local WebGL gameplay video; preserve accepted character appearance.
