/**
 * AK-SIEGE-25 — TRUE TWO-SIDED SIEGE. This augments the SAME original 3-map FPS.
 *
 * The old inner keep, physical gate, ram, catapult, tower, F6–F10 commands,
 * original 140 G5.4 soldiers and their AI remain the authorities.
 * The siege-only castle grows to an outer enceinte 224 × 228.5 (4.23x the
 * original 110 × 110 castle floor). The playable field grows from the original
 * 220 × 220 siege navigation region to 624 × 624 (8.04x area).
 *
 * Outer walls, north-bailey postern, barracks are REAL collidable world cover;
 * vegetation, crenellations, flags and dirt details are cosmetic.
 * The separate FFA castle and the Meadow are never resized.
 */
const KTKSiegeExpansionV25=(()=>{
 'use strict';
 const FIELD_HALF=312;
 const FORT_HALF_X=112;
 const FRONT=-44.5;
 const REAR=184;
 const ORIGINAL_CASTLE_SIDE=110;
 const ORIGINAL_SIEGE_SIDE=220;
 const CASTLE_WIDTH=FORT_HALF_X*2;
 const CASTLE_DEPTH=REAR-FRONT;
 const FIELD_SIDE=FIELD_HALF*2;
 const AREA_FACTOR=CASTLE_WIDTH*CASTLE_DEPTH/(ORIGINAL_CASTLE_SIDE**2);
 const MAP_FACTOR=FIELD_SIDE**2/(ORIGINAL_SIEGE_SIDE**2);
 function hash(n){
  let x=n|0;
  x=Math.imul(x^(x>>>16),0x7feb352d);
  x=Math.imul(x^(x>>>15),0x846ca68b);
  return ((x^(x>>>16))>>>0)/4294967296;
 }
 function install(THREE,doc,parts,makeMesh,makeBox,materials){
  if(!THREE||!parts||!makeMesh||!makeBox||!materials?.stone)throw Error('AK25: original siege geometry required');
  const root=new THREE.Group();
  root.name='AK25_REAL_FORTIFIED_OUTER_CASTLE_AND_EIGHTFOLD_FIELD';
  parts.add(root); // nativeSiegeParts is hidden in original FFA and Meadow
  const stone=materials.stone;
  const wood=materials.wood;
  const gate=materials.gate;
  const roof=new THREE.MeshStandardMaterial({color:0x4b342d,roughness:.90});
  const flagBlue=new THREE.MeshStandardMaterial({color:0x21496b,roughness:.85,side:THREE.DoubleSide});
  const flagRed=new THREE.MeshStandardMaterial({color:0x852e32,roughness:.85,side:THREE.DoubleSide});
  const groundCanvas=doc.createElement('canvas');
  groundCanvas.width=256;groundCanvas.height=256;
  const g=groundCanvas.getContext('2d');
  if(!g)throw Error('AK25: ground texture needs canvas context');
  g.fillStyle='#777c52';g.fillRect(0,0,256,256);
  for(let i=0;i<2600;i++){
   const x=hash(i*57+9)*256,y=hash(i*131+47)*256;
   const p=hash(i*211+6);
   g.fillStyle=p>.66?'rgba(211,198,132,.10)':p>.33?'rgba(46,72,36,.12)':'rgba(112,85,60,.08)';
   g.fillRect(x,y,1+hash(i*19+5)*12,1+hash(i*23+7)*7);
  }
  const tex=new THREE.CanvasTexture(groundCanvas);
  if(THREE.SRGBColorSpace)tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(18,18);tex.anisotropy=4;tex.needsUpdate=true;
  const dirtMat=new THREE.MeshStandardMaterial({color:0x9ba57c,map:tex,roughness:1});
  const field=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_SIDE,FIELD_SIDE),dirtMat);
  field.rotation.x=-Math.PI/2;field.position.set(0,-.105,0);
  field.receiveShadow=true;field.name='AK25_EIGHTFOLD_SIEGE_FIELD';
  root.add(field);
  // A clearly readable approach to the real inner gate, not a second breach.
  const approachMat=new THREE.MeshStandardMaterial({color:0x786b50,roughness:1});
  const road=new THREE.Mesh(new THREE.PlaneGeometry(14,198),approachMat);
  road.rotation.x=-Math.PI/2;road.position.set(0,-.075,-209);
  road.receiveShadow=true;root.add(road);
  // Within the expanded castle, walkable north and side baileys surround
  // the original inner keep. Its north wall gets a 16m physical postern.
  const court=new THREE.Mesh(new THREE.PlaneGeometry(CASTLE_WIDTH-12,CASTLE_DEPTH-11),
   new THREE.MeshStandardMaterial({color:0x929077,roughness:1,map:tex}));
  court.rotation.x=-Math.PI/2;court.position.set(0,-.060,(FRONT+REAR)/2);
  court.receiveShadow=true;root.add(court);
  // Original castle's ground lies on y=0; both new planes stay below it.
  const boxes=[],physicalMeshes=[];
  function solid(x,y,z,w,h,d,material=stone){
   const mesh=makeMesh(root,x,y,z,w,h,d,material);
   const collision=makeBox(x,y,z,w,h,d);
   boxes.push(collision);physicalMeshes.push(mesh);return mesh;
  }
  function decor(x,y,z,w,h,d,material=stone){return makeMesh(root,x,y,z,w,h,d,material)}
  const wallH=9,wallY=wallH/2,wallThick=5;
  // Extensions connect to the original SOUTH curtain at x=±44.
  // The ORIGINAL 16-metre gate and its 600 HP breach remain untouched.
  solid(-78,wallY,-42,68,wallH,wallThick);
  solid( 78,wallY,-42,68,wallH,wallThick);
  // Outer west, east and north walls: full 224 x 228.5 fort perimeter.
  solid(-112,wallY,71,wallThick,wallH,226);
  solid( 112,wallY,71,wallThick,wallH,226);
  solid(0,wallY,184,224,wallH,wallThick);
  // Inner keep NORTH postern; real soldiers can reach the expanded rear bailey.
  solid(-26,3.5,42,36,7,5);
  solid( 26,3.5,42,36,7,5);
  // The outer curtain's four large corner towers are physical defenses.
  for(const x of [-112,112])for(const z of [-42,184]){
   solid(x,7.5,z,13,15,13);
   decor(x,15.45,z,15,1.0,15,gate);
   const cone=new THREE.Mesh(new THREE.ConeGeometry(10.7,7.2,4),roof);
   cone.position.set(x,19.5,z);cone.rotation.y=Math.PI/4;root.add(cone);
  }
  // Stone crenellations. Low raised blocks do not obstruct passage below:
  // the top of existing walls is at 9m, ground movement is still a real AABB.
  let merlons=0;
  for(let x=-105;x<=105;x+=9){
   for(const z of [-42,184]){
    if(z===-42&&Math.abs(x)<12)continue;
    decor(x,10.25,z,4.5,2.5,1.6);
    merlons++;
   }
  }
  for(let z=-30;z<178;z+=9){
   for(const x of [-112,112]){decor(x,10.25,z,1.6,2.5,4.5);merlons++;}
  }
  // Real cover in the new bailey, with broad lanes for defense and flanks.
  for(const [x,z,w,d] of [[-72,79,23,17],[72,79,23,17],[-73,131,20,16],[73,131,20,16]]){
   solid(x,4.25,z,w,8.5,d,wood);
   const r=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.76,5.5,4),roof);
   r.position.set(x,11.25,z);r.rotation.y=Math.PI/4;root.add(r);
   decor(x,6,z+d/2+.22,4.2,3.2,.3,gate);
  }
  // Covered flag poles signal defenders within the perimeter and attackers
  // beyond the south wall; they do not alter G5.4 team identity or authority.
  const flagPositions=[[-86,-23,'red'],[86,-23,'red'],[-86,168,'red'],[86,168,'red'],
    [-48,-115,'blue'],[48,-115,'blue']];
  for(const [x,z,color] of flagPositions){
   decor(x,5,z,.24,10,.24,wood);
   decor(x+1.6,8,z,3.0,2.9,.16,color==='blue'?flagBlue:flagRed);
  }
  // Two low roads through the newly walkable rear bailey.
  const roadStone=new THREE.MeshStandardMaterial({color:0xa29a7e,roughness:1});
  for(const x of [-48,48]){
   const lane=new THREE.Mesh(new THREE.PlaneGeometry(8,107),roadStone);
   lane.rotation.x=-Math.PI/2;lane.position.set(x,-.049,116);
   root.add(lane);
  }
  // Distant instanced trees make the genuinely eightfold field recognizable;
  // all trees are away from the entire castle and central assault corridor.
  // The castle itself is NOT merely scaled artwork: its walls are colliders.
  const forestPositions=[];
  for(let i=0;i<160;i++){
   const side=i%2===0?-1:1;
   const x=side*(143+hash(i*179+23)*149);
   const z=-276+hash(i*307+91)*544;
   if(Math.abs(z)<193&&Math.abs(x)<135)continue;
   forestPositions.push({x,z,scale:.76+hash(i*17+3)*.90});
  }
  const trunkMat=new THREE.MeshStandardMaterial({color:0x67523a,roughness:1});
  const crownMat=new THREE.MeshStandardMaterial({color:0x354e34,roughness:1});
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.8,1.0,5.3,5),
   trunkMat,forestPositions.length);
  const crowns=new THREE.InstancedMesh(new THREE.ConeGeometry(4.6,10,6),
   crownMat,forestPositions.length);
  const dummy=new THREE.Object3D();
  for(let i=0;i<forestPositions.length;i++){
   const p=forestPositions[i];
   dummy.position.set(p.x,2.5*p.scale,p.z);
   dummy.scale.setScalar(p.scale);dummy.rotation.set(0,hash(i*37+19)*Math.PI*2,0);dummy.updateMatrix();
   trunks.setMatrixAt(i,dummy.matrix);
   dummy.position.set(p.x,10*p.scale,p.z);dummy.updateMatrix();
   crowns.setMatrixAt(i,dummy.matrix);
  }
  trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;
  trunks.name='AK25_EIGHTFOLD_FIELD_TREES_TRUNKS';
  crowns.name='AK25_EIGHTFOLD_FIELD_TREES_CANOPIES';
  root.add(trunks,crowns);
  if(!(AREA_FACTOR>=4&&MAP_FACTOR>=8))throw Error('AK25 required castle/map growth not achieved');
  return Object.freeze({
   root,wallBoxes:boxes,solidMeshes:physicalMeshes,
   castleWidth:CASTLE_WIDTH,castleDepth:CASTLE_DEPTH,
   fieldSide:FIELD_SIDE,castleAreaFactor:AREA_FACTOR,mapAreaFactor:MAP_FACTOR,
   staticSolidCount:boxes.length,forestTrees:forestPositions.length,
   merlons,posternWidth:16,
   noAlternateSiegeEngine:true
  });
 }
 function deployment(state,playerPos){
  if(!state)return null;
  const blue=state.soldiers.filter(u=>u.team==='blue');
  const red=state.soldiers.filter(u=>u.team==='red');
  const inCastle=u=>Math.abs(u.x)<FORT_HALF_X-4&&u.z>FRONT+1&&u.z<REAR-4;
  const outsideSouth=u=>u.z<FRONT-7;
  const physical=(arr,pred)=>arr.filter(pred).length;
  return {
   soldiers:state.soldiers.length,blue:blue.length,red:red.length,
   blueOutside:physical(blue,outsideSouth),redInside:physical(red,inCastle),
   blueInside:physical(blue,inCastle),redOutside:physical(red,outsideSouth),
   playerOutside:!!playerPos&&outsideSouth(playerPos),
   attackerTeam:'blue',defenderTeam:'red',
   gateLine:FRONT,fortressHalfX:FORT_HALF_X,fortressNorthZ:REAR,
   allDefendersInside:physical(red,inCastle)===red.length,
   allAttackersOutside:physical(blue,outsideSouth)===blue.length
  };
 }
 return Object.freeze({install,deployment,
  FIELD_HALF,CASTLE_WIDTH,CASTLE_DEPTH,FIELD_SIDE,AREA_FACTOR,MAP_FACTOR});
})();