import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const { chooseSpawn }=require('../src/spawn-safety.js');
const p=(x,z,y=2)=>({x,y,z});
test('chooses spawn farthest from a nearby killer',()=>{
  const pool=[p(0,0),p(25,0),p(-25,0)];
  assert.deepEqual(chooseSpawn(pool,[p(1,1),p(23,0)]),pool[2]);
});
test('prefers clearance from the CLOSEST enemy even when others are distant',()=>{
  const pool=[p(0,0),p(30,0)];
  assert.deepEqual(chooseSpawn(pool,[p(4,0),p(-1000,0)]),pool[1]);
});
test('works with no threats or only one legal spawn',()=>{
  assert.deepEqual(chooseSpawn([p(4,5)],[]),p(4,5));
  assert.deepEqual(chooseSpawn([p(4,5)],[p(4,5)]),p(4,5));
});
test('rejects empty spawn lists',()=>assert.throws(()=>chooseSpawn([],[]),/empty/));
test('main game calls safety selector on both player and bot respawns',()=>{
  const code=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(code,/chooseArenaRespawn\(COURTYARD_SPAWNS, null, false\)/);
  assert.match(code,/chooseArenaRespawn\(spawns, bot, true\)/);
  assert.ok(html.indexOf('src/spawn-safety.js')<html.indexOf('src/oyun.js'));
});
