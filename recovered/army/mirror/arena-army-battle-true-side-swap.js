
/* Kill the King - balanced 8-squad command battle; browser and Node compatible.
 * Both armies field 10 musketeers, 25 pikemen, 15 archers and 20 swordsmen.
 * Player can command either team; seven other commanders use varied AI.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaArmyBattle=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 // The same immutable weapon damage table powers the actual player and AI.
 const WeaponBalance=typeof ArenaWeaponBalance!=='undefined'?ArenaWeaponBalance:
  (typeof require==='function'?require('./weapon-balance.js'):null);
 if(!WeaponBalance)throw Error('Missing ArenaWeaponBalance before ArenaArmyBattle');
 const TYPES=Object.freeze({
  musket:Object.freeze({name:'Tüfekçi',count:10,range:100,speed:5.8,damage:90,hp:100,cooldown:15,formation:'line'}),
  pike:Object.freeze({name:'Mızrakçı',count:25,range:5.4,speed:10.7,damage:19,hp:110,cooldown:1.9,formation:'square'}),
  bow:Object.freeze({name:'Okçu',count:15,range:90,speed:7.8,damage:24,hp:80,cooldown:4,formation:'loose'}),
  sword:Object.freeze({name:'Kılıçlı',count:20,range:3.6,speed:11.5,damage:17,hp:125,cooldown:1.4,formation:'wedge'})
 });
 const TYPE_ORDER=Object.freeze(['musket','pike','bow','sword']);
 const FORMATIONS=Object.freeze({
  line:Object.freeze({name:'Saf düzeni',spacing:3.5}),
  column:Object.freeze({name:'Yürüyüş kolu',spacing:3.4}),
  square:Object.freeze({name:'Kare savunma',spacing:3.2}),
  wedge:Object.freeze({name:'Kama hücumu',spacing:3.5}),
  loose:Object.freeze({name:'Dağınık düzen',spacing:5.4}),
  shield:Object.freeze({name:'Kalkan duvarı',spacing:2.35})
 });
 const ORDERS=Object.freeze({
  follow:'BENİ TAKİP ET',hold:'MEVZİ TUT',advance:'İLERLE',charge:'HÜCUM',
  retreat:'GERİ ÇEKİL',flank:'KANATTAN SALDIR',position:'SEÇİLEN NOKTAYA GİT',skirmish:'TACİZ ET'
 });
 const FIRE_MODES=Object.freeze({free:'SERBEST ATIŞ',volley:'TOPLU ATEŞ',hold:'ATEŞİ KES'});
 // G4.4: Combat layouts are temporary overlays, not player-issued orders.
 const COMBAT_POSTURES=Object.freeze({
  standard:Object.freeze({name:'Normal düzen',form:null,spacing:1,depth:1,frontage:null}),
  assault:Object.freeze({name:'Sıkı hücum',form:'wedge',spacing:.79,depth:.88,frontage:null}),
  brace:Object.freeze({name:'Mızrak savunma hattı',form:'shield',spacing:.82,depth:.88,frontage:10}),
  fireline:Object.freeze({name:'Korunan ateş safı',form:'line',spacing:1.02,depth:.82,frontage:12}),
  scatter:Object.freeze({name:'Yakın tehditten açıl',form:'loose',spacing:.96,depth:1.06,frontage:6}),
  reform:Object.freeze({name:'Saf aralarını kapat',form:null,spacing:.78,depth:.83,frontage:null})
 });
 const DEPLOYMENTS=Object.freeze(['blue','red'].flatMap(team=>TYPE_ORDER.map((type,index)=>({
  type,team,x:team==='blue'?-165:165,
  z:[-60,-20,21,61][index],
  name:(team==='blue'?'Mavi ':'Kırmızı ')+TYPES[type].name+' Bölüğü'
 }))));
 const BOUNDS=785; // The whole grassy meadow is 1697 x 1697; teams fight in the center.
 const ARROW_SPEED=70,ARROW_GRAVITY=22,MAX_ARROWS=96,ARROW_LIFETIME=3.3;
 const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
 // Seeded per-unit traits stay stable on replay; no per-frame random teleporting.
 function seeded(seed,id,salt){let v=(Math.imul(id+1,2246822519)^Math.imul(seed+1,3266489917)^salt)>>>0;
  v^=v>>>16;v=Math.imul(v,0x7feb352d);v^=v>>>15;v=Math.imul(v,0x846ca68b);v^=v>>>16;
  return (v>>>0)/4294967296;}

 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 const isRanged=type=>type==='musket'||type==='bow';
 const frontDir=team=>team==='blue'?1:-1;
 // Perception radii used by 7 AI captains and 140 soldiers. Avoid relying on
 // per-frame randomness: a commander has a persistent personality.
 const CLOSE_THREAT=64;
 // G2.3: a rebuilt, tick-local fixed grid for SHORT-RANGE soldier lookups.
 // Large-range weapon raycasts retain the authoritative full-body scan.
 const GRID_CELL=12;
 function buildSpatialGrid(state){
  const cells=new Map();
  for(const unit of state.soldiers){
   if(!unit.alive)continue;
   const x=Math.floor(unit.x/GRID_CELL),z=Math.floor(unit.z/GRID_CELL);
   const key=x+','+z;
   let bucket=cells.get(key);
   if(!bucket){bucket=[];cells.set(key,bucket);}
   bucket.push(unit);
  }
  return {cells,cellSize:GRID_CELL};
 }
 function nearbySoldiers(state,x,z,radius){
  // Outside the simulation tick, return authoritative live data. Tests and
  // immediate event handlers must never depend on stale indexed positions.
  const index=state._spatialIndex;
  if(!index||radius>24||!Number.isFinite(radius))return state.soldiers;
  // A unit may have moved by one physics step since the grid was built.
  // Padding covers that drift; callers still test exact world-space distance.
  const reach=radius+2;
  const minX=Math.floor((x-reach)/GRID_CELL),maxX=Math.floor((x+reach)/GRID_CELL);
  const minZ=Math.floor((z-reach)/GRID_CELL),maxZ=Math.floor((z+reach)/GRID_CELL);
  const members=[];
  for(let cx=minX;cx<=maxX;cx++)for(let cz=minZ;cz<=maxZ;cz++){
   const bucket=index.cells.get(cx+','+cz);
   if(bucket)members.push(...bucket);
  }
  // Preserve stable old tie-breaking by soldier id across cell boundaries.
  if(members.length>1)members.sort((a,b)=>a.id-b.id);
  return members;
 }
 function distanceManeuver(soldier,squad,threat,now){
  if(!threat||!threat.alive||squad.order==='retreat')return {x:0,z:0,kind:'none'};
  const dx=soldier.x-threat.x,dz=soldier.z-threat.z,range=Math.hypot(dx,dz);
  if(range<.1||range>19)return {x:0,z:0,kind:'none'};
  const nx=dx/range,nz=dz/range;
  const repeated=soldier.lastEnemyId===threat.id&&
   (soldier.repeatAttackerHits||0)>=2&&(soldier.repeatWindowUntil||0)>now;
  // Pike: a too-close swordsman is a serious threat; disengage only a few
  // paces, never abandon the formation even under a HOLD command.
  if(soldier.type==='pike'&&range<4.2){
   const back=range<2.7?3.2:1.5;
   return {x:nx*back,z:nz*back,kind:'pike-spacing'};
  }
  // Swords: approach exposed flank rather than colliding head-on with a ready
  // shield. The manoeuvre is brief and bounded by the existing rank leash.
  if(soldier.type==='sword'&&range<7.8&&
      (threat.type==='pike'||threat.type==='sword')&&squad.order!=='hold'){
   const side=soldier.sidestepSide;
   const orbit=repeated?3.2:2.0;
   return {x:-nz*side*orbit,z:nx*side*orbit,kind:'circle'};
  }
  // Ranged fighters recover some breathing room against close melee pressure.
  if(isRanged(soldier.type)&&!isRanged(threat.type)&&range<18){
   const retreat=range<8?4.8:range<14?2.8:1.0;
   const flank=repeated?1.9:.7;
   return {x:nx*retreat-nz*soldier.sidestepSide*flank,
    z:nz*retreat+nx*soldier.sidestepSide*flank,kind:'ranged-spacing'};
  }
  return {x:0,z:0,kind:'none'};
 }
 function localAssessment(state,squad){
  const enemies=state.squads.filter(s=>s.alive>0&&s.team!==squad.team);
  const allies=state.squads.filter(s=>s.alive>0&&s.team===squad.team);
  const nearbyEnemies=enemies.filter(s=>dist(s,squad)<CLOSE_THREAT);
  const friendlyStrength=allies.filter(s=>dist(s,squad)<CLOSE_THREAT)
   .reduce((sum,s)=>sum+s.alive,0);
  const hostileStrength=nearbyEnemies.reduce((sum,s)=>sum+s.alive,0);
  const meleeThreat=nearbyEnemies.filter(s=>!isRanged(s.type))
   .sort((a,b)=>dist(a,squad)-dist(b,squad))[0]||null;
  const localAdvantage=(friendlyStrength+4)/(hostileStrength+4);
  // Enemy pressing a friendly ranged squad matters more than the distant plan.
  const endangeredRanged=allies.filter(s=>isRanged(s.type)&&s.id!==squad.id)
   .map(ally=>({ally,enemy:enemies.filter(e=>!isRanged(e.type))
    .sort((a,b)=>dist(ally,a)-dist(ally,b))[0]}))
   .filter(pair=>pair.enemy&&dist(pair.enemy,pair.ally)<72)
   .sort((a,b)=>dist(a.ally,squad)-dist(b.ally,squad))[0]||null;
  return {nearbyEnemies,meleeThreat,localAdvantage,endangeredRanged,
   friendlyStrength,hostileStrength};
 }
 // Physical ray paths shared by the army and the human player.
 // Decorations are not colliders; each true meadow AABB may stop a shot.
 function setWorldObstacles(state,boxes=[]){
  if(!state||!Array.isArray(boxes))return false;
  state.worldObstacles=boxes.filter(box=>box&&box.solid===true&&
   [box.x,box.y,box.z,box.w,box.h,box.d].every(Number.isFinite)&&
   box.w>0&&box.h>0&&box.d>0).map(box=>({
    minX:box.x-box.w/2,maxX:box.x+box.w/2,
    minY:box.y-box.h/2,maxY:box.y+box.h/2,
    minZ:box.z-box.d/2,maxZ:box.z+box.d/2
   }));
  return true;
 }
 function boxRayEntry(origin,dir,distance,b){
  let entry=0,exit=distance;
  for(const axis of ['x','y','z']){
   const low=b['min'+axis.toUpperCase()],high=b['max'+axis.toUpperCase()];
   const d=dir[axis],o=origin[axis];
   if(Math.abs(d)<1e-9){if(o<low||o>high)return Infinity;continue;}
   const a=(low-o)/d,c=(high-o)/d;
   entry=Math.max(entry,Math.min(a,c));exit=Math.min(exit,Math.max(a,c));
   if(entry>exit)return Infinity;
  }
  return exit>=.01?Math.max(0,entry):Infinity;
 }
 function firstWorldObstacle(state,origin,direction,range){
  if(!state||!Number.isFinite(range)||range<=0)return null;
  const length=Math.hypot(direction.x,direction.y,direction.z);
  if(length<1e-8)return null;
  const ray={x:direction.x/length,y:direction.y/length,z:direction.z/length};
  let best=Infinity;
  for(const box of state.worldObstacles||[])
   best=Math.min(best,boxRayEntry(origin,ray,range,box));
  return best<=range?best:null;
 }
 function worldLineBlocked(state,from,to){
  const direction={x:to.x-from.x,y:to.y-from.y,z:to.z-from.z};
  const distance=Math.hypot(direction.x,direction.y,direction.z);
  const world=firstWorldObstacle(state,from,direction,distance);
  return world!==null&&world<distance-.15;
 }
 // For a real projectile the first living body must win, irrespective of
 // affiliation. Friendly body blocks damage; projectile does not pass through.
 function rangedBodyBlocked(state,attacker,target){
  const origin={x:attacker.x,y:1.85,z:attacker.z};
  const to={x:target.x,y:1.85,z:target.z};
  const dir={x:to.x-origin.x,y:0,z:to.z-origin.z};
  const distance=Math.hypot(dir.x,dir.z);
  if(distance<.05)return false;
  const first=raycastSoldier(state,origin,dir,distance+.85,attacker.team,
   {firstBody:true,returnFriendly:true,ignoreSoldierId:attacker.id});
  if(worldLineBlocked(state,origin,to))return true;
  return !!first&&first.targetId!==target.id;
 }
 // Shots must never pass through living friendly soldiers, even with friendly
 // damage disabled. Blocking an attack also prompts the shooter to find a gap.
 function friendlyFireLaneBlocked(state,attacker,target){
  if(!attacker||!target||!attacker.alive||!target.alive)return false;
  const dx=target.x-attacker.x,dz=target.z-attacker.z,distSq=dx*dx+dz*dz;
  if(distSq<1)return false;
  for(const ally of state.soldiers){
   if(!ally.alive||ally.id===attacker.id||ally.team!==attacker.team)continue;
   const t=((ally.x-attacker.x)*dx+(ally.z-attacker.z)*dz)/distSq;
   if(t<=0||t>=.99)continue;
   const acrossX=attacker.x+t*dx-ally.x,acrossZ=attacker.z+t*dz-ally.z;
   if(acrossX*acrossX+acrossZ*acrossZ<.75*.75)return true;
  }
  return false;
 }
 function squadCohesionEstimate(state,squad){
  const members=state.soldiers.filter(u=>u.alive&&u.squadId===squad.id);
  if(!members.length)return 0;
  const spread=members.reduce((sum,u)=>sum+Math.hypot(u.x-squad.x,u.z-squad.z),0)/members.length;
  return clamp(1-spread/(squad.formation==='loose'?38:31),.18,1);
 }

 function formationOffset(squad,index,activeCount=squad.startCount){
  const n=activeCount,transit=!!(squad.playerControlled&&squad.transitMode&&squad.order==='position');
  // G4.4: AI tactical posture temporarily reshapes the ranks. Player
  // formations and G4.3 narrow-passage column always have priority.
  const posture=!transit&&!squad.playerControlled?
   COMBAT_POSTURES[squad.combatPosture||'standard']:null;
  const form=transit?'column':posture?.form||squad.formation;
  const space=transit?2.15:FORMATIONS[form].spacing*(squad.spacingScale||1)*(posture?.spacing||1);
  const depthScale=transit?.78:(squad.depthScale||1)*(posture?.depth||1);
  let x,z;
  if(form==='wedge'){
   const rank=Math.floor(Math.sqrt(index)),before=rank*rank,inRank=index-before;
   x=(inRank-rank)*space*.95;z=rank*space*.87*depthScale;
  }else{
   const defaultCols=form==='line'?12:form==='column'?3:
    form==='shield'?10:form==='loose'?6:Math.ceil(Math.sqrt(n));
   const cols=transit?Math.min(2,n):Math.min(n,Math.max(2,
    posture?.frontage||squad.frontage||defaultCols));
   const row=Math.floor(index/cols),col=index%cols;
   const rowCount=Math.min(cols,n-row*cols);
   x=(col-(rowCount-1)/2)*space;
   z=row*space*depthScale*(form==='loose'?1.15:1);
  }
  // Local +z is backwards, local +x is right, rotate toward the current enemy.
  const dirX=Math.sin(squad.facing),dirZ=Math.cos(squad.facing);
  return {x:x*dirZ-z*dirX,z:-x*dirX-z*dirZ};
 }
 // G4.4: Observe nearby companies at a bounded cadence, not every soldier
 // or every animation frame. Only AI commanders apply the temporary overlay.
 // Emergency scattering overrides the dwell delay when a melee foe closes in.
 function updateCombatPosture(state,squad){
  if(!squad||!squad.alive)return 'standard';
  if(squad.playerControlled){
   squad.combatPosture='standard';return 'standard';
  }
  if(state.elapsed<(squad.combatPostureCheckAt||0))return squad.combatPosture;
  squad.combatPostureCheckAt=state.elapsed+.48+seeded(state.seed,squad.id,733)*.22;
  let nearest=null,nearestDistance=Infinity;
  let melee=null,meleeDistance=Infinity;
  for(const other of state.squads){
   if(!other.alive||other.team===squad.team)continue;
   const d=dist(squad,other);
   if(d<nearestDistance){nearestDistance=d;nearest=other;}
   if(!isRanged(other.type)&&d<meleeDistance){meleeDistance=d;melee=other;}
  }
  let next='standard';
  const hasSupport=state.squads.some(other=>other.alive&&
   other.team===squad.team&&other.id!==squad.id&&
   (squad.type==='pike'?isRanged(other.type):other.type==='pike'||other.type==='sword')&&
   dist(other,squad)<110);
  if(isRanged(squad.type)){
   if(melee&&meleeDistance<26)next='scatter';
   else if(nearest&&nearestDistance<142&&hasSupport&&squad.order!=='retreat')next='fireline';
  }else if(squad.type==='pike'){
   if(nearest&&nearestDistance<83&&
      (squad.order==='hold'||squad.defenseRole==='screen'||squad.aiRole==='screen'||
       squad.aiRole==='emergency-support'||squad.formation==='shield'))next='brace';
  }else if(squad.type==='sword'){
   if(nearest&&nearestDistance<73&&
     (squad.order==='charge'||squad.order==='advance'||squad.order==='flank'||
      squad.aiRole==='counter-charge')&&squad.morale>.26)next='assault';
  }
  // When casualties reduce a holding unit and danger passes, close gaps.
  if(next==='standard'&&squad.alive<squad.startCount*.65&&
      (squad.order==='hold'||squad.aiRole==='rally')&&nearestDistance>38)
   next='reform';
  const old=squad.combatPosture||'standard';
  const emergency=next==='scatter'&&meleeDistance<15;
  if(next!==old&&(emergency||state.elapsed-(squad.combatPostureSince||0)>=1.8)){
   squad.combatPosture=next;squad.combatPostureSince=state.elapsed;
   squad.combatPostureChanges=(squad.combatPostureChanges||0)+1;
  }
  return squad.combatPosture;
 }
 function create(seed=1600,playerType='sword',playerTeam='blue'){
  if(!TYPES[playerType])throw new RangeError('Unknown player troop type');
  if(playerTeam!=='blue'&&playerTeam!=='red')throw new RangeError('Unknown player team');
  const squads=[],soldiers=[];
  for(const def of DEPLOYMENTS){
   const role=TYPES[def.type],isPlayer=def.team===playerTeam&&def.type===playerType;
   const squad={id:squads.length,type:def.type,team:def.team,name:def.name,
    playerControlled:isPlayer,x:def.x,z:def.z,homeX:def.x,homeZ:def.z,
    facing:def.team==='blue'?Math.PI/2:-Math.PI/2,
    startCount:role.count,alive:role.count,kills:0,enemyId:null,
    spacingScale:1,depthScale:1,frontage:null,lockedFacing:null,
    transitMode:false,transitChangedAt:0,routeClearance:3.4,
    waypoints:[],routeReplans:0,stuckSeconds:0,lastMoveX:def.x,lastMoveZ:def.z,
    commandRoute:[],routeGoal:null,targetSquadId:null,commandStatus:'ready',commandIssuedAt:0,
    commandArrivedAt:null,
    formation:role.formation,combatPosture:'standard',combatPostureSince:0,
    combatPostureCheckAt:0,combatPostureChanges:0,
    order:isPlayer?'hold':'advance',
    fireMode:isRanged(def.type)?'free':'hold',commandElapsed:0,
    morale:1,volleyClock:0,volleyReady:false,volleyWindowUntil:0,
    targetX:def.x,targetZ:def.z,aiCooldown:0,retreatUntil:0,
    stanceChanges:0,commandRevision:0,aiRole:isRanged(def.type)?'fire-support':'frontline',
    tacticalReason:'Hedef arıyor',flankSide:squads.length%2?1:-1,
    rallyX:def.x,rallyZ:def.z,decisionCount:0,lastDecisionAt:-Infinity,
    cohesion:1,underPressure:false,regroupUntil:0,reformUntil:0,nextRetreatEligibleAt:0,operationRole:null,
    aggression:.34+seeded(seed,squads.length,101)*.62,
    judgement:.48+seeded(seed,squads.length,102)*.5,
    nerve:.48+seeded(seed,squads.length,103)*.5,
    initiative:seeded(seed,squads.length,104),
    threatLevel:0,lastThreatAt:-Infinity,lastCounterAt:-Infinity,
    localAdvantage:1,commandStyle:'İlerle',defenseRole:null,supportSquadId:null,aidMissionId:null,aidDecisions:0,
    aidReturnPost:null,aidReturnUntil:0,aidReturnMissionId:null,
    counterStart:null,counterOutcome:null,counterOutcomes:0,
    lastWithdrawalId:null,withdrawalReturns:0,withdrawalRecoveryUntil:0,
    counterGoAt:0,counterIntentId:null,counterPreparations:0};
   squads.push(squad);
   for(let i=0;i<role.count;i++){
    const slot=formationOffset(squad,i);
    soldiers.push({id:soldiers.length,squadId:squad.id,formationIndex:i,team:def.team,
     type:def.type,hp:role.hp,maxHp:role.hp,alive:true,
     x:clamp(squad.x+slot.x,-BOUNDS,BOUNDS),z:clamp(squad.z+slot.z,-BOUNDS,BOUNDS),
     facing:squad.facing,reload:((i*13+seed)%17)*.09,
     attackPose:0,windup:0,hitPose:0,kills:0,
     discipline:.64+seeded(seed,soldiers.length,11)*.36,
     initiative:seeded(seed,soldiers.length,12),
     pace:.85+seeded(seed,soldiers.length,13)*.28,
     offsetX:(seeded(seed,soldiers.length,14)-.5)*1.65,
     offsetZ:(seeded(seed,soldiers.length,15)-.5)*1.6,
     reactionDelay:.12+seeded(seed,soldiers.length,16)*1.15,
     commandSeen:0,responseAt:0,
     suppression:0,sidestepSide:seeded(seed,soldiers.length,17)>.5?1:-1,
     sidestepUntil:0,laneRetryUntil:0,underFireUntil:0,lastEnemyId:null,lastEnemyAt:-Infinity,
     stamina:.75+seeded(seed,soldiers.length,18)*.25,
     // G2: deterministic individual awareness/courage, finite defensive windows.
     awareness:.48+seeded(seed,soldiers.length,19)*.48,
     courage:.38+seeded(seed,soldiers.length,20)*.59,
     microState:'formation',microUntil:0,nextMicroDecision:0,
     guardUntil:0,guardCooldownUntil:0,counterUntil:0,
     rejoinUntil:0,lastThreatAt:-Infinity,threatId:null,
     assistTargetId:null,assistUntil:0,nextSupportCheck:0,
     assistanceCount:0,anticipatedCount:0,
     personalRoute:[],routeComputedAt:-Infinity,routeTargetX:null,routeTargetZ:null,
     stalledTicks:0,
     repeatAttackerHits:0,repeatWindowUntil:0,spacingCount:0});
   }
  }
  return {seed,elapsed:0,tick:0,playerType,playerTeam,playerSquadId:squads.find(s=>s.playerControlled).id,
   squads,soldiers,blueDeaths:0,redDeaths:0,winner:null,events:[],accumulator:0,
   playerPosition:{x:playerTeam==='blue'?-176:176,z:squads.find(s=>s.playerControlled).z},
   playerHealth:100,playerActive:true,playerKills:0,playerHitCooldown:0,
   playerHits:[],combatEvents:[],worldObstacles:[],projectiles:[],nextProjectileId:1,
   teamPlans:{blue:{phase:'deploy',focusId:null,lastAt:-Infinity,rallies:0,operation:null,defense:null,
     support:null,supportHistory:[],nextSupportId:1,lastSupportAt:-Infinity,
     communications:{pending:[],history:[],nextId:1,delivered:0,expired:0},
     assaultHistory:[],reassignmentHistory:[],counterHistory:[],
     withdrawal:null,withdrawalHistory:[],nextWithdrawalId:1,lastWithdrawalAt:-Infinity,
     intelligence:{observations:0,enemyRecords:{},doctrine:'unknown',weakFlankSide:-1,exposedId:null,
      mode:'observe',reason:'Düşman gözlemleniyor',failedAssaults:0,lastModeAt:-Infinity}},
    red:{phase:'deploy',focusId:null,lastAt:-Infinity,rallies:0,operation:null,defense:null,
     support:null,supportHistory:[],nextSupportId:1,lastSupportAt:-Infinity,
     communications:{pending:[],history:[],nextId:1,delivered:0,expired:0},
     assaultHistory:[],reassignmentHistory:[],counterHistory:[],
     withdrawal:null,withdrawalHistory:[],nextWithdrawalId:1,lastWithdrawalAt:-Infinity,
     intelligence:{observations:0,enemyRecords:{},doctrine:'unknown',weakFlankSide:1,exposedId:null,
      mode:'observe',reason:'Düşman gözlemleniyor',failedAssaults:0,lastModeAt:-Infinity}}}};
 }
 function issueOrder(state,squadId,order,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!ORDERS[order]||(onlyPlayer&&!s.playerControlled)||!s.alive)return false;
  s.order=order;s.commandElapsed=0;s.stanceChanges++;s.commandRevision++;
  s.commandIssuedAt=state.elapsed;s.commandArrivedAt=null;s.commandStatus='issued';
  if(order!=='position'){s.commandRoute=[];s.routeGoal=null;s.waypoints=[];
   s.transitMode=false;s.stuckSeconds=0;}
  if(order==='hold'){s.targetX=s.x;s.targetZ=s.z;}
  if(order==='position'&&(!Number.isFinite(s.targetX)||!Number.isFinite(s.targetZ))){s.targetX=s.x;s.targetZ=s.z;}
  return true;
 }
 function setFormation(state,squadId,formation,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!FORMATIONS[formation]||(onlyPlayer&&!s.playerControlled)||!s.alive)return false;
  s.formation=formation;s.stanceChanges++;s.commandRevision++;
  s.commandIssuedAt=state.elapsed;s.commandArrivedAt=null;s.commandStatus='issued';return true;
 }
 // G4: Only the player-led squad may receive tactical-map position,
 // custom facing, or spacing. AI commanders retain their own autonomous plans.
 function pointBlocked(state,x,z){
  return (state.worldObstacles||[]).some(b=>
   x>b.minX-2&&x<b.maxX+2&&z>b.minZ-2&&z<b.maxZ+2);
 }
 // G4.2 obstacle-aware commander routes. Corners are grown beyond the
 // collider by a safety margin, then connected by visible straight segments.
 // The graph is planned ONCE per player click, not on every 80ms army tick.
 const ROUTE_CLEARANCE=3.4;
 function routePointClear(state,x,z,clearance=ROUTE_CLEARANCE){
  return Math.abs(x)<=BOUNDS&&Math.abs(z)<=BOUNDS&&
   !(state.worldObstacles||[]).some(b=>x>=b.minX-clearance&&x<=b.maxX+clearance&&
     z>=b.minZ-clearance&&z<=b.maxZ+clearance);
 }
 function routeSegmentClear(state,a,b,clearance=ROUTE_CLEARANCE){
  const dx=b.x-a.x,dz=b.z-a.z;
  for(const q of state.worldObstacles||[]){
   // Liang-Barsky parametric segment against expanded AABB, inclusive.
   const box={minX:q.minX-clearance,maxX:q.maxX+clearance,
     minZ:q.minZ-clearance,maxZ:q.maxZ+clearance};
   let lo=0,hi=1;
   for(const [v,d,min,max] of [[a.x,dx,box.minX,box.maxX],
      [a.z,dz,box.minZ,box.maxZ]]){
    if(Math.abs(d)<1e-10){if(v<min||v>max){lo=2;hi=1;break;}continue;}
    const t0=(min-v)/d,t1=(max-v)/d;
    lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
    if(lo>hi)break;
   }
   if(lo<=hi)return false;
  }
  return true;
 }
 function planSquadRoute(state,from,to,clearance=ROUTE_CLEARANCE){
  if(!routePointClear(state,to.x,to.z,clearance))return null;
  if(routeSegmentClear(state,from,to,clearance))return [{...to}];
  const corners=[];
  // Build navigation candidates beyond each expanded obstacle's corners.
  // An epsilon outside the clearance keeps their adjoining edges legal.
  const pad=clearance+.35;
  for(const b of state.worldObstacles||[]){
   for(const x of [b.minX-pad,b.maxX+pad])for(const z of [b.minZ-pad,b.maxZ+pad])
    if(routePointClear(state,x,z,clearance))corners.push({x,z});
  }
  const points=[from,...corners,to],goal=points.length-1;
  const costs=Array(points.length).fill(Infinity),prev=Array(points.length).fill(-1),done=new Set();
  costs[0]=0;
  while(done.size<points.length){
   let u=-1,best=Infinity;
   for(let i=0;i<points.length;i++)if(!done.has(i)&&costs[i]<best){best=costs[i];u=i;}
   if(u<0||u===goal)break;
   done.add(u);
   for(let v=1;v<points.length;v++){
    if(v===u||done.has(v))continue;
    const length=dist(points[u],points[v]);
    if(best+length>=costs[v]||!routeSegmentClear(state,points[u],points[v],clearance))continue;
    costs[v]=best+length;prev[v]=u;
   }
  }
  if(!Number.isFinite(costs[goal]))return null;
  const route=[];
  for(let id=goal;id>0;id=prev[id]){
   if(id<0)return null;
   route.push({...points[id]});
  }
  return route.reverse();
 }
 function setTargetSquad(state,squadId,targetId,onlyPlayer=true){
  const s=state.squads[squadId],enemy=state.squads[targetId];
  if(!s||!s.alive||(onlyPlayer&&!s.playerControlled)||!enemy||!enemy.alive||
    s.team===enemy.team)return false;
  s.targetSquadId=enemy.id;
  s.commandStatus='issued';s.commandIssuedAt=state.elapsed;
  s.commandRevision++;s.stanceChanges++;
  return true;
 }
 function setFrontage(state,squadId,count,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!s.alive||(onlyPlayer&&!s.playerControlled)||!Number.isInteger(count)||
    count<2||count>s.startCount)return false;
  s.frontage=count;s.commandRevision++;s.stanceChanges++;
  s.commandStatus='issued';s.commandIssuedAt=state.elapsed;s.commandArrivedAt=null;
  return true;
 }
 function setDepthScale(state,squadId,depth,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!s.alive||(onlyPlayer&&!s.playerControlled)||!Number.isFinite(depth)||
    depth<.6||depth>1.7)return false;
  s.depthScale=Math.round(depth*100)/100;
  s.commandRevision++;s.stanceChanges++;
  s.commandStatus='issued';s.commandIssuedAt=state.elapsed;s.commandArrivedAt=null;
  return true;
 }
 // G4.3: A compact two-file route is allowed through real 5-6m gaps.
 // Route safety never drops below a 1.9m center clearance; soldiers use
 // their own radius/steering and the normal formation is restored afterwards.
 const NARROW_CLEARANCE=1.9,MAX_WAYPOINTS=8;
 function tacticalRoute(state,from,to){
  const normal=planSquadRoute(state,from,to);
  // A wide formation may have to go all the way around a narrow passage.
  // Compare a safe two-file route against that detour before deciding.
  const compact=planSquadRoute(state,from,to,NARROW_CLEARANCE);
  if(!normal&&!compact)return null;
  if(!normal)return {route:compact,clearance:NARROW_CLEARANCE};
  if(!compact)return {route:normal,clearance:ROUTE_CLEARANCE};
  const length=route=>{
   let total=0,prev=from;
   for(const node of route){total+=dist(prev,node);prev=node;}
   return total;
  };
  return length(compact)*1.35<length(normal)?
   {route:compact,clearance:NARROW_CLEARANCE}:
   {route:normal,clearance:ROUTE_CLEARANCE};
 }
 function setDestination(state,squadId,x,z,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!s.alive||(onlyPlayer&&!s.playerControlled)||
   !Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>BOUNDS||Math.abs(z)>BOUNDS||
   pointBlocked(state,x,z))return false;
  const path=tacticalRoute(state,{x:s.x,z:s.z},{x,z});
  if(!path)return false;
  s.commandRoute=path.route;s.routeGoal={x,z};s.routeClearance=path.clearance;
  s.targetX=x;s.targetZ=z;s.waypoints=[];s.stuckSeconds=0;
  return issueOrder(state,squadId,'position',onlyPlayer);
 }
 function appendWaypoint(state,squadId,x,z,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!s.alive||(onlyPlayer&&!s.playerControlled)||
    !Number.isFinite(x)||!Number.isFinite(z)||
    Math.abs(x)>BOUNDS||Math.abs(z)>BOUNDS||pointBlocked(state,x,z))return false;
  // First click starts movement, subsequent clicks extend the queue.
  if(s.order!=='position'||!s.routeGoal)return setDestination(state,squadId,x,z,onlyPlayer);
  if(s.waypoints.length>=MAX_WAYPOINTS)return false;
  const last=s.waypoints.length?s.waypoints[s.waypoints.length-1]:s.routeGoal;
  if(dist(last,{x,z})<2)return false;
  if(!tacticalRoute(state,last,{x,z}))return false; // Validate atomically.
  s.waypoints.push({x,z});
  s.commandStatus='moving';s.commandArrivedAt=null;
  return true;
 }
 function clearWaypoints(state,squadId,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!s.alive||(onlyPlayer&&!s.playerControlled))return false;
  s.waypoints=[];
  if(s.order==='position')s.commandStatus='moving';
  return true;
 }
 function nearbyObstacleDistance(state,x,z){
  let best=Infinity;
  for(const b of state.worldObstacles||[]){
   const dx=Math.max(0,b.minX-x,x-b.maxX),dz=Math.max(0,b.minZ-z,z-b.maxZ);
   best=Math.min(best,Math.hypot(dx,dz));
  }
  return best;
 }
 function updateTransitFormation(state,s){
  if(!s.playerControlled||s.order!=='position')return;
  const gap=nearbyObstacleDistance(state,s.x,s.z);
  const ahead=s.commandRoute?.[0];
  const narrowRoute=s.routeClearance<ROUTE_CLEARANCE&&ahead&&
   dist(s,ahead)<32;
  const start=s.commandRoute?.length&&gap<9||narrowRoute;
  const retain=gap<17||(narrowRoute&&dist(s,ahead)<38);
  if(!s.transitMode&&start){
   s.transitMode=true;s.transitChangedAt=state.elapsed;s.commandRevision++;
  }else if(s.transitMode&&!retain&&state.elapsed-s.transitChangedAt>1.5){
   s.transitMode=false;s.transitChangedAt=state.elapsed;s.commandRevision++;
  }
 }
 function setFacing(state,squadId,x,z,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!s.alive||(onlyPlayer&&!s.playerControlled)||
   !Number.isFinite(x)||!Number.isFinite(z))return false;
  const dx=x-s.x,dz=z-s.z;
  if(dx*dx+dz*dz<.04)return false;
  s.lockedFacing=Math.atan2(dx,dz);
  s.commandIssuedAt=state.elapsed;s.commandArrivedAt=null;s.commandStatus='issued';
  s.commandRevision++;s.stanceChanges++;
  return true;
 }
 function clearFacing(state,squadId,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!s.alive||(onlyPlayer&&!s.playerControlled))return false;
  s.lockedFacing=null;s.commandRevision++;
  s.commandStatus='issued';s.commandIssuedAt=state.elapsed;s.commandArrivedAt=null;
  return true;
 }
 function setSpacing(state,squadId,scale,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!s.alive||(onlyPlayer&&!s.playerControlled)||
   !Number.isFinite(scale)||scale<.65||scale>1.65)return false;
  s.spacingScale=Math.round(scale*100)/100;
  s.commandRevision++;s.stanceChanges++;
  s.commandStatus='issued';s.commandIssuedAt=state.elapsed;s.commandArrivedAt=null;
  return true;
 }
 function updateCommandStatus(state){
  const s=state.squads[state.playerSquadId];
  if(!s||!s.alive)return;
  const arrived=s.order==='position'?
   dist(s,{x:s.targetX,z:s.targetZ})<=2.8:true;
  const moving=s.order==='position'&&(!arrived||s.commandRoute?.length>1||s.waypoints?.length>0);
  if(moving){s.commandStatus='moving';return;}
  const allies=state.soldiers.filter(u=>u.alive&&u.squadId===s.id);
  if(!allies.length){s.commandStatus='unavailable';return;}
  let close=0;
  for(let i=0;i<allies.length;i++){
   const u=allies[i],slot=formationOffset(s,i,allies.length);
   const dx=u.x-(s.x+slot.x+u.offsetX),dz=u.z-(s.z+slot.z+u.offsetZ);
   if(dx*dx+dz*dz<6.25*6.25&&state.elapsed>=u.responseAt)close++;
  }
  const headingReady=s.lockedFacing==null||
   Math.abs(Math.atan2(Math.sin(s.facing-s.lockedFacing),Math.cos(s.facing-s.lockedFacing)))<.20;
  s.commandStatus=(close/allies.length>=.72&&headingReady)?'complete':'forming';
  if(s.commandStatus==='complete'&&s.commandArrivedAt==null)s.commandArrivedAt=state.elapsed;
 }
 function setFireMode(state,squadId,mode,onlyPlayer=true){
  const s=state.squads[squadId];
  if(!s||!FIRE_MODES[mode]||!isRanged(s.type)||(onlyPlayer&&!s.playerControlled))return false;
  s.fireMode=mode;s.volleyClock=0;s.volleyReady=false;s.volleyWindowUntil=0;s.stanceChanges++;return true;
 }
 function setPlayerPosition(state,x,z){
  if(Number.isFinite(x)&&Number.isFinite(z)){
   state.playerPosition.x=clamp(x,-BOUNDS,BOUNDS);
   state.playerPosition.z=clamp(z,-BOUNDS,BOUNDS);
  }
 }
 // All commanders on the same team share a limited, periodically refreshed plan.
 // The player's squad is never issued orders by this layer.
 function teamMembers(state,team){return state.squads.filter(s=>s.team===team&&s.alive>0);}
 function threatToRanged(state,enemy,team){
  let result=0;
  for(const ally of teamMembers(state,team)){
   if(!isRanged(ally.type))continue;
   const d=dist(ally,enemy);
   if(d<92)result+=Math.max(0,(92-d)/92)*(enemy.type==='sword'?3:enemy.type==='pike'?2:1.4);
  }
  return result;
 }
 // G3: delayed, persistent battlefield intelligence. A commander observes a
 // succession of squad states instead of reading perfect future intentions.
 function readEnemyDoctrine(state,team,plan){
  const intel=plan.intelligence;
  const hostiles=teamMembers(state,team==='blue'?'red':'blue');
  const allies=teamMembers(state,team);
  if(!hostiles.length)return intel;
  let entrenched=0,charging=0,flanking=0;
  const newRecords={};
  for(const enemy of hostiles){
   const old=intel.enemyRecords[enemy.id];
   const moved=old?dist(enemy,old):0;
   // Repeated holding or pressing must last more than one strategic sample.
   const holding=enemy.order==='hold'||enemy.order==='skirmish';
   const pressing=enemy.order==='charge'||enemy.order==='advance';
   const sideStep=old?Math.abs(enemy.z-old.z):0;
   const record={x:enemy.x,z:enemy.z,alive:enemy.alive,
    held:holding?(old?.held||0)+1:0,
    rushed:pressing?(old?.rushed||0)+1:0,
    outflanked:enemy.order==='flank'&&sideStep>3?(old?.outflanked||0)+1:0,
    observedAt:state.elapsed};
   newRecords[enemy.id]=record;
   if(record.held>=2&&moved<8)entrenched++;
   if(record.rushed>=2)charging++;
   if(record.outflanked>=2)flanking++;
  }
  intel.enemyRecords=newRecords;intel.observations++;
  const previous=intel.doctrine;
  const doctrine=flanking>0?'flanking':charging>=2?'aggressive':
   entrenched>=2?'entrenched':'mixed';
  // Do not snap back to mixed on a single temporary behavior change.
  intel.doctrine=(doctrine==='mixed'&&previous!=='unknown'&&intel.observations%3!==0)?previous:doctrine;
  const shooters=hostiles.filter(e=>isRanged(e.type));
  const guard=hostiles.filter(e=>!isRanged(e.type));
  const attackers=allies.filter(e=>!isRanged(e.type)&&!e.playerControlled);
  let bestExposed=null,bestExposure=-Infinity;
  for(const target of shooters){
   const protection=guard.length?Math.min(...guard.map(g=>dist(g,target))):140;
   const nearest=attackers.length?Math.min(...attackers.map(a=>dist(a,target))):400;
   const exposure=Math.min(120,protection)*.035+Math.max(0,(145-nearest)/95)+
    (1-target.alive/target.startCount)*2;
   if(protection>=34&&exposure>bestExposure){bestExposure=exposure;bestExposed=target;}
  }
  intel.exposedId=bestExposed?.id??null;
  const objective=state.squads[plan.focusId]||hostiles[0];
  // Prefer the flank with fewer melee defenders, not a fixed color direction.
  const nearbyGuard=guard.filter(g=>dist(g,objective)<130);
  const plus=nearbyGuard.filter(g=>g.z>objective.z+4).reduce((n,g)=>n+g.alive,0);
  const minus=nearbyGuard.filter(g=>g.z<objective.z-4).reduce((n,g)=>n+g.alive,0);
  if(Math.abs(plus-minus)>3)intel.weakFlankSide=plus<minus?1:-1;
  const threatenedShooters=allies.filter(a=>isRanged(a.type)).some(a=>
   hostiles.some(e=>!isRanged(e.type)&&dist(e,a)<65));
  const mode=threatenedShooters||intel.doctrine==='flanking'?'protect-flank':
   intel.doctrine==='entrenched'?'probe-flank':
   intel.exposedId!==null?'exploit-gap':
   intel.doctrine==='aggressive'?'counter-attack':'combined-arms';
  // Hysteresis: avoid changing the whole plan with every new observation.
  if(mode!==intel.mode&&state.elapsed-intel.lastModeAt>=8){
   intel.mode=mode;intel.lastModeAt=state.elapsed;
  }
  intel.reason=({
   'protect-flank':'Tehdit altındaki kanadı koru',
   'probe-flank':'Sağlam cepheyi zorlamadan zayıf kanadı yokla',
   'exploit-gap':'Korumasız menzilli bölüğe baskı kur',
   'counter-attack':'Düşmanın hücumunu karşıla, uygun anda vur',
   'combined-arms':'Cephe ve kanat hücumunu eşgüdümle',
   'observe':'Düşman gözlemleniyor'
  })[intel.mode];
  return intel;
 }
 // Coordinated front-fix + side-attack + timed reserve. Select living AI
 // commanders only: the human-led formation is never commandeered.
 function flankUnitFallback(state,id){return Number.isInteger(id)?state.squads[id]:null;}
 function buildOperation(state,team,plan){
  const allies=teamMembers(state,team).filter(s=>!s.playerControlled);
  const enemies=teamMembers(state,team==='blue'?'red':'blue');
  if(!enemies.length||!allies.length)return null;
  const choose=(types,exclude=[])=>types.map(type=>allies.find(s=>
   s.type===type&&!exclude.includes(s.id)&&s.morale>.16)).find(Boolean);
  const pin=choose(['pike','sword','musket','bow']);
  const flank=choose(['sword','pike','bow'],pin?[pin.id]:[]);
  const reserve=choose(['bow','musket','pike','sword'],[pin?.id,flank?.id].filter(Number.isInteger));
  const target=state.squads[plan.focusId]||enemies[0];
  if(!pin||!target)return null;
  const previous=plan.operation;
  // Retain direction and command assignments while they remain viable;
  // short tactical cycles must not reset maneuvers to the starting line.
  const stable=previous&&previous.pinId===pin.id&&previous.flankId===(flank?.id??null)
   &&previous.reserveId===(reserve?.id??null)&&state.squads[previous.targetId]?.alive>0;
  const op=stable?previous:{
   stage:'forming',pinId:pin.id,flankId:flank?.id??null,
   reserveId:reserve?.id??null,targetId:target.id,
   flankSide:plan.intelligence?.weakFlankSide??(team==='blue'?-1:1),
   startedAt:state.elapsed,lastStageAt:state.elapsed,
   reserveReleased:false,breakthrough:false,revision:(previous?.revision??0)+1,
   reassignments:(previous?.reassignments??0)+(previous?1:0),assaultMetrics:null,
   failedAssaults:0,lastPinDistance:Infinity,lastProgressAt:state.elapsed,regroupUntil:0,
   synchronization:{pinReady:false,flankReady:false,goAt:null,waiting:true}
  };
  if(!stable&&previous){
   const notice={at:state.elapsed,from:previous.revision,to:op.revision,
    oldPinId:previous.pinId,pinId:op.pinId,oldFlankId:previous.flankId,flankId:op.flankId,
    oldReserveId:previous.reserveId,reserveId:op.reserveId,
    reason:'Kayıplar / düşen moral nedeniyle komuta görevi yeniden dağıtıldı'};
   plan.reassignmentHistory.push(notice);
   if(plan.reassignmentHistory.length>12)plan.reassignmentHistory.shift();
  }
  const objective=state.squads[op.targetId]||target;
  const pinDistance=dist(pin,objective);
  // G3.3: judge an assault by actual target casualties and attacker losses;
  // stage changes alone are not a victory signal.
  if(op.stage==='assault'&&op.assaultMetrics&&!op.assaultMetrics.outcome&&
    state.elapsed-op.assaultMetrics.at>=10){
   const m=op.assaultMetrics;
   const lostTarget=Math.max(0,m.enemyStart-objective.alive);
   const currentAttackers=pin.alive+(flankUnitFallback(state,op.flankId)?.alive??0);
   const lostOwn=Math.max(0,m.ownStart-currentAttackers);
   const gainedGround=m.startDistance-pinDistance;
   const score=lostTarget*1.2-lostOwn*.9+gainedGround*.025;
   const result=lostTarget>lostOwn*.75&&score>2?'successful':
    (lostOwn>lostTarget+2||gainedGround<-18)?'failed':'contested';
   m.outcome=result;m.score=Math.round(score*100)/100;
   m.lostTarget=lostTarget;m.lostOwn=lostOwn;m.gainedGround=Math.round(gainedGround*10)/10;
   plan.assaultHistory.push({at:state.elapsed,revision:op.revision,stage:'assault',
    outcome:result,score:m.score,lostTarget,lostOwn,gainedGround:m.gainedGround});
   if(plan.assaultHistory.length>12)plan.assaultHistory.shift();
   if(result==='failed'){
    op.stage='regroup';op.lastStageAt=state.elapsed;op.regroupUntil=state.elapsed+11;
    op.failedAssaults++;op.revision++;op.breakthrough=false;op.flankSide*=-1;
    if(plan.intelligence){plan.intelligence.failedAssaults++;
     plan.intelligence.reason='Karşı hücum kayıpları yüksek: safları yenile';}
   }
  }
  // A stalled pin or collapsing assault must not be repeated forever.
  // Only assess a failed operation after it has had time to engage.
  if(pinDistance<op.lastPinDistance-7){op.lastPinDistance=pinDistance;op.lastProgressAt=state.elapsed;}
  if(op.stage==='assault'&&state.elapsed-op.lastStageAt>7&&(
      pin.alive/pin.startCount<.36||
      (pinDistance>70&&state.elapsed-op.lastProgressAt>19))){
   op.stage='regroup';op.lastStageAt=state.elapsed;op.regroupUntil=state.elapsed+11;
   op.failedAssaults++;op.revision++;op.breakthrough=false;
   op.flankSide*=-1;
   if(plan.intelligence){plan.intelligence.failedAssaults++;plan.intelligence.mode='regroup';
    plan.intelligence.reason='Başarısız hücum: saf toparla ve başka kanattan dene';
    plan.intelligence.lastModeAt=state.elapsed;}
  }
  if(op.stage==='regroup'){
   if(state.elapsed>=op.regroupUntil){
    op.stage='forming';op.lastStageAt=state.elapsed;op.startedAt=state.elapsed;
    op.lastPinDistance=Infinity;op.lastProgressAt=state.elapsed;
   }else return op;
  }
  const flankUnit=flank;
  const sidePoint={x:objective.x-frontDir(team)*35,
   z:clamp(objective.z+op.flankSide*58,-BOUNDS+25,BOUNDS-25)};
  const flankPositioned=!!flankUnit&&dist(flankUnit,sidePoint)<38;
  const threatened=enemies.some(e=>reserve&&dist(reserve,e)<62);
  if(!flankUnit){
   op.stage='direct';
  }else if(op.stage==='forming'&&(pinDistance<100||state.elapsed-op.startedAt>16)){
   op.stage='pinning';op.lastStageAt=state.elapsed;
  }else if(op.stage==='pinning'&&(flankPositioned||state.elapsed-op.lastStageAt>14)){
   op.stage='enveloping';op.lastStageAt=state.elapsed;
  }else if(op.stage==='enveloping'){
   const pinReady=pinDistance<110&&pin.morale>.23&&pin.alive>0;
   const flankReady=flankUnit?.alive>0&&
     (dist(flankUnit,objective)<52||flankPositioned);
   const overdue=state.elapsed-op.lastStageAt>24;
   const sync=op.synchronization;
   if(sync.receivedAt!==undefined&&state.elapsed-sync.receivedAt>8){
    sync.received=false;sync.signalId=null;sync.receivedAt=undefined;
   }
   sync.pinReady=pinReady;sync.flankReady=flankReady;
   sync.waiting=true;
   if(pinReady&&flankReady&&!sync.signalId){
    const go=sendCommanderSignal(state,team,'assault-go',op.revision,
     pin.id,flankUnit.id,3,11,{revision:op.revision});
    sync.signalId=go.id;sync.goAt=null;
   }
   if(pinReady&&flankReady&&sync.received){
    op.stage='assault';op.lastStageAt=state.elapsed;
    op.assaultMetrics={at:state.elapsed,ownStart:pin.alive+flankUnit.alive,
     enemyStart:objective.alive,startDistance:pinDistance,outcome:null};
    sync.waiting=false;
    sync.goAt=state.elapsed;
   }else if(overdue&&state.elapsed-op.lastStageAt>42){
    op.stage='regroup';op.lastStageAt=state.elapsed;
    op.regroupUntil=state.elapsed+10;op.flankSide*=-1;op.revision++;
   }
  }
  // Reserve remains a firing-screen until pressure, breakthroughs or the
  // main assault justify committing it. No permanent passive unit.
  const pinCasualties=pin.alive/pin.startCount<.58;
  const reserveThreat=threatened||pinCasualties||
   (op.stage==='assault')||(state.elapsed-op.startedAt>38);
  if(reserve&&!op.reserveReleased&&reserveThreat){
   op.reserveReleased=true;
   op.lastReserveAt=state.elapsed;
  }
  op.breakthrough=op.stage==='assault';
  return op;
 }
 // Geometry is recomputed at decision cadence; the move-level escort uses
 // live positions to avoid a stale guard post while the shooters retreat.
 function interpositionPoint(shooter,attacker,distance=15){
  if(!shooter)return null;
  const dx=attacker?attacker.x-shooter.x:frontDir(shooter.team);
  const dz=attacker?attacker.z-shooter.z:0;
  const len=Math.max(.01,Math.hypot(dx,dz));
  return {x:clamp(shooter.x+dx/len*distance,-BOUNDS,BOUNDS),
   z:clamp(shooter.z+dz/len*distance,-BOUNDS,BOUNDS)};
 }
 // Both ranged companies hold a shared defensive fire base instead of
 // independently charging, flanking and abandoning each other's firing lanes.
 // All squad ids are stable, but missing/destroyed squads are re-evaluated every
 // strategy cycle. This is advisory: the player's squad is never commandeered.
 function buildSupportPlan(state,team,plan){
  const friendly=teamMembers(state,team),enemy=teamMembers(state,team==='blue'?'red':'blue');
  const shooters=friendly.filter(s=>isRanged(s.type));
  if(!shooters.length)return null;
  const musket=shooters.find(s=>s.type==='musket')||null;
  const bow=shooters.find(s=>s.type==='bow')||null;
  const melee=friendly.filter(s=>!isRanged(s.type));
  const availableAI=melee.filter(s=>!s.playerControlled&&s.morale>.1);
  const screen=availableAI.find(s=>s.type==='pike')||availableAI.find(s=>s.type==='sword')||null;
  const intercept=availableAI.find(s=>s.type==='sword'&&s.id!==screen?.id)||
   availableAI.find(s=>s.id!==screen?.id)||null;
  let centerZ=shooters.reduce((a,s)=>a+s.homeZ,0)/shooters.length;
  const frontX=melee.length?melee.reduce((a,s)=>a+s.x,0)/melee.length:
   shooters.reduce((a,s)=>a+s.x,0)/shooters.length;
  const nearestFront=enemy.reduce((best,e)=>Math.min(best,Math.abs(e.x-frontX)),Infinity);
  const direction=frontDir(team);
  const behind=nearestFront>130?12:nearestFront>80?0:nearestFront>42?-30:-48;
  let anchorX=clamp(frontX+direction*behind,-BOUNDS+65,BOUNDS-65);
  // G5.4 contact recovery v2: after escorts are lost, the surviving AI
  // firing line advances towards an actual reachable firing position in BOTH
  // world axes. The previous X-only approach ignored lateral Z separation:
  // opposing companies could both wait 120m apart even though their ranged
  // weapon ranges are < 100m, or travel in parallel across the meadow.
  // Derive one center from living shooters, preserve the formation offsets,
  // and cap the tactical correction per planning cycle. The human's HOLD
  // command remains authoritative: its squad is never repositioned here.
  if(!melee.length){
   const shooterCenterX=shooters.reduce((sum,s)=>sum+s.x,0)/shooters.length;
   const shooterCenterZ=shooters.reduce((sum,s)=>sum+s.z,0)/shooters.length;
   const nearestEnemy=enemy.reduce((best,e)=>{
    const dd=shooters.reduce((d,s)=>Math.min(d,dist(s,e)),Infinity);
    return !best||dd<best.distance?{enemy:e,distance:dd}:best;
   },null);
   if(nearestEnemy){
    const deltaX=nearestEnemy.enemy.x-shooterCenterX;
    const deltaZ=nearestEnemy.enemy.z-shooterCenterZ;
    const distance=Math.hypot(deltaX,deltaZ);
    const preferredStandOff=shooters.some(s=>s.type==='bow')?73:82;
    const step=clamp(distance-preferredStandOff,-12,14);
    const aimX=distance>.01?deltaX/distance:direction;
    const aimZ=distance>.01?deltaZ/distance:0;
    const avgRow=shooters.reduce((sum,s)=>sum+(s.type==='musket'?2:-9),0)/shooters.length;
    const avgFlank=shooters.reduce((sum,s)=>sum+(s.type==='musket'?-17:17),0)/shooters.length;
    anchorX=clamp(shooterCenterX+aimX*step+direction*avgRow,
     -BOUNDS+65,BOUNDS-65);
    centerZ=clamp(shooterCenterZ+aimZ*step-avgFlank,
     -BOUNDS+65,BOUNDS-65);
   }else{
    anchorX=clamp(shooterCenterX,-BOUNDS+65,BOUNDS-65);
    centerZ=clamp(shooterCenterZ,-BOUNDS+65,BOUNDS-65);
   }
  }
  const threats=[];
  for(const shooter of shooters){
   const pursuer=enemy.filter(e=>!isRanged(e.type))
    .map(e=>({enemy:e,shooter,distance:dist(e,shooter)}))
    .sort((a,b)=>a.distance-b.distance)[0];
   if(pursuer&&pursuer.distance<100)threats.push(pursuer);
  }
  threats.sort((a,b)=>a.distance-b.distance||a.enemy.id-b.enemy.id);
  const priority=threats[0]||null;
  const endangered=!!priority&&priority.distance<67;
  const teamPhase=shooters.length===1?'single-fire-base':
   endangered?'under-attack':nearestFront<155?'protected-fire-base':'forming-fire-base';
  const slot=type=>{
   const row=type==='musket'?2:-9;
   const flank=type==='musket'?-17:17;
   return {x:clamp(anchorX-direction*row,-BOUNDS,BOUNDS),z:clamp(centerZ+flank,-BOUNDS,BOUNDS)};
  };
  const screenPost={x:clamp(anchorX+direction*25,-BOUNDS,BOUNDS),z:centerZ};
  if(priority){
   // The guard should interpose rather than sprint beyond a raider.
   const victim=priority.shooter,raider=priority.enemy;
   const dd=Math.max(1,dist(victim,raider)),reach=clamp(dd*.42,12,25);
   screenPost.x=clamp(victim.x+(raider.x-victim.x)/dd*reach,-BOUNDS,BOUNDS);
   screenPost.z=clamp(victim.z+(raider.z-victim.z)/dd*reach,-BOUNDS,BOUNDS);
  }
  // G5.1: both ranged companies get their OWN threat assessment. Never
  // reassign the human captain, even when the whole firing line is threatened.
  const coverage=shooters.map(shooter=>{
   const candidates=enemy.filter(e=>!isRanged(e.type))
    .map(e=>({enemy:e,distance:dist(shooter,e)}))
    .sort((a,b)=>a.distance-b.distance||a.enemy.id-b.enemy.id);
   const nearest=candidates[0];
   return {shooterId:shooter.id,enemyId:nearest?.enemy.id??null,
    distance:nearest?.distance??Infinity,
    urgency:nearest?clamp((115-nearest.distance)/115,0,1):0};
  });
  const second=coverage.filter(c=>c.enemyId!==null&&c.distance<105&&
   c.shooterId!==(priority?.shooter.id??null))
   .sort((a,b)=>a.distance-b.distance||a.shooterId-b.shooterId)[0]||null;
  const retreating=shooters.filter(sh=>sh.order==='retreat')
   .map(sh=>({sh,threat:coverage.find(c=>c.shooterId===sh.id)}))
   .filter(o=>o.threat&&o.threat.distance<115)
   .sort((a,b)=>a.threat.distance-b.threat.distance)[0]||null;
  const escort=retreating?(screen||intercept):null;
  // A second guard can react at the other firing position instead of marching
  // to the primary threatened shooter along with the spear wall.
  const secondPost=second?interpositionPoint(
   state.squads[second.shooterId],state.squads[second.enemyId],16):null;
  const escortPost=retreating?interpositionPoint(
   retreating.sh,state.squads[retreating.threat.enemyId],13):null;
  // G5.4 — keep the existing firing base, but pivot its protecting wing
  // towards the strongest ACTUAL melee threat. The rotation is capped per
  // strategy cycle and decays gradually when pressure disappears, preventing
  // implausible synchronous left/right jumps by the entire army.
  const flankThreats=coverage.filter(c=>c.enemyId!==null&&c.distance<90)
   .map(c=>({ ...c,sh:state.squads[c.shooterId],foe:state.squads[c.enemyId]}))
   .filter(c=>c.sh?.alive&&c.foe?.alive);
  let weighted=0,weights=0;
  for(const c of flankThreats){
   const weight=1+3*c.urgency;
   const offset=c.foe.z-c.sh.z;
   const wing=Math.abs(offset)>3?Math.sign(offset):Math.sign(c.sh.z-centerZ)||1;
   weighted+=wing*weight;weights+=weight;
  }
  const desiredShift=weights?clamp(weighted/weights*26,-26,26):0;
  const previousShift=Number.isFinite(plan.defense?.flankShift)?plan.defense.flankShift:0;
  const flankShift=previousShift+clamp(desiredShift-previousShift,-9,9);
  const biasPosition=(pt,delta)=>pt?{
   x:pt.x,z:clamp(pt.z+delta,-BOUNDS+25,BOUNDS-25)}:null;
  // The spear screen leans toward the threatened wing. An available sword
  // intercept stays on the other flank when two shooters face split threats.
  const adjustedScreen=biasPosition(screenPost,flankShift);
  const adjustedSecond=secondPost?biasPosition(secondPost,-flankShift*.3):null;
  const positions={musket:slot('musket'),bow:slot('bow')};
  for(const shooter of shooters){
   if(shooter.playerControlled)continue; // Never displace a human-held post.
   const cover=coverage.find(c=>c.shooterId===shooter.id);
   if(!cover||cover.distance>=85)continue;
   const foe=state.squads[cover.enemyId];
   const side=Math.sign(shooter.z-(foe?.z??shooter.z))||
    (shooter.type==='musket'?-1:1);
   const post=positions[shooter.type];
   const retreat=cover.distance<42?10:cover.distance<65?6:2;
   const shifted={x:clamp(post.x-direction*retreat,-BOUNDS+25,BOUNDS-25),
    z:clamp(post.z+side*Math.min(14,4+cover.urgency*10),-BOUNDS+25,BOUNDS-25)};
   // Preserve a legal open firing post instead of walking into a tree/trunk.
   if(!pointBlocked(state,shifted.x,shifted.z))positions[shooter.type]=shifted;
  }
  return {phase:teamPhase,anchorX,anchorZ:centerZ,
   flankShift,flankThreats:flankThreats.length,frontRevision:
    (plan.defense?.frontRevision||0)+(Math.abs(flankShift-previousShift)>1?1:0),
   musketId:musket?.id??null,bowId:bow?.id??null,
   screenId:screen?.id??null,interceptId:intercept?.id??null,
   threatId:priority?.enemy.id??null,protectedId:priority?.shooter.id??null,
   danger:endangered,threatDistance:priority?.distance??null,
   screenPost:adjustedScreen,positions,
   coverage,secondThreatId:second?.enemyId??null,
   secondProtectedId:second?.shooterId??null,secondPost:adjustedSecond,
   escortId:escort?.id??null,escortSquadId:retreating?.sh.id??null,
   escortPost,refreshedAt:state.elapsed};
 }
 // G5.2 — phased withdrawal is a team-level *support plan*, not an order
 // to the human captain. A bounded rear-guard allows retreating firing lines
 // to reach a fixed rally point, while leaving all player commands intact.
 function finishWithdrawal(state,team,plan,reason){
  const w=plan.withdrawal;
  if(!w)return;
  plan.withdrawalHistory.push({id:w.id,at:state.elapsed,stage:'finished',
   shooterId:w.shooterId,shooterIds:[...(w.shooterIds||[w.shooterId])],
   screenId:w.screenId,rearId:w.rearId,guardRotations:w.guardRotations||0,reason});
  if(plan.withdrawalHistory.length>12)plan.withdrawalHistory.shift();
  for(const id of [w.screenId,w.rearId]){
   const unit=state.squads[id];
   if(unit&&!unit.playerControlled&&unit.alive>0){
    unit.lastWithdrawalId=w.id;unit.withdrawalReturns++;
    // A rear guard returns to its original defense doctrine on its next
    // decision. It never retains a target from a completed rear action.
    unit.aiCooldown=0;
   }
  }
  for(const shooterId of w.shooterIds||[w.shooterId]){
   const shooter=state.squads[shooterId];
   if(shooter&&!shooter.playerControlled&&shooter.alive>0){
    shooter.aiCooldown=0;
    // Newly regrouped firing lines hold the shared rear defense briefly
    // rather than immediately restarting the same unsafe advance.
    if(w.stage==='reform')shooter.withdrawalRecoveryUntil=state.elapsed+8;
    if(shooter.order==='retreat'){
     shooter.order='hold';shooter.formation='line';
     shooter.targetX=shooter.x;shooter.targetZ=shooter.z;
    }
   }
  }
  plan.lastWithdrawalAt=state.elapsed;
  plan.withdrawal=null;
 }
 // G5.3: paired firing-line withdrawal, one shared protection plan, two
 // independently reached rally slots. A human company only joins if it
 // explicitly orders retreat; no bot ever changes the player's orders.
 function withdrawalRally(w,id){
  return w.rallies?.[id]||w.rally;
 }
 function rotateWithdrawalGuards(w){
  if(w.rearId==null||w.rearId===w.screenId)return;
  [w.activeScreenId,w.activeRearId]=[w.activeRearId,w.activeScreenId];
  w.guardRotations=(w.guardRotations||0)+1;
 }
 function updateWithdrawalPlan(state,team,plan){
  const now=state.elapsed;
  let w=plan.withdrawal;
  if(w){
   const screen=state.squads[w.screenId];
   if(!screen?.alive||screen.playerControlled||now>=w.startedAt+37+((w.shooterIds?.length||1)-1)*6){
    finishWithdrawal(state,team,plan,'Koruma kaybı veya azami süre');return null;
   }
   const current=(w.shooterIds||[w.shooterId]).filter(id=>state.squads[id]?.alive>0);
   if(!current.length){finishWithdrawal(state,team,plan,'Atıcı birlikler kaybedildi');return null;}
   w.shooterIds=current;
   if(!current.includes(w.shooterId))w.shooterId=current[0];
   const shooters=current.map(id=>state.squads[id]);
   const nearEnemies=teamMembers(state,team==='blue'?'red':'blue');
   const nearest=shooters.reduce((best,sh)=>{
    for(const e of nearEnemies){const d=dist(e,sh);
     if(!best||d<best.d)best={d,enemy:e};}
    return best;
   },null);
   // One stage transition is permitted per planning tick; this avoids
   // skipping straight through cover when a frame arrives late.
   const arrived=shooters.every(sh=>dist(sh,withdrawalRally(w,sh.id))<26);
   const tightlyArrived=shooters.every(sh=>dist(sh,withdrawalRally(w,sh.id))<15);
   if(w.stage==='withdraw'&&(arrived||now>=w.stageAt+6+((w.shooterIds?.length||1)-1)*2)){
    w.stage='cover';w.stageAt=now;
    rotateWithdrawalGuards(w);
    plan.withdrawalHistory.push({id:w.id,at:now,stage:'cover',
     shooterIds:[...current],screenId:w.activeScreenId});
   }else if(w.stage==='cover'&&now>=w.stageAt+2&&
      (tightlyArrived||now>=w.stageAt+12)){
    w.stage='reform';w.stageAt=now;
    // The original spear screen returns to the front of the firing line.
    w.activeScreenId=w.screenId;w.activeRearId=w.rearId;
    for(const sh of shooters)if(!sh.playerControlled){
     const rally=withdrawalRally(w,sh.id);
     sh.order='hold';sh.formation='line';sh.targetX=rally.x;sh.targetZ=rally.z;
     sh.aiCooldown=0;
    }
    plan.withdrawalHistory.push({id:w.id,at:now,stage:'reform',shooterIds:[...current]});
   }else if(w.stage==='reform'&&now>=w.stageAt+5&&
       (arrived||(nearest?.d??Infinity)>100||now>=w.stageAt+11)){
    finishWithdrawal(state,team,plan,'Ortak arka savunma kuruldu');return null;
   }
   if(plan.withdrawalHistory.length>12)plan.withdrawalHistory.splice(0,plan.withdrawalHistory.length-12);
   w.enemyId=nearest?.enemy.id??null;
   w.distanceToRally=Math.max(...shooters.map(sh=>dist(sh,withdrawalRally(w,sh.id))));
   return w;
  }
  if(now-plan.lastWithdrawalAt<12)return null;
  const all=teamMembers(state,team);
  const enemies=teamMembers(state,team==='blue'?'red':'blue');
  const ranged=all.filter(sh=>isRanged(sh.type));
  const assessed=ranged.map(sh=>{
   const enemy=enemies.filter(e=>!isRanged(e.type)).reduce((best,e)=>
    !best||dist(e,sh)<dist(best,sh)?e:best,null);
   return {sh,enemy,d:enemy?dist(enemy,sh):Infinity};
  });
  const candidates=assessed.filter(c=>c.sh.order==='retreat'&&c.d<112)
   .sort((a,b)=>a.d-b.d||a.sh.id-b.sh.id);
  const candidate=candidates[0];
  if(!candidate)return null;
  const available=all.filter(s=>!s.playerControlled&&!isRanged(s.type)&&
   s.alive>0&&s.morale>.16).sort((a,b)=>(a.type==='pike'?-1:1)-
     (b.type==='pike'?-1:1)||dist(a,candidate.sh)-dist(b,candidate.sh));
  const screen=available[0];
  if(!screen)return null;
  const rear=available.find(s=>s.id!==screen.id&&s.type==='sword')||
   available.find(s=>s.id!==screen.id)||null;
  // Second firing company may participate when also retreating, or when
  // threatened closely enough and AI-led. Never coerce a player into retreat.
  const joined=assessed.filter(c=>c.sh.id!==candidate.sh.id&&c.d<105&&
   (c.sh.order==='retreat'||!c.sh.playerControlled&&c.d<88));
  const shooters=[candidate.sh,...joined.map(c=>c.sh)].slice(0,2);
  const away=frontDir(team);
  const avgZ=shooters.reduce((v,sh)=>v+sh.z,0)/shooters.length;
  const center={x:clamp(Math.min(...shooters.map(sh=>away*sh.x))-54,-BOUNDS+25,BOUNDS-25)*away,
   z:clamp(avgZ,-BOUNDS+25,BOUNDS-25)};
  const rallies={};
  shooters.forEach((sh,i)=>{
   rallies[sh.id]={x:center.x,z:clamp(center.z+(i-(shooters.length-1)/2)*20,-BOUNDS+25,BOUNDS-25)};
  });
  w={id:plan.nextWithdrawalId++,team,shooterId:candidate.sh.id,
   shooterIds:shooters.map(sh=>sh.id),rallies,
   screenId:screen.id,rearId:rear?.id??null,
   activeScreenId:screen.id,activeRearId:rear?.id??null,guardRotations:0,
   enemyId:candidate.enemy.id,startedAt:now,stageAt:now,stage:'withdraw',
   rally:rallies[candidate.sh.id],distanceToRally:dist(candidate.sh,rallies[candidate.sh.id])};
  plan.withdrawal=w;
  plan.withdrawalHistory.push({id:w.id,at:now,stage:'started',
   shooterId:w.shooterId,shooterIds:[...w.shooterIds],
   screenId:w.screenId,rearId:w.rearId});
  if(plan.withdrawalHistory.length>12)plan.withdrawalHistory.shift();
  return w;
 }
 function withdrawalGuardPost(state,w,guardId){
  const shooters=(w.shooterIds||[w.shooterId]).map(id=>state.squads[id]).filter(sh=>sh?.alive);
  if(!shooters.length)return null;
  const sh=shooters.reduce((a,b)=>({x:a.x+b.x,z:a.z+b.z}),{x:0,z:0});
  sh.x/=shooters.length;sh.z/=shooters.length;
  const enemy=state.squads[w.enemyId];
  const isRear=guardId===(w.activeRearId??w.rearId);
  if(w.stage==='reform')return {x:clamp(w.rally.x+frontDir(w.team)*15,-BOUNDS,BOUNDS),
   z:clamp(w.rally.z+(isRear?12:-6),-BOUNDS,BOUNDS)};
  const base=interpositionPoint(sh,enemy?.alive?enemy:null,isRear?25:17);
  const lateral=isRear?12:0;
  const dx=enemy?.alive?enemy.x-sh.x:frontDir(w.team),
   dz=enemy?.alive?enemy.z-sh.z:0;
  const d=Math.max(1,Math.hypot(dx,dz));
  return {x:clamp(base.x-dz/d*lateral,-BOUNDS,BOUNDS),
   z:clamp(base.z+dx/d*lateral,-BOUNDS,BOUNDS)};
 }
 // G3.4 -- bounded, deterministic courier messages. Every captain uses an
 // imperfect communication channel; the mission is not accepted on the same
 // frame as the request, and the human-led company is never commandeered.
 function sendCommanderSignal(state,team,kind,missionId,fromId,toId,priority=1,ttl=12,payload=null){
  const c=state.teamPlans[team].communications;
  const from=state.squads[fromId],to=Number.isInteger(toId)?state.squads[toId]:null;
  const distance=from&&to?dist(from,to):40;
  const id=c.nextId++;
  const jitter=seeded(state.seed,id,team==='blue'?351:352)*.65;
  // Urgent runners leave sooner. Even a priority message cannot teleport.
  const delay=clamp(1.15+distance/95+jitter-(priority>=3?.72:priority===2?.28:0),.55,4.8);
  const item={id,team,kind,missionId,fromId,toId,priority,createdAt:state.elapsed,
   observedAt:state.elapsed,arrivesAt:state.elapsed+delay,expiresAt:state.elapsed+ttl,
   payload:payload?{...payload}:null};
  c.pending.push(item);
  c.history.push({id,kind,event:'sent',at:state.elapsed,priority,fromId,toId});
  if(c.history.length>32)c.history.splice(0,c.history.length-32);
  return item;
 }
 function recordSupportStatus(state,team,mission,status,reason){
  const now=state.elapsed,plan=state.teamPlans[team];
  if(mission.status===status&&status!=='requested')return;
  const wasActive=mission.status==='accepted';
  mission.status=status;mission.reason=reason;mission.updatedAt=now;
  if(wasActive&&(status==='fulfilled'||status==='expired')){
   const guard=state.squads[mission.responderId];
   if(guard&&!guard.playerControlled&&guard.alive>0){
    const screen=plan.defense?.screenId===guard.id?plan.defense.screenPost:null;
    const post=screen||mission.origin;
    if(post){guard.aidReturnPost={x:post.x,z:post.z};
     guard.aidReturnUntil=now+24;guard.aidReturnMissionId=mission.id;
     guard.aiCooldown=0;guard.aidMissionId=null;}
   }
  }
  plan.supportHistory.push({id:mission.id,at:now,status,requesterId:mission.requesterId,
   responderId:mission.responderId,reason});
  if(plan.supportHistory.length>12)plan.supportHistory.splice(0,plan.supportHistory.length-12);
 }
 function assessSupportResponders(state,team,mission){
  const allies=teamMembers(state,team),enemies=teamMembers(state,team==='blue'?'red':'blue');
  const victim=state.squads[mission.requesterId],enemy=state.squads[mission.enemyId];
  if(!victim?.alive||!enemy?.alive)return null;
  const urgency=mission.urgency;
  return allies.filter(a=>!isRanged(a.type)&&!a.playerControlled&&a.alive>0)
   .map(guard=>{
    const d=dist(guard,victim);
    const opponents=enemies.filter(e=>dist(e,guard)<31);
    const exhausted=guard.morale<.28||guard.alive/guard.startCount<.28;
    const op=state.teamPlans[team].operation;
    const committed=op?.stage==='assault'&& (op.pinId===guard.id||op.flankId===guard.id);
    const eligible=!exhausted&&d<195&&(!committed||urgency>1.55)&&
      (opponents.length===0||urgency>1.55||dist(enemy,guard)<36);
    return {guard,eligible,score:(guard.type==='pike'?44:25)-d*.22+
      guard.morale*28+guard.nerve*14-(committed?24:0)-opponents.length*22};
   }).filter(x=>x.eligible).sort((a,b)=>b.score-a.score||a.guard.id-b.guard.id);
 }
 function deliverCommanderSignals(state,team){
  const plan=state.teamPlans[team],c=plan.communications,now=state.elapsed;
  if(!c.pending.length)return 0;
  const messages=c.pending.splice(0);
  // Priority matters on congestion, but no message arrives before its due time.
  messages.sort((a,b)=>a.arrivesAt-b.arrivesAt||b.priority-a.priority||a.id-b.id);
  let count=0;
  for(const msg of messages){
   if(msg.expiresAt<now){
    c.expired++;c.history.push({id:msg.id,kind:msg.kind,event:'expired',at:now});
    if(msg.kind==='assault-go'&&plan.operation?.synchronization?.signalId===msg.id){
     plan.operation.synchronization.signalId=null;
     plan.operation.synchronization.received=false;
    }
    const mission=plan.support;
    if(mission?.id===msg.missionId&&mission.status==='requested')
     recordSupportStatus(state,team,mission,'expired','Ulaşmayan mesajın süresi doldu');
    continue;
   }
   if(msg.arrivesAt>now){c.pending.push(msg);continue;}
   c.delivered++;count++;
   c.history.push({id:msg.id,kind:msg.kind,event:'received',at:now,
    priority:msg.priority,fromId:msg.fromId,toId:msg.toId});
   if(msg.kind==='support-request'){
    const m=plan.support,victim=state.squads[msg.fromId],enemy=state.squads[msg.payload?.enemyId];
    if(!m||m.id!==msg.missionId||m.status!=='requested')continue;
    // A stale observed threat is not considered omniscient live intelligence.
    if(!victim?.alive||!enemy?.alive||dist(victim,enemy)>115){
     recordSupportStatus(state,team,m,'expired','Düşman mesaj ulaşmadan uzaklaştı');continue;
    }
    const candidates=assessSupportResponders(state,team,m);
    if(!candidates?.length){
     recordSupportStatus(state,team,m,'declined','Uygun bot koruma birliği bulunamadı');continue;
    }
    const guard=candidates[0].guard;
    m.responderId=guard.id;m.receivedAt=now;
    m.origin={x:guard.x,z:guard.z};
    const d=Math.max(1,dist(victim,enemy)),reach=clamp(d*.45,12,26);
    m.post={x:clamp(victim.x+(enemy.x-victim.x)/d*reach,-BOUNDS,BOUNDS),
     z:clamp(victim.z+(enemy.z-victim.z)/d*reach,-BOUNDS,BOUNDS)};
    m.reason='Dost komutan yanıtı bekleniyor';
    // The recipient's acknowledgement travels back before executing a task.
    sendCommanderSignal(state,team,'support-ack',m.id,guard.id,victim.id,
     m.urgency>=1.5?3:2,11,{guardId:guard.id,enemyId:enemy.id});
   }else if(msg.kind==='support-ack'){
    const m=plan.support,guard=state.squads[msg.fromId],victim=state.squads[msg.toId],enemy=state.squads[msg.payload?.enemyId];
    if(!m||m.id!==msg.missionId||m.status!=='requested')continue;
    if(!guard?.alive||guard.playerControlled||!victim?.alive||!enemy?.alive||
       dist(victim,enemy)>118||guard.morale<.24){
     recordSupportStatus(state,team,m,'declined','Destek yanıtı geldiğinde koşullar değişti');continue;
    }
    guard.aidReturnPost=null;guard.aidReturnUntil=0;
    guard.aidDecisions=(guard.aidDecisions||0)+1;
    m.acceptedAt=now;
    recordSupportStatus(state,team,m,'accepted','Komutan yanıtı ulaştı: destek yolda');
   }else if(msg.kind==='assault-go'){
    const op=plan.operation,flank=state.squads[msg.toId];
    if(op&&op.revision===msg.payload?.revision&&op.stage==='enveloping'&&
       flank?.alive&&!flank.playerControlled){
     op.synchronization.received=true;
     op.synchronization.receivedAt=now;
    }
   }
  }
  if(c.history.length>32)c.history.splice(0,c.history.length-32);
  return count;
 }
 function negotiateSupport(state,team,plan){
  const now=state.elapsed,allies=teamMembers(state,team);
  const enemies=teamMembers(state,team==='blue'?'red':'blue');
  const previous=plan.support;
  if(previous&&(previous.status==='accepted'||previous.status==='requested')){
   const victim=state.squads[previous.requesterId],guard=state.squads[previous.responderId];
   const enemy=state.squads[previous.enemyId];
   if(!victim?.alive||!enemy?.alive)
    recordSupportStatus(state,team,previous,'fulfilled','Tehdit sona erdi');
   else if(previous.status==='accepted'&&!guard?.alive)
    recordSupportStatus(state,team,previous,'expired','Yardım birliği kaybedildi');
   else if(now>=previous.expiresAt)
    recordSupportStatus(state,team,previous,'expired','Destek süresi doldu');
   else if(dist(victim,enemy)>105)
    recordSupportStatus(state,team,previous,'fulfilled','Düşman savunma hattından uzaklaştı');
   else if(previous.status==='accepted'&&dist(guard,previous.post)<19){
    previous.arrived=true;previous.reason='Destek bölüğü koruma noktasına ulaştı';
   }
   if(previous.status==='accepted'||previous.status==='requested')return previous;
  }
  if(now-plan.lastSupportAt<9.5)return previous;
  const requests=[];
  for(const victim of allies.filter(a=>isRanged(a.type))){
   for(const enemy of enemies.filter(e=>!isRanged(e.type))){
    const d=dist(victim,enemy);
    if(d>98)continue;
    const urgency=clamp((99-d)/99,0,1)*1.8+
     (enemy.type==='sword'?.35:.15)+(1-victim.morale)*.45;
    requests.push({victim,enemy,urgency});
   }
  }
  requests.sort((a,b)=>b.urgency-a.urgency||a.victim.id-b.victim.id);
  if(!requests.length)return previous;
  const {victim,enemy,urgency}=requests[0];
  const mission={id:plan.nextSupportId++,team,requesterId:victim.id,
   responderId:null,enemyId:enemy.id,status:'requested',reason:'Koruma talebi yolda',
   requestedAt:now,updatedAt:now,expiresAt:now+24,arrived:false,
   urgency:Math.round(urgency*100)/100,observedAt:now,
   lastSeen:{x:enemy.x,z:enemy.z},post:{x:victim.x,z:victim.z}};
  plan.support=mission;plan.lastSupportAt=now;
  recordSupportStatus(state,team,mission,'requested','Yakın dövüş tehdidine karşı yardım istendi');
  sendCommanderSignal(state,team,'support-request',mission.id,victim.id,null,
   urgency>=1.5?3:urgency>=.9?2:1,12,{enemyId:enemy.id,
    observedAt:now,enemyX:enemy.x,enemyZ:enemy.z});
  return mission;
 }
 // Observe active defender counter-charges at strategy cadence. A squad's
 // contribution is judged by actual attrition and distance from friendly shooters.
 function evaluateCounterCharges(state,team,plan){
  const allies=teamMembers(state,team);
  const shooters=allies.filter(a=>isRanged(a.type));
  for(const captain of allies){
   if(captain.playerControlled||isRanged(captain.type))continue;
   const target=state.squads[captain.targetSquadId];
   // Destroying the attacker completes a defensive counter-charge immediately.
   const prior=captain.counterStart;
   if(prior&&target&&target.team!==team&&target.alive<=0&&
      prior.targetId===target.id){
    const audit={at:state.elapsed,captainId:captain.id,targetId:target.id,
     enemyLoss:prior.enemyStart,friendlyLoss:Math.max(0,prior.ownStart-captain.alive),
     protectionGain:0,outcome:'successful'};
    plan.counterHistory.push(audit);
    if(plan.counterHistory.length>12)plan.counterHistory.shift();
    captain.counterOutcome='successful';captain.counterOutcomes++;
    captain.counterStart=null;
    continue;
   }
   const active=captain.aiRole==='counter-charge'&&target?.alive>0&&target.team!==team;
   if(!active){captain.counterStart=null;continue;}
   const guardDistance=()=>shooters.length?Math.min(...shooters.map(s=>dist(s,target))):0;
   if(!prior||prior.targetId!==target.id){
    captain.counterStart={at:state.elapsed,targetId:target.id,
     ownStart:captain.alive,enemyStart:target.alive,guardDistance:guardDistance()};
    continue;
   }
   if(state.elapsed-prior.at<9)continue;
   const enemyLoss=Math.max(0,prior.enemyStart-target.alive);
   const friendlyLoss=Math.max(0,prior.ownStart-captain.alive);
   const protectionGain=guardDistance()-prior.guardDistance;
   const outcome=enemyLoss>friendlyLoss+1||protectionGain>15?'successful':
    friendlyLoss>enemyLoss+2?'failed':'contested';
   const audit={at:state.elapsed,captainId:captain.id,targetId:target.id,
    enemyLoss,friendlyLoss,protectionGain:Math.round(protectionGain*10)/10,outcome};
   plan.counterHistory.push(audit);
   if(plan.counterHistory.length>12)plan.counterHistory.shift();
   captain.counterOutcome=outcome;captain.counterOutcomes++;
   captain.counterStart=null;
  }
 }
 function updateTeamPlan(state,team,force=false){
  const plan=state.teamPlans[team];
  if(!force&&state.elapsed-plan.lastAt<4.5)return plan;
  plan.lastAt=state.elapsed;
  const allies=teamMembers(state,team),enemies=state.squads.filter(s=>s.team!==team&&s.alive>0);
  if(!enemies.length){
   if(plan.withdrawal)finishWithdrawal(state,team,plan,'Savaş sona erdi');
   plan.phase='victory';plan.focusId=null;plan.operation=null;plan.defense=null;
   if(plan.support&&(plan.support.status==='accepted'||plan.support.status==='requested'))
    recordSupportStatus(state,team,plan.support,'fulfilled','Savaş sona erdi');
   return plan;}
  const ownCount=allies.reduce((v,s)=>v+s.alive,0);
  const enemyCount=enemies.reduce((v,s)=>v+s.alive,0);
  const nearestPair=allies.reduce((best,a)=>{
   for(const e of enemies){const d=dist(a,e);if(d<best.d)best={d,a,e};}
   return best;
  },{d:Infinity,a:null,e:null});
  plan.phase=ownCount<enemyCount*.48?'recover':
   nearestPair.d>105?'approach':nearestPair.d>35?'engage':'press';
  // Shared target creates converging pressure, but a role can override to
  // protect vulnerable friendly ranged squads from a close melee threat.
  const candidates=enemies.map(e=>{
   const near=allies.reduce((best,a)=>Math.min(best,dist(a,e)),Infinity);
   const fragile=e.type==='musket'?2.3:e.type==='bow'?2.0:e.type==='sword'?1.0:.5;
   const weakened=1-e.alive/e.startCount;
   return {e,score:fragile+weakened*2.2+Math.max(0,(150-near)/65)
    +threatToRanged(state,e,team)*1.25};
  }).sort((a,b)=>b.score-a.score||a.e.id-b.e.id);
  plan.focusId=candidates[0]?.e.id??null;
  const intel=readEnemyDoctrine(state,team,plan);
  // An exposed firing unit is a valid opportunity for a flank commander,
  // but do not interrupt a coordinated assault every 4.5 seconds.
  const active=plan.operation&&['pinning','enveloping','assault','regroup'].includes(plan.operation.stage)&&
   state.squads[plan.operation.targetId]?.alive>0;
  if(!active&&intel.exposedId!==null&&intel.mode==='exploit-gap')
   plan.focusId=intel.exposedId;
  if(active)plan.focusId=plan.operation.targetId;
  plan.operation=buildOperation(state,team,plan);
  evaluateCounterCharges(state,team,plan);
  plan.defense=buildSupportPlan(state,team,plan);
  updateWithdrawalPlan(state,team,plan);
  negotiateSupport(state,team,plan);
  plan.rallies++;
  return plan;
 }
 function targetScore(state,s,enemy,plan){
  const d=dist(s,enemy),frac=enemy.alive/enemy.startCount;
  const vulnerability=(1-frac)*3;
  let matchup=0;
  if(s.type==='sword')matchup=enemy.type==='musket'?4.5:enemy.type==='bow'?3.7:enemy.type==='pike'?-2:1;
  else if(s.type==='pike')matchup=enemy.type==='sword'?4:enemy.type==='pike'?1.5:enemy.type==='musket'?.5:0;
  else if(s.type==='musket')matchup=enemy.type==='pike'?3:enemy.type==='sword'?2.7:enemy.type==='bow'?1:0;
  else matchup=enemy.type==='sword'?3:enemy.type==='pike'?1.7:enemy.type==='bow'?1:0;
  const protect=threatToRanged(state,enemy,s.team)*(s.type==='pike'?4:s.type==='sword'?2.5:1.5);
  return matchup+vulnerability+protect+Math.max(0,(180-d)/45)
   +(plan.focusId===enemy.id?1.8:0)+(s.targetSquadId===enemy.id?1.25:0);
 }
 function selectEnemySquad(state,s,plan){
  const enemies=state.squads.filter(e=>e.alive>0&&e.team!==s.team);
  if(!enemies.length)return null;
  let best=enemies[0],bestScore=-Infinity;
  for(const e of enemies){const score=targetScore(state,s,e,plan);
   if(score>bestScore){best=e;bestScore=score;}}
  // Do not flip a target every tick; lose the lock only when a new target
  // is genuinely more important or the current one has been destroyed.
  const previous=state.squads[s.targetSquadId];
  if(previous&&previous.alive>0&&previous.team!==s.team){
   const oldScore=targetScore(state,s,previous,plan);
   if(bestScore<oldScore+2)return previous;
  }
  return best;
 }
 function nearestEnemySquad(state,squad){
  const plan=state.teamPlans[squad.team];
  return selectEnemySquad(state,squad,plan);
 }
 function closestFriendlyRanged(state,squad){
  const options=teamMembers(state,squad.team).filter(s=>isRanged(s.type));
  return options.reduce((best,s)=>!best||dist(s,squad)<dist(best,squad)?s:best,null);
 }
 function decideAI(state,squad,enemy){
  if(squad.playerControlled||!enemy||squad.aiCooldown>0)return;
  const role=squad.type,d=dist(squad,enemy),fraction=squad.alive/squad.startCount;
  const immediateThreat=Math.min(...state.squads.filter(e=>e.team!==squad.team&&e.alive>0)
   .map(e=>dist(squad,e)));
  const plan=state.teamPlans[squad.team];
  const oldOrder=squad.order,oldFormation=squad.formation;
  const previousFocus=squad.targetSquadId;
  const op=plan.operation;
  const defense=plan.defense;
  const aid=plan.support?.status==='accepted'&&plan.support.responderId===squad.id
   ?plan.support:null;
  const opRole=op?(squad.id===op.pinId?'pin':squad.id===op.flankId?'flank':
   squad.id===op.reserveId?'reserve':null):null;
  // A finished support assignment is temporary; release its return waypoint
  // on arrival, expiry or if a real close-range threat forces a new mission.
  if(squad.aidReturnPost&&(state.elapsed>=squad.aidReturnUntil||
     dist(squad,squad.aidReturnPost)<=8))squad.aidReturnPost=null;
  squad.operationRole=opRole;
  squad.aidMissionId=aid?.id??null;
  squad.defenseRole=defense&&(squad.id===defense.screenId?'screen':
   squad.id===defense.interceptId?'intercept':isRanged(role)?'fire-base':null);
  squad.supportSquadId=defense?.protectedId??defense?.musketId??defense?.bowId??null;
  squad.targetSquadId=(opRole&&state.squads[op.targetId]?.alive>0)?op.targetId:enemy.id;
  squad.decisionCount++;
  squad.lastDecisionAt=state.elapsed;
  squad.underPressure=d<45&&(enemy.type==='sword'||enemy.type==='pike');
  const local=localAssessment(state,squad);
  squad.localAdvantage=local.localAdvantage;
  squad.threatLevel=local.hostileStrength;
  if(local.hostileStrength>0)squad.lastThreatAt=state.elapsed;
  const allyRanged=closestFriendlyRanged(state,squad);
  const nearbyRangedDanger=allyRanged&&state.squads.some(e=>e.alive>0&&e.team!==squad.team&&
   !isRanged(e.type)&&dist(e,allyRanged)<60);
  // Staged withdrawal overrides new offensive plans only for assigned bots.
  const withdrawal=plan.withdrawal;
  const guarding=withdrawal&&(squad.id===withdrawal.screenId||
   squad.id===withdrawal.rearId);
  const isShooter=!!withdrawal?.shooterIds?.includes(squad.id);
  if(guarding){
   squad.aiRole=squad.id===(withdrawal.activeScreenId??withdrawal.screenId)?'retreat-escort':'rear-guard';
   squad.order=withdrawal.stage==='reform'?'hold':'advance';
   squad.formation='shield';
   squad.targetSquadId=withdrawal.enemyId;
   squad.tacticalReason=withdrawal.stage==='reform'?
    'Arka hatta koruma perdesini yeniden kur':squad.aiRole==='rear-guard'?
    'Geri çekilme artçısı: düşmanı oyalayıp koru':
    'Menzilli geri çekilmeye kademeli koruma';
  }else if(isShooter&&!squad.playerControlled){
   squad.aiRole=withdrawal.stage==='reform'?'withdrawal-reform':'staged-withdrawal';
   squad.order=withdrawal.stage==='reform'?'hold':'retreat';
   squad.formation=withdrawal.stage==='reform'?'line':'loose';
   squad.tacticalReason=withdrawal.stage==='reform'?
    'Arka hatta yeniden saf kur':'Korunan geri çekilme koridorunda ilerle';
  }else if(isRanged(role)&&state.elapsed<squad.withdrawalRecoveryUntil&&
           immediateThreat>22){
   squad.aiRole='rear-defensive-line';squad.order='hold';squad.formation='line';
   squad.tacticalReason='Arka hatta ortak savunmayı koru';
  }else if(state.elapsed>=squad.nextRetreatEligibleAt&&((fraction<.24&&immediateThreat<90)||
   (squad.morale<.26+(1-squad.nerve)*.12&&immediateThreat<65))){
   if(state.elapsed>=squad.retreatUntil&&state.elapsed>=squad.reformUntil){
    // Choose a rally post behind the own front, near a friendly support unit.
    const support=teamMembers(state,squad.team).filter(a=>a.id!==squad.id)
     .sort((a,b)=>dist(a,squad)-dist(b,squad))[0];
    const behind=squad.x-frontDir(squad.team)*38;
    squad.rallyX=clamp(support?support.x-frontDir(squad.team)*17:behind,-BOUNDS,BOUNDS);
    squad.rallyZ=clamp(support?support.z+(squad.id%2?10:-10):squad.z,-BOUNDS,BOUNDS);
    squad.retreatUntil=state.elapsed+7;
    squad.reformUntil=squad.retreatUntil+5;
    // Give survivors time to rejoin the battle after reforming ranks.
    squad.nextRetreatEligibleAt=squad.reformUntil+19;
   }
   squad.order=state.elapsed<squad.retreatUntil?'retreat':'hold';
   squad.formation=squad.order==='hold'?(isRanged(role)?'line':'shield'):'loose';
   squad.aiRole='rally';
   squad.tacticalReason=squad.order==='hold'?'Kayıplardan sonra safları yeniden kur':'Ağır kayıp: toparlanma mevzisine çekil';
  }else if(state.elapsed<squad.retreatUntil){
   squad.order='retreat';squad.formation='loose';
   squad.aiRole='rally';squad.tacticalReason='Toparlanma noktasına çekil';
  }else if(state.elapsed<squad.reformUntil){
   squad.order='hold';squad.formation=isRanged(role)?'line':'shield';
   squad.aiRole='rally';squad.tacticalReason='Yeniden saf oluştur';
  }else if(role==='sword'&&defense?.escortId!==squad.id&&local.endangeredRanged&&
   dist(squad,local.endangeredRanged.ally)<88&&
   dist(local.endangeredRanged.enemy,local.endangeredRanged.ally)<48&&
   (role==='pike'||squad.aggression>.68)&&
   state.elapsed>squad.lastCounterAt+4){
   // A nearby collapse overrides the grand plan: intercept close-range raiders.
   squad.aiRole='counter-charge';squad.formation=role==='pike'?'shield':'wedge';
   squad.order='advance';squad.targetSquadId=local.endangeredRanged.enemy.id;
   squad.lastCounterAt=state.elapsed;
   squad.tacticalReason='Menzilli birlikleri kurtarmak için karşı hücum';
  }else if(!isRanged(role)&&local.localAdvantage<.48&&d<48&&
   squad.nerve<.82&&squad.alive<squad.startCount*.78){
   squad.aiRole='elastic-defense';squad.formation='shield';
   squad.order='retreat';squad.tacticalReason='Sayısal üstünlüğe karşı hattı esnet';
  }else if(opRole&&op?.stage==='regroup'&&!isRanged(role)){
   // A bot-led attacking unit breaks contact in an orderly way after failure.
   // Its human-led ally keeps whatever orders the player issued.
   const support=closestFriendlyRanged(state,squad);
   squad.rallyX=clamp((support?.x??squad.homeX)-frontDir(squad.team)*18,-BOUNDS,BOUNDS);
   squad.rallyZ=clamp((support?.z??squad.homeZ)+(squad.id%2?9:-9),-BOUNDS,BOUNDS);
   squad.aiRole='operational-reform';
   squad.order=dist(squad,{x:squad.rallyX,z:squad.rallyZ})>7?'retreat':'hold';
   squad.formation=squad.order==='hold'?'shield':'column';
   squad.tacticalReason='Başarısız hücumdan ayrıl, yeni saf kur';
  }else if(squad.aidReturnPost&&!isRanged(role)&&
   state.elapsed<squad.aidReturnUntil&&!local.meleeThreat&&
   dist(squad,squad.aidReturnPost)>8){
   squad.aiRole='returning-support';squad.order='advance';
   squad.formation=squad.defenseRole==='screen'?'shield':'column';
   squad.tacticalReason='Yardım tamamlandı: ana savunma hattına geri dön';
  }else if(defense?.escortId===squad.id&&!isRanged(role)&&
     state.squads[defense.escortSquadId]?.order==='retreat'){
   // A withdrawing firing company is not abandoned. The AI escort keeps
   // between its live position and the approaching melee attacker.
   squad.aiRole='retreat-escort';squad.formation='shield';
   squad.order='advance';
   squad.targetSquadId=defense.threatId??enemy.id;
   squad.tacticalReason='Geri çekilen menzilli birliğe hareketli koruma';
  }else if(aid&&!isRanged(role)){
   // Keep the existing SCREEN assignment when the designated guard is already
   // protecting the firing line. An aid mission is additional responsibility,
   // not an excuse to abandon the spear-wall doctrine.
   squad.aiRole=squad.defenseRole==='screen'?'screen':'emergency-support';
   squad.order='advance';squad.formation='shield';squad.targetSquadId=aid.enemyId;
   squad.tacticalReason='Menzilli birliklerin yardım talebini karşıla';
  }else if(defense&&role==='sword'&&squad.defenseRole==='screen'){
   // If the human commands the pikemen (or pikes perish), a sword company
   // stands in as escort instead of abandoning the ranged companies.
   squad.aiRole='screen';squad.formation=defense.danger?'shield':'line';
   squad.order=defense.danger&&d<15?'charge':'advance';
   if(defense.threatId!==null)squad.targetSquadId=defense.threatId;
   squad.tacticalReason=defense.danger?'Menzilli hattı korumak için düşmanı karşıla':
    'Menzilli birliklere kılıçlı yakın koruma sağla';
  }else if(defense&&role==='pike'&&squad.defenseRole==='screen'){
   squad.aiRole='screen';squad.formation='shield';
   squad.order=defense.danger&&d<17?'charge':'advance';
   if(defense.threatId!==null)squad.targetSquadId=defense.threatId;
   squad.tacticalReason=defense.danger?'Menzilli (okçu-tüfekçi) hattına yaklaşanı durdur':
    'Menzilli birliklerin önünde savunma perdesi kur';
  }else if(defense&&role==='sword'&&defense.danger&&
   squad.defenseRole==='intercept'&&defense.threatId!==null&&
   dist(squad,state.squads[defense.threatId])<125){
   // G5: a short intercept, not an indefinite charge beyond the firing line.
   const second=defense.secondThreatId!=null&&
    state.squads[defense.secondThreatId]?.alive>0;
   const candidateId=second?defense.secondThreatId:defense.threatId;
   squad.aiRole='counter-charge';squad.formation='wedge';
   squad.order='advance';squad.targetSquadId=candidateId;
   squad.tacticalReason='Atıcılarımızı tehdit eden birliğe karşı mevzi al';
  }else if(defense&&isRanged(role)){
   // Ranged captains choose a defensible firing line and remain mutual support.
   const risk=local.meleeThreat&&dist(squad,local.meleeThreat)<38;
   squad.aiRole=opRole==='reserve'?(op.reserveReleased?'committed-reserve':'reserve'):'defensive-fire';
   squad.formation=risk?'loose':role==='musket'?'line':'loose';
   squad.fireMode=risk?'free':role==='musket'?'volley':'free';
   const post=defense.positions[role];
   squad.order=risk?'retreat':
    opRole==='reserve'&&op.reserveReleased?'skirmish':
    Math.hypot(post.x-squad.x,post.z-squad.z)>5?'advance':'hold';
   squad.tacticalReason=risk?'Ateş hattını koruyarak tehditten uzaklaş':
    opRole==='reserve'&&!op.reserveReleased?'Savunma ihtiyatında ateş desteği':
    'Okçu-tüfekçi ortak savunma ateş hattını tut';
  }else if(opRole==='pin'&&role==='pike'&&nearbyRangedDanger){
   squad.aiRole='screen';
   squad.formation='shield';
   squad.order=d<17?'charge':'advance';
   squad.tacticalReason='Menzilli birliklerin önünü kapat';
  }else if(opRole==='pin'){
   squad.aiRole='pin';
   squad.targetSquadId=op.targetId;
   squad.formation=role==='pike'?'shield':isRanged(role)?'line':'line';
   const entrench=plan.intelligence?.doctrine==='entrenched';
   squad.order=entrench&&d<65?'hold':d<18?'charge':d<31?'hold':'advance';
   squad.tacticalReason=entrench?'Savunmaya karşı hücum yerine cepheyi sabitle':
    'Düşman cephesini oyalayıp kanadı aç';
  }else if(opRole==='flank'){
   squad.aiRole='envelopment';
   squad.targetSquadId=op.targetId;
   squad.flankSide=op.flankSide;
   squad.formation=op.stage==='assault'?'wedge':'column';
   squad.order=op.stage==='assault'&&d<37?'charge':'flank';
   squad.tacticalReason=op.stage==='assault'?'Arka hatta eşzamanlı hücum':'Cephe dışından kanada dolan';
  }else if(opRole==='reserve'){
   squad.aiRole=op.reserveReleased?'committed-reserve':'reserve';
   squad.targetSquadId=op.targetId;
   squad.formation=isRanged(role)?'line':'square';
   squad.fireMode=isRanged(role)?'free':squad.fireMode;
   squad.order=op.reserveReleased?(isRanged(role)?'skirmish':'charge'):
    (d>115?'advance':'hold');
   squad.tacticalReason=op.reserveReleased?'İhtiyat cephedeki boşluğu kapatıyor':'İhtiyat: muharebe anını bekle';
  }else if(plan.phase==='recover'&&isRanged(role)&&d>45){
   squad.aiRole='fallback-support';
   squad.formation='loose';squad.fireMode='free';
   squad.order=d<80?'skirmish':'hold';
   squad.tacticalReason='Cephe çözülüyor: savunma hattı kur';
  }else if(role==='musket'){
   squad.aiRole='fire-support';
   squad.formation=d<48?'loose':'line';
   squad.fireMode=d<45?'free':'volley';
   squad.order=d<35?'retreat':d>105?'advance':d<55?'skirmish':'hold';
   squad.tacticalReason=d<35?'Yakın tehditle mesafe aç':d>105?'Ateş hattına ilerle':'Ateş hattını koru';
  }else if(role==='bow'){
   squad.aiRole='harass';squad.formation='loose';squad.fireMode='free';
   squad.order=d<34?'retreat':d>103?'advance':d<62?'skirmish':'flank';
   squad.tacticalReason=d<34?'Taciz ateşiyle geri çekil':d>103?'Görüş ve menzil kazan':'Dağınık taciz ve yer değiştirme';
  }else if(role==='pike'){
   // Priority #1 is keeping hostile swordsmen away from friendly shooters.
   squad.aiRole='screen';
   squad.formation=nearbyRangedDanger||d<38?'shield':'square';
   squad.order=nearbyRangedDanger&&d<17?'charge':d<12?'hold':'advance';
   squad.tacticalReason=nearbyRangedDanger?'Menzilli birliklerin önünü kapat':'Mızrak hattını koru';
  }else{
   squad.aiRole=nearbyRangedDanger?'counter-charge':'flanker';
   squad.formation=d<45?'wedge':d>90?'column':'line';
   squad.flankSide=squad.team==='blue'?-1:1;
   squad.order=d<35?'charge':nearbyRangedDanger?'advance':d>95?'advance':'flank';
   squad.tacticalReason=nearbyRangedDanger?'Dost menzillileri koru':d<35?'Açık hedefe hücum':'Kanattan kuşat';
  }
  // Independent commanders sometimes favor an opportunistic maneuver without
  // disobeying their tactical role, unlike a globally synchronized state machine.
  if(squad.aiRole==='envelopment'&&squad.formation==='column'&&
   squad.aggression>.82&&d<72){
   squad.formation='wedge';squad.tacticalReason='Fırsat: kanatta erken baskı';
  }
  if(squad.aiRole==='fire-support'&&local.meleeThreat&&
   dist(squad,local.meleeThreat)<46){
   squad.order='retreat';squad.formation='loose';squad.fireMode='free';
   squad.tacticalReason='Yakın dövüş baskısından ateş hattını kurtar';
  }
  // G5.4: All sword counter-attack entry paths (including emergency local
  // intervention) use the same finite preparation window. A near breach is
  // an emergency exception; distant threats never trigger instant charges.
  if(squad.aiRole==='counter-charge'&&role==='sword'&&!withdrawal){
   const attacker=state.squads[squad.targetSquadId];
   const victim=closestFriendlyRanged(state,squad);
   if(attacker?.alive&&victim?.alive){
    if(squad.counterIntentId!==attacker.id||
      squad.counterGoAt<=state.elapsed-9){
     squad.counterIntentId=attacker.id;
     squad.counterGoAt=state.elapsed+1.1+seeded(state.seed,squad.id,
       800+squad.counterPreparations)*1.8;
     squad.counterPreparations++;
    }
    const breach=dist(attacker,victim)<19;
    squad.order=breach||state.elapsed>=squad.counterGoAt?'charge':'advance';
    squad.tacticalReason=squad.order==='charge'?
     'Savunma kanadından zamanlı karşı hücum':
     'Atıcıları koru: karşı hücum zamanını bekle';
   }
  }
  squad.commandStyle=squad.aiRole;
  // If a new HOLD is chosen, freeze right here, not at original deployment.
  if(squad.order==='hold'&&oldOrder!=='hold'){
   squad.targetX=squad.x;squad.targetZ=squad.z;
  }
  if(oldOrder!==squad.order||oldFormation!==squad.formation||previousFocus!==squad.targetSquadId)
   {squad.stanceChanges++;squad.commandRevision++;}
  // Real commanders have different observe/decide delays: not a shared tick.
  const tempo=1.32-squad.judgement*.42-squad.initiative*.18;
  squad.aiCooldown=(2.6+seeded(state.seed,squad.id,squad.decisionCount+29)*3.1)*tempo;
 }
 function moveSquad(state,s,dt){
  const enemy=s.playerControlled
   ?state.squads.find(e=>e.alive>0&&e.team!==s.team&&e.id===s.targetSquadId)||
     state.squads.find(e=>e.alive>0&&e.team!==s.team&&e.id===s.enemyId)||
     state.squads.filter(e=>e.alive>0&&e.team!==s.team)
       .sort((a,b)=>dist(a,s)-dist(b,s))[0]
   :nearestEnemySquad(state,s);
  s.enemyId=enemy?enemy.id:null;
  if(!enemy){s.order='hold';return;}
  s.aiCooldown=Math.max(0,s.aiCooldown-dt);
  decideAI(state,s,enemy);
  const op=state.teamPlans[s.team].operation;
  const interrupt=(!s.playerControlled&&s.aiRole==='counter-charge')||
   (!s.playerControlled&&s.aiRole==='elastic-defense')||
   (!s.playerControlled&&s.aiRole==='emergency-support');
  const personalTarget=state.squads[s.targetSquadId];
  const objective=!s.playerControlled&&!interrupt&&s.operationRole&&op&&
   state.squads[op.targetId]?.alive>0?state.squads[op.targetId]:
   (interrupt&&personalTarget?.alive>0?personalTarget:enemy);
  if(!s.playerControlled&&!s.operationRole&&!s.defenseRole)s.targetSquadId=enemy.id;
  const d=dist(s,objective),dirX=(objective.x-s.x)/Math.max(.01,d),dirZ=(objective.z-s.z)/Math.max(.01,d);
  let targetX=s.x,targetZ=s.z;
  const targetRange=isRanged(s.type)?s.type==='musket'?64:60:8;
  if(s.order==='follow'){
   targetX=state.playerPosition.x+frontDir(s.team)*8;
   targetZ=state.playerPosition.z;
  }else if(s.order==='retreat'){
   if(!s.playerControlled&&(s.aiRole==='rally'||s.aiRole==='operational-reform')){
    targetX=s.rallyX;targetZ=s.rallyZ;
   }else{
    const fallBack=(!s.playerControlled&&s.aiRole==='elastic-defense')?26:35;
    targetX=s.x-dirX*fallBack;targetZ=s.z-dirZ*fallBack;
   }
  }else if(s.order==='position'&&s.playerControlled){
   // Ordered waypoints advance only after the current route goal is reached.
   if(s.routeGoal&&dist(s,s.routeGoal)<2.8&&s.waypoints.length){
    const next=s.waypoints[0],planned=tacticalRoute(state,s,next);
    if(planned){s.waypoints.shift();s.commandRoute=planned.route;
     s.routeGoal={...next};s.targetX=next.x;s.targetZ=next.z;
     s.routeClearance=planned.clearance;s.commandRevision++;}
   }
   updateTransitFormation(state,s);
   // Advance via the planned corners; never cut diagonally through cover.
   if(s.commandRoute?.length){
    while(s.commandRoute.length>1&&dist(s,s.commandRoute[0])<3.0)s.commandRoute.shift();
    const node=s.commandRoute[0];targetX=node.x;targetZ=node.z;
   }else{targetX=s.targetX;targetZ=s.targetZ;}
  }else if(s.order==='flank'&&!s.playerControlled&&s.operationRole==='flank'&&op){
   // Stage laterally behind a screening unit before swinging into the rear;
   // only then convert the operation into a close-range charge.
   const stage=op.stage==='enveloping'||op.stage==='assault';
   targetX=objective.x+frontDir(s.team)*(stage?20:-35);
   targetZ=objective.z+op.flankSide*(stage?24:58);
  }else if(s.order==='flank'){
   const flankSide=s.playerControlled?(s.id%2?1:-1):s.flankSide;
   const lateral=48*flankSide;
   targetX=objective.x-dirX*targetRange+dirZ*lateral;
   targetZ=objective.z-dirZ*targetRange-dirX*lateral;
  }else if(s.order==='advance'||s.order==='charge'||s.order==='skirmish'){
   const range=s.order==='charge'?2:s.order==='skirmish'?targetRange*.85:targetRange;
   const remaining=Math.max(0,d-range);
   targetX=s.x+dirX*remaining;targetZ=s.z+dirZ*remaining;
   if(s.order==='skirmish'&&d<targetRange*.5){
    targetX=s.x-dirX*12;targetZ=s.z-dirZ*12;
   }
  }else if(s.order==='hold'){
   if(!s.playerControlled&&s.aiRole==='rally'){
    targetX=s.rallyX;targetZ=s.rallyZ;
   }else if(!s.playerControlled&&s.aiRole==='reserve'){
    // The reserve may move into firing distance but never runs past the line.
    targetX=s.x;targetZ=s.z;
   }else{targetX=s.targetX;targetZ=s.targetZ;}
  }
  // A pike screen should stand between nearby attackers and friendly archers/
  // musketeers, not chase a distant enemy and expose the firing line.
  if(!s.playerControlled&&s.aiRole==='screen'&&s.order==='advance'){
   const support=closestFriendlyRanged(state,s);
   if(support){
    const localThreat=state.squads.filter(e=>e.team!==s.team&&e.alive>0)
      .sort((a,b)=>dist(a,support)-dist(b,support))[0];
    if(localThreat){
     const dd=Math.max(.01,dist(localThreat,support));
     const guardDist=clamp(dd*.34,10,25);
     const guardX=support.x+(localThreat.x-support.x)/dd*guardDist;
     const guardZ=support.z+(localThreat.z-support.z)/dd*guardDist;
     // Don't hold a distant guard post when the target is already threatening us.
     if(dd<125){targetX=guardX;targetZ=guardZ;}
     // Adaptive flank shift is bounded: still protects the live shooter.
     if(state.teamPlans[s.team]?.defense?.screenPost){
      targetX=clamp(targetX,-BOUNDS,BOUNDS);
      targetZ=clamp((targetZ+state.teamPlans[s.team].defense.screenPost.z)/2,-BOUNDS,BOUNDS);
     }
    }
   }
  }
  // Support posts are world-space rally destinations. Troops can still
  // defend themselves locally; their commander does not chase across the map.
  const defense=state.teamPlans[s.team]?.defense;
  if(!s.playerControlled&&defense){
   const urgent=s.aiRole==='rally'||s.aiRole==='elastic-defense'||
    (isRanged(s.type)&&s.order==='retreat');
   if(!urgent&&isRanged(s.type)&&
     (s.aiRole==='defensive-fire'||s.aiRole==='reserve'||s.aiRole==='committed-reserve')){
    const post=defense.positions[s.type];
    if(post){targetX=post.x;targetZ=post.z;}
   }else if(!urgent&&s.aiRole==='screen'&&s.defenseRole==='screen'&&
     s.order!=='charge'){
    targetX=defense.screenPost.x;targetZ=defense.screenPost.z;
   }
  }
  const aid=state.teamPlans[s.team]?.support;
  if(!s.playerControlled&&s.aidMissionId===aid?.id&&
     aid?.status==='accepted'&&aid.responderId===s.id){
   const victim=state.squads[aid.requesterId],enemyAid=state.squads[aid.enemyId];
   if(victim?.alive&&enemyAid?.alive){
    const dd=Math.max(1,dist(victim,enemyAid)),reach=clamp(dd*.4,10,24);
    const postX=clamp(victim.x+(enemyAid.x-victim.x)/dd*reach,-BOUNDS,BOUNDS);
    const postZ=clamp(victim.z+(enemyAid.z-victim.z)/dd*reach,-BOUNDS,BOUNDS);
    aid.post={x:postX,z:postZ};
    targetX=postX;targetZ=postZ;
   }
  }
  if(!s.playerControlled&&s.aiRole==='returning-support'&&s.aidReturnPost&&
   s.order==='advance'){
   targetX=s.aidReturnPost.x;targetZ=s.aidReturnPost.z;
  }
  // G5.1: escort never outruns the company it protects, and a sword
  // counter-charge is bounded by the firing line (prevents endless pursuit).
  if(!s.playerControlled&&defense){
   if(s.aiRole==='retreat-escort'&&s.id===defense.escortId){
    const sh=state.squads[defense.escortSquadId];
    const enemyEscort=state.squads[defense.threatId];
    if(sh?.alive){const post=interpositionPoint(sh,enemyEscort?.alive?enemyEscort:null,13);
     targetX=post.x;targetZ=post.z;}
   }else if(s.defenseRole==='intercept'&&s.aiRole==='counter-charge'){
    const sh=state.squads[defense.secondProtectedId??defense.protectedId];
    if(sh?.alive){
     const threat=state.squads[s.targetSquadId];
     const post=interpositionPoint(sh,threat?.alive?threat:null,20);
     // Wait at a real covering position until the charge is released.
     if(state.elapsed<s.counterGoAt&&s.order!=='charge'||dist(s,sh)>68){
      targetX=post.x;targetZ=post.z;
     }
    }
   }else if(s.defenseRole==='intercept'&&
    s.aiRole!=='counter-charge'&&s.aiRole!=='rally'&&
    defense.secondPost&&s.order==='advance'){
    targetX=defense.secondPost.x;targetZ=defense.secondPost.z;
   }
  }
  // G5.2 coordinated falling back: fixed shooter rally, moving shield, bounded
  // rear guard. This does not alter the player's own movement or orders.
  const withdrawal=state.teamPlans[s.team]?.withdrawal;
  if(!s.playerControlled&&withdrawal){
   if(withdrawal.shooterIds?.includes(s.id)){
    const rally=withdrawalRally(withdrawal,s.id);
    if(withdrawal.stage==='reform'||s.order==='retreat'){
     targetX=rally.x;targetZ=rally.z;
    }
   }else if(s.id===withdrawal.screenId||s.id===withdrawal.rearId){
    const post=withdrawalGuardPost(state,withdrawal,s.id);
    if(post){targetX=post.x;targetZ=post.z;}
   }
  }
  // Ally squads are cohesive blocks: avoid occupying the same center.
  if(!s.playerControlled&&s.order!=='hold'&&s.order!=='follow'){
   let avoidX=0,avoidZ=0;
   for(const ally of state.squads){
    if(ally.id===s.id||ally.team!==s.team||!ally.alive)continue;
    const ax=s.x-ally.x,az=s.z-ally.z,ad=Math.hypot(ax,az);
    if(ad<17){const weight=(17-ad)/17;
     avoidX+=(ad>.01?ax/ad:(s.id<ally.id?-1:1))*weight*12;
     avoidZ+=(ad>.01?az/ad:0)*weight*12;}
   }
   targetX+=avoidX;targetZ+=avoidZ;
  }
  const stepX=targetX-s.x,stepZ=targetZ-s.z,len=Math.hypot(stepX,stepZ);
  let speed=TYPES[s.type].speed*(s.order==='charge'?1.07:s.order==='retreat'?1.1:.67);
  if(s.formation==='shield'||s.formation==='square')speed*=.78;
  if(len>.2){const delta=Math.min(len,speed*dt);s.x=clamp(s.x+stepX/len*delta,-BOUNDS,BOUNDS);s.z=clamp(s.z+stepZ/len*delta,-BOUNDS,BOUNDS);}
  if(s.playerControlled&&s.order==='position'){
   const traveled=Math.hypot(s.x-s.lastMoveX,s.z-s.lastMoveZ);
   s.stuckSeconds=traveled<.025&&len>3?s.stuckSeconds+dt:0;
   if(s.stuckSeconds>2.5&&s.routeGoal){
    const recover=tacticalRoute(state,s,s.routeGoal);
    if(recover){s.commandRoute=recover.route;s.routeClearance=recover.clearance;
     s.routeReplans++;s.stuckSeconds=0;}
   }
   s.lastMoveX=s.x;s.lastMoveZ=s.z;
  }
  // Turning to a target is deliberately smoother than teleporting soldiers.
  const desired=s.playerControlled&&s.lockedFacing!=null?s.lockedFacing:
   Math.atan2(objective.x-s.x,objective.z-s.z);
  const angle=Math.atan2(Math.sin(desired-s.facing),Math.cos(desired-s.facing));
  s.facing+=clamp(angle,-2*dt,2*dt);
  s.commandElapsed+=dt;
  if(isRanged(s.type)&&s.fireMode==='volley'){
   s.volleyClock+=dt;
   if(s.volleyClock>=TYPES[s.type].cooldown){
    s.volleyReady=true;s.volleyWindowUntil=state.elapsed+1.35;s.volleyClock=0;
   }
  }
 }
 function nearestEnemy(state,soldier,range,preferredSquadId=null){
  let best=range*range,target=null,preferred=null,preferredD=range*range;
  let remembered=null,rememberedDist=Infinity;
  const remembers=state.elapsed-(soldier.lastEnemyAt??-Infinity)<4.2;
  for(const other of nearbySoldiers(state,soldier.x,soldier.z,range)){
   if(!other.alive||other.team===soldier.team)continue;
   const dx=other.x-soldier.x,dz=other.z-soldier.z,dd=dx*dx+dz*dz;
   if(dd<best){best=dd;target=other;}
   if(other.squadId===preferredSquadId&&dd<preferredD){preferredD=dd;preferred=other;}
   if(remembers&&soldier.lastEnemyId===other.id&&dd<range*range){
    remembered=other;rememberedDist=dd;
   }
  }
  // Memory only breaks near-ties; imminent attackers always win and the
  // commander's assigned target must not be overridden by distant revenge.
  if(target&&remembered&&rememberedDist<=best*1.34&&
    (isRanged(soldier.type)||best>3.6*3.6))target=remembered;
  if(preferred&&preferredD<best*(isRanged(soldier.type)?1.75:1.23)&&
     !(remembered&&rememberedDist<preferredD*.72))return preferred;
  return target;
 }
 // Do not grant omniscience: ready melee attacks are only readable if the
 // attacker is facing this soldier and is almost in striking range. The old
 // personal reaction delay still applies after the threat is first observed.
 function incomingMeleeWarning(soldier,threat){
  if(!threat||!threat.alive||isRanged(threat.type))return false;
  const range=dist(soldier,threat),reach=TYPES[threat.type].range;
  if(range>reach+1.6||range<.1)return false;
  const facing=(Math.sin(threat.facing)*(soldier.x-threat.x)+
   Math.cos(threat.facing)*(soldier.z-threat.z))/range;
  return facing>.56&&(threat.reload??0)<.43;
 }
 // A finite squad-neighborhood request, remembered for a short time. A unit
 // may help a pressured nearby ally, but never changes the captain's order.
 function findSupportOpportunity(state,soldier,squad){
  if(isRanged(soldier.type)||squad.order==='retreat'||
    (squad.order==='hold'&&soldier.discipline>.97))return null;
  let best=null,bestSq=13*13;
  for(const ally of nearbySoldiers(state,soldier.x,soldier.z,13)){
   if(!ally.alive||ally.team!==soldier.team||ally.id===soldier.id||
    (ally.lastEnemyAt??-Infinity)<state.elapsed-2.4||
    (ally.suppression||0)<.10)continue;
   const dx=ally.x-soldier.x,dz=ally.z-soldier.z,dd=dx*dx+dz*dz;
   if(dd>bestSq)continue;
   const foe=state.soldiers[ally.lastEnemyId];
   if(!foe||!foe.alive||foe.team===soldier.team||dist(foe,ally)>7.5||
      dist(foe,soldier)>14)continue;
   const slotDx=foe.x-(squad.x+soldier.offsetX);
   const slotDz=foe.z-(squad.z+soldier.offsetZ);
   if(squad.order==='hold'&&Math.hypot(slotDx,slotDz)>17)continue;
   bestSq=dd;best={allyId:ally.id,targetId:foe.id};
  }
  return best;
 }
 // G2 — bounded individual combat decisions. Orders still belong to the
 // commander: no soldier may change squad.order or squad.formation.
 // Called at most once per local decision window; reactions are deterministic
 // but staggered by soldier awareness, discipline and personality.
 function updatePersonalTactics(state,soldier,squad,threat,slotX,slotZ){
  const now=state.elapsed,range=threat?dist(soldier,threat):Infinity;
  const close=threat?.alive&&range<(isRanged(soldier.type)?15:8);
  // Support checks are staggered: do not do an all-soldier scan each 80ms.
  if(!close&&!isRanged(soldier.type)&&now>=soldier.nextSupportCheck){
   soldier.nextSupportCheck=now+.72+seeded(state.seed,soldier.id,251)*.48;
   const aid=findSupportOpportunity(state,soldier,squad);
   if(aid&&now>=soldier.assistUntil){
    soldier.assistTargetId=aid.targetId;
    soldier.assistUntil=now+1.05+(1-soldier.discipline)*.5;
    soldier.microState='assist';soldier.assistanceCount++;
   }
  }
  if(!close&&soldier.microState==='assist'){
   const foe=state.soldiers[soldier.assistTargetId];
   if(foe?.alive&&foe.team!==soldier.team&&now<soldier.assistUntil&&
     dist(soldier,foe)<14)return 'assist';
   soldier.assistTargetId=null;soldier.assistUntil=0;
  }
  if(!close){
   if(soldier.microState!=='formation'&&soldier.microState!=='return'){
    soldier.microState='return';soldier.rejoinUntil=now+.35;
    soldier.microUntil=now+.35;
   }
   if(soldier.microState==='return'&&now>=soldier.rejoinUntil&&
      Math.hypot(soldier.x-slotX,soldier.z-slotZ)<1.7){
    soldier.microState='formation';soldier.threatId=null;
   }
   return soldier.microState;
  }
  soldier.lastThreatAt=now;
  const threatChanged=soldier.threatId!==threat.id;
  // No instant omniscient response: see enemy, then evaluate after a short
  // individual delay. Changing threat may shorten, but not erase the delay.
  if(threatChanged){
   soldier.threatId=threat.id;
   soldier.nextMicroDecision=Math.max(now,
    now+.12+(1-soldier.awareness)*.48-(soldier.hitPose>0?.12:0));
   if(soldier.microState==='return')soldier.microState='formation';
   return soldier.microState;
  }
  if(now<soldier.nextMicroDecision)return soldier.microState;
  const opponentFacing=Math.sin(threat.facing||0)*(soldier.x-threat.x)+
   Math.cos(threat.facing||0)*(soldier.z-threat.z);
  const facingRisk=opponentFacing/Math.max(.1,range)>.20;
  const meleeEnemy=!isRanged(threat.type);
  const vulnerable=meleeEnemy&&range<(isRanged(soldier.type)?11:5.3);
  const underPressure=soldier.hitPose>0||(soldier.suppression||0)>.38;
  const decideRoll=seeded(state.seed,soldier.id,
   Math.floor(now/1.15)+Math.imul(threat.id+1,97));
  const anticipated=incomingMeleeWarning(soldier,threat);
  const isMemoryThreat=soldier.lastEnemyId===threat.id&&
   now-(soldier.lastEnemyAt??-Infinity)<3.5;
  const repeatThreat=isMemoryThreat&&soldier.repeatAttackerHits>=2&&
   soldier.repeatWindowUntil>now;
  let next='engage',duration=.75;
  if(isRanged(soldier.type)){
   if(vulnerable&&(facingRisk||underPressure||range<5||anticipated)){
    next='evade';duration=1.0+(1-soldier.courage)*.7;
   }else next='formation';
  }else if((soldier.type==='sword'||soldier.type==='pike')&&
      meleeEnemy&&range<6.5&&facingRisk&&
      now>=soldier.guardCooldownUntil&&
      (underPressure||anticipated||repeatThreat||
       decideRoll<(.22+.42*awarenessScore(soldier)))){
   next='guard';duration=.50+(1-soldier.initiative)*.42;
   if(anticipated)soldier.anticipatedCount++;
   soldier.guardUntil=now+duration;
   soldier.guardCooldownUntil=now+duration+.9+(1-soldier.discipline)*.65;
  }else if(soldier.type==='pike'&&range<2.65&&
      now>=soldier.guardCooldownUntil&&decideRoll<.53){
   next='evade';duration=.48;
   soldier.guardCooldownUntil=now+1.35;
  }
  // Recent attackers are recognised, but orders and threat proximity still
  // control engagement. No long-range revenge pursuits or order changes.
  if(isMemoryThreat&&next==='engage'&&!isRanged(soldier.type)&&range<6.5)
   soldier.counterUntil=Math.max(soldier.counterUntil,now+.15);
  if(squad.order==='retreat'&&next==='engage')next='return';
  soldier.microState=next;
  soldier.microUntil=now+duration;
  // Bound local thinking to ~1 decision/sec; no frame-rate dependent rolls.
  soldier.nextMicroDecision=now+duration+.24+(1-soldier.awareness)*.35;
  return next;
 }
 function awarenessScore(soldier){return (soldier.awareness+soldier.discipline)*.5;}
 // Facing matters: only a ready, front-facing shield can deflect an attack.
 // Muskets remain fully effective against these shields; pike bracing protects
 // against a frontal melee rush but is not treated as bulletproof armor.
 function soldierGuard(state,target,opts={},rawDamage=0){
  const weapon=opts.weapon,zone=opts.zone||'body';
  if(!weapon||weapon==='musket'||weapon==='bash'||zone==='head')
   return {blocked:false,damage:rawDamage,guarded:false};
  const enemy=opts.attackerPosition||
   (opts.attackerId==null?null:state.soldiers[opts.attackerId]);
  if(!enemy||!Number.isFinite(enemy.x)||!Number.isFinite(enemy.z))
   return {blocked:false,damage:rawDamage,guarded:false};
  const ex=enemy.x-target.x,ez=enemy.z-target.z,length=Math.hypot(ex,ez);
  if(length<.1)return {blocked:false,damage:rawDamage,guarded:false};
  const frontal=(Math.sin(target.facing)*ex+Math.cos(target.facing)*ez)/length;
  if(frontal<.4)return {blocked:false,damage:rawDamage,guarded:false};
  const squad=state.squads[target.squadId];
  const activelyGuarding=target.microState==='guard'&&target.guardUntil>state.elapsed;
  const swordShield=target.type==='sword'&&
   (target.attackPose<=.13||activelyGuarding);
  const pikeBrace=target.type==='pike'&&
   (squad.formation==='shield'||activelyGuarding)&&
   (weapon==='sword'||weapon==='spear'||weapon==='dagger');
  if(!swordShield&&!pikeBrace)return {blocked:false,damage:rawDamage,guarded:false};
  const probability=swordShield?
   (weapon==='bow'?.26:squad.formation==='shield'?.56:.40)+(activelyGuarding?.17:0):
   .20+(activelyGuarding?.24:0);
  const defenderRoll=seeded(state.seed,target.id,state.tick*7+23);
  if(defenderRoll<probability)return {blocked:true,damage:0,guarded:true};
  return {blocked:false,damage:rawDamage*(swordShield?.78:.87),guarded:true};
 }
 // A simulated AI shot has a target-height error and horizontal dispersion.
 // Its first actual body/solid intersection determines the result, not a
 // percentage roll that magically damages the intended target through others.
 // Note: this is still instantaneous fire, not a physical arrow flight mesh.
 function traceRangedAttack(state,attacker,target,options={}){
  if(!state||!attacker?.alive||!target?.alive||!isRanged(attacker.type))return null;
  const role=TYPES[attacker.type],range=role.range;
  const targetDistance=dist(attacker,target);
  if(targetDistance<.05||targetDistance>range+.75)return null;
  const origin={x:attacker.x,y:1.85,z:attacker.z};
  const hRoll=options.horizontalRoll??seeded(state.seed,attacker.id,state.tick*31+target.id*17+301);
  const vRoll=options.verticalRoll??seeded(state.seed,attacker.id,state.tick*47+target.id*11+709);
  // Suppression and charging make aim more erratic, without randomizing every frame.
  const squad=state.squads[attacker.squadId],penalty=
   1+(attacker.suppression||0)*.65+(squad.order==='charge'?.32:0);
  const h=clamp(.5+(hRoll-.5)*penalty,0,1);
  const v=clamp(.5+(vRoll-.5)*penalty,0,1);
  const aim=WeaponBalance.aimedShot(attacker.type==='bow'?'archer':'musket',
   origin,{x:target.x,y:0,z:target.z},h,v,3.2);
  const direction={x:aim.point.x-origin.x,y:aim.point.y-origin.y,z:aim.point.z-origin.z};
  const hit=raycastSoldier(state,origin,direction,range+.85,attacker.team,
   {firstBody:true,returnFriendly:true,ignoreSoldierId:attacker.id});
  return {impact:hit,aim:aim.point,blockedByFriend:!!hit&&hit.soldier.team===attacker.team};
 }
 // Physical, finite-speed bot arrows. They are authoritative gameplay
 // objects, unlike the previous instant ray against the intended target.
 // Both enemy and friendly bodies stop arrows; only enemies lose HP.
 function makeArrowAim(state,attacker,targetBase,salt=0,options={}){
  const origin={x:attacker.x,y:1.85,z:attacker.z};
  const dx=targetBase.x-origin.x,dz=targetBase.z-origin.z;
  const distance=Math.hypot(dx,dz);
  if(distance<.25||distance>TYPES.bow.range+2)return null;
  const squad=state.squads[attacker.squadId];
  const penalty=1+(attacker.suppression||0)*.65+(squad.order==='charge'?.32:0);
  const h=clamp(.5+((options.horizontalRoll??seeded(state.seed,attacker.id,state.tick*31+salt+301))-.5)*penalty,0,1);
  const v=clamp(.5+((options.verticalRoll??seeded(state.seed,attacker.id,state.tick*47+salt+709))-.5)*penalty,0,1);
  const aim=WeaponBalance.aimedShot('archer',origin,targetBase,h,v,3.2);
  const flyDistance=Math.hypot(aim.point.x-origin.x,aim.point.z-origin.z);
  const duration=flyDistance/ARROW_SPEED;
  if(duration<=0)return null;
  return {origin,velocity:{x:(aim.point.x-origin.x)/duration,
   y:(aim.point.y-origin.y)/duration+ARROW_GRAVITY*duration*.5,
   z:(aim.point.z-origin.z)/duration},range:flyDistance};
 }
 function launchArrow(state,attacker,target,options={}){
  if(!state||!attacker?.alive||attacker.type!=='bow'||!target)return null;
  const targetBase={x:target.x,y:0,z:target.z};
  const aim=makeArrowAim(state,attacker,targetBase,target.id??197,options);
  if(!aim)return null;
  // Bounded projectile pool prevents unbounded gameplay/render memory use.
  if(state.projectiles.length>=MAX_ARROWS)return null;
  const p={id:state.nextProjectileId++,ownerId:attacker.id,team:attacker.team,
   x:aim.origin.x,y:aim.origin.y,z:aim.origin.z,
   vx:aim.velocity.x,vy:aim.velocity.y,vz:aim.velocity.z,
   life:0,distance:0,range:Math.min(TYPES.bow.range+8,aim.range+12)};
  state.projectiles.push(p);
  return p;
 }
 // A player's standing body is a bounded capsule-like cylinder. The first
 // physical contact along the segment determines its anatomical hit zone.
 function raycastPlayer(state,origin,direction,maxDistance){
  if(!state.playerActive||state.playerHealth<=0||maxDistance<=0)return null;
  const length=Math.hypot(direction.x,direction.y,direction.z);
  if(length<1e-8)return null;
  const dx=direction.x/length,dy=direction.y/length,dz=direction.z/length;
  const px=origin.x-state.playerPosition.x,pz=origin.z-state.playerPosition.z;
  const aa=dx*dx+dz*dz,rad=.8;
  let near=0,far=maxDistance;
  if(aa<1e-10){if(px*px+pz*pz>rad*rad)return null;}
  else{
   const bb=2*(px*dx+pz*dz),cc=px*px+pz*pz-rad*rad;
   const discr=bb*bb-4*aa*cc;if(discr<0)return null;
   const root=Math.sqrt(discr);
   near=Math.max(0,(-bb-root)/(2*aa));
   far=Math.min(far,(-bb+root)/(2*aa));
  }
  if(Math.abs(dy)>1e-10){
   const lo=(.2-origin.y)/dy,hi=(3.55-origin.y)/dy;
   near=Math.max(near,Math.min(lo,hi));far=Math.min(far,Math.max(lo,hi));
  }else if(origin.y<.2||origin.y>3.55)return null;
  if(near>far||near>maxDistance)return null;
  const y=origin.y+near*dy;
  const lateral=Math.abs(px*dz-pz*dx);
  const zone=y>2.52?'head':y<1.1?'leg':lateral>.55?'arm':'body';
  return {distance:near,zone,point:{x:origin.x+near*dx,y,z:origin.z+near*dz}};
 }
 function damagePlayer(state,attacker,amount,zone='body'){
  if(!state.playerActive||state.playerHealth<=0||state.playerHitCooldown>0||
      attacker.team===state.playerTeam||!Number.isFinite(amount)||amount<=0)return false;
  state.playerHealth=Math.max(0,state.playerHealth-amount);
  state.playerHitCooldown=.28;
  state.playerHits.push({attackerId:attacker.id,type:attacker.type,
   damage:amount,zone});
  if(state.playerHealth<=0)state.playerActive=false;
  return true;
 }
 function advanceProjectiles(state,dt){
  if(!state.projectiles?.length||dt<=0)return;
  for(let i=state.projectiles.length-1;i>=0;i--){
   const p=state.projectiles[i],owner=state.soldiers[p.ownerId];
   if(!owner){state.projectiles.splice(i,1);continue;}
   const start={x:p.x,y:p.y,z:p.z};
   const next={x:p.x+p.vx*dt,y:p.y+p.vy*dt-ARROW_GRAVITY*dt*dt*.5,z:p.z+p.vz*dt};
   const direction={x:next.x-start.x,y:next.y-start.y,z:next.z-start.z};
   const length=Math.hypot(direction.x,direction.y,direction.z);
   if(length<1e-6){state.projectiles.splice(i,1);continue;}
   const world=firstWorldObstacle(state,start,direction,length);
   const body=raycastSoldier(state,start,direction,length,p.team,
    {firstBody:true,returnFriendly:true,ignoreSoldierId:p.ownerId});
   const player=p.team!==state.playerTeam?raycastPlayer(state,start,direction,length):null;
   let first=length+1,kind=null;
   if(world!==null&&world<=first){first=world;kind='world';}
   if(body&&body.distance<first){first=body.distance;kind='soldier';}
   if(player&&player.distance<first){first=player.distance;kind='player';}
   // Ground plane absorbs falling arrows even where there is no scenery.
   if(start.y>.06&&next.y<=.06){
    const ground=length*(start.y-.06)/(start.y-next.y);
    if(ground<first){first=ground;kind='ground';}
   }
   p.x=next.x;p.y=next.y;p.z=next.z;
   p.vy-=ARROW_GRAVITY*dt;p.life+=dt;p.distance+=length;
   if(kind==='soldier'&&body.soldier.team!==p.team)
    damageSoldier(state,body.targetId,WeaponBalance.damage('bow',body.zone,.55),
     {attackerId:owner.id,weapon:'bow',zone:body.zone});
   else if(kind==='player')damagePlayer(state,owner,
    WeaponBalance.damage('bow',player.zone,.55),player.zone);
   if(kind||p.life>=ARROW_LIFETIME||p.distance>p.range||p.y<-.1||
      Math.abs(p.x)>BOUNDS||Math.abs(p.z)>BOUNDS)
    state.projectiles.splice(i,1);
  }
 }
 function tracePlayerMusket(state,attacker,options={}){
  if(attacker.team===state.playerTeam||!state.playerActive)return null;
  const target={x:state.playerPosition.x,y:0,z:state.playerPosition.z};
  const origin={x:attacker.x,y:1.85,z:attacker.z};
  const h=options.horizontalRoll??seeded(state.seed,attacker.id,state.tick*31+311);
  const v=options.verticalRoll??seeded(state.seed,attacker.id,state.tick*47+719);
  const aim=WeaponBalance.aimedShot('musket',origin,target,h,v,3.2);
  const dir={x:aim.point.x-origin.x,y:aim.point.y-origin.y,z:aim.point.z-origin.z};
  const range=Math.min(TYPES.musket.range+1,Math.hypot(dir.x,dir.y,dir.z)+1);
  const player=raycastPlayer(state,origin,dir,range);
  if(!player)return null;
  const body=raycastSoldier(state,origin,dir,player.distance,attacker.team,
   {firstBody:true,returnFriendly:true,ignoreSoldierId:attacker.id});
  if(body&&body.distance<=player.distance+.01)return null;
  const obstacle=firstWorldObstacle(state,origin,dir,player.distance);
  if(obstacle!==null&&obstacle<=player.distance+.01)return null;
  return player;
 }
 // Gameplay-authoritative damage path shared by soldier AI and player weapons.
 function damageSoldier(state,targetId,amount,opts={}){
  const target=state.soldiers[targetId];
  if(!target||!target.alive||!Number.isFinite(amount)||amount<=0)return null;
  const playerSource=opts.source==='player';
  const attacker=opts.attackerId==null?null:state.soldiers[opts.attackerId];
  if(playerSource?target.team===state.playerTeam:(!attacker||!attacker.alive||attacker.team===target.team))return null;
  const squad=state.squads[target.squadId];
  const guard=soldierGuard(state,target,opts,amount);
  if(guard.blocked){
   if(opts.attackerId!=null&&target.microState==='guard'){
    target.counterUntil=state.elapsed+.70;
    target.guardUntil=state.elapsed;
   }
   state.combatEvents.push({kind:'shield',source:playerSource?'player':'soldier',
    attackerId:attacker?.id??null,targetId,damage:0,killed:false,
    zone:opts.zone||'body',x:target.x,z:target.z,team:target.team});
   if(state.combatEvents.length>240)state.combatEvents.splice(0,state.combatEvents.length-240);
   return {damage:0,killed:false,blocked:true,targetId,zone:opts.zone||'body'};
  }
  const effective=Math.min(target.hp,guard.damage);
  target.hp=Math.max(0,target.hp-effective);
  target.hitPose=.22;
  target.underFireUntil=state.elapsed+(target.type==='musket'?2.2:1.35);
  target.suppression=clamp((target.suppression||0)+.13+amount/Math.max(1,target.maxHp)*.25,0,1);
  // Repeated hits from the SAME soldier build a short-lived, imperfect
  // defensive adaptation. A new attacker resets that memory.
  if(attacker&&attacker.alive){
   target.repeatAttackerHits=(target.lastEnemyId===attacker.id&&
    target.repeatWindowUntil>state.elapsed)?
    Math.min(4,(target.repeatAttackerHits||0)+1):1;
   target.repeatWindowUntil=state.elapsed+6;
   target.lastEnemyAt=state.elapsed;
  }else{target.repeatAttackerHits=0;target.repeatWindowUntil=0;}
  target.lastEnemyId=attacker?.id??null;
  const killed=target.hp<=0;
  if(killed){
   target.alive=false;squad.alive--;
   if(target.team==='blue')state.blueDeaths++;else state.redDeaths++;
   if(playerSource)state.playerKills++;
   else{attacker.kills++;state.squads[attacker.squadId].kills++;}
   state.events.push((playerSource?'Oyuncu':state.squads[attacker.squadId].name)+
     ': '+TYPES[target.type].name+' düştü');
   if(state.events.length>12)state.events.shift();
  }
  state.combatEvents.push({kind:'soldier',source:playerSource?'player':'soldier',
   attackerId:attacker?.id??null,targetId,damage:Math.round(effective*10)/10,
   killed,zone:opts.zone||'body',guarded:guard.guarded,x:target.x,z:target.z,team:target.team});
  if(state.combatEvents.length>240)state.combatEvents.splice(0,state.combatEvents.length-240);
  return {damage:effective,killed,guarded:guard.guarded,targetId,zone:opts.zone||'body'};
 }
 function strike(state,attacker,target,role){
  const victimSquad=state.squads[target.squadId],attackerSquad=state.squads[attacker.squadId];
  const d=dist(attacker,target);
  // Neither pikes nor swords may reach through a solid obstacle.
  if(worldLineBlocked(state,{x:attacker.x,y:1.85,z:attacker.z},
    {x:target.x,y:1.85,z:target.z}))return null;
  if(attacker.type==='bow')return launchArrow(state,attacker,target);
  if(isRanged(attacker.type)){
   // Muskets use near-instant geometric raycasts, bows have real flight.
   const shot=traceRangedAttack(state,attacker,target);
   const hit=shot?.impact;
   if(!hit||hit.soldier.team===attacker.team)return null;
   const weapon=attacker.type==='bow'?'bow':'musket';
   const power=WeaponBalance.damage(weapon,hit.zone,.55);
   return damageSoldier(state,hit.targetId,power,
    {attackerId:attacker.id,weapon,zone:hit.zone});
  }
  let chance=isRanged(attacker.type)?
   (attacker.type==='musket'?.68:.57)*(.55+.45*(1-d/role.range)) : .93;
  if(isRanged(attacker.type)&&attackerSquad.order==='charge')chance*=.65;
  if(victimSquad.formation==='loose'&&isRanged(attacker.type))chance*=.73;
  if(victimSquad.formation==='shield'&&!isRanged(attacker.type))chance*=.82;
  // An attack from the rear of a line is more damaging than a frontal clash.
  // Shields and braced pikes resist charges from the front; flanking matters.
  const vx=attacker.x-target.x,vz=attacker.z-target.z,vl=Math.max(.01,Math.hypot(vx,vz));
  const frontal=(Math.sin(target.facing)*vx+Math.cos(target.facing)*vz)/vl;
  const rear=frontal<-.48;
  if(rear&&!isRanged(attacker.type))chance=Math.min(.98,chance*1.12);
  if(!rear&&frontal>.45&&target.type==='pike'&&attacker.type==='sword'&&
   (victimSquad.formation==='square'||victimSquad.formation==='shield'))chance*=.76;
  const rng=(Math.imul(state.tick+1,1664525)^Math.imul(attacker.id+1,1013904223)^Math.imul(target.id+1,1639))>>>0;
  chance*=1-(attacker.suppression||0)*.28;
  chance*=.83+.17*(attacker.stamina??1);
  if(rng/4294967296>chance)return null;
  const multiplier=(victimSquad.formation==='square'&&attacker.type==='sword'?.84:1)*
   (rear&&!isRanged(attacker.type)?(attacker.type==='sword'?1.24:1.12):1);
  return damageSoldier(state,target.id,role.damage*multiplier,
   {attackerId:attacker.id,weapon:attacker.type==='pike'?'spear':'sword',zone:'body'});
 }
 // Army soldier ray volume: standing body height 0.25..3.65m, radius 0.75m.
 // Intersect cylinder analytically to avoid instanced-mesh bounding box/raycast bugs.
 function raycastSoldier(state,origin,direction,maxDistance,team='blue',options={}){
  if(!state||!origin||!direction||!Number.isFinite(maxDistance)||maxDistance<=0)return null;
  const len=Math.hypot(direction.x,direction.y,direction.z);
  if(len<1e-6)return null;
  const dx=direction.x/len,dy=direction.y/len,dz=direction.z/len;
  const aa=dx*dx+dz*dz,radius=.80;
  let best=null,limit=maxDistance;
  for(const target of state.soldiers){
   if(!target.alive||target.id===options.ignoreSoldierId)continue;
   if(target.team===team&&!options.firstBody)continue;
   const px=origin.x-target.x,pz=origin.z-target.z;
   let low,high;
   if(aa<1e-9){if(px*px+pz*pz>radius*radius)continue;low=0;high=limit;}
   else{
    const bb=2*(px*dx+pz*dz),cc=px*px+pz*pz-radius*radius;
    const det=bb*bb-4*aa*cc;if(det<0)continue;
    const root=Math.sqrt(det);low=(-bb-root)/(2*aa);high=(-bb+root)/(2*aa);
    if(high<0||low>limit)continue;
   }
   let entry=Math.max(0,low),exit=Math.min(limit,high);
   if(Math.abs(dy)>1e-9){
    const ya=(.20-origin.y)/dy,yb=(3.55-origin.y)/dy;
    entry=Math.max(entry,Math.min(ya,yb));exit=Math.min(exit,Math.max(ya,yb));
   }else if(origin.y<.20||origin.y>3.55)continue;
   if(entry>exit||entry>limit)continue;
   // Ignore almost-zero entry distances (a player starts inside an ally's
   // personal space), but do not allow firing through an ally 1m in front.
   if(entry<.02&&target.team===team)continue;
   const y=origin.y+entry*dy;
   const lateral=Math.abs(px*dz-pz*dx);
   const zone=y>2.52?'head':y<1.1?'leg':lateral>.55?'arm':'body';
   limit=entry;
   best={soldier:target,targetId:target.id,distance:entry,
    point:{x:origin.x+entry*dx,y,z:origin.z+entry*dz},zone};
  }
  if(!best)return null;
  const block=firstWorldObstacle(state,origin,{x:dx,y:dy,z:dz},best.distance);
  if(block!==null&&block<best.distance-.03)return null;
  // firstBody is used by army AI for shared obstruction checks. Human shots
  // never damage an ally, even though the ally physically intercepts the ray.
  if(best.soldier.team===team&&!options.returnFriendly)return null;
  return best;
 }
 function soldierInCone(state,origin,forward,range,team='blue',halfAngleCos=.65){
  const len=Math.hypot(forward.x,forward.z)||1,fx=forward.x/len,fz=forward.z/len;
  let found=null,best=range;
  for(const s of state.soldiers){
   if(!s.alive||s.team===team)continue;
   const dx=s.x-origin.x,dz=s.z-origin.z,d=Math.hypot(dx,dz);
   if(d>range+.65||d<1e-5||d>=best)continue;
   if((dx*fx+dz*fz)/d<halfAngleCos)continue;
   const origin3={x:origin.x,y:1.65,z:origin.z};
   const hit=raycastSoldier(state,origin3,{x:dx,y:0,z:dz},d+.8,team,
    {firstBody:true,returnFriendly:true});
   if(!hit||hit.targetId!==s.id)continue;
   best=d;found=s;
  }
  return found;
 }
 function firstBodyBeforePlayer(state,attacker){
  const origin={x:attacker.x,y:1.85,z:attacker.z};
  const direction={x:state.playerPosition.x-attacker.x,y:0,z:state.playerPosition.z-attacker.z};
  const length=Math.hypot(direction.x,direction.z);
  if(length<1)return false;
  const impact=raycastSoldier(state,origin,direction,length-.8,attacker.team,
   {firstBody:true,returnFriendly:true,ignoreSoldierId:attacker.id});
  return impact!==null;
 }
 function strikePlayer(state,attacker,role){
  if(!state.playerActive||state.playerHealth<=0)return null;
  const d=dist(attacker,state.playerPosition);
  if(d>role.range)return null;
  if(attacker.type==='bow')
   return launchArrow(state,attacker,state.playerPosition);
  if(attacker.type==='musket'){
   const hit=tracePlayerMusket(state,attacker);
   return hit?damagePlayer(state,attacker,
     WeaponBalance.damage('musket',hit.zone),hit.zone):null;
  }
  if(state.playerHitCooldown>0||d>role.range)return null;
  if(worldLineBlocked(state,{x:attacker.x,y:1.85,z:attacker.z},
    {x:state.playerPosition.x,y:1.85,z:state.playerPosition.z}))return null;
  const rng=seeded(state.seed,attacker.id,state.tick+933);
  if(rng>.77)return null;
  return damagePlayer(state,attacker,role.damage,'body');
 }
 function setPlayerHealth(state,hp){
  if(!state||!Number.isFinite(hp))return;
  state.playerHealth=Math.max(0,hp);state.playerActive=hp>0;
 }
 function drainPlayerHits(state){return state.playerHits.splice(0);}
 function drainCombatEvents(state){return state.combatEvents.splice(0);}
 function updateMorale(state){
  for(const squad of state.squads){
   if(!squad.alive){squad.morale=0;continue;}
   const fraction=squad.alive/squad.startCount;
   const supporters=state.squads.filter(s=>s.team===squad.team&&s.alive>0&&s.id!==squad.id&&dist(s,squad)<65).length;
   const pressure=state.squads.filter(e=>e.team!==squad.team&&e.alive>0&&dist(e,squad)<45).length;
   const reformBonus=squad.aiRole==='rally'&&squad.order==='hold'?.12:0;
   const members=state.soldiers.filter(u=>u.alive&&u.squadId===squad.id);
   const incoming=members.length?members.reduce((t,u)=>t+(u.suppression||0),0)/members.length:0;
   const captainNerve=squad.nerve??.7;
   squad.morale=clamp(.23+fraction*.56+supporters*.075-pressure*.085+
    reformBonus-incoming*(.12+(1-captainNerve)*.12),.08,1);
   const physical=squadCohesionEstimate(state,squad);
   squad.cohesion=clamp(.40+supporters*.12+(squad.order==='hold'?.20:0)-
     (squad.order==='charge'?.18:0),.2,1)*.55+physical*.45;
  }
 }
 function oneTick(state,dt){
  state.elapsed+=dt;state.tick++;
  state.playerHitCooldown=Math.max(0,state.playerHitCooldown-dt);
  deliverCommanderSignals(state,'blue');
  deliverCommanderSignals(state,'red');
  if(state.tick===1||state.tick%54===0){
   updateMorale(state);
   updateTeamPlan(state,'blue',true);
   updateTeamPlan(state,'red',true);
  }
  for(const s of state.squads)if(s.alive)moveSquad(state,s,dt);
  for(const s of state.squads)if(s.alive)updateCombatPosture(state,s);
  // Build ONCE per physics tick. Querying a 2.5/8/13m radius should not
  // scan all 140 soldiers for every person in a large open field.
  state._spatialIndex=buildSpatialGrid(state);
  // Keep rows compact as casualties open gaps in the line. Stable original
  // soldier order prevents shuffling every frame, and player commands remain
  // authoritative over which formation is used.
  const nextRank=new Array(state.squads.length).fill(0),activeRank=new Array(state.soldiers.length);
  for(const soldier of state.soldiers)if(soldier.alive)
   activeRank[soldier.id]=nextRank[soldier.squadId]++;
  for(const soldier of state.soldiers){
   if(!soldier.alive)continue;
   const squad=state.squads[soldier.squadId],role=TYPES[soldier.type];
   const ranged=isRanged(soldier.type);
   soldier.suppression=Math.max(0,(soldier.suppression||0)-dt*.085);
   soldier.stamina=clamp((soldier.stamina??1)+dt*(squad.order==='charge'?-.014:.008),.45,1);
   if(soldier.commandSeen!==squad.commandRevision){
    soldier.commandSeen=squad.commandRevision;
    soldier.responseAt=state.elapsed+soldier.reactionDelay*(1.45-soldier.discipline);
   }
   const reacting=state.elapsed<soldier.responseAt;
   const slot=formationOffset(squad,activeRank[soldier.id],Math.max(1,nextRank[soldier.squadId]));
   // Individuals don't occupy perfect grid coordinates or walk at identical pace.
   let destX=squad.x+slot.x+soldier.offsetX,destZ=squad.z+slot.z+soldier.offsetZ;
   let nearFoe=nearestEnemy(state,soldier,ranged?role.range:18,
     squad.targetSquadId);
   const closeThreat=nearestEnemy(state,soldier,ranged?15:8,null);
   const personal=updatePersonalTactics(state,soldier,squad,closeThreat,
    destX,destZ);
   if(personal==='assist'&&soldier.assistTargetId!=null){
    const supportedEnemy=state.soldiers[soldier.assistTargetId];
    if(supportedEnemy?.alive&&dist(soldier,supportedEnemy)<14){
     // Prefer a local rescue target, but never ignore an attacker at arm's
     // length and never pull a holding rank away by more than six units.
     if(!nearFoe||dist(soldier,nearFoe)>6.5)nearFoe=supportedEnemy;
     const dirX=supportedEnemy.x-soldier.x,dirZ=supportedEnemy.z-soldier.z;
     const d=Math.max(.01,Math.hypot(dirX,dirZ));
     const assistStep=squad.order==='hold'?3.2:6.2;
     destX+=dirX/d*assistStep;destZ+=dirZ/d*assistStep;
    }
   }
   // Archer and musketeer self-preservation: two soldiers who heard the same
   // order may peel apart to make room without abandoning their officer.
   if(personal==='evade'&&closeThreat&&squad.order!=='charge'){
    const dd=Math.max(.1,dist(soldier,closeThreat));
    const nx=(soldier.x-closeThreat.x)/dd,nz=(soldier.z-closeThreat.z)/dd;
    const lateral=2.5+(1-soldier.discipline)*1.7;
    destX+=nx*4.3-nz*lateral*soldier.sidestepSide;
    destZ+=nz*4.3+nx*lateral*soldier.sidestepSide;
   }
   // Pike crews prefer their weapon's reach instead of allowing swordsmen
   // to hug the shaft. The movement stays bounded around the assigned slot.
   if(soldier.type==='pike'&&closeThreat&&personal==='evade'&&
       dist(soldier,closeThreat)<2.8){
    const d=Math.max(.01,dist(soldier,closeThreat));
    destX+=(soldier.x-closeThreat.x)/d*2.8;
    destZ+=(soldier.z-closeThreat.z)/d*2.8;
   }
   // Tactical spacing independent of arbitrary animation timing.
   const spacing=distanceManeuver(soldier,squad,closeThreat,state.elapsed);
   if(!reacting&&(personal==='evade'||personal==='engage'||personal==='guard')){
    destX+=spacing.x;destZ+=spacing.z;
    if(spacing.kind!=='none'&&state.tick%5===soldier.id%5)soldier.spacingCount++;
   }
   if(soldier.sidestepUntil>state.elapsed&&nearFoe){
    const dd=Math.max(.1,dist(soldier,nearFoe));
    destX+=(nearFoe.z-soldier.z)/dd*2.6*soldier.sidestepSide;
    destZ-=(nearFoe.x-soldier.x)/dd*2.6*soldier.sidestepSide;
   }
   // Melee fighters disengage slightly from the row when threatened. A hold
   // command limits pursuit, but never forbids self-defence at arm's length.
   const mayFight=!reacting&&personal!=='guard'&&personal!=='return'&&
    (!ranged&&(
    personal==='assist'||squad.order==='charge'||squad.order==='advance'||squad.order==='flank'||
    squad.order==='skirmish'||((squad.order==='hold'||squad.order==='position')&&
      nearFoe&&dist(soldier,nearFoe)<6.7)));
   if(mayFight&&nearFoe&&dist(soldier,nearFoe)>role.range*.68){
    const d=dist(soldier,nearFoe),desired=squad.order==='hold'?2.5:role.range*.66;
    const push=clamp((d-desired)/Math.max(1,d),0,1);
    destX+= (nearFoe.x-destX)*push*(.45+.45*soldier.initiative);
    destZ+= (nearFoe.z-destZ)*push*(.45+.45*soldier.initiative);
   }
   // Mevzi tut is not a pursuit command. Self-defence is limited to a small
   // personal bubble; the soldier rejoins the rank after danger passes.
   if((squad.order==='hold'||squad.order==='position')&&personal!=='formation'){
    const leash=personal==='evade'?8:personal==='guard'?3.5:6;
    const ax=destX-(squad.x+slot.x+soldier.offsetX);
    const az=destZ-(squad.z+slot.z+soldier.offsetZ);
    const length=Math.hypot(ax,az);
    if(length>leash){destX-=ax*(1-leash/length);destZ-=az*(1-leash/length);}
   }
   // Small personal anticipation/side-step; seeded, smooth and bounded.
   const wiggle=.27+.38*(1-soldier.discipline);
   destX+=Math.sin(state.elapsed*(.5+soldier.initiative*.4)+soldier.id*2.17)*wiggle;
   destZ+=Math.cos(state.elapsed*(.47+soldier.initiative*.3)+soldier.id*1.93)*wiggle;
   if(reacting){destX=soldier.x;destZ=soldier.z;}
   // Deterministic local personal-space repulsion. Prevent troop models from
   // stacking at the same point during a charge or while ranks re-form.
   let avoidX=0,avoidZ=0;
   for(const other of nearbySoldiers(state,soldier.x,soldier.z,2.5)){
    if(!other.alive||other.id===soldier.id)continue;
    const sx=soldier.x-other.x,sz=soldier.z-other.z;
    if(Math.abs(sx)>2.5||Math.abs(sz)>2.5)continue;
    const sepSq=sx*sx+sz*sz;
    if(sepSq>0.01&&sepSq<2.5*2.5){
     const sep=Math.sqrt(sepSq),force=(2.5-sep)/2.5;
     avoidX+=sx/sep*force;avoidZ+=sz/sep*force;
    }else if(sepSq<=.01){
     avoidX+=(soldier.id<other.id?-1:1)*.5;
    }
   }
   if(!reacting){
    destX+=clamp(avoidX,-2.8,2.8);
    destZ+=clamp(avoidZ,-2.8,2.8);
   }
   // G4.3: each man takes his own detour if the direct slot is behind
   // a solid obstacle. Cache per-soldier paths instead of running A* every tick.
   if(squad.playerControlled&&state.worldObstacles.length&&!reacting){
    const from={x:soldier.x,z:soldier.z},goal={x:destX,z:destZ};
    const clear=routeSegmentClear(state,from,goal,.65);
    if(clear){soldier.personalRoute=[];}
    else{
     const changed=soldier.routeTargetX==null||
      Math.hypot(soldier.routeTargetX-destX,soldier.routeTargetZ-destZ)>8;
     if((changed||state.elapsed-soldier.routeComputedAt>1.7)&&
        !(!changed&&soldier.personalRoute.length)){
      soldier.personalRoute=planSquadRoute(state,from,goal,.70)||[];
      soldier.routeComputedAt=state.elapsed;
      soldier.routeTargetX=destX;soldier.routeTargetZ=destZ;
     }
     while(soldier.personalRoute.length>1&&
       dist(from,soldier.personalRoute[0])<1.3)soldier.personalRoute.shift();
     if(soldier.personalRoute.length){
      const next=soldier.personalRoute[0];
      destX=next.x;destZ=next.z;
     }
    }
   }
   const dx=destX-soldier.x,dz=destZ-soldier.z,d=Math.hypot(dx,dz);
   if(d>.3){const move=Math.min(Math.max(0,d-(squad.order==='charge'&&!ranged?.85:.3)),role.speed*dt*soldier.pace*(squad.formation==='shield'?.72:1));
    let nextX=clamp(soldier.x+dx/d*move*(.82+.18*soldier.stamina),-BOUNDS,BOUNDS);
    let nextZ=clamp(soldier.z+dz/d*move*(.82+.18*soldier.stamina),-BOUNDS,BOUNDS);
    // Player-led ranks cannot cut straight through a physical obstacle even
    // when their personal formation offsets differ from the squad center path.
    if(squad.playerControlled&&state.worldObstacles.length){
     const from={x:soldier.x,z:soldier.z};
     if(!routeSegmentClear(state,from,{x:nextX,z:nextZ},.55)){
      if(routeSegmentClear(state,from,{x:nextX,z:soldier.z},.55))nextZ=soldier.z;
      else if(routeSegmentClear(state,from,{x:soldier.x,z:nextZ},.55))nextX=soldier.x;
      else {nextX=soldier.x;nextZ=soldier.z;}
     }
    }
    soldier.stalledTicks=(Math.hypot(nextX-soldier.x,nextZ-soldier.z)<.002&&d>2)?
     (soldier.stalledTicks||0)+1:0;
    if(soldier.stalledTicks>18){soldier.routeComputedAt=-Infinity;
     soldier.personalRoute=[];soldier.stalledTicks=0;}
    soldier.x=nextX;soldier.z=nextZ;
   }
   const enemy=nearestEnemy(state,soldier,role.range,
    squad.targetSquadId);
   // Individual turns are eased rather than every head instantly snapping
   // to the exact same heading as the rest of the formation.
   const nearbyPlayer=soldier.team!==state.playerTeam&&state.playerActive&&
    ((soldier.id+state.seed)%4===0)&&dist(soldier,state.playerPosition)<role.range;
   const turnToPlayer=nearbyPlayer&&(!enemy||
    dist(soldier,state.playerPosition)<dist(soldier,enemy)*.72);
   const defensiveThreat=(personal==='guard'||personal==='evade')&&closeThreat;
   // Explicit player-facing orders govern the rank unless a danger is truly
   // close; archers should not silently swivel toward distant targets.
   const orderedFacing=squad.playerControlled&&squad.lockedFacing!=null&&
    (!nearFoe||dist(soldier,nearFoe)>11);
   const desiredFacing=defensiveThreat?
    Math.atan2(closeThreat.x-soldier.x,closeThreat.z-soldier.z):orderedFacing?
    squad.lockedFacing:turnToPlayer?
    Math.atan2(state.playerPosition.x-soldier.x,state.playerPosition.z-soldier.z):enemy?
    Math.atan2(enemy.x-soldier.x,enemy.z-soldier.z):
    d>.3?Math.atan2(dx,dz):squad.facing;
   const turnDelta=Math.atan2(Math.sin(desiredFacing-soldier.facing),
    Math.cos(desiredFacing-soldier.facing));
   const turnStep=dt*(1.8+soldier.discipline*2.4);
   soldier.facing+=clamp(turnDelta,-turnStep,turnStep);
   soldier.attackPose=Math.max(0,soldier.attackPose-dt);
   soldier.hitPose=Math.max(0,soldier.hitPose-dt);
   soldier.reload=Math.max(0,soldier.reload-dt);
   if(soldier.reload>0||(ranged&&squad.fireMode==='hold'))continue;
   if(personal==='guard'&&soldier.guardUntil>state.elapsed)continue;
   if(personal==='return'&&(!enemy||dist(soldier,enemy)>role.range*.8))continue;
   if(ranged&&squad.fireMode==='volley'&&!squad.volleyReady)continue;
   // A blocked line is re-evaluated in short intervals, not every 80ms.
   if(ranged&&soldier.laneRetryUntil>state.elapsed)continue;
   // Enemy soldiers can target the real human commander regardless of his team.
   // Limit simultaneous attention so a musket line isn't an instant kill.
   const playerDist=dist(soldier,state.playerPosition);
   const playerThreat=soldier.team!==state.playerTeam&&state.playerActive&&
    playerDist<role.range&&(!enemy||playerDist<dist(soldier,enemy)*.72)&&
    ((soldier.id+state.seed)%4===0);
   if(!enemy&&!playerThreat)continue;
   const actualTarget=playerThreat?state.playerPosition:enemy;
   // No magical attacks while a body is still turning to face an opponent.
   const targetDistance=Math.max(.01,dist(soldier,actualTarget));
   const aimDot=((actualTarget.x-soldier.x)*Math.sin(soldier.facing)+
    (actualTarget.z-soldier.z)*Math.cos(soldier.facing))/targetDistance;
   if(aimDot<(ranged?.67:.32))continue;
   if(ranged&&((!playerThreat&&rangedBodyBlocked(state,soldier,enemy))||
      (playerThreat&&worldLineBlocked(state,
       {x:soldier.x,y:1.85,z:soldier.z},
       {x:state.playerPosition.x,y:1.85,z:state.playerPosition.z}))||
      (playerThreat&&(friendlyFireLaneBlocked(state,soldier,
       {...state.playerPosition,alive:true})||firstBodyBeforePlayer(state,soldier))))){
    // Don't expend ammunition through the backs of our own troops. A small
    // lateral lane-search lets soldiers eventually find a clear firing lane.
    if(state.elapsed>=soldier.sidestepUntil){
     soldier.sidestepSide=seeded(state.seed,soldier.id,state.tick+71)>.5?1:-1;
     soldier.sidestepUntil=state.elapsed+2.6;
    }
    soldier.laneRetryUntil=state.elapsed+.24+seeded(state.seed,soldier.id,971)*.18;
    continue;
   }
   soldier.reload=role.cooldown*(.88+.26*seeded(state.seed,soldier.id,87))*
    (soldier.counterUntil>state.elapsed&& !ranged?.78:1);
   if(soldier.counterUntil>state.elapsed)soldier.counterUntil=0;
   soldier.stamina=clamp(soldier.stamina-.018,.45,1);
   soldier.attackPose=.3;
   if(playerThreat)strikePlayer(state,soldier,role);
   else strike(state,soldier,enemy,role);
  }
  // Acknowledgement reflects actual troop locations, never just a button click.
  if(state.tick%3===0)updateCommandStatus(state);
  // No indexed data escapes this tick; arrow/raycast handlers read live poses.
  state._spatialIndex=null;
  // Progress every flying arrow, including incoming fire against the player.
  advanceProjectiles(state,dt);
  for(const s of state.squads)if(s.volleyReady&&state.elapsed>=s.volleyWindowUntil)
   s.volleyReady=false;
  const blue=state.squads.filter(s=>s.team==='blue').reduce((a,s)=>a+s.alive,0);
  const red=state.squads.filter(s=>s.team==='red').reduce((a,s)=>a+s.alive,0);
  if(!blue||!red)state.winner=blue>red?'blue':red>blue?'red':'draw';
 }
 function step(state,dt){
  if(state.winner||!Number.isFinite(dt)||dt<=0)return;
  state.accumulator=Math.min(.35,state.accumulator+dt);
  while(state.accumulator>=.08&&!state.winner){oneTick(state,.08);state.accumulator-=.08;}
 }
 function snapshot(state){
  const blue=state.squads.filter(s=>s.team==='blue').reduce((a,s)=>a+s.alive,0);
  const red=state.squads.filter(s=>s.team==='red').reduce((a,s)=>a+s.alive,0);
  const behaviors=state.squads.map(s=>{
   const report={formation:0,engage:0,guard:0,evade:0,return:0,assist:0};
   for(const unit of state.soldiers)if(unit.alive&&unit.squadId===s.id)
    report[unit.microState]=(report[unit.microState]||0)+1;
   return report;
  });
  return {blue,red,winner:state.winner,elapsed:state.elapsed,playerSquadId:state.playerSquadId,
   playerKills:state.playerKills,
   teamPlans:{blue:{...state.teamPlans.blue,intelligence:{...state.teamPlans.blue.intelligence,
     enemyRecords:{...state.teamPlans.blue.intelligence.enemyRecords}},operation:state.teamPlans.blue.operation?{...state.teamPlans.blue.operation}:null,
     support:state.teamPlans.blue.support?{...state.teamPlans.blue.support,post:{...state.teamPlans.blue.support.post}}:null,
     supportHistory:state.teamPlans.blue.supportHistory.map(a=>({...a})),
     communications:{...state.teamPlans.blue.communications,
      pending:state.teamPlans.blue.communications.pending.map(m=>({...m,payload:m.payload?{...m.payload}:null})),
      history:state.teamPlans.blue.communications.history.map(h=>({...h}))},
     assaultHistory:state.teamPlans.blue.assaultHistory.map(a=>({...a})),
     reassignmentHistory:state.teamPlans.blue.reassignmentHistory.map(a=>({...a})),
     counterHistory:state.teamPlans.blue.counterHistory.map(a=>({...a})),
     withdrawal:state.teamPlans.blue.withdrawal?{...state.teamPlans.blue.withdrawal,
      shooterIds:[...state.teamPlans.blue.withdrawal.shooterIds],
      rallies:Object.fromEntries(Object.entries(state.teamPlans.blue.withdrawal.rallies).map(([id,pos])=>[id,{...pos}])),
      rally:{...state.teamPlans.blue.withdrawal.rally}}:null,
     withdrawalHistory:state.teamPlans.blue.withdrawalHistory.map(a=>({...a,shooterIds:a.shooterIds?[...a.shooterIds]:null})),
     defense:state.teamPlans.blue.defense?{...state.teamPlans.blue.defense,
      screenPost:{...state.teamPlans.blue.defense.screenPost},
      secondPost:state.teamPlans.blue.defense.secondPost?{...state.teamPlans.blue.defense.secondPost}:null,
      escortPost:state.teamPlans.blue.defense.escortPost?{...state.teamPlans.blue.defense.escortPost}:null,
      coverage:state.teamPlans.blue.defense.coverage.map(x=>({...x})),
      positions:Object.fromEntries(Object.entries(state.teamPlans.blue.defense.positions)
       .map(([key,pos])=>[key,{...pos}]))}:null},
    red:{...state.teamPlans.red,intelligence:{...state.teamPlans.red.intelligence,
     enemyRecords:{...state.teamPlans.red.intelligence.enemyRecords}},operation:state.teamPlans.red.operation?{...state.teamPlans.red.operation}:null,
     support:state.teamPlans.red.support?{...state.teamPlans.red.support,post:{...state.teamPlans.red.support.post}}:null,
     supportHistory:state.teamPlans.red.supportHistory.map(a=>({...a})),
     communications:{...state.teamPlans.red.communications,
      pending:state.teamPlans.red.communications.pending.map(m=>({...m,payload:m.payload?{...m.payload}:null})),
      history:state.teamPlans.red.communications.history.map(h=>({...h}))},
     assaultHistory:state.teamPlans.red.assaultHistory.map(a=>({...a})),
     reassignmentHistory:state.teamPlans.red.reassignmentHistory.map(a=>({...a})),
     counterHistory:state.teamPlans.red.counterHistory.map(a=>({...a})),
     withdrawal:state.teamPlans.red.withdrawal?{...state.teamPlans.red.withdrawal,
      shooterIds:[...state.teamPlans.red.withdrawal.shooterIds],
      rallies:Object.fromEntries(Object.entries(state.teamPlans.red.withdrawal.rallies).map(([id,pos])=>[id,{...pos}])),
      rally:{...state.teamPlans.red.withdrawal.rally}}:null,
     withdrawalHistory:state.teamPlans.red.withdrawalHistory.map(a=>({...a,shooterIds:a.shooterIds?[...a.shooterIds]:null})),
     defense:state.teamPlans.red.defense?{...state.teamPlans.red.defense,
      screenPost:{...state.teamPlans.red.defense.screenPost},
      secondPost:state.teamPlans.red.defense.secondPost?{...state.teamPlans.red.defense.secondPost}:null,
      escortPost:state.teamPlans.red.defense.escortPost?{...state.teamPlans.red.defense.escortPost}:null,
      coverage:state.teamPlans.red.defense.coverage.map(x=>({...x})),
      positions:Object.fromEntries(Object.entries(state.teamPlans.red.defense.positions)
       .map(([key,pos])=>[key,{...pos}]))}:null}},
   squads:state.squads.map(s=>({id:s.id,name:s.name,type:s.type,team:s.team,
    playerControlled:s.playerControlled,alive:s.alive,total:s.startCount,kills:s.kills,
    order:ORDERS[s.order],formation:FORMATIONS[s.formation].name,
    combatPosture:s.combatPosture||'standard',
    combatPostureName:COMBAT_POSTURES[s.combatPosture||'standard'].name,
    combatPostureChanges:s.combatPostureChanges||0,
    x:s.x,z:s.z,facing:s.facing,spacingScale:s.spacingScale||1,
    frontage:s.frontage,depthScale:s.depthScale||1,
    commandRoute:(s.commandRoute||[]).map(p=>({...p})),
    waypoints:(s.waypoints||[]).map(p=>({...p})),transitMode:!!s.transitMode,
    routeReplans:s.routeReplans||0,
    lockedFacing:s.lockedFacing,commandStatus:s.commandStatus,
    commandIssuedAt:s.commandIssuedAt,commandArrivedAt:s.commandArrivedAt,
    targetX:s.targetX,targetZ:s.targetZ,
    morale:Math.round(s.morale*100),cohesion:Math.round(s.cohesion*100),
    behaviors:behaviors[s.id],
    personality:s.aggression>.74?'Atılgan':s.aggression<.51?'Temkinli':'Dengeli',
    localAdvantage:Math.round((s.localAdvantage||1)*10)/10,
    aiRole:s.aiRole,defenseRole:s.defenseRole,supportSquadId:s.supportSquadId,
    tacticalReason:s.tacticalReason,
    targetSquadId:s.targetSquadId,decisionCount:s.decisionCount,operationRole:s.operationRole,
    aidMissionId:s.aidMissionId,aidReturnPost:s.aidReturnPost?{...s.aidReturnPost}:null,
    counterOutcome:s.counterOutcome,withdrawalReturns:s.withdrawalReturns,
    counterGoAt:s.counterGoAt,counterPreparations:s.counterPreparations,
    fireMode:isRanged(s.type)?FIRE_MODES[s.fireMode]:null}))};
 }
 return {TYPES,TYPE_ORDER,FORMATIONS,COMBAT_POSTURES,ORDERS,FIRE_MODES,DEPLOYMENTS,BOUNDS,
  updateCombatPosture,
  create,issueOrder,setFormation,setFireMode,setPlayerPosition,
  setDestination,appendWaypoint,clearWaypoints,setFacing,clearFacing,setSpacing,setFrontage,setDepthScale,
  setTargetSquad,planSquadRoute,routeSegmentClear,updateCommandStatus,formationOffset,step,snapshot,
  updateTeamPlan,buildOperation,buildSupportPlan,interpositionPoint,negotiateSupport,
  updateWithdrawalPlan,withdrawalGuardPost,finishWithdrawal,
  deliverCommanderSignals,sendCommanderSignal,readEnemyDoctrine,selectEnemySquad,threatToRanged,nearestEnemy,
  damageSoldier,soldierGuard,traceRangedAttack,raycastSoldier,soldierInCone,setPlayerHealth,drainPlayerHits,drainCombatEvents,
  launchArrow,advanceProjectiles,raycastPlayer,tracePlayerMusket,ARROW_SPEED,ARROW_GRAVITY,MAX_ARROWS,
  setWorldObstacles,firstWorldObstacle,worldLineBlocked,rangedBodyBlocked,firstBodyBeforePlayer,
  localAssessment,friendlyFireLaneBlocked,squadCohesionEstimate,
  updatePersonalTactics,incomingMeleeWarning,findSupportOpportunity,
  buildSpatialGrid,nearbySoldiers,distanceManeuver};
});

