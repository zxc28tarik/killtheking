import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three-r128.js');
const defense=require('../src/combat-defense.js');
const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const start=source.indexOf('        function damageBotFromBot(attacker, victim, damage) {');
const end=source.indexOf('        function arenaBotAttack(',start);
assert.ok(start>=0 && end>start);
function strike({guardTime=0,parry=0,attackerZ=-2,role='knight'}={}) {
 let clang=0,aggro=0,killFeeds=0;
 const attacker={id:2,role:'pikeman',dead:false,mesh:{position:new THREE.Vector3(0,0,attackerZ)},
   weapon:'Kargı',arenaKills:0,staggerTime:0,meleeWindup:.1};
 const victim={id:0,role,dead:false,hp:100,maxHp:100,guardTime,
   guardParryTime:parry,guardFacingYaw:0,
   mesh:{position:new THREE.Vector3(),scale:{set(){}}},label:{style:{}},name:'Knight'};
 const fn=vm.runInNewContext('('+source.slice(start,end)+')',{
    THREE,ArenaCombatDefense:defense,sfx:{playMetalClang(){clang++}},
    spawnHitSparks(){},markArenaAggro(){aggro++},addKillFeed(){killFeeds++}
 });
 fn(attacker,victim,20);
 return {attacker,victim,clang,aggro,killFeeds};
}
test('front-facing bot shield reduces incoming damage without player kill credit',()=>{
 const x=strike({guardTime:.6});
 assert.equal(x.victim.hp,95);
 assert.equal(x.attacker.arenaKills,0);
 assert.equal(x.clang,1);
});
test('bot perfect parry prevents damage and staggers the attacker',()=>{
 const x=strike({guardTime:.6,parry:.15});
 assert.equal(x.victim.hp,100);
 assert.equal(x.attacker.staggerTime,defense.STAGGER_DURATION);
 assert.equal(x.attacker.meleeWindup,0);
 assert.equal(x.attacker.arenaKills,0);
});
test('bot rear guard cannot prevent damage',()=>{
 const x=strike({guardTime:.6,parry:.15,attackerZ:2});
 assert.equal(x.victim.hp,80);
 assert.equal(x.clang,0);
});
test('non-knight bot cannot block with a stale guard timer',()=>{
 const x=strike({guardTime:.6,parry:.15,role:'pikeman'});
 assert.equal(x.victim.hp,80);
});
test('bot guard responds to wind-up, has cooldown and visible defensive arm',()=>{
 assert.match(source,/other\.meleeWindup > 0 && other\.arenaTargetType === 'bot'/);
 assert.match(source,/threat\.meleeWindup <= 0\.18/);
 assert.match(source,/bot\.guardCooldown = 2\.4/);
 assert.match(source,/guard: bot\.guardTime > 0/);
 assert.match(source,/parts\.leftArm\.rotation\.x = THREE\.MathUtils\.lerp/);
});
