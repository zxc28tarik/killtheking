/** Sync root index.html with the canonical SINGLE original FPS native AK09 builder.
 * Only supported modes: --write (commit in a feature branch), --check (read-only CI).
 * Never use the archived S3D1 iframe launcher for the root entrypoint.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildCanonical} from '../recovered/native-siege/build_canonical_three_maps.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const dest=resolve(root,'index.html');
const mode=process.argv[2]||'--check';
if(!['--check','--write'].includes(mode))throw Error('Expected --check or --write');
// UI32 review branch: the self-contained native menu candidate is the release source.
// Keep the archived builder available without letting it silently replace this menu.
const html=readFileSync(resolve(root,'playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html'),'utf8');
if(!html.includes('id="ktk-ui32-controller"')||!html.includes('id="native-siege-start"')||!html.includes('ktkNativeSiegeMapStatus')||html.includes('ktk-source-siege')||html.includes('data-ktk-launch='))throw Error('Incorrect UI32 native candidate');
const baseline=buildCanonical(readFileSync(resolve(root,'recovered/native-siege/KillTheKing_AK_NATIVE_09_original_game_siege_map.html'),'utf8'));
const scripts=s=>Array.from(s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),m=>m[1]);
const oldScripts=scripts(baseline.html),candidateScripts=scripts(html);
// Preserve the archived native lineage by position. Only the explicitly
// reviewed live army module may differ; pin its exact UTF-8 git blob identity.
// The historical baseline stays immutable and is never exported over UI32.
const approvedArmyBlob='a2ae6884e5bb81d9229d38ff95d615eb145bcedb';
const blobIdentity=s=>createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
if(oldScripts.length!==29||candidateScripts.length!==31)
 throw Error('Unexpected native script count');
if(!oldScripts[26].includes('root.ArenaArmyBattle')||!candidateScripts[26].includes('root.ArenaArmyBattle')||
   blobIdentity(candidateScripts[26])!==approvedArmyBlob)
 throw Error('Unreviewed live army module: update the explicit approval only with regression evidence');
let preserved=0;
for(let i=0;i<28;i++){
 if(oldScripts[i]===candidateScripts[i])preserved++;
 else if(i!==26)throw Error('Unapproved original script changed: '+i);
}
const manifest={...baseline.manifest,unchangedOriginalScriptCount:preserved,bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex')};
if(manifest.kind!=='SINGLE_NATIVE_FPS_THREE_MAPS'||
   manifest.oldIframeOrSeparateS3D1Runtime!==false||
   manifest.oneLiveGameDocument!==true||
   manifest.unchangedOriginalScriptCount!==27)
 throw Error('Refusing incorrect non-native entrypoint');
if(mode==='--write'){
 writeFileSync(dest,html,'utf8');
 console.log('WRITE canonical root index.html',manifest.bytes,manifest.sha256);
}else{
 const existing=readFileSync(dest,'utf8');
 if(existing!==html)throw Error(
  'Root index.html is outdated/not canonical. Run node tools/sync_canonical_entrypoint.mjs --write and commit.');
 console.log('PASS: root index.html == exact canonical native source',manifest.bytes,manifest.sha256);
}
