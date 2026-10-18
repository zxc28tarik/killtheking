import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');

test('QA JSON download exists only in match-results panel and never replaces replay/menu',()=>{
 const panel=html.slice(html.indexOf('id="match-results-overlay"'),html.indexOf('<!-- ==================== START / PAUSE MENU'));
 for(const button of ['match-qa-export-btn','match-replay-btn','match-menu-btn'])
  assert.match(panel,new RegExp('id="'+button+'"'));
 assert.equal(html.split('id="match-qa-export-btn"').length-1,1);
 assert.ok(html.indexOf('match-qa-export-btn')>html.indexOf('match-results-overlay'));
});

test('QA export includes final standings and telemetry without network upload',()=>{
 assert.match(game,/document\.getElementById\('match-qa-export-btn'\)\.addEventListener\('click'/);
 assert.match(game,/if \(arenaMatch\.phase !== 'results' \|\| !arenaMatch\.result\) return/);
 assert.match(game,/schema: 'killtheking-match-qa-v2'/);
 assert.match(game,/mode: arenaMode/);
 assert.match(game,/matchResult: arenaMatch\.result/);
 assert.match(game,/metrics: window\.krunkerArenaBalanceReport\(\)/);
 assert.match(game,/new Blob\(\[JSON\.stringify\(report, null, 2\)\]/);
 assert.match(game,/URL\.createObjectURL\(blob\)/);
 assert.match(game,/link\.download = 'KillTheKing_' \+ arenaMode\.toUpperCase\(\) \+ '_QA_'/);
 assert.match(game,/URL\.revokeObjectURL\(url\)/);
 assert.doesNotMatch(game,/fetch\([^)]*match-qa-export/);
});

test('source still retains existing match controls and autonomous FFA',()=>{
 assert.match(game,/function resetFreeForAllRound\(\)/);
 assert.match(game,/ArenaMatch\.finish\(arenaMatch, player, bots\)/);
 assert.match(game,/chooseArenaTarget\(bot\)/);
});
