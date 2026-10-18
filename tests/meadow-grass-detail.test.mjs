import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const Grass=require('../src/arena-meadow-grass.js');
const Meadow=require('../src/arena-meadow-layout.js');
const spec=Meadow.spec();
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('all twentyfold meadow quadrants and the playable center have grass',()=>{
 const places=Grass.samplePositions(spec.half,spec.boxes);
 assert.ok(places.length>31000,'expected dense, low-poly meadow cover');
 const quadrants=[0,0,0,0];
 let center=0,outer=0;
 for(const p of places){
  quadrants[(p.x>=0?1:0)+(p.z>=0?2:0)]++;
  if(Math.abs(p.x)<30&&Math.abs(p.z)<30)center++;
  if(Math.abs(p.x)>spec.half*.72||Math.abs(p.z)>spec.half*.72)outer++;
  assert.ok(Math.abs(p.x)<spec.half-Grass.EDGE_INSET);
  assert.ok(Math.abs(p.z)<spec.half-Grass.EDGE_INSET);
  assert.ok(p.height>=.3&&p.height<=.7);
 }
 assert.ok(quadrants.every(n=>n>7200),quadrants.join(','));
 assert.ok(center>450,'do not leave a bare central arena');
 assert.ok(outer>10000,'edges of the expanded field must have grass too');
});

test('seed is stable, meadow foliage avoids solid collision props',()=>{
 const a=Grass.samplePositions(spec.half,spec.boxes,200);
 const b=Grass.samplePositions(spec.half,spec.boxes,200);
 assert.deepEqual(a,b);
 assert.notDeepEqual(a,Grass.samplePositions(spec.half,spec.boxes,200,123));
 for(const p of Grass.samplePositions(spec.half,spec.boxes))
  for(const box of spec.boxes.filter(b=>b.solid))
   assert.ok(!(Math.abs(p.x-box.x)<box.w/2+1&&Math.abs(p.z-box.z)<box.d/2+1));
 assert.deepEqual(Grass.samplePositions(spec.half,spec.boxes,0),[]);
 assert.throws(()=>Grass.samplePositions(2),RangeError);
});

test('grass is rendered as one instanced non-solid layer, never a bot collider',()=>{
 assert.ok(html.indexOf('src/arena-meadow-grass.js')>0);
 assert.ok(html.indexOf('src/arena-meadow-grass.js')<html.indexOf('src/oyun.js'));
 assert.match(game,/ArenaMeadowGrass\.createTexture\(THREE,document\)/);
 assert.match(game,/ArenaMeadowGrass\.createInstancedTufts\(THREE,spec,grassDetail\)/);
 assert.match(game,/scene\.add\(grassTufts\)/);
 assert.doesNotMatch(game,/worldMeshes\.push\(grassTufts\)/);
 assert.doesNotMatch(game,/colliders\.push\(grassTufts\)/);
 const moduleText=readFileSync(new URL('../src/arena-meadow-grass.js',import.meta.url),'utf8');
 assert.match(moduleText,/new THREE\.InstancedMesh\(/);
 assert.match(moduleText,/mesh\.castShadow=false/);
 assert.match(moduleText,/mesh\.frustumCulled=false/);
});
