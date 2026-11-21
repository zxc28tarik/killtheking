import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
class BufferGeometry{
 attrs={};
 setAttribute(k,v){this.attrs[k]=v;}
 setIndex(i){this.indices=i;}
 computeVertexNormals(){}
 dispose(){this.disposed=true;}
}
class Attr{constructor(array,size){this.array=array;this.size=size;}}
class Material{constructor(options){this.options=options;}dispose(){this.disposed=true;}}
class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;}}
const THREE={BufferGeometry,Float32BufferAttribute:Attr,MeshStandardMaterial:Material,Mesh,DoubleSide:2};
const scene=()=>({objects:[],add(mesh){this.objects.push(mesh);},remove(mesh){this.objects=this.objects.filter(item=>item!==mesh);}});
const script=readFileSync(resolve(root,'g54-meadow-horizon-visual.js'),'utf8');
const api=vm.runInNewContext(script+';KTKMeadowHorizon;');
test('distant hills remain outside real G5.4 combat map',()=>{
 const areaHalf=49*Math.sqrt(300),s=scene();
 const hill=api.build(THREE,s,{half:areaHalf});
 assert.ok(hill.innerRadius>areaHalf);
 assert.equal(hill.triangles,512);
 assert.equal(hill.vertices,325);
 assert.equal(s.objects.length,1);
 hill.dispose();
 assert.equal(s.objects.length,0);
});
test('all horizon ridge vertices remain finite and fully outside playable radius',()=>{
 const areaHalf=49*Math.sqrt(300),s=scene();
 const hill=api.build(THREE,s,{half:areaHalf});
 const v=hill.mesh.geometry.attrs.position.array;
 const colors=hill.mesh.geometry.attrs.color.array;
 assert.ok(Array.from(v).every(Number.isFinite));
 assert.ok(Array.from(colors).every(value=>Number.isFinite(value)&&value>0&&value<1));
 for(let i=0;i<v.length;i+=3){
  assert.ok(Math.hypot(v[i],v[i+2])>=areaHalf*1.08);
 }
 hill.dispose();
 assert.ok(hill.mesh.geometry.disposed);
 assert.ok(hill.mesh.material.disposed);
});
test('horizon shader geometry is not registered as physical obstacle',()=>{
 const s=scene(),mockSpec={half:800,boxes:[],navigation:{}};
 const hill=api.build(THREE,s,mockSpec);
 assert.deepEqual(mockSpec.boxes,[]);
 assert.deepEqual(mockSpec.navigation,{});
 assert.equal(hill.mesh.castShadow,false);
 hill.dispose();
});
