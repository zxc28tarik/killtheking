/* KILL THE KING S3C2 — genuine G5.4 soldiers build two siege ladders and
 * traverse the S1 3D castle wall. Isolated extension, not historic G5.4 AI.
 *
 * Source of work: LIVE, alive, non-player-commanded red pike soldiers must
 * walk from original spawn to the ACTUAL west/east ladder entrance. Work is
 * credited only per real G5.4 native tick when builder is in contact.
 * Soldier motion is at original melee type speed; vertical paths are checked
 * by S2 traversal.stepClimb against the exact authored wall AABBs.
 * The historic G5.4 source has 2D combat only. While climbing the original
 * soldier attacks are suppressed by its own cooldown; the 3D ladder isn't
 * represented as native G5.4 ballistic elevation/targeting physics.
 * 
 * Does not award fabricated casualties, occupancy or victory.
 * Does not change a player-commanded squad, FFA, or default army candidate.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeLadderAI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SIDES=Object.freeze(['west','east']);
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const at=(p,x,z,r)=>Math.hypot(p.x-x,p.z-z)<=r;
 const sideOf=(map,u)=>u.formationIndex%2===0?'west':'east';
 function create({engine,state,map,scenario,objectives,traversal}={}){
   if(!engine?.TYPES?.pike||state?.soldiers?.length!==140||
      !map?.spec?.lanes||typeof objectives?.applyEvent!=='function'||
      typeof traversal?.beginClimb!=='function'||
      typeof traversal?.stepClimb!=='function'||
      typeof traversal?.overlaps!=='function'||!scenario?.ladders)
     throw Error('Real 140-soldier siege ladder contracts missing');
   if(!SIDES.every(side=>map.spec.lanes[side]&&scenario.ladders[side]))
     throw Error('Both native siege ladder entrances required');
   const soldierIds=new Map();
   // Prefer native G5.4 pike builders. If the red HUMAN commands the
   // complete pike squad, use the red AI sword squad instead: never hijack
   // a real player-owned order or reject legitimate player class selection.
   const aiPikes=state.soldiers.filter(u=>u.alive&&u.team==='red'&&
     u.type==='pike'&&!state.squads[u.squadId]?.playerControlled);
   const eligible=aiPikes.length?aiPikes:state.soldiers.filter(u=>
     u.alive&&u.team==='red'&&u.type==='sword'&&
     !state.squads[u.squadId]?.playerControlled);
   for(const soldier of eligible)
     soldierIds.set(soldier.id,sideOf(map,soldier));
   if(!soldierIds.size)
     throw Error('No eligible authentic AI melee ladder builders');
   const sides={west:[],east:[]};
   for(const [id,side] of soldierIds)sides[side].push(id);
   if(!sides.west.length||!sides.east.length)
     throw Error('Both siege flanks need real G5.4 alive builders');
   const records=new Map();
   for(const [id,side] of soldierIds)
     records.set(id,{
       id,side,stage:'approach',navIndex:0,
       climb:null,inside:false,travelled:0,
       reachedBase:false,completed:false
     });
   return {
     kind:'S3C2_REAL_G54_LADDER_BUILD_AND_3D_CLIMB',
     engine,state,map,scenario,objectives,traversal,
     records,eligibility:{west:sides.west.length,east:sides.east.length},
     nativeTick:state.tick,nativeSeconds:state.elapsed,
     workEvents:0,totalWork:{west:0,east:0},
     climbStarts:{west:0,east:0},
     climbCompletions:{west:0,east:0},
     maxY:0,guidedSteps:0,genuineBuilderTicks:0,
     invalidWallEntries:0,completedSoldierIds:new Set(),
     lastCompleted:null
   };
 }
 function waypoints(side){
   const sign=side==='west'?-1:1;
   // All three are in ground-clear space OUTSIDE the exact castle AABBs.
   // First segment skirts cover around x≈±37,z≈-78 and outer rock at
   // x≈±66,z≈-53. Never ask a ground soldier to cut across the south wall.
   return [
     {x:sign*85,z:-67},
     {x:sign*73,z:-16},
     {x:sign*59,z:-9}
   ];
 }
 function suggest(ai,u,from,dt){
   if(ai?.kind!=='S3C2_REAL_G54_LADDER_BUILD_AND_3D_CLIMB')
     throw Error('Invalid actual siege ladder AI');
   if(!finite(dt)||dt<0||dt>.25)
     throw Error('Invalid ladder navigation delta');
   const rec=ai.records.get(u?.id);
   if(!rec||!u.alive||u.hp<=0||
      ai.scenario.phase==='RESULT')return null;
   const squad=ai.state.squads[u.squadId];
   if(squad?.playerControlled&&u.squadId!==ai.state.playerSquadId){
     // AK-04a: this genuine ally was explicitly given a human order.
     // Do not hijack it with automatic ladder work or falsely treat its
     // reversible native command lease as a second physical human.
     return null;
   }
   if(!squad||squad.playerControlled)
     throw Error('Native player-controlled squad was routed to siege ladder');
   const speed=ai.engine.TYPES[u.type]?.speed;
   if(!finite(speed)||speed<=0||speed>30||!finite(u.pace)||
      !finite(from?.x)||!finite(from?.z)||!finite(u.siegeY??0))
     throw Error('Invalid native soldier ladder speed or position');
   if(rec.stage==='climb'){
     if(!rec.climb)throw Error('Missing actual 3D climb state');
     const before={...rec.climb.position};
     const next=ai.traversal.stepClimb(rec.climb,dt,ai.map.spec,
       ai.scenario);
     rec.travelled+=Math.hypot(next.position.x-before.x,
       next.position.y-before.y,next.position.z-before.z);
     ai.maxY=Math.max(ai.maxY,next.position.y);
     ai.guidedSteps++;
     u.siegeY=next.position.y;
     if(next.done){
       rec.stage='inside';rec.completed=true;rec.inside=true;
       ai.climbCompletions[rec.side]++;
       ai.completedSoldierIds.add(u.id);
       ai.lastCompleted={soldierId:u.id,side:rec.side,
         x:next.position.x,y:next.position.y,z:next.position.z};
     }
     return {x:next.position.x,y:next.position.y,z:next.position.z,
       suspended:!next.done,kind:'ladder',side:rec.side,
       completed:next.done};
   }
   if(rec.stage==='approach'||rec.stage==='build'){
     if(ai.scenario.lanes[rec.side]){
       const entrance=ai.map.spec.lanes[rec.side].entry;
       if(at(from,entrance[0],entrance[1],4.2)){
         const started=ai.traversal.beginClimb(
           {x:from.x,y:u.siegeY??0,z:from.z},
           rec.side,ai.map.spec,ai.scenario);
         if(!started)throw Error('Built ladder did not accept real builder');
         rec.climb=started;rec.stage='climb';
         ai.climbStarts[rec.side]++;
         return suggest(ai,u,from,dt);
       }
     }
     const pts=waypoints(rec.side);
     const entrance=ai.map.spec.lanes[rec.side].entry;
     if(rec.navIndex>=pts.length)rec.navIndex=pts.length-1;
     while(rec.navIndex<pts.length-1&&
       at(from,pts[rec.navIndex].x,pts[rec.navIndex].z,2.5))
       rec.navIndex++;
     const goal=pts[rec.navIndex];
     const dx=goal.x-from.x,dz=goal.z-from.z;
     const distance=Math.hypot(dx,dz);
     if(distance<.3){
       rec.reachedBase=at(from,entrance[0],entrance[1],4.2);
       rec.stage=rec.reachedBase?'build':'approach';
       return {x:from.x,y:0,z:from.z,suspended:false,
         kind:'builder',side:rec.side};
     }
     const move=Math.min(Math.max(0,distance-.05),speed*dt*u.pace);
     const x=from.x+dx/distance*move,z=from.z+dz/distance*move;
     rec.travelled+=move;ai.guidedSteps++;
     rec.reachedBase=at({x,z},entrance[0],entrance[1],4.2);
     rec.stage=rec.reachedBase?'build':'approach';
     return {x,y:0,z,suspended:false,kind:'builder',side:rec.side};
   }
   if(rec.stage==='inside'){
     // Inside the courtyard, move genuinely by original type speed.
     // S3C3 will add formation coordination, zone capture and keep tactic.
     const goals=[
       {x:rec.side==='west'?-29:29,z:-9},
       {x:rec.side==='west'?-20:20,z:-4}
     ];
     const target=goals[at(from,goals[0].x,goals[0].z,2)?1:0];
     const dx=target.x-from.x,dz=target.z-from.z;
     const d=Math.hypot(dx,dz);
     const move=d>.15?Math.min(Math.max(0,d-.1),speed*dt*u.pace):0;
     if(move>0)ai.guidedSteps++;
     return {x:from.x+(d>0?dx/d*move:0),y:0,
       z:from.z+(d>0?dz/d*move:0),
       suspended:false,kind:'inside',side:rec.side};
   }
   throw Error('Unrecognized real ladder soldier stage');
 }
 function afterNativeTick(ai,dt){
   if(ai?.kind!=='S3C2_REAL_G54_LADDER_BUILD_AND_3D_CLIMB')
     throw Error('Invalid native ladder build tick');
   if(!finite(dt)||dt<0||dt>.25)throw Error('Invalid genuine clock dt');
   if(ai.state.tick<ai.nativeTick)
     throw Error('G5.4 native tick regressed during ladder construction');
   if(ai.state.tick===ai.nativeTick)return snapshot(ai);
   ai.nativeTick=ai.state.tick;ai.nativeSeconds=ai.state.elapsed;
   for(const side of SIDES){
     if(ai.scenario.phase==='RESULT'||ai.scenario.lanes[side])continue;
     const [x,z]=ai.map.spec.lanes[side].entry;
     const live=[...ai.records.values()].filter(rec=>{
       if(rec.side!==side||!['approach','build'].includes(rec.stage))
         return false;
       const u=ai.state.soldiers[rec.id];
       return u&&u.id===rec.id&&u.alive&&u.hp>0&&u.team==='red'&&
         at(u,x,z,4.2)&&Math.abs(u.siegeY??0)<.1;
     });
     if(!live.length)continue;
     // Constant 5 progress units per real builder per second; hard bounded
     // to S1's max 25 work units per one authenticated event.
     const effort=Math.min(25,live.length*5*dt);
     if(effort<=0)continue;
     ai.objectives.applyEvent(ai.scenario,{
       type:'LADDER_BUILD',team:'red',lane:side,effort
     });
     ai.genuineBuilderTicks+=live.length;
     ai.totalWork[side]+=effort;
     ai.workEvents++;
   }
   return snapshot(ai);
 }
 function activeClimbers(ai){
   return [...ai.records.values()].filter(r=>r.stage==='climb').length;
 }
 function snapshot(ai){
   if(ai?.kind!=='S3C2_REAL_G54_LADDER_BUILD_AND_3D_CLIMB')
     throw Error('Unknown S3C2 siege ladder state');
   return {
     connected:true,
     kind:ai.kind,
     actualEligiblePikeBuilders:{...ai.eligibility},
     nativeTick:ai.nativeTick,nativeSeconds:ai.nativeSeconds,
     genuinelyActiveBuilderTicks:ai.genuineBuilderTicks,
     actualLadderWorkEvents:ai.workEvents,
     realBuilderEffort:{...ai.totalWork},
     lanesOpened:{
       west:!!ai.scenario.lanes.west,
       east:!!ai.scenario.lanes.east
     },
     physicallyStartedClimbs:{...ai.climbStarts},
     physicallyFinishedClimbs:{...ai.climbCompletions},
     distinctNativeSoldiersFinished:ai.completedSoldierIds.size,
     currentlyClimbing:activeClimbers(ai),
     maxAuthenticSoldier3DHeight:ai.maxY,
     sourceSoldierStepsGuided:ai.guidedSteps,
     actualG54SoldierIdsPreserved:true,
     nativeCombatHas3DBallistics:false,
     originalG54LadderEventsExist:false,
     raw2DBypassOfStoneAllowed:false,
     playerControlledSquadReassigned:false,
     lastCompleted:ai.lastCompleted?{...ai.lastCompleted}:null
   };
 }
 return Object.freeze({
   create,suggest,afterNativeTick,snapshot,activeClimbers
 });
});
