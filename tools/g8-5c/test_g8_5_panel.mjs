/** DOM-stub functional smoke test only; real browsers/WebGL not executed. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('G8_5B_Ayna_Test_Paneli.html','utf8');
const demo=JSON.parse(html.match(/<script id="builtindemo" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const script=html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)[1];
class El{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.events={};this.attributes={};this.textContent='';this.disabled=false;this.tabIndex=-1;}
  append(e){this.children.push(e)}
  replaceChildren(...e){this.children=[...e]}
  addEventListener(k,fn){this.events[k]=fn}
  setAttribute(k,v){this.attributes[k]=v}
  querySelectorAll(tag){return this.children.filter(c=>c.tagName===tag)}
}
const ids=new Map();
const document={getElementById:id=>{if(!ids.has(id))ids.set(id,new El());return ids.get(id)},createElement:tag=>new El(tag)};
const ctx=vm.createContext({document, console, Blob, URL, setTimeout});
vm.runInContext(script,ctx);
let n=0;function test(name,fn){fn();n++;console.log('PASS',name)}
test('inline script parses and registers demo action',()=>assert.equal(typeof ids.get('demo').events.click,'function'));
test('sample JSON status explicitly missing evidence',()=>assert.equal(demo.overallStatus,'missing_evidence'));
test('demo button renders nine groups',()=>{document.getElementById('builtindemo').textContent=JSON.stringify(demo);ids.get('demo').events.click();assert.equal(ids.get('groups').children.length,9)});
test('demo UI discloses synthetic source',()=>assert.match(ids.get('error').textContent,/SENTETİK/));
test('group selection updates findings and sets selected attribute',()=>{const rows=ids.get('groups').children;rows[3].events.click();assert.equal(rows[3].attributes['aria-selected'],'true');assert.equal(rows[0].attributes['aria-selected'],'false')});
test('invalid report type rejected by render',()=>assert.throws(()=>vm.runInContext('render({kind:"other",groups:[],runCount:0})',ctx),/JSON biçimi/));
console.log(`\n${n}/${n} panel DOM-stub smoke tests PASS (not hardware browser tests).`);
