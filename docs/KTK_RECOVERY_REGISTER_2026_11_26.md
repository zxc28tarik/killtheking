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
- [x] Compare FIT04a against merged FIT04; resolve actual missing changes.
- [x] Verify/split latest candidate and automated acceptance gates for safe subset (manual gates remain).
- [ ] Code-level equivalence review of all historical queue items.
- [x] Verified main integration and canonical HTML equality for safe subset.
- [ ] Confirm all historical closure dispositions and remaining exceptions; current metadata below.

## REC02 implementation checkpoint
- Unified recovery candidate PR #89, head c1d5d66245996b99718f1a734a34f83fa9439d4f; based on GR01 snapshot.
- Compared #82/#83 against #84 and actual GR01 HTML. Hidden cloud guard, far barrel projection guard and reused vector already present; restored missing unchanged CSS guards and sky gradient reuse/disposal. No palette or bot decision edits introduced by REC02.
- Both HTML copies share blob 276adad30df733d1ed3428e0e17656d70faab8a4. Added real browser gradient assertions; execution not yet confirmed.
- #89 draft; mergeability initially false (may be pending computation). Do not merge until CI, conflict status, manual visual checks, and preexisting AK33–36 bot changes reviewed. #82/#83 remain open until equivalence and acceptance established. REC03–05 incomplete.

## REC06–08 main integration checkpoint (2026-11-26)
- #91 merged into main at 4b8237d47803acb701b25082c91399d5604aa38f; exact tested head 4562aa243ce199169be73dc951cfcb8862ec74a4. 202/202 Node tests, zero failures, and UI32 real Chromium three-map starts PASS (runs 45735999772, 45735999840). Both main HTML paths verified identical blob 7630f8ee8a2d5f54745f111c3b0d307e8546760c, SHA256 43ffe9e681f52c25f51cb016f21376044daf5d73a14cde34537be5a744312ccc. 30 of 31 scripts unchanged; only visual/perf hunks in script 28, no new bot behavior. This is development main integration, not final hardware or visual release acceptance.
- REC08: closed as superseded (NOT literal merge) #82, #83, #87, #88, #28, #29, #38, #40, #41, #42; individual comments cite replacement and limitations. No branch deleted. #83 exact squared-distance micro-optimization not copied; equivalent far-label skip already exists. Old features not claimed exhaustively equivalent.
- Still OPEN, explicitly tracked: #30–37 and #39 (old combat/AI/animation/performance contracts; current behavior preserved; unresolved exhaustive equivalence), #43 isolated QA (0/144 actual trials), #86 and #89 (coupled AK31–36 siege/AI/elevation package). Full candidate #89 exact CI-green head be52ae9980a48505b8aee69f15a3e7e2b3fa6aab, 223/223 tests; preserved, not merged, due to AI freeze and separate siege acceptance. Do not blindly merge after main moved.
- REC06: automated acceptance completed; real hardware sustained FPS/1% lows, manual WG/GR visual acceptance and full siege battle acceptance remain open. REC07: main game integration and canonical sync complete for safe subset. REC08: ten superseded PRs archived; unresolved PRs intentionally remain open; no ref deletion. See main docs/KTK_REC04_LEGACY_RECONCILIATION_TR.md for detailed old PR dispositions.

## REC08 final integration and reconciliation checkpoint
- PR #92 merged into main at e73eb9b2d87931057e012c3e89fc100fe88cb96b from tested head 69f922480e20a324c02d11026128e59d31df7a22; head was 5 commits ahead, 0 behind before merge.
- All three head workflows succeeded: Browser game checks (45806555428: regression tests, inline syntax, canonical artifact equality); UI32 full-screen menu acceptance (45806555500: real Chromium map/class/start/menu checks including AK31 registration); historical native baseline (45806555474: single engine source/build and Chromium software-WebGL with three maps and 70v70 siege).
- Main index.html and playable AK30 HTML independently verified at identical blob ad24dbde04012cc8d90b0cca0b4bb8fb560d71ab.
- AK31 is integrated: 34 physical blocks, 16 wall posts, two three-sided guardrooms; original assault corridors tested, existing native colliders and world raycast registrations reused. No army logic changes, no new actors or lights. Manual full-match siege and actual GPU benchmark remain unverified.
- Fresh PR metadata audit: #28–42, #82–83, #86–88 are closed; #85, #90–92 merged. Earlier checkpoint's statement that #30–37/#39/#86 were open is now stale. Closure of historical PRs does not itself establish full gameplay equivalence; original refs preserved.
- Remaining active recovery exceptions: #89 draft preserves AK32–36. AK32 ramps/elevated player access depends on AK34 authoritative vertical hit/body/projectile handling; AK33 ground garrison, AK35 wall deployment and AK36 target selection modify AI. Do not import the coupled package under the existing AI freeze, or merge diverged #89 over current main. #43 remains isolated QA with missing production source / 0 of 144 paired trials; not a playable missing feature.
- Safe verified development integration of REC02–08 complete. No unresolved safe change is known in the audited queue, but manual visual/hardware acceptance, exhaustive historical behavior equivalence, AK32–36 separation/authorization, and #43 production trials are not complete. No refs removed. Do not treat this checkpoint as final release certification.
