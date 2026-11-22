/**
 * KTK VIS-20 / HIGH-FIDELITY CASTLE SIEGE, same original G5.4 FPS.
 *
 * Changes MATERIALS and visible children of the EXISTING native siege parts.
 * No original gameplay, damage, projectile, weapon, actor, navigation, physics,
 * collision, command, siege equipment authority or map transitions touched.
 *
 * Castle stonework, authentic timber and iron patina, battlements, siege-tower
 * cladding, wooden ram canopy, catapult ropes and muddy approach are VISUALS.
 */
const KTKNativeSiegeVisualV20=(()=>{
 'use strict';
 function hash(n){
  let x=n|0;
  x=Math.imul(x^(x>>>16),0x7feb352d);
  x=Math.imul(x^(x>>>15),0x846ca68b);
  return ((x^(x>>>16))>>>0)/4294967296;
 }
 function texture(THREE,doc,n,draw,repeatX=1,repeatY=1){
  const canvas=doc.createElement('canvas');
  canvas.width=n;canvas.height=n;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('V20: canvas 2D unavailable for physical-looking stone/timber surfaces');
  draw(ctx,n);
  const t=new THREE.CanvasTexture(canvas);
  if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=THREE.RepeatWrapping;
  t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(repeatX,repeatY);
  t.anisotropy=8;
  t.needsUpdate=true;
  return t;
 }
 function stone(ctx,n){
  ctx.fillStyle='#343639';ctx.fillRect(0,0,n,n);
  const cols=12,rows=10,w=n/cols,h=n/rows;
  for(let row=0;row<rows;row++){
   for(let col=-1;col<=cols;col++){
    const offset=(row%2)*w*.46;
    const x=col*w+offset+2,y=row*h+2;
    const variation=hash(row*127+col*79+43);
    const q=Math.round(183+variation*49);
    ctx.fillStyle='rgb('+q+','+(q-2)+','+(q-5)+')';
    ctx.fillRect(x,y,w-4,h-4);
    ctx.fillStyle='rgba(255,250,237,.15)';
    ctx.fillRect(x+2,y+2,w-9,2.3);
    ctx.fillStyle='rgba(35,31,30,.24)';
    ctx.fillRect(x+2,y+h-6,w-8,2.3);
    // Two naturally uneven weathering marks per individual stone.
    for(let k=0;k<2;k++){
     const rx=x+8+hash(row*241+col*71+k)*Math.max(1,w-20);
     const ry=y+6+hash(row*467+col*193+k)*Math.max(1,h-13);
     ctx.fillStyle='rgba(46,50,51,'+(.04+hash(row*31+col*17+k)*.08)+')';
     ctx.fillRect(rx,ry,2+hash(k+row*41)*8,1+hash(k+col*67)*5);
    }
   }
  }
 }
 function timber(ctx,n){
  ctx.fillStyle='#d8d3c9';ctx.fillRect(0,0,n,n);
  for(let i=0;i<22;i++){
   const x=i*n/22;
   const v=Math.round(209+hash(i*97+8)*39);
   ctx.fillStyle='rgb('+v+','+Math.max(0,v-3)+','+Math.max(0,v-10)+')';
   ctx.fillRect(x+1,0,n/22-2,n);
   ctx.fillStyle='rgba(59,45,33,.16)';
   ctx.fillRect(x+n/22-2,0,2,n);
   for(let j=0;j<8;j++){
    const py=(j+hash(i*211+j*89))*n/8;
    ctx.fillStyle='rgba(64,47,32,'+(.055+hash(i*317+j*37)*.11)+')';
    ctx.fillRect(x+3+hash(i*47+j*17)*(n/22-9),py,1,19+hash(i*59+j*73)*48);
   }
   if(i%3===0){
    const y=80+hash(i*13+7)*(n-160);
    ctx.beginPath();
    ctx.ellipse(x+n/44,y,3,11,0,0,Math.PI*2);
    ctx.fillStyle='rgba(72,52,37,.22)';ctx.fill();
   }
  }
 }
 function earth(ctx,n){
  ctx.fillStyle='#b2b8a4';ctx.fillRect(0,0,n,n);
  for(let i=0;i<1250;i++){
   const x=hash(i*71+11)*n,y=hash(i*113+9)*n;
   const r=3+hash(i*23+4)*21;
   ctx.fillStyle=i%7===0?'rgba(81,65,49,.08)':
     i%4===0?'rgba(71,99,56,.12)':'rgba(228,216,182,.055)';
   ctx.beginPath();ctx.ellipse(x,y,r,r*(.35+hash(i*7+2)*.6),0,0,Math.PI*2);ctx.fill();
  }
  for(let i=0;i<3;i++){
   const x=n*(.30+i*.17);
   ctx.fillStyle='rgba(62,51,36,.07)';
   ctx.fillRect(x,0,n*.025,n);
  }
 }
 function block(THREE,parent,x,y,z,w,h,d,mat){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  mesh.name='KTK_VIS20_COSMETIC_NO_COLLIDER';
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;
  parent.add(mesh);return mesh;
 }
 function wheelHub(THREE,parent,x,y,z,r,material){
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*.24,r*.24,.42,12),material);
  hub.rotation.z=Math.PI/2;
  hub.position.set(x,y,z);hub.castShadow=true;
  parent.add(hub);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(r*.57,r*.055,7,16),material);
  ring.rotation.y=Math.PI/2;
  ring.position.set(x+(x>=0?.20:-.20),y,z);
  parent.add(ring);
  return 2;
 }
 function install(THREE,doc,parts,o){
  if(!THREE||!doc||!parts||!o||
      !o.stone||!o.gateMat||!o.wood||!o.towerWood||
      !o.approach||!o.ram||!o.catapult||!o.tower||
      !o.bridge||!o.gate||!o.catapultArm)
   throw Error('V20 requires real original G5.4 siege parts / genuine equipment');
  if(parts.userData?.ktkSiegeVisualV20)
   return parts.userData.ktkSiegeVisualV20;
  const stoneMap=texture(THREE,doc,512,stone,3,1);
  const gateMap=texture(THREE,doc,512,timber,1.8,1);
  const woodMap=texture(THREE,doc,512,timber,1.2,1.4);
  const towerMap=texture(THREE,doc,512,timber,1,2);
  const groundMap=texture(THREE,doc,768,earth,1,1);
  for(const [material,map,bump] of [
   [o.stone,stoneMap,.065],[o.gateMat,gateMap,.055],
   [o.wood,woodMap,.05],[o.towerWood,towerMap,.05],
   [o.approach.material,groundMap,.02]]){
   material.map=map;material.bumpMap=map;material.bumpScale=bump;
   material.needsUpdate=true;
  }
  const borderMat=new THREE.MeshStandardMaterial({
   color:0x85878a,map:stoneMap,roughness:.94,metalness:0});
  const lightStone=new THREE.MeshStandardMaterial({
   color:0x999595,map:stoneMap,roughness:.96});
  const timberMat=new THREE.MeshStandardMaterial({
   color:0x95724d,map:woodMap,roughness:.94});
  const iron=new THREE.MeshStandardMaterial({
   color:0x4c5358,metalness:.55,roughness:.64});
  const rope=new THREE.MeshStandardMaterial({
   color:0x857257,roughness:1});
  const bannerMat=new THREE.MeshStandardMaterial({
   color:0x8c342d,side:THREE.DoubleSide,roughness:.93});

  let stoneTrim=0,gateTrim=0,ramTrim=0,catTrim=0,towerTrim=0,tracks=0;

  // Original southern gate occupies X [-8,8], wall faces are Z=-44.5.
  // Relief details sit against the EXISTING solid wall, never pretending
  // to create a new passage/blocker inside the walkable siege courtyard.
  for(const x of [-40,-32,-24,-16,16,24,32,40]){
   block(THREE,parts,x,3.15,-44.59,.47,6.0,.17,borderMat);
   block(THREE,parts,x,6.45,-44.70,.84,.22,.35,lightStone);
   stoneTrim+=2;
  }
  for(const x of [-9.55,9.55]){
   block(THREE,parts,x,3.45,-44.72,1.8,6.9,.4,lightStone);
   block(THREE,parts,x,7.15,-44.72,2.2,.42,.55,borderMat);
   stoneTrim+=2;
  }
  block(THREE,parts,0,7.34,-44.64,17.2,.68,.74,lightStone);stoneTrim++;
  for(let i=0;i<9;i++){
   const x=-7.25+i*1.81;
   block(THREE,parts,x,7.78,-44.70,1.75,.22,.48,borderMat);
   stoneTrim++;
  }
  for(const x of [-42,-38,-34,-30,-26,-22,-18,-14,-10,10,14,18,22,26,30,34,38,42]){
   // A raised cap strip on the true 7 m wall; no extra standing area,
   // solid collision or false cover for native G5.4 hitscans.
   block(THREE,parts,x,7.10,-44.53,3.35,.19,.50,lightStone);
   stoneTrim++;
  }

  // All door cosmetics are attached to the live gate mesh; whenever the
  // real gate's 600 HP reaches zero, the entire assembly hides immediately.
  for(const x of [-3.85,3.85]){
   for(const y of [-2.05,.18,2.23]){
    block(THREE,o.gate,x,y,-2.81,1.8,.16,.15,iron);
    gateTrim++;
   }
   const handle=new THREE.Mesh(new THREE.TorusGeometry(.39,.09,8,20),iron);
   handle.name='KTK_VIS20_GATE_RING_FOLLOWS_ACTUAL_GATE';
   handle.position.set(x*.22,-.10,-2.95);
   o.gate.add(handle);gateTrim++;
   block(THREE,o.gate,x*.22,-.72,-2.85,.11,.45,.16,iron);gateTrim++;
  }
  for(const x of [-5.5,-2.75,0,2.75,5.5]){
   block(THREE,o.gate,x,-2.5,-2.87,.28,.19,.18,iron);gateTrim++;
  }
  for(const y of [-2.1,2.15]){
   for(const x of [-6.7,-4.7,-2.7,-.7,.7,2.7,4.7,6.7]){
    block(THREE,o.gate,x,y,-2.91,.17,.17,.16,iron);gateTrim++;
   }
  }

  // Match the actual native moving ram's roof: timber shingles cover its
  // original broad metal slab; no mesh is appended to ram collision data.
  for(let i=0;i<13;i++){
   const z=-2.45+i*.40;
   const plank=block(THREE,o.ram,0,2.645,z,3.65,.12,.36,
    i%3===0?timberMat:o.wood);
   plank.rotation.y=((i%3)-1)*.017;
   ramTrim++;
  }
  for(const x of [-1.68,1.68]){
   for(const z of [-2.0,2.0]){
    block(THREE,o.ram,x,1.5,z,.18,2.0,.18,timberMat);ramTrim++;
    ramTrim+=wheelHub(THREE,o.ram,x*1.02,.8,z,.75,iron);
   }
   const brace=block(THREE,o.ram,x,1.65,0,.19,2.9,.19,timberMat);
   brace.rotation.x=x>0?.30:-.30;ramTrim++;
  }
  for(const z of [-2.40,2.40]){
   block(THREE,o.ram,0,2.76,z,3.83,.16,.17,iron);ramTrim++;
  }

  // The authentic catapult launch arm rotates by the existing damage/physics
  // state; the leather sling added to it is a child of THAT real arm.
  for(const x of [-1.85,1.85]){
   for(const z of [-1.8,1.8]){
    catTrim+=wheelHub(THREE,o.catapult,x,.75,z,.68,iron);
   }
   const brace=block(THREE,o.catapult,x,2.1,0,.16,2.95,.18,timberMat);
   brace.rotation.x=x>0?.29:-.29;catTrim++;
  }
  const sling=new THREE.Mesh(
   new THREE.SphereGeometry(.62,12,7,0,Math.PI*2,0,Math.PI*.58),
   new THREE.MeshStandardMaterial({color:0x604533,side:THREE.DoubleSide,roughness:1}));
  sling.rotation.x=Math.PI;
  sling.position.set(0,.28,2.36);
  sling.scale.set(1,.28,1);sling.name='KTK_VIS20_AUTHENTIC_ARM_SLING';
  o.catapultArm.add(sling);catTrim++;
  for(const x of [-.36,.36]){
   block(THREE,o.catapultArm,x,.22,1.99,.065,.075,1.18,rope);catTrim++;
  }
  for(const z of [-2,2]){
   block(THREE,o.catapult,0,2.65,z,3.35,.18,.18,rope);catTrim++;
  }
  for(const x of [-1.63,1.63]){
   const timberBrace=block(THREE,o.catapult,x,1.60,.25,.19,2.6,.18,timberMat);
   timberBrace.rotation.x=x>0?.40:-.40;catTrim++;
  }
  for(const z of [-1.65,1.65]){
   block(THREE,o.catapult,0,2.48,z,3.6,.17,.18,iron);catTrim++;
  }

  // The same real climbable 8-m siege tower, not a replacement fake tower.
  // Only side faces are clad. The soldier ramp and bridge central lane remain
  // entirely OPEN; the native side collision beams already exist at x=±2.1.
  for(const side of [-1,1]){
   for(let i=0;i<10;i++){
    const y=1.30+i*.67;
    const plank=block(THREE,o.tower,side*2.22,y,0,.14,.58,3.95,
     i%4===0?timberMat:o.towerWood);
    plank.rotation.x=(i%3-1)*.014;towerTrim++;
   }
   for(const z of [-1.85,1.85]){
    const brace=block(THREE,o.tower,side*2.27,4,z,.17,7.0,.17,timberMat);
    brace.rotation.z=side*.15;towerTrim++;
    towerTrim+=wheelHub(THREE,o.tower,side*2.15,.78,z,.70,iron);
   }
   const banner=new THREE.Mesh(new THREE.PlaneGeometry(1.65,2.25),bannerMat);
   banner.position.set(side*2.305,5.15,0.3);
   banner.rotation.y=side*Math.PI/2;
   banner.name='KTK_VIS20_SIEGE_TOWER_BANNER';
   o.tower.add(banner);towerTrim++;
   block(THREE,o.tower,side*2.24,8.60,0,.21,.72,4.1,iron);towerTrim++;
  }
  for(const z of [-1.9,1.9]){
   block(THREE,o.tower,0,8.35,z,4.3,.16,.26,iron);towerTrim++;
  }
  for(const side of [-1,1]){
   for(const z of [-1.40,1.40]){
    const tie=block(THREE,o.tower,side*2.28,4.20,z,.18,7.35,.15,timberMat);
    tie.rotation.x=z>0?.33:-.33;towerTrim++;
   }
  }

  // Wheel ruts drawn on the terrain itself. Both are visually low,
  // incapable of stopping/rerouting men or intercepting cannon shot.
  const rutMaterial=new THREE.MeshBasicMaterial({
   color:0x584b33,transparent:true,opacity:.33,depthWrite:false});
  for(const [x,z,width,length] of [
   [-1.38,-92,.63,72],[1.38,-92,.63,72],
   [-23.5,-92,.54,37],[-20.6,-92,.54,37]]){
   const track=new THREE.Mesh(new THREE.PlaneGeometry(width,length),rutMaterial);
   track.rotation.x=-Math.PI/2;
   track.position.set(x,-.021,z);
   track.name='KTK_VIS20_DECORATIVE_WHEEL_RUT_NO_COLLISION';
   parts.add(track);tracks++;
  }
  const result={
   installed:true,textureMaps:5,
   wallTrimCount:stoneTrim,gateTrimCount:gateTrim,
   ramTrimCount:ramTrim,catapultTrimCount:catTrim,
   towerTrimCount:towerTrim,groundWheelTracks:tracks,
   authenticGateMesh:o.gate,authenticTower:o.tower,
   authenticRam:o.ram,authenticCatapult:o.catapult,
   authenticCatapultArm:o.catapultArm,
   noColliders:true,noProjectileTargets:true,noNewSoldiers:true,
   originalBattleEngine:true
  };
  parts.userData=parts.userData||{};
  parts.userData.ktkSiegeVisualV20=result;
  return result;
 }
 return Object.freeze({install});
})();
