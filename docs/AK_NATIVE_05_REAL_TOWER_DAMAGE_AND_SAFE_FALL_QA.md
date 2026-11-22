# AK-NATIVE-05 — Same ORIGINAL G5.4 game: real siege-tower equipment damage / structural collapse

2026-11-21. **Source of truth is the full committed HTML**:
`recovered/native-siege/KillTheKing_AK_NATIVE_05_original_game_siege_map.html`

Verification identifiers:
- exact HTML byte SHA-256: `0fbebfc6cbaac29e4c11789b809ba50f5a2e0531068d619e006ad45d4d3e32fa`
- exact Git blob SHA-1: `201b010dae8a010750a45c28ba4933328fa5d7ef`
- all previous 28/28 original script blocks are unchanged vs AK-NATIVE-04 (including original Krunker1600 / G5.4 engine, original FPS camera, WASD, class damage and 140 original G5.4 soldiers/8 squads). All changes in one extra siege-map gameplay script; no standalone parallel siege FPS.

## Implemented and verified
1. The real original red native G5.4 musketeers can allocate their **existing** 15-second musket shot to a real 3D **tower frame** ray if first-contact original walls, blockers and soldier collision permit it. Aim dispersion and misses still apply. This replaces an infantry shot, never produces a free second shot.
2. The tower has provisional 400 equipment HP and takes up to 32 equipment HP per actual rifle hit (independent from native soldier damage). HUD reports tower HP, shooter shots, hits and destruction. Local timber material flashes on hit; ram/catapult and original map materials are unaffected.
3. On genuine lethal hit: stop advancing/boarding, remove elevated bridge and all original FPS/G5.4 walkable tower ramps, convert tall side wall colliders into low physical debris for both native and player navigation, animate tilt/darkening.
4. The **real existing** G5.4 climbers are moved from the active climb registry to bounded gravity fall (19.6m/s²) at their live ID/XYZ; original 140 soldiers remain unchanged. Soldier combat is suppressed while airborne; landing incurs short stamina/reload stagger, but **does not claim a new native fall-damage API** or secretly change HP.
5. The original SOUTH STONE wall is still solid: a falling soldier over its 7m top travels continuously to the inner lip before dropping; never clips through the stone or teleports inside. Surviving climb/crossing without tower destruction remains as before, including 8 natural climbers.

## Acceptance
- Node `--check` for integrated JS: PASS.
- Original AK-NATIVE-03 13/13 source-extraction native G5.4 logic regression: PASS.
- Chromium headless **renderer-mock only** normal-play regression: native F6 accepted, 140 native G5.4 roster, 8 living original soldiers boarded and crossed the intact tower, gate 600/600 HP and closed; no console/page errors.
- Chromium **renderer-mock only** controlled damaging-shot fixture: one pre-existing G5.4 red musket ID 72 preserved alive by relocating it far away at test start. After real native tower climbing, reposition this SAME living soldier into a clear 3D fire line, set tower equipment HP=20 for lethal-hit isolation. Exactly one real 15s musket shot hits tower, 8 real ongoing climbers enter gravity fall, 8/8 land, wall-top soldier never falls through original stone, tall collision and bridge/ramp removed, 140 native soldiers remain, page/console errors zero. **Fixture reposition/HP setting is a test setup, not a naturally completed continuous battle.**
- Real hardware/software WebGL and full natural 4–8 minute player-controlled siege are **NOT** yet confirmed; headless mock does not validate visual rendering.
- No merge to main, and publisher pitch deck not started (requires user command).

## Next
- [ ] Full real-GPU long-match natural 3-map parity and castle AI balance acceptance.
- [ ] Final siege outcome victory/UI checks during actual full natural match, real F6-9 player combat with destruction.
- [ ] Tune defender outpost survivability; in unconstrained simulated natural matches the red outpost musketeers sometimes die before tower docking, so this scenario was isolated with a genuine soldier fixture rather than fabricated live acceptance.
- [ ] Review wreckage art/FX and soldier ground landing physics in hardware.
