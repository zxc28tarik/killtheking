import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const T=require('../src/arena-teams.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
function cut(startName,endName){
 const start=game.indexOf('        function '+startName+'(');
 const end=game.indexOf('        '+endName,start+20);
 assert.ok(start>=0&&end>start);
 return game.slice(start,end);
}

test('player attacks cannot injure blue allied bots in TDM before any hit feedback',()=>{
 const fn=vm.runInNewContext('('+cut('damageBot','// ============================================================================')+')',
  {ArenaTeams:T,arenaMode:'tdm',botTeam:bot=>T.teamForBot(bot.id)});
 const ally={id:0,dead:false,hp:100};
 assert.doesNotThrow(()=>fn(ally,80,false,'Tüfek'));
 assert.equal(ally.hp,100);
});

test('bot against bot allied attacks are discarded before shield, damage and kill logic',()=>{
 const src=cut('damageBotFromBot','function arenaFriendlyShotBlock');
 const fn=vm.runInNewContext('('+src+')',
  {ArenaTeams:T,arenaMode:'tdm',botTeam:bot=>T.teamForBot(bot.id)});
 const attacker={id:0,dead:false},victim={id:2,dead:false,hp:100};
 assert.doesNotThrow(()=>fn(attacker,victim,90));
 assert.equal(victim.hp,100);
});

test('friendly actor mesh shields allied bots from projectiles, only in TDM',()=>{
 const fn=vm.runInNewContext('('+cut('arenaFriendlyShotBlock','function arenaBotAttack')+')',{
  arenaMode:'tdm',
  bots:[{id:0,dead:false,mesh:{id:'shooter'}},{id:1,dead:false,mesh:{id:'red'}},
   {id:2,dead:false,mesh:{id:'blue'}}],
  player:{},
  botTeam:b=>T.teamForBot(b.id),ArenaTeams:T,THREE:{},
  ArenaCombatHit3D:{
   resolveBot(_T,_from,_to,mesh){return mesh.id==='blue'?{distance:4}:null;},
   resolvePlayer(){return null;}
  }
 });
 const origin={x:0,y:1,z:0};
 assert.equal(fn({id:0,dead:false},origin,{point:{x:10,y:1,z:0},distance:10}),true);
 assert.equal(fn({id:0,dead:false},origin,{point:{x:2,y:1,z:0},distance:2}),false);
});

test('same shooter must remain enemy-limited through lock, retaliate and attack',()=>{
 assert.match(game,/arenaCanTarget\(bot,bot\.arenaAggroType,bot\.arenaAggroId\)/);
 assert.match(game,/arenaCanTarget\(bot,bot\.arenaTargetType,bot\.arenaTargetId\)/);
 assert.match(game,/if \(!arenaCanTarget\(bot,target\.type,target\.id\)\) return/);
 assert.match(game,/!arenaFriendlyShotBlock\(bot,origin,hit3d\)/);
});
