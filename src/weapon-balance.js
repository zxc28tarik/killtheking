/* Kill the King — shared 2026-10 weapon balance, player and AI.
 * 100 HP is the reference baseline; armor, shields and maxHP act separately.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaWeaponBalance=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const RULES=Object.freeze({
  sword:Object.freeze({body:20,head:30,limb:16}),
  spear:Object.freeze({body:35,head:52.5,limb:28}),
  dagger:Object.freeze({body:10,head:15,limb:8}),
  musket:Object.freeze({body:90,head:135,limb:80}),
  bow:Object.freeze({minBody:14,halfBody:23,upperBody:25,maxBody:35})
 });
 const SHOT_INTERVAL=Object.freeze({bow:4,musket:15});
 // One second after shooting for recovery; the next shot's remaining
 // three seconds are spent drawing, not waiting with an idle bow.
 // A quick draw cannot fire during its first two seconds. Holding for
 // three seconds reaches full power. Total cadence stays <= 15/min.
 const BOW_RECOVERY_SECONDS=1;
 const BOW_MIN_DRAW_SECONDS=2;
 const BOW_DRAW_SECONDS=3;
 function bowStrength(elapsed){
  return Number.isFinite(elapsed)?Math.min(1,Math.max(0,elapsed)/BOW_DRAW_SECONDS):0;
 }
 function bowCanDraw(lastShot,now){
  return !Number.isFinite(lastShot)||now-lastShot>=BOW_RECOVERY_SECONDS-1e-9;
 }
 function bowCanRelease(lastShot,now,drawElapsed){
  return Number.isFinite(drawElapsed)&&drawElapsed>=BOW_MIN_DRAW_SECONDS-1e-9&&
    ready(lastShot,now,'bow');
 }
 function bowReleaseWait(lastShot,now,drawElapsed){
  const drawRemaining=Math.max(0,BOW_MIN_DRAW_SECONDS-(Number.isFinite(drawElapsed)?drawElapsed:0));
  const cadenceRemaining=Number.isFinite(lastShot)?Math.max(0,SHOT_INTERVAL.bow-(now-lastShot)):0;
  return Math.max(drawRemaining,cadenceRemaining);
 }
 const weaponForRole=role=>role==='knight'?'sword':role==='pikeman'?'spear':role==='archer'?'bow':'musket';
 function bowBody(charge){
  const c=Number.isFinite(charge)?Math.min(1,Math.max(0,charge)):0;
  const anchors=[[0,14],[.2,14],[.5,23],[.6,25],[1,35]];
  for(let i=1;i<anchors.length;i++){
   const [hi,dhi]=anchors[i], [lo,dlo]=anchors[i-1];
   if(c<=hi)return dhi===dlo?dlo:dlo+(dhi-dlo)*(c-lo)/(hi-lo);
  }
  return 35;
 }
 function damage(weapon,zone='body',charge=.5){
  if(!RULES[weapon])throw Error('Unknown weapon: '+weapon);
  if(!['body','head','arm','leg'].includes(zone))throw Error('Unknown hit zone');
  if(weapon==='bow'){
   const base=bowBody(charge);
   return Math.round(base*(zone==='head'?1.5:zone==='arm'||zone==='leg'?.8:1)*100)/100;
  }
  const key=zone==='arm'||zone==='leg'?'limb':zone;
  return RULES[weapon][key];
 }
 function zoneFromMesh(mesh,hitY,baseY){
  if(mesh&&mesh.userData&&mesh.userData.hitZone)return mesh.userData.hitZone;
  if(mesh&&mesh.userData&&mesh.userData.isHead)return 'head';
  const dy=Number.isFinite(hitY)&&Number.isFinite(baseY)?hitY-baseY:1.5;
  if(dy>=2.36)return 'head';
  if(dy<=1.04)return 'leg';
  return 'body';
 }
 function zoneFromAim(aimY,baseY){
  const y=Number.isFinite(aimY)&&Number.isFinite(baseY)?aimY-baseY:1.5;
  return y>=2.36?'head':y<=1.04?'leg':'body';
 }
 function ready(lastShot,now,kind){
  const interval=SHOT_INTERVAL[kind];
  if(!interval)throw Error('Unknown ranged weapon');
  return !Number.isFinite(lastShot)||now-lastShot>=interval-1e-9;
 }
 // Physical, bounded approximation of the established character silhouette.
 // The shot lands at its actual offset aim point. A miss cannot damage an actor.
 // No world-collider or shield decisions are made here: runtime checks both.
 function aimedShot(role,origin,targetBase,rollHorizontal=.5,rollVertical=.5,height=3){
  if(!['archer','musket'].includes(role)||!origin||!targetBase)
   throw Error('Invalid ranged aim');
  const dX=targetBase.x-origin.x,dZ=targetBase.z-origin.z;
  const distance=Math.hypot(dX,dZ);
  if(!Number.isFinite(distance)||distance<.01) return {hit:false,zone:null,point:null};
  const horizontalSpread=(role==='musket'?.44:.38)+distance*(role==='musket'?.026:.021);
  const verticalSpread=role==='musket'?1.17:1.0;
  const clamp01=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):.5;
  const lateral=(clamp01(rollHorizontal)*2-1)*horizontalSpread;
  const targetHeight=Number.isFinite(height)?Math.max(1.1,Math.min(3.2,height)):3;
  const yLocal=Math.min(targetHeight-.2,1.65)+(clamp01(rollVertical)*2-1)*verticalSpread;
  const radius=.72;
  const hit=Math.abs(lateral)<=radius&&yLocal>=.32&&yLocal<=targetHeight;
  const point={x:targetBase.x-dZ/distance*lateral,
    y:targetBase.y+yLocal,z:targetBase.z+dX/distance*lateral};
  const zone=!hit?null:yLocal>=2.36?'head':yLocal<=1.04?'leg':
   Math.abs(lateral)>.52?'arm':'body';
  return {hit,zone,point};
 }
 function botAimZone(role,roll){
  const r=Number.isFinite(roll)?Math.min(.999,Math.max(0,roll)):.5;
  // Non-omniscient: most AI shots target body; occasional imperfect limbs/head.
  return r<.05?'head':r<.14?'arm':r<.22?'leg':'body';
 }
 return {RULES,SHOT_INTERVAL,BOW_RECOVERY_SECONDS,BOW_MIN_DRAW_SECONDS,
 BOW_DRAW_SECONDS,bowStrength,bowCanDraw,bowCanRelease,bowReleaseWait,
 weaponForRole,bowBody,damage,zoneFromMesh,zoneFromAim,ready,botAimZone,aimedShot};
});
