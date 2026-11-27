
/* Army visual: instanced copies of the game's original articulated bots.
 * Templates are created by the SAME createBotMesh() as the original 6 AI bots.
 * Each role's existing meshes are merged by rig part + original material. This
 * preserves actual armor, hats, weapons, face textures and walking/attack poses
 * without drawing 70 separate, high-detail character scene graphs.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaArmyRender=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TYPES=['musket','pike','bow','sword'];
 const ORIGINAL_ROLES={musket:'musket',pike:'pikeman',bow:'archer',sword:'knight'};
 const ROLE_COLORS={musket:0x78350f,pike:0x1d4ed8,bow:0x15803d,sword:0xb91c1c};
 const PART_NAMES=['leftLeg','rightLeg','torso','head','helmetGroup','leftArm','rightArm'];
 const ZERO=new Array(16).fill(0);
 function renderGeometry(THREE,fragments){
  let total=0;
  for(const f of fragments)total+=f.geometry.attributes.position.count;
  const position=new Float32Array(total*3);
  const normal=new Float32Array(total*3);
  const uv=new Float32Array(total*2);
  let offset=0;
  for(const entry of fragments){
   const geom=entry.geometry;
   const p=geom.attributes.position,n=geom.attributes.normal,t=geom.attributes.uv;
   for(let i=0;i<p.count;i++){
    const o=offset+i;
    position[o*3]=p.getX(i);position[o*3+1]=p.getY(i);position[o*3+2]=p.getZ(i);
    if(n){normal[o*3]=n.getX(i);normal[o*3+1]=n.getY(i);normal[o*3+2]=n.getZ(i);}
    if(t){uv[o*2]=t.getX(i);uv[o*2+1]=t.getY(i);}
   }
   offset+=p.count;
   geom.dispose();
  }
  const merged=new THREE.BufferGeometry();
  merged.setAttribute('position',new THREE.BufferAttribute(position,3));
  merged.setAttribute('normal',new THREE.BufferAttribute(normal,3));
  merged.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  merged.computeBoundingSphere();
  return merged;
 }
 function getPartBatches(THREE,group,part,count,container){
  const inv=new THREE.Matrix4().copy(part.matrixWorld).invert();
  const byMaterial=new Map();
  part.traverse(mesh=>{
   if(!mesh.isMesh||!mesh.geometry)return;
   const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
   if(!material)return;
   const key=material.uuid;
   if(!byMaterial.has(key))byMaterial.set(key,{material,fragments:[]});
   const geom=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
   geom.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,mesh.matrixWorld));
   if(!geom.attributes.normal)geom.computeVertexNormals();
   byMaterial.get(key).fragments.push({geometry:geom});
  });
  const batches=[];
  for(const {material,fragments} of byMaterial.values()){
   const geo=renderGeometry(THREE,fragments);
   const mesh=new THREE.InstancedMesh(geo,material,count);
   mesh.name='Original bot art / '+group.userData.battleRole+' / '+part.name;
   mesh.frustumCulled=false;
   mesh.castShadow=false;mesh.receiveShadow=false;
   // Every squad member uses the very same helmet/weapon/material as our bots.
   container.add(mesh);batches.push(mesh);
  }
  return batches;
 }
 function create(THREE,scene,state,createOriginalBotMesh,characterMotion){
  if(typeof createOriginalBotMesh!=='function')throw Error('Original game bot model factory required');
  if(!characterMotion||typeof characterMotion.update!=='function')throw Error('Existing bot animation module required');
  const group=new THREE.Group();group.name='Original 1600s bots / commander field battle';
  const typeData={};const movement=[];
  for(const type of TYPES){
   const originalRole=ORIGINAL_ROLES[type];
   const model=createOriginalBotMesh({role:originalRole,color:ROLE_COLORS[type]});
   model.userData.battleRole=originalRole;
   model.updateMatrixWorld(true);
   const unitIds=state.soldiers.filter(s=>s.type===type).map(s=>s.id);
   const slots=new Map(unitIds.map((id,index)=>[id,index]));
   const parts={};let batches=0;
   for(const partName of PART_NAMES){
    const part=model._parts[partName];
    if(!part)throw Error('Missing original bot rig joint '+originalRole+':'+partName);
    const meshes=getPartBatches(THREE,model,part,unitIds.length,group);
    batches+=meshes.length;
    parts[partName]={meshes,position:part.position.clone(),rotation:part.rotation.clone(),scale:part.scale.clone()};
   }
   typeData[type]={originalRole,slots,parts,template:model,batches};
  }
  const banners=state.squads.map(s=>{
   const banner=new THREE.Group();
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,5,5),new THREE.MeshLambertMaterial({color:0x513822}));
   pole.position.y=2.5;
   const flag=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.2),
    new THREE.MeshBasicMaterial({color:s.team==='blue'?0x4bbafa:0xfc5c65,side:THREE.DoubleSide}));
   flag.position.set(1.1,4.35,0);
   const marker=new THREE.Mesh(new THREE.ConeGeometry(.45,.7,5),new THREE.MeshBasicMaterial({color:0xf8d65b}));
   marker.position.y=5.25;banner.add(pole,flag,marker);group.add(banner);return banner;
  });
  scene.add(group);
  // Arrow flight graphics: one bounded draw call, no per-arrow object churn.
  const arrowCapacity=96;
  const arrowGeometry=new THREE.BoxGeometry(.065,.07,1.18);
  const arrowMaterial=new THREE.MeshLambertMaterial({color:0xb98b51});
  const flightArrows=new THREE.InstancedMesh(arrowGeometry,arrowMaterial,arrowCapacity);
  flightArrows.name='Army bow arrows — ballistic flight';
  flightArrows.frustumCulled=false;flightArrows.castShadow=false;
  group.add(flightArrows);
  const flightMatrix=new THREE.Matrix4(),flightPosition=new THREE.Vector3();
  const flightRotation=new THREE.Quaternion(),flightForward=new THREE.Vector3(0,0,1);
  const flightVelocity=new THREE.Vector3(),invisibleScale=new THREE.Vector3(0,0,0);
  const arrowScale=new THREE.Vector3(1,1,1);
  const rootTransform=new THREE.Matrix4(),jointTransform=new THREE.Matrix4();
  const worldJoint=new THREE.Matrix4(),rootRotation=new THREE.Quaternion(),jointRotation=new THREE.Quaternion();
  const rootPosition=new THREE.Vector3(),rootScale=new THREE.Vector3(),jointEuler=new THREE.Euler();
  const hidden=new THREE.Vector3(0,0,0),normalScale=new THREE.Vector3(1,1,1);
  const motionStates=state.soldiers.map((_,i)=>characterMotion.createState(i*.35));
  const lastPos=state.soldiers.map(s=>({x:s.x,z:s.z}));
  let previousBattle=state;
  function update(battle,dt=1/60){
   if(previousBattle!==battle){
    for(let i=0;i<lastPos.length;i++){
     lastPos[i].x=battle.soldiers[i].x;lastPos[i].z=battle.soldiers[i].z;
     const reset=characterMotion.createState(i*.35);
     motionStates[i].phase=reset.phase;motionStates[i].weight=0;
    }
    previousBattle=battle;
   }
   const delta=Math.min(.05,Math.max(0,Number.isFinite(dt)?dt:0));
   for(const s of battle.soldiers){
    const role=typeData[s.type],slot=role.slots.get(s.id);
    const travel=Math.hypot(s.x-lastPos[s.id].x,s.z-lastPos[s.id].z);
    const pose=characterMotion.update(motionStates[s.id],delta,{
     travel:Math.min(travel,3),role:role.originalRole,
     rangedWindup:s.type==='bow'&&s.reload<3.3?Math.max(0,3.3-s.reload):0,
     strike:s.attackPose,windup:0,
     guard:s.microState==='guard'&&s.guardUntil>battle.elapsed,
     stagger:0,hit:s.hitPose||0
    });
    lastPos[s.id].x=s.x;lastPos[s.id].z=s.z;
    rootPosition.set(s.x,0,s.z);
    rootRotation.setFromAxisAngle(new THREE.Vector3(0,1,0),s.facing);
    rootScale.copy(s.alive?normalScale:hidden);
    rootTransform.compose(rootPosition,rootRotation,rootScale);
    for(const name of PART_NAMES){
     const part=role.parts[name];
     jointEuler.copy(part.rotation);
     if(name==='leftLeg')jointEuler.x=pose.leftLeg;
     else if(name==='rightLeg')jointEuler.x=pose.rightLeg;
     else if(name==='leftArm')jointEuler.x=pose.leftArm;
     else if(name==='rightArm')jointEuler.x=pose.rightArm;
     else if(name==='head')jointEuler.x=pose.headX;
     else if(name==='torso'){jointEuler.x=pose.torsoX;jointEuler.z=pose.torsoZ;}
     jointRotation.setFromEuler(jointEuler);
     jointTransform.compose(part.position,jointRotation,part.scale);
     worldJoint.multiplyMatrices(rootTransform,jointTransform);
     for(const mesh of part.meshes)mesh.setMatrixAt(slot,worldJoint);
    }
   }
   for(const role of Object.values(typeData))
    for(const part of Object.values(role.parts))
     for(const mesh of part.meshes)mesh.instanceMatrix.needsUpdate=true;
   for(const squad of battle.squads){
    const banner=banners[squad.id];
    banner.visible=squad.alive>0;banner.position.set(squad.x,0,squad.z);
   }
   const arrows=battle.projectiles||[];
   for(let index=0;index<arrowCapacity;index++){
    const a=arrows[index];
    if(a){
     // Simulation steps at 12.5 Hz; render between fixed steps smoothly.
     const blend=Math.max(0,Math.min(.08,battle.accumulator||0));
     flightPosition.set(a.x+a.vx*blend,
      a.y+a.vy*blend-11*blend*blend,a.z+a.vz*blend);
     flightVelocity.set(a.vx,a.vy,a.vz).normalize();
     flightRotation.setFromUnitVectors(flightForward,flightVelocity);
     flightMatrix.compose(flightPosition,flightRotation,arrowScale);
    }else flightMatrix.compose(flightPosition,flightRotation,invisibleScale);
    flightArrows.setMatrixAt(index,flightMatrix);
   }
   flightArrows.instanceMatrix.needsUpdate=true;
  }
  update(state,0);
  function dispose(){
   scene.remove(group);
   group.traverse(o=>{if(o.geometry)o.geometry.dispose();});
   for(const banner of banners)banner.traverse(o=>{if(o.material)o.material.dispose();});
  }
  return {group,update,dispose,roles:typeData,banners,flightArrows,
   drawBatches:1+Object.values(typeData).reduce((sum,x)=>sum+x.batches,0)};
 }
 return {create,ORIGINAL_ROLES,PART_NAMES};
});

