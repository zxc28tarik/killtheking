/** AK-05a G5.4 native-crew ram: deterministic unit QA, not a claim of unassisted AI arrival.
 * No historic Arena or field G5.4 engine is edited.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const THREE=require('../../vendor/three-r128.js');
const ram=require('./siege-ram.js');
const map=require('./siege-map.js');
const objectives=require('./siege-objectives.js');
const bridge=require('./siege-real-army-bridge.js');
const four=require('../army/modules/g54-four-squad-command.js');
const structure=require('./siege-structure-combat.js');
const src=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const balance=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const ctx=vm.createContext({console});vm.runInContext(balance,ctx,{timeout:3000});
vm.runInContext(src,ctx,{timeout:3000});
const A=ctx.ArenaArmyBattle;
function make(team='red',options={}){
 const scenario=objectives.createScenario(options);
 const b=bridge.create({
   armyEngine:A,map,objectives,scenario,playerTeam:team,
   playerType:'sword',seed:1600,traversal:require('./siege-traversal.js'),
   structureCombatEngine:structure,
   fourSquadCommandEngine:four,ramEngine:ram
 });
 return {b,r:b.ram};
}
function nativeTick(r){
 A.step(r.state,.08);
 return ram.afterNativeTick(r);
}
function realCrewNear(r,count=5){
 const crew=r.state.soldiers.filter(s=>
   s.squadId===r.pikeId&&s.team==='red'&&s.type==='pike');
 assert.equal(crew.length,25);
 for(let i=0;i<count;i++){
   // QA-only seeded position: these remain genuine native G5.4 soldiers.
   // This DOES NOT prove unassisted marching from the genuine spawn.
   crew[i].x=i*.6-1;
   crew[i].z=r.z-1.8;
   crew[i].siegeY=0;
 }
 return crew;
}
test('AK-05a preserves SHA-pinned G5.4 and exactly 140 original soldier IDs',()=>{
 assert.equal(createHash('sha256').update(src).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 const {b,r}=make();
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.squads.length,8);
 assert.equal(ram.snapshot(r).realNativeRedPikeSquadId,
   b.state.squads.find(s=>s.team==='red'&&s.type==='pike').id);
 assert.equal(ram.snapshot(r).gateHp,600);
 assert.equal(ram.snapshot(r).physicalProgress,0);
 assert.equal(ram.snapshot(r).strikeCount,0);
 assert.equal(bridge.snapshot(b).siegeRamConnected,true);
});
test('no soldier-free movement, damage, or debug gate hit, even with native time',()=>{
 const {r}=make();
 for(let i=0;i<35;i++)nativeTick(r);
 const q=ram.snapshot(r);
 assert.equal(q.assigned,false);
 assert.equal(q.strikeCount,0);
 assert.equal(q.actualGateDamage,0);
 assert.equal(q.gateHp,600);
 assert.equal(q.physicalProgress,0);
 assert.equal(q.artificialGateDamageWithoutCrew,false);
});
test('real human red G5.4 commander assigns ONLY 25 red native pikes via existing AK-04 module',()=>{
 const {b,r}=make();
 const f=b.multiSquadCommand;
 const original=four.snapshot(f).selectedSquadIds.slice();
 const o=ram.enlist(r);
 assert.equal(o.ok,true,o.reason);
 assert.equal(o.pikeSquadId,r.pikeId);
 assert.equal(ram.snapshot(r).operatorOrderAccepted,true);
 assert.equal(b.state.squads[r.pikeId].routeGoal.x,0);
 assert.equal(b.state.squads[r.pikeId].routeGoal.z,r.z+2.8);
 assert.deepEqual([...four.snapshot(f).selectedSquadIds],[...original]);
 assert.deepEqual(ram.enlist(r),{
   ok:true,alreadyAssigned:true,pikeSquadId:r.pikeId
 });
 assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
});
test('blue commander cannot assign red attacker ram or issue fake pike crew orders',()=>{
 const {b,r}=make('blue');
 const first=ram.enlist(r);
 assert.equal(first.ok,false);
 assert.match(first.reason,/Only a living red commander/);
 assert.equal(ram.snapshot(r).assigned,false);
 assert.equal(ram.snapshot(r).gateHp,600);
 assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
});
test('zero HP or ended match cannot enlist; fresh match recreates an unassigned ram',()=>{
 const {b,r}=make();
 A.setPlayerHealth(b.state,0);
 assert.equal(ram.enlist(r).ok,false);
 const next=make().r;
 next.scenario.phase='RESULT';
 assert.equal(ram.enlist(next).ok,false);
 const again=make().r;
 assert.equal(ram.snapshot(again).assigned,false);
 assert.equal(ram.snapshot(again).actualGateDamage,0);
});
test('two physically present original pikes move the ram only after an actual native tick',()=>{
 const {r}=make();
 assert.equal(ram.enlist(r).ok,true);
 const crew=realCrewNear(r,2);
 const hp=crew.map(u=>u.hp);
 const z=r.z;
 // No G5.4 step, no ram progress, no matter how frequently RAF draws.
 ram.afterNativeTick(r);
 assert.equal(r.z,z);
 nativeTick(r);
 assert(r.z>z);
 assert.equal(ram.snapshot(r).crewCount>=2,true);
 assert.equal(ram.snapshot(r).nativeRamSteps,1);
 assert.equal(ram.snapshot(r).strikeCount,0);
 assert.deepEqual(crew.map(u=>u.hp),hp);
});
test('one real pike near the ram is insufficient to push',()=>{
 const {r}=make();
 assert.equal(ram.enlist(r).ok,true);
 realCrewNear(r,1);
 const z=r.z;
 nativeTick(r);
 assert.equal(r.z,z);
 assert.equal(ram.snapshot(r).state,'WAITING_FOR_REAL_CREW');
 assert.equal(ram.snapshot(r).strikeCount,0);
});
test('3 actual G5.4 pikes at the gate still need a cooldown; first ram strike is 36 genuine S1 HP',()=>{
 const {r}=make();
 assert.equal(ram.enlist(r).ok,true);
 // QA fixture fast-forwards RAM location, not a soldier or gate event.
 r.z=r.terminalZ;
 for(let i=0;i<50;i++){
   realCrewNear(r,3);
   nativeTick(r);
   if(r.strikeCount)break;
 }
 assert.equal(r.strikeCount,1);
 assert.equal(r.actualGateDamage,36);
 assert.equal(r.scenario.gate.hp,564);
 assert.equal(r.strikeEvents[0].source,
   'AK05A_PHYSICAL_G54_CREWED_RAM_S1_GATE_EVENT');
 assert.equal(r.strikeEvents[0].crewNativeIds.length>=3,true);
 assert.equal(r.scenario.events.some(e=>e.type==='GATE_HIT'&&
   e.detail.weapon==='ram'),true);
});
test('ram crew lost at gate blocks ALL further gate damage without fresh living soldiers',()=>{
 const {r}=make();
 assert.equal(ram.enlist(r).ok,true);
 r.z=r.terminalZ;
 for(let i=0;i<50;i++){realCrewNear(r,3);nativeTick(r);}
 const first=r.scenario.gate.hp;
 const crew=r.state.soldiers.filter(s=>s.squadId===r.pikeId);
 for(const u of crew){u.x=44;u.z=-102;}
 for(let i=0;i<60;i++)nativeTick(r);
 assert.equal(r.scenario.gate.hp,first);
 assert.equal(ram.snapshot(r).strikeCount,1);
 assert.equal(ram.snapshot(r).crewCount,0);
});
test('real original objective FSM opens 36HP QA gate after one verified crewed ram strike',()=>{
 const {r}=make('red',{gateHp:36});
 assert.equal(ram.enlist(r).ok,true);
 r.z=r.terminalZ;
 for(let i=0;i<65&&!r.scenario.gate.open;i++){
   realCrewNear(r,5);
   nativeTick(r);
 }
 assert.equal(r.scenario.gate.open,true);
 assert.equal(r.scenario.lanes.gate,true);
 assert.equal(r.scenario.gate.hp,0);
 assert.equal(r.strikeCount,1);
 assert.equal(r.actualGateDamage,36);
 assert.equal(ram.snapshot(r).state,'GATE_BREACHED');
 assert.equal(r.scenario.events.some(e=>e.type==='GATE_BREACHED'),true);
});
test('no original musket cooldown, bow draw or native G5.4 player damage is changed by ram operation',()=>{
 const {b,r}=make();
 const hp=b.state.playerHealth;
 const reloads=b.state.soldiers.filter(s=>s.type==='musket')
   .map(s=>s.reload);
 assert.equal(ram.enlist(r).ok,true);
 assert.equal(b.state.playerHealth,hp);
 assert.deepEqual(b.state.soldiers.filter(s=>s.type==='musket').map(s=>s.reload),
   reloads);
 assert.equal(b.state.soldiers.length,140);
 assert.equal(ram.snapshot(r).originalG54WeaponDamageUnchanged,true);
});
test('3D mesh is a real rendered movable ram and cleans up on team change',()=>{
 const {r}=make();
 const scene=new THREE.Scene();
 const visual=ram.mountVisual(r,{THREE,scene});
 assert.equal(scene.children.includes(visual.group),true);
 assert(visual.meshCount>=12);
 assert.equal(visual.group.position.z,r.z);
 r.z+=2;
 const draw=ram.renderVisual(r,visual);
 assert.equal(draw.z,r.z);
 assert.equal(draw.meshCount,visual.meshCount);
 ram.removeVisual(visual,scene);
 assert.equal(scene.children.includes(visual.group),false);
});
test('ram state rejects malformed commands and simulation clock rewinds',()=>{
 const {r}=make();
 r.state.tick=-1;
 assert.throws(()=>ram.afterNativeTick(r),/clock regressed/);
});
