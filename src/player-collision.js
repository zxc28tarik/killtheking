/* Kill the King — continuous swept player / castle AABB collision.
 * Pure XZ capsule-footprint solver: no Three.js or gameplay-state dependency.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined' && module.exports)module.exports=api;
 root.ArenaPlayerCollision=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const EPS=1e-7,SKIN=1e-4,STEP_ALLOWANCE=.35;
 function verticalBlocking(c,head,foot){
  return head>c.minY+EPS && foot<c.maxY-STEP_ALLOWANCE;
 }
 function bounds(c,r){
  return {minX:c.minX-r,maxX:c.maxX+r,minZ:c.minZ-r,maxZ:c.maxZ+r};
 }
 function contains(b,x,z){
  return x>b.minX+EPS && x<b.maxX-EPS &&
         z>b.minZ+EPS && z<b.maxZ-EPS;
 }
 function recover(x,z,radius,solids,head,foot){
  let corrected=0;
  // Starting positions can be invalid after old respawns/geometry changes.
  for(let n=0;n<12;n++){
   let best=null;
   for(const c of solids){
    if(!verticalBlocking(c,head,foot))continue;
    const b=bounds(c,radius);
    if(!contains(b,x,z))continue;
    const candidates=[
     {axis:'x',value:b.minX-SKIN,amount:x-b.minX+SKIN},
     {axis:'x',value:b.maxX+SKIN,amount:b.maxX-x+SKIN},
     {axis:'z',value:b.minZ-SKIN,amount:z-b.minZ+SKIN},
     {axis:'z',value:b.maxZ+SKIN,amount:b.maxZ-z+SKIN}
    ];
    candidates.sort((a,b)=>a.amount-b.amount);
    if(!best||candidates[0].amount<best.amount)best=candidates[0];
   }
   if(!best)break;
   if(best.axis==='x')x=best.value;else z=best.value;
   corrected++;
  }
  return {x,z,corrected};
 }
 // Swept Minkowski AABB: intersect the WHOLE travel segment, not its endpoint.
 function firstImpact(x,z,dx,dz,radius,solids,head,foot){
  let best=null;
  for(const c of solids){
   if(!verticalBlocking(c,head,foot))continue;
   const b=bounds(c,radius);
   if(contains(b,x,z))continue;
   let txIn=-Infinity,txOut=Infinity,tzIn=-Infinity,tzOut=Infinity;
   if(Math.abs(dx)<EPS){
    if(x<=b.minX||x>=b.maxX)continue;
   }else{
    const t1=(b.minX-x)/dx,t2=(b.maxX-x)/dx;
    txIn=Math.min(t1,t2);txOut=Math.max(t1,t2);
   }
   if(Math.abs(dz)<EPS){
    if(z<=b.minZ||z>=b.maxZ)continue;
   }else{
    const t1=(b.minZ-z)/dz,t2=(b.maxZ-z)/dz;
    tzIn=Math.min(t1,t2);tzOut=Math.max(t1,t2);
   }
   const enter=Math.max(txIn,tzIn),leave=Math.min(txOut,tzOut);
   if(enter< -EPS||enter>1+EPS||leave<enter||leave<0)continue;
   const hitX=txIn>=tzIn-EPS,hitZ=tzIn>=txIn-EPS;
   const t=Math.max(0,enter);
   if(!best||t<best.t)best={t,hitX,hitZ};
  }
  return best;
 }
 function move({from,velocity,dt,radius,height,colliders}){
  if(!from||!velocity||!Number.isFinite(radius)||radius<=0||
   !Number.isFinite(height)||height<=0||!Number.isFinite(dt)||dt<0||
   !Number.isFinite(velocity.x)||!Number.isFinite(velocity.z)||
   !Number.isFinite(from.x)||!Number.isFinite(from.y)||!Number.isFinite(from.z))
   throw new Error('Invalid player sweep');
  const solids=colliders||[],head=from.y,foot=head-height;
  const start=recover(from.x,from.z,radius,solids,head,foot);
  let x=start.x,z=start.z,dx=velocity.x*dt,dz=velocity.z*dt;
  let hitX=false,hitZ=false;
  // Sweep / slide / re-sweep. Tangential velocity survives wall impacts.
  for(let i=0;i<4;i++){
   if(Math.hypot(dx,dz)<EPS)break;
   const hit=firstImpact(x,z,dx,dz,radius,solids,head,foot);
   if(!hit){x+=dx;z+=dz;break;}
   const t=Math.max(0,hit.t-SKIN/Math.max(EPS,Math.hypot(dx,dz)));
   x+=dx*t;z+=dz*t;
   dx*=1-t;dz*=1-t;
   if(hit.hitX){dx=0;hitX=true;}
   if(hit.hitZ){dz=0;hitZ=true;}
  }
  return {x,z,hitX,hitZ,recovered:start.corrected};
 }
 function overlaps(point,radius,height,solids){
  for(const c of solids){
   if(!verticalBlocking(c,point.y,point.y-height))continue;
   if(contains(bounds(c,radius),point.x,point.z))return true;
  }
  return false;
 }
 return {move,overlaps,verticalBlocking};
});
