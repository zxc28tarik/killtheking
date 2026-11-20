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
const ballistics=require('./siege-player-ballistics-3d.js');
const traversal=require('./siege-traversal.js');
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


test('AK-05a real red pikes actually march to staffed ram from untouched initial spawns (no QA teleport)',()=>{
 const {b,r}=make();
 const crew=b.state.soldiers.filter(u=>u.squadId===r.pikeId);
 const initial=crew.map(u=>({id:u.id,x:u.x,z:u.z,hp:u.hp}));
 assert.equal(ram.enlist(r).ok,true);
 let maxCrew=0,maxProgress=0,steps=0;
 for(let i=0;i<820&&!b.scenario.gate.open;i++){
   bridge.step(b,.08);
   steps++;
   maxCrew=Math.max(maxCrew,b.ram.crewCount);
   maxProgress=Math.max(maxProgress,ram.snapshot(r).physicalProgress);
   if(maxProgress>.04)break;
   if(b.scenario.phase==='RESULT')break;
 }
 const displaced=crew.filter((u,i)=>Math.hypot(u.x-initial[i].x,
   u.z-initial[i].z)>1.2).length;
 console.log('AK05A_UNASSISTED_G54_CREW_DIAGNOSTIC',JSON.stringify({
   steps,maxCrew,maxProgress,displaced,ramState:r.stateName,
   finalG54PikeSquadOrder:b.state.squads[r.pikeId].order,
   finalG54PikeGoal:b.state.squads[r.pikeId].routeGoal,
   alivePikes:crew.filter(u=>u.alive).length
 }));
 assert(displaced>0,'No original native G5.4 pikes moved from spawn');
 assert(maxCrew>=2,'No actual native G5.4 pikes ever reached staffed ram');
 assert(maxProgress>0,'Actual G5.4 crew arrived but ram never moved');
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
});


test('AK-05a native pikes sustain an unassisted ram approach toward the real closed gate',()=>{
 const {b,r}=make();
 assert.equal(ram.enlist(r).ok,true);
 let topCrew=0,topProgress=0;
 for(let i=0;i<650;i++){
   bridge.step(b,.08);
   const v=ram.snapshot(r);
   topCrew=Math.max(topCrew,v.crewCount);
   topProgress=Math.max(topProgress,v.physicalProgress);
   if(v.gateOpen||v.strikeCount>0||b.scenario.phase==='RESULT')break;
 }
 const last=ram.snapshot(r);
 console.log('AK05A_NATIVE_LONG_MARCH',JSON.stringify({
   maxCrew:topCrew,topProgress,lastProgress:last.physicalProgress,
   ramState:last.state,ramHits:last.strikeCount,
   gateHp:last.gateHp,alivePikes:b.state.soldiers.filter(u=>
     u.squadId===r.pikeId&&u.alive).length,
   originalPikeRoute:b.state.squads[r.pikeId].routeGoal
 }));
 assert(topCrew>=2,'Native pikes cannot keep crew with the ram');
 assert(topProgress>.35,
   'Ram must make substantive physical progress on real native soldier AI');
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
});

test('AK-05b1 3D chassis blocks genuine FPS/TPS ground movement but not elevated player',()=>{
 const {r}=make();
 const body=ram.collider(r);
 assert.equal(body.id,'ak05-ram-body');
 assert.deepEqual([body.w,body.d,body.h],[5.5,7.3,4.35]);
 traversal.setDynamicColliderProvider(()=>[ram.collider(r)]);
 try{
  const p={x:-8,y:0,z:r.z};
  const moved=traversal.move(p,{x:35,z:0},.25,map.spec,r.scenario,
    traversal.RADIUS,traversal.HEIGHT);
  assert.equal(moved.blockedX,true);
  assert(moved.x<-body.w/2-traversal.RADIUS+0.02);
  assert.equal(traversal.overlaps({x:moved.x,y:0,z:moved.z},
    map.spec,r.scenario),false);
  assert.equal(traversal.overlaps({x:0,y:0,z:r.z},
    map.spec,r.scenario),true);
  assert.equal(traversal.overlaps({x:0,y:6,z:r.z},
    map.spec,r.scenario),false);
 }finally{traversal.setDynamicColliderProvider(null);}
});
test('AK-05b1 real G5.4 ground infantry cannot traverse the siege chassis',()=>{
 const {r}=make();
 traversal.setDynamicColliderProvider(()=>[ram.collider(r)]);
 try{
  const p={x:0,y:0,z:r.z-7};
  const step=traversal.move(p,{x:0,z:30},.25,
    map.spec,r.scenario,.65,2.6);
  assert.equal(step.blockedZ,true);
  assert(step.z<r.z-ram.BODY.d/2-.65+.02);
  assert.equal(traversal.overlaps({x:step.x,y:0,z:step.z},
    map.spec,r.scenario,.65,2.6),false);
 }finally{traversal.setDynamicColliderProvider(null);}
});
test('AK-05b1 advancing vehicle cannot newly contact living native player',()=>{
 const {r}=make();
 assert.equal(ram.enlist(r).ok,true);
 A.step(r.state,.08);
 realCrewNear(r,2); // QA manual position, original native soldier IDs
 r.state.playerPosition={x:r.x,z:r.z+ram.BODY.d/2+.88};
 r.state.playerActive=true;r.state.playerHealth=100;
 const start=r.z;
 const result=ram.afterNativeTick(r);
 assert.equal(r.z,start);
 assert.equal(result.state,'WAITING_FOR_CLEAR_RAM_PATH');
 assert.equal(result.livingActorBlockedAdvances,1);
 assert.equal(result.actualGateDamage,0);
 assert.equal(result.defenderCanDamageRamImplemented,true);
 r.state.playerPosition={x:50,z:-100};
 A.step(r.state,.08);realCrewNear(r,2);
 ram.afterNativeTick(r);
 assert(r.z>start);
});
test('AK-05b1 invalid collider fails closed and unregister restores unchanged castle',()=>{
 const {r}=make();
 assert.throws(()=>traversal.setDynamicColliderProvider(3),
    /Expected function or null/);
 traversal.setDynamicColliderProvider(()=>[{
    id:'bad',x:NaN,y:0,z:0,w:1,h:1,d:1,solid:true
 }]);
 assert.throws(()=>traversal.activeColliders(map.spec,r.scenario),
    /Invalid live castle dynamic collider/);
 traversal.setDynamicColliderProvider(null);
 assert.equal(traversal.activeColliders(map.spec,r.scenario)
    .some(c=>c.id==='ak05-ram-body'),false);
});

test('AK-05b2 authentic red commander can reissue a genuine native pike rendezvous, no teleport',()=>{
 const {b,r}=make('red');
 assert.equal(ram.enlist(r).ok,true);
 const original=four.snapshot(b.multiSquadCommand).selectedSquadIds.slice();
 const pikes=b.state.soldiers.filter(u=>u.team==='red'&&u.type==='pike');
 const poses=pikes.map(u=>[u.x,u.z,u.hp]);
 const rev=b.state.squads[r.pikeId].commandRevision;
 const again=ram.reassign(r);
 assert.equal(again.ok,true,again.reason);
 assert.equal(again.reassigned,true);
 assert.equal(again.reassignments,1);
 assert(b.state.squads[r.pikeId].commandRevision>rev);
 assert.deepEqual(four.snapshot(b.multiSquadCommand).selectedSquadIds,original);
 assert.deepEqual(pikes.map(u=>[u.x,u.z,u.hp]),poses);
 const blue=make('blue').r;
 assert.equal(ram.reassign(blue).ok,false);
});
test('AK-05b2 native blue musket has physical first-hit 3D ram shot and 15s cooldown',()=>{
 const {b,r}=make();
 const gun=b.state.soldiers.find(u=>u.team==='blue'&&u.type==='musket'&&
   !b.state.squads[u.squadId].playerControlled);
 assert(gun);
 for(const u of b.state.soldiers){
  if(u.id===gun.id)continue;
  u.x=u.team==='red'?-120:120;u.z=-118;u.siegeY=0;
 }
 gun.x=17;gun.z=-40.2;gun.siegeY=13.035;
 const from={x:gun.x,y:gun.siegeY+1.85,z:gun.z};
 const to={x:r.x,y:2.5,z:r.z};
 const shots=ballistics.create({map});
 assert(ram.rayHit(r,from,to)?.distance>0);
 const unauthorized=ram.hitByDefender(r,{
  soldierId:gun.id,weapon:'musket',damage:32,from,to,ballistics
 });
 assert.equal(unauthorized.ok,false);
 assert.equal(r.hp,360);
 const hit=ram.hitByDefender(r,{
  soldierId:gun.id,weapon:'musket',damage:32,from,to,
  ballistics,verifiedPost:true
 });
 assert.equal(hit.ok,true,JSON.stringify(hit));
 assert.equal(r.hp,328);
 assert.equal(ram.snapshot(r).actualBlueNativeShooterIds.includes(gun.id),true);
 const premature=ram.hitByDefender(r,{
  soldierId:gun.id,weapon:'musket',damage:32,from,to,
  ballistics,verifiedPost:true
 });
 assert.equal(premature.reason,'native-musket-cadence');
 assert.equal(r.hp,328);
 assert.equal(ram.snapshot(r).gateHp,600);
 b.state.elapsed+=15;
 const second=ram.hitByDefender(r,{
  soldierId:gun.id,weapon:'musket',damage:32,from,to,
  ballistics,verifiedPost:true
 });
 assert.equal(second.ok,true);
 assert.equal(r.hp,296);
});
test('AK-05b2 intact castle gate physically protects ram from fake through-wall shots',()=>{
 const {b,r}=make();
 const gun=b.state.soldiers.find(u=>u.team==='blue'&&u.type==='musket');
 for(const u of b.state.soldiers){
  if(u.id===gun.id)continue;
  u.x=118;u.z=-118;
 }
 gun.x=0;gun.z=-17;gun.siegeY=0;
 const from={x:gun.x,y:1.85,z:gun.z};
 const to={x:r.x,y:2.4,z:r.z};
 const shot=ram.hitByDefender(r,{
  soldierId:gun.id,weapon:'musket',damage:32,from,to,
  verifiedPost:true,ballistics
 });
 assert.equal(shot.ok,false);
 assert.equal(shot.reason,'covered');
 assert.equal(r.hp,r.maxHp);
});
test('AK-05b2 ruined ram stops moving/striking, cannot reassign and removes active chassis',()=>{
 const {b,r}=make();
 assert.equal(ram.enlist(r).ok,true);
 const gun=b.state.soldiers.find(u=>u.team==='blue'&&u.type==='musket'&&
   !b.state.squads[u.squadId].playerControlled);
 for(const u of b.state.soldiers){
  if(u.id===gun.id)continue;
  u.x=u.team==='red'?-118:118;u.z=-118;u.siegeY=0;
 }
 gun.x=17;gun.z=-40.2;gun.siegeY=13.035;
 const from={x:gun.x,y:14.885,z:gun.z};
 r.hp=12; // controlled equipment integrity test, NOT normal game HP
 const first=ram.hitByDefender(r,{
  soldierId:gun.id,weapon:'musket',damage:32,
  from,to:{x:r.x,y:2.4,z:r.z},verifiedPost:true,ballistics
 });
 assert.equal(first.ok,true,JSON.stringify(first));
 assert.equal(first.destroyed,true);
 assert.equal(first.dealt,12);
 assert.equal(ram.snapshot(r).hp,0);
 assert.equal(ram.snapshot(r).destroyed,true);
 assert.equal(ram.collider(r),null);
 assert.equal(ram.reassign(r).ok,false);
 assert.equal(ram.enlist(r).ok,false);
 const z=r.z,gate=r.scenario.gate.hp;
 A.step(r.state,.08);ram.afterNativeTick(r);
 assert.equal(r.z,z);
 assert.equal(r.scenario.gate.hp,gate);
 assert.equal(ram.snapshot(r).state,'DESTROYED');
 const scene=new THREE.Scene(),visual=ram.mountVisual(r,{THREE,scene});
 ram.renderVisual(r,visual);
 assert.equal(visual.group.visible,false);
 ram.removeVisual(visual,scene);
 const fresh=make().r;
 assert.equal(ram.snapshot(fresh).destroyed,false);
 assert.equal(ram.snapshot(fresh).hp,360);
});

test('AK-05b3 unflown or forged bow equipment contacts never damage genuine 140-man siege ram',()=>{
 const {b,r}=make();
 const nativeBlueBow=b.state.soldiers.find(u=>
   u.team==='blue'&&u.type==='bow'&&
   !b.state.squads[u.squadId].playerControlled);
 assert(nativeBlueBow);
 nativeBlueBow.x=-17;nativeBlueBow.z=-40.2;nativeBlueBow.siegeY=13.035;
 const from={x:nativeBlueBow.x,y:14.885,z:nativeBlueBow.z};
 const to={x:r.x,y:2.75,z:r.z};
 const solver=ballistics.create({map});
 const hp=r.hp;
 const fake=ram.hitByDefender(r,{soldierId:nativeBlueBow.id,
  weapon:'bow',damage:6,from,to,verifiedPost:true,ballistics:solver});
 assert.equal(fake.ok,false);
 assert.equal(r.hp,hp);
 const invalid=ram.hitByDefender(r,{soldierId:nativeBlueBow.id,
  weapon:'bow',damage:6,from,to,verifiedPost:true,ballistics:solver,
  projectileImpact:{kind:'equipment',weapon:'bow',equipmentId:'not-the-ram',
    id:3,point:to}});
 assert.equal(invalid.ok,false);
 assert.equal(r.hp,hp);
 assert.equal(ram.snapshot(r).physicalBowRamHits,0);
 assert.equal(ram.snapshot(r).defenderBowDamagePerImpact,6);
 assert.equal(r.scenario.gate.hp,600);
});
test('AK-05b3 equipment impact feedback flashes only after a recorded actual hit',()=>{
 const {r}=make();
 const scene=new THREE.Scene(),visual=ram.mountVisual(r,{THREE,scene});
 const initial=ram.renderVisual(r,visual);
 assert.equal(visual.wood.emissiveIntensity,0);
 r.lastEquipmentHitAt=r.state.elapsed;
 r.lastImpactWeapon='bow';
 ram.renderVisual(r,visual);
 assert(visual.wood.emissiveIntensity>0);
 r.state.elapsed+=.4;
 ram.renderVisual(r,visual);
 assert.equal(visual.wood.emissiveIntensity,0);
 assert.equal(ram.snapshot(r).defenderCanDamageRamImplemented,true);
 ram.removeVisual(visual,scene);
 assert.equal(scene.children.includes(visual.group),false);
});
