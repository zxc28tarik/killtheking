# Kill the King — G5.4 2D firing line contact recovery

**Scope:** Real legacy G5.4 CPU battle engine candidate. **Not** the missing November G8.4 engine or a verified GPU playable release.

## Issue investigated

Former 600-second no-winner cases (issue #46) included cross-army survivor distances of 89–135m. Live instrumentation on seed 1776, player bow HOLD, found blue bow at (-165,21), red musketeer at (-81,-77) near the end of the match: **129m apart, zero opposing pairs inside bow or musket firing range**. In another case (seed 1776 musket ADVANCE), blue bow and red musketeer drifted hundreds of metres in parallel without closing range. These are observed from real engine soldier/squad positions.

**Root cause:** When all escort melee squads died, `buildSupportPlan` advanced the AI firing base in X only, using assumed team direction and a constant `homeZ` line. It ignored X/Z distance and kept lone companies permanently 100+m apart across a diagonal, or marching in parallel. This is distinct from the original infinite retreat feedback repaired in G5.4 contact v1.

## Minimal candidate correction

- In the **no-living-melee-escort** branch only, calculate actual **2D distance** from the surviving shooting line to the nearest live opposing squad.
- Approach a 73m (bow present) or 82m (musket only) standoff **in both X and Z**. Cap a planning-period movement correction to [-12,+14] units and retain the existing row/flank formation offsets.
- Human-controlled squad `HOLD` stays exactly in place; damage, fire rate, victory, FFA movement, original archived G5.4 and earlier contact candidate are not changed.
- No timeout wins or draws invented. Each match ends via native elimination.

## Authentic 32-match matrix — actual engine.step at 0.08s

| Seed | Old candidate 600s native finishes | 2D candidate finishes |
|---|---:|---:|
| 1600 | 8 / 8 | **8 / 8** |
| 1776 | 5 / 8 | **8 / 8** |
| 2026 | 5 / 8 | **8 / 8** |
| 31415 | 7 / 8 | **8 / 8** |
| **TOTAL** | **25 / 32** | **32 / 32** |

- Native victories by red: 19, by blue: 13.
- Fastest: 195.52 simulated seconds; slowest: 452.48.
- Engine SHA-256: `20bbefcd9228aadc605d14bf7eccde7e454adc0620958d6d6aeedefd4e1a4617`.
- Separate source candidate: `recovered/army/candidates/arena-army-battle-contact-2d-candidate.js`.
- Each case has 60-second real-engine soldier-casualty checkpoints; a merge script checks exact seeds, roles, commands, hash, winner and extinction, rejects forged successes and duplication.
- 10 focused real-engine/static regression checks passed locally, including unchanged early game dynamics and human HOLD command.
- 30 inline JavaScript syntax checks passed for generated standalone HTML.

## Explicit limits

- Only four seeds and a scripted blue-side commander: **not** a comprehensive balance/fairness test.
- **0 true side swaps** (G5.4 does not support native red player); **0/144 genuine G8.5 mirror matches**.
- No GPU/WebGL 3D play acceptance, no human test, no 280-soldier scale testing.
- G8.4 sources have not been recovered. This report **does not close issue #46** or approve commercial release.

## Next gate

Verify GitHub Actions produces a byte-identical candidate HTML and reproduces all 32 CPU match results from committed source. Then investigate ranged firing-lane obstructions and actual side-swap support separately without touching accepted FFA mechanics.
