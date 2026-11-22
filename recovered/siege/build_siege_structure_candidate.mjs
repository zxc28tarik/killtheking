/** Build separate S3C1 genuine-soldier gate-strike siege candidate HTML.
 * NOT full siege gameplay: genuine soldier gate action added; ladders/actual FPS still OPEN.
 * Preserves S2 standalone 3D exploratory HTML builder unchanged.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const dir=dirname(fileURLToPath(import.meta.url));
const root=resolve(dir,'../..');
const files={
 KTK_THREE_JS:resolve(root,'vendor/three-r128.js'),
 KTK_SIEGE_MAP_JS:resolve(dir,'siege-map.js'),
 KTK_SIEGE_OBJECTIVES_JS:resolve(dir,'siege-objectives.js'),
 KTK_SIEGE_TRAVERSAL_JS:resolve(dir,'siege-traversal.js'),
 KTK_G54_WEAPON_REAL_JS:resolve(root,'recovered/army/modules/weapon-balance.js'),
 KTK_G54_ARMY_REAL_JS:resolve(root,'recovered/army/mirror/arena-army-battle-true-side-swap.js'),
 KTK_SIEGE_REAL_ARMY_BRIDGE_JS:resolve(dir,'siege-real-army-bridge.js'),
 KTK_SIEGE_STRUCTURE_COMBAT_JS:resolve(dir,'siege-structure-combat.js'),
 KTK_SIEGE_ASSAULT_NAV_JS:resolve(dir,'siege-assault-navigation.js'),
 KTK_SIEGE_PREVIEW_JS:resolve(dir,'siege-preview.js'),
 KTK_SIEGE_REAL_ARMY_OVERLAY_JS:resolve(dir,'siege-real-army-overlay.js')
};
const sha=s=>createHash('sha256').update(s).digest('hex');
const dest=resolve(process.argv[2]||resolve(dir,
  'dist/KillTheKing_Kusatma_S3C1_Gercek_Kapi_Saldirisi_Aday.html'));
let html=readFileSync(resolve(dir,'siege-preview-template.html'),'utf8');
html=html.replace(
 '<!-- KTK_SIEGE_PREVIEW_JS -->',
 [
 '<!-- KTK_G54_WEAPON_REAL_JS -->',
 '<!-- KTK_G54_ARMY_REAL_JS -->',
 '<!-- KTK_SIEGE_REAL_ARMY_BRIDGE_JS -->',
 '<!-- KTK_SIEGE_STRUCTURE_COMBAT_JS -->',
 '<!-- KTK_SIEGE_ASSAULT_NAV_JS -->',
 '<!-- KTK_SIEGE_PREVIEW_JS -->',
 '<!-- KTK_SIEGE_REAL_ARMY_OVERLAY_JS -->'
 ].join('\n')
);
const originalWarning='<b>Geliştirici önizlemesi:</b> Kale yerleşimi ve kuşatma hedef kuralları çalışır. Görünen askerler <b>yerleşim işaretleri</b>, gerçek 140 asker savaş AI\'sı değil.';
const realWarning='<b>S3C1 GERÇEK KAPI SALDIRISI ADAYI:</b> G5.4\'ün gerçek 140 askeri hareket eder. <b>Kapıya yalnız yaşayan ve menzildeki saldırganlar özgün yakın dövüş ritmiyle hasar verebilir.</b> Asker merdiven AI ve gerçek oyuncu silahları henüz tamamlanmadı. Merdiven kontrolleri DEBUG.';
if(!html.includes(originalWarning))throw Error('Expected original S2 disclaimer missing');
html=html.replace(originalWarning,realWarning);
html=html.replace('Kuşatma Kalesi S1 Harita ve Hedef Önizlemesi',
 'Kuşatma Kalesi — G5.4 S3C1 gerçek asker kapı saldırısı adayı');
html=html.replace('Geliştirici önizlemesi','Geliştirme adayı');
const manifest={
 kind:'S3C1_REAL_G54_SOLDIER_GATE_STRIKES_3D_CASTLE_NOT_RELEASE',
 sourceSha256:{},outputSha256:null,bytes:null,
 armyEngine:'G5.4 true-side-swap untouched mirrored source',
 authenticSoldiersAndCombatEngine:true,
 objectiveOccupancyDerivedFromActualSoldiers:true,
 gateStructureAttackFromActualSoldiers:true,
 gateDamageUsesNativeMeleeStats:true,
 siegeAIRealSoldierGateApproachEnabled:true,
 nativeG54HasBuildingEvents:false,
 ladderClimbByRealSoldierAI:false,
 realFPSPlayerWeaponConnected:false,
 G84Restored:false,originalFFAChanged:false,mainChanged:false,
 productionSiegeApproved:false
};
for(const [id,path] of Object.entries(files)){
 const js=readFileSync(path,'utf8');
 if(/<\/script/iu.test(js))throw Error('Unsafe inline script close in '+id);
 new vm.Script(js,{filename:path});
 const needle='<!-- '+id+' -->';
 if(!html.includes(needle))throw Error('Missing dependency marker '+id);
 html=html.replace(needle,'<script id="'+id.toLowerCase()+'">\n'+js+'\n</script>');
 manifest.sourceSha256[id]=sha(js);
}
const original='307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841';
if(manifest.sourceSha256.KTK_G54_ARMY_REAL_JS!==original)
 throw Error('Original G5.4 true-side engine changed! No unsafe substitution.');
if((html.match(/<script\b/giu)||[]).length!==11||
   html.includes('<!-- KTK_')||
   !html.includes('GERÇEK KAPI SALDIRISI ADAYI')||
   !html.includes('Kapıya yalnız yaşayan'))
 throw Error('S3 HTML package cannot substantiate its explicit limits');
mkdirSync(dirname(dest),{recursive:true});
writeFileSync(dest,html,'utf8');
manifest.outputSha256=sha(html);
manifest.bytes=Buffer.byteLength(html,'utf8');
writeFileSync(dest+'.build.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({file:dest,manifest},null,2));
