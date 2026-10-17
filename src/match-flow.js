/* Kill the King: deterministic four-minute solo free-for-all match lifecycle.
 * Pure state transitions, no renderer or navigation side effects.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaMatch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DURATION=240;
 const DURATIONS=Object.freeze([120,240,480]);
 function validateDuration(seconds){
  if(!DURATIONS.includes(seconds))throw Error('Invalid match duration');
  return seconds;
 }
 function create(seconds=DURATION){
  return {phase:'menu',durationSeconds:validateDuration(seconds),remaining:seconds,result:null};
 }
 function configure(match,seconds){
  validateDuration(seconds);
  if(match.phase!=='menu'&&match.phase!=='results')throw Error('Cannot change duration during a match');
  match.durationSeconds=seconds;
  match.remaining=seconds;
  match.result=null;
  return match;
 }
 function begin(match){
  match.phase='playing';match.remaining=match.durationSeconds;match.result=null;
  return match;
 }
 function pause(match){if(match.phase==='playing')match.phase='paused';return match.phase;}
 function resume(match){if(match.phase==='paused')match.phase='playing';return match.phase;}
 function tick(match,dt){
  if(match.phase!=='playing')return false;
  if(!Number.isFinite(dt)||dt<0)throw Error('Invalid match time step');
  match.remaining=Math.max(0,match.remaining-dt);
  if(match.remaining>0)return false;
  match.phase='results';
  return true;
 }
 function leaderboard(player,bots){
  const entries=[{
   id:'player',name:'Sen_1600',isPlayer:true,
   kills:Math.max(0,player.kills||0),deaths:Math.max(0,player.deaths||0)
  }];
  for(const b of bots){
   entries.push({
    id:'bot:'+b.id,name:String(b.name),isPlayer:false,
    kills:Math.max(0,b.arenaKills||0),deaths:Math.max(0,b.arenaDeaths||0)
   });
  }
  entries.sort((a,b)=>b.kills-a.kills || a.deaths-b.deaths ||
   (a.isPlayer===b.isPlayer?0:a.isPlayer?-1:1) || a.name.localeCompare(b.name,'tr'));
  return entries.map((e,i)=>({...e,rank:i+1,kd:e.deaths>0?e.kills/e.deaths:e.kills}));
 }
 function finish(match,player,bots){
  if(match.phase!=='results')throw Error('Match is not finished');
  if(match.result)return match.result;
  const rows=leaderboard(player,bots);
  const winner=rows[0];
  match.result={winnerId:winner.id,winnerName:winner.name,playerWon:winner.isPlayer,
   standings:rows,seconds:match.durationSeconds};
  return match.result;
 }
 function clock(seconds){
  const n=Math.max(0,Math.ceil(seconds));
  return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 }
 return {DURATION,DURATIONS,create,configure,begin,pause,resume,tick,leaderboard,finish,clock};
});
