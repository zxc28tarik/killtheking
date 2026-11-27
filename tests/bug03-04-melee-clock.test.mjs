import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const ctx={};
for(const name of ['ArenaWeaponBalance','ArenaArmyBattle','ArenaMatch']){
 const script=scripts.find(s=>s.includes('root.'+name+'=api;'));
 assert.ok(script,name);runInNewContext(script,ctx);
}
const a=ctx.ArenaArmyBattle,m=ctx.ArenaMatch;
const unit=(id,x,z,team,siegeY=0)=>({id,x,z,team,siegeY,alive:true,hp:100});
const state=soldiers=>({soldiers,worldObstacles:[]});
test('BUG03 melee rejects excessive vertical and combined 3D reach, preserves flat reach',()=>{
 const from={x:0,y:0,z:0};
 assert.equal(a.meleeElevationReach(from,unit(0,3,0,'red',0),4),true);
 assert.equal(a.meleeElevationReach(from,unit(0,3,0,'red',8),4),false);
 assert.equal(a.meleeElevationReach(from,unit(0,3,0,'red',-8),4),false);
 assert.equal(a.meleeElevationReach(from,unit(0,3.95,0,'red',1),4),false);
 assert.equal(a.meleeElevationReach({...from,y:8},unit(0,3,0,'red',8),4),true);
});
test('BUG03 actual cone contact cannot hit a phantom ground target or wrong floor',()=>{
 const target=unit(0,3,0,'red',8),s=state([target]),forward={x:1,z:0};
 assert.equal(a.soldierInCone(s,{x:0,y:0,z:0},forward,4),null);
 assert.equal(a.soldierInCone(s,{x:0,y:8,z:0},forward,4)?.id,0);
 s.soldiers.unshift(unit(1,1.5,0,'blue',0));
 assert.equal(a.soldierInCone(s,{x:0,y:8,z:0},forward,4)?.id,0);
 s.soldiers[0].siegeY=8;
 assert.equal(a.soldierInCone(s,{x:0,y:8,z:0},forward,4),null);
});
test('BUG03 native melee strike paths use physical guard before damage',()=>{
 const start=html.indexOf(' function strike(state,attacker,target,role)'),end=html.indexOf(' function raycastSoldier(',start);
 const p=html.indexOf(' function strikePlayer('),q=html.indexOf(' function setPlayerHealth(',p);
 assert.match(html.slice(start,end),/!isRanged\(attacker.type\)&&!meleeElevationReach/);
 assert.match(html.slice(p,q),/!meleeElevationReach\(attacker,state.playerPosition,role.range\)/);
 assert.match(html,/soldierInCone\(meadowBattleState,feet,facing/);
});
const start=html.indexOf('function runActiveFrame('),end=html.indexOf('        // OPT-04 ME3:',start);
assert.ok(start>=0&&end>start);
const clock=runInNewContext(html.slice(start,end)+'\nrunActiveFrame;',{}); 
function simulate(fps,seconds){
 const match=m.create(120);m.begin(match);let physical=0,steps=0;
 for(let i=0;i<fps*seconds;i++)clock(1/fps,match.remaining,()=>match.phase==='playing',(sim,wall)=>{
  assert.ok(sim<=.050000001);physical+=sim;steps++;
  m.tick(match,match.remaining-wall<1e-8?match.remaining:wall);
 });
 return {match,physical,steps};
}
test('BUG04 120-second clock and physics match at 10,20,30,60,144 FPS',()=>{
 for(const fps of [10,20,30,60,144]){
  const {match,physical}=simulate(fps,120);
  assert.equal(match.phase,'results',String(fps));
  assert.ok(Math.abs(physical-120)<1e-6,String(fps));
 }
});
test('BUG04 long stall charges wall time with at most four physics steps and no debt',()=>{
 let sim=0,wall=0,steps=0;
 clock(3,100,()=>true,(s,w)=>{sim+=s;wall+=w;steps++});
 assert.equal(steps,4);assert.ok(Math.abs(sim-.2)<1e-9);assert.equal(wall,3);
});
test('BUG04 paused and finished frames never step; early win stops remaining substeps',()=>{
 let steps=0;clock(.1,100,()=>false,()=>steps++);assert.equal(steps,0);
 clock(.1,0,()=>true,()=>steps++);assert.equal(steps,0);
 clock(.2,100,()=>steps===0,()=>steps++);assert.equal(steps,1);
 clock(NaN,100,()=>true,()=>steps++);assert.equal(steps,1);
});
test('BUG04 clock is independent of hit-stop and actual FPS counted per rendered frame',()=>{
 assert.match(html,/updateGame\(sim-hold\*\.84,clock\)/);
 assert.match(html,/ArenaMatch\.tick\(arenaMatch,\s*arenaMatch\.remaining-clockDt/);
 assert.match(html,/fpsFrames\+\+;fpsTimer\+=Math.max\(0,rawDt\)/);
 assert.match(html,/ArenaMatch\.begin\(arenaMatch\);\s*lastTime=performance.now\(\)/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
