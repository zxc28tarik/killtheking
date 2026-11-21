# AK-NATIVE-09 — Native ORIGINAL Kill the King three-map regression (21 November 2026)

**Main constraint:** The castle is a **map and siege equipment inside the existing Krunker1600/G5.4 FPS game**, not a separate siege game. The user's originally approved camera, WASD/sliding, weapons, native G5.4 140 soldier engine and original 28 script blocks remain byte-identical to AK08. Do not merge to main or start a pitch deck without explicit user instruction.

## Exact offline build

- Path: recovered/native-siege/KillTheKing_AK_NATIVE_09_original_game_siege_map.html
- Local downloadable name: KillTheKing_ANA_OYUN_3_Harita_Gecis_Kusatma_AK09.html
- SHA-256: dc35534d0197b2a210896a8993eb3f42f07362d7acc9fe34c63ed7e10e761c55
- Git blob SHA: 784433985e1628568d6ad2ac4f77888fb2748f2a

## Two concrete fixes (only these differences from AK08)

1. **Normal map button no longer inherits native Army/Siege mode.** The former normal Meadow button left meadowBattleMode=true when an Army selection was still active. As a result the normal grass Arena could unexpectedly run 140 native soldiers. Any regular [data-arena-map] click now resets BOTH nativeSiegeMode and meadowBattleMode. Only the explicitly labeled Army and Siege choices enable G5.4 army gameplay. Existing map geometry cleanup is unchanged.
2. **Compact siege HUD at small screen height**: fix contradictory absolute-position top/bottom CSS. The native G5.4 left command HUD is top-anchored at 166px, keeping it visibly separate from the bottom chat/HP elements in a real 680x560 WebGL rendering. F10 expanded native orders and F6–F9 equipment commands remain.

## Actual acceptance done

**Real Three.js WebGL** running on Chromium/SwiftShader + Xvfb, *not a mocked renderer*. In a SINGLE browser session deliberately switched:
- Normal Meadow FFA -> real WebGL, 0 G5.4 army soldiers, no siege HUD
- Native Meydan Army -> real WebGL, exactly 140 soldiers, no siege structures
- Native Castle Siege -> real WebGL, exactly 140 original soldiers, genuine siege gate and F6/F7/F8 commands accepted
- Back to normal Castle FFA -> real WebGL, 0 G5.4 army soldiers, original full south stone-wall restored, temporary siege gate removed, no siege rendered objects, no compact siege HUD.
**No page or console errors**. Test harness explicitly used match menu click to navigate after a QA-only phase change, NOT a fake full-combat victory.

Real software WebGL **680x560 small view**: native 140 soldiers, compact command HUD top 166–240px, right siege panel top 60–131px, no mutual panel overlap or overlap with chat; errors empty. 680x560 is not a promise of touch-screen game controls.

**Separate NATURAL siege logic simulation (TEST-ONLY mocked WebGLRenderer, not GPU/visual acceptance):** Existing G5.4 native A.step for 140 soldiers, real F6 F7 F8 equipment orders at start, NO injected gate HP, soldier position, timer or winner. Four genuine catapult stone gate contacts plus 6 physical ram hits opened gate at 39.44 seconds; 7 original soldiers crossed the tower; actual unbroken living-soldier majority held the courtyard 15 seconds and won at 65.76 seconds. Two earlier contested-capture resets occurred. JS page/console errors none. Real player FPS manual session still pending.

**7/7 targeted Node original-source/mode-authority tests PASS locally**. GitHub Actions runs this alongside historical AK06-AK08 regression and general browser checks.

## Remaining work

- Hardware (Windows user's actual GPU) manual real FPS 4-8 minute accepted battle on all three map choices, key/mouse feel, frame rate, sound.
- Broader AI seed and equipment class-balance acceptance; original Arena and Meydan approved combat remains unchanged.
- Verify low viewport/phone controls in human testing; desktop already tested in prior AK08 1280x720.
- No main merge, no publisher pitch deck until user asks.
