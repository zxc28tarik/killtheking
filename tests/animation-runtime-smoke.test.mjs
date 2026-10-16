import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
function sourceFunction(name, following) {
 const start=source.indexOf('function '+name+'(');
 const end=source.indexOf('function '+following+'(',start);
 assert.ok(start>0 && end>start, 'Missing function: '+name);
 return source.slice(start,end).trim();
}
const blend=vm.runInNewContext('('+sourceFunction('blendArticulatedRig','applyPlayerTpsMotion')+')',{
 THREE:{MathUtils:{lerp:(a,b,t)=>a+(b-a)*t}}
});
const rotation=()=>({rotation:{x:0,z:0}});
function rig(){return {leftLeg:rotation(),rightLeg:rotation(),leftArm:rotation(),rightArm:rotation(),torso:rotation(),head:rotation(),capeMesh:rotation()};}
const pose={leftLeg:.4,rightLeg:-.4,leftArm:-.8,rightArm:-1,torsoX:.2,torsoZ:.08,headX:-.2,capeX:.45};

test('runtime: blendArticulatedRig evaluates its pose (not an undefined state)',()=>{
 const parts=rig();
 assert.doesNotThrow(()=>blend(parts,pose,.04));
 assert.ok(parts.leftLeg.rotation.x>0 && parts.rightLeg.rotation.x<0);
 assert.ok(parts.torso.rotation.x>0 && parts.capeMesh.rotation.x>0);
});
test('runtime: bot animator feeds pose into the shared rig blender',()=>{
 const botFn=vm.runInNewContext('('+sourceFunction('applyBotMotion','updateGame')+')',{
 ArenaCharacterMotion:{update:()=>pose},
 blendArticulatedRig:blend,
 Math
 });
 const bot={mesh:{_parts:rig()},motionState:{},role:'knight',meleeWindup:0,strikePoseTime:.1,guardTime:0,staggerTime:0,hitReactionTime:0};
 assert.doesNotThrow(()=>botFn(bot,.03,.2));
 assert.ok(bot.mesh._parts.leftLeg.rotation.x>0);
 assert.ok(bot.strikePoseTime<.1);
});
test('runtime: TPS animation passes computed pose into shared blender',()=>{
 const src=sourceFunction('applyPlayerTpsMotion','applyBotMotion');
 const fn=vm.runInNewContext('('+src+')',{
 ArenaCharacterMotion:{update:()=>pose},
 blendArticulatedRig:blend,
 CLASSES:[{type:'melee'}],
 player:{classIdx:0,attackAnimTime:.2,tpsMotionState:{},onGround:true,isSliding:false,isShielding:false},
 Math
 });
 const model={_parts:rig()};
 assert.doesNotThrow(()=>fn(model,.03,.15));
 assert.ok(model._parts.leftLeg.rotation.x>0);
});
