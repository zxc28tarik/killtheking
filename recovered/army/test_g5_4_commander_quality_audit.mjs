import test from 'node:test';
import assert from 'node:assert/strict';
import {createQualityAudit} from './g5_4_commander_quality_audit.mjs';
import {loadActualEngine,runTrial,matrixSummary} from './run_g5_4_commander_quality_trials.mjs';
const E=loadActualEngine();
const create=(role='sword',seed=1600)=>E.create(seed,role);
test('uses recovered G5.4 actual engine, not fake object',()=>{
 const s=create();assert.equal(s.soldiers.length,140);assert.equal(s.squads.length,8);
});
test('rejects nonexistent and invalid roster',()=>{
 const qa=createQualityAudit();assert.throws(()=>qa.start({squads:[],soldiers:[]}),/real/);
});
test('rejects invalid analysis thresholds',()=>{
 assert.throws(()=>createQualityAudit({minStallTicks:19}),/minStall/);
 assert.throws(()=>createQualityAudit({maxFindings:0}),/maxFindings/);
 assert.throws(()=>createQualityAudit({stationaritySeconds:0}),/stationarity/);
});
test('start does not mutate native state',()=>{
 const s=create(),before=JSON.stringify(s),q=createQualityAudit();q.start(s);
 assert.equal(JSON.stringify(s),before);
 assert.equal(q.getReport().initial.soldierCount,140);
});
test('every engine step remains byte-identical with quality audit enabled',()=>{
 const a=create('pike',1407),b=create('pike',1407),q=createQualityAudit();q.start(b);
 for(let i=0;i<150;i++){
  E.step(a,.08);E.step(b,.08);
  const was=JSON.stringify(b);q.afterStep(b);
  assert.equal(JSON.stringify(b),was);assert.equal(JSON.stringify(a),JSON.stringify(b));
  E.drainCombatEvents(a);E.drainCombatEvents(b);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
 }
 assert.equal(q.getReport().phase,'running');
 const prev=JSON.stringify(b);const result=q.finish(b,E.snapshot(b));
 assert.equal(JSON.stringify(b),prev);
 assert.equal(result.observedSteps,150);
 assert.equal(result.initial.squadCount,8);
 assert.equal(result.totals.decisions>0,true);
});
test('duplicate step is not double-counted',()=>{
 const s=create(),qa=createQualityAudit();qa.start(s);
 assert.equal(qa.afterStep(s),false);
 E.step(s,.08);assert.equal(qa.afterStep(s),true);
 assert.equal(qa.afterStep(s),false);
 assert.equal(qa.getReport().observedSteps,1);
});
test('cannot reuse auditor or swap active state mid-trial',()=>{
 const s=create(),qa=createQualityAudit();qa.start(s);
 assert.throws(()=>qa.start(s),/Already/);
 assert.throws(()=>qa.afterStep(create()),/same active/);
});
test('detects short A-B-A AI order reversal from genuine G5.4 state fields',()=>{
 const s=create(),q=createQualityAudit({reversalWindowSeconds:9});q.start(s);
 const ai=s.squads.find(x=>!x.playerControlled);const first=ai.order;
 E.step(s,.08);ai.order='retreat';q.afterStep(s);
 E.step(s,.08);ai.order=first;q.afterStep(s);
 const r=q.getReport();assert.equal(r.totals.shortReversals,1);
 assert.equal(r.findings.find(x=>x.kind==='short-order-reversal').squadId,ai.id);
});
test('reversals require a previous order change',()=>{
 const s=create(),q=createQualityAudit();q.start(s);E.step(s,.08);q.afterStep(s);
 assert.equal(q.getReport().totals.shortReversals,0);
});
test('detects native soldier stall counter threshold without altering unit',()=>{
 const s=create(),q=createQualityAudit();q.start(s);
 const u=s.soldiers[0];u.stalledTicks=10;
 E.step(s,.08);u.stalledTicks=10;q.afterStep(s);
 assert.equal(q.getReport().totals.nativeSoldierStallWarnings,1);
});
test('native soldier stall warning is not counted again until threshold recrosses',()=>{
 const s=create(),q=createQualityAudit();q.start(s);const u=s.soldiers[0];
 for(let i=0;i<3;i++){E.step(s,.08);u.stalledTicks=11;q.afterStep(s)}
 assert.equal(q.getReport().totals.nativeSoldierStallWarnings,1);
 E.step(s,.08);u.stalledTicks=0;q.afterStep(s);
 E.step(s,.08);u.stalledTicks=11;q.afterStep(s);
 assert.equal(q.getReport().totals.nativeSoldierStallWarnings,2);
});
test('findings bounded, drop count recorded',()=>{
 const s=create(),q=createQualityAudit({maxFindings:1});q.start(s);
 const units=s.soldiers.slice(0,8);
 E.step(s,.08);units.forEach(u=>u.stalledTicks=12);q.afterStep(s);
 const r=q.getReport();assert.equal(r.findings.length,1);assert.ok(r.droppedFindings>0);
});
test('drain remains owned by existing game renderer, audit is read only',()=>{
 const s=create(),q=createQualityAudit();q.start(s);
 const u=s.soldiers.find(x=>x.team==='red');E.damageSoldier(s,u.id,15,{source:'player'});
 const before=JSON.stringify(s.combatEvents);E.step(s,.08);q.afterStep(s);
 assert.ok(s.combatEvents.length>0);assert.notEqual(before,'[]');
 assert.equal(E.drainCombatEvents(s).length>0,true);
});
test('real native engine snapshots used for finish, not made up',()=>{
 const s=create(),q=createQualityAudit();q.start(s);
 E.step(s,.08);q.afterStep(s);
 assert.throws(()=>q.finish(s,{squads:[],winner:'invented'}),/snapshot/);
 const r=q.finish(s,E.snapshot(s));assert.equal(r.phase,'finished');
 assert.equal(r.final.blue,70);assert.equal(r.actualG8_5MirrorTrials,0);
 assert.equal(r.newerG8_4Verified,false);
});
test('reports do not expose native objects',()=>{
 const s=create(),q=createQualityAudit();q.start(s);const a=q.getReport();
 a.bySquad[0].orders.fake=12;a.initial.playerType='fake';
 assert.equal(s.squads[0].order,'advance');assert.notEqual(q.getReport().initial.playerType,'fake');
});
test('player-held squad does not show AI commander decisions',()=>{
 const s=create(),q=createQualityAudit();q.start(s);
 for(let i=0;i<32;i++){E.step(s,.08);q.afterStep(s)}
 assert.equal(q.getReport().bySquad.find(x=>x.playerControlled).decisions,0);
 assert.ok(q.getReport().bySquad.some(x=>!x.playerControlled&&x.decisions>0));
});
test('G5.4 actual scripted trials clearly identify limited scenario',()=>{
 const v=runTrial(E,{role:'sword',seed:1590,command:'advance',steps:40});
 assert.equal(v.initial.soldierCount,140);assert.equal(v.steps,undefined);
 assert.equal(v.ticks,40);assert.equal(v.command,'advance');
 assert.ok(v.initial.scenario.includes('no human play'));
 assert.equal(v.g8_5PairedMirrorMatches,undefined);
});
test('G5.4 matrix summary is explicit and does not claim mirrored G8.5',()=>{
 const v=runTrial(E,{role:'bow',seed:1622,steps:35});
 const x=matrixSummary([v]);assert.equal(x.g8_4GameRecovered,false);
 assert.equal(x.g8_5PairedMirrorMatches,0);assert.equal(x.trials,1);
 assert.equal(x.totalDecisions,v.totals.decisions);
});
test('G5.4 deterministic seeded state yields exactly repeated quality findings',()=>{
 const a=runTrial(E,{role:'musket',seed:1763,command:'advance',steps:140});
 const b=runTrial(E,{role:'musket',seed:1763,command:'advance',steps:140});
 assert.deepEqual(a,b);
});
test('missing readable snapshot and clock rollback fail without game write',()=>{
 const s=create(),q=createQualityAudit();q.start(s);
 E.step(s,.08);q.afterStep(s);
 s.tick=0;assert.throws(()=>q.afterStep(s),/rolled back/);
});
