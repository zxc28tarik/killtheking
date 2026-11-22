/* V19 visual-only nature: forest outside physical square; low shrubs and flowers inside. */
const KTKMeadowNatureV19=(function(){
 'use strict';
 const hash=(a,b)=>{let n=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^0x4b1d7;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 function build(THREE,scene,spec){
  if(!THREE?.InstancedMesh||!scene?.add||!(spec?.half>0))throw Error('V19 nature scene missing');
  const half=spec.half,root=new THREE.Group();root.name='KTK_V19_NATURE_VISUAL_ONLY';scene.add(root);
  const resources=[],meshes=[],dummy=new THREE.Object3D(),color=x=>new THREE.Color(x);
  function batch(name,geo,mat,count){
   const mesh=new THREE.InstancedMesh(geo,mat,count);
   mesh.name=name;mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;
   root.add(mesh);resources.push(geo,mat);meshes.push(mesh);return mesh;
  }
  function put(mesh,id,x,y,z,sx,sy,sz,rot,hex){
   dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);
   dummy.rotation.set(0,rot,0);dummy.updateMatrix();
   mesh.setMatrixAt(id,dummy.matrix);mesh.setColorAt(id,color(hex));
  }
  const trees=250,shrubs=860,flowers=1050;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(2*(half+235),2*(half+235)),
   new THREE.MeshStandardMaterial({color:0x526a36,roughness:1,metalness:0}));
  ground.name='KTK_V19_OUTER_GRASSLAND_SKIRT';ground.rotation.x=-Math.PI/2;
  ground.position.y=-.19;ground.receiveShadow=true;root.add(ground);
  resources.push(ground.geometry,ground.material);
  const trunk=batch('KTK_V19_TREE_TRUNKS',new THREE.CylinderGeometry(.65,1,1,6),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),trees);
  const canopy=batch('KTK_V19_TREE_CROWNS',new THREE.ConeGeometry(1,1,6),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide}),trees*3);
  let minTreeClearance=Infinity;
  for(let i=0;i<trees;i++){
   const side=i%4,t=(hash(i,1)*1.98-.99)*half,off=i<64?(-half*.34+hash(i,2)*half*.13):(24+hash(i,2)*184);
   const x=side<2?t:(side===2?half+off:-(half+off));
   const z=side<2?(side===0?half+off:-(half+off)):t;
   minTreeClearance=Math.min(minTreeClearance,Math.max(Math.abs(x),Math.abs(z))-half);
   const h=19+hash(i,3)*19,w=3.6+hash(i,4)*3.7,rot=hash(i,5)*6.283;
   const bark=[0x67513b,0x544536,0x776048,0x5c4a39][i%4];
   put(trunk,i,x,h*.24,z,.8+hash(i,6)*.35,h*.48,.8+hash(i,6)*.35,rot,bark);
   for(let l=0;l<3;l++)put(canopy,i*3+l,x,h*(.40+l*.20),z,w*[1,.8,.56][l],
    h*.38,w*[1,.8,.56][l],rot+hash(i+l,7)*.4,
    [0x466c3a,0x577740,0x385e32,0x6b7d48,0x42653e][i%5]);
  }
  const bush=batch('KTK_V19_LOW_HERBS',new THREE.IcosahedronGeometry(1,0),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true}),shrubs);
  for(let i=0;i<shrubs;i++){
   const x=(hash(i,31)*1.9-.95)*half,z=(hash(i,37)*1.9-.95)*half,bulk=.35+hash(i,41)*.8;
   put(bush,i,x,bulk*.32,z,bulk,bulk*.54,bulk*.9,hash(i,43)*6.28,
    [0x5f7c43,0x668449,0x788750,0x4e713e,0x79895b][i%5]);
  }
  const tuft=batch('KTK_V19_WILDFLOWER_TUFTS',new THREE.ConeGeometry(.25,.65,4),
   new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide}),flowers);
  for(let i=0;i<flowers;i++){
   const x=(hash(i,101)*1.9-.95)*half,z=(hash(i,103)*1.9-.95)*half,sz=.7+hash(i,107)*.9;
   put(tuft,i,x,.19*sz,z,sz,sz,sz,hash(i,109)*6.28,
    [0x758b4c,0x9a9d60,0xb1ad72,0x6d8046,0x8b9261][i%5]);
  }
  meshes.forEach(m=>{m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;});
  let disposed=false;
  return {root,treeCount:trees,bushCount:shrubs,flowerCount:flowers,batchCount:meshes.length,
   minTreeClearance,nearEdgeTrees:64,outerTrees:186,visualOnly:true,
   dispose(){if(disposed)return;disposed=true;scene.remove(root);resources.forEach(o=>o.dispose());}};
 }
 return Object.freeze({build});
})();
