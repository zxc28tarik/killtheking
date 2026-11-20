/* Kill the King AK-03b — shared G5.4 player input / camera aim adapter.
 * Canonical intent: field-style pointer-locked FPS/TPS mouse aim, WASD,
 * Space jump, Shift/C slide and original weapon/castle commander hotkeys.
 * Does not replace historical G5.4 field physics, the castle swept
 * collision controller, or any native soldier/gameplay authority.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSharedG54PlayerInput=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const CAMERA_YAW_PER_PIXEL=.006;
 const CAMERA_PITCH_PER_PIXEL=.004;
 const MAX_PITCH=.7;
 const RANGED_AIM_SCALE=.58;
 const valid=n=>typeof n==='number'&&Number.isFinite(n);
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const KEYBOARD=Object.freeze({
   forward:'KeyW',backward:'KeyS',left:'KeyA',right:'KeyD',
   jump:'Space',slide:'KeyC',slideAlt:'ShiftLeft',
   slideAltRight:'ShiftRight',climb:'KeyE',attack:'KeyF',
   weapon:['Digit1','Digit2','Digit3','Digit4'],tacticalMap:'KeyP'
 });
 function movementAxes(keys={}){
   if(!keys||typeof keys!=='object')throw Error('AK-03b missing real input keys');
   const f=Number(!!keys[KEYBOARD.forward])-Number(!!keys[KEYBOARD.backward]);
   const r=Number(!!keys[KEYBOARD.right])-Number(!!keys[KEYBOARD.left]);
   const magnitude=Math.hypot(f,r);
   return Object.freeze({forward:magnitude?f/magnitude:0,
     side:magnitude?r/magnitude:0,active:magnitude>0});
 }
 function wantsSlide(keys={}){
   return !!(keys.KeyC||keys.ShiftLeft||keys.ShiftRight);
 }
 function wantsJump(keys={}){
   return !!keys.Space;
 }
 function turn({yaw,pitch,dx,dy}={}){
   if(![yaw,pitch,dx,dy].every(valid))
     throw Error('AK-03b invalid native look delta');
   const nextYaw=yaw+clamp(dx,-1600,1600)*CAMERA_YAW_PER_PIXEL;
   const nextPitch=clamp(pitch-clamp(dy,-1600,1600)*
     CAMERA_PITCH_PER_PIXEL,-MAX_PITCH,MAX_PITCH);
   return Object.freeze({yaw:nextYaw,pitch:nextPitch});
 }
 function aimedDirection({yaw,pitch,melee=false}={}){
   if(!valid(yaw)||!valid(pitch))
     throw Error('AK-03b invalid weapon/camera direction');
   const rise=melee?0:Math.tan(clamp(pitch,-MAX_PITCH,MAX_PITCH)*RANGED_AIM_SCALE);
   const n=Math.hypot(1,rise);
   return Object.freeze({x:Math.sin(yaw)/n,
     y:rise/n,z:Math.cos(yaw)/n});
 }
 function aimSlope(pitch){
   if(!valid(pitch))throw Error('AK-03b invalid camera pitch');
   return Math.tan(clamp(pitch,-MAX_PITCH,MAX_PITCH)*RANGED_AIM_SCALE);
 }
 function canLook({view='orbit',modal=false,playerCanMove=true}={}){
   return (view==='fps'||view==='tps')&&!modal&&playerCanMove===true;
 }
 function snapshot(){
   return Object.freeze({
     contract:'AK03B_SHARED_G54_HUMAN_INPUT_AIM_INTENT',
     originalFieldNativeG54SoldierSimulationUnchanged:true,
     real3DCastleSweptCollisionStillSeparate:true,
     pointerLockAimForFPSAndTPS:true,
     dragAimFallback:true,
     movementKeys:'WASD',
     jumpKey:'Space',slideKeys:'ShiftLeft/ShiftRight/KeyC',
     originalFieldCameraRuntimeSourceReplaced:false,
     castleMouseLookSensitivity:{yaw:CAMERA_YAW_PER_PIXEL,
       pitch:CAMERA_PITCH_PER_PIXEL},
     commonWeaponCameraPitchSlope:true,
     maxPitch:MAX_PITCH,
     spectatorNeverCapturesMouse:true
   });
 }
 return Object.freeze({KEYBOARD,CAMERA_YAW_PER_PIXEL,
   CAMERA_PITCH_PER_PIXEL,MAX_PITCH,RANGED_AIM_SCALE,
   movementAxes,wantsJump,wantsSlide,turn,aimedDirection,aimSlope,
   canLook,snapshot});
});
