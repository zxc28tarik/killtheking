import test from 'node:test';
import assert from 'node:assert/strict';
import {loadEngine} from './run_g5_4_extended_trials.mjs';
import {runExtendedBattle,aggregateExtendedTrials,analyzeCheckpoints,createStopEvidenceObserver} from './g5_4_long_battle_diagnostics.mjs';
const E=loadEngine();
test('uses genuine G5.4 CPU engine and exact 140 soldier roster',()=>{
  const v=runExtendedBattle(E,{seed:1600,role:'musket',durationSeconds:2,bucketSeconds:1});
  assert.equal(v.quality.initial.soldierCount,140);assert.equal(v.quality.initial.squadCount,8);
});
test('long snapshots cover whole duration and monotone casualties',()=>{
  const v=runExtendedBattle(E,{seed:1701,role:'pike',durationSeconds:16,bucketSeconds:5});
  assert.ok(v.checkpoints.length>=5);assert.equal(v.checkpoints[0].at,0);
  assert.ok(v.checkpoints.at(-1).at>=16);
  assert.ok(v.analysis.periods.every(p=>p.blueLoss>=0&&p.redLoss>=0&&p.seconds>0));
});
test('each sampled snapshot exposes eight squads and two strategic plans',()=>{
  const v=runExtendedBattle(E,{seed:1600,role:'sword',durationSeconds:3,bucketSeconds:1});
  assert.ok(v.checkpoints.every(c=>c.bySquad.length===8&&c.teamPlans.blue&&c.teamPlans.red));
  assert.equal(v.analysis.g8_4Recovered,false);assert.equal(v.analysis.g8_5MirroredMatches,0);
});
test('command influences real engine without converting to simulated fake state',()=>{
  const v=runExtendedBattle(E,{role:'bow',seed:1600,command:'hold',durationSeconds:4,bucketSeconds:2});
  assert.equal(v.command,'hold');assert.equal(v.checkpoints[0].bySquad.find(x=>x.id===v.quality.initial.humanSquadId).order,'hold');
});
test('rejects invalid role, duration, bucket, time step and seed',()=>{
  assert.throws(()=>runExtendedBattle(E,{role:'mage'}),/Invalid/);
  assert.throws(()=>runExtendedBattle(E,{durationSeconds:601}),/Invalid/);
  assert.throws(()=>runExtendedBattle(E,{bucketSeconds:200,durationSeconds:120}),/Invalid/);
  assert.throws(()=>runExtendedBattle(E,{dt:.2}),/Invalid/);
  assert.throws(()=>runExtendedBattle(E,{seed:1.5}),/Invalid/);
});
test('identical seed, role and orders repeat exact long-run traces',()=>{
  const a=runExtendedBattle(E,{role:'musket',seed:1600,durationSeconds:6,bucketSeconds:2});
  const b=runExtendedBattle(E,{role:'musket',seed:1600,durationSeconds:6,bucketSeconds:2});
  assert.deepEqual(a,b);
});
test('observation is read-only and preserves exact engine state',()=>{
  const a=E.create(1600,'pike'),b=E.create(1600,'pike');
  assert.equal(E.issueOrder(a,a.playerSquadId,'advance'),true);
  assert.equal(E.issueOrder(b,b.playerSquadId,'advance'),true);
  // Another observed run should match native stand-alone state: no new global RNG.
  const observed=runExtendedBattle(E,{role:'pike',seed:1600,durationSeconds:8,bucketSeconds:2});
  for(let i=0;i<observed.ticks;i++){
    E.step(a,.08);E.step(b,.08);
    E.drainCombatEvents(a);E.drainCombatEvents(b);
    assert.equal(JSON.stringify(a),JSON.stringify(b));
  }
  assert.equal(a.tick,observed.ticks);
  assert.deepEqual({blue:E.snapshot(a).blue,red:E.snapshot(a).red},observed.analysis.finalAlive);
});
test('period validation rejects reversed time and spontaneously resurrected soldiers',()=>{
  const v=runExtendedBattle(E,{durationSeconds:2,bucketSeconds:1});
  const cp=structuredClone(v.checkpoints);
  cp[1].at=cp[0].at;assert.throws(()=>analyzeCheckpoints(cp,v.quality),/Non-monotone/);
  cp[1].at=v.checkpoints[1].at;cp[1].redAlive=80;
  assert.throws(()=>analyzeCheckpoints(cp,v.quality),/Non-monotone/);
});
test('summary counts are based on trials and explicitly not G8.4 evidence',()=>{
  const a=runExtendedBattle(E,{durationSeconds:1,bucketSeconds:1});
  const b=runExtendedBattle(E,{durationSeconds:1,bucketSeconds:1,role:'sword'});
  const sum=aggregateExtendedTrials([a,b]);
  assert.equal(sum.trials,2);assert.equal(sum.g8_4Recovered,false);
  assert.equal(sum.realG8_5MirrorTrials,0);
  assert.equal(sum.totalDecisions,a.analysis.decisions+b.analysis.decisions);
});
test('rejects empty aggregation',()=>{assert.throws(()=>aggregateExtendedTrials([]),/nonempty/);});

test('real G5.4 rally pauses distinguish reaching destination from unexplained immobility',()=>{
  const v=runExtendedBattle(E,{role:'sword',command:'hold',seed:1600,durationSeconds:75,bucketSeconds:15});
  assert.equal(v.stopEvidence.length,v.analysis.stationaryMovementOrderWarnings);
  assert.ok(v.stopEvidence.some(e=>e.atPlannedDestination&&e.targetKind==='staged-withdrawal-rally'));
  assert.ok(v.stopEvidence.every(e=>e.classification===
    (e.atPlannedDestination?'reached-planned-destination':'unexplained-stationarity')));
});
test('stop evidence observer never writes engine state',()=>{
 const s=E.create(1600,'musket');const o=createStopEvidenceObserver();
 const prev=JSON.stringify(s);o.observe(s);assert.equal(JSON.stringify(s),prev);
 const unit=s.squads[0];unit.order='retreat';
 for(let i=0;i<45;i++){s.elapsed+=.08;s.tick++;o.observe(s);}
 assert.ok(o.getEvidence().length>0);
 const result=o.getEvidence();result[0].position.x=999;
 assert.notEqual(o.getEvidence()[0].position.x,999);
});
test('invalid stop evidence threshold is rejected',()=>{
 assert.throws(()=>createStopEvidenceObserver({thresholdSeconds:0}),/Invalid/);
});

test('operational envelopment at true staging target is planned, not a pathfinding deadlock',()=>{
  const v=runExtendedBattle(E,{role:'musket',command:'hold',seed:1600,durationSeconds:55,bucketSeconds:15});
  const stage=v.stopEvidence.find(e=>e.targetKind==='flank-staging-point');
  assert.ok(stage,'actual G5.4 flank staging event must occur');
  assert.equal(stage.atPlannedDestination,true);
  assert.equal(stage.plannedDestinationDistance,0);
});
test('stop evidence timestamps and squad IDs exactly match original quality warnings',()=>{
 const v=runExtendedBattle(E,{role:'musket',command:'hold',seed:1600,durationSeconds:82,bucketSeconds:15});
 const f=v.quality.findings.filter(x=>x.kind==='stationary-movement-order').map(x=>[x.at,x.squadId]);
 const e=v.stopEvidence.map(x=>[x.at,x.squadId]);
 assert.deepEqual(e,f);
});
