import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const Motion=require('../src/character-motion.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');

const signals={role:'knight',windup:0,strike:0,guard:false,stagger:0,hit:0};
const almost=(a,b,epsilon=.001)=>Math.abs(a-b)<epsilon;

test('TPS feet advance with traveled distance, not camera frame time',()=>{
 const a=Motion.createState(),b=Motion.createState();
 Motion.update(a,.016,{...signals,travel:.4});
 Motion.update(b,.048,{...signals,travel:.4});
 assert.ok(almost(a.phase,b.phase));
});
test('blocked motion settles gait and does not increase phase',()=>{
 const state=Motion.createState();
 Motion.update(state,.04,{...signals,travel:.3});
 const previous=state.phase;
 for(let i=0;i<25;i++) Motion.update(state,.04,{...signals,travel:0});
 assert.ok(almost(state.phase,previous));
 assert.ok(state.weight<.01);
});
test('sliding bends character without mutating collision position',()=>{
 const state=Motion.createState();
 const pose=Motion.update(state,.04,{...signals,travel:0,sliding:true});
 assert.ok(pose.leftLeg>.4 && pose.rightLeg>.1);
 assert.ok(pose.torsoX>.2 && pose.headX<0);
 assert.ok(!('pos' in pose));
});
test('airborne pose stops ground gait on zero travel',()=>{
 const state=Motion.createState();
 const pose=Motion.update(state,.04,{...signals,travel:0,airborne:true});
 assert.ok(pose.leftLeg<0 && pose.rightLeg>0);
 assert.equal(state.phase,0);
});
test('shield remains up while TPS player slides or jumps',()=>{
 for(const key of ['sliding','airborne']){
  const pose=Motion.update(Motion.createState(),.04,{...signals,guard:true,[key]:true});
  assert.equal(pose.leftArm,-1.25);
 }
});
test('attack pose mixes with distance-driven legs but is visibly separate',()=>{
 const state=Motion.createState();
 const active=Motion.update(state,.04,{...signals,travel:.2,strike:.12});
 const idle=Motion.update(Motion.createState(),.04,{...signals,travel:.2});
 assert.notEqual(active.rightArm,idle.rightArm);
 assert.ok(Number.isFinite(active.leftLeg) && Number.isFinite(active.torsoZ));
});
test('TPS animation uses post-collision actual displacement',()=>{
 const pivot=game.indexOf('const oldTPSX = player.pos.x');
 const collision=game.indexOf('resolvePlayerCollisions(dt);',pivot);
 const dist=game.indexOf('actualGroundTravel = Math.hypot',collision);
 const apply=game.indexOf('applyPlayerTpsMotion(activeModel, dt, safeGroundTravel)',dist);
 assert.ok(pivot>0&&collision>pivot&&dist>collision&&apply>dist);
 assert.match(game,/travel: player.onGround && !player.isSliding \? groundTravel : 0/);
});
test('third-person and bots reuse the same articulated rig blend',()=>{
 assert.match(game,/function blendArticulatedRig\(parts, pose, dt\)/);
 assert.match(game,/blendArticulatedRig\(bot.mesh._parts, pose, dt\)/);
 assert.match(game,/blendArticulatedRig\(model._parts, pose, dt\)/);
 assert.match(game,/ArenaCharacterMotion.update\(player.tpsMotionState, dt/);
});
test('switching cameras, classes and respawning resets TPS motion',()=>{
 assert.match(game,/player.isThirdPerson = !player.isThirdPerson;\s*player.tpsMotionState = ArenaCharacterMotion.createState\(\)/);
 assert.match(game,/window.selectClass = function\(idx\) \{\s*activeWeaponSwing = null;\s*player.tpsMotionState = ArenaCharacterMotion.createState\(\)/);
 assert.match(game,/player.pos.set\(sp.x, sp.y \+ 1.5, sp.z\);\s*player.tpsMotionState = ArenaCharacterMotion.createState\(\)/);
});
test('FPS first-person viewmodels and FFA target selection unchanged',()=>{
 assert.match(game,/const vm = viewmodels\[player.classIdx\]/);
 assert.match(game,/chooseArenaTarget\(bot\)/);
 assert.match(game,/function arenaBotAttack\(bot, target, targetDistance\)/);
 assert.match(game,/if \(player.isThirdPerson && playerCharGroup\)/);
 assert.match(game,/else \{\s*camera.position.copy\(player.pos\)/);
});
