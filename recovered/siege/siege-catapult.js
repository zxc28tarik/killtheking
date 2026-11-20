/* KTK AK-05c1 — provisional genuine native G5.4-crewed siege catapult.
 * Independent siege-only physical projectile and first-contact castle trace.
 * NO invented soldiers, teleports, native G5.4 weapon damage or field changes.
 * 3 real red archers from the actual 15-person squad must stand within radius.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeCatapult=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SETTINGS=Object.freeze({
   x:-18,z:-90,bodyW:5.0,bodyD:6.4,bodyH:4.0,
   crewRadius:12.5,minimumCrew:3,cooldownSeconds:9.5,
   damage:100,projectileSpeed:27,gravity:19,
   launchY:5.0,gateAimY:5.5,maxFlight:5,maxLogs:16
 });
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 function ensure(c){
   if(c?.kind!=='AK05C1_REAL_G54_SIEGE_CATAPULT'||
      c.state?.soldiers?.length!==140||c.state?.squads?.length!==8||
      c.state.squads[c.crewSquadId]?.team!=='red'||
      c.state.squads[c.crewSquadId]?.type!=='bow'||
      !finite(c.state.elapsed)||!Number.isInteger(c.state.tick))
     throw Error('AK-05c1 native G5.4 red archer crew invalid');
 }
 function create({engine,state,map,scenario,objectives,ballisticsAPI,
       fourSquadAuthority,fourSquadEngine}={}){
   const squad=state?.squads?.find(s=>s.team==='red'&&s.type==='bow');
   const gate=map?.spec?.boxes?.find(b=>b.id==='gate-main');
   if(!engine?.TYPES||!squad||squad.startCount!==15||
      !fourSquadAuthority||!fourSquadEngine?.select||
      !fourSquadEngine?.execute||!fourSquadEngine?.snapshot||
      !scenario?.gate||!gate?.solid||!gate.destructible||
      !objectives?.applyEvent||!ballisticsAPI?.trace||
      state.soldiers.length!==140||state.squads.length!==8)
     throw Error('AK-05c1 needs genuine red G5.4 archers, orders, 3D solver and S1 gate');
   if(map.spec.boxes.some(b=>b.solid&&
      Math.abs(b.x-SETTINGS.x)<(b.w+SETTINGS.bodyW)/2&&
      Math.abs(b.z-SETTINGS.z)<(b.d+SETTINGS.bodyD)/2))
     throw Error('AK-05c1 machine spawned inside authored castle');
   return {kind:'AK05C1_REAL_G54_SIEGE_CATAPULT',
     engine,state,map,scenario,objectives,ballisticsAPI,
     fourSquadAuthority,fourSquadEngine,gate,crewSquadId:squad.id,
     x:SETTINGS.x,z:SETTINGS.z,
     assigned:false,crewCount:0,crewIds:[],
     stateName:'WAITING_FOR_ORDER',projectile:null,
     cooldown:0,shots:0,gateHits:0,gateDamage:0,
     blockedShots:0,misses:0,shotsHistory:[],
     lastTime:state.elapsed,lastTick:state.tick,
     lastImpactAt:-Infinity,lastImpactKind:null};
 }
 function collider(c){ensure(c);return {
   id:'ak05c-catapult-body',x:c.x,y:0,z:c.z,
   w:SETTINGS.bodyW,d:SETTINGS.bodyD,h:SETTINGS.bodyH,solid:true
 };}
 function crew(c){
   ensure(c);
   const alive=c.state.soldiers.filter(u=>u.alive&&u.hp>0&&
     u.team==='red'&&u.type==='bow'&&u.squadId===c.crewSquadId&&
     finite(u.x)&&finite(u.z)&&(u.siegeY??0)<.75&&
     Math.hypot(u.x-c.x,u.z-c.z)<=SETTINGS.crewRadius);
   c.crewCount=alive.length;c.crewIds=alive.map(u=>u.id);
   return alive.length;
 }
 function enlist(c){
   ensure(c);
   if(c.assigned)return {ok:true,alreadyAssigned:true};
   if(c.state.playerTeam!=='red'||c.state.playerHealth<=0||
      c.scenario.phase==='RESULT'||c.scenario.gate.open)
     return {ok:false,reason:'Only living red G5.4 commander may crew catapult'};
   const f=c.fourSquadAuthority,api=c.fourSquadEngine;
   const original=api.snapshot(f).selectedSquadIds.slice();
   let response;
   try{
     api.select(f,c.crewSquadId);
     response=api.execute(f,{action:'position',x:c.x,z:c.z-3.2});
   }finally{api.select(f,original);}
   if(!response?.ok)return {ok:false,reason:response?.reason||'G5.4 native order rejected'};
   c.assigned=true;c.stateName='CREW_RALLYING';
   return {ok:true,realNativeArcherSquadId:c.crewSquadId,
     nativeRevision:c.state.squads[c.crewSquadId].commandRevision};
 }
 function launch(c){
   const from={x:c.x,y:SETTINGS.launchY,z:c.z+2.5};
   const to={x:c.gate.x,y:SETTINGS.gateAimY,
     z:c.gate.z-c.gate.d/2};
   const dx=to.x-from.x,dz=to.z-from.z,
     horizontal=Math.hypot(dx,dz),
     duration=horizontal/SETTINGS.projectileSpeed;
   if(!finite(duration)||duration<.1||duration>SETTINGS.maxFlight)
     throw Error('Invalid physical catapult gate trajectory');
   const vy=(to.y-from.y+.5*SETTINGS.gravity*duration*duration)/duration;
   c.projectile={x:from.x,y:from.y,z:from.z,
     vx:SETTINGS.projectileSpeed*dx/horizontal,
     vy,vz:SETTINGS.projectileSpeed*dz/horizontal,
     duration:0,originTick:c.state.tick,crewIds:c.crewIds.slice()};
   c.shots++;c.cooldown=SETTINGS.cooldownSeconds;
   c.stateName='PROJECTILE_IN_FLIGHT';
 }
 function settle(c,kind,point=null){
   const p=c.projectile;
   if(!p)return;
   const event={kind,at:c.state.elapsed,tick:c.state.tick,
     crewNativeIds:p.crewIds.slice(),
     impact:point?{...point}:null};
   if(kind==='gate'&&!c.scenario.gate.open&&
      c.scenario.phase!=='RESULT'){
     const before=c.scenario.gate.hp;
     c.objectives.applyEvent(c.scenario,{type:'GATE_HIT',team:'red',
       weapon:'catapult',damage:SETTINGS.damage});
     event.dealt=before-c.scenario.gate.hp;
     if(event.dealt>0&&event.dealt<=SETTINGS.damage){
       c.gateDamage+=event.dealt;c.gateHits++;
     }else throw Error('Invalid actual S1 catapult gate contact damage');
   }else if(kind==='blocked')c.blockedShots++;
   else c.misses++;
   c.lastImpactAt=c.state.elapsed;c.lastImpactKind=kind;
   c.shotsHistory.push(event);
   if(c.shotsHistory.length>SETTINGS.maxLogs)c.shotsHistory.shift();
   c.projectile=null;
 }
 function advance(c,dt){
   if(!c.projectile)return;
   // Small substeps guarantee first-contact accuracy and natural fall.
   let remaining=dt;
   while(c.projectile&&remaining>1e-8){
     const h=Math.min(.02,remaining);remaining-=h;
     const p=c.projectile;
     const from={x:p.x,y:p.y,z:p.z};
     const to={x:p.x+p.vx*h,
       y:p.y+p.vy*h-.5*SETTINGS.gravity*h*h,
       z:p.z+p.vz*h};
     const contact=c.ballisticsAPI.trace({state:c.state,map:c.map,
       scenario:c.scenario,from,to,team:'red'});
     if(contact){
       settle(c,contact.kind==='castle'&&
         contact.colliderId==='gate-main'?'gate':'blocked',
         contact.point);
       return;
     }
     p.x=to.x;p.y=to.y;p.z=to.z;p.vy-=SETTINGS.gravity*h;
     p.duration+=h;
     if(p.duration>=SETTINGS.maxFlight||p.y<-.1){
       settle(c,'missed');return;
     }
   }
 }
 function afterNativeTick(c){
   ensure(c);
   if(c.state.tick<c.lastTick||c.state.elapsed<c.lastTime)
     throw Error('AK-05c1 native clock regressed');
   const dt=c.state.elapsed-c.lastTime;
   if(!finite(dt)||dt>.26)throw Error('AK-05c1 native tick too long');
   const tickChanged=c.state.tick>c.lastTick;
   c.lastTime=c.state.elapsed;c.lastTick=c.state.tick;
   crew(c);
   if(c.scenario.phase==='RESULT'){
     c.projectile=null;c.stateName='BATTLE_ENDED';return snapshot(c);
   }
   if(c.scenario.gate.open){
     c.projectile=null;c.stateName='GATE_BREACHED';return snapshot(c);
   }
   if(!tickChanged||dt<=0)return snapshot(c);
   c.cooldown=Math.max(0,c.cooldown-dt);
   if(c.projectile)advance(c,dt);
   if(c.projectile){c.stateName='PROJECTILE_IN_FLIGHT';return snapshot(c);}
   if(!c.assigned){c.stateName='WAITING_FOR_ORDER';return snapshot(c);}
   if(c.crewCount<SETTINGS.minimumCrew){
     c.stateName='WAITING_FOR_REAL_ARCHER_CREW';return snapshot(c);
   }
   if(c.cooldown>0){c.stateName='RELOADING';return snapshot(c);}
   launch(c);
   return snapshot(c);
 }
 function snapshot(c){
   ensure(c);
   return {connected:true,kind:c.kind,x:c.x,z:c.z,
     crewNativeSquadId:c.crewSquadId,assigned:c.assigned,
     state:c.stateName,crewCount:c.crewCount,crewIds:c.crewIds.slice(),
     minimumCrew:SETTINGS.minimumCrew,
     realNativeTick:c.lastTick,
     projectileInFlight:!!c.projectile,
     projectile:c.projectile?{
       x:c.projectile.x,y:c.projectile.y,z:c.projectile.z,
       launchCrewIds:c.projectile.crewIds.slice(),
       flightSeconds:c.projectile.duration}:null,
     provisionalCooldownSeconds:SETTINGS.cooldownSeconds,
     provisionalGateDamagePerHit:SETTINGS.damage,
     projectileGravity:SETTINGS.gravity,
     shots:c.shots,gateHits:c.gateHits,actualGateDamage:c.gateDamage,
     blockedShots:c.blockedShots,misses:c.misses,
     actualS1GateHp:c.scenario.gate.hp,
     lastImpactKind:c.lastImpactKind,lastImpactAt:c.lastImpactAt,
     impactHistory:c.shotsHistory.slice(-4).map(e=>({...e})),
     native140SoldierAuthorityPreserved:true,
     noFreeShotsWithoutLivingArchers:true,
     real3DFirstContactPhysics:true,
     soldierProjectileDamageNotYetImplemented:true,
     defenderCounterBatteryNotYetImplemented:true};
 }
 function mountVisual(c,{THREE,scene}={}){
   ensure(c);
   if(!THREE?.Group||!THREE?.Mesh||!THREE?.BoxGeometry||
      !THREE?.SphereGeometry||!scene?.add)
     throw Error('AK-05c1 physical Three.js scene unavailable');
   const group=new THREE.Group();
   group.name='AK05C1_AuthenticG54CrewedCatapult';
   const wood=new THREE.MeshStandardMaterial({color:0x5e422a,roughness:.88});
   const iron=new THREE.MeshStandardMaterial({color:0x555c61,metalness:.7,roughness:.55});
   const stone=new THREE.MeshStandardMaterial({color:0x96938a,roughness:.96});
   const add=(geometry,material,x,y,z)=>{
     const mesh=new THREE.Mesh(geometry,material);
     mesh.position.set(x,y,z);mesh.castShadow=true;
     mesh.receiveShadow=true;group.add(mesh);return mesh;
   };
   for(const x of [-1.8,1.8]){
     add(new THREE.BoxGeometry(.48,2.8,5.4),wood,x,1.85,0);
     for(const z of [-2.2,2.2]){
       const wheel=add(new THREE.CylinderGeometry(.83,.83,.36,12),wood,x,.85,z);
       wheel.rotation.z=Math.PI/2;
     }
   }
   add(new THREE.BoxGeometry(4.1,.36,5.4),iron,0,1.65,0);
   const beam=add(new THREE.BoxGeometry(.42,.46,5.7),wood,0,3,1.05);
   const cup=add(new THREE.SphereGeometry(.56,10,8),iron,0,3.3,3.3);
   const projectile=new THREE.Mesh(new THREE.SphereGeometry(.43,12,10),stone);
   projectile.name='AK05C1_Live_Physical_Projectile';
   projectile.castShadow=true;scene.add(projectile);
   group.position.set(c.x,0,c.z);scene.add(group);
   const v={group,projectile,beam,cup,wood,iron,meshCount:group.children.length+1};
   renderVisual(c,v);return v;
 }
 function renderVisual(c,v){
   ensure(c);
   if(!v?.group||!v.projectile)throw Error('Invalid AK-05c1 visual');
   v.group.position.set(c.x,0,c.z);
   v.projectile.visible=!!c.projectile;
   if(c.projectile)v.projectile.position.set(
     c.projectile.x,c.projectile.y,c.projectile.z);
   const flash=Math.max(0,1-(c.state.elapsed-c.lastImpactAt)/.35);
   v.iron.emissive.setHex(flash&&c.lastImpactKind==='gate'?0x9d672f:0);
   v.iron.emissiveIntensity=flash*.7;
   const arm=c.projectile?-.18:Math.sin(c.cooldown/.55)*.06;
   v.beam.rotation.x=arm;
   return {visible:true,projectileInFlight:!!c.projectile,meshCount:v.meshCount};
 }
 function removeVisual(v,scene){
   if(!v)return;
   scene.remove(v.group);scene.remove(v.projectile);
   for(const root of [v.group,v.projectile])
     root.traverse(o=>{
       o.geometry?.dispose?.();
       if(o.material&&!o.material.userData?.shared)o.material.dispose?.();
     });
 }
 return Object.freeze({create,enlist,afterNativeTick,collider,
   snapshot,mountVisual,renderVisual,removeVisual,SETTINGS});
});
