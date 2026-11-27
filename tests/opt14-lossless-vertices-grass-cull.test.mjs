import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console,Float32Array,Uint32Array,Uint16Array,atob:s=>Buffer.from(s,'base64').toString('binary')};
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
runInNewContext(scripts.find(s=>s.includes('root.ArenaMeadowGrass=api;')),ctx);
function part(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i,a);return html.slice(i,j);}
runInNewContext(part('function indexExactArmyGeometry(','        window.ktkArmyVertexBufferStatus=')+
 part('        const KTK_MESHY_GRASS_DATA=','        let ktkMeshyGrassHero=null;')+
 part('        const OPT_GRASS_GRID=10','        function updateActiveMeadowGrass(){')+
 '\nthis.api={indexExactArmyGeometry,optimizeArmyVertexBuffers,createGrassChunkSet,updateNearbyTuftsOptimized,cullGrassChunks};',ctx);
const T=ctx.THREE,api=ctx.api;
function raw(a){return Array.from(new Uint32Array(a.buffer,a.byteOffset,a.length));}
test('OPT14 exact bitwise attributes and triangle order survive index conversion',()=>{
 const g=new T.BoxGeometry(1,2,3).toNonIndexed();
 assert.equal(api.indexExactArmyGeometry(T,g),null,'grouped geometry must be skipped');
 g.clearGroups(); // same single-material structure as the live merged army buffers
 const before=Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,raw(a.array)]));
 const r=api.indexExactArmyGeometry(T,g);assert.ok(r);assert.equal(r.beforeVertices,36);
 assert.equal(r.afterVertices,24);assert.ok(r.afterBytes<r.beforeBytes);
 const restored=g.toNonIndexed();
 for(const [k,a] of Object.entries(restored.attributes))assert.deepEqual(raw(a.array),before[k],k);
 assert.equal(g.index.count,36);
 assert.equal(api.indexExactArmyGeometry(T,g),null);
});
test('OPT14 never merges different normals, UVs or signed zero; skip if no savings',()=>{
 const g=new T.BufferGeometry();
 const points=[0,0,0,1,0,0,0,1,0];
 g.setAttribute('position',new T.BufferAttribute(new Float32Array([...points,...points,...points,...points]),3));
 g.setAttribute('normal',new T.BufferAttribute(new Float32Array(Array.from({length:12},()=>[0,0,1]).flat()),3));
 const uv=[0,0,1,0,0,1];
 g.setAttribute('uv',new T.BufferAttribute(new Float32Array([...uv,...uv,...uv,...uv]),2));
 g.attributes.normal.array[9]=.25;g.attributes.uv.array[12]=.5;g.attributes.position.array[27]=-0;
 const before=Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,raw(a.array)]));
 const r=api.indexExactArmyGeometry(T,g);assert.ok(r);assert.equal(r.afterVertices,6);
 for(const [k,a] of Object.entries(g.toNonIndexed().attributes))assert.deepEqual(raw(a.array),before[k]);
 const single=new T.BufferGeometry();
 for(const k of ['position','normal','uv'])single.setAttribute(k,new T.BufferAttribute(new Float32Array(g.attributes[k].array.slice(0,3*g.attributes[k].itemSize)),g.attributes[k].itemSize));
 assert.equal(api.indexExactArmyGeometry(T,single),null);
});
test('OPT14 wrapped grass empty-space false positive rejected without changing instance buffers',()=>{
 const root=api.createGrassChunkSet(),c=root.userData.chunks[0],tile=ctx.ArenaMeadowGrass.NEAR_TILE_SIZE;
 c.tiles=[{x:-100,z:-40},{x:100,z:-40},{x:-100,z:-20},{x:100,z:-20}];
 c.bounds.min.set(-101,-1,-41);c.bounds.max.set(100+tile+1,2,-20+tile+1);
 const camera=new T.PerspectiveCamera(40,1,.1,100);
 camera.position.set(0,1,0);camera.lookAt(0,1,-1);
 assert.equal(api.cullGrassChunks(root,camera),0);
 assert.equal(root.userData.coarseVisibleChunks,1);assert.equal(root.userData.seamChunksRejected,1);
 assert.equal(c.simple.visible,false);assert.equal(c.detail.visible,false);
 camera.position.set(-95,1,0);camera.lookAt(-95,1,-1);
 assert.equal(api.cullGrassChunks(root,camera),1);assert.equal(c.simple.visible,true);
 assert.equal(c.simple.instanceMatrix.version,0);assert.equal(c.detail.instanceMatrix.version,0);
});
test('OPT14 original canonical HTML copies, exact lossless source hooks',()=>{
 assert.match(html,/optimizeArmyVertexBuffers\(THREE,meadowBattleVisual\)/);
 assert.match(html,/window\.ktkArmyVertexBufferStatus/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
