import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const W=require('../src/weapon-balance.js');
const src=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const from=src.indexOf('        window.selectClass = function(idx) {');
const to=src.indexOf('        function updateHUD()',from);
assert.ok(from>=0&&to>from);
const body=src.slice(from,to);
function setup({playing=true,clock=10,hp=40}={}){
 const elements={};
 const el=id=>elements[id]??(elements[id]={
  classList:{add(){},toggle(name,bool){elements[id].lastToggle={name,bool};}},
  style:{},textContent:'',className:'',innerHTML:''
 });
 const player={
  maxHp:100,hp,classIdx:3,
  lastMusketShotAt:0,lastBowShotAt:-Infinity,attackCooldown:0,
  isReloading:false,reloadTimer:0,isDrawingBow:false,isShielding:false,
  tpsMotionState:{},ammo:1
 };
 const ctx={player,isGameActive:playing,activeWeaponSwing:{},
  ArenaCharacterMotion:{createState:()=>({phase:0})},
  CLASSES:[{maxHp:130},{maxHp:110},{maxHp:100},{maxHp:100}],
  ArenaWeaponBalance:W,arenaClock:clock,
  document:{getElementById:el},viewmodels:[],playerClassModels:[],
  updateHUD(){},window:{}};
 vm.createContext(ctx);vm.runInContext(body,ctx);
 return {select:ctx.window.selectClass,ctx,player,elements};
}
test('live class swapping preserves fraction rather than restoring full HP',()=>{
 const a=setup();
 a.select(0);
 assert.equal(a.player.maxHp,130);
 assert.equal(a.player.hp,52);
 a.select(3);
 assert.equal(a.player.maxHp,100);
 assert.equal(a.player.hp,40);
});
test('new class selections in menu can still start at full HP',()=>{
 const a=setup({playing:false,hp:20});
 a.select(0);
 assert.equal(a.player.hp,130);
});
test('musket class return cannot bypass fifteen second reload',()=>{
 const a=setup();
 a.select(0);
 a.select(3);
 assert.equal(a.player.isReloading,true);
 assert.equal(a.player.ammo,0);
 assert.equal(a.player.reloadTimer,5);
 assert.deepEqual(a.elements['reload-indicator'].lastToggle,{name:'hidden',bool:false});
 a.ctx.arenaClock=15.01;
 a.select(0);a.select(3);
 assert.equal(a.player.ammo,1);
 assert.equal(a.player.isReloading,false);
 assert.deepEqual(a.elements['reload-indicator'].lastToggle,{name:'hidden',bool:true});
});
