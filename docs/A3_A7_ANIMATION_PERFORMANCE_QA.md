# A3 / A7 — Animation 2.0 Polish and Render Diagnostics

**Status:** Code + GitHub Actions regression/build **287/287 PASS** on this feature branch. Real Chrome/Edge WebGL acceptances remain OPEN; no measured GPU FPS improvement can be claimed from Node CI.

## Visible animation changes
- **Archers:** Dedicated bowstring release follow-through, not a melee sword-like arm swing. Distinct from the earlier pre-release nocking/aiming pose.
- **Musketeers:** Both arms stay near the weapon stock through a small shot recoil; no windmill sword pose. Real 15-second musket cadence remains unchanged.
- **Rampart/ramps:** Existing articulated bot feet and torso lean with *actual* navigated height gain/loss per ground distance, bounded to `[-1,1]`. Idle bots do not fake stepping. This only adjusts existing mesh rotation, never position/collision, A* or physics.
- Existing death, head/torso hit reactions, shield/parry, TPS camera and movement remain.

## Render-only performance cleanup
- Bot-to-player planar distance computed directly without building two throwaway Three.js vectors per bot/frame.
- One shared render-scale target and one reusable 3D head-projection vector replace repeated per-bot allocations in the UI overlay.
- Radar canvas redraw limited to **up to 30Hz** even on high-refresh-rate displays (FFA and TDM both work).
- Camera projection matrix recomputation skipped for accumulated FOV changes under 0.025°, while FOV math itself remains intact.
- Bounded `ArenaPerformance` frame-time ring, O(1) sample operation per rendered frame, summary sorting only when requested. Uses **real wall-clock frame deltas** independently of 50ms game-physics dt cap and impact slowdowns. No network upload.
- On-demand `window.krunkerPerformanceReport()` provides last ~1,800 frames’ average FPS, slowest-1% average FPS, p95/p99 frame times, WebGL draw calls, triangle, geometry and texture counts. Results are also included as `renderPerformance` inside end-round JSON exports.

## Required real browser tests
1. Check original 3D graphics, bot animations and collision behavior on each of the castle’s four ramps and battlements, including ascending/descending, attack while turning and sudden stops. Watch for sliding feet or hovering models.
2. Fire a bow and musket at a standing/moving opponent. Compare aiming preparation, release/recoil and hit timing. Test human FPS and TPS too; verify unchanged weapon/arm appearance.
3. FFA default: player + six bots continue fighting one another; TDM option: blue/red goals, ally targeting and team results remain correct.
4. On Chrome/Edge, run 2-, 4- and 8-minute matches. Hold TAB, pause ESC/pointer unlock, replay, change class, and export JSON after round.
5. Use developer console: `window.krunkerPerformanceReport()`. Record computer/GPU, resolution, browser, FPS, slowest 1%, p95/p99 frame time and drawCalls. Compare **against the preceding A4 build on the same machine**; Node tests do not prove FPS improvement.
6. Run 30+ minutes with repeated match resets, watch memory / FPS trend, check for black screens or JS/WebGL errors. If 30Hz minimap feels choppy on fast FPS movement, revisit cadence based on actual footage.

## Scope limits
This is A3/A7 **incremental work**, not complete A7 optimization or the final standalone release. No additional bots/maps, no multiplayer networking, no replacement graphics, no damage or gameplay rule changes. The feature branch is stacked on draft A4 PR #36 and must remain separate until true WebGL user acceptance.
