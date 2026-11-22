/** V24 War Council CSS only. Protect original buttons, modes and AK09 scripts. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';

const source=readFileSync(new URL('./native-ui-v24.js',import.meta.url),'utf8');
const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const ctx=vm.createContext({console});
new vm.Script(source);
vm.runInContext(source,ctx);
const UI=vm.runInContext('KTKNativeUiV24',ctx);
function fixture(){
 const classes=new Set(['ktk-ui-v21','ktk-ui-v22','ktk-ui-v23']);
 const nodes=new Map();
 const cards=['knight','pike','archer','musket'].map(role=>({getAttribute:key=>key==='data-ktk-v23-role'?role:null}));
 for(const id of ['menu-overlay','arena-map-controls','play-btn','hud','meadow-army-hud',
  'native-siege-panel','army-tactical-overlay','match-results-overlay','game-canvas']){
  const buttons=id==='arena-map-controls'?[{},{},{}]:id==='native-siege-panel'?[{},{},{},{},{}]:[];
  nodes.set(id,{id,querySelectorAll:()=>buttons});
 }
 let appended=0,css='';
 const doc={
  body:{classList:{contains:key=>classes.has(key),add:key=>classes.add(key)}},
  head:{appendChild:style=>{appended++;nodes.set(style.id,style);css=style.textContent}},
  getElementById:id=>nodes.get(id)||null,
  querySelectorAll:q=>q==='#menu-overlay .class-card'?cards:[],
  createElement:()=>({id:'',textContent:''})
 };
 return {doc,cards,appends:()=>appended,css:()=>css,classes};
}
test('V24 keeps the genuine native DOM, installs once and preserves four existing class crests',()=>{
 const v=fixture();
 const oldMenu=v.doc.getElementById('menu-overlay');
 const oldMaps=v.doc.getElementById('arena-map-controls');
 assert.equal(UI.install(v.doc),true);
 assert.equal(UI.install(v.doc),false);
 assert.equal(v.appends(),1);
 assert.equal(v.doc.getElementById('menu-overlay'),oldMenu);
 assert.equal(v.doc.getElementById('arena-map-controls'),oldMaps);
 const s=UI.status(v.doc);
 assert.equal(s.installed,true);
 assert.equal(s.maps,3);
 assert.equal(s.originalClassCards,4);
 assert.equal(s.heraldryCards,4);
 assert(s.originalSiegeOrders>=4);
 assert.equal(s.originalCanvas,true);
 assert.equal(s.v23Retained,true);
 assert.equal(s.cosmeticOnly,true);
 assert.equal(s.noGameplayHooks,true);
});
test('V24 maintains four historic UI areas, three distinct map etchings, keyboard/mobile accessibility',()=>{
 const v=fixture();UI.install(v.doc);
 const css=v.css();
 for(const k of ['#menu-overlay>div','#menu-overlay h1','#arena-map-controls>button',
  '#arena-map-controls>button[aria-pressed="true"]','#menu-overlay .class-card.selected',
  '#menu-overlay #play-btn','#hud .hud-box','#meadow-army-hud','#native-siege-panel',
  '#army-tactical-overlay','#match-live-scoreboard','#match-results-overlay',
  'max-height:730px','max-width:640px','focus-visible','prefers-reduced-motion:reduce',
  'prefers-contrast:more']){
  assert(css.includes(k),'missing V24 visual treatment '+k);
 }
 for(const n of [1,2,3])assert(css.includes('#arena-map-controls>button:nth-of-type('+n+')'),
  'Original map '+n+' must retain distinctive artwork');
 assert.equal((css.match(/background-image:url\("data:image\/svg\+xml,/g)||[]).length,6,
  'Three engravings must be foreground artwork in both selected and normal states');
 assert.equal((css.match(/data:image\/svg\+xml,/g)||[]).length,6,
  '3 independent original map etchings with normal and selected visuals');
 assert.equal(/\b(?:addEventListener|requestAnimationFrame|setInterval|setTimeout)\s*\(/.test(source),false);
 assert(!css.includes('pointer-events:none!important'),'Original game UI remains clickable');
});
test('V24 refuses to replace the original V21/V22/V23 native user interface',()=>{
 const v=fixture();v.classes.delete('ktk-ui-v23');
 assert.throws(()=>UI.install(v.doc),/requires approved UI/);
});
test('V24 canonical build keeps 28 byte-equal engine scripts and all 3 genuine game modes',()=>{
 const {html,manifest}=buildCanonical(original);
 const before=extractedScripts(original),after=extractedScripts(html);
 assert.equal(before.length,29);
 assert.equal(after.length,29);
 for(let i=0;i<28;i++)assert.equal(after[i],before[i],'Changed original FPS script '+i);
 assert.doesNotThrow(()=>new vm.Script(after[28]));
 assert.equal(manifest.kind,'SINGLE_NATIVE_FPS_THREE_MAPS');
 assert.equal(manifest.nativeArmyAndSiegeTroops,140);
 assert.equal(manifest.oneRendererOneMovementEngine,true);
 assert.equal(manifest.oneLiveGameDocument,true);
 assert.equal(manifest.nativeUiV24.design,'historical-war-council-etchings');
 assert.equal(manifest.nativeUiV24.decorativeOnly,true);
 assert(html.includes('KTKNativeUiV24.install(document)'));
 assert(html.includes('window.ktkUiV24Status=()=>KTKNativeUiV24.status(document)'));
 assert(html.includes('KTKNativeUiV23.install(document)'));
 assert(!html.includes('frame.srcdoc='));
});
