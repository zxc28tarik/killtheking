import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function snippet(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i);return html.slice(i,j);}
class Geometry{constructor(...p){this.parameters=p;this.disposed=0;}dispose(){this.disposed++;}}
class Texture{constructor(){this.repeat={set:(x,y)=>{this.rx=x;this.ry=y;}};}clone(){return new Texture();}}
class Material{constructor(p){Object.assign(this,p);}}
class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.isMesh=true;this.position={};this.rotation={};}}
class Group{constructor(){this.children=[];}add(...o){this.children.push(...o);}traverse(fn){fn(this);for(const c of this.children)fn(c);}}
function fixture(){
 const removed=[];
 const c={THREE:{BoxGeometry:Geometry,ConeGeometry:Geometry,MeshStandardMaterial:Material,Mesh,Group},stoneTexBundle:{map:new Texture(),bumpMap:new Texture()},window:{},goldMat:{},steelMat:{},scene:{remove:m=>removed.push(m)}};
 runInNewContext(snippet('        const staticBoxGeometries=', '        function addBox(')+snippet('        let sharedArrowShaft=', '        function clearRoundTransients(')+'\nglobalThis.api={sharedStaticBoxGeometry,sharedStaticStoneMaterial,createPlayerArrowMesh,releaseArrow};',c);
 return {...c,removed};
}
test('OPT static boxes share only identical dimensions and keep original parameters',()=>{
 const {api,window}=fixture();const a=api.sharedStaticBoxGeometry(3,2,4),b=api.sharedStaticBoxGeometry(3,2,4),c=api.sharedStaticBoxGeometry(4,2,3);
 assert.equal(a,b);assert.notEqual(a,c);assert.deepEqual(a.parameters,[3,2,4]);assert.equal(window.ktkStaticResourceStatus().avoidedBoxAllocations,1);
});
test('OPT stone surfaces share exact repeat pairs and retain separate UV variants',()=>{
 const {api,window}=fixture();const a=api.sharedStaticStoneMaterial(12,7,4),b=api.sharedStaticStoneMaterial(13,6,5),c=api.sharedStaticStoneMaterial(24,7,4);
 assert.equal(a,b);assert.notEqual(a,c);assert.equal(a.map.rx,2);assert.equal(a.map.ry,1);assert.equal(c.bumpMap.rx,4);assert.equal(a.bumpScale,.14);assert.equal(a.roughness,.85);assert.equal(a.metalness,.05);assert.equal(window.ktkStaticResourceStatus().avoidedStoneTextureClones,2);
});
test('OPT arrows share immutable geometry, retain independent pose, and release without invalidating live arrows',()=>{
 const {api,removed}=fixture();const a=api.createPlayerArrowMesh(),b=api.createPlayerArrowMesh();
 assert.notEqual(a,b);assert.notEqual(a.children[1],b.children[1]);assert.equal(a.children[0].geometry,b.children[0].geometry);assert.equal(a.children[1].geometry,b.children[1].geometry);
 assert.deepEqual(a.children[0].geometry.parameters,[.05,.05,1.25]);assert.equal(a.children[1].position.z,-.68);assert.equal(a.children[1].rotation.x,-Math.PI/2);
 api.releaseArrow(a);assert.equal(removed[0],a);assert.equal(b.children[0].geometry.disposed,0);assert.equal(b.children[1].geometry.disposed,0);
 const foreign=new Group(),owned=new Geometry(1);foreign.add(new Mesh(owned,{}));api.releaseArrow(foreign);assert.equal(owned.disposed,1);
});
test('OPT both map factories and actual player shot use shared resources',()=>{
 assert.match(html,/new THREE\.Mesh\(sharedStaticBoxGeometry\(w,h,d\), useMat\)/);
 assert.match(html,/new THREE\.Mesh\(sharedStaticBoxGeometry\(w,h,d\),mat\)/);
 assert.match(html,/const arrowGroup = createPlayerArrowMesh\(\);/);
});
