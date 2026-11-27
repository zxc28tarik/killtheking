import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
const a=html.indexOf('function batchSiegeStaticVisuals(');
const b=html.indexOf('        const siegeStaticBatchStats=',a);
const c=html.indexOf('function batchSiegeCosmeticBoxes(');
const d=html.indexOf('        const siegeCosmeticBatchStats=',c);
assert.ok(a>=0&&b>a&&c>=0&&d>c);
const batch=runInNewContext(html.slice(a,b)+'\n'+html.slice(c,d)+'\nbatchSiegeCosmeticBoxes;',ctx);
const label='KTK_VIS20_COSMETIC_NO_COLLIDER';
function box(root,mat,x=0,name=label){
 const m=new T.Mesh(new T.BoxGeometry(1,2,.3),mat);
 m.position.set(x,2,0);m.name=name;m.castShadow=true;m.receiveShadow=true;root.add(m);return m;
}
test('OPT12 explicit cosmetics only; opaque gate, transparent rut, wheel, and other solid remain separate',()=>{
 const map=new T.Group(),gate=new T.Group(),arm=new T.Group();
 map.add(gate,arm);
 const mat=new T.MeshStandardMaterial({color:0x95724d});
 const trim=[box(map,mat,1),box(map,mat,3),box(map,mat,5)];
 const legacy=[box(gate,mat,1,''),box(gate,mat,3,'')];
 legacy.forEach(x=>{x.castShadow=false;x.receiveShadow=false;});
 const original=box(map,mat,8,'physical wall');
 const rut=box(map,new T.MeshBasicMaterial({transparent:true,depthWrite:false}),9);
 const wheel=new T.Mesh(new T.CylinderGeometry(.5,.5,.2,12),mat);wheel.name=label;map.add(wheel);
 const armPart=box(arm,mat,1,'original independent arm');
 const oldGeometry=trim.map(x=>x.geometry);
 const stats=batch(T,[map,gate,arm],new Set(legacy));
 assert.equal(stats.eligible,5);assert.equal(stats.originals,5);assert.equal(stats.batches,2);
 assert.equal(stats.avoidedDraws,3);assert.equal(stats.shadowDrawsAvoided,2);
 for(const [i,m] of trim.entries()){
  assert.equal(m.geometry,oldGeometry[i]);assert.equal(m.material.visible,false);assert.equal(m.visible,true);
 }
 for(const m of [original,wheel,armPart])assert.equal(m.material,mat);
 assert.equal(rut.material.transparent,true);
 for(const root of [map,gate]){
  const merged=root.children.find(m=>m.name==='OPT12 siege cosmetic regional visual');
  assert.ok(merged);assert.equal(merged.material,mat);
  const hits=[];merged.raycast(new T.Raycaster(),hits);assert.equal(hits.length,0);
 }
});
test('OPT12 parent motion and gate hide preserve original positions, normals, UVs and shadow flags',()=>{
 const world=new T.Group(),gate=new T.Group();world.add(gate);
 const mat=new T.MeshStandardMaterial({color:0x85878a});
 const originals=[box(gate,mat,1),box(gate,mat,3)];
 originals[0].rotation.y=.12;originals[1].rotation.z=.25;
 const source=originals.map(m=>{
  m.updateMatrix();
  const geo=m.geometry.toNonIndexed();geo.applyMatrix4(m.matrix);
  return geo;
 });
 batch(T,[gate],new Set());
 const merged=gate.children.find(m=>m.name==='OPT12 siege cosmetic regional visual');
 assert.ok(merged);assert.equal(merged.castShadow,true);assert.equal(merged.receiveShadow,true);
 for(const [i,geo] of source.entries())for(const key of ['position','normal','uv']){
  const got=merged.geometry.attributes[key],want=geo.attributes[key];
  for(let j=0;j<want.array.length;j++)
   assert.ok(Math.abs(got.array[i*want.array.length+j]-want.array[j])<1e-6,key);
 }
 gate.position.set(10,4,-25);gate.rotation.y=.7;world.updateMatrixWorld(true);
 const p=merged.geometry.attributes.position;
 for(const [i,m] of originals.entries()){
  const idx=i*36;
  const v=new T.Vector3(p.getX(idx),p.getY(idx),p.getZ(idx)).applyMatrix4(merged.matrixWorld);
  const a=m.geometry.attributes.position;
  const w=new T.Vector3(a.getX(0),a.getY(0),a.getZ(0)).applyMatrix4(m.matrixWorld);
  assert.ok(v.distanceTo(w)<1e-5);
 }
 gate.visible=false;const visible=[];world.traverseVisible(o=>visible.push(o));
 assert.ok(!visible.includes(merged));gate.visible=true;visible.length=0;world.traverseVisible(o=>visible.push(o));
 assert.ok(visible.includes(merged));
});
test('OPT12 both canonical HTMLs exact, explicit V19 and V20 scope',()=>{
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
 assert.match(html,/siegeV19GateDecor=new Set\(nativeSiegeGateMesh.children\)/);
 assert.match(html,/window\.ktkSiegeCosmeticBatchStatus/);
 assert.match(html,/child\.raycast=\(\)=>\{\}/);
});
