/** REAL pinned G5.4 source is evaluated in a VM: no mock army actors. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const map=require('./siege-map.js');
const traversal=require('./siege-traversal.js');
const objectives=require('./siege-objectives.js');
const bridge=require('./siege-real-army-bridge.js');
const source=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const balance=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const context=vm.createContext({console});
vm.runInContext(balance,context,{timeout:3000});
vm.runInContext(source,context,{timeout:3000});
const A=context.ArenaArmyBattle;
const make=(team='red',role='sword',seed=1600)=>bridge.create({
 armyEngine:A,map,objectives,traversal,playerTeam:team,playerType:role,seed
});
const hitGate=s=>{for(let i=0;i<4;i++)objectives.applyEvent(s,{
 type:'GATE_HIT',team:'red',weapon:'ram',damage:150});};

test('original true-side G5.4 army source SHA is unchanged and real',()=>{
 const hash=createHash('sha256').update(source).digest('hex');
 assert.equal(hash,'307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 assert.equal(Object.keys(A).length,72);
 assert.equal(typeof A.create,'function');
 assert.equal(typeof A.drainCombatEvents,'function');
});
test('real G5.4 creates 140 soldiers, 8 squads on real castle, both teams 70',()=>{
 const b=make(),v=bridge.snapshot(b);
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.squads.length,8);
 assert.deepEqual(b.initialDeployment,{red:70,blue:70});
 assert.equal(v.authentic140Soldiers,140);
 assert.deepEqual(v.genuineAlive,{red:70,blue:70});
 assert.equal(b.state.playerTeam,'red');
 assert.equal(b.state.worldObstacles.length,15);
 assert.equal(b.scenario.phase,'APPROACH');
});
test('both human sides and four roles retain original team squad ownership',()=>{
 const roles={musket:10,pike:25,bow:15,sword:20};
 for(const [team,role] of [['red','sword'],['blue','pike']]){
  const b=make(team,role);
  const player=b.state.squads.filter(s=>s.playerControlled);
  assert.equal(player.length,1);
  assert.equal(player[0].team,team);
  assert.equal(player[0].type,role);
  for(const side of ['red','blue'])for(const [type,n] of Object.entries(roles))
   assert.equal(b.state.soldiers.filter(u=>u.team===side&&u.type===type).length,n);
 }
});
test('all actual soldier spawns are finite, outside castle stone; IDs unique',()=>{
 const b=make();
 const ids=new Set();
 for(const u of b.state.soldiers){
  assert(Number.isFinite(u.x)&&Number.isFinite(u.z));
  assert.equal(traversal.overlaps({x:u.x,y:0,z:u.z},
    map.spec,b.scenario,.65,2.6),false,'Embedded soldier '+u.id);
  ids.add(u.id);
 }
 assert.equal(ids.size,140);
});
test('authentic engine obstacle schema uses real x,y,z,w,h,d,solid castle blocks',()=>{
 const b=make(),boxes=bridge.canonicalObstacles(map,b.scenario);
 assert.equal(boxes.length,15);
 assert(boxes.every(o=>o.solid&&o.h>0&&
  [o.x,o.y,o.z,o.w,o.h,o.d].every(Number.isFinite)));
 const gate=b.state.worldObstacles.find(x=>x.minX===-8&&x.maxX===8);
 assert(gate);
 assert.equal(gate.minZ,-42.5);
 assert.equal(A.worldLineBlocked(b.state,
  {x:0,y:1.85,z:-55},{x:0,y:1.85,z:-25}),true);
});
test('courtyard and keep counts are measured from actual alive soldier coordinates',()=>{
 const b=make();
 for(const zone of ['courtyard','keep']){
  const measured=bridge.zoneOccupancy(b.state,map,zone);
  const expected={red:0,blue:0},box=map.spec.areas[zone];
  for(const u of b.state.soldiers.filter(u=>u.alive))
   if(Math.abs(u.x-box.x)<=box.w/2&&Math.abs(u.z-box.z)<=box.d/2)
    expected[u.team]++;
  assert.deepEqual(measured,expected);
  assert.deepEqual(b.scenario.occupancy[zone],measured);
 }
});
test('real G5.4 engine advances soldier movement and source-authoritative tick',()=>{
 const b=make(),positions=b.state.soldiers.map(u=>({x:u.x,z:u.z}));
 for(let i=0;i<30;i++)bridge.step(b,.08);
 const v=bridge.snapshot(b);
 assert(v.realArmySeconds>0&&v.armyNativeTick>0);
 assert(v.genuinelyMovedSoldierTicks>0);
 assert(b.state.soldiers.some((u,i)=>
  u.x!==positions[i].x||u.z!==positions[i].z));
 assert.equal(A.snapshot(b.state).red,v.genuineAlive.red);
 assert.equal(A.snapshot(b.state).blue,v.genuineAlive.blue);
 assert.equal(b.state.combatEvents.length,0);
});
test('native army ticks must NOT invent gate hits, ladder work or attacking victory',()=>{
 const b=make();
 for(let i=0;i<35;i++)bridge.step(b,.08);
 assert.equal(b.scenario.gate.hp,600);
 assert.equal(b.scenario.phase,'APPROACH');
 assert.equal(b.scenario.winner,null);
 assert.equal(b.scenario.ladders.west.progress,0);
 assert.equal(b.scenario.ladders.east.progress,0);
 assert.equal(b.scenario.events.some(e=>e.type==='GATE_HIT'),false);
 assert.equal(bridge.snapshot(b).realStructureDamageConnected,false);
});
test('player-only order contract; enemy/ally AI commanders cannot be manually commanded',()=>{
 const b=make('blue','bow');
 assert.equal(bridge.command(b,'hold'),true);
 assert.equal(b.state.squads[b.state.playerSquadId].order,'hold');
 for(const u of b.state.squads.filter(s=>!s.playerControlled))
  assert.equal(A.issueOrder(b.state,u.id,'charge',true),false);
 assert.equal(bridge.command(b,'position',{x:0,z:-40}),false);
 assert.equal(bridge.command(b,'unrecognized'),false);
});
test('gate opened only by EXPLICIT S1 debug fixture updates original engine LOS and collider count',()=>{
 const b=make();
 hitGate(b.scenario);
 assert.equal(b.scenario.gate.open,true);
 assert.equal(b.state.worldObstacles.length,15);
 bridge.step(b,.08);
 assert.equal(b.state.worldObstacles.length,14);
 assert.equal(b.worldObstacleUpdates,2);
 assert.equal(bridge.snapshot(b).scenario.phase,'BREACH');
 assert.equal(bridge.snapshot(b).realStructureDamageConnected,false);
 const blocked=A.firstWorldObstacle(b.state,
  {x:0,y:1.85,z:-55},{x:0,y:0,z:1},35);
 assert.equal(blocked,null);
});
test('a copied snapshot cannot overwrite true G5.4 soldier totals or scenario',()=>{
 const b=make();
 const view=bridge.snapshot(b);
 view.genuineAlive.red=0;view.scenario.forces.red=0;
 assert.equal(b.scenario.forces.red,70);
 assert.equal(bridge.snapshot(b).genuineAlive.red,70);
});
test('reject invalid seeds, wrong player sides, unverified contracts and invalid ticks',()=>{
 assert.throws(()=>make('purple'),/Invalid user-selectable/);
 assert.throws(()=>make('red','wizard'),/Invalid user-selectable/);
 assert.throws(()=>make('red','sword',Infinity),/Invalid deterministic/);
 assert.throws(()=>bridge.create({armyEngine:{create(){return null}},
  map,objectives,traversal}),/Missing authentic/);
 const b=make();
 for(const dt of [-1,0,.26,NaN,Infinity])
  assert.throws(()=>bridge.step(b,dt),/Invalid/);
});
test('siege bridge is no-op over historical engine source and has NO fake structure authority',()=>{
 const s=readFileSync(new URL('./siege-real-army-bridge.js',import.meta.url),'utf8');
 for(const forbidden of ["type:'GATE_HIT'","type:'LADDER_BUILD'",
  'damageSoldier(','attackGate('])
  assert.equal(s.includes(forbidden),false);
 assert.equal(typeof A.step,'function');
});
