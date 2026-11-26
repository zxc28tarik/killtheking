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
const unit=(id,x,z,team,siegeY=0,type='musket')=>({id,x,z,team,siegeY,type,alive:true,hp:100,squadId:0});
const state=(soldiers=[])=>({soldiers,worldObstacles:[],playerActive:true,playerHealth:100,playerTeam:'blue',playerPosition:{x:10,y:0,z:0},squads:[{order:'hold'}],seed:2,tick:1,projectiles:[],nextProjectileId:1,playerHitCooldown:0,playerHits:[]});
const ray=(s,y,team='blue')=>a.raycastSoldier(s,{x:0,y,z:0},{x:1,y:0,z:0},30,team,{firstBody:true,returnFriendly:true});
test('BUG01 elevated soldier can be hit only at actual height and correct local zone',()=>{
 const s=state([unit(0,10,0,'red',8)]);
 assert.equal(ray(s,1.85),null);
 assert.equal(ray(s,9.85).targetId,0);
 assert.equal(ray(s,10.8).zone,'head');
 assert.equal(ray(s,8.5).zone,'leg');
 s.soldiers[0].siegeY=0;
 assert.equal(ray(s,9.85),null);assert.equal(ray(s,1.85).targetId,0);
});
test('BUG01 first physical body on its own height intercepts ray',()=>{
 const s=state([unit(0,5,0,'blue',0),unit(1,10,0,'red',8)]);
 assert.equal(ray(s,9.85).targetId,1);
 s.soldiers[0].siegeY=8;
 assert.equal(ray(s,9.85).targetId,0);
 const down=a.raycastSoldier(s,{x:10,y:15,z:0},{x:0,y:-1,z:0},10,'blue');
 assert.equal(down.targetId,1);assert.equal(down.zone,'head');
});
test('BUG02 player height updates, resets and anatomical zones remain local',()=>{
 const s=state();
 a.setPlayerPosition(s,10,0,8);
 const hit=y=>a.raycastPlayer(s,{x:0,y,z:0},{x:1,y:0,z:0},20);
 assert.equal(s.playerPosition.y,8);assert.equal(hit(1.85),null);
 assert.equal(hit(9.85).zone,'body');assert.equal(hit(10.8).zone,'head');
 a.setPlayerPosition(s,10,0);assert.equal(s.playerPosition.y,0);
 assert.equal(hit(9.85),null);assert.equal(hit(1.85).zone,'body');
 a.setPlayerPosition(s,10,0,NaN);assert.equal(s.playerPosition.y,0);
});
test('BUG01/02 ranged attacks aim at world height, not old ground proxy',()=>{
 const attacker=unit(0,0,0,'red',8),target=unit(1,20,0,'blue',0);
 const s=state([attacker,target]);
 const opts={horizontalRoll:.5,verticalRoll:.5};
 const shot=a.traceRangedAttack(s,attacker,target,opts);
 assert.ok(shot?.impact);assert.equal(shot.impact.targetId,1);
 a.setPlayerPosition(s,10,0,8);
 assert.ok(a.tracePlayerMusket(s,attacker,opts));
 attacker.type='bow';
 const arrow=a.launchArrow(s,attacker,s.playerPosition,opts);
 assert.ok(arrow);assert.equal(arrow.y,9.85);
});
test('BUG01/02 runtime uses real elevation and both release HTML copies match',()=>{
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
 assert.equal((html.match(/ArenaArmyBattle\.setPlayerPosition\(meadowBattleState,player\.pos\.x,player\.pos\.z,\s*player\.pos\.y-player\.currentHeight,player\.currentHeight\)/g)||[]).length,3);
 assert.match(html,/u\.siegeY=walk\.y/);assert.match(html,/u\.siegeY=fall\.y/);
});
