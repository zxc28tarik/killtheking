import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const ctx={console};
for(const name of ['ArenaWeaponBalance','ArenaArmyBattle']){
 const script=scripts.find(s=>s.includes('root.'+name+'=api;'));
 assert.ok(script,name);runInNewContext(script,ctx);
}
const three=readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8');
runInNewContext(three,ctx);
const V=ctx.THREE.Vector3;
ctx.player={pos:new V(10,10.35,20),currentHeight:2.35,isThirdPerson:true};
ctx.camera={position:new V(10.65,11,24.2),quaternion:new ctx.THREE.Quaternion()};
let blocked=false,los=[];
ctx.arenaWorldBlockBetween=(a,b)=>{los.push([a.clone(),b.clone()]);return blocked};
const helpers=html.slice(html.indexOf('function playerAttackOrigin()'),html.indexOf('// BUG15: compare all physical contacts before applying any damage.'));
const h=runInNewContext(helpers+'\n({playerAttackOrigin,playerAttackDirection,shieldBashPoint})',ctx);
const xyz=v=>[v.x,v.y,v.z];
test('BUG11 origin is physical player in both viewpoints and is a copy',()=>{
 for(const mode of [false,true]){
  ctx.player.isThirdPerson=mode;
  ctx.camera.position.set(100,100,100);
  const p=h.playerAttackOrigin();
  assert.deepEqual(xyz(p),[10,10.35,20]);p.x=99;assert.equal(ctx.player.pos.x,10);
  assert.deepEqual(xyz(h.playerAttackDirection()),[0,0,-1]);
 }
});
test('BUG11 actual dagger and barrel casts use shared origin',()=>{
 const rays=[];
 ctx.worldMeshes=[];ctx.bots=[];ctx.barrels=[];ctx.meadowBattleMode=false;ctx.meadowBattleState=null;
 ctx.raycaster={set:(o,d)=>rays.push([o.clone(),d.clone()]),intersectObjects:()=>[]};
 ctx.ArenaMeleeContact={selectContact:({castRay})=>castRay(0,5.2)};
 const start=html.indexOf('function nearestMusketImpact('),end=html.indexOf('// Physical weapon hits against instanced',start);
 const actions=runInNewContext(html.slice(start,end)+'\n({nearestMusketImpact,arenaPlayerMeleeContact})',ctx);
 assert.equal(actions.nearestMusketImpact(90),null);
 assert.equal(actions.arenaPlayerMeleeContact('dagger',5.2),null);
 assert.equal(rays.length,2);
 for(const [o] of rays)assert.deepEqual(xyz(o),xyz(ctx.player.pos));
});
test('BUG12 shield rejects different floors, rear targets and excessive 3D reach',()=>{
 const forward=new V(0,0,-1);
 assert.equal(h.shieldBashPoint({x:10,y:0,z:17},forward,.52),null);
 assert.equal(h.shieldBashPoint({x:10,y:16,z:17},forward,.52),null);
 assert.equal(h.shieldBashPoint({x:10,y:8,z:23},forward,.52),null);
 assert.equal(h.shieldBashPoint({x:10,y:9,z:13.55},forward,.52),null);
});
test('BUG12 shield hits same elevated floor with actual body-level LOS, blocks walls',()=>{
 const forward=new V(0,0,-1), target={x:10,y:8,z:17};
 los=[];blocked=false;
 const p=h.shieldBashPoint(target,forward,.52);
 assert.deepEqual(xyz(p),[10,9.6,17]);
 assert.ok(Math.abs(los[0][0].y-9.6)<1e-9);
 assert.equal(los[0][1].y,9.6);
 blocked=true;assert.equal(h.shieldBashPoint(target,forward,.52),null);blocked=false;
});
test('BUG11/12 live attack paths route through corrected helpers and canonical HTML stays identical',()=>{
 const primary=html.slice(html.indexOf('function performPrimaryAttack()'),html.indexOf('function releaseChargedBow()'));
 const bow=html.slice(html.indexOf('function releaseChargedBow()'),html.indexOf('function startReload()'));
 const quick=html.slice(html.indexOf('function performQuickAbilityOrMelee()'),html.indexOf('function performPrimaryAttack()'));
 assert.match(primary,/nearestMusketImpact\(cls.range,origin,dir\)/);
 assert.match(html,/ArenaArmyBattle.raycastSoldier\(meadowBattleState,origin,dir,maxDist/);
 assert.match(html,/raycaster.set\(origin,dir\)/);
 assert.match(bow,/arrowGroup.position.copy\(origin\)/);
 assert.match(quick,/shieldBashPoint\(\{x:unit.x,y:/);
 assert.match(quick,/shieldBashPoint\(bot.mesh.position/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
