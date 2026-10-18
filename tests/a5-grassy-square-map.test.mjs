import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const Meadow=require('../src/arena-meadow-layout.js');
const {createNavigator}=require('../src/arena-navigation.js');
const {move,overlaps}=require('../src/player-collision.js');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const spec=Meadow.spec();
const bounds=spec.boxes.filter(b=>b.solid).map(b=>({
 minX:b.x-b.w/2,maxX:b.x+b.w/2,
 minY:b.y-b.h/2,maxY:b.y+b.h/2,
 minZ:b.z-b.d/2,maxZ:b.z+b.d/2
}));

test('user-selected meadow is exactly 20x more area than original grassy square',()=>{
 assert.equal(spec.areaMultiplier,20);
 assert.equal(Meadow.AREA_MULTIPLIER,20);
 assert.ok(Math.abs(spec.half-49*Math.sqrt(20))<1e-8);
 assert.ok(Math.abs(((2*spec.half)**2)/(98**2)-20)<1e-9);
 assert.deepEqual(spec.navigation,{min:-51*Math.sqrt(20),max:51*Math.sqrt(20),
  step:1.5*Math.sqrt(20),upperEdge:1000,upperLevel:0});
 assert.equal(spec.navigation.step>6,true,'navigation should remain bounded on giant open map');
 assert.match(game,/let arenaMap = 'castle'/);
 assert.match(game,/function buildCastleArena\(\)/);
 assert.match(game,/function buildMeadowSquare\(\)/);
 assert.match(html,/data-arena-map="castle"/);
 assert.match(html,/data-arena-map="meadow"/);
 assert.match(html,/20× ÇİMENLİK MEYDAN/);
});

test('open central ~259x259 contains no solid tree, building, wall or cover',()=>{
 assert.ok(spec.boxes.length>=35);
 for(const b of spec.boxes.filter(b=>b.solid)){
  const open=29*Meadow.LINEAR_SCALE;
  assert.ok(b.x+b.w/2<=-open||b.x-b.w/2>=open||
    b.z+b.d/2<=-open||b.z-b.d/2>=open,
   'Solid entered central grass: '+JSON.stringify(b));
 }
 assert.equal(bounds.some(b=>0>=b.minX&&0<=b.maxX&&0>=b.minZ&&0<=b.maxZ),false);
});

test('meadow spawn pools are flat, safe and split across map for team mode',()=>{
 for(const pool of [spec.courtyardSpawns,spec.rangedSpawns]){
  assert.equal(pool.length,8);
  assert.ok(pool.some(p=>p[0]<-2));
  assert.ok(pool.some(p=>p[0]>2));
  for(const [x,y,z] of pool){
   assert.equal(y,0);
   assert.ok(Math.abs(x)<Meadow.HALF-2&&Math.abs(z)<Meadow.HALF-2);
   assert.equal(overlaps({x,y:2.35,z},.75,2.35,bounds),false,'spawn intersects solids');
  }
 }
});

test('meadow A* connects every spawn and real solid obstacles are respected',()=>{
 const nav=createNavigator(bounds,[],spec.navigation);
 assert.equal(nav.heightAt(0,0),0);
 assert.equal(nav.walkableAt(0,0,0),true);
 assert.equal(nav.walkableAt(-Meadow.HALF,0,0),false,'solid west fence');
 assert.equal(nav.walkableAt(Meadow.HALF,0,0),false,'solid east fence');
 assert.equal(nav.walkableAt(-40*Meadow.LINEAR_SCALE,
  -40*Meadow.LINEAR_SCALE,0),false,'tree trunk is solid');
 assert.ok(nav.stats.cells<6000,'map expansion must not create 20x nav grid');
 const selected=[...spec.courtyardSpawns,...spec.rangedSpawns]
   .map(([x,y,z])=>({x,y,z}));
 for(let i=0;i<selected.length;i++){
  for(let j=0;j<selected.length;j++){
   if(i===j)continue;
   const p=selected[i],q=selected[j];
   assert.equal(nav.walkableAt(p.x,p.z,p.y),true,'invalid spawn '+JSON.stringify(p));
   assert.equal(nav.isReachable(p,q),true,'disconnected spawn '+i+' -> '+j);
   assert.ok(nav.findPath(p,q).length>0,'empty A* path '+i+' -> '+j);
  }
 }
});

test('high-speed slides cannot tunnel through meadow fences and side cover',()=>{
 const nav=createNavigator(bounds,[],spec.navigation);
 const h=Meadow.HALF,s=Meadow.LINEAR_SCALE;
 for(const [from,velocity] of [
  [{x:h-9,y:2.35,z:0},{x:250,z:0}],
  [{x:-h+9,y:2.35,z:0},{x:-250,z:0}],
  [{x:0,y:2.35,z:h-9},{x:0,z:250}],
  [{x:0,y:2.35,z:-h+9},{x:0,z:-250}],
  [{x:37*s-9,y:2.35,z:14*s},{x:120,z:0}]
 ]){
  const p=move({from,velocity,dt:.1,radius:.75,height:2.35,colliders:bounds});
  assert.equal(overlaps({x:p.x,y:from.y,z:p.z},.75,2.35,bounds),false,
   'Moved through a meadow obstacle: '+JSON.stringify({from,velocity,p}));
  assert.equal(nav.walkableAt(p.x,p.z,0),true);
 }
});

test('map switching swaps 3D visibility, colliders and AI navigation, never just visuals',()=>{
 assert.match(game,/const castleVisuals = scene\.children\.slice\(castleBegin\)/);
 assert.match(game,/const meadowMapData=/);
 assert.match(game,/clearArenaGeometry\(\)/);
 assert.match(game,/function switchArenaMap\(map\)/);
 assert.match(game,/castleMapData\.visuals\.forEach\(obj=>\{obj\.visible=map==='castle'/);
 assert.match(game,/meadowMapData\.visuals\.forEach\(obj=>\{obj\.visible=map==='meadow'/);
 assert.match(game,/navigator=ArenaNavigation\.createNavigator\(colliders,ramps,selected\.navigation\)/);
 assert.match(game,/camera\.far=map==='meadow'\?1000:350/);
 assert.match(game,/skyDomeMesh\.scale\.setScalar\(/);
 assert.match(game,/activeArenaFogMultiplier=map==='meadow'\?\.45:1/);
 assert.match(game,/new THREE\.PlaneGeometry\(112\*spec\.linearScale,112\*spec\.linearScale\)/);
 assert.match(game,/arenaSpawnPool\(bot\.preferWall\)/);
 assert.match(game,/arenaSpawnPool\(false\)/);
 assert.match(game,/if\(arenaMatch\.phase!=='menu'\)return/);
 assert.ok(html.indexOf('src/arena-meadow-layout.js')<html.indexOf('src/oyun.js'));
});

test('FFA, TDM, class damage, bow draw, HUD and performance tools persist on both maps',()=>{
 for(const needle of [
  'ArenaTeams.scores(arenaMode,player,bots)',
  'ArenaWeaponBalance.bowCanRelease(',
  'ArenaBotOffense.windup(bot.role)',
  'ArenaPlayerCollision.move(',
  'ArenaPerformance.record(performanceSamples,rawDt)',
  'ArenaSettings.save(arenaSettingsStore,gameSettings)'
 ]) assert.ok(game.includes(needle),needle);
 assert.match(game,/const half = arenaMap === 'meadow' \? ArenaMeadowLayout\.HALF : 42/);
 assert.match(game,/map: arenaMap/);
});
