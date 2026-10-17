import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const {createNavigator}=require('../src/arena-navigation.js');

const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const match=source.match(/function applyBotWorldKnockback\(bot, direction, distance\) \{[\s\S]*?\n        \}/);
assert.ok(match, 'missing bot impulse collision helper');
const wall=(x1,x2,z1,z2)=>({minX:x1,maxX:x2,minY:0,maxY:8,minZ:z1,maxZ:z2});
function makeTestArena(colliders=[wall(4.9,5.1,-5,5)]){
 const navigator=createNavigator(colliders,[],{min:-15,max:15,step:1.25,upperEdge:100,upperLevel:7});
 const move=vm.runInNewContext('('+match[0]+')',{navigator,Math});
 const bot=(x,z,y=0)=>({mesh:{position:{x,z,y}},navPath:[{x:8,z:8}],
   navGoal:{x:8,z:8},navRefresh:1,navStuck:.4,tacticRefresh:2});
 return {navigator,move,bot};
}
test('shield-bash-strength impulse never pushes bot into or through wall',()=>{
 const {navigator,move,bot}=makeTestArena();
 const b=bot(2.5,0);
 const traveled=move(b,{x:1,z:0},4.5);
 assert.ok(traveled>0&&traveled<4.5);
 assert.ok(b.mesh.position.x<=4.9-.67+.0001);
 assert.equal(navigator.walkableAt(b.mesh.position.x,b.mesh.position.z,0),true);
});
test('strike knockback slides along wall and can move around a wall end',()=>{
 const {navigator,move,bot}=makeTestArena();
 const b=bot(2.5,0);
 move(b,{x:1,z:1},7);
 assert.ok(b.mesh.position.z>0);
 assert.equal(navigator.walkableAt(b.mesh.position.x,b.mesh.position.z,0),true);
});
test('all direct knockback paths are routed through safe bot movement',()=>{
 const needle='mesh.position.addScaledVector(';
 const unsafe=[...source.matchAll(/(?:bot|victim)\.mesh\.position\.addScaledVector\(/g)];
 assert.equal(unsafe.length,0);
 assert.match(source,/applyBotWorldKnockback\(bot, knock, lethal \? 0\.35 : 0\.16\)/);
 assert.match(source,/applyBotWorldKnockback\(victim, delta, lethal \? 0\.34 : 0\.14\)/);
 assert.match(source,/applyBotWorldKnockback\(bot, forward, 4\.5\)/);
});
test('valid impulses invalidate stale navigation goals and refresh paths',()=>{
 const {move,bot}=makeTestArena([]);
 const b=bot(0,0);
 const amount=move(b,{x:1,z:0},1.3);
 assert.ok(Math.abs(amount-1.3)<1e-6);
 assert.equal(b.navPath.length,0);
 assert.equal(b.navGoal,null);
 assert.equal(b.navRefresh,0);
 assert.equal(b.tacticRefresh,0);
});
test('zero length and zero-distance hits do not change bot location',()=>{
 const {move,bot}=makeTestArena([]);
 const b=bot(1,1);
 assert.equal(move(b,{x:0,z:0},4.5),0);
 assert.equal(move(b,{x:1,z:0},0),0);
 assert.deepEqual([b.mesh.position.x,b.mesh.position.z],[1,1]);
 assert.equal(b.navPath.length,1);
});
test('all six bots may be knocked near battlements without solid overlap',()=>{
 const solids=[wall(-4,-3,-14,14),wall(3,4,-14,14),wall(-14,14,6,7)];
 const {navigator,move,bot}=makeTestArena(solids);
 const starts=[[-5.5,0],[-5.5,4],[5.5,0],[5.5,4],[0,2],[0,-1]];
 for(const [x,z] of starts){
  const b=bot(x,z);if(!navigator.walkableAt(x,z,0))continue;
  for(const direction of [{x:1,z:0},{x:-1,z:0},{x:1,z:1},{x:0,z:1}]){
   move(b,direction,4.5);
   assert.equal(navigator.walkableAt(b.mesh.position.x,b.mesh.position.z,0),true);
  }
 }
});
