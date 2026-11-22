/* V20 high-visibility woodland: grove compositions across safe exterior
 * meadow margins. Render-only; native G5.4 collisions, movement and hit
 * detection are deliberately left unchanged.
 */
const KTKMeadowNatureV19=(function(){
 'use strict';
 const TAU=Math.PI*2;
 function hash(a,b){
  let n=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^0x4b1d7;
  n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;
 }
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const GROVES=[
  [-340,-310],[-455,0],[-340,310],[340,-310],[455,0],[340,310],
  [-100,-485],[150,-470],[-100,480],[150,470],
  [-650,-575],[640,-540],[-650,570],[650,580],
  [-740,0],[740,0],[0,-730],[0,730]
 ];
 function build(THREE,scene,spec){
  if(!THREE?.InstancedMesh||!scene?.add||!(spec?.half>0))throw Error('G5.4 nature scene required');
  const half=spec.half,root=new THREE.Group();
  root.name='KTK_V20_WOODLANDS_VISUAL_ONLY';
  scene.add(root);
  const disposedResources=[],meshes=[],dummy=new THREE.Object3D(),paint=new THREE.Color();
  function batch(name,geo,mat,count){
   const mesh=new THREE.InstancedMesh(geo,mat,count);
   mesh.name=name;mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;
   root.add(mesh);disposedResources.push(geo,mat);meshes.push(mesh);return mesh;
  }
  function put(mesh,id,x,y,z,sx,sy,sz,rot,hex){
   dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);
   dummy.rotation.set(0,rot,0);dummy.updateMatrix();
   mesh.setMatrixAt(id,dummy.matrix);mesh.setColorAt(id,paint.setHex(hex));
  }
  // Smooth forest floor beyond the original square. Small negative Y keeps
  // original textured turf visible on top throughout the playable field.
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(2*(half+275),2*(half+275)),
   new THREE.MeshStandardMaterial({color:0x50683b,roughness:1,metalness:0}));
  ground.name='KTK_V20_WOODLAND_OUTER_GROUND';
  ground.rotation.x=-Math.PI/2;ground.position.y=-.22;
  ground.receiveShadow=true;root.add(ground);
  disposedResources.push(ground.geometry,ground.material);
  const trees=460,shrubs=1550,flowers=2350,stones=380;
  const broadCount=280,pineCount=trees-broadCount;
  const stems=batch('KTK_V20_WOODLAND_TREE_STEMS',
   new THREE.CylinderGeometry(.65,1.05,1,7),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),trees);
  const deciduous=batch('KTK_V20_DECIDUOUS_CROWN_LOBES',
   new THREE.IcosahedronGeometry(1,1),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true}),broadCount*4);
  const pine=batch('KTK_V20_CONIFER_BOWS',
   new THREE.ConeGeometry(1,1,7),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide}),pineCount*3);
  const bush=batch('KTK_V20_WOODLAND_SHRUBS',
   new THREE.IcosahedronGeometry(1,0),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true}),shrubs);
  const wildflower=batch('KTK_V20_MEADOW_WILDFLOWERS',
   new THREE.ConeGeometry(.25,.75,4),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide}),flowers);
  const rocks=batch('KTK_V20_LOW_ROCK_DETAILS',
   new THREE.DodecahedronGeometry(1,0),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true}),stones);
  // V21 woodland ground: low, mottled leaf-litter and moss transitions.
  // These patches are beneath the shrubs, not raised barriers or new colliders.
  const litterCount=460,mossCount=320;
  const litter=batch('KTK_V21_WOODLAND_LEAF_LITTER',
   new THREE.CircleGeometry(1,8),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,
     side:THREE.DoubleSide,depthWrite:true}),litterCount);
  const moss=batch('KTK_V21_WOODLAND_SOFT_MOSS',
   new THREE.CircleGeometry(1,9),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,
     side:THREE.DoubleSide,depthWrite:true}),mossCount);
  // The built-in put helper rotates around the Y axis; for horizontal
  // ground patches keep an explicit -PI/2 x rotation with matrix updates.
  function groundPatch(mesh,i,x,z,width,depth,tint,y){
   dummy.position.set(x,y,z);
   dummy.scale.set(width,depth,1);
   dummy.rotation.set(-Math.PI/2,0,hash(i,173)*TAU);
   dummy.updateMatrix();
   mesh.setMatrixAt(i,dummy.matrix);
   mesh.setColorAt(i,paint.setHex(tint));
  }
  for(let i=0;i<litterCount;i++){
   const g=GROVES[i%GROVES.length],theta=hash(i,153)*TAU,
      radius=8+Math.sqrt(hash(i,155))*94,
      x=clamp(g[0]+Math.cos(theta)*radius,-half*.94,half*.94),
      z=clamp(g[1]+Math.sin(theta)*radius,-half*.94,half*.94),
      width=1.9+hash(i,157)*5.5;
   groundPatch(litter,i,x,z,width,width*(.7+hash(i,159)*.6),
    [0x586c38,0x786f43,0x657a49,0x716d43,0x4e6540][i%5],.028+i%3*.001);
  }
  for(let i=0;i<mossCount;i++){
   const g=GROVES[i%GROVES.length],theta=hash(i,161)*TAU,
      radius=10+Math.sqrt(hash(i,163))*103,
      x=clamp(g[0]+Math.cos(theta)*radius,-half*.94,half*.94),
      z=clamp(g[1]+Math.sin(theta)*radius,-half*.94,half*.94),
      width=2.4+hash(i,167)*7.3;
   groundPatch(moss,i,x,z,width,width*(.75+hash(i,169)*.45),
    [0x527747,0x5f7c45,0x466d43,0x6b8553][i%4],.019+i%3*.001);
  }
  const treePositions=[];
  const shades=[0x426c36,0x527b3f,0x657e42,0x385e38,0x6a8250,0x4b7138,0x748452];
  const bark=[0x66513d,0x584536,0x776248,0x514337,0x6b5745];
  let nearest=Infinity,groveTrees=0,perimeterTrees=0,deepCenterTrees=0;
  for(let i=0;i<trees;i++){
   const grove=GROVES[i%GROVES.length],lane=Math.floor(i/GROVES.length);
   const angle=hash(i,5)*TAU,spread=Math.sqrt(hash(i,7))*(37+hash(lane,6)*48);
   let x=grove[0]+Math.cos(angle)*spread;
   let z=grove[1]+Math.sin(angle)*spread;
   const edge=half*.93;
   x=clamp(x,-edge,edge);z=clamp(z,-edge,edge);
   // Maintain a clear 250-unit centre for the genuine G5.4 formations.
   const radius=Math.hypot(x,z);
   if(radius<258){const k=258/Math.max(1,radius);x*=k;z*=k}
   const yHeight=24+hash(i,11)*25;
   const width=8.0+hash(i,13)*8.5;
   const twist=hash(i,17)*TAU;
   const trunkWidth=.9+hash(i,19)*.55;
   put(stems,i,x,yHeight*.23,z,trunkWidth,yHeight*.46,trunkWidth,twist,bark[i%5]);
   if(i<broadCount){
    // Four overlapping lobes form rounded, irregular native-style trees,
    // not the old three identical pointed cones.
    for(let k=0;k<4;k++){
     const a=twist+TAU*k/4;
     const dx=k===0?0:Math.cos(a)*width*.42;
     const dz=k===0?0:Math.sin(a)*width*.42;
     const size=k===0?1.0:.72+hash(i,k+31)*.18;
     put(deciduous,i*4+k,x+dx,yHeight*(k===0?.73:.64+hash(k,i)*.12),z+dz,
      width*size,yHeight*.30*size,width*size,twist,shades[(i+k)%shades.length]);
    }
   }else{
    const p=i-broadCount;
    for(let k=0;k<3;k++){
     put(pine,p*3+k,x,yHeight*(.43+k*.22),z,
      width*[.95,.73,.50][k],yHeight*.42,width*[.95,.73,.50][k],twist,
      shades[(i+k*2)%shades.length]);
    }
   }
   treePositions.push([x,z]);
   nearest=Math.min(nearest,Math.hypot(x,z));
   if(Math.hypot(x,z)<600)groveTrees++;else perimeterTrees++;
   if(Math.hypot(x,z)<255)deepCenterTrees++;
  }
  for(let i=0;i<shrubs;i++){
   const grove=GROVES[i%GROVES.length],angle=hash(i,51)*TAU;
   const radius=28+Math.sqrt(hash(i,53))*119;
   const x=clamp(grove[0]+Math.cos(angle)*radius,-half*.95,half*.95);
   const z=clamp(grove[1]+Math.sin(angle)*radius,-half*.95,half*.95);
   const bulk=.6+hash(i,59)*1.4;
   put(bush,i,x,bulk*.42,z,bulk*1.24,bulk*.76,bulk,hash(i,61)*TAU,
     [0x4a743d,0x6c8644,0x5c7747,0x778b55,0x426a38][i%5]);
  }
  for(let i=0;i<flowers;i++){
   const x=(hash(i,101)*1.84-.92)*half,z=(hash(i,103)*1.84-.92)*half;
   const size=.8+hash(i,107)*1.6;
   put(wildflower,i,x,.29*size,z,size,size,size,hash(i,109)*TAU,
      [0x758b4c,0x9a9d60,0xb1ad72,0x6d8046,0x8b9261][i%5]);
  }
  for(let i=0;i<stones;i++){
   const grove=GROVES[i%GROVES.length],theta=hash(i,137)*TAU;
   const d=40+hash(i,139)*140;
   const x=clamp(grove[0]+Math.sin(theta)*d,-half*.95,half*.95);
   const z=clamp(grove[1]+Math.cos(theta)*d,-half*.95,half*.95);
   const size=.55+hash(i,141)*1.35;
   put(rocks,i,x,size*.17,z,size,size*.37,size*.9,hash(i,143)*TAU,
     [0x8e9180,0x777e72,0xa29d88,0x858779][i%4]);
  }
  meshes.forEach(m=>{
   m.instanceMatrix.needsUpdate=true;
   if(m.instanceColor)m.instanceColor.needsUpdate=true;
  });
  let disposed=false;
  return {
   root,treeCount:trees,bushCount:shrubs,flowerCount:flowers,
   forestFloorPatches:litterCount+mossCount,
   rockCount:stones,broadleafCount:broadCount,coniferCount:pineCount,
   batchCount:meshes.length,groveCount:GROVES.length,
   groveTrees,perimeterTrees,deepCenterTrees,nearestTreeDistance:nearest,
   minTreeClearance:nearest-half,nearEdgeTrees:groveTrees,outerTrees:perimeterTrees,
   visualOnly:true,
   dispose(){if(disposed)return;disposed=true;scene.remove(root);
    disposedResources.forEach(item=>item.dispose());}
  };
 }
 return Object.freeze({build});
})();
