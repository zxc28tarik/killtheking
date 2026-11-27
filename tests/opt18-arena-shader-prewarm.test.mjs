import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const i=html.indexOf('function prepareArenaShaderPrograms('),j=html.indexOf('        let arenaShaderWarmupStatus=',i);
assert.ok(i>=0&&j>i);
const prepare=runInNewContext(html.slice(i,j)+'\nprepareArenaShaderPrograms;',ctx),T=ctx.THREE;
function setup(){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera();
 const geo=new T.BoxGeometry(),mat=new T.MeshStandardMaterial(),other=new T.MeshBasicMaterial();
 const first=new T.Mesh(geo,mat),duplicate=new T.Mesh(geo,mat),batch=new T.InstancedMesh(geo,mat,3);
 const hidden=new T.Group();hidden.visible=false;hidden.add(new T.Mesh(geo,other));
 const offlayer=new T.Mesh(geo,other);offlayer.layers.set(2);
 const sun=new T.DirectionalLight(0xffffff,1);sun.castShadow=true;
 scene.fog=new T.Fog(0xffffff,1,10);scene.environment=new T.Texture();
 scene.add(first,duplicate,batch,hidden,offlayer,sun);
 return {scene,camera,geo,mat,other,first,batch,sun};
}
test('OPT18 real r128 active scene proxies preserve exact material and geometry variants; no rendering or resource disposal',()=>{
 const x=setup(),before=x.scene.children.slice();let stage=null,disposed=0;
 x.geo.addEventListener('dispose',()=>disposed++);x.mat.addEventListener('dispose',()=>disposed++);
 const renderer={info:{programs:[]},getContext:()=>({isContextLost:()=>false}),compile(s,c){
  stage=s;assert.equal(c,x.camera);assert.equal(s.fog,x.scene.fog);assert.equal(s.environment,x.scene.environment);
  const meshes=s.children.filter(o=>o.isMesh);assert.equal(meshes.length,2);
  assert.ok(meshes.every(o=>o.geometry===x.geo&&o.material===x.mat));
  assert.equal(meshes.filter(o=>o.isInstancedMesh).length,1);
  const light=s.children.find(o=>o.isLight);assert.notEqual(light,x.sun);assert.equal(light.castShadow,true);
  this.info.programs.push({}, {});
 }};
 const r=prepare(T,renderer,x.scene,x.camera,()=>0);
 assert.equal(r.state,'ready');assert.equal(r.candidates,2);assert.equal(r.lights,1);assert.equal(r.programsAfter,2);
 assert.equal(disposed,0);assert.equal(stage.children.length,0);assert.deepEqual(x.scene.children,before);
 assert.equal(x.first.material,x.mat);assert.equal(x.batch.count,3);
});
test('OPT18 optional warmup failure and context loss leave normal scene and resources intact',()=>{
 const x=setup(),before=x.scene.children.slice();let stage;
 const r=prepare(T,{info:{programs:[]},compile(s){stage=s;throw Error('driver');}},x.scene,x.camera,()=>0);
 assert.equal(r.state,'fallback');assert.match(r.error,/driver/);assert.equal(stage.children.length,0);
 assert.deepEqual(x.scene.children,before);
 const lost=prepare(T,{info:{programs:[]},getContext:()=>({isContextLost:()=>true}),compile(){assert.fail();}},x.scene,x.camera,()=>0);
 assert.equal(lost.state,'unavailable');
});
test('OPT18 production gate restricts warmup to Arena before match clock, keeps diagnostics and canonical entrypoint',()=>{
 assert.match(html,/!meadowBattleMode&&!nativeSiegeMode&&arenaMap==='castle'/);
 assert.match(html,/prepareArenaShadersForRound\(\);\s*ArenaMatch\.begin\(arenaMatch\);\s*lastTime=performance\.now\(\)/);
 assert.doesNotMatch(html.slice(i,j),/checkShaderErrors\s*=\s*false/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
