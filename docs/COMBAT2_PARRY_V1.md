# Combat Mechanics 2.0 — Phase 1: Directional Guard and Timed Parry

## Implemented
- Knight right-click shield now covers **140° in front** of the player (70° on either side). Side/rear hits are unblocked.
- Holding the shield in the correct direction retains the existing **75% damage reduction** (25% incoming).
- A **240 ms perfect parry window** opens only on a fresh shield raise, with **1.15 second parry cooldown** to prevent click-spamming. Parry cancels melee damage but cannot cancel musket/arrow fire.
- Successful parry briefly staggers the attacking bot (**0.72 seconds**) and interrupts its attack, with audible feedback and a HUD popup. It grants no free kill, damage, healing or score.
- Knight and pikeman bots now telegraph melee attacks with a **0.36 second wind-up** and raised attack arm. If the target leaves range or line of sight before the strike, it is canceled.
- Parry/guard counters and combat controls are per-player; other three classes retain their current controls and attacks. Bot-vs-bot FFA opponents are not changed.
- On bot death/respawn, wind-up and stagger timers are reset to avoid stale attacks.

## Validation
- Added pure standalone module `src/combat-defense.js` with no Three.js or browser dependency.
- Ten new targeted tests cover forward/side/rear, shield orientation, normal blocking, timed melee-only parry, input/cooldown integration, stagger and telegraphed attacks.
- Local build tested with `node --check` and `node --test tests/*.test.mjs`, **56/56 passing**.
- GitHub Actions on the feature PR must pass before merging.

## Controls
- Knight: **hold right mouse** for directional block.
- On the **initial press**, the first 0.24 s is a parry window against a *front-facing melee strike*. A successful parry stuns the attacker.
- After the window, continuing to hold right mouse is still a normal forward block.
- 1.15 s parry cooldown applies across consecutive shield raises; shield block itself remains available.

## Limits / next
- Actual GPU WebGL, pointer-lock, sound timing, animation quality and long-session bot fighting require a real desktop browser playthrough; mocked / CI tests alone are not visual proof.
- Bot-versus-bot shield defense and weapon-to-weapon swept melee contact are planned later, not claimed finished.
- The current code continues to use the existing simple melee weapon hit detection. This phase changes **defense and attack readability**, not hitboxes or damage for other classes.
