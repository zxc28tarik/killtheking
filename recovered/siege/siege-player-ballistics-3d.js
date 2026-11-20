/* Kill the King S3D2c — player ranged 3D castle collision and arrow flight.
 * Pinned true G5.4 soldier IDs/HP remain authoritative in combat bridge.
 * This independent siege-only solver reads LIVE native soldier poses,
 * S1 castle boxes/open gate, never edits native G5.4 combat state itself.
 * Musket = instant 3D ray; bow = 70m/s physical segments/gravity 22m/s².
 * IMPORTANT: this is PLAYER ranged combat; G5.4 bot AI remains 2D.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiege3DBallistics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const RADIUS=.8,LOW=.20,HIGH=3.55,ARROW_SPEED=70,
   ARROW_GRAVITY=22,ARROW_LIFE=3.3,ARROW_LIMIT=48;
 const valid=n=>typeof n==='number'&&Number.isFinite(n);
 const finitePoint=p=>p&&['x','y','z'].every(k=>valid(p[k]));
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 function unit(v){
   if(!finitePoint(v))throw Error('Invalid S3D2c 3D aim');
   const m=Math.hypot(v.x,v.y,v.z);
   if(m<1e-6)throw Error('Zero S3D2c 3D aim');
   return {x:v.x/m,y:v.y/m,z:v.z/m};
 }
 function cylinderRay(origin,d,maxDistance,target){
   // Original native cylinder radius and anatomy. S3D2c additionally
   // shifts the entire real body by the native soldier's S3C2 siegeY.
   const offY=target.siegeY??0;
   if(!valid(offY))throw Error('Invalid G5.4 siege soldier height');
   const px=origin.x-target.x,pz=origin.z-target.z;
   const a=d.x*d.x+d.z*d.z;
   let low=0,high=maxDistance;
   if(a<1e-12){
     if(px*px+pz*pz>RADIUS*RADIUS)return null;
   }else{
     const b=2*(px*d.x+pz*d.z),c=px*px+pz*pz-RADIUS*RADIUS;
     const discr=b*b-4*a*c;
     if(discr<0)return null;
     const root=Math.sqrt(discr);
     low=(-b-root)/(2*a);high=(-b+root)/(2*a);
     if(high<0||low>maxDistance)return null;
   }
   let enter=Math.max(0,low),exit=Math.min(high,maxDistance);
   if(Math.abs(d.y)>1e-9){
     const lo=(offY+LOW-origin.y)/d.y,hi=(offY+HIGH-origin.y)/d.y;
     enter=Math.max(enter,Math.min(lo,hi));
     exit=Math.min(exit,Math.max(lo,hi));
   }else if(origin.y<offY+LOW||origin.y>offY+HIGH)return null;
   if(enter>exit||enter>maxDistance)return null;
   const relativeY=origin.y+enter*d.y-offY;
   const lateral=Math.abs(px*d.z-pz*d.x);
   return {distance:enter,zone:relativeY>2.52?'head':
     relativeY<1.1?'leg':lateral>.55?'arm':'body'};
 }
 function boxRay(origin,d,maxDistance,b){
   const ranges=[
     ['x',b.x-b.w/2,b.x+b.w/2],
     ['y',b.y,b.y+b.h],
     ['z',b.z-b.d/2,b.z+b.d/2]
   ];
   let near=0,far=maxDistance;
   for(const [k,min,max]of ranges){
     if(Math.abs(d[k])<1e-12){
       if(origin[k]<min||origin[k]>max)return null;
       continue;
     }
     let a=(min-origin[k])/d[k],z=(max-origin[k])/d[k];
     if(a>z)[a,z]=[z,a];
     near=Math.max(near,a);far=Math.min(far,z);
     if(near>far)return null;
   }
   return near;
 }
 function trace({state,map,scenario,from,to,team,equipmentCollider=null}={}){
   if(!state||state.soldiers?.length!==140||!map?.spec?.boxes||
      !scenario?.gate||!finitePoint(from)||!finitePoint(to)||
      !['red','blue'].includes(team))
     throw Error('S3D2c requires genuine 140 G5.4 and castle geometry');
   const delta={x:to.x-from.x,y:to.y-from.y,z:to.z-from.z},
     length=Math.hypot(delta.x,delta.y,delta.z);
   if(length<1e-8)return null;
   const d=unit(delta);
   let closest=null,best=length+.000001;
   // A 3D solid roof/wall blocks soldier damage. Walkway decks are thin
   // physical shot stoppers even when traversable for living actors.
   for(const b of map.spec.boxes){
     if(!(b.solid||b.platform)||b.id==='gate-main'&&scenario.gate.open)
       continue;
     const at=boxRay(from,d,length,b);
     if(at!==null&&at<best){
       best=at;closest={kind:'castle',colliderId:b.id,distance:at};
     }
   }
   // Ground is the end of every falling shot; arrows cannot pass below it
   // and later re-emerge to strike a soldier on the far side of a floor.
   if(from.y>=0&&to.y<0){
     const t=(0-from.y)/d.y;
     if(t>=0&&t<best){best=t;closest={kind:'ground',distance:t};}
   }
   for(const soldier of state.soldiers){
     if(!soldier.alive||!valid(soldier.x)||!valid(soldier.z))
       continue;
     const hit=cylinderRay(from,d,length,soldier);
     if(!hit)continue;
     if(hit.distance<.02&&soldier.team===team)continue;
     if(hit.distance<best-.000001){
       best=hit.distance;
       closest={kind:'soldier',soldier,targetId:soldier.id,
         friendly:soldier.team===team,distance:best,zone:hit.zone};
     }
   }
   // AK-05b3 only: a live castle siege machine can be intersected by a
   // physical arrow. Older player and soldier callers omit the collider.
   // Existing castle walls, ground and genuine bodies win first-contact.
   if(equipmentCollider){
     const b=equipmentCollider;
     if(!b.solid||!['x','y','z','w','h','d'].every(k=>valid(b[k]))||
        b.w<=0||b.h<=0||b.d<=0||b.id!=='ak05-ram-body')
       throw Error('Invalid AK-05b3 live siege equipment collider');
     const contact=boxRay(from,d,length,b);
     if(contact!==null&&contact<best-.000001){
       best=contact;closest={kind:'equipment',equipmentId:b.id,distance:contact};
     }
   }
   if(!closest)return null;
   return {...closest,point:{x:from.x+d.x*closest.distance,
     y:from.y+d.y*closest.distance,z:from.z+d.z*closest.distance}};
 }
 function create({map,scene=null,THREE=null}={}){
   if(!map?.spec?.boxes)throw Error('Missing S1 castle map');
   let arrows=[],nextId=1,shotCount=0,impactCount=0,
     elevatedHits=0,wallBlocks=0,equipmentImpacts=0,lastImpact=null,
     equipmentProvider=null;
   function setEquipmentCollider(provider=null){
     if(provider!==null&&typeof provider!=='function')
       throw Error('3D siege equipment requires live collider provider');
     equipmentProvider=provider;
     return !!provider;
   }
   const visuals=new Map();
   const shaft=THREE?new THREE.CylinderGeometry(.025,.025,.64,7):null;
   const featherMat=THREE?new THREE.MeshStandardMaterial({color:0xcda965,roughness:.6}):null;
   const arrowAxis=THREE?new THREE.Vector3(0,1,0):null;
   function showArrow(p){
     if(!THREE||!scene)return;
     const mesh=new THREE.Mesh(shaft,featherMat);
     mesh.name='s3d2c-authentic-player-arrow-'+p.id;
     mesh.frustumCulled=false;
     scene.add(mesh);visuals.set(p.id,mesh);
     positionArrow(p);
   }
   function positionArrow(p){
     const mesh=visuals.get(p.id);
     if(!mesh)return;
     mesh.position.set(p.x,p.y,p.z);
     const motion=new THREE.Vector3(p.vx,p.vy,p.vz);
     if(motion.lengthSq()>1e-8){
       motion.normalize();
       mesh.quaternion.setFromUnitVectors(arrowAxis,motion);
     }
   }
   function hideArrow(p){
     const mesh=visuals.get(p.id);
     if(mesh){mesh.parent?.remove(mesh);visuals.delete(p.id);}
   }
   function musket({state,scenario,from,aim,team,range=100}={}){
     if(!valid(range)||range<=0||range>100)
       throw Error('Invalid siege musket native range');
     const d=unit(aim);
     return trace({state,map,scenario,from,to:{
       x:from.x+d.x*range,y:from.y+d.y*range,
       z:from.z+d.z*range},team});
   }
   function launch({state,scenario,from,aim,team,charge,range=90}={}){
     if(!finitePoint(from)||!valid(charge)||charge<0||charge>1||
        !valid(range)||range<=0||range>90||
        state?.soldiers?.length!==140||!scenario?.gate)
       throw Error('Invalid siege physical player arrow launch');
     if(arrows.length>=ARROW_LIMIT)return null;
     const d=unit(aim);
     const id=nextId++;
     const p={id,team,charge,range,x:from.x,y:from.y,z:from.z,
       vx:d.x*ARROW_SPEED,vy:d.y*ARROW_SPEED,
       vz:d.z*ARROW_SPEED,travel:0,life:0};
     arrows.push(p);shotCount++;showArrow(p);
     return {id,weapon:'bow',x:p.x,y:p.y,z:p.z};
   }
   function advance({state,scenario,dt}={}){
     if(!valid(dt)||dt<0||dt>1||state?.soldiers?.length!==140||
        !scenario?.gate)throw Error('Invalid S3D2c native tick');
     const events=[];
     for(let i=arrows.length-1;i>=0;i--){
       const p=arrows[i];let remaining=dt,done=null;
       while(remaining>1e-8&&!done){
         const h=Math.min(.02,remaining);remaining-=h;
         const from={x:p.x,y:p.y,z:p.z};
         const next={
           x:p.x+p.vx*h,
           y:p.y+p.vy*h-.5*ARROW_GRAVITY*h*h,
           z:p.z+p.vz*h
         };
         const hit=trace({state,map,scenario,from,to:next,team:p.team,
           equipmentCollider:equipmentProvider?equipmentProvider():null});
         const move=Math.hypot(next.x-p.x,next.y-p.y,next.z-p.z);
         p.life+=h;p.travel+=move;
         if(hit){
           done={...hit,weapon:'bow',id:p.id,team:p.team,
             charge:p.charge};
           p.x=hit.point.x;p.y=hit.point.y;p.z=hit.point.z;
         }else{
           p.x=next.x;p.y=next.y;p.z=next.z;
           p.vy-=ARROW_GRAVITY*h;
           if(p.travel>p.range||p.life>=ARROW_LIFE){
             done={kind:'expired',weapon:'bow',id:p.id,team:p.team};
           }
         }
       }
       if(done){
         if(done.kind==='castle'||done.kind==='ground')wallBlocks++;
         if(done.kind==='equipment')equipmentImpacts++;
         if(done.kind==='soldier'&&(done.soldier.siegeY??0)>=1)elevatedHits++;
         impactCount++;lastImpact={kind:done.kind,id:done.id,
           targetId:done.targetId??null,colliderId:done.colliderId??null,
           equipmentId:done.equipmentId??null};
         hideArrow(p);arrows.splice(i,1);events.push(done);
       }else positionArrow(p);
     }
     return events;
   }
   function reset(){
     for(const p of arrows)hideArrow(p);
     arrows=[];nextId=1;shotCount=0;impactCount=0;
     elevatedHits=0;wallBlocks=0;equipmentImpacts=0;lastImpact=null;
   }
   function status(){return Object.freeze({
     exactNative140Soldier3DTargets:true,
     musket3DHitscan:true,bowPhysicalFlight3D:true,
     playerArrowFlightSpeed:ARROW_SPEED,playerArrowGravity:ARROW_GRAVITY,
     airborne3DSoldierHits:true,
     nativeG54DamageAuthorityPreserved:true,
     playerArrowsLaunched:shotCount,
     activePlayerArrows:arrows.length,
     renderedPlayerArrows:visuals.size,
     totalProjectileImpacts:impactCount,
     elevatedSoldierIntersections:elevatedHits,
     castleOrGroundBlocks:wallBlocks,
     authenticPhysicalSiegeEquipmentContacts:equipmentImpacts,
     siegeEquipmentProviderActive:!!equipmentProvider,
     lastImpact,
     nativeG54Bot3DTargetingIntegrated:false
   });}
   return Object.freeze({musket,launch,advance,reset,status,
     setEquipmentCollider});
 }
 return Object.freeze({create,trace,unit,ARROW_SPEED,ARROW_GRAVITY});
});
