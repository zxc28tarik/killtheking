/** AK-04a genuine native G5.4 four friendly 10/25/15/20 squads. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const four=require('../army/modules/g54-four-squad-command.js');
const map=require('./siege-map.js'),obj=require('./siege-objectives.js');
const traversal=require('./siege-traversal.js');
const structure=require('./siege-structure-combat.js');
const assault=require('./siege-assault-navigation.js');
const ladder=require('./siege-ladder-ai.js');
const capture=require('./siege-capture-ai.js');
const defend=require('./siege-defender-ai.js');
const rampart=require('./siege-rampart-ai.js');
const ballistic=require('./siege-player-ballistics-3d.js');
const bridge=require('./siege-real-army-bridge.js');
const nativeText=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const weapon=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const c=vm.createContext({console});vm.runInContext(weapon,c,{timeout:3000});
vm.runInContext(nativeText,c,{timeout:3000});
const A=c.ArenaArmyBattle,W=c.ArenaWeaponBalance;
const make=(side='red',opts={})=>bridge.create({
 armyEngine:A,map,objectives:obj,traversal,
 seed:1600,playerTeam:side,playerType:'sword',
 fourSquadCommandEngine:four,...opts
});
const moduleOf=b=>b.multiSquadCommand;
const id=(b,type)=>b.state.squads.find(s=>
 s.team===b.state.playerTeam&&s.type===type).id;
const enemy=(b,type='sword')=>b.state.squads.find(s=>
 s.team!==b.state.playerTeam&&s.type===type).id;
const sq=(b,i)=>b.state.squads[i];
test('AK-04a original G5.4 source SHA and 140 real soldiers / 8 native squads unchanged',()=>{
 assert.equal(createHash('sha256').update(nativeText).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 const b=make(),m=four.snapshot(moduleOf(b));
 assert.equal(m.genuineSoldierCount,140);
 assert.equal(m.genuineSquadCount,8);
 assert.equal(m.visibleControlledSquadCount,4);
 assert.equal(m.physicalPlayerControlledSquadCount,1);
 assert.deepEqual([...m.authorizedFriendlySquadIds].map(i=>sq(b,i).type).sort(),
   ['bow','musket','pike','sword']);
 assert.equal(m.nativeG54SourceEdited,false);
 assert.equal(m.originalPlayerDamageAndWeaponAuthorityUnchanged,true);
});
test('red human can individually command real sword, pike, bow, and musket squads',()=>{
 const b=make(),m=moduleOf(b);
 for(const type of ['sword','pike','bow','musket']){
   four.select(m,id(b,type));
   const response=four.execute(m,{action:'order',value:'hold'});
   assert.equal(response.ok,true,type);
   assert.equal(response.accepted,1);
   assert.equal(sq(b,id(b,type)).order,'hold');
   assert.equal(response.results[0].squadId,id(b,type));
   assert.equal(four.snapshot(m).selectedSquadIds[0],id(b,type));
 }
 assert.equal(four.snapshot(m).accepted,4);
 assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
});
test('all-four tactical commands mutate four genuine native G5.4 orders/formations together',()=>{
 const b=make(),m=moduleOf(b);
 four.pickAll(m);
 let reply=four.execute(m,{action:'order',value:'charge'});
 assert.equal(reply.ok,true);
 assert.equal(reply.accepted,4);
 for(const i of m.authorized)assert.equal(sq(b,i).order,'charge');
 reply=four.execute(m,{action:'formation',value:'line'});
 assert.equal(reply.ok,true);
 for(const i of m.authorized)assert.equal(sq(b,i).formation,'line');
 assert.equal(four.snapshot(m).selectedSquadIds.length,4);
});
test('all-four firing is real ranged-only: bow/musket accepted, sword/pike denied',()=>{
 const b=make(),m=moduleOf(b);
 four.pickAll(m);
 const r=four.execute(m,{action:'fire',value:'volley'});
 assert.equal(r.ok,false);
 assert.equal(r.someAccepted,true);
 assert.equal(r.accepted,2);
 assert.equal(r.rejected,2);
 for(const type of ['bow','musket'])
   assert.equal(sq(b,id(b,type)).fireMode,'volley');
 for(const type of ['sword','pike'])
   assert.notEqual(sq(b,id(b,type)).fireMode,'volley');
});
test('opposing squad IDs, duplicates, empty and malformed squad selections fail closed',()=>{
 for(const side of ['red','blue']){
  const b=make(side),m=moduleOf(b);
  for(const targets of [[],[enemy(b)],[id(b,'sword'),enemy(b)],
    [id(b,'sword'),id(b,'sword')],[NaN],[-1],[100],['5']]){
   assert.throws(()=>four.select(m,targets),/distinct allied native/);
  }
  assert.throws(()=>four.execute(m,{action:'teleport',value:100}),/Unsupported/);
  assert.equal(sq(b,enemy(b)).order,'advance');
  assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
 }
});
test('each formation, native spacing, facing and destination reuses official G5.4 APIs',()=>{
 const b=make(),m=moduleOf(b);
 four.select(m,id(b,'pike'));
 assert.equal(four.execute(m,{action:'formation',value:'shield'}).ok,true);
 assert.equal(four.execute(m,{action:'spacing',value:1.25}).ok,true);
 assert.equal(sq(b,id(b,'pike')).spacingScale,1.25);
 assert.equal(four.execute(m,{action:'face',x:-30,z:-95}).ok,true);
 assert(Number.isFinite(sq(b,id(b,'pike')).lockedFacing));
 assert.equal(four.execute(m,{action:'clear-face'}).ok,true);
 assert.equal(sq(b,id(b,'pike')).lockedFacing,null);
 const loc=four.execute(m,{action:'position',x:-18,z:-94});
 assert.equal(loc.ok,true,loc.reason);
 assert.equal(sq(b,id(b,'pike')).routeGoal.x,-18);
 assert.equal(sq(b,id(b,'pike')).targetZ,-94);
 assert.equal(four.execute(m,{action:'clear-waypoints'}).ok,true);
});
test('real gate/solid wall destinations are rejected with no phantom soldier relocation',()=>{
 const b=make(),m=moduleOf(b);
 four.select(m,id(b,'sword'));
 const sq1=sq(b,id(b,'sword')),before={x:sq1.x,z:sq1.z,order:sq1.order};
 const r=four.execute(m,{action:'position',x:0,z:-40});
 assert.equal(r.ok,false);
 assert.match(r.reason,/blocked/);
 assert.deepEqual({x:sq1.x,z:sq1.z,order:sq1.order},before);
 assert.equal(b.scenario.gate.hp,600);
});
test('G5.4 scoped player order ownership prevents AI override and ALWAYS restores one physical player',()=>{
 const b=make(),m=moduleOf(b);
 const i=id(b,'pike');
 four.select(m,i);
 assert.equal(four.execute(m,{action:'order',value:'hold'}).ok,true);
 for(let j=0;j<60;j++){
  bridge.step(b,.08);
  assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
 }
 assert.equal(sq(b,i).order,'hold');
 assert.equal(four.snapshot(m).physicalPlayerControlledSquadCount,1);
 assert(four.snapshot(m).nativeCommandTicks>=60);
 assert.equal(b.state.playerSquadId,m.realOwnerId);
});
test('a throwing native G5.4 tick restores all delegated ownership without leaving ghost players',()=>{
 const b=make(),m=moduleOf(b);
 let onlyOnce=true;
 const actual=A.step;
 b.armyEngine={...A,step(...args){
  if(onlyOnce){onlyOnce=false;throw Error('QA native tick failed');}
  return actual(...args);
 }};
 assert.throws(()=>bridge.step(b,.08),/QA native tick failed/);
 assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
 assert.equal(four.snapshot(m).scopedAILeaseActive,false);
 bridge.step(b,.08);
 assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
});
test('blue human sees exactly four original friendly squads and same restricted command semantics',()=>{
 const b=make('blue'),m=moduleOf(b);
 assert.equal(four.snapshot(m).playerTeam,'blue');
 four.select(m,id(b,'bow'));
 assert.equal(four.execute(m,{action:'fire',value:'hold'}).ok,true);
 assert.equal(sq(b,id(b,'bow')).fireMode,'hold');
 assert.equal(sq(b,enemy(b,'bow')).fireMode,'free');
 assert.equal(b.state.soldiers.filter(u=>u.team==='red').length,70);
 assert.equal(b.state.soldiers.filter(u=>u.team==='blue').length,70);
});
test('four-squad command scope coexists with original live castle gate, ladders, capture and defender physics',()=>{
 const b=make('blue',{
  structureCombatEngine:structure,assaultNavigationEngine:assault,
  ladderAIEngine:ladder,captureAIEngine:capture,defenderAIEngine:defend,
  rampartAIEngine:rampart,weaponBalance:W,ballisticsAPI:ballistic
 }),m=moduleOf(b);
 four.pickAll(m);
 assert.equal(four.execute(m,{action:'order',value:'hold'}).ok,true);
 for(let j=0;j<32;j++)bridge.step(b,.08);
 const v=bridge.snapshot(b);
 assert.equal(v.multiSquadNativeCommandConnected,true);
 assert.equal(v.multiSquadNativeCommand.visibleControlledSquadCount,4);
 assert.equal(v.multiSquadNativeCommand.physicalPlayerControlledSquadCount,1);
 assert.equal(v.realRampart3DDefenderAIConnected,true);
 assert.equal(v.realDefenderRoleCoordinationConnected,true);
 assert.equal(v.genuineAlive.red<=70,true);
 assert.equal(v.genuineAlive.blue<=70,true);
 assert.equal(v.scenario.gate.hp<=600,true);
});
test('ended battle, zero native HP and destroyed native squads reject commands',()=>{
 const b=make(),m=moduleOf(b);
 four.select(m,id(b,'pike'));
 A.setPlayerHealth(b.state,0);
 assert.equal(four.execute(m,{action:'order',value:'charge'}).ok,false);
 A.setPlayerHealth(b.state,100);
 b.scenario.phase='RESULT';
 assert.equal(four.execute(m,{action:'order',value:'charge'}).ok,false);
 b.scenario.phase='APPROACH';
 const q=sq(b,id(b,'pike'));q.alive=0;
 assert.equal(four.execute(m,{action:'order',value:'charge'}).ok,false);
 assert.equal(four.snapshot(m).rejected,3);
});
test('native G5.4 open-field game can load SAME opt-in four-squad command contract',()=>{
 const state=A.create(1600,'sword','red');
 const fieldBridge={state,scenario:{phase:'APPROACH'}};
 const m=four.create({engine:A,bridge:fieldBridge,map});
 four.pickAll(m);
 assert.equal(four.execute(m,{action:'order',value:'hold'}).accepted,4);
 const before=state.playerSquadId;
 assert.equal(four.beginNativeTick(m),true);
 A.step(state,.08);
 assert.equal(four.endNativeTick(m),true);
 assert.equal(state.playerSquadId,before);
 assert.equal(state.squads.filter(s=>s.playerControlled).length,1);
});

test('AK-04a uncommanded pikes retain authentic automated ladder construction',()=>{
 const b=make('red',{
   structureCombatEngine:structure,assaultNavigationEngine:assault,
   ladderAIEngine:ladder,captureAIEngine:capture,defenderAIEngine:defend
 }),m=moduleOf(b);
 assert.deepEqual([...m.activeDelegates],[]);
 const pike=sq(b,id(b,'pike'));
 assert.equal(pike.playerControlled,false);
 assert.equal(four.beginNativeTick(m),true);
 assert.equal(pike.playerControlled,false,'Uncommanded allied pikes must remain native AI');
 assert.equal(sq(b,m.realOwnerId).playerControlled,true);
 assert.equal(four.endNativeTick(m),true);
 for(let i=0;i<24;i++)bridge.step(b,.08);
 assert.equal(pike.playerControlled,false);
 assert.equal(four.snapshot(m).uncommandedAlliedSquadsKeepOriginalAI,true);
});
test('AK-04a ordered red pikes no longer collide with automatic ladder AI authority',()=>{
 const b=make('red',{
   structureCombatEngine:structure,assaultNavigationEngine:assault,
   ladderAIEngine:ladder,captureAIEngine:capture,defenderAIEngine:defend
 }),m=moduleOf(b);
 four.select(m,id(b,'pike'));
 assert.equal(four.execute(m,{action:'order',value:'hold'}).ok,true);
 assert.equal(m.activeDelegates.size,1);
 const pike=sq(b,id(b,'pike'));
 for(let j=0;j<45;j++){
   bridge.step(b,.08);
   assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
 }
 assert.equal(pike.order,'hold');
 assert.equal(four.snapshot(m).humanCommandsTakePriorityOverNativeLadderAutomation,true);
 assert.equal(four.snapshot(m).physicalPlayerControlledSquadCount,1);
 assert.equal(b.state.soldiers.length,140);
});
