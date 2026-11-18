/** Actual G5.4 paired CPU test, same seed/order/player side. Diagnostic only. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const base=dirname(fileURLToPath(import.meta.url));
const root=resolve(base,'../..');
const modes={baseline:'arena-army-battle-true-side-swap.js',candidate:'arena-army-battle-protection-candidate.js'};
export const scenarioIndex=[
 [1600,'musket','hold','blue'],[1600,'musket','hold','red'],
 [1600,'musket','advance','blue'],[1600,'musket','advance','red'],
 [1776,'musket','hold','blue'],[1776,'musket','hold','red'],
 [1600,'pike','hold','blue'],[1600,'pike','hold','red'],
 [2026,'musket','hold','blue'],[2026,'musket','hold','red'],
 [31415,'musket','hold','blue'],[31415,'musket','hold','red']
];
export function getEngine(mode){
 if(!(mode in modes))throw Error('Invalid engine version');
 const ctx=vm.createContext({console});
 vm.runInContext(readFileSync(resolve(root,'modules/weapon-balance.js'),'utf8'),ctx);
 vm.runInContext(readFileSync(resolve(root,'mirror',modes[mode]),'utf8'),ctx);
 return ctx.ArenaArmyBattle;
}
export function simulate(engine,scenario){
 const [seed,role,command,team]=scenario,state=engine.create(seed,role,team);
 const captain=state.squads[state.playerSquadId];
 if(captain.team!==team||!captain.playerControlled||!engine.issueOrder(state,captain.id,command))throw Error('Player command violation');
 const m={samples:0,near:0,uncovered:0,secondGuard:0,secondGuardFromPlan:0,
  shooterDamage:0,meleeDamage:0,playerKilled:0,enemyKilled:0};
 for(let i=0;i<7500&&!state.winner;i++){
  engine.step(state,.08);
  for(const ev of engine.drainCombatEvents(state)){
   if(ev.kind!=='soldier'||ev.attackerId==null)continue;
   const target=state.soldiers[ev.targetId];
   if(target.team===team){
    if(target.type==='bow'||target.type==='musket')m.shooterDamage++;
    else m.meleeDamage++;
   }
   if(ev.killed){if(target.team===team)m.playerKilled++;else m.enemyKilled++;}
  }
  if(state.tick%25===0){
   m.samples++;
   const melee=state.soldiers.filter(x=>x.alive&&x.team===team&&(x.type==='pike'||x.type==='sword'));
   for(const shooter of state.soldiers){
    if(!shooter.alive||shooter.team!==team||(shooter.type!=='bow'&&shooter.type!=='musket'))continue;
    if(melee.some(u=>Math.hypot(shooter.x-u.x,shooter.z-u.z)<=30))m.near++;
    else m.uncovered++;
   }
   if(state.squads.some(s=>s.team===team&&s.aiRole==='second-fire-line-guard'&&s.alive>0))m.secondGuard++;
   if(state.teamPlans[team].defense?.secondPost)m.secondGuardFromPlan++;
  }
 }
 if(captain.order!==command||captain.team!==team||!captain.playerControlled)
   throw Error('Human command was overwritten');
 return {seed,role,command,team,winner:state.winner,seconds:Math.round(state.elapsed*100)/100,
  ended:state.winner!==null,playerWon:state.winner===team,
  protectedPct:Math.round(1000*m.near/Math.max(1,m.near+m.uncovered))/10,...m};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const index=Number(process.argv[2]);
 if(!Number.isInteger(index)||index<0||index>=scenarioIndex.length)throw Error('0-11 scenario index required');
 const row={scenarioIndex:index,scenario:scenarioIndex[index]};
 for(const mode of Object.keys(modes)){
  row[mode]=simulate(getEngine(mode),scenarioIndex[index]);
  console.log(index,mode,row[mode].winner,row[mode].seconds,row[mode].protectedPct);
 }
 const dest=resolve(base,process.env.KTK_PROTECT_OUT_DIR||'dist/protection','part_'+index+'.json');
 mkdirSync(dirname(dest),{recursive:true});
 writeFileSync(dest,JSON.stringify(row,null,2)+'\n');
 console.log('WROTE',dest);
}