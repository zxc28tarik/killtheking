/* A5 — 20x playable grassland area, same modest obstacle footprint.
 * Multiply surface area, NOT width by twenty (which would be 400x area).
 * Flat large field: keep bounded nav cell count, original visual scale of props,
 * and spawn a reasonable distance apart for seven-player offline combat.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaMeadowLayout=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const AREA_MULTIPLIER=20;
 const LINEAR_SCALE=Math.sqrt(AREA_MULTIPLIER);
 const SPAWN_SCALE=2.8;
 const HALF=49*LINEAR_SCALE;
 const NAV=Object.freeze({min:-51*LINEAR_SCALE,max:51*LINEAR_SCALE,
  step:1.5*LINEAR_SCALE,upperEdge:1000,upperLevel:0});
 const scaledSpawn=items=>Object.freeze(items.map(([x,y,z])=>
  Object.freeze([x*SPAWN_SCALE,y,z*SPAWN_SCALE])));
 const COURTYARD=scaledSpawn([
  [-28,0,-24],[28,0,-24],[-28,0,24],[28,0,24],
  [-32,0,0],[32,0,0],[-18,0,-32],[18,0,32]
 ]);
 const RANGED=scaledSpawn([
  [-36,0,-21],[36,0,-21],[-36,0,21],[36,0,21],
  [-24,0,-34],[24,0,-34],[-36,0,0],[36,0,0]
 ]);
 const boxes=[];
 function box(x,y,z,w,h,d,material,solid=true){
  boxes.push(Object.freeze({x,y,z,w,h,d,material,solid}));
 }
 const S=LINEAR_SCALE;
 // Boundary fences physically surround the full, much larger map.
 box(0,1.2,-HALF,99*S,2.4,1.5,'wood');
 box(0,1.2,HALF,99*S,2.4,1.5,'wood');
 box(-HALF,1.2,0,1.5,2.4,97.5*S,'wood');
 box(HALF,1.2,0,1.5,2.4,97.5*S,'wood');
 for(const x of [-42,-21,0,21,42]){
  for(const z of [-49,49])box(x*S,2,z*S,1.3,4,1.3,'wood',false);
 }
 for(const z of [-36,-12,12,36]){
  for(const x of [-49,49])box(x*S,2,z*S,1.3,4,1.3,'wood',false);
 }
 // Actual trees and waist-height cover remain realistically small.
 // Their POSITIONS spread to meadow margins, leaving >=259x259 open center.
 for(const x of [-40,40]){
  for(const z of [-40,40]){
   box(x*S,2.35,z*S,1.4,4.7,1.4,'wood');
   box(x*S,5.6,z*S,6.4,3.6,6.4,'leaves',false);
   box(x*S,8,z*S,4.2,2.8,4.2,'leaves',false);
  }
 }
 for(const x of [-37,37]){
  for(const z of [-14,14]){
   box(x*S,.9,z*S,3.4,1.8,3,'stone');
   box(x*S,2,z*S,3.7,.3,3.3,'wood',false);
  }
 }
 // Decorative grass/details occupy edges; true central fighting area stays clear.
 for(const z of [-43,43])box(0,.045,z*S,68*S,.09,3,'path',false);
 for(let i=0;i<160;i++){
  const x=(-45+(i*37%91))*S,z=(-44+(i*47%89))*S;
  if(Math.hypot(x,z)<29*S)continue;
  box(x,.22,z,.24,.44,.24,'leaves',false);
 }
 const FROZEN=Object.freeze(boxes);
 function spec(){
  return {half:HALF,areaMultiplier:AREA_MULTIPLIER,
   linearScale:LINEAR_SCALE,spawnScale:SPAWN_SCALE,
   navigation:{...NAV},boxes:FROZEN.map(b=>({...b})),
   courtyardSpawns:COURTYARD.map(p=>p.slice()),
   rangedSpawns:RANGED.map(p=>p.slice())};
 }
 return {HALF,NAV,AREA_MULTIPLIER,LINEAR_SCALE,SPAWN_SCALE,spec};
});
