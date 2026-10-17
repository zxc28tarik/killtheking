import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three-r128.js');
const {move,overlaps}=require('../src/player-collision.js');
const {createNavigator}=require('../src/arena-navigation.js');
const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');

function buildRealCastleWithCannons() {
 const cannon=source.match(/function createSiegeCannon\(x, y, z, rotY = 0\) \{[\s\S]*?\n        \}/)?.[0];
 const begin=source.indexOf('        function buildCastleArena() {');
 const end=source.indexOf('        buildCastleArena();',begin)+'        buildCastleArena();'.length;
 assert.ok(cannon && begin>=0 && end>begin,'Castle/cannon game source missing');
 const colliders=[],ramps=[],worldMeshes=[],guns=[];
 const mat=new THREE.MeshBasicMaterial({color:0x888888});
 const scene={add(obj){if(obj.isGroup && obj.children.length===6)guns.push(obj);}};
 const addBox=(x,y,z,w,h,d,unused,solid=true)=>{
  if(solid)colliders.push({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2});
 };
 const env={THREE,scene,worldMeshes,colliders,ramps,
  stoneMat:mat,darkStoneMat:mat,woodMat:mat,ironMat:mat,roofMat:mat,
  grassMat:mat,crateMat:mat,groundTexBundle:{},addBox,console,
  createTorch(){},createExplosiveBarrel(){},createJumpPad(){}};
 vm.runInNewContext(cannon+'\n'+source.slice(begin,end),env);
 return {colliders,ramps,worldMeshes,guns};
}
test('three rendered siege cannons have corresponding static solid colliders',()=>{
 const {colliders,guns}=buildRealCastleWithCannons();
 assert.equal(guns.length,3);
 for(const gun of guns){
  const center=gun.position;
  const c=colliders.find(c=>c.minX<center.x&&c.maxX>center.x&&
     c.minZ<center.z&&c.maxZ>center.z&&Math.abs(c.minY-center.y-.04)<.001);
  assert.ok(c,'missing cannon collider at '+center.x+','+center.z);
  const bb=new THREE.Box3().setFromObject(gun);
  assert.ok(c.minX<=bb.min.x+.1 && c.maxX>=bb.max.x-.1);
  assert.ok(c.minZ<=bb.min.z+.1 && c.maxZ>=bb.max.z-.1);
  assert.ok(c.maxY>=bb.max.y-.1);
 }
});
test('solid cannon meshes block weapon raycasts through visible carriages',()=>{
 const {guns,worldMeshes}=buildRealCastleWithCannons();
 assert.equal(worldMeshes.length,18,'Each gun has four wheels, a carriage and barrel');
 const gun=guns[0],x=gun.position.x,y=gun.position.y,z=gun.position.z;
 gun.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(x,y+.4,z+4),
     new THREE.Vector3(0,0,-1),0,8);
 assert.ok(ray.intersectObjects(worldMeshes,false).length>0,'Cannon was not world ray occluder');
});
test('a player running on battlements cannot cross the cannon carriage',()=>{
 const {colliders}=buildRealCastleWithCannons();
 const start={x:-19,z:-40,y:9.35};
 assert.equal(overlaps(start,.75,2.35,colliders),false);
 const p=move({from:start,velocity:{x:170,z:0},dt:.05,
    radius:.75,height:2.35,colliders});
 assert.ok(p.x < -16,'Crossed cannon from x -19');
 assert.equal(p.hitX,true);
 assert.equal(overlaps({...start,x:p.x,z:p.z},.75,2.35,colliders),false);
});
test('nav detects three no-go cannon footprints on rampart and keep',()=>{
 const {colliders,ramps}=buildRealCastleWithCannons();
 const nav=createNavigator(colliders,ramps,{min:-43.75,max:43.75,step:1.25,
     upperEdge:39.5,upperLevel:7});
 assert.equal(nav.walkableAt(-15,-40,7),false);
 assert.equal(nav.walkableAt(15,-40,7),false);
 assert.equal(nav.walkableAt(0,-25,12),false);
});
test('cannon collision leaves courtyard and standard wall routes walkable',()=>{
 const {colliders,ramps}=buildRealCastleWithCannons();
 const nav=createNavigator(colliders,ramps,{min:-43.75,max:43.75,step:1.25,
    upperEdge:39.5,upperLevel:7});
 for(const p of [{x:0,z:0,y:0},{x:30,z:30,y:0},{x:0,z:40,y:7}]){
  assert.equal(nav.walkableAt(p.x,p.z,p.y),true,'Blocked known safe space '+JSON.stringify(p));
 }
 const from=nav.nearest({x:-24,z:-20,y:0}),to=nav.nearest({x:24,z:20,y:0});
 assert.ok(nav.findPath(from,to).length>0);
});
test('visual banners and trees remain decorative, not new wall obstacles',()=>{
 const {colliders}=buildRealCastleWithCannons();
 // Do not block low ground behind the decorative banners beside the north wall.
 const lowGround={x:-20,z:-38.7,y:2.35};
 const bannerOnly=colliders.filter(c=>Math.abs(c.maxZ+39.1)<.15 &&
    c.maxY>7 && c.minY>2);
 assert.equal(bannerOnly.length,0);
 assert.ok(!overlaps({x:28,z:26,y:2.35},.75,2.35,colliders),
   'Open courtyard beside tree foliage should remain navigable');
});
