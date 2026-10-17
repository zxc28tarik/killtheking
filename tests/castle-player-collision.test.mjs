import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three-r128.js');
const {move,overlaps}=require('../src/player-collision.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
function castleColliders(){
 const begin=game.indexOf('        function buildCastleArena() {');
 const end=game.indexOf('        buildCastleArena();',begin)+'        buildCastleArena();'.length;
 assert.ok(begin>=0 && end>begin);
 const colliders=[],ramps=[];
 const mat=new THREE.MeshBasicMaterial();
 const addBox=(x,y,z,w,h,d,unused,isSolid=true)=>{
   if(isSolid)colliders.push({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2});
 };
 const env={THREE,scene:{add(){}},worldMeshes:[],groundTexBundle:{},stoneMat:mat,
  woodMat:mat,grassMat:mat,darkStoneMat:mat,roofMat:mat,crateMat:mat,ironMat:mat,
  addBox,ramps,console,createTorch(){},createExplosiveBarrel(){},
  createJumpPad(){},createSiegeCannon(){}};
 vm.runInNewContext(game.slice(begin,end),env);
 return colliders;
}
test('real castle contains solid battlements and collision walls',()=>{
 const solids=castleColliders();
 assert.ok(solids.length>=80);
 assert.ok(solids.some(c=>c.maxY>7 && c.minY<2));
});
test('200 seeded high-speed moves inside the real castle cannot end in solid walls',()=>{
 const solids=castleColliders();
 let seed=0x1724abcd;
 const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 let tested=0;
 for(let i=0;i<2000 && tested<200;i++){
  const from={x:random()*76-38,z:random()*76-38,y:2.35};
  if(overlaps(from,.75,2.35,solids))continue;
  const velocity={x:(random()-.5)*240,z:(random()-.5)*240};
  const p=move({from,velocity,dt:.05,radius:.75,height:2.35,colliders:solids});
  assert.equal(overlaps({...from,x:p.x,z:p.z},.75,2.35,solids),false,
    'Player entered solid castle collider: '+JSON.stringify({from,velocity,p}));
  tested++;
 }
 assert.equal(tested,200);
});
test('runtime wires swept player movement before vertical floor calculation',()=>{
 assert.match(game,/ArenaPlayerCollision\.move\(\{/);
 assert.match(game,/if \(swept\.hitX\) player\.vel\.x = 0/);
 assert.match(game,/if \(swept\.hitZ\) player\.vel\.z = 0/);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(html.indexOf('src/player-collision.js')>=0);
 assert.ok(html.indexOf('src/player-collision.js')<html.indexOf('src/oyun.js'));
});
