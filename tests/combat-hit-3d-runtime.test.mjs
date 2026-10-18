import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three-r128.js');
const H=require('../src/combat-hit-3d.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const v=(x,y,z)=>new THREE.Vector3(x,y,z);
function botMesh(){
 const root=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(.95,1.25,.78),new THREE.MeshBasicMaterial());
 body.position.y=1.57;body.userData.hitZone='body';root.add(body);
 const head=new THREE.Mesh(new THREE.BoxGeometry(.6,.54,.58),new THREE.MeshBasicMaterial());
 head.position.y=2.56;head.userData.hitZone='head';root.add(head);
 const leftArm=new THREE.Mesh(new THREE.BoxGeometry(.23,.92,.42),new THREE.MeshBasicMaterial());
 leftArm.position.set(-.65,1.6,0);leftArm.userData.hitZone='arm';root.add(leftArm);
 const leg=new THREE.Mesh(new THREE.BoxGeometry(.28,.9,.52),new THREE.MeshBasicMaterial());
 leg.position.set(-.19,.64,0);leg.userData.hitZone='leg';root.add(leg);
 const fakeBlade=new THREE.Mesh(new THREE.BoxGeometry(1,.4,.4),new THREE.MeshBasicMaterial());
 fakeBlade.position.set(1.2,1.8,0);fakeBlade.userData.hitZone='ignore';root.add(fakeBlade);
 return root;
}
test('3D bot raycasts use actual meshes with head/body/arm/leg classifications',()=>{
 const bot=botMesh();
 const origin=v(0,1.8,-12);
 const body=H.resolveBot(THREE,origin,v(0,1.6,0),bot);
 const head=H.resolveBot(THREE,v(0,2.55,-12),v(0,2.55,0),bot);
 const arm=H.resolveBot(THREE,v(-.65,1.6,-12),v(-.65,1.6,0),bot);
 const leg=H.resolveBot(THREE,v(-.19,.66,-12),v(-.19,.66,0),bot);
 assert.deepEqual([body?.zone,head?.zone,arm?.zone,leg?.zone],['body','head','arm','leg']);
 assert.ok(body.distance>11&&body.distance<12);
});
test('world-space miss and weapon-only hits deal no anatomical damage',()=>{
 const bot=botMesh();
 assert.equal(H.resolveBot(THREE,v(2,1.6,-12),v(2,1.6,0),bot),null);
 assert.equal(H.resolveBot(THREE,v(1.2,1.8,-12),v(1.2,1.8,0),bot),null);
 assert.equal(H.resolveBot(THREE,v(0,1,-12),v(0,1,-12),bot),null);
});
test('animation displacement and scale affect ray intersection in actual world space',()=>{
 const bot=botMesh();
 bot.position.set(3,0,0);
 assert.equal(H.resolveBot(THREE,v(0,1.6,-12),v(0,1.6,0),bot),null);
 assert.equal(H.resolveBot(THREE,v(3,1.6,-12),v(3,1.6,0),bot)?.zone,'body');
 bot.scale.set(.5,.5,.5);
 assert.equal(H.resolveBot(THREE,v(3,1.6,-12),v(3,1.6,0),bot),null);
});
test('player invisible FPS rig uses real ray-box intersection, not random zones',()=>{
 const player={pos:v(0,2.35,0),currentHeight:2.35,isSliding:false};
 assert.equal(H.resolvePlayer(THREE,v(0,1.7,-10),v(0,1.7,0),player)?.zone,'body');
 assert.equal(H.resolvePlayer(THREE,v(0,2.76,-10),v(0,2.76,0),player)?.zone,'head');
 assert.equal(H.resolvePlayer(THREE,v(.62,1.7,-10),v(.62,1.7,0),player)?.zone,'arm');
 assert.equal(H.resolvePlayer(THREE,v(-.21,.7,-10),v(-.21,.7,0),player)?.zone,'leg');
 assert.equal(H.resolvePlayer(THREE,v(1.5,1.7,-10),v(1.5,1.7,0),player),null);
});
test('sliding lowers true player hitbox and makes formerly valid high head rays miss',()=>{
 const player={pos:v(0,1.35,0),currentHeight:1.35,isSliding:true};
 assert.equal(H.resolvePlayer(THREE,v(0,1.35,-10),v(0,1.35,0),player)?.zone,'body');
 assert.equal(H.resolvePlayer(THREE,v(0,2.6,-10),v(0,2.6,0),player),null);
});
test('live combat routes AI hit testing to actual geometry and animated ranged pose',()=>{
 assert.match(game,/ArenaCombatHit3D\.resolveBot\(THREE/);
 assert.match(game,/ArenaCombatHit3D\.resolvePlayer\(THREE/);
 assert.match(game,/const hitConfirmed = !!\(hit3d &&/);
 assert.match(game,/if \(!hitConfirmed\) return/);
 assert.match(game,/const zone = isRanged \? hit3d\.zone : 'body'/);
 assert.match(game,/windup: bot\.meleeWindup, rangedWindup: bot\.rangedWindup/);
 assert.ok(html.indexOf('src/combat-hit-3d.js')<html.indexOf('src/oyun.js'));
});
