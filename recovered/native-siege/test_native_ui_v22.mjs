/** V22 WAR ROOM cosmetic contract: menu, map/class cards, HUD, native command panels. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';

const file=readFileSync(new URL('./native-ui-v22.js',import.meta.url),'utf8');
const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const ctx=vm.createContext({console});
new vm.Script(file);
vm.runInContext(file,ctx);
const UI=vm.runInContext('KTKNativeUiV22',ctx);

function fixture(){
 const ids=new Map();
 for(const id of ['menu-overlay','arena-map-controls','play-btn','hud','meadow-army-hud',
  'native-siege-panel','match-results-overlay','army-tactical-overlay','game-canvas']){
  const buttons=id==='arena-map-controls'?[{},{},{}]:
    id==='native-siege-panel'?[{},{},{},{},{}]:[];
  ids.set(id,{querySelectorAll:()=>buttons});
 }
 const classes=new Set(['ktk-ui-v21']);
 let appended=0;
 let css='';
 const doc={
  body:{classList:{contains:c=>classes.has(c),add:c=>classes.add(c)}},
  head:{appendChild:node=>{ids.set(node.id,node);appended++;css=node.textContent;}},
  getElementById:id=>ids.get(id)||null,
  createElement:()=>({id:'',textContent:''})
 };
 return {doc,classes,getCSS:()=>css,getAppended:()=>appended};
}

test('V22 installs once over V21 without altering original controls or listeners',()=>{
 const {doc,classes,getCSS,getAppended}=fixture();
 const originalMenu=doc.getElementById('menu-overlay');
 const originalMap=doc.getElementById('arena-map-controls');
 assert.equal(UI.install(doc),true);
 assert.equal(UI.install(doc),false);
 assert.equal(getAppended(),1);
 assert.equal(doc.getElementById('menu-overlay'),originalMenu);
 assert.equal(doc.getElementById('arena-map-controls'),originalMap);
 assert.equal(classes.has('ktk-ui-v22'),true);
 const stat=UI.status(doc);
 assert.equal(stat.installed,true);
 assert.equal(stat.v21Retained,true);
 assert.equal(stat.sameNativeCanvas,true);
 assert.equal(stat.mapButtons,3);
 assert(stat.siegeOrders>=4);
 assert.equal(stat.renderOnly,true);
 assert.equal(stat.noNewControls,true);
 assert.equal(stat.noGameStateMutation,true);
 const css=getCSS();
 for(const part of ['#menu-overlay>div','#arena-map-controls>button',
   '#arena-map-controls>button[aria-pressed="true"]','.class-card.selected',
   '#play-btn','#hud .hud-box','#hud #hud-ammo','#native-siege-panel',
   '#meadow-army-hud','#army-tactical-overlay','#match-results-overlay',
   'focus-visible','max-width:640px','max-height:720px','prefers-reduced-motion:reduce']){
  assert(css.includes(part),'V22 visual selector missing: '+part);
 }
 assert.equal(css.includes('pointer-events:none'),false,'Original buttons must stay clickable');
 assert(!/\b(?:addEventListener|requestAnimationFrame|setTimeout|setInterval)\s*\(/.test(file),
  'V22 must not bind events or tick loops');
});
test('V22 refuses a new/replacement game instead of creating one',()=>{
 const {doc}=fixture();
 doc.body.classList.contains=()=>false;
 assert.throws(()=>UI.install(doc),/requires original V21 UI/);
});
test('V22 canonical build preserves all 28 protected FPS/gameplay scripts, 3 maps and a 29th script',()=>{
 const {html,manifest}=buildCanonical(original);
 const before=extractedScripts(original),after=extractedScripts(html);
 assert.equal(before.length,29);
 assert.equal(after.length,29);
 for(let i=0;i<28;i++)assert.equal(after[i],before[i],'Original battle script '+i);
 assert.doesNotThrow(()=>new vm.Script(after[28]));
 assert.equal(manifest.kind,'SINGLE_NATIVE_FPS_THREE_MAPS');
 assert.equal(manifest.nativeUiV22.design,'historical-war-room');
 assert.equal(manifest.nativeUiV22.renderOnly,true);
 assert.equal(manifest.nativeArmyAndSiegeTroops,140);
 assert.equal(manifest.oneRendererOneMovementEngine,true);
 assert(html.includes('KTKNativeUiV22.install(document)'));
 assert(html.includes('window.ktkUiV22Status=()=>KTKNativeUiV22.status(document)'));
 assert(html.includes('KTKNativeUiV21.install(document)'));
 assert(!html.includes('frame.srcdoc='));
});
