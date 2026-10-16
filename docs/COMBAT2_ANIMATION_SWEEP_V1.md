# Combat 2.0 — Animation-time sword and spear collision (Phase 3)

## Changed
- **Sword** collision now follows a timed left/right virtual blade arc during the existing ~0.22s attack animation. **Spear** collision follows an extending/retracting virtual thrust.
- Each frame subdivides large time steps and traces both the current weapon line and the segment swept by its tip between samples.
- Every segment queries **world, living bots, and active barrels together** and honors the closest object. A nearer wall blocks farther targets.
- Once a swing registers a successful bot or barrel contact, it cannot deal second damage, including on later animation frames.
- Original knight and pikeman damage values, headshots, spear momentum formula, movement, graphics, existing quick dagger, muskets, arrows and free-for-all bot targeting remain unchanged.
- New pure `src/weapon-sweep.js` state module; pointer-lock loss or class change cancels any unfinished attack.
- Read-only developer status now indicates whether a swing is in progress.

## Automated evidence
- 9 new tests: first-frame delay, later-frame hits, repeat-hit prevention, wall-first ordering, spear extension, alternating slash directions, large-dt subdivision, barrel-only-first, and game integration.
- Updated the old instant-hit assertion to require the temporal swing.
- **79/79 local Node tests PASS**; syntax checks PASS.
- GitHub CI must pass before merge.

## Technical honesty
This uses **animation-synchronized proxy geometry** extending from the player's camera/eye pose, *not actual mesh-bone sword tip data*. Its multi-frame contact behavior is real and deterministic, but visual-perfect weapon animation alignment is not established. Precise rendered blade bone tracing and GPU-backed first-person/TPS playtesting remain further work.

## Next
- Playtest in Chrome/Edge with working WebGL, pointer lock, sound and 6-bot FFA.
- Verify contact on surs/ramp edges, during slide-hop and near barrels, tune blade arc against visual weapons.
- Measure CPU time/raycast counts, optimize if frame rate suffers.
- Continue defense animation and bot guard balancing under #11.
