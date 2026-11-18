/** Kill the King - Windows ONLY, *headed* GPU + physical ESC + 240s QA.
 * This is a human-observed measurement, NEVER an automatic publish approval.
 * Usage: node windows_gpu_acceptance.mjs file.html --browser=edge
 *  [--max-wall-minutes=15] [--skip-manual-escape]
 *
 * The normal FFA, player input, WebGL rendering and original AI are untouched:
 * NO updateGame fast-forward, actor teleports, AI overrides or shader flags.
 */
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assessAcceptance} from './windows_acceptance_rules.mjs';

const args=process.argv.slice(2);
const htmlArg=args.find(a=>!a.startsWith('--'));
if(!htmlArg)throw Error('Usage: node windows_gpu_acceptance.mjs <combined HTML> --browser=edge|chrome [--max-wall-minutes=15] [--skip-manual-escape]');
const option=(name,def)=>args.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3)??def;
const browserName=option('browser','edge');
if(!['edge','chrome'].includes(browserName))throw Error('Supported browsers: edge or chrome');
const maxWallMinutes=Number(option('max-wall-minutes','15'));
if(!Number.isFinite(maxWallMinutes)||maxWallMinutes<5||maxWallMinutes>90)
  throw Error('max-wall-minutes must be 5 to 90');
const skipEsc=args.includes('--skip-manual-escape');
const html=resolve(htmlArg);
if(!existsSync(html))throw Error('Built combined HTML missing: '+html);
if(process.platform!=='win32')
  throw Error('Physical Windows acceptance must run on Windows, not a CI Linux GPU emulator.');
// Import browser machinery only AFTER the physical-platform gate: CI can
// prove Linux is rejected without installing a browser or Playwright.
const {chromium}=await import('playwright');
const output=resolve(process.env.KTK_WINDOWS_ACCEPTANCE_OUTPUT||
  'recovered/army/integration/windows-acceptance-evidence');
mkdirSync(output,{recursive:true});
const report={
  schema:'killtheking-windows-hardware-acceptance-v1',
  observedAt:new Date().toISOString(),browser:browserName,
  sourceHtml:html,runType:'HEADED_REAL_RAF_4_MIN_GAME_240S',
  escapeMethod:skipEsc?'NOT_TESTED':'PHYSICAL_HUMAN_ESC_REQUIRED',
  renderer:{},manualEscape:{nativeReleased:null,phaseAfter:null},
  samples:[],end:{},errors:[],result:'INCOMPLETE',
  ruleAssessment:null
};
const save=()=>{
  report.ruleAssessment=assessAcceptance({
    renderer:report.renderer,manualEscape:report.manualEscape,
    samples:report.samples,end:report.end,errors:report.errors});
  writeFileSync(resolve(output,'windows-gpu-acceptance.json'),
    JSON.stringify(report,null,2)+'\n');
  const a=report.ruleAssessment;
  const lines=[
    '# Kill the King — Windows cihazında gerçek GPU / Escape / FFA kabul ölçümü',
    '',
    '**Önemli:** Sonuçlar yayın veya PR birleştirme izni değildir. Kullanıcı onayı gereklidir.',
    '',
    '- Çalışma: '+report.result,
    '- Tarayıcı: '+browserName+' (Windows, headed, gerçek RAF; yazılımsal SwiftShader zorlanmadı)',
    '- GPU kanıtı: '+a.gpu.kind+' — '+a.gpu.reason,
    '- Kaydedilen GPU: '+a.gpu.details,
    '- Fiziksel Escape ve duraklama: '+(a.checks.nativeManualEscapeAndPause?'PASS':'OPEN / FAIL'),
    '- Fiziksel fare ile kamera dönüşü: '+(a.checks.physicalMouseCameraMovement?'PASS':'OPEN / FAIL'),
    '- Oyun JavaScript çalışma hataları: '+(a.checks.noRuntimeJavaScriptErrors?'0 / PASS':'ERROR / OPEN'),
    '- 240 oyun saniyesi ve 7 satırlı sonuç: '+(a.checks.complete240GameSeconds?'PASS':'OPEN / FAIL'),
    '- Kesintisiz oturum: '+(a.checks.continuousObservedRun?'PASS':'OPEN / FAIL'),
    '- Ortalama gözlenen FPS (örneklenmiş): '+a.frames.averageObservedFPS,
    '- En düşük gözlenen FPS: '+a.frames.minimumObservedFPS,
    '- Gözlenen en düşük %1 düşük FPS: '+a.frames.minimumObservedOnePercentLowFPS,
    '- En yüksek ölçülen p95 kare süresi (ms): '+a.frames.maximumObservedP95FrameMs,
    '- İlan edilen toplam test süresi, saniye: '+(report.end.elapsedWallSeconds??'unknown'),
    '- Son değerlendirme: '+a.finalDisposition,
    '- Performans yayın sınırı: '+a.performanceApproval,
    '- Yayın onayı: '+a.publicationApproval,
    '',
    'Bu rapor test yapılan cihazda oluşturulmuştur. Oyun kodu, harita, botlar, silah dengesi ve tarihî kaynak değiştirilmedi.',
    'Herhangi bir sır/parola/çerez raporlanmaz. Ek veriler windows-gpu-acceptance.json dosyasındadır.'
  ];
  writeFileSync(resolve(output,'windows-gpu-acceptance.md'),lines.join('\n')+'\n');
};
let browser;
const wallStart=Date.now();
try{
 console.log('Kill the King: fiziksel Windows + headed '+browserName+' testini başlatıyorum.');
 browser=await chromium.launch({channel:browserName==='edge'?'msedge':'chrome',
   headless:false,args:['--enable-webgl']});
 const context=await browser.newContext({
   viewport:{width:1280,height:800},deviceScaleFactor:1});
 const page=await context.newPage();
 page.setDefaultTimeout(45000);
 page.on('pageerror',e=>report.errors.push('PAGE '+String(e)));
 page.on('console',m=>{
   if(m.type()==='error')report.errors.push('CONSOLE '+m.text().slice(0,350));
 });
 const cdp=await browser.newBrowserCDPSession();
 try{
   const gpu=await cdp.send('SystemInfo.getInfo');
   report.renderer.gpuDevices=(gpu.gpu?.devices||[]).map(d=>({
     vendorString:d.vendorString||'',deviceString:d.deviceString||'',
     driverVendor:d.driverVendor||'',driverVersion:d.driverVersion||''}));
   report.renderer.featureStatus=gpu.gpu?.featureStatus||{};
 }catch(error){
   report.errors.push('GPU CDP system-info unavailable: '+String(error));
 }
 await page.goto(pathToFileURL(html).href,{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('[data-ktk-launch]').count(),2,
   'The candidate must contain FFA AND G5.4 modes');
 await page.locator('[data-ktk-launch="ffa"]').click();
 const f=page.frameLocator('#stage iframe');
 await f.locator('#play-btn').waitFor({state:'visible'});
 await f.locator('#card-class-0').click();
 await f.locator('#play-btn').click();
 const state=()=>f.locator('body').evaluate(()=>{
   const st=window.krunkerArenaStatus();
   const c=document.getElementById('game-canvas');
   const gl=c.getContext('webgl2')||c.getContext('webgl');
   const dbg=gl?.getExtension('WEBGL_debug_renderer_info');
   const perf=window.krunkerPerformanceReport();
   const p=window.eval('player');
   return {
     phase:st.matchPhase,map:st.map,remaining:st.matchRemaining,
     durationSeconds:st.matchDurationSeconds,
     pointerLocked:document.pointerLockElement===c,
     menuHidden:document.getElementById('menu-overlay')?.classList.contains('hidden'),
     yaw:p.yaw,pitch:p.pitch,hp:p.hp,playerDeaths:p.deaths,
     botCount:st.botCount,telemetry:st.telemetry,
     performance:perf,
     webgl:{
       renderer:gl?.getParameter(gl.RENDERER)||null,
       vendor:gl?.getParameter(gl.VENDOR)||null,
       unmaskedRenderer:dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):null,
       unmaskedVendor:dbg?gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL):null,
       contextLost:gl?.isContextLost()??true
     },
     scoreboardRows:document.getElementById('match-results-table')?.children.length,
     resultsVisible:!document.getElementById('match-results-overlay')?.classList.contains('hidden'),
     winningId:st.matchResults?.winnerId||null
   };
 });
 let started=await state();
 assert.equal(started.phase,'playing','Cannot start live FFA in real Windows browser');
 assert.equal(started.map,'castle','Expected original castle');
 assert.equal(started.botCount,6,'Original six-bot FFA missing');
 assert.equal(started.durationSeconds,240,'This approval requires default 240-second FFA');
 assert.equal(started.webgl.contextLost,false,'WebGL context unavailable');
 report.renderer.webglRenderer=started.webgl.renderer;
 report.renderer.webglUnmasked=started.webgl.unmaskedRenderer;
 report.renderer.webglVendor=started.webgl.unmaskedVendor||started.webgl.vendor;
 report.initial=started;
 save();
 console.log('\nTarayıcıda oynanabilir kale açıldı.');
 console.log('GPU bilgisi: '+(report.renderer.webglUnmasked||'Gizli / okunamadı'));
 if(!skipEsc){
   console.log('\nMANUEL ADIM: Chrome/Edge oyun penceresinde fareyi hareket ettir ve');
   console.log('klavyede GERÇEK Escape tuşuna BAS. Script ESC göndermiyor.');
   console.log('45 saniyede pointer lock + oyun pause tespit edilirse kayıt başarılı.');
   const beginning={yaw:started.yaw,pitch:started.pitch};
   const escStart=Date.now();
   let released=false;
   while(Date.now()-escStart<45000){
     await page.waitForTimeout(500);
     const now=await state();
     if(!now.pointerLocked&&now.phase==='paused'){
       released=true;
       report.manualEscape={
         nativeReleased:true,phaseAfter:'paused',elapsedSeconds:(Date.now()-escStart)/1000,
         playerMovedCamera:
           Math.abs(now.yaw-beginning.y)>1e-4||
           Math.abs(now.pitch-beginning.pitch)>1e-4};
       break;
     }
     // An observed pointer unlock without pause is an actual pause gate failure.
     if(!now.pointerLocked&&now.phase!=='playing'){
       report.manualEscape={nativeReleased:false,phaseAfter:now.phase,
         reason:'Pointer unlock did not produce paused state'};
       break;
     }
   }
   if(!released){
     if(report.manualEscape.nativeReleased===null)report.manualEscape={
       nativeReleased:false,phaseAfter:(await state()).phase,
       reason:'Physical ESC+pause not observed in 45 seconds'};
     // The test cannot legitimately assert human ESC passed. Restore using
     // the standard browser API ONLY to allow independent FPS collection.
     const now=await state();
     if(now.pointerLocked){
       await f.locator('body').evaluate(async()=>{
         if(document.pointerLockElement)await document.exitPointerLock();
       });
       await page.waitForTimeout(600);
     }
     report.errors.push('Physical Escape did not pass; fallback exitPointerLock was test-only');
     console.log('Escape insan tuşu doğrulanamadı. OPEN olarak kaydedildi.');
   }else{
     console.log('GERÇEK ESC + PAUSE doğrulandı.');
   }
   // An ordinary Play button click resumes; no direct ArenaMatch.resume().
   const paused=await state();
   if(paused.phase==='paused'){
     await f.locator('#play-btn').click();
     await page.waitForTimeout(800);
   }
   const resumed=await state();
   assert.equal(resumed.phase,'playing','UI Resume failed after physical ESC test');
 }else{
   report.manualEscape={nativeReleased:false,phaseAfter:'NOT_TESTED',
     reason:'Explicit --skip-manual-escape option'};
   console.log('Escape atlandı: bu kontrol OPEN kalır.');
 }
 console.log('\n4 DAKİKALIK OYUN: Normal hızda oynayabilirsin.');
 console.log('Bu test 240 OYUN saniyesini ölçer; render yavaşsa gerçek süre uzar.');
 console.log('Tarayıcıyı kapatma, arka plana alma; otomatik hızlandırma yok.');
 const frameStart=Date.now();
 const deadline=frameStart+maxWallMinutes*60000;
 let latest=await state();
 while(Date.now()<deadline){
   await page.waitForTimeout(5000);
   latest=await state();
   report.samples.push({
     atGameSeconds:latest.durationSeconds-latest.remaining,
     atWallSeconds:(Date.now()-frameStart)/1000,
     phase:latest.phase,performance:latest.performance,
     webgl:{contextLost:latest.webgl.contextLost},
     remaining:latest.remaining,playerDeaths:latest.playerDeaths,
     botKills:latest.telemetry?.kills||{},targetCounts:latest.telemetry?.targetSlots||{}
   });
   save();
   const fps=latest.performance?.averageFPS;
   console.log('Oyun zamanı '+Math.floor(240-latest.remaining)+
     '/240 saniye; FPS ~'+(Number.isFinite(fps)?fps.toFixed(1):'ölçülemedi')+
     ', oyun durumu: '+latest.phase);
   if(latest.phase==='results')break;
   if(latest.phase!=='playing'){
     report.errors.push('Natural match was interrupted: '+latest.phase);
     break;
   }
   if(latest.webgl.contextLost){
     report.errors.push('WebGL context lost');
     break;
   }
 }
 latest=await state();
 report.end={
   phase:latest.phase,remaining:latest.remaining,
   durationSeconds:latest.durationSeconds,
   scoreboardRows:latest.scoreboardRows,
   resultsVisible:latest.resultsVisible,
   winnerId:latest.winningId,
   playerDeaths:latest.playerDeaths,
   gameSecondsAdvanced:240-latest.remaining,
   elapsedWallSeconds:(Date.now()-frameStart)/1000,
   gpuRenderer:latest.webgl.unmaskedRenderer||latest.webgl.renderer
 };
 try{await page.screenshot({path:resolve(output,'windows-final.png'),fullPage:true});}
 catch(e){report.errors.push('Final screenshot unavailable: '+String(e));}
 report.result='MEASURED_NOT_PUBLISHED';
 save();
 console.log('\nRapor: '+resolve(output,'windows-gpu-acceptance.md'));
 console.log('JSON: '+resolve(output,'windows-gpu-acceptance.json'));
 console.log('Karar: '+report.ruleAssessment.finalDisposition);
 if(report.errors.length)console.log('Uyarılar: '+report.errors.join(' | '));
} catch(e){
 report.result='FAILED_OR_INCOMPLETE';
 report.errors.push(String(e?.stack||e));
 save();
 throw e;
} finally {
 report.totalElapsedWallSeconds=(Date.now()-wallStart)/1000;
 save();
 if(browser)await browser.close();
}
