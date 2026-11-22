/** V23 native-command heraldry: cosmetic identity, accessibility, protected gameplay. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';

const source=readFileSync(new URL('./native-ui-v23.js',import.meta.url),'utf8');
const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const context=vm.createContext({console});
new vm.Script(source);
vm.runInContext(source,context);
const UI=vm.runInContext('KTKNativeUiV23',context);

function makeFixture(){
 const classes=new Set(['ktk-ui-v21','ktk-ui-v22']);
 const nodes=new Map();
 const roles=['TÜFEKÇİ (1600)','OKÇU (1600)','MIZRAKLI','KILIÇLI'];
 const cards=roles.map(title=>{
  const attributes=new Map();
  return {
   textContent:title+' — oyun açıklaması',
   querySelector:()=>({textContent:title}),
   setAttribute:(k,v)=>attributes.set(k,v),
   getAttribute:k=>attributes.get(k)||null
  };
 });
 for(const id of ['menu-overlay','arena-map-controls','hud','meadow-army-hud','native-siege-panel',
  'army-tactical-overlay','match-results-overlay','game-canvas']){
  nodes.set(id,{querySelectorAll:()=>id==='arena-map-controls'?[{},{},{}]:id==='native-siege-panel'?[{},{},{},{},{}]:[]});
 }
 let appended=0;
 let css='';
 const doc={
  head:{appendChild(el){appended++;nodes.set(el.id,el);css=el.textContent}},
  body:{classList:{add:c=>classes.add(c),contains:c=>classes.has(c)}},
  getElementById:id=>nodes.get(id)||null,
  createElement:()=>({id:'',textContent:''}),
  querySelectorAll:sel=>sel==='#menu-overlay .class-card'?cards:[]
 };
 return {doc,cards,classes,getCSS:()=>css,appends:()=>appended};
}

test('V23 decorates exactly the four original class cards, with readable weapon roles and original nodes',()=>{
 const f=makeFixture();
 const originalMap=f.doc.getElementById('arena-map-controls');
 const originalCards=[...f.cards];
 assert.equal(UI.install(f.doc),true);
 assert.equal(UI.install(f.doc),false,'Do not duplicate style tag');
 assert.equal(f.appends(),1);
 assert.equal(f.doc.getElementById('arena-map-controls'),originalMap);
 assert.deepEqual(f.cards,originalCards);
 assert.deepEqual(f.cards.map(c=>c.getAttribute('data-ktk-v23-role')),
  ['musket','archer','pike','sword']);
 const st=UI.status(f.doc);
 assert.equal(st.installed,true);
 assert.equal(st.classCards,4);
 assert.equal(st.roleCards,4);
 assert.equal(st.originalMaps,3);
 assert(st.originalSiegeControls>=4);
 assert.equal(st.v21Retained,true);
 assert.equal(st.v22Retained,true);
 assert.equal(st.sameOriginalCanvas,true);
 assert.equal(st.cosmeticOnly,true);
 assert.equal(st.noAdditionalInputs,true);
 const css=f.getCSS();
 for(const x of ['#menu-overlay .class-card','data-ktk-v23-role="musket"',
  'data-ktk-v23-role="archer"','data-ktk-v23-role="pike"','data-ktk-v23-role="sword"',
  'data:image/svg+xml,','#arena-map-controls>button[aria-pressed="true"]',
  '#meadow-army-hud','#native-siege-panel','#army-tactical-overlay',
  '#match-live-scoreboard','#match-results-overlay','prefers-reduced-motion:reduce',
  'prefers-contrast:more','max-width:620px','focus-visible']){
  assert(css.includes(x),'V23 genuine native UI missing '+x);
 }
 assert(!css.includes('pointer-events:none!important'),'Native controls must stay clickable');
 assert(!/\b(?:addEventListener|requestAnimationFrame|setInterval|setTimeout)\s*\(/.test(source),
  'No extra render ticks, callbacks or input listeners');
});
test('V23 role headings are independent from incidental description text',()=>{
 assert.equal(UI.roleFor('OKÇU'), 'archer');
 assert.equal(UI.roleFor('KARGILI'), 'pike');
 assert.equal(UI.roleFor('TÜFEKÇİ'), 'musket');
 assert.equal(UI.roleFor('KILIÇLI'), 'sword');
 assert.equal(UI.roleFor('Bilinmeyen'), '');
});
test('V23 rejects alternative runtime instead of replacing existing UI',()=>{
 const f=makeFixture();
 f.classes.delete('ktk-ui-v22');
 assert.throws(()=>UI.install(f.doc),/requires approved V21 and V22/);
});
test('Original FPS source scripts, single live game and native modes remain byte-identical',()=>{
 const {html,manifest}=buildCanonical(original);
 const before=extractedScripts(original),after=extractedScripts(html);
 assert.equal(before.length,29);
 assert.equal(after.length,29);
 for(let i=0;i<28;i++)assert.equal(after[i],before[i], 'Original native engine script '+i);
 assert.doesNotThrow(()=>new vm.Script(after[28]));
 assert.equal(manifest.nativeUiV23.design,'class-heraldry-and-command');
 assert.equal(manifest.nativeUiV23.decorativeOnly,true);
 assert.equal(manifest.nativeArmyAndSiegeTroops,140);
 assert.equal(manifest.oneLiveGameDocument,true);
 assert.equal(manifest.oneRendererOneMovementEngine,true);
 assert.equal(manifest.oldIframeOrSeparateS3D1Runtime,false);
 assert(html.includes('KTKNativeUiV23.install(document)'));
 assert(html.includes('window.ktkUiV23Status=()=>KTKNativeUiV23.status(document)'));
});
