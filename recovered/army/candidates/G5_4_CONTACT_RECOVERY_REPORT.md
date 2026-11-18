# G5.4 orphaned fire-base runaway — P0 diagnosis and candidate repair

17 November 2026. **Historical G5.4 game, NOT recovered G8.4.** Corrected game logic is an isolated candidate in this PR; original archived G5.4 HTML and engine remain unchanged.

## Confirmed defect

The original G5.4 battle simulation did not end in **8/8** 600-second 70v70 seed-1600 scenarios (4 player-led classes × advance/hold). Four scenarios had zero casualties in the final five minutes. Inspecting actual game state (not synthetic traces) exposed the cause after frontline escorts died.

In `buildSupportPlan()`, if no friendly melee squads survived, the fire-base target was computed **behind the current shooter positions** every 4.32 seconds. Both armies' surviving musket and bow squads therefore retreated away from each other without an incoming melee threat. In the pike/hold example the nearest opposing living soldiers were 264.2 units apart at 300 seconds and **882.4 units apart at 600 seconds**; all opponents were outside shooting range.

## Isolated patch

The exact source is `candidates/arena-army-battle-contact-recovery.js`. The **only modified engine block** replaces the no-melee firing-base computation: choose nearest surviving enemy squad, target a safe **73-unit** stand-off when archers remain / **82-unit** when only muskets remain, and cap fire-base anchor shifts at 14 units per strategic decision cycle. While friendly pike/sword screen exists, the old defensive logic is byte-identical.

Player orders, formations, damage/rates, FFA movement, passive telemetry and native **last-army-alive** victory condition are unchanged. The archived `modules/arena-army-battle.js` and original G5.4 HTML are also unchanged.

## Before and after — actual G5.4 motor, seed 1600

| Player class | Command | Original at 600s | Candidate natural end | Winner |
| --- | --- | --- | ---: | --- |
| Musket | Advance | No winner | 241.20s | Red |
| Musket | Hold | No winner | 408.88s | Red |
| Pike | Advance | No winner | 209.60s | Blue |
| Pike | Hold | No winner | 273.52s | Blue |
| Bow | Advance | No winner | 360.96s | Red |
| Bow | Hold | No winner | 333.76s | Red |
| Sword | Advance | No winner | 261.20s | Blue |
| Sword | Hold | No winner | 361.60s | Red |

**0/8 → 8/8 natural eliminations**, 2450.72 simulated seconds, blue 3 wins / red 5 wins. No artificial time-limit win or draw was introduced.

## Reproducible source-of-truth checks

- `node --test recovered/army/candidates/test_g5_4_contact_recovery.mjs` checks source diff, unchanged first 10 seconds of actual combat, player command preservation, fire-base re-engagement, compiled self-contained HTML and native winner.
- `run_g5_4_contact_recovery_case.mjs` runs each scenario in a **separate process** with the authentic battle engine and records real checkpoints, units remaining, nearest enemy distance, native terminal winner and duration.
- `merge_g5_4_contact_recovery_cases.mjs` refuses missing, duplicate, cross-source or nonterminal claims; aggregates eight independent matches.
- `build_g5_4_contact_recovery.mjs` replaces only the recovered G5.4 engine script in the historical HTML and adds the earlier passive telemetry without changing the original archive; validates **30 embedded JS scripts**; outputs version/checksum manifest.
- GitHub workflow `g5_4_contact_recovery.yml` generates the eight-match report and a candidate HTML build artifact.

**Limitations:** one seed; four scripted player classes and two orders; actual CPU game engine but **not** GPU/WebGL human gameplay. No 144 mirrored G8.5 matches. The newer November G8.4 engine remains missing (issue #44). Release blocker issue #46 should remain open pending real-browser acceptance, broader seeds, balance/fairness and integration with the latest sources.
