import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../src/match-flow.js');
const player={kills:5,deaths:2};
const bots=[
 {id:0,name:'Bot_0',arenaKills:6,arenaDeaths:4},
 {id:1,name:'Bot_1',arenaKills:6,arenaDeaths:1},
 {id:2,name:'Bot_2',arenaKills:1,arenaDeaths:3}
];

test('the only match options are 02:00 / 04:00 / 08:00 and default remains 04:00',()=>{
 assert.deepEqual(M.DURATIONS,[120,240,480]);
 assert.equal(M.create().durationSeconds,240);
 assert.equal(M.create().remaining,240);
 assert.equal(M.DURATION,240);
});

for(const seconds of [120,240,480]) {
 test(seconds+'-second match begins, pauses and finishes at the chosen duration',()=>{
  const match=M.create();
  M.configure(match,seconds);
  assert.equal(match.remaining,seconds);
  M.begin(match);
  assert.equal(M.clock(match.remaining),M.clock(seconds));
  assert.equal(M.tick(match,seconds/2),false);
  M.pause(match);
  assert.equal(M.tick(match,seconds*5),false);
  assert.equal(match.remaining,seconds/2);
  M.resume(match);
  assert.equal(M.tick(match,seconds/2),true);
  assert.equal(match.phase,'results');
  const result=M.finish(match,player,bots);
  assert.equal(result.seconds,seconds);
  assert.equal(result.standings.length,4);
  assert.equal(result.winnerName,'Bot_1');
  assert.equal(M.tick(match,10),false);
  assert.equal(match.remaining,0);
 });
}

test('duration cannot be changed during an active or paused round',()=>{
 const match=M.begin(M.create());
 assert.throws(()=>M.configure(match,120),/Cannot change duration/);
 assert.equal(match.remaining,240);
 M.pause(match);
 assert.throws(()=>M.configure(match,480),/Cannot change duration/);
 assert.equal(match.phase,'paused');
 assert.equal(match.durationSeconds,240);
});

test('invalid durations are rejected atomically',()=>{
 const match=M.create();
 for(const seconds of [0,-1,30,180,360,999,NaN,null,'120',undefined]) {
  assert.throws(()=>M.configure(match,seconds),/Invalid match duration/);
  assert.deepEqual({durationSeconds:match.durationSeconds,remaining:match.remaining},
   {durationSeconds:240,remaining:240});
 }
 assert.throws(()=>M.create(60),/Invalid match duration/);
});

test('results → new selection → replay returns fresh standings and selected timer',()=>{
 const match=M.begin(M.create());
 M.tick(match,240);
 const oldResult=M.finish(match,player,bots);
 M.configure(match,480);
 assert.equal(match.phase,'results');
 assert.equal(match.result,null);
 M.begin(match);
 assert.equal(match.remaining,480);
 assert.equal(match.result,null);
 assert.notStrictEqual(match.result,oldResult);
 assert.equal(match.phase,'playing');
});

test('sorting and K/D stay identical in live and final standings',()=>{
 const match=M.begin(M.create());
 const live=M.leaderboard(player,bots);
 M.tick(match,240);
 const final=M.finish(match,player,bots);
 assert.deepEqual(final.standings,live);
 assert.deepEqual(live.map(e=>e.name),['Bot_1','Bot_0','Sen_1600','Bot_2']);
 assert.equal(live[0].kd,6);
 assert.equal(live[2].kd,2.5);
});
