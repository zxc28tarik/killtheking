/* Kill the King S2 — standalone castle exploration / active collider and route
 * contract. Real S2 preview avatar + keyboard uses this, NOT G5.4 soldier AI.
 * UMD / no mutation of original FFA, G5.4, G8.4 or combat tuning.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeTraversal=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const RADIUS=.85,HEIGHT=3.2,SPEED=13.5;
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const pos=p=>p&&finite(p.x)&&finite(p.y)&&finite(p.z);
 const gateState=s=>Boolean(s?.gate?.open);
 function activeColliders(spec,s){
   if(!spec?.boxes||!s?.lanes)throw Error('Siege scene contract missing');
   return spec.boxes.filter(b=>b.solid&&
     (b.id!=='gate-main'||!gateState(s)));
 }
 function circleBox(p,r,b){
   const dx=p.x-Math.max(b.x-b.w/2,Math.min(p.x,b.x+b.w/2));
   const dz=p.z-Math.max(b.z-b.d/2,Math.min(p.z,b.z+b.d/2));
   return dx*dx+dz*dz<r*r-1e-9;
 }
 function overlaps(p,spec,s,r=RADIUS,h=HEIGHT){
   if(!pos(p)||!finite(r)||r<=0||!finite(h)||h<=0)
     throw Error('Invalid siege avatar collision parameters');
   return activeColliders(spec,s).some(b=>
     p.y<b.y+b.h-1e-6&&p.y+h>b.y+1e-6&&
     circleBox(p,r,b));
 }
 function bounded(p,spec,r=RADIUS){
   const b=spec.bounds;
   return {x:Math.max(b.minX+r,Math.min(b.maxX-r,p.x)),
     z:Math.max(b.minZ+r,Math.min(b.maxZ-r,p.z))};
 }
 function move(p,v,dt,spec,s,r=RADIUS,h=HEIGHT){
   if(!pos(p)||!v||!finite(v.x)||!finite(v.z)||
      !finite(dt)||dt<0||dt>.25)throw Error('Invalid siege step');
   // Substep <= radius * 0.45 avoids tunneling at high speed; axis-separated
   // motion permits sliding along real walls, corners and closed gate.
   let x=p.x,z=p.z;
   const dx=v.x*dt,dz=v.z*dt;
   const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/(.44*r)));
   let blockedX=false,blockedZ=false;
   const colliders=activeColliders(spec,s);
   function hit(a,b){
     const at={x:a,y:p.y,z:b};
     return colliders.some(box=>
       at.y<box.y+box.h-1e-6&&at.y+h>box.y+1e-6&&
       circleBox(at,r,box));
   }
   for(let i=0;i<n;i++){
     const targetX=Math.max(spec.bounds.minX+r,
       Math.min(spec.bounds.maxX-r,x+dx/n));
     if(!hit(targetX,z))x=targetX;
     else {
       blockedX=true;
       // fractional progress to contact, never step inside
       let lo=0,hi=1;
       for(let j=0;j<18;j++){
         const mid=(lo+hi)/2;
         if(hit(x+(targetX-x)*mid,z))hi=mid;else lo=mid;
       }
       x+=((targetX-x)*lo);
     }
     const targetZ=Math.max(spec.bounds.minZ+r,
       Math.min(spec.bounds.maxZ-r,z+dz/n));
     if(!hit(x,targetZ))z=targetZ;
     else {
       blockedZ=true;
       let lo=0,hi=1;
       for(let j=0;j<18;j++){
         const mid=(lo+hi)/2;
         if(hit(x,z+(targetZ-z)*mid))hi=mid;else lo=mid;
       }
       z+=((targetZ-z)*lo);
     }
   }
   return {x,y:p.y,z,blockedX,blockedZ};
 }
 function routeNodes(spec,s){
   // Approximate safe *objective waypoints*; S3 AI must separately
   // validate 3D soldier A* and avoid near-collider cover.
   const n={
     outer:{point:[0,-96],neighbors:['front','westOuter','eastOuter']},
     front:{point:[0,-54],neighbors:['outer']},
     gateIn:{point:[0,-29],neighbors:['court']},
     westOuter:{point:[-59,-9],neighbors:['outer']},
     westInside:{point:[-43,-9],neighbors:['court']},
     eastOuter:{point:[59,-9],neighbors:['outer']},
     eastInside:{point:[43,-9],neighbors:['court']},
     court:{point:[0,-9],neighbors:['gateIn','westInside','eastInside','keep']},
     keep:{point:[0,29],neighbors:['court']}
   };
   if(s.lanes.gate){n.front.neighbors.push('gateIn');
     n.gateIn.neighbors.push('front');}
   if(s.lanes.west){n.westOuter.neighbors.push('westInside');
     n.westInside.neighbors.push('westOuter');}
   if(s.lanes.east){n.eastOuter.neighbors.push('eastInside');
     n.eastInside.neighbors.push('eastOuter');}
   return n;
 }
 function route(from,to,spec,s){
   const nodes=routeNodes(spec,s);
   if(!nodes[from]||!nodes[to])throw Error('Unknown siege navigation node');
   const queue=[[from]],seen=new Set([from]);
   while(queue.length){
     const p=queue.shift(),at=p.at(-1);
     if(at===to)return p.map(id=>({id,point:nodes[id].point.slice()}));
     for(const next of nodes[at].neighbors)
       if(!seen.has(next)){seen.add(next);queue.push([...p,next]);}
   }
   return null;
 }
 const climbPlan=Object.freeze({
   west:Object.freeze([[ -59,-9,0],[-59,-9,15.2],
     [-44,-9,15.2],[-44,-9,0]]),
   east:Object.freeze([[59,-9,0],[59,-9,15.2],
     [44,-9,15.2],[44,-9,0]])
 });
 function beginClimb(p,side,spec,s){
   if(!pos(p)||!['west','east'].includes(side))
     throw Error('Invalid siege climb request');
   if(!s?.lanes?.[side])return null;
   const waypoints=climbPlan[side];
   const start=waypoints[0];
   if(Math.hypot(p.x-start[0],p.z-start[1])>4.5||
     Math.abs(p.y)>1.4)return null;
   const to=waypoints.map(v=>({x:v[0],y:v[2],z:v[1]}));
   // Test the path before any player state mutation.
   for(const wp of to)if(overlaps(wp,spec,s))
     throw Error('Climb would intersect a solid castle obstacle');
   return {side,waypoints:to,index:0,position:{...p},
     speed:12,done:false};
 }
 function stepClimb(c,dt,spec,s){
   if(!c||c.done||!c.waypoints||!finite(dt)||dt<0||dt>.25)
     throw Error('Invalid active siege climb');
   if(!s.lanes[c.side])throw Error('Climb lane unexpectedly closed');
   let remaining=c.speed*dt;
   while(remaining>1e-8&&!c.done){
     const next=c.waypoints[c.index];
     const dx=next.x-c.position.x,dy=next.y-c.position.y,
       dz=next.z-c.position.z;
     const d=Math.hypot(dx,dy,dz);
     if(d<=1e-6){
       c.index++;
       if(c.index>=c.waypoints.length)c.done=true;
       continue;
     }
     const step=Math.min(d,remaining);
     c.position={x:c.position.x+dx/d*step,
       y:c.position.y+dy/d*step,
       z:c.position.z+dz/d*step};
     remaining-=step;
     if(step>=d-1e-6){
       c.index++;
       if(c.index>=c.waypoints.length)c.done=true;
     }
     if(overlaps(c.position,spec,s))
       throw Error('Siege climb intersected an original castle wall');
   }
   return {position:{...c.position},done:c.done,side:c.side,
     progress:c.index/c.waypoints.length};
 }
 function spawn(p,spec,s){
   if(!pos(p)||overlaps(p,spec,s))throw Error('Unsafe siege player spawn');
   return {x:p.x,y:p.y,z:p.z};
 }
 return Object.freeze({
   RADIUS,HEIGHT,SPEED,activeColliders,overlaps,move,route,
   routeNodes,beginClimb,stepClimb,spawn,bounded
 });
});
