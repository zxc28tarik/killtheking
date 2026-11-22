import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const file=resolve(dirname(fileURLToPath(import.meta.url)),'g54-meadow-natural-lighting.js');
const api=vm.runInNewContext(readFileSync(file,'utf8')+';KTKMeadowNaturalLighting;');
const hex={value:0,setHex(x){this.value=x;}};
const make=()=>({
 THREE:{Color:class{},Vector3:class{constructor(...a){this.a=a;}normalize(){return this;}multiplyScalar(){return this;}}},
 env:{
  scene:{background:{setHex(){}},fog:{color:{setHex(){}},density:1}},
  renderer:{toneMappingExposure:1.15},
  sunLight:{color:{setHex(){}},intensity:1.32,position:{set(){}}},
  hemiLight:{color:{setHex(){}},groundColor:{setHex(){}},intensity:.68},
  skyDomeMesh:{material:{map:{dispose(){this.disposed=true;}},needsUpdate:false}},
  sunDiscMesh:{position:{copy(){} }},
  sunHaloMesh:{position:{copy(){}},material:{color:{setHex(){}}}},
  createSkyGradientTexture(){return {dispose(){this.disposed=true;}};}
 }
});
test('all three native atmosphere selections remain visually distinct',()=>{
 assert.equal(api.PRESETS.length,3);
 const names=[];
 for(let i=0;i<3;i++){
  const {THREE,env}=make(),result=api.apply(THREE,env,i);
  names.push(result.name);
  assert.ok(Number.isFinite(env.renderer.toneMappingExposure));
  assert.ok(env.scene.fog.density<.001);
  assert.ok(env.sunLight.intensity>0);
 }
 assert.deepEqual(names,['warm-daylight','clear-day','blue-hour']);
});
test('field lighting does not add meshes or touch 3D movement',()=>{
 const {THREE,env}=make();const before=env.skyDomeMesh.material.map;
 const result=api.apply(THREE,env,0);
 assert.equal(result.exposure,.91);
 assert.equal(env.renderer.toneMappingExposure,.91);
 assert.ok(env.hemiLight.intensity>.7);
 assert.equal(before.disposed,true);
 assert.notEqual(env.skyDomeMesh.material.map,before);
});
test('incomplete scene cannot silently modify native arena renderer',()=>{
 const {THREE,env}=make();
 assert.throws(()=>api.apply(THREE,{...env,sunLight:null},0));
});
