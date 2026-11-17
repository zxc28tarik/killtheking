# Kill the King G8.5I — GitHub source build trace

**Date:** 2026-11-17

## Outcome

The old repository game build was previously being published from November QA workflow runs under the unqualified artifact name `killtheking-playable-html`. This caused ambiguity because the game source on those runs was the older October arena, **not** November G8.4.

To prevent the ambiguity, the draft branch now:

1. Generates a mandatory `KillTheKing_Build_Provenance.json` alongside every GitHub Actions-built `KillTheKing_Oyna.html`.
2. Includes the checked-out commit, Git ref, repository, run ID, file length and SHA-256.
3. Explicitly marks `november_g8_4_gameplay_verified: false` and `real_battle_tests_executed: false`, refusing to infer a game version from filenames.
4. Changes the artifact name to `killtheking-repo-build-unverified-G8_4-<github.sha>`.
5. Executes dedicated provenance regression tests as part of the browser CI.

## Verified live GitHub Actions artifact

- Workflow run: https://github.com/zxc28tarik/killtheking/actions/runs/43985367978
- Status: **success** (in parallel, G8.5 isolated QA 357 checks: success on run 43985367957).
- Artifact ID: **14284638004**.
- Artifact files: `KillTheKing_Oyna.html` (947,227 bytes), `KillTheKing_Build_Provenance.json` (627 bytes).
- HTML SHA-256: `f837a24bce3a5ba6dd76e787816b7714589520ad9b3dee74cb6c181adc3e6e1d` (verified from downloaded bytes and the manifest).
- Checked-out source SHA: `5e904139415681be9a770fc0d378c85232d157a9`.
- Checked-out ref: `refs/pull/43/merge`. This is the **GitHub PR test merge commit**, not the feature branch head. The branch commit that triggered this run was `50b2063645701202a9efd8c73cbdc1360e9d732a`.
- Artifact contains **no** proven November G8.4 engine. It is an older repo baseline; never substitute it for the November game.
- Latest recoverable October A5 HTML remains the distinct 18 Oct workflow artifact 12148091323, SHA-256 `18dca2a895763f0955566f2fc90651f1ab1a98f86597e399cbac42ac2fc6f15a`.

## Blocking issue remains

Issue #44 tracks the missing November source:
`KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna.html` and `KillTheKing_G8_4_KaynakKod.zip`.
Their original bytes have not been located in the GitHub repository, current Project/Library files, accessible working directory or workflow artifacts. The November G8.4 game was generated in a prior conversation's transient sandbox and **was not committed** to GitHub. Do not claim it has been recovered.

The user may retrieve the original exports from the **16 Nov 2026 ChatGPT conversation's attachment links** or local Downloads and provide the actual files. Until that happens, avoid overwriting newer gameplay with October/A5 or G5.4.

The approved G8.5C development directions remain **revisable**; G8.5I changes only artifact provenance and does not touch game logic, weapon values, AI, FFA movement or production save data.
