/** Genuine G5.4 140 soldier siege zone capture / contested keep endgame.
 * Real engine source executed in Node VM; S3C3 is opt-in and isolated.
 * Explicit QA positioning is called QA, not unassisted real army success.
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
const capture=require('./siege-capture-ai.js');
const bridge=require('./siege-real-army-bridge.js');
const src=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const weapon=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const c=vm.createContext({console});
vm.runInContext(weapon,c,{timeout:3000});
vm.runInContext(src,c,{timeout:3000});
const A=c.ArenaArmyBattle;
const create=({side='blue',role='sword',seed=1600,scenario}={})=>bridge.create({
 armyEngine:A,map,objectives,traversal,
 structureCombatEngine:structure,assaultNavigationEngine:assault,
 ladderAIEngine:ladder,captureAIEngine:capture,
 playerTeam:side,playerType:role,seed,scenario
});
const view=b=>bridge.snapshot(b);
const progress=(b,n,dt=.08)=>{for(let i=0;i<n;i++){
 if(b.scenario.phase==='RESULT')break;
 bridge.step(b,dt);
}};
test('exact original G5.4 140-soldier source stays byte-identical for S3C3',()=>{
 assert.equal(createHash('sha256').update(src).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
});
test('S3C3 is optional, attached only with authentic ladder and gate simulation',()=>{
 const b=create(),s=view(b);
 assert.equal(s.authentic140Soldiers,140);
 assert.equal(s.realObjectiveCaptureConnected,true);
 assert.equal(s.realLadderClimbConnected,true);
 assert.equal(s.realStructureDamageConnected,true);
 assert.equal(s.realObjectiveCaptureNavigation.forgeVictoryOrCasualties,false);
 assert.equal(s.realObjectiveCaptureNavigation.realHPAndCombatFromOriginalG54,true);
 assert.equal(s.scenario.phase,'APPROACH');
 assert.equal(s.scenario.capture.courtyard,0);
 assert.equal(s.scenario.capture.keep,0);
 assert.equal(s.scenario.winner,null);
 assert.equal(s.realSquads.length,8);
});
test('S3C3 cannot attach without genuine S3C2 two-ladder bridge',()=>{
 assert.throws(()=>bridge.create({
  armyEngine:A,map,objectives,traversal,captureAIEngine:capture
 }),/needs authentic S3C2/);
 assert.throws(()=>capture.create({}),/contracts missing/);
});
test('closed gate and unbuilt ladders forbid any fake attacker entry objective routing',()=>{
 const b=create();
 const u=b.state.soldiers.find(x=>x.team==='red'&&x.type==='sword');
 const proposed=capture.suggest(b.captureAI,u,{x:u.x,z:u.z},.08);
 assert.equal(proposed,null);
 assert.equal(view(b).realObjectiveCaptureNavigation.distinctNativeIdsGuided,0);
});
test('red human commander-owned AI squad is NEVER reassigned by capture navigation',()=>{
 const b=create({side:'red',role:'sword'});
 const humans=b.state.soldiers.filter(u=>b.state.squads[u.squadId].playerControlled);
 assert.equal(humans.length,20);
 for(const u of humans){
  const goal=capture.suggest(b.captureAI,u,{x:u.x,z:u.z},.08);
  assert.equal(goal,null);
 }
 const audit=view(b).realObjectiveCaptureNavigation;
 assert.equal(audit.playerSquadProtected,true);
 assert.equal(audit.restrictedPlayerSteps,undefined);
});
test('physically elevated REAL ladder soldier cannot fake ground courtyard capture',()=>{
 const b=create();
 const soldier=b.state.soldiers.find(u=>u.team==='red'&&u.alive);
 const court=map.spec.areas.courtyard;
 soldier.x=court.x;soldier.z=court.z;soldier.siegeY=15.2;
 assert.equal(bridge.zoneOccupancy(b.state,map,'courtyard').red,0);
 assert.equal(capture.suggest(b.captureAI,soldier,
  {x:soldier.x,z:soldier.z},.08),null);
});
test('genuine S3C2 completed climber is eligible for S3C3 courtyard route',()=>{
 const b=create();
 const u=[...b.ladderAI.records.values()].map(rec=>b.state.soldiers[rec.id])[0];
 const rec=b.ladderAI.records.get(u.id);
 // QA scenario must have a real S1 open lane; simply editing an AI
 // record never establishes a physically opened siege entry.
 for(let i=0;i<4;i++)objectives.applyEvent(b.scenario,{
  type:'LADDER_BUILD',team:'red',lane:'west',effort:25});
 rec.completed=true;rec.stage='inside';
 u.x=-44;u.z=-9;u.siegeY=0;
 const proposed=capture.suggest(b.captureAI,u,{x:u.x,z:u.z},.08);
 // Closed gate is irrelevant once an actual 3D ladder has been climbed.
 assert.equal(proposed?.kind,'capture');
 assert(proposed.x>u.x);
 assert(proposed.x-u.x<=A.TYPES[u.type].speed*u.pace*.08+1e-9);
 assert.equal(b.scenario.gate.open,false);
});
test('after real gate breach, genuine soldier at staging must advance INSIDE (never idle)',()=>{
 const b=create();
 for(let i=0;i<4;i++)objectives.applyEvent(b.scenario,{
  type:'GATE_HIT',team:'red',weapon:'ram',damage:150});
 const u=b.state.soldiers.find(u=>u.team==='red'&&u.type==='sword');
 u.x=0;u.z=-53;u.siegeY=0;
 const movement=capture.suggest(b.captureAI,u,{x:u.x,z:u.z},.08);
 assert.equal(movement?.kind,'capture');
 assert(movement.z>u.z,'G5.4 assault soldier stuck at open-gate rally');
 assert(movement.z-u.z<=A.TYPES[u.type].speed*u.pace*.08+1e-8);
 assert.equal(movement.goal,'THROUGH_AUTHENTIC_OPEN_GATE');
});
test('no forced victory if a real living defender is inside contested courtyard',()=>{
 const s=objectives.createScenario();
 for(let i=0;i<4;i++)objectives.applyEvent(s,{
  type:'GATE_HIT',team:'red',weapon:'ram',damage:150});
 for(let i=0;i<4;i++)objectives.applyEvent(s,{type:'LADDER_BUILD',
  team:'red',lane:'west',effort:25});
 assert.equal(s.phase,'BREACH');
 objectives.applyEvent(s,{type:'ZONE_PRESENCE',zone:'courtyard',red:2,blue:1});
 for(let i=0;i<200;i++)objectives.step(s,.08);
 assert.equal(s.capture.courtyard,0);
 assert.equal(s.phase,'BREACH');
 assert.equal(s.winner,null);
});
test('courtyard capture resets after a living blue defender contests again',()=>{
 const s=objectives.createScenario();
 for(let i=0;i<4;i++)objectives.applyEvent(s,{
  type:'GATE_HIT',team:'red',weapon:'ram',damage:150});
 for(let i=0;i<100;i++)objectives.step(s,.08);
 // Have one real red ground occupant, no blue: S1 FSM accrues real time.
 objectives.applyEvent(s,{type:'ZONE_PRESENCE',zone:'courtyard',red:1,blue:0});
 for(let i=0;i<80;i++)objectives.step(s,.08);
 assert(s.capture.courtyard>6);
 objectives.applyEvent(s,{type:'ZONE_PRESENCE',zone:'courtyard',red:1,blue:1});
 objectives.step(s,.08);
 assert.equal(s.capture.courtyard,0);
 assert.equal(s.phase,'BREACH');
});
test('S1 capture FSM requires full genuine uncontested 12s courtyard and 20s keep',()=>{
 const s=objectives.createScenario();
 for(let i=0;i<4;i++)objectives.applyEvent(s,{
  type:'GATE_HIT',team:'red',weapon:'ram',damage:150});
 objectives.applyEvent(s,{type:'ZONE_PRESENCE',zone:'courtyard',red:1,blue:0});
 for(let i=0;i<149;i++)objectives.step(s,.08);
 assert.equal(s.winner,null);
 assert.equal(s.phase,'COURTYARD');
 objectives.step(s,.08);
 assert.equal(s.phase,'KEEP');
 objectives.applyEvent(s,{type:'ZONE_PRESENCE',zone:'keep',red:1,blue:1});
 for(let i=0;i<300;i++)objectives.step(s,.08);
 assert.equal(s.capture.keep,0);
 assert.equal(s.winner,null);
 objectives.applyEvent(s,{type:'ZONE_PRESENCE',zone:'keep',red:1,blue:0});
 for(let i=0;i<250;i++)objectives.step(s,.08);
 assert.equal(s.phase,'RESULT');
 assert.equal(s.winner,'red');
 assert.equal(s.resultReason,objectives.SUCCESS.ATTACKER_KEEP);
});
test('an actually shortened TEST siege can end by defender holding time (no fake kills)',()=>{
 const s=objectives.createScenario({durationSeconds:9});
 const b=create({scenario:s});
 progress(b,130);
 assert.equal(b.scenario.phase,'RESULT');
 assert.equal(view(b).scenario.winner,'blue');
 assert.equal(view(b).scenario.resultReason,objectives.SUCCESS.DEFENDER_TIME);
 assert.equal(view(b).genuineAlive.red,70);
 assert.equal(view(b).genuineAlive.blue,70);
});
test('S3C2 remains opt-in independent of S3C3 living zone capture AI',()=>{
 const b=bridge.create({armyEngine:A,map,objectives,traversal,
  structureCombatEngine:structure,
  assaultNavigationEngine:assault,ladderAIEngine:ladder,
  playerTeam:'blue',seed:1600});
 assert.equal(view(b).realObjectiveCaptureConnected,false);
 assert.equal(view(b).realObjectiveCaptureNavigation,null);
 progress(b,100);
 assert.equal(view(b).realLadderClimbConnected,true);
});
test('no source modifications, no debug fake casualty/victory/occupancy in capture adapter',()=>{
 const s=readFileSync(new URL('./siege-capture-ai.js',import.meta.url),'utf8');
 for(const forbidden of ["type:'FORCE_COUNTS'","type:'ZONE_PRESENCE'",
  "type:'MATCH_FINISH'","damageSoldier(","attackGate("])
  assert.equal(s.includes(forbidden),false,forbidden);
});
test('natural native 140 G5.4 soldier match: trace authentic captured zones and winner over 240 game seconds',()=>{
 const b=create();
 const trace=[];
 for(let i=0;i<3000;i++){
  if(b.scenario.phase==='RESULT')break;
  bridge.step(b,.08);
  if(i%300===299){
   const s=view(b);
   trace.push({
    sec:Number(s.realArmySeconds.toFixed(1)),
    phase:s.scenario.phase,
    court:s.scenario.occupancy.courtyard,
    keep:s.scenario.occupancy.keep,
    courtHold:s.scenario.capture.courtyard,
    keepHold:s.scenario.capture.keep,
    gate:s.scenario.gate.hp,
    red:s.genuineAlive.red,blue:s.genuineAlive.blue,
    nav:s.realObjectiveCaptureNavigation.enteredCourtyardSoldierIds,
    keepNav:s.realObjectiveCaptureNavigation.enteredKeepSoldierIds,
    winner:s.scenario.winner
   });
  }
 }
 const s=view(b);
 console.log('S3C3_NATURAL_240_G54_REAL_MATCH '+JSON.stringify({trace,
  final:{phase:s.scenario.phase,winner:s.scenario.winner,
   reason:s.scenario.resultReason,alive:s.genuineAlive,
   nav:s.realObjectiveCaptureNavigation,
   court:s.scenario.occupancy.courtyard,
   keep:s.scenario.occupancy.keep,
   clock:s.scenario.clock,
   liveBySquad:b.state.squads.map(squad=>({
     team:squad.team,type:squad.type,alive:squad.alive,
     meanX:Number((b.state.soldiers.filter(u=>u.alive&&u.squadId===squad.id)
       .reduce((n,u)=>n+u.x,0)/Math.max(1,squad.alive)).toFixed(1)),
     meanZ:Number((b.state.soldiers.filter(u=>u.alive&&u.squadId===squad.id)
       .reduce((n,u)=>n+u.z,0)/Math.max(1,squad.alive)).toFixed(1))
   }))
 }}));
 assert(s.realArmySeconds>=20);
 assert(s.realObjectiveCaptureNavigation.genuineSoldierGuideSteps>0);
 assert(s.realObjectiveCaptureNavigation.enteredCourtyardSoldierIds>0);
 assert(s.genuineSoldierLadders.physicallyFinishedClimbs.west>0);
 assert(s.genuineSoldierLadders.physicallyFinishedClimbs.east>0);
 assert.equal(s.realObjectiveCaptureNavigation.forgeVictoryOrCasualties,false);
 assert.equal(s.originalArmyAIModified,false);
});
