import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../src/match-flow.js');
const player=(kills=0,deaths=0)=>({kills,deaths});
const bots=(stats=[])=>stats.map(([kills,deaths],id)=>({id,name:'Bot_'+id,arenaKills:kills,arenaDeaths:deaths}));

test('new match begins at four minutes with no results',()=>{
 const x=M.create();assert.equal(x.phase,'menu');assert.equal(x.remaining,240);
 M.begin(x);assert.equal(x.phase,'playing');assert.equal(x.remaining,240);assert.equal(x.result,null);
});
test('match timer ends precisely at zero; never automatically restarts',()=>{
 const x=M.begin(M.create());
 assert.equal(M.tick(x,239.5),false);assert.equal(x.remaining,.5);
 assert.equal(M.tick(x,.5),true);
 assert.equal(x.phase,'results');assert.equal(x.remaining,0);
 assert.equal(M.tick(x,10),false);assert.equal(x.remaining,0);
});
test('paused match cannot consume time',()=>{
 const x=M.begin(M.create());M.tick(x,21);M.pause(x);
 assert.equal(x.phase,'paused');assert.equal(M.tick(x,90),false);
 assert.equal(x.remaining,219);M.resume(x);assert.equal(x.phase,'playing');
 assert.equal(M.tick(x,1),false);assert.equal(x.remaining,218);
});
test('results sort by kills then fewer deaths',()=>{
 const rows=M.leaderboard(player(4,2),bots([[6,4],[6,1],[3,0]]));
 assert.deepEqual(rows.map(x=>x.kills),[6,6,4,3]);
 assert.equal(rows[0].id,'bot:1');
 assert.equal(rows[1].id,'bot:0');
 assert.equal(rows[2].id,'player');
});
test('ties with same kills and deaths resolve deterministically for player',()=>{
 const rows=M.leaderboard(player(2,1),bots([[2,1],[2,1]]));
 assert.equal(rows[0].id,'player');assert.deepEqual(rows.map(x=>x.rank),[1,2,3]);
});
test('finish freezes a stable snapshot and winner',()=>{
 const x=M.begin(M.create());M.tick(x,240);
 const winner=M.finish(x,player(6,3),bots([[4,2]]));
 assert.equal(winner.playerWon,true);assert.equal(winner.winnerName,'Sen_1600');
 const same=M.finish(x,player(0,99),bots([[200,0]]));
 assert.strictEqual(same,winner);
});
test('bot winner is represented with name and playerWon false',()=>{
 const x=M.begin(M.create());M.tick(x,240);
 const r=M.finish(x,player(0,0),bots([[3,0]]));
 assert.equal(r.winnerId,'bot:0');assert.equal(r.playerWon,false);
});
test('replay resets scores from match state and starts timer',()=>{
 const x=M.begin(M.create());M.tick(x,240);M.finish(x,player(3,1),bots([[4,2]]));
 M.begin(x);assert.equal(x.phase,'playing');
 assert.equal(x.result,null);assert.equal(x.remaining,240);
});
test('clock formats whole seconds with ceiling, including subsecond end',()=>{
 assert.equal(M.clock(240),'04:00');assert.equal(M.clock(239.2),'04:00');
 assert.equal(M.clock(59.1),'01:00');assert.equal(M.clock(0),'00:00');
});
test('invalid match dt fails without changing time',()=>{
 const x=M.begin(M.create());
 assert.throws(()=>M.tick(x,-.1),/Invalid match time step/);
 assert.throws(()=>M.tick(x,NaN),/Invalid match time step/);
 assert.equal(x.remaining,240);
});
test('match result cannot be assembled while still playing',()=>{
 assert.throws(()=>M.finish(M.begin(M.create()),player(1,0),[]),/not finished/);
});
test('all seven fighters are shown even with no kills',()=>{
 const rows=M.leaderboard(player(),bots([[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]));
 assert.equal(rows.length,7);assert.equal(rows[0].isPlayer,true);
 assert.equal(rows[6].rank,7);
});
