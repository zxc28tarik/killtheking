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
   launchY:5.0,gateAimY:5.5,maxFlight:5,maxLogs:16,
   maxHp:300,defenderMusketDamage:28
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
     lastImpactAt:-Infinity,lastImpactKind:null,
     maxHp:SETTINGS.maxHp,hp:SETTINGS.maxHp,destroyed:false,
     defenderHits:0,defenderShots:0,defenderDamage:0,
     defenderLastShotAt:new Map(),defenderEvents:[]};
 }
 function collider(c){ensure(c);if(c.destroyed)return null;return {
   id:'ak05c-catapult-body',x:c.x,y:0,z:c.z,
   w:SETTINGS.bodyW,d:SETTINGS.bodyD,h:SETTINGS.bodyH,solid:true
 };}
 function rayHit(c,from,to){
   ensure(c);
   if(!from||!to||!['x','y','z'].every(k=>finite(from[k])&&finite(to[k])))
     throw Error('Invalid AK-05c2 3D defender equipment ray');
   if(c.destroyed)return null;
   const direction={x:to.x-from.x,y:to.y-from.y,z:to.z-from.z};
   const length=Math.hypot(direction.x,direction.y,direction.z);
   if(length<=1e-6)return null;
   const box=collider(c);let enter=0,exit=1;
   for(const [k,min,max] of [
     ['x',box.x-box.w/2,box.x+box.w/2],
     ['y',box.y,box.y+box.h],
     ['z',box.z-box.d/2,box.z+box.d/2]
   ]){
     if(Math.abs(direction[k])<1e-12){
       if(from[k]<min||from[k]>max)return null;
       continue;
     }
     let a=(min-from[k])/direction[k],b=(max-from[k])/direction[k];
     if(a>b)[a,b]=[b,a];
     enter=Math.max(enter,a);exit=Math.min(exit,b);
     if(enter>exit)return null;
   }
   return {distance:length*enter,point:{
     x:from.x+direction.x*enter,y:from.y+direction.y*enter,
     z:from.z+direction.z*enter}};
 }
 function hitByDefender(c,{soldierId,weapon,damage,from,to,ballistics,
   verifiedPost=false}={}){
   ensure(c);
   if(c.destroyed||c.scenario.phase==='RESULT')
     return {ok:false,reason:'inactive'};
   const u=c.state.soldiers.find(s=>s.id===soldierId);
   if(!verifiedPost||!u?.alive||u.hp<=0||u.team!=='blue'||
      u.type!=='musket'||weapon!=='musket'||
      c.state.squads[u.squadId]?.playerControlled||
      !finite(damage)||damage<=0||damage>SETTINGS.defenderMusketDamage||
      !ballistics?.trace)
     return {ok:false,reason:'unauthorized-native-blue-rampart-musket'};
   if(!from||!finite(from.x)||!finite(from.y)||!finite(from.z)||
      Math.hypot(from.x-u.x,from.z-u.z)>.02||
      Math.abs(from.y-((u.siegeY??0)+1.85))>.02)
     return {ok:false,reason:'inconsistent-native-blue-shooter-position'};
   const last=c.defenderLastShotAt.get(u.id);
   if(last!==undefined&&c.state.elapsed-last<15-1e-8)
     return {ok:false,reason:'native-musket-cadence'};
   const contact=rayHit(c,from,to);
   if(!contact)return {ok:false,reason:'miss'};
   const first=ballistics.trace({state:c.state,map:c.map,
     scenario:c.scenario,from,to,team:'blue'});
   if(first&&first.distance<contact.distance-1e-6)
     return {ok:false,reason:'covered',firstKind:first.kind};
   const dealt=Math.min(c.hp,damage);
   c.defenderLastShotAt.set(u.id,c.state.elapsed);
   c.hp-=dealt;c.defenderShots++;c.defenderHits++;
   c.defenderDamage+=dealt;
   c.lastImpactAt=c.state.elapsed;c.lastImpactKind='counterbattery';
   c.defenderEvents.push({shooterId:u.id,nativeTick:c.state.tick,
     at:c.state.elapsed,weapon:'musket',dealt,hp:c.hp,
     point:{...contact.point}});
   if(c.defenderEvents.length>SETTINGS.maxLogs)c.defenderEvents.shift();
   if(c.hp<=0){
     c.hp=0;c.destroyed=true;c.projectile=null;
     c.stateName='DESTROYED_BY_NATIVE_BLUE_COUNTERBATTERY';
   }
   return {ok:true,dealt,hp:c.hp,destroyed:c.destroyed};
 }
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
   if(c.destroyed)return {ok:false,reason:'Destroyed physical siege catapult'};
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
   if(c.destroyed){
     c.projectile=null;
     c.stateName='DESTROYED_BY_NATIVE_BLUE_COUNTERBATTERY';
     return snapshot(c);
   }
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
     hp:c.hp,maxHp:c.maxHp,destroyed:c.destroyed,
     genuineBlueRampartHits:c.defenderHits,
     genuineBlueRampartEquipmentDamage:c.defenderDamage,
     nativeDefenderShotEvents:c.defenderEvents.slice(-4).map(e=>({...e})),
     counterBatteryNativeMusket15s:true,
     lastImpactKind:c.lastImpactKind,lastImpactAt:c.lastImpactAt,
     impactHistory:c.shotsHistory.slice(-4).map(e=>({...e})),
     native140SoldierAuthorityPreserved:true,
     noFreeShotsWithoutLivingArchers:true,
     real3DFirstContactPhysics:true,
     soldierProjectileDamageNotYetImplemented:true,
     defenderCounterBatteryNotYetImplemented:false,
     blueArcherCounterBatteryNotYetImplemented:true};
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
   // MAP3-V4: low-poly frame details remain within the original physics body.
   // Cosmetic only: no changes to the real crew, launch arc or collision.
   const darkTimber=new THREE.MeshStandardMaterial({color:0x463321,roughness:.94});
   for(const x of [-1.65,1.65]){
     const upright=add(new THREE.BoxGeometry(.3,2.15,.28),darkTimber,x,2.8,-1.45);
     upright.rotation.z=x<0?-.16:.16;
     for(const z of [-2.2,2.2]){
       const hub=add(new THREE.CylinderGeometry(.25,.25,.075,10),iron,
         x+(x<0?-.21:.21),.85,z);
       hub.rotation.z=Math.PI/2;
     }
   }
   for(const z of [-1.9,1.85]){
     add(new THREE.BoxGeometry(3.85,.15,.24),darkTimber,0,3.86,z);
   }
   const projectile=new THREE.Mesh(new THREE.SphereGeometry(.43,12,10),stone);
   projectile.name='AK05C1_Live_Physical_Projectile';
   projectile.castShadow=true;scene.add(projectile);
   group.position.set(c.x,0,c.z);scene.add(group);
   const v={group,projectile,beam,cup,wood,iron,
     meshCount:group.children.length+1};
   renderVisual(c,v);return v;
 }
 function renderVisual(c,v){
   ensure(c);
   if(!v?.group||!v.projectile)throw Error('Invalid AK-05c1 visual');
   v.group.position.set(c.x,0,c.z);
   // Keep the wreck visible as a visibly damaged physical siege machine.
   v.beam.rotation.z=c.destroyed?-.55:0;
   v.cup.scale.setScalar(c.destroyed?.72:1);
   v.projectile.visible=!c.destroyed&&!!c.projectile;
   const counterFlash=Math.max(0,1-
     (c.state.elapsed-c.lastImpactAt)/.38);
   v.wood.emissive.setHex(counterFlash>0&&
     c.lastImpactKind==='counterbattery'?0x9c340e:0);
   v.wood.emissiveIntensity=counterFlash*.85;
   v.wood.color.setHex(c.destroyed?0x302922:0x5e422a);
   if(c.projectile)v.projectile.position.set(
     c.projectile.x,c.projectile.y,c.projectile.z);
   const flash=Math.max(0,1-(c.state.elapsed-c.lastImpactAt)/.35);
   v.iron.emissive.setHex(flash&&c.lastImpactKind==='gate'?0x9d672f:0);
   v.iron.emissiveIntensity=flash*.7;
   const arm=c.destroyed?-.62:c.projectile?-.18:
     Math.sin(c.cooldown/.55)*.06;
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
 return Object.freeze({create,enlist,afterNativeTick,collider,rayHit,
   hitByDefender,snapshot,mountVisual,renderVisual,removeVisual,SETTINGS});
});
