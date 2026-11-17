# G5.4 musket/pike real commander diagnostics — 17 Nov 2026

**Status:** isolated G5.4 CPU diagnostic; NOT the missing G8.4. No weapon, FFA, HUD, AI rules, team rosters or underlying engine changed.

- Uses the real, unchanged G5.4 mirror candidate (`../arena-army-battle-true-side-swap.js`), SHA-256 `307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841`.
- Measures 32 battle continuations (4 seeded worlds × musket/pike human-controlled squad × ADVANCE/HOLD × blue/red side).
- Validates **winner and exact completion time** against [64-game GitHub Actions artifact](https://github.com/zxc28tarik/killtheking/actions/runs/44085979061), artifact 14329142853. The 32 relevant known outcomes are in `reference_musket_pike_32.json`.
- Observes attack attempts from actual reload events, real damage/kill event payloads, living squad strength, enemy-in-range opportunities, and gunner firing-lane availability. The analysis drains an event-only UI buffer; verifies terminal outcomes and times are identical to the previously recorded unobserved engine.
- **A critical distinction:** 16 musket-led battles had only 1 victory despite 201 kills by the controlled musket squads; 16 pike-led battles won 14 despite only 31 kills by the controlled pikemen squads. This is a combined command/role/team effect. It is **not** justification to buff the musket or weaken the pike without targeted causality testing.
- Limits: no human manual shooting, only 140 soldiers per game, no strict soldier-ID trait reflection, no GPU WebGL, no recovered G8.4.

## Reproduce

From repo root:

```bash
node recovered/army/mirror/musket_balance/diagnose_musket_vs_pike.mjs 0 4
# Repeat start 4,8,...28; CI runs these in parallel.
node --test recovered/army/mirror/musket_balance/test_musket_pike_diagnostics.mjs
node recovered/army/mirror/musket_balance/summarize_musket_pike.mjs
```

The CI workflow `.github/workflows/g5_4_musket_pike_diagnostics.yml` runs all 32 games independently, checks 12 regression tests, emits `reports/G5_4_MUSKET_PIKE_CAUSE_REPORT.md`, and preserves raw data. Issue #47 tracks actual fairness and human-play tests. Keep PR #45 as a **draft**; the main game is not modified.
