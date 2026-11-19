/**
 * Kill the King — THIRD MODE: Castle Siege.
 *
 * Extends the APPROVED-CANDIDATE TWO-MODE MENU, not the original FFA or
 * army gameplay sources. Packs 3 separate complete original HTML games as
 * inert, UTF-8 base64 into ONE offline HTML (no server, no network).
 * Uses exactly one live iframe at a time, destroys old game on switch.
 *
 * This is a genuine SINGLE MAIN MENU with 3 PLAYABLE CHOICES, not one
 * unified shared physics/renderer. The siege has a separate 3D art system,
 * and the original FPS locomotion/bullet ballistics are NOT yet ported.
 * Main, original FFA, original G5.4, and all historical artifacts remain.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const base=dirname(fileURLToPath(import.meta.url));
const sha=t=>createHash('sha256').update(t).digest('hex');
const sourceScripts=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
const one=(s,needle)=>{if(s.split(needle).length!==2)throw Error('Expected exactly one: '+needle);return true;};
const oldTitle='<title>Kill the King — Arena ve Ordu Savaşı • İzole Entegrasyon Adayı</title>';
const oldIntro='<h1>İki oyun modu, ayrı çalışma ortamları</h1>';
const oldNav='<button type="button" class="pick" data-ktk-launch="army">🛡 140 ASKERLİ ORDU SAVAŞI</button>';
const siegeNav='<button type="button" class="pick" data-ktk-launch="siege">🏰 KALE KUŞATMASI</button>';
const oldControllerGuard='if(!["ffa","army"].includes(mode))return;';
const oldTitleExpr='frame.title=mode==="ffa"?"Kill the King Serbest Arena":"Kill the King G5.4 Ordu Savaşı";';
const oldInfoExpr='info.textContent=mode==="ffa"?"FFA / TDM • Oyuncu da hedeflenir":"G5.4 • 70 mavi + 70 kırmızı • oyuncu hedefleme düzeltmesi";';
const oldPayloadIntro='<script type="application/octet-stream" id="ktk-source-army">';
const oldPayloadEnd='</script><script>';
function expectSource(check,id){
 const needle='<script type="application/octet-stream" id="ktk-source-'+id+'">';
 if(!check.includes(needle))throw Error('Missing independently preserved '+id+' source');
 const rest=check.slice(check.indexOf(needle)+needle.length);
 const encoded=rest.slice(0,rest.indexOf('</script>')).trim();
 if(!/^[A-Za-z0-9+/=\s]+$/.test(encoded))throw Error('Invalid source base64 '+id);
 return Buffer.from(encoded,'base64').toString('utf8');
}
export function addCastleThirdMode(twoModeHtml, siegeHtml){
 if(typeof twoModeHtml!=='string'||typeof siegeHtml!=='string')
   throw Error('Give exact two-mode HTML and real S3D1 siege HTML');
 for(const id of ['ffa','army'])if(!expectSource(twoModeHtml,id).startsWith('<!'))
   throw Error('Historical '+id+' source not embedded');
 if(!siegeHtml.startsWith('<!')||!siegeHtml.includes('S3D1 GERÇEK OYUNCU SAVAŞ ADAYI')||
   !siegeHtml.includes('ktkSiegePlayerCombatStatus')||
   !siegeHtml.includes('ktkSiegeArmyStatus')||
   sourceScripts(siegeHtml).length!==19||
   !siegeHtml.includes('KTKSiege3DBallistics')||
   !siegeHtml.includes('KTKSiegeWeaponFeedback')||
   !siegeHtml.includes('KTKSiegePlayerLocomotion')||
   !siegeHtml.includes('KTKSiegeCharacterVisuals'))
   throw Error('Required real S3D1 140-man FPS castle candidate missing or mislabeled');
 for(const text of [oldTitle,oldIntro,oldNav,oldControllerGuard,oldTitleExpr,oldInfoExpr,oldPayloadIntro,oldPayloadEnd])one(twoModeHtml,text);
 if(twoModeHtml.includes('data-ktk-launch="siege"')||twoModeHtml.includes('ktk-source-siege'))
   throw Error('Third mode already present');
 let result=twoModeHtml;
 const replace=(a,b)=>{one(result,a);result=result.replace(a,b)};
 replace(oldTitle,'<title>Kill the King — Arena • Ordu Savaşı • Kale Kuşatması</title>');
 replace(oldIntro,'<h1>Kill the King — 3 Oyun Modu</h1>');
 replace(oldNav,oldNav+'\n'+siegeNav);
 // Existing TWO independently approved modes retain their exact embedded
 // sources, graphics, bot behaviors and combat code.
 replace('<div class="facts"><section><strong>Serbest Arena / TDM</strong>',
   '<div class="facts"><section><strong>Serbest Arena / TDM</strong>');
 // The facts container is anchored to the exact next paragraph.
 const twoEnd='Bu sürümde oyuncu tarafı mavi.</span></section></div>';
 one(result,twoEnd);
 result=result.replace(twoEnd,twoEnd.replace('</div>',
   '<section><strong>🏰 Kale Kuşatması — Üçüncü Mod</strong><span>'+
   '140 gerçek G5.4 askerle saldır veya savun. Kale kapısı kırılır; iki yan merdiven kurulur, avlu ve iç kale ele geçirilir. '+
   'FPS/TPS, 100 HP, kılıç/mızrak/yay/tüfek. Ayrı S3D1 3B sahnesi: sınıf bazlı kuşatma görsellerinin Arena ile birebir eşitliği, tam zıplama/kayma ve gerçek 3B mermi/ok fiziği henüz buraya aktarılmadı.'+
   '</span></section></div>'));
 replace('<p>Bu aday, Ekim 2026 tarihli kabul edilmiş FFA oyununun özgün sürümünü arşivler; FFA hedef seçimine sınırlı düzeltme uygular. G5.4 ordu savaşı ayrı bir oyun penceresinde açılır; geçişte önceki oyun kapatılır. Her iki oyun aynı çevrimdışı HTML içindedir.</p>',
   '<p>Üç oyun modu artık aynı ana menüden açılır. Serbest Arena/TDM ve Ordu Savaşı özgün kaynaklarını korur. Kale Kuşatması üçüncü oynanabilir seçimdir; mod geçişinde önceki oyun kapatılır, yeni mod açılır. Üçü de bu tek çevrimdışı HTML dosyasındadır.</p>');
 replace('<p><strong>Bu henüz son birleşik oyun değildir.</strong> Modlar ayrı çalışır; paylaşılan ilerleme/kayıt sistemi, G8.4 senaryoları ve gerçek GPU kabulü daha sonra yapılacaktır. Moddan çıkmadan önce ESC ile fare kilidini bırak.</p>',
   '<p><strong>3 mod tek menüde — oyun motorları hâlâ izole.</strong> Kuşatma görsellerinin ve ana FFA hareket/animasyonlarının birebir ortaklaştırılması, 3B balistik, paylaşılan kayıt, gerçek GPU ve nihai yayın kabulü açık. Mod değiştirmeden önce ESC ile fare kilidini bırak.</p>');
 replace('<small>BOT HEDEFLEME DÜZELTMESİ • ADAY</small>',
   '<small>3 OYUN MODU • GELİŞTİRME ADAYI</small>');
 replace(oldControllerGuard,'if(!["ffa","army","siege"].includes(mode))return;');
 replace(oldTitleExpr,
   'frame.title=mode==="ffa"?"Kill the King Serbest Arena":mode==="army"?"Kill the King G5.4 Ordu Savaşı":"Kill the King Kale Kuşatması";');
 replace(oldInfoExpr,
   'info.textContent=mode==="ffa"?"FFA / TDM • Oyuncu da hedeflenir":mode==="army"?"G5.4 • 70 mavi + 70 kırmızı • oyuncu hedefleme düzeltmesi":"KALE KUŞATMASI • 70 saldıran + 70 savunan • kapı, sur ve iç kale";');
 // Add the entire S3D1 game as a third inert payload, immediately before
 // the original controller script. No external file dependencies.
 one(result,oldPayloadEnd);
 result=result.replace(oldPayloadEnd,
   '</script>\n<script type="application/octet-stream" id="ktk-source-siege">\n'+
   Buffer.from(siegeHtml,'utf8').toString('base64')+
   '\n'+oldPayloadEnd);
 if(sourceScripts(result).length!==4||result.includes('<script src=')||
    !result.includes('ktk-source-siege')||
    !result.includes('data-ktk-launch="siege"'))
   throw Error('Three-game standalone HTML is malformed');
 const recovered=expectSource(result,'siege');
 if(recovered!==siegeHtml||expectSource(result,'ffa')!==expectSource(twoModeHtml,'ffa')||
    expectSource(result,'army')!==expectSource(twoModeHtml,'army'))
   throw Error('One of three game sources changed during packaging');
 const controller=sourceScripts(result).at(-1)[1];
 new vm.Script(controller,{filename:'ktk-three-mode-router.js'});
 return result;
}
export function build({dualFile,siegeFile,outFile}={}){
 if(!dualFile||!siegeFile||!outFile)throw Error('Dual, siege and output HTML filenames required');
 const dual=readFileSync(resolve(dualFile),'utf8');
 const siege=readFileSync(resolve(siegeFile),'utf8');
 const html=addCastleThirdMode(dual,siege);
 const dest=resolve(outFile);
 mkdirSync(dirname(dest),{recursive:true});
 writeFileSync(dest,html,'utf8');
 const manifest={
  kind:'KILL_THE_KING_THREE_MODES_ONE_HTML_ISOLATED_RUNTIME_CANDIDATE',
  modes:['ffa','army','siege'],
  modeLabels:['Serbest Arena / TDM','140 Askerli Ordu Savaşı','Kale Kuşatması'],
  combinedSingleOfflineHTML:true,singleLauncherMenu:true,
  oneLiveGameAtATime:true,gameSourcesBytePreserved:true,
  sourceSha256:{ffa:sha(expectSource(html,'ffa')),
    army:sha(expectSource(html,'army')),
    siege:sha(expectSource(html,'siege')),
    oldTwoModeLauncher:sha(dual)},
  sha256:sha(html),bytes:Buffer.byteLength(html),
  siegeRealSoldiers:140,
  siegeOriginalFFARendererShared:false,
  siegeOriginalFFAMovementShared:false,
  siegeReal3DBallisticsAvailable:false,
  siegePlayer3DMusketAndPhysicalBow:true,
  siegeNativeG54Soldier3DBallistics:false,
  originalFFAAIChanged:false,originalG54GameplayChanged:false,
  originalG84Recovered:false,mainBranchMerged:false,
  productionApproved:false
 };
 writeFileSync(dest+'.build.json',JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({file:dest,manifest},null,2));
 return {html,manifest};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [dualFile,siegeFile,outFile]=process.argv.slice(2);
 build({dualFile,siegeFile,outFile});
}
