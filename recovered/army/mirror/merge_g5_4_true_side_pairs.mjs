/** Validate 32 matched blue/red real-engine pairs; no fabricated winner. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {plan,engineDigest,summarize} from './run_g5_4_true_side_pairs.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const roleIndex=role=>['musket','pike','bow','sword'].indexOf(role);
export function mergeParts(parts,digest){
 if(parts.length!==8||!(/^[a-f0-9]{64}$/).test(digest))throw Error('Eight real engine blocks required');
 const seen=new Map();
 for(const p of parts){
  if(p.format!=='ktk-g54-true-side-swap-v1'||p.engineSha256!==digest||
   p.count!==4||p.start%4!==0||p.rows?.length!==4||seen.has(p.start))
   throw Error('Invalid source hash, block or duplicate');
  for(let j=0;j<4;j++){
   const r=p.rows[j],expect=plan[p.start+j];
   if(!expect||r.seed!==expect.seed||r.role!==expect.role||r.command!==expect.command)
    throw Error('Real scenario mismatch');
   for(const team of ['blue','red']){
    const g=r[team],last=g?.checkpoints?.at(-1);
    if(!last||g.team!==team||g.playerSquadId!==roleIndex(expect.role)+(team==='red'?4:0)||
     !g.orderPreserved||g.initial?.tick!==0||g.initial?.blueAlive!==70||
     g.initial?.redAlive!==70||g.initial?.winner!==null||
     g.seconds!==last.seconds||g.naturalWinner!==last.winner||
     g.playerWon!==(last.winner===team)||g.endedBeforeDeadline!==(last.winner!==null)||
     (last.winner==='blue'&&last.redAlive!==0)||
     (last.winner==='red'&&last.blueAlive!==0)||
     (last.winner===null&&last.seconds<599.99)||
     !g.checkpoints.every((point,i,a)=>i===0||
       point.tick>=a[i-1].tick&&point.blueAlive<=a[i-1].blueAlive&&
       point.redAlive<=a[i-1].redAlive))
     throw Error('Inconsistent real battle evidence');
   }
   if(r.winnerStableAcrossSides!==(r.blue.naturalWinner===r.red.naturalWinner&&r.blue.naturalWinner!==null)||
      r.unresolved!==(r.blue.naturalWinner===null||r.red.naturalWinner===null))
     throw Error('Invalid pair outcomes');
  }
  seen.set(p.start,p.rows);
 }
 const rows=Array.from({length:8},(_,i)=>seen.get(i*4)).flat();
 if(rows.length!==32||rows.some(row=>!row))throw Error('Missing matched pairs');
 return {format:'ktk-g54-true-side-swap-full64-v1',engineSha256:digest,
  limits:{gpuWebGLVerified:false,actualG8_4Tests:0,strictRngMirroring:false},
  summary:summarize(rows),rows};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=resolve(process.argv[2]||resolve(here,'dist/mirror'));
 const parts=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(resolve(dir,'part_'+i*4+'.json'),'utf8')));
 const result=mergeParts(parts,engineDigest()),out=resolve(dir,'FULL_64_TRUE_SIDE_SWAP.json');
 writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result.summary));console.log('WROTE',out);
}