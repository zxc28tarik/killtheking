/* Kill the King — readable, class-specific FFA bot combat decisions.
 * Pure decision helpers. Never modifies health, physics or FFA ownership.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaBotOffense=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ATTACKS=Object.freeze({
  knight:Object.freeze({cooldown:1.25,variance:.55,windup:.34,aimArc:1.05}),
  pikeman:Object.freeze({cooldown:1.35,variance:.60,windup:.40,aimArc:.88}),
  archer:Object.freeze({cooldown:1.70,variance:.65,windup:.28,aimArc:.36}),
  musket:Object.freeze({cooldown:1.95,variance:.75,windup:.36,aimArc:.30})
 });
 function profile(role){
  const p=ATTACKS[role];
  if(!p)throw Error('Unsupported bot role');
  return p;
 }
 function nextCooldown(role,roll=.5){
  const p=profile(role);
  const r=Number.isFinite(roll)?Math.max(0,Math.min(1,roll)):.5;
  return p.cooldown+p.variance*r;
 }
 function windup(role){return profile(role).windup;}
 function facing(role,yaw,source,target){
  const p=profile(role);
  if(!Number.isFinite(yaw)||!source||!target||
   !Number.isFinite(source.x)||!Number.isFinite(source.z)||
   !Number.isFinite(target.x)||!Number.isFinite(target.z))return false;
  const dx=target.x-source.x,dz=target.z-source.z;
  if(Math.hypot(dx,dz)<.05)return true;
  const desired=Math.atan2(dx,dz);
  const angle=Math.atan2(Math.sin(yaw-desired),Math.cos(yaw-desired));
  return Math.abs(angle)<=p.aimArc;
 }
 function playerMeleeThreat({classIdx,attackTime,distance,visible}){
  return (classIdx===0||classIdx===1)&&Number.isFinite(attackTime)&&
   attackTime>.12&&Number.isFinite(distance)&&distance<7.5&&visible===true;
 }
 return {ATTACKS,profile,nextCooldown,windup,facing,playerMeleeThreat};
});
