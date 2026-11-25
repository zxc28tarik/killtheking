/**
 * AK32 — genuine player-accessible outer curtain, native siege map ONLY.
 * Four 0->9m graded ramps on inner walls, physical high-level bridges and
 * collision/projectile-active crenels. No teleport, invisible jump, lighting,
 * extra soldiers, or modification to the three-map arena's original ramps.
 *
 * The original G5.4 ground-plane AI cannot patrol these elevated routes yet.
 * These routes are authentic for the FPS player and use ArenaPlayerCollision.
 */
const KTKSiegeWallAccessV32=(()=>{
 'use strict';
 const RISE=9, LENGTH=26, WIDTH=5.5, X=106.25;
 const entrances=Object.freeze([
  Object.freeze({name:'west-front',x:-X,minZ:48,maxZ:48+LENGTH}),
  Object.freeze({name:'east-front',x:X,minZ:48,maxZ:48+LENGTH}),
  Object.freeze({name:'west-rear',x:-X,minZ:123,maxZ:123+LENGTH}),
  Object.freeze({name:'east-rear',x:X,minZ:123,maxZ:123+LENGTH})
 ]);
 const rampSpec=Object.freeze(entrances.map(e=>Object.freeze({
  minX:e.x-WIDTH/2,maxX:e.x+WIDTH/2,
  minZ:e.minZ,maxZ:e.maxZ,startY:0,endY:RISE,dir:'N',
  ak32Name:e.name
 })));
 function heightAt(r,x,z){
  if(x<r.minX||x>r.maxX||z<r.minZ||z>r.maxZ)return null;
  return r.startY+Math.max(0,Math.min(1,
   (r.maxZ-z)/(r.maxZ-r.minZ)))*(r.endY-r.startY);
 }
 function validate(){
  if(rampSpec.length!==4||rampSpec.some(r=>
   r.endY!==9||r.startY!==0||r.dir!=='N'||r.maxZ-r.minZ<24))
   throw Error('AK32 four walkable ramps required');
  for(const r of rampSpec){
   const midX=(r.minX+r.maxX)/2;
   if(heightAt(r,midX,r.maxZ)!==0||heightAt(r,midX,r.minZ)!==RISE)
    throw Error('AK32 ramp incorrect slope '+r.ak32Name);
   for(let i=0;i<104;i++){
    const a=r.maxZ-(i/104)*LENGTH;
    const b=r.maxZ-((i+1)/104)*LENGTH;
    if(Math.abs(heightAt(r,midX,a)-heightAt(r,midX,b))>.65)
     throw Error('AK32 impossible vertical step '+r.ak32Name);
   }
  }
  return true;
 }
 validate();
 function install(THREE,parts,makeMesh,makeBox,mats){
  if(!THREE?.Group||!parts||!makeMesh||!makeBox||!mats?.stone)
   throw Error('AK32 needs the native third-map scene and geometry helpers');
  const root=new THREE.Group();
  root.name='AK32_TRUE_WALKABLE_OUTER_CURTAIN_AND_FOUR_RAMPS';
  parts.add(root);
  const wallBoxes=[],solidMeshes=[],rampVisualMeshes=[];
  function physical(x,y,z,w,h,d,mat=mats.stone,name=''){
   const mesh=makeMesh(root,x,y,z,w,h,d,mat);
   mesh.name='AK32_REAL_'+name;
   solidMeshes.push(mesh);
   wallBoxes.push(makeBox(x,y,z,w,h,d));
   return mesh;
  }
  function rampSurface(x,y,z,w,h,d){
   const mesh=makeMesh(root,x,y,z,w,h,d,mats.stone);
   mesh.name='AK32_RAMP_VISUAL_SHOT_COVER';
   rampVisualMeshes.push(mesh);
  }
  for(const e of entrances){
   const side=Math.sign(e.x);
   // Single segment per step is rendered as a solid sloped support. The
   // original player physics uses continuous interpolated ramp heights;
   // these steps are NOT wall colliders and cannot trap the player.
   const count=20, dz=LENGTH/count;
   for(let i=0;i<count;i++){
    const z=e.maxZ-(i+.5)*dz;
    const t=(i+.5)/count;
    const top=RISE*t;
    rampSurface(e.x,top/2,z,WIDTH,top,dz+.06);
   }
   // Elevated seamless bridge joins the high ramp end to the ACTUAL
   // existing y=9 outer wall top, without filling its ground-level lane.
   // Width extends outside the curtain's inner face at x=109.5.
   const bridgeX=side*109.4;
   physical(bridgeX,8.86,e.minZ-.8,12.4,.28,8.0,
    mats.stone,e.name+'-continuous-high-landing');
   // Elevated shoulder-guards: restrict shooting angles only where true
   // stone exists, while preserving open entry from the interior ramp.
   const approachZ=e.minZ+3.0;
   physical(side*100.7,9.7,approachZ,1.2,1.4,4.0,
    mats.stone,e.name+'-inner-landing-guard');
  }
  // Genuine raised exterior teeth, with uninterrupted 4m+ firing gaps.
  // NEVER place them along the real tower bridge entry on the south wall:
  // only z>=-25 side curtains are treated here.
  let outerMerlons=0;
  for(const side of [-1,1]){
   for(let z=-22;z<=166;z+=12){
    // Keep the preexisting tower volumes and the wall-ramp crossings clear.
    if(entrances.some(e=>Math.sign(e.x)===side&&Math.abs(e.minZ-z)<6))continue;
    physical(side*114.55,10.1,z,1.5,2.2,4.2,
     mats.stone,(side<0?'west':'east')+'-firing-merlon-'+z);
    outerMerlons++;
   }
  }
  return Object.freeze({
   root,ramps:rampSpec.map(r=>({...r})),
   wallBoxes,solidMeshes,rampVisualMeshes,
   fourContinuousWalkableRamps:true,
   slopeLength:LENGTH,wallHeight:RISE,
   bridgeCount:entrances.length,merlons:outerMerlons,
   realAabbCount:wallBoxes.length,
   highCoverAndRampShotMeshes:[...solidMeshes,...rampVisualMeshes],
   originalG54HighLevelAI:false,
   noSceneOrColorChanges:true
  });
 }
 return Object.freeze({heightAt,validate,entrances,rampSpec,install});
})();