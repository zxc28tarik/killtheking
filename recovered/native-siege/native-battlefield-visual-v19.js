/**
 * Kill the King / VIS-19: original native G5.4 battlefield visual layers.
 * Purely cosmetic. No new colliders / worldMeshes / ray targets / soldier
 * mutations / bot logic / new game. The original Krunker arena remains intact.
 */
const KTKBattlefieldVisualV19=(()=>{
 'use strict';
 const STYLE_ID='ktk-v19-native-battlefield-hud';
 const CSS=[
 'body.ktk-native-battle-ui #hud > div:first-child > div:nth-child(2){display:none!important}',
 'body.ktk-native-battle-ui #hud > div:first-child > div:first-child > div:last-child > div:last-child{display:none!important}',
 'body.ktk-native-battle-ui #hud > div:last-child > div:first-child > div:first-child{display:none!important}',
 'body.ktk-native-battle-ui #hud > div:first-child > div:first-child{gap:7px!important}',
 'body.ktk-native-battle-ui #hud > div:first-child > div:first-child .hud-box{background:rgba(8,17,24,.89)!important;border-color:rgba(194,171,117,.43)!important;box-shadow:0 5px 16px rgba(0,0,0,.33)!important}',
 'body.ktk-native-battle-ui #hud #radar-canvas{width:84px!important;height:84px!important}',
 'body.ktk-native-battle-ui #meadow-army-hud.ktk-siege-slim{top:153px!important;bottom:auto!important;left:12px!important;width:min(310px,calc(100vw - 24px))!important;max-width:min(310px,calc(100vw - 24px))!important;max-height:108px!important;background:rgba(10,20,23,.9)!important;border:1px solid rgba(155,190,151,.54)!important;border-radius:9px!important;box-shadow:0 8px 20px rgba(0,0,0,.35)!important;backdrop-filter:blur(5px);z-index:36!important}',
 'body.ktk-native-battle-ui #meadow-army-hud.ktk-siege-slim>div:first-child{font-size:11px!important;color:#d9e8cd!important}',
 'body.ktk-native-battle-ui #native-siege-panel.ktk-siege-slim{top:100px!important;right:12px!important;max-width:min(288px,calc(100vw - 24px))!important;background:rgba(15,20,25,.92)!important;border:1px solid rgba(190,168,111,.58)!important;box-shadow:0 8px 20px rgba(0,0,0,.3)!important;backdrop-filter:blur(5px)}',
 'body.ktk-native-battle-ui #hud>div:last-child .hud-box{background:rgba(8,16,22,.89)!important;box-shadow:0 5px 17px rgba(0,0,0,.4)!important}',
 '@media(max-width:780px){body.ktk-native-battle-ui #meadow-army-hud.ktk-siege-slim{top:133px!important;max-height:92px!important}body.ktk-native-battle-ui #native-siege-panel.ktk-siege-slim{top:60px!important;max-height:75px!important}}',
 '@media(max-width:570px){body.ktk-native-battle-ui #meadow-army-hud.ktk-siege-slim{top:141px!important;max-width:min(260px,70vw)!important}body.ktk-native-battle-ui #native-siege-panel.ktk-siege-slim{right:6px!important;max-width:42vw!important;font-size:10px!important}}'
 ].join('\n');
 function installHud(doc){
  if(doc.getElementById(STYLE_ID))return false;
  const style=doc.createElement('style');style.id=STYLE_ID;
  style.textContent=CSS;doc.head.appendChild(style);return true;
 }
 function setBattleUi(doc,active){
  doc?.body?.classList?.toggle('ktk-native-battle-ui',!!active);
 }
 function hash(n){
  let x=n|0;x=Math.imul(x^(x>>>16),0x7feb352d);
  x=Math.imul(x^(x>>>15),0x846ca68b);
  return ((x^(x>>>16))>>>0)/4294967296;
 }
 function addMeadowGroves(THREE,scene,spec){
  const half=Number(spec.half);
  if(!Number.isFinite(half)||half<400)throw Error('V19 needs the original large meadow');
  const count=180,group=new THREE.Group();
  group.name='KTK_V19_NATIVE_MEADOW_OUTER_GROVES_VISUAL_ONLY';
  const trunk=new THREE.InstancedMesh(
   new THREE.CylinderGeometry(.23,.42,1,5),
   new THREE.MeshLambertMaterial({color:0x80664a}),count);
  const crown=new THREE.InstancedMesh(
   new THREE.ConeGeometry(1,1,7),
   new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),count);
  const crownTop=new THREE.InstancedMesh(
   new THREE.ConeGeometry(1,1,7),
   new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true}),count);
  const centers=[
   [-.73,-.42],[-.80,.08],[-.70,.48],[-.44,.72],
   [.58,-.64],[.83,-.20],[.78,.36],[.42,.76],
   [-.25,-.83],[.19,-.83],[-.15,.85],[.28,.82]
  ];
  const bound=half*.86,o=new THREE.Object3D(),color=new THREE.Color();
  let nearest=Infinity;
  for(let i=0;i<count;i++){
   const center=centers[Math.floor(i/15)];
   const x=Math.max(-bound,Math.min(bound,center[0]*half+(hash(i*19+4)-.5)*110));
   const z=Math.max(-bound,Math.min(bound,center[1]*half+(hash(i*31+12)-.5)*110));
   nearest=Math.min(nearest,Math.hypot(x,z));
   const size=6+hash(i*71+1)*5.5;
   const lean=(hash(i*13+5)-.5)*.07;
   o.rotation.set(0,(hash(i*17+8)-.5)*5,lean);
   o.position.set(x,size*.20,z);o.scale.set(size*.105,size*.40,size*.105);
   o.updateMatrix();trunk.setMatrixAt(i,o.matrix);
   o.rotation.set(0,hash(i*73+6)*6,lean);
   o.position.set(x,size*.61,z);o.scale.set(size*.42,size*.58,size*.42);
   o.updateMatrix();crown.setMatrixAt(i,o.matrix);
   o.position.set(x,size*.87,z);o.scale.set(size*.32,size*.54,size*.32);
   o.updateMatrix();crownTop.setMatrixAt(i,o.matrix);
   const h=.27+hash(i*127+12)*.055;
   color.setHSL(h,.28+hash(i*103+3)*.13,.26+hash(i*109+9)*.095);
   crown.setColorAt(i,color);
   color.setHSL(h+.006,.30,.34+hash(i*17+20)*.08);
   crownTop.setColorAt(i,color);
  }
  for(const mesh of [trunk,crown,crownTop]){
   mesh.instanceMatrix.needsUpdate=true;
   mesh.frustumCulled=false;
   mesh.castShadow=false;mesh.receiveShadow=false;
   group.add(mesh);
  }
  scene.add(group);
  return {group,trees:count,drawBatches:3,minDistanceFromCenter:nearest,
   decorativeOnly:true,noColliders:true};
 }
 function dressSiegeGate(THREE,siegeParts,gate){
  const wood1=new THREE.MeshStandardMaterial({color:0x826040,roughness:.92});
  const wood2=new THREE.MeshStandardMaterial({color:0x62452f,roughness:.92});
  const iron=new THREE.MeshStandardMaterial({color:0x34363a,metalness:.48,roughness:.63});
  let gateDetails=0;
  function beam(parent,x,y,z,w,h,d,mat){
   const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
   m.position.set(x,y,z);m.castShadow=false;
   parent.add(m);gateDetails++;return m;
  }
  // Gate dressing is a child of the *real native mesh*. When the original
  // siege opens the gate, it and all visual additions disappear together.
  for(let i=0;i<9;i++)
   beam(gate,-6.98+i*1.74,0,-2.58,1.65,6.83,.13,i%2?wood1:wood2);
  for(const y of [-2.18,.05,2.25])
   beam(gate,0,y,-2.69,15.1,.18,.20,iron);
  for(const x of [-7.5,7.5])
   beam(gate,x,0,-2.7,.22,6.9,.22,iron);
  for(const y of [-2.18,2.25])
   for(let i=0;i<9;i++)
    beam(gate,-6.98+i*1.74,y,-2.82,.16,.16,.12,iron);
  // Mortar joints across genuine front-wall surfaces, just one instanced
  // rendering batch. No additions to raycast worldMeshes or nav colliders.
  const courses=[];
  for(const start of [-44,8]){
   const end=start+36;
   for(const y of [1.55,3.25,4.95,6.70])
    courses.push({x:(start+end)/2,y,z:-44.58,w:35.55,h:.09,d:.055});
   for(const y of [1.6,3.4,5.15])
    for(let k=1;k<=7;k++){
     const x=start+k*4.4+(Math.floor(y*10)%2?1.3:0);
     if(x<end-.5)courses.push({x,y:y+.74,z:-44.59,w:.072,h:1.45,d:.055});
    }
  }
  const mortar=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),
   new THREE.MeshLambertMaterial({color:0x45494b}),courses.length);
  const o=new THREE.Object3D();
  for(let i=0;i<courses.length;i++){
   const c=courses[i];o.position.set(c.x,c.y,c.z);
   o.scale.set(c.w,c.h,c.d);o.rotation.set(0,0,0);
   o.updateMatrix();mortar.setMatrixAt(i,o.matrix);
  }
  mortar.instanceMatrix.needsUpdate=true;mortar.frustumCulled=false;
  mortar.castShadow=false;siegeParts.add(mortar);
  return {gateDetails,mortarStones:courses.length,
   decorativeOnly:true,noColliders:true,gateFollowsRealNativeMesh:true};
 }
 return Object.freeze({installHud,setBattleUi,addMeadowGroves,dressSiegeGate});
})();
