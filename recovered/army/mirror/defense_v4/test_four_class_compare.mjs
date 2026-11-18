import test from 'node:test';
import assert from 'node:assert/strict';
import {scenarioIndex,getEngine} from './four_class_compare.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
test('32 unique exact four-class, two-seed, two-order, two-team real matches',()=>{
 assert.equal(scenarioIndex.length,32);
 assert.equal(new Set(scenarioIndex.map(x=>JSON.stringify(x))).size,32);
 for(const role of ['musket','pike','bow','sword'])
  assert.equal(scenarioIndex.filter(s=>s[1]===role).length,8);
 for(const seed of [1600,1776])
  assert.equal(scenarioIndex.filter(s=>s[0]===seed).length,16);
});
test('actual original 2D G5.4 and v3 experiment are SHA-pinned',()=>{
 const root=resolve(here,'..');
 assert.equal(hash(resolve(root,'arena-army-battle-true-side-swap.js')),'307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 assert.equal(hash(resolve(root,'arena-army-battle-protection-v3-role-gated.js')),'5ba893b6e812943e77607ed1b288be93b1e2daeeb6fdf6569b54907a38db0826');
});
for(const role of ['musket','pike','bow','sword'])for(const team of ['blue','red']){
 test('unchanged seeded 140-soldier formation and player order '+role+'/'+team,()=>{
  const old=getEngine('baseline'),candidate=getEngine('candidate');
  const a=old.create(1600,role,team),b=candidate.create(1600,role,team);
  assert.equal(a.soldiers.length,140);assert.equal(b.soldiers.length,140);
  assert.equal(a.squads.length,8);assert.equal(b.squads.length,8);
  assert.equal(a.playerTeam,team);assert.equal(b.playerTeam,team);
  assert.equal(a.squads.filter(x=>x.playerControlled).length,1);
  assert.equal(b.squads.filter(x=>x.playerControlled).length,1);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
  const human=b.squads[b.playerSquadId];
  assert.equal(human.type,role);assert.equal(human.team,team);
  assert.equal(candidate.issueOrder(b,human.id,'hold'),true);
  const opposing=b.squads.find(s=>s.team!==team&&s.type===role);
  assert.equal(candidate.issueOrder(b,opposing.id,'hold'),false);
  for(let i=0;i<12;i++)candidate.step(b,.08);
  assert.equal(human.order,'hold');
 });
}
test('pilot and native CPU tests do not modify accepted FFA and weapon data',()=>{
 const p=readFileSync(resolve(here,'../arena-army-battle-protection-v3-role-gated.js'),'utf8');
 const q=readFileSync(resolve(here,'../arena-army-battle-true-side-swap.js'),'utf8');
 for(const key of ['cooldown:15','damage:90','function damageSoldier(','state.winner=']){
  assert(p.includes(key));assert(q.includes(key));
 }
});