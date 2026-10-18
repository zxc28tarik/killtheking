/* Kill the King optional 4v3 offline team deathmatch.
 * Six fixed bots split 3 blue / 3 red; player joins blue. FFA stays default.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaTeams=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MODES=Object.freeze(['ffa','tdm']);
 const PLAYER_TEAM='blue';
 function validate(mode){if(!MODES.includes(mode))throw Error('Invalid arena mode');return mode;}
 function teamForBot(id){return Number.isInteger(id)&&id>=0&&id%2===0?'blue':'red';}
 function canDamage(mode,attackerTeam,targetTeam){
  validate(mode);
  return mode==='ffa'||(!!attackerTeam&&!!targetTeam&&attackerTeam!==targetTeam);
 }
 function mayTarget(mode,actorTeam,targetTeam){return canDamage(mode,actorTeam,targetTeam);}
 function scores(mode,player,bots){
  validate(mode);
  const out={blue:0,red:0};
  if(mode==='ffa')return out;
  out.blue=Math.max(0,player.kills||0);
  for(const b of bots){
   const team=teamForBot(b.id);
   out[team]+=Math.max(0,b.arenaKills||0);
  }
  return out;
 }
 function result(mode,player,bots){
  if(validate(mode)==='ffa')return null;
  const tally=scores(mode,player,bots);
  const winner=tally.blue===tally.red?'draw':tally.blue>tally.red?'blue':'red';
  return {mode,winner,scores:tally,playerWon:winner==='blue',
   winnerId:winner==='draw'?'team:draw':'team:'+winner,
   winnerName:winner==='draw'?'BERABERE':winner==='blue'?'MAVİ TAKIM':'KIRMIZI TAKIM'};
 }
 function validSpawnPool(pool,team){
  if(!Array.isArray(pool)||!pool.length)return [];
  const filtered=pool.filter(p=>p&&Number.isFinite(p.x)&&
   (team==='blue'?p.x< -2:p.x>2));
  return filtered.length?filtered:pool;
 }
 function spawnCandidates(pool,mode,team){
  validate(mode);
  return mode==='tdm'?validSpawnPool(pool,team):pool;
 }
 function name(mode,team){
  return mode==='tdm'?(team==='blue'?'MAVİ':'KIRMIZI'):'FFA';
 }
 return {MODES,PLAYER_TEAM,validate,teamForBot,canDamage,mayTarget,
  scores,result,spawnCandidates,name};
});
