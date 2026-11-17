/** G5.4 diagnosis only: no changes to published engine, weapons or AI rules. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=dirname(fileURLToPath(import.meta.url));
const src=readFileSync(resolve(dir,'../arena-army-battle-true-side-swap.js'),'utf8');
const sourceHash=createHash('sha256').update(src).digest('hex');
export const EXPECTED_ENGINE_SHA='307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841';
if(sourceHash!==EXPECTED_ENGINE_SHA)throw Error('Engine source differs from the 64-match reference; abort');
const ctx=vm.createContext({console});
vm.runInContext(readFileSync(resolve(dir,'../../modules/weapon-balance.js'),'utf8'),ctx);
vm.runInContext(src,ctx);
const engine=ctx.ArenaArmyBattle;
export const plan=['musket','pike'].flatMap(role=>['advance','hold'].flatMap(order=>['blue','red'].map(team=>({seed:1600,role,order,team}))));
export const variants=['baseline','no-avatar','ai-captain','ai-captain-no-avatar'];
const expected={
 'musket/advance/blue':['red',223.36],
 'musket/advance/red':['blue',210.56],
 'musket/hold/blue':['red',333.68],
 'musket/hold/red':['blue',296.88],
 'pike/advance/blue':['red',278.48],
 'pike/advance/red':['red',237.2],
 'pike/hold/blue':['blue',256.24],
 'pike/hold/red':['red',313.04]
};
export function simulate(scenario,variant){
 if(!plan.some(p=>p.role===scenario.role&&p.order===scenario.order&&p.team===scenario.team)||!variants.includes(variant))throw Error('Invalid scenario/variant');
 const {seed,role,order,team}=scenario,state=engine.create(seed,role,team),leader=state.squads[state.playerSquadId];
 if(!leader.playerControlled||leader.type!==role||leader.team!==team||!engine.issueOrder(state,leader.id,order))throw Error('Invalid original command');
 if(variant.startsWith('ai-captain'))leader.playerControlled=false;
 if(variant.endsWith('no-avatar'))state.playerActive=false;
 const m={samples:0,protectedShooterSamples:0,exposedShooterSamples:0,
  screenAssignedSamples:0,screenAliveSamples:0,avatarHits:0,avatarDamage:0,
  opponentDamageByTargetType:{musket:0,pike:0,bow:0,sword:0},
  ownCompanyKills:0,ownCompanyDamageEvents:0};
 while(!state.winner&&state.tick<7500){
  engine.step(state,.08);
  for(const hit of state.playerHits){m.avatarHits++;m.avatarDamage+=hit.damage;}
  state.playerHits.length=0;
  for(const ev of engine.drainCombatEvents(state)){
   if(ev.kind!=='soldier'||ev.attackerId==null)continue;
   const attacker=state.soldiers[ev.attackerId],target=state.soldiers[ev.targetId];
   if(!attacker||!target||attacker.team===target.team)throw Error('Bad actual combat event');
   if(target.team===team)m.opponentDamageByTargetType[target.type]++;
   if(attacker.squadId===leader.id){m.ownCompanyDamageEvents++;if(ev.killed)m.ownCompanyKills++;}
  }
  if(state.tick%25===0){
   m.samples++;
   const livingMelee=state.soldiers.filter(s=>s.alive&&s.team===team&&(s.type==='pike'||s.type==='sword'));
   for(const shooter of state.soldiers){
    if(!shooter.alive||shooter.team!==team||(shooter.type!=='bow'&&shooter.type!=='musket'))continue;
    if(livingMelee.some(m=>Math.hypot(m.x-shooter.x,m.z-shooter.z)<=30))m.protectedShooterSamples++;
    else m.exposedShooterSamples++;
   }
   const screenId=state.teamPlans[team].defense?.screenId;
   if(screenId!=null){m.screenAssignedSamples++;if(state.squads[screenId]?.alive>0)m.screenAliveSamples++;}
  }
 }
 const result={...scenario,variant,winner:state.winner,seconds:Number(state.elapsed.toFixed(2)),
  playerWon:state.winner===team,playerHealthAtEnd:state.playerHealth,ownCompanyAlive:leader.alive,
  pikeAlive:state.squads.find(s=>s.team===team&&s.type==='pike').alive,
  musketAlive:state.squads.find(s=>s.team===team&&s.type==='musket').alive,
  metrics:m};
 if(result.winner==null)throw Error('Original 600s match is inconclusive; report failure');
 if(variant==='baseline'){
  const [winner,seconds]=expected[role+'/'+order+'/'+team];
  if(result.winner!==winner||result.seconds!==seconds)throw Error('Baseline no longer matches verified 64-match archive');
 }
 return result;
}
export function summarize(rows){
 const out={scenarios:rows.length/4,battles:rows.length,byRoleOrder:{},avatarCounterfactualFlippedWinner:0,aiReplacementFlippedWinner:0};
 for(const role of ['musket','pike'])for(const order of ['advance','hold']){
  const key=role+'/'+order;out.byRoleOrder[key]={};
  for(const variant of variants){
   const x=rows.filter(r=>r.role===role&&r.order===order&&r.variant===variant);
   const protectedCount=x.reduce((n,r)=>n+r.metrics.protectedShooterSamples,0);
   const exposedCount=x.reduce((n,r)=>n+r.metrics.exposedShooterSamples,0);
   out.byRoleOrder[key][variant]={games:x.length,wins:x.filter(r=>r.playerWon).length,
    closeEscortPercent:Math.round(1000*protectedCount/Math.max(1,protectedCount+exposedCount))/10,
    avatarHits:x.reduce((n,r)=>n+r.metrics.avatarHits,0),
    companyKills:x.reduce((n,r)=>n+r.metrics.ownCompanyKills,0)};
  }
 }
 const baselines=rows.filter(r=>r.variant==='baseline');
 for(const b of baselines){
  const other=rows.filter(r=>r.role===b.role&&r.team===b.team&&r.order===b.order);
  if(other.length!==4)throw Error('Missing one of four original CPU counterfactual outcomes');
  if(other.find(r=>r.variant==='no-avatar').winner!==b.winner)out.avatarCounterfactualFlippedWinner++;
  if(other.find(r=>r.variant==='ai-captain').winner!==b.winner)out.aiReplacementFlippedWinner++;
 }
 return out;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const start=Number(process.argv[2]),count=Number(process.argv[3]);
 if(!Number.isInteger(start)||start<0||start>=8||count!==1)throw Error('Usage: ...mjs START 1 (0..7)');
 const rows=variants.map(variant=>simulate(plan[start],variant));
 const out=resolve(dir,'dist/part_'+start+'.json');mkdirSync(dirname(out),{recursive:true});
 writeFileSync(out,JSON.stringify({format:'ktk-g54-protection-counterfactual-v1',sourceHash,start,rows,summary:summarize(rows)},null,2)+'\n');
 for(const r of rows)console.log(r.role,r.order,r.team,r.variant,'victory',r.winner,r.seconds,'avatarHits',r.metrics.avatarHits);
 console.log('WROTE',out);
}