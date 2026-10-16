/* Procedural motion layers for existing Krunker 1600 character rigs.
 * Does not control position, damage, target selection or geometry. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaCharacterMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TAU=Math.PI*2;
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const smooth=p=>p*p*(3-2*p);
 function createState(initialPhase=0){
  return {phase:Number.isFinite(initialPhase)?initialPhase:0,weight:0};
 }
 function update(state,dt,signals){
  const delta=Number.isFinite(dt)?clamp(dt,0,.05):0;
  const distance=Number.isFinite(signals.travel)?clamp(signals.travel,0,3):0;
  // Gait is distance-driven: blocked bots cannot run in place.
  state.phase=(state.phase+distance*2.6)%TAU;
  const desired=delta>0?clamp(distance/(delta*6),0,1):0;
  state.weight+= (desired-state.weight)*(1-Math.exp(-delta*12));
  state.weight=clamp(state.weight,0,1);
  const step=Math.sin(state.phase),w=state.weight;
  const windup=clamp(signals.windup||0,0,.36)/.36;
  const strike=clamp(signals.strike||0,0,.25);
  const attackProgress=strike>0?1-strike/.25:0;
  const guarding=!!signals.guard;
  const stagger=clamp(signals.stagger||0,0,.72)/.72;
  const impact=clamp(signals.hit||0,0,.38)/.38;
  let leftLeg=step*w*.62,rightLeg=-step*w*.62;
  let leftArm=-step*w*.34,rightArm=-Math.PI/3+step*w*.10;
  let torsoX=w*.06,torsoZ=Math.cos(state.phase)*w*.035;
  let headX=-w*.04,capeX=.15+w*(.22+Math.abs(step)*.1);
  if(guarding)leftArm=-1.25;
  else if(signals.role==='knight')leftArm=-.40-step*w*.08;
  if(windup>0){
   const p=smooth(1-windup);
   rightArm=-1.10-p*1.05;torsoX-=.06*p;
  }else if(strike>0){
   const swing=Math.sin(Math.PI*clamp(attackProgress*.88,0,1));
   rightArm=-2.15+swing*2.15;
   torsoZ+=(signals.role==='pikeman'?.05:.09)*swing;
  }
  if(impact>0){
   const recoil=Math.sin(Math.PI*impact);
   torsoX-=.12*recoil;headX+=.12*recoil;
  }
  if(stagger>0){
   const frozen=Math.sin((1-stagger)*Math.PI);
   rightArm=-.75+frozen*.45;
   leftArm=guarding?leftArm:-.3;
   torsoX+=.20*frozen;
   leftLeg*=.35;rightLeg*=.35;
  }
  return {leftLeg,rightLeg,leftArm,rightArm,torsoX,torsoZ,headX,capeX,locomotionWeight:w};
 }
 function deathPose(progress,fallDirection=1){
  const p=smooth(clamp(progress,0,1));
  return {leftLeg:.48*p,rightLeg:-.26*p,leftArm:-.65*p,
    rightArm:-1.05+.80*p,torsoX:-.2*p,torsoZ:fallDirection*.10*p,
    headX:.20*p,capeX:.15};
 }
 return {createState,update,deathPose};
});
