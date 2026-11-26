/**
 * AK26 — siege-ready 1600s fortress. PHYSICAL, NOT merely ornamental.
 *
 * Built inside the SAME AK09/G5.4 third map, after AK25's expanded bailey.
 * All solids enter the original player sweep collider, G5.4 bot obstacle
 * map, native siege wall-constrain list and projectile world-raycast set.
 * Normal FFA castle and 70v70 Meadow stay unmodified.
 *
 * Original south gate at (0,-42), ram at x=0, tower at x=28 and catapult
 * at (-22,-68) have explicit conserved machine/breach corridors.
 */
const KTKSiegeFortificationV26=(()=>{
 'use strict';
 const GATE={x:0,z:-42};
 const zones=Object.freeze({
  ram:Object.freeze({minX:-10,maxX:10,minZ:-92,maxZ:-36}),
  tower:Object.freeze({minX:19,maxX:36,minZ:-82,maxZ:-34}),
  catapult:Object.freeze({minX:-35,maxX:-10,minZ:-89,maxZ:-55}),
  westBreach:Object.freeze({minX:-23,maxX:-15,minZ:-30,maxZ:25}),
  eastBreach:Object.freeze({minX:15,maxX:23,minZ:-30,maxZ:25}),
  rearPostern:Object.freeze({minX:-10,maxX:10,minZ:44.5,maxZ:86})
 });
 const features=Object.freeze([
  // Outward-butting forward bastions add real stone LOS cover on the outer
  // wings, flanking the SOUTH approach without obstructing the 3 machines.
  {name:'west-flanking-bastion',role:'front-bastion',x:-57,z:-57,w:23,d:17,h:10},
  {name:'east-flanking-bastion',role:'front-bastion',x:57,z:-57,w:23,d:17,h:10},
  // Real stone throats join projecting bastions into the existing south curtain.
  {name:'west-bastion-throat',role:'front-bastion',x:-57,z:-46,w:23,d:12,h:9},
  {name:'east-bastion-throat',role:'front-bastion',x:57,z:-46,w:23,d:12,h:9},
  {name:'west-bastion-return',role:'front-bastion',x:-76,z:-65,w:22,d:5,h:6.5},
  {name:'east-bastion-return',role:'front-bastion',x:76,z:-65,w:22,d:5,h:6.5},
  {name:'west-approach-traverse',role:'approach-control',x:-81,z:-90,w:44,d:5,h:3.2},
  {name:'east-approach-traverse',role:'approach-control',x:81,z:-90,w:44,d:5,h:3.2},
  {name:'west-outer-glacis',role:'approach-control',x:-108,z:-115,w:14,d:8,h:2.7},
  {name:'east-outer-glacis',role:'approach-control',x:108,z:-115,w:14,d:8,h:2.7},

  // Actual ground-level crossfire and anti-rush geometry behind the old
  // 600 HP gate. The native pike/sword breakthrough routes at x±19 remain
  // open. A direct centreline rush hits the central dogleg wall.
  {name:'inner-gate-dogleg',role:'anti-rush',x:0,z:-11,w:18,d:6,h:5.0},
  {name:'west-gate-guardroom',role:'anti-rush',x:-35,z:-13,w:14,d:12,h:5.5},
  {name:'east-gate-guardroom',role:'anti-rush',x:35,z:-13,w:14,d:12,h:5.5},
  {name:'west-courtyard-traverse',role:'inner-defense',x:-35,z:21,w:19,d:5,h:3.3},
  {name:'east-courtyard-traverse',role:'inner-defense',x:35,z:21,w:19,d:5,h:3.3},

  // Retranchment after the original 16m inner north postern at z=42.
  // Wide 24m central gate remains OPEN. No second fake indestructible gate.
  {name:'west-second-line',role:'second-line',x:-36,z:62,w:48,d:6,h:6.2},
  {name:'east-second-line',role:'second-line',x:36,z:62,w:48,d:6,h:6.2},
  {name:'west-rear-reserve-cover',role:'second-line',x:-61,z:95,w:16,d:5,h:3.0},
  {name:'east-rear-reserve-cover',role:'second-line',x:61,z:95,w:16,d:5,h:3.0}
 ]);
 const horizontal=a=>({
  minX:a.x-a.w/2,maxX:a.x+a.w/2,minZ:a.z-a.d/2,maxZ:a.z+a.d/2
 });
 function overlaps(a,b,pad=0){
  return a.minX<b.maxX+pad&&a.maxX>b.minX-pad&&
   a.minZ<b.maxZ+pad&&a.maxZ>b.minZ-pad;
 }
 function validate(){
  const seen=new Set();
  for(const f of features){
   if(seen.has(f.name))throw Error('AK26 duplicate physical defense '+f.name);
   seen.add(f.name);
   for(const [name,zone] of Object.entries(zones))
    if(overlaps(horizontal(f),zone,.8))
     throw Error('AK26 defense '+f.name+' blocks existing REAL '+name+' passage');
  }
  if(features.filter(f=>f.role==='front-bastion').length<4||
     features.filter(f=>f.role==='second-line').length<4)
   throw Error('AK26 requires physical outworks and a genuine retreat line');
  return true;
 }
 validate();
 const roles=Object.freeze(['front-bastion','approach-control','anti-rush','inner-defense','second-line']);
 function install(THREE,parts,makeMesh,makeBox,mats){
  if(!THREE?.Group||!parts||!makeMesh||!makeBox||!mats?.stone)
   throw Error('AK26 original siege-only scene and real wall helpers required');
  const root=new THREE.Group();
  root.name='AK26_REAL_DEFENSIVE_OUTWORKS_GATE_DOGLEG_AND_SECOND_LINE';
  parts.add(root);
  const boxes=[],solidMeshes=[],featureBoxes=[];
  const flagStone=new THREE.MeshStandardMaterial({color:0x6a6559,roughness:1});
  const weathered=new THREE.MeshStandardMaterial({color:0x8b816d,roughness:1});
  const earth=new THREE.MeshStandardMaterial({color:0x625940,roughness:1});
  const wood=mats.wood||flagStone;
  function solid(def){
   const material=def.role==='approach-control'?earth:
    def.role==='second-line'?weathered:mats.stone;
   const y=def.h/2;
   const mesh=makeMesh(root,def.x,y,def.z,def.w,def.h,def.d,material);
   mesh.name='AK26_SOLID_'+def.name;
   const box=makeBox(def.x,y,def.z,def.w,def.h,def.d);
   boxes.push(box);solidMeshes.push(mesh);
   featureBoxes.push({...def,box});
   return mesh;
  }
  function trim(x,y,z,w,h,d,mat=weathered){
   return makeMesh(root,x,y,z,w,h,d,mat);
  }
  for(const f of features){
   solid(f);
   // Defensive wall coping. It sits on actual cover; not a fake collider.
   trim(f.x,f.h+.17,f.z,f.w+.34,.34,f.d+.34,flagStone);
  }
  // Facing stone shoulders and iron-framed arrow-ports are attached to
  // ACTUAL bastion solids. No fake animation, shield aura or scripted damage.
  const dark=new THREE.MeshStandardMaterial({color:0x202b29,roughness:.85});
  let embrasures=0;
  for(const side of [-1,1]){
   const x=side*57,z=-57;
   for(let n=-1;n<=1;n++){
    trim(x+n*5.2,5.6,z-8.65,2.1,2.7,.24,dark);
    trim(x+n*5.2,7.1,z-8.79,3.0,.22,.18,wood);
    embrasures++;
   }
   // Sloping earth front, stone parapet and the original gate create a
   // kill-zone. Only the main native ram / catapult / tower can breach.
   for(let n=0;n<4;n++){
    const xx=side*(49+n*5.9);
    trim(xx,10.6,z+1.5,3.6,1.8,1.3,flagStone);
   }
   // Roofed guard post behind the physical casemate, leaving x±19 routes.
   const roof=new THREE.Mesh(new THREE.ConeGeometry(7.8,4.6,4),
    new THREE.MeshStandardMaterial({color:0x48372e,roughness:.94}));
   roof.position.set(side*35,8.0,-13);
   roof.rotation.y=Math.PI/4;
   root.add(roof);
  }
  // AK29: historically grounded 17th-century artillery-fortress silhouette.
  // These accents are fixed to AK26's EXISTING physical cover. They never
  // pretend to add walkable battlements, firing AI, or extra damage.
  const limestone=new THREE.MeshStandardMaterial({color:0x918979,roughness:1});
  const mortar=new THREE.MeshStandardMaterial({color:0x514e44,roughness:1});
  const iron=new THREE.MeshStandardMaterial({color:0x2c302d,metalness:.22,roughness:.82});
  let artilleryPorts=0,stoneCourses=0,parapetTeeth=0,scarpFaces=0;
  // Low, broad outworks should read as thick artillery parapets rather than
  // thin fantasy walls. Their base remains the authentic AK26 collision box.
  for(const f of features){
   if(f.role==='front-bastion'||f.role==='second-line'){
    for(let yy=1.15;yy<f.h-.45;yy+=1.6){
     trim(f.x,yy,f.z-f.d/2-.035,f.w-.36,.105,.085,mortar);
     stoneCourses++;
    }
    // Raised inner lip and spaced merlons: visual coping ON the solid wall.
    if(f.role==='front-bastion'){
     trim(f.x,f.h+.55,f.z+f.d/2-.7,f.w,1.15,1.0,limestone);
     for(let xx=f.x-f.w/2+2.5;xx<f.x+f.w/2-1.5;xx+=4.8){
      trim(xx,f.h+1.05,f.z-f.d/2+.55,2.35,2.1,1.1,limestone);
      parapetTeeth++;
     }
    }
   }
  }
  // The projecting south bastions physically flank the only native main gate:
  // dark recessed gun openings with hard stone lintels make that role legible.
  for(const side of [-1,1]){
   for(const xx of [side*51.5,side*62.5]){
    trim(xx,5.25,-65.72,3.4,1.9,.20,iron);
    trim(xx,6.34,-65.86,4.1,.38,.29,limestone);
    trim(xx-2.08,5.25,-65.81,.38,2.25,.29,limestone);
    trim(xx+2.08,5.25,-65.81,.38,2.25,.29,limestone);
    artilleryPorts++;
   }
   // Earth-backed sloped revetment is a visual scarp on each existing bastion
   // front. Crucially, do not place new walls across AK25 ram/tower lanes.
   const scarp=new THREE.Mesh(new THREE.BoxGeometry(20,2.2,3.1),earth);
   scarp.position.set(side*57,1.1,-66.6);
   scarp.rotation.x=-.27;
   root.add(scarp);scarpFaces++;
   // Gatehouse watch embrasures and a low-pitched guardroom roof emphasize
   // that the inner courtyard has a real dogleg, not a straight open run.
   for(const zz of [-16,-11,-6]){
    trim(side*35,3.2,zz,2.7,1.6,.14,dark);
   }
  }
  // The redoubt behind the inner postern remains an OPEN 24m withdrawal
  // passage; crest stones stop short of that centre route.
  for(const side of [-1,1]){
   for(let xx=side*15;Math.abs(xx)<56;xx+=side*5.6){
    trim(xx,7.2,62,2.8,2.0,1.4,limestone);
    parapetTeeth++;
   }
  }
  root.userData=root.userData||{};
  root.userData.ak29Profile={
   historicalPeriod:'early-modern-artillery-fortress',
   artilleryPorts,stoneCourses,parapetTeeth,scarpFaces,
   realBaseColliders:boxes.length,
   originalGateAndBreachLanesUnchanged:true
  };
  // 19 real collision boxes create a layered assault: external outworks,
  // long approach, dogleg once the 600 HP native gate is breached, then
  // physically flanked inner-bastion and second defensive line.
  return Object.freeze({
   root,wallBoxes:boxes,solidMeshes,
   featureBoxes:featureBoxes.map(f=>Object.freeze(f)),
   gate:{...GATE},defensiveLayers:5,solidDefenseCount:boxes.length,
   frontBastions:features.filter(f=>f.role==='front-bastion').length,
   antiRushObstacles:features.filter(f=>f.role==='anti-rush').length,
   secondLineBlocks:features.filter(f=>f.role==='second-line').length,
   embrasures,gateChokeWidth:16,retreatOpeningWidth:24,
   trueWorldColliders:true,originalGateAndMachinesPreserved:true,
   noSeparateFPSRuntime:true
  });
 }
 // BUG08: continuous swept square clearance against every physical block.
 function pathClear(points,radius=0.8){
  if(!Array.isArray(points)||points.length<2||
   !Number.isFinite(radius)||radius<0||
   !points.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)))return false;
  for(let i=0;i<Math.max(1,points.length-1);i++){
   const a=points[i],b=points[Math.min(i+1,points.length-1)];
   for(const f of features){
    let lo=0,hi=1;
    for(const [axis,half] of [['x',f.w/2],['z',f.d/2]]){
     const min=f[axis]-half-radius,max=f[axis]+half+radius;
     const start=a[axis],delta=b[axis]-start;
     if(Math.abs(delta)<1e-12){
      if(start<min||start>max){lo=1;hi=0;break;}
     }else{
      const t0=(min-start)/delta,t1=(max-start)/delta;
      lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
      if(lo>hi)break;
     }
    }
    if(lo<=hi)return false;
   }
  }
  return true;
 }
 return Object.freeze({install,validate,features,roles,zones,pathClear,overlaps});
})();