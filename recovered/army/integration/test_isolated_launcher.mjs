/** Phase-one dual-mode launcher integrity & actual G5.4 engine contracts. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {assembleArmies,createLauncher,build} from './build_isolated_launcher.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const armySource=readFileSync(resolve(here,'../KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html'),'utf8');
const engine=readFileSync(resolve(here,'../mirror/arena-army-battle-true-side-swap.js'),'utf8');
const weapon=readFileSync(resolve(here,'../modules/weapon-balance.js'),'utf8');
const ffaFile=process.env.KTK_FFA_HTML;
if(!ffaFile)throw Error('KTK_FFA_HTML must name the independently rebuilt 2026-10-18 FFA HTML');
const ffa=readFileSync(ffaFile,'utf8');
const sha=s=>createHash('sha256').update(s).digest('hex');
const scripts=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
const g54=assembleArmies(armySource,engine);
const html=createLauncher(ffa,g54.html);
const decodeFrom=(name)=>{
 const re=new RegExp('<script type="application/octet-stream" id="ktk-source-'+name+'">([\\s\\S]*?)<\\/script>');
 const found=html.match(re);
 assert(found,'Missing embedded script '+name);
 return Buffer.from(found[1].trim(),'base64').toString('utf8');
};
const singleScript=m=>m[1];
const patchEngine=/root\.ArenaArmyBattle=api/;
const originalScripts=scripts(armySource),patchedScripts=scripts(g54.html);

test('FFA A5 approved Oct 18 artifact is an immutable source input',()=>{
 assert.equal(sha(ffa),'18dca2a895763f0955566f2fc90651f1ab1a98f86597e399cbac42ac2fc6f15a');
 assert.equal(decodeFrom('ffa'),ffa);
 assert.equal(sha(decodeFrom('ffa')),sha(ffa));
});
test('source G5.4 archive immutable and preserved',()=>{
 assert.equal(sha(armySource),'1d5f72768054b4138ba742e10923bfb20c00bd37fe789cdc3e40a65967cccfe2');
 assert.equal(originalScripts.length,29);
 assert.equal(patchedScripts.length,30);
});
test('only embedded battle engine changed; no arena AI, graphics, FFA/TDM code modifications',()=>{
 const oldIndex=originalScripts.findIndex(s=>patchEngine.test(s[1]));
 const newIndex=patchedScripts.findIndex(s=>patchEngine.test(s[1]));
 assert.equal(oldIndex,26);assert.equal(newIndex,26);
 for(let i=0;i<29;i++){
  if(i===26){assert.equal(patchedScripts[i][1],engine);continue;}
  assert.equal(singleScript(originalScripts[i]),singleScript(patchedScripts[i]),'unexpected modified G5.4 script '+i);
 }
 assert(armySource.includes('meadowBattleMode = false'));
 assert(g54.html.includes('meadowBattleMode = false'));
 assert(g54.html.includes('document.getElementById("meadow-army-demo-btn")'));
 assert(!ffa.includes('root.ArenaArmyBattle=api'));
});
test('launcher embeds BOTH full games and cannot execute game source on parent page',()=>{
 assert.equal(decodeFrom('army'),g54.html);
 assert.equal(scripts(html).length,3,'exactly 2 inert payloads + one launcher controller');
 assert(html.includes('data-ktk-launch="ffa"'));
 assert(html.includes('data-ktk-launch="army"'));
 assert(html.includes('stage.replaceChildren()'),'previous scene must be removed at switch');
 assert(html.includes('window.confirm('),'changing active mode must ask first');
 assert(html.includes('frame.srcdoc=decode('));
 assert(html.includes('OCTOBER impossible marker')===false);
});
test('army corrected engine loads without browser and owns genuine blue or red player company',()=>{
 const ctx=vm.createContext({console});
 new vm.Script(weapon,{filename:'weapon-balance.js'}).runInContext(ctx);
 new vm.Script(engine,{filename:'arena-army-battle-true-side-swap.js'}).runInContext(ctx);
 const core=ctx.ArenaArmyBattle;
 assert(core&&typeof core.step==='function');
 for(const team of ['blue','red'])for(const role of ['musket','pike','bow','sword']){
  const state=core.create(1600,role,team);
  assert.equal(state.soldiers.length,140);
  assert.equal(state.squads.length,8);
  assert.equal(state.playerTeam,team);
  assert.equal(state.squads[state.playerSquadId].team,team);
  assert.equal(state.squads.filter(s=>s.playerControlled).length,1);
  assert.equal(core.issueOrder(state,state.playerSquadId,'hold'),true);
  core.step(state,0.08);
  assert.equal(state.squads[state.playerSquadId].order,'hold');
 }
});
test('all 29 source scripts and new launcher controller have correct JS syntax',()=>{
 for(const [index,s] of scripts(ffa).entries())
  new vm.Script(s[1],{filename:'ffa-'+index+'.js'});
 for(const [index,s] of scripts(g54.html).entries())
  new vm.Script(s[1],{filename:'army-'+index+'.js'});
 for(const [index,s] of scripts(html).entries())if(index===2)
  new vm.Script(s[1],{filename:'launcher-controller.js'});
});
test('deterministic standalone HTML build and source-provenance manifest',()=>{
 const folder=mkdtempSync(join(tmpdir(),'ktk-isolated-'));
 const dest=join(folder,'KillTheKing_Birlesik_Aday.html');
 const built=build(ffaFile,dest);
 const onDisk=readFileSync(dest,'utf8');
 const manifest=JSON.parse(readFileSync(dest+'.build.json','utf8'));
 assert.equal(onDisk,html);
 assert.equal(built.manifest.launcherSHA256,sha(onDisk));
 assert.equal(manifest.ffaBytes,Buffer.byteLength(ffa));
 assert.equal(manifest.armyBytes,Buffer.byteLength(g54.html));
 assert.equal(manifest.approval,'CANDIDATE_NOT_APPROVED');
 assert.equal(manifest.realGPUAccepted,false);
 assert.equal(manifest.g84Restored,false);
});
