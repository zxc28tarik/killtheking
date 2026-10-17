import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three-r128.js');
const {limitRampEntry}=require('../src/player-collision.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
function getRamps(){
 const begin=game.indexOf('        function buildCastleArena() {');
 const end=game.indexOf('        buildCastleArena();',begin)+'        buildCastleArena();'.length;
 const ramps=[],mat=new THREE.MeshBasicMaterial();
 vm.runInNewContext(game.slice(begin,end),{THREE,scene:{add(){}},worldMeshes:[],groundTexBundle:{},
   stoneMat:mat,woodMat:mat,grassMat:mat,darkStoneMat:mat,roofMat:mat,crateMat:mat,ironMat:mat,
   addBox(){},ramps,console,createTorch(){},createExplosiveBarrel(){},
   createJumpPad(){},createSiegeCannon(){}});
 return ramps;
}
function heightAt(ramps){return(x,z)=>{
 for(const r of ramps){
  if(x<r.minX||x>r.maxX||z<r.minZ||z>r.maxZ)continue;
  let t=r.dir==='NN'?(r.maxZ-z)/(r.maxZ-r.minZ-1.5):
    r.dir==='N'?(r.maxZ-z)/(r.maxZ-r.minZ):
    r.dir==='S'?(z-r.minZ)/(r.maxZ-r.minZ):(r.maxX-x)/(r.maxX-r.minX);
  return r.startY+Math.max(0,Math.min(1,t))*(r.endY-r.startY);
 }
 return 0;
};}
test('all four real castle ramps reject impossible sideways entry',()=>{
 const ramps=getRamps(),groundAt=heightAt(ramps);
 assert.equal(ramps.length,4);
 for(const r of ramps){
  const centerX=(r.minX+r.maxX)/2,centerZ=(r.minZ+r.maxZ)/2;
  const entry=r.dir==='W'?{x:centerX,z:r.minZ-2}:
    {x:r.dir==='S'?r.minX-2:r.maxX+2,z:centerZ};
  const from={...entry,y:2.35},to={x:centerX,z:centerZ};
  const result=limitRampEntry({from,to,radius:.75,height:2.35,groundAt});
  if(r.dir==='W'){
   assert.ok(result.z<r.minZ-.5,'West ramp passed through side');
   assert.equal(result.hitZ,true);
  }else if(r.dir==='S'){
   assert.ok(result.x<r.minX-.5,'East ramp passed through side');
   assert.equal(result.hitX,true);
  }else{
   assert.ok(result.x>r.maxX+.5,'Ramp passed through side '+r.dir);
   assert.equal(result.hitX,true);
  }
 }
});
