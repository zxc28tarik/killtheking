/** FFA real attack -> actual player HP tests, using real 3D ray and real weapon modules.
 * No GPU/WebGL render is asserted; this is a real game-code VM combat probe. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const input=process.env.KTK_FFA_HTML;
if(!input)throw Error('KTK_FFA_HTML original A5 game required');
const {patchFfaAggro}=await import('./player_target_hotfix.mjs');
const html=patchFfaAggro(readFileSync(input,'utf8'));
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]);
const source=scripts.find(x=>x.includes('function arenaBotAttack(bot, target, targetDistance)'));
assert(source,'No actual game bot combat function found');
const attackStart=source.indexOf('function arenaBotAttack(bot, target, targetDistance)');
const attackEnd=source.indexOf('// Check if player hit an explosive barrel',attackStart);
assert(attackStart>0&&attackEnd>attackStart);
const realAttack=source.slice(attackStart,attackEnd);

function mockArena(role, config={}){
 const events=[];
 const sandbox=vm.createContext({console,window:{},setTimeout:()=>0});
 for(const key of ['WebGLRenderer','ArenaCombatDefense','ArenaBotOffense','ArenaWeaponBalance','ArenaCombatHit3D']){
  const src=scripts.find(s=>key==='WebGLRenderer' ?
   s.includes('Copyright 2010-2021 Three.js Authors') :
   new RegExp('root\\.'+key+'\\s*=\\s*api').test(s));
  assert(src,'Missing source module '+key);
  vm.runInContext(src,sandbox,{timeout:2500,filename:key+'.js'});
 }
 const {THREE}=sandbox;
 assert(THREE?.Vector3&&THREE?.Ray&&THREE?.Box3);
 const origin=new THREE.Vector3(0,0,0);
 const playerPosition=new THREE.Vector3(0,2.35,role==='knight'||role==='pikeman'?2.5:14);
 const player={pos:playerPosition,currentHeight:2.35,hp:100,maxHp:100,
  isSliding:false,classIdx:2,isShielding:!!config.shielding,
  shieldParryTime:config.parryTime||0,yaw:Math.PI,parries:0,
  shakeIntensity:0,cameraImpactYaw:0,streak:0};
 const bot={id:0,role,weapon:role,mesh:{position:origin,rotation:{y:0}},
  dead:false,staggerTime:0,attackTimer:0,strikePoseTime:0,
  lastRangedShotAt:config.lastShot??-Infinity,arenaKills:0,
  hitReactionTime:0,hitFlashTimer:0,meleeWindup:0};
 const hooks={
  THREE,player,bots:[bot],isGameActive:true,arenaClock:20,
  arenaCanTarget:(_bot,type)=>type==='player'&&!config.ally,
  arenaActorPosition:type=>type==='player'?player.pos:null,
  arenaLineOfSight:()=>!config.blockSight,
  arenaWorldBlockBetween:()=>!!config.blockWorld,
  arenaFriendlyShotBlock:()=>!!config.friendlyBlock,
  arenaShotTracer:()=>events.push('tracer'),spawnSmokeCloud:()=>{},
  arenaTelemetry:{},
  ArenaTelemetry:{recordRangedShot:(_,which,zone)=>events.push('shot:'+which+':'+(zone||'miss'))},
  sfx:{playPlayerHit:()=>events.push('playerHitSound'),playMetalClang:()=>events.push('blockSound')},
  document:{getElementById:()=>({style:{opacity:'0'},textContent:''})},
  updateHUD:()=>events.push('hud'),addScorePopup:()=>{},
  arenaMatch:{durationSeconds:240,remaining:200},
  arenaShotCounter:0,arenaSpawnPool:()=>[],chooseArenaRespawn:()=>({x:0,y:0,z:0}),
  ArenaTelemetryRecorder:{},addKillFeed:()=>{},
  damageBotFromBot:()=>{throw Error('Must not route player attacks through bot victim')}
 };
 Object.assign(sandbox,hooks);
 sandbox.Math=Object.create(Math);sandbox.Math.random=()=>.5;
 vm.runInContext(realAttack+';this.__attack=arenaBotAttack;',sandbox,{timeout:1500});
 return {bot,player,events,
  attack:()=>sandbox.__attack(bot,{type:'player',id:null,position:player.pos},
   player.pos.distanceTo(bot.mesh.position)),sandbox};
}
for(const [role,expected] of [['knight',20],['pikeman',35],['archer',23],['musket',90]]){
 test(role+' attacks PLAYER and applies real weapon balance health damage',()=>{
  const x=mockArena(role);
  x.attack();
  assert.equal(100-x.player.hp,expected,'Wrong actual player body damage from '+role);
  assert(x.events.includes('hud'));
  if(role==='archer'||role==='musket')
   assert(x.events.some(z=>z.startsWith('shot:'+role+':body')));
 });
}
test('shooting blocked by stone cannot damage human or create false hit',()=>{
 for(const role of ['archer','musket']){
  const x=mockArena(role,{blockWorld:true});x.attack();
  assert.equal(x.player.hp,100);
  assert(x.events.includes('shot:'+role+':miss'));
 }
});
test('human ally protected in TDM',()=>{
 for(const role of ['knight','pikeman','archer','musket']){
  const x=mockArena(role,{ally:true});x.attack();
  assert.equal(x.player.hp,100);
  assert.equal(x.events.length,0);
 }
});
test('musket 15 second fire limit preserved even when player is target',()=>{
 const x=mockArena('musket',{lastShot:19});x.attack();
 assert.equal(x.player.hp,100);
 assert(!x.events.some(e=>e.startsWith('shot:')));
 assert(x.bot.attackTimer>=14);
});
test('facing the wrong direction cannot damage the player',()=>{
 const x=mockArena('knight');x.bot.mesh.rotation.y=Math.PI;x.attack();
 assert.equal(x.player.hp,100);
 assert(x.bot.attackTimer>=.18);
});
test('native target-choice -> attack -> player HP loss in same FFA combat context',()=>{
 const x=mockArena('knight');
 const selectStart=source.indexOf('function chooseArenaTarget(bot)');
 const selectEnd=source.indexOf('function markArenaAggro(',selectStart);
 assert(selectStart>0&&selectEnd>selectStart);
 const choose=source.slice(selectStart,selectEnd);
 x.bot.navRecovery={};x.bot.range=5;
 x.sandbox.ArenaBotRecovery={allows:()=>true};
 x.sandbox.arenaMap='castle';
 x.sandbox.arenaActorPosition=(type,id)=>type==='player'?x.player.pos:null;
 x.sandbox.arenaTargetDistance=(bot,type,id)=>
  type==='player'?x.player.pos.distanceTo(bot.mesh.position):Infinity;
 x.sandbox.arenaTargetCount=()=>0;
 x.sandbox.setArenaTarget=(bot,type,id)=>{
  bot.arenaTargetType=type;bot.arenaTargetId=id;bot.arenaLockTime=40;
 };
 vm.runInContext(choose+';this.__choose=chooseArenaTarget;',x.sandbox);
 const target=x.sandbox.__choose(x.bot);
 assert.equal(target.type,'player','Actual game target selection must pick nearby human');
 x.sandbox.__attack(x.bot,target,2.5);
 assert.equal(x.player.hp,80,'Actual attack must wound human, not just select him');
});
