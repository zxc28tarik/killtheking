/**
 * AK33 — native G5.4 defensive positioning for wall-foot and inner bailey.
 * Controlled ORIGINAL red musket squad (no extra actors / rounds / damage).
 * Uses ONLY original G5.4 setDestination / path validation / combat.
 *
 * The G5.4 combat renderer is ground-plane: do not present this as elevated
 * bot firing. Sur-top bot traversal needs authoritative 3D body/arrow/LOS.
 */
const KTKSiegeGroundGarrisonV33=(()=>{
 'use strict';
 const THINK=2.8,ORDER_GAP=11,ARRIVAL=8;
 const POSTS=Object.freeze({
  westGate:Object.freeze({x:-24,z:-16}),
  eastGate:Object.freeze({x:24,z:-16}),
  westInner:Object.freeze({x:-29,z:28}),
  eastInner:Object.freeze({x:29,z:28}),
  westFallback:Object.freeze({x:-24,z:13}),
  eastFallback:Object.freeze({x:24,z:13})
 });
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 const alive=u=>!!u&&u.alive&&u.hp>0;
 function observe(state,equipment){
  const enemy=state.soldiers.filter(u=>alive(u)&&u.team==='blue');
  const gate=enemy.filter(u=>u.z>-86&&u.z<25&&Math.abs(u.x)<52);
  const through=enemy.filter(u=>u.z>-38&&u.z<38&&Math.abs(u.x)<47);
  const postern=enemy.filter(u=>u.z>=33&&u.z<96&&Math.abs(u.x)<80);
  const findSide=arr=>arr.reduce((n,u)=>n+(u.x>=0?1:-1),0)>=0?'east':'west';
  const gateSide=findSide(gate),interiorSide=findSide(postern.length?postern:through);
  return Object.freeze({
   gateThreats:gate.length,throughGate:through.length,
   posternThreats:postern.length,gateSide,interiorSide,
   gateHp:equipment?.gateHp??600,
   gateOpen:!!equipment?.gateOpen,
   towerBreached:!!equipment?.towerCrossed
  });
 }
 function create(state,battle){
  if(state?.soldiers?.length!==140||!state?.squads||
     !battle?.setDestination||!battle?.issueOrder)
   throw Error('AK33 requires genuine 140 G5.4 soldier state and orders');
  const musket=state.squads.find(s=>s.team==='red'&&s.type==='musket');
  if(!musket||musket.alive<=0)throw Error('AK33 real red musket squad required');
  return {state,battle,musketId:musket.id,
   lastCheck:-Infinity,lastOrder:-Infinity,
   posts:POSTS,requests:0,accepted:0,rejected:0,holds:0,
   stage:null,assigned:null,arrivals:0,
   protectedByDoctrine:false,decisions:0,events:[],
   lastObserved:observe(state,{gateHp:600})};
 }
 function preferred(obs){
  if(obs.posternThreats>=2)
   return [obs.interiorSide==='east'?'eastInner':'westInner',
    obs.interiorSide==='east'?'eastFallback':'westFallback'];
  if(obs.throughGate>=3||obs.gateOpen||obs.towerBreached)
   return [obs.gateSide==='east'?'eastGate':'westGate',
    obs.gateSide==='east'?'eastFallback':'westFallback'];
  if(obs.gateThreats>=3||obs.gateHp<600)
   return [obs.gateSide==='east'?'eastGate':'westGate',
    obs.gateSide==='east'?'eastFallback':'westFallback'];
  return [];
 }
 function update(runtime,equipment,doctrine){
  if(!runtime?.state||runtime.state.winner)return status(runtime);
  const t=runtime.state.elapsed;
  if(t-runtime.lastCheck<THINK)return status(runtime);
  runtime.lastCheck=t;runtime.decisions++;
  const obs=observe(runtime.state,equipment);
  runtime.lastObserved=obs;
  const s=runtime.state.squads.find(u=>u.id===runtime.musketId);
  if(!s?.alive)return status(runtime);
  if(runtime.assigned&&dist(s,runtime.assigned)<ARRIVAL)
   runtime.arrivals++;
  // Original AK27 emergency hold and any external red-garrison authority
  // outrank this optional patrol. Never erase a critical defensive order.
  if(doctrine?.musketGateHeld){
   runtime.protectedByDoctrine=true;runtime.holds++;
   return status(runtime);
  }
  if(s.siegeDefenseAIControlled&&!s.ak33GroundGuardControlled){
   runtime.holds++;return status(runtime);
  }
  const choices=preferred(obs);
  if(!choices.length||t-runtime.lastOrder<ORDER_GAP)return status(runtime);
  if(runtime.stage===choices[0]&&runtime.assigned)return status(runtime);
  // Probe via the actual G5.4 route planner, not fake unobstructed points.
  // A failed order restores the prior captain authority immediately.
  for(const key of choices){
   const goal=POSTS[key],prior=s.playerControlled;
   s.playerControlled=true;
   runtime.requests++;
   const ok=runtime.battle.setDestination(runtime.state,s.id,goal.x,goal.z,true);
   if(!ok){
    s.playerControlled=prior;runtime.rejected++;
    continue;
   }
   s.siegeDefenseAIControlled=true;s.ak33GroundGuardControlled=true;
   s.aiRole='siege-ground-crossfire';
   s.tacticalReason='Gerçek sur dibi/kapı içi atış mevzisine rota ile geç';
   if(s.fireMode==='hold')s.fireMode='free';
   s.formation='line';
   runtime.accepted++;
   runtime.lastOrder=t;runtime.stage=key;runtime.assigned={...goal};
   runtime.events.push({time:t,stage:key,x:goal.x,z:goal.z,id:s.id});
   if(runtime.events.length>10)runtime.events.shift();
   break;
  }
  return status(runtime);
 }
 function status(runtime){
  if(!runtime)return {installed:false};
  const s=runtime.state.squads.find(u=>u.id===runtime.musketId);
  return {installed:true,originalG54:true,
   totalSoldiers:runtime.state.soldiers.length,
   squadId:runtime.musketId,
   decisionCount:runtime.decisions,
   requestedRoutes:runtime.requests,
   realAcceptedRoutes:runtime.accepted,
   deniedRoutes:runtime.rejected,
   arrivalsSampled:runtime.arrivals,
   doctrineEmergencyPriority:runtime.protectedByDoctrine,
   doctrineHolds:runtime.holds,
   currentPost:runtime.stage,
   actualSquadPosition:s?{x:s.x,z:s.z}:null,
   target:runtime.assigned?{...runtime.assigned}:null,
   threats:{...runtime.lastObserved},
   events:runtime.events.map(e=>({...e})),
   noNewShots:true,noNewActors:true,
   noTeleport:true,noElevationFiringClaim:true,
   noBlueOverrides:true};
 }
 return Object.freeze({POSTS,THINK,ORDER_GAP,observe,preferred,create,update,status});
})();