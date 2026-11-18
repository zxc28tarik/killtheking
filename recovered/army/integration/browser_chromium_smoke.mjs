/** Chromium software-WebGL smoke of the genuine shipped single-HTML launcher.
 * Not a hardware GPU / manual play / 30-minute performance acceptance.
 * This executes real DOM, Three.js rendering and browser pointer-lock requests.
 */
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const input=process.argv[2];
if(!input)throw Error('Usage: node browser_chromium_smoke.mjs COMBINED_HTML');
const reportDir=resolve(process.env.KTK_BROWSER_REPORT_DIR||'recovered/army/integration/browser-evidence');
mkdirSync(reportDir,{recursive:true});
const notes={kind:'CHROMIUM_SOFTWARE_WEBGL_SMOKE_NOT_REAL_GPU_APPROVAL',
  checks:[],pageErrors:[],consoleErrors:[],launcher:resolve(input),result:'RUNNING'};
const save=()=>writeFileSync(resolve(reportDir,'browser-smoke.json'),
  JSON.stringify(notes,null,2)+'\n');
let browser;
try{
 browser=await chromium.launch({headless:true,
  executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,args:[
   '--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl',
   '--no-sandbox','--disable-dev-shm-usage'
 ]});
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
 page.setDefaultTimeout(30000);
 page.on('pageerror',e=>notes.pageErrors.push(String(e.message||e)));
 page.on('console',m=>{if(m.type()==='error')notes.consoleErrors.push(m.text().slice(0,300));});
 page.on('dialog',d=>d.accept());
 await page.goto(pathToFileURL(resolve(input)).href,{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('[data-ktk-launch]').count(),2);
 notes.checks.push('Launcher shell and both mode choices loaded');
 const gameCanvas=async locator=>locator.evaluate(c=>{
   let context=null;
   try{context=c.getContext('webgl2')||c.getContext('webgl');}catch{}
   return {width:c.width,height:c.height,webgl:!!context,
      contextLost:context?context.isContextLost():null};
 });
 const waitGame=async (frame,label)=>{
   const canvas=frame.locator('#game-canvas');
   await canvas.waitFor({state:'attached',timeout:45000});
   await page.waitForTimeout(1200);
   const result=await gameCanvas(canvas);
   assert(result.width>=320&&result.height>=200,label+' invalid viewport '+JSON.stringify(result));
   assert(result.webgl&&!result.contextLost,label+' WebGL context missing/lost: '+JSON.stringify(result));
   notes.checks.push(label+' real WebGL canvas alive: '+JSON.stringify(result));
 };
 const enterFFA=async (map)=>{
   await page.locator('[data-ktk-launch="ffa"]').click();
   const ffa=page.frameLocator('#stage iframe');
   await ffa.locator('#play-btn').waitFor({state:'visible',timeout:45000});
   await waitGame(ffa,'FFA '+map);
   if(map==='meadow')await ffa.locator('[data-arena-map="meadow"]').click();
   await ffa.locator('#card-class-0').click();
   await ffa.locator('#play-btn').click();
   await page.waitForTimeout(10500);
   const diagnostic=await ffa.locator('body').evaluate(()=>({
      status:typeof window.krunkerArenaStatus==='function'?window.krunkerArenaStatus():null,
      perf:typeof window.krunkerPerformanceReport==='function'?window.krunkerPerformanceReport():null,
      pointerLocked:!!document.pointerLockElement,
      visibility:document.visibilityState,
      hudTimer:document.querySelector('#hud-timer')?.textContent,
      hudFps:document.querySelector('#hud-fps')?.textContent,
      startError:document.querySelector('#ktk-startup-error')?.textContent
   }));
   const status=diagnostic.status;
   notes.checks.push('FFA '+map+' post-click diagnostics: '+JSON.stringify({
      matchPhase:status?.matchPhase,remaining:status?.matchRemaining,
      duration:status?.matchDurationSeconds,botCount:status?.botCount,
      samples:status?.telemetry?.samples,pointerLocked:diagnostic.pointerLocked,
      visibility:diagnostic.visibility,hudTimer:diagnostic.hudTimer,
      hudFps:diagnostic.hudFps,startError:diagnostic.startError,
      perf:diagnostic.perf
   }).slice(0,1400));
   await page.screenshot({path:resolve(reportDir,'ffa-'+map+'.png'),fullPage:true});
   assert(status,'FFA game status unavailable after actual button click');
   assert.equal(status.matchPhase,'playing','FFA did not start/resume');
   assert.equal(status.map,map,'Wrong rendered FFA map selected');
   assert.equal(status.botCount,6,'FFA bot roster changed');
   assert(status.matchRemaining<status.matchDurationSeconds-2,
     'FFA game clock failed to progress after start');
   notes.checks.push('FFA '+map+' active: bots='+status.botCount+
     ', remaining='+status.matchRemaining+', player targets='+
     JSON.stringify(status.telemetry?.targetSlots||{}));
   return status;
 };
 await enterFFA('castle');
 await page.keyboard.press('Escape');
 await page.locator('[data-ktk-launch="army"]').click();
 const army=page.frameLocator('#stage iframe');
 await army.locator('#meadow-army-demo-btn').waitFor({state:'attached',timeout:45000});
 const armySelected=await army.locator('#meadow-army-demo-btn').getAttribute('aria-pressed');
 assert.equal(armySelected,'true','G5.4 army demo was not auto-selected');
 await waitGame(army,'G5.4 Army');
 notes.checks.push('G5.4 army demo auto-selection is active');
 const armyPlay=army.locator('#play-btn');
 assert(await armyPlay.count(),'G5.4 army start button not present');
 await armyPlay.click();
 await page.waitForTimeout(7000);
 const armySnapshot=await army.locator('body').evaluate(()=>{
   const c=document.querySelector('#game-canvas');
   return {canvasWidth:c?.width,canvasHeight:c?.height,
     menuHidden:document.getElementById('menu-overlay')?.classList.contains('hidden'),
     playButtonVisible:!!document.getElementById('play-btn')};
 });
 assert.equal(armySnapshot.menuHidden,true,'Army menu did not close on Start');
 notes.checks.push('Army start clicked and 3D scene active: '+JSON.stringify(armySnapshot));
 await page.screenshot({path:resolve(reportDir,'army-g54.png'),fullPage:true});
 await page.keyboard.press('Escape');
 await page.locator('[data-ktk-launch="ffa"]').click();
 assert.equal(await page.locator('#stage iframe').count(),1,'Old army scene survived mode switch');
 await page.frameLocator('#stage iframe').locator('#play-btn').waitFor({state:'visible'});
 notes.checks.push('Army -> FFA removed old iframe and loaded clean original menu');
 await enterFFA('meadow'); // Same-mode launcher click must not reset the new FFA menu.
 assert.equal(await page.locator('#stage iframe').count(),1);
 assert.equal(notes.pageErrors.length,0,
   'Uncaught browser JavaScript exceptions: '+notes.pageErrors.join(' | '));
 notes.result='PASS_HEADLESS_SOFTWARE_WEBGL_ONLY';
}catch(err){
 notes.result='FAIL';notes.failure=String(err?.stack||err);
 throw err;
}finally{
 save();
 if(browser)await browser.close();
 console.log(JSON.stringify({result:notes.result,checks:notes.checks,
   pageErrors:notes.pageErrors,consoleErrors:notes.consoleErrors.slice(0,10),
   failure:notes.failure||null},null,2));
}
