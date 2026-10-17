import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require=createRequire(import.meta.url);
const D=require('../src/combat-defense.js');
const pos=(x,z)=>({x,y:0,z});
const evalHit=(attacker,props={})=>D.assessShield({shielding:true,defender:pos(0,0),attacker:pos(...attacker),yaw:0,parryTime:0,melee:true,...props});

test('normal forward block retains 75 percent damage reduction',()=>{
 const r=evalHit([0,-10]);assert.equal(r.kind,'block');assert.equal(r.multiplier,.25);
});
test('rear attacker bypasses shield even during parry',()=>{
 const r=evalHit([0,10],{parryTime:0.12});assert.equal(r.kind,'hit');assert.equal(r.multiplier,1);
});
test('lateral attacker bypasses shield',()=>assert.equal(evalHit([10,0]).kind,'hit'));
test('frontal melee can be perfectly parried only during first 240ms',()=>{
 assert.equal(evalHit([0,-8],{parryTime:.15}).kind,'parry');
 assert.equal(evalHit([0,-8],{parryTime:0}).kind,'block');
 assert.equal(D.PARRY_DURATION,.24);
});
test('parry does not apply to musket/arrow attacks',()=>{
 const r=evalHit([0,-8],{parryTime:.1,melee:false});assert.equal(r.kind,'block');
});
test('raising shield with no parry window still blocks',()=>assert.equal(evalHit([0,-7],{parryTime:0}).kind,'block'));
test('without shield even frontal attack hits normally',()=>assert.equal(evalHit([0,-7],{shielding:false,parryTime:.2}).kind,'hit'));
test('yaw rotates shield direction along game camera -Z convention',()=>{
 assert.equal(evalHit([-9,0],{yaw:Math.PI/2,parryTime:.1}).kind,'parry');
 assert.equal(evalHit([0,-9],{yaw:Math.PI/2,parryTime:.1}).kind,'hit');
});
test('parry state is isolated to player knight, bot attacks and freeze',()=>{
 const src=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(src,/player\.classIdx === 0 && player\.isShielding/);
 assert.match(src,/bot\.staggerTime = ArenaCombatDefense\.STAGGER_DURATION/);
 assert.match(src,/if \(bot\.staggerTime > 0\)/);
 assert.match(src,/player\.shieldParryCooldown <= 0/);
 assert.match(src,/player\.shieldParryTime = 0;/);
 assert.match(html,/src\/combat-defense\.js/);
 assert.ok(html.indexOf('src/combat-defense.js') < html.indexOf('src/oyun.js'));
});

test('melee bots telegraph an attack before applying damage',()=>{
 const src=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 assert.match(src,/bot\.meleeWindup = ArenaBotOffense\.windup\(bot\.role\)/);
 const O=require('../src/arena-bot-offense.js');
 for(const role of ['knight','pikeman']){
  assert.ok(O.windup(role)>=.30,'melee attack windup stays reactable');
 }
 assert.match(src,/if \(bot\.meleeWindup > 0\)/);
 assert.match(src,/arenaLineOfSight\(bot, targetPosition, arenaTarget\.type === 'player'\)/);
 assert.match(src,/bot\.meleeWindup = 0;\s*bot\.windupTargetKey = null;\s*bot\.attackTimer = 0\.35/);
});
