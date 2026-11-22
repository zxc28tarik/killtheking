/** Sync root index.html with the canonical SINGLE original FPS native AK09 builder.
 * Only supported modes: --write (commit in a feature branch), --check (read-only CI).
 * Never use the archived S3D1 iframe launcher for the root entrypoint.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCanonical} from '../recovered/native-siege/build_canonical_three_maps.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const input=resolve(root,'recovered/native-siege/KillTheKing_AK_NATIVE_09_original_game_siege_map.html');
const dest=resolve(root,'index.html');
const mode=process.argv[2]||'--check';
if(!['--check','--write'].includes(mode))throw Error('Expected --check or --write');
const {html,manifest}=buildCanonical(readFileSync(input,'utf8'));
if(manifest.kind!=='SINGLE_NATIVE_FPS_THREE_MAPS'||
   manifest.oldIframeOrSeparateS3D1Runtime!==false||
   manifest.oneLiveGameDocument!==true||
   manifest.unchangedOriginalScriptCount!==28)
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
