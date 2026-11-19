/* KILL THE KING — S3D1: REAL HUMAN COMMANDER COMBAT BRIDGE.
 * Opt-in on the separate siege candidate only. Consumes the genuine
 * G5.4 playerHealth, playerPosition, playerActive, soldier raycast and
 * damageSoldier(source:'player') API. Weapon damage, bow draw and cadence
 * are read from the existing 2026 player/AI weapon balance module.
 *
 * Native G5.4 remains a 2D ground-level combat engine. Shots on/off
 * castle ramparts, shooter at elevation and 3D projectile ballistics are
 * intentionally NOT represented as working. This does not claim that
 * the original Krunker-style FPS movement/animations were migrated.
 *
 * Melee: 1 sword, 2 spear; ranged: 3 held bow (>=2s draw), 4 musket
 * (4 shots/min). Friendly bodies physically stop shots, never take
 * player damage. Only genuine G5.4 damageSoldier can change HP/kills.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegePlayerCombat=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TYPES=Object.freeze(['sword','spear','bow','musket']);
 const TACTICAL_RANGES=Object.freeze({sword:3.6,spear:5.4,bow:90,musket:100});
 const NATIVE_ROLES=Object.freeze({sword:'sword',spear:'pike',bow:'bow',musket:'musket'});
 const valid=n=>typeof n==='number'&&Number.isFinite(n);
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function validateBridge(bridge,engine,balance){
   const required=['setPlayerPosition','raycastSoldier',
     'damageSoldier','snapshot'];
   if(!bridge?.state||bridge.state.soldiers?.length!==140||
      !engine||required.some(k=>typeof engine[k]!=='function')||
      typeof balance?.damage!=='function'||
      typeof balance?.bowCanRelease!=='function'||
      typeof balance?.bowCanDraw!=='function'||
      !balance?.SHOT_INTERVAL)
     throw Error('Genuine G5.4 player-combat and 140-soldier source required');
   for(const weapon of TYPES){
     if(!valid(TACTICAL_RANGES[weapon])||
        !valid(engine.TYPES[NATIVE_ROLES[weapon]]?.cooldown))
       throw Error('Native player weapon profile missing: '+weapon);
   }
   if(balance.SHOT_INTERVAL.musket!==15||
      balance.SHOT_INTERVAL.bow!==4||
      balance.BOW_MIN_DRAW_SECONDS!==2||
      balance.BOW_DRAW_SECONDS!==3)
     throw Error('Refuse incompatible, unapproved weapon cadence');
 }
 function create({bridge,engine,balance,ballistics=null}={}){
   if(ballistics&&['musket','launch','advance','status'].some(
     k=>typeof ballistics[k]!=='function'))
     throw Error('S3D2c requires a complete native-source 3D siege solver');
   validateBridge(bridge,engine,balance);
   return {
     kind:'S3D1_G54_PLAYER_HP_AND_GROUNDED_WEAPONS',
     bridge,engine,balance,ballistics,weapon:'sword',
     projectileEvents:[],lastProjectileTick:bridge.state.elapsed,
     lastAttack:{sword:-Infinity,spear:-Infinity,bow:-Infinity,musket:-Infinity},
     drawStarted:null,
     activeView:'orbit',pose:null,
     attempts:0,hits:0,kills:0,friendliesBlocked:0,
     heightsBlocked:0,wallOrRangeMisses:0,
     cooldownDenied:0,drawDenied:0,deadDenied:0,
     receivedHits:0,receivedDamage:0,
     lastResult:null,events:[],
     lastNativeHealth:bridge.state.playerHealth
   };
 }
 function requireCombat(c){
   if(c?.kind!=='S3D1_G54_PLAYER_HP_AND_GROUNDED_WEAPONS')
     throw Error('Invalid isolated S3D1 real player-combat state');
 }
 function validPose(p){
   return p&&['fps','tps','orbit'].includes(p.view)&&
     ['red','blue'].includes(p.team)&&
     valid(p.yaw)&&valid(p.pitch)&&
     valid(p.position?.x)&&valid(p.position?.z)&&valid(p.position?.y);
 }
 function sync(c,pose){
   requireCombat(c);
   if(!validPose(pose)||pose.team!==c.bridge.playerTeam)
     throw Error('Preview/native commander side or position mismatch');
   c.pose={view:pose.view,team:pose.team,yaw:pose.yaw,
     pitch:pose.pitch,climbing:!!pose.climbing,
      airborne:!!pose.airborne,sliding:!!pose.sliding,
     position:{...pose.position}};
   c.activeView=pose.view;
   const s=c.bridge.state;
   c.engine.setPlayerPosition(s,pose.position.x,pose.position.z);
   if(Math.abs(s.playerPosition.x-pose.position.x)>.01||
      Math.abs(s.playerPosition.z-pose.position.z)>.01)
     throw Error('G5.4 player position rejected physical siege avatar');
   // Spectator/orbit has no ghost target for AI. Dead player may look,
   // but cannot rejoin the match by changing view.
   s.playerActive=s.playerHealth>0&&pose.view!=='orbit';
   return snapshot(c);
 }
 function canMove(c){
   requireCombat(c);
   return c.bridge.state.playerHealth>0&&
     c.bridge.scenario.phase!=='RESULT';
 }
 function setWeapon(c,weapon){
   requireCombat(c);
   if(!TYPES.includes(weapon))throw Error('Unsupported authentic player weapon');
   c.weapon=weapon;c.drawStarted=null;
   return snapshot(c);
 }
 function pushEvent(c,event){
   c.lastResult=event;
   c.events.push({...event,at:c.bridge.state.elapsed});
   if(c.events.length>20)c.events.shift();
   return event;
 }
 function active(c){
   const s=c.bridge.state;
   if(c.bridge.scenario.phase==='RESULT')return 'match-ended';
   if(s.playerHealth<=0)return 'player-dead';
   if(!c.pose||c.pose.view==='orbit')return 'choose-fps-tps';
   if(c.pose.climbing||c.pose.airborne||
      ((!c.ballistics||c.weapon==='sword'||c.weapon==='spear')&&
        c.pose.position.y>=1))
      return 'unsupported-height';
   if(!s.playerActive)return 'native-player-inactive';
   return null;
 }
 function beginBow(c){
   requireCombat(c);
   if(c.weapon!=='bow')return {status:'not-bow'};
   const error=active(c);
   if(error)return pushEvent(c,{status:error,weapon:'bow',hit:false});
   const now=c.bridge.state.elapsed;
   if(!c.balance.bowCanDraw(c.lastAttack.bow,now)){
     c.drawDenied++;
     return pushEvent(c,{status:'bow-recovery',weapon:'bow',hit:false});
   }
   if(c.drawStarted!==null)return {status:'drawing',weapon:'bow'};
   c.drawStarted=now;
   return pushEvent(c,{status:'drawing',weapon:'bow',hit:false});
 }
 function direction(p,weapon){
   const y=weapon==='sword'||weapon==='spear'?0:
     Math.tan(clamp(p.pitch,-.7,.7)*.58);
   const length=Math.hypot(1,y);
   return {x:Math.sin(p.yaw)/length,y:y/length,
     z:Math.cos(p.yaw)/length};
 }
 function fire(c,drawElapsed=null){
   requireCombat(c);
   const weapon=c.weapon,error=active(c),s=c.bridge.state;
   if(error){
     if(error==='player-dead')c.deadDenied++;
     if(error==='unsupported-height')c.heightsBlocked++;
     return pushEvent(c,{status:error,weapon,hit:false});
   }
   const now=s.elapsed,interval=c.engine.TYPES[NATIVE_ROLES[weapon]].cooldown;
   const cooldown=weapon==='bow'?c.balance.SHOT_INTERVAL.bow:interval;
   if(weapon==='bow'){
     // Actual native simulation time, never a wall-clock shortcut.
     if(!valid(drawElapsed)||!c.balance.bowCanRelease(
       c.lastAttack.bow,now,drawElapsed)){
       c.drawDenied++;
       return pushEvent(c,{status:'bow-not-ready',weapon,hit:false,
         drawnSeconds:valid(drawElapsed)?drawElapsed:0});
     }
   }else if(now-c.lastAttack[weapon]<cooldown-1e-9){
     c.cooldownDenied++;
     return pushEvent(c,{status:'cooldown',weapon,hit:false});
   }
   const pose=c.pose,from={
     x:pose.position.x,
     y:c.ballistics?pose.position.y+(pose.sliding?1.5:2.35):1.85,
     z:pose.position.z
   };
   const aim=direction(pose,weapon);
   const range=TACTICAL_RANGES[weapon];
   if(c.ballistics&&weapon==='bow'){
     const charge=clamp(drawElapsed/3,0,1);
     const arrow=c.ballistics.launch({
       state:s,scenario:c.bridge.scenario,
       from,aim,team:s.playerTeam,charge,range
     });
     if(!arrow)
       return pushEvent(c,{status:'arrow-pool-full',weapon,hit:false});
     c.attempts++;
     c.lastAttack[weapon]=now;
     return pushEvent(c,{status:'arrow-launched',weapon,hit:false,
       projectileId:arrow.id});
   }
   // Native ground-only G5.4 still owns damage. An S3D2c opt-in solver
   // adds the REAL 3D height of S3C2 soldier ladder poses and S1 castle
   // geometry, with no aim-assist or chosen-target bypass.
   const hit=c.ballistics&&weapon==='musket'
     ?c.ballistics.musket({state:s,scenario:c.bridge.scenario,
       from,aim,team:s.playerTeam,range})
     :c.engine.raycastSoldier(s,from,aim,range,s.playerTeam,
       {firstBody:true,returnFriendly:true});
   c.attempts++;
   c.lastAttack[weapon]=now;
   if(hit&&(hit.kind==='castle'||hit.kind==='ground')){
     c.wallOrRangeMisses++;
     return pushEvent(c,{status:'castle-blocked',weapon,hit:false,
       colliderId:hit.colliderId??null});
   }
   if(!hit){
     c.wallOrRangeMisses++;
     return pushEvent(c,{status:'miss',weapon,hit:false});
   }
   if(hit.soldier.team===s.playerTeam){
     c.friendliesBlocked++;
     return pushEvent(c,{status:'friendly-block',weapon,hit:false,
       targetId:hit.targetId});
   }
   if(!c.ballistics&&(hit.soldier.siegeY??0)>=1){
     c.heightsBlocked++;
     return pushEvent(c,{status:'elevated-target-unsupported',weapon,
       hit:false,targetId:hit.targetId});
   }
   const charge=weapon==='bow'?clamp(drawElapsed/3,0,1):1;
   const power=c.balance.damage(weapon,hit.zone,charge);
   const changed=c.engine.damageSoldier(s,hit.targetId,power,
     {source:'player',weapon,zone:hit.zone});
   if(!changed){
     return pushEvent(c,{status:'no-authorized-target',weapon,
       hit:false,targetId:hit.targetId});
   }
   if(changed.damage>0)c.hits++;
   if(changed.killed)c.kills++;
   return pushEvent(c,{status:changed.blocked?'shield-blocked':'hit',
     weapon,hit:changed.damage>0,targetId:hit.targetId,
     damage:changed.damage,zone:hit.zone,killed:changed.killed,
     blocked:!!changed.blocked});
 }
 function trigger(c){
   requireCombat(c);
   return c.weapon==='bow'?beginBow(c):fire(c);
 }
 function releaseBow(c){
   requireCombat(c);
   if(c.weapon!=='bow'||c.drawStarted===null)
     return {status:'no-active-bow-draw',weapon:c.weapon};
   const elapsed=Math.max(0,c.bridge.state.elapsed-c.drawStarted);
   c.drawStarted=null;
   return fire(c,elapsed);
 }
 function receive(c){
   requireCombat(c);
   const s=c.bridge.state;
   if(c.ballistics){
     const delta=s.elapsed-c.lastProjectileTick;
     if(!valid(delta)||delta<0)
       throw Error('S3D2c native clock moved backwards');
     // Native G5.4 frame is bounded, and projectile solver substeps
     // to prevent tunnelling. Never invent a wall-clock projectile hit.
     let remain=delta;
     while(remain>1e-8){
       const dt=Math.min(.25,remain);
       const impacts=c.ballistics.advance({
         state:s,scenario:c.bridge.scenario,dt
       });
       for(const impact of impacts){
         let event={weapon:'bow',hit:false,projectileId:impact.id,
           sourceProjectileImpact:true};
         if(impact.kind==='soldier'&&impact.friendly){
           c.friendliesBlocked++;
           event={...event,status:'friendly-block',
             targetId:impact.targetId};
         }else if(impact.kind==='soldier'){
           // Only the original G5.4 engine modifies soldier HP/kills.
           const charge=clamp(impact.charge,0,1);
           const raw=c.balance.damage('bow',impact.zone,charge);
           const changed=c.engine.damageSoldier(s,impact.targetId,raw,
             {source:'player',weapon:'bow',zone:impact.zone});
           if(!changed){
             event={...event,status:'no-authorized-target',
               targetId:impact.targetId};
           }else{
             if(changed.damage>0)c.hits++;
             if(changed.killed)c.kills++;
             event={...event,status:changed.blocked?'shield-blocked':'hit',
               hit:changed.damage>0,damage:changed.damage,
               killed:changed.killed,targetId:impact.targetId,
               zone:impact.zone};
           }
         }else{
           event={...event,status:impact.kind==='castle'||
             impact.kind==='ground'?'castle-blocked':'arrow-expired',
             colliderId:impact.colliderId??null};
           c.wallOrRangeMisses++;
         }
         c.projectileEvents.push(pushEvent(c,event));
       }
       remain-=dt;
     }
     if(c.projectileEvents.length>40)c.projectileEvents.splice(0,
       c.projectileEvents.length-40);
     c.lastProjectileTick=s.elapsed;
   }
   if(!valid(s.playerHealth)||s.playerHealth<0)
     throw Error('Invalid native player HP after original G5.4 tick');
   const current=s.playerHealth;
   if(current<c.lastNativeHealth){
     c.receivedHits++;
     c.receivedDamage+=c.lastNativeHealth-current;
   }
   c.lastNativeHealth=current;
   if(current<=0)c.drawStarted=null;
   return snapshot(c);
 }
 function drainProjectileEvents(c){
   requireCombat(c);
   return c.projectileEvents.splice(0);
 }
 function snapshot(c){
   requireCombat(c);
   const s=c.bridge.state;
   return {
     kind:c.kind,weapon:c.weapon,
     playerHealth:s.playerHealth,
     playerActive:s.playerActive,
     playerTeam:s.playerTeam,
     playerKills:s.playerKills,
     view:c.activeView,
     nativePosition:{...s.playerPosition},
     nativeArmyTime:s.elapsed,
     pendingBowDrawSeconds:c.drawStarted===null?0:
       Math.max(0,s.elapsed-c.drawStarted),
     attempts:c.attempts,hits:c.hits,kills:c.kills,
     friendlyBodyBlocks:c.friendliesBlocked,
     unsupportedElevationBlocks:c.heightsBlocked,
     misses:c.wallOrRangeMisses,cooldownDenied:c.cooldownDenied,
     bowDrawDenied:c.drawDenied,
     attacksRejectedAfterDeath:c.deadDenied,
     receivedNativeHits:c.receivedHits,
     receivedNativeDamage:c.receivedDamage,
     lastResult:c.lastResult?{...c.lastResult}:null,
     actualG54NativeDamageAndPlayerHealth:true,
     realFFAOriginalMovementPorted:false,
     real3dBulletAndArrowBallistics:!!c.ballistics,
     full3DNativeBotBallistics:false,
     real3dRangedPlayerCastle:!!c.ballistics,
     playerArrowPhysics:c.ballistics?c.ballistics.status():null,
     shooterAtElevatedWallSupported:false,
     authenticNativeSoldierDamageOnly:true,
     playerCanMove:canMove(c),
     liveNativeSoldierCount:s.soldiers.filter(u=>u.alive).length
   };
 }
 return Object.freeze({
   create,sync,canMove,setWeapon,beginBow,trigger,fire,releaseBow,receive,drainProjectileEvents,snapshot
 });
});
