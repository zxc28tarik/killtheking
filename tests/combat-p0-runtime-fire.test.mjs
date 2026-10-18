import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three-r128.js');
const W=require('../src/weapon-balance.js');
const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const start=source.indexOf('        function arenaBotAttack(bot, target, targetDistance) {');
const end=source.indexOf('        // Check if player hit an explosive barrel',start);
assert.ok(start>=0&&end>start);
const body=source.slice(start,end);

function arena({rolls=[.5,.5],blocked=false,clock=100,playerHp=100}={}){
 const enemy={id:1,dead:false,mesh:{position:new THREE.Vector3(0,0,0)}};
 const attacker={id:0,role:'musket',weapon:'Tüfek',dead:false,staggerTime:0,
  lastRangedShotAt:-Infinity,mesh:{position:new THREE.Vector3(0,0,-20),rotation:{y:0}},
  strikePoseTime:0,attackTimer:0};
 const player={classIdx:3,isShielding:false,shieldParryTime:0,
  pos:new THREE.Vector3(0,2.35,0),currentHeight:2.35,
  hp:playerHp,maxHp:playerHp,isSliding:false};
 const hits=[],traces=[];
 let i=0;
 const context={THREE,Math:Object.assign(Object.create(Math),{random:()=>rolls[(i++)%rolls.length]}),
  bot:{},bots:[attacker,enemy],player,
  isGameActive:true,arenaClock:clock,ArenaWeaponBalance:W,
  ArenaBotOffense:{facing:()=>true,nextCooldown:()=>1.5},
  arenaActorPosition:(type,id)=>type==='player'?player.pos:enemy.mesh.position,
  arenaLineOfSight:()=>true,arenaWorldBlockBetween:()=>blocked,
  arenaShotTracer:(a,b)=>traces.push(b.clone()),spawnSmokeCloud:()=>{},
  damageBotFromBot:(a,b,d)=>hits.push(d),
  ArenaCombatDefense:{assessShield:()=>({kind:'hit'})},
  sfx:{playPlayerHit(){}},
  setTimeout(){},
  updateHUD(){},
  document:{getElementById:()=>({style:{}})}
 };
 vm.createContext(context);
 const attack=vm.runInContext('('+body+')',context);
 return {attack,context,attacker,enemy,player,hits,traces};
}

test('ranged AI hits a physical body and cannot hit again before fifteen seconds',()=>{
 const a=arena();
 a.attack(a.attacker,{type:'bot',id:1},20);
 assert.deepEqual(a.hits,[90]);
 assert.equal(a.traces.length,1);
 assert.equal(a.attacker.lastRangedShotAt,100);
 a.context.arenaClock=114.99;
 a.attack(a.attacker,{type:'bot',id:1},20);
 assert.deepEqual(a.hits,[90]);
 assert.equal(a.traces.length,1);
 a.context.arenaClock=115;
 a.attack(a.attacker,{type:'bot',id:1},20);
 assert.deepEqual(a.hits,[90,90]);
 assert.equal(a.traces.length,2);
});

test('misses and blocked muzzle paths consume the shot but never grant bot hits',()=>{
 for(const settings of [{rolls:[1,.5],blocked:false},{rolls:[.5,.5],blocked:true}]){
  const a=arena(settings);
  a.attack(a.attacker,{type:'bot',id:1},20);
  assert.deepEqual(a.hits,[]);
  assert.equal(a.traces.length,1);
  assert.equal(a.attacker.lastRangedShotAt,100);
 }
});

test('the same anatomical weapon calculator damages player, not magical auto hits',()=>{
 const a=arena({playerHp:100});
 a.attack(a.attacker,{type:'player',id:null},20);
 assert.equal(a.player.hp,10,'90 HP to player body, same as bots');
 const b=arena({rolls:[1,.5],playerHp:100});
 b.attack(b.attacker,{type:'player',id:null},20);
 assert.equal(b.player.hp,100,'a missed shot cannot damage the player');
});
