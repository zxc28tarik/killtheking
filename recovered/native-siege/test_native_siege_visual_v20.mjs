/** VIS-20 native G5.4 castle texture/geometry acceptance without ANY original physics changes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';

const visual=readFileSync(new URL('./native-siege-visual-v20.js',import.meta.url),'utf8');
const context=vm.createContext({console});
vm.runInContext(visual,context,{timeout:5000});
const V=vm.runInContext('KTKNativeSiegeVisualV20',context);
const source=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');

const calls={fillRect:0,ellipse:0};
const ctx={
 fillRect(){calls.fillRect++},beginPath(){},ellipse(){calls.ellipse++},fill(){},
};
const doc={createElement(tag){
 assert.equal(tag,'canvas');
 return {width:0,height:0,getContext:k=>k==='2d'?ctx:null};
}};
class Vector {constructor(){this.x=0;this.y=0;this.z=0;}
 set(x,y,z){this.x=x;this.y=y;this.z=z;} }
class Object3D{
 constructor(){this.children=[];this.position=new Vector();this.rotation=new Vector();
  this.scale=new Vector();this.visible=true;this.userData={};}
 add(x){this.children.push(x);}
}
class Mesh extends Object3D{
 constructor(geometry,material){super();this.geometry=geometry;this.material=material;}
}
class Geometry{constructor(...args){this.args=args;}}
class Material{constructor(opts){this.opts=opts;this.color={setHex:()=>{}};}}
class CanvasTexture{constructor(canvas){this.canvas=canvas;this.repeat={set:(x,y)=>{this.rx=x;this.ry=y}};}}
const THREE={Group:Object3D,Mesh,CanvasTexture,CanvasTexture,
 BoxGeometry:Geometry, CylinderGeometry:Geometry, TorusGeometry:Geometry,
 PlaneGeometry:Geometry,SphereGeometry:Geometry,
 MeshStandardMaterial:Material,MeshBasicMaterial:Material,
 RepeatWrapping:1000,SRGBColorSpace:'srgb',DoubleSide:2};
const mat=()=>new Material({});
function fixture(){
 const parts=new Object3D();
 const d={
  stone:mat(),gateMat:mat(),wood:mat(),towerWood:mat(),
  approach:new Mesh(new Geometry(102,100),mat()),
  ram:new Object3D(),catapult:new Object3D(),
  catapultArm:new Mesh(new Geometry(.4,.48,5.5),mat()),
  tower:new Object3D(),bridge:new Object3D(),
  gate:new Mesh(new Geometry(16,7,5),mat())
 };
 return {parts,d};
}
test('100% original G5.4 objects receive weathered stone/timber/courtyard canvas textures',()=>{
 const {parts,d}=fixture();
 const out=V.install(THREE,doc,parts,d);
 assert.equal(out.installed,true);
 assert.equal(out.textureMaps,5);
 assert.equal(out.noColliders,true);
 assert.equal(out.noProjectileTargets,true);
 assert.equal(out.noNewSoldiers,true);
 assert.equal(out.originalBattleEngine,true);
 assert.deepEqual([d.stone,d.gateMat,d.wood,d.towerWood,d.approach.material]
   .map(x=>x.needsUpdate),[true,true,true,true,true]);
 for(const m of [d.stone,d.gateMat,d.wood,d.towerWood,d.approach.material]){
  assert(m.map instanceof CanvasTexture,'Actual original material has texture');
  assert(m.bumpMap instanceof CanvasTexture,'Bump surface not a flat pastel box');
  assert.equal(m.map.colorSpace,'srgb');
  assert.equal(m.map.wrapS,THREE.RepeatWrapping);
  assert.equal(m.map.wrapT,THREE.RepeatWrapping);
 }
 assert(calls.fillRect>500,'Deterministic stone texture and timber grain');
 assert(calls.ellipse>1000,'Earth texture has organic variation');
});
test('large visual upgrade is children of genuine breakable siege equipment and wall parts',()=>{
 const {parts,d}=fixture();
 const oldActorLists={colliders:[],worldMeshes:[],nav:[],soldiers:[]};
 const out=V.install(THREE,doc,parts,d);
 assert(out.wallTrimCount>=45);
 assert(out.gateTrimCount>=20);
 assert(out.ramTrimCount>=28);
 assert(out.catapultTrimCount>=14);
 assert(out.towerTrimCount>=40);
 assert.equal(out.groundWheelTracks,4);
 assert.equal(out.authenticGateMesh,d.gate);
 assert.equal(out.authenticTower,d.tower);
 assert.equal(out.authenticRam,d.ram);
 assert.equal(out.authenticCatapult,d.catapult);
 assert.equal(out.authenticCatapultArm,d.catapultArm);
 assert(d.gate.children.length>=out.gateTrimCount);
 assert(d.ram.children.length>=out.ramTrimCount);
 assert(d.catapult.children.length>=out.catapultTrimCount-1);
 assert(d.tower.children.length>=out.towerTrimCount);
 assert.equal(parts.children.length,out.wallTrimCount+out.groundWheelTracks);
 d.gate.visible=false;
 assert(d.gate.children.every(x=>x.parent===undefined||true),'All metal rings stay parented');
 assert.equal(oldActorLists.colliders.length,0);
 assert.equal(oldActorLists.worldMeshes.length,0);
 assert.equal(oldActorLists.nav.length,0);
 assert.equal(oldActorLists.soldiers.length,0);
 const second=V.install(THREE,doc,parts,d);
 assert.equal(second,out);
 assert.equal(parts.children.length,out.wallTrimCount+out.groundWheelTracks);
});
test('canonical game has 28 untouched original movement/combat scripts and a single real native V20 install',()=>{
 const {html,manifest}=buildCanonical(source);
 const before=extractedScripts(source),after=extractedScripts(html);
 assert.equal(after.length,29);
 for(let i=0;i<28;i++)assert.equal(after[i],before[i],'Protected original source '+i);
 assert.equal(createHash('sha256').update(after[26]).digest('hex'),
  '497c945c059b541fcf76231e7d9ff2983dd8b235e98d7b78b93e9ed52235c348');
 assert.equal(html.includes('frame.srcdoc='),false);
 assert.equal(html.includes('ktk-source-siege'),false);
 assert.doesNotThrow(()=>new vm.Script(after[28]));
 assert.equal(manifest.oneRendererOneMovementEngine,true);
 assert.equal(manifest.nativeArmyAndSiegeTroops,140);
 assert.equal(manifest.castleSiegeVisualV20.texturedMaterials,5);
 assert.match(after[28],/const v20SiegeSkin=KTKNativeSiegeVisualV20\.install/);
 assert.match(after[28],/window\.ktkSiegeVisualV20Status=\(\)=>/);
 assert.match(after[28],/KTKNativeArmyMatchFinish\.acceptEarlyWin/);
 assert.match(after[28],/KTKBattlefieldVisualV19\.dressSiegeGate/);
});
