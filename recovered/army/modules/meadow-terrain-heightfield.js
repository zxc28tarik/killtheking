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
 function createVisual(THREE,scene,halfSize,segments=96){
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
   // Visual-only vertex colors: low, wet valleys; grassy flatland;
   // muted dry ridge shoulders. No real elevation/physics changes.
   const shades=new Float32Array((segments+1)*(segments+1)*3);
   const palette=[
     [0.31,0.39,0.25], // shallow shaded valley
     [0.43,0.54,0.34], // grass
     [0.49,0.55,0.35], // upper grass
     [0.55,0.51,0.40]  // muted dry hilltop
   ];
   const mix=(a,b,t)=>a+(b-a)*t;
   for(let iz=0;iz<=segments;iz++)for(let ix=0;ix<=segments;ix++){
     const j=iz*(segments+1)+ix,h=positions[j*3+1];
     const ratio=Math.max(0,Math.min(1,(h+3)/15));
     const band=ratio<.23?0:ratio<.67?1:2;
     const local=band===0?ratio/.23:band===1?(ratio-.23)/.44:(ratio-.67)/.33;
     const a=palette[band],b=palette[band+1];
     const variation=.965+.035*Math.sin(ix*.77+iz*.43);
     for(let k=0;k<3;k++)shades[3*j+k]=mix(a[k],b[k],local)*variation;
   }
   geometry.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));
   const material=new THREE.MeshStandardMaterial({
     color:0xffffff,vertexColors:true,roughness:1,metalness:0,
     side:THREE.DoubleSide
   });
   const mesh=new THREE.Mesh(geometry,material);
   mesh.name='KTK_MAP2_UNINTEGRATED_TERRAIN_VISUAL';
   mesh.receiveShadow=true;scene.add(mesh);
   return {mesh,dispose(){scene.remove(mesh);geometry.dispose();material.dispose();}};
 }
 return Object.freeze({PEAKS,heightAt,normalAt,sampleGrid,createVisual});
});
