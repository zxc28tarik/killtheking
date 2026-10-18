/* A2 opt-in, read-only browser QA summary. Never modifies game mechanics. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaQAReport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const asCount=value=>Number.isFinite(value)?Math.max(0,value):0;
 const kd=(kills,deaths)=>deaths>0?kills/deaths:kills;

 function summarize(snapshot){
  if(!snapshot||!Array.isArray(snapshot.bots)||!Array.isArray(snapshot.matchStandings))
   throw Error('Expected arena status snapshot');
  const bots=snapshot.bots;
  const botNames=new Set(bots.map(b=>String(b.name)));
  const tracked=snapshot.telemetry||null;
  const slots=tracked?tracked.targetSlots:null;
  const totalSlots=slots?Object.values(slots).reduce((n,v)=>n+asCount(v),0):0;
  const overTime=slots?{
   sampleCount:asCount(tracked.samples),
   fighterObservations:totalSlots,
   otherBots:asCount(slots.bot),player:asCount(slots.player),
   none:asCount(slots.none),invalidSelf:asCount(slots.invalidSelf),
   botTargetShare:totalSlots?slots.bot/totalSlots:null,
   playerTargetShare:totalSlots?slots.player/totalSlots:null
  }:null;
  const duration=Number.isFinite(snapshot.matchDurationSeconds)
   ? snapshot.matchDurationSeconds:240;
  const remaining=Number.isFinite(snapshot.matchRemaining)
   ? Math.max(0,snapshot.matchRemaining):duration;
  const targeting={otherBots:0,player:0,none:0,invalidSelfTarget:0};
  const fighters=bots.map(bot=>{
   const target=bot.target==null?null:String(bot.target);
   if(target===String(bot.name))targeting.invalidSelfTarget++;
   else if(target==='player')targeting.player++;
   else if(target&&botNames.has(target))targeting.otherBots++;
   else targeting.none++;
   const kills=asCount(bot.arenaKills),deaths=asCount(bot.arenaDeaths);
   return {name:String(bot.name),role:bot.role||null,weapon:bot.weapon||null,
    kills,deaths,kd:kd(kills,deaths),target,
    navigationStuckSeconds:asCount(bot.navigationStuckTime),
    remainingWaypoints:asCount(bot.remainingWaypoints)};
  });
  const standings=snapshot.matchStandings.map(row=>({
   rank:row.rank,id:row.id,name:row.name,
   kills:asCount(row.kills),deaths:asCount(row.deaths),
   kd:kd(asCount(row.kills),asCount(row.deaths))
  }));
  return {
   phase:snapshot.matchPhase,
   durationSeconds:duration,
   elapsedSeconds:Math.max(0,duration-remaining),
   remainingSeconds:remaining,
   playerClassIndex:Number.isInteger(snapshot.playerClassIdx)?snapshot.playerClassIdx:null,
   playerClassName:snapshot.playerClassName||null,
   playerKills:asCount(snapshot.playerKills),
   playerDeaths:asCount(snapshot.playerDeaths),
   playerParries:asCount(snapshot.playerParries),
   playerKD:kd(asCount(snapshot.playerKills),asCount(snapshot.playerDeaths)),
   botCount:bots.length,
   botKillsTotal:fighters.reduce((n,b)=>n+b.kills,0),
   botDeathsTotal:fighters.reduce((n,b)=>n+b.deaths,0),
   targetingAtSnapshot:targeting,
   navigationStuckCandidates:fighters.filter(b=>b.navigationStuckSeconds>=2).map(b=>b.name),
   killsByDirection:tracked?{...tracked.kills}:null,
   playerKillsByClass:tracked?tracked.classKills.slice():null,
   targetingOverTime:overTime,
   navigationStuckSamples:tracked?{...tracked.stuckSamples}:null,
   recentKills:tracked?tracked.recentKills.map(k=>({...k})):[],
   rangedFireAccuracy:tracked&&tracked.rangedFire
    ? Object.fromEntries(['archer','musket'].map(role=>{
      const x=tracked.rangedFire[role];
      return [role,{...x,accuracy:x.shots>0?x.hits/x.shots:null}];
     }))
    : null,
   scoreCrossCheck:tracked?{
    playerKillsAgree:tracked.kills.playerToBot===asCount(snapshot.playerKills),
    playerDeathsAgree:tracked.kills.botToPlayer===asCount(snapshot.playerDeaths),
    totalBotKillsAgree:tracked.kills.botToPlayer+tracked.kills.botToBot===
     fighters.reduce((sum,bot)=>sum+bot.kills,0)
   }:null,
   fighters,standings,
   notes:'Target counts are instantaneous; sampled targets are approximate one-second fighter observations, not attack counts. Bot kills include bot-vs-player and bot-vs-bot events. Kill directions are recorded on lethal combat events. Class selection is current; classKills tracks player kills at time of kill, not exposure time.'
  };
 }
 return {summarize};
});
