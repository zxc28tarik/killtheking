/** All 16 matched real CPU trial records must prove native elimination victory. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {scenarios} from './run_army_player_focus_ab.mjs';
import {patchArmyAggro,sha256} from './player_target_hotfix.mjs';

const dir=dirname(fileURLToPath(import.meta.url));
const original=readFileSync(resolve(dir,'../mirror/arena-army-battle-true-side-swap.js'),'utf8');
const hashes={baseline:sha256(original),playerFocus:sha256(patchArmyAggro(original))};
export function audit(parts){
 if(parts.length!==4||scenarios.length!==16)throw Error('Four authentic evidence shards required');
 const rows=[];
 for(let i=0;i<4;i++){
  const part=parts[i];
  if(part.format!=='ktk-g54-human-target-shard-v1'||part.start!==i*4||
    part.count!==4||JSON.stringify(part.sourceHashes)!==JSON.stringify(hashes)||
    !Array.isArray(part.rows)||part.rows.length!==4)
   throw Error('Missing/duplicate/bad-source shard '+i);
  rows.push(...part.rows);
 }
 const summary={pairs:16,totalNativeGames:32,naturallyConcluded:0,
  baselineAvatarHits:0,newAvatarHits:0,winnersChanged:0,
  baselineDurationTotal:0,newDurationTotal:0,
  releaseGate:'NOT_APPROVED',gpuWebGLProven:false,
  sharedFFAEngineProven:false,sourceG84Restored:false};
 for(let i=0;i<16;i++){
  const r=rows[i],scenario=scenarios[i];
  if(!r||r.index!==i||r.format!=='ktk-g54-human-target-ab-v1'||
    JSON.stringify(r.sourceHashes)!==JSON.stringify(hashes)||
    JSON.stringify(r.scenario)!==JSON.stringify(scenario))
   throw Error('Bad or counterfeit seeded scenario '+i);
  for(const [key,hitsField,timeField] of [
   ['baseline','baselineAvatarHits','baselineDurationTotal'],
   ['playerFocus','newAvatarHits','newDurationTotal']]){
   const g=r[key];
   if(!g||!g.endedNaturally||!['red','blue'].includes(g.winner)||
     (g.winner==='red'?g.blueAlive!==0:g.redAlive!==0)||
     !Number.isFinite(g.elapsed)||g.elapsed<0||g.elapsed>600||
     !Number.isInteger(g.avatarHits)||g.avatarHits<0||
     !Number.isFinite(g.playerHealth)||g.playerHealth>100||
     !g.humanOrderPreserved)
    throw Error('One authentic game did not end naturally / corrupted '+i+' '+key);
   summary.naturallyConcluded++;
   summary[hitsField]+=g.avatarHits;summary[timeField]+=g.elapsed;
  }
  if(r.baseline.winner!==r.playerFocus.winner)summary.winnersChanged++;
 }
 summary.meanSecondsBaseline=Number((summary.baselineDurationTotal/16).toFixed(2));
 summary.meanSecondsFixed=Number((summary.newDurationTotal/16).toFixed(2));
 delete summary.baselineDurationTotal;delete summary.newDurationTotal;
 return {format:'ktk-g54-human-target-32-real-games-audit-v1',sourceHashes:hashes,
  limitations:['CPU-scripted player order only','No browser FPS rendering',
    'Seed 1600 only','No exact geometric mirror','NOT G8.4'],
  summary,rows};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const folder=resolve(process.argv[2]||resolve(dir,'dist/player-focus'));
 const parts=[0,4,8,12].map(i=>JSON.parse(readFileSync(resolve(folder,'part_'+i+'.json'),'utf8')));
 const done=audit(parts),path=resolve(folder,'FULL_32_REAL_BATTLES.json');
 writeFileSync(path,JSON.stringify(done,null,2)+'\n');
 console.log(JSON.stringify(done.summary,null,2));
 console.log('Diagnostic accepted; release NOT APPROVED',path);
}
