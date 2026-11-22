# Kill the King — G5.4 original army-engine interface map (source-confirmed)

Date: 17 November 2026. Scope: **recovered G5.4 Hareketli Savunma Hattı**, not unrecovered G8.4. This is an inventory of real executable source, not an inference from G8 QA reports.

## Source evidence

- Monolithic HTML: `recovered/army/KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html`; 12,250 lines; recovered from earlier Project text, **not** proven byte-identical to original attachment.
- Original inline JS (`<script>`): `ArenaWeaponBalance` from HTML lines **2379–~2490**, `ArenaArmyBattle` from lines **2973–5730**.
- The two JS modules are **extracted verbatim**, not rewritten: `modules/weapon-balance.js` (5,208 characters) and `modules/arena-army-battle.js` (148,663 characters). CI asserts exact embedded-script equality.
- Original HTML contains 29 inline JavaScript blocks, all passed syntax checking in the prior GitHub recovery build. These new **33 contract tests execute the actual army engine**, not mocks, and cover commands, real squad creation, AI ticks, snapshots and source equality. They do not certify graphical play.

## Module contracts and integration points

| Source location | API / feature | Evidence and rules |
| --- | --- | --- |
| HTML 2382–~2490 | `ArenaWeaponBalance`, `RULES`, `SHOT_INTERVAL`, bow timing | Shared player/bot weapon balance: sword 20, spear 35, dagger 10, musket torso 90; bow 15 shots/min with 2 s minimum draw and 1 s recovery |
| HTML 2983–3017 | `TYPES`, `FORMATIONS`, `ORDERS`, `FIRE_MODES`, `DEPLOYMENTS` | 4 troop roles; 6 formations; 8 player orders; 3 ranged fire modes; 8 squad definitions (2 × 4) |
| HTML 3264–3348 | `create(seed, playerType)` | One blue player-led squad; 7 AI squads; exactly 140 soldiers, 70 per side; four per-team types 10/25/15/20; deterministic individual traits |
| HTML 3349–~3585 | `issueOrder`, `setFormation`, `setDestination`, `appendWaypoint`, `setFacing`, `setSpacing`, `setFrontage`, `setDepthScale`, `setFireMode` | Default `onlyPlayer=true` rejects direct player commands to AI-led squads; waypoint route planner handles obstacles |
| HTML 3116–3130 | `setWorldObstacles(state,boxes)` | Important format: **`{x,y,z,w,h,d,solid:true}`**, with all numbers finite. Internal AABBs are derived; directly passing AABB fields silently produces an empty obstacle list |
| HTML 3590–~4660 | team plans, AI operations, communications, withdrawals, defense and screening | Per-team coordination and role-sensitive AI, without issuing commands to the player squad |
| HTML 4912–~5600 | soldier local tactics, defence, attack, cohesion and projectiles | Bounded individual maneuver states inside squad constraints; friendly firing lines respect allies; weapon damage and projectile checks |
| HTML 5630–5634 | `step(state,dt)` | Fixed simulation substep `0.08s`, accumulator capped at `0.35s`, no update when match already won |
| HTML 5635–~5715 | `snapshot(state)` | Score counts, winner, 8 squad records, morale, cohesion, command status, tactics, team communications, defense/history |
| HTML 5716–5729 | `ArenaArmyBattle` exports | 72 exported entries from actual module; suitable explicit integration surface |
| HTML 5740–~? | `ArenaArmyRender` | Army visual uses original character bot meshes with instancing; render integration is separate from combat simulation |
| HTML 9948–~10340 | Army HUD + tactical map | Player command buttons, zoomed map, waypoint/target/facing UI, 8-squad status |
| HTML 10477–10501 | `startGame` army-mode initialization | Creates `ArenaArmyBattle.create(1600, selectedType)`, registers original meadow obstacles, hides FFA bot meshes, positions player at own squad |
| HTML 10523–10553 | `showMatchResults` | Uses `ArenaArmyBattle.snapshot(state)` and presents army winner, alive counts and squad kills |
| HTML 12095–12156 | `updateGame` field battle branch | Per-frame player position/health to army engine; `step`, drains soldier combat events and player hits, updates render/HUD, then match timer/winner |

## Verified QA (real engine source)

`node --test recovered/army/test_g5_4_army_contract.mjs`

**33/33** tests passed locally. Cases include exact 140-soldier composition, distinct human squad for every class, human-command restrictions, six formations, three firing modes, live obstacle geometry, selected destination/waypoints/rotation, deterministic replays, actual AI ticks, fixed physics cadence and source/module byte equality.

**No** WebGL GPU frame, 280-soldier battle, G8.4 strategic scoring, 144 mirror battles, long soak or actual downloaded game user test was executed by this suite.

## Three source-of-truth boundaries

1. Ekim A5 FFA/TDM branch remains separate from the recovered G5.4 standalone army HTML. Never merge by overwriting `src/oyun.js` or moving player physics blindly.
2. G5.4 contains **only the 140-soldier scenario** as its verified creation contract; this does not prove the 200/280 or supply objectives described in later G7/G8 conversations.
3. G8.5C–I QA tools are separate and accept production-style telemetry events, which this G5.4 engine does **not** natively publish. A later integration must attach real events to `create`, `step`, commands, hit drains and `snapshot` rather than merely setting a `production_game` label.

## Next non-destructive step

On this recovery branch, implement a side-effect-free bridge that observes **real** G5.4 `create`, `step`, `snapshot` and command operations, attaches bounded performance/event telemetry, and proves no changes to AI, troop movement or combat. Test it against these 33 source-contract tests, keeping G8.4 release claims blocked until its actual source is recovered.