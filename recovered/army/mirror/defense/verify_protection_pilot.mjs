/** Verify independent GitHub CPU replays against baseline and candidate pinned results. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {scenarioIndex} from './protection_pilot.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const sourcePath=x=>resolve(here,'../arena-army-battle-'+x+'.js');
const reference=JSON.parse(readFileSync(resolve(here,'protection_pilot_reference.json'),'utf8'));
export function verify(rows){
 if(rows.length!==12||reference.scenarios.length!==12)throw Error('12 matched pairs mandatory');
 if(hash(sourcePath('true-side-swap'))!==reference.baselineSha256||
   hash(sourcePath('protection-candidate'))!==reference.candidateSha256)
  throw Error('Source engine drift: cannot validate recorded CPU matches');
 let protectedBefore=0,protectedAfter=0,secsBefore=0,secsAfter=0,better=0,worse=0,changed=0,wins=0;
 for(let i=0;i<12;i++){
  const row=rows[i],scenario=scenarioIndex[i],expected=reference.scenarios[i];
  if(row?.scenarioIndex!==i||JSON.stringify(row.scenario)!==JSON.stringify(scenario))
   throw Error('Scenario number, seed, side or command mismatch '+i);
  for(const [k,referenceOutcome] of [['baseline',expected[0]],['candidate',expected[1]]]){
   const o=row[k];
   if(!o||o.seed!==scenario[0]||o.role!==scenario[1]||
     o.command!==scenario[2]||o.team!==scenario[3]||
     !o.ended||!['blue','red'].includes(o.winner)||o.seconds>600||
     o.playerWon!==(o.winner===o.team))
    throw Error('Invalid winner provenance '+i+' '+k);
   const actual=reference.fields.map(field=>o[field]);
   if(JSON.stringify(actual)!==JSON.stringify(referenceOutcome))
    throw Error('A/B result deviated from CPU reference '+i+' '+k);
   if(o.near<0||o.uncovered<0||o.near+o.uncovered<=0||
    Math.round(1000*o.near/(o.near+o.uncovered))/10!==o.protectedPct)
    throw Error('Proximity data invalid '+i+' '+k);
  }
  protectedBefore+=row.baseline.protectedPct;protectedAfter+=row.candidate.protectedPct;
  secsBefore+=row.baseline.seconds;secsAfter+=row.candidate.seconds;
  if(row.candidate.protectedPct>row.baseline.protectedPct)better++;
  if(row.candidate.protectedPct<row.baseline.protectedPct)worse++;
  if(row.candidate.winner!==row.baseline.winner)changed++;
  if(row.baseline.playerWon)wins++;
 }
 const two=x=>Math.round(x/12*100)/100;
 const summary={pairs:12,nativeMatches:24,naturalEndings:24,
  betterCoverage:better,worseCoverage:worse,changedWinners:changed,
  playerWinsBefore:wins,playerWinsAfter:wins,
  coverageBeforePercent:two(protectedBefore),coverageAfterPercent:two(protectedAfter),
  durationBeforeSeconds:two(secsBefore),durationAfterSeconds:two(secsAfter),
  releaseGate:'NOT_APPROVED',reason:'three coverage regressions; ~100s slower battles; no extra victories',
  WebGLVerified:false,G8_4SourceVerified:false};
 if(better!==9||worse!==3||changed!==0||wins!==2||summary.coverageBeforePercent!==42.93||
   summary.coverageAfterPercent!==49.68||summary.durationBeforeSeconds!==280.89||
   summary.durationAfterSeconds!==381.22)
  throw Error('Summary stats inconsistent');
 return {format:'ktk-g54-protection-pilot-24native-v1',baselineSha256:reference.baselineSha256,
  candidateSha256:reference.candidateSha256,summary,rows};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=resolve(here,process.argv[2]||'replay');
 const rows=scenarioIndex.map((_,i)=>JSON.parse(readFileSync(resolve(dir,'part_'+i+'.json'),'utf8')));
 const result=verify(rows);
 const dest=resolve(dir,'PILOT_12_PAIRED_MATCHES.json');
 writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result.summary,null,2));
 console.log('DIAGNOSTIC VALIDATION PASS, GAME RELEASE NOT APPROVED:',dest);
}