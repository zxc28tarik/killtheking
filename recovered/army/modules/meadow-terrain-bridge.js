/* KTK MAP2-V8 — terrain-aware movement / visibility contract.
 * Opt-in, pure adapter for the historical G5.4 meadow. It does not
 * mutate the original soldiers, 2D combat engine or the live battlefield.
 * All consumers must use consistent 3D heights before enabling in game.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKMeadowTerrainBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 function create({terrain,halfSize,maxSlopeDeg=28,eyeHeight=1.65}={}){
   if(!terrain?.heightAt||!terrain?.normalAt||!finite(halfSize)||
     halfSize<=0||!finite(maxSlopeDeg)||maxSlopeDeg<=0||
     maxSlopeDeg>=89||!finite(eyeHeight)||eyeHeight<=0)
     throw Error('Valid terrain, halfSize and movement parameters required');
   const maxGrade=Math.tan(maxSlopeDeg*Math.PI/180);
   const ground=(x,z)=>terrain.heightAt(x,z,halfSize);
   const at=(x,z,offset=0)=>{
     if(!finite(offset))throw Error('Invalid elevation offset');
     return {x,y:ground(x,z)+offset,z};
   };
   const traversable=(x,z)=>{
     const n=terrain.normalAt(x,z,halfSize);
     return n.y>0&&Math.hypot(n.x,n.z)/n.y<=maxGrade;
   };
   function step(from,to,{maxStepHeight=.6,footRadius=.45}={}){
     if(!from||!to||!finite(from.x)||!finite(from.z)||
       !finite(to.x)||!finite(to.z)||!(maxStepHeight>0)||
       !(footRadius>0))throw Error('Invalid move');
     if(Math.max(Math.abs(to.x),Math.abs(to.z))>=halfSize)
       return {ok:false,reason:'boundary'};
     const length=Math.hypot(to.x-from.x,to.z-from.z);
     const increments=Math.max(1,Math.ceil(length/Math.min(.75,footRadius)));
     let previous=ground(from.x,from.z);
     for(let i=1;i<=increments;i++){
       const x=from.x+(to.x-from.x)*i/increments;
       const z=from.z+(to.z-from.z)*i/increments;
       if(!traversable(x,z))return {ok:false,reason:'slope',x,z};
       const y=ground(x,z);
       if(Math.abs(y-previous)>maxStepHeight)
         return {ok:false,reason:'step',x,z};
       previous=y;
     }
     return {ok:true,position:at(to.x,to.z)};
   }
   function lineOfSight(start,end,{clearance=.08,samplesPerMeter=3}={}){
     if(!start||!end||![start.x,start.y,start.z,end.x,end.y,end.z].every(finite)||
       !finite(clearance)||clearance<0||!finite(samplesPerMeter)||
       samplesPerMeter<=0)throw Error('Invalid 3D sightline');
     const len=Math.hypot(end.x-start.x,end.z-start.z);
     const steps=Math.max(1,Math.ceil(len*samplesPerMeter));
     for(let i=1;i<steps;i++){
       const t=i/steps,x=start.x+(end.x-start.x)*t;
       const z=start.z+(end.z-start.z)*t;
       const y=start.y+(end.y-start.y)*t;
       if(ground(x,z)+clearance>=y)
         return {clear:false,hit:{x,y:ground(x,z),z},fraction:t};
     }
     return {clear:true,hit:null,fraction:1};
   }
   function soldierPose(unit){
     if(!unit||!finite(unit.x)||!finite(unit.z))
       throw Error('Invalid soldier');
     return {feet:at(unit.x,unit.z),eyes:at(unit.x,unit.z,eyeHeight)};
   }
   return Object.freeze({ground,at,traversable,step,lineOfSight,soldierPose,
     halfSize,maxSlopeDeg,eyeHeight});
 }
 return Object.freeze({create});
});
