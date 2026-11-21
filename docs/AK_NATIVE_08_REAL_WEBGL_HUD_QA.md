# AK-NATIVE-08 — Real WebGL check, siege-map-only compact commander HUD

Date: 2026-11-21. The castle remains a selectable MAP inside the exact original Kill the King Krunker1600 / native G5.4 game. No parallel siege FPS engine, no Arena/Meydan gameplay changes, no source-script edits to the 28 original scripts, no main merge, no publisher pitch deck.

## Complete offline game file

recovered/native-siege/KillTheKing_AK_NATIVE_08_original_game_siege_map.html

- Exact SHA-256: 7d5da4eaab5f62a0fd00af362d7ab4cde0807ff6143f1eb58e7761d63787d7ef
- Git blob SHA: 014fe3a2730861d23f3ae770af198a43f2b1e56f
- Local download file: KillTheKing_ANA_OYUN_KaleKusatmasi_WebGL_HUD_AK08.html
- All original 28 HTML script tags are byte-identical to AK-NATIVE-07; 29th siege-only script modified. Original 140 living G5.4 actor identities, FPS camera/weapons, original GUI hotkeys and dynamic army command authority preserved.

## Implemented in the actual original game

- Castle mode only: first entering a siege opens the original G5.4 left command panel and right equipment panel in COMPACT view. Left ~119 px tall under radar (top 166px), right ~91 px tall at top right; no overlapping the original bottom-left chat feed or the 3D center crosshair.
- F10 or labeled panel buttons expand/collapse both original panels without losing any underlying G5.4 command controls. ESC then mouse for clickable command buttons; original tactical map P and F6/F7/F8/F9 original siege orders remain. 8-squad controls, formations and volley settings still in expanded left panel.
- Right compact status exposes actual gate, ram, catapult, tower HP, living courtyard soldiers and uninterrupted capture seconds. Detailed status remains accessible.
- Throttle DOM stats text refresh to 4 Hz IN SIEGE ONLY to reduce WebGL CPU overhead, not the native G5.4 physics tick or the per-frame victory/capture checks. Native read-only QA snapshot continues every frame.
- On starting a non-siege mode, remove compact classes from native G5.4 HUD; original Arena and Meydan CSS/controls remain unchanged.

## What actually passed in browser

**REAL THREE.js WebGL**: Xvfb + headed Chromium 144 + ANGLE SwiftShader with a true WebGL rendering context. Unlike earlier AK-NATIVE-01–07 acceptance fixtures, the actual renderer IS NOT MOCKED in this test. Original 140 G5.4 roster, 70 blue/70 red, real scene, 3 native F6/F7/F8 assignments all accepted; compact heights 91px and 119px, F10 expands/collapses both; page errors=[], console errors=[]. Verified with actual rendered screenshots. WebGL screenshots of default Arena and grassy-field FPS were also captured in the same Chromium environment, though a combined sequential screenshot run exceeded its time budget. This is software WebGL, **NOT** a Windows hardware GPU acceptance.

**Separate natural 140-actor logic test (WebGLRenderer MOCK ONLY, explicitly not graphical acceptance)**: Original actual G5.4 A.step simulation and all real siege orders, no test-injected gate HP, actor state or clock: 4 physical stones and 6 genuine ram impacts opened gate at 39.44s, 7 original sword soldiers crossed tower, 15 uninterrupted seconds of living-soldier courtyard control won at 66.08s, 2 earlier progress resets; 140 original actor records maintained; console/page errors absent. Separate forced stall test 2 real G5.4 route retries maximum without teleport; player manual commands retained. This is time-accelerated logic validation, not a human-played 66-second match.

## Tests

- node --check on only appended siege script PASS
- AK07 original 6/6 Node tests PASS; AK08 added 6/6 original-source + compact HUD invariants (CI)
- Headed Chromium software WebGL accept: real Three.js scene, native 140 soldiers, F10, F6/F7/F8 no errors PASS

## Remaining limitations

- Windows / actual GPU, real 3-map full manual regression, long player-controlled 4–8 min match and hardware performance still need acceptance; do not represent software SwiftShader as a player's GPU.
- F10/compact layout tested on desktop 1280×720; small-screen visual QA remains.
- One full 3-mode WebGL sequential screenshot job timed out under software rendering, therefore a complete combined 3-mode graphical acceptance is NOT claimed.
- No merge to main without explicit approval; pitch deck only at user's instruction.
