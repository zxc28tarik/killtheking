/* Kill the King — MAP2 terrain heightfield candidate (NOT wired to G5.4).
 * A deterministic, smooth terrain contract for the existing 70v70 meadow.
 * Do not replace the accepted engine's floor or soldier Y without a tested
 * terrain-aware navigation + 3D shot/line-of-sight integration.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKMeadowTerrain=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PEAKS=Object.freeze([
   Object.freeze({name:'north-hill',x:-.52,z:-.60,height:12,rx:.28,rz:.25}),
   Object.freeze({name:'east-ridge',x:.52,z:-.52,height:8,rx:.35,rz:.19}),
   Object.freeze({name:'centre-knoll',x:0,z:.01,height:5,rx:.18,rz:.18}),
   Object.freeze({name:'south-hill',x:.46,z:.59,height:10,rx:.30,rz:.25}),
   Object.freeze({name:'west-valley',x:-.62,z:.45,height:-3,rx:.27,rz:.28})
 ]);
 function edgeFade(x,z){
   // Original spawn boundaries remain at base Y=0.
   const m=Math.max(Math.abs(x),Math.abs(z));
   const t=Math.max(0,Math.min(1,(1-m)/.16));
   return t*t*(3-2*t);
 }
 function heightAt(x,z,halfSize){
   if(!Number.isFinite(x)||!Number.isFinite(z)||!(halfSize>0)||
      !Number.isFinite(halfSize))throw Error('finite x,z and positive halfSize required');
   const nx=x/halfSize,nz=z/halfSize;
   if(Math.abs(nx)>=1||Math.abs(nz)>=1)return 0;
   let h=0;
   for(const p of PEAKS){
     const dx=(nx-p.x)/p.rx,dz=(nz-p.z)/p.rz;
     const q=dx*dx+dz*dz;
     // Compact-support smooth hill: avoids unintended elevations at spawns.
     if(q<1){const t=1-q;h+=p.height*t*t*t;}
   }
   return h*edgeFade(nx,nz);
 }
 function normalAt(x,z,halfSize){
   const d=Math.max(.025,halfSize*.0005);
   const dx=(heightAt(x+d,z,halfSize)-heightAt(x-d,z,halfSize))/(2*d);
   const dz=(heightAt(x,z+d,halfSize)-heightAt(x,z-d,halfSize))/(2*d);
   const length=Math.hypot(dx,1,dz);
   return {x:-dx/length,y:1/length,z:-dz/length};
 }
 function sampleGrid(halfSize,segments=96){
   if(!Number.isInteger(segments)||segments<8||segments>256)
     throw Error('segments must be integer 8..256');
   const positions=new Float32Array((segments+1)*(segments+1)*3);
   let k=0;
   for(let iz=0;iz<=segments;iz++){
     const z=-halfSize+2*halfSize*iz/segments;
     for(let ix=0;ix<=segments;ix++){
       const x=-halfSize+2*halfSize*ix/segments;
       positions[k++]=x;positions[k++]=heightAt(x,z,halfSize);
       positions[k++]=z;
     }
   }
   return {positions,segments,halfSize};
 }
 // Seeded, continuous noise; no textures, downloads, or new gameplay.
 function hash2(x,z){
   let n=Math.imul(x,374761393)+Math.imul(z,668265263);
   n=Math.imul(n^(n>>>13),1274126177);
   return ((n^(n>>>16))>>>0)/4294967295;
 }
 function smoothNoise(x,z){
   const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
   const tx=fx*fx*(3-2*fx),tz=fz*fz*(3-2*fz);
   const lerp=(a,b,t)=>a+(b-a)*t;
   return lerp(lerp(hash2(ix,iz),hash2(ix+1,iz),tx),
     lerp(hash2(ix,iz+1),hash2(ix+1,iz+1),tx),tz);
 }
 function terrainColor(x,z,h,normal){
   const broad=smoothNoise(x*.023,z*.023);
   const medium=smoothNoise(x*.11+83,z*.11-17);
   const fine=smoothNoise(x*.37-43,z*.37+57);
   const slope=1-Math.max(0,Math.min(1,normal.y));
   const dry=Math.max(0,Math.min(1,(h-4)/9))*0.65+slope*1.6;
   const wet=Math.max(0,Math.min(1,(-h+.3)/3));
   const variation=(broad-.5)*.19+(medium-.5)*.085+(fine-.5)*.035;
   const green=[.405,.512,.308],light=[.49,.545,.34];
   const dryTone=[.535,.495,.353],wetTone=[.335,.426,.272];
   const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
   let rgb=mix(green,light,Math.max(0,Math.min(1,broad*.68+medium*.32)));
   rgb=mix(rgb,dryTone,Math.max(0,Math.min(1,dry)));
   rgb=mix(rgb,wetTone,wet*.82);
   return rgb.map(v=>Math.max(.10,Math.min(.85,v+variation)));
 }
 function createVisual(THREE,scene,halfSize,segments=128){
   if(!THREE?.BufferGeometry||!THREE?.Float32BufferAttribute||
      !THREE?.Mesh||!scene?.add)throw Error('Three.js scene required');
   const {positions}=sampleGrid(halfSize,segments);
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
   const triangles=[];
   for(let z=0;z<segments;z++)for(let x=0;x<segments;x++){
     const a=z*(segments+1)+x,b=a+1,c=a+segments+1,d=c+1;
     triangles.push(a,c,b,b,c,d);
   }
   geometry.setIndex(triangles);geometry.computeVertexNormals();
   // Coherent multi-scale patches look like natural grassland, not a tiled
   // checkerboard. The elevation and collision contract is unchanged.
   const shades=new Float32Array(positions.length);
   for(let j=0;j<positions.length/3;j++){
     const x=positions[j*3],h=positions[j*3+1],z=positions[j*3+2];
     const rgb=terrainColor(x,z,h,normalAt(x,z,halfSize));
     shades.set(rgb,j*3);
   }
   geometry.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));
   const material=new THREE.MeshStandardMaterial({
     color:0xffffff,vertexColors:true,roughness:1,metalness:0,
     side:THREE.DoubleSide
   });
   const mesh=new THREE.Mesh(geometry,material);
   mesh.name='KTK_MAP2_UNINTEGRATED_TERRAIN_VISUAL';
   mesh.receiveShadow=true;
   scene.add(mesh);
   // THREE draw calls: 3 instanced batches rather than 2700 separate objects.
   // Blades are short, deliberately non-colliding and never block projectiles.
   const grass=[];
   if(THREE.InstancedMesh&&THREE.ConeGeometry&&THREE.Object3D){
     const bladeGeometry=new THREE.ConeGeometry(.18,.65,3);
     const grassColors=[0x586e42,0x70804c,0x88915a];
     const dummy=new THREE.Object3D();
     for(let tone=0;tone<3;tone++){
       const gm=new THREE.MeshStandardMaterial({
         color:grassColors[tone],roughness:1,metalness:0,
         side:THREE.DoubleSide
       });
       const count=900;
       const inst=new THREE.InstancedMesh(bladeGeometry,gm,count);
       inst.name='KTK_MAP2_GRASS_BATCH_'+tone;
       for(let i=0;i<count;i++){
         const n=i*3+tone;
         const rx=hash2(n+17,61),rz=hash2(n+41,179);
         const x=(rx*1.84-.92)*halfSize,z=(rz*1.84-.92)*halfSize;
         const h=heightAt(x,z,halfSize);
         const size=.52+hash2(n,773)*.8;
         dummy.position.set(x,h+.24*size,z);
         dummy.rotation.set(0,hash2(n,499)*Math.PI*2,0);
         dummy.scale.set(size,size,size);
         dummy.updateMatrix();
         inst.setMatrixAt(i,dummy.matrix);
       }
       inst.instanceMatrix.needsUpdate=true;
       // Environment-wide sparse batches should not disappear because the
       // entire scattered batch origin lies outside a camera frustum.
       inst.frustumCulled=false;
       scene.add(inst);grass.push({mesh:inst,material:gm});
     }
     // Dispose the shared geometry exactly once.
     grass.sharedGeometry=bladeGeometry;
   }
   let disposed=false;
   return {
     mesh,grass,
     dispose(){
       if(disposed)return;
       disposed=true;
       scene.remove(mesh);geometry.dispose();material.dispose();
       for(const tuft of grass){scene.remove(tuft.mesh);tuft.material.dispose();}
       grass.sharedGeometry?.dispose();
     }
   };
 }
 return Object.freeze({PEAKS,heightAt,normalAt,sampleGrid,createVisual});
});
