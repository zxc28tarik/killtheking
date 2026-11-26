import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
const part=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i);return html.slice(i,j)};
const barrels=runInNewContext(part('function restoreBarrel(','function triggerBarrelExplosion(')+'\n({restoreBarrel,syncBarrelVisibility,resetRoundBarrels})',ctx);
const make=(active,hp,timer)=>({active,hp,respawnTimer:timer,group:{visible:active},label:{style:{display:'block'}}});
test('BUG19 resets destroyed and partially damaged barrels in both map caches',()=>{
 const c={barrels:[make(false,0,14),make(true,12,0)]},m={barrels:[make(false,0,7)]};
 barrels.resetRoundBarrels(c,m,'castle');
 for(const b of [...c.barrels,...m.barrels]){
  assert.equal(b.active,true);assert.equal(b.hp,40);assert.equal(b.respawnTimer,0);
  assert.equal(b.label.style.display,'none');
 }
 assert.ok(c.barrels.every(b=>b.group.visible));assert.equal(m.barrels[0].group.visible,false);
 barrels.resetRoundBarrels(c,m,'meadow');
 assert.ok(c.barrels.every(b=>!b.group.visible));assert.equal(m.barrels[0].group.visible,true);
});
test('BUG19 map toggles do not revive destroyed barrels or retain stale labels',()=>{
 const c={barrels:[make(false,0,9),make(true,25,0)]},m={barrels:[]};
 barrels.syncBarrelVisibility(c,m,'meadow');assert.ok(c.barrels.every(b=>!b.group.visible));
 barrels.syncBarrelVisibility(c,m,'castle');
 assert.equal(c.barrels[0].group.visible,false);assert.equal(c.barrels[0].respawnTimer,9);
 assert.equal(c.barrels[1].group.visible,true);assert.equal(c.barrels[1].hp,25);
 assert.ok(c.barrels.every(b=>b.label.style.display==='none'));
 barrels.restoreBarrel(c.barrels[0],true);
 assert.equal(c.barrels[0].respawnTimer,0);assert.equal(c.barrels[0].hp,40);assert.equal(c.barrels[0].group.visible,true);
});
const orient=runInNewContext(part('const playerArrowForward=','const stuckArrows =')+'\norientPlayerArrow;',ctx);
test('BUG20 actual arrow tip remains forward for launch, arc, fall and opposite directions',()=>{
 const mesh=new T.Group();
 for(const velocity of [[0,0,-70],[0,0,70],[40,12,3],[1,-65,0],[0,70,0]]){
  const v=new T.Vector3(...velocity),before=v.clone();
  orient(mesh,v);
  const tip=new T.Vector3(0,0,-1).applyQuaternion(mesh.quaternion);
  assert.ok(tip.dot(v.clone().normalize())>1-1e-9);
  assert.ok(v.equals(before));
  assert.ok(Math.abs(mesh.quaternion.length()-1)<1e-9);
 }
});
test('BUG20 zero velocity preserves last valid orientation',()=>{
 const mesh=new T.Group();orient(mesh,new T.Vector3(1,-1,2));
 const q=mesh.quaternion.clone();orient(mesh,new T.Vector3());
 assert.ok(mesh.quaternion.equals(q));
});
test('BUG19/20 live round, map and projectile paths use common helpers and canonical parity',()=>{
 assert.match(html,/function resetFreeForAllRound\(\)\s*\{\s*clearRoundTransients\(\);\s*resetRoundBarrels\(castleMapData,meadowMapData,arenaMap\)/);
 assert.match(html,/syncBarrelVisibility\(castleMapData,meadowMapData,map\)/);
 assert.match(html,/restoreBarrel\(b,true\)/);
 assert.match(html,/head\.position\.z = -0\.68/);
 assert.match(html,/orientPlayerArrow\(arrowGroup,dir\)/);
 assert.match(html,/orientPlayerArrow\(arr.mesh,arr.vel\)/);
 assert.doesNotMatch(html,/arr\.mesh\.lookAt/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
