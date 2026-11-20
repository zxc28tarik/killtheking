/* S3D2c: first actual 3D PLAYER castle line-of-fire & delayed arrows.
 * Real S1 boxes, native geometry and G5.4 HP authority are individually
 * verified. No mock "hit percentage" or automatic target substitution.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const map=require('./siege-map.js');
const physics=require('./siege-player-ballistics-3d.js');
const combat=require('./siege-player-combat.js');
const objectives=require('./siege-objectives.js');
const traversal=require('./siege-traversal.js');
const bridge=require('./siege-real-army-bridge.js');
const structure=require('./siege-structure-combat.js');
const assault=require('./siege-assault-navigation.js');
const ladders=require('./siege-ladder-ai.js');
const capture=require('./siege-capture-ai.js');
function fake(){
 const soldiers=Array.from({length:140},(_,i)=>({
  id:i,team:i<70?'red':'blue',type:i<70?'sword':'musket',
  alive:true,x:90+(i%4)*3,z:65+(i%10)*.2,
  siegeY:0,hp:100,maxHp:100
 }));
 return {soldiers};
}
const start={x:0,y:2.35,z:-49},forward={x:0,y:0,z:1};
const scenarios=()=>({gate:{open:false}});
const take=(state,scenario=scenarios(),from=start,aim=forward)=>
 physics.create({map}).musket({
  state,scenario,from,aim,team:'red',range:100});
const solve=(state,scenario=scenarios())=>physics.create({map});
test('actual S1 closed gate blocks 3D musket, open gate reveals genuine target',()=>{
 const state=fake(),s=scenarios(),target=state.soldiers[70];
 target.x=0;target.z=-34;
 const closed=take(state,s);
 assert.equal(closed.kind,'castle');
 assert.equal(closed.colliderId,'gate-main');
 s.gate.open=true;
 const open=take(state,s);
 assert.equal(open.kind,'soldier');
 assert.equal(open.targetId,target.id);
 assert.equal(open.zone,'body');
 assert.equal(open.friendly,false);
});
test('elevated G5.4 siegeY shifts hit volume; lower shooter cannot hit ghost at ground',()=>{
 const state=fake(),s=scenarios(),t=state.soldiers[70];
 s.gate.open=true;t.x=0;t.z=-32;t.siegeY=15.2;
 assert.equal(take(state,s),null);
 const elevated=take(state,s,{x:0,y:17.55,z:-49});
 assert.equal(elevated.kind,'soldier');
 assert.equal(elevated.targetId,t.id);
 assert.equal(elevated.zone,'body');
 assert.equal(elevated.point.y,17.55);
});
test('friendly body intercepts musket first and never becomes a damaged enemy',()=>{
 const state=fake(),s=scenarios(),ally=state.soldiers[0],enemy=state.soldiers[70];
 s.gate.open=true;ally.x=0;ally.z=-38;enemy.x=0;enemy.z=-30;
 const hit=take(state,s);
 assert.equal(hit.kind,'soldier');
 assert.equal(hit.friendly,true);
 assert.equal(hit.targetId,ally.id);
 assert.equal(ally.hp,100);
 assert.equal(enemy.hp,100);
});
test('real wall/platform collision beats soldier on its far side',()=>{
 const state=fake(),s=scenarios(),target=state.soldiers[70];
 target.x=-49;target.z=6;target.siegeY=0;
 const hit=take(state,s,{x:-70,y:2.35,z:6},{x:1,y:0,z:0});
 assert.equal(hit.kind,'castle');
 assert.equal(hit.colliderId,'west-wall');
});
test('physical arrow travels 70m/s and gravity22, hits near open-gate body later',()=>{
 const state=fake(),s=scenarios(),target=state.soldiers[70];
 s.gate.open=true;target.x=0;target.z=-37;
 const ball=solve(state,s);
 const arrow=ball.launch({state,scenario:s,from:start,aim:forward,
   team:'red',range:90,charge:1});
 assert.equal(arrow.id,1);
 assert.equal(ball.status().activePlayerArrows,1);
 assert.equal(ball.status().playerArrowFlightSpeed,70);
 assert.equal(ball.advance({state,scenario:s,dt:.05}).length,0);
 const impacts=ball.advance({state,scenario:s,dt:.15});
 assert.equal(impacts.length,1);
 assert.equal(impacts[0].kind,'soldier');
 assert.equal(impacts[0].targetId,target.id);
 assert.equal(ball.status().activePlayerArrows,0);
 assert.equal(ball.status().totalProjectileImpacts,1);
 assert.equal(target.hp,100,'Solver MUST NOT fake native damage itself');
});
test('arrow falls into closed gate and never passes into courtyard',()=>{
 const state=fake(),s=scenarios(),target=state.soldiers[70];
 target.x=0;target.z=-32;
 const ball=solve(state,s);
 ball.launch({state,scenario:s,from:start,aim:forward,
   team:'red',range:90,charge:.7});
 let impacts=[];
 for(let i=0;i<10&&!impacts.length;i++)
   impacts=ball.advance({state,scenario:s,dt:.05});
 assert.equal(impacts.length,1);
 assert.equal(impacts[0].kind,'castle');
 assert.equal(impacts[0].colliderId,'gate-main');
 assert.equal(target.hp,100);
 assert.equal(ball.status().castleOrGroundBlocks,1);
});
test('arrow at real 15.2m siege soldier height can hit while ground-level ray misses',()=>{
 const state=fake(),s=scenarios(),target=state.soldiers[70];
 s.gate.open=true;target.x=0;target.z=-34;target.siegeY=15.2;
 const ball=solve(state,s),from={x:0,y:17.55,z:-49};
 ball.launch({state,scenario:s,from,aim:forward,team:'red',range:90,charge:1});
 let impacts=[];
 for(let i=0;i<10&&!impacts.length;i++)
   impacts=ball.advance({state,scenario:s,dt:.05});
 assert.equal(impacts[0]?.targetId,target.id);
 assert.equal(ball.status().elevatedSoldierIntersections,1);
});
test('3D projectile never damages friendly target and never changes native state unauthorised',()=>{
 const state=fake(),s=scenarios(),ally=state.soldiers[0],enemy=state.soldiers[70];
 s.gate.open=true;ally.x=0;ally.z=-38;enemy.x=0;enemy.z=-28;
 const ball=solve(state,s);
 ball.launch({state,scenario:s,from:start,aim:forward,team:'red',range:90,charge:1});
 let hits=[];
 for(let i=0;i<10&&!hits.length;i++)
   hits=ball.advance({state,scenario:s,dt:.05});
 assert.equal(hits[0].friendly,true);
 assert.equal(ally.hp,100);
 assert.equal(enemy.hp,100);
});
test('bad 3D inputs and insufficient 140 native soldiers fail closed',()=>{
 const state=fake(),s=scenarios();
 assert.throws(()=>physics.trace({state:{soldiers:[]},map,
   scenario:s,from:start,to:{x:0,y:2,z:-40},team:'red'}),/genuine 140/);
 const ball=solve(state,s);
 assert.throws(()=>ball.advance({state,scenario:s,dt:NaN}),/Invalid/);
 assert.throws(()=>ball.launch({state,scenario:s,from:start,
   aim:{x:0,y:0,z:0},team:'red',range:90,charge:1}),/Zero/);
 assert.equal(ball.status().playerArrowsLaunched,0);
});
const g54Source=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const weaponSource=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const ctx=vm.createContext({console});
vm.runInContext(weaponSource,ctx,{timeout:3000});
vm.runInContext(g54Source,ctx,{timeout:3000});
const G54=ctx.ArenaArmyBattle,W=ctx.ArenaWeaponBalance;
function native(){
 const b=bridge.create({
  armyEngine:G54,map,objectives,traversal,
  playerTeam:'red',seed:1600,
  structureCombatEngine:structure,
  assaultNavigationEngine:assault,
  ladderAIEngine:ladders,
  captureAIEngine:capture
 });
 const ball=physics.create({map});
 const human=combat.create({bridge:b,engine:G54,balance:W,ballistics:ball});
 for(const u of b.state.soldiers){
  // Controlled fixture: authentic G5.4 native records, never a dummy victim.
  u.x=u.team==='red'?95:100;u.z=u.team==='red'?-112:40;
  u.siegeY=0;
 }
 return {b,ball,human};
}
const pose=(y=0)=>({view:'fps',team:'red',position:{x:0,y,z:-49},
  yaw:0,pitch:0,climbing:false,airborne:false,sliding:false});
function openGate(b){
 for(let i=0;i<4;i++)
  objectives.applyEvent(b.scenario,{type:'GATE_HIT',team:'red',weapon:'ram',damage:150});
 bridge.refreshObstacles(b);
}
test('genuine G5.4 musket damages elevated enemy by source player and original damage table',()=>{
 const {b,human}=native(),enemy=b.state.soldiers.find(u=>u.team==='blue');
 openGate(b);enemy.x=0;enemy.z=-33;enemy.siegeY=15.2;
 combat.sync(human,pose(15.2));
 combat.setWeapon(human,'musket');
 const hit=combat.trigger(human);
 assert.equal(hit.status,'hit');
 assert.equal(hit.targetId,enemy.id);
 assert.equal(hit.damage,90);
 assert.equal(enemy.hp,enemy.maxHp-90);
 assert.equal(combat.snapshot(human).real3dBulletAndArrowBallistics,true);
 assert.equal(b.state.combatEvents.at(-1).source,'player');
});
test('genuine G5.4 physical player arrow delays damage until native elapsed time',()=>{
 const {b,human}=native(),enemy=b.state.soldiers.find(u=>u.team==='blue');
 openGate(b);enemy.x=0;enemy.z=-37;
 combat.sync(human,pose());
 combat.setWeapon(human,'bow');
 assert.equal(combat.beginBow(human).status,'drawing');
 b.state.elapsed=3;
 const fired=combat.releaseBow(human);
 assert.equal(fired.status,'arrow-launched');
 assert.equal(enemy.hp,enemy.maxHp);
 b.state.elapsed+=.05;combat.receive(human);
 assert.equal(enemy.hp,enemy.maxHp);
 b.state.elapsed+=.15;combat.receive(human);
 const outcomes=combat.drainProjectileEvents(human);
 assert.equal(outcomes.length,1);
 assert.equal(outcomes[0].status,'hit');
 assert.equal(outcomes[0].sourceProjectileImpact,true);
 assert(outcomes[0].damage>0);
 assert.equal(b.state.combatEvents.at(-1).source,'player');
 assert.equal(combat.snapshot(human).attempts,1);
});
test('native player bow 2s minimum/4s cadence and 15s musket remain enforced after 3D opt-in',()=>{
 const {b,human}=native();
 combat.sync(human,pose());
 combat.setWeapon(human,'bow');
 combat.beginBow(human);
 b.state.elapsed=1.9;
 assert.equal(combat.releaseBow(human).status,'bow-not-ready');
 assert.equal(combat.snapshot(human).attempts,0);
 combat.beginBow(human);b.state.elapsed=4.6;
 assert.equal(combat.releaseBow(human).status,'arrow-launched');
 assert.equal(combat.beginBow(human).status,'bow-recovery');
 combat.setWeapon(human,'musket');
 assert.equal(combat.trigger(human).weapon,'musket');
 assert.equal(combat.trigger(human).status,'cooldown');
 assert.equal(W.SHOT_INTERVAL.musket,15);
 assert.equal(W.BOW_MIN_DRAW_SECONDS,2);
});
test('native guard for melee at elevated wall remains conservative',()=>{
 const {human}=native();
 combat.sync(human,pose(15.2));
 combat.setWeapon(human,'sword');
 assert.equal(combat.trigger(human).status,'unsupported-height');
});

test('AK-05b3 opt-in physical bow crosses real distance before hitting live wooden ram',()=>{
 const state=fake(),scenario=scenarios(),solver=physics.create({map});
 const equipment={id:'ak05-ram-body',x:0,y:0,z:-73,w:5.5,d:7.3,h:4.35,solid:true};
 assert.equal(solver.status().siegeEquipmentProviderActive,false);
 assert.equal(solver.setEquipmentCollider(()=>equipment),true);
 const from={x:0,y:14.885,z:-40.2};
 const arrow=solver.launch({state,scenario,from,
  aim:{x:0,y:-9.2,z:-33},team:'blue',charge:.55,range:90});
 assert(arrow?.id>0);
 assert.equal(solver.status().authenticPhysicalSiegeEquipmentContacts,0);
 assert.equal(solver.advance({state,scenario,dt:.06}).length,0);
 let impacts=[];
 for(let i=0;i<30&&!impacts.length;i++)
   impacts=solver.advance({state,scenario,dt:.025});
 assert.equal(impacts.length,1);
 assert.equal(impacts[0].kind,'equipment');
 assert.equal(impacts[0].equipmentId,'ak05-ram-body');
 assert.equal(impacts[0].weapon,'bow');
 assert(impacts[0].point.y>0&&impacts[0].point.y<4.35);
 assert.equal(solver.status().authenticPhysicalSiegeEquipmentContacts,1);
 assert.equal(solver.status().activePlayerArrows,0);
 assert.equal(solver.status().pendingRealEquipmentDamage,undefined);
});
test('AK-05b3 siege-only equipment provider is absent for the original player solver',()=>{
 const state=fake(),scenario=scenarios(),solver=physics.create({map});
 const from={x:0,y:14.885,z:-40.2};
 const to={x:0,y:2.7,z:-73};
 assert.equal(physics.trace({state,map,scenario,from,to,team:'blue'}),null);
 assert.throws(()=>solver.setEquipmentCollider(12),/requires live collider provider/);
 assert.throws(()=>physics.trace({state,map,scenario,from,to,team:'blue',
  equipmentCollider:{id:'bad',x:0,y:0,z:-73,w:5,h:5,d:5,solid:true}}),
  /Invalid AK-05b3/);
 solver.setEquipmentCollider(()=>({id:'ak05-ram-body',x:0,y:0,z:-73,
  w:5.5,d:7.3,h:4.35,solid:true}));
 assert.equal(physics.trace({state,map,scenario,from,to,team:'blue'}),null);
 assert.equal(solver.setEquipmentCollider(null),false);
 assert.equal(solver.status().siegeEquipmentProviderActive,false);
});
