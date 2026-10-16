# Development log — Kill the King

## Baseline: Serbest Arena v1 (2026-10-16)
- Imported from recovered, playable HTML provided in the previous conversation. Earlier Gemini versions are not established as recovered.
- Preserved the **pre-art-experiment** visual style, four classes, impact feedback, six independent bots, bot-vs-bot combat, the castle map and movement mechanics.
- Saved `src/oyun.js`, `index.html`, original Three.js r128 and merged game CSS; system-font fallback and Google-hosted Chakra Petch replace embedded font binaries.
- External audio/model images are not required by the game source; audiovisual effects are generated in code.

## First combat foundation fix
- Added ray-to-world occlusion check for hitscan gunfire, sword/spear ray hits, melee fallback, shield bash, quick melee and explosive barrels.
- Both AI ranged and melee attacks require line of sight before applying damage.
- No weapon damage amounts, core movement rules, bot target selection, classes or graphic geometry changed.
- Added Node automated tests and GitHub Actions checks.

## Test evidence
- Local `node --check` on patched gameplay passed.
- Existing six-bot mocked arena and autonomous battle tests passed locally.
- Four new source/regression tests passed locally.
- **Not yet tested:** Real GPU WebGL combat, pointer lock, audio behavior, long-session stability, frame-time performance.

## Next
1. Physics-independent swept-arrow collision ordering (stop thin-wall tunneling).
2. Shared damage validation, safe spawn locations and bot pathfinding/obstacle steering.
3. Real Chrome/Edge smoke test and CI run confirmation.
