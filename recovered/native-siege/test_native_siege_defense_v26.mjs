/** AK26 real siege architecture: physical gameplay cover, not ornamental walls. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';
import {applyNativeSiegeDefenseV26} from './siege-defense-patch-v26.mjs';
import {applyNativeSiegeExpansionV25} from './siege-expansion-patch-v25.mjs';

const source=readFileSync(new URL('./native-siege-defense-v26.js',import.meta.url),'utf8');
const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const ctx=vm.createContext({console});
new vm.Script(source);vm.runInContext(source,ctx);
const D=vm.runInContext('KTKSiegeFortificationV26',ctx);
const near=(a,b)=>Math.abs(a-b)<.001;

function mockThree(){
 function vec(){return {x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}}}
 class Group{constructor(){this.children=[];this.position=vec()}add(...v){this.children.push(...v)}}
 class Geo{constructor(...values){this.values=values}}
 class Material{constructor(p){Object.assign(this,p)}}
 class Mesh{constructor(g,m){this.geometry=g;this.material=m;this.position=vec();
  this.rotation={x:0,y:0,z:0}}}
 return {Group,Mesh,BoxGeometry:Geo,ConeGeometry:Geo,MeshStandardMaterial:Material};
}
function installed(){
 const THREE=mockThree(),parent=new THREE.Group();
 const box=(x,y,z,w,h,d)=>({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,
  minZ:z-d/2,maxZ:z+d/2});
 const mesh=(group,x,y,z,w,h,d,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);group.add(m);return m};
 const v=D.install(THREE,parent,mesh,box,{stone:{},wood:{}});
 return {v,parent};
}
test('AK26 uses FIVE defensive lines and at least nineteen REAL colliders, each with a matching first-contact world mesh',()=>{
 assert.equal(D.validate(),true);
 const {v,parent}=installed();
 assert.equal(v.defensiveLayers,5);
 assert.equal(v.solidDefenseCount,19);
 assert.equal(v.wallBoxes.length,19);
 assert.equal(v.solidMeshes.length,19);
 assert.equal(v.featureBoxes.length,19);
 assert(v.frontBastions>=6);
 assert.equal(v.antiRushObstacles,3);
 assert.equal(v.secondLineBlocks,4);
 assert.equal(v.gateChokeWidth,16);
 assert.equal(v.retreatOpeningWidth,24);
 assert.equal(v.trueWorldColliders,true);
 assert.equal(v.originalGateAndMachinesPreserved,true);
 assert.equal(v.noSeparateFPSRuntime,true);
 assert(parent.children.some(c=>c.name==='AK26_REAL_DEFENSIVE_OUTWORKS_GATE_DOGLEG_AND_SECOND_LINE'));
 for(const e of v.featureBoxes)assert(near(e.box.minY,0),'Real walls start at ground y=0');
 for(const name of ['west-flanking-bastion','east-flanking-bastion','west-bastion-throat','east-bastion-throat','inner-gate-dogleg','west-second-line','east-second-line'])
  assert(v.featureBoxes.some(x=>x.name===name),'Essential functional outwork is missing: '+name);
});
test('AK26 physically safeguards original ram, catapult, tower, G5.4 breakthrough and rear retreat paths',()=>{
 const zones=D.zones;
 assert.deepEqual(Object.keys(zones).sort(),
  ['catapult','eastBreach','ram','rearPostern','tower','westBreach'].sort());
 for(const f of D.features)
  for(const [name,z] of Object.entries(zones))
   assert.equal(D.overlaps({minX:f.x-f.w/2,maxX:f.x+f.w/2,
    minZ:f.z-f.d/2,maxZ:f.z+f.d/2},z,.8),false,
   f.name+' must not block original '+name);
 const routes={
  ram:[{x:0,z:-90},{x:0,z:-70},{x:0,z:-49}],
  tower:[{x:28,z:-80},{x:28,z:-58},{x:28,z:-43}],
  catapult:[{x:-22,z:-82},{x:-22,z:-67}],
  westBreach:[{x:-19,z:-24},{x:-19,z:-9},{x:-19,z:12}],
  eastBreach:[{x:19,z:-24},{x:19,z:-9},{x:19,z:12}],
  postern:[{x:0,z:46},{x:0,z:62},{x:0,z:83}]
 };
 for(const [name,pts] of Object.entries(routes))
  assert.equal(D.pathClear(pts),true,'Original gameplay corridor blocked: '+name);
 assert.equal(D.pathClear([{x:0,z:-25},{x:0,z:-11}]),false,
  'Central straight-line charge must hit actual internal defensive dogleg');
 assert.equal(D.pathClear([{x:36,z:56},{x:36,z:62}]),false,
  'Second defensive line must physically obstruct the wide rear courtyard');
});
test('AK26 collision boxes are grounded and joined to native castle without altering attack equipment',()=>{
 const {v}=installed();
 const x=v.featureBoxes.find(e=>e.name==='east-bastion-throat');
 assert(x.box.minZ< -39.5 && x.box.maxZ> -44.5,
  'Real bastion overlaps the original south wall thickness rather than floating away');
 const gate=v.featureBoxes.find(e=>e.name==='inner-gate-dogleg');
 assert.equal(gate.h,5);
 assert(gate.z>-42,'Functional anti-rush position belongs BEHIND original 600HP gate');
 const west=v.featureBoxes.find(e=>e.name==='west-second-line');
 const east=v.featureBoxes.find(e=>e.name==='east-second-line');
 assert(west.box.maxX<=-12 && east.box.minX>=12,
  'Second line has a 24m genuine walkable retreat corridor');
});
test('Only the verified 29th original FPS script receives AK26 physical defense data',()=>{
 assert.throws(()=>applyNativeSiegeDefenseV26('not the native game'),/original native defense anchor/);
 const stage=applyNativeSiegeExpansionV25(extractedScripts(original)[28]);
 const next=applyNativeSiegeDefenseV26(stage);
 assert(next.includes('nativeSiegeWallBoxes.push(...nativeSiegeDefenseV26.wallBoxes)'));
 assert(next.includes('...nativeSiegeDefenseV26.solidMeshes'));
 assert(next.includes('window.ktkSiegeFortificationStatus=()=>'));
 assert.equal((next.match(/nativeSiegeDefenseV26.solidMeshes/g)||[]).length,3);
});
test('Final AK26 canonical game keeps first 28 original G5.4 scripts byte-identical, 3 maps, true siege',()=>{
 const {html,manifest}=buildCanonical(original);
 const now=extractedScripts(html),before=extractedScripts(original);
 assert.equal(now.length,29);
 for(let i=0;i<28;i++)assert.equal(now[i],before[i],'changed original FPS script '+i);
 assert.doesNotThrow(()=>new vm.Script(now[28]));
 assert.equal(manifest.kind,'SINGLE_NATIVE_FPS_THREE_MAPS');
 assert.equal(manifest.oneLiveGameDocument,true);
 assert.equal(manifest.oneRendererOneMovementEngine,true);
 assert.equal(manifest.nativeArmyAndSiegeTroops,140);
 assert(manifest.nativeSiegeV25.castleAreaFactor>=4);
 assert(manifest.nativeSiegeV25.mapAreaFactor>=8);
 assert.equal(manifest.nativeSiegeV26.physicalDefenseBoxes,19);
 assert.equal(manifest.nativeSiegeV26.realProjectileFirstContact,true);
 assert.equal(manifest.nativeSiegeV26.originalGateAndMachinesPreserved,undefined);
 assert(html.includes('KTKSiegeFortificationV26.install('));
 assert(html.includes('KTKNativeUiV24.install(document)'));
 assert(!html.includes('frame.srcdoc='));
});
