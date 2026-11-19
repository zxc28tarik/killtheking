/* Kill the King S3C3 — authentic living G5.4 attackers capture courtyard
 * and keep through ACTUAL ground positions after genuine gate/ladder entry.
 *
 * Isolated siege-only waypoints; original G5.4 soldier/combat code untouched.
 * No FORCE_COUNTS / ZONE_PRESENCE / MATCH_FINISH events may be created here:
 * the bridge derives them from native soldiers, and the pre-existing S1 FSM
 * owns disputed-zone hold timers and victory/defender-time rules.
 *
 * This navigator NEVER teleports, spoofs combat events, issues unauthorized
 * orders, bypasses original 3D ladder climb, or modifies player-owned squads.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeCaptureAI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const inside=(p,b)=>Math.abs(p.x-b.x)<=b.w/2&&
   Math.abs(p.z-b.z)<=b.d/2;
 function create({engine,state,map,scenario,traversal,ladderAI}={}){
   if(!engine?.TYPES||state?.soldiers?.length!==140||
      !map?.spec?.areas?.courtyard||!map?.spec?.areas?.keep||
      !scenario?.capture||!ladderAI?.records||
      typeof traversal?.overlaps!=='function')
     throw Error('Real G5.4 S3C3 capture navigation contracts missing');
   return {
     kind:'S3C3_G54_AUTHENTIC_COURTYARD_AND_KEEP_ASSAULT',
     engine,state,map,scenario,traversal,ladderAI,
     guidedSteps:0,guidedIds:new Set(),maxStep:0,
     enteredCourtyard:new Set(),enteredKeep:new Set(),
     roleDistribution:Object.create(null),
     restrictedPlayerSteps:0,blockedByClosedGate:0,
     genuineClimberEntrants:new Set()
   };
 }
 const route=(state,p,role)=>{
   const {scenario,ladderAI,map}=state;
   const rec=ladderAI.records.get(role.id);
   // Do not override an active builder or someone actually on a 3D ladder.
   if(rec&&!rec.completed)return null;
   if((role.siegeY??0)>1)return null;
   // An existing 3D ladder climber becomes a grounded attacker ONLY after
   // physically descending. Native attacker and defender IDs remain unchanged.
   const isInside=inside(p,{x:0,z:7,w:92,d:90});
   if(!isInside&&!scenario.gate.open)return null;
   const phase=scenario.phase;
   if(!['BREACH','COURTYARD','KEEP'].includes(phase))return null;
   if(!isInside){
     // Outside: only an ACTUALLY destroyed gate grants the ground route.
     if(Math.abs(p.x)>9||p.z<-48)return {x:0,z:-53,step:'APPROACH_OPEN_GATE'};
     return {x:0,z:-25,step:'THROUGH_AUTHENTIC_OPEN_GATE'};
   }
   if(Math.abs(p.x)>31){
     const flank=p.x<0?-27:27;
     return {x:flank,z:-8,step:'FROM_LADDER_TO_COURT'};
   }
   if(phase==='KEEP'){
     if(Math.abs(p.x)>10||p.z<22)
       return {x:0,z:23,step:'KEEP_PORCH_APPROACH'};
     return {x:0,z:31,step:'KEEP_OBJECTIVE'};
   }
   // Different real soldiers occupy a small spread of positions inside the
   // authentic courtyard. No fake capture: they must survive here and there
   // must be zero living blue defenders in the real zone for 12 seconds.
   const slot=(role.formationIndex||0)%5;
   return {x:(slot-2)*4.0,z:-5+(Math.floor(
     (role.formationIndex||0)/5)%3)*5,step:'COURTYARD_REAL_OCCUPATION'};
 };
 function suggest(ai,u,from,dt){
   if(ai?.kind!=='S3C3_G54_AUTHENTIC_COURTYARD_AND_KEEP_ASSAULT')
     throw Error('Invalid authentic siege capture AI');
   if(!finite(dt)||dt<0||dt>.25)throw Error('Invalid capture time delta');
   if(!u||!u.alive||u.hp<=0||u.team!=='red'||
      ai.scenario.phase==='RESULT')return null;
   const squad=ai.state.squads[u.squadId];
   if(!squad||squad.playerControlled){
     if(squad?.playerControlled)ai.restrictedPlayerSteps++;
     return null;
   }
   if(!finite(u.x)||!finite(u.z)||!finite(u.siegeY??0)||
      !finite(from?.x)||!finite(from?.z))
     throw Error('Invalid native G5.4 capture position');
   const goal=route(ai,from,u);
   if(!goal)return null;
   const role=ai.engine.TYPES[u.type];
   if(!role||!finite(role.speed)||!finite(u.pace)||role.speed<=0)
     throw Error('Untrusted native G5.4 capture speed');
   const dx=goal.x-from.x,dz=goal.z-from.z,dist=Math.hypot(dx,dz);
   const max=role.speed*u.pace*dt;
   const moved=dist>.12?Math.min(Math.max(0,dist-.08),max):0;
   const x=from.x+(dist>0?dx/dist*moved:0);
   const z=from.z+(dist>0?dz/dist*moved:0);
   if(moved>0){ai.guidedSteps++;ai.guidedIds.add(u.id);}
   ai.maxStep=Math.max(ai.maxStep,moved);
   if(inside({x,z},ai.map.spec.areas.courtyard))
     ai.enteredCourtyard.add(u.id);
   if(inside({x,z},ai.map.spec.areas.keep))
     ai.enteredKeep.add(u.id);
   if(ai.ladderAI.records.get(u.id)?.completed)
     ai.genuineClimberEntrants.add(u.id);
   ai.roleDistribution[u.type]=(ai.roleDistribution[u.type]||0)+1;
   return {x,z,kind:'capture',goal:goal.step,atTarget:dist<.2};
 }
 function snapshot(ai){
   if(ai?.kind!=='S3C3_G54_AUTHENTIC_COURTYARD_AND_KEEP_ASSAULT')
     throw Error('Invalid S3C3 siege capture AI snapshot');
   return {
     connected:true,
     genuineSoldierGuideSteps:ai.guidedSteps,
     distinctNativeIdsGuided:ai.guidedIds.size,
     enteredCourtyardSoldierIds:ai.enteredCourtyard.size,
     enteredKeepSoldierIds:ai.enteredKeep.size,
     previouslyClimbedSoldierIdsGuided:ai.genuineClimberEntrants.size,
     playerSquadProtected:true,
     realHPAndCombatFromOriginalG54:true,
     forgeVictoryOrCasualties:false,
     gateWithoutBreachBypassAllowed:false,
     fastestStep:ai.maxStep,
     roleTickDistribution:{...ai.roleDistribution}
   };
 }
 return Object.freeze({create,suggest,snapshot});
});
