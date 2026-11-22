/* Real three-choice Kill the King main menu source integrity and router.
 * Only these modes belong in the same top-level launcher. DO NOT replace
 * FFA and army with the siege preview or silently copy their renderers.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {addCastleThirdMode,build} from './build_three_mode_launcher.mjs';
const dualFile=process.env.KTK_DUAL_HTML;
const siegeFile=process.env.KTK_SIEGE_HTML;
if(!dualFile||!siegeFile)throw Error('Use exact accepted dual mode and S3D1 siege HTML build paths');
const dual=readFileSync(dualFile,'utf8');
const siege=readFileSync(siegeFile,'utf8');
const combined=addCastleThirdMode(dual,siege);
const hash=x=>createHash('sha256').update(x).digest('hex');
const extract=(s,id)=>{
 const prefix='<script type="application/octet-stream" id="ktk-source-'+id+'">';
 const start=s.indexOf(prefix);
 assert(start>=0,'Missing '+id);
 const end=s.indexOf('</script>',start+prefix.length);
 return Buffer.from(s.slice(start+prefix.length,end).trim(),'base64').toString('utf8');
};
test('three buttons are in ONE menu and exactly three original offline game payloads',()=>{
 assert.equal((combined.match(/data-ktk-launch="/g)||[]).length,3);
 assert.equal((combined.match(/<script type="application\/octet-stream"/g)||[]).length,3);
 assert.equal((combined.match(/<script\b/g)||[]).length,4);
 for(const id of ['ffa','army','siege']){
   assert(combined.includes('id="ktk-source-'+id+'"'));
   assert(combined.includes('data-ktk-launch="'+id+'"'));
 }
 assert(!combined.includes('<script src='));
 assert(!combined.includes('https://cdn.'));
 assert(combined.includes('<h1>Kill the King — 3 Oyun Modu</h1>'));
 assert(combined.includes('Kale Kuşatması'));
});
test('original FFA and G5.4 game bytes preserved exactly, third S3D1 unchanged',()=>{
 for(const mode of ['ffa','army'])
   assert.equal(extract(combined,mode),extract(dual,mode));
 assert.equal(extract(combined,'siege'),siege);
 assert.equal(hash(extract(combined,'siege')),hash(siege));
 assert(siege.includes('S3D1 GERÇEK OYUNCU SAVAŞ ADAYI'));
 assert(siege.includes('ktkSiegeArmyStatus'));
 assert(siege.includes('ktkSiegePlayerCombatStatus'));
});
test('source integrity gate rejects fake preview or nonexistent army source',()=>{
 assert.throws(()=>addCastleThirdMode(dual,'<html>not the real siege engine</html>'),
   /Required real S3D1/);
 assert.throws(()=>addCastleThirdMode(dual.replace('ktk-source-army','missing-army'),siege),
   /Missing independently preserved army/);
 assert.throws(()=>addCastleThirdMode(combined,siege),
   /Expected exactly one|Third mode already present/);
});
test('launcher embeds only the real main menu controller; source games are inert until launch',()=>{
 const scr=[...combined.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
 assert.equal(scr.length,4);
 for(let i=0;i<3;i++)assert(scr[i][0].includes('application/octet-stream'));
 assert(scr[3][1].includes('stage.replaceChildren()'));
 assert(scr[3][1].includes('window.confirm('));
 assert(scr[3][1].includes('frame.srcdoc=visualArmy.replace('));
 assert(scr[3][1].includes('frame.srcdoc=original'));
 assert(scr[3][1].includes('KTKMeadowSurfaceVisual.apply(THREE,grassGround,spec)'));
 assert(scr[3][1].includes('surfaceB64'));
 assert(scr[3][1].includes('horizonB64'));
 assert(scr[3][1].includes('MAP2 ground surface anchor changed'));
 assert(scr[3][1].includes('MAP2 horizon ground anchor changed'));
 assert(scr[3][1].includes('if(mode==="army")'));
 assert(!scr[3][1].includes('window.eval('));
 assert(!scr[3][1].includes('new Function('));
 new vm.Script(scr[3][1],{filename:'three-mode-main-controller.js'});
});
function stub(){
 const elements=new Map(),buttons=[],frames=[];
 let confirmAllowed=true,confirmCount=0;
 function element(id){const e={id,style:{display:''},textContent:'',
   children:[],
   replaceChildren(){this.children=[]},
   appendChild(x){this.children.push(x);frames.push(x);}};
   elements.set(id,e);return e;
 }
 for(const id of ['stage','intro','meta','notice','ktk-source-ffa',
   'ktk-source-army','ktk-source-siege'])element(id);
 for(const id of ['ffa','army','siege'])
   elements.get('ktk-source-'+id).textContent=Buffer.from(
     extract(combined,id),'utf8').toString('base64');
 for(const id of ['ffa','army','siege']){
   const b={dataset:{ktkLaunch:id},attrs:{},handlers:{},
     classList:{toggle(n,state){if(n==='active')b.active=state}},
     setAttribute(n,v){this.attrs[n]=v;},
     addEventListener(n,f){this.handlers[n]=f;},
     click(){this.handlers.click()}};
   buttons.push(b);
 }
 const document={
   getElementById:id=>elements.get(id),
   querySelectorAll:s=>s==='[data-ktk-launch]'?buttons:[],
   createElement:tag=>{assert.equal(tag,'iframe');return {
     attrs:{},setAttribute(k,v){this.attrs[k]=v;},title:'',
     srcdoc:''};}
 };
 const window={confirm:()=>{
   confirmCount++;return confirmAllowed;
 }};
 const scr=[...combined.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].at(-1)[1];
 new vm.Script(scr,{filename:'real-three-mode-router.js'}).runInContext(
   vm.createContext({document,window,Uint8Array,TextDecoder,
     atob:x=>Buffer.from(x,'base64').toString('latin1')}));
 return {buttons,elements,frames,accept:v=>{confirmAllowed=v},
   get confirms(){return confirmCount},
   get current(){return elements.get('stage').children[0]}};
}
test('each of THREE main menu buttons launches its EXACT actual game HTML',()=>{
 const b=stub();
 assert.equal(b.buttons.length,3);
 for(const [i,id] of ['ffa','army','siege'].entries()){
   b.buttons[i].click();
   if(id==='army'){
     assert(b.current.srcdoc.startsWith(extract(combined,'army').slice(0,100)));
     assert(b.current.srcdoc.includes('AK04B_FIELD_NATIVE_G54_FOUR_SQUAD_RUNTIME_ADAPTER'));
     assert(b.current.srcdoc.includes('KTKG54FourSquadCommand'));
     assert(b.current.srcdoc.includes('ktkFieldFourSquadStatus'));
     assert(b.current.srcdoc.includes('const native=root.ArenaArmyBattle'));
   }else assert.equal(b.current.srcdoc,extract(combined,id));
   assert.equal(b.current.attrs.allowfullscreen,'');
   assert.equal(b.buttons[i].attrs['aria-pressed'],'true');
   assert.equal(b.elements.get('stage').children.length,1);
 }
 assert.equal(b.frames.length,3);
 assert.equal(b.confirms,2);
});
test('switches destroy previous frame; cancel holds the old active match',()=>{
 const b=stub();
 b.buttons[0].click();
 const ffa=b.current;
 b.accept(false);
 b.buttons[2].click();
 assert.equal(b.current,ffa);
 assert.equal(b.frames.length,1);
 assert.equal(b.confirms,1);
 b.accept(true);
 b.buttons[2].click();
 assert.notEqual(b.current,ffa);
 assert.equal(b.current.srcdoc,siege);
 assert.equal(b.frames.length,2);
 assert.equal(b.elements.get('stage').children.length,1);
 const siegeFrame=b.current;
 b.buttons[2].click();
 assert.equal(b.current,siegeFrame);
 assert.equal(b.confirms,2);
 b.buttons[1].click();
 assert.notEqual(b.current,siegeFrame);
 assert(b.current.srcdoc.includes('ktkFieldFourSquadStatus'));
 assert(b.current.srcdoc.includes('AK-04b'));
 assert.equal(extract(combined,'army'),extract(dual,'army'));
 assert.equal(b.frames.length,3);
});
test('byte-reproducible one-file build has three modes and honest manifest',()=>{
 const dest=join(mkdtempSync(join(tmpdir(),'ktk-three-mode-')),'KillTheKing_3_Mod.html');
 const out=build({dualFile,siegeFile,outFile:dest});
 const actual=readFileSync(dest,'utf8');
 const m=JSON.parse(readFileSync(dest+'.build.json','utf8'));
 assert.equal(actual,combined);
 assert.equal(out.html,actual);
 assert.deepEqual(m.modes,['ffa','army','siege']);
 assert.equal(m.singleLauncherMenu,true);
 assert.equal(m.oneLiveGameAtATime,true);
 assert.equal(m.gameSourcesBytePreserved,true);
 assert.equal(m.siegeRealSoldiers,140);
 assert.equal(m.siegeOriginalFFARendererShared,false);
 assert.equal(m.siegeOriginalFFAMovementShared,false);
 assert.equal(m.siegeReal3DBallisticsAvailable,false);
 assert.equal(m.fieldArmyOriginalPayloadByteIdentical,true);
 assert.equal(m.fieldArmyUnmodifiedSourceFourSquadUIIntegrated,true);
 assert.equal(m.AK04bFieldRuntimeOnlyInjection,true);
 assert.equal(m.AK04bFieldNativeFourSquadRuntimeAddon,true);
 assert.equal(m.siegeAllFourSquadsIndividuallySelectable,true);
 assert.equal(m.productionApproved,false);
 assert.equal(m.mainBranchMerged,false);
 assert.equal(m.sha256,hash(actual));
 assert.equal(m.sourceSha256.siege,hash(siege));
 assert.equal(m.bytes,Buffer.byteLength(actual));
});

test('AK-04b original field archive and true-side engine remain SHA-pinned despite runtime opt-in',()=>{
 const original=readFileSync(new URL('../KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html',import.meta.url),'utf8');
 const native=readFileSync(new URL('../mirror/arena-army-battle-true-side-swap.js',import.meta.url),'utf8');
 assert.equal(hash(original),'1d5f72768054b4138ba742e10923bfb20c00bd37fe789cdc3e40a65967cccfe2');
 assert.equal(hash(native),'307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841');
 assert.equal(extract(combined,'army'),extract(dual,'army'));
 const b=stub();b.buttons[1].click();
 assert.equal(extract(combined,'army')!==b.current.srcdoc,true);
 assert(b.current.srcdoc.includes('AK-04b field-mode adapter'));
 const ffab=stub();ffab.buttons[0].click();
 assert.equal(ffab.current.srcdoc,extract(combined,'ffa'));
 const siegeb=stub();siegeb.buttons[2].click();
 assert.equal(siegeb.current.srcdoc,siege);
});
