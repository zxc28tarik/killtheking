import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const ctx={};
for(const name of ['ArenaWeaponBalance','ArenaArmyBattle']){
 const script=scripts.find(s=>s.includes('root.'+name+'=api;'));
 assert.ok(script,name);runInNewContext(script,ctx);
}
const a=ctx.ArenaArmyBattle;
const ray=(s,y)=>a.raycastPlayer(s,{x:0,y,z:0},{x:1,y:0,z:0},20);
test('BUG13 crouch removes phantom head hits, scales zones on both floors',()=>{
 const s=a.create();
 for(const floor of [0,8]){
  a.setPlayerPosition(s,10,0,floor,2.35);
  assert.equal(ray(s,floor+3.3).zone,'head');
  a.setPlayerPosition(s,10,0,floor,1.35);
  assert.equal(ray(s,floor+3.3),null);assert.equal(ray(s,floor+2.1),null);
  assert.equal(ray(s,floor+1.7).zone,'head');assert.equal(ray(s,floor+1).zone,'body');
  assert.equal(ray(s,floor+.4).zone,'leg');
  const top=a.raycastPlayer(s,{x:10,y:floor+5,z:0},{x:0,y:-1,z:0},10);
  assert.ok(Math.abs(top.point.y-(floor+1.9))<1e-8);assert.equal(top.zone,'head');
 }
});
test('BUG13 continuous transition and backward-compatible default',()=>{
 const s=a.create();a.setPlayerPosition(s,10,0,0,1.85);
 assert.ok(Math.abs(s.playerBodyHeight-2.725)<1e-8);
 assert.equal(ray(s,3),null);assert.ok(ray(s,2.5));
 a.setPlayerPosition(s,10,0,0);assert.equal(ray(s,3.3).zone,'head');
 a.setPlayerPosition(s,10,0,0,NaN);assert.equal(ray(s,3.3).zone,'head');
});
function fixture(friendly=false){
 const s=a.create(42);
 const owner=s.soldiers.find(u=>u.team==='red'&&u.type==='bow');
 const victim=s.soldiers.find(u=>u.team===(friendly?'red':'blue')&&u.type==='musket');
 for(const u of s.soldiers)u.alive=false;
 Object.assign(owner,{alive:true,x:0,z:0,siegeY:0});
 Object.assign(victim,{alive:true,x:12,z:0,siegeY:0,hp:100,maxHp:100});
 s.playerActive=false;
 const p=a.launchArrow(s,owner,victim,{horizontalRoll:.5,verticalRoll:.5});
 assert.ok(p);return {s,owner,victim,p};
}
function fly(s){for(let i=0;i<150&&s.projectiles.length;i++)a.advanceProjectiles(s,.02);}
test('BUG14 released arrow damages after owner death, same damage as living owner',()=>{
 const live=fixture();fly(live.s);assert.ok(live.victim.hp<100);
 const dead=fixture();dead.owner.alive=false;
 assert.equal(a.launchArrow(dead.s,dead.owner,dead.victim),null);
 assert.equal(a.damageSoldier(dead.s,dead.victim.id,10,{attackerId:dead.owner.id,weapon:'bow'}),null);
 fly(dead.s);assert.equal(dead.victim.hp,live.victim.hp);
 assert.equal(dead.s.projectiles.length,0);
 assert.ok(dead.s.combatEvents.some(e=>e.attackerId===dead.owner.id&&e.targetId===dead.victim.id&&e.damage>0));
});
test('BUG14 posthumous kill credits original archer and squad once',()=>{
 const {s,owner,victim}=fixture();owner.alive=false;victim.hp=1;
 const kills=owner.kills,squad=s.squads[owner.squadId],sk=squad.kills,death=s.blueDeaths;
 fly(s);assert.equal(victim.alive,false);assert.equal(owner.kills,kills+1);
 assert.equal(squad.kills,sk+1);assert.equal(s.blueDeaths,death+1);
 fly(s);assert.equal(owner.kills,kills+1);
});
test('BUG14 dead owner cannot use fabricated projectile or hurt friendly',()=>{
 const {s,owner,victim}=fixture(true);owner.alive=false;fly(s);
 assert.equal(victim.hp,100);assert.equal(s.projectiles.length,0);
 const enemy=fixture();enemy.owner.alive=false;
 assert.equal(a.damageSoldier(enemy.s,enemy.victim.id,10,{attackerId:enemy.owner.id,weapon:'bow',projectile:{...enemy.p}}),null);
});
test('BUG13 all three live height bridges and canonical copy',()=>{
 assert.equal((html.match(/ArenaArmyBattle\.setPlayerPosition\(meadowBattleState,player\.pos\.x,player\.pos\.z,\s*player\.pos\.y-player\.currentHeight,player\.currentHeight\)/g)||[]).length,3);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
