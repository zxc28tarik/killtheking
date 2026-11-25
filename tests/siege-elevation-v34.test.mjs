import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const playable=readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8');
const anchor=html.indexOf('root.ArenaArmyBattle=api;');
assert.ok(anchor>0,'real original G5.4 inlined battle module exists');
const head=html.lastIndexOf('<script',anchor);
const tail=html.indexOf('</script>',anchor);
assert.ok(head>=0&&tail>head);
const source=html.slice(html.indexOf('>',head)+1,tail);
const ctx={ArenaWeaponBalance:{
 aimedShot:(type,origin,target)=>({point:{x:target.x,y:target.y+1.85,z:target.z}}),
 damage:()=>10
}};
vm.runInNewContext(source,ctx,{timeout:4000});
const battle=ctx.ArenaArmyBattle;
assert.ok(battle?.raycastSoldier&&battle?.firstWorldObstacle);

function world(){
 return {soldiers:[
  {id:0,x:0,z:10,siegeY:9,alive:true,hp:100,team:'red',type:'bow'},
  {id:1,x:0,z:24,alive:true,hp:100,team:'red',type:'musket'}],
  worldObstacles:[],elevatedWorldObstacles:[],
  playerActive:true,playerHealth:100,playerPosition:{x:0,y:9,z:10}};
}
test('AK34 original G5.4 actor cylinders occupy their real world elevation',()=>{
 const st=world();
 const low=battle.raycastSoldier(st,{x:0,y:1.85,z:0},{x:0,y:0,z:1},15,'blue');
 assert.equal(low,null,'9m soldier must not be hittable at ground level');
 const high=battle.raycastSoldier(st,{x:0,y:10.85,z:0},{x:0,y:0,z:1},15,'blue');
 assert.equal(high?.targetId,0);
 assert.equal(high?.zone,'body');
 const down=battle.raycastSoldier(st,{x:0,y:10.85,z:0},{x:0,y:-9,z:24},30,'blue');
 assert.equal(down?.targetId,1,'descending shot bypasses raised body it misses and can strike lower opponent');
});
test('AK34 elevated true stone blocks upper shots without ghost ground navigation',()=>{
 const st=world();const stones=[
  {minX:-2,maxX:2,minY:9,maxY:12,minZ:4,maxZ:5},
  {minX:0,maxX:0,minY:9,maxY:12,minZ:7,maxZ:8},
  {minX:-2,maxX:2,minY:1,maxY:5,minZ:6,maxZ:7}
 ];
 assert.equal(battle.setElevatedWorldObstacles(st,stones),true);
 assert.equal(st.elevatedWorldObstacles.length,1);
 assert.equal(st.worldObstacles.length,0);
 assert.equal(battle.firstWorldObstacle(st,{x:0,y:1.85,z:0},{x:0,y:0,z:1},15),null);
 assert.ok(battle.firstWorldObstacle(st,{x:0,y:10.85,z:0},{x:0,y:0,z:1},15)<5);
 assert.equal(battle.raycastSoldier(st,{x:0,y:10.85,z:0},{x:0,y:0,z:1},15,'blue'),null,
  'real high merlon must shield a high defender from a direct shot');
});
test('AK34 player capsule follows the actual feet height; open sky cannot damage through floors',()=>{
 const st=world();
 assert.equal(battle.raycastPlayer(st,{x:0,y:1.85,z:0},{x:0,y:0,z:1},20),null);
 const onWall=battle.raycastPlayer(st,{x:0,y:10.85,z:0},{x:0,y:0,z:1},20);
 assert.ok(onWall&&onWall.zone==='body');
 battle.setPlayerPosition(st,0,10,0);
 assert.equal(st.playerPosition.y,0);
 assert.ok(battle.raycastPlayer(st,{x:0,y:1.85,z:0},{x:0,y:0,z:1},20));
 battle.setPlayerPosition(st,0,10,9);
 assert.equal(st.playerPosition.y,9);
});
test('AK34 native archer flight uses real elevated launch height against lower target',()=>{
 const attacker={id:0,squadId:0,team:'red',type:'bow',x:0,z:0,siegeY:9,alive:true,hp:100,suppression:0};
 const player={x:0,y:0,z:28};
 const st={seed:77,tick:1,squads:[{order:'hold'}],projectiles:[],
  nextProjectileId:1,playerPosition:player,worldObstacles:[]};
 const arrow=battle.launchArrow(st,attacker,player);
 assert.ok(arrow);
 assert.equal(arrow.y,10.85);
 assert.ok(arrow.vy<0,'higher archer fires down at genuine lower target');
 assert.equal(st.projectiles.length,1);
});
test('AK34 keeps original 140 G5.4, 3-map HTML, and one render height authority',()=>{
 const st=battle.create(1600,'musket');
 assert.equal(st.soldiers.length,140);
 assert.equal(st.squads.length,8);
 assert.ok(st.soldiers.every(s=>s.siegeY===undefined));
 assert.equal(st.playerPosition.y,0);
 assert.equal(html,playable);
 assert.equal((html.match(/<script\b/g)||[]).length,31);
 assert.match(html,/rootPosition\.set\(s\.x,Number\.isFinite\(s\.siegeY\)\?s\.siegeY:0,s\.z\)/);
 assert.match(html,/ArenaArmyBattle\.setElevatedWorldObstacles\(meadowBattleState/);
 assert.doesNotMatch(html,/nativeSiegeTowerRenderSoldiers\(\)/,
  'no post-render double shifting of already correctly elevated G5.4 instances');
 assert.match(html,/Math\.max\(0,player\.pos\.y-player\.currentHeight\)/);
});
