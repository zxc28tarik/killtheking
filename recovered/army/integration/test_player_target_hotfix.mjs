import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {patchFfaAggro,patchArmyAggro,sha256} from './player_target_hotfix.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const input=process.env.KTK_FFA_HTML;
if(!input)throw Error('Original independently rebuilt FFA HTML required');
const ffa=readFileSync(input,'utf8');
const engineOriginal=readFileSync(resolve(here,'../mirror/arena-army-battle-true-side-swap.js'),'utf8');
const weapon=readFileSync(resolve(here,'../modules/weapon-balance.js'),'utf8');
function makeFFAMock(html,options={}){
 const begin=html.indexOf('function chooseArenaTarget(bot) {');
 const end=html.indexOf('function markArenaAggro(victim',begin);
 assert(begin>0&&end>begin);
 const script=html.slice(begin,end),base={x:0,y:0,z:0};
 const actors=[{id:0,range:5,mesh:{position:base},dead:false,arenaLockTime:0},
  {id:1,range:5,mesh:{position:{x:14,y:0,z:0}},dead:false},
  {id:2,range:5,mesh:{position:{x:18,y:0,z:0}},dead:false}];
 const player={pos:{x:options.playerX??5,y:0,z:0}};
 const ctx={bots:actors,player,arenaClock:10,isGameActive:true,
  arenaMap:options.map||'castle',
  ArenaBotRecovery:{allows:()=>true},
  arenaCanTarget:(bot,type)=>type!=='player'||options.blockPlayer!==true,
  arenaActorPosition:(type,id)=>type==='player'?player.pos:(actors[id]?.mesh.position||null),
  arenaTargetDistance:(b,type,id)=>{
   const pos=type==='player'?player.pos:actors[id]?.mesh.position;
   return pos?Math.hypot(pos.x-b.mesh.position.x,0):Infinity;
  },
  arenaTargetCount:(type,id,excluding)=>actors.filter(b=>b.id!==excluding&&b.arenaTargetType===type&&
   (type==='player'||b.arenaTargetId===id)).length,
  setArenaTarget:(b,type,id)=>{b.arenaTargetType=type;b.arenaTargetId=id;b.arenaLockTime=12}};
 ctx.Math=Object.create(Math);ctx.Math.random=()=>0.5;
 vm.runInNewContext(script,ctx,{timeout:500});
 return {ctx,bot:actors[0],other:actors,player};
}
test('old A5 selection reproduces bug: closer player ignored in favor of an AI bot',()=>{
 const a=makeFFAMock(ffa);
 assert.equal(a.ctx.chooseArenaTarget(a.bot).type,'bot');
});
test('FFA fix: nearby player is now a normal attack target',()=>{
 const a=makeFFAMock(patchFfaAggro(ffa));
 assert.equal(a.ctx.chooseArenaTarget(a.bot).type,'player');
});
test('FFA: two active player hunters is cap; remaining bot targets other bots',()=>{
 const a=makeFFAMock(patchFfaAggro(ffa));
 a.other[1].arenaTargetType='player';a.other[2].arenaTargetType='player';
 assert.equal(a.ctx.chooseArenaTarget(a.bot).type,'bot');
});
test('FFA: second hunter is permitted, avoiding permanent player immunity',()=>{
 const a=makeFFAMock(patchFfaAggro(ffa));
 a.other[1].arenaTargetType='player';
 assert.equal(a.ctx.chooseArenaTarget(a.bot).type,'player');
});
test('TDM: allied bots are not permitted to attack their own player',()=>{
 const a=makeFFAMock(patchFfaAggro(ffa),{blockPlayer:true});
 assert.equal(a.ctx.chooseArenaTarget(a.bot).type,'bot');
});
test('large meadow: player is detectable at distance 130 without changing weapon range',()=>{
 const a=makeFFAMock(patchFfaAggro(ffa),{map:'meadow',playerX:130});
 a.other[1].dead=true;a.other[2].dead=true;
 assert.equal(a.ctx.chooseArenaTarget(a.bot).type,'player');
});
test('original source remains archived; both targeted changes are SHA-bound',()=>{
 assert.equal(sha256(ffa),'18dca2a895763f0955566f2fc90651f1ab1a98f86597e399cbac42ac2fc6f15a');
 assert.equal(sha256(engineOriginal),'307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 assert.equal(sha256(patchFfaAggro(ffa)),'4066a2c7e10d6f21b54df17cf2ee4c73250ecd6ce556fbf06b043d9aef1db5ec');
 assert.equal(sha256(patchArmyAggro(engineOriginal)),'497c945c059b541fcf76231e7d9ff2983dd8b235e98d7b78b93e9ed52235c348');
});
test('G5.4 real army engine loads and preserves 140 soldiers, both player sides and HOLD',()=>{
 for(const source of [engineOriginal,patchArmyAggro(engineOriginal)]){
  const ctx=vm.createContext({console});
  vm.runInContext(weapon,ctx,{timeout:2500});
  vm.runInContext(source,ctx,{timeout:2500});
  for(const team of ['blue','red']){
   const st=ctx.ArenaArmyBattle.create(1600,'musket',team);
   assert.equal(st.soldiers.length,140);
   assert.equal(st.squads.length,8);
   assert.equal(st.playerTeam,team);
   assert(ctx.ArenaArmyBattle.issueOrder(st,st.playerSquadId,'hold'));
   ctx.ArenaArmyBattle.step(st,0.08);
   assert.equal(st.squads[st.playerSquadId].order,'hold');
  }
 }
});
test('G5.4 genuine native soldier melee/bow engagements damage a nearby enemy player',()=>{
 const ctx=vm.createContext({console});
 vm.runInContext(weapon,ctx,{timeout:2500});
 vm.runInContext(patchArmyAggro(engineOriginal),ctx,{timeout:2500});
 const core=ctx.ArenaArmyBattle;
 const state=core.create(1600,'musket','blue');
 // The player moves into a real red pike/archer formation (not a synthetic hit).
 core.setPlayerPosition(state,163,-26.4);
 const hits=[];
 for(let i=0;i<125;i++){
  core.step(state,.08);
  hits.push(...core.drainPlayerHits(state));
  if(!state.playerActive)break;
 }
 assert(hits.length>=1,'real enemy soldiers must actually strike the player');
 assert(state.playerHealth<100,'genuine hit path must reduce human health');
 assert(hits.every(hit=>state.soldiers[hit.attackerId].team==='red'),
  'friendly soldiers cannot wound the human commander');
});
