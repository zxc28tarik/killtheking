/** Real G5.4 candidate regression matrix, preserves human orders and native elimination victory. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {simulateCandidate} from './run_g5_4_contact_recovery_matrix.mjs';
import {evaluateBattleClosure} from '../g5_4_battle_closure_audit.mjs';
export const CANDIDATE_PATH=resolve(dirname(fileURLToPath(import.meta.url)),'arena-army-battle-contact-2d-candidate.js');
export function loadEngine2D(){
 const c=vm.createContext({console});
 vm.runInContext(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../modules/weapon-balance.js'),'utf8'),c,{timeout:3000});
 vm.runInContext(readFileSync(CANDIDATE_PATH,'utf8'),c,{timeout:3000});
 if(!c.ArenaArmyBattle?.create)throw Error('Missing real G5.4 candidate engine');
 return c.ArenaArmyBattle;
}
const here=dirname(fileURLToPath(import.meta.url));
export const seeds=Object.freeze([1600,1776,2026,31415]);
export const roles=Object.freeze(['musket','pike','bow','sword']);
export const commands=Object.freeze(['advance','hold']);
export const plan=Object.freeze(seeds.flatMap(seed=>roles.flatMap(role=>commands.map(command=>({seed,role,command})))));
export function summarize(rows){
 if(rows.some(x=>!plan.some(c=>c.seed===x.seed&&c.role===x.role&&c.command===x.command)))throw Error('Unknown real engine scenario');
 const unique=new Set(rows.map(c=>c.seed+':'+c.role+':'+c.command));
 if(unique.size!==rows.length)throw Error('Duplicate scenario');
 return {cases:rows.length,wins:rows.filter(c=>c.naturalWinner!==null).length,unresolved:rows.filter(c=>c.naturalWinner===null).length,
  maxTime:Math.max(...rows.map(c=>c.seconds)),
  bySeed:seeds.map(seed=>({seed,cases:rows.filter(x=>x.seed===seed).length,wins:rows.filter(x=>x.seed===seed&&x.naturalWinner!==null).length})),
  passed:rows.length===32&&rows.every(c=>c.naturalWinner!==null),
  trueSideSwapMatches:0};
}
export function run(engine,c){
 const raw=simulateCandidate(engine,{seed:c.seed,role:c.role,order:c.command,maxSeconds:600});
 const r=evaluateBattleClosure(raw,{enduranceSeconds:600,staleWindowSeconds:300});
 return {seed:c.seed,role:c.role,command:c.command,seconds:r.seconds,naturalWinner:r.terminalWinner,
  verdict:r.verdict,blueAlive:raw.checkpoints.at(-1).blueAlive,redAlive:raw.checkpoints.at(-1).redAlive,
  checkpoints:raw.checkpoints};
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main){
 const start=Number(process.argv[2]),n=Number(process.argv[3]);
 if(!Number.isInteger(start)||!Number.isInteger(n)||start<0||n<1||start+n>plan.length)throw Error('Usage: node run_... START COUNT');
 const engine=loadEngine2D();const rows=[];
 for(const c of plan.slice(start,start+n)){
  const result=run(engine,c);rows.push(result);
  console.log(c.seed,c.role,c.command,result.seconds,result.naturalWinner||'UNRESOLVED',result.blueAlive,result.redAlive);
 }
 const out=resolve(here,'dist/contact-2d/full_part_'+start+'.json');mkdirSync(dirname(out),{recursive:true});
 const engineSourceSha256=createHash('sha256').update(readFileSync(CANDIDATE_PATH)).digest('hex');
 writeFileSync(out,JSON.stringify({format:'ktk-g54-contact-2d-real-match-matrix-v1',engineSourceSha256,start,n,rows,summary:summarize(rows)},null,2)+'\n');
 console.log('WROTE',out);
}
