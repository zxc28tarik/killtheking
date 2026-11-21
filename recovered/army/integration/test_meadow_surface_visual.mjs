import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const code=readFileSync(resolve(root,'g54-meadow-surface-visual.js'),'utf8');
const api=vm.runInNewContext(code+';KTKMeadowSurfaceVisual;');
class Attr{constructor(array,size){this.array=array;this.itemSize=size;}}
class Plane{
 constructor(width,height,segments){
   this.position=new Float32Array((segments+1)**2*3);
   let k=0;
   for(let j=0;j<=segments;j++)for(let i=0;i<=segments;i++){
     this.position[k++]=(i/segments-.5)*width;
     this.position[k++]=(j/segments-.5)*height;
     this.position[k++]=0;
   }
   this.attrs={position:{count:(segments+1)**2,
     getX:i=>this.position[3*i],getY:i=>this.position[3*i+1]}};
 }
 getAttribute(k){return this.attrs[k];}
 setAttribute(k,v){this.attrs[k]=v;}
 dispose(){this.disposed=true;}
}
const THREE={PlaneGeometry:Plane,Float32BufferAttribute:Attr};
test('native meadow receives broad organic color modulation with original texture',()=>{
 const old={disposed:false,dispose(){this.disposed=true;}};
 const texture={name:'original dense grass turf'};
 const mesh={geometry:old,material:{map:texture,vertexColors:false},
   userData:{},position:{y:0}};
 const out=api.apply(THREE,mesh,{linearScale:Math.sqrt(300)},144);
 assert.equal(out.vertices,21025);
 assert.equal(out.triangles,41472);
 assert.equal(mesh.material.map,texture);
 assert.equal(mesh.material.vertexColors,true);
 assert.equal(mesh.position.y,0);
 assert.equal(old.disposed,true);
 assert.equal(mesh.userData.ktkMeadowSurface,true);
 const rgb=mesh.geometry.attrs.color.array;
 assert.equal(rgb.length,21025*3);
 const min=Math.min(...rgb),max=Math.max(...rgb);
 assert.ok(max-min>.23);
 assert.ok(rgb.every(Number.isFinite));
});
test('surface shades deterministic and do not depend on random browser state',()=>{
 const first=Array.from(api.surfaceTint(100,-50,860));
 const second=Array.from(api.surfaceTint(100,-50,860));
 assert.deepEqual(first,second);
 assert.ok(first.every(x=>x>=0.55&&x<=1.24));
});
test('bad coordinates and unexpected terrain resolutions cannot corrupt graphics',()=>{
 assert.throws(()=>api.surfaceTint(NaN,0,860));
 assert.throws(()=>api.surfaceTint(0,0,-1));
 assert.throws(()=>api.apply(THREE,{geometry:{},material:{}},{linearScale:1},12));
});
