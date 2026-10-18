# A6 — Offline settings and accessibility controls

**Branch:** `codex/a6-accessibility-settings`, stacked on A3/A7 + Archer V2 integration. **Code implemented**, but full Chrome/Edge UI playtest and FPS measurements pending.

## Added
- **Master effects volume (0–100%)**: the game's 14 existing procedural Web Audio output chains route through one `GainNode`. Volume is changed live. The synth still starts only from an explicit play interaction.
- **Mouse sensitivity (0.3–2.5×)**: existing sensitivity slider now restores the last validated setting.
- **Reduced camera shake**: option eliminates random hit/explosion shake and cuts weapon-impact camera rotation to 25%; gameplay controls and aim movement still use original mouse input.
- **Render quality**: Low / Medium / High cap Three.js internal pixel ratio at 1 / 1.5 / 2, respecting the device's native ratio. Original meshes, textures, lighting colors, collision and all maps stay unchanged.
- **Persistence**: validated JSON at `killtheking.settings.v1` in browser localStorage. Storage access is guarded; the offline HTML runs with defaults if file:// storage is unavailable or blocked. No remote upload, login or telemetry.
- **Performance**: volume/sensitivity slider input does not resize renderer unless the computed pixel ratio actually differs.

## Test checklist (not yet completed in browser)
1. Open latest standalone HTML in Chrome/Edge, set volume 0%/50%/100%, play sword, arrow, musket and hit sounds; muted means **every procedural effect** must be silent.
2. Test low/high motion during explosion, musket recoil and melee hits. Mouse sensitivity must not change unexpectedly with reduced motion.
3. Change Low/Medium/High, check visual pixel density and FPS with `window.krunkerPerformanceReport()`. No geometry/lighting redesign. Compare on same device.
4. Reload the HTML: settings persist when localStorage is allowed. Test blocked localStorage using browser restrictions and ensure menu/game still load with defaults.
5. 4-minute FFA and TDM sessions, 1-second bow recovery, 2-second minimum draw, 15 arrows/min, 4 musket shots/min, pause, replay, result JSON; ensure settings do not alter HP, collision or friendly fire.
6. Export JSON; check performance samples and team/individual scores, not settings secrets.

**Still pending:** second map theme and implementation, comprehensive audio voice budgeting, remaining accessibility polish, 30-minute soak tests, all stacked draft PR merges and a signed/verified release of main.
