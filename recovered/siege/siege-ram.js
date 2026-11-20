/* Kill the King AK-05a — genuine soldier-crewed ram, SIEGE-ONLY.
 * Never awards invented personnel/HP. Only living native G5.4 red pikes
 * physically near the ram can propel or strike the real S1 castle gate.
 * Ram damage is a NEW documented siege equipment mechanic, NOT a claim
 * that original G5.4 has structure combat. Uses existing S1 GATE_HIT/ram.
 * No new physics for Arena or the historical field game.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeRam=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SETTINGS=Object.freeze({
   startX:0,startZ:-73,walkSpeed:2.15,
   crewRadius:10.5,minimumPushers:2,minimumStrikers:3,
   strikeSeconds:3.4,strikeDamage:36,
   retargetDistance:3.2,retargetSeconds:1.2,
   maxEvents:22,maxHp:360,defenderMusketDamage:32,
   defenderBowDamage:6
 });
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const r2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 // AK-05b1 physical chassis size matches the visible roof.
 const BODY=Object.freeze({w:5.5,d:7.3,h:4.35});
 function collider(c){ensure(c);if(c.destroyed)return null;return {
   id:'ak05-ram-body',x:c.x,y:0,z:c.z,
   w:BODY.w,d:BODY.d,h:BODY.h,solid:true
 };}
 function touch(c,unit,nextZ,radius){
   if(!unit||!finite(unit.x)||!finite(unit.z))return false;
   if((unit.siegeY??unit.y??0)>=BODY.h)return false;
   const x=unit.x-Math.max(c.x-BODY.w/2,Math.min(unit.x,c.x+BODY.w/2));
   const z=unit.z-Math.max(nextZ-BODY.d/2,Math.min(unit.z,nextZ+BODY.d/2));
   return x*x+z*z<radius*radius-1e-9;
 }
 function obstructedAdvance(c,nextZ){
   const soldiers=c.state.soldiers.some(u=>u.alive&&u.hp>0&&
     !touch(c,u,c.z,.65)&&touch(c,u,nextZ,.65));
   const p=c.state.playerPosition;
   const player=c.state.playerActive&&c.state.playerHealth>0&&p&&
     !touch(c,p,c.z,.85)&&touch(c,p,nextZ,.85);
   return soldiers||player;
 }
 function create({engine,state,map,scenario,objectives,
      fourSquadAuthority=null,fourSquadEngine=null}={}){
   const gate=map?.spec?.boxes?.find(b=>b.id==='gate-main');
   const pike=state?.squads?.find(s=>s.team==='red'&&s.type==='pike');
   if(!engine||typeof engine.setDestination!=='function'||
     !state||state.soldiers?.length!==140||state.squads?.length!==8||
     !gate||!gate.solid||!gate.destructible||
     scenario?.gate?.hp!==scenario?.gate?.maxHp&&scenario?.gate?.open!==true||
     typeof objectives?.applyEvent!=='function'||
     !pike||pike.startCount!==25||
     !finite(state.elapsed)||!Number.isInteger(state.tick))
     throw Error('AK-05a requires real G5.4 pikes, castle gate and native clock');
   const terminalZ=gate.z-gate.d/2-4.6;
   if(!finite(terminalZ)||terminalZ<=SETTINGS.startZ||
     map.spec.boxes.some(b=>b.solid&&
       Math.abs(b.x-SETTINGS.startX)<b.w/2+1.1&&
       Math.abs(b.z-SETTINGS.startZ)<b.d/2+1.1))
     throw Error('AK-05a physical ram spawning inside the castle');
   if(fourSquadAuthority&&(!fourSquadEngine?.select||
      !fourSquadEngine?.execute||!fourSquadEngine?.snapshot))
     throw Error('AK-05a requires existing authorized four-squad G5.4 commands');
   return {
     kind:'AK05A_REAL_NATIVE_CREW_SIEGE_RAM',
     engine,state,map,scenario,objectives,gate,pikeId:pike.id,
     fourSquadAuthority,fourSquadEngine,team:'red',
     x:SETTINGS.startX,z:SETTINGS.startZ,terminalZ,
     assigned:false,operatorOrderAccepted:false,
     stateName:'WAITING_FOR_ORDER',crewCount:0,crewIds:[],
     lastTick:state.tick,lastTime:state.elapsed,steps:0,
     movingSeconds:0,strokeCountdown:SETTINGS.strikeSeconds,
     strikeCount:0,actualGateDamage:0,
     lastRallyZ:SETTINGS.startZ,retargetTimer:0,
     retargets:0,rejected:0,blockedAdvances:0,
     maxHp:SETTINGS.maxHp,hp:SETTINGS.maxHp,destroyed:false,
     defenderShots:0,defenderHits:0,defenderDamage:0,
     defenderShotEvents:[],defenderLastShotAt:new Map(),crewReassignments:0,
     defenderBowHits:0,lastEquipmentHitAt:-Infinity,lastImpactWeapon:null,
     strikeEvents:[]
   };
 }
 function ensure(c){
   if(c?.kind!=='AK05A_REAL_NATIVE_CREW_SIEGE_RAM'||
     c.state.soldiers.length!==140||c.state.squads.length!==8||
     c.state.squads[c.pikeId]?.team!=='red'||
     c.state.squads[c.pikeId]?.type!=='pike')
     throw Error('AK-05a lost genuine native red pike crew authority');
   if(!finite(c.x)||!finite(c.z)||!finite(c.state.elapsed)||
     !Number.isInteger(c.state.tick))
     throw Error('Nonfinite ram pose or native simulation clock');
 }
 function crew(c){
   ensure(c);
   const list=c.state.soldiers.filter(u=>u.alive&&u.hp>0&&
     u.team==='red'&&u.type==='pike'&&u.squadId===c.pikeId&&
     finite(u.x)&&finite(u.z)&&(u.siegeY??0)<.75&&
     r2(u,c)<=SETTINGS.crewRadius);
   c.crewIds=list.map(u=>u.id);
   c.crewCount=list.length;
   return list.length;
 }

 function orderNativePikes(c){
   const api=c.fourSquadEngine,f=c.fourSquadAuthority;
   if(!f||!api)return {ok:false,reason:'No native team command authority'};
   const selected=api.snapshot(f).selectedSquadIds.slice();
   let result;
   try{
     api.select(f,c.pikeId);
     result=api.execute(f,{action:'position',x:c.x,z:c.z+2.8});
   }finally{api.select(f,selected);}
   if(!result?.ok)return {ok:false,reason:result?.reason||'Original G5.4 refused pike rally'};
   c.operatorOrderAccepted=true;c.lastRallyZ=c.z;
   return {ok:true,pikeSquadId:c.pikeId,
     realNativeOrderRevision:c.state.squads[c.pikeId].commandRevision};
 }
 function canOrder(c){
   return c.state.playerTeam==='red'&&c.state.playerHealth>0&&
     c.scenario.phase!=='RESULT'&&!c.scenario.gate.open&&!c.destroyed;
 }
 function reassign(c){
   ensure(c);
   if(!c.assigned)return enlist(c);
   if(!canOrder(c)){
     c.rejected++;
     return {ok:false,reason:'Cannot reassign disabled/destroyed siege ram'};
   }
   if(!c.state.soldiers.some(u=>u.alive&&u.hp>0&&
       u.team==='red'&&u.type==='pike'&&u.squadId===c.pikeId)){
     c.rejected++;
     return {ok:false,reason:'No living native G5.4 pikes to recall'};
   }
   const result=orderNativePikes(c);
   if(!result.ok){c.rejected++;return result;}
   c.crewReassignments++;
   c.stateName='CREW_RALLYING';
   return {...result,reassigned:true,reassignments:c.crewReassignments};
 }
 function rayHit(c,from,to){
   ensure(c);
   if(!from||!to||!['x','y','z'].every(k=>finite(from[k])&&finite(to[k])))
     throw Error('Invalid 3D siege ram ray');
   const direction={x:to.x-from.x,y:to.y-from.y,z:to.z-from.z};
   const length=Math.hypot(direction.x,direction.y,direction.z);
   if(length<=1e-6)return null;
   let enter=0,exit=1;
   const box=collider(c);
   if(!box)return null;
   for(const [k,min,max] of [
     ['x',box.x-box.w/2,box.x+box.w/2],
     ['y',0,box.h],
     ['z',box.z-box.d/2,box.z+box.d/2]
   ]){
     const d=direction[k];
     if(Math.abs(d)<1e-12){
       if(from[k]<min||from[k]>max)return null;
       continue;
     }
     let a=(min-from[k])/d,b=(max-from[k])/d;
     if(a>b)[a,b]=[b,a];
     enter=Math.max(enter,a);exit=Math.min(exit,b);
     if(enter>exit)return null;
   }
   return {distance:length*enter,point:{
     x:from.x+direction.x*enter,
     y:from.y+direction.y*enter,
     z:from.z+direction.z*enter
   }};
 }
 function hitByDefender(c,{soldierId,weapon,damage,from,to,ballistics,
     verifiedPost=false,projectileImpact=null}={}){
   ensure(c);
   if(c.destroyed||c.scenario.phase==='RESULT')return {ok:false,reason:'inactive'};
   const u=c.state.soldiers.find(s=>s.id===soldierId);
   const validMusket=weapon==='musket'&&u?.type==='musket'&&
     finite(damage)&&damage>0&&damage<=SETTINGS.defenderMusketDamage;
   const validBow=weapon==='bow'&&u?.type==='bow'&&
     finite(damage)&&damage>0&&damage<=SETTINGS.defenderBowDamage&&
     projectileImpact?.kind==='equipment'&&
     projectileImpact?.weapon==='bow'&&
     projectileImpact?.equipmentId==='ak05-ram-body'&&
     Number.isSafeInteger(projectileImpact?.id)&&projectileImpact.id>0&&
     ['x','y','z'].every(k=>finite(projectileImpact?.point?.[k])&&
       finite(to?.[k])&&Math.abs(projectileImpact.point[k]-to[k])<.015);
   if(!verifiedPost||!u?.alive||u.hp<=0||u.team!=='blue'||
       !(validMusket||validBow)||
       c.state.squads[u.squadId]?.playerControlled||
       !ballistics?.trace)
     return {ok:false,reason:'unauthorized-blue-native-rampart-shot'};
   if(!from||!finite(from.x)||!finite(from.y)||!finite(from.z)||
       Math.hypot(from.x-u.x,from.z-u.z)>.02||
       Math.abs(from.y-((u.siegeY??0)+1.85))>.02)
     return {ok:false,reason:'inconsistent-native-shooter-position'};
   const last=c.defenderLastShotAt.get(u.id);
   if(last!==undefined&&c.state.elapsed-last<
       (weapon==='musket'?15:3.5)-1e-8)
     return {ok:false,reason:'native-musket-cadence'};
   const hit=rayHit(c,from,to);
   if(!hit)return {ok:false,reason:'miss'};
   const first=ballistics.trace({state:c.state,map:c.map,
     scenario:c.scenario,from,to,team:'blue'});
   // A genuine soldier or castle wall must stop this shot if touched
   // before the vehicle's 3D wooden chassis.
   if(first&&first.distance<hit.distance-.000001)
     return {ok:false,reason:'covered',firstKind:first.kind};
   const dealt=Math.min(c.hp,damage);
   c.defenderLastShotAt.set(u.id,c.state.elapsed);
   c.hp-=dealt;
   c.lastEquipmentHitAt=c.state.elapsed;c.lastImpactWeapon=weapon;
   c.defenderShots++;c.defenderHits++;c.defenderDamage+=dealt;
   if(weapon==='bow')c.defenderBowHits++;
   c.defenderShotEvents.push({shooterId:u.id,weapon,nativeTick:c.state.tick,
     at:c.state.elapsed,dealt,ramHp:c.hp});
   if(c.defenderShotEvents.length>SETTINGS.maxEvents)c.defenderShotEvents.shift();
   if(c.hp<=0){c.hp=0;c.destroyed=true;c.stateName='DESTROYED';}
   return {ok:true,dealt,ramHp:c.hp,destroyed:c.destroyed};
 }
 function enlist(c){
   ensure(c);
   if(c.assigned&&c.destroyed)return {ok:false,reason:'Destroyed ram cannot be assigned'};
   if(c.assigned)return {ok:true,alreadyAssigned:true,pikeSquadId:c.pikeId};
   if(!canOrder(c)){
     c.rejected++;
     return {ok:false,reason:'Only a living red commander may crew the ram'};
   }
   const result=orderNativePikes(c);
   if(!result.ok){c.rejected++;return result;}
   c.assigned=true;
   c.stateName='CREW_RALLYING';
   return result;
 }
 function afterNativeTick(c){
   ensure(c);
   const state=c.state,scenario=c.scenario;
   if(state.tick<c.lastTick||state.elapsed<c.lastTime)
     throw Error('Real G5.4 ram clock regressed');
   const dt=state.elapsed-c.lastTime;
   if(!finite(dt)||dt>.26)
     throw Error('Untrusted native G5.4 ram step delta');
   const tickChanged=state.tick>c.lastTick;
   c.lastTick=state.tick;c.lastTime=state.elapsed;
   crew(c);
   if(c.destroyed){c.stateName='DESTROYED';return snapshot(c);}
   if(scenario.phase==='RESULT'){c.stateName='BATTLE_ENDED';return snapshot(c);}
   if(scenario.gate.open){c.stateName='GATE_BREACHED';return snapshot(c);}
   if(!c.assigned){c.stateName='WAITING_FOR_ORDER';return snapshot(c);}
   if(!tickChanged||dt<=0)return snapshot(c);
   c.steps++;
   if(c.crewCount<SETTINGS.minimumPushers){
     c.stateName='WAITING_FOR_REAL_CREW';
     return snapshot(c);
   }
   if(c.z<c.terminalZ-.001){
     const advance=Math.min(c.terminalZ-c.z,SETTINGS.walkSpeed*dt*
       Math.min(1,c.crewCount/5));
     const nextZ=Math.round((c.z+advance)*1000000)/1000000;
     if(obstructedAdvance(c,nextZ)){
       c.blockedAdvances++;
       c.stateName='WAITING_FOR_CLEAR_RAM_PATH';
       return snapshot(c);
     }
     c.z=nextZ;
     c.movingSeconds+=dt;
     c.stateName='MOVING_WITH_G54_CREW';
     // Crew does not teleport with the model. The original pike G5.4
     // destination is updated every few real metres. Its native AI
     // must physically move soldiers to stay near the ram.
     c.retargetTimer+=dt;
     if(c.z-c.lastRallyZ>=SETTINGS.retargetDistance&&
       c.retargetTimer>=SETTINGS.retargetSeconds){
       const destinationZ=Math.min(c.terminalZ+2.1,c.z+2.8);
       if(c.engine.setDestination(state,c.pikeId,c.x,destinationZ,false)){
         c.lastRallyZ=c.z;c.retargetTimer=0;c.retargets++;
       }
     }
     return snapshot(c);
   }
   if(c.crewCount<SETTINGS.minimumStrikers){
     c.stateName='WAITING_FOR_STRIKE_CREW';
     return snapshot(c);
   }
   c.stateName='STRIKING_REAL_GATE';
   c.strokeCountdown=Math.max(0,c.strokeCountdown-dt);
   if(c.strokeCountdown>0)return snapshot(c);
   const before=scenario.gate.hp;
   c.objectives.applyEvent(scenario,{
     type:'GATE_HIT',team:'red',weapon:'ram',
     damage:SETTINGS.strikeDamage
   });
   const dealt=before-scenario.gate.hp;
   if(!(dealt>0)||dealt>SETTINGS.strikeDamage)
     throw Error('Invalid ram damage against real S1 gate HP');
   c.strikeCount++;c.actualGateDamage+=dealt;
   c.strikeEvents.push({
     source:'AK05A_PHYSICAL_G54_CREWED_RAM_S1_GATE_EVENT',
     nativeTick:state.tick,nativeElapsed:state.elapsed,
     crewNativeIds:c.crewIds.slice(),dealt,gateHp:scenario.gate.hp
   });
   if(c.strikeEvents.length>SETTINGS.maxEvents)c.strikeEvents.shift();
   c.strokeCountdown=SETTINGS.strikeSeconds;
   if(scenario.gate.open)c.stateName='GATE_BREACHED';
   return snapshot(c);
 }
 function snapshot(c){
   ensure(c);
   return {
     connected:true,kind:c.kind,
     x:c.x,z:c.z,terminalZ:c.terminalZ,
     realNativeRedPikeSquadId:c.pikeId,
     assigned:c.assigned,operatorOrderAccepted:c.operatorOrderAccepted,
     state:c.stateName,crewCount:c.crewCount,
     actualLivingG54CrewIds:c.crewIds.slice(),
     nativeTick:c.lastTick,actualG54Seconds:c.lastTime,
     physicalProgress:Math.max(0,Math.min(1,
       (c.z-SETTINGS.startZ)/(c.terminalZ-SETTINGS.startZ))),
     nativeRamSteps:c.steps,
     actualRamMovingSeconds:c.movingSeconds,
     strikeCount:c.strikeCount,actualGateDamage:c.actualGateDamage,
     lastStrikeCrewIds:c.strikeEvents.at(-1)?.crewNativeIds||[],
     strikeEvents:c.strikeEvents.slice(-5).map(e=>({...e})),
     gateHp:c.scenario.gate.hp,gateOpen:c.scenario.gate.open,
     minimumPushers:SETTINGS.minimumPushers,
     minimumStrikers:SETTINGS.minimumStrikers,
     strikeCooldownSeconds:SETTINGS.strikeSeconds,
     retargets:c.retargets,rejectedOrders:c.rejected,
     noNativeSoldierPositionsInvented:true,
     originalG54WeaponDamageUnchanged:true,
     artificialGateDamageWithoutCrew:false,
     bluePlayerCannotOperateAttackersRam:true,
     hp:c.hp,maxHp:c.maxHp,destroyed:c.destroyed,
     defenderShots:c.defenderShots,defenderHits:c.defenderHits,
     actualDefenderDamage:c.defenderDamage,
     physicalBowRamHits:c.defenderBowHits,
     lastEquipmentHitAt:c.lastEquipmentHitAt,
     lastImpactWeapon:c.lastImpactWeapon,
     equipmentBalanceProvisional:true,
     defenderBowDamagePerImpact:SETTINGS.defenderBowDamage,
     actualBlueNativeShooterIds:[...new Set(c.defenderShotEvents.map(e=>e.shooterId))],
     crewReassignments:c.crewReassignments,
     defenderShotEvents:c.defenderShotEvents.slice(-5).map(e=>({...e})),
     collisionWithPlayerImplemented:true,
     collisionWithGroundSoldiersImplemented:true,
     defenderCanDamageRamImplemented:true,
     livingActorBlockedAdvances:c.blockedAdvances,
     ramBodyDimensions:{...BODY},
     independentManciniAndSiegeTowerImplemented:false
   };
 }
 function mountVisual(c,{THREE,scene}={}){
   ensure(c);
   if(!THREE?.Group||!THREE?.Mesh||!THREE?.BoxGeometry||
     !THREE?.CylinderGeometry||!scene?.add)
     throw Error('AK-05a real Three.js siege scene required');
   const group=new THREE.Group();
   group.name='AK05A_RealSoldierCrewedSiegeRam';
   const wood=new THREE.MeshStandardMaterial({color:0x59402c,roughness:.9});
   const trim=new THREE.MeshStandardMaterial({color:0x8d7754,roughness:.78});
   const iron=new THREE.MeshStandardMaterial({color:0x4f5454,metalness:.65,roughness:.45});
   const add=(g,m,x,y,z,rotateX=0,rotateZ=0)=>{
     const o=new THREE.Mesh(g,m);o.position.set(x,y,z);
     o.rotation.x=rotateX;o.rotation.z=rotateZ;
     o.castShadow=true;o.receiveShadow=true;group.add(o);return o;
   };
   for(const x of [-2,2])
     add(new THREE.BoxGeometry(.38,2.7,6.8),wood,x,2,0);
   for(const z of [-2.5,2.5])
     add(new THREE.BoxGeometry(4.2,.35,.5),wood,0,1,z);
   add(new THREE.BoxGeometry(5.5,.45,7.3),trim,0,4.0,0);
   for(const x of [-2.35,2.35])
     for(const z of [-2.25,2.25])
       add(new THREE.CylinderGeometry(.87,.87,.4,12),wood,
         x,.96,z,0,Math.PI/2);
   const log=add(new THREE.CylinderGeometry(.66,.83,7.7,12),wood,
     0,2.1,.15,Math.PI/2,0);
   const head=add(new THREE.ConeGeometry(.87,1.1,12),iron,0,2.1,4.1,
     Math.PI/2,0);
   for(const x of [-2,2])
     add(new THREE.BoxGeometry(.15,.36,1.8),iron,x,3.7,0);
   group.position.set(c.x,0,c.z);scene.add(group);
   const visual={group,log,head,wood,trim,iron,
     meshCount:group.children.length};
   renderVisual(c,visual);
   return visual;
 }
 function renderVisual(c,visual){
   ensure(c);
   if(!visual?.group||!visual?.head)throw Error('Invalid ram 3D render bridge');
   visual.group.position.set(c.x,0,c.z);
   visual.group.visible=!c.destroyed;
   // AK-05b3: actual native 3D equipment contact briefly warms the
   // wood and metal. Zero fabricated hits; this is read-only feedback.
   const flash=Math.max(0,1-(c.state.elapsed-c.lastEquipmentHitAt)/.32);
   if(visual.wood?.emissive?.setHex){
     visual.wood.emissive.setHex(flash>0?0x9c3b10:0x000000);
     visual.wood.emissiveIntensity=flash*.8;
   }
   const gateFlash=c.strikeEvents.length&&
     c.state.elapsed-c.strikeEvents.at(-1).nativeElapsed<.2;
   if(visual.iron?.emissive?.setHex){
     visual.iron.emissive.setHex(gateFlash?0xa16c2e:0x000000);
     visual.iron.emissiveIntensity=gateFlash?.5:0;
   }
   const swing=c.stateName==='STRIKING_REAL_GATE'?
     Math.sin((SETTINGS.strikeSeconds-c.strokeCountdown)*Math.PI*1.2)*.42:0;
   visual.log.position.z=.15+swing;
   visual.head.position.z=4.1+swing;
   return {x:c.x,z:c.z,meshCount:visual.meshCount,animatedSwing:swing};
 }
 function removeVisual(visual,scene){
   if(!visual)return;
   scene.remove(visual.group);
   visual.group.traverse(o=>{
     o.geometry?.dispose?.();
     if(o.material&&!o.material.userData?.shared)
       o.material.dispose?.();
   });
 }
 return Object.freeze({create,enlist,reassign,rayHit,hitByDefender,
   afterNativeTick,snapshot,collider,
   mountVisual,renderVisual,removeVisual,SETTINGS,BODY});
});
