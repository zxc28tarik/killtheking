import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {plan}=require('../src/combat-tactics.js');
const nav={heightAt:()=>0,walkableAt:()=>true,clearSegment:()=>true};
const origin={x:0,y:0,z:0};
const decide=(role,x,opts={})=>plan({role,from:origin,target:{x,y:0,z:0},range:opts.range??(role==='pikeman'?5.8:role==='knight'?3.9:34),hasLineOfSight:opts.los??true,navigator:opts.nav??nav,canSeeFrom:opts.canSeeFrom??(()=>true),seed:0});
test('knights press close targets but stop within striking distance',()=>{
 assert.equal(decide('knight',10).mode,'advance');
 assert.equal(decide('knight',2).mode,'hold');
});
test('pikemen defend their minimum spacing',()=>{
 const near=decide('pikeman',1.5);assert.equal(near.mode,'retreat');
 assert.ok(near.goal.x < 0);
 assert.equal(decide('pikeman',4.2).mode,'hold');
 assert.equal(decide('pikeman',12).mode,'advance');
});
test('ranged units retreat if rushed, regardless of current line of sight',()=>{
 assert.equal(decide('archer',5).mode,'retreat');
 assert.equal(decide('musket',7).mode,'retreat');
});
test('ranged units hold a valid clear firing distance',()=>{
 assert.equal(decide('archer',18).mode,'hold');
 assert.equal(decide('musket',18).mode,'hold');
});
test('ranged units approach a distant enemy',()=>assert.equal(decide('musket',32).mode,'advance'));
test('blocked shots produce a reachable new firing point, not blind shots',()=>{
 const result=decide('archer',18,{los:false,canSeeFrom:(candidate)=>candidate.z>0});
 assert.equal(result.mode,'seek-shot');assert.ok(result.goal.z>0);
});
test('blocked shots fallback to advance when no candidate can see',()=>{
 assert.equal(decide('musket',18,{los:false,canSeeFrom:()=>false}).mode,'advance');
});
test('blocked retreat chooses lateral safe space rather than crossing walls',()=>{
 const safeNav={...nav, clearSegment:(from,to)=>to.x>=0 && to.z<0};
 const r=decide('archer',3,{nav:safeNav});
 assert.equal(r.mode,'retreat');assert.ok(r.goal.z<0);
});
test('surrounded bot holds instead of moving through solid obstacles',()=>{
 const obstacleNav={...nav,clearSegment:()=>false};
 assert.equal(decide('archer',5,{nav:obstacleNav}).mode,'hold');
});
test('tactics are independent of player/bot target identity',()=>{
 const src=readFileSync(new URL('../src/combat-tactics.js',import.meta.url),'utf8');
 assert.ok(!src.includes('player.pos'));assert.ok(!src.includes('arenaTargetId'));
});
test('tactics module is wired into free-for-all game without modifying damage rules',()=>{
 const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(game,/ArenaCombatTactics\.plan\(/);
 assert.match(game,/arenaCanSeeFrom\(/);
 assert.match(game,/chooseArenaTarget\(bot\)/);
 assert.match(game,/tacticalMode: b\.tacticMode/);
 assert.ok(html.indexOf('src/combat-tactics.js')<html.indexOf('src/oyun.js'));
});
