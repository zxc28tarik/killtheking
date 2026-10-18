import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const start=game.indexOf('        function switchArenaMap(map) {');
const end=game.indexOf('        function arenaSpawnPool(',start);
assert.ok(start>=0&&end>start,'map switch function not found');
const source=game.slice(start,end);

function setup(){
 const castleLook=[{visible:true},{visible:true}];
 const meadowLook=[{visible:false},{visible:false}];
 const originalBarrel={active:true,label:{style:{display:'block'}}};
 const castleMapData={
  colliders:[{id:'castle-wall'}],ramps:[{id:'castle-ramp'}],
  worldMeshes:[{id:'castle-solid'}],torches:[{id:'torch'}],
  jumpPads:[{id:'jumppad'}],barrels:[originalBarrel],
  visuals:castleLook,navigation:{map:'castle'}
 };
 const meadowMapData={
  colliders:[{id:'meadow-fence'}],ramps:[],
  worldMeshes:[{id:'meadow-floor'}],torches:[],jumpPads:[],barrels:[],
  visuals:meadowLook,navigation:{map:'meadow'}
 };
 const environment={
  arenaMap:'castle',castleMapData,meadowMapData,
  colliders:[...castleMapData.colliders],ramps:[...castleMapData.ramps],
  worldMeshes:[...castleMapData.worldMeshes],torches:[...castleMapData.torches],
  jumpPads:[...castleMapData.jumpPads],barrels:[...castleMapData.barrels],
  ArenaNavigation:{createNavigator:(bounds,slopes,config)=>{
   environment.calls.push(config.map);
   return {map:config.map,solids:bounds.map(x=>x.id),ramps:slopes.map(x=>x.id)};
  }},calls:[],navigator:{map:'castle'}
 };
 const run=vm.runInNewContext('('+source+')',environment);
 return {run,env:environment,castleLook,meadowLook,originalBarrel};
}

test('switch to open meadow isolates castle wall colliders, raycasts and ramp paths',()=>{
 const a=setup();
 a.run('meadow');
 assert.equal(a.env.arenaMap,'meadow');
 assert.deepEqual(Array.from(a.env.colliders,x=>x.id),['meadow-fence']);
 assert.deepEqual(Array.from(a.env.worldMeshes,x=>x.id),['meadow-floor']);
 assert.equal(a.env.ramps.length,0);
 assert.equal(a.env.torches.length,0);
 assert.equal(a.env.jumpPads.length,0);
 assert.equal(a.env.barrels.length,0);
 assert.equal(a.env.navigator.map,'meadow');
 assert.ok(a.castleLook.every(x=>!x.visible));
 assert.ok(a.meadowLook.every(x=>x.visible));
 assert.equal(a.originalBarrel.label.style.display,'none');
});
test('return to castle completely restores ramp, jump-pad, world meshes and barrel label',()=>{
 const a=setup();
 a.run('meadow');a.run('castle');
 assert.equal(a.env.arenaMap,'castle');
 assert.deepEqual(Array.from(a.env.colliders,x=>x.id),['castle-wall']);
 assert.deepEqual(Array.from(a.env.ramps,x=>x.id),['castle-ramp']);
 assert.deepEqual(Array.from(a.env.worldMeshes,x=>x.id),['castle-solid']);
 assert.equal(a.env.jumpPads.length,1);
 assert.equal(a.env.barrels.length,1);
 assert.ok(a.castleLook.every(x=>x.visible));
 assert.ok(a.meadowLook.every(x=>!x.visible));
 assert.equal(a.originalBarrel.label.style.display,'block');
 assert.deepEqual(Array.from(a.env.calls),['meadow','castle']);
});
test('selecting the current map avoids expensive rebuild and invalid names fail safely',()=>{
 const a=setup();
 a.run('castle');
 assert.equal(a.env.calls.length,0);
 assert.throws(()=>a.run('incorrect'),/Invalid arena map/);
 a.run('meadow');a.run('meadow');
 assert.deepEqual(Array.from(a.env.calls),['meadow']);
});
