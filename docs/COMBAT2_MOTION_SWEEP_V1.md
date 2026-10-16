# Combat Mechanics 2.0 — Phase 4: Player-motion sweep and collision workload

## Motivation
The virtual sword/spear contact system already sampled the attack animation across frames, but it missed the **translation of the player** between those frames. During slide-hop or fast turning, the weapon's world-space tip could cross a fighter or barrier without its former position being traced. The game also rebuilt fresh lists of every bot mesh and barrel mesh each active weapon frame, even when they were distant.

## Changes
- `ArenaWeaponSweep.advance` now accepts an optional fourth callback to project local tip positions into **world space**. The previous projected world-tip position is snapshotted by value; every subsequent animation sample checks the segment from previous to current position.
- The nearest-hit callback still uses world, bot and barrel mesh raycasts. If a solid world hit blocks a world-space bridge, that sample does not award a later local hit. A swing remains **single-contact**.
- Kept backward compatibility for existing `ArenaWeaponSweep.advance(swing, dt, castSegment)` users and old sword/spear pose timing.
- Reuses the swing's dynamic contact list buffer. Includes all static world meshes, but only live bots and active barrels within the swing's reach plus a conservative four-unit safety margin.
- Records the number of raycasts performed by the most recently completed weapon attack in the read-only `krunkerArenaStatus().lastWeaponSwingRaycasts` snapshot. This makes actual browser profiling easier.
- No player/bot damage constants, class profiles, viewmodel meshes, shader/textures, bot FFA target logic, or current visual weapon attack animations changed.

## Validation
- 6 targeted new tests: high-speed moving-player contact, wall blocking on moving-player bridges, copied world-tip snapshots, nearby/distant candidate filtering, backward compatibility, telemetry integration.
- Local source-level Node suite: **85/85 PASS**, syntax check success.
- GitHub Actions CI required to verify the branch before merging.

## Important limitations
This still uses a **virtual gameplay-reach collision tip**, not the geometric blade-tip bone of the rendered sword. To obtain accurate visual alignment, we must inspect the first-person mesh motion in real WebGL gameplay and calibrate the attack proxy or bind it to real mesh endpoints. The new bridge reduces missed contacts during rapid movement but is not a substitute for GPU/visual testing.
The CPU culling reduces the dynamic target meshes considered; a real frame-time and FPS measurement on a GPU-equipped desktop is still required.
