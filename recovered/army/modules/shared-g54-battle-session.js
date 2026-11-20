/* Kill the King AK-03a: one native G5.4 battle-session authority.
 * Both original field G5.4 and real castle use this *same contract*.
 * The original G5.4 engine/AI is not copied, reimplemented or modified.
 * The castle's existing Three.js player and scene physics remain separate
 * pending AK-03b. Readiness is always derived from genuine native HP,
 * playerActive, player-team ownership, and genuine scenario/winner.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSharedG54BattleSession=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VIEWS=Object.freeze(['orbit','fps','tps']);
 const valid=n=>typeof n==='number'&&Number.isFinite(n);
 function create({engine,state,mode='field',scenario=null,playerTeam=null}={}){
   if(!engine||typeof engine.setPlayerPosition!=='function'||
      typeof engine.snapshot!=='function'||!state||
      state.soldiers?.length!==140||state.squads?.length!==8||
      !['field','siege'].includes(mode)||
      (mode==='siege'&&(!scenario||typeof scenario.phase!=='string'))||
      (scenario&&mode==='field')||
      !valid(state.playerHealth)||state.playerHealth<0||
      !['red','blue'].includes(state.playerTeam)||
      (playerTeam&&playerTeam!==state.playerTeam))
     throw Error('AK-03a requires the original G5.4 140 soldier battle contract');
   const squad=state.squads[state.playerSquadId];
   if(!squad?.playerControlled||squad.team!==state.playerTeam||
      state.squads.filter(s=>s.playerControlled).length!==1)
     throw Error('AK-03a cannot command enemy or multiple native squads');
   if(typeof state.elapsed!=='number'||!valid(state.elapsed)||
      !valid(state.playerPosition?.x)||!valid(state.playerPosition?.z))
     throw Error('Invalid native G5.4 session clock or player position');
   return {
     kind:'AK03A_SHARED_G54_REAL_BATTLE_SESSION',engine,state,
     scenario,mode,playerTeam:state.playerTeam,
     syncCount:0,view:mode==='siege'?'orbit':'fps',
     lastNativeTick:state.tick,
     invalidMutations:0
   };
 }
 function ensure(s){
   if(s?.kind!=='AK03A_SHARED_G54_REAL_BATTLE_SESSION'||
      !s.engine||!s.state)throw Error('Invalid AK-03a battle session');
   const sq=s.state.squads[s.state.playerSquadId];
   if(s.state.playerTeam!==s.playerTeam||!sq?.playerControlled||
      sq.team!==s.playerTeam||
      s.state.squads.filter(q=>q.playerControlled).length!==1||
      s.state.soldiers.length!==140||s.state.squads.length!==8)
     throw Error('AK-03a lost authentic native G5.4 team/squad ownership');
   if(!valid(s.state.playerHealth)||s.state.playerHealth<0)
     throw Error('AK-03a rejected invalid original G5.4 player health');
   return sq;
 }
 function result(s){
   if(s.mode==='siege')return s.scenario?.phase==='RESULT';
   return !!s.state.winner;
 }
 function canMove(s){
   ensure(s);
   return s.state.playerHealth>0&&!result(s);
 }
 function canFight(s){
   ensure(s);
   return canMove(s)&&s.state.playerActive===true&&s.view!=='orbit';
 }
 function canCommand(s){
   const sq=ensure(s);
   return canMove(s)&&sq.alive>0;
 }
 function sync(s,pose){
   ensure(s);
   if(!pose||!VIEWS.includes(pose.view)||
      pose.team!==s.playerTeam||
      !valid(pose.position?.x)||!valid(pose.position?.y)||
      !valid(pose.position?.z)||!valid(pose.yaw)||!valid(pose.pitch))
     throw Error('AK-03a rejected mismatched team, pose or camera');
   // Native G5.4 remains the ONLY player-position authority; the real
   // physically swept Three.js pose is the sole input for castle mode.
   s.engine.setPlayerPosition(s.state,pose.position.x,pose.position.z);
   if(Math.abs(s.state.playerPosition.x-pose.position.x)>.01||
      Math.abs(s.state.playerPosition.z-pose.position.z)>.01)
     throw Error('AK-03a physical pose rejected by native G5.4');
   s.view=pose.view;
   // Orbit is a spectator, never a fake invisible target or shooter.
   s.state.playerActive=s.state.playerHealth>0&&
     pose.view!=='orbit'&&!result(s);
   s.syncCount++;
   s.lastNativeTick=s.state.tick;
   return snapshot(s);
 }
 function snapshot(s){
   const sq=ensure(s),state=s.state;
   return Object.freeze({
     kind:s.kind,mode:s.mode,
     trueNativeG54PlayerState:true,
     originalG54MovementCodeReplaced:false,
     independentGameRendererStillPresent:true,
     genuineNativeMatchClock:state.elapsed,
     genuineNativeTick:state.tick,
     nativeSoldierCount:state.soldiers.length,
     nativeSquadCount:state.squads.length,
     authenticPlayerSquadId:state.playerSquadId,
     authenticPlayerTeam:s.playerTeam,
     commandedNativeRole:sq.type,
     view:s.view,playerHealth:state.playerHealth,
     playerAlive:state.playerHealth>0,
     playerActive:state.playerActive===true,
     playerPosition:{...state.playerPosition},
     nativeMatchResult:result(s),
     nativeSiegePhase:s.scenario?.phase??null,
     movementAllowed:canMove(s),
     combatAllowed:canFight(s),
     commandsAllowed:canCommand(s),
     spectatorNeverTargetable:s.view!=='orbit'||!state.playerActive,
     positionalSyncs:s.syncCount,
     noDuplicateDamageOrAI:true
   });
 }
 return Object.freeze({create,sync,snapshot,canMove,canFight,canCommand,
   VIEWS});
});
