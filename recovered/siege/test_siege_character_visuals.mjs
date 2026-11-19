/* S3V1 visual integration: authentic G5.4 state pointers -> draw-only role parts. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const THREE=require('../../vendor/three-r128.js');
const source=readFileSync(new URL('./siege-character-visuals.js',import.meta.url),'utf8');
const code=new vm.Script(source,{filename:'siege-character-visuals.js'});
const globalThis={THREE};
vm.runInNewContext(source,{globalThis,THREE});
const create=globalThis.KTKSiegeCharacterVisuals.create;
function fixture(){
 const scene=new THREE.Scene(),groups=[],unitTypes=['sword','spear','bow','musket'];
 for(const team of ['red','blue']){
   for(const role of unitTypes){
     const n={sword:20,spear:25,bow:15,musket:10}[role];
     const inst=new THREE.InstancedMesh(new THREE.CylinderGeometry(.55,.67,2.4,6),
       new THREE.MeshBasicMaterial({color:0xff0000}),n);
     inst.userData={team,role:role==='bow'?'archer':role,count:n};
     groups.push({inst,team,role,count:n,units:Array.from({length:n},(_,i)=>({
       id:team+'-'+role+'-'+i,x:i*1.5,z:team==='red'?-60:60,
       facing:0,siegeY:0,alive:true
     }))});
   }
 }
 return {scene,groups};
}
test('S3V1 only has eight authentic G5.4 groups, 140 role slots, and hides cylinder tokens',()=>{
 const {scene,groups}=fixture();
 const visuals=create({THREE,scene,groups});
 visuals.render();
 const status=visuals.status();
 assert.equal(status.renderedActorSlots,140);
 assert.equal(status.roleModels,4);
 assert.equal(status.aliveVisualActors,140);
 assert(status.instancedPartDrawCalls>=100);
 assert.equal(status.nativePhysicsOrDamageChanged,false);
 assert.equal(status.exactOriginalFFAMeshReuse,false);
 assert(groups.every(g=>g.inst.visible===false));
 assert(scene.children.some(c=>c.name==='S3D1_GenuineSoldierRoleVisuals'));
 const meshParts=scene.children.find(c=>c.name==='S3D1_GenuineSoldierRoleVisuals').children;
 assert(meshParts.some(m=>m.name.includes('sword-blade')));
 assert(meshParts.some(m=>m.name.includes('pike-shaft')));
 assert(meshParts.some(m=>m.name.includes('bow-string')));
 assert(meshParts.some(m=>m.name.includes('musket-barrel')||m.name.includes('musket-muzzle')||m.name.includes('musket-stock')));
 assert(meshParts.every(m=>m.isInstancedMesh&&m.userData.nativeSoldierVisual));
});
test('real soldier positions/animations follow native pose, deaths hide graphics without changing HP',()=>{
 const {scene,groups}=fixture();
 const visuals=create({THREE,scene,groups});
 const soldier=groups[0].units[0];
 soldier.hp=77;
 visuals.render();
 const first=scene.getObjectByName('g54-red-sword-tunic');
 const before=new THREE.Matrix4();
 first.getMatrixAt(0,before);
 soldier.x+=4;soldier.z+=2;soldier.facing=1.2;
 visuals.render();
 const after=new THREE.Matrix4();
 first.getMatrixAt(0,after);
 assert.notDeepEqual(before.elements,after.elements);
 assert.equal(soldier.hp,77);
 soldier.alive=false;
 visuals.render();
 assert.equal(visuals.status().aliveVisualActors,139);
 assert.equal(soldier.hp,77);
 visuals.reset();
 assert.equal(groups.reduce((n,g)=>n+g.units.length,0),140);
});
test('unverified role groups and nonfinite native actor poses fail closed',()=>{
 const {scene,groups}=fixture();
 assert.throws(()=>create({THREE,scene,groups:groups.slice(1)}),/eight native/);
 const visuals=create({THREE,scene,groups});
 groups[0].units[0].x=NaN;
 assert.throws(()=>visuals.render(),/Nonfinite genuine/);
});
