/** Audit ALL 12 authentic CPU replays against source-pinned originals and v3 measurements. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {scenarioIndex} from '../defense/protection_pilot.mjs';
import {hash} from './replay_v3.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const candidate=JSON.parse(readFileSync(resolve(here,'guard_v3_reference.json'),'utf8'));
const history=JSON.parse(readFileSync(resolve(here,'../defense_v2/protection_v2_reference.json'),'utf8'));
const paths={
 baseline:resolve(here,'../arena-army-battle-true-side-swap.js'),
 v2:resolve(here,'../arena-army-battle-protection-v2-bounded.js'),
 v3:resolve(here,'../arena-army-battle-protection-v3-role-gated.js')
};
const mean=(rows,key)=>Math.round(rows.reduce((n,r)=>n+r[key],0)/rows.length*100)/100;
export function validate(rows){
 if(rows.length!==12||candidate.expectedV3.length!==12||history.scenarios.length!==12)
  throw Error('Twelve authentic matches and historical rows mandatory');
 for(const version of ['baseline','v2','v3']){
  if(hash(paths[version])!==candidate.sourceSHA256[version])
   throw Error('Source SHA mismatch '+version);
 }
 const results=[];
 for(let i=0;i<12;i++){
  const row=rows[i],scenario=scenarioIndex[i],e=candidate.expectedV3[i],h=history.scenarios[i];
  if(row?.format!==candidate.format||row.index!==i||
    row.sourceSHA256!==candidate.sourceSHA256.v3||
    JSON.stringify(row.scenario)!==JSON.stringify(scenario)||
    JSON.stringify(h.scenario)!==JSON.stringify(scenario))
   throw Error('Wrong index, team, seed, commander order or engine source '+i);
  const o=row.data;
  if(!o||o.seed!==scenario[0]||o.role!==scenario[1]||
     o.command!==scenario[2]||o.team!==scenario[3]||
     !o.ended||!['blue','red'].includes(o.winner)||
     o.seconds>600||o.playerWon!==(o.winner===o.team)||
     (o.winner===o.team?o.enemyKilled!==70:o.playerKilled!==70)||
     o.near+o.uncovered<=0||
     Math.round(1000*o.near/(o.near+o.uncovered))/10!==o.protectedPct)
   throw Error('Non-natural or corrupt real engine combat evidence '+i);
  const sampled=candidate.fields.map(field=>o[field]);
  if(JSON.stringify(sampled)!==JSON.stringify(e))
   throw Error('Native combat deviates from pinned G5.4 v3 event trace '+i);
  results.push(o);
 }
 const coverageUp=results.filter((r,i)=>r.protectedPct>history.scenarios[i].baseline[2]).length;
 const coverageDown=results.filter((r,i)=>r.protectedPct<history.scenarios[i].baseline[2]).length;
 const sameWinnerBaseline=results.filter((r,i)=>r.winner===history.scenarios[i].baseline[0]).length;
 const sameWinnerV2=results.filter((r,i)=>r.winner===history.scenarios[i].bounded[0]).length;
 const summary={
  pairs:12,nativeV3Battles:12,naturalEndings:results.filter(r=>r.ended).length,
  baselineProtectionPercent:history.summary.baseline.coverageMeanPct,
  v2ProtectionPercent:history.summary.bounded.coverageMeanPct,
  v3ProtectionPercent:mean(results,'protectedPct'),
  baselineMeanSeconds:history.summary.baseline.durationMeanSec,
  v2MeanSeconds:history.summary.bounded.durationMeanSec,
  v3MeanSeconds:mean(results,'seconds'),
  protectionImprovedCases:coverageUp,protectionWorsenedCases:coverageDown,
  sameWinnerAsOriginal:sameWinnerBaseline,sameWinnerAsV2:sameWinnerV2,
  v3HumanTeamWins:results.filter(r=>r.playerWon).length,
  browserGPUVerified:false,G8_4Restored:false,
  releaseGate:'NOT_APPROVED'
 };
 for(const [key,value] of Object.entries(candidate.summary)){
  const remap={v3NaturalEndings:'naturalEndings',v3CoveragePercent:'v3ProtectionPercent',
   v3AverageSeconds:'v3MeanSeconds',v3PlayerWins:'v3HumanTeamWins',
   coverageUpFromBaseline:'protectionImprovedCases',coverageDownFromBaseline:'protectionWorsenedCases',
   identicalWinnersToBaseline:'sameWinnerAsOriginal',identicalWinnersToV2:'sameWinnerAsV2'};
  const real=remap[key]||key;
  if(real in summary&&summary[real]!==value)
   throw Error('Summary mismatch: '+key+' '+summary[real]+' expected '+value);
 }
 if(summary.v3ProtectionPercent!==45.97||summary.v3MeanSeconds!==283.66||
    coverageUp!==6||coverageDown!==6||sameWinnerBaseline!==12||
    sameWinnerV2!==11||summary.v3HumanTeamWins!==2)
  throw Error('V3 result does not match independently sampled CPU evidence');
 return {format:candidate.format,sourceSHA256:candidate.sourceSHA256,summary,
  historicalValuesArePinnedNotRerun:true,rows};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const folder=resolve(process.argv[2]||resolve(here,'replay'));
 const rows=scenarioIndex.map((_,i)=>JSON.parse(readFileSync(resolve(folder,'part_'+i+'.json'),'utf8')));
 const audit=validate(rows),out=resolve(folder,'G5_4_GUARD_V3_12_NATIVE_COMPARISON.json');
 writeFileSync(out,JSON.stringify(audit,null,2)+'\n');
 console.log(JSON.stringify(audit.summary,null,2));
 console.log('DIAGNOSTIC ONLY — NOT APPROVED FOR GAMEPLAY',out);
}