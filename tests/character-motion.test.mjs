import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const M=require('../src/character-motion.js');
const near=(a,b,eps=.001)=>Math.abs(a-b)<eps;
const signals={role:'knight',windup:0,strike:0,guard:false,stagger:0,hit:0};
test('gait advances with distance, not time spent running against wall',()=>{
 const s=M.createState();
 M.update(s,.05,{...signals,travel:.36});
 assert.ok(near(s.phase,.936));
 const fixed=s.phase;
 M.update(s,.05,{...signals,travel:0});
 assert.ok(near(s.phase,fixed));
});
test('motion blend returns to idle smoothly when fighter stops',()=>{
 const s=M.createState();
 for(let n=0;n<8;n++)M.update(s,.05,{...signals,travel:.3});
 assert.ok(s.weight>.7);
 for(let n=0;n<20;n++)M.update(s,.05,{...signals,travel:0});
 assert.ok(s.weight<.01);
});
test('opposing legs create complementary step phases',()=>{
 const s=M.createState(1);
 const p=M.update(s,.04,{...signals,travel:.2});
 assert.ok(p.leftLeg*p.rightLeg<=0);
 assert.ok(near(p.leftLeg,-p.rightLeg));
});
test('shield guard overrides walking left arm',()=>{
 const s=M.createState();
 assert.equal(M.update(s,.04,{...signals,travel:.2,guard:true}).leftArm,-1.25);
});
test('melee windup and strike generate distinct readable poses',()=>{
 const s=M.createState();
 const initial=M.update(s,.03,{...signals,windup:.36});
 const ready=M.update(s,.03,{...signals,windup:.015});
 const strike=M.update(s,.03,{...signals,strike:.12});
 assert.ok(ready.rightArm<initial.rightArm);
 assert.ok(strike.rightArm>ready.rightArm);
});
test('stagger damps stepping and reacts in torso',()=>{
 const a=M.createState(),b=M.createState();
 const normal=M.update(a,.05,{...signals,travel:.3});
 const stunned=M.update(b,.05,{...signals,travel:.3,stagger:.3});
 assert.ok(Math.abs(stunned.leftLeg)<Math.abs(normal.leftLeg));
 assert.ok(stunned.torsoX>normal.torsoX);
});
test('hit layer moves head and torso without touching actor position',()=>{
 const state=M.createState();
 const p=M.update(state,.05,{...signals,hit:.2});
 assert.ok(p.headX>.05);
 assert.ok(p.torsoX<0);
});
test('death pose is bounded and fall direction matters',()=>{
 const pose=M.deathPose(1,-1);
 assert.ok(Math.abs(pose.leftLeg)<1 && pose.torsoZ<0);
 assert.equal(M.deathPose(0).leftLeg,0);
 assert.ok(Number.isFinite(pose.rightArm));
});
test('game updates existing articulated rig and maintains script order',()=>{
 const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(game,/ArenaCharacterMotion\.createState/);
 assert.match(game,/ArenaCharacterMotion\.update\(bot\.motionState/);
 assert.match(game,/ArenaCharacterMotion\.deathPose/);
 assert.match(game,/animationTravel = madeProgress/);
 assert.match(game,/applyBotMotion\(bot, dt, animationTravel, travelSlope\)/);
 assert.ok(html.indexOf('src/character-motion.js')<html.indexOf('src/oyun.js'));
});
