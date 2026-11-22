/** Passive measurements of actual G5.4 engine: never modify armament or AI rules. */
import {readFileSync,writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url));
const engineName='arena-army-battle-true-side-swap.js';
const source=readFileSync(existsSync(resolve(root,engineName))?resolve(root,engineName):resolve(root,'../'+engineName),'utf8');
const sha256=createHash('sha256').update(source).digest('hex');
const ctx=vm.createContext({console});
vm.runInContext(readFileSync(existsSync(resolve(root,'weapon-balance.js'))?resolve(root,'weapon-balance.js'):resolve(root,'../../modules/weapon-balance.js'),'utf8'),ctx);
vm.runInContext(source,ctx);
const E=ctx.ArenaArmyBattle;
if (!E) throw Error('Actual G5.4 engine not loaded');
const range={musket:100,pike:5.4,bow:90,sword:3.6};
const sides=['blue','red'];
const roles=['musket','pike'];
const commands=['advance','hold'];
const seeds=[1600,1776,2026,31415];
const scenarios=seeds.flatMap(seed=>roles.flatMap(role=>commands.flatMap(order=>sides.map(side=>({seed,role,order,side})))));
const armyFrom=(state,team)=>state.soldiers.filter(s=>s.alive&&s.team===team);
const byClass=()=>Object.fromEntries(['musket','pike','bow','sword'].map(k=>[k,0]));
function measure(state,company,metric){
 const units=state.soldiers.filter(s=>s.alive&&s.squadId===company.id);
 const enemies=armyFrom(state,company.team==='blue'?'red':'blue');
 let eligible=0,blocked=0,ready=0,clear=0,losBlocked=0;
 for(const soldier of units){
  const candidates=enemies.filter(e=>Math.hypot(e.x-soldier.x,e.z-soldier.z)<range[soldier.type]);
  if(!candidates.length)continue;
  eligible++;
  if(soldier.reload>0.10)continue;
  ready++;
  let foundClear=false;
  for(const enemy of candidates){
   if(company.type!=='musket'||!E.rangedBodyBlocked(state,soldier,enemy)){foundClear=true;break;}
  }
  if(foundClear)clear++;
  else blocked++;
 }
 metric.samples++;
 metric.aliveSnapshots+=units.length;
 metric.inRangeSoldierSamples+=eligible;
 metric.readyToFireSoldierSamples+=ready;
 metric.clearLineSoldierSamples+=clear;
 metric.blockedLineSoldierSamples+=blocked;
 metric.squadDecisionSnapshots+=company.decisionCount;
 if(company.type==='musket')metric.volleySamples[company.fireMode]=(metric.volleySamples[company.fireMode]||0)+1;
}
function run({seed,role,order,side}){
 const state=E.create(seed,role,side),company=state.squads[state.playerSquadId];
 if(!company||!company.playerControlled||company.team!==side||company.type!==role)throw Error('invalid real side ownership');
 if(!E.issueOrder(state,company.id,order))throw Error('order rejected');
 const metric={samples:0,aliveSnapshots:0,inRangeSoldierSamples:0,readyToFireSoldierSamples:0,clearLineSoldierSamples:0,blockedLineSoldierSamples:0,squadDecisionSnapshots:0,volleySamples:{},
  attacksAttempted:byClass(),damageEvents:byClass(),damageTotal:byClass(),kills:byClass(),shotsAttemptedByPlayerCompany:0,hitsByPlayerCompany:0,killsByPlayerCompany:0,attackEventsByTeam:{blue:0,red:0},firstContactSeconds:null,firstPlayerCompanyShotSeconds:null};
 const prevReload=state.soldiers.map(s=>s.reload);
 while(!state.winner&&state.tick<7500){
  E.step(state,.08);
  for(const s of state.soldiers){
   if(s.reload>prevReload[s.id]+.5){
    metric.attacksAttempted[s.type]++;
    if(s.squadId===company.id){metric.shotsAttemptedByPlayerCompany++;if(metric.firstPlayerCompanyShotSeconds===null)metric.firstPlayerCompanyShotSeconds=Number(state.elapsed.toFixed(2));}
   }
   prevReload[s.id]=s.reload;
  }
  for(const ev of E.drainCombatEvents(state)){
   if(ev.kind!=='soldier'||ev.attackerId==null)continue;
   const attacker=state.soldiers[ev.attackerId];
   if(!attacker)throw Error('Missing event attacker');
   metric.damageEvents[attacker.type]++;
   metric.damageTotal[attacker.type]+=ev.damage;
   if(ev.killed)metric.kills[attacker.type]++;
   if(attacker.squadId===company.id){metric.hitsByPlayerCompany++;if(ev.killed)metric.killsByPlayerCompany++;}
   metric.attackEventsByTeam[attacker.team]++;
   if(metric.firstContactSeconds===null)metric.firstContactSeconds=Number(state.elapsed.toFixed(2));
  }
  if(state.tick%30===0)measure(state,company,metric);
 }
 if(company.order!==order||!state.winner)throw Error("Scenario did not conclude or command was overwritten: "+JSON.stringify({seed,role,order,side}));
 const survivors=state.squads.filter(x=>x.team===side).reduce((n,x)=>n+x.alive,0);
 return {seed,role,order,side,winner:state.winner,playerWon:state.winner===side,seconds:Number(state.elapsed.toFixed(2)),survivors,
   playerSquadSurvivors:company.alive,...metric};
}
const args=process.argv.slice(2);
const start=args.length?Number(args[0]):0,count=args.length?Number(args[1]):scenarios.length;
if(!Number.isInteger(start)||!Number.isInteger(count)||start<0||count<1||start+count>scenarios.length)throw Error('Usage: script [START COUNT]');
const rows=[];
for(const entry of scenarios.slice(start,start+count)){
 const data=run(entry);rows.push(data);
 console.log(entry.seed,entry.role,entry.order,entry.side,data.winner,data.seconds,'attempts',data.shotsAttemptedByPlayerCompany,'hits',data.hitsByPlayerCompany,'kills',data.killsByPlayerCompany,'inrange',data.inRangeSoldierSamples,'ready-clear',data.clearLineSoldierSamples,'ready-blocked',data.blockedLineSoldierSamples);
}
const out=resolve(root,'reports/musket_diagnostic_'+start+'_'+count+'.json');
mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify({format:'g54-musket-pike-observation-v1',engineSha256:sha256,start,count,rows,limitations:{simulatedCPU:true,noHumanManualShooting:true,weaponDamageUntouched:true,notStrictMirror:true}},null,2)+'\n');
console.log('WRITTEN',out);
