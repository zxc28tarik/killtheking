import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
const start=html.indexOf('function batchSiegeStaticVisuals(');
const end=html.indexOf('        const siegeStaticBatchStats=',start);
assert.ok(start>=0&&end>start);
const batch=runInNewContext(html.slice(start,end)+'\nbatchSiegeStaticVisuals;',ctx);
function fixture(){
 const scene=new T.Scene(),root=new T.Group();scene.add(root);
 const mat=new T.MeshStandardMaterial({color:0x717881,side:T.FrontSide});
 const original=[];
 for(const [x,z] of [[0,-10],[6,-10],[15,-10],[160,-10]]){
  const m=new T.Mesh(new T.BoxGeometry(2,4,2),mat);
  m.position.set(x,2,z);m.castShadow=true;m.receiveShadow=true;
  root.add(m);original.push(m);
 }
 const moving=new T.Group();scene.add(moving);
 const gate=new T.Mesh(new T.BoxGeometry(2,4,2),mat);moving.add(gate);
 const camera=new T.Raycaster(new T.Vector3(0,2,0),new T.Vector3(0,0,-1));
 return {scene,root,mat,original,moving,gate,camera};
}
test('OPT06 regional batching preserves original source geometry, raycast identity and shadow receiver',()=>{
 const {root,original,mat,gate,camera}=fixture();
 root.updateMatrixWorld(true);
 const before=camera.intersectObjects(original,false);
 assert.equal(before[0].object,original[0]);
 const geometries=original.map(o=>o.geometry);
 const positions=original.map(o=>o.position.clone());
 const stats=batch(T,[root],48);
 assert.equal(stats.sections,1);
 assert.equal(stats.eligible,4);
 assert.equal(stats.originals,3);
 assert.equal(stats.batches,1);
 assert.equal(stats.avoidedDraws,2);
 assert.equal(stats.shadowDrawsAvoided,2);
 assert.deepEqual(original.map(o=>o.geometry),geometries);
 for(let i=0;i<original.length;i++){
  assert.equal(original[i].visible,true);
  assert.deepEqual(original[i].position.toArray(),positions[i].toArray());
 }
 assert.equal(original[0].material.visible,false);
 assert.equal(original[0].castShadow,false);
 assert.equal(original[3].material,mat);
 assert.equal(original[3].castShadow,true);
 assert.equal(gate.material,mat);
 assert.equal(camera.intersectObjects(original,false)[0].object,original[0]);
 const draw=root.children.filter(o=>o.isMesh&&o.material.visible);
 assert.equal(draw.length,2);
 const merged=draw.find(o=>o.name==='OPT06 static siege regional visual');
 assert.ok(merged);
 assert.equal(merged.castShadow,true);
 assert.equal(merged.receiveShadow,true);
 assert.equal(merged.geometry.attributes.position.count,3*36);
 assert.equal(merged.geometry.attributes.normal.count,3*36);
 assert.equal(merged.geometry.attributes.uv.count,3*36);
 assert.equal(merged.geometry.boundingSphere!==null,true);
 assert.equal(merged.geometry.boundingBox!==null,true);
});
test('OPT06 textured UV, transform and normals match exact source triangle geometry',()=>{
 const root=new T.Group(),mat=new T.MeshStandardMaterial({color:0x81908b});
 const boxes=[];
 for(const x of [1,4]){
  const box=new T.Mesh(new T.BoxGeometry(2,1,3),mat);
  box.position.set(x,2,-8);box.rotation.y=.37;box.scale.set(.9,1.1,1.2);
  root.add(box);boxes.push(box);
 }
 const expected=[];
 for(const m of boxes){
  m.updateMatrix();
  const copy=m.geometry.toNonIndexed();copy.applyMatrix4(m.matrix);
  expected.push(copy);
 }
 batch(T,[root]);
 const merged=root.children.find(o=>o.name==='OPT06 static siege regional visual');
 assert.ok(merged);
 const all=(name)=>expected.flatMap(g=>Array.from(g.attributes[name].array));
 for(const attr of ['position','normal','uv']){
  const a=all(attr),b=Array.from(merged.geometry.attributes[attr].array);
  assert.equal(a.length,b.length);
  for(let i=0;i<a.length;i++)assert.ok(Math.abs(a[i]-b[i])<1e-6,attr+' '+i);
 }
});
test('OPT06 excludes transparent, dynamic, child-bearing and non-box meshes',()=>{
 const root=new T.Group(),m=new T.MeshStandardMaterial();
 const moving=new T.Group(),group=new T.Group();
 const transparency=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({transparent:true,opacity:.4}));
 const nonbox=new T.Mesh(new T.SphereGeometry(1),m);
 const child=new T.Mesh(new T.BoxGeometry(1,1,1),m);
 child.add(new T.Object3D());
 const hidden=new T.Mesh(new T.BoxGeometry(1,1,1),m);hidden.visible=false;
 root.add(transparency,nonbox,child,hidden);moving.add(new T.Mesh(new T.BoxGeometry(1,1,1),m));
 const stats=batch(T,[root]);
 assert.equal(stats.originals,0);
 assert.equal(stats.batches,0);
 for(const obj of [transparency,nonbox,child,hidden])assert.equal(obj.material.visible,true);
 assert.equal(moving.children[0].material,m);
});
test('OPT06 only the three fixed AK25/26/31 sections are batched; controls and both canonical files remain unchanged',()=>{
 const section=html.slice(end,html.indexOf('window.ktkSiegeStaticBatchStatus',end));
 assert.match(section,/nativeSiegeExpansionV25\.root,nativeSiegeDefenseV26\.root,nativeSiegeInteriorV31\.root/);
 assert.doesNotMatch(section,/nativeSiegeRam|nativeSiegeCatapult|nativeSiegeTower|nativeSiegeGateMesh/);
 assert.match(html,/window\.ktkSiegeStaticBatchStatus=\(\)=>/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
