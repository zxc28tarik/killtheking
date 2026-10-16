# Animation 2.0 — Phase 2: Third-person player rig

## Implemented
- The existing **player TPS character** now uses the same `ArenaCharacterMotion` solver as NPCs. Its legs advance from **actual player XZ displacement after `resolvePlayerCollisions`**, rather than `dt * 12` while velocity is nonzero. This avoids running in place when the player presses a wall.
- `blendArticulatedRig(parts, pose, dt)` is shared between bot and TPS rigs. Bot animation equations remain unchanged.
- Added player-only **jump / airborne leg tuck** and **crouch-slide pose** as animation-layer flags; neither changes capsule collider dimensions, jumping physics, slide-hop acceleration, camera or combat.
- Third-person knight shield poses override arm swing; melee/ranged attack recovery is blended into the right arm using the already-existing attack animation timer.
- A camera-mode toggle or class change resets only the visual gait state so old leg positions do not continue onto a different avatar. Respawning also resets TPS gait.
- Approved Krunker-style 3D models, material colors, weapon meshes, FPS viewmodels, melee hit contacts, NPC FFA targeting, AI roles and class damages remain intact.
- Read-only `krunkerArenaStatus().playerTPSWalkBlend` helps inspect when the TPS player has slowed to idle.

## Tests
- Existing 109 Node tests continue.
- New `tests/player-tps-motion.test.mjs` adds 10 tests for distance-synchronized footfall, wall idle, slide, jump, shield priority, attack recovery, real post-collision travel integration, shared bot/player rig blending, reset points and FPS/FFA preservation.
- 119 Node tests expected on GitHub; pull-request CI validates independently.

## Known limitations / next
- Node pose/math tests are not real GPU/WebGL visual tests. Foot sliding on slopes, exact sword hit-to-animation correspondence and long-session GPU FPS remain **unverified** until a desktop Chrome/Edge playthrough.
- TPS uses the existing bot-like 3D rig and simple procedural poses, not custom skeletal motion-captured assets. No character art changes were requested or performed.
- A frame cap applies to pose blending; locomotion blend should be checked on low-FPS devices.
- Next: smoother heading turns for NPCs and player TPS, slope foot placement and animated combat recovery after real-play feedback.
