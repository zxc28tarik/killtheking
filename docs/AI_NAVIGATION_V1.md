# Kill the King — AI 2.0 / Navigation phase 1

## Delivered
- Pure `src/arena-navigation.js`: bounded A* navigation graph built once using existing castle AABB colliders and ramps.
- Segment sampling and movement collision reject direct paths through walls, crates, obstacles, and invalid height transitions.
- Bots refresh routes after target changes/cooldown, follow waypoints and retry if stuck, while retaining the existing free-for-all target selection.
- Ranged bots relocate when nominally in range but lacking a line of fire.
- Spawn/respawn locations are snapped to nearby walkable grid nodes; approved graphics remain unchanged.
- Read-only arena status exposes bot navigation waypoint count and stuck timer.

## Validation
- `node --check` for navigation module and game JavaScript.
- `node --test tests/*.test.mjs`: 26/26 passed locally (7 new navigation tests).
- Mocked extraction of real `buildCastleArena` construction resulted in 80 static collider boxes / 3 ramps.
- Courtyard routes: 20/20 reachable between distinct courtyard spawn points.
- Elevated/rampart paths are **not yet complete**: 2/20 upper spawn-to-spawn pairs and 0/25 courtyard-to-rampart pairs connected at the initial conservative grid resolution.
- Real GPU/WebGL browser playthrough was unavailable due to browser administrative restrictions.

## Not delivered yet
- Full cross-level path links at ramp entrances and gaps between crenellations.
- More tactical ranged positioning, obstacle-specific path smoothing, and performance profiling on real hardware.
- Confirmation that all combat settings remain balanced after movement changes.

Issue #3 remains open until the elevated route and navigation acceptance criteria pass.
