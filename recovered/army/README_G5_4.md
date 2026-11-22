# Kill the King — Recovered G5.4 Army Battle (SAFE ARCHIVE)

**Status:** Archive reconstructed from the **textual backing** of an earlier Project file. This is an actual, substantial stand-alone HTML game source, **not** the missing G8.4 source. Original-byte equality with the initial G5.4 export has **not** been established.

- Title: **Kill the King — G5.4 Hareketli Savunma Hattı**
- File: `KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html`
- Text: **12,250 lines**, **1,257,893 characters**
- The source contains the `ArenaArmyBattle` battle engine, embedded graphics runtime, army/squad code and its own `window.onload`.
- Source recovered on 17 November 2026 using Project text retrieval. Preserved separately rather than overwriting the older GitHub FFA game or claiming to have the latest G8.4.

## How to retrieve the playable-file candidate
GitHub's `G5.4 army source recovery artifact` workflow uploads a ZIP containing **this HTML** plus `G5_4_Recovery_Manifest.json`, including SHA-256 checksum and inline-JS syntax checks. Download from the workflow's successful run. An HTML opening in Chrome/Edge does **not** constitute verified GPU playability.

## Hard boundaries
1. **The November G8.4/G8.5 game source is still missing.** This is an earlier G5.4 snapshot and must not be silently substituted.
2. **FFA and army AI remain separate.** No merge, no rewriting player physics, and no changes to the user's previously accepted combat rules.
3. The source was reconstituted from indexed text, not an authorized raw-byte download. Hashes describe the recovered artifact, not the original attachment.
4. Source syntax checks do not validate rendering, gameplay, 140+ soldier performance or the claimed 388 later-game tests.
5. No changes to `main` or previous draft PR #43.

## Next proof needed
Compare the G5.4 source with the missing G8.4/ZIP if available, then identify the actual army module/spawn/commander event hooks. Keep release and source provenance explicit.
