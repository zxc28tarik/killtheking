import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';

const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const sha=t=>createHash('sha256').update(t).digest('hex');
let result;
test('KTK-MAIN-01: native AK09 becomes canonical one-document game',()=>{
 result=buildCanonical(original);
 const {html,manifest}=result;
 assert(html.startsWith('<!DOCTYPE html>'));
 assert.equal(manifest.kind,'SINGLE_NATIVE_FPS_THREE_MAPS');
 assert.equal(manifest.oneRendererOneMovementEngine,true);
 assert.equal(manifest.oneLiveGameDocument,true);
 assert.equal(manifest.oldIframeOrSeparateS3D1Runtime,false);
 assert(!html.includes('ktk-source-siege'));
 assert(!html.includes('frame.srcdoc='));
 assert(!html.includes('data-ktk-launch='));
 assert(html.includes('id="native-siege-start"'));
 assert.equal(sha(html),manifest.sha256);
 assert.equal(Buffer.byteLength(html),manifest.bytes);
});
test('KTK-MAIN-01: original 28 scripts and gameplay/balance byte-identical',()=>{
 const old=extractedScripts(original),now=extractedScripts(result.html);
 assert.equal(old.length,29);assert.equal(now.length,29);
 for(let i=0;i<28;i++)assert.equal(now[i],old[i],'Original script '+i);
 assert.equal(sha(old[26]),
  '497c945c059b541fcf76231e7d9ff2983dd8b235e98d7b78b93e9ed52235c348');
 for(const s of now)assert.doesNotThrow(()=>new vm.Script(s));
 assert.equal(result.manifest.unchangedOriginalScriptCount,28);
});
test('KTK-MAIN-01: same original FPS uses 3 real menu map/army choices',()=>{
 const s=result.html;
 for(const text of ['data-arena-map="castle"','data-arena-map="meadow"',
  'id="native-siege-start"','nativeSiegeMode=false','meadowBattleMode=false',
  'window.ktkNativeSiegeMapStatus=','nativeSiegeCastleGeometry(false)']){
  assert(s.includes(text),text);
 }
 assert(s.includes('let meadowBattleMode = false;'));
 assert(s.includes('let nativeSiegeMode = false;'));
 assert.equal(result.manifest.140G54TroopsInArmyAndSiege,true);
});
test('KTK-MAIN-02: real Meadow V18 cosmetics added without soldier height changes',()=>{
 const s=result.html;
 for(const text of ['createInstancedTufts(THREE,spec,2700)',
   'createNearbyTufts(THREE,12000)','KTKMeadowSurfaceVisual.apply',
   'KTKMeadowHorizon.build','KTKMeadowNaturalLighting.apply',
   'window.__ktkMeadowLightActive','updateNearbyTufts(THREE,meadowDenseGrass',
   'window.ktkMeadowHorizonStatus','window.ktkMeadowGrassVisualStatus']){
  assert(s.includes(text),text);
 }
 assert.equal(result.manifest.meadowVisibleGrassInstanced,14700);
 assert.equal(result.manifest.meadowInteriorWalkableHillsAdded,false);
});
test('KTK-MAIN-02: cosmetics are in final original game script only',()=>{
 const old=extractedScripts(original),now=extractedScripts(result.html);
 for(let i=0;i<28;i++)assert.equal(old[i],now[i]);
 assert.equal(now[28].includes('KTKMeadowHorizon.build'),true);
 assert.equal(now[28].includes('nativeSiegeMode=false'),true);
 assert.equal(now[28].includes('window.ktkNativeSiegeMapStatus'),true);
});
test('KTK-MAIN: duplicate or iframe input is rejected, never silently repackaged',()=>{
 assert.throws(()=>buildCanonical('<!DOCTYPE html><html></html>'),/original AK09/);
 assert.throws(()=>buildCanonical(original.replace('id="native-siege-start"','id="wrong-siege-start"')),/original AK09/);
 assert.throws(()=>buildCanonical(original.replace('AK-NATIVE-09',''),),/original AK09/);
});
