/** True red-team ownership, player attack allegiance and original blue regression tests. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'..');
const source=readFileSync(resolve(here,'arena-army-battle-true-side-swap.js'),'utf8');
const original=readFileSync(resolve(root,'candidates/arena-army-battle-contact-2d-candidate.js'),'utf8');
function load(src){
 const c=vm.createContext({console});
 vm.runInContext(readFileSync(resolve(root,'modules/weapon-balance.js'),'utf8'),c);
 vm.runInContext(src,c,{timeout:2000});
 return c.ArenaArmyBattle;
}
const engine=load(source),baseline=load(original);
const alive=(s,team)=>s.squads.filter(q=>q.team===team).reduce((a,q)=>a+q.alive,0);
for(const role of ['musket','pike','bow','sword']){
 test('player controls the actual RED '+role+' squad',()=>{
  const s=engine.create(1776,role,'red'),p=s.squads[s.playerSquadId];
  assert.equal(s.playerTeam,'red');assert.equal(p.team,'red');assert.equal(p.type,role);
  assert.equal(s.squads.filter(q=>q.playerControlled).length,1);
  assert.equal(s.squads.length,8);assert.equal(s.soldiers.length,140);
  assert.equal(alive(s,'blue'),70);assert.equal(alive(s,'red'),70);
  assert.equal(s.playerPosition.x,176);assert.equal(s.playerPosition.z,p.z);
  const opponent=s.squads.find(q=>q.type===role&&q.team==='blue');
  assert.equal(opponent.playerControlled,false);
  assert.equal(engine.issueOrder(s,p.id,'retreat'),true);
  assert.equal(engine.issueOrder(s,opponent.id,'retreat'),false);
  assert.equal(engine.setFormation(s,p.id,'line'),true);
  assert.equal(engine.setFormation(s,opponent.id,'line'),false);
 });
 test('default BLUE behavior byte-equivalent apart from new playerTeam metadata '+role,()=>{
  const old=baseline.create(1776,role),current=engine.create(1776,role);
  assert.equal(current.playerTeam,'blue');
  const oldView=x=>{const obj=JSON.parse(JSON.stringify(x));delete obj.playerTeam;return JSON.stringify(obj);};
  assert.equal(oldView(current),JSON.stringify(old));
  for(let i=0;i<60;i++){baseline.step(old,.08);engine.step(current,.08);}
  assert.equal(oldView(current),JSON.stringify(old));
 });
 test('RED human HOLD cannot be overwritten by AI '+role,()=>{
  const s=engine.create(1600,role,'red'),p=s.squads[s.playerSquadId];
  assert(engine.issueOrder(s,p.id,'hold'));
  const {x,z}=p;
  for(let i=0;i<220;i++)engine.step(s,.08);
  assert.equal(p.order,'hold');assert.equal(p.x,x);assert.equal(p.z,z);
  assert.equal(p.playerControlled,true);
 });
}
test('invalid side rejected, no silent blue conversion',()=>{
 assert.throws(()=>engine.create(1600,'bow','green'),/Unknown player team/);
});
test('player weapon can only hit opposing soldiers on BOTH sides',()=>{
 for(const team of ['blue','red']){
  const s=engine.create(2026,'bow',team);
  const enemy=s.soldiers.find(u=>u.team!==team),friend=s.soldiers.find(u=>u.team===team);
  const hp=enemy.hp;
  assert.equal(engine.damageSoldier(s,friend.id,15,{source:'player',weapon:'musket',zone:'body'}),null);
  assert.equal(friend.hp,friend.maxHp);
  assert(engine.damageSoldier(s,enemy.id,15,{source:'player',weapon:'musket',zone:'body'}));
  assert(enemy.hp<hp);
 }
});
test('RED player is a real target of BLUE musketeers, not RED friends',()=>{
 const s=engine.create(1776,'musket','red');
 const blue=s.soldiers.find(u=>u.team==='blue'&&u.type==='musket');
 const red=s.soldiers.find(u=>u.team==='red'&&u.type==='musket');
 for(const u of s.soldiers)if(u!==blue&&u!==red)u.alive=false;
 engine.setPlayerPosition(s,blue.x+20,blue.z);
 const hit=engine.tracePlayerMusket(s,blue,{horizontalRoll:.5,verticalRoll:.5});
 assert(hit&&hit.zone==='body');
 assert.equal(engine.tracePlayerMusket(s,red,{horizontalRoll:.5,verticalRoll:.5}),null);
});
test('opposite side truly changes player ownership, not merely player coordinates',()=>{
 const blue=engine.create(31415,'sword','blue'),red=engine.create(31415,'sword','red');
 assert.equal(blue.playerSquadId,3);assert.equal(red.playerSquadId,7);
 const positions=x=>x.squads.map(q=>[q.id,q.type,q.team,q.x,q.z,q.homeX,q.homeZ,q.facing]);
 assert.deepEqual(positions(blue),positions(red));
 assert.equal(blue.squads[3].playerControlled,true);
 assert.equal(red.squads[3].playerControlled,false);
 assert.equal(blue.squads[7].playerControlled,false);
 assert.equal(red.squads[7].playerControlled,true);
 assert.notEqual(blue.playerPosition.x,red.playerPosition.x);
});