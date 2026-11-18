/** Execute the actual launcher controller in a minimal DOM VM.
 * This tests mode transitions and cleanup, not real GPU rendering. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './build_isolated_launcher.mjs';
import {patchFfaAggro} from './player_target_hotfix.mjs';

const dir=dirname(fileURLToPath(import.meta.url));
const input=process.env.KTK_FFA_HTML;
if(!input)throw Error('Missing original A5 HTML input');
const result=build(input,resolve(dir,'dist/router_dom_smoke.html'));
const page=result.result;
const script=[...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].at(-1)[1];

function stubBrowser(){
 const byId=new Map(),frames=[],buttons=[];
 let activeFrame=null,accepted=true,confirmCalls=0;
 const element=id=>{const x={id,style:{display:''},textContent:'',children:[],
   replaceChildren(){this.children=[];activeFrame=null;},
   appendChild(child){this.children.push(child);frames.push(child);activeFrame=child;}};byId.set(id,x);return x;};
 for(const id of ['stage','intro','meta','notice','ktk-source-ffa','ktk-source-army'])element(id);
 const ffa64=page.match(/id="ktk-source-ffa">([\s\S]*?)<\/script>/)[1].trim();
 const army64=page.match(/id="ktk-source-army">([\s\S]*?)<\/script>/)[1].trim();
 byId.get('ktk-source-ffa').textContent=ffa64;
 byId.get('ktk-source-army').textContent=army64;
 for(const mode of ['ffa','army']){
  const b={dataset:{ktkLaunch:mode},attrs:{},selected:false,
   callbacks:{},classList:{toggle(name,on){if(name==='active')b.selected=on;}},
   setAttribute(key,value){this.attrs[key]=value;},
   addEventListener(name,fn){this.callbacks[name]=fn;},
   click(){this.callbacks.click?.();}};
  buttons.push(b);
 }
 const document={
  getElementById:id=>byId.get(id),
  querySelectorAll:selector=>selector==='[data-ktk-launch]'?buttons:[],
  createElement(tag){
   assert.equal(tag,'iframe');
   return {title:'',attrs:{},setAttribute(key,value){this.attrs[key]=value;}};
  }
 };
 const window={confirm(message){assert.match(message,/Mevcut maç/);confirmCalls++;return accepted;}};
 const context=vm.createContext({document,window,TextDecoder,Uint8Array,
   atob:value=>Buffer.from(value,'base64').toString('latin1')});
 new vm.Script(script,{filename:'real-mode-router.js'}).runInContext(context);
 return {buttons,frames,byId,window,get activeFrame(){return activeFrame;},
  get confirmCalls(){return confirmCalls;},set accepted(v){accepted=v;}};
}
test('launch FFA and preserve original Oct A5 bytes inside a real mode-route event',()=>{
 const b=stubBrowser();
 assert.equal(b.buttons.length,2);
 assert.equal(b.activeFrame,null);
 b.buttons[0].click();
 assert(b.activeFrame);
 assert.equal(b.activeFrame.srcdoc,patchFfaAggro(result.ffa));
 assert.equal(b.buttons[0].attrs['aria-pressed'],'true');
 assert.equal(b.buttons[1].attrs['aria-pressed'],'false');
 assert.equal(b.byId.get('stage').style.display,'block');
 assert.equal(b.byId.get('intro').style.display,'none');
 assert.equal(b.frames.length,1);
 assert.equal(b.confirmCalls,0);
});
test('switch FFA -> Army destroys old iframe and loads the corrected 140-soldier game',()=>{
 const b=stubBrowser();
 b.buttons[0].click();
 const first=b.activeFrame;
 b.buttons[1].click();
 assert.notEqual(b.activeFrame,first,'must create a fresh iframe, not reuse old FFA globals');
 assert.equal(b.byId.get('stage').children.length,1,'only one active game scene');
 assert.equal(b.activeFrame.srcdoc,result.army.html);
 assert(b.activeFrame.srcdoc.includes('ktk-g54-autoselect-army'));
 assert.equal(b.buttons[0].attrs['aria-pressed'],'false');
 assert.equal(b.buttons[1].attrs['aria-pressed'],'true');
 assert.equal(b.frames.length,2);
 assert.equal(b.confirmCalls,1);
});
test('cancel mode switch prevents destroying active FFA match',()=>{
 const b=stubBrowser();
 b.buttons[0].click();
 const current=b.activeFrame;
 b.accepted=false;
 b.buttons[1].click();
 assert.equal(b.activeFrame,current);
 assert.equal(b.byId.get('stage').children.length,1);
 assert.equal(b.frames.length,1);
 assert.equal(b.confirmCalls,1);
 assert.equal(b.buttons[0].attrs['aria-pressed'],'true');
});
test('same-mode click does not restart game or ask confirmation',()=>{
 const b=stubBrowser();
 b.buttons[1].click();
 const current=b.activeFrame;
 b.buttons[1].click();
 assert.equal(b.activeFrame,current);
 assert.equal(b.frames.length,1);
 assert.equal(b.confirmCalls,0);
});
test('return from Army to FFA creates clean fresh original game again',()=>{
 const b=stubBrowser();
 b.buttons[1].click();
 const first=b.activeFrame;
 b.buttons[0].click();
 assert.notEqual(b.activeFrame,first);
 assert.equal(b.activeFrame.srcdoc,patchFfaAggro(result.ffa));
 assert.equal(b.byId.get('stage').children.length,1);
 assert.equal(b.confirmCalls,1);
});
