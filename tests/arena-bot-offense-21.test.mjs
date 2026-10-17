import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const AI=require('../src/arena-bot-offense.js');
const {plan}=require('../src/combat-tactics.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const nav={heightAt:()=>0,walkableAt:()=>true,clearSegment:()=>true,
 isReachable:()=>true};
const decide=(role,distance,options={})=>plan({
 role,from:{x:0,y:0,z:0},target:{x:distance,y:0,z:0},
 range:role==='archer'?32:role==='musket'?34:role==='knight'?3.9:5.8,
 hasLineOfSight:options.los??true,
 underPressure:options.underPressure??false,
 navigator:options.navigator??nav,canSeeFrom:()=>true,seed:0
});

test('all four combat roles have differentiated telegraphs and cooldown envelopes',()=>{
 for(const role of ['knight','pikeman','archer','musket']){
  const p=AI.profile(role);
  assert.ok(p.windup>=.25&&p.windup<=.42);
  assert.ok(p.cooldown>=1.2&&p.cooldown<=15);
  assert.ok(AI.nextCooldown(role,1)>=AI.nextCooldown(role,0));
  assert.equal(AI.nextCooldown(role,-2),p.cooldown);
  assert.equal(AI.nextCooldown(role,2),p.cooldown+p.variance);
  assert.equal(AI.windup(role),p.windup);
 }
 assert.ok(AI.nextCooldown('musket',0)>AI.nextCooldown('knight',0));
 assert.throws(()=>AI.profile('magic'),/Unsupported bot role/);
});

test('weapon aim checks require real forward alignment, including negative-pi wraparound',()=>{
 const origin={x:0,z:0};
 assert.equal(AI.facing('musket',0,origin,{x:0,z:10}),true);
 assert.equal(AI.facing('musket',Math.PI,origin,{x:0,z:10}),false);
 assert.equal(AI.facing('knight',Math.PI/2,origin,{x:10,z:0}),true);
 assert.equal(AI.facing('archer',-Math.PI+0.04,origin,{x:0,z:-12}),true);
 assert.equal(AI.facing('musket',0,origin,{x:10,z:0}),false);
 assert.equal(AI.facing('musket',NaN,origin,{x:0,z:10}),false);
});

test('knights detect visible player melee preparation without omniscient sight',()=>{
 const params={classIdx:0,attackTime:.5,distance:4,visible:true};
 assert.equal(AI.playerMeleeThreat(params),true);
 assert.equal(AI.playerMeleeThreat({...params,classIdx:1}),true);
 assert.equal(AI.playerMeleeThreat({...params,classIdx:3}),false);
 assert.equal(AI.playerMeleeThreat({...params,attackTime:.05}),false);
 assert.equal(AI.playerMeleeThreat({...params,distance:18}),false);
 assert.equal(AI.playerMeleeThreat({...params,visible:false}),false);
});

test('ranged bot strafes laterally while under fire and keeps baseline hold when safe',()=>{
 for(const role of ['archer','musket']){
  assert.equal(decide(role,18).mode,'hold');
  const result=decide(role,18,{underPressure:true});
  assert.equal(result.mode,'strafe');
  assert.ok(Math.abs(result.goal.x)<.1,'first strafe should be lateral, not a charge');
  assert.ok(Math.abs(result.goal.z)>=2.5);
  assert.equal(decide(role,5,{underPressure:true}).mode,'retreat');
 }
});

test('ranged bot cannot strafe through world collision or disconnected areas',()=>{
 const blocked={...nav,clearSegment:()=>false};
 assert.equal(decide('archer',18,{underPressure:true,navigator:blocked}).mode,'hold');
 const restricted={...nav,isReachable:(from,goal)=>goal.z>0};
 const result=decide('musket',18,{underPressure:true,navigator:restricted});
 assert.equal(result.mode,'strafe');
 assert.ok(result.goal.z>0);
});

test('player and six-bot FFA use the new shared weapon damage distribution',()=>{
 const part=game.slice(game.indexOf('const BOT_PROFILES = ['),game.indexOf('const COURTYARD_SPAWNS = ['));
 const damages=[...part.matchAll(/damage: (\d+), preferWall: /g)].map(x=>Number(x[1]));
 assert.deepEqual(damages,[20,90,35,23,20,90]);
 for(const amount of damages)assert.ok(amount>=20&&amount<=90);
 assert.match(game,/name: 'TÜFEKÇİ \(1600 MUSKET\)'[\s\S]*?damage: 90/);
 assert.match(game,/name: 'ŞÖVALYE \(KILIÇ & KALKAN\)'[\s\S]*?damage: 20/);
 assert.equal(damages.length,6);
});

test('ranged telegraphs are cancellable on loss of sight and bot attacks require facing',()=>{
 assert.match(game,/if \(!arenaLineOfSight\(bot, targetPos, target\.type === 'player'\)\) return;/);
 assert.match(game,/if \(!ArenaBotOffense\.facing\(bot\.role, bot\.mesh\.rotation\.y, bot\.mesh\.position, targetPos\)\)/);
 assert.match(game,/if \(bot\.rangedWindup > 0\) \{/);
 assert.match(game,/!arenaLineOfSight\(bot, targetPosition, arenaTarget\.type === 'player'\)/);
 assert.match(game,/bot\.rangedWindup = ArenaBotOffense\.windup\(bot\.role\)/);
 assert.match(game,/bot\.meleeWindup = ArenaBotOffense\.windup\(bot\.role\)/);
 assert.match(game,/ArenaBotOffense\.nextCooldown\(bot\.role, Math\.random\(\)\)/);
});

test('pressure is based on actual received damage and resets between lives',()=>{
 assert.match(game,/bot\.underFireUntil = \(typeof arenaClock === 'number' \? arenaClock : 0\) \+ 2/);
 assert.match(game,/victim\.underFireUntil = \(typeof arenaClock === 'number' \? arenaClock : 0\) \+ 2/);
 assert.match(game,/underPressure: arenaClock < bot\.underFireUntil/);
 assert.match(game,/bot\.underFireUntil = 0/);
 assert.match(game,/bot\.rangedWindup = 0/);
 assert.match(game,/const playerMeleeThreat = !threat && ArenaBotOffense\.playerMeleeThreat/);
 assert.match(game,/bot\.guardCooldown = 2\.4/);
});

test('existing autonomous FFA, collision-safe routes, slide-hop and graphics remain',()=>{
 assert.match(game,/if \(other\.id === bot\.id \|\| other\.dead\) continue;/);
 assert.match(game,/chooseArenaTarget\(bot\)/);
 assert.match(game,/navigator\.safeAdvance\(botGround, stepDir/);
 assert.match(game,/ArenaBotRecovery\.advance\(/);
 assert.match(game,/function buildCastleArena\(\)/);
 assert.match(game,/ArenaPlayerCollision\.move/);
 assert.ok(html.indexOf('src/arena-bot-offense.js')<html.indexOf('src/oyun.js'));
 assert.match(html,/src\/arena-telemetry\.js/);
});
