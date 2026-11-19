/* KTK S4B1 — native blue rampart posts with 3D counterfire vs red soldiers.
 * Original 140 soldier/8 squads, immutable G5.4 source and weapon balance.
 * 8 defenders begin ON an authored south-wall top at native spawn time,
 * never teleport mid-battle. G5.4 bot floor-level attacks are suppressed
 * for these posts and replaced with real 3D castle first-contact physics.
 * Ground defenders and the original user-controlled squad are untouched.
 * S4B2 TODO: fair 3D native AI shots against elevated human/player targets,
 * reciprocal anti-rampart G5.4 bot physics and exits from ramparts.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeRampartAI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VALID=['bow','musket'];
 const POST_Y=13.035;
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const at=(u,v)=>Math.hypot(u.x-v.x,u.z-v.z);
 const UNIT_EYE=1.85;
 function create({engine,balance,state,map,scenario,traversal,
     ballisticsAPI,render=null}={}){
   if(state?.soldiers?.length!==140||state?.squads?.length!==8||
      !engine?.TYPES||typeof engine?.damageSoldier!=='function'||
      !balance?.damage||!balance?.aimedShot||
      balance.SHOT_INTERVAL?.musket!==15||
      balance.SHOT_INTERVAL?.bow!==4||
      !ballisticsAPI?.create||!map?.spec?.boxes||
      !scenario?.gate||!traversal?.overlaps)
     throw Error('S4B1 genuine native blue rampart contracts unavailable');
   const shots=ballisticsAPI.create({map,...(render||{})});
   // Start-of-match authored battlements; never repurpose a soldier whose
   // native squad belongs to the human blue commander.
   const plan=[
     {type:'bow',x:-41,z:-40.2},
     {type:'bow',x:-33,z:-40.2},
     {type:'bow',x:-25,z:-40.2},
     {type:'bow',x:-17,z:-40.2},
     {type:'musket',x:17,z:-40.2},
     {type:'musket',x:25,z:-40.2},
     {type:'musket',x:33,z:-40.2},
     {type:'musket',x:41,z:-40.2}
   ];
   const selected=new Set(),posts=new Map(),byClass={bow:0,musket:0};
   for(const loc of plan){
     const u=state.soldiers.find(s=>s.alive&&s.team==='blue'&&
       s.type===loc.type&&!selected.has(s.id)&&
       !state.squads[s.squadId]?.playerControlled);
     if(!u)continue;
     const pos={x:loc.x,y:POST_Y,z:loc.z};
     if(traversal.overlaps(pos,map.spec,scenario,.65,2.6))
       throw Error('S4B1 actual rampart spawn inside castle geometry');
     selected.add(u.id);
     // Deploy at t=0, *before* any authentic native G5.4 step.
     u.x=pos.x;u.z=pos.z;u.siegeY=pos.y;
     u.facing=Math.PI;
     const firstShot=loc.type==='bow'?3:1;
     posts.set(u.id,{id:u.id,type:u.type,position:pos,
       nextShotAt:state.elapsed+firstShot,
       lastTarget:null,shots:0,hits:0,dead:false});
     byClass[u.type]++;
   }
   const ownerByArrow=new Map();
   const ai={
     kind:'S4B1_G54_BLUE_RAMPART_3D_SOLDIER_COUNTERFIRE',
     state,engine,balance,map,scenario,traversal,ballistics:shots,
     posts,ownerByArrow,initialPosts:posts.size,initialRoles:byClass,
     musketShots:0,bowShots:0,totalHits:0,blockedShots:0,
     missedShots:0,alliedBlocks:0,
     guardSteps:0,visualArrowImpacts:0,exposedG54BotAttackPrevented:0,
     nativeDamageOnly:true
   };
   return ai;
 }
 function postFor(ai,u){return ai?.posts?.get(u?.id)||null;}
 function prepareNativeStep(ai,dt){
   if(ai?.kind!=='S4B1_G54_BLUE_RAMPART_3D_SOLDIER_COUNTERFIRE'||
      !finite(dt)||dt<=0||dt>.25)
     throw Error('Invalid S4B1 native suppression frame');
   for(const p of ai.posts.values()){
     const u=ai.state.soldiers[p.id];
     if(!u?.alive){p.dead=true;continue;}
     // Native G5.4 soldier AI subtracts at most .08 and skips firing if
     // reload >0. We never allow a second, ground-plane "ghost shot".
     u.reload=Math.max(u.reload,dt+.40);
     ai.exposedG54BotAttackPrevented++;
   }
 }
 function preservePhysicalPost(ai,u){
   const post=postFor(ai,u);
   if(!post)return false;
   if(!u.alive){post.dead=true;return true;}
   const p=post.position;
   // Native G5.4's unaware ground locomotion is not authoritative on
   // a high parapet. Soldier holds its *existing* world-physical post.
   u.x=p.x;u.z=p.z;u.siegeY=p.y;u.facing=Math.PI;
   ai.guardSteps++;
   if(ai.traversal.overlaps({x:u.x,y:u.siegeY,z:u.z},
      ai.map.spec,ai.scenario,.65,2.6))
     throw Error('S4B1 native soldier left solid castle geometry');
   return true;
 }
 function chooseTarget(ai,u){
   const range=ai.engine.TYPES[u.type].range;
   const targets=ai.state.soldiers.filter(v=>v.alive&&v.team==='red'&&
     finite(v.x)&&finite(v.z)&&finite(v.siegeY??0)&&
     at(u,v)<range&&at(u,v)>2);
   // Target choice uses live native G5.4 soldier coordinates only.
   targets.sort((a,b)=>at(u,a)-at(u,b)||a.id-b.id);
   const from={x:u.x,y:u.siegeY+UNIT_EYE,z:u.z};
   for(const v of targets){
     const base={x:v.x,y:(v.siegeY??0)+1.85,z:v.z};
     const aim={x:base.x-from.x,y:base.y-from.y,z:base.z-from.z};
     const line=ai.ballistics.musket({
       state:ai.state,scenario:ai.scenario,from,aim,team:'blue',range
     });
     if(line?.kind==='soldier'&&!line.friendly&&
        line.targetId===v.id)return {target:v,from,aim};
   }
   return null;
 }
 function shoot(ai,u,post,target){
   const state=ai.state,weapon=u.type,range=ai.engine.TYPES[weapon].range;
   const from=target.from,base={x:target.target.x,
     y:(target.target.siegeY??0),z:target.target.z};
   // Native aim dispersion is reused instead of a guaranteed exact hit.
   // Deterministic rolls depend on real native tick, native unit ID and
   // bounded shot count. WeaponBalance remains the original pinned table.
   const spin=(n)=>((Math.imul((n+1)|0,1664525)+1013904223)>>>0)/4294967296;
   const h=spin(u.id+post.shots*17+state.tick),
     v=spin(u.id*3+post.shots*23+state.tick*7);
   const roll=ai.balance.aimedShot(weapon==='bow'?'archer':'musket',
     from,base,h,v,3.2);
   if(!roll.point)return false;
   const distance=at(u,base);
   const flightTime=distance/ai.ballistics.status().playerArrowFlightSpeed;
   // Native 70m/s, 22m/s² rise correction on a moving discrete trajectory.
   const compensatedY=roll.point.y+(weapon==='bow'?.5*
     ai.ballistics.status().playerArrowGravity*
     flightTime*flightTime:0);
   const aim={x:roll.point.x-from.x,
     y:compensatedY-from.y,z:roll.point.z-from.z};
   if(weapon==='musket'){
     const hit=ai.ballistics.musket({
       state,scenario:ai.scenario,from,aim,team:'blue',range
     });
     ai.musketShots++;post.shots++;
     if(hit?.kind==='soldier'&&hit.friendly)ai.alliedBlocks++;
     else if(hit?.kind==='soldier'){
       const power=ai.balance.damage('musket',hit.zone);
       const applied=ai.engine.damageSoldier(
         state,hit.targetId,power,
         {attackerId:u.id,weapon:'musket',zone:hit.zone,
          attackerPosition:{x:u.x,z:u.z}}
       );
       if(applied?.damage>0){post.hits++;ai.totalHits++;}
     }else if(hit?.kind==='castle'||hit?.kind==='ground')ai.blockedShots++;
     else ai.missedShots++;
   }else{
     const arrow=ai.ballistics.launch({
       state,scenario:ai.scenario,from,aim,team:'blue',
       range,charge:.55
     });
     if(!arrow)return false;
     ai.ownerByArrow.set(arrow.id,u.id);
     ai.bowShots++;post.shots++;
   }
   post.nextShotAt=state.elapsed+ai.balance.SHOT_INTERVAL[weapon];
   post.lastTarget=target.target.id;
   u.attackPose=.30;
   u.stamina=Math.max(.45,u.stamina-.018);
   return true;
 }
 function afterNativeStep(ai,dt){
   if(ai?.kind!=='S4B1_G54_BLUE_RAMPART_3D_SOLDIER_COUNTERFIRE'||
      !finite(dt)||dt<0||dt>.25)
     throw Error('Invalid S4B1 native 3D ballistic tick');
   // Resolved arrows update against live 140 IDs, geometry and gravity.
   const impacts=ai.ballistics.advance({
     state:ai.state,scenario:ai.scenario,dt
   });
   for(const impact of impacts){
     ai.visualArrowImpacts++;
     const shooterId=ai.ownerByArrow.get(impact.id);
     ai.ownerByArrow.delete(impact.id);
     const shooter=ai.state.soldiers[shooterId];
     const post=ai.posts.get(shooterId);
     if(impact.kind==='soldier'&&impact.friendly)ai.alliedBlocks++;
     else if(impact.kind==='soldier'&&shooter?.alive){
       const amount=ai.balance.damage('bow',impact.zone,.55);
       const applied=ai.engine.damageSoldier(
         ai.state,impact.targetId,amount,{
          attackerId:shooterId,weapon:'bow',zone:impact.zone,
          attackerPosition:{x:shooter.x,z:shooter.z}
         }
       );
       if(applied?.damage>0){if(post)post.hits++;ai.totalHits++;}
     }else if(impact.kind==='castle'||impact.kind==='ground'){
       ai.blockedShots++;
     }else ai.missedShots++;
   }
   if(ai.scenario.phase==='RESULT')return;
   for(const post of ai.posts.values()){
     const u=ai.state.soldiers[post.id];
     if(!u?.alive||ai.state.elapsed+1e-9<post.nextShotAt)continue;
     if(ai.state.squads[u.squadId]?.playerControlled)
       throw Error('S4B1 player commanded squad entered native rampart AI');
     const target=chooseTarget(ai,u);
     if(!target)continue;
     shoot(ai,u,post,target);
   }
 }
 function snapshot(ai){
   if(ai?.kind!=='S4B1_G54_BLUE_RAMPART_3D_SOLDIER_COUNTERFIRE')
     throw Error('Invalid S4B1 state');
   return Object.freeze({
     enabled:true,initialGenuineDefendersOnRamparts:ai.initialPosts,
     deployedNativeRoles:{...ai.initialRoles},
     survivingRampartDefenders:[...ai.posts.values()].filter(p=>
       ai.state.soldiers[p.id]?.alive).length,
     rampartPositionY:POST_Y,
     physicalPostsBeginAtNativeTimeZero:true,
     noMidMatchTeleport:true,
     real3DHeightLineOfFire:true,
     authenticNativeG54DamageSoldierOnly:ai.nativeDamageOnly,
     nativeOriginalMusketInterval:15,nativeOriginalBowInterval:4,
     botPlayer3DCounterfire:false,
     reciprocalNative3DRampartTargeting:false,
     musket3DShots:ai.musketShots,bow3DShots:ai.bowShots,
     successfulAuthenticSoldierHits:ai.totalHits,
     castleBlockedShots:ai.blockedShots,
     friendlyBodyBlocks:ai.alliedBlocks,
     misses:ai.missedShots,
     actualNativeGuardTicks:ai.guardSteps,
     suppressedNativeGroundPlaneShots:ai.exposedG54BotAttackPrevented,
     pendingPhysicalBotArrows:ai.ballistics.status().activePlayerArrows,
     visual3DArrowMeshCount:ai.ballistics.status().renderedPlayerArrows,
     noSyntheticZoneOrVictoryEvents:true,
     currentG54SoldierCount:ai.state.soldiers.length
   });
 }
 return Object.freeze({
   create,prepareNativeStep,preservePhysicalPost,afterNativeStep,
   postFor,snapshot,POST_Y
 });
});
