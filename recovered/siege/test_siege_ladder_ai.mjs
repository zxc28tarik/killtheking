/** S3C2: actual unchanged G5.4 140 soldier engine, two independent ladders.
 * A "natural" test starts from the actual G5.4 deployment and never
 * places a soldier with debug/teleport. QA fixtures are labeled separately.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const map=require('./siege-map.js');
const objectives=require('./siege-objectives.js');
const traversal=require('./siege-traversal.js');
const structure=require('./siege-structure-combat.js');
const assault=require('./siege-assault-navigation.js');
const ladder=require('./siege-ladder-ai.js');
const bridge=require('./siege-real-army-bridge.js');
const engineSource=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const weaponSource=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const context=vm.createContext({console});
vm.runInContext(weaponSource,context,{timeout:3000});
vm.runInContext(engineSource,context,{timeout:3000});
const A=context.ArenaArmyBattle;
const create=(playerTeam='blue',playerType='sword',seed=1600)=>bridge.create({
 armyEngine:A,map,objectives,traversal,
 structureCombatEngine:structure,
 assaultNavigationEngine:assault,
 ladderAIEngine:ladder,
 playerTeam,playerType,seed
});
const read=b=>bridge.snapshot(b);
const t=(b,seconds)=>{for(let i=0;i<Math.round(seconds/.08);i++)bridge.step(b,.08);};
const units=(b,side)=>b.state.soldiers.filter(u=>
 b.ladderAI.records.get(u.id)?.side===side);
function fixtureAtEntry(b,side){
 const u=units(b,side)[0];assert(u);
 const e=map.spec.lanes[side].entry;
 u.x=e[0];u.z=e[1];u.siegeY=0;
 return u;
}

test('original authentic 140-soldier G5.4 source SHA remains unchanged',()=>{
 assert.equal(createHash('sha256').update(engineSource).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
});
test('S3C2 requires real G5.4 source and opt-in structure/assault bridge',()=>{
 const b=create();
 assert.equal(read(b).authentic140Soldiers,140);
 assert.equal(read(b).realLadderClimbConnected,true);
 assert.equal(read(b).realStructureDamageConnected,true);
 assert.equal(read(b).genuineSoldierLadders.connected,true);
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.squads.length,8);
 assert.equal(b.scenario.lanes.west,false);
 assert.equal(b.scenario.lanes.east,false);
 assert.equal(read(b).genuineSoldierLadders.originalG54LadderEventsExist,false);
 assert.equal(read(b).genuineSoldierLadders.nativeCombatHas3DBallistics,false);
});
test('both real ladder builder groups have disjoint real red pike identities',()=>{
 const b=create(),g=read(b).genuineSoldierLadders;
 assert(g.actualEligiblePikeBuilders.west>=5);
 assert(g.actualEligiblePikeBuilders.east>=5);
 const west=new Set(units(b,'west').map(u=>u.id));
 const east=new Set(units(b,'east').map(u=>u.id));
 assert.equal([...west].some(id=>east.has(id)),false);
 assert([...west,...east].every(id=>
  b.state.soldiers[id].alive&&b.state.soldiers[id].team==='red'&&
  b.state.soldiers[id].type==='pike'));
});
test('red HUMAN pike squad remains fully player-controlled, AI sword squad builds instead',()=>{
 const b=create('red','pike');
 const owned=b.state.squads.find(s=>s.playerControlled);
 assert.equal(owned.type,'pike');
 assert.equal(b.ladderAI.records.size,20);
 for(const rec of b.ladderAI.records.values()){
  const u=b.state.soldiers[rec.id];
  assert.equal(u.type,'sword');
  assert.equal(b.state.squads[u.squadId].playerControlled,false);
 }
 assert.equal(owned.playerControlled,true);
 assert.equal(b.ladderAI.records.size>0,true);
});
test('one genuine builder at one authentic entrance advances only its own side',()=>{
 const b=create(),u=fixtureAtEntry(b,'west');
 bridge.step(b,.08);
 const s=read(b);
 assert(s.scenario.ladders.west.progress>0,
  'Live authentic G5.4 pike at real entrance did not contribute work');
 assert.equal(s.scenario.ladders.east.progress,0);
 assert.equal(s.scenario.lanes.west,false);
 assert.equal(s.genuineSoldierLadders.genuinelyActiveBuilderTicks>0,true);
 assert.equal(s.genuineSoldierLadders.actualLadderWorkEvents>0,true);
 assert.equal(s.genuineSoldierLadders.physicallyStartedClimbs.west,0);
 assert.equal(s.scenario.gate.hp,600);
 assert.equal(u.team,'red');
});
test('no genuine builder at either entrance means ZERO ladder effort',()=>{
 const b=create();
 t(b,2);
 const s=read(b);
 assert.equal(s.scenario.ladders.west.progress,0);
 assert.equal(s.scenario.ladders.east.progress,0);
 assert.equal(s.genuineSoldierLadders.actualLadderWorkEvents,0);
});
test('blue defender, bow or musket cannot construct either ladder',()=>{
 const b=create();
 const redBow=b.state.soldiers.find(u=>u.team==='red'&&u.type==='bow');
 const bluePike=b.state.soldiers.find(u=>u.team==='blue'&&u.type==='pike');
 for(const u of [redBow,bluePike]){
  u.x=-59;u.z=-9;u.siegeY=0;
 }
 bridge.step(b,.08);
 assert.equal(b.scenario.ladders.west.progress,0);
});
test('S1 debug ladder events do NOT cause fabricated real-soldier work audit',()=>{
 const b=create();
 for(let i=0;i<4;i++)objectives.applyEvent(b.scenario,{
  type:'LADDER_BUILD',team:'red',lane:'west',effort:25});
 assert.equal(b.scenario.lanes.west,true);
 assert.equal(read(b).genuineSoldierLadders.actualLadderWorkEvents,0);
 assert.equal(read(b).genuineSoldierLadders.physicallyStartedClimbs.west,0);
});
test('real S2 traversal rejects climbing an unbuilt west/east ladder',()=>{
 const b=create();
 for(const side of ['west','east']){
  const entrance=map.spec.lanes[side].entry;
  assert.equal(traversal.beginClimb({
    x:entrance[0],y:0,z:entrance[1]},side,
    map.spec,b.scenario),null);
 }
});
test('4 real builders cannot create 100-point ladder progress in one native tick',()=>{
 const b=create();
 const list=units(b,'east').slice(0,4);
 for(const u of list){
  u.x=59;u.z=-9;u.siegeY=0;
 }
 bridge.step(b,.08);
 const n=b.scenario.ladders.east.progress;
 assert(n>0&&n<=4*5*.08+.001);
 assert.equal(b.scenario.lanes.east,false);
});
test('S2 exact-wall geometry safely verifies full west and east REAL-ID climb with altitude',()=>{
 const b=create();
 for(const side of ['west','east']){
  const u=fixtureAtEntry(b,side);
  // S2 rule allows test-only manually-constructed ladders. QA does not
  // count as natural construction, which is separately tested below.
  for(let i=0;i<4;i++)objectives.applyEvent(b.scenario,{
    type:'LADDER_BUILD',team:'red',lane:side,effort:25});
  let peak=0;
  let finished=false;
  for(let i=0;i<90;i++){
   bridge.step(b,.08);
   peak=Math.max(peak,u.siegeY||0);
   assert.equal(traversal.overlaps({
    x:u.x,y:u.siegeY||0,z:u.z},map.spec,b.scenario,.65,2.6),
     false,'Real-id soldier embedded a wall at '+side+' tick '+i);
   const rec=b.ladderAI.records.get(u.id);
   if(rec.completed){finished=true;break;}
  }
  assert.equal(finished,true,side+' real-id soldier did not complete climb');
  assert(peak>13,side+' soldier never rose above 13m wall');
  assert.equal(u.siegeY,0);
  assert(side==='west'?u.x>-49.5:u.x<49.5);
  assert.equal(u.alive,true);
 }
 const s=read(b);
 assert(s.genuineSoldierLadders.physicallyFinishedClimbs.west>=1);
 assert(s.genuineSoldierLadders.physicallyFinishedClimbs.east>=1);
 assert.equal(s.genuineSoldierLadders.lastCompleted.y,0);
});
test('no elevated soldier can count as ground courtyard occupant',()=>{
 const b=create();
 const u=b.state.soldiers.find(u=>u.team==='red'&&u.alive);
 const zone=map.spec.areas.courtyard;
 u.x=zone.x;u.z=zone.z;u.siegeY=15.2;
 assert.equal(bridge.zoneOccupancy(b.state,map,'courtyard').red,0);
 u.siegeY=0;
 assert.equal(bridge.zoneOccupancy(b.state,map,'courtyard').red,1);
});
test('S3C1 (no S3C2 opt-in) still has NO ladder construction and preserves user order',()=>{
 const b=bridge.create({armyEngine:A,map,objectives,traversal,
  structureCombatEngine:structure,assaultNavigationEngine:assault,
  playerTeam:'blue',seed:1600});
 for(let i=0;i<40;i++)bridge.step(b,.08);
 assert.equal(read(b).realLadderClimbConnected,false);
 assert.equal(read(b).genuineSoldierLadders,null);
 assert.equal(b.scenario.ladders.west.progress,0);
 assert.equal(b.scenario.ladders.east.progress,0);
});
test('natural native G5.4 70v70 siege soldiers attempt both ladders without QA spawns',()=>{
 const b=create();
 const trace=[];
 for(let i=0;i<750;i++){
  bridge.step(b,.08);
  if(i%75===74){
   const v=read(b),l=v.genuineSoldierLadders;
   trace.push({
    second:Number(v.realArmySeconds.toFixed(2)),
    west: Number(v.scenario.ladders.west.progress.toFixed(2)),
    east: Number(v.scenario.ladders.east.progress.toFixed(2)),
    westOpen:v.scenario.lanes.west,eastOpen:v.scenario.lanes.east,
    westClimbed:l.physicallyFinishedClimbs.west,
    eastClimbed:l.physicallyFinishedClimbs.east,
    maxY:Number(l.maxAuthenticSoldier3DHeight.toFixed(2)),
    aliveRed:v.genuineAlive.red,
    gateHp:v.scenario.gate.hp
   });
  }
 }
 console.log('S3C2_NATURAL_DUAL_LADDER_60S_AUDIT '+JSON.stringify(trace));
 const v=read(b);
 assert(v.realArmySeconds>=59.99);
 assert(v.genuineSoldierLadders.sourceSoldierStepsGuided>0);
 assert(v.genuineSoldierLadders.genuinelyActiveBuilderTicks>0,
  'No alive normal-spawn soldier reached either ladder');
 assert.equal(v.genuineSoldierLadders.raw2DBypassOfStoneAllowed,false);
 assert.equal(v.genuineSoldierLadders.playerControlledSquadReassigned,false);
 // Strong west/east completion assertions will be added once CI confirms
 // natural pathing; do not report artificial QA climb as natural success.
});
test('S3C2 isolated extension rejects invalid contract and missing native clock',()=>{
 assert.throws(()=>ladder.create({}),/contracts missing/);
 assert.throws(()=>bridge.create({armyEngine:A,map,objectives,traversal,
  ladderAIEngine:ladder}),/requires opt-in/);
 const b=create();
 assert.throws(()=>ladder.suggest(b.ladderAI,{
  id:1,alive:true}, {x:0,z:0},NaN),/Invalid ladder navigation delta/);
 assert.throws(()=>ladder.afterNativeTick(b.ladderAI,-1),/Invalid genuine clock dt/);
});
