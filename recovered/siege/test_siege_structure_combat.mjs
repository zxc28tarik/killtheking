/** Source-backed S3C1 gate damage QA.
 * Real 140 G5.4 soldiers in native engine, new siege-only structure action.
 * Tests with seeded QA soldier placements are NOT unassisted battlefield proof.
 */
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
const combat=require('./siege-structure-combat.js');
const source=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const balance=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const ctx=vm.createContext({console});
vm.runInContext(balance,ctx,{timeout:3000});
vm.runInContext(source,ctx,{timeout:3000});
const A=ctx.ArenaArmyBattle;
const create=(side='red',role='sword')=>bridge.create({
 armyEngine:A,map,objectives,traversal,
 structureCombatEngine:combat,seed:1600,playerType:role,playerTeam:side
});
const movedNearGate=(b,type='sword',team='red')=>{
 const u=b.state.soldiers.find(x=>x.type===type&&x.team===team);
 assert(u,'Test requires a genuine G5.4 soldier');
 // Placement is expressly QA, no false assertion of natural navigation.
 u.x=0;u.z=-43.8;u.facing=0;u.reload=0;
 assert.equal(traversal.overlaps({x:u.x,y:0,z:u.z},
   map.spec,b.scenario,.65,2.6),false);
 return u;
};
test('original G5.4 source remains SHA pinned; S3C1 source lives outside it',()=>{
 assert.equal(createHash('sha256').update(source).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 assert.equal(A.TYPES.pike.damage,19);
 assert.equal(A.TYPES.sword.damage,17);
 assert.equal(A.TYPES.pike.cooldown,1.9);
 assert.equal(A.TYPES.sword.cooldown,1.4);
});
test('S3C1 actual 140-actor castle starts with gate closed and real gate combat enabled',()=>{
 const b=create(),s=bridge.snapshot(b);
 assert.equal(s.authentic140Soldiers,140);
 assert.equal(s.genuineAlive.red,70);
 assert.equal(s.genuineAlive.blue,70);
 assert.equal(s.worldObstacleCount,15);
 assert.equal(s.realStructureDamageConnected,true);
 assert.equal(s.genuineSoldierGateStrikes.strikes,0);
 assert.equal(s.genuineSoldierGateStrikes.gateHp,600);
 assert.equal(s.genuineSoldierGateStrikes.nativeBuildingEventExistsInOriginalG54,false);
 assert.equal(s.realLadderClimbConnected,false);
});
test('a REAL living red sword soldier at actual gate exterior makes exactly native 17-damage strike',()=>{
 const b=create();
 const u=movedNearGate(b,'sword','red');
 const prior=b.scenario.gate.hp;
 bridge.step(b,.08); // authentic G5.4 native physics tick
 const audit=bridge.snapshot(b).genuineSoldierGateStrikes;
 assert.equal(b.state.tick,1);
 assert.equal(audit.strikes,1);
 assert.equal(prior-b.scenario.gate.hp,A.TYPES.sword.damage);
 assert.equal(u.reload,A.TYPES.sword.cooldown,
  'Siege swing must consume genuine melee reload');
 assert.equal(audit.events[0].soldierId,u.id);
 assert.equal(audit.events[0].weapon,'sword');
 assert.equal(audit.events[0].source,
  'NEW_S3C1_GATE_INTERACTION_FROM_NATIVE_SOLDIER_STATE');
 assert.equal(b.state.worldObstacles.length,15);
 assert.equal(b.scenario.phase,'APPROACH');
});
test('real red pike uses authentic 19 damage and 1.9s cooldown, not a new magic weapon',()=>{
 const b=create('blue');
 const p=movedNearGate(b,'pike','red');
 bridge.step(b,.08);
 const a=bridge.snapshot(b).genuineSoldierGateStrikes;
 assert.equal(a.strikes,1);
 assert.equal(b.scenario.gate.hp,581);
 assert.equal(p.reload,1.9);
 assert.equal(a.events[0].weapon,'pike');
});
test('real native clock must actually advance before gate damage (sub-frame anti-spam)',()=>{
 const b=create();
 movedNearGate(b,'sword','red');
 const old=b.scenario.gate.hp;
 bridge.step(b,.01);
 assert.equal(b.state.tick,0);
 assert.equal(b.scenario.gate.hp,old);
 assert.equal(bridge.snapshot(b).genuineSoldierGateStrikes.strikes,0);
 for(let i=0;i<7;i++)bridge.step(b,.01);
 assert.equal(b.state.tick,1);
 assert.equal(b.scenario.gate.hp,old-17);
});
test('a single genuine soldier cannot spam the gate faster than native weapon reload',()=>{
 const b=create();
 const sword=movedNearGate(b,'sword','red');
 bridge.step(b,.08);
 const hp=b.scenario.gate.hp;
 assert(sword.reload>1);
 for(let i=0;i<3;i++)bridge.step(b,.08);
 assert.equal(b.scenario.gate.hp,hp);
 assert.equal(bridge.snapshot(b).genuineSoldierGateStrikes.strikes,1);
});
test('blue defender cannot damage the gate even if a real blue sword is next to it',()=>{
 const b=create('blue');
 movedNearGate(b,'sword','blue');
 bridge.step(b,.08);
 assert.equal(b.scenario.gate.hp,600);
 assert.equal(bridge.snapshot(b).genuineSoldierGateStrikes.strikes,0);
});
test('red archer and musket cannot use ranged attack through stone on gate',()=>{
 const b=create('blue');
 movedNearGate(b,'bow','red');
 movedNearGate(b,'musket','red');
 bridge.step(b,.08);
 assert.equal(b.scenario.gate.hp,600);
 assert.equal(bridge.snapshot(b).genuineSoldierGateStrikes.rangedCanDamageGate,false);
});
test('facing away, outside melee range and behind gate never produce damage',()=>{
 for(const [x,z,facing] of [[0,-60,0],[0,-43.8,Math.PI],[0,-35,Math.PI],
  [20,-43.8,0]]){
   const b=create('blue');
   const u=b.state.soldiers.find(t=>t.team==='red'&&t.type==='sword');
   u.x=x;u.z=z;u.facing=facing;u.reload=0;
   bridge.step(b,.08);
   assert.equal(b.scenario.gate.hp,600,'Invalid gate swing '+[x,z,facing]);
 }
});
test('S3C1 clips actual native soldier movement against real stone, not just raycast',()=>{
 const b=create('blue');
 let blocked=0;
 for(let i=0;i<130;i++)bridge.step(b,.08);
 blocked=bridge.snapshot(b).terrainBlockedSoldierMoves;
 for(const u of b.state.soldiers.filter(s=>s.alive))
   assert.equal(traversal.overlaps({x:u.x,y:0,z:u.z},
    map.spec,b.scenario,.65,2.6),false,'Native soldier embedded in castle '+u.id);
 assert.equal(b.state.soldiers.length,140);
 assert(Number.isInteger(blocked)&&blocked>=0);
});
test('normal starting positions move under native AI with NO fixture gate damage initially',()=>{
 const b=create('blue');
 for(let i=0;i<25;i++)bridge.step(b,.08);
 const v=bridge.snapshot(b);
 assert(v.genuinelyMovedSoldierTicks>0);
 assert.equal(v.genuineSoldierGateStrikes.strikes,0);
 assert.equal(v.scenario.gate.hp,600);
 assert.equal(v.scenario.phase,'APPROACH');
});
test('an empty/no-stamped soldier attack ledger never claims native G5.4 structure events',()=>{
 const b=create();
 const first=bridge.snapshot(b).genuineSoldierGateStrikes;
 assert.equal(first.nativeBuildingEventExistsInOriginalG54,false);
 assert.equal(first.finalizedGateBalanceApproved,false);
 assert.equal(first.strikes,0);
 assert.equal(first.events.length,0);
});
test('reject untrusted missing authentic engine or wrong gate definition',()=>{
 assert.throws(()=>combat.create({}),/contracts missing/);
 assert.throws(()=>bridge.create({armyEngine:A,map,objectives,traversal,
   structureCombatEngine:{create(){}},playerTeam:'red'}),/Missing authentic/);
});
test('S3C1 optional plugin leaves historic S3B candidate with gate auto combat OFF',()=>{
 const b=bridge.create({armyEngine:A,map,objectives,traversal,seed:1600});
 assert.equal(bridge.snapshot(b).realStructureDamageConnected,false);
 const u=b.state.soldiers.find(u=>u.team==='red'&&u.type==='sword');
 u.x=0;u.z=-43.8;u.facing=0;u.reload=0;
 bridge.step(b,.08);
 assert.equal(b.scenario.gate.hp,600,
   'Old S3B must NOT silently enable S3C1 siege combat');
});
