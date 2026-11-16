import assert from 'node:assert/strict';
import { auditMirrorPairs } from './g8_5_mirror_gate.mjs';
const base={source:'production_game',engineBuild:'G8.5-build-qa-fixture',scenario:'supply_line',armySize:140,durationSeconds:240,elapsedSeconds:240,blueScore:60,redScore:48,objectiveSwitches:6,winner:'blue'};
const mirrored=(size=140,scenario='supply_line',seed=1)=>[
  {...base,scenario,armySize:size,seed,mirrorSeed:seed,sideSwap:'original'},
  {...base,scenario,armySize:size,seed,mirrorSeed:seed,sideSwap:'swapped',blueScore:48,redScore:60,winner:'red'}
];
const all=()=>['classic','control_points','supply_line'].flatMap(sc=>[140,200,280].flatMap(sz=>Array.from({length:8},(_,i)=>mirrored(sz,sc,i+1)).flat()));
let n=0;
function check(name,fn){try{fn();n++;console.log('PASS',name)}catch(e){console.error('FAIL',name);throw e}}
check('zero telemetry means missing evidence',()=>assert.equal(auditMirrorPairs([]).overallStatus,'missing_evidence'));
check('one paired seed counts once',()=>assert.equal(auditMirrorPairs(mirrored()).groups.find(x=>x.runs).completePairs,1));
check('no implicit pairing without labels',()=>{const rows=mirrored().map(({mirrorSeed,sideSwap,...r})=>r);assert.equal(auditMirrorPairs(rows).groups.find(x=>x.runs).completePairs,0)});
check('full nine-group paired fixture reaches human review only',()=>assert.equal(auditMirrorPairs(all()).overallStatus,'ready_for_human_review'));
check('full test never claims production acceptance',()=>assert.notEqual(auditMirrorPairs(all()).overallStatus,'approved'));
check('synthetic source fails provenance gate',()=>{const runs=all().map(x=>({...x,source:'SYNTHETIC_QA_NOT_GAMEPLAY'}));assert.equal(auditMirrorPairs(runs).overallStatus,'missing_evidence')});
check('unknown engineBuild fails provenance gate',()=>{const runs=all().map(({engineBuild,...x})=>x);assert.equal(auditMirrorPairs(runs).overallStatus,'missing_evidence')});
check('mixed builds block ready flag',()=>{const runs=all();runs[0].engineBuild='other';assert.equal(auditMirrorPairs(runs).overallStatus,'missing_evidence')});
check('unpaired run is reported',()=>{const runs=all();runs.pop();assert.equal(auditMirrorPairs(runs).overallStatus,'missing_evidence')});
check('seed mismatch is reported',()=>{const runs=all();runs[1].seed=99;assert.equal(auditMirrorPairs(runs).overallStatus,'missing_evidence')});
check('duplicate original is reported',()=>{const runs=all();runs.push({...runs[0]});assert.equal(auditMirrorPairs(runs).overallStatus,'missing_evidence')});
check('missing swap metadata errors',()=>{const runs=all();delete runs[0].sideSwap;assert.throws(()=>auditMirrorPairs(runs),/mirrorSeed and sideSwap/)});
check('bad swap direction errors',()=>{const runs=all();runs[0].sideSwap='reverse';assert.throws(()=>auditMirrorPairs(runs),/sideSwap/)});
check('bad mirror seed errors',()=>{const runs=all();runs[0].mirrorSeed='';assert.throws(()=>auditMirrorPairs(runs),/mirrorSeed/)});
check('bad fps errors',()=>{const runs=all();runs[0].fpsMedian=0;assert.throws(()=>auditMirrorPairs(runs),/fpsMedian/)});
check('bad p95 frame errors',()=>{const runs=all();runs[0].frameP95Ms=-1;assert.throws(()=>auditMirrorPairs(runs),/frameP95Ms/)});
check('negative stuck count errors',()=>{const runs=all();runs[0].stuckSoldiers=-1;assert.throws(()=>auditMirrorPairs(runs),/stuckSoldiers/)});
check('metrics missing are null, never fabricated',()=>{const g=auditMirrorPairs(all()).groups.find(x=>x.runs);assert.equal(g.medianFps,null);assert.equal(g.medianFrameP95Ms,null);assert.equal(g.medianStuckSoldiers,null)});
check('metrics present are surfaced from reports',()=>{const runs=all();for(const r of runs){r.fpsMedian=60;r.frameP95Ms=23;r.stuckSoldiers=2;}const g=auditMirrorPairs(runs).groups.find(x=>x.runs);assert.equal(g.medianFps,60);assert.equal(g.medianFrameP95Ms,23);assert.equal(g.medianStuckSoldiers,2)});
check('same blue winner under both sides flags possible bias',()=>{const runs=all();for(const r of runs){r.winner='blue';r.blueScore=80;r.redScore=20;}assert.equal(auditMirrorPairs(runs).overallStatus,'review_required')});
check('full grid missing a scale flags evidence gap',()=>{const runs=all().filter(x=>x.armySize!==280);assert.equal(auditMirrorPairs(runs).overallStatus,'missing_evidence')});
check('scores validation inherited from original analyzer',()=>{const runs=all();runs[0].blueScore=NaN;assert.throws(()=>auditMirrorPairs(runs),/blueScore/)});
check('pair margin accounts for both orientations',()=>{const g=auditMirrorPairs(mirrored()).groups.find(x=>x.runs);assert.equal(g.pairedMedianBlueMargin,0)});
console.log(`\n${n}/${n} mirror gate tests PASS (fixture data only, no game engine execution).`);
