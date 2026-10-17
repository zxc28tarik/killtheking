/* Kill the King A2: optional, bounded, match-scoped FFA evidence.
 * Observes actual lethal blows and sampled AI targets. No combat side effects.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaTelemetry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const CLASS_COUNT=4;
 const LOG_LIMIT=24;
 const isActor=id=>id==='player'||(typeof id==='string'&&/^bot:(0|[1-9][0-9]*)$/.test(id));
 const emptyCounts=()=>({playerToBot:0,botToPlayer:0,botToBot:0});
 const emptyTargets=()=>({bot:0,player:0,none:0,invalidSelf:0});

 function create(){
  return {kills:emptyCounts(),classKills:Array(CLASS_COUNT).fill(0),
   samples:0,targetSlots:emptyTargets(),stuckSamples:{},recentKills:[]};
 }
 function reset(state){
  state.kills=emptyCounts();
  state.classKills=Array(CLASS_COUNT).fill(0);
  state.samples=0;state.targetSlots=emptyTargets();
  state.stuckSamples={};state.recentKills=[];
  return state;
 }
 function recordKill(state,attacker,victim,meta={}){
  // Telemetry must never interrupt live combat.
  if(!state||!isActor(attacker)||!isActor(victim)||attacker===victim)return false;
  let kind=null;
  if(attacker==='player'&&victim.startsWith('bot:'))kind='playerToBot';
  else if(victim==='player'&&attacker.startsWith('bot:'))kind='botToPlayer';
  else if(attacker.startsWith('bot:')&&victim.startsWith('bot:'))kind='botToBot';
  if(!kind)return false;
  state.kills[kind]++;
  if(kind==='playerToBot'&&Number.isInteger(meta.classIdx)&&
   meta.classIdx>=0&&meta.classIdx<CLASS_COUNT)state.classKills[meta.classIdx]++;
  state.recentKills.push({
   attacker,victim,kind,
   weapon:typeof meta.weapon==='string'?meta.weapon:'',
   classIdx:Number.isInteger(meta.classIdx)?meta.classIdx:null,
   second:Number.isFinite(meta.second)?Math.max(0,Math.round(meta.second*10)/10):null
  });
  if(state.recentKills.length>LOG_LIMIT)state.recentKills.shift();
  return true;
 }
 function sampleTargets(state,bots){
  if(!state||!Array.isArray(bots))return false;
  const aliveIds=new Set(bots.filter(b=>b&&!b.dead).map(b=>b.id));
  state.samples++;
  for(const bot of bots){
   if(!bot||bot.dead)continue;
   let category='none';
   if(bot.arenaTargetType==='player')category='player';
   else if(bot.arenaTargetType==='bot'){
    if(bot.arenaTargetId===bot.id)category='invalidSelf';
    else if(aliveIds.has(bot.arenaTargetId))category='bot';
   }
   state.targetSlots[category]++;
   // Repath intentionally clears navPath while a bot can remain stuck.
   // Use the continuous stuck timer rather than waypoint presence.
   if(Number.isFinite(bot.navStuck)&&bot.navStuck>=2){
    const id=String(bot.id);
    state.stuckSamples[id]=(state.stuckSamples[id]||0)+1;
   }
  }
  return true;
 }
 function snapshot(state){
  return {
   kills:{...state.kills},classKills:state.classKills.slice(),
   samples:state.samples,targetSlots:{...state.targetSlots},
   stuckSamples:{...state.stuckSamples},
   recentKills:state.recentKills.map(e=>({...e}))
  };
 }
 return {create,reset,recordKill,sampleTargets,snapshot,LOG_LIMIT};
});
