/** AK-01: Castle uses exact native open-field G5.4 squad commands. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const core=require('../army/modules/shared-g54-army-commands.js');
const map=require('./siege-map.js');
const traversal=require('./siege-traversal.js');
const objectives=require('./siege-objectives.js');
const bridge=require('./siege-real-army-bridge.js');
const weapon=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const native=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const ctx=vm.createContext({console});
vm.runInContext(weapon,ctx,{timeout:3000});
vm.runInContext(native,ctx,{timeout:3000});
const G54=ctx.ArenaArmyBattle;
const make=(side='red',role='sword')=>{
 const b=bridge.create({armyEngine:G54,map,objectives,traversal,
  playerTeam:side,playerType:role,seed:1600});
 return {b,c:core.create({engine:G54,bridge:b,map})};
};
const post=(c,action,value,x,z)=>core.execute(c,{action,value,x,z});
test('original real G5.4 engine SHA and original four-roles/eight-squad roster intact',()=>{
 assert.equal(createHash('sha256').update(native).digest('hex'),
   '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 const {b,c}=make();
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.squads.length,8);
 assert.equal(core.snapshot(c).originalG54ArmyCommandFunctions,true);
 assert.equal(core.snapshot(c).visualLayoutFullyShared,false);
 assert.equal(core.snapshot(c).noSyntheticSoldierDamageOrWin,true);
});
test('native 7 field army orders are the exact same accepted siege contract',()=>{
 const {b,c}=make();
 for(const action of core.ORDER){
  const result=post(c,'order',action);
  assert.equal(result.ok,true,action);
  assert.equal(b.state.squads[b.state.playerSquadId].order,action);
  assert.equal(result.playerSquadId,b.state.playerSquadId);
 }
 assert.equal(core.snapshot(c).accepted,7);
});
test('all six original G5.4 formations work from one shared native squad',()=>{
 const {b,c}=make('blue');
 for(const formation of core.FORMATION){
  assert.equal(post(c,'formation',formation).ok,true);
  assert.equal(b.state.squads[b.state.playerSquadId].formation,formation);
 }
 assert.equal(core.snapshot(c).commandTeam,'blue');
 assert.equal(core.snapshot(c).accepted,6);
});
test('original bow/musket volley/free/hold is real G5.4 fire-mode mutation',()=>{
 for(const role of ['bow','musket']){
  const {b,c}=make('red',role);
  for(const mode of core.FIRE){
   const result=post(c,'fire',mode);
   assert.equal(result.ok,true,role+'/'+mode);
   assert.equal(b.state.squads[b.state.playerSquadId].fireMode,mode);
  }
  assert.equal(core.snapshot(c).fireMode,'hold');
 }
});
test('G5.4 melee cannot be falsely assigned a firing mode',()=>{
 const {c}=make('red','sword');
 const result=post(c,'fire','volley');
 assert.equal(result.ok,false);
 assert.equal(core.snapshot(c).fireMode,null);
 assert.equal(core.snapshot(c).rejected,1);
});
test('original G5.4 tactical map destination commands are routed to native G5.4',()=>{
 const {b,c}=make();
 const proposed={x:-18,z:-93};
 const a=post(c,'position',undefined,proposed.x,proposed.z);
 assert.equal(a.ok,true,a.reason);
 const sq=b.state.squads[b.state.playerSquadId];
 assert.equal(sq.order,'position');
 assert.equal(sq.targetX,proposed.x);
 assert.equal(sq.targetZ,proposed.z);
 assert.equal(core.snapshot(c).targetX,proposed.x);
 assert.equal(core.snapshot(c).targetZ,proposed.z);
});
test('native waypoint queue works, with castle collision/blocked gate rejection',()=>{
 const {b,c}=make();
 assert.equal(post(c,'position',undefined,-18,-94).ok,true);
 const next=post(c,'waypoint',undefined,-11,-90);
 assert.equal(next.ok,true,next.reason);
 assert.equal(core.snapshot(c).queuedWaypoints,1);
 const bad=post(c,'position',undefined,0,-40);
 assert.equal(bad.ok,false,'closed real gate must be forbidden target');
 assert.match(bad.reason,/blocked/);
 assert.equal(core.snapshot(c).queuedWaypoints,1,'failed destination did not erase native route');
 assert.equal(post(c,'clear-waypoints').ok,true);
 assert.equal(core.snapshot(c).queuedWaypoints,0);
});
test('original native G5.4 facing/spacing/frontage/depth are not copied fake values',()=>{
 const {b,c}=make();
 const sq=b.state.squads[b.state.playerSquadId];
 assert.equal(post(c,'face',undefined,-18,-82).ok,true);
 assert(Number.isFinite(sq.lockedFacing));
 assert.equal(post(c,'spacing',1.1).ok,true);
 assert.equal(sq.spacingScale,1.1);
 assert.equal(post(c,'frontage',7).ok,true);
 assert.equal(sq.frontage,7);
 assert.equal(post(c,'depth',1.2).ok,true);
 assert.equal(sq.depthScale,1.2);
 assert.equal(post(c,'clear-face').ok,true);
 assert.equal(sq.lockedFacing,null);
});
test('unrecognized orders and out-of-contract tuning are rejected without side effects',()=>{
 const {b,c}=make();
 const sq=b.state.squads[b.state.playerSquadId];
 const orig=sq.order,formation=sq.formation;
 assert.equal(post(c,'order','teleport').ok,false);
 assert.equal(post(c,'formation','gunship').ok,false);
 assert.equal(post(c,'spacing',1.99).ok,false);
 assert.equal(post(c,'frontage',100).ok,false);
 assert.equal(post(c,'depth',NaN).ok,false);
 assert.throws(()=>post(c,'synthetic-damage',100),/Unknown/);
 assert.equal(sq.order,orig);
 assert.equal(sq.formation,formation);
 assert.equal(b.state.playerKills,0);
});
test('dead commander, eliminated squad, ended siege cannot issue unauthorized commands',()=>{
 const {b,c}=make();
 G54.setPlayerHealth(b.state,0);
 assert.equal(post(c,'order','charge').ok,false);
 G54.setPlayerHealth(b.state,100);
 b.scenario.phase='RESULT'; // Explicit QA fixture only
 assert.equal(post(c,'formation','shield').ok,false);
 assert.equal(core.snapshot(c).rejected,2);
});
test('shared contract cannot command an AI-owned squad by switching playerSquadId',()=>{
 const {b,c}=make();
 const ai=b.state.squads.find(u=>!u.playerControlled);
 b.state.playerSquadId=ai.id;
 assert.throws(()=>core.snapshot(c),/Lost G5.4/);
 assert.throws(()=>post(c,'order','charge'),/Lost G5.4/);
});
test('independent native G5.4 field engine accepts exact same 6 formations and orders',()=>{
 const field=G54.create(1600,'sword','red');
 const fakeBridge={state:field,scenario:{phase:'APPROACH'}};
 const c=core.create({engine:G54,bridge:fakeBridge});
 assert.equal(post(c,'formation','shield').ok,true);
 assert.equal(post(c,'order','hold').ok,true);
 assert.equal(field.squads[field.playerSquadId].formation,'shield');
 assert.equal(core.snapshot(c).originalG54ArmyCommandFunctions,true);
});


test('AK-02b historical native G5.4 field order/form/fire hotkeys agree with real source',()=>{
 const expected={
   KeyG:['order','follow'],KeyJ:['order','hold'],
   KeyK:['order','advance'],KeyL:['order','charge'],
   KeyU:['order','retreat'],KeyY:['order','flank'],
   KeyN:['order','skirmish'],
   KeyZ:['formation','line'],KeyX:['formation','column'],
   KeyV:['formation','square'],KeyB:['formation','wedge'],
   KeyM:['formation','loose'],KeyI:['formation','shield'],
   Digit7:['fire','free'],Digit8:['fire','volley'],
   Digit9:['fire','hold'],
   BracketLeft:['spacing-delta',-.1],
   BracketRight:['spacing-delta',.1]
 };
 assert.deepEqual(Object.keys(core.FIELD_KEYS),Object.keys(expected));
 const {b,c}=make();
 for(const [code,[action,value]]of Object.entries(expected)){
   const cmd=core.shortcut({code});
   assert.equal(cmd.action,action,code);
   assert.equal(cmd.value,value,code);
   const result=core.execute(c,cmd);
   // Melee intentionally rejects firing modes, original native semantics.
   assert.equal(result.ok,action!=='fire',code);
 }
 assert.equal(b.state.squads[b.state.playerSquadId].formation,'shield');
 assert.equal(core.snapshot(c).order,'skirmish');
 assert.equal(core.snapshot(c).spacingScale,1);
});
test('AK-02a shortcuts never seize WASD, weapon F/1..4, Space, Escape or chat inputs',()=>{
 for(const code of ['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF',
   'Space','Escape','Digit1','Digit2','Digit3','Digit4','KeyC']){
   assert.equal(core.shortcut({code}),null,code);
 }
 const flags=['repeat','ctrlKey','altKey','metaKey',
   'isComposing','defaultPrevented'];
 for(const key of flags)
   assert.equal(core.shortcut({code:'KeyJ',[key]:true}),null,key);
 for(const tagName of ['input','TEXTAREA','select'])
   assert.equal(core.shortcut({
     code:'KeyJ',target:{tagName}}),null,tagName);
 assert.equal(core.shortcut({
   code:'KeyJ',target:{isContentEditable:true}}),null);
});
test('AK-02a real keyboard fire shortcuts accept same original live archer squad',()=>{
 const {b,c}=make('red','bow');
 for(const [key,value]of [
   ['Digit9','hold'],['Digit8','volley'],['Digit7','free']
 ]){
   const cmd=core.shortcut({code:key});
   assert.equal(core.execute(c,cmd).ok,true,key);
   assert.equal(b.state.squads[b.state.playerSquadId].fireMode,value);
 }
 assert.equal(core.snapshot(c).accepted,3);
 assert.equal(core.snapshot(c).nonPlayerSquadsNeverAuthorized,true);
});

test('AK-02b actual G5.4 archive proves HUD bottom-left and original P tactical map',()=>{
 const original=readFileSync(new URL('../army/KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(original).digest('hex'),
   '1d5f72768054b4138ba742e10923bfb20c00bd37fe789cdc3e40a65967cccfe2');
 assert(original.includes('id="meadow-army-hud" class="hidden fixed left-3 bottom-12'));
 assert(original.includes('id="army-tactical-overlay"'));
 assert(original.includes("KeyG:'follow',KeyJ:'hold',KeyK:'advance',KeyL:'charge'"));
 assert(original.includes("KeyU:'retreat',KeyY:'flank',KeyN:'skirmish'"));
 assert(original.includes("KeyZ:'line',KeyX:'column',KeyC:'square'"));
 assert(original.includes("KeyB:'wedge',KeyM:'loose',KeyI:'shield'"));
 assert(original.includes("Digit7:'free',Digit8:'volley',Digit9:'hold'"));
 assert(original.includes("e.code==='KeyP'"));
 assert(original.includes("e.code==='BracketLeft'"));
 assert(original.includes("e.code==='BracketRight'"));
 assert(!Object.hasOwn(core.FIELD_KEYS,'KeyC'),
   'Castle must preserve C slide; fallback square V is explicit');
 assert.equal(core.FIELD_KEYS.KeyV.value,'square');
});
test('AK-02b original bracket spacing is native state with hard 0.65–1.65 boundaries',()=>{
 const {b,c}=make();
 const sq=b.state.squads[b.state.playerSquadId];
 for(let i=0;i<19;i++)
   assert.equal(core.execute(c,core.shortcut({code:'BracketRight'})).ok,true);
 assert.equal(sq.spacingScale,1.65);
 for(let i=0;i<19;i++)
   assert.equal(core.execute(c,core.shortcut({code:'BracketLeft'})).ok,true);
 assert.equal(sq.spacingScale,.65);
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.playerKills,0);
});
test('AK-02b square V does not steal C slide or any FPS weapon key',()=>{
 assert.equal(core.shortcut({code:'KeyC'}),null);
 assert.equal(core.shortcut({code:'KeyF'}),null);
 for(const key of ['Digit1','Digit2','Digit3','Digit4','Space','KeyE'])
   assert.equal(core.shortcut({code:key}),null);
 const {b,c}=make();
 assert.equal(core.execute(c,core.shortcut({code:'KeyV'})).ok,true);
 assert.equal(b.state.squads[b.state.playerSquadId].formation,'square');
});
