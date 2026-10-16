import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {ANGLES,selectContact}=require('../src/melee-contact.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const hit=(kind,distance,other={})=>({kind,distance,...other});
test('sword samples a broader contact arc than spear',()=>{
 assert.ok(Math.max(...ANGLES.sword)>Math.max(...ANGLES.spear));
 assert.ok(ANGLES.sword.length>ANGLES.spear.length);
});
test('world obstruction cannot be bypassed to hit enemy behind it',()=>{
 assert.equal(selectContact({kind:'spear',reach:8,castRay:()=>hit('world',3)}),null);
});
test('enemy before wall is hit',()=>{
 const result=selectContact({kind:'spear',reach:8,castRay:a=>a===0?hit('bot',2,{id:'near'}):hit('world',4)});
 assert.equal(result.id,'near');
});
test('nearest unobstructed enemy is chosen regardless of sample order',()=>{
 const result=selectContact({kind:'sword',reach:5,castRay:a=>a===.2?hit('bot',1,{id:'close'}):a===0?hit('bot',4,{id:'far'}):hit('world',.7)});
 assert.equal(result.id,'close');
});
test('sword can hit an off-center opponent missed by spear',()=>{
 assert.equal(selectContact({kind:'spear',reach:7,castRay:a=>Math.abs(a)>.1?hit('bot',3):null}),null);
 assert.ok(selectContact({kind:'sword',reach:7,castRay:a=>Math.abs(a)>.1?hit('bot',3):null}));
});
test('barrel can be first contact',()=>{
 assert.equal(selectContact({kind:'sword',reach:5,castRay:a=>a===0?hit('barrel',1.5):hit('world',3)}).kind,'barrel');
});
test('invalid distances and out-of-range contacts are ignored',()=>{
 assert.equal(selectContact({kind:'sword',reach:5,castRay:()=>hit('bot',6)}),null);
 assert.equal(selectContact({kind:'sword',reach:5,castRay:()=>hit('bot',NaN)}),null);
 assert.equal(selectContact({kind:'sword',reach:0,castRay:()=>hit('bot',1)}),null);
});
test('many blade samples still select only one contact per swing',()=>{
 let samples=0;
 const result=selectContact({kind:'sword',reach:7,castRay:a=>{samples++;return hit('bot',2,{id:a});}});
 assert.ok(samples>1);
 assert.equal(result.angle,0);
});
test('game integrates ordered sword spear dagger contact and removes old fallback',()=>{
 assert.match(game,/ArenaWeaponSweep\.begin\(cls.id === 1 \? 'spear' : 'sword'/);
 assert.match(game,/arenaPlayerMeleeContact\('dagger', 5.2\)/);
 assert.match(game,/raycaster.intersectObjects\(targets, false\)/);
 assert.match(game,/return \{kind:'world',distance:hit.distance\}/);
 assert.doesNotMatch(game,/if \(checkBarrelHit\(cls.range\)\) return;/);
 assert.ok(html.indexOf('src/melee-contact.js')<html.indexOf('src/oyun.js'));
});
