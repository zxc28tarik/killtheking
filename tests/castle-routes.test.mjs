import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three-r128.js');
const {createNavigator}=require('../src/arena-navigation.js');

test('real castle collider positions yield twenty connected courtyard routes',()=>{
 const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 const begin=game.indexOf('        function buildCastleArena() {');
 const end=game.indexOf('        function createRamp(',begin);
 assert.ok(begin>=0 && end>begin);
 const colliders=[],ramps=[];
 function addBox(x,y,z,w,h,d,mat,isSolid=true){
  if(isSolid)colliders.push({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2});
 }
 function createRamp(cx,startY,endY,w,d,dir){
  const b={minX:cx-w/2,maxX:cx+w/2,startY,endY,dir};
  if(dir==='N'){b.minZ=4-d/2;b.maxZ=4+d/2;}
  else if(dir==='S'){b.minZ=-4-d/2;b.maxZ=-4+d/2;}
  else {b.minZ=36.5-d/2;b.maxZ=36.5+d/2;}
  ramps.push(b);
 }
 const fake={THREE,scene:{add(){}},worldMeshes:[],groundTexBundle:{},stoneMat:{},woodMat:{},grassMat:{},darkStoneMat:{},roofMat:{},crateMat:{},ironMat:{},addBox,createRamp,console,
  createTorch(){},createExplosiveBarrel(){},createJumpPad(){},createSiegeCannon(){}};
 vm.runInNewContext(game.slice(begin,end)+'\nbuildCastleArena();',fake);
 assert.ok(colliders.length>=75);
 assert.equal(ramps.length,3);
 const nav=createNavigator(colliders,ramps,{min:-42.5,max:42.5,upperEdge:39});
 const spawn=[[-24,2,-20],[24,2,-20],[-25,2,20],[25,2,20],[0,2,-16]].map(a=>({x:a[0],y:a[1],z:a[2]}));
 let connected=0;
 for(let i=0;i<spawn.length;i++)for(let j=0;j<spawn.length;j++){
  if(i===j)continue;
  const route=nav.findPath(spawn[i],spawn[j]);
  assert.ok(route.length>0);
  connected++;
 }
 assert.equal(connected,20);
});
