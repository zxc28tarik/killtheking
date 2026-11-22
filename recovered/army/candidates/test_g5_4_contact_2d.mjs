/** G5.4 2D tactical-post regression tests; real engine, not synthetic battle outcomes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {loadCandidateEngine} from './run_g5_4_contact_recovery_matrix.mjs';
import {loadEngine2D,plan,roles,commands,seeds,summarize,CANDIDATE_PATH} from './run_g5_4_contact_2d_matrix.mjs';
import {mergeParts} from './merge_g5_4_contact_2d_matrix.mjs';
const here=dirname(fileURLToPath(import.meta.url));
function setupLostEscorts(e){
 const state=e.create(1776,'bow');
 for(const u of state.soldiers){if(!['bow','musket'].includes(u.type)||u.team==='blue'&&u.type==='musket'||u.team==='red'&&u.type==='bow')u.alive=false;}
 for(const s of state.squads){s.alive=state.soldiers.filter(u=>u.alive&&u.squadId===s.id).length;}
 const blue=state.squads.find(s=>s.team==='blue'&&s.type==='bow');
 const red=state.squads.find(s=>s.team==='red'&&s.type==='musket');
 red.x=-81;red.z=-77;
 return {state,blue,red};
}
test('source engine lives in a separate candidate; archived original untouched',()=>{
 const old=readFileSync(resolve(here,'arena-army-battle-contact-recovery.js'),'utf8');
 const now=readFileSync(CANDIDATE_PATH,'utf8');
 assert.notEqual(old,now);
 assert(now.includes('G5.4 contact recovery v2'));
 assert.equal(now.match(/function buildSupportPlan/g).length,1);
 assert.equal(old.match(/function buildSupportPlan/g).length,1);
 assert.equal(now.slice(0,now.indexOf('function buildSupportPlan')),old.slice(0,old.indexOf('function buildSupportPlan')));
 assert.equal(now.slice(now.indexOf('function finishWithdrawal')),old.slice(old.indexOf('function finishWithdrawal')));
});
test('two-dimensional fire-base correction moves toward lateral threat; old code does not',()=>{
 const a=setupLostEscorts(loadEngine2D()),b=setupLostEscorts(loadCandidateEngine());
 const post2=loadEngine2D().buildSupportPlan(a.state,'red',a.state.teamPlans.red).positions.musket;
 const post1=loadCandidateEngine().buildSupportPlan(b.state,'red',b.state.teamPlans.red).positions.musket;
 assert(post2.z>post1.z+5,JSON.stringify({post2,post1}));
 assert(post2.x<-81,'firing post should also approach in X');
});
test('blue human HOLD remains in place and is not silently overridden',()=>{
 const e=loadEngine2D(),s=e.create(1776,'bow');
 assert(e.issueOrder(s,s.playerSquadId,'hold'));
 const p=s.squads[s.playerSquadId],x=p.x,z=p.z;
 for(let i=0;i<450;i++)e.step(s,.08);
 assert.equal(p.order,'hold');assert.equal(p.x,x);assert.equal(p.z,z);
 assert.equal(p.playerControlled,true);
});
test('unchanged early real combat state before escorts lost',()=>{
 const a=loadCandidateEngine(),b=loadEngine2D();
 const x=a.create(1600,'pike'),y=b.create(1600,'pike');
 a.issueOrder(x,x.playerSquadId,'advance');b.issueOrder(y,y.playerSquadId,'advance');
 for(let i=0;i<80;i++){a.step(x,.08);b.step(y,.08);}
 assert.equal(JSON.stringify(x.squads),JSON.stringify(y.squads));
 assert.equal(JSON.stringify(x.soldiers),JSON.stringify(y.soldiers));
 assert.equal(x.winner,y.winner);
});
test('no weapon or victory constants altered',()=>{
 const a=loadCandidateEngine(),b=loadEngine2D();
 assert.deepEqual(JSON.parse(JSON.stringify(a.TYPES)),JSON.parse(JSON.stringify(b.TYPES)));
 assert.deepEqual(JSON.parse(JSON.stringify(a.ORDERS)),JSON.parse(JSON.stringify(b.ORDERS)));
 assert.equal(b.create(1600,'pike','red').squads[b.create(1600,'pike','red').playerSquadId].team,'blue');
});
test('exactly 4 seeds x 4 classes x 2 commands',()=>{
 assert.equal(seeds.length,4);assert.equal(roles.length,4);assert.equal(commands.length,2);
 assert.equal(new Set(plan.map(c=>c.seed+':'+c.role+':'+c.command)).size,32);
 assert.equal(summarize([{seed:1600,role:'bow',command:'hold',seconds:600,naturalWinner:null}]).passed,false);
});
test('actual 32-case matrix is fully concluded and authenticated',()=>{
 const blocks=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(resolve(here,'dist/contact-2d/full_part_'+i*4+'.json'),'utf8')));
 const sha=createHash('sha256').update(readFileSync(CANDIDATE_PATH)).digest('hex');
 const data=mergeParts(blocks,sha);
 assert.equal(data.rows.length,32);assert.equal(data.summary.wins,32);assert.equal(data.summary.unresolved,0);
 assert.equal(data.summary.passed,true);assert.equal(data.limits.pairedSideSwaps,0);
});
test('tampered winner cannot pass source checkpoint audit',()=>{
 const blocks=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(resolve(here,'dist/contact-2d/full_part_'+i*4+'.json'),'utf8')));
 const sha=createHash('sha256').update(readFileSync(CANDIDATE_PATH)).digest('hex');
 blocks[0].rows[0].naturalWinner='blue';
 assert.throws(()=>mergeParts(blocks,sha),/Result differs/);
});
test('wrong candidate hash cannot pass',()=>{
 const blocks=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(resolve(here,'dist/contact-2d/full_part_'+i*4+'.json'),'utf8')));
 assert.throws(()=>mergeParts(blocks,'0'.repeat(64)),/source|engine/i);
});
test('missing block cannot pass',()=>{
 const blocks=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(resolve(here,'dist/contact-2d/full_part_'+i*4+'.json'),'utf8')));
 const sha=createHash('sha256').update(readFileSync(CANDIDATE_PATH)).digest('hex');
 assert.throws(()=>mergeParts(blocks.slice(1),sha),/Eight real/);
});
