import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../recovered/native-siege/native-siege-interior-v31.js',import.meta.url),'utf8');
const context={};
vm.runInNewContext(source+'\nthis.KTKSiegeInteriorV31=KTKSiegeInteriorV31;',context);
const fort=context.KTKSiegeInteriorV31;
const point=(x,z)=>({x,z});

test('AK31 physical wall posts, open rooms and three staggered defensive lines',()=>{
 assert.equal(fort.validate(),true);
 assert.equal(fort.features.length,34);
 assert.equal(fort.features.filter(f=>f.role==='guardroom').length,6);
 assert.equal(fort.features.filter(f=>f.role==='wall-post').length,16);
 assert.equal(new Set(fort.features.map(f=>f.name)).size,34);
 for(const block of fort.features){
  assert.ok(block.h>=1.85,block.name+' must block actual G5.4 1.85m shots');
  assert.ok(Math.abs(block.x)+block.w/2<109,block.name+' outside curtain');
 }
});

test('AK31 original siege entry, equipment and both squad bypasses are free',()=>{
 const paths={
  gate:[point(0,-90),point(0,-65),point(0,-37),point(0,-19)],
  tower:[point(28,-80),point(28,-58),point(28,-43)],
  catapult:[point(-22,-82),point(-22,-67)],
  left:[point(-19,-24),point(-19,-9),point(-19,12)],
  right:[point(19,-24),point(19,-9),point(19,12)],
  postern:[point(-5,50),point(5,50),point(-7,76),point(7,76)],
  rear:[point(0,90),point(0,105),point(0,130),point(0,170)]
 };
 for(const [name,pts] of Object.entries(paths))
  assert.equal(fort.pathClear(pts,2),true,name+' blocked by AK31');
 assert.equal(fort.pathClear([point(98,101)],.6),true,'solid slab was painted as a port');
 assert.equal(fort.pathClear([point(98,96)],.1),false,'wall post should be physical');
});

test('AK31 actual solid meshes and colliders represent identical positions',()=>{
 class Group {constructor(){this.children=[];} add(v){this.children.push(v);}}
 const parts=new Group(),mats={stone:{},wood:{}};
 const meshCalls=[];
 const makeMesh=(parent,x,y,z,w,h,d,mat)=>{
  const mesh={position:{x,y,z},w,h,d,material:mat,name:''};
  parent.add(mesh);meshCalls.push(mesh);return mesh;
 };
 const makeBox=(x,y,z,w,h,d)=>({
  minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,
  minZ:z-d/2,maxZ:z+d/2
 });
 const built=fort.install({Group},parts,makeMesh,makeBox,mats);
 assert.equal(built.realCollisionBoxes,34);
 assert.equal(built.solidMeshes.length,34);
 assert.equal(built.wallBoxes.length,34);
 assert.equal(parts.children.length,1);
 assert.equal(built.noAdditionalLights,true);
 assert.equal(built.noNewActors,true);
 for(let i=0;i<34;i++){
  const m=built.solidMeshes[i],b=built.wallBoxes[i];
  assert.equal(b.minX,m.position.x-m.w/2);
  assert.equal(b.maxX,m.position.x+m.w/2);
  assert.equal(b.minY,0);
  assert.equal(b.maxY,m.h);
  assert.equal(b.minZ,m.position.z-m.d/2);
  assert.equal(b.maxZ,m.position.z+m.d/2);
 }
});

test('AK31 is installed only through the native siege third map and standalone is synchronized',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const playable=readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8');
 assert.equal(playable,html,'current standalone must be byte identical');
 assert.ok(html.includes(source));
 assert.match(html,/nativeSiegeInteriorV31=KTKSiegeInteriorV31\.install\(/);
 assert.match(html,/nativeSiegeWallBoxes\.push\(\.\.\.nativeSiegeInteriorV31\.wallBoxes\)/);
 const registration=(html.match(/\.\.\.nativeSiegeInteriorV31\.solidMeshes/g)||[]).length;
 assert.equal(registration,2,'world raycast meshes must be added and removed');
 assert.match(html,/window\.ktkSiegeInteriorStatus=\(\)=>/);
 assert.match(html,/if\(enabled\)\{/);
});