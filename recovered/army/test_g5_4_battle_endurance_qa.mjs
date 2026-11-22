import test from 'node:test';
import assert from 'node:assert/strict';
import {loadEngine} from './run_g5_4_extended_trials.mjs';
import {runExtendedBattle} from './g5_4_long_battle_diagnostics.mjs';
import {classifyClosure,summarizeCases,runEndurance} from './g5_4_battle_endurance_qa.mjs';
const E=loadEngine();
const fixture=(winner,blue,red,b300=blue,r300=red)=>({
 ticks:7500,simulatedSeconds:600,
 checkpoints:[{at:0,blueAlive:70,redAlive:70},
 {at:300,blueAlive:b300,redAlive:r300},
 {at:600,blueAlive:blue,redAlive:red,winner}]
});
test('600s no-casualty stalemate stays unresolved, never draw',()=>{
 const r=classifyClosure(fixture(null,25,25));
 assert.equal(r.status,'stalled-at-600');assert.equal(r.winner,null);
 assert.equal(r.releaseGatePassed,false);assert.equal(r.casualtiesLast300s,0);
});
test('ongoing losses do not produce a fictitious timeout winner',()=>{
 const r=classifyClosure(fixture(null,5,23,15,29));
 assert.equal(r.status,'unresolved-at-600');assert.equal(r.casualtiesLast300s,16);
 assert.equal(r.releaseGatePassed,false);
});
test('native elimination blue victory is accepted',()=>{
 const r=classifyClosure(fixture('blue',27,0,29,10));
 assert.equal(r.status,'native-finished');assert.equal(r.releaseGatePassed,true);
});
test('native elimination red victory is accepted',()=>{
 const r=classifyClosure(fixture('red',0,27,10,30));
 assert.equal(r.winner,'red');
});
test('native double-elimination draw is accepted only with both sides empty',()=>{
 const r=classifyClosure(fixture('draw',0,0,20,20));
 assert.equal(r.winner,'draw');
 assert.throws(()=>classifyClosure(fixture('draw',20,20)),/mismatch/);
});
test('missing real snapshots, resurrecting soldiers and false winners are rejected',()=>{
 assert.throws(()=>classifyClosure({checkpoints:[]}),/Missing/);
 assert.throws(()=>classifyClosure(fixture('blue',20,20)),/mismatch/);
 const s=fixture(null,25,25);s.checkpoints[2].blueAlive=30;
 assert.throws(()=>classifyClosure(s),/Non-monotone/);
});
test('summary distinguishes test correctness from production acceptance',()=>{
 const cases=[classifyClosure(fixture(null,25,25)),classifyClosure(fixture('blue',27,0,29,10))];
 const x=summarizeCases(cases);
 assert.equal(x.terminalMatches,1);assert.equal(x.unresolvedMatches,1);
 assert.equal(x.releaseReady,false);assert.equal(x.g8_5RealMirrorMatches,0);
});
test('real G5.4 motor executes and short match remains in progress',()=>{
 const trial=runExtendedBattle(E,{seed:1600,role:'bow',command:'hold',durationSeconds:4,bucketSeconds:2});
 const x=classifyClosure(trial);assert.equal(x.status,'still-running');
 assert.equal(x.winner,null);assert.equal(x.releaseGatePassed,false);
});
test('actual G5.4 engine only ends after native elimination, then freezes',()=>{
 const s=E.create(1600,'musket');
 for(const soldier of s.soldiers)if(soldier.team==='red'){soldier.alive=false;soldier.hp=0;}
 for(const squad of s.squads)if(squad.team==='red')squad.alive=0;
 E.step(s,.08);assert.equal(s.winner,'blue');let tick=s.tick;
 E.step(s,.08);assert.equal(s.tick,tick);
});
test('G5.4 endurance CLI rejects invalid duration and seed',()=>{
 assert.throws(()=>runEndurance({duration:300}),/documented 600/);
 assert.throws(()=>runEndurance({seed:1.5}),/documented 600/);
});
