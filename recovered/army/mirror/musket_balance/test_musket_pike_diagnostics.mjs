/** Regression checks against actual source-hash-bound 64-game GitHub archive. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateAndSummarize} from './summarize_musket_pike.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const sha=createHash('sha256').update(readFileSync(existsSync(resolve(root,'arena-army-battle-true-side-swap.js'))?resolve(root,'arena-army-battle-true-side-swap.js'):resolve(root,'../arena-army-battle-true-side-swap.js'))).digest('hex');
const ref=JSON.parse(readFileSync(resolve(root,'reference_musket_pike_32.json'),'utf8'));
const parts=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(resolve(root,'reports/musket_diagnostic_'+i*4+'_4.json'),'utf8')));
const clone=v=>JSON.parse(JSON.stringify(v));
const work=()=>clone(parts);
test('all 32 real battles match GitHub source-hash and winner/time history',()=>{
 const result=validateAndSummarize(work(),ref,sha);
 assert.equal(result.summary.battles,32);
 assert.equal(result.rows.length,32);
 assert.equal(result.byRole.musket.playerWins,1);
 assert.equal(result.byRole.pike.playerWins,14);
});
test('musket unit can kill enemies; low victory does not mean low lethality',()=>{
 const r=validateAndSummarize(work(),ref,sha);
 assert.equal(r.byRole.musket.killsByHumanCompany,201);
 assert.equal(r.byRole.pike.killsByHumanCompany,31);
 assert(r.byRole.musket.killsByHumanCompany>r.byRole.pike.killsByHumanCompany);
});
test('reported 1/16 and 14/16 class wins across two orders',()=>{
 const r=validateAndSummarize(work(),ref,sha);
 assert.deepEqual(r.byRole.musket.byOrder,{advance:1,hold:0});
 assert.deepEqual(r.byRole.pike.byOrder,{advance:6,hold:8});
});
test('reject mismatching engine SHA',()=>assert.throws(()=>validateAndSummarize(work(),ref,'0'.repeat(64)),/Source hash/));
test('reject missing real CPU trace block',()=>assert.throws(()=>validateAndSummarize(work().slice(1),ref,sha),/8 blocks/));
test('reject missing historical reference game',()=>{
 const bad=clone(ref);bad.rows.pop();assert.throws(()=>validateAndSummarize(work(),bad,sha),/32 archived/);
});
test('reject a duplicate scenario even with valid source hash',()=>{
 const data=work();data[1].rows[0]=data[0].rows[0];
 assert.throws(()=>validateAndSummarize(data,ref,sha),/differs|missing|duplicat/);
});
test('reject fictional victory injected into game record',()=>{
 const data=work();data[0].rows[0].winner='blue'===data[0].rows[0].winner?'red':'blue';
 assert.throws(()=>validateAndSummarize(data,ref,sha),/differs/);
});
test('reject a fabricated completion time',()=>{
 const data=work();data[0].rows[0].seconds+=1;
 assert.throws(()=>validateAndSummarize(data,ref,sha),/differs/);
});
test('reject impossible kills exceeding actual hits',()=>{
 const data=work();data[0].rows[0].killsByPlayerCompany=data[0].rows[0].hitsByPlayerCompany+1;
 assert.throws(()=>validateAndSummarize(data,ref,sha),/Invalid raw/);
});
test('reject fake clear-lane count unsupported by ready samples',()=>{
 const data=work();data[0].rows[0].clearLineSoldierSamples+=1;
 assert.throws(()=>validateAndSummarize(data,ref,sha),/Invalid raw/);
});
test('no GPU, fair-side or public release success is asserted',()=>{
 const r=validateAndSummarize(work(),ref,sha);
 assert.equal(r.summary.realCPU,true);
 assert.equal(r.summary.manualAvatarCombat,false);
 assert.equal(r.summary.strictGeometricMirror,false);
 assert.equal(r.summary.acceptedForRelease,false);
});
