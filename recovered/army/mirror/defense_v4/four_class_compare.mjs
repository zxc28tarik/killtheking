/** Four-class real G5.4 A/B (two seeds, both teams, both orders), DIAGNOSTIC ONLY. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const base=dirname(fileURLToPath(import.meta.url));
const root=resolve(base,'../..');
const modes={baseline:'arena-army-battle-true-side-swap.js',candidate:'arena-army-battle-protection-v3-role-gated.js'};
export const scenarioIndex=[1600,1776].flatMap(seed=>
 ['musket','pike','bow','sword'].flatMap(role=>
  ['advance','hold'].flatMap(command=>
   ['blue','red'].map(team=>[seed,role,command,team]))));
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
 const m={samples:0,near:0,uncovered:0,shootersInRange:0,shootersOutOfRange:0,secondGuard:0,secondGuardFromPlan:0,
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
   const opponent=state.soldiers.filter(x=>x.alive&&x.team!==team);
   for(const shooter of state.soldiers){
    if(!shooter.alive||shooter.team!==team||(shooter.type!=='bow'&&shooter.type!=='musket'))continue;
    if(melee.some(u=>Math.hypot(shooter.x-u.x,shooter.z-u.z)<=30))m.near++;
    else m.uncovered++;
    const range=shooter.type==='bow'?90:100;
    if(opponent.some(e=>Math.hypot(shooter.x-e.x,shooter.z-e.z)<=range))m.shootersInRange++;
    else m.shootersOutOfRange++;
   }
   if(state.squads.some(s=>s.team===team&&s.aiRole==='second-fire-line-guard'&&s.alive>0))m.secondGuard++;
   if(state.teamPlans[team].defense?.secondPost)m.secondGuardFromPlan++;
  }
 }
 if(captain.order!==command||captain.team!==team||!captain.playerControlled)
   throw Error('Human command was overwritten');
 return {seed,role,command,team,winner:state.winner,seconds:Math.round(state.elapsed*100)/100,
  ended:state.winner!==null,playerWon:state.winner===team,
  protectedPct:Math.round(1000*m.near/Math.max(1,m.near+m.uncovered))/10,
  firingOpportunityPct:Math.round(1000*m.shootersInRange/Math.max(1,m.shootersInRange+m.shootersOutOfRange))/10,
  aliveBlue:state.squads.filter(s=>s.team==='blue').reduce((n,s)=>n+s.alive,0),
  aliveRed:state.squads.filter(s=>s.team==='red').reduce((n,s)=>n+s.alive,0),...m};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const index=Number(process.argv[2]);
 if(!Number.isInteger(index)||index<0||index>=scenarioIndex.length)throw Error('0-31 scenario index required');
 const row={scenarioIndex:index,scenario:scenarioIndex[index]};
 for(const mode of Object.keys(modes)){
  row[mode]=simulate(getEngine(mode),scenarioIndex[index]);
  console.log(index,mode,row[mode].winner,row[mode].seconds,row[mode].protectedPct);
 }
 const dest=resolve(base,process.env.KTK_PROTECT_OUT_DIR||'replay','part_'+index+'.json');
 mkdirSync(dirname(dest),{recursive:true});
 writeFileSync(dest,JSON.stringify({format:'ktk-g54-four-class-v3-v1',sourceHashes:{
 baseline:'307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841',
 candidate:'5ba893b6e812943e77607ed1b288be93b1e2daeeb6fdf6569b54907a38db0826'},...row},null,2)+'\n');
 console.log('WROTE',dest);
}