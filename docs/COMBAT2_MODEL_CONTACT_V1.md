# Combat Mechanics 2.0 — phase 6: rendered-viewmodel-guided FPS contact

## What changed
- Added invisible `Object3D` **grip** anchors to the existing knight sword and pikeman spear viewmodel groups. Tip anchors were already present. No geometry or material changes.
- Every first-person attack frame, read the **actual world-space positions** of the sword/spear grip and tip *after* the existing animation, recoil, camera sway and bob transforms. Convert them to camera space.
- `ArenaModelWeaponContact.proxy` derives **horizontal attack bearing from tip vs grip** on swords and **thrust extension from the spear's rendered forward position**. The visible models are miniaturized UI viewmodels, not full-world weapon meshes, so these changes are calibrated to the **unchanged gameplay class range**, never exceeding it.
- `ArenaModelWeaponContact.advance` sweeps the model-guided combat endpoint between animation frames, checks the entire player-to-attack segment, respects nearest world/barrel/bot contact, and stops a swing after one successful contact.
- In third-person, the camera-attached viewmodel is hidden. Preserve the prior player-centered virtual sweep; do not use an invisible camera weapon positioned behind the avatar to award hits.
- Preserve original damage, classes, graphics, projectile behavior, bot defenses and bot-vs-bot free-for-all target selection.

## Evidence / tests
- 8 new Node tests: real Three.js marker transforms, sword direction changes with rendered tilt, spear thrust reach, active window, single hit, wall precedence, fast inter-frame motion, invalid geometry, and FPS/TPS game integration.
- Baseline 92 + new 8 = **100 Node regression tests**; locally 100/100 passing.
- Syntax checked for game and new pure module. GitHub CI must pass before merge.

## Limitations
- This is **rendered-model-guided contact direction and timing**, not pixel-exact physical mesh triangle collision. The first-person weapon model is scaled for the HUD; the contact endpoint is normalized to the established world attack range. A sword whose mesh visibly spans ~1 unit should still be able to hit according to its original game reach.
- The exact first-person blade motion versus impact location needs a **GPU-enabled visual playtest**. Third-person remains on the previous stable sweep until TPS character geometry and the weapon can be calibrated separately.
- This does not certify pointer-lock operation, FPS/GC behavior or animation matching across all cameras. These are still open in issue #11.

## Next
Run 10+ minutes of WebGL desktop play, view one full sword combo/spear charge with `krunkerArenaStatus()` diagnostics, and adjust model-to-world calibration if a visual mismatch is observed.
