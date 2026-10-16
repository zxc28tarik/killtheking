# AI 2.0 — Class-specific combat tactics (phase 3)

## Behavior
- **Knight:** close aggressively and stop at striking distance. Keeps current damage, weapon and cooldown.
- **Pikeman:** advance to spear range but retreat or sidestep when crowded under 3.1 units; maintain standoff in the working range.
- **Archer:** retreat when rushed, hold at useful shooting range, or sample nearby walkable firing positions if a castle wall blocks the target.
- **Musketeer:** similar to archer but with a shorter preferred retreat threshold and firing distance.
- All decisions use the existing bot-vs-bot **free-for-all target chosen by `chooseArenaTarget`**; this does not force bots to attack the player.
- Movements use the already verified castle A* waypoints and `safeAdvance` to respect walls, crates and ramparts.
- Tactical decisions are cached for around 0.7–1.2 seconds per bot to avoid repeated sight-ray bursts each frame.
- When holding range, bots face the selected opponent. Exposes tactical mode in the developer arena snapshot.
- No visual style, damage values, attack timers, movement physics, class profiles, map geometry or player combat altered.

## Validation
- Local baseline 29 navigation/projectile tests plus 10 role-decision tests: **39/39 PASS**.
- GitHub regression suite includes one extra explicit game-integration test, expected **40 tests** total.
- JavaScript syntax checks pass locally.
- Requires GitHub Actions CI and browser test with GPU/pointer-lock before acceptance as visually verified.
- Known limitation: candidate firing spots are walkable and have clear sight, but an A* route may be unavailable for some spots. Ranged units retry a tactic when stuck; route-selection heuristics can be optimized next.
- This does not yet implement team tactics, prediction/leading of projectiles or real-player multiplayer.

## Next
Long-session six-bot GPU test; weapon-specific dodge timing, target cover scores, anti-jitter in crowd fights; then combat mechanics 2.0.
