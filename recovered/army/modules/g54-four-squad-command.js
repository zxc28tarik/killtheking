/* KTK AK-04a — explicit four-squad native G5.4 command authority.
 * 140 native actor IDs / 8 squads and player's ONE physical squad stay intact.
 * Delegated orders invoke actual ArenaArmyBattle API with onlyPlayer=false
 * AFTER this module validates the player's own TEAM and squad ID.
 *
 * Native G5.4 treats playerControlled as tactical autonomy. We grant a
 * scoped, reversible "human order" lease to the other 3 friendly squads
 * ONLY while G5.4+castle AI are ticking. The canonical state has exactly
 * one real playerControlled squad outside the step. No source edits.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKG54FourSquadCommand=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ACTIONS=Object.freeze(['order','formation','fire','position','waypoint','target',
   'clear-waypoints','face','clear-face','spacing','spacing-delta',
   'frontage','depth']);
 const ORDERS=Object.freeze(['follow','hold','advance','charge',
   'retreat','flank','skirmish']);
 const FORMS=Object.freeze(['line','column','square','wedge','loose','shield']);
 const FIRES=Object.freeze(['free','volley','hold']);
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 function create({engine,bridge,map}={}){
   const methods=['issueOrder','setFormation','setFireMode','setTargetSquad',
     'setDestination','appendWaypoint','clearWaypoints','setFacing',
     'clearFacing','setSpacing','setFrontage','setDepthScale'];
   if(!bridge||!engine||methods.some(x=>typeof engine[x]!=='function')||
     !map?.spec?.bounds||!map.spec.boxes||
     bridge.state?.soldiers?.length!==140||
     bridge.state.squads?.length!==8||
     !['red','blue'].includes(bridge.state.playerTeam)||
     bridge.state.squads.filter(s=>s.playerControlled).length!==1||
     bridge.state.squads[bridge.state.playerSquadId]?.team!==
       bridge.state.playerTeam)
     throw Error('AK-04a requires exact G5.4 140/8 + one authentic player squad');
   const own=bridge.state.squads.filter(s=>s.team===bridge.state.playerTeam);
   if(own.length!==4||new Set(own.map(s=>s.type)).size!==4)
     throw Error('AK-04a requires four unique native allied roles');
   return {kind:'AK04A_NATIVE_FOUR_SQUAD_COMMAND_AUTHORITY',
     engine,bridge,map,realOwnerId:bridge.state.playerSquadId,
     team:bridge.state.playerTeam,
     authorized:own.map(s=>s.id),
     selected:[bridge.state.playerSquadId],activeDelegates:new Set(),
     attempts:0,accepted:0,rejected:0,scopeTicks:0,
     scopeActive:false,scopedBefore:null,lastResult:null};
 }
 function guard(c){
   if(c?.kind!=='AK04A_NATIVE_FOUR_SQUAD_COMMAND_AUTHORITY')
     throw Error('Untrusted G5.4 multi-squad authority');
   const state=c.bridge.state;
   const own=state.squads[c.realOwnerId];
   if(state.soldiers.length!==140||state.squads.length!==8||
     state.playerSquadId!==c.realOwnerId||
     state.playerTeam!==c.team||
     !own?.playerControlled||own.team!==c.team||
     state.squads.filter(s=>s.playerControlled).length!==
       (c.scopeActive?1+c.activeDelegates.size:1)||
     c.authorized.some(id=>state.squads[id]?.team!==c.team))
     throw Error('AK-04a real G5.4 authority/ownership lost');
   if(state.playerHealth<=0||c.bridge.scenario?.phase==='RESULT'||
     !!state.winner)return false;
   return true;
 }
 function select(c,ids){
   guard(c);
   if(c.scopeActive)throw Error('Cannot select during a native G5.4 tick');
   const requested=Array.isArray(ids)?ids:[ids];
   if(!requested.length||requested.length>4||
     requested.some(x=>!Number.isInteger(x)||!c.authorized.includes(x))||
     new Set(requested).size!==requested.length)
     throw Error('AK-04a selected squad not a distinct allied native G5.4 squad');
   c.selected=requested.slice();
   return snapshot(c);
 }
 function pickAll(c){
   return select(c,c.authorized);
 }
 function pointValid(c,x,z){
   if(!finite(x)||!finite(z))return false;
   const b=c.map.spec.bounds;
   if(x<=b.minX+1||x>=b.maxX-1||z<=b.minZ+1||z>=b.maxZ-1)
     return false;
   return !c.map.spec.boxes.some(o=>o.solid&&
     (o.id!=='gate-main'||!c.bridge.scenario.gate.open)&&
     x>=o.x-o.w/2-1&&x<=o.x+o.w/2+1&&
     z>=o.z-o.d/2-1&&z<=o.z+o.d/2+1);
 }
 function issued(c,id,{action,value,x,z}){
   const state=c.bridge.state,engine=c.engine,s=state.squads[id];
   // onlyPlayer=false is a native, publicly exposed G5.4 API argument.
   // Authorization is handled ABOVE: never accept arbitrary squad IDs.
   if(!s?.alive)return {ok:false,reason:'Squad eliminated'};
   let ok=false,reason=null;
   if(action==='order')
     ok=ORDERS.includes(value)&&engine.issueOrder(state,id,value,false);
   else if(action==='formation')
     ok=FORMS.includes(value)&&engine.setFormation(state,id,value,false);
   else if(action==='fire')
     ok=FIRES.includes(value)&&engine.setFireMode(state,id,value,false);
   else if(action==='position'||action==='waypoint'){
     if(!pointValid(c,x,z))reason='Destination blocked or outside real castle';
     else ok=action==='position'?
       engine.setDestination(state,id,x,z,false):
       engine.appendWaypoint(state,id,x,z,false);
   }else if(action==='target'){
     const enemy=state.squads[value];
     if(!Number.isInteger(value)||!enemy?.alive||enemy.team===c.team)
       reason='Target must be an actual living enemy G5.4 squad';
     else ok=engine.setTargetSquad(state,id,value,false);
   }else if(action==='face')
     ok=finite(x)&&finite(z)&&engine.setFacing(state,id,x,z,false);
   else if(action==='clear-face')
     ok=engine.clearFacing(state,id,false);
   else if(action==='clear-waypoints')
     ok=engine.clearWaypoints(state,id,false);
   else if(action==='spacing'||action==='spacing-delta'){
     let spacing=value;
     if(action==='spacing-delta'){
       if(value!==-.1&&value!==.1)
         return {ok:false,reason:'Invalid original native spacing step'};
       spacing=Math.round(Math.max(.65,
         Math.min(1.65,(s.spacingScale||1)+value))*100)/100;
     }
     ok=finite(spacing)&&spacing>=.65&&spacing<=1.65&&
       engine.setSpacing(state,id,spacing,false);
   }else if(action==='frontage')
     ok=Number.isInteger(value)&&value>=2&&value<=s.startCount&&
       engine.setFrontage(state,id,value,false);
   else if(action==='depth')
     ok=finite(value)&&value>=.6&&value<=1.7&&
       engine.setDepthScale(state,id,value,false);
   return {ok:!!ok,reason:reason||
     (ok?null:'Native G5.4 refused unavailable command')};
 }
 function execute(c,command={}){
   if(!ACTIONS.includes(command.action))
     throw Error('Unsupported original G5.4 army action');
   const alive=guard(c);
   if(c.scopeActive)throw Error('Cannot order during a native G5.4 tick');
   const results=[];
   for(const id of c.selected){
     const result=alive?issued(c,id,command):
       {ok:false,reason:'Native G5.4 player is dead or match has ended'};
     results.push({squadId:id,role:c.bridge.state.squads[id].type,
       ok:result.ok,reason:result.reason,
       nativeRevision:c.bridge.state.squads[id].commandRevision});
     c.attempts++;
     if(result.ok){
       c.accepted++;
       if(id!==c.realOwnerId)c.activeDelegates.add(id);
     }else c.rejected++;
   }
   const summary={action:command.action,value:command.value??null,
     x:command.x??null,z:command.z??null,
     ok:results.every(x=>x.ok),someAccepted:results.some(x=>x.ok),
     accepted:results.filter(x=>x.ok).length,rejected:results.filter(x=>!x.ok).length,
     results,reason:results.find(x=>!x.ok)?.reason??null};
   c.lastResult=summary;
   return summary;
 }
 function beginNativeTick(c){
   if(!guard(c))return false;
   if(c.scopeActive)throw Error('Double entered G5.4 command scope');
   const state=c.bridge.state;
   const previous=[c.realOwnerId,...c.activeDelegates].map(id=>({
     id,was:state.squads[id].playerControlled
   }));
   try{
     for(const p of previous)state.squads[p.id].playerControlled=true;
     c.scopeActive=true;c.scopedBefore=previous;c.scopeTicks++;
   }catch(e){
     for(const p of previous)state.squads[p.id].playerControlled=p.was;
     c.scopeActive=false;c.scopedBefore=null;throw e;
   }
   return true;
 }
 function endNativeTick(c){
   if(c?.kind!=='AK04A_NATIVE_FOUR_SQUAD_COMMAND_AUTHORITY')
     throw Error('Invalid four-squad native tick close');
   if(!c.scopeActive)return false;
   try{
     for(const p of c.scopedBefore||[])
       c.bridge.state.squads[p.id].playerControlled=p.was;
   }finally{
     c.scopeActive=false;c.scopedBefore=null;
   }
   // Fails closed if another source changed true physical commander/team.
   guard(c);
   return true;
 }
 function snapshot(c){
   guard(c);
   const state=c.bridge.state;
   const rows=c.authorized.map(id=>{
     const s=state.squads[id];
     return {id,team:s.team,type:s.type,alive:s.alive,
       startCount:s.startCount,order:s.order,formation:s.formation,
       fireMode:['bow','musket'].includes(s.type)?s.fireMode:null,
       commandRevision:s.commandRevision,playerControlledPhysical:id===c.realOwnerId,
       delegatedAIControl:!c.scopeActive&&id!==c.realOwnerId,
       selected:c.selected.includes(id),
       targetX:s.targetX,targetZ:s.targetZ,commandStatus:s.commandStatus};
   });
   return Object.freeze({kind:c.kind,enabled:true,
     nativeG54SourceEdited:false,
     genuineSoldierCount:state.soldiers.length,
     genuineSquadCount:state.squads.length,
     truePhysicalPlayerSquadId:c.realOwnerId,
     playerTeam:c.team,
     authorizedFriendlySquadIds:c.authorized.slice(),
     selectedSquadIds:c.selected.slice(),
     visibleControlledSquadCount:4,
     physicalPlayerControlledSquadCount:
       state.squads.filter(s=>s.playerControlled).length,
     realNativeCommandFunctionsOnly:true,
     liveNativePlayerHP:state.playerHealth,
     originalPlayerDamageAndWeaponAuthorityUnchanged:true,
     opponentSquadsNeverSelectable:true,
     scopedAILeaseActive:c.scopeActive,
     delegatedCommandedSquadIds:[...c.activeDelegates],
     uncommandedAlliedSquadsKeepOriginalAI:true,
     humanCommandsTakePriorityOverNativeLadderAutomation:true,
     scopedNativeAIHoursFake:false,
     nativeCommandTicks:c.scopeTicks,
     attempts:c.attempts,accepted:c.accepted,rejected:c.rejected,
     lastResult:c.lastResult?{...c.lastResult}:null,
     squads:rows});
 }
 return Object.freeze({create,select,pickAll,execute,
   beginNativeTick,endNativeTick,snapshot,ACTIONS,ORDERS,FORMS,FIRES});
});
