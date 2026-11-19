/** Build one standalone OFFLINE file for first 3D castle + objective preview.
 * S2 adds real preview player walking physics and 3D climb; G5.4 AI is absent.
 * No change to FFA, G5.4 or main. Do NOT represent as real 140-soldier combat.
 */
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const dir=dirname(fileURLToPath(import.meta.url));
const root=resolve(dir,'../..');
const sources={
  KTK_THREE_JS:resolve(root,'vendor/three-r128.js'),
  KTK_SIEGE_MAP_JS:resolve(dir,'siege-map.js'),
  KTK_SIEGE_OBJECTIVES_JS:resolve(dir,'siege-objectives.js'),
  KTK_SIEGE_TRAVERSAL_JS:resolve(dir,'siege-traversal.js'),
  KTK_SIEGE_PREVIEW_JS:resolve(dir,'siege-preview.js')
};
const sha=s=>createHash('sha256').update(s).digest('hex');
const dest=resolve(process.argv[2]||resolve(dir,
  'dist/KillTheKing_Kusatma_Kalesi_S1_Onizleme.html'));
let html=readFileSync(resolve(dir,'siege-preview-template.html'),'utf8');
const manifest={
  kind:'SIEGE_S2_CASTLE_EXPLORATION_NOT_REAL_ARMY',
  builder:'recovered/siege/build_siege_preview.mjs',
  sourceSha256:{},outputSha256:null,bytes:null,
  realArmyBattleConnected:false,playerFpsTpsConnected:false,
  standalonePreviewExploration:true,standaloneSweptCollision:true,
  originalFfaModified:false,originalArmyModified:false,
  publicationApproved:false
};
for(const [tag,path] of Object.entries(sources)){
  const js=readFileSync(path,'utf8');
  // Prevent script injection and ensure source is a real parseable script.
  if(/<\/script/iu.test(js))throw Error('Unsafe script close marker in '+path);
  new vm.Script(js,{filename:path});
  const marker='<!-- '+tag+' -->';
  if(!html.includes(marker))throw Error('Missing HTML injection marker: '+marker);
  const replacement='<script id="'+tag.toLowerCase()+'">\n'+js+'\n</script>';
  html=html.replace(marker,replacement);
  manifest.sourceSha256[tag]=sha(js);
}
if(html.includes('<!-- KTK_')||
   (html.match(/<script\b/giu)||[]).length!==5||
   !html.includes('Geliştirici önizlemesi'))
  throw Error('Malformed or misleading S1 HTML packaging');
mkdirSync(dirname(dest),{recursive:true});
writeFileSync(dest,html,'utf8');
manifest.outputSha256=sha(html);
manifest.bytes=Buffer.byteLength(html,'utf8');
writeFileSync(dest+'.build.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({file:dest,manifest},null,2));
