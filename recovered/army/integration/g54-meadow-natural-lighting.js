/* MAP2-V18 natural meadow-only lighting treatment.
 * Preserves the existing three [H] atmosphere options and native gameplay.
 * Reusable palette only, no extra draw calls or scene solids.
 */
const KTKMeadowNaturalLighting=(function(){
 'use strict';
 const PRESETS=Object.freeze([
  Object.freeze({name:'warm-daylight',top:'#769bb6',mid:'#b3cbd0',
   horizon:'#dec7a7',fog:0xb2bdb2,density:.00052,
   sun:0xffddab,sunIntensity:1.12,sunPos:[60,95,40],
   hemi:0xd8e9e8,ground:0x657059,hemiIntensity:.76,exposure:.91}),
  Object.freeze({name:'clear-day',top:'#5493c7',mid:'#afd6de',
   horizon:'#dbe2ce',fog:0xb5c9c2,density:.00046,
   sun:0xfff0d5,sunIntensity:1.18,sunPos:[65,112,44],
   hemi:0xe0eff0,ground:0x66785e,hemiIntensity:.80,exposure:.94}),
  Object.freeze({name:'blue-hour',top:'#192c49',mid:'#435c72',
   horizon:'#84909a',fog:0x566b7c,density:.00072,
   sun:0x9ab7df,sunIntensity:.58,sunPos:[-50,72,-36],
   hemi:0x9caac8,ground:0x303b35,hemiIntensity:.47,exposure:1.04})
 ]);
 function apply(THREE,environment,idx){
  const {scene,renderer,sunLight,hemiLight,skyDomeMesh,
   sunDiscMesh,sunHaloMesh,createSkyGradientTexture}=environment||{};
  if(!THREE?.Color||!scene?.fog||!renderer||!sunLight||
     !hemiLight||!skyDomeMesh||!createSkyGradientTexture)
   throw Error('Complete native G5.4 atmosphere required');
  const p=PRESETS[((idx%PRESETS.length)+PRESETS.length)%PRESETS.length];
  const prevTexture=skyDomeMesh.material.map;
  const nextTexture=createSkyGradientTexture(p.top,p.mid,p.horizon);
  skyDomeMesh.material.map=nextTexture;
  skyDomeMesh.material.needsUpdate=true;
  if(prevTexture&&prevTexture!==nextTexture)prevTexture.dispose();
  scene.background.setHex(p.fog);
  scene.fog.color.setHex(p.fog);
  scene.fog.density=p.density;
  sunLight.color.setHex(p.sun);sunLight.intensity=p.sunIntensity;
  sunLight.position.set(...p.sunPos);
  hemiLight.color.setHex(p.hemi);
  hemiLight.groundColor.setHex(p.ground);
  hemiLight.intensity=p.hemiIntensity;
  renderer.toneMappingExposure=p.exposure;
  if(sunDiscMesh&&sunHaloMesh){
   const vector=new THREE.Vector3(...p.sunPos).normalize().multiplyScalar(195);
   sunDiscMesh.position.copy(vector);
   sunHaloMesh.position.copy(vector);
   sunHaloMesh.material.color.setHex(p.sun);
  }
  return {name:p.name,exposure:p.exposure,fogDensity:p.density,
   hemisphere:p.hemiIntensity,sky:p.top};
 }
 return Object.freeze({PRESETS,apply});
})();
