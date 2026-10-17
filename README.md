# Kill the King — Krunker 1600

**Kill the King** is the GitHub development home of the recovered **Krunker 1600: Kuşatma** browser FPS arena project. The latest accepted gameplay baseline is **Serbest Arena v1** with the original stylized graphics (not the discarded replacement art), four combat classes, six fighting bots, bot-vs-bot free-for-all behavior and improved impact feedback.

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
