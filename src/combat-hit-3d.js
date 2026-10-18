/* Kill the King — 3D impact resolution for existing battle meshes.
 * Rendered bot geometry is authoritative; player uses simple anatomically split
 * world-space hit volumes because the FPS character mesh is normally hidden.
 * Damage, teams, AI aggression and navigation are handled elsewhere.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaCombatHit3D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ZONES=new Set(['head','body','arm','leg']);
 function direction(THREE,from,to){
  const a=new THREE.Vector3(from.x,from.y,from.z);
  const b=new THREE.Vector3(to.x,to.y,to.z);
  const delta=b.sub(a),len=delta.length();
  if(!Number.isFinite(len)||len<.001)return null;
  return {origin:a,dir:delta.multiplyScalar(1/len),length:len};
 }
 function resolveBot(THREE,from,to,group){
  const ray=direction(THREE,from,to);
  if(!ray||!group||typeof group.traverse!=='function')return null;
  if(typeof group.updateMatrixWorld==='function')group.updateMatrixWorld(true);
  const parts=[];
  group.traverse(obj=>{
   if(obj.isMesh&&obj.visible!==false&&obj.userData&&ZONES.has(obj.userData.hitZone))
    parts.push(obj);
  });
  if(!parts.length)return null;
  const cast=new THREE.Raycaster(ray.origin,ray.dir,0.001,ray.length+1.3);
  const hits=cast.intersectObjects(parts,false);
  const h=hits[0];
  return h?{zone:h.object.userData.hitZone,point:h.point.clone(),distance:h.distance}:null;
 }
 function resolvePlayer(THREE,from,to,player){
  const ray=direction(THREE,from,to);
  if(!ray||!player||!player.pos)return null;
  const base=player.pos.y-(Number.isFinite(player.currentHeight)?player.currentHeight:2.35);
  const h=player.isSliding?1.9:3.0;
  // These static volumes approximate the first-person invisible body but are
  // physically intersected by the shot ray (not chosen at random).
  const areas=[
   ['head',-.34,.34,.78,1,-.36,.36],
   ['arm',-.78,-.48,.38,.77,-.34,.34],
   ['arm',.48,.78,.38,.77,-.34,.34],
   ['body',-.48,.48,.38,.78,-.38,.38],
   ['leg',-.36,-.015,.08,.38,-.34,.34],
   ['leg',.015,.36,.08,.38,-.34,.34]
  ];
  const world=new THREE.Ray(ray.origin,ray.dir);
  const maxDist=ray.length+1.25;
  let best=null;
  for(const [zone,x1,x2,y1,y2,z1,z2] of areas){
   const box=new THREE.Box3(
    new THREE.Vector3(player.pos.x+x1,base+y1*h,player.pos.z+z1),
    new THREE.Vector3(player.pos.x+x2,base+y2*h,player.pos.z+z2));
   const point=world.intersectBox(box,new THREE.Vector3());
   if(!point)continue;
   const dist=point.distanceTo(ray.origin);
   if(dist<.001||dist>maxDist)continue;
   if(!best||dist<best.distance)best={zone,point,distance:dist};
  }
  return best;
 }
 return {resolveBot,resolvePlayer};
});
