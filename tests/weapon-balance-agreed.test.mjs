import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const W=require('../src/weapon-balance.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('approved sword, spear, dagger and musket exact damage on four regions',()=>{
 assert.deepEqual([W.damage('sword','body'),W.damage('sword','head'),W.damage('sword','leg')],[20,30,16]);
 assert.deepEqual([W.damage('spear','body'),W.damage('spear','head'),W.damage('spear','arm')],[35,52.5,28]);
 assert.deepEqual([W.damage('dagger','body'),W.damage('dagger','head'),W.damage('dagger','leg')],[10,15,8]);
 assert.deepEqual([W.damage('musket','body'),W.damage('musket','head'),W.damage('musket','arm'),W.damage('musket','leg')],[90,135,80,80]);
});
test('5 sword and 3 spear body hits kill 100 HP; single musket body does not',()=>{
 assert.equal(Math.ceil(100/W.damage('sword','body')),5);
 assert.equal(Math.ceil(100/W.damage('spear','body')),3);
 assert.equal(Math.ceil(100/W.damage('musket','body')),2);
 assert.equal(Math.ceil(100/W.damage('musket','head')),1);
 assert.equal(Math.ceil(130/W.damage('musket','head')),1);
});
test('bow progression gives medium 4-5 body arrows; full draw 3 arrows',()=>{
 for(const [draw,expected] of [[.2,14],[.5,23],[.6,25],[1,35]]){
  assert.equal(W.damage('bow','body',draw),expected);
  assert.equal(W.damage('bow','head',draw),Math.round(expected*150)/100);
  assert.equal(W.damage('bow','arm',draw),Math.round(expected*80)/100);
 }
 assert.equal(Math.ceil(100/W.damage('bow','body',.5)),5);
 assert.equal(Math.ceil(100/W.damage('bow','body',.6)),4);
 assert.equal(Math.ceil(100/W.damage('bow','body',1)),3);
});
test('strict global 4-second bow and 15-second musket intervals',()=>{
 assert.equal(W.SHOT_INTERVAL.bow,4);
 assert.equal(W.SHOT_INTERVAL.musket,15);
 assert.equal(60/W.SHOT_INTERVAL.bow,15);
 assert.equal(60/W.SHOT_INTERVAL.musket,4);
 assert.equal(W.ready(10,13.99,'bow'),false);
 assert.equal(W.ready(10,14,'bow'),true);
 assert.equal(W.ready(10,24.99,'musket'),false);
 assert.equal(W.ready(10,25,'musket'),true);
 assert.equal(W.ready(-Infinity,0,'musket'),true);
});
test('hit classification prioritizes tagged anatomy over vertical approximations',()=>{
 assert.equal(W.zoneFromMesh({userData:{hitZone:'arm'}},3,0),'arm');
 assert.equal(W.zoneFromMesh({userData:{isHead:true}},3,0),'head');
 assert.equal(W.zoneFromMesh(null,.8,0),'leg');
 assert.equal(W.zoneFromAim(2.8,0),'head');
 assert.equal(W.zoneFromAim(1.5,0),'body');
});
test('project uses shared module on both player and AI damage pipelines',()=>{
 assert.ok(html.indexOf('src/weapon-balance.js')<html.indexOf('src/oyun.js'));
 assert.match(game,/ArenaWeaponBalance\.damage\('musket',zone\)/);
 assert.match(game,/ArenaWeaponBalance\.damage\('bow',zone,arr\.charge\)/);
 assert.match(game,/ArenaWeaponBalance\.damage\('dagger','body'\)/);
 assert.match(game,/ArenaWeaponBalance\.weaponForRole\(bot\.role\)/);
 assert.match(game,/ArenaWeaponBalance\.damage\(weapon, zone/);
 assert.match(game,/ArenaWeaponBalance\.SHOT_INTERVAL\[bot\.role === 'archer' \? 'bow' : 'musket'\]/);
 assert.match(game,/player\.lastBowShotAt = arenaClock/);
 assert.match(game,/player\.lastMusketShotAt = arenaClock/);
});
