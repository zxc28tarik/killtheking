import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const cut=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i);return html.slice(i,j)};
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
const sync=runInNewContext(cut('function syncNativeSiegeFrontCover(','function refreshNativeSiegeFrontCover(')+'\nsyncNativeSiegeFrontCover;',ctx);
const make=(x,w)=>{const m=new T.Mesh(new T.BoxGeometry(w,7,5),new T.MeshBasicMaterial());m.position.set(x,3.5,-42);m.updateMatrixWorld(true);return m;};
test('BUG21 real Three rays: original wall, closed gate, open gate, flank and restored arena',()=>{
 const old=make(0,88),left=make(-26,36),right=make(26,36),gate=make(0,16),list=[old];
 const ray=x=>new T.Raycaster(new T.Vector3(x,2,-60),new T.Vector3(0,0,1),0,30).intersectObjects(list,false)[0]?.object;
 assert.equal(ray(0),old);
 old.visible=false;
 // Three r128 still raycasts invisible mesh when explicitly listed.
 assert.equal(ray(0),old);
 sync(list,true,false,old,[left,right],gate);
 assert.equal(ray(0),gate);assert.equal(ray(-26),left);assert.equal(ray(26),right);
 sync(list,true,true,old,[left,right],gate);
 assert.equal(ray(0),undefined);assert.equal(ray(-26),left);
 sync(list,true,false,old,[left,right],gate);assert.equal(ray(0),gate);
 sync(list,true,false,old,[left,right],gate);assert.equal(list.length,3);
 sync(list,false,false,old,[left,right],gate);assert.equal(ray(0),old);assert.equal(list.length,1);
});
test('BUG21 refresh is wired to map, gate break and round reset before army obstacle snapshot',()=>{
 const geom=cut('function nativeSiegeCastleGeometry(','function nativeSiegeNativeBoxes(');
 const reset=cut('function nativeSiegeResetEquipment(','function nativeSiegeOrderCrew(');
 const damage=cut('function nativeSiegeDamageGate(','function nativeSiegeUpdate(');
 const round=cut('function resetFreeForAllRound()','function showMatchResults()');
 for(const p of [geom,reset,damage])assert.match(p,/refreshNativeSiegeFrontCover\(\)/);
 assert.ok(round.indexOf('nativeSiegeResetEquipment()')<round.indexOf('ArenaArmyBattle.setWorldObstacles'));
});
function fixture(){
 const events={},nodes=new Map(),canvas={};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{opacity:'1',transform:'scale(.65)'},classList:{add(){},remove(){}},textContent:''});return nodes.get(id)};
 const p={classIdx:3,isDrawingBow:true,bowCharge:.8,bowDrawSeconds:2,isRMBDown:true,isShielding:true,shieldParryTime:.2,attackCooldown:0,abilityCooldown:2,shieldParryCooldown:2};
 const c={player:p,canvas,isGameActive:true,armyTacticalOpen:true,activeWeaponSwing:{},arenaClock:0,
 window:{addEventListener:(name,fn)=>events[name]=fn},document:{getElementById:node,pointerLockElement:null},
 ArenaWeaponBalance:{bowCanDraw:()=>true},ArenaCombatDefense:{PARRY_DURATION:1,PARRY_COOLDOWN:2},
 performPrimaryAttack:()=>c.shots++,performQuickAbilityOrMelee:()=>c.quick++,releaseChargedBow:()=>c.releases++,
 shots:0,quick:0,releases:0};
 runInNewContext(cut("window.addEventListener('mousedown'","window.addEventListener('contextmenu'"),c);
 const cancel=runInNewContext(cut('function cancelTacticalCombatInput()','function openArmyTacticalMap()')+'\ncancelTacticalCombatInput;',c);
 return {c,p,events,cancel,node};
}
test('BUG22 real mouse handlers ignore all classes and both buttons during map interaction',()=>{
 const {c,p,events}=fixture();
 for(let cls=0;cls<4;cls++){
  p.classIdx=cls;
  for(const button of [0,2]){events.mousedown({button});events.mouseup({button});}
 }
 assert.equal(c.shots,0);assert.equal(c.quick,0);assert.equal(c.releases,0);
 c.armyTacticalOpen=false;p.classIdx=3;events.mousedown({button:0});assert.equal(c.shots,0);
 c.document.pointerLockElement=c.canvas;events.mousedown({button:0});assert.equal(c.shots,1);
 p.classIdx=2;p.isDrawingBow=false;events.mousedown({button:0});assert.equal(p.isDrawingBow,true);
 events.mouseup({button:0});assert.equal(c.releases,1);
});
test('BUG22 opening map cancels drawn bow, swing and held shield but retains cooldowns',()=>{
 const {c,p,cancel,node}=fixture();cancel();
 for(const k of ['isDrawingBow','isRMBDown','isShielding'])assert.equal(p[k],false);
 for(const k of ['bowCharge','bowDrawSeconds','shieldParryTime'])assert.equal(p[k],0);
 assert.equal(c.activeWeaponSwing,null);assert.equal(p.abilityCooldown,2);assert.equal(p.shieldParryCooldown,2);
 assert.equal(node('ads-overlay').style.opacity,'0');
 assert.match(cut('function openArmyTacticalMap()',"document.getElementById('army-open-map')"),/cancelTacticalCombatInput\(\)/);
});
test('BUG22 direct combat entry points respect tactical map; canonical copies match',()=>{
 for(const fn of ['performPrimaryAttack','performQuickAbilityOrMelee','releaseChargedBow']){
  const p=html.slice(html.indexOf('function '+fn+'()'),html.indexOf('function '+fn+'()')+400);
  assert.match(p,/armyTacticalOpen/);
 }
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
