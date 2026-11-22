/** AK-03b original G5.4 input and real siege 3D camera/weapon contract. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const input=require('../army/modules/shared-g54-player-input.js');
const movement=require('./siege-player-locomotion.js');
const map=require('./siege-map.js');
const traversal=require('./siege-traversal.js');
const objectives=require('./siege-objectives.js');
const bridgeAPI=require('./siege-real-army-bridge.js');
const combatAPI=require('./siege-player-combat.js');
const sessionAPI=require('../army/modules/shared-g54-battle-session.js');
const src=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const weapon=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const c=vm.createContext({console});vm.runInContext(weapon,c,{timeout:3000});
vm.runInContext(src,c,{timeout:3000});
const native=c.ArenaArmyBattle,W=c.ArenaWeaponBalance;
const near=(a,b,eps=1e-9)=>assert(Math.abs(a-b)<eps,String(a)+' != '+String(b));
function castle(){
 const b=bridgeAPI.create({armyEngine:native,map,objectives,
  traversal,playerTeam:'red',seed:1600});
 const session=sessionAPI.create({engine:native,state:b.state,
  mode:'siege',scenario:b.scenario,playerTeam:'red'});
 return {b,session};
}
test('AK-03b SHA-pinned original G5.4 and authentic 140 soldiers remain unchanged',()=>{
 assert.equal(createHash('sha256').update(src).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 const {b}=castle();
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.squads.length,8);
});
test('field-style WASD uses original directional axes',()=>{
 for(const [keys,forward,side]of [
  [{KeyW:true},1,0],[{KeyS:true},-1,0],
  [{KeyA:true},0,-1],[{KeyD:true},0,1],[{},0,0]]){
  const a=input.movementAxes(keys);
  near(a.forward,forward);near(a.side,side);
 }
});
test('diagonal movement normalized; opposing pressed keys cancel each other',()=>{
 const a=input.movementAxes({KeyW:true,KeyD:true});
 near(Math.hypot(a.forward,a.side),1);
 near(a.forward,a.side);
 assert.equal(input.movementAxes({KeyW:true,KeyS:true}).active,false);
});
test('Shift/C slide and Space jump remain the accepted physical castle controls',()=>{
 for(const key of ['ShiftLeft','ShiftRight','KeyC'])
  assert.equal(input.wantsSlide({[key]:true}),true);
 assert.equal(input.wantsSlide({KeyV:true}),false);
 assert.equal(input.wantsJump({Space:true}),true);
 assert.equal(input.wantsJump({KeyE:true}),false);
 assert.equal(input.KEYBOARD.tacticalMap,'KeyP');
});
test('free pointer look uses consistent yaw/pitch with bounded physical pitch',()=>{
 const a=input.turn({yaw:1,pitch:0,dx:20,dy:-15});
 near(a.yaw,1.12);near(a.pitch,.06);
 near(input.turn({yaw:0,pitch:0,dx:0,dy:500}).pitch,-.7);
 near(input.turn({yaw:0,pitch:0,dx:0,dy:-500}).pitch,.7);
 assert.throws(()=>input.turn({yaw:Infinity,pitch:0,dx:1,dy:0}),/invalid/);
});
test('shared FPS camera rise equals native 3D bow/musket firing rise',()=>{
 for(const pitch of [-.7,-.32,0,.17,.69]){
  const dir=input.aimedDirection({yaw:.84,pitch});
  near(dir.y/Math.hypot(dir.x,dir.z),input.aimSlope(pitch));
  near(Math.hypot(dir.x,dir.y,dir.z),1);
 }
});
test('melee remains flat: no artificial vertical reach or damage added',()=>{
 const d=input.aimedDirection({yaw:1,pitch:.69,melee:true});
 near(d.y,0);near(Math.hypot(d.x,d.z),1);
});
test('spectator, dead player and P modal cannot capture FPS mouse',()=>{
 assert.equal(input.canLook({view:'fps',modal:false,playerCanMove:true}),true);
 assert.equal(input.canLook({view:'tps',modal:false,playerCanMove:true}),true);
 assert.equal(input.canLook({view:'orbit',modal:false,playerCanMove:true}),false);
 assert.equal(input.canLook({view:'fps',modal:true,playerCanMove:true}),false);
 assert.equal(input.canLook({view:'fps',modal:false,playerCanMove:false}),false);
});
test('input contract rejects malformed native aiming vectors',()=>{
 assert.throws(()=>input.movementAxes(null),/missing/);
 assert.throws(()=>input.aimedDirection({yaw:NaN,pitch:0}),/invalid/);
 assert.throws(()=>input.aimSlope(Infinity),/invalid/);
});
test('genuine castle 3D swept motion uses same field-style intent without stone penetration',()=>{
 const controller=movement.create({inputContract:input});
 const p={x:-9,y:0,z:-99},state=objectives.createScenario();
 controller.reset(p);
 const a=controller.step({position:p,yaw:0,keys:{KeyW:true,KeyD:true},
   dt:.05,spec:map.spec,scenario:state,traversal});
 assert(a.position.z>p.z);
 assert(a.position.x>p.x);
 assert.equal(a.movement.sharedNativeFieldCastleInputIntent,true);
 assert.equal(a.movement.realCastleSweptCollider,true);
 assert.equal(traversal.overlaps(a.position,map.spec,state),false);
});
test('native castle jump and C sliding are preserved with the shared intent',()=>{
 const controller=movement.create({inputContract:input});
 const p={x:-9,y:0,z:-99},state=objectives.createScenario();
 controller.reset(p);
 let a=controller.step({position:p,yaw:0,keys:{Space:true},dt:.05,
   spec:map.spec,scenario:state,traversal});
 assert(a.position.y>0);
 a=controller.step({position:a.position,yaw:0,keys:{KeyC:true},dt:.05,
   spec:map.spec,scenario:state,traversal});
 assert.equal(a.movement.sliding,true);
});
test('older standalone siege physics still functions when shared intent is not injected',()=>{
 const controller=movement.create();
 const p={x:-9,y:0,z:-99},state=objectives.createScenario();
 controller.reset(p);
 const a=controller.step({position:p,yaw:0,keys:{KeyW:true},dt:.05,
   spec:map.spec,scenario:state,traversal});
 assert(a.position.z>p.z);
 assert.equal(a.movement.sharedNativeFieldCastleInputIntent,false);
});
test('real native four-weapon bridge consumes shared aim and exact accepted weapon rules',()=>{
 const {b,session}=castle();
 const p=combatAPI.create({bridge:b,engine:native,balance:W,
   session,sessionAPI,inputContract:input});
 const s=combatAPI.sync(p,{view:'fps',team:'red',yaw:.84,pitch:.21,
   position:{x:0,y:0,z:-95}});
 assert.equal(s.sharedFieldSiegePlayerInputContract,true);
 assert.equal(s.playerCameraAndWeaponAimUseSameDirection,true);
 assert.equal(s.sharedFieldSiegeSessionContract,true);
 assert.equal(s.nativeBattleSession.playerActive,true);
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.playerKills,0);
 assert.equal(W.SHOT_INTERVAL.musket,15);
 assert.equal(W.BOW_MIN_DRAW_SECONDS,2);
});
