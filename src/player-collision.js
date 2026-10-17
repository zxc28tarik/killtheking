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
 // Ramp side faces have abrupt elevation; real entrances rise gradually.
 // Probe the full player's footprint to avoid half-entering a tall ramp.
 function terrainHeight(x,z,radius,groundAt){
  return Math.max(groundAt(x,z),groundAt(x-radius,z),groundAt(x+radius,z),
   groundAt(x,z-radius),groundAt(x,z+radius));
 }
 function terrainTransition({from,to,radius,height,groundAt}){
  if(typeof groundAt!=='function')throw new Error('groundAt required');
  const length=Math.hypot(to.x-from.x,to.z-from.z);
  const probes=Math.max(1,Math.ceil(length/.35));
  const foot=from.y-height;
  let last={x:from.x,z:from.z};
  let previous=terrainHeight(from.x,from.z,radius,groundAt);
  for(let i=1;i<=probes;i++){
   const t=i/probes;
   const point={x:from.x+(to.x-from.x)*t,z:from.z+(to.z-from.z)*t};
   const next=terrainHeight(point.x,point.z,radius,groundAt);
   // Discontinuous RISE from below is a wall, not a climbable slope.
   // A fighter jumping legitimately ABOVE the platform may land on it.
   if(next-previous>.65&&foot<next-.65)return {...last,blocked:true};
   last=point;previous=next;
  }
  return {x:to.x,z:to.z,blocked:false};
 }
 function limitRampEntry({from,to,radius,height,groundAt}){
  const primary=terrainTransition({from,to,radius,height,groundAt});
  if(!primary.blocked)return {...primary,hitX:false,hitZ:false};
  const onlyX=terrainTransition({from,to:{x:to.x,z:from.z},radius,height,groundAt});
  const onlyZ=terrainTransition({from,to:{x:from.x,z:to.z},radius,height,groundAt});
  if(!onlyX.blocked&&onlyZ.blocked)return {x:onlyX.x,z:from.z,hitX:false,hitZ:true};
  if(onlyX.blocked&&!onlyZ.blocked)return {x:from.x,z:onlyZ.z,hitX:true,hitZ:false};
  if(!onlyX.blocked&&!onlyZ.blocked){
   const dx=Math.abs(to.x-from.x),dz=Math.abs(to.z-from.z);
   return dx>=dz?{x:onlyX.x,z:from.z,hitX:false,hitZ:true}:
    {x:from.x,z:onlyZ.z,hitX:true,hitZ:false};
  }
  return {x:primary.x,z:primary.z,hitX:true,hitZ:true};
 }
 function overlaps(point,radius,height,solids){
  for(const c of solids){
   if(!verticalBlocking(c,point.y,point.y-height))continue;
   if(contains(bounds(c,radius),point.x,point.z))return true;
  }
  return false;
 }
 return {move,overlaps,verticalBlocking,limitRampEntry,terrainTransition};
});
