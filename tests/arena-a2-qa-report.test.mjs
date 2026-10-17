import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const QA=require('../src/arena-qa-report.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sample=()=>({
 matchPhase:'playing',matchDurationSeconds:480,matchRemaining:400,
 playerClassIdx:2,playerClassName:'OKÇU',playerKills:4,playerDeaths:2,playerParries:1,
 matchStandings:[
  {id:'bot:0',name:'Bot A',rank:1,kills:5,deaths:1},
  {id:'player',name:'Sen_1600',rank:2,kills:4,deaths:2},
  {id:'bot:1',name:'Bot B',rank:3,kills:2,deaths:3}
 ],
 bots:[
  {name:'Bot A',role:'melee',weapon:'sword',arenaKills:5,arenaDeaths:1,target:'Bot B',remainingWaypoints:0,navigationStuckTime:0},
  {name:'Bot B',role:'ranged',weapon:'bow',arenaKills:2,arenaDeaths:3,target:'player',remainingWaypoints:4,navigationStuckTime:3},
  {name:'Bot C',role:'melee',arenaKills:0,arenaDeaths:0,target:null,remainingWaypoints:0,navigationStuckTime:0}
 ]
});

test('summary produces read-only class, score and instantaneous FFA targeting overview',()=>{
 const src=sample(),before=JSON.stringify(src),r=QA.summarize(src);
 assert.equal(JSON.stringify(src),before);
 assert.equal(r.playerClassName,'OKÇU');
 assert.equal(r.elapsedSeconds,80);
 assert.equal(r.playerKD,2);
 assert.equal(r.botKillsTotal,7);
 assert.equal(r.botDeathsTotal,4);
 assert.deepEqual(r.targetingAtSnapshot,{otherBots:1,player:1,none:1,invalidSelfTarget:0});
 assert.deepEqual(r.navigationStuckCandidates,['Bot B']);
 assert.equal(r.fighters[0].kd,5);
 assert.equal(r.standings[0].rank,1);
 assert.match(r.notes,/instantaneous/);
 assert.match(r.notes,/bot-vs-player/);
});

test('self-targeting is flagged rather than claimed as bot-vs-bot combat',()=>{
 const s=sample();
 s.bots[0].target='Bot A';
 const r=QA.summarize(s);
 assert.equal(r.targetingAtSnapshot.invalidSelfTarget,1);
 assert.equal(r.targetingAtSnapshot.otherBots,0);
});

test('malformed snapshots rejected and invalid counts cannot yield negative or NaN metrics',()=>{
 assert.throws(()=>QA.summarize(null),/Expected arena/);
 assert.throws(()=>QA.summarize({bots:[]}),/Expected arena/);
 const s=sample();
 s.playerKills=NaN;s.bots[0].arenaDeaths=-100;
 const r=QA.summarize(s);
 assert.equal(r.playerKills,0);
 assert.equal(r.fighters[0].deaths,0);
 assert.equal(r.fighters[0].kd,5);
});

test('diagnostics are inspected on demand, not injected into the game loop',()=>{
 assert.match(html,/src\/arena-qa-report\.js/);
 assert.ok(html.indexOf('src/arena-qa-report.js')<html.indexOf('src/oyun.js'));
 assert.match(game,/window\.krunkerArenaBalanceReport = \(\) => ArenaQAReport\.summarize\(window\.krunkerArenaStatus\(\)\)/);
 assert.match(game,/playerClassName: CLASSES\[player\.classIdx\]\.name/);
 assert.doesNotMatch(game,/setInterval\([^\n]*krunkerArenaBalanceReport/);
});
