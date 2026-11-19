/** AK-03a common native 140-actor field/castle battle authority.
 * All tests use original SHA-pinned G5.4, not fake player health or soldiers.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const session=require('../army/modules/shared-g54-battle-session.js');
const objectives=require('./siege-objectives.js');
const map=require('./siege-map.js');
const traversal=require('./siege-traversal.js');
const bridgeAPI=require('./siege-real-army-bridge.js');
const playerAPI=require('./siege-player-combat.js');
const src=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const weapon=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const c=vm.createContext({console});
vm.runInContext(weapon,c,{timeout:3000});
vm.runInContext(src,c,{timeout:3000});
const A=c.ArenaArmyBattle,W=c.ArenaWeaponBalance;
const field=(side='red')=>{
 const state=A.create(1600,'sword',side);
 return session.create({engine:A,state,mode:'field',playerTeam:side});
};
const castle=(side='red')=>{
 const b=bridgeAPI.create({armyEngine:A,map,objectives,traversal,
   playerTeam:side,seed:1600});
 const live=session.create({engine:A,state:b.state,
   mode:'siege',scenario:b.scenario,playerTeam:side});
 return {b,live};
};
function pose(team,view='fps',x=10,z=-89,y=0){
 return {team,view,position:{x,y,z},yaw:0,pitch:0,climbing:false};
}
test('AK-03a exact SHA-pinned G5.4 native engine unchanged in both games',()=>{
 assert.equal(createHash('sha256').update(src).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 const a=field(),{b,live}=castle();
 for(const s of [a,live]){
  const x=session.snapshot(s);
  assert.equal(x.nativeSoldierCount,140);
  assert.equal(x.nativeSquadCount,8);
  assert.equal(x.playerHealth,100);
  assert.equal(x.trueNativeG54PlayerState,true);
  assert.equal(x.noDuplicateDamageOrAI,true);
  assert.equal(x.originalG54MovementCodeReplaced,false);
  assert.equal(x.independentGameRendererStillPresent,true);
 }
 assert.equal(b.state.squads.filter(s=>s.playerControlled).length,1);
});
test('field and castle share the exact same native player active/HP/ownership authority',()=>{
 const f=field('blue'),{b,live}=castle('blue');
 for(const q of [f,live]){
  const s=session.snapshot(q);
  assert.equal(s.authenticPlayerTeam,'blue');
  assert.equal(s.combatAllowed,true); // field starts active, siege session initially native active until orbit synced
  assert.equal(s.commandsAllowed,true);
  assert.equal(s.movementAllowed,true);
  assert.equal(s.nativeSquadCount,8);
 }
 assert.equal(live.state,b.state);
});
test('siege orbit camera has no invulnerable AI player ghost target',()=>{
 const {b,live}=castle('red');
 const after=session.sync(live,pose('red','orbit'));
 assert.equal(after.view,'orbit');
 assert.equal(after.playerActive,false);
 assert.equal(after.spectatorNeverTargetable,true);
 assert.equal(after.combatAllowed,false);
 assert.equal(after.movementAllowed,true);
 assert.equal(b.state.playerActive,false);
 const back=session.sync(live,pose('red','fps'));
 assert.equal(back.playerActive,true);
 assert.equal(back.combatAllowed,true);
});
test('genuine native player position sync uses a single engine write, never synthetic pose',()=>{
 const {b,live}=castle('red');
 const p=pose('red','tps',-3,-93,1.3);
 const a=session.sync(live,p);
 assert.equal(a.playerPosition.x,-3);
 assert.equal(a.playerPosition.z,-93);
 assert.equal(a.view,'tps');
 assert.equal(a.positionalSyncs,1);
 assert.equal(b.state.playerPosition.x,-3);
 assert.equal(b.state.playerPosition.z,-93);
 assert.equal(a.authenticPlayerSquadId,b.state.playerSquadId);
});
test('dead player cannot move or fight in both field and siege, even after view change',()=>{
 for(const q of [field('red'),castle('red').live]){
  session.sync(q,pose('red','fps'));
  A.setPlayerHealth(q.state,0);
  assert.equal(session.canMove(q),false);
  assert.equal(session.canFight(q),false);
  assert.equal(session.canCommand(q),false);
  assert.equal(session.snapshot(q).playerAlive,false);
  session.sync(q,pose('red','tps'));
  assert.equal(q.state.playerActive,false);
 }
});
test('actual castle RESULT terminates the same movement and firing authority',()=>{
 const {b,live}=castle();
 session.sync(live,pose('red','fps'));
 b.scenario.phase='RESULT';
 assert.equal(session.canMove(live),false);
 assert.equal(session.canFight(live),false);
 assert.equal(session.canCommand(live),false);
 const snap=session.sync(live,pose('red','fps'));
 assert.equal(snap.nativeMatchResult,true);
 assert.equal(snap.playerActive,false);
 assert.equal(snap.nativeSiegePhase,'RESULT');
});
test('field native winner terminates the same movement and firing authority',()=>{
 const x=field();
 session.sync(x,pose('red','fps'));
 x.state.winner='blue';
 assert.equal(session.canMove(x),false);
 assert.equal(session.canFight(x),false);
 assert.equal(session.canCommand(x),false);
 assert.equal(session.sync(x,pose('red','fps')).nativeMatchResult,true);
});
test('native ownership security rejects wrong team, enemy squad, or fake extra actor',()=>{
 const {b,live}=castle('blue');
 assert.throws(()=>session.sync(live,pose('red','fps')),/mismatched team/);
 const enemy=b.state.squads.find(s=>s.team==='red');
 b.state.playerSquadId=enemy.id;
 assert.throws(()=>session.snapshot(live),/lost authentic/);
 b.state.playerSquadId=b.state.squads.find(s=>s.playerControlled).id;
 b.state.soldiers.pop();
 assert.throws(()=>session.canMove(live),/lost authentic/);
});
test('native clock and 3D spectator never fork authoritative game time',()=>{
 const {b,live}=castle();
 session.sync(live,pose('red','orbit'));
 assert.equal(session.snapshot(live).genuineNativeMatchClock,b.state.elapsed);
 bridgeAPI.step(b,.08);
 assert.equal(session.snapshot(live).genuineNativeMatchClock,b.state.elapsed);
 assert.equal(session.snapshot(live).genuineNativeTick,b.state.tick);
 assert.equal(b.state.playerActive,false);
 assert.equal(session.snapshot(live).combatAllowed,false);
});
test('siege player weapon bridge delegates movement and position to SAME battle-session',()=>{
 const {b,live}=castle();
 const combat=playerAPI.create({bridge:b,engine:A,balance:W,
   session:live,sessionAPI:session});
 let result=playerAPI.sync(combat,pose('red','orbit'));
 assert.equal(result.sharedFieldSiegeSessionContract,true);
 assert.equal(result.playerActive,false);
 result=playerAPI.sync(combat,pose('red','fps'));
 assert.equal(result.playerActive,true);
 assert.equal(result.nativeBattleSession.combatAllowed,true);
 assert.equal(playerAPI.canMove(combat),session.canMove(live));
 assert.equal(result.nativeBattleSession.positionalSyncs,2);
 A.setPlayerHealth(b.state,0);
 assert.equal(playerAPI.canMove(combat),false);
 assert.equal(session.canMove(live),false);
});
test('cross-battle player combat bridge cannot silently bind stale or foreign native state',()=>{
 const one=castle(),other=castle('blue');
 assert.throws(()=>playerAPI.create({bridge:one.b,engine:A,balance:W,
   session:other.live,sessionAPI:session}),/does not own genuine/);
 assert.throws(()=>session.create({engine:A,state:one.b.state,mode:'siege'}),
   /requires the original G5.4/);
});
test('reset/new army cannot keep old session; fresh session starts authentic clock 0',()=>{
 const a=castle(),b=castle();
 session.sync(a.live,pose('red','fps',11,-92));
 assert.equal(a.live.syncCount,1);
 const s=session.snapshot(b.live);
 assert.equal(s.genuineNativeMatchClock,0);
 assert.equal(s.positionalSyncs,0);
 assert.notEqual(a.live.state,b.live.state);
 assert.equal(s.nativeSiegePhase,'APPROACH');
});
