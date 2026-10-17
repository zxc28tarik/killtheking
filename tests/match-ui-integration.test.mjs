import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('legacy four-minute loop never silently resets at 00:00',()=>{
 assert.doesNotMatch(source,/if \(matchTimeSeconds <= 0\) matchTimeSeconds = 240/);
 assert.match(source,/const matchFinished = ArenaMatch\.tick\(arenaMatch, dt\)/);
 assert.match(source,/if \(matchFinished\) showMatchResults\(\)/);
});
test('player vs six-bot FFA standings count all kill/death directions',()=>{
 assert.match(source,/player\.kills\+\+;\s*bot\.arenaDeaths\+\+/);
 assert.match(source,/attacker\.arenaKills\+\+;\s*victim\.arenaDeaths\+\+/);
 assert.match(source,/player\.deaths\+\+;\s*bot\.arenaKills\+\+/);
 assert.match(source,/arenaKills: 0,\s*arenaDeaths: 0/);
});
test('real match result hides gameplay and unlocks mouse without reopening pause menu',()=>{
 assert.match(source,/matchResultsOverlay\.classList\.remove\('hidden'\)/);
 assert.match(source,/if \(arenaMatch\.phase !== 'results'\) \{\s*menuOverlay\.classList\.remove\('hidden'\)/);
 assert.match(source,/if \(document\.pointerLockElement === canvas && document\.exitPointerLock\)/);
});
test('round restart resets player/bot scores and restores navigation and health',()=>{
 assert.match(source,/function resetFreeForAllRound\(\)/);
 assert.match(source,/player\.kills = 0/);
 assert.match(source,/player\.deaths = 0/);
 assert.match(source,/player\.hp = player\.maxHp/);
 assert.match(source,/bot\.arenaKills = 0/);
 assert.match(source,/bot\.arenaDeaths = 0/);
 assert.match(source,/bot\.navPath\.length = 0/);
 assert.match(source,/bot\.mesh\.position\.copy\(chooseArenaRespawn/);
 assert.match(source,/ArenaMatch\.begin\(arenaMatch\)/);
});
test('game update and time stop when paused or showing results',()=>{
 assert.match(source,/if \(isGameActive && arenaMatch\.phase === 'playing'\) updateGame\(gameDt\)/);
 assert.match(source,/ArenaMatch\.pause\(arenaMatch\)/);
 assert.match(source,/ArenaMatch\.resume\(arenaMatch\)/);
});
test('HTML overlay and native play controls contain accessible text',()=>{
 for(const id of ['match-results-overlay','match-results-table','match-winner-title',
   'match-replay-btn','match-menu-btn'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/TEKRAR OYNA/);assert.match(html,/ANA MENÜ/);
 assert.ok(html.indexOf('src/match-flow.js')<html.indexOf('src/oyun.js'));
});
test('FFA targeting and old Krunker 1600 art source remain in use',()=>{
 assert.match(source,/chooseArenaTarget\(bot\)/);
 assert.match(source,/function buildCastleArena\(\)/);
 assert.match(source,/ArenaPlayerCollision\.move/);
 assert.match(html,/src\/character-motion\.js/);
});
