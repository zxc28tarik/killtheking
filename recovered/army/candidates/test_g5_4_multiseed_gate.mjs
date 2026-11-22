import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCandidateEngine,runActualCandidate} from './run_g5_4_contact_recovery_case.mjs';
import {SEEDS,EXPECTED,engineHash,nativeMirrorCapability,checkNativeSeed,combinedNativeAudit} from './g5_4_multiseed_gate.mjs';
test('three additional seeds and expected native endings are fixed',()=>{
 assert.deepEqual([...SEEDS],[1776,2026,31415]);
 assert.deepEqual(EXPECTED,{1776:5,2026:5,31415:7});
});
test('candidate source SHA-256 matches independently measured code',()=>{
 assert.equal(engineHash(),'9e992cf37f621172036ff06a3a27eb227c69fa81fcb043666ccf160f26d17df3');
});
test('G5.4 native engine cannot conduct a real blue-to-red player-side mirror',()=>{
 const m=nativeMirrorCapability(loadCandidateEngine());
 assert.equal(m.playerSide,'blue');assert.equal(m.trueMirrorSupported,false);
});
test('fake or empty matrices cannot be used as release proof',()=>{
 assert.throws(()=>combinedNativeAudit([]),/Three seed/);
 assert.throws(()=>checkNativeSeed({format:'fake'}));
});
test('a native G5.4 CPU match really finishes at the saved 1776 seed',()=>{
 const c=runActualCandidate({seed:1776,role:'pike',command:'advance',maxSeconds:600});
 assert.equal(c.winner,'red');
 assert.equal(c.seconds,292.56);assert.equal(c.naturalElimination,true);
});
test('real unanswered battle is not a draw and cannot count as pass',()=>{
 const c=runActualCandidate({seed:1776,role:'bow',command:'hold',maxSeconds:600});
 assert.equal(c.winner,null);
 assert.equal(c.naturalElimination,false);
 assert(c.final.blue>0&&c.final.red>0);assert.equal(c.seconds,600);
});
