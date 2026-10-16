import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const THREE = require('../vendor/three-r128.js');
const { createNavigator } = require('../src/arena-navigation.js');

function loadCastle() {
 const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 const begin=game.indexOf('        function buildCastleArena() {');
 const end=game.indexOf('        buildCastleArena();',begin)+'        buildCastleArena();'.length;
 assert.ok(begin>=0 && end>begin);
 const colliders=[],ramps=[];
 const material=new THREE.MeshBasicMaterial({color:0x888888});
 const addBox=(x,y,z,w,h,d,mat,isSolid=true)=>{
  if(isSolid) colliders.push({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2});
 };
 const env={THREE,scene:{add(){}},worldMeshes:[],groundTexBundle:{},stoneMat:material,woodMat:material,grassMat:material,darkStoneMat:material,roofMat:material,crateMat:material,ironMat:material,addBox,ramps,console,
  createTorch(){},createExplosiveBarrel(){},createJumpPad(){},createSiegeCannon(){}};
 vm.runInNewContext(game.slice(begin,end),env);
 return {colliders,ramps};
}
const courtyard=[[-24,2,-20],[24,2,-20],[-25,2,20],[25,2,20],[0,2,-16]];
const rampart=[[-39,9,-10],[39,9,10],[0,9,40],[-18,9,-40],[18,9,-40]];
const asPoint=([x,y,z])=>({x,y,z});

test('castle has four seven-height ramps and right guard wall outside the walkway',()=>{
 const {colliders,ramps}=loadCastle();
 assert.equal(ramps.length,4);
 assert.ok(colliders.length>=80);
 assert.ok(ramps.some(r=>r.dir==='NN'&&r.endY===7));
 assert.ok(ramps.some(r=>r.dir==='W'&&r.endY===7));
 assert.ok(colliders.some(c=>c.minX>43&&c.maxX>44));
});
test('all 90 castle spawn-to-spawn pairs route with verified wall clearance',()=>{
 const {colliders,ramps}=loadCastle();
 const nav=createNavigator(colliders,ramps,{min:-43.75,max:43.75,step:1.25,upperEdge:39.5,upperLevel:7});
 let tested=0;
 for(const starts of [courtyard,rampart])for(const goals of [courtyard,rampart]){
  for(let i=0;i<starts.length;i++)for(let j=0;j<goals.length;j++){
   if(starts===goals&&i===j)continue;
   const start=nav.nearest(asPoint(starts[i])),goal=nav.nearest(asPoint(goals[j]));
   assert.equal(nav.isReachable(start,goal),true,'Connected castle route must be reachable');
   const route=nav.findPath(start,goal);
   assert.ok(route.length>0,`Unreachable ${JSON.stringify(starts[i])} -> ${JSON.stringify(goals[j])}`);
   let previous=start;
   for(const point of route){
    assert.ok(nav.walkableAt(point.x,point.z,point.y),'Waypoint inside collider');
    assert.equal(nav.clearSegment(previous,point),true,'Route crosses solid geometry');
    previous=point;
   }
   tested++;
  }
 }
 assert.equal(tested,90);
});
test('ramp elevation matches physical castle walls',()=>{
 const {colliders,ramps}=loadCastle();
 const nav=createNavigator(colliders,ramps,{min:-43.75,max:43.75,step:1.25,upperEdge:39.5,upperLevel:7});
 assert.ok(Math.abs(nav.heightAt(7,38)-7)<.01);
 assert.equal(nav.heightAt(0,40),7);
 assert.ok(nav.heightAt(-23,-39)>6.9);
});
