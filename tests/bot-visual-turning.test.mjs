import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const Motion=require('../src/character-motion.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');

test('bot rotates gradually toward course direction, never teleports heading',()=>{
 let heading=0;
 heading=Motion.turnToward(heading,Math.PI,.05);
 assert.ok(heading>0&&heading<=.501,'bounded max-rate visual turning');
 for(let i=0;i<20;i++)heading=Motion.turnToward(heading,Math.PI,.05);
 assert.ok(Math.abs(heading-Math.PI)<1e-7,'eventually matches desired direction');
});

test('shortest turn across plus/minus pi has no 360 degree whip',()=>{
 const initial=3.13,target=-3.13;
 const heading=Motion.turnToward(initial,target,.05);
 assert.ok(heading>initial,'turn across positive-pi boundary');
 assert.ok(Math.abs(heading-initial)<.1,'tiny seam movement');
});

test('zero delta time or invalid dt cannot cause a sudden turn',()=>{
 for(const dt of [0,-1,NaN,Infinity]){
  assert.equal(Motion.turnToward(.5,-2,dt),.5);
 }
 assert.equal(Motion.turnToward(1.1,1.1,.05),1.1);
});

test('large frame-time hitch and insane rate stay bounded',()=>{
 assert.ok(Motion.turnToward(0,3,10,500)<=1.5);
 assert.equal(Motion.turnToward(0,3,.05,-8),0);
});

test('movement and impact state are untouched by visual-only heading helper',()=>{
 const state=Motion.createState();
 const before=JSON.stringify(state);
 Motion.turnToward(0,1,.05);
 assert.equal(JSON.stringify(state),before);
 assert.match(game,/navigator\.safeAdvance\(botGround, stepDir/);
 assert.match(game,/ArenaCharacterMotion\.turnToward\(/);
 assert.match(game,/Math\.atan2\(stepDir\.x, stepDir\.z\), dt/);
 assert.match(game,/Math\.atan2\(facing\.x, facing\.z\), dt/);
 assert.match(game,/chooseArenaTarget\(bot\)/);
});
