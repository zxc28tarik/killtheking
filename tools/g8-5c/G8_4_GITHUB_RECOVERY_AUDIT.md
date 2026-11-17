# Kill the King — GitHub recovery audit (17 Nov 2026)

## What was actually recovered

A **real playable HTML** was recovered from the repository's GitHub Actions artifact (not reconstructed from snippets):

- Repo: https://github.com/zxc28tarik/killtheking
- Workflow: https://github.com/zxc28tarik/killtheking/actions/runs/39158281628
- Workflow status: success; source branch: `codex/a5-meadow-twentyfold-area`
- Workflow head SHA: `291b9b8575160666a8d2da9c2abbe43814083a2c`
- Artifact ID: `12148091323`, name `killtheking-playable-html`, not expired at inspection
- Recovered artifact ZIP SHA-256: `8e579ed0de9f406c04b0608b308feb513028a6560f4a22ea85702fe4a742cea1`
- ZIP entry: `KillTheKing_Oyna.html` (1,035,675 bytes; timestamp 2026-10-18 19:20)
- Extracted HTML SHA-256: `18dca2a895763f0955566f2fc90651f1ab1a98f86597e399cbac42ac2fc6f15a`
- 25 inline JavaScript blocks; all passed `node --check` individually. Actual GPU/WebGL play was **not** verified.
- This is an **October A5 gameplay baseline only**; it is **not** G8.4 or G8.5.

The Git tree at that SHA has 114 blobs, a non-truncated recursive listing, **no** source path containing `army`, `squad`, `supply`, or G8 naming. The HTML contains no `ArenaArmyBattle`, `G8.4`, or `Ikmal Hattı` marker. The `codex/a8-symmetric-player-commanders` branch has an identical Git tree/head to the A5 branch (0 ahead, 0 behind). The current `main` is from 17 Oct.

## Where the newer work diverged

Earlier conversation records identify the following **separately generated, temporary-sandbox** exports dated 16 Nov 2026:

- `KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna.html`
- `KillTheKing_G8_4_KaynakKod.zip`

Their bytes are **not** available in the current conversation's filesystem/Library or the connected GitHub repository. A path in a previous conversation is not proof of a currently mountable file. The G8.5C–H QA branch contains independent tooling only, not the November playable engine. No GitHub commit, release, PR, or artifact containing the complete November G8.4 playable source was found in the repositories and branch/PR history checked.

## Recovery policy (existing user constraints)

1. Never replace the missing G8.4/G8.5 with the older October HTML, or label October as current.
2. Keep personal FFA movement and army-squad movement separate; do not revert approved damage/rate/tactics/graphics.
3. Keep `main`, A5/A8 and PR #43 unmerged until actual current source is verified.
4. G8.5C–H independent checks are 357/357 (not actual battle simulation).
5. Real 144 paired-mirror matches remain **0/144** and the earlier 388 claimed real-game regressions have not been rerun.
6. Once November source HTML or ZIP is recovered, preserve raw bytes/hashes first, compare to October baseline, identify live hooks, then integrate passively and test real production code.

## Source-of-truth hierarchy

- **November G8.4/G8.5 code:** BLOCKED — source unavailable.
- **Latest verified GitHub playable baseline:** October A5 workflow artifact and its exact SHA above.
- **Independent replay/telemetry utilities:** draft PR #43.
- **User decisions:** existing approved G8.5C subjects remain revisable until user changes them; new high-impact mechanics still require user review.

This document is a traceability record, not an approval to downgrade or rebuild missing production code.
