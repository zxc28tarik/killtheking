/* A5 meadow ground cover. Seeded, low-poly, non-solid; one instanced draw call. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaMeadowGrass=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DESKTOP_COUNT=32000, MOBILE_COUNT=14000, EDGE_INSET=4;
 const NEAR_DESKTOP_COUNT=12000, NEAR_MOBILE_COUNT=4500, NEAR_TILE_SIZE=20;
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
 // Fixed-size player-local grass pool: re-seed deterministic world tiles only
 // when crossing a 20-unit boundary, so dense turf stays planted in place.
 function createNearbyTufts(THREE,count=NEAR_DESKTOP_COUNT){
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([
   -.38,0,0,.38,0,0,0,1,0,
   0,0,-.36,0,0,.36,0,1,.04,
   -.26,0,-.25,.24,0,.25,0,.82,0
  ],3));
  geo.computeVertexNormals();
  const mat=new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide});
  const mesh=new THREE.InstancedMesh(geo,mat,count);
  mesh.name='Nearby meadow turf (visual only)';
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;
  mesh.userData.lastTileX=Infinity;mesh.userData.lastTileZ=Infinity;
  return mesh;
 }
 function updateNearbyTufts(THREE,mesh,spec,x,z){
  if(!mesh||!Number.isFinite(x)||!Number.isFinite(z))return false;
  const tileX=Math.floor(x/NEAR_TILE_SIZE),tileZ=Math.floor(z/NEAR_TILE_SIZE);
  if(mesh.userData.lastTileX===tileX&&mesh.userData.lastTileZ===tileZ)return false;
  const tilesPerSide=10,tileCount=tilesPerSide*tilesPerSide;
  const instancesPerTile=Math.ceil(mesh.count/tileCount);
  const props=spec.boxes.filter(b=>b.solid);
  const object=new THREE.Object3D(),color=new THREE.Color();
  for(let i=0;i<mesh.count;i++){
   const t=Math.floor(i/instancesPerTile),tileLocalX=t%tilesPerSide,
    tileLocalZ=Math.floor(t/tilesPerSide);
   const worldTileX=tileX+tileLocalX-5,worldTileZ=tileZ+tileLocalZ-5;
   // Repeated overlap has the same tile index and deterministic blades.
   const rng=random((Math.imul(worldTileX,73856093)^
      Math.imul(worldTileZ,19349663)^Math.imul(i%instancesPerTile+1,83492791)^0xdecafbad)>>>0);
   const offsetX=rng(),offsetZ=rng();
   const px=(worldTileX+offsetX)*NEAR_TILE_SIZE;
   const pz=(worldTileZ+offsetZ)*NEAR_TILE_SIZE;
   const blocked=Math.abs(px)>=spec.half-EDGE_INSET||
    Math.abs(pz)>=spec.half-EDGE_INSET||props.some(b=>
      Math.abs(px-b.x)<b.w/2+.7&&Math.abs(pz-b.z)<b.d/2+.7);
   object.position.set(px,.02,pz);
   object.rotation.set(0,rng()*6.28318530718,0);
   const size=.46+.3*rng(),height=.34+.44*rng();
   object.scale.set(blocked?0:size,blocked?0:height,blocked?0:size);
   object.updateMatrix();mesh.setMatrixAt(i,object.matrix);
   mesh.setColorAt(i,color.setHex(PALETTE[Math.floor(rng()*PALETTE.length)]));
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.userData.lastTileX=tileX;mesh.userData.lastTileZ=tileZ;
  return true;
 }
 return {DESKTOP_COUNT,MOBILE_COUNT,NEAR_DESKTOP_COUNT,NEAR_MOBILE_COUNT,
  NEAR_TILE_SIZE,EDGE_INSET,PALETTE,samplePositions,createTexture,
  createInstancedTufts,createNearbyTufts,updateNearbyTufts};
});
