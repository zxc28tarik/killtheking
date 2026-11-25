import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const main=scripts[28];
const part=(start,end)=>{
 const a=main.indexOf(start),b=main.indexOf(end,a);
 assert.ok(a>=0&&b>a,'missing runtime boundary: '+start);
 return main.slice(a,b);
};
const writableVector=()=>({value:[],set(...numbers){this.value=numbers;}});
class FakeMaterial {
 constructor(options={}) {
  this.opacity=options.opacity;
  this.transparent=options.transparent;
  this.color={setHex:hex=>{this.hex=hex;}};
  this.disposed=false;
 }
 dispose(){this.disposed=true;}
}
class FakeMesh {
 constructor(geometry,material){
  this.geometry=geometry;this.material=material;this.userData={};
  this.position=writableVector();this.scale=writableVector();
  this.rotation=writableVector();this.quaternion={identity(){}};
 }
}
class FakeGeometry {
 constructor(){this.disposed=false;}
 dispose(){this.disposed=true;}
}
class FakeObject {
 constructor(){
  this.position=writableVector();this.rotation=writableVector();
  this.scale=writableVector();this.matrix={};
 }
 updateMatrix(){
  this.matrix={position:[...this.position.value],rotation:[...this.rotation.value],
   scale:[...this.scale.value]};
 }
}
class FakeColor {
 setHex(hex){this.hex=hex;return this;}
}
const THREE={
 BoxGeometry:FakeGeometry,MeshBasicMaterial:FakeMaterial,
 MeshLambertMaterial:FakeMaterial,Mesh:FakeMesh,Vector3:class {},
 Object3D:FakeObject,Color:FakeColor
};

test('OPT: all 31 original HTML script boundaries remain and main JS parses',()=>{
 assert.equal(scripts.length,31);
 assert.doesNotThrow(()=>new Script(main,{filename:'ktk-runtime.js'}));
});

test('OPT01: cube geometry/material reused, reset and capped',()=>{
 const active=new Set(),scene={
  add(mesh){active.add(mesh);},
  remove(mesh){active.delete(mesh);}
 };
 const context={THREE,scene,window:{},particles:[]};
 const snippet=part('        const effectCubeGeometry', '        function releaseArrow(');
 runInNewContext(snippet+'\n globalThis.poolTest={acquireEffectCube,releaseParticle,effectMeshPools,effectCubeGeometry};',context);
 const {acquireEffectCube:acquire,releaseParticle:release,effectMeshPools:pools,effectCubeGeometry:geom}=context.poolTest;
 const first=acquire('basic',0xabc123,.55,.05,.05,.28);
 assert.equal(active.size,1);
 assert.equal(first.scale.value[2],.28);
 release(first);
 assert.equal(active.size,0);
 const second=acquire('basic',0x102030,.95,.35);
 assert.strictEqual(first,second);
 assert.equal(second.material.hex,0x102030);
 assert.equal(second.material.opacity,.95);
 assert.deepEqual(second.scale.value,[.35,.35,.35]);
 assert.equal(geom.disposed,false);
 const batch=[second];
 for(let i=1;i<220;i++)batch.push(acquire('basic',0x112233,.9,.1));
 for(const mesh of batch)release(mesh);
 assert.equal(pools.basic.length,192);
 assert.equal(geom.disposed,false);
 const ember=acquire('opaque',0xfbbf24,1,.08);
 assert.equal(ember.material.transparent,false);
 release(ember);
});

test('OPT02: grass preserves all 12,000 positions while refreshing only changed tiles',()=>{
 const context={THREE,ArenaMeadowGrass:{
  NEAR_TILE_SIZE:20,EDGE_INSET:4,
  PALETTE:[0x4e742c,0x5d8433,0x6e933c,0x779b43,0x86a149]
 }};
 const source=part('        const OPT_GRASS_GRID=10', '        function updateActiveMeadowGrass(){');
 runInNewContext(source+'\n globalThis.update=updateNearbyTuftsOptimized;',context);
 const matrices=new Array(12000),colors=new Array(12000);
 let writes=0;
 const mesh={count:12000,userData:{lastTileX:Infinity,lastTileZ:Infinity},
  instanceMatrix:{needsUpdate:false},instanceColor:{needsUpdate:false},
  setMatrixAt(index,m){matrices[index]=m;writes++;},
  setColorAt(index,c){colors[index]=c.hex;}
 };
 const spec={half:850,boxes:[
  {solid:true,x:5,z:8,w:12,d:8},
  {solid:true,x:-30,z:50,w:6,d:22}
 ]};
 const update=context.update;
 assert.equal(update(mesh,spec,1,1),true);
 assert.equal(writes,12000);
 assert.equal(mesh.userData.lastRegeneratedTiles,100);
 assert.equal(update(mesh,spec,2,2),false);
 assert.equal(writes,12000);
 assert.equal(update(mesh,spec,21,2),true);
 assert.equal(writes,13200);
 assert.equal(mesh.userData.lastRegeneratedTiles,10);
 assert.equal(update(mesh,spec,41,21),true);
 assert.equal(writes,15480);
 assert.equal(mesh.userData.lastRegeneratedTiles,19);
 const normalized=matrices.map((m,i)=>({
  key:m.position[0].toFixed(5)+':'+m.position[2].toFixed(5),
  color:colors[i]
 }));
 assert.equal(new Set(normalized.map(v=>v.key)).size,12000);
 assert.ok(normalized.every(v=>Number.isInteger(v.color)));
 assert.equal(update(mesh,spec,-500,-500),true);
 assert.equal(mesh.userData.lastRegeneratedTiles,100);
});
