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
const ctx=vm.createContext({console});vm.runInContext(source,ctx,{timeout:3000});
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
 all[2].alive=false;all[2].hp=0;
 bridge.step(b,.08);
 assert.equal(catapult.snapshot(c).crewCount,2);
 assert.equal(catapult.snapshot(c).shots,0);
 all[2].alive=true;all[2].hp=all[2].maxHp;
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
 c.gate.x=-30;
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
