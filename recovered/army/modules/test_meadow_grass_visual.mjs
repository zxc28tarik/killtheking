import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const terrain=require('./meadow-terrain-heightfield.js');
class Geometry{
 constructor(){this.attributes={};}
 setAttribute(k,v){this.attributes[k]=v;}
 setIndex(v){this.index=v;}
 computeVertexNormals(){}
 dispose(){this.disposed=true;}
}
class Attr{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;}}
class ConeGeometry{dispose(){this.disposed=true;}}
class Material{constructor(opts){this.options=opts;}dispose(){this.disposed=true;}}
class Object3D{
 position={set(){}};
 rotation={set(){}};
 scale={set(){}};
 matrix={};
 updateMatrix(){}
}
class Mesh{constructor(g,m){this.geometry=g;this.material=m;}}
class InstancedMesh extends Mesh{
 instanceMatrix={};
 setMatrixAt(){this.count=(this.count||0)+1;}
}
const THREE={BufferGeometry:Geometry,Float32BufferAttribute:Attr,
 ConeGeometry,MeshStandardMaterial:Material,Object3D,Mesh,InstancedMesh,
 DoubleSide:2};
const makeScene=()=>({
 objects:[],add(x){this.objects.push(x);},
 remove(x){this.objects=this.objects.filter(o=>o!==x);}
});
test('V9 grassy battlefield renders 2700 instanced tufts in three batches',()=>{
 const scene=makeScene(),visual=terrain.createVisual(THREE,scene,240,64);
 assert.equal(visual.grass.length,3);
 assert.equal(visual.grass.reduce((n,g)=>n+g.mesh.count,0),2700);
 assert.equal(scene.objects.length,4);
 visual.dispose();assert.equal(scene.objects.length,0);
});
test('V9 terrain colors have natural contrast and contain no invalid values',()=>{
 const scene=makeScene(),v=terrain.createVisual(THREE,scene,240,64);
 const colors=v.mesh.geometry.attributes.color.array;
 assert.equal(colors.length,65*65*3);
 assert.ok(Array.from(colors).every(n=>Number.isFinite(n)&&n>0&&n<=1));
 assert.ok(Math.max(...colors)-Math.min(...colors)>.1);
 v.dispose();
});
test('V9 visuals do not alter original heightfield samples',()=>{
 const before=terrain.sampleGrid(240,48).positions.slice();
 const scene=makeScene(),visual=terrain.createVisual(THREE,scene,240,64);
 const after=terrain.sampleGrid(240,48).positions;
 assert.deepEqual(before,after);visual.dispose();
});
test('V9 disposing visual meshes and shared geometry is safe twice',()=>{
 const scene=makeScene(),v=terrain.createVisual(THREE,scene,240,24);
 v.dispose();v.dispose();
 assert.equal(scene.objects.length,0);
 assert.equal(v.grass.sharedGeometry.disposed,true);
 assert.equal(v.mesh.geometry.disposed,true);
});
