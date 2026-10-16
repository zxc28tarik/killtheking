# Combat 2.0 — Phase 2: Ordered melee contact and AI guard

## Implemented
- Player sword samples seven angles across a 0.60 radian total fan; the spear samples three angles across 0.15 radians; quick dagger has a medium fan.
- Every sample ray intersects **world collision meshes, live bot meshes, and active barrel meshes together**, sorted by distance. It returns the **first intersected object only**, so it cannot skip a nearer wall for an enemy.
- A single selected contact is resolved per mouse attack, preventing multiple kills/hits from overlap in several rays.
- The old broad bot-center fallback for sword/spear and quick dagger was removed, preserving original damage, headshot and spear-momentum formulas.
- This is **sampled attack-angle coverage at attack time**, not an animation-time physical blade sweep.
- Knight bots may raise their shields only in anticipation of a visible bot opponent's 0.36 second melee wind-up (limited by facing, proximity, line of sight, and 2.4 second cooldown). Some try an early guard, others a late parry read.
- Block uses the same normal 75% damage reduction as the player knight; a late perfect parry cancels damage and briefly staggers the attacker.
- Bot-versus-bot parries do not award a player a kill, heal, medal or score; role selection and free-for-all opponent targeting remain unchanged.
- Guard animations reuse the original shield arm geometry; no new visual style, hero models, camera rules or damage values.

## Verification
- Existing 56 Node tests and 14 new tests for ordered hits, first-wall priority, distinct attack angles, one-contact selection, bot front/rear block/parry and bot scoring isolation.
- Local tests: **70/70 passed**, Node syntax checks passed.
- GitHub Actions must independently pass before the PR is merged.
- Real GPU/WebGL playthrough, visual attack alignment, pointer lock/audio and long-session 6-bot FPS are **not verified** here.

## Remaining
- If actual gameplay shows that single-timepoint multi-ray arcs feel unnatural, investigate a full animation-time swept attack with per-swing hit registry and visual weapon attachment points.
- Refine bot shield telegraph timing and tactical fairness with recorded playtests.
- Combat 2.0 continues with parry balancing, weapon reach and defensive animation before next feature stage.
