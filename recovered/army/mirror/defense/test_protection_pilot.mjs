import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {scenarioIndex,getEngine} from './protection_pilot.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const reference=JSON.parse(readFileSync(resolve(here,'protection_pilot_reference.json'),'utf8'));
const root=resolve(here,'..');
const hash=f=>createHash('sha256').update(readFileSync(resolve(root,f))).digest('hex');
test('source provenance: baseline and candidate hashes exactly match measured games',()=>{
 assert.equal(hash('arena-army-battle-true-side-swap.js'),reference.baselineSha256);
 assert.equal(hash('arena-army-battle-protection-candidate.js'),reference.candidateSha256);
 assert.equal(reference.releaseGate,'NOT_APPROVED');
});
test('12 reference scenario records, no missing outcomes',()=>{
 assert.equal(scenarioIndex.length,12);
 assert.equal(reference.scenarios.length,12);
 assert.equal(reference.scenarios.every(pair=>pair.length===2&&pair.every(values=>values.length===5)),true);
});
const original=getEngine('baseline'),candidate=getEngine('candidate');
for(const team of ['blue','red'])for(const role of ['musket','pike','bow','sword']){
 test('unmodified 140-soldier starting army and human ownership '+team+'/'+role,()=>{
  const a=original.create(1600,role,team),b=candidate.create(1600,role,team);
  assert.equal(a.soldiers.length,140);assert.equal(b.soldiers.length,140);
  assert.equal(a.squads.length,8);assert.equal(b.squads.length,8);
  assert.equal(b.playerTeam,team);
  assert.equal(b.squads[b.playerSquadId].team,team);
  assert.equal(JSON.stringify(b),JSON.stringify(a));
 });
}
for(const team of ['blue','red'])test('player musket HOLD preserved in '+team,()=>{
 for(const engine of [original,candidate]){
  const s=engine.create(1600,'musket',team),human=s.squads[s.playerSquadId];
  assert(engine.issueOrder(s,human.id,'hold'));
  for(let i=0;i<200;i++)engine.step(s,.08);
  assert.equal(human.order,'hold');assert.equal(human.playerControlled,true);
 }
});
test('protected reserve does not alter base soldier damage and win code',()=>{
 const a=readFileSync(resolve(root,'arena-army-battle-true-side-swap.js'),'utf8');
 const b=readFileSync(resolve(root,'arena-army-battle-protection-candidate.js'),'utf8');
 for(const x of ['function damageSoldier(', 'function soldierGuard(',
   "target.team===state.playerTeam", "state.winner="]){
  assert(a.includes(x));assert(b.includes(x));
 }
});
test('reference honestly records 3 worse-protection scenarios and zero extra victories',()=>{
 const records=reference.scenarios;
 assert.equal(records.filter(x=>x[1][2]<x[0][2]).length,3);
 assert.equal(records.filter(x=>x[1][2]>x[0][2]).length,9);
 assert.equal(records.filter(x=>x[0][0]!==x[1][0]).length,0);
 assert.equal(records.filter((x,i)=>x[0][0]===scenarioIndex[i][3]).length,2);
 assert.equal(records.filter((x,i)=>x[1][0]===scenarioIndex[i][3]).length,2);
});
