/**
 * AK31 - Authentic siege interior / ground-level wall stations.
 * Only native third-map physics. The original G5.4 actors, 600 HP gate,
 * three siege machines, and 70v70 force balance remain authoritative.
 * All named blocks are both physical sweep colliders and projectile cover.
 * Gaps between blocks are REAL openings, not painted-on arrow slits.
 * Wall-top garrisons are intentionally NOT claimed: G5.4 is ground-plane.
 */
const KTKSiegeInteriorV31=(()=>{
 'use strict';
 const blocks=[
  // Gate-to-bailey flank: fighting pockets facing the two lateral approaches.
  ['west-gate-flank','inner-wall',-68,-21,12,3,3.2],
  ['east-gate-flank','inner-wall',68,-21,12,3,3.2],
  ['west-wall-post-a','wall-post',-97,-14,6,3,2.8],
  ['west-wall-post-b','wall-post',-97,14,6,3,2.8],
  ['west-wall-post-c','wall-post',-97,36,6,3,2.8],
  ['east-wall-post-a','wall-post',97,-14,6,3,2.8],
  ['east-wall-post-b','wall-post',97,14,6,3,2.8],
  ['east-wall-post-c','wall-post',97,36,6,3,2.8],
  // The original z=42 inner keep has a true 16m postern, not an extra gate.
  ['postern-west-cheek','postern-flank',-20,49,4,3,3.3],
  ['postern-east-cheek','postern-flank',20,49,4,3,3.3],
  // Widely spaced wall-foot casemates: 5m+ real sight / movement gaps.
  ['west-wall-pocket-1','wall-post',-98,96,6,3,2.7],
  ['west-wall-pocket-2','wall-post',-98,106,6,3,2.7],
  ['west-wall-pocket-3','wall-post',-98,116,6,3,2.7],
  ['east-wall-pocket-1','wall-post',98,96,6,3,2.7],
  ['east-wall-pocket-2','wall-post',98,106,6,3,2.7],
  ['east-wall-pocket-3','wall-post',98,116,6,3,2.7],
  // First rear-bailey exchange: real anti-rush traverses and side detours.
  ['west-bailey-traverse','crossfire',-43,104,22,4,3.6],
  ['east-bailey-traverse','crossfire',43,104,22,4,3.6],
  ['west-counter-battery','crossfire',-27,127,13,3.5,2.9],
  ['east-counter-battery','crossfire',27,127,13,3.5,2.9],
  // Second alternating line protects the rear redoubt without a sealed door.
  ['west-rear-traverse','rear-defense',-49,149,22,4,3.8],
  ['east-rear-traverse','rear-defense',49,149,22,4,3.8],
  ['west-last-stand','rear-defense',-18,170,9,3.5,3.0],
  ['east-last-stand','rear-defense',18,170,9,3.5,3.0],
  ['west-wall-pocket-4','wall-post',-98,148,6,3,2.7],
  ['west-wall-pocket-5','wall-post',-98,164,6,3,2.7],
  ['east-wall-pocket-4','wall-post',98,148,6,3,2.7],
  ['east-wall-pocket-5','wall-post',98,164,6,3,2.7],
  // Two THREE-WALLED open guardrooms. Entrance faces south: attackers can
  // push inside; retreat or defending fire must use actual openings.
  ['west-guardroom-west','guardroom',-93,159,3,15,4.0],
  ['west-guardroom-east','guardroom',-73,159,3,15,4.0],
  ['west-guardroom-rear','guardroom',-83,167,20,3,4.0],
  ['east-guardroom-west','guardroom',73,159,3,15,4.0],
  ['east-guardroom-east','guardroom',93,159,3,15,4.0],
  ['east-guardroom-rear','guardroom',83,167,20,3,4.0]
 ];
 const features=Object.freeze(blocks.map(([name,role,x,z,w,d,h])=>Object.freeze({name,role,x,z,w,d,h})));
 const reserved=Object.freeze([
  {name:'gate-and-ram',x:0,z:-62,r:10,minZ:-92,maxZ:-32},
  {name:'siege-tower',x:28,z:-60,r:7,minZ:-82,maxZ:-32},
  {name:'catapult',x:-22,z:-69,r:7,minZ:-90,maxZ:-50},
  {name:'west-breach',x:-19,z:-5,r:4,minZ:-29,maxZ:26},
  {name:'east-breach',x:19,z:-5,r:4,minZ:-29,maxZ:26},
  {name:'original-postern',x:0,z:61,r:10,minZ:42,maxZ:88},
  {name:'rear-archer-reserve',x:8,z:84,r:10,minZ:71,maxZ:95},
  {name:'rear-center-push',x:0,z:143,r:10,minZ:91,maxZ:176}
 ]);
 function touches(a,b,pad=0){
  return a.x-a.w/2 < b.x+b.w/2+pad &&
   a.x+a.w/2 > b.x-b.w/2-pad &&
   a.z-a.d/2 < b.z+b.d/2+pad &&
   a.z+a.d/2 > b.z-b.d/2-pad;
 }
 function pathClear(points,radius=1){
  return Array.isArray(points)&&points.length>0&&points.every(p=>
   features.every(f=>
    Math.abs(f.x-p.x)>f.w/2+radius ||
    Math.abs(f.z-p.z)>f.d/2+radius));
 }
 function validate(){
  const seen=new Set();
  for(const f of features){
   if(seen.has(f.name)||f.w<=0||f.d<=0||f.h<=0)
    throw Error('AK31 invalid fortification '+f.name);
   seen.add(f.name);
   if(Math.abs(f.x)+f.w/2>=109||f.z+f.d/2>=181||
      f.z-f.d/2<=-41)throw Error('AK31 exterior wall overlap '+f.name);
   for(const zone of reserved){
    // Real protected corridors; no feature may intrude into the defender /
    // attacker staging regions and the original breach and reserve routes.
    const minX=zone.x-zone.r,maxX=zone.x+zone.r;
    if(f.x+f.w/2>minX&&f.x-f.w/2<maxX&&
       f.z+f.d/2>zone.minZ&&f.z-f.d/2<zone.maxZ)
     throw Error('AK31 blocks '+zone.name+': '+f.name);
   }
  }
  if(!pathClear([{x:0,z:-37},{x:0,z:-19},{x:0,z:0},
   {x:-19,z:10},{x:19,z:10},{x:0,z:49},{x:0,z:62},
   {x:0,z:83},{x:0,z:105},{x:0,z:130},{x:0,z:170}],2))
   throw Error('AK31 live assault lane obstructed');
  return true;
 }
 validate();
 function install(THREE,parts,makeMesh,makeBox,mats){
  if(!THREE?.Group||!parts||!makeMesh||!makeBox||!mats?.stone)
   throw Error('AK31 needs the original native siege scene');
  const root=new THREE.Group();
  root.name='AK31_REAL_SIEGE_WALL_FIGHTING_POSTS_AND_OPEN_BAILEY';
  parts.add(root);
  const wallBoxes=[],solidMeshes=[];
  let posts=0,guardrooms=0;
  for(const f of features){
   // Use the existing physically light, native stone material. No lights,
   // bloom, color grades, texture atlases or per-frame new objects.
   const m=makeMesh(root,f.x,f.h/2,f.z,f.w,f.h,f.d,mats.stone);
   m.name='AK31_PHYSICAL_'+f.name;
   solidMeshes.push(m);
   wallBoxes.push(makeBox(f.x,f.h/2,f.z,f.w,f.h,f.d));
   if(f.role==='wall-post')posts++;
   if(f.role==='guardroom')guardrooms++;
  }
  return Object.freeze({
   root,wallBoxes,solidMeshes,features,
   realWallStations:posts,openGuardroomWalls:guardrooms,
   realCollisionBoxes:wallBoxes.length,
   physicalProjectileCover:true,openingIsRealGeometry:true,
   noNewActors:true,noAdditionalLights:true
  });
 }
 return Object.freeze({features,reserved,pathClear,validate,install});
})();