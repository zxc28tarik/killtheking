# KTK-RECOVERY — active integration register
Date: 2026-11-26. New feature work suspended pending recovery. This register supersedes stale status in the October development plan, not approved gameplay rules.

## Immutable-by-policy recovery anchors (do not move/delete)
- main snapshot: recovery/snapshot-2026-11-26-main @ 05b42002c664e41bc4714abb6987fb8c22203e02
- latest candidate snapshot: recovery/snapshot-2026-11-26-gr01 @ 9f9e910eecaeeb26c4fa6ae8c64e2761d8858a7b
- Preserve all original refs and PRs until equivalence verified. These are Git refs, not external backups.

## Current recovery queue
| PR | Scope | Status / next gate |
|---|---|---|
| #86 | AK31–36 + WG01–02 | Draft; latest recorded automated browser checks passed. Separate visual-only changes from bot behavior; do not introduce unapproved AI changes. Verify current candidate and manual siege acceptance. |
| #87 | OPT01–02 | Depends on #86; Node/browser checks recorded success, real device frame-time/FPS not measured. |
| #88 | GR01 | Depends on #87; source tests pass, visual/performance acceptance missing. |
| #82 | atmosphere texture reuse | Browser acceptance timed out; reproduce and diagnose before integration. |
| #83 | hidden visual work | CI passed but conflict with main; compare with merged #84 to avoid duplicating work. |
| #43 | G8.5 QA | Isolated tooling, not production integration; source and 144 paired trials outstanding. |
| #28 | scoreboard/durations | Compare live native behavior; old source branch must not overwrite main. |
| #29 | match telemetry | Compare current export and counters. |
| #30 | AI stall recovery | Audit only; AI changes frozen. |
| #31 | turn animation | Compare live rig without modifying decisions. |
| #32 | AI combat | Audit only; AI changes frozen. |
| #33 | weapon balance | Compare current approved balance; no unapproved changes. |
| #34 | ranged validation | Compare live hit paths; AI frozen. |
| #35 | 3D hit regions | Compare live hit paths and animation. |
| #36 | TDM | Compare current team mode and friendly-fire rules. |
| #37 | animation/performance | Compare live metrics and render-only changes. |
| #38 | bow timing | Compare current charge and recovery. |
| #39 | combined archer/animation | Deduplicate #37/#38. |
| #40 | settings | Compare live controls, persistence, audio and quality. |
| #41 | old meadow | Superseded map candidate; compare only reusable fixes. |
| #42 | old expanded meadow | Superseded map candidate; compare only reusable fixes. |

Merged #76–81, #84–85 are not missing merely because branch refs remain. UI28 #69 was rejected; do not resurrect. Historical PRs may have equivalent code in current native HTML despite differing commit ancestry.

## Mandatory workflow
1. Inventory exact base/head and preserve refs; never force-push/delete during recovery.
2. Compare actual native inline runtime and offline artifact, not only historical src modules.
3. For each queued item record disposition: present / missing / superseded / blocked / integrated, evidence and exact next action.
4. Use one recovery candidate; no new feature chain on unaccepted branches. Separate independent safe changes if possible.
5. Automated tests and Chromium acceptance, then hardware/visual acceptance where applicable. Never claim measured FPS without measurements.
6. Only merge verified code into main; verify root/offline HTML blob equality and export from recorded commit.
7. Keep this register current before ending every development session. Do not close old PRs until disposition and evidence are recorded.
8. Preserve approved full-screen menu, graphics, lighting/color, three maps and all gameplay rules. Bot intelligence/behavior remains frozen until user explicitly authorizes changes.

## Current completion
- [x] Initial 82-ref / 21-open-PR audit (2026-11-26).
- [x] Main and latest candidate recovery anchors created.
- [ ] Compare FIT04a against merged FIT04; resolve actual missing changes.
- [ ] Verify/split latest candidate and acceptance gates.
- [ ] Code-level equivalence review of all historical queue items.
- [ ] Verified main integration and canonical HTML export.
- [ ] Close only resolved PRs.

## REC02 implementation checkpoint
- Unified recovery candidate PR #89, head c1d5d66245996b99718f1a734a34f83fa9439d4f; based on GR01 snapshot.
- Compared #82/#83 against #84 and actual GR01 HTML. Hidden cloud guard, far barrel projection guard and reused vector already present; restored missing unchanged CSS guards and sky gradient reuse/disposal. No palette or bot decision edits introduced by REC02.
- Both HTML copies share blob 276adad30df733d1ed3428e0e17656d70faab8a4. Added real browser gradient assertions; execution not yet confirmed.
- #89 draft; mergeability initially false (may be pending computation). Do not merge until CI, conflict status, manual visual checks, and preexisting AK33–36 bot changes reviewed. #82/#83 remain open until equivalence and acceptance established. REC03–05 incomplete.
