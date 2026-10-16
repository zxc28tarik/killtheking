# AI 2.0 — Reachable firing positions (phase 4)

## Fixed
Previous ranged tactics accepted a firing position if it was *walkable* and had a clear line of sight, even if a battlement or closed wall completely separated the bot from the position. Bots could repeatedly plan toward impossible vantage points.

- The navigation graph now labels connected regions once after ramp landing links are created.
- New `isReachable(start, goal)` validates walkable endpoints, height/attachment distance, collision-safe attachment to nearest navigation nodes, and connected region identity.
- Archer and musketeer vantage point selection excludes unreachable candidates **before** performing line-of-sight raycasts.
- Close-range spear retreats and ranged retreats also avoid unreachable destinations.
- A* movement, player-only vs bot-vs-bot target selection, four class damages, approved original art and hit effects are unchanged.
- If no reachable firing position has a clear shot, the bot falls back to approaching the selected target rather than choosing an impossible destination.

## Verification
- 6 new targeted synthetic geometry checks: roundabout detour, partitioned arena, invalid endpoints, inaccessible firing spot, reachable firing spot, and reachable close retreat.
- Existing 40 tests continue passing locally: **46/46 Node tests passed**.
- JavaScript source syntax checked.
- Pure decision performance, tested against real castle static geometry (80 collision boxes, four ramps and a 5,053-node navigation graph): 180 tactical replans averaged approximately **0.75 ms per plan** on the local container CPU. This does not represent actual browser frame rate or GPU load.

## Known limitations
- Visual gameplay, input locking and browser-audio verification must still be done in a real WebGL-supported Chrome/Edge test.
- Raycasts and proximity decisions are intentionally time-sliced; long-session six-bot FPS and strategy quality still need observing.
- Navigation is static: moving barriers would require dynamic occupancy and repath handling.

## Next
Run extended live six-bot arena QA and then progress to Combat Mechanics 2.0 (timed defenses and weapon contact) after the real-game regressions are addressed.
