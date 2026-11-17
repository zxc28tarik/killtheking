# Kill the King G8.5E — Passive AI decision trace and replay comparison

17 Nov 2026. **User-approved direction, subject to later changes:** preserve accepted combat and FFA/army movement separation; seed battle RNG; swap actual unit starting positions for mirrored trials; record scoreboard/performance/AI decisions passively; prepare 144 real battle requests.

## Implemented (QA layer only)
- `g8_5e_decision_trace.mjs`: stable event serialization, guarded payloads, bounded trace, digest, same-side/same-seed first-divergence report.
- `g8_5e_passive_battle_adapter.mjs`: composes existing G8.5C result recorder and G8.5D real spawn measurements with the new decision trace; no game-state writes.
- `g8_5e_compare_cli.mjs`: compare JSON traces, exit 0 identical / 3 diverged / 2 invalid.
- `G8_5E_Karar_Izi_Karsilastirici.html`: file:// compatible offline two-record viewer.
- Node unit tests and DOM-stub UI smoke tests; GitHub Actions workflow `.github/workflows/g8_5e_qa.yml`.

## Verification
Local isolated modules: **255/255** (prior 186, new trace/adapter 59, new panel 10). CI on branch has reported success for G8.5E QA and Browser game checks. **These are not production G8.4/G8.5 battle tests.**

## Missing evidence
- Current G8.4/G8.5 playable HTML and source ZIP unavailable; GitHub main is older October baseline. Do not revert or replace newer game source using older branch.
- 0/144 actual 140/200/280 soldier real paired games executed.
- 388 previously reported production tests were not rerun.
- No hardware browser/WebGL FPS or extended-match validation.
- Identical event traces only establish trace equivalence, not authenticity of game execution.

## Next
Recover and verify current playable source; connect passive recorder to authoritative spawn, AI decision, frame, and match-result events; then run real matching-seed repeats and true-side-swap trials with start-layout proof. Keep PR draft and main unchanged until acceptance.
