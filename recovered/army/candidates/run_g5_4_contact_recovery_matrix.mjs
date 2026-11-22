/** Reproducible G5.4 candidate CPU battle outcomes; no alternate victory rule. */
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {evaluateBattleClosure,summarizeClosureMatrix} from '../g5_4_battle_closure_audit.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
const tickSeconds=.08;
const classes=['musket','pike','bow','sword'];
const orders=['advance','hold'];
export function loadCandidateEngine(){
 const s=vm.createContext({console});
 vm.runInContext(readFileSync(resolve(dir,'../modules/weapon-balance.js'),'utf8'),s,{timeout:3000});
 vm.runInContext(readFileSync(resolve(dir,'arena-army-battle-contact-recovery.js'),'utf8'),s,{timeout:3000});
 if(typeof s.ArenaArmyBattle?.create!=='function')throw Error('Missing G5.4 engine');
 return s.ArenaArmyBattle;
}
function capture(state){
 const blueAlive=state.squads.filter(s=>s.team==='blue').reduce((n,s)=>n+s.alive,0);
 const redAlive=state.squads.filter(s=>s.team==='red').reduce((n,s)=>n+s.alive,0);
 const blue=state.soldiers.filter(s=>s.alive&&s.team==='blue');
 const red=state.soldiers.filter(s=>s.alive&&s.team==='red');
 let closest=Infinity;
 for(const x of blue)for(const y of red)closest=Math.min(closest,Math.hypot(x.x-y.x,x.z-y.z));
 return {at:Math.round(state.elapsed*1000)/1000,tick:state.tick,blueAlive,redAlive,
  winner:state.winner??null,closestOpposingSoldiers:Number.isFinite(closest)?Math.round(closest*10)/10:null,
  blueRangedSquads:state.squads.filter(s=>s.team==='blue'&&s.alive>0&&['musket','bow'].includes(s.type)).map(s=>({id:s.id,x:Math.round(s.x*10)/10,z:Math.round(s.z*10)/10,order:s.order})),
  redRangedSquads:state.squads.filter(s=>s.team==='red'&&s.alive>0&&['musket','bow'].includes(s.type)).map(s=>({id:s.id,x:Math.round(s.x*10)/10,z:Math.round(s.z*10)/10,order:s.order}))};
}
export function simulateCandidate(engine,{role='pike',order='hold',seed=1600,maxSeconds=600}={}){
 if(!classes.includes(role)||!orders.includes(order)||!Number.isInteger(seed)||!Number.isInteger(maxSeconds)||maxSeconds<60||maxSeconds>600||maxSeconds%60!==0)throw new RangeError('Invalid G5.4 CPU run');
 const state=engine.create(seed,role);
 if(state.soldiers.length!==140||state.squads.length!==8)throw Error('Wrong army roster');
 if(engine.issueOrder(state,state.playerSquadId,order)!==true)throw Error('Player order was rejected');
 const checkpoints=[capture(state)];
 const steps=Math.round(maxSeconds/tickSeconds);
 for(let i=0;i<steps&&!state.winner;i++){
  engine.step(state,tickSeconds);
  if(state.tick%750===0||state.winner)checkpoints.push(capture(state));
 }
 if(checkpoints.at(-1).tick!==state.tick)checkpoints.push(capture(state));
 return {seed,role,command:order,simulatedSeconds:state.elapsed,ticks:state.tick,checkpoints};
}
export function runCandidateMatrix({seed=1600,roles=classes,commands=orders,maxSeconds=600,logger=()=>{}}={}){
 if(!Array.isArray(roles)||!roles.length||roles.some(r=>!classes.includes(r))||new Set(roles).size!==roles.length)throw new RangeError('Invalid role subset');
 if(!Array.isArray(commands)||!commands.length||commands.some(c=>!orders.includes(c))||new Set(commands).size!==commands.length)throw new RangeError('Invalid command subset');
 const engine=loadCandidateEngine(),cases=[];
 for(const role of roles)for(const command of commands){
  const t=simulateCandidate(engine,{role,order:command,seed,maxSeconds});
  const c=evaluateBattleClosure(t,{enduranceSeconds:maxSeconds,staleWindowSeconds:maxSeconds/2});
  cases.push({role,command,seed,...c,checkpoints:t.checkpoints});
  logger({role,command,seconds:c.seconds,winner:c.terminalWinner,verdict:c.verdict});
 }
 const src=readFileSync(resolve(dir,'arena-army-battle-contact-recovery.js'));
 const summary=summarizeClosureMatrix(cases);
 return {format:'killtheking-g5.4-contact-recovery-real-engine-matrix-v1',
  source:'G5.4 recovered battle engine (modified candidate, NOT G8.4)',
  engineSourceFile:'recovered/army/candidates/arena-army-battle-contact-recovery.js',
  engineSha256:createHash('sha256').update(src).digest('hex'),seed,maxSeconds,
  originalG54:'8 of 8 original G5.4 scripted 600s matches unresolved (seed 1600)',
  afterAllConcluded:cases.every(c=>c.hasTerminalWinner),summary,cases,
  notes:['True natural elimination only; no new victory condition','Human player commands are scripted, not human WebGL play','G8.4 missing','No FPS/TPS alteration','Only one random seed; performance and fairness not validated']};
}
const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
 const dest=resolve(process.argv[2]||resolve(dir,'dist/G5_4_CONTACT_RECOVERY_MATRIX.json'));
 const roles=process.argv[3]?process.argv[3].split(','):classes;
 const commands=process.argv[4]?process.argv[4].split(','):orders;
 const out=runCandidateMatrix({roles,commands,logger:c=>console.log(c.role,c.command,c.seconds,c.winner??'UNRESOLVED')});
 mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify(out.summary));
 console.log('All selected cases concluded:',out.afterAllConcluded,'JSON:',dest);
 if(!out.afterAllConcluded)process.exitCode=1;
}
