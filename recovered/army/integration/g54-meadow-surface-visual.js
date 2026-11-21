/* MAP2: natural grassland surface color treatment.
 * Cosmetic only. Preserves native G5.4 floor, navigation and collision data.
 * The accepted tiled grass CanvasTexture remains on the original mesh.
 */
const KTKMeadowSurfaceVisual=(function(){
 'use strict';
 function hash(x,y){
   let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^0x6a09e667;
   n=Math.imul(n^(n>>>13),1274126177);
   return ((n^(n>>>16))>>>0)/4294967295;
 }
 function noise(x,y){
   const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
   const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
   const top=hash(ix,iy)*(1-sx)+hash(ix+1,iy)*sx;
   const bottom=hash(ix,iy+1)*(1-sx)+hash(ix+1,iy+1)*sx;
   return top*(1-sy)+bottom*sy;
 }
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
 function surfaceTint(x,z,half){
   if(!Number.isFinite(x)||!Number.isFinite(z)||!(half>0))
     throw Error('Invalid meadow color coordinate');
   // Warp the broad grass patches so they do not read as checkerboard tiles.
   const warpX=(noise(x*.0039+22,z*.0039-11)-.5)*92;
   const warpZ=(noise(x*.0047-47,z*.0047+31)-.5)*92;
   const bx=x+warpX,bz=z+warpZ;
   const broad=noise(bx*.0082,bz*.0082);
   const middle=noise(x*.023+31,z*.023-7);
   const fine=noise(x*.073-19,z*.073+61);
   const lush=smooth((broad*.67+middle*.33-.31)/.43);
   const dry=smooth((middle*.6+fine*.4-.60)/.28);
   // Narrow, almost imperceptible grass wear along a curving historic
   // crossing: low color contrast only; absolutely no new solid geometry.
   const pathZ=Math.sin(x*.009+1.7)*23+Math.sin(x*.023-1.1)*8;
   const path=smooth((14-Math.abs(z-pathZ))/13)*.13;
   const edge=smooth((Math.max(Math.abs(x),Math.abs(z))/half-.76)/.24);
   const r=clamp(.78+lush*.22+dry*.105+path*.36-edge*.06,.60,1.22);
   const g=clamp(.84+lush*.26-dry*.07-path*.14-edge*.03,.60,1.24);
   const b=clamp(.73+lush*.21-dry*.17-path*.22-edge*.045,.55,1.15);
   return [r,g,b];
 }
 function apply(THREE,ground,spec,segments=144){
   if(!THREE?.PlaneGeometry||!THREE?.Float32BufferAttribute||
      !ground?.geometry||!ground?.material||!(spec?.linearScale>0)||
      !Number.isInteger(segments)||segments<16||segments>256)
     throw Error('Invalid G5.4 meadow ground for surface treatment');
   const size=112*spec.linearScale,half=size/2;
   const oldGeometry=ground.geometry;
   const geo=new THREE.PlaneGeometry(size,size,segments,segments);
   const pos=geo.getAttribute('position');
   const shades=new Float32Array(pos.count*3);
   for(let i=0;i<pos.count;i++){
     const x=pos.getX(i),z=-pos.getY(i);
     const rgb=surfaceTint(x,z,half);
     shades[3*i]=rgb[0];shades[3*i+1]=rgb[1];shades[3*i+2]=rgb[2];
   }
   geo.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));
   ground.geometry=geo;
   ground.material.vertexColors=true;
   ground.material.needsUpdate=true;
   oldGeometry.dispose();
   ground.userData.ktkMeadowSurface=true;
   ground.userData.ktkSurfaceSegments=segments;
   return Object.freeze({
     vertices:pos.count,triangles:segments*segments*2,
     minWorldHeight:ground.position.y,
     unchangedPhysics:true
   });
 }
 return Object.freeze({apply,surfaceTint});
})();
