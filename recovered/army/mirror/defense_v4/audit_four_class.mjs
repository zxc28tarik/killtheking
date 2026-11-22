/** Independent integrity gate for 32 real G5.4 scenario pairs = 64 native battles. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {scenarioIndex} from './four_class_compare.mjs';
import {createHash} from 'node:crypto';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const expectedHashes={
 baseline:'307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841',
 candidate:'5ba893b6e812943e77607ed1b288be93b1e2daeeb6fdf6569b54907a38db0826'
};
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const avg=(rows,field)=>Number((rows.reduce((sum,x)=>sum+x[field],0)/rows.length).toFixed(2));
const summary=(pairs)=>{
 const a=pairs.map(p=>p.baseline),b=pairs.map(p=>p.candidate);
 const roles=['musket','pike','bow','sword'];
 const byClass=Object.fromEntries(roles.map(role=>{
  const xx=pairs.filter(p=>p.scenario[1]===role),old=xx.map(p=>p.baseline),next=xx.map(p=>p.candidate);
  return [role,{pairs:xx.length,baseProtectionPct:avg(old,'protectedPct'),
   newProtectionPct:avg(next,'protectedPct'),
   baselineFiringOpportunityPct:avg(old,'firingOpportunityPct'),
   newFiringOpportunityPct:avg(next,'firingOpportunityPct'),
   meanSecondsOld:avg(old,'seconds'),meanSecondsNew:avg(next,'seconds'),
   naturalEndingsOld:old.filter(x=>x.ended).length,
   naturalEndingsNew:next.filter(x=>x.ended).length,
   commanderWinsOld:old.filter(x=>x.playerWon).length,
   commanderWinsNew:next.filter(x=>x.playerWon).length,
   coverageImproved:xx.filter(p=>p.candidate.protectedPct>p.baseline.protectedPct).length,
   coverageRegressed:xx.filter(p=>p.candidate.protectedPct<p.baseline.protectedPct).length,
   winnerChanged:xx.filter(p=>p.candidate.winner!==p.baseline.winner).length}];
 }));
 return {pairs:pairs.length,battles:pairs.length*2,
  naturalEndingsOld:a.filter(x=>x.ended).length,naturalEndingsNew:b.filter(x=>x.ended).length,
  averageProtectionOld:avg(a,'protectedPct'),averageProtectionNew:avg(b,'protectedPct'),
  averageFiringOpportunityOld:avg(a,'firingOpportunityPct'),averageFiringOpportunityNew:avg(b,'firingOpportunityPct'),
  averageDurationOld:avg(a,'seconds'),averageDurationNew:avg(b,'seconds'),
  baselineCommanderWins:a.filter(x=>x.playerWon).length,newCommanderWins:b.filter(x=>x.playerWon).length,
  coverageImproved:pairs.filter(p=>p.candidate.protectedPct>p.baseline.protectedPct).length,
  coverageRegressed:pairs.filter(p=>p.candidate.protectedPct<p.baseline.protectedPct).length,
  changedWinners:pairs.filter(p=>p.baseline.winner!==p.candidate.winner).length,
  byClass,releaseGate:'NOT_APPROVED',actualWebGLVerified:false,g84SourceVerified:false};
};
export function validate(pairs){
 if(!Array.isArray(pairs)||pairs.length!==32||scenarioIndex.length!==32)throw Error('All 32 scenario pairs required');
 if(sha(resolve(root,'arena-army-battle-true-side-swap.js'))!==expectedHashes.baseline||
    sha(resolve(root,'arena-army-battle-protection-v3-role-gated.js'))!==expectedHashes.candidate)
  throw Error('G5.4 motor source hashes changed');
 for(let i=0;i<32;i++){
  const p=pairs[i],scenario=scenarioIndex[i];
  if(!p||p.scenarioIndex!==i||p.format!=='ktk-g54-four-class-v3-v1'||
     JSON.stringify(p.scenario)!==JSON.stringify(scenario)||
     JSON.stringify(p.sourceHashes)!==JSON.stringify(expectedHashes))
   throw Error('Missing, duplicate or fake game scenario/source '+i);
  for(const [mode,one] of [['baseline',p.baseline],['candidate',p.candidate]]){
   if(!one||one.seed!==scenario[0]||one.role!==scenario[1]||one.command!==scenario[2]||one.team!==scenario[3]||
      !['blue','red',null].includes(one.winner)||
      one.playerWon!==(one.winner===one.team)||one.ended!==(one.winner!==null)||
      !Number.isFinite(one.seconds)||one.seconds>600.01||one.seconds<0||
      one.near+one.uncovered<=0||one.shootersInRange+one.shootersOutOfRange!==one.near+one.uncovered||
      Math.round(1000*one.near/(one.near+one.uncovered))/10!==one.protectedPct||
      Math.round(1000*one.shootersInRange/(one.shootersInRange+one.shootersOutOfRange))/10!==one.firingOpportunityPct||
      one.aliveBlue<0||one.aliveRed<0||one.aliveBlue>70||one.aliveRed>70||
      one.ended&&(one.winner==='blue'?one.aliveRed!==0:one.aliveBlue!==0)||
      !one.ended&&one.seconds<599.9||
      one.playerKilled>70||one.enemyKilled>70||
      !Number.isFinite(one.shooterDamage)||
      !Number.isFinite(one.meleeDamage))
    throw Error('Untrustworthy actual '+mode+' combat events '+i);
  }
 }
 return {format:'ktk-g54-full-four-class-64-native-v1',sourceHashes:expectedHashes,
  caveats:{notPerfectTraitMirror:true,noManualAvatarShooting:true,noWebGL:true,notTheMissingG8_4:true},
  summary:summary(pairs),pairs};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const folder=resolve(process.argv[2]||resolve(here,'replay'));
 const pairs=Array.from({length:32},(_,i)=>
  JSON.parse(readFileSync(resolve(folder,'part_'+i+'.json'),'utf8')));
 const report=validate(pairs),out=resolve(folder,'FULL_64_ACTUAL_G54_BATTLES.json');
 writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report.summary,null,2));
 console.log('DIAGNOSTIC PASS — NOT AUTOMATIC GAMEPLAY ACCEPTANCE',out);
}