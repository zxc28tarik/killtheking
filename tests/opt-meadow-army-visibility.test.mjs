import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console};runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
const a=html.indexOf('function createMeadowArmyVisibility('),b=html.indexOf('        let meadowArmyVisibility=',a);
assert.ok(a>=0&&b>a);
const create=runInNewContext(html.slice(a,b)+'\ncreateMeadowArmyVisibility;',ctx);
function fixture(){
 const group=new T.Group(),geo=new T.BoxGeometry(2,2,2),mesh=new T.InstancedMesh(geo,new T.MeshBasicMaterial(),5);
 group.add(mesh);
 const soldiers=[{alive:true,x:0,z:-15},{alive:true,x:100,z:-15},{alive:false,x:0,z:-12},{alive:true,x:0,z:-30},{alive:true,x:0,z:20}];
 for(let i=0;i<soldiers.length;i++)mesh.setMatrixAt(i,new T.Matrix4().makeTranslation(soldiers[i].x,1,soldiers[i].z));
 const original=Array.from(mesh.instanceMatrix.array);
 const roles={sword:{slots:new Map(soldiers.map((s,i)=>[i,i])),parts:{body:{position:new T.Vector3(0,1,0),scale:new T.Vector3(1,1,1),meshes:[mesh]}}}};
 const camera=new T.PerspectiveCamera(60,1,.1,200);
 camera.position.set(0,1,0);camera.lookAt(0,1,-1);
 return {mesh,soldiers,original,camera,group,compactor:create(T,{group,roles})};
}
test('OPT04 culls dead and offscreen soldiers without changing visible transforms or roster',()=>{
 const {mesh,soldiers,original,camera,compactor}=fixture();
 const stats=compactor.prepare({soldiers},camera);
 assert.equal(stats.alive,4);assert.equal(stats.visible,2);assert.equal(stats.culledAlive,2);assert.equal(stats.dead,1);
 assert.equal(stats.fullTriangles,60);assert.equal(stats.submittedTriangles,24);
 assert.equal(mesh.count,2);assert.equal(mesh.visible,true);
 const m=new T.Matrix4();mesh.getMatrixAt(0,m);assert.equal(m.elements[14],-15);mesh.getMatrixAt(1,m);assert.equal(m.elements[14],-30);
 compactor.restore();assert.equal(mesh.count,5);assert.equal(mesh.visible,true);assert.deepEqual(Array.from(mesh.instanceMatrix.array),original);assert.equal(soldiers.length,5);
});
test('OPT04 turning the camera reveals previously culled soldiers, repeated prepare restores stable slots',()=>{
 const {mesh,soldiers,original,camera,compactor}=fixture();
 compactor.prepare({soldiers},camera);camera.lookAt(0,1,1);
 const stats=compactor.prepare({soldiers},camera);assert.equal(stats.visible,1);
 const m=new T.Matrix4();mesh.getMatrixAt(0,m);assert.equal(m.elements[14],20);
 compactor.restore();assert.deepEqual(Array.from(mesh.instanceMatrix.array),original);
 camera.lookAt(-1,1,0);assert.equal(compactor.prepare({soldiers},camera).visible,0);assert.equal(mesh.visible,false);assert.equal(mesh.count,0);
 compactor.restore();assert.equal(mesh.visible,true);assert.equal(mesh.count,5);
});
test('OPT04 conservative radius keeps a weapon crossing the frustum boundary',()=>{
 const group=new T.Group(),geo=new T.BoxGeometry(16,1,1),mesh=new T.InstancedMesh(geo,new T.MeshBasicMaterial(),1);group.add(mesh);
 const roles={pike:{slots:new Map([[0,0]]),parts:{weapon:{position:new T.Vector3(),scale:new T.Vector3(1,1,1),meshes:[mesh]}}}};
 const c=create(T,{group,roles}),camera=new T.PerspectiveCamera(60,1,.1,200);camera.lookAt(0,0,-1);
 assert.equal(c.prepare({soldiers:[{alive:true,x:10,z:-10}]},camera).visible,1);c.restore();
});
test('OPT04 rendering wraps the original draw and always restores matrices, siege excluded',()=>{
 assert.match(html,/if\(!meadowBattleMode\|\|nativeSiegeMode\|\|!meadowBattleVisual/);
 assert.match(html,/meadowArmyVisibility\.prepare\(meadowBattleState,camera\);\s*renderer.render\(scene,camera\);\s*\}finally\{meadowArmyVisibility\.restore\(\);\}/);
 assert.match(html,/updateActiveMeadowGrass\(\);\s*renderActiveMap\(\);/);
});

test('OPT05 render wrapper preserves mode routing and restores state on render exceptions',()=>{
 const start=html.indexOf('        let meadowArmyVisibility='),end=html.indexOf('        window.ktkMeadowArmyVisibilityStatus=',start);
 assert.ok(start>=0&&end>start);
 const events=[],visual={group:{visible:true}},battle={},camera={},scene={};
 const sandbox={THREE:T,meadowBattleMode:false,nativeSiegeMode:false,meadowBattleVisual:visual,meadowBattleState:battle,camera,scene,
  createMeadowArmyVisibility:(three,v)=>{
   assert.equal(v,visual);events.push('create');
   return {prepare:(state,cam)=>{assert.equal(state,battle);assert.equal(cam,camera);events.push('prepare');},restore:()=>events.push('restore')};
  },
  renderer:{render:(s,cam)=>{assert.equal(s,scene);assert.equal(cam,camera);events.push('render');}}
 };
 const render=runInNewContext(html.slice(start,end)+'\nrenderActiveMap;',sandbox);
 render();assert.deepEqual(events.splice(0),['render']);
 sandbox.meadowBattleMode=true;sandbox.nativeSiegeMode=true;
 render();assert.deepEqual(events.splice(0),['render']);
 sandbox.nativeSiegeMode=false;visual.group.visible=false;
 render();assert.deepEqual(events.splice(0),['render']);
 visual.group.visible=true;sandbox.meadowBattleState=null;
 render();assert.deepEqual(events.splice(0),['render']);
 sandbox.meadowBattleState=battle;
 render();assert.deepEqual(events.splice(0),['create','prepare','render','restore']);
 sandbox.renderer.render=()=>{events.push('render');throw Error('test render failure');};
 assert.throws(render,/test render failure/);
 assert.deepEqual(events.splice(0),['prepare','render','restore']);
});
test('OPT05 actual army batch shadow policy remains non-casting',()=>{
 const start=html.indexOf(' function getPartBatches(THREE,group,part,count,container)'),end=html.indexOf(' function create(THREE,scene,state,createOriginalBotMesh',start);
 assert.ok(start>=0&&end>start);
 assert.match(html.slice(start,end),/mesh\.castShadow=false;mesh\.receiveShadow=false;/);
});

test('OPT10 ME compaction does not dirty any hidden role matrices, but revives without stale GPU state',()=>{
 const {mesh,soldiers,camera,compactor,original}=fixture();
 for(const s of soldiers)s.alive=false;
 const initialVersion=mesh.instanceMatrix.version;
 const hidden=compactor.prepare({soldiers},camera);
 assert.equal(hidden.visible,0);
 assert.equal(hidden.emptyRoleMeshes,1);
 assert.equal(mesh.count,0);assert.equal(mesh.visible,false);
 assert.equal(mesh.instanceMatrix.version,initialVersion);
 compactor.restore();
 assert.equal(mesh.count,5);assert.equal(mesh.visible,true);
 assert.equal(mesh.instanceMatrix.version,initialVersion);
 assert.deepEqual(Array.from(mesh.instanceMatrix.array),original);
 soldiers[0].alive=true;
 const alive=compactor.prepare({soldiers},camera);
 assert.equal(alive.visible,1);
 assert.equal(alive.emptyRoleMeshes,0);
 assert.ok(mesh.instanceMatrix.version>initialVersion);
 const m=new T.Matrix4();mesh.getMatrixAt(0,m);assert.equal(m.elements[14],-15);
 compactor.restore();
 assert.deepEqual(Array.from(mesh.instanceMatrix.array),original);
});
