# A4 — Offline Team Deathmatch (TDM) integration

**Status:** Playable code integrated on this feature branch; GitHub regression/syntax/offline-build checks run. Real Chrome/Edge GPU playthrough and user acceptance **pending**.

## Mode rules
- **Default FFA preserved**: one player and six independent bots; all combatants may attack one another. No change to approved castle/character artwork, FPS/TPS movement, slide-hop, or weapon table.
- Main menu **SERBEST ARENA (FFA)** / **TAKIM SAVAŞI (4v3)**. Mode can only change in the main menu; play/pause/results lock the buttons.
- TDM uses existing seven characters: **BLUE = player + bots 0, 2, 4**; **RED = bots 1, 3, 5**. Explicit 4v3 compromise avoids secretly adding an eighth character before performance acceptance.
- **Friendly fire OFF**: all player→bot and bot→bot damage paths block same-team damage. Bot FFA target generation, retaliation, target locks and melee preparation check enemy identity. Friendly character meshes physically block AI ranged shots intended for enemies.
- **Respawns**: use the established navigation/solid-spawn selector, with preferred blue-left / red-right castle-side candidates and all living combatants as clearance obstacles, regardless of team. Falls back to existing pool if no side-specific candidate exists.
- **Scoring**: team score sums player kills + blue allied kills vs red bot kills; individual rank/kill/death/KD remains visible. On ties, result displays a draw, not an invented winner. Result screen and TAB overlay show both team totals.
- **Indicators**: blue/red character nameplates, minimap colored teammate/enemy dots, team score HUD, scoreboard name prefixes. Original 3D model appearance unchanged.
- **Replay**: stays in chosen mode; main menu allows changing back to FFA. The 2/4/8-minute options and existing pause/replay still apply.
- End-round **TEST RAPORU (JSON)** exports the mode and team result alongside the existing detailed FFA combat telemetry, under a mode-specific filename.

## Required user acceptance tests (not completed)
1. Chrome/Edge load: menu defaults to FFA; start FFA and confirm six bots target each other as before.
2. Return to menu; switch to TDM, use 2/4/8-minute windows (4 default), start, verify 4 blue vs 3 red and colored score.
3. Hit a blue teammate with sword, spear, full-draw bow, musket, dagger, shield bash and explosive barrels: no team health reduction or friendly kill credit.
4. Let red and blue bots fight; confirm 3 enemy bots can target player but 3 allies never do; no same-team targeting after respawn, navigation retries or attacks.
5. Run near ramps, battlements, gate and corners; confirm teams spawn on their respective side where walkable, no stacked fighters, flying through walls or unreachable combat positions.
6. Confirm friendly body can intercept enemy-bound AI ranged shot and all hit/cadence/world occlusion rules remain.
7. TAB: ranked 7-combatant list with 🔵/🔴 and team score. At 00:00 validate winning/tied team, team/individual scores, replay persistence, JSON export.
8. ESC/pointer unlock stops movement and game timer; resume without changing mode or team assignments; check offline standalone HTML in Chrome/Edge with no black screen/console errors.
9. Stress: multiple sequential TDM→FFA→TDM rounds, no stale targets, scores or health; GPU FPS/memory still unverified.

## Automated tests
- `tests/offline-tdm-mode.test.mjs` covers deterministic teams, FFA fallback, enemy-only targeting, damage policy, spawn pools, totals, ties and menu wiring.
- `tests/tdm-friendly-fire-runtime.test.mjs` executes the actual early damage gates and checks allied projectile interception, independent of UI.
- Existing collision, motion, weapon balance, multiplayer-free FFA, class/parry and offline bundle checks are retained.

**Cannot yet declare A4 user-accepted**: CI checks cannot replace actual 4-minute GPU/WebGL combat.
