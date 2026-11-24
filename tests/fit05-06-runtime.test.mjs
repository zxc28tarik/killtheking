import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function extract(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,start);return html.slice(a,b);
}
test('FIT05 target counts preserve self exclusion, death and player targeting',()=>{
 const bots=Array.from({length:19},(_,id)=>({id,dead:id%5===0,arenaTargetType:['bot','player',null][id%3],arenaTargetId:id%4}));
 const ctx=vm.createContext({bots});
 vm.runInContext(extract('function arenaTargetCounts(', 'function setArenaTarget('),ctx);
 for(let cycle=0;cycle<5;cycle++){
  for(const bot of bots){
   const actual=ctx.arenaTargetCounts(bot.id);
   for(const type of ['bot','player'])for(let id=0;id<19;id++){
    const expected=bots.filter(o=>o.id!==bot.id&&!o.dead&&o.arenaTargetType===type&&(type==='player'||o.arenaTargetId===id)).length;
    assert.equal(type==='player'?actual.playerCount:actual.byBot.get(id)||0,expected);
   }
  }
  bots[cycle].dead=!bots[cycle].dead;bots[cycle+1].arenaTargetType='player';
 }
});
test('FIT05 sight wrapper delegates unchanged arguments',()=>{
 const pos={x:2,y:4,z:6},target={x:1,y:3,z:5};let observed;
 const ctx=vm.createContext({arenaCanSeeFrom:(...args)=>{observed=args;return false}});
 vm.runInContext(extract('function arenaLineOfSight(', '// Tactical vantage checks'),ctx);
 assert.equal(ctx.arenaLineOfSight({mesh:{position:pos}},target,true),false);
 assert.deepEqual(observed,[pos,target,true]);
});
function referenceRaycast(state,origin,direction,maxDistance,team='blue',options={}){
  if(!state||!origin||!direction||!Number.isFinite(maxDistance)||maxDistance<=0)return null;
  const len=Math.hypot(direction.x,direction.y,direction.z);
  if(len<1e-6)return null;
  const dx=direction.x/len,dy=direction.y/len,dz=direction.z/len;
  const aa=dx*dx+dz*dz,radius=.80;
  let best=null,limit=maxDistance;
  for(const target of state.soldiers){
   if(!target.alive||target.id===options.ignoreSoldierId)continue;
   if(target.team===team&&!options.firstBody)continue;
   const px=origin.x-target.x,pz=origin.z-target.z;
   let low,high;
   if(aa<1e-9){if(px*px+pz*pz>radius*radius)continue;low=0;high=limit;}
   else{
    const bb=2*(px*dx+pz*dz),cc=px*px+pz*pz-radius*radius;
    const det=bb*bb-4*aa*cc;if(det<0)continue;
    const root=Math.sqrt(det);low=(-bb-root)/(2*aa);high=(-bb+root)/(2*aa);
    if(high<0||low>limit)continue;
   }
   let entry=Math.max(0,low),exit=Math.min(limit,high);
   if(Math.abs(dy)>1e-9){
    const ya=(.20-origin.y)/dy,yb=(3.55-origin.y)/dy;
    entry=Math.max(entry,Math.min(ya,yb));exit=Math.min(exit,Math.max(ya,yb));
   }else if(origin.y<.20||origin.y>3.55)continue;
   if(entry>exit||entry>limit)continue;
   // Ignore almost-zero entry distances (a player starts inside an ally's
   // personal space), but do not allow firing through an ally 1m in front.
   if(entry<.02&&target.team===team)continue;
   const y=origin.y+entry*dy;
   const lateral=Math.abs(px*dz-pz*dx);
   const zone=y>2.52?'head':y<1.1?'leg':lateral>.55?'arm':'body';
   limit=entry;
   best={soldier:target,targetId:target.id,distance:entry,
    point:{x:origin.x+entry*dx,y,z:origin.z+entry*dz},zone};
  }
  if(!best)return null;
  const block=firstWorldObstacle(state,origin,{x:dx,y:dy,z:dz},best.distance);
  if(block!==null&&block<best.distance-.03)return null;
  // firstBody is used by army AI for shared obstruction checks. Human shots
  // never damage an ally, even though the ally physically intercepts the ray.
  if(best.soldier.team===team&&!options.returnFriendly)return null;
  return best;
 }
test('FIT06 army raycast matches FIT04 on 1500 deterministic cases',()=>{
 const ctx=vm.createContext({firstWorldObstacle:()=>null});
 vm.runInContext(extract('function raycastSoldier(', 'function soldierInCone('),ctx);
 let obstacle=null;ctx.firstWorldObstacle=()=>obstacle;
 vm.runInContext(referenceRaycast.toString(),ctx);
 let seed=123456;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<1500;i++){
  const soldiers=Array.from({length:22},(_,id)=>({id,alive:rnd()>.15,team:rnd()>.5?'blue':'red',x:rnd()*20-10,z:rnd()*20-10}));
  soldiers.push({...soldiers[0],id:22,alive:true});
  const state={soldiers},origin={x:rnd()*6-3,y:rnd()*6-1,z:rnd()*6-3};
  const direction=i%7===0?{x:0,y:1,z:0}:i%7===1?{x:1,y:0,z:0}:{x:rnd()*2-1,y:rnd()*2-1,z:rnd()*2-1};
  const options={firstBody:i%2===0,returnFriendly:i%3===0,ignoreSoldierId:i%22};
  const range=1+rnd()*25;obstacle=i%3===0?rnd()*range:null;
  const args=[state,origin,direction,range,i%2?'red':'blue',options];
  assert.equal(JSON.stringify(ctx.raycastSoldier(...args)),JSON.stringify(ctx.referenceRaycast(...args)),'ray '+i);
 }
});

function referenceCohesion(state,squad){
  const members=state.soldiers.filter(u=>u.alive&&u.squadId===squad.id);
  if(!members.length)return 0;
  const spread=members.reduce((sum,u)=>sum+Math.hypot(u.x-squad.x,u.z-squad.z),0)/members.length;
  return clamp(1-spread/(squad.formation==='loose'?38:31),.18,1);
 }
function referenceMorale(state){
  for(const squad of state.squads){
   if(!squad.alive){squad.morale=0;continue;}
   const fraction=squad.alive/squad.startCount;
   const supporters=state.squads.filter(s=>s.team===squad.team&&s.alive>0&&s.id!==squad.id&&dist(s,squad)<65).length;
   const pressure=state.squads.filter(e=>e.team!==squad.team&&e.alive>0&&dist(e,squad)<45).length;
   const reformBonus=squad.aiRole==='rally'&&squad.order==='hold'?.12:0;
   const members=state.soldiers.filter(u=>u.alive&&u.squadId===squad.id);
   const incoming=members.length?members.reduce((t,u)=>t+(u.suppression||0),0)/members.length:0;
   const captainNerve=squad.nerve??.7;
   squad.morale=clamp(.23+fraction*.56+supporters*.075-pressure*.085+
    reformBonus-incoming*(.12+(1-captainNerve)*.12),.08,1);
   const physical=squadCohesionEstimate(state,squad);
   squad.cohesion=clamp(.40+supporters*.12+(squad.order==='hold'?.20:0)-
     (squad.order==='charge'?.18:0),.2,1)*.55+physical*.45;
  }
 }
test('FIT08 formation rank buffers preserve exact live ordering and isolate matches',()=>{
 const ctx=vm.createContext({});
 vm.runInContext(extract('const formationRankScratch=', 'function oneTick(')+'\nthis.compute=computeActiveRanks;',ctx);
 const make=()=>({squads:[{},{}],soldiers:Array.from({length:140},(_,id)=>({id,squadId:id%2,alive:id%7!==0}))});
 const a=make(),b=make();
 const first=ctx.compute(a),other=ctx.compute(b);
 assert.notEqual(first,other);assert.notEqual(first.activeRank,other.activeRank);
 for(let cycle=0;cycle<140;cycle++){
  a.soldiers[cycle].alive=!a.soldiers[cycle].alive;
  const next=new Array(a.squads.length).fill(0),active=new Array(a.soldiers.length);
  for(const s of a.soldiers)if(s.alive)active[s.id]=next[s.squadId]++;
  const actual=ctx.compute(a);
  assert.equal(actual,first);assert.equal(JSON.stringify(actual.nextRank),JSON.stringify(next));
  assert.equal(JSON.stringify(actual.activeRank),JSON.stringify(active));
 }
 assert.equal(Object.keys(a).length,2);
});
test('FIT08 morale and cohesion preserve exact results with casualties and suppression',()=>{
 const ctx=vm.createContext({clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),dist:(a,b)=>Math.hypot(a.x-b.x,a.z-b.z)});
 vm.runInContext(extract('function squadCohesionEstimate(', 'function formationOffset('),ctx);
 vm.runInContext(extract('function updateMorale(', '// Private per-match scratch'),ctx);
 vm.runInContext(referenceCohesion.toString(),ctx);
 vm.runInContext(referenceMorale.toString().replace('squadCohesionEstimate(state,squad)','referenceCohesion(state,squad)'),ctx);
 for(let cycle=0;cycle<140;cycle++){
  const squads=Array.from({length:8},(_,id)=>({id,team:id<4?'blue':'red',alive:(id+cycle)%9,startCount:20,x:id*12,z:id%2*9,formation:id%2?'loose':'line',order:id%3?'hold':'charge',aiRole:id%2?'rally':'attack',nerve:.7}));
  const soldiers=Array.from({length:140},(_,id)=>({id,squadId:id%8,alive:(id+cycle)%6!==0,x:id%45,z:id%31,suppression:(id%10)/10}));
  const a={squads,soldiers},b=JSON.parse(JSON.stringify(a));
  ctx.updateMorale(a);ctx.referenceMorale(b);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
 }
});
