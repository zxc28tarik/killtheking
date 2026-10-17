/* Conservative castle bot navigation recovery; no teleports or physics bypass. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaBotRecovery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const REPLAN_AFTER=0.55;
 const CHANGE_TARGET_AFTER=3.2;
 const AVOID_TARGET_FOR=2.5;
 const REPLAN_COOLDOWN=0.7;
 const EMPTY=Object.freeze({replan:false,retarget:false});
 function create(){
  return {blockedFor:0,replanCooldown:0,avoidKey:null,avoidFor:0,replans:0,retargets:0};
 }
 function reset(state){
  Object.assign(state,create());
  return state;
 }
 function allows(state,targetKey){
  return !state||!targetKey||state.avoidFor<=0||state.avoidKey!==targetKey;
 }
 function advance(state,dt,{attempting=false,travel=0,targetKey=null}={}){
  if(!state||!Number.isFinite(dt)||dt<=0)return EMPTY;
  state.avoidFor=Math.max(0,state.avoidFor-dt);
  if(state.avoidFor===0)state.avoidKey=null;
  state.replanCooldown=Math.max(0,state.replanCooldown-dt);
  // Real movement or intentional tactical holding is not a navigation stall.
  if(!attempting||travel>0.025){
   state.blockedFor=0;state.replanCooldown=0;
   return EMPTY;
  }
  state.blockedFor+=dt;
  if(targetKey&&state.blockedFor>=CHANGE_TARGET_AFTER){
   state.avoidKey=targetKey;
   state.avoidFor=AVOID_TARGET_FOR;
   state.blockedFor=0;
   state.replanCooldown=0;
   state.retargets++;
   return {replan:true,retarget:true};
  }
  if(state.blockedFor>=REPLAN_AFTER&&state.replanCooldown===0){
   state.replanCooldown=REPLAN_COOLDOWN;
   state.replans++;
   return {replan:true,retarget:false};
  }
  return EMPTY;
 }
 return {create,reset,allows,advance,REPLAN_AFTER,CHANGE_TARGET_AFTER,AVOID_TARGET_FOR};
});
