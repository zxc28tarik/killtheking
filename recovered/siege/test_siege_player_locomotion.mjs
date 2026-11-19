import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const map=require('./siege-map.js'),rules=require('./siege-objectives.js');
const traversal=require('./siege-traversal.js');
const movement=require('./siege-player-locomotion.js');
function runAt(start={x:0,y:0,z:-110},scenario=rules.createScenario()){
 const ctrl=movement.create();ctrl.reset(start);let p={...start};
 return {ctrl,scenario,get pos(){return p;},
  step(keys={},dt=.05,yaw=0,enabled=true){
   const result=ctrl.step({position:p,yaw,keys,dt,
     spec:map.spec,scenario,traversal,enabled});
   p=result.position;return result;
  }};
}
test('Arena-style constants retained, no shared FFA simulation claim',()=>{
 assert.equal(movement.GRAVITY,30);
 assert.equal(movement.JUMP_SPEED,12.6);
 assert.equal(movement.HOP_MAX,6.5);
 assert.equal(movement.create().snapshot().fullArenaPhysicsShared,false);
});
test('Space initiates real jump and player lands without changing siege FSM',()=>{
 const a=runAt();let peak=0;
 for(let i=0;i<45;i++){
  const r=a.step(i===0?{Space:true}:{});
  peak=Math.max(peak,r.position.y);
  assert.equal(traversal.overlaps(r.position,map.spec,a.scenario),false);
 }
 assert(peak>2&&peak<3.1);
 assert.equal(a.pos.y,0);
 assert.equal(a.ctrl.snapshot().jumpCount,1);
 assert.equal(a.scenario.gate.hp,600);
});
test('holding Space for multiple seconds does not auto-rejump',()=>{
 const a=runAt();
 for(let i=0;i<45;i++)a.step({Space:true});
 assert.equal(a.ctrl.snapshot().jumpCount,1);
 a.step({});
 a.step({Space:true});
 assert.equal(a.ctrl.snapshot().jumpCount,2);
});
test('Shift slide and slide-hop increase momentum but cap at 6.5',()=>{
 const a=runAt();
 for(let i=0;i<8;i++)a.step({ShiftLeft:true,KeyW:true});
 assert.equal(a.ctrl.snapshot().sliding,true);
 a.step({ShiftLeft:true,KeyW:true,Space:true});
 assert.equal(a.ctrl.snapshot().jumpCount,1);
 assert(a.ctrl.snapshot().hop>=1.4&&a.ctrl.snapshot().hop<=6.5);
 for(let i=0;i<45;i++)a.step({KeyW:true});
 assert.equal(a.ctrl.snapshot().grounded,true);
 assert.equal(a.ctrl.snapshot().sliding,false);
});
test('closed main gate cannot be hopped over or tunneled through',()=>{
 const a=runAt({x:0,y:0,z:-49});
 for(let i=0;i<105;i++){
  const r=a.step({KeyW:true,ShiftLeft:true,...(i===0?{Space:true}:{})});
  assert.equal(traversal.overlaps(r.position,map.spec,a.scenario),false);
  assert(r.position.z<=-42.5-traversal.RADIUS+.0001);
 }
});
test('open gate allows movement but lateral solid wall stays blocked',()=>{
 const scenario=rules.createScenario();
 for(let i=0;i<4;i++)rules.applyEvent(scenario,
   {type:'GATE_HIT',team:'red',weapon:'ram',damage:150});
 const a=runAt({x:0,y:0,z:-49},scenario);
 for(let i=0;i<55;i++)a.step({KeyW:true});
 assert(a.pos.z>-39);
 const b=runAt({x:-59,y:0,z:-9},scenario);
 for(let i=0;i<55;i++)b.step({KeyD:true});
 assert(b.pos.x<=-54.5-traversal.RADIUS+.0001);
});
test('dead player movement disabled, drift and jump velocity cleared',()=>{
 const a=runAt();a.step({Space:true});
 const before={...a.pos};
 const v=a.step({Space:true,KeyW:true},.05,0,false);
 assert.deepEqual(v.position,before);
 assert.equal(v.movement.vy,0);
 assert.equal(v.movement.vx,0);
});
test('bad frame time and NaN yaw fail safely',()=>{
 const a=runAt();
 assert.throws(()=>a.step({},NaN),/Invalid S3D2/);
 assert.throws(()=>a.step({},.3),/Invalid S3D2/);
 assert.throws(()=>a.step({},.05,NaN),/Invalid S3D2/);
 assert.equal(a.scenario.gate.hp,600);
});
