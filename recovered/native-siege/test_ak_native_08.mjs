/** AK-NATIVE-08 UI/graphics acceptance guard: original G5.4 FPS untouched. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const scripts=s=>[...s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const newer=read('./KillTheKing_AK_NATIVE_08_original_game_siege_map.html');
const previous=read('./KillTheKing_AK_NATIVE_07_original_game_siege_map.html');
const now=scripts(newer),old=scripts(previous),siege=now[28];
test('AK08 original 28 untouched G5.4 FPS/arena/meadow scripts',()=>{
 assert.equal(now.length,29);assert.equal(old.length,29);
 for(let i=0;i<28;i++)assert.equal(now[i],old[i],'original script #'+i);
 assert.equal(createHash('sha256').update(now[26]).digest('hex'),
  '497c945c059b541fcf76231e7d9ff2983dd8b235e98d7b78b93e9ed52235c348');
});
test('AK08 original G5.4 single engine, no separate siege runtime',()=>{
 assert.match(siege,/nativeOriginalG54Army:true/);
 assert.match(siege,/nativeOriginalKrunkerFPSMovement:true/);
 assert.match(siege,/noStandaloneSiegeEngine:true/);
 assert.match(siege,/ArenaArmyBattle\.step\(meadowBattleState,dt\)/);
 assert.doesNotThrow(()=>new vm.Script(siege));
});
test('AK08 compact HUD is explicitly restricted to original siege map',()=>{
 assert.match(siege,/if\(on\)\{slim=true/);
 assert.match(siege,/siege\.classList\.toggle\('ktk-siege-slim',nativeSiegeMode&&slim\)/);
 assert.match(siege,/army\.classList\.toggle\('ktk-siege-slim',nativeSiegeMode&&slim\)/);
 assert.match(siege,/KTKNativeSiegeHud\.setMode\(nativeSiegeMode\)/);
 assert.match(siege,/const KTKNativeSiegeHud=/);
});
test('AK08 F10 toggle preserves native F6–F9 and full G5.4 commands',()=>{
 assert.match(siege,/if\(e\.code==='F10'\)\{e\.preventDefault\(\);KTKNativeSiegeHud\.flip\(\);return;\}/);
 for(const shortcut of ["F6:'native-siege-tower-order'","F7:'native-siege-ram-order'","F8:'native-siege-cat-order'","F9:'native-siege-assault-order'"])
   assert(siege.includes(shortcut),shortcut);
 assert.match(siege,/if\(e\.code==='KeyP'\)\{e\.preventDefault\(\);openArmyTacticalMap\(\);return;\}/);
 assert.match(siege,/army\.querySelectorAll\('details'\)\.forEach\(d=>d\.open=false\)/);
});
test('AK08 4Hz UI throttle leaves original physics and every-frame capture intact',()=>{
 assert.match(siege,/meadowBattleState\.elapsed-st\.lastHudTextAt>=\.25/);
 assert.match(siege,/st\.captureTime>=15&&!st\.win/);
 assert.match(siege,/const attackers=meadowBattleState\.soldiers\.filter/);
 assert.match(siege,/window\.ktkNativeSiegeMapStatus=\(\)=>/);
 assert.match(siege,/nativeSiegeGateMesh\.updateWorldMatrix\(true,false\)/);
});
test('AK08 original full tactical panel survives compact mode unchanged',()=>{
 for(const id of ['id="meadow-army-hud"','id="army-tactical-overlay"','id="native-siege-stats"',
    'id="native-siege-tower-order"','id="native-siege-ram-order"',
    'id="native-siege-cat-order"','id="native-siege-assault-order"'])
   assert(newer.includes(id),id);
 assert.match(siege,/ktk-siege-title/);
 assert.match(siege,/ktk-siege-summary/);
 assert.match(siege,/top:166px!important;bottom:auto!important/);
});
