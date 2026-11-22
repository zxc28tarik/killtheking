/** AK25 original one-engine fortress growth and authentic 70v70 side segregation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';
import {applyNativeSiegeExpansionV25} from './siege-expansion-patch-v25.mjs';

const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const source=readFileSync(new URL('./native-siege-expansion-v25.js',import.meta.url),'utf8');
const ctx=vm.createContext({console});new vm.Script(source);vm.runInContext(source,ctx);
const AK25=vm.runInContext('KTKSiegeExpansionV25',ctx);
const close=(a,b)=>Math.abs(a-b)<.00001;

test('AK25 castle grows at least fourfold and actual battlefield eightfold by area',()=>{
 assert(close(AK25.CASTLE_WIDTH,224));
 assert(close(AK25.CASTLE_DEPTH,228.5));
 assert(close(AK25.FIELD_SIDE,624));
 assert(AK25.AREA_FACTOR>=4);
 assert(AK25.MAP_FACTOR>=8);
});
test('AK25 ensures all 70 original red are inside, 70 original blue outside and player outside',()=>{
 const state={soldiers:[]};
 for(let i=0;i<70;i++){
  state.soldiers.push({id:i,team:'red',x:-35+(i%14)*5,z:-36+Math.floor(i/14)*10});
  state.soldiers.push({id:70+i,team:'blue',x:-30+(i%14)*5,z:-69-(i%5)*5});
 }
 const p=AK25.deployment(state,{x:0,z:-69});
 assert.equal(p.soldiers,140);assert.equal(p.blue,70);assert.equal(p.red,70);
 assert.equal(p.redInside,70);assert.equal(p.blueOutside,70);
 assert.equal(p.redOutside,0);assert.equal(p.blueInside,0);
 assert.equal(p.allDefendersInside,true);assert.equal(p.allAttackersOutside,true);
 assert.equal(p.playerOutside,true);
 assert.equal(p.attackerTeam,'blue');assert.equal(p.defenderTeam,'red');
});
function mockThree(){
 const vec=()=>({x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}});
 class Group{constructor(){this.children=[];this.position=vec()}add(...nodes){this.children.push(...nodes)}}
 class Mat{constructor(props={}){Object.assign(this,props)}}
 class Geo{constructor(...args){this.args=args}}
 class Mesh{constructor(g,m){this.geometry=g;this.material=m;this.position=vec();
  this.rotation={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}}}}
 class Instanced extends Mesh{constructor(g,m,n){super(g,m);this.count=n;this.instanceMatrix={needsUpdate:false}}
  setMatrixAt(){}}
 class CanvasTexture{constructor(canvas){this.canvas=canvas;this.repeat={set(){}}}}
 class Object3D{constructor(){this.position=vec();this.rotation={set(){}};this.scale={setScalar(){}};this.matrix={}}
  updateMatrix(){}}
 return {Group,Mesh,InstancedMesh:Instanced,CanvasTexture,MeshStandardMaterial:Mat,Object3D,
  PlaneGeometry:Geo,BoxGeometry:Geo,ConeGeometry:Geo,CylinderGeometry:Geo,
  RepeatWrapping:'repeat',SRGBColorSpace:'srgb',DoubleSide:'double'};
}
test('Real outer enceinte, rear postern and barracks have native collider boxes',()=>{
 const THREE=mockThree(),root=new THREE.Group();
 const doc={createElement:()=>({getContext:()=>({fillStyle:'',fillRect(){}})})};
 const mesh=(group,x,y,z,w,h,d,material)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z);group.add(m);return m;
 };
 const box=(x,y,z,w,h,d)=>({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,
  minZ:z-d/2,maxZ:z+d/2});
 const out=AK25.install(THREE,doc,root,mesh,box,{stone:{},wood:{},gate:{}});
 assert(out.castleAreaFactor>=4&&out.mapAreaFactor>=8);
 assert(out.staticSolidCount>=14);assert.equal(out.wallBoxes.length,out.solidMeshes.length);
 assert.equal(out.posternWidth,16);assert(out.merlons>=65);assert(out.forestTrees>=100);
 const has=(a,b,c,d)=>out.wallBoxes.some(q=>close(q.minX,a)&&close(q.maxX,b)&&
  close(q.minZ,c)&&close(q.maxZ,d));
 assert(has(-112,-44,-44.5,-39.5),'west front real wall');
 assert(has(44,112,-44.5,-39.5),'east front real wall');
 assert(has(-44,-8,39.5,44.5),'left half of open inner postern');
 assert(has(8,44,39.5,44.5),'right half of open inner postern');
 assert(out.wallBoxes.some(q=>close(q.minX,-114.5)&&close(q.maxX,-109.5)&&close(q.maxZ,184)));
 assert(root.children.some(c=>c.name==='AK25_REAL_FORTIFIED_OUTER_CASTLE_AND_EIGHTFOLD_FIELD'));
 assert.equal(out.noAlternateSiegeEngine,true);
});
test('AK25 patch anchors are checked and modify only the real 29th script',()=>{
 assert.throws(()=>applyNativeSiegeExpansionV25('wrong native game'),/original native anchor/);
 const expanded=applyNativeSiegeExpansionV25(extractedScripts(original)[28]);
 for(const t of ['nativeSiegeExpansionV25=KTKSiegeExpansionV25.install(',
  'nativeSiegeDeploymentEvidence.redInside!==70','nativeSiegeDeploymentEvidence.blueOutside!==70',
  'min:-312,max:312,step:5','nativeSiegeOriginalNorthVisual.visible=!enabled']){
  assert(expanded.includes(t),t);
 }
 assert(!expanded.includes('const outpost=squad.team==='));
});
test('AK25 canonical output preserves 28 native game scripts, three modes, original FPS engine',()=>{
 const {html,manifest}=buildCanonical(original);
 const before=extractedScripts(original),now=extractedScripts(html);
 assert.equal(before.length,29);assert.equal(now.length,29);
 for(let i=0;i<28;i++)assert.equal(now[i],before[i],'original script '+i);
 assert.doesNotThrow(()=>new vm.Script(now[28]));
 assert.equal(manifest.kind,'SINGLE_NATIVE_FPS_THREE_MAPS');
 assert.equal(manifest.oneRendererOneMovementEngine,true);
 assert.equal(manifest.oneLiveGameDocument,true);
 assert.equal(manifest.nativeArmyAndSiegeTroops,140);
 assert(manifest.nativeSiegeV25.castleAreaFactor>=4);
 assert(manifest.nativeSiegeV25.mapAreaFactor>=8);
 assert.equal(manifest.nativeSiegeV25.originalEngine,true);
 assert.deepEqual(manifest.maps,['arena','meadow-army','castle-siege']);
 assert(html.includes('window.ktkSiegeExpandedMapStatus='));
 assert(html.includes('KTKNativeUiV24.install(document)'));
 assert(!html.includes('frame.srcdoc='));
});