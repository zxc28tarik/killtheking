import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {limitRampEntry,terrainTransition}=require('../src/player-collision.js');
const ramp={minX:-40.25,maxX:-32.75,minZ:-5,maxZ:11};
const groundAt=(x,z)=>x>=ramp.minX&&x<=ramp.maxX&&z>=ramp.minZ&&z<=ramp.maxZ
 ?Math.max(0,Math.min(7,(11-z)/16*7)):0;
const actor=(x,z,y=2.35)=>({x,z,y});
const move=(from,to)=>limitRampEntry({from,to,radius:.75,height:2.35,groundAt});

test('ground-level player cannot enter tall wooden ramp through side',()=>{
 const p=move(actor(-30.5,3),{x:-35.5,z:3});
 assert.ok(p.x>ramp.maxX+.65);assert.equal(p.hitX,true);
});
test('legitimate gradual ramp entry from lower end remains walkable',()=>{
 const p=move(actor(-36.5,12),{x:-36.5,z:7});
 assert.equal(p.hitX,false);assert.equal(p.hitZ,false);
 assert.ok(Math.abs(p.z-7)<.01);
});
test('high player can land over upper ramp edge without teleport prevention',()=>{
 const p=move(actor(-30.5,3,7.35),{x:-35.5,z:3});
 assert.equal(p.hitX,false);assert.equal(p.hitZ,false);
});
test('movement parallel to ramp edge stays free',()=>{
 const p=move(actor(-30.5,2),{x:-30.5,z:-2});
 assert.equal(p.hitX,false);assert.equal(p.hitZ,false);
});
test('ramp side impact preserves sliding along its boundary',()=>{
 const p=move(actor(-30.5,3),{x:-35.5,z:5});
 assert.ok(p.x>-32&&p.z>4.9);assert.equal(p.hitX,true);
});
test('flat terrain has no side-entry restriction',()=>{
 const p=terrainTransition({from:actor(0,0),to:{x:10,z:10},radius:.75,height:2.35,groundAt:()=>0});
 assert.equal(p.blocked,false);assert.equal(p.x,10);assert.equal(p.z,10);
});
