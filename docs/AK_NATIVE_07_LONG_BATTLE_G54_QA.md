# AK-NATIVE-07 — Original Kill the King / G5.4 siege map

Date: 2026-11-21. The castle is a map of the SAME original FPS/TPS game, not the separate S3D1 siege runtime. The original 28 gameplay/weapon/camera/render scripts, original G5.4 140 soldiers and 8 squads remain unchanged. The additions live only in the final appended siege-map script. This branch is not main; no publisher pitch deck was started.

## Verifiable full offline HTML
Path: recovered/native-siege/KillTheKing_AK_NATIVE_07_original_game_siege_map.html
SHA-256: 078460f39196bbc60d72f558f646403c175ee2768d19958fa5bbeca0eb081f54
Git blob SHA: d7b79ab73aeb44fb0480e651d1b6a9f464c83303

## Actual improvements
- The real catapult first-contact physics now synchronizes the original castle and gate THREE world matrices once before stone tracing. Thus stone collision works without relying on a previous GPU frame. Live original G5.4 soldiers may absorb a stone physically, without invented splash damage. Track genuine stone launches, true gate hits, missed/blocked stones, and matrix sync count.
- An actual castle geometry overlap bug in the old west red musket post was verified: 3 of 10 original G5.4 red musketeers started INSIDE the existing corner watchtower. The new south-east post (31,-54) deploys the same ten soldiers at match start, outside real walls/towers/machines. Across native original G5.4 seeds 1600,42,777,2026 the new post had zero initial solids overlaps and more real equipment shots than the old one; native soldier HP, AI and original 15-second rifle reload are untouched.
- For stalled authentic blue G5.4 assault squads after a breached gate, reissue at most two authentic original setDestination routes per phase, only after 15 seconds without actual progress. Never teleport and never overwrite subsequent manual player commands.
- Conquest still requires 15 uninterrupted seconds of physical, surviving blue soldiers outnumbering living red soldiers in the actual courtyard. Any contested progress resets. HUD/QA exposes actual capture resets and original path-replan count.

## 140-soldier natural browser simulation, seed 1600
Software Chromium browser with TEST-ONLY WebGLRenderer mock. F6 tower, F7 ram and F8 catapult were pressed once at the real beginning. No gate HP, soldier coordinates, battle timer or winner state manipulated in the natural test.
- Genuine catapult real stone first hit at 10.88 game seconds.
- 4 authentic stone-to-gate contacts and 6 physical ram impacts opened the existing gate at 39.44 game seconds.
- 7 living original G5.4 sword soldiers crossed the wall through the actual tower mechanism.
- 15 uninterrupted seconds of actual courtyard control resulted in blue victory at 66.40 game seconds; one earlier contested progress reset.
- 140 soldier IDs preserved, real G5.4 casualties accounted for, no JS console/page errors.
- Tested manual override and forced 15-second stall separately: real original command revisions advanced twice maximum with NO teleport; user manual goal was untouched.
- 6/6 dedicated Node regression tests pass locally.

## Acceptance limitations
- Real hardware or graphical software WebGL rendering and 4–8 minute human-operated FPS playthrough still needed: renderer mock validates logic but NOT pixels, camera quality, audio or actual GPU.
- Other seeds/command patterns and dynamic defense balance remain subject to playtesting; 4 tested seeds are not exhaustive.
- Arena and Meydan sources remain bitwise identical, but a real 3-map manual regression is still outstanding.
- DO NOT merge main without user consent; start publisher pitch deck only on explicit user request.
