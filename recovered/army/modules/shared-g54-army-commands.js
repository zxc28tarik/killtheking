/* Kill the King AK-01: one G5.4 native army command contract for open
 * field and castle battle adapters. Not a second combat/AI/control engine.
 * No free control of non-player squads, artificial soldier status, or edits
 * to the pinned true-side G5.4 implementation.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSharedG54ArmyCommands=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ORDER=Object.freeze(['follow','hold','advance','charge','retreat','flank','skirmish']);
 const FORMATION=Object.freeze(['line','column','square','wedge','loose','shield']);
 const FIRE=Object.freeze(['free','volley','hold']);
 // G5.4 open-field keyboard parity. K/J and X/Z verified by the
 // original G5.4 real-Chromium army-browser acceptance. Fire modes use
 // original Digit7/8/9 direct native fireMode commands.
 const FIELD_KEYS=Object.freeze({
   KeyJ:Object.freeze({action:'order',value:'hold'}),
   KeyK:Object.freeze({action:'order',value:'advance'}),
   KeyZ:Object.freeze({action:'formation',value:'line'}),
   KeyX:Object.freeze({action:'formation',value:'column'}),
   Digit7:Object.freeze({action:'fire',value:'free'}),
   Digit8:Object.freeze({action:'fire',value:'volley'}),
   Digit9:Object.freeze({action:'fire',value:'hold'})
 });
 const valid=x=>typeof x==='number'&&Number.isFinite(x);
 const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function create({engine,bridge,map=null}={}){
   const methods=['issueOrder','setFormation','setFireMode',
     'setDestination','appendWaypoint','setFacing','clearFacing',
     'setSpacing','setFrontage','setDepthScale','clearWaypoints'];
   if(!engine||methods.some(m=>typeof engine[m]!=='function')||
      !engine.ORDERS||!engine.FORMATIONS||!engine.FIRE_MODES||
      !ORDER.every(m=>hasOwn(engine.ORDERS,m))||
      !FORMATION.every(m=>hasOwn(engine.FORMATIONS,m))||
      !FIRE.every(m=>hasOwn(engine.FIRE_MODES,m))||
      bridge?.state?.soldiers?.length!==140||
      bridge?.state?.squads?.length!==8||
      map&&!map.spec?.bounds)
     throw Error('AK-01 requires authentic native G5.4 command contracts');
   const c={kind:'KTK_SHARED_G54_NATIVE_ARMY_COMMAND_CONTRACT',
     engine,bridge,map,attempts:0,accepted:0,rejected:0,
     lastResult:null};
   const s=bridge.state;
   const who=s.squads[s.playerSquadId];
   if(!who||!who.playerControlled||who.team!==s.playerTeam||
      s.squads.filter(t=>t.playerControlled).length!==1)
     throw Error('AK-01 cannot assume ownership of nonplayer army squads');
   return c;
 }
 function owned(c){
   if(c?.kind!=='KTK_SHARED_G54_NATIVE_ARMY_COMMAND_CONTRACT')
     throw Error('Invalid AK-01 shared native army command adapter');
   const s=c.bridge.state,unit=s.squads[s.playerSquadId];
   if(!unit||!unit.playerControlled||unit.team!==s.playerTeam)
     throw Error('Lost G5.4 native commander squad ownership');
   return unit;
 }
 function snapshot(c){
   const sq=owned(c),s=c.bridge.state;
   const living=s.soldiers.filter(u=>u.squadId===sq.id&&u.alive).length;
   return Object.freeze({
     kind:c.kind,
     originalG54ArmyCommandFunctions:true,
     siegeOnlyCommandModifications:false,
     gameplayCoreSharedWithFieldBattle:true,
     visualLayoutFullyShared:false,
     commandTeam:s.playerTeam,commandSquadId:sq.id,
     commandedRole:sq.type,aliveInSquad:living,
     order:sq.order,formation:sq.formation,
     fireMode:sq.type==='bow'||sq.type==='musket'?sq.fireMode:null,
     nativeCommandStatus:sq.commandStatus,
     nativeCommandRevision:sq.commandRevision,
     spacingScale:sq.spacingScale,
     frontage:sq.frontage,depthScale:sq.depthScale,
     targetX:sq.targetX,targetZ:sq.targetZ,
     queuedWaypoints:sq.waypoints?.length??0,
     attempts:c.attempts,accepted:c.accepted,rejected:c.rejected,
     lastResult:c.lastResult?{...c.lastResult}:null,
     nonPlayerSquadsNeverAuthorized:true,
     noSyntheticSoldierDamageOrWin:true,
     nativeG54SourceUnchanged:true
   });
 }
 function shortcut(input){
   if(!input||typeof input.code!=='string'||
      input.repeat||input.ctrlKey||input.altKey||
      input.metaKey||input.isComposing||input.defaultPrevented)
     return null;
   const target=input.target||null;
   if(target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(
     String(target?.tagName||'').toUpperCase()))return null;
   const cmd=FIELD_KEYS[input.code];
   return cmd?{action:cmd.action,value:cmd.value}:null;
 }
 function pointValid(c,x,z){
   if(!valid(x)||!valid(z))return false;
   const b=c.map?.spec?.bounds;
   if(!b)return Math.abs(x)<=c.engine.BOUNDS&&Math.abs(z)<=c.engine.BOUNDS;
   if(x<=b.minX+1||x>=b.maxX-1||z<=b.minZ+1||z>=b.maxZ-1)
     return false;
   const obstacle=c.map.spec.boxes.some(o=>o.solid&&
     (o.id!=='gate-main'||!c.bridge.scenario.gate.open)&&
     x>=o.x-o.w/2-1.0&&x<=o.x+o.w/2+1.0&&
     z>=o.z-o.d/2-1.0&&z<=o.z+o.d/2+1.0);
   return !obstacle;
 }
 function execute(c,{action,value,x,z}={}){
   const sq=owned(c),state=c.bridge.state,api=c.engine,id=sq.id;
   if(typeof action!=='string')throw Error('Missing G5.4 army command action');
   const legal=['order','formation','fire','position','waypoint',
     'face','clear-face','clear-waypoints','spacing','frontage','depth'];
   if(!legal.includes(action))
     throw Error('Unknown authentic G5.4 command: '+action);
   let ok=false,reason=null;
   if(state.playerHealth<=0||c.bridge.scenario?.phase==='RESULT'||
      !sq.alive){
     reason='G5.4 commander dead, finished or squad eliminated';
   }else if(action==='order'){
     if(!ORDER.includes(value))reason='Unsupported native G5.4 order';
     else ok=api.issueOrder(state,id,value,true);
   }else if(action==='formation'){
     if(!FORMATION.includes(value))reason='Unsupported native G5.4 formation';
     else ok=api.setFormation(state,id,value,true);
   }else if(action==='fire'){
     if(!FIRE.includes(value))reason='Unsupported native G5.4 fire mode';
     else ok=api.setFireMode(state,id,value,true);
   }else if(action==='position'||action==='waypoint'){
     if(!pointValid(c,x,z))reason='Invalid or physically blocked castle destination';
     else ok=action==='position'?
       api.setDestination(state,id,x,z,true):
       api.appendWaypoint(state,id,x,z,true);
   }else if(action==='face'){
     if(!valid(x)||!valid(z))reason='Invalid native G5.4 heading coordinates';
     else ok=api.setFacing(state,id,x,z,true);
   }else if(action==='clear-face')
     ok=api.clearFacing(state,id,true);
   else if(action==='clear-waypoints')
     ok=api.clearWaypoints(state,id,true);
   else if(action==='spacing'){
     if(!valid(value)||value<.65||value>1.65)
       reason='Native G5.4 spacing must be 0.65–1.65';
     else ok=api.setSpacing(state,id,value,true);
   }else if(action==='frontage'){
     if(!Number.isInteger(value)||value<2||value>sq.startCount)
       reason='Native G5.4 frontage out of squad size';
     else ok=api.setFrontage(state,id,value,true);
   }else if(action==='depth'){
     if(!valid(value)||value<.6||value>1.7)
       reason='Native G5.4 depth outside 0.6–1.7';
     else ok=api.setDepthScale(state,id,value,true);
   }
   if(!ok&&!reason)reason='Native G5.4 rejected this command or no safe route';
   c.attempts++;
   if(ok)c.accepted++;else c.rejected++;
   const response={ok,action,value:value??null,x:x??null,z:z??null,
     reason,playerSquadId:id,nativeCommandRevision:sq.commandRevision};
   c.lastResult=response;
   return {...response};
 }
 return Object.freeze({create,snapshot,execute,shortcut,
   FIELD_KEYS,ORDER,FORMATION,FIRE});
});
