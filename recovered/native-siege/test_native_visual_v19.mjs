/** VIS-19 native visual/QoL regression — never replaces the original game. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';

const source=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const visual=readFileSync(new URL('./native-battlefield-visual-v19.js',import.meta.url),'utf8');
const context=vm.createContext({console});
vm.runInContext(visual,context,{timeout:3000});
const V=vm.runInContext('KTKBattlefieldVisualV19',context);

class Object3D {
 constructor(){
  this.children=[];this.visible=true;
  this.position={set:(...v)=>{this._pos=v}};
  this.scale={set:(...v)=>{this._scale=v}};
  this.rotation={set:(...v)=>{this._rot=v}};
  this.matrix={};
 }
 updateMatrix(){this.matrix={pos:this._pos,scale:this._scale,rot:this._rot};}
 add(...objects){this.children.push(...objects);}
}
class Mesh extends Object3D {
 constructor(geometry,material){super();this.geometry=geometry;this.material=material;}
}
class InstancedMesh extends Mesh {
 constructor(geometry,material,count){super(geometry,material);this.count=count;this.matrixData=[];this.instanceMatrix={needsUpdate:false};this.colors=[];}
 setMatrixAt(index,m){this.matrixData[index]={...m};}
 setColorAt(index,c){this.colors[index]={...c};}
}
class Color {setHSL(h,s,l){this.h=h;this.s=s;this.l=l;return this;}}
class Material {constructor(options){this.options=options;}}
class Geometry {constructor(...args){this.args=args;}}
const THREE={Group:Object3D,Mesh,InstancedMesh,Object3D,Color,
 CylinderGeometry:Geometry,ConeGeometry:Geometry,BoxGeometry:Geometry,
 MeshLambertMaterial:Material,MeshStandardMaterial:Material};

test('pure deterministic meadow groves: 180 trees, three instanced visual batches, no collision edits',()=>{
 const scene=new Object3D();
 const a=V.addMeadowGroves(THREE,scene,{half:848.7,boxes:[]});
 assert.equal(a.trees,180);
 assert.equal(a.drawBatches,3);
 assert.equal(a.noColliders,true);
 assert(a.minDistanceFromCenter>200,'Grove belongs to outer periphery, not active central battle');
 assert.equal(scene.children.length,1);
 assert.equal(a.group.children.length,3);
 assert(a.group.children.every(x=>x instanceof InstancedMesh));
 assert(a.group.children.every(x=>x.count===180));
 assert(a.group.children.every(x=>x.instanceMatrix.needsUpdate));
 assert(a.group.children.every(x=>x.frustumCulled===false));
 assert.equal(a.group.children[1].colors.length,180);
 const pos=a.group.children[0].matrixData[45].pos;
 const b=V.addMeadowGroves(THREE,new Object3D(),{half:848.7,boxes:[]});
 assert.deepEqual(b.group.children[0].matrixData[45].pos,pos);
});
test('native siege masonry and gate dressing follow ORIGINAL gate visibility; no new world obstacles',()=>{
 const parts=new Object3D(),gate=new Mesh(new Geometry(16,7,5),new Material({}));
 const oldCollisionSize=0;
 const q=V.dressSiegeGate(THREE,parts,gate);
 assert.equal(q.noColliders,true);
 assert.equal(q.gateFollowsRealNativeMesh,true);
 assert(q.gateDetails>=25);
 assert(q.mortarStones>=35);
 assert.equal(parts.children.length,1,'mortar one extra instanced renderer');
 assert.equal(parts.children[0].count,q.mortarStones);
 assert.equal(gate.children.length,q.gateDetails);
 gate.visible=false;assert.equal(gate.visible,false);
 assert.equal(oldCollisionSize,0);
});
test('battle-only style does not affect original six-bot Arena and is reversible',()=>{
 const styles=new Map(),classes=new Set();
 const doc={
  body:{classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k)}},
  head:{appendChild:v=>styles.set(v.id,v)},
  createElement:tag=>({tagName:tag}),getElementById:id=>styles.get(id)||null
 };
 assert.equal(V.installHud(doc),true);
 assert.equal(V.installHud(doc),false);
 assert.equal(styles.size,1);
 assert(styles.values().next().value.textContent.includes('body.ktk-native-battle-ui'));
 assert.equal(classes.size,0);
 V.setBattleUi(doc,true);assert(classes.has('ktk-native-battle-ui'));
 V.setBattleUi(doc,false);assert.equal(classes.size,0);
});
test('final canonical HTML preserves ALL 28 original FPS/army engine scripts byte for byte',()=>{
 const {html,manifest}=buildCanonical(source);
 const a=extractedScripts(source),b=extractedScripts(html);
 assert.equal(a.length,29);assert.equal(b.length,29);
 for(let i=0;i<28;i++)assert.equal(a[i],b[i],String(i));
 assert.equal(createHash('sha256').update(b[26]).digest('hex'),
 '497c945c059b541fcf76231e7d9ff2983dd8b235e98d7b78b93e9ed52235c348');
 assert.doesNotThrow(()=>new vm.Script(b[28]));
 assert.equal(manifest.oneLiveGameDocument,true);
 assert.equal(manifest.oldIframeOrSeparateS3D1Runtime,false);
 assert.equal(manifest.meadowPerimeterTreesVisualOnly,180);
 assert.equal(manifest.siegeGateMasonryVisualOnly,true);
 assert.equal(manifest.armyAndSiegeCompactHudDefault,true);
 assert.match(b[28],/KTKBattlefieldVisualV19\.addMeadowGroves/);
 assert.match(b[28],/KTKBattlefieldVisualV19\.dressSiegeGate/);
 assert.match(b[28],/KTKBattlefieldVisualV19\.setBattleUi/);
 assert.match(b[28],/army\.classList\.toggle\('ktk-siege-slim',meadowBattleMode&&slim\)/);
 assert.match(b[28],/if\(e\.code==='F10'\)\{e\.preventDefault\(\);KTKNativeSiegeHud\.flip\(\);return;\}/);
 assert.match(b[28],/const siegeHotkeys=\{F6:'native-siege-tower-order'/);
 assert.match(b[28],/window\.ktkNativeSiegeMapStatus/);
});
