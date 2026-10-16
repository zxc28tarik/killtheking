/* Kill the King — rendered-model-derived melee direction and reach calibration.
 * Camera-local tip/grip positions drive the arc/thrust. Viewmodel units are
 * cosmetic, so the original game-class reach remains the maximum hit distance.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaModelWeaponContact=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const EPS=1e-7;
 function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
 function proxy({kind,reach,origin,forward,right,grip,tip}){
  if(!['sword','spear'].includes(kind)||!(reach>0)||!Number.isFinite(reach))return null;
  if(!origin||!forward||!right||!tip||!grip)return null;
  const deltaX=tip.x-grip.x;
  // Physical rotation of the blade relative to its grip determines the angle.
  const spread=kind==='sword'?clamp(deltaX/1.2,-0.42,0.42):clamp(deltaX/2.5,-0.09,0.09);
  // Existing spear tip starts 2.59 viewmodel units from the camera; visible
  // animation moves it 0.72 units at its thrust peak.
  const thrust=clamp((-tip.z-2.59)/0.72,0,1);
  const swordForward=clamp(-tip.z-0.70,0,1.15);
  const distance=reach*(kind==='spear'?0.35+0.65*thrust:0.72+0.24*swordForward/1.15);
  const point={
   x:origin.x+forward.x*distance+right.x*spread*reach,
   y:origin.y+forward.y*distance+right.y*spread*reach,
   z:origin.z+forward.z*distance+right.z*spread*reach
  };
  return {point,distance,spread,renderedTip:{x:tip.x,y:tip.y,z:tip.z}};
 }
 // Actor and model motion are bridged in world coordinates, and the returned
 // cast MUST supply the first contact among solid world, barrels and enemies.
 function advance(swing,dt,model,castSegment){
  if(!swing||swing.finished||swing.resolved||!(dt>0)||!Number.isFinite(dt))return null;
  if(typeof castSegment!=='function')throw Error('castSegment required');
  const prior=swing.elapsed/swing.duration;
  swing.elapsed=Math.min(swing.duration,swing.elapsed+dt);
  const after=swing.elapsed/swing.duration, start=0.13,end=0.89;
  if(after<start||prior>end){
   if(swing.elapsed>=swing.duration-EPS)swing.finished=true;
   return null;
  }
  if(!model||!model.point||!model.origin)return null;
  const head={x:model.origin.x,y:model.origin.y,z:model.origin.z};
  const tip={x:model.point.x,y:model.point.y,z:model.point.z};
  const accept=hit=>{
   if(!hit||(hit.kind!=='bot'&&hit.kind!=='barrel'))return null;
   const obj=hit.kind==='bot'?hit.bot:hit.barrel;
   const key=hit.kind+':'+(obj&&obj.id);
   if(swing.hitKeys.has(key))return null;
   swing.hitKeys.add(key);swing.resolved=true;
   return hit;
  };
  let wallBlocked=false;
  if(swing.previousModelTip){
   const bridge=castSegment(swing.previousModelTip,tip);
   if(bridge&&bridge.kind==='world')wallBlocked=true;
   if(!wallBlocked){const result=accept(bridge);if(result)return result;}
  }
  swing.previousModelTip=tip;
  if(!wallBlocked){const result=accept(castSegment(head,tip));if(result)return result;}
  if(swing.elapsed>=swing.duration-EPS)swing.finished=true;
  return null;
 }
 return {proxy,advance};
});
