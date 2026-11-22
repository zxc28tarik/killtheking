import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const terrain=require('./meadow-terrain-heightfield.js');
const bridge=require('./meadow-terrain-bridge.js');
const H=240;
const make=(options={})=>bridge.create({terrain,halfSize:H,...options});
test('flat origin permits ordinary walking',()=>{
 assert.equal(make().step({x:0,z:-15},{x:0,z:-10}).ok,true);
});
test('physical soldier foot height equals painted hilltop',()=>{
 const feet=make().soldierPose({x:-124.8,z:-144}).feet;
 assert.ok(Math.abs(feet.y-12)<.05);
});
test('steep ridge cannot silently bypass slope gate',()=>{
 const out=make({maxSlopeDeg:2}).step({x:-180,z:-144},{x:-120,z:-144});
 assert.equal(out.ok,false);
});
test('solid hill blocks lower 3D ranged sight',()=>{
 const b=make(),a=b.at(-205,-144,1.65),c=b.at(-50,-144,1.65);
 assert.equal(b.lineOfSight(a,c).clear,false);
});
test('shot above hill crest remains unblocked by terrain',()=>{
 const b=make(),a=b.at(-205,-144,25),c=b.at(-50,-144,25);
 assert.equal(b.lineOfSight(a,c).clear,true);
});
test('world boundary rejects moves',()=>{
 assert.equal(make().step({x:0,z:0},{x:241,z:0}).reason,'boundary');
});
test('NaN coordinates cannot reach renderer or AI',()=>{
 assert.throws(()=>make().lineOfSight(
   {x:0,y:NaN,z:0},{x:1,y:1,z:1}));
});
