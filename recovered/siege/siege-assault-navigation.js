/* S3C1 — Siege-specific outdoor assault waypoints for LIVE G5.4 AI units.
 * This is a NEW adapter steering authentic soldier entities; it does not
 * pretend original meadow G5.4 AI already understands this castle.
 * Red autonomous melee units approach a staging point outside the gate
 * while retaining original HP, attack reload, player order, combat & IDs.
 * Movement is capped by the source role speed and is swept against castle
 * terrain by the real-soldier bridge. No repositioning/teleporting.
 * Phase 2 (3D soldier ladder climbing and gate-open inner-court AI) is OPEN.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeAssaultNavigation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create({engine,map,state,scenario}={}){
   if(!engine?.TYPES||!map?.spec?.boxes||!state?.soldiers||
     !scenario?.gate)
     throw Error('Authentic G5.4 siege-assault navigation contracts missing');
   const gate=map.spec.boxes.find(b=>b.id==='gate-main');
   if(!gate||!gate.solid||gate.w<12)
     throw Error('Invalid original gate for siege AI staging');
   return {
     kind:'S3C1_SIEGE_ASSAULT_APPROACH_WAYPOINTS',
     engine,map,state,scenario,gate,
     guidedSoldierSteps:0,initialApproaches:0,
     gateStagers:new Set(),maxStep:0
   };
 }
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 function suggest(nav,u,from,dt){
   if(nav?.kind!=='S3C1_SIEGE_ASSAULT_APPROACH_WAYPOINTS')
     throw Error('Invalid siege AI navigation adapter');
   if(!finite(dt)||dt<0||dt>.25)
     throw Error('Invalid actual G5.4 movement delta');
   if(nav.scenario.gate.open||nav.scenario.phase==='RESULT'||
      !u||!u.alive||u.team!=='red'||
      !['pike','sword'].includes(u.type))return null;
   const squad=nav.state.squads[u.squadId];
   // Never replace actual user orders. Only AI-controlled red attackers.
   if(!squad||squad.playerControlled)return null;
   const speed=nav.engine.TYPES[u.type]?.speed;
   if(!finite(speed)||speed<=0||speed>30||!finite(u.pace)||
     !finite(from?.x)||!finite(from?.z))
     throw Error('Invalid native G5.4 soldier travel stats');
   const face=nav.gate.z-nav.gate.d/2;
   // Five lanes through the WIDE central gate; stagger rows to retain
   // personal separation without moving anyone through stone.
   const col=u.formationIndex%5-2;
   const row=Math.floor(u.formationIndex/5);
   const gx=nav.gate.x+col*2.2;
   const gz=face-2.75-Math.min(row,4)*1.7;
   const dx=gx-from.x,dz=gz-from.z,dist=Math.hypot(dx,dz);
   if(dist<.15){
     nav.gateStagers.add(u.id);
     return {x:from.x,z:from.z,goal:{x:gx,z:gz},
       atGate:true,angle:Math.atan2(-dx,-dz)};
   }
   // Only native per-role walking speed; never teleport. The bridge's
   // authoritative traversal.move() checks every 0.08 s step vs walls.
   const move=Math.min(Math.max(0,dist-.08),speed*dt*u.pace);
   const nx=from.x+dx/dist*move,nz=from.z+dz/dist*move;
   nav.maxStep=Math.max(nav.maxStep,Math.hypot(nx-from.x,nz-from.z));
   nav.guidedSoldierSteps++;
   if(dist<12)nav.gateStagers.add(u.id);
   return {x:nx,z:nz,goal:{x:gx,z:gz},
     atGate:false,angle:Math.atan2(dx,dz)};
 }
 function snapshot(nav){
   if(nav?.kind!=='S3C1_SIEGE_ASSAULT_APPROACH_WAYPOINTS')
     throw Error('Invalid siege AI nav snapshot');
   return {
     enabled:true,kind:nav.kind,
     actuallyGuidedNativeSoldierSteps:nav.guidedSoldierSteps,
     distinctRealSoldiersNearGate:nav.gateStagers.size,
     largestStep:nav.maxStep,
     nativeOriginalMeadowAISupportsCastleNav:false,
     playerSquadCommandsOverridden:false,
     nativeSoldierLadderNavigation:false,
     unlimitedTeleportOrArtificialSpawns:false
   };
 }
 return Object.freeze({create,suggest,snapshot});
});
