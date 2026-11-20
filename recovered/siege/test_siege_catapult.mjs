/** AK-05c1: actual 140 native G5.4 red archer catapult crew, stone flight,
 * genuine 3D first-contact S1 gate only. No fabricated infantry or hitpoints.
 */
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
const four=require('../army/modules/g54-four-squad-command.js');
const ram=require('./siege-ram.js');
const catapult=require('./siege-catapult.js');
const ballistics=require('./siege-player-ballistics-3d.js');
const bridge=require('./siege-real-army-bridge.js');
const source=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const balance=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const ctx=vm.createContext({console});
vm.runInContext(balance,ctx,{timeout:3000});
vm.runInContext(source,ctx,{timeout:3000});
const A=ctx.ArenaArmyBattle;
function make(team='red',withRam=false){
 return bridge.create({armyEngine:A,map,objectives,traversal,
  playerTeam:team,playerType:'sword',seed:1600,
  structureCombatEngine:structure,
  fourSquadCommandEngine:four,
  ...(withRam?{ramEngine:ram}:{}),
  ballisticsAPI:ballistics,catapultEngine:catapult});
}
function positionCrew(b){
 const c=b.catapult;
 const all=b.state.soldiers.filter(s=>s.team==='red'&&s.type==='bow'&&
   s.squadId===c.crewSquadId);
 assert.equal(all.length,15);
 for(let i=0;i<3;i++){
  all[i].x=c.x+((i-1)*1.8);all[i].z=c.z-5;
  all[i].siegeY=0;
 }
 return all;
}
test('AK-05c1 preserves untouched original native 140 soldier IDs, 8 squads and G5.4 checksum',()=>{
 assert.equal(createHash('sha256').update(source).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 const b=make();
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.squads.length,8);
 const c=b.catapult;
 assert.equal(bridge.snapshot(b).siegeCatapultConnected,true);
 assert.equal(catapult.snapshot(c).shots,0);
 assert.equal(catapult.snapshot(c).actualS1GateHp,600);
 assert.equal(catapult.snapshot(c).native140SoldierAuthorityPreserved,true);
 assert.equal(catapult.snapshot(c).minimumCrew,3);
 assert.equal(catapult.snapshot(c).crewCount,0);
 assert.equal(catapult.snapshot(c).projectileInFlight,false);
});
test('red commander assigns existing 15 G5.4 bow squad by original native 4-squad authority, preserving selection',()=>{
 const b=make(),c=b.catapult;
 const selected=four.snapshot(b.multiSquadCommand).selectedSquadIds.slice();
 const archer=b.state.soldiers.filter(u=>u.team==='red'&&u.type==='bow');
 const original=archer.map(u=>[u.x,u.z,u.hp]);
 const cmd=catapult.enlist(c);
 assert.equal(cmd.ok,true,cmd.reason);
 assert.equal(cmd.realNativeArcherSquadId,c.crewSquadId);
 assert.equal(b.state.squads[c.crewSquadId].routeGoal.x,c.x);
 assert.equal(b.state.squads[c.crewSquadId].routeGoal.z,c.z-3.2);
 assert.deepEqual(four.snapshot(b.multiSquadCommand).selectedSquadIds,selected);
 assert.deepEqual(archer.map(u=>[u.x,u.z,u.hp]),original);
 assert.deepEqual(catapult.enlist(c),{ok:true,alreadyAssigned:true});
});
test('blue player, dead commander and finished scenario cannot assign attacker catapult',()=>{
 const blue=make('blue');
 assert.equal(catapult.enlist(blue.catapult).ok,false);
 const red=make();
 red.state.playerHealth=0;
 assert.equal(catapult.enlist(red.catapult).ok,false);
 const ended=make();
 ended.scenario.phase='RESULT';
 assert.equal(catapult.enlist(ended.catapult).ok,false);
});
test('no living archer crew means no fabricated launch, gate or soldier damage after 25 native ticks',()=>{
 const b=make(),c=b.catapult;
 assert.equal(catapult.enlist(c).ok,true);
 for(let i=0;i<25;i++)bridge.step(b,.08);
 const s=catapult.snapshot(c);
 assert.equal(s.crewCount,0);
 assert.equal(s.shots,0);
 assert.equal(s.gateHits,0);
 assert.equal(s.actualGateDamage,0);
 assert.equal(s.actualS1GateHp,600);
 assert.equal(s.noFreeShotsWithoutLivingArchers,true);
});
test('only 2 actual native archers cannot fire, third real living archer enables physics',()=>{
 const b=make(),c=b.catapult;
 assert.equal(catapult.enlist(c).ok,true);
 const all=positionCrew(b);
 // Crew eligibility can disappear by physical distance, not by
 // fabricating a native death outside G5.4's own alive reconciliation.
 all[2].x=115;all[2].z=-116;
 bridge.step(b,.08);
 assert.equal(catapult.snapshot(c).crewCount,2);
 assert.equal(catapult.snapshot(c).shots,0);
 all[2].x=c.x+1.8;all[2].z=c.z-5;
 bridge.step(b,.08);
 assert.equal(catapult.snapshot(c).shots,1);
 assert.equal(catapult.snapshot(c).projectileInFlight,true);
 assert.equal(catapult.snapshot(c).gateHits,0);
 assert.equal(catapult.snapshot(c).actualS1GateHp,600);
 assert.equal(catapult.snapshot(c).projectile.launchCrewIds.length,3);
});
test('stone takes genuine physical flight time, may only damage actual gate on first 3D contact',()=>{
 const b=make(),c=b.catapult;
 assert.equal(catapult.enlist(c).ok,true);
 positionCrew(b);
 const hp=b.scenario.gate.hp;
 bridge.step(b,.08);
 assert.equal(c.shots,1);
 assert.equal(b.scenario.gate.hp,hp,'Catapult launch damaged gate immediately');
 for(let i=0;i<5;i++)bridge.step(b,.08);
 assert.equal(b.scenario.gate.hp,hp,'Physical stone crossed 40m instantly');
 let steps=0;
 while(c.projectile&&steps++<80)bridge.step(b,.08);
 const status=catapult.snapshot(c);
 assert.equal(status.projectileInFlight,false);
 assert.equal(status.shots,1);
 assert.equal(status.gateHits,1,'Stone must reach the real S1 gate collider');
 assert.equal(status.actualGateDamage,catapult.SETTINGS.damage);
 assert.equal(status.actualS1GateHp,hp-catapult.SETTINGS.damage);
 assert.equal(status.impactHistory[0].kind,'gate');
 assert(status.impactHistory[0].impact);
 assert.equal(status.impactHistory[0].crewNativeIds.length,3);
});
test('three-native-archer crew cannot bypass original catapult reload or score extra instant gate hits',()=>{
 const b=make(),c=b.catapult;
 catapult.enlist(c);positionCrew(b);
 for(let i=0;i<50;i++)bridge.step(b,.08);
 assert.equal(c.shots,1);
 assert.equal(c.gateHits,1);
 assert.equal(c.gateDamage,catapult.SETTINGS.damage);
 assert.equal(catapult.snapshot(c).provisionalCooldownSeconds,9.5);
});
test('the real 3D castle wall takes impact first if gate path is physically blocked',()=>{
 const b=make(),c=b.catapult;
 catapult.enlist(c);positionCrew(b);
 c.gate={...c.gate,x:-30}; // QA-only target shift; actual castle wall unchanged
 bridge.step(b,.08);
 let count=0;
 while(c.projectile&&count++<100)bridge.step(b,.08);
 assert.equal(catapult.snapshot(c).gateHits,0);
 assert.equal(catapult.snapshot(c).actualS1GateHp,600);
 assert(catapult.snapshot(c).blockedShots+catapult.snapshot(c).misses>0);
});
test('real 3D catapult mesh and projectile group cleanly dispose, original ram coexists',()=>{
 const THREE=require('../../vendor/three-r128.js'),b=make('red',true),c=b.catapult;
 const scene=new THREE.Scene();
 const visual=catapult.mountVisual(c,{THREE,scene});
 assert(visual.meshCount>=9);
 assert.equal(visual.projectile.visible,false);
 catapult.enlist(c);positionCrew(b);bridge.step(b,.08);
 catapult.renderVisual(c,visual);
 assert.equal(visual.projectile.visible,true);
 assert.equal(bridge.snapshot(b).siegeRamConnected,true);
 catapult.removeVisual(visual,scene);
 assert(!scene.children.includes(visual.group));
 assert(!scene.children.includes(visual.projectile));
});
test('new catapult lacks independent original G5.4 structure magic and rejects invalid native roster',()=>{
 const b=make();
 const fakeState={...b.state,soldiers:[]};
 assert.throws(()=>catapult.create({engine:A,state:fakeState,map,objectives,
  scenario:b.scenario,ballisticsAPI:ballistics,
  fourSquadAuthority:b.multiSquadCommand,
  fourSquadEngine:four}),/needs genuine red G5.4 archers/);
 assert.throws(()=>catapult.afterNativeTick({...b.catapult,state:fakeState}),
  /native G5.4 red archer crew invalid/);
});

test('AK-05c2 authentic blue native musket must have 3D first contact and original 15-second clock',()=>{
 const b=make(),c=b.catapult;
 const gun=b.state.soldiers.find(u=>u.team==='blue'&&u.type==='musket'&&
   !b.state.squads[u.squadId].playerControlled);
 assert(gun);
 for(const u of b.state.soldiers){
   if(u.id===gun.id)continue;
   u.x=u.team==='red'?-117:117;u.z=-118;u.siegeY=0;
 }
 gun.x=-17;gun.z=-40.2;gun.siegeY=13.035;
 const from={x:gun.x,y:gun.siegeY+1.85,z:gun.z},
   to={x:c.x,y:2.7,z:c.z};
 const actual=catapult.rayHit(c,from,to);
 assert(actual?.distance>0,'No physical catapult AABB in native blue line');
 const solver=ballistics.create({map});
 const hp=c.hp;
 const denied=catapult.hitByDefender(c,{
   soldierId:gun.id,weapon:'musket',damage:28,from,to,ballistics:solver
 });
 assert.equal(denied.ok,false);
 assert.equal(c.hp,hp);
 const hit=catapult.hitByDefender(c,{
   soldierId:gun.id,weapon:'musket',damage:28,from,to,
   ballistics:solver,verifiedPost:true
 });
 assert.equal(hit.ok,true,JSON.stringify(hit));
 assert.equal(hit.dealt,28);
 assert.equal(c.hp,hp-28);
 assert.equal(c.defenderHits,1);
 assert.equal(catapult.snapshot(c).counterBatteryNativeMusket15s,true);
 const early=catapult.hitByDefender(c,{
   soldierId:gun.id,weapon:'musket',damage:28,from,to,
   ballistics:solver,verifiedPost:true
 });
 assert.equal(early.ok,false);
 assert.equal(early.reason,'native-musket-cadence');
 assert.equal(c.hp,hp-28);
 b.state.elapsed+=15;
 const again=catapult.hitByDefender(c,{
   soldierId:gun.id,weapon:'musket',damage:28,from,to,
   ballistics:solver,verifiedPost:true
 });
 assert.equal(again.ok,true);
 assert.equal(c.hp,hp-56);
 assert.equal(c.scenario.gate.hp,600);
});
test('AK-05c2 stone wall always blocks musket counterbattery before equipment',()=>{
 const b=make(),c=b.catapult,gun=b.state.soldiers.find(u=>
   u.team==='blue'&&u.type==='musket');
 for(const u of b.state.soldiers){
   if(u.id===gun.id)continue;
   u.x=116;u.z=-117;
 }
 gun.x=-18;gun.z=-15;gun.siegeY=0;
 const from={x:gun.x,y:1.85,z:gun.z},to={x:c.x,y:2.7,z:c.z};
 const r=catapult.hitByDefender(c,{
   soldierId:gun.id,weapon:'musket',damage:28,from,to,
   ballistics:ballistics,verifiedPost:true
 });
 assert.equal(r.ok,false);
 assert.equal(r.reason,'covered');
 assert.equal(c.hp,300);
 assert.equal(c.defenderShots,0);
});
test('AK-05c2 real destroyed machine loses projectile, cannot launch or enlist and removes collider',()=>{
 const b=make(),c=b.catapult;
 catapult.enlist(c);positionCrew(b);
 bridge.step(b,.08);
 assert.equal(c.projectile!==null,true);
 const gun=b.state.soldiers.find(u=>u.team==='blue'&&u.type==='musket'&&
   !b.state.squads[u.squadId].playerControlled);
 for(const u of b.state.soldiers){
   if(u.id===gun.id)continue;
   u.x=u.team==='red'?-115:115;u.z=-116;
 }
 gun.x=-17;gun.z=-40.2;gun.siegeY=13.035;
 const from={x:gun.x,y:14.885,z:gun.z};
 c.hp=19; // QA-only near-death equipment integrity, not invented actor HP
 const damage=catapult.hitByDefender(c,{
   soldierId:gun.id,weapon:'musket',damage:28,from,
   to:{x:c.x,y:2.7,z:c.z},
   verifiedPost:true,ballistics
 });
 assert.equal(damage.ok,true,JSON.stringify(damage));
 assert.equal(damage.dealt,19);
 assert.equal(damage.destroyed,true);
 assert.equal(c.hp,0);
 assert.equal(c.projectile,null);
 assert.equal(catapult.collider(c),null);
 assert.equal(catapult.enlist(c).ok,false);
 const gateHp=c.scenario.gate.hp,shots=c.shots;
 A.step(b.state,.08);catapult.afterNativeTick(c);
 assert.equal(c.scenario.gate.hp,gateHp);
 assert.equal(c.shots,shots);
 assert.equal(catapult.snapshot(c).state,'DESTROYED_BY_NATIVE_BLUE_COUNTERBATTERY');
 const THREE=require('../../vendor/three-r128.js');
 const scene=new THREE.Scene(),visual=catapult.mountVisual(c,{THREE,scene});
 catapult.renderVisual(c,visual);
 assert.equal(visual.projectile.visible,false);
 assert.equal(visual.wood.color.getHex(),0x302922);
 assert(visual.beam.rotation.x<-.5);
 catapult.removeVisual(visual,scene);
 const next=make().catapult;
 assert.equal(catapult.snapshot(next).hp,300);
 assert.equal(catapult.snapshot(next).destroyed,false);
});
test('AK-05c2 denied fake counterbattery on blue-owned, dead, wrong weapon or unrelated shots',()=>{
 const b=make(),c=b.catapult;
 const gun=b.state.soldiers.find(u=>u.team==='blue'&&u.type==='musket');
 gun.x=-17;gun.z=-40.2;gun.siegeY=13.035;
 const from={x:gun.x,y:14.885,z:gun.z},to={x:c.x,y:2.7,z:c.z};
 const payload={soldierId:gun.id,from,to,ballistics,verifiedPost:true};
 assert.equal(catapult.hitByDefender(c,{...payload,weapon:'bow',damage:28}).ok,false);
 assert.equal(catapult.hitByDefender(c,{...payload,weapon:'musket',damage:36}).ok,false);
 gun.alive=false;
 assert.equal(catapult.hitByDefender(c,{...payload,weapon:'musket',damage:28}).ok,false);
 gun.alive=true;
 assert.equal(catapult.hitByDefender(c,{...payload,weapon:'musket',damage:28,
   from:{...from,x:from.x+3}}).ok,false);
 assert.equal(c.hp,c.maxHp);
 assert.equal(c.defenderShots,0);
});
