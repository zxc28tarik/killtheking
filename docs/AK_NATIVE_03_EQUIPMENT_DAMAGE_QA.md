# AK-NATIVE-03 — Original-game castle map: genuine equipment damage and collision

Date: 2026-11-21. Scope: **the existing Krunker1600 / native G5.4 game**, NOT the earlier separate S3D1/FPS siege engine. The original game's FPS/TPS camera, movement, weapon behavior, menus, and the authentic G5.4 140 soldiers/8 squads remain the single gameplay authority. No change to main; no publisher deck until user requests it.

## Browser HTML produced in the chat

- Exact output: `KillTheKing_ANA_OYUN_KaleKusatmasi_Ekipman_Hasar_Carpisma.html`
- SHA-256: `a837761cdb70ee784ee92e974b300a03d7c4b0f426ac3ed198bfa523e5b8d955`
- Approx. 1.30 MB single offline HTML; baseline `KillTheKing_ANA_OYUN_KaleKusatmasi_Gecit_IcKale_Guncel.html` SHA-256 `61448448d2c31e148b601884c936a8cea5ad9021d05f8be12438bd1ebf13e6af`.
- All **28 earlier original HTML script elements were verified byte-identical**. Changes only in the new last siege-map integration script and title.
- The actual complete HTML is provided as a downloadable chat attachment. **The HTML is not uploaded into this GitHub branch by this docs commit**. Future integration must commit exact source HTML and script builder, checking this hash; do not claim that the documentation entry itself is the downloadable game code.

## Verified changes

1. Both existing siege machines now have explicit world-space equipment AABB colliders within the **same castle map** and original FPS collision/nav array: moving ram (4.0×3.1×6m) and stationary catapult (4.4×3.3×5.5m). Original native G5.4 soldiers also cannot cross a fresh machine obstacle. G5.4 world obstacle snapshots refresh when the ram moves 1.5m, preventing stale ghost collision.
2. The original 10-person **red native G5.4 musket squad** is deployed outside the castle south wall at the start of native play (no later teleport; no synthetic soldiers). A limited subset of its existing living musketeers may spend a **real original 15-second musket reload**, in place of shooting infantry, attempting to damage visible equipment. A real physical 3D equipment ray, original G5.4 castle/wall first-contact ray and real 140 soldier first-body interception decide the outcome. Attack may miss or be obstructed; it cannot hit equipment and soldiers with the same ammunition.
3. Equipment-only provisional balance: ram 340 HP / 32 damage per verified red musket hit; catapult 280 HP / 28 damage. **These are equipment values, NOT changed native G5.4 musket-vs-soldier damage**. Destroyed equipment stops operating, catapult cancels already-flying projectile, destroyed machinery shows a tilt/collapse. HUD exposes red defender shot/hit count, machine HP and state.
4. Ram's iron head must **physically reach** the real castle gate box before the 4.1s impact cycle can reduce gate HP. Original ram was stopped 1.6m short; corrected maximum movement location to z=-47.9, matching the rendered head's z+3.4m front edge at actual gate minZ=-44.5. Gate cannot take proximity-only ram damage before contact.
5. The newly added catapult physical body initially blocked the old blue archer command route. Fixed real blue native G5.4 archer squad's original-time deployment farther back, with 'hold' until ordered, and F8 position goal to (-22,-79). Both **F7 real pike crew** and **F8 real archer crew** now succeed in Chromium UI testing; F9 post-breach attack still succeeds.
6. Existing two-flank courtyard order, 15-second genuine living-soldier capture rule and original Arena / Meydan gameplay logic unchanged.

## Test results

- **13/13 native G5.4 extraction/VM logic tests PASS**: same 140 soldier/8 squads, closed-gate restriction, genuine breach removing collision, both flank routes, manual priority, timed capture, contested capture reset, real native musket equipment hit and cooldown, cover/invalid shooter, catapult destruction cancels projectile, iron-head contact before ram gate damage, original G5.4 script SHA.
- Chromium **logic/UI** PASS (software/no-WebGL mock solely for acceptance of controls and state): original main menu opens, castle map selection works, original 140 units, F7 & F8 commands accepted, actual red native musket damage on ram, tested gate breach + F9 flank orders, no page errors.
- Source-side checks: latest last script `node --check` PASS and 28/28 original scripts unchanged.
- **NOT tested:** real WebGL GPU rendering, long continuous 4–8 minute natural matches, or full win-state smoke with no test-injected gate breach. Treat this as prototype, not final release.

## Next development order (the user's intent)

- [ ] Integrate the exact AK-NATIVE-03 HTML into GitHub as a byte-verifiable, buildable source artifact rather than documentation only; no main merge without explicit approval.
- [ ] Hardware Chromium/WebGL acceptance and long natural siege battle: crew movement, true stone first contact, ram opening gate, two-wing native pathfinding, keep conquest.
- [ ] Rebalance defender forward musket posts, actual equipment collapse/collision and passability.
- [ ] Make siege tower an authentic climbable native-game item rather than the current **visual scaffold only**.
- [ ] Keep Arena and Meydan gameplay source exactly as approved; no parallel independent siege FPS.
- [ ] Pitch deck only after user explicitly says start.
