import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const terrain=require('./meadow-terrain-heightfield.js');
const H=240;
test('terrain peaks, meadow ridge and shallow valley are placed',()=>{
 for(const p of terrain.PEAKS){
   const h=terrain.heightAt(p.x*H,p.z*H,H);
   assert.ok(Math.abs(h-p.height)<.00001,p.name+' peak height '+h);
 }
});
test('map border stays perfectly flat, maintaining historic spawn edges',()=>{
 for(const z of [-H,-H/2,0,H/2,H]){
   assert.equal(terrain.heightAt(-H,z,H),0);
   assert.equal(terrain.heightAt(H,z,H),0);
 }
});
test('every grid value is finite and built at the original full field extent',()=>{
 const out=terrain.sampleGrid(H,48);
 assert.equal(out.positions.length,49*49*3);
 for(const v of out.positions)assert.ok(Number.isFinite(v));
});
test('slope normals are normalized and point upward',()=>{
 for(const [x,z] of [[0,0],[-120,-140],[110,140],[-80,120]]){
   const n=terrain.normalAt(x,z,H);
   assert.ok(Math.abs(Math.hypot(n.x,n.y,n.z)-1)<1e-8);
   assert.ok(n.y>0);
 }
});
test('height returns smoothly without sharp field-edge cliffs',()=>{
 for(let x=-H;x<=H;x+=8)for(let z=-H;z<=H;z+=8){
   const h=terrain.heightAt(x,z,H);
   for(const [dx,dz] of [[2,0],[0,2]]){
     assert.ok(Math.abs(h-terrain.heightAt(x+dx,z+dz,H))<3,
       'abrupt height jump at '+x+','+z);
   }
 }
});
test('invalid sizes/coordinates cannot contaminate soldier movement',()=>{
 assert.throws(()=>terrain.heightAt(NaN,0,H));
 assert.throws(()=>terrain.heightAt(0,0,0));
 assert.throws(()=>terrain.sampleGrid(H,7));
});
