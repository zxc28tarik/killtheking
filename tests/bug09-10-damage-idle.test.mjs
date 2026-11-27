import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const main=scripts[28];
function part(a,b){const i=main.indexOf(a),j=main.indexOf(b,i);assert.ok(i>=0&&j>i,a);return main.slice(i,j);}
const ctx={window:{innerWidth:800,innerHeight:600}};
runInNewContext(scripts[0],ctx);
const THREE=ctx.THREE;
const camera=new THREE.PerspectiveCamera(80,4/3,.1,100);
camera.position.set(0,0,0);camera.lookAt(0,0,-1);camera.updateMatrixWorld();
let now=1000,created=0;
const nodes=new Set(),container={appendChild(el){nodes.add(el);}};
ctx.camera=camera;ctx.performance={now:()=>now};
ctx.document={getElementById:()=>container,createElement:()=>{created++;return {style:{},remove(){nodes.delete(this);}};}};
runInNewContext(part('        const DAMAGE_NUMBER_LIMIT=','        function spawnSmokeCloud(')+
 part('        const idleSceneState=','        const canvas = document.getElementById(')+
 '\nthis.api={spawnFloatingDamage,expireDamageNumbers,clearDamageNumbers,damageProjectionVisible,shouldRenderScene,acknowledgeSceneRender,invalidateIdleScene,idleSceneState};',ctx);
const a=ctx.api;
test('BUG09 all six clip planes and nonfinite coordinates reject invisible damage labels',()=>{
 a.clearDamageNumbers();
 const original=created;
 for(const point of [[100,0,-2],[-100,0,-2],[0,100,-2],[0,-100,-2],[0,0,-.01],[0,0,-150],[0,0,2],[NaN,0,-2]])
  a.spawnFloatingDamage(new THREE.Vector3(...point),10);
 assert.equal(created,original);assert.equal(nodes.size,0);
 for(const p of [{x:1.01,y:0,z:0},{x:0,y:0,z:-1.01},{x:0,y:0,z:1},{x:NaN,y:0,z:0}])
  assert.equal(a.damageProjectionVisible(p),false);
 assert.equal(a.damageProjectionVisible({x:0,y:0,z:0}),true);
});
test('BUG09 40 normal + 8 critical labels, expiry and reuse bounded at 48 nodes',()=>{
 a.clearDamageNumbers();now=2000;
 const point=new THREE.Vector3(0,0,-5);
 for(let i=0;i<100;i++)a.spawnFloatingDamage(point,12);
 assert.equal(nodes.size,40);
 for(let i=0;i<100;i++)a.spawnFloatingDamage(point,90,true);
 assert.equal(nodes.size,48);assert.equal(created,48);
 const prev=new Set(nodes);
 a.expireDamageNumbers(now+849);assert.equal(nodes.size,48);
 now+=850;a.expireDamageNumbers(now);assert.equal(nodes.size,0);
 a.spawnFloatingDamage(point,15,true);
 const reused=[...nodes][0];
 assert.ok(prev.has(reused));assert.equal(created,48);
 assert.match(reused.textContent,/KRİTİK 15/);
 assert.equal(reused.style.animationName,'floatDmgReuse');
 a.clearDamageNumbers();assert.equal(nodes.size,0);
 assert.equal(ctx.window.ktkDamageNumberStatus().free,48);
});
test('BUG09 no per-label timeout, animation variants match and round resets clear labels',()=>{
 const damage=part('        const DAMAGE_NUMBER_LIMIT=','        function spawnSmokeCloud(');
 assert.doesNotMatch(damage,/setTimeout|offsetWidth|getBoundingClientRect/);
 const keys=[...html.matchAll(/@keyframes floatDmg(?:Reuse)? \{([\s\S]*?)\n        \}/g)].map(m=>m[1]);
 assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);
 assert.match(part('        function clearRoundTransients()','        const DAMAGE_NUMBER_LIMIT='),/clearDamageNumbers\(\)/);
});
test('BUG10 active frames render, frozen results render once, hidden menus never render',()=>{
 const s={dirty:true,rendered:0,skipped:0,wasPlaying:false};
 assert.equal(a.shouldRenderScene(s,false,true),false);
 assert.equal(a.shouldRenderScene(s,false,false),true);a.acknowledgeSceneRender(s);
 for(let i=0;i<100;i++)assert.equal(a.shouldRenderScene(s,false,false),false);
 s.dirty=true;assert.equal(a.shouldRenderScene(s,false,false),true);a.acknowledgeSceneRender(s);
 assert.equal(a.shouldRenderScene(s,true,false),true);a.acknowledgeSceneRender(s);
 assert.equal(a.shouldRenderScene(s,false,false),true);a.acknowledgeSceneRender(s);
 assert.equal(a.shouldRenderScene(s,false,false),false);
 assert.equal(a.shouldRenderScene(s,true,true),false);
 assert.equal(a.shouldRenderScene(s,true,false),true);a.acknowledgeSceneRender(s);
 assert.equal(s.rendered,5);
});
test('BUG10 resize, quality, camera, atmosphere and scene changes invalidate frozen render',()=>{
 for(const marker of ['function resizeCanvases()','window.setAtmosphere = function(idx)','window.toggleThirdPerson = function()','function switchArenaMap(map)','function nativeSiegeCastleGeometry(enabled)','window.selectClass = function(idx)']){
  const i=main.indexOf(marker);assert.ok(i>=0,marker);
  assert.match(main.slice(i,i+350),/invalidateIdleScene\(\)/,marker);
 }
 assert.match(main,/renderer.setPixelRatio\(targetRatio\);\s*invalidateIdleScene\(\)/);
 assert.match(main,/webglcontextrestored',invalidateIdleScene/);
 assert.match(main,/if\(!shouldRenderScene\(idleSceneState,playing,hidden\)\)return/);
 assert.match(main,/renderActiveMap\(\);\s*acknowledgeSceneRender\(idleSceneState\)/);
 const wrapper=part('        function renderActiveMap(){','        window.ktkMeadowArmyVisibilityStatus=');
 assert.match(wrapper,/renderer\.render\(scene,camera\);return;/);
 assert.match(wrapper,/try\{\s*meadowArmyVisibility\.prepare\(meadowBattleState,camera\);\s*renderer\.render\(scene,camera\);\s*\}finally\{meadowArmyVisibility\.restore\(\);\}/);
});
test('BUG09/10 canonical HTML identical, all original 31 script boundaries retained',()=>{
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
 assert.equal(scripts.length,31);
});
