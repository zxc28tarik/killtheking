/** Real FFA bot movement/windup/attack loop in a deterministic flat VM.
 * Actual shipped JS routines are executed with real THREE/AI/weapon modules.
 * Browser GPU, textured geometry and input devices are NOT simulated.
 */
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {patchFfaAggro,sha256,ORIGINAL_FFA_SHA} from './player_target_hotfix.mjs';

if(!process.env.KTK_FFA_HTML)throw Error('Exact October A5 FFA HTML is required');
const original=readFileSync(process.env.KTK_FFA_HTML,'utf8');
assert.equal(sha256(original),ORIGINAL_FFA_SHA,'Do not test a different FFA source');
const html=patchFfaAggro(original);
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]);
const main=scripts.find(s=>s.includes('function updateGame(dt)'));
assert(main,'The real FFA game loop was not found');
function between(a,b){
 const i=main.indexOf(a),j=main.indexOf(b,i+1);
 assert(i>=0&&j>i,'Missing actual FFA code: '+a+' / '+b);
 return main.slice(i,j);
}
const targetCode=between('function arenaActorPosition(type, id) {','function markArenaAggro(');
const attackCode=between('function arenaBotAttack(bot, target, targetDistance) {',
 '// Check if player hit an explosive barrel');
const loop=between('            // 5. Update AI Bots & Screen-Space Health Bars',
 '            // Observations every game-time second');
const profiles={knight:{range:3.9,speed:9.8},pikeman:{range:5.8,speed:10.4},
 archer:{range:32,speed:8.2},musket:{range:34,speed:7.4}};
function create(role,opts={}){
 const ctx=vm.createContext({console,setTimeout:()=>0});
 for(const i of [0,5,6,10,15,16,17,18,19])
  vm.runInContext(scripts[i],ctx,{timeout:3500});
 const T=ctx.THREE,start=new T.Vector3(0,0,0),z=opts.z??20;
 const player={pos:new T.Vector3(0,2.35,z),currentHeight:2.35,hp:100,maxHp:100,
  isSliding:false,classIdx:2,isShielding:false,shieldParryTime:0,yaw:Math.PI,
  parries:0,shakeIntensity:0,cameraImpactYaw:0,streak:0,deaths:0,attackAnimTime:0};
 const bot={id:0,name:'FFA_TEST_BOT',weapon:role,role,preferWall:false,
  range:profiles[role].range,speed:profiles[role].speed,
  mesh:{position:start,rotation:{x:0,y:0,z:0},scale:new T.Vector3(1,1,1)},
  hp:100,maxHp:100,dead:false,navPath:[],navGoal:null,navRefresh:0,
  navRecovery:ctx.ArenaBotRecovery.create(),navStuck:0,tacticGoal:null,
  tacticTargetKey:null,tacticLastTarget:null,tacticRefresh:0,tacticMode:'patrol',
  attackTimer:.1,lastRangedShotAt:-Infinity,staggerTime:0,meleeWindup:0,
  rangedWindup:0,windupTargetKey:null,guardTime:0,guardCooldown:0,
  guardParryTime:0,guardAttempts:0,hitReactionTime:0,hitLeanSign:1,
  underFireUntil:0,strikePoseTime:0,arenaTargetType:null,arenaTargetId:null,
  arenaLockTime:0,arenaAggroType:null,arenaAggroId:null,arenaAggroUntil:0,
  targetPoint:new T.Vector3(0,0,0),label:{style:{}},hpFill:{style:{}}};
 const bots=[bot],events=[];
 const navigator={heightAt:()=>0,walkableAt:()=>true,isReachable:()=>true,
  clearSegment:()=>true,
  safeAdvance:(from,dir,dist)=>({x:from.x+dir.x*dist,z:from.z+dir.z*dist}),
  findPath:(_from,to)=>[to]};
 Object.assign(ctx,{
  bots,player,arenaMap:'castle',arenaMode:'ffa',isGameActive:true,arenaClock:0,
  THREE:T,navigator,
  arenaMatch:{durationSeconds:240,remaining:200},
  arenaCanTarget:()=>!opts.ally,arenaLineOfSight:()=>!opts.blockSight,
  arenaWorldBlockBetween:()=>!!opts.blockWorld,arenaFriendlyShotBlock:()=>false,
  arenaCanSeeFrom:()=>!opts.blockSight,botTeam:()=> 'red',
  arenaSpawnPool:()=>[new T.Vector3(2,0,0)],
  chooseArenaRespawn:()=>new T.Vector3(2,0,0),
  botDefaultScale:new T.Vector3(1,1,1),
  botHeadProjection:{set(){return this},project(){this.z=2;return this}},
  camera:{},applyBotMotion:()=>{},
  arenaShotTracer:()=>events.push('tracer'),spawnSmokeCloud:()=>{},
  ArenaTelemetry:{
   recordRangedShot:(_t,r,zone)=>events.push('shot:'+r+':'+(zone||'miss')),
   recordKill:()=>{}},
  arenaTelemetry:{},scene:{},particles:[],
  sfx:{playPlayerHit:()=>events.push('hit'),playMetalClang:()=>{}},
  document:{getElementById:()=>({style:{opacity:'0'},textContent:''})},
  window:{innerWidth:1280,innerHeight:720},
  updateHUD:()=>events.push('hud'),addScorePopup:()=>{},addKillFeed:()=>{}
 });
 ctx.Math=Object.create(Math);ctx.Math.random=()=>.5;
 vm.runInContext(targetCode+'\n'+attackCode+
  '\nthis.__tick=function(dt){'+loop+'};',ctx,{timeout:3500});
 return {ctx,bot,player,events,
  tick(dt=.05){ctx.arenaClock+=dt;ctx.__tick(dt)}};
}
test('exact A5 source patched only via the source-hashed player/LOS hotfix',()=>{
 assert.equal(sha256(html),'4066a2c7e10d6f21b54df17cf2ee4c73250ecd6ce556fbf06b043d9aef1db5ec');
 assert.equal(loop.includes('arenaDist <= bot.range && hasClearShot'),true);
});
for(const role of Object.keys(profiles)){
 test(role+' ACTUAL bot update picks human, moves, winds up and applies real HP damage',()=>{
  const x=create(role,{z:role==='musket'||role==='archer'?24:14});
  const initial=x.player.hp;
  let approached=false,windup=false,engaged=false;
  for(let i=0;i<360;i++){
   x.tick(.05);
   if(x.bot.mesh.position.z>1)approached=true;
   if(x.bot.meleeWindup>0||x.bot.rangedWindup>0)windup=true;
   if(x.bot.arenaTargetType==='player')engaged=true;
   if(x.player.hp<initial)break;
  }
  assert(engaged,'No actual player selection');
  assert(approached||role==='musket'||role==='archer','Melee bot never approaches');
  assert(windup,'No attack windup');
  assert(x.player.hp<initial,'HP never fell after real loop: '+role);
 });
}
test('blocked sight: real ranged bot never hits human through a wall',()=>{
 const x=create('musket',{blockSight:true,z:17});
 for(let i=0;i<200;i++)x.tick(.05);
 assert.equal(x.player.hp,100);
 assert.equal(x.bot.rangedWindup,0,'No pointless wall-facing attack windup');
});
test('blocked navigation cannot teleport melee attacker into striking range',()=>{
 const x=create('knight',{z:22});
 x.ctx.navigator.safeAdvance=(from,dir,dist)=>({x:from.x,z:from.z});
 for(let i=0;i<260;i++)x.tick(.05);
 assert.equal(x.player.hp,100);
 assert(x.bot.navRecovery.retargets>0,'AI fails to recover from route obstruction');
});
test('a moving human stays targetable and a real sword strike can land',()=>{
 const x=create('knight',{z:13}),old=x.player.pos.z;
 let sawWindup=false;
 for(let i=0;i<350;i++){
  if(i<60)x.player.pos.z+=.075;
  x.tick(.05);
  sawWindup ||= x.bot.meleeWindup>0;
  if(x.player.hp<100)break;
 }
 assert(x.player.pos.z>old+.5);
 assert(sawWindup);
 assert(x.player.hp<100);
});
test('losing sight DURING archer windup cancels and does not restart a blind attack',()=>{
 const opts={z:15,blockSight:false},x=create('archer',opts);
 for(let i=0;i<100&&x.bot.rangedWindup<=0;i++)x.tick(.05);
 assert(x.bot.rangedWindup>0,'Archer never started real draw');
 opts.blockSight=true;
 for(let i=0;i<90;i++)x.tick(.05);
 assert.equal(x.player.hp,100);
 assert.equal(x.bot.rangedWindup,0,'Blind windup loop resumed');
 assert(!x.events.some(e=>e.startsWith('shot:')));
});
test('TDM ally with a player cannot wind up against own team',()=>{
 const x=create('musket',{z:15,ally:true});
 for(let i=0;i<200;i++)x.tick(.05);
 assert.equal(x.player.hp,100);
 assert.notEqual(x.bot.arenaTargetType,'player');
 assert(!x.events.some(e=>e.startsWith('shot:')));
});
test('real movement is speed-capped and has no teleport',()=>{
 const x=create('pikeman',{z:25});
 let last=x.bot.mesh.position.clone();
 for(let i=0;i<120;i++){
  x.tick(.05);
  const travelled=x.bot.mesh.position.distanceTo(last);
  assert(travelled<=x.bot.speed*.05+.01,'Bot advanced faster than native speed');
  last=x.bot.mesh.position.clone();
 }
 assert(x.bot.mesh.position.z>0,'Bot did not move');
});
