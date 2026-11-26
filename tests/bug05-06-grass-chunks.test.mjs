import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const main=scripts[28],ctx={atob:s=>Buffer.from(s,'base64').toString('binary')};
runInNewContext(scripts[0],ctx);
runInNewContext(scripts.find(s=>s.includes('root.ArenaMeadowGrass=api;')),ctx);
function part(a,b){const start=main.indexOf(a),end=main.indexOf(b,start);assert.ok(start>=0&&end>start,a);return main.slice(start,end);}
runInNewContext(part('        const KTK_MESHY_GRASS_DATA=','        let ktkMeshyGrassHero=null;')+
 part('        const OPT_GRASS_GRID=10','        function updateActiveMeadowGrass(){')+
 '\nthis.api={createGrassChunkSet,updateNearbyTuftsOptimized,cullGrassChunks,markGrassRange};',ctx);
const {THREE,ArenaMeadowGrass:g,api}=ctx;
const spec={half:850,boxes:[{solid:true,x:5,z:8,w:12,d:8},{solid:true,x:-30,z:50,w:6,d:22}]};
function records(mesh,withColor){const m=new THREE.Matrix4(),c=new THREE.Color(),out=[];
 for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,m);
  if(withColor)mesh.getColorAt(i,c);
  out.push({key:m.elements.map(n=>n.toFixed(5)).join(','),color:withColor?c.getHex():null});
 }return out;
}
function verifyPlacements(root,x,z){
 const legacy=g.createNearbyTufts(THREE,12000);
 g.updateNearbyTufts(THREE,legacy,spec,x,z);
 const expected=records(legacy,true),simple=[],hero=[];
 for(const chunk of root.userData.chunks){
  simple.push(...records(chunk.simple,true));hero.push(...records(chunk.detail,false));
 }
 const packed=arr=>arr.map(r=>r.key+':'+r.color).sort();
 assert.deepEqual(packed(simple),packed(expected.filter((_,i)=>i%4!==0)));
 assert.deepEqual(hero.map(r=>r.key).sort(),expected.filter((_,i)=>i%4===0).map(r=>r.key).sort());
}
function clean(root){for(const c of root.userData.chunks)for(const a of [c.simple.instanceMatrix,c.simple.instanceColor,c.detail.instanceMatrix])a.updateRange.count=-1;}
test('BUG05 exact original placements, scales and colors across tile crossing and negative teleport',()=>{
 const root=api.createGrassChunkSet();
 assert.equal(root.count,12000);assert.equal(root.userData.ktkMeshyGrassHero.count,3000);
 assert.equal(root.children.length,25);assert.equal(root.userData.ktkMeshyGrassHero.children.length,25);
 for(const [x,z] of [[1,1],[21,2],[41,21],[-500,-500]]){
  api.updateNearbyTuftsOptimized(root,spec,x,z);verifyPlacements(root,x,z);
 }
});
test('BUG05 conservative frustum boxes include every live instance, including wrapped seams',()=>{
 const root=api.createGrassChunkSet(),m=new THREE.Matrix4(),p=new THREE.Vector3();
 api.updateNearbyTuftsOptimized(root,spec,21,21);
 for(const c of root.userData.chunks)for(const mesh of [c.simple,c.detail])for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,m);p.setFromMatrixPosition(m);assert.ok(c.bounds.containsPoint(p));
 }
 const camera=new THREE.PerspectiveCamera(70,16/9,.1,2400);camera.position.set(21,2,21);
 camera.lookAt(21,2,-100);const n=api.cullGrassChunks(root,camera);
 assert.ok(n>0&&n<25,String(n));
 for(const c of root.userData.chunks)assert.equal(c.simple.visible,c.detail.visible);
 camera.lookAt(21,2,100);const opposite=api.cullGrassChunks(root,camera);
 assert.ok(opposite>0&&opposite<25,String(opposite));
});
test('BUG06 unchanged tile performs no writes; single boundary only schedules changed chunk ranges',()=>{
 const root=api.createGrassChunkSet();api.updateNearbyTuftsOptimized(root,spec,1,1);
 assert.equal(root.userData.lastRegeneratedTiles,100);
 assert.equal(root.userData.scheduledComponents,219000);
 clean(root);
 assert.equal(api.updateNearbyTuftsOptimized(root,spec,2,2),false);
 assert.ok(root.userData.chunks.every(c=>c.simple.instanceMatrix.updateRange.count===-1));
 assert.equal(api.updateNearbyTuftsOptimized(root,spec,21,2),true);
 assert.equal(root.userData.lastRegeneratedTiles,10);
 assert.ok(root.userData.scheduledComponents>0&&root.userData.scheduledComponents<=32850);
 clean(root);api.updateNearbyTuftsOptimized(root,spec,41,21);
 assert.equal(root.userData.lastRegeneratedTiles,19);
 assert.ok(root.userData.scheduledComponents<219000);
});
test('BUG06 pending invisible buffer updates union and reset after upload',()=>{
 const attr=new THREE.InstancedBufferAttribute(new Float32Array(100),1);
 api.markGrassRange(attr,10,5);api.markGrassRange(attr,30,10);
 assert.equal(attr.updateRange.offset,10);assert.equal(attr.updateRange.count,30);
 attr.updateRange.count=-1;api.markGrassRange(attr,60,4);
 assert.equal(attr.updateRange.offset,60);assert.equal(attr.updateRange.count,4);
});
test('BUG05/06 identical canonical HTML and original engine scripts preserved',()=>{
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
 assert.equal(scripts.length,31);assert.match(main,/cullGrassChunks\(meadowDenseGrass,camera\)/);
});
