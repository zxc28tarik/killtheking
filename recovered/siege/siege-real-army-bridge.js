/* Kill the King — S3A REAL G5.4/true-side-swap army-to-siege bridge.
 * Source engine remains EXACT, pinned in build. This bridge only:
 *   creates actual 140 soldiers and 8 squads, deploys them at castle positions,
 *   supplies real 3D wall AABBs via G5.4 setWorldObstacles,
 *   advances the genuine G5.4 step, reads genuine soldiers and combat events,
 *   derives actual alive totals and occupant counts for the S1 siege FSM.
 *
 * IMPORTANT: G5.4 has NO structure-target/damage or 3D soldier-climb event.
 * No gate damage or ladder creation may be invented by this bridge.
 * This is an integrated *army simulation candidate*, not a playable siege
 * combat release. UMD allows actual browser and Node VM integration tests.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeRealArmyBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TYPES=Object.freeze(['musket','pike','bow','sword']);
 const SIDE_TYPES=Object.freeze(['red','blue']);
 const inside=(u,b)=>Math.abs(u.x-b.x)<=b.w/2&&Math.abs(u.z-b.z)<=b.d/2;
 const validNumber=v=>typeof v==='number'&&Number.isFinite(v);
 const required=(api,keys,name)=>{
   if(!api||keys.some(k=>typeof api[k]!=='function'))
     throw Error('Missing authentic '+name+' contract: '+keys.join('/'));
 };
 function canonicalObstacles(map,scenario){
   if(!map?.spec?.boxes||!scenario?.lanes)
     throw Error('Siege map and authentic objective state required');
   return map.spec.boxes.filter(b=>b.solid&&
     (b.id!=='gate-main'||!scenario.gate.open)).map(b=>{
     if(!['x','y','z','w','h','d'].every(k=>validNumber(b[k]))||
       b.w<=0||b.d<=0||b.h<=0)
       throw Error('Unsafe siege blocker '+b.id);
     return {
       x:b.x,y:b.y+b.h/2,z:b.z,w:b.w,h:b.h,d:b.d,solid:true
     };
   });
 }
 function roster(state){
   if(!state||state.soldiers?.length!==140||
      state.squads?.length!==8)
      throw Error('Authentic G5.4 140-soldier / 8-squad creation failed');
   for(const team of SIDE_TYPES){
     const units=state.soldiers.filter(u=>u.team===team);
     if(units.length!==70)throw Error('Authentic G5.4 side not exactly 70: '+team);
     for(const type of TYPES){
       if(!state.squads.some(s=>s.team===team&&s.type===type))
         throw Error('Missing authentic role '+team+'/'+type);
     }
   }
 }
 function deployment(state,map,traversal,scenario){
   roster(state);
   const spec=map.spec,summary={red:0,blue:0};
   for(const squad of state.squads){
     // Authored siege map uses archer; authentic G5.4 engine names it bow.
     // Translate only the placement key, never the native combat type.
     const mapRole=squad.type==='bow'?'archer':squad.type;
     const where=spec.spawns[squad.team]?.[mapRole];
     if(!where)throw Error('Missing siege map real G5.4 deployment');
     const members=state.soldiers.filter(u=>u.squadId===squad.id);
     if(members.length!==squad.startCount)
       throw Error('Soldier/squad ownership mismatch');
     // Set real G5.4 squad initial conditions BEFORE the first native tick.
     // Do not call damageSoldier, spoof hits, or replace the soldier AI.
     for(const k of ['x','homeX','targetX','lastMoveX','rallyX'])squad[k]=where[0];
     for(const k of ['z','homeZ','targetZ','lastMoveZ','rallyZ'])squad[k]=where[1];
     squad.facing=squad.team==='red'?0:Math.PI;
     squad.commandRoute=[];squad.waypoints=[];squad.routeGoal=null;
     squad.stuckSeconds=0;
     const cols=5,rows=Math.ceil(members.length/cols);
     for(let i=0;i<members.length;i++){
       const u=members[i];
       u.x=where[0]+(i%cols-2)*2.65;
       u.z=where[1]+(Math.floor(i/cols)-(rows-1)/2)*2.65;
       u.facing=squad.facing;
       if(traversal.overlaps({x:u.x,y:0,z:u.z},spec,scenario,.65,2.6))
         throw Error('REAL G5.4 soldier initial spawn embeds stone: '+u.id);
       summary[u.team]++;
     }
   }
   return summary;
 }
 function livingCounts(state){
   const counts={red:0,blue:0};
   for(const u of state.soldiers){
     if(!SIDE_TYPES.includes(u.team)||!validNumber(u.hp)||
        !validNumber(u.x)||!validNumber(u.z))
       throw Error('Non-finite/invalid authentic soldier record');
     if(u.alive)counts[u.team]++;
   }
   for(const team of SIDE_TYPES){
     const squadAlive=state.squads.filter(s=>s.team===team)
       .reduce((sum,s)=>sum+s.alive,0);
     if(squadAlive!==counts[team])
       throw Error('Authentic squad soldier alive reconciliation failed');
   }
   return counts;
 }
 function zoneOccupancy(state,map,zone){
   const box=map.spec.areas[zone];
   if(!box)throw Error('Invalid real zone '+zone);
   const count={red:0,blue:0};
   for(const soldier of state.soldiers)
     // An elevated wall-climber cannot count as a ground courtyard occupier.
     if(soldier.alive&&(soldier.siegeY??0)<1&&inside(soldier,box))
       count[soldier.team]++;
   return count;
 }
 function create({armyEngine,map,objectives,traversal,
     seed=1600,playerType='sword',playerTeam='red',
     scenario:existingScenario=null,structureCombatEngine=null,
     assaultNavigationEngine=null,ladderAIEngine=null,
     captureAIEngine=null,defenderAIEngine=null,
     rampartAIEngine=null,ballisticsAPI=null,
     weaponBalance=null,defenderRender=null}={}){
   required(armyEngine,['create','step','snapshot','setWorldObstacles',
     'setPlayerPosition','drainCombatEvents','drainPlayerHits',
     'issueOrder','setDestination'],'G5.4');
   required(objectives,['createScenario','applyEvent','step','snapshot'],'siege FSM');
   required(traversal,['overlaps'],'siege traversal');
   if(!SIDE_TYPES.includes(playerTeam)||!TYPES.includes(playerType))
     throw Error('Invalid user-selectable authentic G5.4 commander');
   if(!Number.isSafeInteger(seed)||seed<0||seed>100000000)
     throw Error('Invalid deterministic G5.4 seed');
   const scenario=existingScenario||objectives.createScenario();
   if(objectives.snapshot(scenario).kind!=='SIEGE_S1_NOT_REAL_ARMY_ENGINE')
     throw Error('S3 preview needs an authentic siege scenario');
   if(map.validate().ok!==true)throw Error('Invalid authored siege map');
   const state=armyEngine.create(seed,playerType,playerTeam);
   const initial=deployment(state,map,traversal,scenario);
   const commander=map.spec.spawns[playerTeam].commander;
   armyEngine.setPlayerPosition(state,commander[0],commander[1]);
   const bridge={
     kind:'S3A_REAL_G54_SOLDIERS_NO_STRUCTURE_ATTACK_YET',
     armyEngine,state,scenario,map,objectives,traversal,
     playerTeam,playerType,seed,
     initialDeployment:initial,
     combatEvents:[],playerHits:[],
     steps:0,positionsChanged:0,clockSeconds:0,
     combatEventsConsumed:0,worldObstacleUpdates:0,
     structureCombat:null,structureCombatEngine,
     assaultNavigation:null,assaultNavigationEngine,
     ladderAI:null,ladderAIEngine,
     captureAI:null,captureAIEngine,
     defenderAI:null,defenderAIEngine,
     rampartAI:null,rampartAIEngine,
     terrainBlockedMoves:0,
     terrainRecoveredMoves:0,
     lastGateOpen:false,logs:[],ended:false
   };
   refreshObstacles(bridge);
   // Zone occupancy is read from real soldiers, NEVER from S1 debug buttons.
   deriveObjectiveEvents(bridge);
   if(assaultNavigationEngine){
     if(!structureCombatEngine)
       throw Error('Siege gate assault AI requires explicit S3C siege combat');
     required(assaultNavigationEngine,['create','suggest','snapshot'],
       'S3C1 siege-specific assault navigation');
     bridge.assaultNavigation=assaultNavigationEngine.create({
       engine:armyEngine,map,state,scenario
     });
   }
   if(ladderAIEngine){
     if(!structureCombatEngine||!assaultNavigationEngine)
       throw Error('S3C2 requires opt-in real siege combat and assault movement');
     required(ladderAIEngine,
       ['create','suggest','afterNativeTick','snapshot'],
       'genuine S3C2 two-flank ladder AI');
     bridge.ladderAI=ladderAIEngine.create({
       engine:armyEngine,state,map,scenario,objectives,traversal
     });
   }
   if(captureAIEngine){
     if(!ladderAIEngine)throw Error('S3C3 capture needs authentic S3C2 ladder AI');
     required(captureAIEngine,['create','suggest','snapshot'],
       'S3C3 genuine soldier objective navigation');
     bridge.captureAI=captureAIEngine.create({
       engine:armyEngine,state,map,scenario,traversal,
       ladderAI:bridge.ladderAI
     });
   }
   if(defenderAIEngine){
     if(!structureCombatEngine||!assaultNavigationEngine||
        !captureAIEngine)
       throw Error('S4 defender AI requires real siege gate, ladder and capture');
     required(defenderAIEngine,['create','suggest','snapshot'],
       'S4 genuine role-based defender AI');
     bridge.defenderAI=defenderAIEngine.create({
       engine:armyEngine,state,map,scenario,traversal
     });
   }
   if(rampartAIEngine){
     if(!defenderAIEngine||!ballisticsAPI||!weaponBalance)
       throw Error('S4B1 requires authentic S4A and G5.4 3D ballistics');
     required(rampartAIEngine,
       ['create','prepareNativeStep','preservePhysicalPost',
         'afterNativeStep','snapshot'],
       'S4B1 genuine blue wall-top counterfire');
     bridge.rampartAI=rampartAIEngine.create({
       engine:armyEngine,state,map,scenario,traversal,
       balance:weaponBalance,ballisticsAPI,render:defenderRender
     });
   }
   if(structureCombatEngine){
     required(structureCombatEngine,['create','afterNativeTick','snapshot'],
       'S3C1 siege-only structure interaction');
     bridge.structureCombat=structureCombatEngine.create({
       state,engine:armyEngine,scenario,map,objectives
     });
   }
   return bridge;
 }
 function refreshObstacles(bridge){
   const before=bridge.state.worldObstacles?.length??0;
   const actual=canonicalObstacles(bridge.map,bridge.scenario);
   if(bridge.armyEngine.setWorldObstacles(bridge.state,actual)!==true)
     throw Error('Authentic G5.4 setWorldObstacles rejected siege map');
   if(bridge.state.worldObstacles.length!==actual.length)
     throw Error('G5.4 silently dropped a siege collider');
   bridge.worldObstacleUpdates++;
   bridge.lastGateOpen=bridge.scenario.gate.open;
   bridge.logs.push({kind:'WORLD_OBSTACLES_REAL_G54',
     at:bridge.clockSeconds,before,after:actual.length,
     gateOpen:bridge.lastGateOpen});
   if(bridge.logs.length>40)bridge.logs.shift();
 }
 function deriveObjectiveEvents(bridge){
   if(bridge.scenario.phase==='RESULT')return;
   const {state,objectives,scenario,map}=bridge;
   const count=livingCounts(state);
   if(count.red!==scenario.forces.red||count.blue!==scenario.forces.blue){
     objectives.applyEvent(scenario,{type:'FORCE_COUNTS',
       red:count.red,blue:count.blue});
   }
   if(scenario.phase==='RESULT')return;
   for(const zone of ['courtyard','keep']){
     const have=zoneOccupancy(state,map,zone);
     const was=scenario.occupancy[zone];
     if(have.red!==was.red||have.blue!==was.blue)
       objectives.applyEvent(scenario,{type:'ZONE_PRESENCE',zone,
         red:have.red,blue:have.blue});
   }
 }
 function step(bridge,dt){
   if(!bridge||bridge.kind!=='S3A_REAL_G54_SOLDIERS_NO_STRUCTURE_ATTACK_YET')
     throw Error('Unknown authentic siege-army bridge');
   if(!validNumber(dt)||dt<=0||dt>.25)throw Error('Invalid S3 bridge tick');
   if(bridge.scenario.phase==='RESULT')return snapshot(bridge);
   // If another mode has legally opened the gate, update real G5.4 AABBs.
   // This does NOT claim soldiers attacked a structure: S3A has no such source.
   if(bridge.lastGateOpen!==bridge.scenario.gate.open)
     refreshObstacles(bridge);
   const before=bridge.state.soldiers.map(u=>({id:u.id,x:u.x,z:u.z,
     siegeY:u.siegeY??0}));
   if(bridge.rampartAI)
     bridge.rampartAIEngine.prepareNativeStep(bridge.rampartAI,dt);
   const elapsedBefore=bridge.state.elapsed;
   if(bridge.ladderAI){
     // Native G5.4 has only 2D ballistics; avoid a 2D melee attack from
     // any authentically elevated climbing soldier during this native step.
     for(const rec of bridge.ladderAI.records.values())
       if(rec.stage==='climb'){
         const u=bridge.state.soldiers[rec.id];
         if(u?.alive)u.reload=Math.max(u.reload,dt+.09);
       }
   }
   bridge.armyEngine.step(bridge.state,dt);
   const elapsedDelta=bridge.state.elapsed-elapsedBefore;
   if(!validNumber(elapsedDelta)||elapsedDelta<0||elapsedDelta>dt+.081)
     throw Error('Native G5.4 elapsed time desynchronized');
   if(bridge.structureCombat){
     // The original G5.4 AI is a ground-plane engine. On this separate
     // S3C1 castle candidate, CLIP the real units' native movement against
     // actual S1 castle walls; never let AI bodies tunnel through closed gate.
     // Native source remains SHA-identical. Squad AI route is not yet A*.
     for(let i=0;i<bridge.state.soldiers.length;i++){
       const soldier=bridge.state.soldiers[i],old=before[i];
       if(!soldier.alive)continue;
       // G5.4 cannot walk/shoot at height; guard its original t=0 post.
       if(bridge.rampartAI&&bridge.rampartAIEngine.preservePhysicalPost(
           bridge.rampartAI,soldier))continue;
       let nativeX=soldier.x,nativeZ=soldier.z;
       let vertical=null;
       if(bridge.ladderAI&&elapsedDelta>0)
         vertical=bridge.ladderAIEngine.suggest(
           bridge.ladderAI,soldier,old,elapsedDelta);
       if(vertical?.kind==='ladder'){
         // The S2 3D traversal module already validated every step at the
         // soldier's true altitude. Do not project the ascent to y=0.
         soldier.x=vertical.x;soldier.z=vertical.z;
         soldier.siegeY=vertical.y;
         if(bridge.traversal.overlaps({
           x:soldier.x,y:soldier.siegeY,z:soldier.z
         },bridge.map.spec,bridge.scenario,.65,2.6))
           throw Error('Real soldier 3D ladder position embeds castle stone');
         continue;
       }
       if(bridge.captureAI&&elapsedDelta>0&&
          (!vertical||vertical.kind==='inside')){
         const planned=bridge.captureAIEngine.suggest(
           bridge.captureAI,soldier,old,elapsedDelta);
         if(planned)vertical=planned;
       }
       if(!vertical&&bridge.defenderAI&&elapsedDelta>0&&
          soldier.team==='blue'){
         vertical=bridge.defenderAIEngine.suggest(
           bridge.defenderAI,soldier,old,elapsedDelta);
       }
       if(vertical){
         nativeX=vertical.x;nativeZ=vertical.z;
       }else if(bridge.assaultNavigation&&elapsedDelta>0){
         const suggested=bridge.assaultNavigationEngine.suggest(
           bridge.assaultNavigation,soldier,old,elapsedDelta);
         if(suggested){nativeX=suggested.x;nativeZ=suggested.z;}
       }
       const motion=bridge.traversal.move(
         {x:old.x,y:0,z:old.z},
         {x:(nativeX-old.x)/dt,z:(nativeZ-old.z)/dt},
         dt,bridge.map.spec,bridge.scenario,.65,2.6);
       if(motion.blockedX||motion.blockedZ)bridge.terrainBlockedMoves++;
       soldier.x=motion.x;soldier.z=motion.z;
       if(bridge.ladderAI&&vertical)soldier.siegeY=0;
       if(bridge.traversal.overlaps({x:soldier.x,y:0,z:soldier.z},
         bridge.map.spec,bridge.scenario,.65,2.6)){
         // Native G5.4 motion can occasionally propose an unsafe castle
         // pose during a long siege. Preserve the real soldier's last
         // valid position, never invent another spawn or change native HP.
         const oldPose={x:old.x,y:old.siegeY,z:old.z};
         if(bridge.traversal.overlaps(oldPose,bridge.map.spec,
           bridge.scenario,.65,2.6))
           throw Error('Real G5.4 previous soldier pose already embeds stone');
         soldier.x=old.x;soldier.z=old.z;soldier.siegeY=old.siegeY;
         bridge.terrainBlockedMoves++;bridge.terrainRecoveredMoves++;
       }
     }
     const gateEvent=bridge.structureCombatEngine.afterNativeTick(
       bridge.structureCombat);
     if(gateEvent.opened)refreshObstacles(bridge);
     if(bridge.ladderAI&&elapsedDelta>0)
       bridge.ladderAIEngine.afterNativeTick(
         bridge.ladderAI,elapsedDelta);
     if(bridge.rampartAI&&elapsedDelta>0)
       bridge.rampartAIEngine.afterNativeStep(
         bridge.rampartAI,elapsedDelta);
   }
   bridge.steps++;
   bridge.clockSeconds+=dt;
   bridge.positionsChanged+=bridge.state.soldiers.reduce((count,u,i)=>
     count+(u.alive&&Math.hypot(u.x-before[i].x,
       u.z-before[i].z)>1e-6?1:0),0);
   // These events originate only from native G5.4 strike/arrow and
   // damagePlayer. They CANNOT be converted into fictitious gate hits.
   const hitEvents=bridge.armyEngine.drainCombatEvents(bridge.state);
   const playerHits=bridge.armyEngine.drainPlayerHits(bridge.state);
   for(const e of hitEvents){
     if(!['soldier','shield'].includes(e.kind)||
       !bridge.state.soldiers.some(u=>u.id===e.targetId))
       throw Error('Forged/non-G5.4 combat event detected');
   }
   bridge.combatEventsConsumed+=hitEvents.length;
   bridge.combatEvents.push(...hitEvents.slice(-35));
   bridge.playerHits.push(...playerHits.slice(-12));
   if(bridge.combatEvents.length>80)bridge.combatEvents.splice(0,
     bridge.combatEvents.length-80);
   if(bridge.playerHits.length>30)
     bridge.playerHits.splice(0,bridge.playerHits.length-30);
   deriveObjectiveEvents(bridge);
   if(bridge.scenario.phase!=='RESULT')
     bridge.objectives.step(bridge.scenario,dt);
   bridge.ended=bridge.scenario.phase==='RESULT';
   return snapshot(bridge);
 }
 function command(bridge,order,{x=null,z=null}={}){
   if(!bridge||!bridge.state)throw Error('Missing G5.4 bridge');
   const id=bridge.state.playerSquadId;
   // G5.4 production-owned squad gate stays TRUE.
   if(order==='position'){
     if(!validNumber(x)||!validNumber(z))throw Error('Invalid real squad destination');
     return bridge.armyEngine.setDestination(bridge.state,id,x,z,true);
   }
   return bridge.armyEngine.issueOrder(bridge.state,id,order,true);
 }
 function snapshot(b){
   if(!b||b.kind!=='S3A_REAL_G54_SOLDIERS_NO_STRUCTURE_ATTACK_YET')
     throw Error('Unknown G5.4 bridge');
   const genuine=b.armyEngine.snapshot(b.state);
   const count=livingCounts(b.state);
   if(genuine.red!==count.red||genuine.blue!==count.blue)
     throw Error('Snapshot does not reconcile actual native soldiers');
   const scene=b.objectives.snapshot(b.scenario);
   return {
     kind:b.kind,
     authentic140Soldiers:b.state.soldiers.length,
     genuineAlive:count,realCombatEvents:b.combatEventsConsumed,
     genuinelyMovedSoldierTicks:b.positionsChanged,
     realArmySeconds:b.state.elapsed,
     armyNativeTick:b.state.tick,
     armyWinner:b.state.winner,
     realSquads:genuine.squads.map(s=>({
       id:s.id,team:s.team,type:s.type,alive:s.alive,
       playerControlled:s.playerControlled,kills:s.kills,
       x:s.x,z:s.z,order:s.order,commandStatus:s.commandStatus
     })),
     genuineCombat:b.combatEvents.slice(-16).map(x=>({...x})),
     genuinePlayerHits:b.playerHits.slice(-8).map(x=>({...x})),
     scenario:scene,
     worldObstacleCount:b.state.worldObstacles.length,
     armyWorldObstacleUpdates:b.worldObstacleUpdates,
     realStructureDamageConnected:!!b.structureCombat,
     genuineSoldierGateStrikes:b.structureCombat?
       b.structureCombatEngine.snapshot(b.structureCombat):null,
     terrainBlockedSoldierMoves:b.terrainBlockedMoves,
     terrainRecoveredSoldierMoves:b.terrainRecoveredMoves,
     rejectsInvalidStonePenetrationWithoutTeleport:true,
     siegeSpecificRealSoldierNavigation:b.assaultNavigation?
       b.assaultNavigationEngine.snapshot(b.assaultNavigation):null,
     realLadderClimbConnected:!!b.ladderAI,
     genuineSoldierLadders:b.ladderAI?
       b.ladderAIEngine.snapshot(b.ladderAI):null,
     realObjectiveCaptureConnected:!!b.captureAI,
     realObjectiveCaptureNavigation:b.captureAI?
       b.captureAIEngine.snapshot(b.captureAI):null,
     realDefenderRoleCoordinationConnected:!!b.defenderAI,
     realDefenderRoleCoordination:b.defenderAI?
       b.defenderAIEngine.snapshot(b.defenderAI):null,
     realRampart3DDefenderAIConnected:!!b.rampartAI,
     realRampart3DDefenderAI:b.rampartAI?
       b.rampartAIEngine.snapshot(b.rampartAI):null,
     real3dPlayerCombatConnected:false,
     originalArmyAIModified:false,
     mainGameModified:false
   };
 }
 return Object.freeze({
   create,step,snapshot,command,canonicalObstacles,
   livingCounts,zoneOccupancy,refreshObstacles
 });
});
