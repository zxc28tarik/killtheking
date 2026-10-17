import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles/game.css',import.meta.url),'utf8');

test('TAB board uses canonical live ArenaMatch.leaderboard rankings and correct five columns',()=>{
 assert.match(game,/function renderLiveScoreboard\(\)/);
 assert.match(game,/const standings = ArenaMatch\.leaderboard\(player, bots\)/);
 assert.match(game,/entry\.rank, entry\.name, entry\.kills, entry\.deaths, entry\.kd\.toFixed\(2\)/);
 for(const id of ['match-live-scoreboard','match-live-table'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(css,/#match-live-scoreboard:not\(\.hidden\)/);
 assert.match(css,/#match-live-scoreboard\.hidden/);
});
test('TAB is hold-to-show and does not steal menu keyboard navigation',()=>{
 assert.match(game,/if \(e\.code === 'Tab'\) \{\s*\/\/ Keep native TAB keyboard navigation usable in the menu/);
 assert.match(game,/if \(isGameActive && arenaMatch\.phase === 'playing'\) \{\s*e\.preventDefault\(\)/);
 assert.match(game,/if \(tabScoreboardHeld\) e\.preventDefault\(\);\s*hideLiveScoreboard\(\)/);
 assert.match(game,/scoreboardRefreshSeconds = 0\.15/);
 assert.match(game,/liveScoreboardOverlay\.setAttribute\('aria-hidden', 'false'\)/);
});
test('scoreboard clears on round reset, result, lost pointer and tab release',()=>{
 assert.match(game,/function resetFreeForAllRound\(\) \{\s*hideLiveScoreboard\(\)/);
 assert.match(game,/function showMatchResults\(\) \{\s*hideLiveScoreboard\(\)/);
 assert.match(game,/document\.addEventListener\('pointerlockchange',[\s\S]*?\} else \{\s*hideLiveScoreboard\(\)/);
 assert.match(game,/window\.addEventListener\('blur',[\s\S]*?hideLiveScoreboard\(\)/);
});
test('2/4/8 minute options are rendered, bound and locked once round begins',()=>{
 for(const seconds of [120,240,480])assert.match(html,new RegExp('data-duration-seconds="'+seconds+'"'));
 assert.match(game,/ArenaMatch\.configure\(arenaMatch, Number\(button\.dataset\.durationSeconds\)\)/);
 assert.match(game,/const editable = arenaMatch\.phase === 'menu'/);
 assert.match(game,/button\.disabled = !editable/);
 assert.match(game,/syncMatchDurationControls\(\)/);
 assert.match(game,/matchDurationLabel\.textContent = ArenaMatch\.clock\(result\.seconds\)/);
 assert.match(game,/matchDurationSeconds: arenaMatch\.durationSeconds/);
});
test('FFA bot count, castle, movement and offline dependency order preserved',()=>{
 assert.match(game,/chooseArenaTarget\(bot\)/);
 assert.match(game,/function buildCastleArena\(\)/);
 assert.match(game,/ArenaPlayerCollision\.move/);
 assert.ok(html.indexOf('src/match-flow.js')<html.indexOf('src/oyun.js'));
 assert.match(html,/KRUNKER/);
});
