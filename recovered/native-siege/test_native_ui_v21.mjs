/** Render-only native V21 UI: source, controls, unchanged original scripts. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';

const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const uiSource=readFileSync(new URL('./native-ui-v21.js',import.meta.url),'utf8');
const context=vm.createContext({console});
new vm.Script(uiSource);
vm.runInContext(uiSource,context);
const UI=vm.runInContext('KTKNativeUiV21',context);

function documentFixture(){
 const ids=new Map();
 const map={buttons:[{textContent:'KALE',getAttribute:()=> 'true'},
  {textContent:'ÇİMENLİK'},{textContent:'KUŞATMA'}]};
 const siegeButtons=[{disabled:false},{disabled:false},{disabled:false},{disabled:true}];
 const make=(id,buttons=[])=>({id,textContent:'',
  querySelectorAll:(selector)=>selector==='button'?buttons:selector==='[data-army-order]'?Array.from({length:8},(_,i)=>({i})):[],
  querySelector:selector=>selector==='button[aria-pressed="true"]'?map.buttons[0]:null});
 for(const id of ['menu-overlay','hud','meadow-army-hud','native-siege-panel',
   'arena-map-controls','play-btn','match-results-overlay','army-tactical-overlay',
   'game-canvas','native-siege-assault-order'])ids.set(id,make(id,
    id==='arena-map-controls'?map.buttons:id==='native-siege-panel'?siegeButtons:[]));
 ids.get('native-siege-assault-order').disabled=true;
 let appends=0,addClass=0,styles=[];
 const span={textContent:'1600'};
 const title={
  childNodes:[{nodeType:3,nodeValue:'KRUNKER '}],
  querySelector:q=>q==='span'?span:null,
  setAttribute(k,v){this[k]=v;},
  textContent:'KRUNKER 1600'
 };
 const doc={
  head:{appendChild(e){appends++;ids.set(e.id,e);styles.push(e.textContent);}},
  body:{classList:{contains:q=>q==='ktk-ui-v21'&&addClass>0,add:q=>{if(q==='ktk-ui-v21')addClass++}}},
  defaultView:{getComputedStyle:()=>({backgroundImage:'linear-gradient(...)'})},
  createElement:tag=>({tag,id:'',textContent:''}),
  getElementById:id=>ids.get(id)||null,
  querySelectorAll:q=>q==='#menu-overlay h1.krunker-title,#hud .krunker-title'?[title]:[],
  querySelector:q=>q==='#menu-overlay h1'?title:null
 };
 return {doc,title,span,ids,appends:()=>appends,addClass:()=>addClass,styles};
}
test('V21 UI installs once, only visual styles and preserved DOM control IDs',()=>{
 const {doc,ids,span,title,appends,styles}=documentFixture();
 const oldArmy=ids.get('meadow-army-hud'),oldSiege=ids.get('native-siege-panel');
 assert.equal(UI.install(doc),true);
 assert.equal(UI.install(doc),false,'Repeated init must not duplicate UI or callback');
 assert.equal(appends(),1);
 assert.equal(title['aria-label'],'Kill the King');
 assert.equal(span.textContent,'KING');
 assert.equal(oldArmy,ids.get('meadow-army-hud'));
 assert.equal(oldSiege,ids.get('native-siege-panel'));
 assert.equal(ids.get('native-siege-assault-order').disabled,true,'Do not activate locked assault');
 const stat=UI.status(doc);
 assert.equal(stat.installed,true);
 assert.equal(stat.originalMapButtons,3);
 assert.equal(stat.originalSiegeButtons,4);
 assert.equal(stat.originalArmyOrderButtons,8);
 assert.equal(stat.actualSiegeDisabled,true);
 assert.equal(stat.canvas,true);
 assert.equal(stat.renderOnly,true);
 assert.equal(stat.noNewGameControls,true);
 const css=styles[0];
 for(const sel of ['#menu-overlay','#arena-map-controls','#hud .hud-box',
   '#meadow-army-hud','#native-siege-panel','#army-tactical-overlay',
   '#match-results-overlay','#match-live-scoreboard','prefers-reduced-motion',
   '#native-siege-assault-order','focus-visible','aria-pressed="true"']){
  assert(css.includes(sel),'Missing actual UI CSS control: '+sel);
 }
 assert(css.includes('grid-template-columns:repeat(3'),'Three map choices should have equal widths');
 assert(css.includes('background:linear-gradient'),'Theme should have actual material depth');
 for(const finish of ['FINISHING_CSS','#native-siege-tower-order::before','#native-siege-ram-order::before',
  '#native-siege-cat-order::before','#native-siege-assault-order::before',
  '#army-tactical-overlay>div','max-height:calc(100dvh - 28px)',
  'prefers-reduced-motion:no-preference','prefers-reduced-motion:reduce'])
  assert(uiSource.includes(finish),'V21 finishing style missing: '+finish);
 assert(!/pointer-events:\s*none/.test(css),'Never make original clickable panels inert');
});
test('V21 builder keeps 28 original scripts, one original renderer, 3 original playable modes',()=>{
 const {html,manifest}=buildCanonical(original);
 const originalScripts=extractedScripts(original),scripts=extractedScripts(html);
 assert.equal(scripts.length,29);
 for(let i=0;i<28;i++)assert.equal(scripts[i],originalScripts[i],'Protected source script '+i);
 assert.doesNotThrow(()=>new vm.Script(scripts[28]));
 assert.equal(manifest.kind,'SINGLE_NATIVE_FPS_THREE_MAPS');
 assert.equal(manifest.nativeArmyAndSiegeTroops,140);
 assert.equal(manifest.unifiedNativeUiV21.design,'period-war-bronze');
 assert.equal(manifest.unifiedNativeUiV21.renderOnly,true);
 assert.equal(manifest.oneRendererOneMovementEngine,true);
 assert(html.includes('window.ktkUiV21Status=()=>KTKNativeUiV21.status(document)'));
 for(const existing of ['id="play-btn"','id="meadow-army-demo-btn"','id="native-siege-start"',
 'id="native-siege-tower-order"','id="native-siege-ram-order"',
 'id="native-siege-cat-order"','id="native-siege-assault-order"',
 'id="match-replay-btn"','id="match-menu-btn"','id="army-tactical-overlay"'])
  assert(html.includes(existing),'Preserved original game element '+existing);
 assert(!html.includes('frame.srcdoc='),'No isolated iframe game');
});
