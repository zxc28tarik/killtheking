/**
 * Phase 1 isolated browser launcher: original Oct A5 FFA (byte-identical)
 * alongside G5.4 army (only the ArenaArmyBattle module replaced by the
 * separately tested 2D contact + real-team-ownership engine).
 *
 * This is a MODE ROUTER, not a merged simulation or a G8.4 restoration.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {patchFfaAggro,patchArmyAggro} from './player_target_hotfix.mjs';

const dir=dirname(fileURLToPath(import.meta.url));
const archive=resolve(dir,'../KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html');
const armyEnginePath=resolve(dir,'../mirror/arena-army-battle-true-side-swap.js');
const checksums={
 ffa:'18dca2a895763f0955566f2fc90651f1ab1a98f86597e399cbac42ac2fc6f15a',
 armySource:'1d5f72768054b4138ba742e10923bfb20c00bd37fe789cdc3e40a65967cccfe2',
 engine:'307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841'
};
const sha=text=>createHash('sha256').update(text).digest('hex');
const scripts=text=>[...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];

export function assembleArmies(raw,engine){
 if(sha(raw)!==checksums.armySource||sha(engine)!==checksums.engine)
  throw Error('Source provenance mismatch: never silently replace game');
 const engineMatches=scripts(raw).filter(m=>m[1].includes('root.ArenaArmyBattle=api'));
 if(engineMatches.length!==1||scripts(raw).length!==29||engineMatches[0][1].length!==148663)
  throw Error('Not the historically recovered G5.4 full arena/army source');
 const hotfixedEngine=patchArmyAggro(engine);
 if(hotfixedEngine.includes('</script'))throw Error('Unsafe engine close tag');
 const found=engineMatches[0],opening=found[0].slice(0,found[0].indexOf('>')+1);
 const tail=found[0].slice(found[0].lastIndexOf('</script'));
 let source=raw.slice(0,found.index)+opening+hotfixedEngine+tail+raw.slice(found.index+found[0].length);
 // Default to the historical G5.4 army selection in its own isolated frame.
 // The demo menu is already implemented in the original game source.
 const startup='<script id="ktk-g54-autoselect-army">window.addEventListener("DOMContentLoaded",function(){var b=document.getElementById("meadow-army-demo-btn");if(b&&b.getAttribute("aria-pressed")!=="true")b.click();});</script>';
 if(!source.includes('</body>')||source.includes('ktk-g54-autoselect-army'))
  throw Error('Unexpected G5.4 HTML body');
 source=source.replace('</body>',startup+'\n</body>');
 return {html:source,originalModule:found[1],engineModule:hotfixedEngine};
}

export function createLauncher(ffa,army){
 if(sha(ffa)!==checksums.ffa)throw Error('Original A5 FFA is not byte-identical');
 const ffaWithHotfix=patchFfaAggro(ffa);
 const encodedFFA=Buffer.from(ffaWithHotfix,'utf8').toString('base64');
 const encodedArmy=Buffer.from(army,'utf8').toString('base64');
 const header=[
 '<!doctype html><html lang="tr"><head><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1">',
 '<title>Kill the King — Arena ve Ordu Savaşı • İzole Entegrasyon Adayı</title>',
 '<style>',
 '*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#0b1220;color:#f8fafc;font:15px system-ui,Segoe UI,Arial,sans-serif}',
 'body{display:flex;flex-direction:column;overflow:hidden}',
 '#shell{display:flex;align-items:center;gap:12px;padding:10px 15px;background:#142035;border-bottom:1px solid #344562;z-index:5;min-height:67px}',
 '.mark{display:flex;flex-direction:column;min-width:160px}.mark strong{font-size:17px;letter-spacing:1px}.mark small{color:#9fb1cb;font-size:11px}',
 'button{font:inherit;cursor:pointer}#nav{display:flex;gap:8px;flex-wrap:wrap;flex:1}',
 '.pick{border:1px solid #526581;background:#202f47;color:#f8fafc;font-weight:700;border-radius:8px;padding:11px 14px}',
 '.pick:hover,.pick:focus-visible{border-color:#e7ad4b;outline-color:#e7ad4b}.pick.active{background:#a66a17;color:#fff;border-color:#fbbf24}',
 '#meta{color:#b5c3d7;font-size:12px;max-width:270px}',
 '#intro{flex:1;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto}',
 '#intro article{max-width:750px;padding:28px;border-radius:18px;border:1px solid #354764;background:#131f33}',
 '#intro h1{margin:0 0 14px;font-size:clamp(24px,4vw,35px)}#intro p{color:#cad5e8;line-height:1.6}',
 '.facts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:23px 0}.facts section{border:1px solid #3c516e;border-radius:10px;padding:13px}',
 '.facts strong{display:block;margin-bottom:6px}.facts span{font-size:13px;color:#b9cae0;line-height:1.5}',
 '#stage{display:none;flex:1;min-height:0}#stage iframe{width:100%;height:100%;display:block;border:0;background:#0a101e}',
 '#notice{display:none;background:#1a2940;border-top:1px solid #344562;padding:5px 14px;color:#ced9e9;font-size:11px}',
 '@media(max-width:760px){#shell{align-items:flex-start;flex-wrap:wrap}.mark{min-width:140px}#meta{max-width:unset;width:100%}.facts{grid-template-columns:1fr}}',
 '</style></head><body>',
 '<header id="shell"><div class="mark"><strong>KILL THE KING</strong><small>BOT HEDEFLEME DÜZELTMESİ • ADAY</small></div>',
 '<nav id="nav" aria-label="Oyun modu seçimi">',
 '<button type="button" class="pick" data-ktk-launch="ffa">⚔ SERBEST ARENA / TDM</button>',
 '<button type="button" class="pick" data-ktk-launch="army">🛡 140 ASKERLİ ORDU SAVAŞI</button>',
 '</nav><div id="meta" aria-live="polite">Bir mod seç. Mod değişimi oyunu yeniden başlatır.</div></header>',
 '<main id="intro"><article><h1>İki oyun modu, ayrı çalışma ortamları</h1>',
 '<p>Bu aday, Ekim 2026 tarihli kabul edilmiş FFA oyununun özgün sürümünü arşivler; FFA hedef seçimine sınırlı düzeltme uygular. G5.4 ordu savaşı ayrı bir oyun penceresinde açılır; geçişte önceki oyun kapatılır. Her iki oyun aynı çevrimdışı HTML içindedir.</p>',
 '<div class="facts"><section><strong>Serbest Arena / TDM</strong><span>Orijinal kale, 20× çimenlik meydan, dört sınıf, FFA ve takım savaşı. Ekim FFA görselleri korunur; bot hedef seçimi düzeltildi. Arena BOT okçusu 0,5 saniyede atışa hazırlanır; oyuncunun normal okçusunda 2 saniye asgari/3 saniye tam germe korunur. Ok sınırı 4 saniye/atış ve atış sonrası toparlanma 1 saniyedir.</span></section>',
 '<section><strong>G5.4 Ordu Savaşı</strong><span>70’e 70 asker, komuta ve formasyonlar. Kaynak G5.4; temas kurtarma ve oyuncuyu hedefleme düzeltmesi bulunan G5.4 ordu motoru kullanılır. Bu sürümde oyuncu tarafı mavi.</span></section></div>',
 '<p><strong>Bu henüz son birleşik oyun değildir.</strong> Modlar ayrı çalışır; paylaşılan ilerleme/kayıt sistemi, G8.4 senaryoları ve gerçek GPU kabulü daha sonra yapılacaktır. Moddan çıkmadan önce ESC ile fare kilidini bırak.</p>',
 '</article></main><div id="stage" aria-label="Oyun çalışma alanı"></div>',
 '<footer id="notice">Oyun içinde ESC ile fareyi serbest bırak. Üst menüden diğer moda geçerken mevcut maç sıfırlanır.</footer>',
 '<script type="application/octet-stream" id="ktk-source-ffa">'
 ].join('\n');
 const between='</script>\n<script type="application/octet-stream" id="ktk-source-army">\n';
 const foot=[
 '</script><script>',
 '(function(){',
 '"use strict";',
 'const stage=document.getElementById("stage"),intro=document.getElementById("intro");',
 'const info=document.getElementById("meta"),notice=document.getElementById("notice");',
 'let current=null;',
 'function decode(id){const body=document.getElementById(id).textContent.trim();',
 'const bytes=Uint8Array.from(atob(body),function(c){return c.charCodeAt(0)});',
 'return new TextDecoder("utf-8",{fatal:true}).decode(bytes);}',
 'function launch(mode){if(!["ffa","army"].includes(mode))return;',
 'if(current===mode)return;',
 'if(current&&!window.confirm("Mevcut maç kapanacak. Diğer moda geçilsin mi?"))return;',
 'current=mode;stage.replaceChildren();',
 'const frame=document.createElement("iframe");frame.title=mode==="ffa"?"Kill the King Serbest Arena":"Kill the King G5.4 Ordu Savaşı";',
 'frame.setAttribute("allow","fullscreen; autoplay");frame.setAttribute("allowfullscreen","");',
 'stage.appendChild(frame);frame.srcdoc=decode("ktk-source-"+mode);',
 'intro.style.display="none";stage.style.display="block";notice.style.display="block";',
 'document.querySelectorAll("[data-ktk-launch]").forEach(function(b){const selected=b.dataset.ktkLaunch===mode;',
 'b.classList.toggle("active",selected);b.setAttribute("aria-pressed",String(selected));});',
 'info.textContent=mode==="ffa"?"FFA / TDM • Oyuncu da hedeflenir":"G5.4 • 70 mavi + 70 kırmızı • oyuncu hedefleme düzeltmesi";}',
 'document.querySelectorAll("[data-ktk-launch]").forEach(function(b){b.addEventListener("click",function(){launch(b.dataset.ktkLaunch)});});',
 '})();',
 '</script></body></html>'
 ].join('\n');
 return header+encodedFFA+'\n'+between+encodedArmy+'\n'+foot;
}

export function build(ffaFile,outFile){
 const ffa=readFileSync(ffaFile,'utf8');
 const raw=readFileSync(archive,'utf8');
 const engine=readFileSync(armyEnginePath,'utf8');
 const army=assembleArmies(raw,engine);
 const result=createLauncher(ffa,army.html);
 if(!result.includes('ktk-source-ffa')||!result.includes('ktk-source-army'))
  throw Error('Launcher sources missing');
 const dest=resolve(outFile);
 mkdirSync(dirname(dest),{recursive:true});
 writeFileSync(dest,result,'utf8');
 const manifest={
  kind:'isolated-ffa-army-phase1-not-release',engineOriginal:'G5.4',ffaOriginal:'2026-10-18',
  sources:checksums,ffaHotfixedSHA256:sha(patchFfaAggro(ffa)),
  armyEngineHotfixedSHA256:sha(army.engineModule),armyPatchedSHA256:sha(army.html),launcherSHA256:sha(result),
  ffaBytes:Buffer.byteLength(ffa),armyBytes:Buffer.byteLength(army.html),
  launcherBytes:Buffer.byteLength(result),modes:['ffa','army'],
  originalFfaRecoverable:true,ffaTargetingChanged:true,armyTargetingChanged:true,
  originalGraphicsAndWeaponsUnchanged:false,ffaArcherDrawChanged:true,
  ffaPlayerBowUnchanged:true,ffaArenaBotArcherWindupSeconds:.5,
  strictSharedSimulation:false,realGPUAccepted:false,g84Restored:false,
  approval:'CANDIDATE_NOT_APPROVED'
 };
 writeFileSync(dest+'.build.json',JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify(manifest,null,2));
 return {manifest,result,army,ffa};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.argv[2]||!process.argv[3])
  throw Error('Usage: node build_isolated_launcher.mjs EXACT_A5_FFA_HTML OUT_STANDALONE_HTML');
 build(resolve(process.argv[2]),resolve(process.argv[3]));
}
