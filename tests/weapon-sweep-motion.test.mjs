import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const W=require('../src/weapon-sweep.js');

test('world-space bridge detects fast slide-hop sword movement',()=>{
 const swing=W.begin('sword',5.5);
 let moved=0,bridges=0;
 const cast=(a,b,world)=>{
   if(world) {
     bridges++;
     if(a.x<6 && b.x>6) return {kind:'bot',bot:{id:21},distance:4};
   }
   return null;
 };
 W.advance(swing,.04,cast,tip=>({...tip,x:tip.x+moved}));
 moved=12;
 const hit=W.advance(swing,.023,cast,tip=>({...tip,x:tip.x+moved}));
 assert.equal(hit?.bot.id,21);
 assert.equal(swing.resolved,true);
 assert.ok(bridges>0);
});
test('a nearer solid wall in motion bridge blocks later target in the same step',()=>{
 const swing=W.begin('sword',5.5);
 let frame=0, worldQueries=0, localQueries=0;
 const cast=(a,b,world)=>{
   if(world){worldQueries++;return {kind:'world',distance:.1};}
   localQueries++;return frame===0?null:{kind:'bot',bot:{id:99}};
 };
 W.advance(swing,.04,cast,tip=>tip);
 frame=1;
 const hit=W.advance(swing,.04,cast,tip=>tip);
 assert.equal(hit,null);
 assert.equal(swing.resolved,false);
 assert.ok(worldQueries>0);
 assert.ok(localQueries>0);
});
test('world tip snapshot is immutable with a pooled projection object',()=>{
 const swing=W.begin('spear',8);
 const shared={x:0,y:0,z:0};
 W.advance(swing,.05,()=>null,()=>shared);
 const prior=swing.previousWorldTip;
 shared.x=99;
 assert.equal(prior.x,0);
});
test('near actor candidates are retained, far actors can be culled safely',()=>{
 const origin={x:0,y:2,z:0};
 assert.equal(W.withinReach(origin,{x:5,y:1,z:2},5,2),true);
 assert.equal(W.withinReach(origin,{x:40,y:1,z:0},5,2),false);
 assert.equal(W.withinReach(origin,{x:0,y:100,z:0},5,2),false);
});
test('older swing callback without a projection argument still works',()=>{
 const swing=W.begin('spear',6);
 assert.equal(W.advance(swing,.045,()=>({kind:'bot',bot:{id:1}}))?.kind,'bot');
});
test('game reuses collision target array and records real raycast count',()=>{
 const src=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 assert.match(src,/swing\.contactTargets = \[\]/);
 assert.match(src,/ArenaWeaponSweep\.withinReach\(origin, bot\.mesh\.position/);
 assert.match(src,/lastWeaponSwingRaycasts/);
 assert.match(src,/worldSpace\)/);
});
