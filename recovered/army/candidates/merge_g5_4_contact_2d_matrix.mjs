/** Verify real CPU match evidence; never forge a timeout victory. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {evaluateBattleClosure} from '../g5_4_battle_closure_audit.mjs';
import {plan,summarize,CANDIDATE_PATH} from './run_g5_4_contact_2d_matrix.mjs';
export function mergeParts(parts,sourceSha256){
 if(!Array.isArray(parts)||parts.length!==8||!sourceSha256.match(/^[0-9a-f]{64}$/))throw Error('Eight real G5.4 blocks and valid engine digest required');
 const found=new Map();
 for(const part of parts){
  if(part.format!=='ktk-g54-contact-2d-real-match-matrix-v1'||part.engineSourceSha256!==sourceSha256||
    !Number.isInteger(part.start)||part.start%4!==0||part.n!==4||!Array.isArray(part.rows)||part.rows.length!==4)
   throw Error('Invalid engine, source, block or length');
  if(found.has(part.start))throw Error('Duplicate block');
  for(let i=0;i<4;i++){
   const row=part.rows[i],expect=plan[part.start+i];
   if(!expect||row.seed!==expect.seed||row.role!==expect.role||row.command!==expect.command)
    throw Error('Wrong real scenario order');
   const last=row.checkpoints?.at(-1);
   if(!last)throw Error('Missing final real engine checkpoint');
   const verified=evaluateBattleClosure({simulatedSeconds:row.seconds,ticks:last.tick,checkpoints:row.checkpoints},
     {enduranceSeconds:600,staleWindowSeconds:300});
   if(row.naturalWinner!==verified.terminalWinner||row.verdict!==verified.verdict||
     row.seconds!==verified.seconds||row.blueAlive!==last.blueAlive||row.redAlive!==last.redAlive)
    throw Error('Result differs from real engine checkpoints');
  }
  found.set(part.start,part.rows);
 }
 const rows=Array.from({length:8},(_,i)=>found.get(i*4)).flat();
 if(rows.length!==32||rows.some(x=>!x))throw Error('Missing complete scenarios');
 return {format:'ktk-g54-contact-2d-full32-v1',sourceSha256,limits:{gpuWebGLValidated:false,
  humanPlayerTeam:'blue only',pairedSideSwaps:0,actualG8_4Tests:0},summary:summarize(rows),rows};
}
const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
 const here=dirname(fileURLToPath(import.meta.url));
 const dir=resolve(process.argv[2]||resolve(here,'dist/contact-2d'));
 const parts=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(resolve(dir,'full_part_'+(i*4)+'.json'),'utf8')));
 const digest=createHash('sha256').update(readFileSync(CANDIDATE_PATH)).digest('hex');
 const merged=mergeParts(parts,digest);
 const output=resolve(dir,'FULL_32_MATCH_CLOSURE.json');mkdirSync(dirname(output),{recursive:true});
 writeFileSync(output,JSON.stringify(merged,null,2)+'\n');
 console.log(JSON.stringify(merged.summary));console.log('WROTE',output);
 if(!merged.summary.passed)process.exitCode=1;
}
