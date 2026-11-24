/**
 * AK27 REAL SIEGE DEFENDER DOCTRINE — coordination of ORIGINAL G5.4 actors.
 *
 * No fake soldiers, damage, invisible aura, instant teleport or second AI
 * combat engine. A siege-specific RED captain leases genuine G5.4 tactical
 * squad authority only when a real (world-obstacle-validated) route exists.
 * Soldier combat, health, ammo, first-contact world cover and movement all
 * remain the original ArenaArmyBattle.step / setDestination implementation.
 * Blue/player orders (F6–F10) and other two maps are never touched.
 */
const KTKSiegeDefenderDoctrineV27=(()=>{
 'use strict';
 const THINK_SECONDS=1.45;
 const PHASES=Object.freeze(['garrison','gate-response','postern-fallback','rear-line']);
 const POSTS=Object.freeze({
  front:Object.freeze({
   pike:Object.freeze({x:-18,z:10}),
   // AK28: former (18,10) overlapped the ORIGINAL keep's right crate
   // with G5.4 3.4m route clearance. Real safe flank: x24,z10.
   sword:Object.freeze({x:24,z:10})
  }),
  postern:Object.freeze({
   pike:Object.freeze({x:-5,z:50}),
   sword:Object.freeze({x:5,z:50})
  }),
  rear:Object.freeze({
   pike:Object.freeze({x:-7,z:76}),
   sword:Object.freeze({x:7,z:76})
  })
 });
 const FRONT_RADIUS=53;
 const FRONT_LINE=-51;
 const COURTYARD_Z=28;
 const NEAR_GATE_X=43;
 const REAR_LINE_Z=62;
 const alive=u=>!!u&&u.alive&&u.hp>0;
 const pointDist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 function observed(state,equipment){
  const troops=state?.soldiers||[];
  const attackers=troops.filter(u=>alive(u)&&u.team==='blue');
  const defenders=troops.filter(u=>alive(u)&&u.team==='red');
  const gateVicinity=attackers.filter(u=>Math.abs(u.x)<NEAR_GATE_X&&
   u.z>FRONT_LINE&&u.z<22).length;
  const courtyard=attackers.filter(u=>Math.abs(u.x)<40&&u.z>COURTYARD_Z).length;
  const rearAttackers=attackers.filter(u=>Math.abs(u.x)<42&&u.z>REAR_LINE_Z).length;
  const reserveBow=defenders.filter(u=>u.type==='bow'&&u.z>=69).length;
  const realGateBreached=!!(equipment?.gateOpen||equipment?.towerCrossed>=2);
  const danger=equipment?.gateHp<600||gateVicinity>=2||
   !!equipment?.towerAssigned||realGateBreached;
  return Object.freeze({
   attackerAlive:attackers.length,defenderAlive:defenders.length,
   gateVicinity,courtyard,rearAttackers,reserveBow,
   danger:!!danger,gateBreached:realGateBreached,
   gateHp:equipment?.gateHp??600,
   towerCrossed:equipment?.towerCrossed||0
  });
 }
 function create(state,battle){
  if(!state?.squads||!state?.soldiers||!battle?.issueOrder||!battle?.setDestination)
   throw Error('AK27 authentic G5.4 army/commands required');
  const red=state.squads.filter(s=>s.team==='red');
  if(red.length!==4||state.soldiers.length!==140)
   throw Error('AK27 requires four REAL red G5.4 defender squads among 140 actors');
  const squadByRole=Object.fromEntries(red.map(s=>[s.type,s]));
  for(const type of ['musket','pike','bow','sword'])
   if(!squadByRole[type])throw Error('AK27 original red role missing: '+type);
  // Genuine castle rear-line bow unit: preserve its position and original
  // soldier shooting. Only its squad-level AI order is pinned to a real post.
  const bow=squadByRole.bow;
  const oldControlled=bow.playerControlled;
  bow.playerControlled=true;
  const held=battle.issueOrder(state,bow.id,'hold',true);
  if(!held){bow.playerControlled=oldControlled;
   throw Error('AK27 failed to issue original G5.4 rear archer HOLD');}
  bow.siegeDefenseAIControlled=true;bow.aiRole='siege-rear-archers';
  bow.tacticalReason='Kalenin gerçek ikinci savunma hattını tut';
  if(bow.fireMode==='hold')bow.fireMode='free';
  const runtime={state,battle,bowId:bow.id,
   phase:'garrison',phaseLevel:0,issued:0,rejected:0,musketGateHeld:false,
   decisions:0,frontCommands:0,fallbackCommands:0,
   rearCommands:0,failedRouteRoles:[],events:[],
   lastThinkAt:-Infinity,lastDecisionAt:0,lastTransitionAt:0,
   realSoldierCount:state.soldiers.length,
   posternArrivals:0,realRearGuardArrivals:0,
   assigned:Object.create(null),lastObserved:observed(state,{gateHp:600})};
  return runtime;
 }
 function command(runtime,type,stage){
  const s=runtime.state.squads.find(x=>x.team==='red'&&x.type===type);
  if(!s?.alive)return false;
  const target=POSTS[stage][type];
  if(!target)throw Error('AK27 no real siege route '+stage+'/'+type);
  const prior=runtime.assigned[type];
  if(prior&&prior.stage===stage)return true;
  if(s.siegeDefenseAIControlled&&s.routeGoal&&pointDist(s.routeGoal,target)<2){
   runtime.assigned[type]={stage,x:target.x,z:target.z};
   return true;
  }
  const wasControlled=s.playerControlled;
  // The original G5.4 route validator runs BEFORE a lease is retained.
  s.playerControlled=true;
  const accepted=runtime.battle.setDestination(runtime.state,s.id,target.x,target.z,true);
  if(!accepted){
   s.playerControlled=wasControlled;
   runtime.rejected++;
   if(!runtime.failedRouteRoles.includes(type))runtime.failedRouteRoles.push(type);
   return false;
  }
  s.siegeDefenseAIControlled=true;
  s.aiRole=stage==='front'?'siege-front-guard':stage==='postern'?
   'siege-fallback-route':'siege-second-line-guard';
  s.tacticalReason=stage==='front'?'Kapı gerisinde mızrak/kılıç savunması':
   stage==='postern'?'İç kale geçidinden gerçek artçı çekilme':
   'İkinci taş siper hattının gerçek savunması';
  s.formation=type==='pike'?'shield':'line';
  runtime.issued++;
  if(stage==='front')runtime.frontCommands++;
  else if(stage==='postern')runtime.fallbackCommands++;
  else runtime.rearCommands++;
  runtime.assigned[type]={stage,x:target.x,z:target.z};
  runtime.events.push({elapsed:runtime.state.elapsed,type,stage,
   x:target.x,z:target.z,squadId:s.id});
  if(runtime.events.length>12)runtime.events.shift();
  return true;
 }
 // AK30: when attackers physically push through the gate while its HP is
 // critically depleted, the ORIGINAL red musket squad holds its existing
 // defensible firing position instead of chasing into the assault corridor.
 // Uses G5.4 hold order; no position writes, fake gunfire, or damage changes.
 function reinforceGateFire(runtime,obs){
  if(runtime.musketGateHeld||obs.gateHp>400||obs.gateVicinity<2)return false;
  const musket=runtime.state.squads.find(s=>s.team==='red'&&s.type==='musket');
  if(!musket?.alive)return false;
  const prior=musket.playerControlled;
  musket.playerControlled=true;
  const accepted=runtime.battle.issueOrder(runtime.state,musket.id,'hold',true);
  if(!accepted){musket.playerControlled=prior;return false;}
  musket.siegeDefenseAIControlled=true;
  musket.aiRole='siege-gate-musket-guard';
  musket.tacticalReason='Gerçek kapı baskınında mevziyi tut';
  if(musket.fireMode==='hold')musket.fireMode='free';
  runtime.musketGateHeld=true;
  runtime.events.push({elapsed:runtime.state.elapsed,type:'musket',stage:'gate-hold',squadId:musket.id});
  if(runtime.events.length>12)runtime.events.shift();
  return true;
 }
 function update(runtime,equipment){
  if(!runtime?.state||runtime.state.winner)return status(runtime);
  const time=runtime.state.elapsed;
  if(time-runtime.lastThinkAt<THINK_SECONDS)return status(runtime);
  runtime.lastThinkAt=time;
  runtime.decisions++;
  const obs=observed(runtime.state,equipment);
  runtime.lastObserved=obs;
  reinforceGateFire(runtime,obs);
  // Monotonic response: don't oscillate when a single attacker briefly
  // retreats or is killed. The fallback trigger is real G5.4 body positions,
  // never a timer or a gate HP change alone.
  let next=runtime.phaseLevel;
  if(obs.danger)next=Math.max(next,1);
  if(obs.courtyard>=2||obs.rearAttackers>=1)next=Math.max(next,2);
  // Stage 3 needs actual rear defenders reaching the real north postern.
  // No soldier is moved directly to the rear on a phase change.
  if(next>=2){
   const both=['pike','sword'].filter(type=>{
    const squad=runtime.state.squads.find(s=>s.team==='red'&&s.type===type);
    return !!squad?.alive&&runtime.assigned[type]?.stage==='postern'&&
     pointDist(squad,POSTS.postern[type])<10;
   });
   runtime.posternArrivals=Math.max(runtime.posternArrivals,both.length);
   if(both.length>=1)next=Math.max(next,3);
  }
  if(next>runtime.phaseLevel){
   runtime.phaseLevel=next;runtime.phase=PHASES[next];
   runtime.lastTransitionAt=time;
  }
  if(runtime.phaseLevel===1){
   for(const type of ['pike','sword'])command(runtime,type,'front');
  }else if(runtime.phaseLevel>=2){
   for(const type of ['pike','sword']){
    const squad=runtime.state.squads.find(s=>s.team==='red'&&s.type===type);
    if(!squad?.alive)continue;
    const past=runtime.assigned[type]?.stage;
    const arrived=past==='postern'&&pointDist(squad,POSTS.postern[type])<10;
    if(arrived||past==='rear'){
     command(runtime,type,'rear');
    }else command(runtime,type,'postern');
   }
  }
  runtime.realRearGuardArrivals=['pike','sword'].filter(type=>{
   const squad=runtime.state.squads.find(s=>s.team==='red'&&s.type===type);
   return !!squad?.alive&&runtime.assigned[type]?.stage==='rear'&&
    pointDist(squad,POSTS.rear[type])<12;
  }).length;
  return status(runtime);
 }
 function status(runtime){
  if(!runtime)return {installed:false};
  const s=runtime.state,o=runtime.lastObserved;
  const bound=s.squads.filter(q=>q.team==='red'&&q.siegeDefenseAIControlled);
  const bow=s.squads.find(q=>q.id===runtime.bowId);
  return {
   installed:true,castleOnly:true,originalG54:true,
   phase:runtime.phase,phaseLevel:runtime.phaseLevel,
   decisions:runtime.decisions,orders:runtime.issued,rejected:runtime.rejected,
   frontCommands:runtime.frontCommands,
   fallbackCommands:runtime.fallbackCommands,
   rearCommands:runtime.rearCommands,
   rearArchersAnchored:!!bow?.siegeDefenseAIControlled&&bow.order==='hold',
   gateMusketsHeld:!!runtime.musketGateHeld,
   originalRearArcherCount:o?.reserveBow||0,
   realDefensiveLeases:bound.length,
   totalRealSoldiers:s.soldiers.length,
   playerSquadIdUnchanged:s.playerSquadId,
   playerSquadTeam:s.squads[s.playerSquadId]?.team||null,
   posternArrivals:runtime.posternArrivals,
   realRearGuardArrivals:runtime.realRearGuardArrivals,
   gateThreats:o?.gateVicinity||0,courtyardThreats:o?.courtyard||0,
   enemyReachedSecondLine:o?.rearAttackers||0,
   lastPlanEvents:runtime.events.map(e=>({...e})),
   deniedRoutes:runtime.failedRouteRoles.slice(),
   noSoldierTeleports:true,noAddedFirepower:true,
   noBlueOrderOverrides:true,noAlternateBattleEngine:true
  };
 }
 return Object.freeze({create,observed,command,update,status,POSTS,PHASES});
})();