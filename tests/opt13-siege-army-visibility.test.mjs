import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
const a=html.indexOf('function createMeadowArmyVisibility(');
const b=html.indexOf('        let siegeArmyVisibility=',a);
assert.ok(a>=0&&b>a);
const create=runInNewContext(html.slice(a,b)+'\ncreateSiegeArmyVisibility;',ctx);
function fixture(){
 const group=new T.Group(),mat=new T.MeshBasicMaterial();
 const body=new T.InstancedMesh(new T.BoxGeometry(1,2,1),mat,5);
 const weapon=new T.InstancedMesh(new T.BoxGeometry(8,.2,.2),mat,5);
 group.add(body,weapon);
 const soldiers=[{alive:true,x:0,z:-15},{alive:true,x:0,z:-15},
  {alive:true,x:100,z:-15},{alive:false,x:0,z:-15},{alive:true,x:16,z:-15}];
 const y=[0,55,55,55,55];
 for(let i=0;i<5;i++){
  body.setMatrixAt(i,new T.Matrix4().makeTranslation(soldiers[i].x,y[i]+1,soldiers[i].z));
  weapon.setMatrixAt(i,new T.Matrix4().makeTranslation(i===4?5:soldiers[i].x,y[i]+1,soldiers[i].z));
 }
 const parts={body:{position:new T.Vector3(0,1,0),scale:new T.Vector3(1,1,1),meshes:[body]},
  weapon:{position:new T.Vector3(0,1,0),scale:new T.Vector3(1,1,1),meshes:[weapon]}};
 const visual={group,roles:{sword:{slots:new Map(soldiers.map((s,i)=>[i,i])),parts}}};
 const camera=new T.PerspectiveCamera(24,1,.1,200);
 camera.position.set(0,56,0);camera.lookAt(0,56,-15);
 return {body,weapon,soldiers,visual,camera,group,c:create(T,visual)};
}
const matrices=m=>Array.from(m.instanceMatrix.array);
test('OPT13 elevated and weapon-only visible soldiers are retained; ground and remote ones culled',()=>{
 const f=fixture(),{body,weapon,soldiers,c,camera}=f;
 const before=[matrices(body),matrices(weapon)];
 const stat=c.prepare({soldiers},camera);
 assert.equal(stat.alive,4);assert.equal(stat.dead,1);assert.equal(stat.visible,2);
 assert.equal(stat.culledAlive,2);assert.equal(body.count,2);
 const m=new T.Matrix4();body.getMatrixAt(0,m);assert.equal(m.elements[13],56);
 body.getMatrixAt(1,m);assert.equal(m.elements[12],16);
 c.restore();assert.equal(body.count,5);
 assert.deepEqual(matrices(body),before[0]);assert.deepEqual(matrices(weapon),before[1]);
 camera.position.y=1;camera.lookAt(0,1,-15);
 assert.equal(c.prepare({soldiers},camera).visible,1);c.restore();
});
test('OPT13 falling/climbing actual matrices change visibility and restore full slots',()=>{
 const {body,weapon,soldiers,c,camera}=fixture();
 for(const mesh of [body,weapon])mesh.setMatrixAt(0,new T.Matrix4().makeTranslation(0,56,-15));
 assert.equal(c.prepare({soldiers},camera).visible,3);c.restore();
 for(const mesh of [body,weapon])mesh.setMatrixAt(0,new T.Matrix4().makeTranslation(0,20,-15));
 assert.equal(c.prepare({soldiers},camera).visible,2);c.restore();
 assert.equal(body.count,5);
});
test('OPT13 nonfinite matrices, changed shadow policy, and transformed group fail safely',()=>{
 const {body,weapon,soldiers,c,camera,group}=fixture();
 body.setMatrixAt(2,new T.Matrix4().makeTranslation(NaN,56,-15));
 assert.equal(c.prepare({soldiers},camera).visible,3);c.restore();
 body.setMatrixAt(2,new T.Matrix4().makeTranslation(100,56,-15));
 weapon.castShadow=true;
 assert.equal(c.prepare({soldiers},camera).visible,4);c.restore();
 weapon.castShadow=false;
 group.position.y=55;camera.position.y=56;camera.lookAt(0,56,-15);
 assert.equal(c.prepare({soldiers},camera).visible,1);c.restore();
});
test('OPT13 siege and meadow routing keep original army code and canonical files',()=>{
 assert.match(html,/siegeArmyVisibility\.prepare\(meadowBattleState,camera\);\s*renderer.render\(scene,camera\);\s*\}finally\{siegeArmyVisibility\.restore\(\);\}/);
 assert.match(html,/nativeSiegeTowerMatrix\.elements\[13\]\+=walk\.y/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
