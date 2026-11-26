import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('function resetPlayerLifeMotion()'),end=html.indexOf('function resetFreeForAllRound()',start);
assert.ok(start>=0&&end>start);
function fixture(){
 const vec=(x,y,z)=>({x,y,z,set(x,y,z){Object.assign(this,{x,y,z});}});
 const nodes=new Map(),cleared=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{opacity:'1',width:'80%',transform:'scale(.65)'},classList:{add(){}},textContent:'OLD',replaceChildren(){this.empty=true;}});return nodes.get(id)};
 const p={pos:vec(12,8,14),vel:vec(30,-20,4),standHeight:2.35,currentHeight:1.35,onGround:true,
 isSliding:true,bhopChain:5,walkCycle:8,tpsMotionState:{old:true},hp:0,maxHp:120,
 attackAnimTime:1,isDrawingBow:true,bowCharge:1,bowDrawSeconds:2,isRMBDown:true,isShielding:true,
 shieldParryTime:1,swayX:1,swayY:1,shakeIntensity:1,weaponKick:1,weaponTilt:1,cameraImpactPitch:1,cameraImpactYaw:1,
 kills:5,deaths:4,streak:3,parries:6,ammo:0,lastBowShotAt:11,lastMusketShotAt:12,isReloading:true,reloadTimer:7,
 lastReloadStep:3,attackCooldown:2,abilityCooldown:2,quickMeleeTime:1,shieldParryCooldown:1,comboStep:1,
 classIdx:3,isThirdPerson:true,yaw:1,pitch:.3};
 const ctx={player:p,keys:{KeyW:true,KeyC:true},activeWeaponSwing:{old:true},lastWeaponSwingRaycasts:55,
 impactHoldSeconds:.1,damageOverlayTimeout:1,hitmarkerTimeout:2,impactTextTimeout:3,pendingMusketReload:4,
 impactTextEl:node('impact-text'),impactVignetteEl:node('impact-vignette'),muzzleLight:{intensity:3},
 clearTimeout:v=>{if(v!=null)cleared.push(v)},document:{getElementById:node},ArenaCharacterMotion:{createState:()=>({fresh:true})}};
 const h=runInNewContext(html.slice(start,end)+'\n({resetPlayerLifeMotion,resetPlayerRoundState,respawnPlayerAt})',ctx);
 return {p,ctx,h,node,cleared};
}
test('BUG17 respawn resets motion and uses standing height above actual spawn floor',()=>{
 for(const floor of [0,8]){
  const {p,ctx,h}=fixture();h.respawnPlayerAt({x:2,y:floor,z:3});
  assert.deepEqual([p.pos.x,p.pos.y,p.pos.z],[2,floor+2.35,3]);
  assert.deepEqual([p.vel.x,p.vel.y,p.vel.z],[0,0,0]);
  assert.equal(p.hp,120);assert.equal(p.currentHeight,2.35);
  assert.equal(p.onGround,false);assert.equal(p.isSliding,false);assert.equal(p.bhopChain,0);
  assert.equal(p.tpsMotionState.fresh,true);assert.equal(ctx.activeWeaponSwing,null);
 }
});
test('BUG17 death clears active combat input and effects but cannot bypass weapon clocks',()=>{
 const {p,ctx,h,node}=fixture();h.respawnPlayerAt({x:0,y:0,z:0});
 for(const k of ['isDrawingBow','isRMBDown','isShielding'])assert.equal(p[k],false,k);
 for(const k of ['attackAnimTime','bowCharge','weaponTilt','cameraImpactYaw','swayX','quickMeleeTime']) {
  assert.equal(p[k],k==='quickMeleeTime'?1:0,k);
 }
 assert.equal(p.ammo,0);assert.equal(p.lastMusketShotAt,12);assert.equal(p.reloadTimer,7);
 assert.equal(p.abilityCooldown,2);assert.equal(p.attackCooldown,2);assert.equal(p.parries,6);
 assert.equal(node('ads-overlay').style.opacity,'0');assert.equal(ctx.pendingMusketReload,4);
 assert.equal(p.classIdx,3);assert.equal(p.isThirdPerson,true);
});
test('BUG18 new round clears all per-round counters, inputs, pending reload and HUD',()=>{
 const {p,ctx,h,node,cleared}=fixture();h.resetPlayerRoundState();h.respawnPlayerAt({x:0,y:0,z:0});
 for(const k of ['kills','deaths','streak','parries','reloadTimer','attackCooldown','abilityCooldown',
 'quickMeleeTime','shieldParryCooldown','comboStep','cameraImpactPitch','cameraImpactYaw','weaponTilt'])assert.equal(p[k],0,k);
 assert.equal(p.ammo,1);assert.equal(p.isReloading,false);assert.equal(p.lastReloadStep,1);
 assert.equal(p.lastMusketShotAt,-Infinity);assert.equal(p.lastBowShotAt,-Infinity);
 assert.equal(ctx.keys.KeyW,false);assert.equal(ctx.keys.KeyC,false);
 assert.equal(ctx.pendingMusketReload,null);assert.ok(cleared.includes(4));
 assert.equal(node('reload-bar-fill').style.width,'0%');assert.equal(node('medal-container').empty,true);
 assert.equal(p.classIdx,3);assert.equal(p.isThirdPerson,true);
});
test('BUG18 reset is idempotent and preserves configured class, view and aim',()=>{
 const {p,h}=fixture();
 for(let i=0;i<3;i++){h.resetPlayerRoundState();h.respawnPlayerAt({x:0,y:4,z:0});}
 assert.equal(p.pos.y,6.35);assert.equal(p.maxHp,120);assert.equal(p.yaw,1);assert.equal(p.pitch,.3);
 assert.equal(p.classIdx,3);assert.equal(p.isThirdPerson,true);
});
test('BUG17/18 all live spawn paths use shared physical reset and canonical copies match',()=>{
 assert.match(html,/respawnPlayerAt\(sp\)/);
 assert.match(html,/respawnPlayerAt\(\{x:own.x-16,y:0,z:own.z\}\)/);
 assert.match(html,/resetPlayerRoundState\(\);\s*const safeSpawn[\s\S]*?respawnPlayerAt\(safeSpawn\)/);
 assert.doesNotMatch(html,/player.pos.set\(sp.x, sp.y \+ 1.5, sp.z\)/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
