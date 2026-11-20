/* Kill the King S4A — genuine blue army role-coordinated castle defense.
 * OPT-IN for the S3D1 three-mode candidate only. Uses live G5.4 soldier
 * IDs/positions, original role speeds and real S1 phase/terrain.
 * Does NOT fabricate hits, kills, zone occupancy, player squad orders,
 * bot 3D aim, or full tactical siege commander functionality.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeDefenderAI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const ROLES=Object.freeze(['sword','pike','bow','musket']);
 const STAGES=Object.freeze(['gate','courtyard','keep']);
 const ANCHORS=Object.freeze({
  gate:Object.freeze({
   sword:Object.freeze([-7,-27]),pike:Object.freeze([7,-29]),
   bow:Object.freeze([-19,-24]),musket:Object.freeze([19,-24])
  }),
  courtyard:Object.freeze({
   sword:Object.freeze([-7,-3]),pike:Object.freeze([7,-4]),
   bow:Object.freeze([-16,11]),musket:Object.freeze([16,11])
  }),
  keep:Object.freeze({
   sword:Object.freeze([-7,26]),pike:Object.freeze([7,26]),
   bow:Object.freeze([-11,24]),musket:Object.freeze([11,24])
  })
 });
 function create({engine,state,map,scenario,traversal}={}){
   if(!engine?.TYPES||state?.soldiers?.length!==140||
      state?.squads?.length!==8||!map?.spec?.boxes||
      !scenario?.gate||!scenario?.capture||
      typeof traversal?.move!=='function')
     throw Error('S4 genuine G5.4 castle defender AI contracts missing');
   return {
     kind:'S4A_AUTHENTIC_BLUE_CASTLE_DEFENSE',
     engine,state,map,scenario,traversal,
     guidedSteps:0,distinctGuided:new Set(),playerOrdersProtected:0,
     stages:{gate:0,courtyard:0,keep:0},
     recentStage:'gate',stageChanges:0,engagedSkipped:0,
     blockedProposals:0,maxStep:0,roleSteps:Object.create(null)
   };
 }
 function stage(ai){
   if(ai?.kind!=='S4A_AUTHENTIC_BLUE_CASTLE_DEFENSE')
     throw Error('S4 defender state invalid');
   const s=ai.scenario;
   if(s.phase==='KEEP')return 'keep';
   if(s.phase==='RESULT')return null;
   const entered=ai.state.soldiers.some(u=>u.alive&&u.team==='red'&&
     (u.siegeY??0)<1&&Math.abs(u.x)<=49&&
     u.z>-36&&u.z<40);
   if(s.phase==='COURTYARD'||s.phase==='BREACH'||
      s.gate.open||entered)return 'courtyard';
   return 'gate';
 }
 function goal(stageName,u){
   const a=ANCHORS[stageName]?.[u.type];
   if(!a)throw Error('Invalid native S4 defensive class/phase');
   const slot=(u.formationIndex??0);
   if(!Number.isInteger(slot)||slot<0)
     throw Error('Invalid native formation index');
   const col=(slot%5)-2,row=Math.floor(slot/5);
   // Roles are intentionally staggered around protected gate/keep
   // so ranged soldiers occupy a rear line behind the melee screen.
   const x=a[0]+col*(u.type==='bow'||u.type==='musket'?1.4:1.5);
   const z=a[1]+Math.min(row,4)*1.7;
   return {x,z};
 }
 function suggest(ai,u,from,dt){
   if(ai?.kind!=='S4A_AUTHENTIC_BLUE_CASTLE_DEFENSE'||
      !finite(dt)||dt<0||dt>.25)
     throw Error('Invalid S4 native defender frame');
   if(!u||!u.alive||u.team!=='blue'||!ROLES.includes(u.type))
     return null;
   const squad=ai.state.squads[u.squadId];
   if(!squad)throw Error('Defender lost native G5.4 squad');
   if(squad.playerControlled){
     ai.playerOrdersProtected++;
     return null;
   }
   if(!finite(from?.x)||!finite(from?.z)||
      !finite(u.x)||!finite(u.z)||!finite(u.pace))
     throw Error('Invalid S4 live native soldier position/pace');
   const current=stage(ai);
   if(!current)return null;
   if(current!==ai.recentStage){
     ai.recentStage=current;ai.stageChanges++;
   }
   const target=goal(current,u);
   ai.stages[current]++;
   // When already fighting real attackers at melee/ranged range,
   // let the authentic G5.4 AI take over pursuit, guard or fire.
   const role=ai.engine.TYPES[u.type];
   const nearest=ai.state.soldiers.reduce((best,enemy)=>{
     if(!enemy.alive||enemy.team!=='red'||(enemy.siegeY??0)>=1)
       return best;
     const distance=Math.hypot(enemy.x-from.x,enemy.z-from.z);
     return Math.min(best,distance);
   },Infinity);
   const protectRange=u.type==='bow'||u.type==='musket'
     ?Math.min(11,role.range*.4):Math.min(6.5,role.range+1.5);
   if(nearest<protectRange){
     ai.engagedSkipped++;
     return null;
   }
   const dx=target.x-from.x,dz=target.z-from.z;
   const distance=Math.hypot(dx,dz);
   if(distance<.35)return {x:from.x,z:from.z,
     role:u.type,phase:current,atPost:true,kind:'defender'};
   const speed=role.speed;
   if(!finite(speed)||speed<=0||speed>30||
      u.pace<=0||u.pace>2)
     throw Error('Invalid unchanged G5.4 soldier speed');
   const advance=Math.min(Math.max(0,distance-.15),
     speed*u.pace*dt);
   const position={x:from.x+dx/distance*advance,
     z:from.z+dz/distance*advance};
   // The existing bridge's real swept castle collision is the final
   // authority, but reject any individual unsafe proposal here too.
   if(ai.traversal.overlaps({x:position.x,y:0,z:position.z},
     ai.map.spec,ai.scenario,.65,2.6)){
     ai.blockedProposals++;
     return null;
   }
   ai.maxStep=Math.max(ai.maxStep,advance);
   if(advance>0){
     ai.guidedSteps++;ai.distinctGuided.add(u.id);
     ai.roleSteps[u.type]=(ai.roleSteps[u.type]||0)+1;
   }
   return {...position,role:u.type,phase:current,
     atPost:false,kind:'defender'};
 }
 function snapshot(ai){
   if(ai?.kind!=='S4A_AUTHENTIC_BLUE_CASTLE_DEFENSE')
     throw Error('Invalid S4 native defense snapshot');
   return Object.freeze({
     connected:true,kind:ai.kind,
     actualGuidedDefenderSteps:ai.guidedSteps,
     uniqueLivingG54DefenderIdsGuided:ai.distinctGuided.size,
     activeDefensivePhase:stage(ai),
     roleGuidedSteps:{...ai.roleSteps},
     phaseSamples:{...ai.stages},
     phaseChanges:ai.stageChanges,
     nativeEngagementsLeftToG54AI:ai.engagedSkipped,
     blockedUnsafePosts:ai.blockedProposals,
     maxRoleSpeedConstrainedStep:ai.maxStep,
     originalPlayerOwnedSquadCommandsProtected:true,
     realG54SoldierHpAndReloadUnchanged:true,
     authenticG54Bot3DShooting:false,
     syntheticDamageOrZoneEvents:false,
     noTeleportOrArtificialReinforcements:true
   });
 }
 return Object.freeze({create,suggest,snapshot,stage,goal});
});
