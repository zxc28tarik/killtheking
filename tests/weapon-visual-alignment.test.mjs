import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three-r128.js');
const sweep=require('../src/weapon-sweep.js');

test('sword rendered tilt agrees with contact lateral direction',()=>{
 for(const side of [0,1])for(const progress of [.2,.8]){
  const visual=sweep.visualPose('sword',side,progress);
  const trace=sweep.pose('sword',5,side,progress);
  assert.equal(Math.sign(-visual.rotationZ),Math.sign(trace.x));
  assert.ok(Math.abs(visual.rotationZ)>.05);
 }
});
test('viewmodel swing rests at both endpoints',()=>{
 for(const side of [0,1])for(const progress of [0,1]){
  const visual=sweep.visualPose('sword',side,progress);
  assert.ok(Math.abs(visual.rotationX)<1e-7);
  assert.ok(Math.abs(visual.rotationZ)<1e-7);
  assert.ok(Math.abs(visual.offsetZ)<1e-7);
 }
});
test('actual model-space sword tip follows contact sweep left-to-right',()=>{
 const group=new THREE.Group(),marker=new THREE.Object3D();
 marker.position.set(.34,1.15,-.64);group.add(marker);
 function x(progress){
  group.rotation.z=sweep.visualPose('sword',0,progress).rotationZ;
  group.updateMatrixWorld(true);
  return marker.getWorldPosition(new THREE.Vector3()).x;
 }
 assert.ok(x(.2)<x(.8));
 assert.ok(sweep.pose('sword',5,0,.2).x<sweep.pose('sword',5,0,.8).x);
});
test('spear thrust model offset and contact length peak together',()=>{
 const visualStart=sweep.visualPose('spear',0,0).offsetZ;
 const visualMid=sweep.visualPose('spear',0,.5).offsetZ;
 const visualEnd=sweep.visualPose('spear',0,1).offsetZ;
 assert.ok(visualMid<visualStart);
 assert.ok(visualMid<visualEnd);
 assert.ok(sweep.pose('spear',8,0,.5).z<sweep.pose('spear',8,0,0).z);
});
test('visual model pose uses the shared 0.82-second attack fraction',()=>{
 const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 assert.match(source,/ArenaWeaponSweep\.visualPose\('sword', activeWeaponSwing\.side, phase\)/);
 assert.match(source,/ArenaWeaponSweep\.visualPose\('spear', activeWeaponSwing\.side, phase\)/);
 assert.match(source,/1 - player\.attackAnimTime \/ 0\.82/);
});
test('visual tip anchors are geometry-only invisible markers',()=>{
 const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 assert.match(source,/const swordVisualTip = new THREE\.Object3D\(\)/);
 assert.match(source,/visualWeaponTipMarkers\[0\] = swordVisualTip/);
 assert.match(source,/const spearVisualTip = new THREE\.Object3D\(\)/);
 assert.match(source,/visualWeaponTipMarkers\[1\] = spearVisualTip/);
 assert.match(source,/marker\.getWorldPosition\(new THREE\.Vector3\(\)\)/);
 assert.match(source,/visualWeaponTip:/);
});
test('attack damage and free-for-all combat remain unchanged',()=>{
 const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 assert.match(source,/ArenaWeaponSweep\.advance\(swing, dt,/);
 assert.match(source,/damageBot\(impact\.bot, damage, zone === 'head', swing\.weaponName/);
 assert.match(source,/chooseArenaTarget\(bot\)/);
});
