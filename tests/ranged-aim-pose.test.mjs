import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const Motion=require('../src/character-motion.js');
const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');

test('archer ranged preparation animates both arms without melee sword pose',()=>{
 const state=Motion.createState();
 const start=Motion.update(state,.02,{role:'archer',travel:0,windup:0,rangedWindup:.28,strike:0});
 const later=Motion.update(state,.02,{role:'archer',travel:0,windup:0,rangedWindup:.06,strike:0});
 assert.ok(start.leftArm<-.9&&start.rightArm< -1.0);
 assert.ok(later.leftArm<start.leftArm,'bow arm should raise through aiming');
 assert.ok(later.rightArm<start.rightArm,'string hand prepares through aiming');
 assert.ok(Number.isFinite(later.torsoX));
});
test('musket aiming uses separate loading/aiming posture and leaves legs complementary',()=>{
 const state=Motion.createState();
 const p=Motion.update(state,.05,{role:'musket',travel:.3,rangedWindup:.20,windup:0});
 assert.ok(p.leftArm<-.85&&p.rightArm< -1.32);
 assert.ok(Math.abs(p.leftLeg+p.rightLeg)<1e-9);
});
test('melee guard, stagger and hit reactions remain intact after ranged poses',()=>{
 const state=Motion.createState();
 const p=Motion.update(state,.03,{role:'knight',windup:.2,guard:true,hit:.18,stagger:.22});
 assert.equal(p.leftArm,-1.25);
 assert.ok(Number.isFinite(p.rightArm)&&Number.isFinite(p.torsoX));
});
test('animation uses actual ranged windup and never changes movement or collisions',()=>{
 assert.match(source,/windup: bot\.meleeWindup, rangedWindup: bot\.rangedWindup/);
 assert.match(source,/ArenaCharacterMotion\.update\(bot\.motionState/);
 assert.match(source,/navigator\.safeAdvance\(botGround, stepDir/);
});
