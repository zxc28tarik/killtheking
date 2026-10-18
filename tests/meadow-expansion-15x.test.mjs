import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const Meadow=require('../src/arena-meadow-layout.js');
const Grass=require('../src/arena-meadow-grass.js');
const THREE=require('../vendor/three-r128.js');
const {createNavigator}=require('../src/arena-navigation.js');
const s=Meadow.spec();
const bounds=s.boxes.filter(b=>b.solid).map(b=>({
 minX:b.x-b.w/2,maxX:b.x+b.w/2,minY:b.y-b.h/2,maxY:b.y+b.h/2,
 minZ:b.z-b.d/2,maxZ:b.z+b.d/2
}));
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('second meadow multiplies accepted area by 15, total 300x original',()=>{
 assert.equal(s.expansionMultiplier,15);
 assert.equal(s.areaMultiplier,300);
 assert.equal(Meadow.PREVIOUS_AREA_MULTIPLIER,20);
 assert.ok(Math.abs(s.half*2-1697.4097914175)<.001);
 assert.ok(Math.abs((s.half*2)**2/(98**2)-300)<1e-8);
 assert.match(html,/300× ÇİMENLİK MEYDAN/);
});
test('giant meadow keeps central spawn combat and bounded navigation',()=>{
 const nav=createNavigator(bounds,[],s.navigation);
 assert.ok(nav.stats.cells<6000);
 assert.equal(nav.walkableAt(-s.half,0,0),false);
 assert.equal(nav.walkableAt(s.half,0,0),false);
 const spawns=[...s.courtyardSpawns,...s.rangedSpawns];
 assert.equal(spawns.length,16);
 for(const a of spawns)for(const b of spawns){
  if(a===b)continue;
  assert.equal(nav.isReachable({x:a[0],y:0,z:a[2]}, {x:b[0],y:0,z:b[2]}),true);
 }
 assert.ok(spawns.every(p=>Math.abs(p[0])<110&&Math.abs(p[2])<110));
});
test('player-near grass patch is stable when moving between world tiles',()=>{
 const mesh=Grass.createNearbyTufts(THREE,800);
 assert.equal(Grass.updateNearbyTufts(THREE,mesh,s,0,0),true);
 assert.equal(Grass.updateNearbyTufts(THREE,mesh,s,10,10),false);
 function worldPositions(){
  const matrix=new THREE.Matrix4(),vec=new THREE.Vector3(),result=new Set();
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);vec.setFromMatrixPosition(matrix);
   result.add(vec.x.toFixed(5)+','+vec.z.toFixed(5));
  }
  return result;
 }
 const before=worldPositions();
 assert.equal(Grass.updateNearbyTufts(THREE,mesh,s,21,0),true);
 const after=worldPositions();
 assert.ok([...before].filter(v=>after.has(v)).length>600);
 assert.match(game,/grassTexture\.repeat\.set\(turfRepeats,turfRepeats\)/);
 assert.match(game,/ArenaMeadowGrass\.updateNearbyTufts/);
 assert.doesNotMatch(game,/worldMeshes\.push\(meadowNearGrass\)/);
});
test('expanded camera and sky dome retain old castle settings',()=>{
 assert.match(game,/camera\.far=map==='meadow'\?2400:350/);
 assert.match(game,/map==='meadow'\?8:1/);
 assert.match(game,/map==='meadow'\?\.12:1/);
});
