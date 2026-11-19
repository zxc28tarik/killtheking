/** S3D1 native human commander combat.
 * Runs exact original G5.4 true-side-swap/2026 weapon modules in VM.
 * All soldier placement in unit tests is expressly QA; it is NOT an
 * unassisted full 3D arena acceptance. Genuine game state/HP is native.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const map=require('./siege-map.js');
const objectives=require('./siege-objectives.js');
const traversal=require('./siege-traversal.js');
const structure=require('./siege-structure-combat.js');
const assault=require('./siege-assault-navigation.js');
const ladder=require('./siege-ladder-ai.js');
const capture=require('./siege-capture-ai.js');
const bridge=require('./siege-real-army-bridge.js');
const player=require('./siege-player-combat.js');
const g54Source=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const weaponSource=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const ctx=vm.createContext({console});
vm.runInContext(weaponSource,ctx,{timeout:3000});
vm.runInContext(g54Source,ctx,{timeout:3000});
const G54=ctx.ArenaArmyBattle,W=ctx.ArenaWeaponBalance;
const make=(side='red')=>{
 const b=bridge.create({armyEngine:G54,map,objectives,traversal,
  playerTeam:side,seed:1600,structureCombatEngine:structure,
  assaultNavigationEngine:assault,ladderAIEngine:ladder,
  captureAIEngine:capture});
 const human=player.create({bridge:b,engine:G54,balance:W});
 return {b,human};
};
const pose=(x=0,z=-49,side='red',yaw=0,view='fps',y=0,pitch=0)=>({
 position:{x,y,z},view,team:side,yaw,pitch,climbing:false
});
function gateQA(b){
 for(let i=0;i<4;i++)objectives.applyEvent(b.scenario,{
  type:'GATE_HIT',team:'red',weapon:'ram',damage:150});
 bridge.refreshObstacles(b);
}
function blueAt(b,z=-32,hp=null){
 const t=b.state.soldiers.find(s=>s.team==='blue'&&s.type==='bow');
 t.x=0;t.z=z;t.siegeY=0;
 if(hp!==null)t.hp=hp;
 t.microState='formation';t.guardUntil=0;t.guardAngle=0;
 return t;
}
test('native source SHA is pinned, unchanged, and real 140 actor engine loaded',()=>{
 assert.equal(createHash('sha256').update(g54Source).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 const {b,human}=make();
 assert.equal(b.state.soldiers.length,140);
 assert.equal(bridge.snapshot(b).authentic140Soldiers,140);
 assert.equal(player.snapshot(human).realFFAOriginalMovementPorted,false);
 assert.equal(player.snapshot(human).real3dBulletAndArrowBallistics,false);
});
test('genuine human G5.4 HP and native player position follow S2 physically derived view',()=>{
 const {b,human}=make('blue');
 const p=pose(0,51,'blue',Math.PI,'fps');
 player.sync(human,p);
 assert.equal(b.state.playerPosition.x,0);
 assert.equal(b.state.playerPosition.z,51);
 assert.equal(b.state.playerActive,true);
 assert.equal(player.snapshot(human).playerHealth,100);
 assert.equal(player.snapshot(human).view,'fps');
 assert.equal(player.snapshot(human).playerTeam,'blue');
});
test('orbit spectator is NOT a ghost target; FPS/TPS enables target only while alive',()=>{
 const {b,human}=make();
 player.sync(human,pose(0,-99,'red',0,'orbit'));
 assert.equal(b.state.playerActive,false);
 assert.equal(player.trigger(human).status,'choose-fps-tps');
 player.sync(human,pose(0,-99,'red'));
 assert.equal(b.state.playerActive,true);
 player.sync(human,pose(0,-99,'red',0,'tps'));
 assert.equal(b.state.playerActive,true);
});
test('player-selected weapon cadence is genuine; original 2026 balance never overwritten',()=>{
 const {b,human}=make();
 player.sync(human,pose());
 assert.equal(W.damage('musket','body'),90);
 assert.equal(W.damage('musket','arm'),80);
 assert.equal(W.damage('spear','body'),35);
 assert.equal(W.damage('sword','body'),20);
 assert.equal(W.SHOT_INTERVAL.musket,15);
 assert.equal(W.SHOT_INTERVAL.bow,4);
 assert.equal(W.BOW_MIN_DRAW_SECONDS,2);
 assert.equal(W.BOW_DRAW_SECONDS,3);
 player.setWeapon(human,'musket');
 assert.equal(player.trigger(human).status,'miss');
 assert.equal(player.trigger(human).status,'cooldown');
 player.setWeapon(human,'sword');
 assert.notEqual(player.trigger(human).status,'cooldown');
 player.setWeapon(human,'musket');
 assert.equal(player.trigger(human).status,'cooldown',
  'Class switching must NOT reset native musket reload');
});
test('QA closed castle gate prevents musket damage on REAL living G5.4 blue soldier',()=>{
 const {b,human}=make();
 const enemy=blueAt(b);
 player.sync(human,pose());
 player.setWeapon(human,'musket');
 const old=enemy.hp;
 const r=player.trigger(human);
 assert.equal(r.hit,false);
 assert.equal(enemy.hp,old);
 assert.equal(b.state.playerKills,0);
 assert.equal(b.state.worldObstacles.length,15);
});
test('QA opened gate: original G5.4 FIRST BODY is authoritative HP/kill target',()=>{
 const {b,human}=make();
 blueAt(b);
 gateQA(b);
 player.sync(human,pose());
 player.setWeapon(human,'musket');
 // The genuine G5.4 raycast may encounter a closer existing blue soldier
 // than the soldier manually positioned for this QA scenario. Never fake
 // a chosen victim or pretend bullets ignore the original first body.
 const ray=G54.raycastSoldier(b.state,{x:0,y:1.85,z:-49},
   {x:0,y:0,z:1},100,'red',{firstBody:true,returnFriendly:true});
 assert(ray&&ray.soldier.team==='blue','No genuine enemy body on open gate shot');
 const target=ray.soldier;
 const beforeSquad=b.state.squads[target.squadId].alive;
 target.hp=40; // QA low-HP target to verify REAL source-authoritative kill event
 const result=player.trigger(human);
 assert.equal(result.status,'hit');
 assert.equal(result.targetId,target.id);
 assert.equal(result.zone,'body');
 assert.equal(result.damage,40);
 assert.equal(result.killed,true);
 assert.equal(target.hp,0);
 assert.equal(target.alive,false);
 assert.equal(b.state.playerKills,1);
 assert.equal(b.state.squads[target.squadId].alive,beforeSquad-1);
 assert.equal(player.snapshot(human).playerKills,1);
 assert.equal(bridge.snapshot(b).genuineAlive.blue,69);
 assert.equal(b.state.combatEvents.at(-1).source,'player');
 assert.equal(b.state.combatEvents.at(-1).kind,'soldier');
});
test('friendly bodies block a live soldier shot; no team damage or kill is created',()=>{
 const {b,human}=make();
 const enemy=blueAt(b),ally=b.state.soldiers.find(u=>u.team==='red'&&u.type==='sword');
 gateQA(b);
 ally.x=0;ally.z=-43;ally.siegeY=0;
 player.sync(human,pose());
 player.setWeapon(human,'musket');
 const p0=ally.hp,e0=enemy.hp;
 const r=player.trigger(human);
 assert.equal(r.status,'friendly-block');
 assert.equal(ally.hp,p0);
 assert.equal(enemy.hp,e0);
 assert.equal(b.state.playerKills,0);
 assert.equal(player.snapshot(human).friendlyBodyBlocks,1);
});
test('native sword and spear melee cannot strike distant enemies through the gate',()=>{
 for(const weapon of ['sword','spear']){
  const {b,human}=make();
  const enemy=blueAt(b);
  player.sync(human,pose());
  player.setWeapon(human,weapon);
  const result=player.trigger(human);
  assert.equal(result.hit,false);
  assert.equal(enemy.hp,enemy.maxHp);
 }
});
test('QA spear at live target in reach deals exactly approved body damage',()=>{
 const {b,human}=make(),enemy=blueAt(b,-47.2);
 player.sync(human,pose(0,-49,'red',0));
 player.setWeapon(human,'spear');
 const result=player.trigger(human);
 assert.equal(result.status,'hit');
 assert.equal(result.damage,35);
 assert.equal(enemy.hp,enemy.maxHp-35);
 assert.equal(result.zone,'body');
});
test('bow must draw >=2 genuine native seconds and obey 1s recovery / 4s cadence',()=>{
 const {b,human}=make();
 player.sync(human,pose());
 player.setWeapon(human,'bow');
 assert.equal(player.beginBow(human).status,'drawing');
 b.state.elapsed=1.8; // QA clock fixture; never recorded as native simulation proof
 assert.equal(player.releaseBow(human).status,'bow-not-ready');
 b.state.elapsed=2.5;
 assert.equal(player.beginBow(human).status,'drawing');
 b.state.elapsed=4.9;
 assert.equal(player.releaseBow(human).weapon,'bow');
 assert.equal(player.snapshot(human).attempts,1);
 assert.equal(player.beginBow(human).status,'bow-recovery');
 b.state.elapsed=6.0;
 assert.equal(player.beginBow(human).status,'drawing');
 b.state.elapsed=8.6;
 assert.equal(player.releaseBow(human).status,'bow-not-ready',
  '4s cadence must not be bypassed by starting an early draw');
});
test('elevated shooter and elevated target are fail-closed until actual 3D ballistic engine',()=>{
 const {b,human}=make(),target=blueAt(b,-45.5);
 player.sync(human,pose(0,-49,'red',0,'fps',15.2));
 player.setWeapon(human,'musket');
 assert.equal(player.trigger(human).status,'unsupported-height');
 assert.equal(target.hp,target.maxHp);
 player.sync(human,pose());
 target.siegeY=15.2;
 assert.equal(player.trigger(human).status,'elevated-target-unsupported');
 assert.equal(target.hp,target.maxHp);
 assert(player.snapshot(human).unsupportedElevationBlocks>=2);
});
test('dead G5.4 commander cannot move/fire, resurrection by camera mode is denied',()=>{
 const {b,human}=make();
 player.sync(human,pose());
 G54.setPlayerHealth(b.state,0); // QA death fixture via native API
 player.receive(human);
 assert.equal(player.canMove(human),false);
 assert.equal(player.trigger(human).status,'player-dead');
 player.sync(human,pose(0,-49,'red',0,'tps'));
 assert.equal(b.state.playerActive,false);
 assert.equal(b.state.playerHealth,0);
 assert.equal(player.snapshot(human).attacksRejectedAfterDeath,1);
});
test('QA native HP loss is surfaced from genuine G5.4 health, with no mock HP',()=>{
 const {b,human}=make();
 player.sync(human,pose());
 G54.setPlayerHealth(b.state,68); // controlled HP observation, NOT enemy strike proof
 player.receive(human);
 assert.equal(player.snapshot(human).playerHealth,68);
 assert.equal(player.snapshot(human).receivedNativeDamage,32);
 assert.equal(player.snapshot(human).receivedNativeHits,1);
});
test('live human side must match authentic army; invalid input rejected',()=>{
 const {human}=make();
 assert.throws(()=>player.sync(human,pose(0,-49,'blue')),/mismatch/);
 assert.throws(()=>player.setWeapon(human,'bomb'),/Unsupported/);
 assert.throws(()=>player.sync(human,{view:'fps',team:'red'}),/mismatch/);
 assert.throws(()=>player.create({bridge:{state:{soldiers:[]}}}),
  /Genuine G5.4/);
});
test('S3C3 remains separate: no combat module without explicit opt-in',()=>{
 const {b}=make();
 assert.equal(bridge.snapshot(b).real3dPlayerCombatConnected,false);
 assert.equal(b.state.playerHealth,100);
 assert.equal(typeof G54.damageSoldier,'function');
 assert.equal(typeof G54.raycastSoldier,'function');
});
