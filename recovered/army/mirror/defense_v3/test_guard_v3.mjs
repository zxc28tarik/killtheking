import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash,engine} from './replay_v3.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const candidate=JSON.parse(readFileSync(resolve(here,'guard_v3_reference.json'),'utf8'));
const root=resolve(here,'..');
const path=resolve(root,'arena-army-battle-protection-v3-role-gated.js');
test('native v3 engine pinned to recorded source SHA256',()=>{
 assert.equal(hash(path),candidate.sourceSHA256.v3);
 assert.equal(candidate.summary.releaseGate,'NOT_APPROVED');
});
test('v3 changes only the expired second-guard movement override',()=>{
 const previous=readFileSync(resolve(root,'arena-army-battle-protection-v2-bounded.js'),'utf8');
 const current=readFileSync(path,'utf8');
 const oldPart=`   }else if(s.defenseRole==='intercept'&&
    s.aiRole!=='counter-charge'&&s.aiRole!=='rally'&&
    defense.secondPost&&s.order==='advance'&&
    (!s.operationRole||s.aiRole==='second-fire-line-guard')){
    targetX=defense.secondPost.x;targetZ=defense.secondPost.z;
   }
`;
 const newPart=`   }else if(s.defenseRole==='intercept'&&
    // The second-screen waypoint is a bounded mission, not a permanent
    // override of ordinary flank/reserve/attack destinations.
    s.aiRole==='second-fire-line-guard'&&
    state.elapsed<(s.secondGuardUntil||0)&&
    defense.secondPost&&s.order==='advance'){
    targetX=defense.secondPost.x;targetZ=defense.secondPost.z;
   }
`;
 assert.equal(previous.split(oldPart).length,2);
 assert.equal(previous.replace(oldPart,newPart),current);
 assert.equal(hash(resolve(root,'arena-army-battle-protection-v2-bounded.js')),candidate.sourceSHA256.v2);
});
test('12 source-pinned real native trials show six improvements and six regressions',()=>{
 assert.equal(candidate.expectedV3.length,12);
 assert.equal(candidate.summary.coverageUpFromBaseline,6);
 assert.equal(candidate.summary.coverageDownFromBaseline,6);
 assert.equal(candidate.summary.v3NaturalEndings,12);
 assert.equal(candidate.summary.identicalWinnersToBaseline,12);
});
const ai=engine();
for(const team of ['blue','red']){
 for(const role of ['musket','pike','bow','sword']){
  test('v3 preserves authentic 140-soldier player command '+team+'/'+role,()=>{
   const s=ai.create(1776,role,team),human=s.squads[s.playerSquadId];
   assert.equal(s.soldiers.length,140);
   assert.equal(s.squads.length,8);
   assert.equal(s.squads.filter(q=>q.playerControlled).length,1);
   assert.equal(human.playerControlled,true);
   assert.equal(human.team,team);
   assert.equal(human.type,role);
   assert.equal(ai.issueOrder(s,human.id,'hold'),true);
   const opponent=s.squads.find(q=>q.team!==team&&q.type===role);
   assert.equal(ai.issueOrder(s,opponent.id,'hold'),false);
   for(let i=0;i<60;i++)ai.step(s,.08);
   assert.equal(human.order,'hold');
  });
 }
}
test('no player friendly fire in blue or red army',()=>{
 for(const team of ['blue','red']){
  const s=ai.create(2026,'musket',team);
  const friend=s.soldiers.find(u=>u.team===team);
  const enemy=s.soldiers.find(u=>u.team!==team);
  const friendHP=friend.hp,enemyHP=enemy.hp;
  assert.equal(ai.damageSoldier(s,friend.id,10,{source:'player',weapon:'musket',zone:'body'}),null);
  assert.equal(friend.hp,friendHP);
  assert(ai.damageSoldier(s,enemy.id,10,{source:'player',weapon:'musket',zone:'body'}));
  assert(enemy.hp<enemyHP);
 }
});
test('v3 has no direct changes to weapon damage or team victory code',()=>{
 const code=readFileSync(path,'utf8');
 for(const phrase of ["cooldown:15","damage:90","function damageSoldier(","state.winner="])
  assert(code.includes(phrase));
});