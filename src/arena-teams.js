/* Kill the King optional offline team mode. Default remains autonomous FFA.
 * 7 fighters: player+3 allies versus 3 enemies (4v3); no online matchmaking.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaTeams=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MODES=Object.freeze(['ffa','tdm']);
 function teamForBot(id){return Number.isInteger(id)&&id%2===0?'blue':'red';}
 function validate(mode){if(!MODES.includes(mode))throw Error('Invalid arena mode');return mode;}
 function canDamage(mode,attackerTeam,targetTeam){
  validate(mode);
  return mode==='ffa'||attackerTeam!==targetTeam;
 }
 function mayTarget(mode,actorTeam,targetTeam){
  return canDamage(mode,actorTeam,targetTeam);
 }
 function scores(mode,player,bots){
  validate(mode);
  const out={blue:0,red:0};
  if(mode==='ffa')return out;
  out.blue=Math.max(0,player.kills||0);
  for(const b of bots){
   const team=b.teamId||teamForBot(b.id);
   out[team]+=Math.max(0,b.arenaKills||0);
  }
  return out;
 }
 function result(mode,player,bots){
  const tally=scores(mode,player,bots);
  if(mode==='ffa')return null;
  const winner=tally.blue===tally.red?'draw':tally.blue>tally.red?'blue':'red';
  return {mode,winner,scores:tally,playerWon:winner==='blue',
   winnerName:winner==='draw'?'BERABERE':winner==='blue'?'MAVİ TAKIM':'KIRMIZI TAKIM'};
 }
 return {MODES,teamForBot,validate,canDamage,mayTarget,scores,result};
});
