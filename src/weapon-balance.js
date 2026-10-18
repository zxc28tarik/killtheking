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
 const BOW_DRAW_SECONDS=1.5;
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
 function botAimZone(role,roll){
  const r=Number.isFinite(roll)?Math.min(.999,Math.max(0,roll)):.5;
  // Non-omniscient: most AI shots target body; occasional imperfect limbs/head.
  return r<.05?'head':r<.14?'arm':r<.22?'leg':'body';
 }
 return {RULES,SHOT_INTERVAL,BOW_DRAW_SECONDS,weaponForRole,bowBody,damage,zoneFromMesh,zoneFromAim,ready,botAimZone};
});
