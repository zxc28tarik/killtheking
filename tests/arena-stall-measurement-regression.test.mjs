import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const T=require('../src/arena-telemetry.js');
const QA=require('../src/arena-qa-report.js');

test('active path stall remains reportable after waypoint queue is cleared for replan',()=>{
 const bot={id:0,name:'Bot_0',dead:false,arenaTargetType:'bot',arenaTargetId:1,
  arenaKills:0,arenaDeaths:0,navPath:[],navStuck:2.25,remainingWaypoints:0,
  navigationStuckTime:2.25,target:'Bot_1'};
 const sampled=T.create();
 T.sampleTargets(sampled,[bot]);
 assert.deepEqual(sampled.stuckSamples,{'0':1});
 const report=QA.summarize({
  matchPhase:'playing',matchDurationSeconds:240,matchRemaining:140,
  bots:[bot],matchStandings:[],telemetry:T.snapshot(sampled)
 });
 assert.deepEqual(report.navigationStuckCandidates,['Bot_0']);
 assert.deepEqual(report.navigationStuckSamples,{'0':1});
});

test('idle AI does not trigger false stuck reports after cleared timer',()=>{
 const bot={id:0,name:'Bot_0',dead:false,arenaTargetType:null,arenaTargetId:null,
  arenaKills:0,arenaDeaths:0,navPath:[],navStuck:0,
  remainingWaypoints:0,navigationStuckTime:0,target:null};
 const state=T.create();
 T.sampleTargets(state,[bot]);
 assert.deepEqual(state.stuckSamples,{});
 assert.deepEqual(QA.summarize({bots:[bot],matchStandings:[]}).navigationStuckCandidates,[]);
});
