import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const base=dirname(fileURLToPath(import.meta.url));
const TYPES=['musket','pike','bow','sword'],ORDERS=['advance','hold'];
export function loadCandidateEngine(){
 const c=vm.createContext({console});
 vm.runInContext(readFileSync(resolve(base,'../modules/weapon-balance.js'),'utf8'),c);
 vm.runInContext(readFileSync(resolve(base,'arena-army-battle-contact-recovery.js'),'utf8'),c);
 if(typeof c.ArenaArmyBattle?.create!=='function')throw Error('Missing G5.4 army game engine');
 return c.ArenaArmyBattle;
}
function snapshot(state){
 const count=team=>state.squads.filter(s=>s.team===team).reduce((a,s)=>a+s.alive,0);
 const blue=state.soldiers.filter(s=>s.alive&&s.team==='blue');
 const red=state.soldiers.filter(s=>s.alive&&s.team==='red');
 let near=Infinity;
 for(const b of blue)for(const r of red)near=Math.min(near,Math.hypot(b.x-r.x,b.z-r.z));
 return {second:Math.round(state.elapsed*1000)/1000,tick:state.tick,
  blue:count('blue'),red:count('red'),winner:state.winner??null,
  minEnemyDistance:Number.isFinite(near)?Math.round(near*10)/10:null};
}
export function runActualCandidate({role,command,seed=1600,maxSeconds=600}){
 if(!TYPES.includes(role)||!ORDERS.includes(command)||!Number.isInteger(seed)||
    !Number.isInteger(maxSeconds)||maxSeconds<60||maxSeconds>600||maxSeconds%60!==0)throw RangeError('Invalid candidate scenario');
 const engine=loadCandidateEngine(),state=engine.create(seed,role);
 if(state.soldiers.length!==140||state.squads.length!==8)throw Error('Unexpected G5.4 roster');
 if(engine.issueOrder(state,state.playerSquadId,command)!==true)throw Error('Player order rejected');
 const checkpoints=[snapshot(state)];
 const ticks=Math.round(maxSeconds/.08);
 for(let i=0;i<ticks&&!state.winner;i++){
  engine.step(state,.08);
  if(state.tick%750===0||state.winner)checkpoints.push(snapshot(state));
 }
 if(checkpoints.at(-1).tick!==state.tick)checkpoints.push(snapshot(state));
 const final=checkpoints.at(-1);
 const terminal=final.winner!==null&&
  (final.winner==='blue'&&final.blue>0&&final.red===0||
   final.winner==='red'&&final.red>0&&final.blue===0||
   final.winner==='draw'&&final.red===0&&final.blue===0);
 const sourceHash=createHash('sha256').update(readFileSync(resolve(base,'arena-army-battle-contact-recovery.js'))).digest('hex');
 return {format:'killtheking-g5.4-actual-candidate-case-v1',
   seed,role,command,maxSeconds,sourceHash,
   playerOrderPreserved:state.squads[state.playerSquadId].order===command,
   winner:final.winner,naturalElimination:terminal,
   seconds:final.second,initial:{blue:70,red:70},final,checkpoints,
   scope:'CPU actual G5.4 candidate engine, NOT WebGL or G8.4'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const out=resolve(process.argv[2]);
 const row=runActualCandidate({role:process.argv[3],command:process.argv[4]});
 mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(row,null,2)+'\n');
 console.log(row.role,row.command,row.seconds,row.winner||'UNRESOLVED');
 if(!row.naturalElimination||!row.playerOrderPreserved)process.exitCode=1;
}
