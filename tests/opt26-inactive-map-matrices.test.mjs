import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
const a=html.indexOf('function createInactiveMapMatrixGate(');
const b=html.indexOf('        const inactiveMapMatrixGate=',a);
assert.ok(a>=0&&b>a);
const create=runInNewContext(html.slice(a,b)+'\ncreateInactiveMapMatrixGate;',ctx);
function fixture(){
 const scene=new T.Scene(),active=new T.Group(),hidden=new T.Group(),nested=new T.Group(),other=new T.Group();
 scene.add(active,hidden,other);hidden.add(nested);
 hidden.visible=false;other.visible=false;
 let inactive=true;
 const gate=create(T,scene,[{name:'map',roots:[hidden],inactive:()=>inactive}]);
 return {scene,active,hidden,nested,other,gate,activate:()=>{inactive=false;}};
}
test('OPT26 only inactive registered hidden roots skip descendant transform work',()=>{
 const {scene,active,hidden,nested,other,gate}=fixture();
 scene.updateMatrixWorld(true);active.position.x=4;hidden.position.x=8;nested.position.y=3;other.position.z=9;
 scene.position.x=2;
 gate.begin();try{scene.updateMatrixWorld(true);}finally{gate.end();}
 assert.equal(active.matrixWorld.elements[12],6);
 assert.equal(other.matrixWorld.elements[14],9);
 assert.equal(hidden.matrixWorld.elements[12],0);
 assert.equal(nested.matrixWorld.elements[13],0);
 assert.equal(gate.status().last.map,1);
 assert.equal(gate.status().skippedTotal,1);
 assert.equal(gate.status().active,false);
 scene.updateMatrixWorld(true);
 assert.equal(hidden.matrixWorld.elements[12],10);
 assert.equal(nested.matrixWorld.elements[13],3);
});
test('OPT26 active map hidden roots and visible roots are never skipped',()=>{
 const {scene,hidden,nested,gate,activate}=fixture();
 hidden.visible=true;nested.position.y=7;
 gate.begin();try{scene.updateMatrixWorld(true);}finally{gate.end();}
 assert.equal(nested.matrixWorld.elements[13],7);assert.equal(gate.status().skippedTotal,0);
 hidden.visible=false;activate();nested.position.y=12;
 gate.begin();try{scene.updateMatrixWorld(true);}finally{gate.end();}
 assert.equal(nested.matrixWorld.elements[13],12);assert.equal(gate.status().skippedTotal,0);
});
test('OPT26 light and target roots are protected; detached/reparented scene falls back',()=>{
 const scene=new T.Scene(),light=new T.DirectionalLight(),target=new T.Group(),hidden=new T.Group();
 light.target=target;scene.add(light,target,hidden);
 light.visible=false;target.visible=false;hidden.visible=false;
 const gate=create(T,scene,[{name:'map',roots:[light,target,hidden],inactive:()=>true}]);
 assert.equal(gate.status().registered.map,1);
 target.position.x=9;light.position.y=6;hidden.position.z=3;
 gate.begin();try{scene.updateMatrixWorld(true);}finally{gate.end();}
 assert.equal(target.matrixWorld.elements[12],9);assert.equal(light.matrixWorld.elements[13],6);
 assert.equal(hidden.matrixWorld.elements[14],0);
 const parent=new T.Group();parent.add(scene);
 gate.begin();try{parent.updateMatrixWorld(true);}finally{gate.end();}
 assert.equal(hidden.matrixWorld.elements[14],3);
});
test('OPT26 scope clears on render error and unsupported revision leaves native traversal intact',()=>{
 const {scene,active,hidden,nested,gate}=fixture();
 const orig=active.updateMatrixWorld;active.updateMatrixWorld=()=>{throw Error('draw');};
 assert.throws(()=>{gate.begin();try{scene.updateMatrixWorld(true);}finally{gate.end();}},/draw/);
 assert.equal(gate.status().active,false);
 active.updateMatrixWorld=orig;nested.position.y=5;scene.updateMatrixWorld(true);
 assert.equal(nested.matrixWorld.elements[13],5);
 const fallback=new T.Scene(),root=new T.Group();fallback.add(root);root.visible=false;
 const native=fallback.updateMatrixWorld;
 const off=create({REVISION:'future'},fallback,[{name:'map',roots:[root],inactive:()=>true}]);
 assert.equal(off.status().supported,false);assert.equal(fallback.updateMatrixWorld,native);
 root.position.x=15;off.begin();try{fallback.updateMatrixWorld(true);}finally{off.end();}
 assert.equal(root.matrixWorld.elements[12],15);
});
test('OPT26 production gate is render-only, has transition sync and keeps both canonical files equal',()=>{
 assert.match(html,/inactiveMapMatrixGate\.begin\(\);\s*try\{\s*updateActiveMeadowGrass\(\);\s*renderActiveMap\(\);\s*\}finally\{inactiveMapMatrixGate\.end\(\);\}/);
 assert.match(html,/scene\.updateMatrixWorld\(true\);\s*\}\s*\/\/ AK-MAP-01/);
 assert.match(html,/if\(enabled\)nativeSiegeParts\.updateWorldMatrix\(true,true\);/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
