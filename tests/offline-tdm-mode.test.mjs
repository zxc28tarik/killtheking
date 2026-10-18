import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const T=require('../src/arena-teams.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('FFA remains the default, all six bots can fight independently',()=>{
 assert.deepEqual(T.MODES,['ffa','tdm']);
 assert.match(game,/let arenaMode = 'ffa'/);
 assert.equal(T.canDamage('ffa','blue','blue'),true);
 assert.equal(T.canDamage('ffa','blue','red'),true);
 assert.equal(T.result('ffa',{kills:1},[]),null);
 assert.deepEqual(T.scores('ffa',{kills:40},[]),{blue:0,red:0});
});

test('offline 4v3 teams are deterministic: player and three allies vs three enemies',()=>{
 const assignments=Array.from({length:6},(_,id)=>T.teamForBot(id));
 assert.deepEqual(assignments,['blue','red','blue','red','blue','red']);
 assert.equal(T.PLAYER_TEAM,'blue');
 assert.equal(assignments.filter(x=>x==='blue').length+1,4);
 assert.equal(assignments.filter(x=>x==='red').length,3);
});

test('TDM blocks every allied damage/target combination while FFA stays full PVP',()=>{
 assert.equal(T.canDamage('tdm','blue','blue'),false);
 assert.equal(T.canDamage('tdm','red','red'),false);
 assert.equal(T.canDamage('tdm','blue','red'),true);
 assert.equal(T.canDamage('tdm','red','blue'),true);
 assert.equal(T.mayTarget('tdm','blue','blue'),false);
 assert.equal(T.mayTarget('tdm','red','blue'),true);
 assert.equal(T.canDamage('ffa','blue','blue'),true);
 assert.throws(()=>T.canDamage('other','blue','red'),/Invalid arena mode/);
});

test('team score sums individual kills and draws resolve safely',()=>{
 const bots=Array.from({length:6},(_,id)=>({id,arenaKills:id%2?1:2}));
 const player={kills:3};
 assert.deepEqual(T.scores('tdm',player,bots),{blue:9,red:3});
 assert.deepEqual(T.result('tdm',player,bots),{
  mode:'tdm',winner:'blue',scores:{blue:9,red:3},playerWon:true,
  winnerId:'team:blue',winnerName:'MAVİ TAKIM'
 });
 const redWin=T.result('tdm',{kills:0},Array.from({length:6},(_,id)=>({id,arenaKills:id%2?4:0})));
 assert.equal(redWin.winner,'red');
 const tie=T.result('tdm',{kills:0},Array.from({length:6},(_,id)=>({id,arenaKills:0})));
 assert.equal(tie.winner,'draw');
 assert.equal(tie.playerWon,false);
});

test('team-safe spawn pools stay on opposite castle sides, preserving fallback',()=>{
 const pool=[{x:-25,z:0},{x:25,z:0},{x:-39,z:10},{x:39,z:10},{x:0,z:0}];
 assert.deepEqual(T.spawnCandidates(pool,'tdm','blue').map(p=>p.x),[-25,-39]);
 assert.deepEqual(T.spawnCandidates(pool,'tdm','red').map(p=>p.x),[25,39]);
 assert.equal(T.spawnCandidates(pool,'ffa','blue'),pool);
 assert.deepEqual(T.spawnCandidates([{x:0,z:0}],'tdm','blue'),[{x:0,z:0}]);
});

test('runtime friend-or-foe targeting, damage, and spawns are all mode gated',()=>{
 assert.match(game,/if \(!arenaCanTarget\(bot,'bot',other\.id\)\) continue;/);
 assert.match(game,/arenaCanTarget\(bot,'player',null\)/);
 assert.match(game,/arenaCanTarget\(bot,bot\.arenaAggroType,bot\.arenaAggroId\)/);
 assert.match(game,/ArenaTeams\.canDamage\(arenaMode,ArenaTeams\.PLAYER_TEAM,botTeam\(bot\)\)/);
 assert.match(game,/ArenaTeams\.canDamage\(arenaMode,botTeam\(attacker\),botTeam\(victim\)\)/);
 assert.match(game,/if \(!arenaCanTarget\(bot,target\.type,target\.id\)\) return/);
 assert.match(game,/ArenaTeams\.spawnCandidates\(pool,arenaMode,team\)/);
 assert.match(game,/teamId: ArenaTeams\.teamForBot\(i\)/);
});

test('live TAB, main menu selection, results and QA export all support both modes',()=>{
 for(const id of ['match-mode-controls','match-live-team-score','match-team-results',
  'hud-team-score','hud-team-blue','hud-team-red'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/data-arena-mode="ffa"/);
 assert.match(html,/data-arena-mode="tdm"/);
 assert.match(game,/if \(arenaMatch\.phase !== 'menu'\) return;\s*arenaMode = ArenaTeams\.validate/);
 assert.match(game,/const teamResult = ArenaTeams\.result\(arenaMode,player,bots\)/);
 assert.match(game,/teamHud\.classList\.toggle\('hidden',!enabled\)/);
 assert.match(game,/renderTeamHUD\(\)/);
 assert.match(game,/syncMatchModeControls\(\)/);
 assert.match(game,/mode: arenaMode/);
 assert.ok(html.indexOf('src/arena-teams.js')<html.indexOf('src/oyun.js'));
});

test('actual target helper refuses allied bot and player for blue, permits red opponents',()=>{
 const src=game.match(/function arenaCanTarget\(bot,type,id\) \{[\s\S]*?\n        \}/)?.[0];
 assert.ok(src,'arenaCanTarget must exist');
 const bots=Array.from({length:6},(_,id)=>({id}));
 const context={ArenaTeams:T,bots,botTeam:b=>T.teamForBot(b.id),arenaMode:'tdm'};
 const can=vm.runInNewContext('('+src+')',context);
 assert.equal(can(bots[0],'player',null),false);
 assert.equal(can(bots[1],'player',null),true);
 assert.equal(can(bots[0],'bot',2),false);
 assert.equal(can(bots[0],'bot',1),true);
 assert.equal(can(bots[1],'bot',3),false);
 assert.equal(can(bots[1],'bot',0),true);
 context.arenaMode='ffa';
 assert.equal(can(bots[0],'bot',2),true);
 assert.equal(can(bots[0],'player',null),true);
});
