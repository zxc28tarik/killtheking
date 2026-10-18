/* A5 — large open grassy square, immutable plan independent of renderer.
 * Same blocky visual language as the original castle, but wider sight lines
 * and a fully clear central fighting area. No random terrain/colliders.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaMeadowLayout=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const HALF=49;
 const NAV=Object.freeze({min:-51,max:51,step:1.5,upperEdge:100,upperLevel:0});
 const COURTYARD=Object.freeze([
  [-28,0,-24],[28,0,-24],[-28,0,24],[28,0,24],
  [-32,0,0],[32,0,0],[-18,0,-32],[18,0,32]
 ]);
 const RANGED=Object.freeze([
  [-36,0,-21],[36,0,-21],[-36,0,21],[36,0,21],
  [-24,0,-34],[24,0,-34],[-36,0,0],[36,0,0]
 ]);
 const boxes=[];
 function box(x,y,z,w,h,d,material,solid=true){
  boxes.push({x,y,z,w,h,d,material,solid});
 }
 // Wide, flat central grass: no building/collider within radius 29.
 // Low fences bound the playable area without tall castle parapets.
 box(0,1.2,-HALF,99,2.4,1.5,'wood');
 box(0,1.2,HALF,99,2.4,1.5,'wood');
 box(-HALF,1.2,0,1.5,2.4,97.5,'wood');
 box(HALF,1.2,0,1.5,2.4,97.5,'wood');
 for(const x of [-42,-21,0,21,42]){
  for(const z of [-HALF,HALF]) box(x,2,z,1.3,4,1.3,'wood',false);
 }
 for(const z of [-36,-12,12,36]){
  for(const x of [-HALF,HALF]) box(x,2,z,1.3,4,1.3,'wood',false);
 }
 // Four timber landmark trees positioned far away from the central melee.
 for(const x of [-40,40]){
  for(const z of [-40,40]){
   box(x,2.35,z,1.4,4.7,1.4,'wood');
   box(x,5.6,z,6.4,3.6,6.4,'leaves',false);
   box(x,8,z,4.2,2.8,4.2,'leaves',false);
  }
 }
 // Shallow waist-height stone/wood cover at the meadow margins only.
 for(const x of [-37,37]){
  for(const z of [-14,14]){
   box(x,.9,z,3.4,1.8,3,'stone');
   box(x,2,z,3.7,.3,3.3,'wood',false);
  }
 }
 // Rustic field markers and patches are decorative, never solid.
 for(const z of [-43,43]){
  box(0,.045,z,68,.09,3,'path',false);
 }
 for(let i=0;i<48;i++){
  const x=-45+(i*17%91),z=-44+(i*29%89);
  if(Math.hypot(x,z)<30)continue;
  box(x,.22,z,.24,.44,.24,'leaves',false);
 }
 const cloned=boxes.map(b=>Object.freeze({...b}));
 function spec(){
  return {half:HALF,navigation:{...NAV},boxes:cloned.map(b=>({...b})),
   courtyardSpawns:COURTYARD.map(p=>p.slice()),
   rangedSpawns:RANGED.map(p=>p.slice())};
 }
 return {HALF,NAV,spec};
});
