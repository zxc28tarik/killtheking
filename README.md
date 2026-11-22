# Kill the King — Krunker 1600

**Kill the King** is the GitHub development home of the recovered **Krunker 1600: Kuşatma** browser FPS arena project. The latest accepted gameplay baseline is **Serbest Arena v1** with the original stylized graphics (not the discarded replacement art), four combat classes, six fighting bots, bot-vs-bot free-for-all behavior and improved impact feedback.

## 22 November 2026 — Canonical ONE original FPS with THREE battle maps (DRAFT)

**Important correction:** Older three-mode iframe HTML (FFA + Army + separate S3D1 Siege) is **an archive**, NOT the current canonical gameplay candidate. It gave the siege a different engine, camera and graphics and contradicted the approved requirement.

**Current original-game basis:** Native AK09 (recovered/native-siege/KillTheKing_AK_NATIVE_09_original_game_siege_map.html) already contains **Arena/TDM, 140-soldier Meadow Army and 140-soldier Castle Siege** within the SAME original Three.js/FPS renderer, camera, weapons, G5.4 army and controls. The 22 November canonical builder transfers only Meadow V18 cosmetics (grass, surface, horizon and lighting) onto that native game, without altering the first 28 original scripts.

**[Canonical ONE native FPS / THREE maps — GitHub CI artifact (DEVELOPMENT)](https://github.com/zxc28tarik/killtheking/actions/runs/45035743238/artifacts/14759696307)**. Unzip, open the HTML directly in Chrome/Edge. Builder: recovered/native-siege/build_canonical_three_maps.mjs. Manifest includes HTML SHA-256, original AK09 SHA-256 and game identity. This is **one game document, no iframe, no separate S3D1 gameplay engine**.

**Current test status:** native AK06–AK09 regression + new canonical build/source tests PASS in GitHub CI. Original 28 scripts are byte-identical, all 29 embedded scripts parse. A fully manual real Windows GPU / 4–8 minute three-map acceptance of this new exact HTML remains OPEN. Do not call it published or publisher-ready until those gates pass.

[Canonical integration and main-merge roadmap](docs/CANONICAL_MAIN_THREE_MAP_UNIFICATION_TR.md) · [Draft PR #51 to main](https://github.com/zxc28tarik/killtheking/pull/51) · [22 November successful canonical CI](https://github.com/zxc28tarik/killtheking/actions/runs/45035743238). The October main stays unchanged pending verified rollout.

### Historical, NOT canonical: standalone S3D1 launcher

The old [three-iframe S3D1 bundle](https://github.com/zxc28tarik/killtheking/actions/runs/44524696649/artifacts/14528493467) is retained for regression/history. Its Siege is a separate engine and **must not be sent as the latest normal Kill the King game**.

## Play locally
1. Download the repository as ZIP and extract it.
2. Open `index.html` in Chrome or Edge on a computer with WebGL enabled.
3. Choose one of four classes and click **KUŞATMAYA GİR (BAŞLA)**; the game uses mouse pointer lock.
4. WASD movement, space jumping, Shift/C sliding, mouse combat, F/V quick ability.

The Three.js r128 engine and game CSS/JavaScript are committed locally. Chakra Petch uses a remote Google Fonts stylesheet when available and a fallback when offline. No font binary files are in this repository.

## Development structure
- `index.html` — game entrypoint
- `src/oyun.js` — preserved core gameplay plus subsequent fixes
- `styles/game.css` — original style, compiled utility CSS and impact CSS combined
- `vendor/three-r128.js` — original version of Three.js (MIT)
- `tests/` — Node regression checks
- `.github/workflows/ci.yml` — GitHub Actions checks
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
