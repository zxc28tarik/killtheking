/** Independently verify all CPU A/B reruns with pinned source and results. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {scenarioIndex} from '../defense/protection_pilot.mjs';
import {sha,paths} from './run_v2_paired.mjs';
const here=dirname(fileURLToPath(import.meta.url));
export const reference=JSON.parse(readFileSync(resolve(here,'protection_v2_reference.json'),'utf8'));
export function verify(rows){
 if(rows.length!==12||reference.scenarios?.length!==12)throw Error('Exactly twelve matched pairs required');
 if(reference.acceptance!=='NOT_APPROVED')throw Error('This candidate has not passed release acceptance');
 for(const kind of ['baseline','bounded'])
  if(sha(paths[kind])!==reference.sourceSha256[kind])throw Error('Motor SHA changed: '+kind);
 let better=0,worse=0,changed=0;
 for(let i=0;i<12;i++){
  const row=rows[i],sc=reference.scenarios[i];
  if(row?.format!=='ktk-g54-bounded-guard-native-v1'||row.scenarioIndex!==i||
     JSON.stringify(row.scenario)!==JSON.stringify(scenarioIndex[i])||
     JSON.stringify(row.scenario)!==JSON.stringify(sc.scenario)||
     row.sourceSha256?.baseline!==reference.sourceSha256.baseline||
     row.sourceSha256?.bounded!==reference.sourceSha256.bounded)
   throw Error('Missing, misordered or falsified pair '+i);
  for(const kind of ['baseline','bounded']){
   const m=row[kind];
   if(!m?.ended||!['blue','red'].includes(m.winner)||m.seconds<0||m.seconds>600||
      m.seed!==row.scenario[0]||m.role!==row.scenario[1]||
      m.command!==row.scenario[2]||m.team!==row.scenario[3]||
      m.playerWon!==(m.winner===m.team)||m.near<0||m.uncovered<0||
      m.near+m.uncovered===0||
      Math.round(1000*m.near/(m.near+m.uncovered))/10!==m.protectedPct)
    throw Error('Invalid native battle outcome '+i+'/'+kind);
   if(JSON.stringify(reference.fields.map(key=>m[key]))!==JSON.stringify(sc[kind]))
    throw Error('CPU reference drift '+i+'/'+kind);
  }
  if(row.bounded.protectedPct>row.baseline.protectedPct)better++;
  if(row.bounded.protectedPct<row.baseline.protectedPct)worse++;
  if(row.bounded.winner!==row.baseline.winner)changed++;
 }
 const stat=kind=>{
  const x=rows.map(r=>r[kind]);
  return {coverageMeanPct:Math.round(x.reduce((s,r)=>s+r.protectedPct,0)/12*100)/100,
   durationMeanSec:Math.round(x.reduce((s,r)=>s+r.seconds,0)/12*100)/100,
   playerWins:x.filter(r=>r.playerWon).length,
   naturalEndings:x.filter(r=>r.ended).length,
   guardSamples:x.reduce((s,r)=>s+r.secondGuard,0)};
 };
 const base=stat('baseline'),bounded=stat('bounded');
 if(JSON.stringify(base)!==JSON.stringify(reference.summary.baseline)||
    JSON.stringify(bounded)!==JSON.stringify(reference.summary.bounded)||
    better!==8||worse!==4||changed!==1)
  throw Error('Baseline vs bounded 12-match aggregate differs from real evidence');
 return {format:'ktk-g54-bounded-guard-24native-v1',
  sourceSha256:reference.sourceSha256,rows,
  summary:{baseline:base,priorPilot:reference.summary.priorPilot,bounded,
   coverageImproved:better,coverageRegressed:worse,winnersChanged:changed,
   durationSavedVsPilotSec:Math.round((reference.summary.priorPilot.durationMeanSec-bounded.durationMeanSec)*100)/100,
   additionalDurationVsBaselineSec:Math.round((bounded.durationMeanSec-base.durationMeanSec)*100)/100,
   releaseGate:'NOT_APPROVED',webGLVerified:false,G8_4Recovered:false}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=resolve(here,process.argv[2]||'dist/replay');
 const rows=scenarioIndex.map((_,i)=>JSON.parse(readFileSync(resolve(dir,'part_'+i+'.json'),'utf8')));
 const result=verify(rows);
 const output=resolve(dir,'BOUNDED_GUARD_12_MATCH_PAIRS.json');
 writeFileSync(output,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result.summary,null,2));
 console.log('PASS: replay integrity, NOT APPROVED for release');
}