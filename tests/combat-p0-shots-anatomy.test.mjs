import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const W=require('../src/weapon-balance.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const origin={x:0,y:1.8,z:-20},target={x:0,y:0,z:0};

test('bot bullets at the actual center can hit body, not a randomized damage label',()=>{
 for(const role of ['musket','archer']){
  const shot=W.aimedShot(role,origin,target,.5,.5);
  assert.equal(shot.hit,true);
  assert.equal(shot.zone,'body');
  assert.equal(shot.point.x,0);
  assert.ok(shot.point.y>1.5&&shot.point.y<1.8);
  assert.equal(W.damage(W.weaponForRole(role),shot.zone,.5),
   role==='musket'?90:23);
 }
});
test('real vertical aim selects head and leg; offset side can hit arm',()=>{
 const head=W.aimedShot('musket',origin,target,.5,1);
 const leg=W.aimedShot('musket',origin,target,.5,0);
 const arm=W.aimedShot('musket',origin,target,.80,.5);
 assert.deepEqual([head.zone,leg.zone,arm.zone],['head','leg','arm']);
 assert.deepEqual([W.damage('musket',head.zone),W.damage('musket',leg.zone),
  W.damage('musket',arm.zone)],[135,80,80]);
});
test('wide lateral shots miss physically and must not deal damage',()=>{
 for(const role of ['musket','archer']){
  const shot=W.aimedShot(role,origin,target,1,.5);
  assert.equal(shot.hit,false);
  assert.equal(shot.zone,null);
  assert.ok(Number.isFinite(shot.point.x));
  assert.ok(Math.abs(shot.point.x)>.72);
 }
 const crouched=W.aimedShot('musket',origin,target,.5,.5,1.9);
 assert.equal(crouched.hit,true);
 assert.equal(crouched.zone,'body');
});
test('invalid aim and malformed distance cannot accidentally become hits',()=>{
 assert.throws(()=>W.aimedShot('sword',origin,target),/Invalid ranged aim/);
 assert.equal(W.aimedShot('musket',origin,{x:0,y:0,z:-20}).hit,false);
 assert.equal(W.aimedShot('archer',origin,{x:NaN,y:0,z:0}).hit,false);
});
test('bot shots are validated before damage against actual aim and world obstruction',()=>{
 assert.match(game,/shot = ArenaWeaponBalance\.aimedShot\(/);
 assert.match(game,/target\.type === 'player' && player\.isSliding \? 1\.9 : 3/);
 assert.match(game,/const hitConfirmed = !!\(hit3d &&/);
 assert.match(game,/if \(!hitConfirmed\) return/);
 assert.match(game,/const zone = isRanged \? hit3d\.zone : 'body'/);
 assert.match(game,/ArenaWeaponBalance\.damage\(weapon, zone/);
 assert.doesNotMatch(game,/const zone = ArenaWeaponBalance\.botAimZone\(/);
});
test('bot fire caps are absolute and persist through respawn, reset on new match',()=>{
 assert.match(game,/lastRangedShotAt: -Infinity/);
 assert.match(game,/bot\.lastRangedShotAt = -Infinity/);
 assert.match(game,/ArenaWeaponBalance\.ready\(bot\.lastRangedShotAt,arenaClock,weapon\)/);
 assert.match(game,/bot\.lastRangedShotAt = arenaClock/);
 assert.match(game,/bot\.attackTimer = Math\.max\(bot\.attackTimer,/);
 assert.equal((game.match(/bot\.lastRangedShotAt = -Infinity/g)||[]).length,1);
 assert.equal(W.ready(7,21.99,'musket'),false);
 assert.equal(W.ready(7,22,'musket'),true);
 assert.equal(W.ready(7,10.99,'bow'),false);
 assert.equal(W.ready(7,11,'bow'),true);
});
test('weapon geometry does not register as arm while actual rig arms remain hittable',()=>{
 assert.match(game,/weaponMount\.traverse\(child => \{/);
 assert.match(game,/child\.userData\.hitZone = 'ignore'/);
 assert.match(game,/c\.userData\.hitZone !== 'ignore'/);
 assert.match(game,/hitZone:ArenaWeaponBalance\.zoneFromMesh\(/);
 assert.match(game,/const zone = impact\.hitZone \|\| \(impact\.isHead \? 'head'/);
 assert.match(game,/ArenaWeaponBalance\.damage\(kind,zone\)/);
});
