import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {integrate,validateInlineScripts} from '../inject_g5_4_passive_trace.mjs';
const base=dirname(fileURLToPath(import.meta.url)),root=resolve(base,'..');
const hash=s=>createHash('sha256').update(s).digest('hex');
export function buildCandidate(output=resolve(base,'dist/KillTheKing_G5_4_Temas_Kurtarma_Oyna.html')){
 const html=readFileSync(resolve(root,'KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html'),'utf8');
 const before=readFileSync(resolve(root,'modules/arena-army-battle.js'),'utf8');
 const after=readFileSync(resolve(base,'arena-army-battle-contact-recovery.js'),'utf8');
 const telemetry=readFileSync(resolve(root,'g5_4_passive_battle_trace.js'),'utf8');
 assert.equal(html.split(before).length-1,1,'Original G5.4 engine must appear once');
 assert(before.includes('if(!melee.length)anchorX=clamp(anchorX-direction*20'));
 assert(after.includes('G5.4 contact recovery:'));
 assert(!after.includes('if(!melee.length)anchorX=clamp(anchorX-direction*20'));
 assert(!after.includes('</script>'));
 const observed=integrate(html.replace(before,after),telemetry);
 assert.equal(validateInlineScripts(observed),30,'30 game and observer scripts must compile');
 const manifest={format:'killtheking-g5.4-contact-recovery-candidate-v1',
  originalFileSha256:hash(html),originalEngineSha256:hash(before),
  candidateEngineSha256:hash(after),telemetrySha256:hash(telemetry),
  resultHtmlSha256:hash(observed),resultBytes:Buffer.byteLength(observed,'utf8'),
  verifiedInlineScripts:30,gameplayWinRuleChanged:false,playerOrdersChanged:false,
  novemberG8_4Recovered:false,webglValidated:false,
  scope:'Historical G5.4 AI firing base correction; NOT a finished G8.4/G8.5 game'};
 mkdirSync(dirname(output),{recursive:true});
 writeFileSync(output,observed,'utf8');
 const manifestFile=output.replace(/\.html$/i,'_BUILD.json');
 writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n','utf8');
 return {output,manifestFile,manifest};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 console.log(JSON.stringify(buildCandidate(),null,2));
