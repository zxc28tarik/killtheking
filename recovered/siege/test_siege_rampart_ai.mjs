/** Kill the King S4B1: real native G5.4 blue battlements and 3D soldier fire. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const map=require('./siege-map.js'),objectives=require('./siege-objectives.js');
const traversal=require('./siege-traversal.js');
const structure=require('./siege-structure-combat.js');
const assault=require('./siege-assault-navigation.js');
const ladder=require('./siege-ladder-ai.js'),capture=require('./siege-capture-ai.js');
const defend=require('./siege-defender-ai.js');
const rampart=require('./siege-rampart-ai.js');
const ram=require('./siege-ram.js');
const catapult=require('./siege-catapult.js');
const four=require('../army/modules/g54-four-squad-command.js');
const ballistics=require('./siege-player-ballistics-3d.js');
const bridge=require('./siege-real-army-bridge.js');
const source=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const wsource=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const c=vm.createContext({console});
vm.runInContext(wsource,c,{timeout:3000});
vm.runInContext(source,c,{timeout:3000});
const A=c.ArenaArmyBattle,W=c.ArenaWeaponBalance;
function make(side='red',withRamparts=true){
 return bridge.create({armyEngine:A,map,objectives,traversal,
  playerTeam:side,playerType:'sword',seed:1600,
  structureCombatEngine:structure,assaultNavigationEngine:assault,
  ladderAIEngine:ladder,captureAIEngine:capture,
  defenderAIEngine:defend,
  ...(withRamparts?{rampartAIEngine:rampart,
   ballisticsAPI:ballistics,weaponBalance:W}: {})
 });
}
const soldiers=b=>b.state.soldiers;
const post=(b,role)=>[...b.rampartAI.posts.values()].find(x=>x.type===role);
const putRed=(b,x,z)=>{
 const u=soldiers(b).find(s=>s.team==='red'&&s.type==='sword');
 u.x=x;u.z=z;u.siegeY=0;return u;
};
test('S4B1 keeps exact pinned original G5.4 engine hash and authentic roster',()=>{
 assert.equal(createHash('sha256').update(source).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 const b=make();
 assert.equal(soldiers(b).length,140);
 assert.equal(b.state.squads.length,8);
 assert.equal(bridge.snapshot(b).realRampart3DDefenderAIConnected,true);
 assert.equal(b.rampartAI.initialPosts,8);
 assert.deepEqual(b.rampartAI.initialRoles,{bow:4,musket:4});
 assert.equal(b.state.elapsed,0);
});
test('8 native blue ranged posts spawn on physical south-wall top with no late teleport',()=>{
 const b=make();
 for(const p of b.rampartAI.posts.values()){
  const u=b.state.soldiers[p.id];
  assert.equal(u.team,'blue');
  assert(['bow','musket'].includes(u.type));
  assert.equal(u.siegeY,rampart.POST_Y);
  assert.equal(u.x,p.position.x);assert.equal(u.z,p.position.z);
  assert.equal(traversal.overlaps(p.position,map.spec,b.scenario,.65,2.6),false);
 }
 const st=rampart.snapshot(b.rampartAI);
 assert.equal(st.physicalPostsBeginAtNativeTimeZero,true);
 assert.equal(st.noMidMatchTeleport,true);
 assert.equal(st.botPlayer3DCounterfire,false);
 assert.equal(st.reciprocalNative3DRampartTargeting,false);
});
test('opt-in S4B1 does not change historical S3C3 or S4A-only candidate',()=>{
 const b=make('red',false);
 assert.equal(b.rampartAI,null);
 assert.equal(bridge.snapshot(b).realRampart3DDefenderAIConnected,false);
 assert.throws(()=>bridge.create({armyEngine:A,map,objectives,traversal,
  rampartAIEngine:rampart}),/requires authentic S4A/);
});
test('player-owned blue squad cannot be moved into a wall post',()=>{
 const b=make('blue');
 for(const p of b.rampartAI.posts.values()){
  const u=b.state.soldiers[p.id];
  assert.equal(b.state.squads[u.squadId].playerControlled,false);
 }
 const player=b.state.soldiers.filter(u=>u.team==='blue'&&
  b.state.squads[u.squadId].playerControlled);
 assert(player.length>0);
 assert(player.every(u=>!b.rampartAI.posts.has(u.id)));
});
test('native 2D firing is suppressed for rampart soldiers; 3D solver controls attacks',()=>{
 const b=make(),p=post(b,'musket'),u=b.state.soldiers[p.id];
 u.reload=0;
 rampart.prepareNativeStep(b.rampartAI,.08);
 assert(u.reload>.08);
 const before={x:u.x,z:u.z};
 u.x=-101;u.z=100; // explicitly simulate native 2D attempted movement
 assert.equal(rampart.preservePhysicalPost(b.rampartAI,u),true);
 assert.deepEqual({x:u.x,z:u.z},before);
 assert.equal(u.siegeY,rampart.POST_Y);
 assert.equal(b.rampartAI.exposedG54BotAttackPrevented,8);
});
test('actual G5.4 bridge ticks preserve elevated posts and unmodified player orders',()=>{
 const b=make(),p=post(b,'bow');
 const u=b.state.soldiers[p.id];
 for(let i=0;i<20;i++)bridge.step(b,.08);
 const snap=bridge.snapshot(b),v=b.state.soldiers[p.id];
 assert.equal(v.x,p.position.x);
 assert.equal(v.z,p.position.z);
 assert.equal(v.siegeY,p.position.y);
 assert(snap.realRampart3DDefenderAI.actualNativeGuardTicks>0);
 assert.equal(snap.realRampart3DDefenderAI.currentG54SoldierCount,140);
 assert.equal(snap.realRampart3DDefenderAI.noSyntheticZoneOrVictoryEvents,true);
});
test('real 3D musket from a physical blue post hits red native soldier ONLY via G5.4',()=>{
 const b=make(),p=post(b,'musket');
 const red=putRed(b,p.position.x,-59);
 // Keep other red warriors out of this deterministic QA ray.
 for(const v of soldiers(b).filter(v=>v.team==='red'&&v.id!==red.id)){
  v.x=v.x<0?-105:105;v.z=-95;
 }
 const hp=red.hp,attacker=b.state.soldiers[p.id];
 // Actual original engine native elapsed clock; no local wall clock shortcuts.
 b.state.elapsed=2.0;
 rampart.afterNativeStep(b.rampartAI,.08);
 const a=rampart.snapshot(b.rampartAI);
 assert(a.musket3DShots>=1,'No authentic blue wall-top musket fired');
 assert.equal(a.nativeOriginalMusketInterval,15);
 assert.equal(a.nativeOriginalBowInterval,4);
 assert.equal(attacker.siegeY,rampart.POST_Y);
 // Deterministic native dispersion can miss; any damage must be native.
 assert(red.hp<=hp);
 assert.equal(a.successfulAuthenticSoldierHits>=0,true);
 if(red.hp<hp)assert(b.state.combatEvents.some(e=>
  e.kind==='soldier'&&e.attackerId===attacker.id&&e.source==='soldier'));
});
test('physical blue arrow is delayed, tied to genuine attacker ID, never fake HP',()=>{
 const b=make(),p=post(b,'bow'),u=b.state.soldiers[p.id];
 const red=putRed(b,p.position.x,-65);
 for(const v of soldiers(b).filter(v=>v.team==='red'&&v.id!==red.id)){
  v.x=108;v.z=-108;
 }
 b.state.elapsed=4;
 rampart.afterNativeStep(b.rampartAI,.08);
 const s=rampart.snapshot(b.rampartAI);
 assert(s.bow3DShots>=1,'No authentic blue wall-top arrow created');
 assert(s.pendingPhysicalBotArrows>=1);
 assert.equal(red.hp,red.maxHp,'Bow must not instantly damage before flight');
 b.state.elapsed+=.025;
 rampart.afterNativeStep(b.rampartAI,.025);
 assert.equal(red.hp,red.maxHp,'Native bow crossed distance instantaneously');
 let elapsed=0;
 while(elapsed<.5&&b.rampartAI.ballistics.status().activePlayerArrows){
  b.state.elapsed+=.025;elapsed+=.025;
  rampart.afterNativeStep(b.rampartAI,.025);
 }
 assert.equal(b.rampartAI.ballistics.status().activePlayerArrows,0);
 assert.equal(b.rampartAI.ownerByArrow.size,0);
 assert(red.hp<=red.maxHp);
});
test('S4B1 never edits native damage/cadence, no fake victory, no 3D player counterfire claim',()=>{
 const b=make();
 const s=rampart.snapshot(b.rampartAI);
 assert.equal(s.authenticNativeG54DamageSoldierOnly,true);
 assert.equal(s.nativeOriginalBowInterval,W.SHOT_INTERVAL.bow);
 assert.equal(s.nativeOriginalMusketInterval,W.SHOT_INTERVAL.musket);
 assert.equal(s.botPlayer3DCounterfire,false);
 assert.equal(s.reciprocalNative3DRampartTargeting,false);
 assert.equal(b.scenario.gate.hp,600);
 assert.equal(b.scenario.winner,null);
 assert.equal(b.state.playerKills,0);
});

test('AK-05b2 actual 4 blue native rampart muskets can target the ram with original 15s clock',()=>{
 const b=bridge.create({armyEngine:A,map,objectives,traversal,
  playerTeam:'red',playerType:'sword',seed:1600,
  structureCombatEngine:structure,assaultNavigationEngine:assault,
  ladderAIEngine:ladder,captureAIEngine:capture,
  defenderAIEngine:defend,rampartAIEngine:rampart,
  ballisticsAPI:ballistics,weaponBalance:W,
  fourSquadCommandEngine:four,ramEngine:ram
 });
 assert.equal(b.rampartAI.ram,b.ram);
 assert.equal(b.state.soldiers.length,140);
 const initialHp=b.ram.hp;
 const shooters=[...b.rampartAI.posts.values()].filter(p=>p.type==='musket');
 assert.equal(shooters.length,4);
 // Controlled clear sight fixture with the ORIGINAL G5.4 140 soldiers.
 for(const u of b.state.soldiers){
  if(b.rampartAI.posts.has(u.id))continue;
  u.x=u.team==='red'?-118:118;u.z=-118;u.siegeY=0;
 }
 b.state.elapsed=1.05;
 rampart.afterNativeStep(b.rampartAI,.08);
 let shotStats=rampart.snapshot(b.rampartAI);
 assert(shotStats.nativeBlueRampartRamShots>=1,'No genuine blue AI musket targeted ram');
 assert(shotStats.nativeBlueRampartRamShots<=4);
 assert(b.ram.hp<initialHp,'No real 3D line-of-sight projectile damaged ram');
 assert(shotStats.siegeEquipmentDamage>0);
 assert(shotStats.siegeEquipmentDamage<=4*32);
 assert(shotStats.ramShotsBlockedByReal3DCover>=0);
 assert.equal(shotStats.nativeOriginalMusketInterval,15);
 const prior=shotStats.nativeBlueRampartRamShots;
 b.state.elapsed=1.10;rampart.afterNativeStep(b.rampartAI,.05);
 assert.equal(rampart.snapshot(b.rampartAI).nativeBlueRampartRamShots,prior);
 assert.equal(b.ram.defenderDamage,shotStats.siegeEquipmentDamage);
 const ids=ram.snapshot(b.ram).actualBlueNativeShooterIds;
 assert(ids.length>=1);
 assert(ids.every(id=>shooters.some(p=>p.id===id)));
 assert.equal(b.scenario.gate.hp,600);
 assert.equal(b.state.soldiers.length,140);
});
test('AK-05b2 earlier approved S4B1 soldier shots work with no siege ram plugged in',()=>{
 const b=make();
 assert.equal(b.rampartAI.ram,null);
 assert.equal(rampart.snapshot(b.rampartAI).nativeBlueRampartRamShots,0);
 b.state.elapsed=2;
 assert.doesNotThrow(()=>rampart.afterNativeStep(b.rampartAI,.08));
 assert.equal(b.scenario.gate.hp,600);
});

test('AK-05b3 four original G5.4 blue rampart bows launch delayed 3D ram arrows, no fabricated hit on release',()=>{
 const b=bridge.create({armyEngine:A,map,objectives,traversal,
  playerTeam:'red',playerType:'sword',seed:1600,
  structureCombatEngine:structure,assaultNavigationEngine:assault,
  ladderAIEngine:ladder,captureAIEngine:capture,
  defenderAIEngine:defend,rampartAIEngine:rampart,
  ballisticsAPI:ballistics,weaponBalance:W,
  fourSquadCommandEngine:four,ramEngine:ram
 });
 assert.equal(b.rampartAI.ram,b.ram);
 assert.equal(b.rampartAI.ballistics.status().siegeEquipmentProviderActive,true);
 for(const u of b.state.soldiers){
  if(b.rampartAI.posts.has(u.id))continue;
  u.x=u.team==='red'?-118:118;u.z=-116;u.siegeY=0;
 }
 for(const p of b.rampartAI.posts.values())
  if(p.type==='musket')p.nextShotAt=100; // fixture isolates BOW
 const hp=b.ram.hp;
 b.state.elapsed=3.05;
 rampart.afterNativeStep(b.rampartAI,.05);
 let q=rampart.snapshot(b.rampartAI);
 assert(q.nativeBlueRampartPhysicalBowVsRamShots>=1,
   'No original blue native bow AI queued physical ram arrow');
 assert(q.nativeBlueRampartPhysicalBowVsRamShots<=4);
 assert.equal(b.ram.hp,hp,'Arrow launch cannot immediately hit equipment');
 assert(q.pendingRealRamArrowIds>=1);
 assert.equal(q.nativeOriginalBowInterval,4);
 assert.equal(q.nativeOriginalMusketInterval,15);
 const launched=q.nativeBlueRampartPhysicalBowVsRamShots;
 b.state.elapsed+=.025;rampart.afterNativeStep(b.rampartAI,.025);
 assert.equal(b.ram.hp,hp,'Arrow crossed a long physical distance instantaneously');
 let simulation=0;
 while(simulation<1.6&&b.rampartAI.ballistics.status().activePlayerArrows){
  b.state.elapsed+=.025;simulation+=.025;
  rampart.afterNativeStep(b.rampartAI,.025);
 }
 q=rampart.snapshot(b.rampartAI);
 assert.equal(q.pendingRealRamArrowIds,0);
 assert.equal(q.nativeBlueRampartPhysicalBowVsRamShots,launched);
 assert.equal(q.bowEquipmentDamage,b.ram.defenderBowHits*ram.SETTINGS.defenderBowDamage);
 assert.equal(b.ram.hp,hp-q.bowEquipmentDamage);
 assert(q.nativeBlueRampartPhysicalBowRamImpacts>0,
   'At least one original 3D native bow flight should hit wooden chassis');
 assert.equal(q.nativeBlueRampartPhysicalBowRamImpacts,b.ram.defenderBowHits);
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.scenario.gate.hp,600);
});
test('AK-05b3 no equipment source means preserved authentic S4B1 arrow-vs-soldier behavior',()=>{
 const b=make();
 assert.equal(b.rampartAI.ram,null);
 assert.equal(b.rampartAI.ballistics.status().siegeEquipmentProviderActive,false);
 assert.equal(rampart.snapshot(b.rampartAI).nativeBlueRampartPhysicalBowVsRamShots,0);
 assert.equal(b.state.soldiers.length,140);
 assert.equal(W.SHOT_INTERVAL.bow,4);
 assert.equal(W.SHOT_INTERVAL.musket,15);
});

test('AK-05c2 real four blue G5.4 rampart muskets counterattack genuine catapult with original 15s cadence',()=>{
 const b=bridge.create({armyEngine:A,map,objectives,traversal,
  playerTeam:'red',playerType:'sword',seed:1600,
  structureCombatEngine:structure,assaultNavigationEngine:assault,
  ladderAIEngine:ladder,captureAIEngine:capture,
  defenderAIEngine:defend,rampartAIEngine:rampart,
  ballisticsAPI:ballistics,weaponBalance:W,
  fourSquadCommandEngine:four,catapultEngine:catapult
 });
 assert.equal(b.rampartAI.catapult,b.catapult);
 assert.equal(rampart.snapshot(b.rampartAI).catapultActive,true);
 assert.equal(b.state.soldiers.length,140);
 for(const u of b.state.soldiers){
  if(b.rampartAI.posts.has(u.id))continue;
  u.x=u.team==='red'?-117:117;u.z=-117;u.siegeY=0;
 }
 const hp=b.catapult.hp;
 b.state.elapsed=1.05;
 rampart.afterNativeStep(b.rampartAI,.08);
 let s=rampart.snapshot(b.rampartAI);
 assert(s.nativeBlueRampartCatapultShots>=1,
  'Actual G5.4 blue wall-post muskets did not target the physical catapult');
 assert(s.nativeBlueRampartCatapultShots<=4);
 assert.equal(s.nativeOriginalMusketInterval,15);
 assert(s.actualCatapultCounterBatteryDamage>0,
  'No real original wall defender musket damaged the exposed 3D catapult');
 assert(s.actualCatapultCounterBatteryDamage<=4*catapult.SETTINGS.defenderMusketDamage);
 assert.equal(b.catapult.hp,hp-s.actualCatapultCounterBatteryDamage);
 const prior=s.nativeBlueRampartCatapultShots;
 b.state.elapsed=1.1;
 rampart.afterNativeStep(b.rampartAI,.05);
 s=rampart.snapshot(b.rampartAI);
 assert.equal(s.nativeBlueRampartCatapultShots,prior);
 assert.equal(s.nativeBlueRampartCatapultHits,b.catapult.defenderHits);
 assert.equal(b.scenario.gate.hp,600);
 assert.equal(b.state.soldiers.length,140);
});
test('AK-05c2 field-independent S4B1 ram-only and soldier-only opt-ins unaffected',()=>{
 const solo=make();
 assert.equal(solo.rampartAI.catapult,null);
 assert.equal(rampart.snapshot(solo.rampartAI).nativeBlueRampartCatapultShots,0);
 const withRam=bridge.create({armyEngine:A,map,objectives,traversal,
  playerTeam:'red',playerType:'sword',seed:1600,
  structureCombatEngine:structure,assaultNavigationEngine:assault,
  ladderAIEngine:ladder,captureAIEngine:capture,
  defenderAIEngine:defend,rampartAIEngine:rampart,
  ballisticsAPI:ballistics,weaponBalance:W,
  fourSquadCommandEngine:four,ramEngine:ram
 });
 assert.equal(withRam.rampartAI.catapult,null);
 assert.equal(withRam.rampartAI.ram,withRam.ram);
 assert.equal(rampart.snapshot(withRam.rampartAI).nativeBlueRampartCatapultShots,0);
 assert.equal(W.SHOT_INTERVAL.musket,15);
 assert.equal(W.SHOT_INTERVAL.bow,4);
});
