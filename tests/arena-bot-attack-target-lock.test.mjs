import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');

test('melee and ranged attacks commit to a single visible opponent during windup',()=>{
 assert.match(source,/const attackTargetKey = arenaTarget \? arenaTarget\.type \+ ':'/);
 assert.match(source,/bot\.windupTargetKey = attackTargetKey/);
 assert.match(source,/attackTargetKey !== bot\.windupTargetKey/);
 assert.match(source,/if \(bot\.rangedWindup > 0\)/);
 assert.match(source,/else if \(bot\.meleeWindup > 0\)/);
});

test('round start, respawns and failed unreachable target recovery clear stale windups',()=>{
 assert.match(source,/windupTargetKey: null/);
 assert.ok((source.match(/bot\.windupTargetKey = null;/g)||[]).length>=4);
 assert.match(source,/bot\.rangedWindup = 0;\s*bot\.windupTargetKey = null;/);
 assert.match(source,/bot\.meleeWindup = 0;\s*bot\.rangedWindup = 0;\s*bot\.windupTargetKey = null;/);
});

test('old autonomous FFA and arena line-of-sight remain authoritative',()=>{
 assert.match(source,/function chooseArenaTarget\(bot\)/);
 assert.match(source,/arenaTargetCount\('player', null, bot\.id\) === 0/);
 assert.match(source,/if \(!arenaLineOfSight\(bot, targetPos, target\.type === 'player'\)\) return;/);
 assert.match(source,/navigator\.safeAdvance\(botGround, stepDir/);
});
