/**
 * G8.5B: paired-seed side-swap audit. QA ONLY; this module cannot execute
 * Kill the King battles or certify the production engine.
 *
 * A pair requires two runs with equal scenario, armySize and seed, with
 * mirrorSeed equal and sideSwap = original / swapped respectively.
 * This treats swapping starting sides as a documented experimental action.
 */
import { analyzeRuns, parseRuns } from './analyze_g8_5_runs.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const requiredScenarios=['classic','control_points','supply_line'];
const requiredSizes=[140,200,280];
const pct=(n,d)=>d?n/d:null;
const median=a=>{
  if(!a.length)return null;
  const s=[...a].sort((a,b)=>a-b);
  return (s[(s.length-1)>>1]+s[s.length>>1])/2;
};
const groupId=(scenario,size)=>scenario+'|'+size;
const isFiniteNonnegative=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const isSynthetic=r=>r.source!== 'production_game' || typeof r.engineBuild!=='string'||!r.engineBuild.trim();

export function auditMirrorPairs(runs, options={}){
  // Baseline schema and metric validation. Throws on malformed numeric values.
  const baseline=analyzeRuns(runs,options);
  const minPairs=options.minPairs??8;
  const maxPairedSideWinShare=options.maxPairedSideWinShare??.75;
  const scenarios=options.scenarios??requiredScenarios;
  const sizes=options.sizes??requiredSizes;
  if(!Number.isInteger(minPairs)||minPairs<1)throw Error('minPairs must be a positive integer');
  if(typeof maxPairedSideWinShare!=='number'||maxPairedSideWinShare<.5||maxPairedSideWinShare>1)throw Error('maxPairedSideWinShare must be in [0.5,1]');
  if(!Array.isArray(scenarios)||!scenarios.every(x=>typeof x==='string'&&x))throw Error('Invalid scenarios');
  if(!Array.isArray(sizes)||!sizes.every(x=>requiredSizes.includes(x)))throw Error('Invalid sizes');
  const groupRows=new Map();
  for(let i=0;i<runs.length;i++){
    const r=runs[i];
    const haveSeed=r.mirrorSeed!==undefined,haveSwap=r.sideSwap!==undefined;
    if(haveSeed!==haveSwap)throw Error('Run '+(i+1)+': mirrorSeed and sideSwap must appear together');
    if(haveSeed){
      if(!((typeof r.mirrorSeed==='string'&&r.mirrorSeed.trim())||(Number.isSafeInteger(r.mirrorSeed)&&r.mirrorSeed>=0)))throw Error('Run '+(i+1)+': invalid mirrorSeed');
      if(!['original','swapped'].includes(r.sideSwap))throw Error('Run '+(i+1)+': invalid sideSwap');
    }
    if(r.fpsMedian!==undefined&&(!isFiniteNonnegative(r.fpsMedian)||r.fpsMedian===0))throw Error('Run '+(i+1)+': invalid fpsMedian');
    if(r.frameP95Ms!==undefined&&!isFiniteNonnegative(r.frameP95Ms))throw Error('Run '+(i+1)+': invalid frameP95Ms');
    if(r.stuckSoldiers!==undefined&&(!Number.isSafeInteger(r.stuckSoldiers)||r.stuckSoldiers<0))throw Error('Run '+(i+1)+': invalid stuckSoldiers');
    const id=groupId(r.scenario,r.armySize);
    if(!groupRows.has(id))groupRows.set(id,[]);
    groupRows.get(id).push(r);
  }
  const expected=new Set(scenarios.flatMap(sc=>sizes.map(n=>groupId(sc,n))));
  const groups=[];
  const groupKeys=new Set([...groupRows.keys(),...expected]);
  for(const id of [...groupKeys].sort()){
    const rows=groupRows.get(id)||[];
    const [scenario,size]=id.split('|');
    const paired=new Map(), findings=[];
    let untagged=0;
    for(const r of rows){
      if(r.mirrorSeed===undefined){untagged++;continue;}
      const key=String(r.mirrorSeed);
      if(!paired.has(key))paired.set(key,{original:[],swapped:[]});
      paired.get(key)[r.sideSwap].push(r);
    }
    let completePairs=0,incompletePairs=0,duplicatePairs=0,seedMismatchPairs=0;
    let blueWinRuns=0,redWinRuns=0,drawRuns=0,sameBluePairs=0,sameRedPairs=0,oppositeWinnerPairs=0;
    const pairMargins=[],frames=[],fps=[],stuck=[];
    for(const record of paired.values()){
      if(record.original.length!==1||record.swapped.length!==1){
        if(record.original.length>1||record.swapped.length>1)duplicatePairs++;
        else incompletePairs++;
        continue;
      }
      const [a,b]=[record.original[0],record.swapped[0]];
      if(a.seed!==b.seed){seedMismatchPairs++;continue;}
      completePairs++;
      for(const x of [a,b]){
        if(x.winner==='blue')blueWinRuns++;
        else if(x.winner==='red')redWinRuns++;
        else drawRuns++;
      }
      if(a.winner==='blue'&&b.winner==='blue')sameBluePairs++;
      if(a.winner==='red'&&b.winner==='red')sameRedPairs++;
      if(a.winner!=='draw'&&b.winner!=='draw'&&a.winner!==b.winner)oppositeWinnerPairs++;
      pairMargins.push(((a.blueScore-a.redScore)+(b.blueScore-b.redScore))/2);
      for(const x of [a,b]){
        if(x.frameP95Ms!==undefined)frames.push(x.frameP95Ms);
        if(x.fpsMedian!==undefined)fps.push(x.fpsMedian);
        if(x.stuckSoldiers!==undefined)stuck.push(x.stuckSoldiers);
      }
    }
    const decisive=blueWinRuns+redWinRuns;
    const blueWinShare=pct(blueWinRuns,decisive);
    const matched=rows.length>=minPairs*2&&completePairs>=minPairs;
    const provenanceGood=rows.length>0&&rows.every(x=>!isSynthetic(x));
    const fromSameBuild=rows.length>0&&new Set(rows.map(x=>x.engineBuild)).size===1;
    if(!rows.length)findings.push('No matching game telemetry provided');
    if(untagged)findings.push(untagged+' runs missing explicit mirror labels');
    if(incompletePairs)findings.push(incompletePairs+' incomplete mirror pairs');
    if(duplicatePairs)findings.push(duplicatePairs+' duplicate mirror pair records');
    if(seedMismatchPairs)findings.push(seedMismatchPairs+' mirror pairs have mismatched PRNG seeds');
    if(completePairs<minPairs)findings.push(completePairs+'/'+minPairs+' required complete pairs');
    if(!provenanceGood)findings.push('Unverified provenance: source=production_game and engineBuild required for every run');
    if(!fromSameBuild)findings.push('Mixed or missing game build identifiers');
    if(completePairs>=minPairs && decisive && Math.max(blueWinRuns,redWinRuns)/decisive>maxPairedSideWinShare)
      findings.push('Possible side advantage after mirrored starting positions; inspect positions and map symmetry');
    const base=baseline.groups.find(x=>groupId(x.scenario,x.armySize)===id);
    if(base?.warnings)findings.push(...base.warnings);
    const availableFrames=rows.filter(r=>r.frameP95Ms!==undefined).length;
    const availableFps=rows.filter(r=>r.fpsMedian!==undefined).length;
    const status=!matched||!provenanceGood||!fromSameBuild||incompletePairs||duplicatePairs||seedMismatchPairs||untagged?'missing_evidence':
      findings.length?'review_required':'ready_for_human_review';
    groups.push({scenario,armySize:Number(size),expected:expected.has(id),runs:rows.length,
      completePairs,incompletePairs,duplicatePairs,seedMismatchPairs,untagged,
      provenanceGood,fromSameBuild,pairedBlueWins:blueWinRuns,pairedRedWins:redWinRuns,
      pairedDraws:drawRuns,pairedBlueWinShare:blueWinShare,
      sameBluePairs,sameRedPairs,oppositeWinnerPairs,
      pairedMedianBlueMargin:median(pairMargins),
      availableFrameSamples:availableFrames,availableFpsSamples:availableFps,
      medianFps:median(fps),medianFrameP95Ms:median(frames),medianStuckSoldiers:median(stuck),
      status,findings});
  }
  const expectedGroups=groups.filter(g=>g.expected);
  // Deliberately no 'passed' or 'approved' state: production play and GPU acceptance require human inspection.
  const overallStatus=expectedGroups.some(g=>g.status==='missing_evidence')?'missing_evidence':
    expectedGroups.some(g=>g.status==='review_required')?'review_required':'ready_for_human_review';
  return {kind:'G8_5B_INDEPENDENT_QA_ONLY',source:'input records; not gameplay execution',
    runCount:runs.length,expectedGroupCount:expected.size,minPairs,overallStatus,groups};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const [, , input, output]=process.argv;
  if(!input){console.error('Usage: node g8_5_mirror_gate.mjs reports.ndjson [report.json]');process.exit(2);}
  try{
    const result=auditMirrorPairs(parseRuns(readFileSync(input,'utf8')));
    const value=JSON.stringify(result,null,2)+'\n';
    if(output)writeFileSync(output,value);
    else process.stdout.write(value);
    console.error('G8.5B audit:',result.overallStatus,'(not a production game certification)');
    if(result.overallStatus==='missing_evidence')process.exitCode=3;
    else if(result.overallStatus==='review_required')process.exitCode=4;
  }catch(e){console.error('Input error:',e.message);process.exitCode=2;}
}
