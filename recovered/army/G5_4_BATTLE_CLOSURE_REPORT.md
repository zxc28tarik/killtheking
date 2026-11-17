# Kill the King — G5.4 genuine battle-end endurance audit

**Date:** 2026-11-17  
**Source:** Recovered historical G5.4 `ArenaArmyBattle`, not November G8.4.  
**Live production game engine modified?** No.

## Exact observed 8 × 600s CPU trials

Fixed seed `1600`. Four player classes × two player squad commands (advance/hold), 70 blue vs 70 red soldiers, eight squads. A single case was ended only by our **test observation boundary**, never by the actual game.

| Player class | Command | Surviving blue/red at 600s | Casualties between 300–600s | Native winner |
|---|---|---:|---:|---|
| musket | advance | 5 / 23 | 16 | none |
| musket | hold | 12 / 14 | 7 | none |
| pike | advance | 25 / 24 | 1 | none |
| pike | hold | 25 / 25 | **0** | none |
| bow | advance | 10 / 25 | 3 | none |
| bow | hold | 10 / 22 | **0** | none |
| sword | advance | 25 / 24 | **0** | none |
| sword | hold | 28 / 23 | **0** | none |

**Outcome:** 0/8 natural match terminations, 8/8 unresolved after 600s; 4/8 had no casualties in the last five minutes. This is **4,800 simulated battle seconds / 80 minutes of CPU game-time**, not 80 minutes of live GPU play.

## Root rule identified in the actual code

The engine's `oneTick()` assigns the native `winner` only when **at least one army has zero surviving soldiers**:

```js
if (!blue || !red) state.winner = blue > red ? 'blue' : red > blue ? 'red' : 'draw';
```

The G5.4 engine has **no native time-limit outcome**. The real winner handling is correct for terminal elimination, as confirmed with synthetic eliminated-army fixtures, but eight normal battles were not able to reach it within ten minutes. A timeout test should **not** silently designate a victor using remaining headcount.

## Verification and next work

- Local suite: **115/115 independent G5.4 tests passed** (93 historic + 22 closure/merge tests). This verifies observation/validation, **not** closure readiness.
- GitHub CI has an isolated workflow `g5_4_endurance.yml` to reproduce all 8 real 600s cases and publish JSON evidence. Its job summary explicitly distinguishes successful tooling execution from a failed release gate.
- Historical test seed only: `1600`. Generality to all seeds, human combat or G8.4 cannot be inferred.
- `recovered/army/g5_4_battle_endurance_qa.mjs` is **read-only**; combat, AI, FFA and army rules unchanged.
- **Release acceptance: BLOCKED** for G5.4 without a deliberate solution for non-terminating battles.
- Next research: separate *tactical standoffs* from true navigation bugs with soldier-to-enemy distances, target accessibility, command history. Decide time-limit/objective rules later as a separate game-design choice; do not change the user's established combat or commander behaviors without evidence.
- G8.4 source recovery issue #44 remains open; **0/144 real G8.5 mirrored battles** were run.

This is a source-code/test evidence report, not a claim of a fully playable and approved release.
