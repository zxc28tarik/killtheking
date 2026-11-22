/* Native S3C1 castle safety after a long-running real G5.4 soldier tick.
 * Injected invalid movement is QA only; soldier ID, HP, G5.4 clock
 * and original enemy-side AI remain source-authoritative.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const map=require('./siege-map.js');
const traversal=require('./siege-traversal.js');
const obj=require('./siege-objectives.js');
const structure=require('./siege-structure-combat.js');
const bridge=require('./siege-real-army-bridge.js');
const native=readFileSync(new URL('../army/mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
const balance=readFileSync(new URL('../army/modules/weapon-balance.js',import.meta.url),'utf8');
const c=vm.createContext({console});
vm.runInContext(balance,c,{timeout:3000});
vm.runInContext(native,c,{timeout:3000});
const A=c.ArenaArmyBattle;
const make=(physics=traversal)=>bridge.create({
 armyEngine:A,map,objectives:obj,traversal:physics,
 playerTeam:'red',playerType:'sword',seed:1600,
 structureCombatEngine:structure
});
test('AK-03b native soldier wall-penetration rollback retains original G5.4 source and soldier HP',()=>{
 assert.equal(createHash('sha256').update(native).digest('hex'),
  '307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 let injected=0;
 const physical={
  ...traversal,
  move(...args){
   const result=traversal.move(...args);
   if(injected++===0)return {...result,x:0,z:-40,blockedX:false,blockedZ:false};
   return result;
  }
 };
 const b=make(physical),first=b.state.soldiers[0];
 const before={id:first.id,x:first.x,z:first.z,hp:first.hp,alive:first.alive};
 assert.equal(traversal.overlaps({x:before.x,y:0,z:before.z},
   map.spec,b.scenario,.65,2.6),false);
 assert.equal(traversal.overlaps({x:0,y:0,z:-40},
   map.spec,b.scenario,.65,2.6),true);
 bridge.step(b,.08);
 const report=bridge.snapshot(b);
 assert.equal(report.terrainRecoveredSoldierMoves,1);
 assert.equal(report.rejectsInvalidStonePenetrationWithoutTeleport,true);
 assert.equal(first.id,before.id);
 assert.equal(first.x,before.x);
 assert.equal(first.z,before.z);
 assert.equal(first.hp,before.hp);
 assert.equal(first.alive,before.alive);
 assert.equal(b.state.soldiers.length,140);
 assert.equal(b.state.squads.length,8);
 assert.equal(b.state.playerKills,0);
 for(let i=0;i<5;i++)bridge.step(b,.08);
 assert.equal(bridge.snapshot(b).terrainRecoveredSoldierMoves,1);
});
test('AK-03b native real siege never silently hides an ALREADY embedded old soldier pose',()=>{
 const b=make();
 const u=b.state.soldiers.find(x=>x.team==='red'&&x.type==='sword');
 u.x=0;u.z=-40;
 assert.throws(()=>bridge.step(b,.08),/previous soldier pose already embeds stone/);
});
test('AK-03b accepted G5.4 castle positions remain physical and do not create fake damage',()=>{
 const b=make();
 for(let i=0;i<45;i++)bridge.step(b,.08);
 assert.equal(bridge.snapshot(b).terrainRecoveredSoldierMoves,0);
 assert.equal(b.scenario.gate.hp,600);
 assert.equal(b.scenario.winner,null);
 assert.equal(b.state.soldiers.length,140);
});
