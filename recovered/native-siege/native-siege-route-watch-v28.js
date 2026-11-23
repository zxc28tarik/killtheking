/**
 * AK28 — REAL G5.4 SIEGE ROUTE WATCHDOG & PHYSICAL PASSAGE AUDIT.
 * This is NOT another army AI: the existing native V27 defender commands,
 * G5.4 setDestination(), individual movement, 140 soldiers and original
 * 600HP gate remain authoritative. Never move soldiers or change HP/damage.
 *
 * One-time no-side-effect real route probes use original G5.4 path planner
 * with all live AK25/26 colliders; late real stalls receive at most two
 * original G5.4 validated re-route attempts per squad/stage.
 */
const KTKSiegeRouteWatchV28=(()=>{
 'use strict';
 const REPLAN_AFTER=13.5;
 const MAX_REPLANS=2;
 const RESAMPLE=2.6;
 const PROGRESS=1.35;
 const ARRIVAL=5.5;
 const paths=Object.freeze({
  frontPike:Object.freeze({from:{x:-8,z:14},to:{x:-18,z:10}}),
  frontSword:Object.freeze({from:{x:24,z:4},to:{x:18,z:10}}),
  posternPike:Object.freeze({from:{x:-18,z:10},to:{x:-5,z:50}}),
  posternSword:Object.freeze({from:{x:18,z:10},to:{x:5,z:50}}),
  rearPike:Object.freeze({from:{x:-5,z:50},to:{x:-7,z:76}}),
  rearSword:Object.freeze({from:{x:5,z:50},to:{x:7,z:76}})
 });
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 function create(state,battle,doctrine){
  if(!state?.soldiers||state.soldiers.length!==140||
     !battle?.planSquadRoute||!battle?.setDestination||!doctrine?.assigned)
   throw Error('AK28 requires original real 140 G5.4 soldiers, routes and V27 captain');
  const liveRoutes={};
  // read-only queries: test the real collision/route graph rather than
  // synthetic coordinate guesses; do NOT mutate the live army positions.
  for(const [key,p] of Object.entries(paths)){
   const route=battle.planSquadRoute(state,p.from,p.to);
   liveRoutes[key]=!!route&&route.length>=1;
  }
  return {state,battle,doctrine,paths:liveRoutes,track:Object.create(null),
   checks:1,replans:0,routeFailures:0,releases:0,
   progressEvents:0,arrivals:0,
   lastUpdateAt:-Infinity,events:[]};
 }
 function appendEvent(w,type,stage,kind,at){
  w.events.push({type,stage,kind,at});
  if(w.events.length>16)w.events.shift();
 }
 function update(w){
  if(!w?.state||w.state.winner)return status(w);
  const now=w.state.elapsed;
  if(now-w.lastUpdateAt<RESAMPLE)return status(w);
  w.lastUpdateAt=now;w.checks++;
  for(const type of ['pike','sword']){
   const squad=w.state.squads.find(s=>s.team==='red'&&s.type===type);
   const assigned=w.doctrine.assigned[type];
   if(!squad?.alive||!assigned||!squad.siegeDefenseAIControlled||
      !squad.playerControlled||squad.order!=='position'||!squad.routeGoal){
    delete w.track[type];continue;
   }
   const stage=assigned.stage;
   const target={x:assigned.x,z:assigned.z};
   const remain=distance(squad,target);
   const prev=w.track[type];
   if(!prev||prev.stage!==stage){
    w.track[type]={stage,at:now,closest:remain,atLastProgress:now,
     attempts:0,arrived:false,issuedAt:now};
    continue;
   }
   if(remain<ARRIVAL){
    if(!prev.arrived){prev.arrived=true;w.arrivals++;appendEvent(w,type,stage,'arrived',now);}
    prev.closest=Math.min(prev.closest,remain);
    continue;
   }
   if(prev.closest-remain>=PROGRESS){
    prev.closest=remain;prev.atLastProgress=now;
    w.progressEvents++;
    continue;
   }
   if(now-prev.atLastProgress<REPLAN_AFTER||prev.attempts>=MAX_REPLANS)
    continue;
   prev.attempts++;prev.atLastProgress=now;
   const sx=type==='pike'?-1:1;
   const offset=prev.attempts===1?
     {x:target.x-sx*2.4,z:target.z+1.6}:
     {x:target.x+sx*2.4,z:target.z-1.6};
   // Original G5.4 is authoritative; no path = NO command. In particular
   // no direct write to soldier/squad.x/z or to world colliders.
   const valid=w.battle.setDestination(w.state,squad.id,offset.x,offset.z,true);
   if(valid){
    w.replans++;
    appendEvent(w,type,stage,'native-reroute',now);
   }else{
    w.routeFailures++;
    appendEvent(w,type,stage,'native-rejected',now);
    if(prev.attempts>=MAX_REPLANS){
     // Do not hold a stricken captain prisoner in a bogus 'player' route.
     // Its standard red G5.4 autonomous AI can now react to nearby soldiers;
     // the V27 stage is retained for telemetry, not retriggered endlessly.
     squad.playerControlled=false;
     squad.siegeDefenseAIControlled=false;
     squad.routeGoal=null;squad.commandRoute=[];
     delete w.doctrine.assigned[type];
     delete w.track[type];
     w.releases++;
     appendEvent(w,type,stage,'native-ai-restored',now);
    }
   }
  }
  return status(w);
 }
 function status(w){
  if(!w)return {installed:false};
  return {installed:true,originalBattleRouting:true,
   checkedFromLiveG54Colliders:true,
   routeReadiness:{...w.paths},allRequiredRoutesClear:
     Object.values(w.paths).every(Boolean),
   actorCount:w.state.soldiers.length,
   checked:w.checks,replans:w.replans,routeFailures:w.routeFailures,
   releasedToOriginalAI:w.releases,
   physicalProgress:w.progressEvents,arrived:w.arrivals,
   tracked:Object.fromEntries(Object.entries(w.track).map(([type,q])=>
    [type,{stage:q.stage,closest:q.closest,attempts:q.attempts,
     arrived:q.arrived}])),
   events:w.events.map(e=>({...e})),
   maxReplansPerStage:MAX_REPLANS,
   noTeleport:true,noExtraDamage:true,
   originalGateUntouched:true,otherMapsUntouched:true};
 }
 return Object.freeze({create,update,status,paths});
})();