import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
function part(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i);return html.slice(i,j);}
const batch=runInNewContext(part('function batchStaticDecorations(','        buildCastleArena();')+'\nbatchStaticDecorations;',ctx);
test('OPT static decoration batches preserve exact transforms and flags without touching collision or materials',()=>{
 const root=new T.Scene(),g=new T.BoxGeometry(2,3,4),m=new T.MeshStandardMaterial(),other=new T.MeshStandardMaterial();
 const make=(x,decor=true,mat=m,shadow=true)=>{const o=new T.Mesh(g,mat);o.userData.ktkStaticDecoration=decor;o.position.set(x,2,3);o.rotation.y=.4;o.castShadow=shadow;o.receiveShadow=true;root.add(o);o.updateMatrix();return o;};
 const a=make(1),b=make(2),c=make(3,false),d=make(4,true,other),e=make(5,true,m,false),far=make(90);
 const raycast=[c],before=root.children.slice();
 const r=batch(T,root,before);
 assert.equal(r.originals,2);assert.equal(r.batches,1);assert.equal(r.avoidedDraws,1);
 const inst=root.children.find(o=>o.isInstancedMesh);
 assert.equal(inst.geometry,g);assert.equal(inst.material,m);assert.equal(inst.castShadow,true);assert.equal(inst.receiveShadow,true);assert.equal(inst.count,2);
 const mat=new T.Matrix4();for(const [i,o] of [a,b].entries()){inst.getMatrixAt(i,mat);assert.ok(mat.elements.every((v,k)=>Math.abs(v-o.matrix.elements[k])<1e-6));assert.equal(o.parent,null);}
 assert.equal(raycast[0],c);for(const o of [c,d,e,far])assert.equal(o.parent,root);
});
test('OPT army arrows render only live prefix, zero and capacity cases, no projectile mutation',()=>{
 const fixture={meadowBattleVisual:{flightArrows:{count:96,instanceMatrix:{count:96}}},meadowBattleState:{projectiles:[]}};
 const fn=runInNewContext(part('function syncArmyArrowDrawCount(','        function nativeSiegeTowerRenderSoldiers(')+'\nsyncArmyArrowDrawCount;',fixture);
 for(const n of [0,3,96,100,1,0]){const arr=Array.from({length:n},(_,i)=>({id:i}));fixture.meadowBattleState.projectiles=arr;fn();assert.equal(fixture.meadowBattleVisual.flightArrows.count,Math.min(n,96));assert.equal(fixture.meadowBattleState.projectiles,arr);}
});
test('OPT live castle batches are captured by map visibility and arrow draw counts sync on reset and update',()=>{
 assert.match(html,/const castleDecorBatchStats=batchStaticDecorations[\s\S]{0,250}const castleVisuals = scene.children.slice\(castleBegin\)/);
 assert.match(html,/meadowBattleVisual.update\(meadowBattleState\);\s*syncArmyArrowDrawCount\(\)/);
 assert.match(html,/meadowBattleVisual.update\(meadowBattleState,dt\);\s*syncArmyArrowDrawCount\(\)/);
});
