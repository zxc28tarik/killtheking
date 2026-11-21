import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const html=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const script=html=>[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const a=script(html('./KillTheKing_AK_NATIVE_07_original_game_siege_map.html'));
const b=script(html('./KillTheKing_AK_NATIVE_06_original_game_siege_map.html'));
const last=a[28];
function extract(name){
 const start=last.indexOf('function '+name+'(');assert(start>0);
 let depth=0;
 for(let i=last.indexOf('{',start);i<last.length;i++){
  if(last[i]==='{')depth++;
  if(last[i]==='}'&&!--depth)return last.slice(start,i+1);
 }
 throw Error('Function extraction failed '+name);
}
function genuine(seed=1600){
 const ctx=vm.createContext({console});
 vm.runInContext(a[19],ctx,{timeout:3000});
 vm.runInContext(a[26],ctx,{timeout:3000});
 vm.runInContext(extract('nativeSiegeDeployOriginalG54'),ctx,{timeout:3000});
 const A=ctx.ArenaArmyBattle,s=A.create(seed,'sword','blue');
 ctx.nativeSiegeDeployOriginalG54(s);
 const boxes=[[-26,3.5,-42,36,7,5],[26,3.5,-42,36,7,5],
 [0,3.5,-42,16,7,5],[-42,7,-42,11,14,11],[42,7,-42,11,14,11],
 [0,1.55,-63,4,3.1,6],[-22,1.65,-70,4.4,3.3,5.5],
 [25.9,3.8,-62,.42,7.6,8],[30.1,3.8,-62,.42,7.6,8]]
 .map(([x,y,z,w,h,d])=>({x,y,z,w,h,d,solid:true}));
 A.setWorldObstacles(s,boxes);
 return {ctx,A,s};
}
test('AK07 keeps original 28 G5.4/FPS/arena source scripts byte-identical',()=>{
 assert.equal(a.length,29);assert.equal(b.length,29);
 for(let i=0;i<28;i++)assert.equal(a[i],b[i],String(i));
 assert.equal(createHash('sha256').update(a[26]).digest('hex'),
 '497c945c059b541fcf76231e7d9ff2983dd8b235e98d7b78b93e9ed52235c348');
 assert.doesNotThrow(()=>new vm.Script(last));
});
test('AK07 10 genuine red native riflemen avoid wall, turret and tower in 4 seeds',()=>{
 for(const seed of [1600,42,777,2026]){
  const {s}=genuine(seed);
  assert.equal(s.soldiers.length,140);assert.equal(s.squads.length,8);
  const red=s.soldiers.filter(u=>u.team==='red'&&u.type==='musket');
  assert.equal(red.length,10);
  for(const u of red){
   assert(u.x>25&&u.x<37&&u.z<-48&&u.z>-61);
   assert(!s.worldObstacles.some(b=>b.minY<=1.85&&b.maxY>=.2&&
     u.x>b.minX&&u.x<b.maxX&&u.z>b.minZ&&u.z<b.maxZ));
  }
 }
});
test('AK07 catapult first-contact mesh matrices, soldiers and impact counters',()=>{
 assert.match(last,/if\(!st\.catPhysicsWorldReady\)/);
 assert.match(last,/nativeSiegeGateMesh\.updateWorldMatrix\(true,false\)/);
 assert.match(last,/mesh\.updateWorldMatrix\(true,false\)/);
 assert.match(last,/st\.catPhysicsWorldReady=true;st\.catMatrixSyncs\+\+/);
 assert.match(last,/if\(body&&\(!impact\|\|body\.distance<impact\.distance-\.02\)\)/);
 assert.match(last,/catapultWorldMatrixSyncs:st\.catMatrixSyncs/);
});
function routing(){
 const {ctx,A,s}=genuine();
 const u=s.squads.find(q=>q.team==='blue'&&q.type==='pike');
 u.playerControlled=true;
 ctx.meadowBattleState=s;ctx.nativeSiegeMode=true;ctx.nativeSiegeGateOpen=true;
 ctx.nativeSiegeEquipment={win:false,
  assaultPlans:{pike:{phase:'breach',goal:{x:-19,z:-16},
   replans:0,closest:0,lastProgressAt:-20}},
  assaultCheckTime:0,assaultWatchdogReplans:0,
  assaultOrders:0,assaultFailed:0,assaultPhase:'breaching'};
 const code=[
 'const nativeSiegeCourtyardGoals={pike:{x:-23,z:12},sword:{x:23,z:12}};',
 'function nativeSiegeGoalSame(a,b){return !!a&&!!b&&Math.hypot(a.x-b.x,a.z-b.z)<1.2;}',
 "function nativeSiegeOrderCrew(type,x,z){const q=meadowBattleState.squads.find(s=>s.team==='blue'&&s.type===type);return ArenaArmyBattle.setDestination(meadowBattleState,q.id,x,z,true);}",
 extract('nativeSiegeAdvanceAssault')].join('\n');
 vm.runInContext(code,ctx,{timeout:5000});
 assert(A.setDestination(s,u.id,-19,-16,true));
 return {ctx,A,s,u,plan:ctx.nativeSiegeEquipment.assaultPlans.pike};
}
test('AK07 original G5.4 path watchdog retries twice only without teleport',()=>{
 const {ctx,s,u,plan}=routing(),start={x:u.x,z:u.z},rev=u.commandRevision;
 for(let i=0;i<3;i++){
  plan.lastProgressAt=s.elapsed-20;ctx.nativeSiegeEquipment.assaultCheckTime=0;
  ctx.nativeSiegeAdvanceAssault(1.25);
 }
 assert.equal(plan.replans,2);
 assert.equal(ctx.nativeSiegeEquipment.assaultWatchdogReplans,2);
 assert.equal(u.commandRevision,rev+2);
 assert.equal(u.x,start.x);assert.equal(u.z,start.z);
 assert.equal(s.soldiers.length,140);
});
test('AK07 human G5.4 manual destination overrides autonomous siege orders',()=>{
 const {ctx,A,s,u,plan}=routing();
 assert(A.setDestination(s,u.id,-11,-55,true));
 const rev=u.commandRevision;ctx.nativeSiegeAdvanceAssault(1.25);
 assert.equal(plan.phase,'manual');
 assert.equal(u.commandRevision,rev);
 assert.equal(u.routeGoal.x,-11);assert.equal(u.routeGoal.z,-55);
 assert.equal(ctx.nativeSiegeEquipment.assaultWatchdogReplans,0);
});
test('AK07 capture requires 15s of real unbroken living-soldier control',()=>{
 assert.match(last,/st\.captureTime>=15&&!st\.win/);
 assert.match(last,/st\.captureTime>0\)st\.captureResets\+\+/);
 assert.match(last,/attackers>0&&attackers>defenders/);
 assert.match(last,/nativeSiegeGateOpen\|\|st\.towerCrossed>=2/);
 assert.match(last,/meadowBattleState\.winner='blue'/);
});
