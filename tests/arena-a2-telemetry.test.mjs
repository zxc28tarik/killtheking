import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const T=require('../src/arena-telemetry.js');
const QA=require('../src/arena-qa-report.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

const roster=()=>[
 {id:0,dead:false,arenaTargetType:'bot',arenaTargetId:1,navPath:[{}],navStuck:2.5},
 {id:1,dead:false,arenaTargetType:'player',arenaTargetId:null,navPath:[],navStuck:0},
 {id:2,dead:false,arenaTargetType:null,arenaTargetId:null,navPath:[],navStuck:0},
 {id:3,dead:true,arenaTargetType:'player',arenaTargetId:null,navPath:[],navStuck:0}
];

test('actual lethal events are counted once by correct FFA direction',()=>{
 const s=T.create();
 assert.equal(T.recordKill(s,'player','bot:0',{classIdx:0,weapon:'Kılıç',second:12.3}),true);
 assert.equal(T.recordKill(s,'bot:0','player',{weapon:'Kargı',second:20}),true);
 assert.equal(T.recordKill(s,'bot:1','bot:2',{weapon:'Ok',second:32}),true);
 assert.deepEqual(s.kills,{playerToBot:1,botToPlayer:1,botToBot:1});
 assert.deepEqual(s.classKills,[1,0,0,0]);
 assert.deepEqual(s.recentKills.map(e=>e.kind),['playerToBot','botToPlayer','botToBot']);
 assert.equal(s.recentKills[0].second,12.3);
});

test('changed player class is attributed per kill, not last selected class',()=>{
 const s=T.create();
 T.recordKill(s,'player','bot:0',{classIdx:2});
 T.recordKill(s,'player','bot:1',{classIdx:3});
 T.recordKill(s,'player','bot:2',{classIdx:2});
 assert.deepEqual(s.classKills,[0,0,2,1]);
});

test('self-kills and invalid actor IDs do not corrupt live stats',()=>{
 const s=T.create();
 for(const [attacker,victim] of [
  ['player','player'],['bot:1','bot:1'],['bot:-1','player'],
  ['oops','bot:0'],['bot:0','oops'],[null,'bot:0']
 ]) assert.equal(T.recordKill(s,attacker,victim),false);
 assert.deepEqual(s.kills,{playerToBot:0,botToPlayer:0,botToBot:0});
 assert.equal(s.recentKills.length,0);
});

test('bot target samples distinguish valid rival bot vs player, idle, self and dead',()=>{
 const s=T.create();
 const bots=roster();
 T.sampleTargets(s,bots);
 assert.equal(s.samples,1);
 assert.deepEqual(s.targetSlots,{bot:1,player:1,none:1,invalidSelf:0});
 assert.deepEqual(s.stuckSamples,{'0':1});
 bots[0].arenaTargetId=0; bots[2].arenaTargetType='bot'; bots[2].arenaTargetId=3;
 T.sampleTargets(s,bots);
 assert.deepEqual(s.targetSlots,{bot:1,player:2,none:2,invalidSelf:1});
 assert.equal(s.samples,2);
 assert.equal(s.stuckSamples['0'],2);
});

test('telemetry is bounded, cloned and fully reset for the next replay',()=>{
 const s=T.create();
 for(let i=0;i<45;i++)T.recordKill(s,'player','bot:0',{classIdx:1,second:i});
 assert.equal(s.kills.playerToBot,45);
 assert.equal(s.recentKills.length,T.LOG_LIMIT);
 assert.equal(s.recentKills[0].second,45-T.LOG_LIMIT);
 const safe=T.snapshot(s);
 safe.kills.playerToBot=-100;safe.classKills[1]=-100;safe.recentKills.pop();
 assert.equal(s.kills.playerToBot,45);
 assert.equal(s.classKills[1],45);
 assert.equal(s.recentKills.length,T.LOG_LIMIT);
 T.reset(s);
 assert.deepEqual(T.snapshot(s),T.snapshot(T.create()));
});

test('QA report joins kill evidence, target observation shares and score reconciliation',()=>{
 const t=T.create();
 T.recordKill(t,'player','bot:0',{classIdx:1});
 T.recordKill(t,'bot:0','player');
 T.recordKill(t,'bot:1','bot:0');
 T.sampleTargets(t,roster());
 const report=QA.summarize({
  matchPhase:'playing',matchDurationSeconds:240,matchRemaining:200,
  playerClassIdx:1,playerClassName:'PİYADE',playerKills:1,playerDeaths:1,playerParries:0,
  bots:[
   {name:'Bot_0',id:0,arenaKills:1,arenaDeaths:2,target:'Bot_1'},
   {name:'Bot_1',id:1,arenaKills:1,arenaDeaths:0,target:'player'}
  ],
  matchStandings:[{rank:1,id:'player',name:'Sen_1600',kills:1,deaths:1}],
  telemetry:T.snapshot(t)
 });
 assert.deepEqual(report.killsByDirection,{playerToBot:1,botToPlayer:1,botToBot:1});
 assert.deepEqual(report.playerKillsByClass,[0,1,0,0]);
 assert.equal(report.targetingOverTime.fighterObservations,3);
 assert.equal(report.targetingOverTime.botTargetShare,1/3);
 assert.equal(report.targetingOverTime.playerTargetShare,1/3);
 assert.equal(report.scoreCrossCheck.playerKillsAgree,true);
 assert.equal(report.scoreCrossCheck.playerDeathsAgree,true);
 assert.equal(report.scoreCrossCheck.totalBotKillsAgree,true);
 assert.equal(report.recentKills.length,3);
});

test('sampling only happens through the playing-state game loop, not while paused',()=>{
 assert.match(game,/if \(isGameActive && arenaMatch\.phase === 'playing'\) updateGame\(gameDt\)/);
 assert.match(game,/telemetrySampleAccumulator \+= dt/);
 assert.match(game,/ArenaTelemetry\.sampleTargets\(arenaTelemetry, bots\)/);
 assert.match(game,/ArenaTelemetry\.reset\(arenaTelemetry\)/);
 assert.match(game,/window\.krunkerArenaBalanceReport = \(\) => ArenaQAReport\.summarize/);
 for(const str of [
  /ArenaTelemetry\.recordKill\(arenaTelemetry, 'player', 'bot:' \+ bot\.id/,
  /ArenaTelemetry\.recordKill\(arenaTelemetry, 'bot:' \+ attacker\.id/,
  /ArenaTelemetry\.recordKill\(arenaTelemetry, 'bot:' \+ bot\.id, 'player'/
 ]) assert.match(game,str);
 assert.ok(html.indexOf('src/arena-telemetry.js')<html.indexOf('src/oyun.js'));
});

test('score history starts empty; no division-by-zero share before first sample',()=>{
 const r=QA.summarize({
  matchPhase:'menu',matchDurationSeconds:240,matchRemaining:240,
  bots:[],matchStandings:[],telemetry:T.snapshot(T.create())
 });
 assert.equal(r.targetingOverTime.sampleCount,0);
 assert.equal(r.targetingOverTime.botTargetShare,null);
 assert.deepEqual(r.recentKills,[]);
});
