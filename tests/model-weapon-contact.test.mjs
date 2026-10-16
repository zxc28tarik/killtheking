import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three-r128.js');
const M=require('../src/model-weapon-contact.js');
const W=require('../src/weapon-sweep.js');
const actor={x:0,y:1.5,z:0},forward={x:0,y:0,z:-1},right={x:1,y:0,z:0};
const proxy=(kind,grip,tip,reach=6)=>M.proxy({kind,reach,origin:actor,forward,right,grip,tip});

test('actual transformed sword model tip drives attack direction',()=>{
 const group=new THREE.Group(),tip=new THREE.Object3D(),grip=new THREE.Object3D();
 tip.position.set(.34,1.15,-.64);grip.position.set(.34,-.05,-.64);group.add(tip,grip);
 const x=[];
 for(const p of [.2,.8]){
   const visual=W.visualPose('sword',0,p);
   group.rotation.set(-.22+visual.rotationX,0,.08+visual.rotationZ);
   group.position.z=visual.offsetZ;group.updateMatrixWorld(true);
   const a=tip.getWorldPosition(new THREE.Vector3()),b=grip.getWorldPosition(new THREE.Vector3());
   x.push(proxy('sword',b,a,5.5).point.x);
 }
 assert.ok(x[0]<x[1]);
});
test('model spear thrust reaches original gameplay range at visible peak',()=>{
 const a=proxy('spear',{x:.32,y:-.2,z:-.64},{x:.32,y:-.2,z:-2.59},8.2);
 const b=proxy('spear',{x:.32,y:-.2,z:-1.36},{x:.32,y:-.2,z:-3.31},8.2);
 assert.ok(a.distance<b.distance);
 assert.equal(b.distance,8.2);
});
test('physical sword swing tilt shifts hit arc but cannot enlarge reach',()=>{
 const left=proxy('sword',{x:.4,y:0,z:-.7},{x:-.12,y:1,z:-1.5},5.5);
 const rightArc=proxy('sword',{x:.4,y:0,z:-.7},{x:.75,y:1,z:-1.5},5.5);
 assert.ok(left.point.x<rightArc.point.x);
 assert.ok(left.distance<=5.5 && rightArc.distance<=5.5);
});
test('model contact begins during active window and has one hit maximum',()=>{
 const swing=W.begin('sword',5.5),model={origin:actor,point:{x:0,y:1.5,z:-5}};
 const bot={kind:'bot',bot:{id:3}};
 let calls=0;
 assert.equal(M.advance(swing,.01,model,()=>{calls++;return bot;}),null);
 assert.equal(calls,0);
 assert.equal(M.advance(swing,.04,model,()=>{calls++;return bot;})?.bot.id,3);
 assert.equal(M.advance(swing,.04,model,()=>bot),null);
});
test('world obstruction on moving-tip bridge blocks later damage',()=>{
 const swing=W.begin('spear',8.2);
 M.advance(swing,.05,{origin:actor,point:{x:0,y:1.5,z:-4}},()=>null);
 let calls=0;
 const result=M.advance(swing,.03,{origin:actor,point:{x:0,y:1.5,z:-8}},()=>{
   calls++;return calls===1?{kind:'world'}:{kind:'bot',bot:{id:1}};
 });
 assert.equal(result,null);
 assert.equal(calls,1);
});
test('model-tip movement crosses a fighter between animation frames',()=>{
 const swing=W.begin('sword',5.5);
 M.advance(swing,.05,{origin:actor,point:{x:-2,y:1.5,z:-4}},()=>null);
 let traversals=0;
 const hit=M.advance(swing,.02,{origin:actor,point:{x:2,y:1.5,z:-4}},(a,b)=>{
   if(a.x===-2 && b.x===2){traversals++;return {kind:'bot',bot:{id:4}};}
   return null;
 });
 assert.equal(traversals,1);
 assert.equal(hit?.bot.id,4);
});
test('invalid kind, missing tip or invalid reach produce no proxy',()=>{
 assert.equal(proxy('sword',null,{x:0,y:0,z:0}),null);
 assert.equal(proxy('bow',{x:0},{x:0}),null);
 assert.equal(proxy('spear',{x:0},{x:0},-3),null);
});
test('game integration uses actual grip and tip for FPS and old TPS sweep',()=>{
 const src=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(src,/visualWeaponGripMarkers\[0\] = swordVisualGrip/);
 assert.match(src,/visualWeaponGripMarkers\[1\] = spearVisualGrip/);
 assert.match(src,/camera\.worldToLocal\(marker\.getWorldPosition\(new THREE\.Vector3\(\)\)\)/);
 assert.match(src,/ArenaModelWeaponContact\.proxy\(/);
 assert.match(src,/ArenaModelWeaponContact\.advance\(swing, dt/);
 assert.match(src,/ArenaWeaponSweep\.advance\(swing, dt, castSegment/);
 assert.ok(html.indexOf('src/model-weapon-contact.js')<html.indexOf('src/oyun.js'));
});
