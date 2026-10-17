import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {move,overlaps}=require('../src/player-collision.js');
const box=(minX,maxX,minZ,maxZ,minY=0,maxY=8)=>({minX,maxX,minZ,maxZ,minY,maxY});
const actor=(x=0,z=0,y=2.35)=>({x,y,z});
const sweep=(from,vx,vz,colliders,dt=.05)=>move({from,velocity:{x:vx,z:vz},dt,radius:.75,height:2.35,colliders});

test('high speed cannot tunnel through thin castle wall',()=>{
 const wall=box(4.9,5.1,-5,5);
 const p=sweep(actor(),250,0,[wall]);
 assert.ok(p.x<=4.15);assert.equal(p.hitX,true);
 assert.equal(overlaps({...actor(),x:p.x,z:p.z},.75,2.35,[wall]),false);
});
test('diagonal player motion slides along wall instead of freezing',()=>{
 const p=sweep(actor(),150,60,[box(4.9,5.1,-50,50)]);
 assert.ok(p.x<=4.15 && p.z>2.5);
 assert.equal(p.hitX,true);assert.equal(p.hitZ,false);
});
test('negative direction cannot tunnel through a thin wall',()=>{
 const p=sweep(actor(10),-300,0,[box(4.9,5.1,-5,5)]);
 assert.ok(p.x>=5.85);assert.equal(p.hitX,true);
});
test('diagonal dash stops at obstacle corner and cannot jump beyond it',()=>{
 const wall=box(5,9,5,9),p=sweep(actor(),220,220,[wall]);
 assert.ok(p.x<4.26 && p.z<4.26);
 assert.equal(overlaps({...actor(),x:p.x,z:p.z},.75,2.35,[wall]),false);
});
test('unobstructed movement retains same displacement',()=>{
 const p=sweep(actor(),10,-20,[box(8,10,-2,2)]);
 assert.ok(Math.abs(p.x-.5)<.001 && Math.abs(p.z+1)<.001);
});
test('jumping fully above low obstacle may cross it',()=>{
 const p=sweep(actor(0,0,7),250,0,[box(4.9,5.1,-3,3,0,3)]);
 assert.ok(p.x>12 && !p.hitX);
});
test('high wall blocks when player's head vertically overlaps it',()=>{
 const p=sweep(actor(0,0,8),250,0,[box(4.9,5.1,-3,3,7,13)]);
 assert.equal(p.hitX,true);
});
test('walking on top of sur remains legal without snagging',()=>{
 const p=sweep(actor(0,0,9.35),250,0,[box(4.9,5.1,-3,3,0,7)]);
 assert.equal(p.hitX,false);
});
test('invalid starting position inside wall recovers to nearest safe side',()=>{
 const wall=box(-1,1,-1,1),p=sweep(actor(),0,0,[wall]);
 assert.ok(p.recovered>0);
 assert.equal(overlaps({...actor(),x:p.x,z:p.z},.75,2.35,[wall]),false);
});
test('tangent movement beside castle wall is not blocked',()=>{
 const p=sweep(actor(4.15),0,80,[box(4.9,5.1,-5,5)]);
 assert.ok(p.z>3.99 && !p.hitX);
});
test('invalid movement and nonfinite velocity must be rejected',()=>{
 assert.throws(()=>sweep(actor(),NaN,5,[]),/Invalid player sweep/);
});
