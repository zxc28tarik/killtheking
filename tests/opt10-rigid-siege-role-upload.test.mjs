import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
const start=html.indexOf('function batchSiegeStaticVisuals(');
const end=html.indexOf('        const siegeStaticBatchStats=',start);
assert.ok(start>=0&&end>start);
const batch=runInNewContext(html.slice(start,end)+'\nbatchSiegeStaticVisuals;',ctx);
test('OPT10 mobile rigid sections follow moving parent, keep original physics and leave arm unbatched',()=>{
 const outer=new T.Group(),parent=new T.Group(),mat=new T.MeshStandardMaterial({color:0x785438});
 outer.add(parent);
 const rigid=[0,1.5,3,4.5].map(x=>{
  const m=new T.Mesh(new T.BoxGeometry(1,1,1),mat);
  m.position.set(x,2,0);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 });
 const arm=new T.Mesh(new T.BoxGeometry(1,1,1),mat);arm.position.set(0,4,0);parent.add(arm);
 const geometries=rigid.map(x=>x.geometry);
 const stats=batch(T,[{root:parent,allow:new Set(rigid)}],12);
 assert.equal(stats.eligible,4);assert.equal(stats.originals,4);
 assert.equal(stats.batches,1);assert.equal(stats.avoidedDraws,3);
 assert.equal(stats.shadowDrawsAvoided,3);
 assert.equal(arm.material,mat);assert.equal(arm.castShadow,false);
 for(let i=0;i<rigid.length;i++){
  assert.equal(rigid[i].geometry,geometries[i]);
  assert.equal(rigid[i].material.visible,false);assert.equal(rigid[i].visible,true);
 }
 const merged=parent.children.find(m=>m.name==='OPT06 static siege regional visual');
 assert.ok(merged);assert.equal(merged.material,mat);
 assert.equal(merged.castShadow,true);assert.equal(merged.receiveShadow,true);
 assert.equal(merged.geometry.attributes.position.count,144);
 outer.position.set(17,2,-30);outer.rotation.z=-.17;outer.scale.y=.71;
 outer.updateMatrixWorld(true);
 const attr=merged.geometry.attributes.position;
 for(let i=0;i<rigid.length;i++){
  const index=36*i;
  const v=new T.Vector3(attr.getX(index),attr.getY(index),attr.getZ(index)).applyMatrix4(merged.matrixWorld);
  const w=new T.Vector3(geometries[i].attributes.position.getX(0),
   geometries[i].attributes.position.getY(0),geometries[i].attributes.position.getZ(0))
   .applyMatrix4(rigid[i].matrixWorld);
  assert.ok(v.distanceTo(w)<1e-5);
 }
 arm.rotation.x=.8;parent.updateMatrixWorld(true);assert.equal(arm.rotation.x,.8);
});
test('OPT10 original soldier batches skip GPU upload after whole role is dead and restore on revival',()=>{
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
 const vm={console};runInNewContext(scripts[27],vm);
 const API=vm.ArenaArmyRender;
 let moves=0;
 const soldiers=['musket','pike','bow','sword'].map((type,id)=>({
  type,id,x:id*4,z:-id*5,facing:.1,alive:true,reload:0,
  attackPose:0,hitPose:0,guardUntil:0,microState:''
 }));
 const battle={elapsed:0,accumulator:0,projectiles:[],squads:[],soldiers};
 function originalBot(){
  const model=new T.Group();model._parts={};
  for(const name of API.PART_NAMES){
   const part=new T.Group();
   part.add(new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial()));
   model.add(part);model._parts[name]=part;
  }return model;
 }
 const characterMotion={createState:()=>({phase:0,weight:0}),update:()=>{
  moves++;return {leftLeg:0,rightLeg:0,leftArm:0,rightArm:0,headX:0,torsoX:0,torsoZ:0};
 }};
 const visual=API.create(T,new T.Scene(),battle,originalBot,characterMotion);
 const meshes=Object.values(visual.roles.musket.parts).flatMap(p=>p.meshes);
 visual.update(battle,.016);
 assert.equal(visual.performance().uploadedBatches,visual.drawBatches-1);
 soldiers[0].alive=false;visual.update(battle,.016);
 assert.equal(visual.performance().skippedBatchUploads,0);
 const before=meshes.map(m=>m.instanceMatrix.version),previous=moves;
 visual.update(battle,.016);
 assert.equal(visual.performance().skippedBatchUploads,meshes.length);
 assert.equal(visual.performance().uploadedBatches,visual.drawBatches-1-meshes.length);
 assert.equal(moves-previous,4);
 assert.deepEqual(meshes.map(m=>m.instanceMatrix.version),before);
 for(const mesh of meshes){const m=new T.Matrix4();mesh.getMatrixAt(0,m);assert.equal(m.elements[0],0);}
 soldiers[0].alive=true;soldiers[0].x=77;visual.update(battle,.016);
 assert.equal(visual.performance().skippedBatchUploads,0);
 for(const mesh of meshes){const m=new T.Matrix4();mesh.getMatrixAt(0,m);assert.ok(Math.abs(m.elements[12]-77)<1e-6);}
 visual.dispose();
});
test('OPT10 SHA approval, pinned engine and canonical HTML remain valid',()=>{
 assert.match(html,/const nativeSiegeRigidParts=\[/);
 assert.match(html,/m!==nativeSiegeArm/);
 assert.match(html,/window\.ktkSiegeRigidBatchStatus=\(\)=>/);
 assert.match(html,/skippedBatchUploads=skippedBatchUploads/);
 const file=readFileSync(new URL('../tools/sync_canonical_entrypoint.mjs',import.meta.url),'utf8');
 const blob=s=>createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
 assert.equal(blob(scripts[27]),file.match(/const approvedArmyRenderBlob='([0-9a-f]{40})'/)?.[1]);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
