# Kill the King — Krunker 1600

This repository contains the recovered **Krunker 1600** browser game and its continued development under the working project name **Kill the King**.

## Design boundaries
- **Keep the original stylized 3D graphics.** A later replacement graphics experiment was explicitly rejected.
- Preserve the existing melee-impact improvements and free-for-all **bot-vs-bot arena**.
- Four combat classes: knight, pikeman, archer, musketeer.
- Do not silently invent or claim restored Gemini versions; recovered files have their own provenance.
- Always ship tested code and maintain playable HTML builds.

## Delivery sequence
1. Baseline preservation, build and automated smoke tests.
2. Unified hit/damage validation, world occlusion and respawn correctness.
3. Bot navigation, line-of-sight, threat selection and combat tuning.
4. Distinct weapon combat, animation/audio synchronization and balancing.
5. Complete matches, modes, maps, UI, performance and packaging.

Implementation lives on feature branches until checked, with notes under `docs/`. Original recovery history remains separate from new features.
