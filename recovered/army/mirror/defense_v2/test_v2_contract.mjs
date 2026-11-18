import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadBounded,sha,paths} from './run_v2_paired.mjs';
import {getEngine,scenarioIndex} from '../defense/protection_pilot.mjs';
import {reference} from './verify_v2_paired.mjs';
const old=getEngine('baseline'),bounded=loadBounded();
test('source digests are the exact measured baseline and candidate',()=>{
 assert.equal(sha(paths.baseline),reference.sourceSha256.baseline);
 assert.equal(sha(paths.bounded),reference.sourceSha256.bounded);
 assert.equal(reference.acceptance,'NOT_APPROVED');
});
test('4-second local guard cannot chain without 16-second reentry interval',()=>{
 const src=readFileSync(paths.bounded,'utf8');
 for(const snippet of ['c.distance<100&&',
  'dist(squad,state.squads[defense.secondProtectedId])<126&&',
  'squad.secondGuardUntil=state.elapsed+4;',
  'squad.nextSecondGuardEligibleAt=state.elapsed+16;'])
  assert(src.includes(snippet),snippet);
});
test('unchanged weapon, player and winner pathways',()=>{
 const a=readFileSync(paths.baseline,'utf8');
 const b=readFileSync(paths.bounded,'utf8');
 for(const q of ['function damageSoldier(','function soldierGuard(',
   'target.team===state.playerTeam','state.winner=']){
  assert(a.includes(q));assert(b.includes(q));
 }
});
for(const team of ['blue','red'])for(const role of ['musket','pike','bow','sword']){
 test('same 140 troops / eight companies at spawn, '+team+' '+role,()=>{
  const a=old.create(2026,role,team),b=bounded.create(2026,role,team);
  assert.equal(b.soldiers.length,140);
  assert.equal(b.squads.length,8);
  assert.equal(b.playerTeam,team);
  assert.equal(b.squads[b.playerSquadId].team,team);
  assert.equal(b.squads.filter(s=>s.playerControlled).length,1);
  assert.equal(JSON.stringify(b),JSON.stringify(a));
 });
}
for(const team of ['blue','red']){
 test('human musket HOLD stays active for 200 native steps on '+team,()=>{
  const state=bounded.create(1600,'musket',team),captain=state.squads[state.playerSquadId];
  assert(bounded.issueOrder(state,captain.id,'hold'));
  for(let i=0;i<200;i++)bounded.step(state,.08);
  assert.equal(captain.order,'hold');
  assert.equal(captain.playerControlled,true);
  assert.equal(captain.team,team);
 });
}
test('12 verified scenarios remain NOT APPROVED despite native terminal wins',()=>{
 assert.equal(scenarioIndex.length,12);
 assert.equal(reference.scenarios.length,12);
 assert.equal(reference.summary.bounded.naturalEndings,12);
 assert.equal(reference.summary.bounded.coverageMeanPct,46.25);
 assert.equal(reference.summary.bounded.durationMeanSec,308.01);
 assert.equal(reference.acceptance,'NOT_APPROVED');
});