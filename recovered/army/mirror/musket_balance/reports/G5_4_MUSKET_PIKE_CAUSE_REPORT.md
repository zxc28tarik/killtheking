# G5.4: 32 real musket/pike commander games — diagnosis

## Coverage and source integrity
- Four seeded deployments × two commander roles × ADVANCE/HOLD × actual blue/red player control = **32 real CPU battles**, 600s cap. All match archived 64-battle outcomes exactly (winner and completion time).
- Engine SHA-256: `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841`
- No changes to combat code, damage, cooldown, AI formation decisions or player orders. Observation of temporary UI combat-event queue is read-only relative to combat logic; engine result checked against prior source-hash-bound artifact.
- This is not actual manual shooting, GPU gameplay, strict team-mirrored traits, G8.4 or public-release balance approval.

## Commander comparison
| Metric | Musket (10 soldiers) | Pike (25 soldiers) |
|---|---:|---:|
| Human-commanded army wins | 1/16 | 14/16 |
| ADVANCE order wins | 1/8 | 6/8 |
| HOLD order wins | 0/8 | 8/8 |
| Attack attempts by human squad | 633 | 679 |
| Damage events by human squad | 347 | 436 |
| Kills by human squad | 201 | 31 |
| Average living troops in controlled squad per snapshot | 6.18 | 5.71 |
| Average troops inside own weapon range per snapshot | 1.63 | 0.18 |
| Average troops ready and in range per snapshot | 0.1 | 0.01 |
| Musket ready troops with clear lane per snapshot | 0.08 | n/a |
| Musket ready troops with obstructed lane per snapshot | 0.02 | n/a |

## Interpretation and next gate
- **The player-controlled company has different troop counts**: muskets 10 and pikes 25. The chosen order removes one autonomous AI commander of the selected class. Win rates therefore measure the *commander/order and team composition*, NOT a pure weapon 1v1.
- Muskets are limited to 4 shots/minute (15-second cooldown); pikes can strike once per ~1.9s and have 2.5× as many bodies in the controlled unit. Neither parameter should be buffed merely to equalize commander win rates.
- Measured firing-lane availability and actual musket attack attempts above distinguish range/access limitations from nominal cooldown.
- Next: controlled non-mutating attribution of clear fire opportunities versus postponed/blocked volleys, plus independent strict trait-mirror variants and manual WebGL comparison.

**Publication gate: remains OPEN.** Issue #47; original G5.4 source retained; G8.4 missing.
