import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three-r128.js');
const W=require('../src/weapon-balance.js');
const AI=require('../src/arena-bot-offense.js');
const Motion=require('../src/character-motion.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=game.indexOf('        function releaseChargedBow() {');
const end=game.indexOf('        function startReload()',start);
assert.ok(start>0&&end>start,'Cannot isolate real arrow release');
const source=game.slice(start,end);
function setup({clock=2,draw=2,last=-Infinity,playing=true}={}){
 const arrows=[],model=[];
 const elements=new Map();
 const get=id=>{
  if(!elements.has(id))elements.set(id,{classList:{add(){}},textContent:''});
  return elements.get(id);
 };
 const player={isDrawingBow:true,bowDrawSeconds:draw,
  bowCharge:W.bowStrength(draw),lastBowShotAt:last,
  attackCooldown:0,attackAnimTime:0};
 const ctx={
  player,arenaClock:clock,arenaMatch:{phase:playing?'playing':'paused'},
  isGameActive:playing,ArenaWeaponBalance:W,
  document:{getElementById:get},registerWeaponSwing:()=>{},
  sfx:{playBowRelease(){}},THREE,
  camera:{position:new THREE.Vector3(),quaternion:new THREE.Quaternion()},
  scene:{add:thing=>model.push(thing)},
  arrows,goldMat:new THREE.MeshBasicMaterial(),
  steelMat:new THREE.MeshBasicMaterial()
 };
 vm.createContext(ctx);
 const release=vm.runInContext('('+source+')',ctx);
 return {release,ctx,player,arrows,model,elements};
}

test('two seconds minimum draw, three seconds full strength, exactly one second recovery',()=>{
 assert.equal(W.BOW_RECOVERY_SECONDS,1);
 assert.equal(W.BOW_MIN_DRAW_SECONDS,2);
 assert.equal(W.BOW_DRAW_SECONDS,3);
 assert.equal(W.SHOT_INTERVAL.bow,4);
 assert.equal(W.bowCanDraw(10,10.999),false);
 assert.equal(W.bowCanDraw(10,11),true);
 assert.equal(W.bowCanRelease(-Infinity,1.999,1.999),false);
 assert.equal(W.bowCanRelease(-Infinity,2,2),true);
 assert.equal(W.bowStrength(2),2/3);
 assert.equal(W.bowStrength(3),1);
});
test('global 15/min max is absorbed into drawing instead of extra post-shot idle',()=>{
 assert.equal(W.bowCanDraw(10,11),true);
 assert.equal(W.bowCanRelease(10,13,2),false);
 assert.equal(W.bowReleaseWait(10,13,2),1);
 assert.equal(W.bowCanRelease(10,14,3),true);
 assert.equal(W.bowReleaseWait(10,14,3),0);
 assert.equal(W.ready(10,13.999,'bow'),false);
 assert.equal(W.ready(10,14,'bow'),true);
 assert.equal(60/W.SHOT_INTERVAL.bow,15);
});
test('real game release refuses an under-two-second draw without firing or lockout',()=>{
 const x=setup({clock:1.999,draw:1.999});
 x.release();
 assert.equal(x.arrows.length,0);
 assert.equal(x.player.isDrawingBow,false);
 assert.equal(x.player.bowDrawSeconds,0);
 assert.equal(x.player.lastBowShotAt,-Infinity);
 assert.equal(x.player.attackCooldown,0);
});
test('the actual release function spawns a bow arrow at two seconds, recovery only one',()=>{
 const x=setup({clock:2,draw:2});
 x.release();
 assert.equal(x.arrows.length,1);
 assert.equal(x.player.lastBowShotAt,2);
 assert.equal(x.player.attackCooldown,1);
 assert.equal(x.player.bowDrawSeconds,0);
 assert.ok(Math.abs(x.arrows[0].charge-2/3)<1e-8);
 assert.ok(x.arrows[0].vel.length()>60);
});
test('after 1s recovery draw can begin, premature second release never fires',()=>{
 const x=setup({clock:5,draw:2,last:2});
 x.release();
 assert.equal(x.arrows.length,0);
 assert.equal(x.player.lastBowShotAt,2);
 const y=setup({clock:6,draw:3,last:2});
 y.release();
 assert.equal(y.arrows.length,1);
 assert.equal(y.arrows[0].charge,1);
 assert.equal(y.player.attackCooldown,1);
});
test('paused game cannot release a stored arrow and cannot fire after focus loss',()=>{
 const x=setup({clock:4,draw:3,playing:false});
 x.release();
 assert.equal(x.arrows.length,0);
 assert.equal(x.player.lastBowShotAt,-Infinity);
 assert.match(game,/window\.addEventListener\('blur',[\s\S]*?player\.bowDrawSeconds = 0/);
 assert.match(game,/document\.addEventListener\('pointerlockchange',[\s\S]*?player\.bowDrawSeconds = 0/);
});
test('bot archer draws three seconds, spends only one second on post-shot recovery',()=>{
 assert.equal(AI.windup('archer'),3);
 assert.equal(AI.windup('musket'),.36);
 assert.match(game,/bot\.role === 'archer'\s*\? ArenaWeaponBalance\.BOW_RECOVERY_SECONDS/);
 assert.match(game,/bot\.rangedWindup = ArenaBotOffense\.windup\(bot\.role\)/);
 const initial=Motion.update(Motion.createState(),.03,{
  role:'archer',travel:0,rangedWindup:3});
 const halfway=Motion.update(Motion.createState(),.03,{
  role:'archer',travel:0,rangedWindup:1.5});
 assert.ok(halfway.leftArm<initial.leftArm);
 assert.ok(halfway.rightArm<initial.rightArm);
});
test('bow state resets on class swap and replay; rules apply to both FFA and TDM',()=>{
 assert.match(game,/player\.bowDrawSeconds = 0/);
 assert.match(game,/player\.lastBowShotAt = -Infinity/);
 assert.match(game,/ArenaWeaponBalance\.bowCanDraw\(player\.lastBowShotAt,arenaClock\)/);
 assert.match(game,/ArenaWeaponBalance\.bowCanRelease\(/);
 assert.match(game,/player\.attackCooldown = ArenaWeaponBalance\.BOW_RECOVERY_SECONDS/);
 assert.match(html,/İlk 2 saniye atış yok/);
 assert.match(game,/let arenaMode = 'ffa'/);
 assert.match(game,/ArenaTeams\.scores\(arenaMode,player,bots\)/);
});
