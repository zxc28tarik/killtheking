/** AK-NATIVE-09: ORIGINAL FPS/G5.4 3-map mode isolation regression. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const get=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const scripts=s=>[...s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const old=scripts(get('./KillTheKing_AK_NATIVE_08_original_game_siege_map.html'));
const now=scripts(get('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html'));
const prior=old[28],newer=now[28];
const originalMap="            switchArenaMap(button.dataset.arenaMap);\n            nativeSiegeMode=false;\n            if(arenaMap!=='meadow')meadowBattleMode=false;\n            nativeSiegeCastleGeometry(false);";
const fixedMap="            // AK-NATIVE-09: a normal map button always means NORMAL arena FPS,\n            // never inherit a prior 140-soldier Army/Siege menu selection.\n            // The only ways to select native G5.4 70-v-70 remain the two\n            // explicit battle-mode buttons; original weapons/camera untouched.\n            switchArenaMap(button.dataset.arenaMap);\n            nativeSiegeMode=false;\n            meadowBattleMode=false;\n            nativeSiegeCastleGeometry(false);";
const originalMobile='bottom:118px!important;max-height:110px!important;';
const fixedMobile='top:166px!important;bottom:auto!important;max-height:110px!important;';
function functionSource(text,name){
 const start=text.indexOf('function '+name+'(');assert(start>=0,name);
 let depth=0;
 for(let i=text.indexOf('{',start);i<text.length;i++){
  if(text[i]==='{')depth++;
  if(text[i]==='}'&&!--depth)return text.slice(start,i+1);
 }
 throw Error('Unclosed G5.4 function '+name);
}
test('AK09: original 28 Krunker FPS/G5.4 combat/render scripts unchanged',()=>{
 assert.equal(old.length,29);assert.equal(now.length,29);
 for(let i=0;i<28;i++)assert.equal(now[i],old[i],'original script '+i);
 assert.equal(createHash('sha256').update(now[26]).digest('hex'),
   '497c945c059b541fcf76231e7d9ff2983dd8b235e98d7b78b93e9ed52235c348');
 assert.doesNotThrow(()=>new vm.Script(newer));
});
test('AK09: exactly 2 deliberate selection/UI fixes and no new FPS/combat changes',()=>{
 assert.equal(prior.split(originalMap).length,2);
 assert.equal(newer.split(fixedMap).length,2);
 assert.equal(prior.split(originalMobile).length,2);
 assert.equal(newer.split(fixedMobile).length,2);
 assert.equal(newer.replace(fixedMap,originalMap).replace(fixedMobile,originalMobile),prior);
});
function menuFixture(){
 const mapButtons=['meadow','castle'].map(arenaMap=>({dataset:{arenaMap},
  addEventListener(event,cb){assert.equal(event,'click');this.listener=cb;}}));
 const begin=newer.indexOf("mapButtons.forEach(button=>button.addEventListener('click',()=>{");
 const end=newer.indexOf('\n\n        function syncMatchModeControls()',begin);
 assert(begin>0&&end>begin);
 const ctx=vm.createContext({mapButtons});
 vm.runInContext("let nativeSiegeMode=true,meadowBattleMode=true,arenaMap='castle';\n"+
  "let cleanup=0,syncs=0;const arenaMatch={phase:'menu'};\n"+
  "function switchArenaMap(map){arenaMap=map;}\n"+
  "function nativeSiegeCastleGeometry(on){if(on)throw Error('Expected cleanup');cleanup++;}\n"+
  "function syncArenaMapControls(){syncs++;}\nfunction syncMatchModeControls(){syncs++;}\n"+
  newer.slice(begin,end),ctx,{timeout:3000});
 return {mapButtons,ctx,status:()=>vm.runInContext(
  '({nativeSiegeMode,meadowBattleMode,arenaMap,cleanup,syncs})',ctx)};
}
test('AK09: normal Meadow after Army/Siege gives authentic FFA, not G5.4 140 soldiers',()=>{
 const f=menuFixture();f.mapButtons[0].listener();const s=f.status();
 assert.equal(s.arenaMap,'meadow');assert.equal(s.meadowBattleMode,false);
 assert.equal(s.nativeSiegeMode,false);assert.equal(s.cleanup,1);assert.equal(s.syncs,2);
});
test('AK09: normal Castle after Siege clears extra siege mode authority',()=>{
 const f=menuFixture();f.mapButtons[1].listener();const s=f.status();
 assert.equal(s.arenaMap,'castle');assert.equal(s.meadowBattleMode,false);
 assert.equal(s.nativeSiegeMode,false);assert.equal(s.cleanup,1);
});
test('AK09: active matches cannot change map using menu-only controls',()=>{
 const f=menuFixture();vm.runInContext("arenaMatch.phase='playing'",f.ctx);
 f.mapButtons[0].listener();const s=f.status();
 assert.equal(s.arenaMap,'castle');assert.equal(s.meadowBattleMode,true);
 assert.equal(s.nativeSiegeMode,true);assert.equal(s.cleanup,0);
});
test('AK09: compact small-screen HUD is top-anchored and F6–F10 retained',()=>{
 assert(newer.includes('#meadow-army-hud.ktk-siege-slim{top:166px!important;bottom:auto!important;max-height:110px!important;'));
 for(const key of ['F6','F7','F8','F9'])
  assert(newer.includes(key+":'native-siege-"),key);
 assert(newer.includes("if(e.code==='F10'){e.preventDefault();KTKNativeSiegeHud.flip();return;}"));
});
test('AK09: existing genuine G5.4 140 soldier identities and 8 squads for 4 seeds',()=>{
 const ctx=vm.createContext({console});
 vm.runInContext(now[19],ctx,{timeout:5000});
 vm.runInContext(now[26],ctx,{timeout:5000});
 vm.runInContext(functionSource(newer,'nativeSiegeDeployOriginalG54'),ctx,{timeout:5000});
 for(const seed of [1600,42,777,2026]){
  const s=ctx.ArenaArmyBattle.create(seed,'sword','blue');
  ctx.nativeSiegeDeployOriginalG54(s);
  assert.equal(s.soldiers.length,140);assert.equal(s.squads.length,8);
  assert.equal(new Set(s.soldiers.map(u=>u.id)).size,140);
  assert.equal(s.soldiers.filter(u=>u.team==='red'&&u.type==='musket').length,10);
 }
});
