/* Kill the King S4A genuine blue role defenders; no mocked battle motor. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const map=require('./siege-map.js'),obj=require('./siege-objectives.js');
const traversal=require('./siege-traversal.js');
const structure=require('./siege-structure-combat.js');
const assault=require('./siege-assault-navigation.js');
const ladder=require('./siege-ladder-ai.js');
const capture=require('./siege-capture-ai.js');
const defend=require('./siege-defender-ai.js');
const bridge=require('./siege-real-army-bridge.js');
const nativeText=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const weaponText=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const c=vm.createContext({console});
vm.runInContext(weaponText,c,{timeout:3000});
vm.runInContext(nativeText,c,{timeout:3000});
const A=c.ArenaArmyBattle;
const create=(side='red',extra={})=>bridge.create({
 armyEngine:A,map,objectives:obj,traversal,
 playerTeam:side,seed:1600,
 structureCombatEngine:structure,assaultNavigationEngine:assault,
 ladderAIEngine:ladder,captureAIEngine:capture,
 defenderAIEngine:defend,...extra
});
const by=(b,team,role)=>b.state.soldiers.find(u=>u.team===team&&u.type===role);
test('historic G5.4 binary source is unchanged and all 140 original soldiers retained',()=>{
 assert.equal(createHash('sha256').update(nativeText).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 const b=create();
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.squads.length,8);
 assert.equal(bridge.snapshot(b).realDefenderRoleCoordinationConnected,true);
});
test('S4 is opt-in; legacy S3C3 must not inherit new defensive navigation',()=>{
 const b=bridge.create({
  armyEngine:A,map,objectives:obj,traversal,
  playerTeam:'red',seed:1600,
  structureCombatEngine:structure,assaultNavigationEngine:assault,
  ladderAIEngine:ladder,captureAIEngine:capture
 });
 assert.equal(b.defenderAI,null);
 assert.equal(bridge.snapshot(b).realDefenderRoleCoordinationConnected,false);
 assert.throws(()=>bridge.create({armyEngine:A,map,objectives:obj,traversal,
  defenderAIEngine:defend}),/requires real siege/);
});
test('blue bow/musket fall behind melee and walk only at native class speed',()=>{
 const b=create(),ai=b.defenderAI;
 const bow=by(b,'blue','bow'),musket=by(b,'blue','musket');
 const sword=by(b,'blue','sword'),pike=by(b,'blue','pike');
 const goals=Object.fromEntries([bow,musket,sword,pike].map(u=>[
  u.type,defend.goal('gate',u)]));
 assert(goals.bow.z>goals.sword.z);
 assert(goals.musket.z>goals.pike.z);
 for(const u of [bow,musket,sword,pike]){
  const from={x:u.x,z:u.z};
  const planned=defend.suggest(ai,u,from,.08);
  assert.equal(planned.kind,'defender');
  assert.equal(planned.phase,'gate');
  const travelled=Math.hypot(planned.x-from.x,planned.z-from.z);
  assert(travelled<=A.TYPES[u.type].speed*u.pace*.08+1e-8,
    'Defender exceeded original G5.4 soldier walking pace');
  assert.equal(traversal.overlaps({x:planned.x,y:0,z:planned.z},
   map.spec,b.scenario,.65,2.6),false);
 }
 assert.equal(defend.snapshot(ai).realG54SoldierHpAndReloadUnchanged,true);
});
test('player-controlled blue squad is never redirected or stripped of orders',()=>{
 const b=create('blue');
 const controlled=b.state.soldiers.filter(u=>b.state.squads[u.squadId].playerControlled);
 assert(controlled.length>0);
 const oldOrder=b.state.squads[controlled[0].squadId].order;
 const positions=controlled.map(u=>({id:u.id,x:u.x,z:u.z}));
 for(const u of controlled)
  assert.equal(defend.suggest(b.defenderAI,u,{x:u.x,z:u.z},.08),null);
 assert.deepEqual(controlled.map(u=>({id:u.id,x:u.x,z:u.z})),positions);
 assert.equal(b.state.squads[controlled[0].squadId].order,oldOrder);
 assert.equal(defend.snapshot(b.defenderAI).originalPlayerOwnedSquadCommandsProtected,true);
});
test('real red breach changes blue defense from gate to living courtyard protection',()=>{
 const b=create(),red=by(b,'red','sword'),defender=by(b,'blue','musket');
 assert.equal(defend.stage(b.defenderAI),'gate');
 red.x=0;red.z=-23;red.siegeY=0;
 assert.equal(defend.stage(b.defenderAI),'courtyard');
 const moved=defend.suggest(b.defenderAI,defender,
  {x:defender.x,z:defender.z},.08);
 assert.equal(moved?.phase,'courtyard');
 assert(moved.z>defender.z);
 assert.equal(b.scenario.phase,'APPROACH',
  'S4 must NEVER forge a siege objective phase');
});
test('real keep phase induces a second protective perimeter without capture spoof',()=>{
 const b=create(),u=by(b,'blue','bow');
 b.scenario.phase='KEEP'; // explicitly QA-only scenario phase control
 assert.equal(defend.stage(b.defenderAI),'keep');
 const plan=defend.suggest(b.defenderAI,u,{x:u.x,z:u.z},.08);
 assert.equal(plan?.phase,'keep');
 assert(defend.goal('keep',u).z>defend.goal('gate',u).z);
 assert.equal(b.scenario.capture.keep,0);
 assert.equal(b.state.soldiers.length,140);
});
test('nearby LIVE red attacker leaves close combat to unmodified native G5.4 AI',()=>{
 const b=create(),red=by(b,'red','sword'),blue=by(b,'blue','pike');
 red.x=blue.x+2;red.z=blue.z;
 const skipped=defend.suggest(b.defenderAI,blue,
  {x:blue.x,z:blue.z},.08);
 assert.equal(skipped,null);
 assert(defend.snapshot(b.defenderAI).nativeEngagementsLeftToG54AI>=1);
});
test('actual native G5.4 army tick advances guided blue soldiers without collision',()=>{
 const b=create(),old=by(b,'blue','bow');
 const from={x:old.x,z:old.z};
 for(let i=0;i<45;i++){
  if(b.scenario.phase==='RESULT')break;
  bridge.step(b,.08);
 }
 const v=bridge.snapshot(b),bow=by(b,'blue','bow');
 assert.equal(v.authentic140Soldiers,140);
 assert(v.realDefenderRoleCoordination.actualGuidedDefenderSteps>0);
 assert(v.realDefenderRoleCoordination.uniqueLivingG54DefenderIdsGuided>0);
 assert(Math.hypot(bow.x-from.x,bow.z-from.z)>.15);
 assert.equal(traversal.overlaps({x:bow.x,y:0,z:bow.z},
  map.spec,b.scenario,.65,2.6),false);
 assert.equal(v.realDefenderRoleCoordination.syntheticDamageOrZoneEvents,false);
 assert.equal(v.originalArmyAIModified,false);
});
test('failed contract and invalid movement deltas never create synthetic kills',()=>{
 assert.throws(()=>defend.create({}),/contracts missing/);
 const b=create(),u=by(b,'blue','musket');
 assert.throws(()=>defend.suggest(b.defenderAI,u,
  {x:u.x,z:u.z},NaN),/Invalid S4/);
 assert.throws(()=>defend.suggest(b.defenderAI,u,
  {x:u.x,z:u.z},.3),/Invalid S4/);
 assert.equal(b.state.playerKills,0);
 assert.equal(b.scenario.winner,null);
 assert.equal(b.scenario.gate.hp,600);
});
