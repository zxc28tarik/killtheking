# AI 2.0 — Rampart and ramp connections (phase 2)

## Scope / protected behavior
Continue from AI 2.0 navigation v1 without changing the original Krunker-style character models, weapons, textures, damage values, four classes, or independent bot-vs-bot free-for-all target selection.

## What changed
- Corrected the **eastern outer guard wall** geometry, which was mistakenly centered inside the walkway instead of outside it.
- Corrected the southern W-ramp elevation (previously 36.5 units high even though the parapet is ~7).
- Realigned and widened the existing western and eastern ramps into walkable merlon gaps.
- Added a narrow **north access ramp** using the same existing wooden block graphics (small structural addition, not a replacement art style).
- Navigation wall surface elevation now matches the physical wall height: 7 units.
- Increased the navigation grid to 1.25-unit precision; additional fine ramp-landing connectors are included only when every segment clears existing solid colliders.
- Replaced the quadratic A* open-list scan with a bounded binary heap, allowing the complete reachable grid to be searched without hitting the old 1,400-node search cutoff.

## Evidence
- Extracted real castle geometry from `buildCastleArena()` and `createRamp()`; 80 solid collider AABBs and four ramps.
- All five courtyard spawn points and five rampart spawn points connected:
  - Courtyard → courtyard: 20/20 distinct ordered pairs.
  - Courtyard → rampart: 25/25.
  - Rampart → courtyard: 25/25.
  - Rampart → rampart: 20/20 distinct ordered pairs.
- Every path edge was validated with `clearSegment` and every waypoint with `walkableAt`.
- Node tests: 29/29 PASS and JavaScript syntax checks passed locally.
- A single local 90-route diagnostic plus scene extraction finished in under a second in the container; this is **not** an actual WebGL frame-time benchmark.
- Github Actions must pass before merge.

## Limits / next checks
- Browser GPU/WebGL pointer lock, animated foot placement, edge cases with dynamic players, and long-session 6-bot FPS remain untested in a real playable environment.
- AI pathfinding and graphics are separate; bots currently interpolate motion in the air across the small allowable walkable heights. Observe movement near stairs and ledges in an actual playthrough.
- Pending: combat tactics for ranged units, locomotion accuracy and stress testing the castle bots.

## Repro
```bash
node --check src/arena-navigation.js
node --check src/oyun.js
node --test tests/*.test.mjs
```
