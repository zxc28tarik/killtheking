# Kill the King G8.5D — user-approved, changeable implementation decisions

Date: 17 November 2026. The user explicitly approved proceeding with the five G8.5C topics **until they say otherwise**. Approval is **revisable**, not permanent, and an isolated `.` is not automatic approval of new major design choices.

| Area | Current status | Boundary |
|---|---|---|
| Retain established FFA / army movement separation and combat decisions | Active constraint, older playable game left untouched | No changes to individual FFA runtime |
| Seeded reproducible battle randomness | Pure G8.5D module written and locally tested | Real G8.4 RNG integration pending; never override global Math.random |
| Real side swaps | Pure G8.5D per-class spawn relocation and original-vs-swapped checks written | Actual live spawn application and measurement pending |
| Score, FPS and AI decision telemetry | G8.5C non-invasive recorder available | Real game event hook missing |
| 144 mirrored runs | 144 proposed run manifest exists | 0 actual G8.4/G8.5 matches executed |

## What changed in G8.5D

`g8_5d_seeded_mirror_start.mjs` exposes `createBattleRandom(seed)`, `createMirroredSpawns(rosters,sideSwap)` and `measureStartLayout(rosters)`. The RNG has named per-system/per-soldier independent streams plus stateless tick-indexed draws. Swapped rosters keep team identities, soldier IDs, unit types, hit points and existing non-spawn data. Only location, altitude (when available) and initial facing transfer. Array inputs are not mutated. Swaps require equal unit-type counts for each army; mismatches fail explicitly. This utility is NOT automatically executed by the game.

## Verification and missing work

- 39/39 additional G8.5D independent fixture tests passed.
- 186/186 total independent QA tests (G8.5B/C + D) passed in local kit. These do **not** verify the production game.
- Latest known playable G8.4 HTML: `KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna.html`; source ZIP: `KillTheKing_G8_4_KaynakKod.zip`. Neither source bytes could be recovered in this session. GitHub main and October PRs predate G8.4, so do not downgrade the game.
- 388 previously reported production regressions were **not rerun**.
- 0 of 144 real matches completed. The manifest is a plan, not results.
- Full browser GPU, FPS, 30-minute performance and human playability acceptance remain pending.

## Next action

Recover current G8.4/G8.5 source. Locate actual army creation, RNG use, unit spawning, scoreboard, and match-finish events; connect the opt-in telemetry and seeded mirror start there without touching the FFA module; then run production regressions and real mirrored-match trials. Keep this PR draft until verified and user-accepted. The user can change any of these decisions later.
