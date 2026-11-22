/* S3D2a — Arena-style jump, Shift/C slide and slide-hop for the castle.
 * 140 G5.4 soldier state, combat and all other modes stay untouched.
 * Adapter is not a byte-for-byte reuse of the original Arena physics.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegePlayerLocomotion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const GRAVITY=30,JUMP_SPEED=12.6,HOP_MAX=6.5,CROUCH_HEIGHT=2.1;
 const valid=n=>typeof n==='number'&&Number.isFinite(n);
 const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
 function create({inputContract=null}={}){
  if(inputContract&&['movementAxes','wantsSlide','wantsJump'].some(
     k=>typeof inputContract[k]!=='function'))
    throw Error('AK-03b requires valid G5.4 player intent contract');
  let s;
  function reset(p={x:0,y:0,z:0}){
   if(!p||!['x','y','z'].every(k=>valid(p[k])))throw Error('Invalid locomotion spawn');
   s={vx:0,vy:0,vz:0,grounded:p.y<=0.00001,sliding:false,
     hop:0,jumpHeld:false,jumps:0,blockedX:false,blockedZ:false};
   return snapshot();
  }
  function snapshot(){
   if(!s)throw Error('No movement state');
   return Object.freeze({active:true,grounded:s.grounded,airborne:!s.grounded,
     sliding:s.sliding,jumpCount:s.jumps,hop:s.hop,
     vx:s.vx,vy:s.vy,vz:s.vz,collisionX:s.blockedX,
     collisionZ:s.blockedZ,realCastleSweptCollider:true,
     fullArenaPhysicsShared:false,
     sharedNativeFieldCastleInputIntent:!!inputContract});
  }
  function step({position,yaw,keys={},dt,spec,scenario,traversal,enabled=true}={}){
   if(!s||!position||!['x','y','z'].every(k=>valid(position[k]))||
      !valid(yaw)||!valid(dt)||dt<0||dt>0.05000001||
      !spec||!scenario||!traversal?.move||!traversal?.overlaps)
     throw Error('Invalid S3D2 castle movement step');
   if(!enabled){
     reset(position);
     return {position:{...position},blockedX:false,blockedZ:false,
       movement:snapshot(),status:'Oyuncu hareket edemiyor'};
   }
   if(dt===0)return {position:{...position},blockedX:false,blockedZ:false,
     movement:snapshot(),status:'Hazır'};
   const f=Number(!!keys.KeyW)-Number(!!keys.KeyS);
   const r=Number(!!keys.KeyD)-Number(!!keys.KeyA);
   const magnitude=Math.hypot(f,r);
   const axes=inputContract?inputContract.movementAxes(keys):{
     forward:magnitude?f/magnitude:0,side:magnitude?r/magnitude:0,
     active:magnitude>0
   };
   const forward=axes.forward,side=axes.side;
   const wantsSlide=inputContract?inputContract.wantsSlide(keys):
     !!(keys.ShiftLeft||keys.ShiftRight||keys.KeyC);
   const cannotStand=s.sliding&&!wantsSlide&&traversal.overlaps(
     position,spec,scenario,traversal.RADIUS,traversal.HEIGHT);
   s.sliding=wantsSlide||cannotStand;
   const height=s.sliding?CROUCH_HEIGHT:traversal.HEIGHT;
   const jumpHeld=inputContract?inputContract.wantsJump(keys):!!keys.Space;
   const jump=jumpHeld&&!s.jumpHeld&&s.grounded;
   s.jumpHeld=jumpHeld;
   if(jump){
     s.vy=JUMP_SPEED;s.grounded=false;s.jumps++;
     if(magnitude)s.hop=clamp(s.hop+(s.sliding?1.45:.85),0,HOP_MAX);
   }else if(s.grounded&&!keys.Space){
     s.hop=clamp(s.hop-dt*(s.sliding?1.8:6.5),0,HOP_MAX);
   }
   const speed=traversal.SPEED*(1+s.hop*.135);
   const accel=s.grounded?(s.sliding?8:14):5.2;
   const weight=clamp(accel*dt,0,1);
   s.vx+=((Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed-s.vx)*weight;
   s.vz+=((Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed-s.vz)*weight;
   const moved=traversal.move(position,{x:s.vx,z:s.vz},dt,
     spec,scenario,traversal.RADIUS,height);
   if(moved.blockedX)s.vx=0;
   if(moved.blockedZ)s.vz=0;
   s.blockedX=moved.blockedX;s.blockedZ=moved.blockedZ;
   const oldY=Math.max(0,position.y);
   const vyNext=s.vy-GRAVITY*dt;
   const dY=s.vy*dt-.5*GRAVITY*dt*dt;
   const target=Math.max(0,oldY+dY);
   const n=Math.max(1,Math.ceil(Math.abs(target-oldY)/.24));
   let y=oldY,blocked=false;
   for(let i=1;i<=n;i++){
     const next=oldY+(target-oldY)*i/n;
     if(traversal.overlaps({x:moved.x,y:next,z:moved.z},
       spec,scenario,traversal.RADIUS,height)){blocked=true;break;}
     y=next;
   }
   if(blocked){s.vy=0;s.grounded=dY<0;}
   else if(y<=.00001&&vyNext<=0){
     y=0;s.vy=0;s.grounded=true;
   }else{s.vy=vyNext;s.grounded=false;}
   const after={x:moved.x,y,z:moved.z};
   if(traversal.overlaps(after,spec,scenario,traversal.RADIUS,height))
     throw Error('S3D2 castle collider penetration');
   return {position:after,blockedX:moved.blockedX,
     blockedZ:moved.blockedZ,movement:snapshot(),
     status:blocked?'Yükseklik engeli':s.grounded?
       (s.sliding?'Kayıyor':magnitude?'Yürüyor':'Hazır'):'Zıplıyor'};
  }
  reset();
  return Object.freeze({reset,step,snapshot});
 }
 return Object.freeze({create,GRAVITY,JUMP_SPEED,HOP_MAX,CROUCH_HEIGHT});
});
if(typeof window!=='undefined'){
 (function(){
  'use strict';
  const preview=globalThis.ktkSiegePreviewAdapter;
  const physics=globalThis.KTKSiegePlayerLocomotion;
  if(!preview||!physics)throw Error('Missing S3D2 preview/player bridge');
  const motion=physics.create({inputContract:globalThis.KTKSharedG54PlayerInput});
  preview.registerMovement({step:v=>motion.step(v),
    reset:p=>motion.reset(p),snapshot:()=>motion.snapshot()});
  globalThis.ktkSiegeMovementStatus=()=>motion.snapshot();
 })();
}
