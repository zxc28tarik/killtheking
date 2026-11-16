# Kill the King — G8.5H source recovery handoff and full QA CI

Date: 17 November 2026

## Confirmed complete
- Recovered **G8.5G source-finder tooling** from the prior local delivery and committed all five previously missing G8.5G files to `tools/g8-5c/`.
- Added `tools/g8-5c/run_full_qa.py`, the one-command QA runner covering 13 Node + 2 Python test suites, with count checks preventing skipped suites being reported as success.
- Updated `.github/workflows/g8_5e_qa.yml` to run all 357 checks on each change to the draft tool branch.
- Verified **357/357 independent QA checks locally** and GitHub Actions **G8.5 isolated QA — 357 checks** as **success** on commit `9f3fb86fc2b2f199fb73fe8602868ceda1c5bd95`. **Browser game checks** also reported success on that commit; this checks older repo code, not the missing latest G8.4 HTML.

## Status, not done
- The most recent playable `KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna.html` and `KillTheKing_G8_4_KaynakKod.zip` are still not available in the current session or working container.
- The newest G8.4/G8.5 army-engine files **were not patched or compiled**; no G8.5C–H feature has been wired into the current game.
- **0/144 real mirrored battles** run, and the previously mentioned 388 production regressions were not repeated.
- Hardware/WebGL, long-match and human playability acceptance remain open.
- Draft PR #43 remains isolated from `main`. This is an offline QA/recovery toolkit, **not a playable G8.5 game download**.

## One action needed to unblock real game work
On the user's Windows machine, download/open `G8_5G_Yerel_Kaynak_Bulucu.html` in Chrome/Edge and select the Downloads folder. If the November G8.4 HTML or source ZIP is identified, send **the actual files** into the chat. A finder report or filename alone cannot reconstruct them.

Then (a) check HTML/ZIP integrity and actual feature presence, (b) back up the original, (c) connect passive event capture and seeded side swaps, (d) execute production regressions and actual battle trials. Do not use older G5.4 as a replacement.

User approval for the five previously discussed directions remains valid until revised; new high-impact design changes require a separate decision.
