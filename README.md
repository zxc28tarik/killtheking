# Kill the King — Krunker 1600

**Kill the King** is a native single-engine historical browser FPS prototype with original fast Arena/TDM movement, genuine 140-soldier G5.4 Meadow Army combat and a third, same-engine Castle Siege map. The October Serbest Arena source is preserved in recovered/legacy/; the canonical three-map build is the default development game, not a production release.

## 22 November 2026 — Canonical ONE original FPS with THREE battle maps (development baseline)

**Important correction:** Older three-mode iframe HTML (FFA + Army + separate S3D1 Siege) is **an archive**, NOT the current canonical gameplay candidate. It gave the siege a different engine, camera and graphics and contradicted the approved requirement.

**Current original-game basis:** Native AK09 (recovered/native-siege/KillTheKing_AK_NATIVE_09_original_game_siege_map.html) already contains **Arena/TDM, 140-soldier Meadow Army and 140-soldier Castle Siege** within the SAME original Three.js/FPS renderer, camera, weapons, G5.4 army and controls. The 22 November canonical builder transfers only Meadow V18 cosmetics (grass, surface, horizon and lighting) onto that native game, without altering the first 28 original scripts.

**[Canonical ONE native FPS / THREE maps — GitHub CI artifact (DEVELOPMENT)](https://github.com/zxc28tarik/killtheking/actions/runs/45036335268/artifacts/14760235309)**. Unzip, open the HTML directly in Chrome/Edge. Builder: recovered/native-siege/build_canonical_three_maps.mjs. Manifest includes HTML SHA-256, original AK09 SHA-256 and game identity. This is **one game document, no iframe, no separate S3D1 gameplay engine**.

**Current test status:** native AK06–AK09 regression + new canonical build/source tests PASS in GitHub CI. Original 28 scripts are byte-identical, all 29 embedded scripts parse. A fully manual real Windows GPU / 4–8 minute three-map acceptance of this new exact HTML remains OPEN. Do not call it published or publisher-ready until those gates pass.

[Canonical integration and follow-up roadmap](docs/CANONICAL_MAIN_THREE_MAP_UNIFICATION_TR.md) · [PR #51 MERGED into main on 22 November](https://github.com/zxc28tarik/killtheking/pull/51) · [canonical native three-map Chromium/WebGL PASS](https://github.com/zxc28tarik/killtheking/actions/runs/45036335268). The default main/index.html now serves the verified native three-map development build. Windows hardware and full gameplay acceptance remain open.

### Historical, NOT canonical: standalone S3D1 launcher

The old [three-iframe S3D1 bundle](https://github.com/zxc28tarik/killtheking/actions/runs/44524696649/artifacts/14528493467) is retained for regression/history. Its Siege is a separate engine and **must not be sent as the latest normal Kill the King game**.

## Play the current canonical game
1. Open **index.html** at the root of the repository in Chrome or Edge, or use GitHub Pages when enabled. It is the same exact native game as the CI-built downloadable HTML and is fully self-contained (offline play).
2. Pick original Arena/TDM, 140-soldier Meadow Army or 140-soldier Castle Siege **in the same game menu**, and click **OYUNA GİR (BAŞLA)**.
3. The original camera, classes, WASD/slide-hop and combat are shared. The siege map offers 140 G5.4 actors, siege equipment commands F6–F9, and F10 to expand/collapse the command HUD.
4. The old October Arena can still be compiled explicitly with `python3 tools/build_offline.py --legacy --out dist/Oct_Archive.html`; its historic source is stored in `recovered/legacy/`.

Current/default offline build: `python3 tools/build_offline.py --out dist/KillTheKing_Oyna.html`, with resulting file identical to **index.html**. To verify the source-to-root match run `node tools/sync_canonical_entrypoint.mjs --check`. The normal CI workflow enforces this check.

**Acceptance limit:** Chromium software-WebGL three-map smoke and original-source regression tests passed. Real Windows graphics hardware and human-operated long battles are not yet accepted as production-ready.

## Development structure
- `index.html` — **canonical complete offline FPS / three maps**, generated deterministically from native AK09 plus Meadow visual upgrades
- `recovered/native-siege/build_canonical_three_maps.mjs` — source of truth for the current game bundle; original 28 combat scripts unchanged
- `src/oyun.js` — archived modular October core (legacy source and unit tests)
- `styles/game.css` — original style, compiled utility CSS and impact CSS combined
- `vendor/three-r128.js` — original version of Three.js (MIT)
- `tests/` — Node regression checks
- `.github/workflows/ci.yml` — regression + exact index/release identity check
- `.github/workflows/canonical_three_maps.yml` — native 140 soldiers, one-engine source and actual Chromium software-WebGL 3-map acceptance
- `docs/ROADMAP.md` — comprehensive prioritized plan
- `docs/ACTIVE_DEVELOPMENT_PLAN.md` — **current checked-off P1–P2 action plan**, priorities, dependencies and acceptance gates
- `docs/DEVLOG.md` — verified changes, evidence and limitations

## First delivered milestone: Combat Foundation v2 (partial)
- Prevent player melee, shots, shield bash and explosive-barrel strikes from damaging through walls.
- Bot melee attacks now require line-of-sight as bot ranged attacks already did.
- Preserve bot-vs-bot kill tracking and avoid player kill-count contamination.
- Node source syntax and four regression tests passed in GitHub Actions for PR #1.

### Test limits
GitHub Actions checks source correctness and mocked combat helpers. It does **not** prove end-to-end rendering. The headless test environment blocks creation of a WebGL context; an actual GPU-enabled browser test is still required. The re-extracted gameplay source has not been established as byte-identical to the archived ZIP game script.

**Next:** swept-arrow collision ordering, safe respawn locations, bot obstacle/navigation work, then combat animation balancing.

## Visual design rule
Do **not** replace the accepted Krunker-like graphics with detailed/reworked 3D artwork without the user's approval. Do not delete previous recoveries or silently invent missing Gemini-version content.
