/** Actual Chromium/SwiftShader 3-MODE Kill the King ONE HTML acceptance.
 * Tests the genuine graphical FFA, native 140-soldier G5.4 Army, native
 * 140-soldier S3D1 Siege, and mode destruction/reinitialization.
 *
 * No hardware GPU acceptance, shared renderer/physics or final publish.
 */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const f=process.argv[2];
if(!f)throw Error('Expected exact standalone KillTheKing 3 Modes HTML');
const dir=resolve(process.env.KTK_THREE_BROWSER_DIR||
 'recovered/army/integration/browser-evidence-three');
mkdirSync(dir,{recursive:true});
const report={
 kind:'THREE_MODES_ONE_OFFLINE_HTML_ACTUAL_CHROMIUM_SWIFTSHADER',
 strictSharedRenderer:false,originalFFAMovementSharedWithSiege:false,
 finalGamePublished:false,realHardwareGPUAccepted:false,
 checks:[],pageErrors:[],consoleErrors:[],result:'RUNNING'
};
const html=readFileSync(resolve(f),'utf8');
let browser=null;
try{
 assert(html.includes('data-ktk-launch="siege"'));
 browser=await chromium.launch({headless:true,
  executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader',
   '--enable-webgl','--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1350,height:850}});
 page.setDefaultTimeout(85000);
 page.on('pageerror',e=>report.pageErrors.push(String(e?.stack||e)));
 page.on('console',m=>{if(m.type()==='error')
  report.consoleErrors.push(m.text().slice(0,650));});
 page.on('dialog',d=>d.accept());
 await page.goto(pathToFileURL(resolve(f)).href,{waitUntil:'domcontentloaded'});
 const buttons=page.locator('[data-ktk-launch]');
 assert.equal(await buttons.count(),3,'Main game must have EXACTLY THREE modes');
 assert.equal(await page.locator('#stage iframe').count(),0);
 assert.match(await page.locator('#intro h1').textContent(),/3 Oyun Modu/);
 report.checks.push('PASS_MAIN_GAME_BOOT_THREE_CHOICES_ONE_HTML');
 const active=()=>page.locator('#stage iframe');
 const child=()=>page.frameLocator('#stage iframe');
 // Historical FFA pointer lock can swallow the FIRST Chrome headless click.
 // ESC should release it on real hardware; software WebGL sometimes needs
 // the same test-only fallback as the existing two-mode browser suite.
 const switchMode=async(mode)=>{
   await page.keyboard.press('Escape');
   await page.waitForTimeout(360);
   const locked=await page.evaluate(()=>!!document.querySelector('#stage iframe')
     ?.contentDocument?.pointerLockElement);
   if(locked){
     report.checks.push('HEADLESS_POINTERLOCK_FALLBACK_BEFORE_'+mode+
       ': manual ESC still requires hardware acceptance');
     await page.evaluate(async()=>document.querySelector('#stage iframe')
       ?.contentDocument?.exitPointerLock?.());
     await page.waitForTimeout(340);
   }
   for(let attempt=1;attempt<=2;attempt++){
     await page.locator('[data-ktk-launch="'+mode+'"]').click();
     await page.waitForTimeout(380);
     if(await page.locator('[data-ktk-launch="'+mode+'"]')
       .getAttribute('aria-pressed')==='true')return;
     report.checks.push('MODE_'+mode+'_FIRST_CLICK_ABSORBED_RETRY_'+attempt);
     await page.keyboard.press('Escape');
     await page.waitForTimeout(330);
   }
   throw Error('Real browser did not activate mode '+mode);
 };
 const checkCanvas=async()=>{
  const screen=child().locator('#game-canvas');
  await screen.waitFor({state:'attached',timeout:85000});
  const size=await screen.evaluate(el=>({
   width:el.width,height:el.height,
   webgl:!!(el.getContext('webgl')||el.getContext('webgl2'))
  }));
  assert(size.width>320&&size.height>180&&size.webgl);
  return size;
 };
 await switchMode('ffa');
 const ffa=await checkCanvas();
 await child().locator('#card-class-0').click();
 await child().locator('#play-btn').click();
 await page.waitForFunction(()=>{
  const iframe=document.querySelector('#stage iframe');
  return iframe?.contentWindow?.krunkerArenaStatus?.()?.matchPhase==='playing';
 },{timeout:85000});
 const ffaState=await page.evaluate(()=>document.querySelector('#stage iframe')
  ?.contentWindow?.krunkerArenaStatus?.());
 assert.equal(ffaState.botCount,6);
 report.checks.push('PASS_ORIGINAL_FFA_NATIVE_CHROMIUM_GAME_RUNNING: '+
  JSON.stringify({botCount:ffaState.botCount,canvas:ffa}));
 await page.screenshot({path:resolve(dir,'three-main-mode-1-ffa.png'),fullPage:true});
 await switchMode('army');
 const army=await checkCanvas();
 assert.equal(await child().locator('#meadow-army-demo-btn').getAttribute('aria-pressed'),'true');
 report.checks.push('PASS_ORIGINAL_140_ARMY_CHROMIUM_MODE_STILL_PLAYABLE: '+
  JSON.stringify(army));
 await page.screenshot({path:resolve(dir,'three-main-mode-2-army.png'),fullPage:true});
 await switchMode('siege');
 await page.waitForFunction(()=>{
  const w=document.querySelector('#stage iframe')?.contentWindow;
  return !!w?.ktkSiegeArmyStatus?.()&&
   !!w?.ktkSiegePlayerCombatStatus?.()&&
   !!w?.ktkSiegePreviewStatus?.()?.sceneWebGL;
 },{timeout:85000});
 const siege=await page.evaluate(()=>{
  const w=document.querySelector('#stage iframe').contentWindow;
  return {army:w.ktkSiegeArmyStatus(),
    player:w.ktkSiegePlayerCombatStatus(),
    scene:w.ktkSiegePreviewStatus()};
 });
 assert.equal(siege.army.authentic140Soldiers,140);
 assert.equal(siege.army.realSquads.length,8);
 // S3V1: native G5.4 soldier IDs must drive the visible, role-specific
 // 1600s meshes. Static S1 cylinders must not be the rendered army.
 assert.equal(siege.army.roleCharacterVisuals?.renderedActorSlots,140);
 assert.equal(siege.army.roleCharacterVisuals?.roleModels,4);
 assert(siege.army.roleCharacterVisuals.instancedPartDrawCalls>=100);
 assert.equal(siege.army.roleCharacterVisuals.nativePhysicsOrDamageChanged,false);
 report.checks.push('PASS_THIRD_SIEGE_140_NATIVE_ROLE_MESHES_INSTANCED: '+
  JSON.stringify(siege.army.roleCharacterVisuals));
 assert.equal(siege.player.playerHealth,100);
 assert.equal(siege.army.realObjectiveCaptureConnected,true);
 assert.equal(siege.player.actualG54NativeDamageAndPlayerHealth,true);
 assert.equal(siege.scene.liveCombatViewConnected,true);
 report.checks.push('PASS_THIRD_SIEGE_REAL_140_AI_GATE_LADDERS_KEEP_100HP_3D: '+
  JSON.stringify({actors:siege.army.authentic140Soldiers,
   playerHealth:siege.player.playerHealth,
   phase:siege.army.scenario.phase,
   real3D:siege.scene.sceneWebGL}));
 for(const k of ['gate','west','east','court','court-contest',
  'keep','keep-contest','wipe'])
  assert.equal(await child().locator('[data-siege="'+k+'"]').isDisabled(),true);
 await child().locator('#siege-fps').click();
 await page.waitForFunction(()=>document.querySelector('#stage iframe')
  ?.contentWindow?.ktkSiegePlayerCombatStatus?.()?.playerActive,{timeout:85000});
 const activePlayer=await page.evaluate(()=>document.querySelector('#stage iframe')
  .contentWindow.ktkSiegePlayerCombatStatus());
 assert.equal(activePlayer.view,'fps');
 assert.equal(activePlayer.playerHealth,100);
 report.checks.push('PASS_THIRD_MODE_ACTUAL_FPS_HUMAN_AND_NO_FAKE_VICTORY_BUTTONS');
 await page.screenshot({path:resolve(dir,'three-main-mode-3-siege.png'),fullPage:true});
 await switchMode('ffa');
 const restored=await checkCanvas();
 assert.equal(await active().count(),1);
 report.checks.push('PASS_SIEGE_TO_FFA_RETURN_CLEANS_UP_IFRAME: '+
  JSON.stringify(restored));
 assert.deepEqual(report.pageErrors,[]);
 assert.deepEqual(report.consoleErrors,[]);
 report.result='PASS_THREE_MODES_ONE_OFFLINE_HTML_CHROMIUM_SOURCE_ISOLATED';
}catch(e){report.result='FAIL';report.failure=String(e?.stack||e);throw e;}
finally{
 writeFileSync(resolve(dir,'three-mode-browser-report.json'),
  JSON.stringify(report,null,2)+'\n');
 if(browser)await browser.close();
 console.log(JSON.stringify(report,null,2));
}
