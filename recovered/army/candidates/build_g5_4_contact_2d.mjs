/** Build a standalone G5.4 HTML from the tested 2D contact repair, not G8.4. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {integrate,validateInlineScripts} from '../inject_g5_4_passive_trace.mjs';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'..');
const hash=b=>createHash('sha256').update(b).digest('hex');
export function buildContact2D(dest=resolve(here,'dist/KillTheKing_G5_4_2D_Temas_Oyna.html')){
 const archived=readFileSync(resolve(root,'KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html'),'utf8');
 const originalEngine=readFileSync(resolve(root,'modules/arena-army-battle.js'),'utf8');
 const repairedEngine=readFileSync(resolve(here,'arena-army-battle-contact-2d-candidate.js'),'utf8');
 const observer=readFileSync(resolve(root,'g5_4_passive_battle_trace.js'),'utf8');
 assert.equal(archived.split(originalEngine).length-1,1,'Original G5.4 engine should occur once');
 assert(repairedEngine.includes('G5.4 contact recovery v2:'));
 assert(!repairedEngine.includes('if(!melee.length)anchorX=clamp(anchorX-direction*20'));
 assert(!repairedEngine.includes('</script>'));
 const replaced=archived.replace(originalEngine,repairedEngine);
 const out=integrate(replaced,observer);
 const scripts=validateInlineScripts(out);
 assert.equal(scripts,30);
 const manifest={format:'ktk-g5.4-2d-contact-github-build-v1',realEngine:'G5.4 only',
  candidateEngineSha256:hash(repairedEngine),archivedHtmlSha256:hash(archived),
  outputHtmlSha256:hash(out),outputBytes:Buffer.byteLength(out,'utf8'),inlineScriptCount:scripts,
  originalSourceBytesPreserved:true,gameplayChange:'AI-only unescorted firing line seeks 2D firing position',
  victoryRuleChanged:false,weaponValuesChanged:false,playerOrdersChanged:false,
  g8_4Recovered:false,gpuWebGLVerified:false,matchedSideSwapTrials:0};
 mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,out,'utf8');
 const meta=dest.replace(/\.html$/i,'_BUILD.json');writeFileSync(meta,JSON.stringify(manifest,null,2)+'\n');
 return {manifest,dest,meta};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 console.log(JSON.stringify(buildContact2D(process.argv[2]?resolve(process.argv[2]):undefined),null,2));
