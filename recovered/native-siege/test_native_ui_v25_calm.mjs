/** UI25 keeps 3 native maps, same combat scripts, original command controls. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';

const source=readFileSync(new URL('./native-ui-v25-calm.js',import.meta.url),'utf8');
const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
test('Calm UI25 keeps original IDs, command shortcuts and the user settings',()=>{
 assert(source.includes("const KTKCalmUIV25="));
 for(const id of ['menu-overlay','arena-map-controls','play-btn','hud','meadow-army-hud','native-siege-panel',
  'arena-settings-controls','native-siege-tower-order','native-siege-ram-order',
  'native-siege-cat-order','native-siege-assault-order'])assert(source.includes(id),'missing '+id);
 for(const label of ['F6 · Kule','F7 · Koçbaşı','F8 · Mancınık','F9 · Hücum'])assert(source.includes(label));
 assert(source.includes("body.ktk-calm-ui"));
 assert(source.includes("settingsAccessible:"));
 assert(source.includes("cosmeticOnly:true"));
});
test('UI25 canonical offline game is still one original AK09 FPS with 29 scripts',()=>{
 const {html,manifest}=buildCanonical(original);
 const oldScripts=extractedScripts(original),scripts=extractedScripts(html);
 assert.equal(scripts.length,29);
 for(let i=0;i<28;i++)assert.equal(scripts[i],oldScripts[i]);
 assert.doesNotThrow(()=>new vm.Script(scripts[28]));
 assert(html.includes('KTKCalmUIV25.install(document)'));
 assert(html.includes('ktkCalmUiV25Status'));
 assert.equal(manifest.kind,'SINGLE_NATIVE_FPS_THREE_MAPS');
 assert.equal(manifest.nativeArmyAndSiegeTroops,140);
 assert.equal(manifest.oldIframeOrSeparateS3D1Runtime,false);
});
