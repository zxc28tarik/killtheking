/* Kill the King S3C1 — native G5.4 soldier-triggered gate strikes.
 *
 * SIEGE-ONLY adapter; original G5.4 combat source is unchanged.
 * Its engine has no building target, so this module implements an EXPLICIT
 * new structure-interaction rule using real living soldiers, native melee
 * reach, native reload and native weapon damage. Not a claim that original
 * G5.4 engine already fired a native structure-damage event.
 *
 * The castle gate is attacked ONLY by living red sword/pike soldiers, on
 * its exterior (south) face, within native melee reach, facing the gate
 * with native attack reload ready, after a REAL G5.4 simulation tick.
 * Consumes the authentic soldier's melee reload and produces S1 GATE_HIT.
 * No debug tools, artificial teleport or free damage.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeStructureCombat=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const MELEE=new Set(['sword','pike']);
 const MAX_EVENTS=60;
 function create({state,engine,scenario,map,objectives}={}){
   if(!state||state.soldiers?.length!==140||
     state.squads?.length!==8||
     typeof engine?.step!=='function'||!engine?.TYPES||
     typeof objectives?.applyEvent!=='function'||
     !map?.spec?.boxes)
     throw Error('Genuine G5.4/S1 structure combat contracts missing');
   const gate=map.spec.boxes.find(b=>b.id==='gate-main');
   if(!gate||!gate.solid||!gate.destructible||gate.h<=0)
     throw Error('Real S1 gate geometry missing');
   const roles={};
   for(const type of MELEE){
     const role=engine.TYPES[type];
     if(!role||!finite(role.range)||!finite(role.cooldown)||
        !finite(role.damage)||role.range<1||role.range>7||
        role.cooldown<.2||role.damage<=0||role.damage>150)
       throw Error('Untrusted native G5.4 melee attack profile '+type);
     roles[type]=role;
   }
   return {
     kind:'S3C1_REAL_SOLDIER_GATE_STRIKE_ADAPTER',
     state,engine,scenario,map,objectives,gate,roles,
     lastTick:state.tick,
     strikes:0,totalDamage:0,blockedByRange:0,
     blockedByCooldown:0,blockedByFacing:0,
     events:[],uniqueAttackers:new Set()
   };
 }
 function targetValid(c,u){
   const role=c.roles[u.type],g=c.gate;
   if(!role||!u.alive||u.hp<=0||u.team!=='red')return false;
   if(!finite(u.x)||!finite(u.z)||!finite(u.facing)||
      !finite(u.reload))throw Error('Nonfinite native attacker state');
   const front=g.z-g.d/2;
   // Cannot hit through gate or from inside; cannot hit side wall.
   const withinFace=Math.abs(u.x-g.x)<=g.w/2+.3;
   const outside=u.z<=front-.45&&u.z>=front-role.range-.45;
   if(!withinFace||!outside){c.blockedByRange++;return false;}
   const dx=g.x-u.x,dz=g.z-u.z;
   const len=Math.hypot(dx,dz);
   const facing=(dx*Math.sin(u.facing)+dz*Math.cos(u.facing))/
     Math.max(len,.001);
   if(facing<.3){c.blockedByFacing++;return false;}
   if(u.reload>.001){c.blockedByCooldown++;return false;}
   return true;
 }
 function afterNativeTick(c){
   if(c?.kind!=='S3C1_REAL_SOLDIER_GATE_STRIKE_ADAPTER')
     throw Error('Invalid genuine siege structure adapter');
   const {state,scenario,objectives}=c;
   if(scenario.phase==='RESULT'||scenario.gate.open)return {strikes:0,opened:false};
   if(!Number.isInteger(state.tick)||state.tick<c.lastTick)
     throw Error('Native G5.4 tick regressed');
   // An RAF callback without an actual 80ms G5.4 step cannot hurt structures.
   if(state.tick===c.lastTick)return {strikes:0,opened:false};
   c.lastTick=state.tick;
   if(!finite(state.elapsed)||state.elapsed<=0)
     throw Error('Invalid native simulation time for gate hit');
   let added=0;
   // Stable original soldier order; no fabricated damage events.
   for(const soldier of state.soldiers){
     if(scenario.gate.open)break;
     if(!targetValid(c,soldier))continue;
     const role=c.roles[soldier.type];
     // One siege swing CONSUMES the same native cooldown; a soldier cannot
     // use this swing AND make a normal strike in the same G5.4 tick.
     soldier.reload=role.cooldown;
     soldier.attackPose=.3;
     const prior=scenario.gate.hp;
     const weapon=soldier.type;
     objectives.applyEvent(scenario,{
       type:'GATE_HIT',team:'red',weapon,damage:role.damage
     });
     const actual=Math.max(0,prior-scenario.gate.hp);
     if(actual<=0)throw Error('Native siege swing failed to damage closed gate');
     c.strikes++;c.totalDamage+=actual;added++;
     c.uniqueAttackers.add(soldier.id);
     c.events.push({
       kind:'G5_4_SIEGE_MELEE_GATE_CONTACT',
       soldierId:soldier.id,team:soldier.team,weapon,
       source:'NEW_S3C1_GATE_INTERACTION_FROM_NATIVE_SOLDIER_STATE',
       damage:actual,nativeTick:state.tick,nativeTime:state.elapsed,
       x:soldier.x,z:soldier.z,
       remainingHp:scenario.gate.hp
     });
     if(c.events.length>MAX_EVENTS)c.events.shift();
   }
   return {strikes:added,opened:scenario.gate.open};
 }
 function snapshot(c){
   if(c?.kind!=='S3C1_REAL_SOLDIER_GATE_STRIKE_ADAPTER')
     throw Error('Unrecognized gate combat state');
   return {
     connected:true,strikes:c.strikes,totalDamage:c.totalDamage,
     uniqueLivingAttackerIds:c.uniqueAttackers.size,
     nativeTick:c.lastTick,
     gateHp:c.scenario.gate.hp,gateOpen:c.scenario.gate.open,
     blockedByRange:c.blockedByRange,
     blockedByCooldown:c.blockedByCooldown,
     blockedByFacing:c.blockedByFacing,
     events:c.events.slice(-14).map(e=>({...e})),
     nativeBuildingEventExistsInOriginalG54:false,
     structureDamageComputedFromRealLivingG54Attacker:true,
     rangedCanDamageGate:false,
     defenderCanDamageGate:false,
     finalizedGateBalanceApproved:false
   };
 }
 return Object.freeze({create,afterNativeTick,snapshot});
});
