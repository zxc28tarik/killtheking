# P0 — Swept arrow collision

## Problem
The original projectile code checked barrel/bot overlap at the **new position** first, and only then raycast the segment against the world. High-speed arrows could therefore hit actors or fuses through thinner intervening walls.

## Implementation
- Added `src/arrow-collision.js` as a pure nearest-impact resolver.
- Each frame sweeps the entire segment `previous position → current position`.
- Finds the earliest **world surface, ground plane, active barrel sphere, or live bot cylinder** intersection. On ties, world/ground are preferred.
- Keeps original arrow speed, bow charge, gravity, headshot threshold, damage calculation, trails, sound, and 10-second wall sticking.
- In-game code passes the existing Three.js world raycast into the helper; math itself is fully testable without WebGL.
- Prevents fast arrows skipping enemies as well as hitting enemies beyond a nearer wall.

## Validation
- 10 new Node tests: wall before target, target before wall, nearest enemy irrespective of list order, swept barrel, dead/inactive objects, no hit, vertical/cylinder cases, ground crossing, source integration.
- Prior 4 combat foundation tests remain.
- Local checks: 14/14 passed, JavaScript syntax checks passed.
- GitHub CI status should be checked independently before merge.

## Limits
- No real GPU/WebGL playthrough or performance profiling has been performed in this environment.
- Current projectile collision targets the **existing simplified** barrel sphere and bot cylinder; visually exact hit meshes may be an optional future refinement.
- Improved projectile resolver does not replace future safe respawn and navigational AI tasks.

Next planned milestone: [Issue #3](https://github.com/zxc28tarik/killtheking/issues/3) — safe respawns and navigational awareness.
