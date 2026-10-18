/* A5 meadow ground cover. Seeded, low-poly, non-solid; one instanced draw call. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaMeadowGrass=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DESKTOP_COUNT=32000, MOBILE_COUNT=14000, EDGE_INSET=4;
 const PALETTE=Object.freeze([0x4e742c,0x5d8433,0x6e933c,0x779b43,0x86a149]);
 function random(seed){
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;
   return state/4294967296;};
 }
 function samplePositions(half,boxes=[],count=DESKTOP_COUNT,seed=0x5eeda5){
  if(!Number.isFinite(half)||half<=EDGE_INSET+2)throw new RangeError('Invalid meadow radius');
  if(!Number.isSafeInteger(count)||count<0||count>80000)throw new RangeError('Invalid grass count');
  const rng=random(seed),columns=Math.ceil(Math.sqrt(count)),placements=[];
  if(!count)return placements;
  const span=2*(half-EDGE_INSET),cell=span/columns;
  const solids=boxes.filter(box=>box.solid);
  for(let i=0;i<count;i++){
   const x=-half+EDGE_INSET+((i%columns)+.15+.7*rng())*cell;
   const z=-half+EDGE_INSET+(Math.floor(i/columns)+.15+.7*rng())*cell;
   const height=.3+.4*rng(),width=.43+.3*rng(),angle=2*Math.PI*rng();
   const colorIndex=Math.floor(rng()*PALETTE.length);
   // No grass growing through physical fence, tree trunk or stone cover.
   if(solids.some(b=>Math.abs(x-b.x)<b.w/2+1.0&&Math.abs(z-b.z)<b.d/2+1.0))continue;
   placements.push({x,z,height,width,angle,colorIndex});
  }
  return placements;
 }
 function createTexture(THREE,dom){
  const canvas=dom.createElement('canvas');
  canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');
  const rng=random(0x1600cafe);
  ctx.fillStyle='#688e38';
  ctx.fillRect(0,0,256,256);
  // Mottled meadow color instead of a flat green plane.
  for(let i=0;i<170;i++){
   ctx.globalAlpha=.08+.13*rng();
   ctx.fillStyle=i%3===0?'#c0c87b':i%3===1?'#284c21':'#9cbf4b';
   ctx.beginPath();
   ctx.ellipse(rng()*256,rng()*256,5+rng()*21,3+rng()*13,rng()*6.283,0,6.283);
   ctx.fill();
  }
  ctx.globalAlpha=1;
  for(let i=0;i<9000;i++){
   const x=Math.floor(rng()*256),y=Math.floor(rng()*256);
   ctx.fillStyle=i%5<2?'rgba(34,70,22,.26)':i%5===2?'rgba(196,211,114,.35)':'rgba(126,166,61,.4)';
   ctx.fillRect(x,y,1+Math.floor(rng()*2),1+Math.floor(rng()*3));
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(56,56);
  texture.magFilter=THREE.NearestFilter;
  texture.anisotropy=4;
  return texture;
 }
 function createInstancedTufts(THREE,spec,count=DESKTOP_COUNT){
  const placements=samplePositions(spec.half,spec.boxes,count);
  // Three crossed pointed blades per tuft. Their height stays below knee level,
  // preserving the wide-open sightlines and projectile behavior.
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
   -.38,0,0,.38,0,0,-.08,1,0,
   0,0,-.36,0,0,.36,0,1.0,.04,
   -.26,0,-.25,.24,0,.25,0,.82,0
  ],3));
  geometry.computeVertexNormals();
  const material=new THREE.MeshLambertMaterial({
   color:0xffffff,side:THREE.DoubleSide,depthWrite:true
  });
  const mesh=new THREE.InstancedMesh(geometry,material,placements.length);
  const transform=new THREE.Object3D(),color=new THREE.Color();
  for(let i=0;i<placements.length;i++){
   const p=placements[i];
   transform.position.set(p.x,.018,p.z);
   transform.rotation.set(0,p.angle,0);
   transform.scale.set(p.width,p.height,p.width);
   transform.updateMatrix();
   mesh.setMatrixAt(i,transform.matrix);
   mesh.setColorAt(i,color.setHex(PALETTE[p.colorIndex]));
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.name='Meadow decorative grass (non-colliding)';
  mesh.castShadow=false;mesh.receiveShadow=false;
  // r128 has no automatic expanded bounding sphere for all instance positions.
  mesh.frustumCulled=false;
  return mesh;
 }
 return {DESKTOP_COUNT,MOBILE_COUNT,EDGE_INSET,PALETTE,
  samplePositions,createTexture,createInstancedTufts};
});
