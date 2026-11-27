import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console};runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
const a=html.indexOf('function batchCastleSolidVisuals('),b=html.indexOf('        buildCastleArena();',a);assert.ok(a>=0&&b>a);
const batch=runInNewContext(html.slice(a,b)+'\nbatchCastleSolidVisuals;',ctx);
test('OPT03 solid batching preserves original raycast identity and exact visual mesh attributes',()=>{
 const root=new T.Scene(),mat=new T.MeshStandardMaterial({side:T.DoubleSide});
 function make(x,z,w=2,h=2){const m=new T.Mesh(new T.BoxGeometry(w,h,2),mat);m.position.set(x,1,z);m.userData.ktkStaticSolid=true;m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
 const a=make(2,3),b=make(6,3,4),south=make(0,-42,88,7),north=make(0,42,88,7),far=make(100,3);
 root.updateMatrixWorld(true);
 const ray=new T.Raycaster(new T.Vector3(2,1,0),new T.Vector3(0,0,1),0,10),world=[a,b,south,north,far];
 const before=ray.intersectObjects(world,false)[0];assert.equal(before.object,a);
 const oldG=a.geometry,oldMat=a.material;
 const r=batch(T,root,root.children.slice());
 assert.equal(r.originals,2);assert.equal(r.batches,1);assert.equal(r.avoidedDraws,1);assert.equal(r.shadowDrawsAvoided,1);
 root.updateMatrixWorld(true);
 const after=ray.intersectObjects(world,false)[0];assert.equal(after.object,a);assert.equal(after.distance,before.distance);
 assert.equal(a.visible,true);assert.equal(a.geometry,oldG);assert.equal(a.material.visible,false);assert.equal(a.material.side,oldMat.side);assert.equal(a.castShadow,false);
 const visual=root.children.find(m=>m.name==='OPT regional castle solid visual');
 assert.equal(visual.material,mat);assert.equal(visual.castShadow,true);assert.equal(visual.receiveShadow,true);assert.equal(visual.geometry.attributes.position.count,72);
 assert.equal(visual.geometry.attributes.normal.count,72);assert.equal(visual.geometry.attributes.uv.count,72);
 assert.equal(visual.geometry.boundingBox.min.x,1);assert.equal(visual.geometry.boundingBox.max.x,8);
 for(const m of [south,north,far]){assert.equal(m.material,mat);assert.equal(m.castShadow,true);}
 assert.ok(root.children.includes(a)&&root.children.includes(b));
 for(const m of root.children)m.visible=false;assert.equal(visual.visible,false);assert.equal(a.visible,false);
 for(const m of root.children)m.visible=true;assert.equal(visual.visible,true);assert.equal(a.material.visible,false);
});
test('OPT03 physical variant walls excluded and map visual list includes batches',()=>{
 assert.match(html,/p\.width===88&&p\.height===7/);
 assert.match(html,/const castleSolidBatchStats=batchCastleSolidVisuals[\s\S]{0,500}const castleVisuals = scene.children.slice\(castleBegin\)/);
 assert.match(html,/nativeSiegeOriginalSouthVisual\.visible=!enabled/);
 assert.match(html,/nativeSiegeOriginalNorthVisual\.visible=!enabled/);
});
