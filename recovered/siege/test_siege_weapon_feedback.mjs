/** S3D2b cosmetics must be source-isolated from native G5.4 HP, balance and hits. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const THREE=require('../../vendor/three-r128.js');
const feedback=require('./siege-weapon-feedback.js');
function fixture(){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,1,.1,900);
 const view=feedback.create({THREE,scene,camera});
 const status=(overrides={})=>({
  weapon:'sword',view:'fps',playerHealth:100,
  pendingBowDrawSeconds:0,receivedNativeHits:0,...overrides
 });
 return {scene,camera,view,status};
}
test('four specific real Three.js camera viewmodels, zero synthetic projectiles',()=>{
 const {scene,camera,view,status}=fixture();
 assert.equal(camera.parent,scene);
 const root=camera.getObjectByName('S3D2b_RealCameraFirstPersonWeapons');
 assert(root?.isGroup);
 assert.equal(root.children.length,4);
 for(const role of ['sword','spear','bow','musket']){
  const g=root.getObjectByName('S3D2b_'+role+'_model');
  assert(g?.isGroup&&g.children.length>=8);
  assert(g.children.every(x=>x.isMesh));
 }
 view.update(.016,status());
 assert.equal(root.visible,true);
 assert.equal(view.status().modelCount,4);
 assert.equal(view.status().fakeProjectilesCreated,0);
 assert.equal(view.status().damageOrCooldownRulesModified,false);
 assert.equal(view.status().sameArenaViewmodelSource,false);
});
test('real native shot creates cosmetic recoil; a cooldown never creates a fake shot',()=>{
 const {view,status}=fixture();
 view.update(.016,status());
 view.consume({weapon:'sword',status:'miss',hit:false});
 assert.equal(view.status().nativeShotFeedbackEvents,1);
 assert.equal(view.status().nativeHitMarkers,0);
 view.consume({weapon:'sword',status:'cooldown',hit:false});
 view.consume({weapon:'bow',status:'bow-not-ready',hit:false});
 view.consume({weapon:'sword',status:'unsupported-height',hit:false});
 assert.equal(view.status().nativeShotFeedbackEvents,1);
 assert.equal(view.status().nativeHitMarkers,0);
 view.consume({weapon:'sword',status:'hit',hit:true,damage:20,zone:'body'});
 assert.equal(view.status().nativeShotFeedbackEvents,2);
 assert.equal(view.status().nativeHitMarkers,1);
});
test('fake hit flags with no positive native damage cannot produce hit markers',()=>{
 const {view}=fixture();
 for(const result of [
  {weapon:'musket',status:'hit',hit:false,damage:0},
  {weapon:'musket',status:'hit',hit:true,damage:0},
  {weapon:'musket',status:'friendly-block',hit:false},
  {weapon:'bow',status:'bow-not-ready',hit:false},
 ]){
  view.consume(result);
 }
 assert.equal(view.status().nativeHitMarkers,0);
 assert.equal(view.status().fakeProjectilesCreated,0);
 assert.equal(view.status().nativeShotFeedbackEvents,3);
});
test('bow draw tracks actual native elapsed seconds, class switch affects mesh only',()=>{
 const {camera,view,status}=fixture();
 view.select('bow');
 const a=view.update(.05,status({weapon:'bow',pendingBowDrawSeconds:2.1}));
 assert(Math.abs(a.drawVisualCharge-.7)<.001);
 assert.equal(a.visibleWeapon,'bow');
 assert.equal(camera.getObjectByName('S3D2b_bow_model').visible,true);
 assert.equal(camera.getObjectByName('S3D2b_sword_model').visible,false);
 view.select('musket');
 view.update(.05,status({weapon:'musket',pendingBowDrawSeconds:0}));
 assert.equal(view.status().visibleWeapon,'musket');
 assert.equal(camera.getObjectByName('S3D2b_musket_model').visible,true);
});
test('orbit, TPS and dead native G5.4 player hide first-person weapon; damage flash counts genuine hits',()=>{
 const {camera,view,status}=fixture();
 const root=camera.getObjectByName('S3D2b_RealCameraFirstPersonWeapons');
 view.update(.016,status({view:'orbit'}));
 assert.equal(root.visible,false);
 view.update(.016,status({view:'fps',receivedNativeHits:0}));
 view.update(.016,status({view:'fps',receivedNativeHits:2}));
 assert.equal(view.status().nativeReceivedDamagePulses,2);
 view.update(.016,status({view:'tps',receivedNativeHits:2}));
 assert.equal(root.visible,false);
 view.update(.016,status({view:'fps',playerHealth:0,receivedNativeHits:2}));
 assert.equal(root.visible,false);
 view.reset('sword');
 assert.equal(view.status().nativeReceivedDamagePulses,0);
 assert.equal(view.status().nativeHitMarkers,0);
});
test('invalid class and nonnative result cannot create cosmetic effects',()=>{
 const {view,status}=fixture();
 assert.throws(()=>view.select('bomb'),/Unsupported/);
 assert.throws(()=>view.consume({weapon:'sword'}),/Only native/);
 assert.throws(()=>view.update(NaN,status()),/Invalid genuine/);
 assert.throws(()=>view.update(.22,status()),/Invalid genuine/);
 assert.equal(view.status().nativeShotFeedbackEvents,0);
});
