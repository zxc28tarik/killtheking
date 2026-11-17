/**
 * Kill the King — G5.4 recovered, REAL army-engine contract QA.
 * Evaluates the actual embedded source, not a replacement/mocked battle.
 * Does not validate unavailable G8.4 or GPU/WebGL performance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=import.meta.dirname;
const html=readFileSync(resolve(root,'KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]);
const original=marker=>{
 const found=scripts.filter(x=>x.includes(marker));
 assert.equal(found.length,1,'Exactly one original module: '+marker);
 return found[0];
};
const ctx=vm.createContext({console});
vm.runInContext(original('root.ArenaWeaponBalance=api'),ctx,{timeout:3000});
vm.runInContext(original('root.ArenaArmyBattle=api'),ctx,{timeout:3000});
const A=ctx.ArenaArmyBattle, W=ctx.ArenaWeaponBalance;
const create=(role='sword',seed=1600)=>A.create(seed,role);
const roster={musket:10,pike:25,bow:15,sword:20};

test('real engine loads and exports its 72 contracts',()=>{
 assert.equal(Object.keys(A).length,72);assert.ok(W.RULES);
 assert.equal(A.TYPE_ORDER.length,4);
 assert.equal(Object.keys(A.ORDERS).length,8);
 assert.equal(Object.keys(A.FORMATIONS).length,6);
 assert.equal(Object.keys(A.FIRE_MODES).length,3);
});
for(const role of Object.keys(roster)){
 test('creates a 140-soldier army and selected blue commander: '+role,()=>{
  const s=create(role);
  assert.equal(s.soldiers.length,140);assert.equal(s.squads.length,8);
  assert.equal(s.squads.filter(q=>q.playerControlled).length,1);
  assert.equal(s.squads[s.playerSquadId].team,'blue');
  assert.equal(s.squads[s.playerSquadId].type,role);
 });
}
test('70/70 side parity with exact troop counts',()=>{
 const s=create();
 for(const team of ['blue','red'])for(const [role,count] of Object.entries(roster)){
  assert.equal(s.soldiers.filter(u=>u.team===team&&u.type===role).length,count);
  assert.equal(s.squads.filter(q=>q.team===team&&q.type===role).length,1);
 }
});
test('every soldier has a unique ID and valid role, squad and HP',()=>{
 const s=create();assert.equal(new Set(s.soldiers.map(u=>u.id)).size,140);
 for(const u of s.soldiers){
  assert.equal(u.team,s.squads[u.squadId].team);
  assert.equal(u.type,s.squads[u.squadId].type);
  assert.ok(u.hp===u.maxHp&&u.hp>0&&u.alive);
 }
});
test('same seed repeats original coordinates and traits',()=>{
 const a=create('pike',1407),b=create('pike',1407);
 for(let i=0;i<140;i++)for(const f of ['x','z','initiative','pace','discipline','reactionDelay','awareness'])
  assert.equal(a.soldiers[i][f],b.soldiers[i][f]);
});
test('distinct seeds yield distinct discipline but same headcount',()=>{
 const a=create('sword',100),b=create('sword',101);
 assert.notEqual(a.soldiers[0].discipline,b.soldiers[0].discipline);
 assert.equal(a.soldiers.length,b.soldiers.length);
});
test('unknown troop type cannot instantiate',()=>assert.throws(()=>create('horse'),/Unknown/));
for(const order of Object.keys(A.ORDERS)){
 test('real player squad accepts '+order,()=>{
  const s=create('sword'),p=s.playerSquadId;
  assert.equal(A.issueOrder(s,p,order),true);
  assert.equal(s.squads[p].order,order);
 });
}
test('player cannot issue orders to AI commanders',()=>{
 const s=create('bow'),enemy=s.squads.find(q=>!q.playerControlled);
 const before=JSON.stringify(enemy);
 assert.equal(A.issueOrder(s,enemy.id,'charge'),false);
 assert.equal(JSON.stringify(enemy),before);
});
test('invalid and out-of-range orders do not mutate squad state',()=>{
 const s=create(),p=s.playerSquadId,old=s.squads[p].order;
 assert.equal(A.issueOrder(s,p,'teleport'),false);
 assert.equal(A.issueOrder(s,999,'charge'),false);
 assert.equal(s.squads[p].order,old);
});
for(const form of Object.keys(A.FORMATIONS)){
 test('human-only formation '+form,()=>{
  const s=create('sword'),p=s.playerSquadId;
  assert.equal(A.setFormation(s,p,form),true);
  assert.equal(s.squads[p].formation,form);
  assert.equal(A.setFormation(s,4,form),false);
 });
}
test('invalid formation is refused',()=>{
 const s=create(),p=s.playerSquadId;
 assert.equal(A.setFormation(s,p,'giant'),false);
});
for(const mode of Object.keys(A.FIRE_MODES)){
 test('bow fire order '+mode,()=>{
  const s=create('bow'),p=s.playerSquadId;
  assert.equal(A.setFireMode(s,p,mode),true);
  assert.equal(s.squads[p].fireMode,mode);
 });
}
test('melee soldiers and AI shooters reject unauthorized fire orders',()=>{
 const s=create('pike'),p=s.playerSquadId;
 assert.equal(A.setFireMode(s,p,'volley'),false);
 assert.equal(A.setFireMode(s,s.squads.find(q=>q.type==='bow').id,'volley'),false);
});
test('tactical map destination creates human position order',()=>{
 const s=create('pike'),p=s.playerSquadId;
 assert.equal(A.setDestination(s,p,-90,8),true);
 assert.equal(s.squads[p].order,'position');
 assert.equal(s.squads[p].targetX,-90);
});
test('impossible or nonfinite destination refused',()=>{
 const s=create('pike'),p=s.playerSquadId;
 assert.equal(A.setDestination(s,p,9999,0),false);
 assert.equal(A.setDestination(s,p,NaN,0),false);
});
test('waypoints append and clear against actual route planner',()=>{
 const s=create('bow'),p=s.playerSquadId;
 assert.equal(A.setDestination(s,p,-120,-10),true);
 assert.equal(A.appendWaypoint(s,p,-110,-45),true);
 assert.equal(s.squads[p].waypoints.length,1);
 assert.equal(A.clearWaypoints(s,p),true);
 assert.equal(s.squads[p].waypoints.length,0);
});
test('solid obstacle shape is applied and blocks destinations',()=>{
 const s=create('bow'),p=s.playerSquadId;
 assert.equal(A.setWorldObstacles(s,[{x:-88.5,y:5,z:0,w:9,h:10,d:12,solid:true}]),true);
 assert.equal(s.worldObstacles.length,1);
 assert.equal(A.setDestination(s,p,-90,0),false);
});
test('player facing command locks then unlocks direction',()=>{
 const s=create('bow'),p=s.playerSquadId;
 assert.equal(A.setFacing(s,p,20,70),true);
 assert.ok(Number.isFinite(s.squads[p].lockedFacing));
 assert.equal(A.clearFacing(s,p),true);
 assert.equal(s.squads[p].lockedFacing,null);
});
test('spacing, frontage and depth respect limits',()=>{
 const s=create('sword'),p=s.playerSquadId;
 assert.equal(A.setSpacing(s,p,1.2),true);
 assert.equal(A.setSpacing(s,p,0.1),false);
 assert.equal(A.setFrontage(s,p,7),true);
 assert.equal(A.setFrontage(s,p,70),false);
 assert.equal(A.setDepthScale(s,p,1.4),true);
 assert.equal(A.setDepthScale(s,p,10),false);
});
test('human position stays inside actual army battlefield',()=>{
 const s=create();A.setPlayerPosition(s,9999,-9999);
 assert.equal(s.playerPosition.x,A.BOUNDS);
 assert.equal(s.playerPosition.z,-A.BOUNDS);
});
test('invalid dt does not advance simulation',()=>{
 const s=create();
 for(const dt of [0,-1,NaN,Infinity])A.step(s,dt);
 assert.equal(s.tick,0);assert.equal(s.elapsed,0);
});
test('fixed 80ms tick accumulates fragments',()=>{
 const s=create();A.step(s,.04);assert.equal(s.tick,0);
 A.step(s,.04);assert.equal(s.tick,1);
});
test('real AI commanders make decisions while player squad keeps hold',()=>{
 const s=create('bow'),p=s.playerSquadId;A.issueOrder(s,p,'hold');
 for(let i=0;i<40;i++)A.step(s,.08);
 assert.ok(s.tick>=40);
 assert.ok(s.squads.some(q=>!q.playerControlled&&q.decisionCount>0));
 assert.equal(s.squads[p].order,'hold');
});
test('snapshot reports soldiers, communication and both teams',()=>{
 const s=create(),x=A.snapshot(s);
 assert.equal(x.blue,70);assert.equal(x.red,70);
 assert.equal(x.squads.length,8);
 assert.ok(x.teamPlans.blue.communications);
 assert.ok(x.teamPlans.red.communications);
});
test('snapshot reads without mutating the underlying engine state',()=>{
 const s=create(),before=JSON.stringify(s);A.snapshot(s);
 assert.equal(JSON.stringify(s),before);
});
test('same-seed simulation reproduces actual AI orders after thirty ticks',()=>{
 const x=create('sword',1400),y=create('sword',1400);
 for(let i=0;i<30;i++){A.step(x,.08);A.step(y,.08);}
 assert.equal(JSON.stringify(A.snapshot(x)),JSON.stringify(A.snapshot(y)));
});
test('army gameplay is a separate runtime mode from ordinary FFA',()=>{
 assert.match(html,/if\(meadowBattleMode&&meadowBattleState\)/);
 assert.match(html,/ArenaArmyBattle\.step\(meadowBattleState,dt\)/);
 assert.match(html,/bot\.respawnTimer=Infinity/);
 assert.match(html,/meadowBattleState=null/);
});
test('extracted weapon balance is byte-for-byte identical to original script',()=>{
 assert.equal(readFileSync(resolve(root,'modules/weapon-balance.js'),'utf8'),
  original('root.ArenaWeaponBalance=api'));
});
test('extracted army engine is byte-for-byte identical to original script',()=>{
 assert.equal(readFileSync(resolve(root,'modules/arena-army-battle.js'),'utf8'),
  original('root.ArenaArmyBattle=api'));
});
test('actual G5.4 source is not labeled as missing G8.4 supply system',()=>{
 assert.doesNotMatch(html,/KillTheKing_G8_4_Ikmal_Hatti_Savas_Raporu_Oyna/);
});
