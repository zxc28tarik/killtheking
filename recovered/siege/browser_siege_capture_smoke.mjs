/** Real Chromium 3D candidate: original 140 G5.4 army, ground zone
 * capture bridge and live result HUD. Does NOT claim a 240s Chromium battle
 * or native 3D shooting ballistics; extended natural simulation is Node CI.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const path=process.argv[2];
if(!path)throw Error('Expected S3C3 140-soldier castle HTML path');
const folder=resolve(process.env.KTK_S3C3_REPORT_DIR||
 'recovered/siege/browser-evidence-s3c3');
mkdirSync(folder,{recursive:true});
const report={
 kind:'S3C3_REAL_G54_COURTYARD_KEEP_CHROMIUM_SWIFTSHADER',
 physicalGPUAccepted:false,fullGameFPSCombatConnected:false,
 fullS3C3NaturalMatchInBrowser:false,
 checks:[],pageErrors:[],consoleErrors:[],result:'RUNNING'
};
let browser;
try{
 browser=await chromium.launch({headless:true,
  executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader',
   '--enable-webgl','--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1260,height:830}});
 page.setDefaultTimeout(85000);
 page.on('pageerror',e=>report.pageErrors.push(String(e?.stack||e)));
 page.on('console',m=>{if(m.type()==='error')
   report.consoleErrors.push(m.text().slice(0,850));});
 await page.goto(pathToFileURL(resolve(path)).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(
  window.ktkSiegeArmyStatus?.()&&window.ktkSiegePreviewStatus?.()?.sceneWebGL),
  {timeout:85000});
 const army=()=>page.evaluate(()=>window.ktkSiegeArmyStatus());
 const preview=()=>page.evaluate(()=>window.ktkSiegePreviewStatus());
 const a=await army(),p=await preview();
 assert.equal(p.sceneWebGL,true);
 assert.equal(a.authentic140Soldiers,140);
 assert.equal(a.renderedRealSoldierCount,140);
 assert.equal(a.realSquads.length,8);
 assert.equal(a.realObjectiveCaptureConnected,true);
 assert.equal(a.genuineCaptureAndMatchResultEnabled,true);
 assert.equal(a.realLadderClimbConnected,true);
 assert.equal(a.realStructureDamageConnected,true);
 assert.equal(a.realObjectiveCaptureNavigation.forgeVictoryOrCasualties,false);
 assert.equal(a.realObjectiveCaptureNavigation.realHPAndCombatFromOriginalG54,true);
 assert.equal(a.scenario.phase,'APPROACH');
 assert.equal(a.scenario.winner,null);
 assert.equal(a.scenario.capture.courtyard,0);
 assert.equal(a.scenario.capture.keep,0);
 report.checks.push('PASS_S3C3_AUTHENTIC_140_G54_REAL_WALL_AND_CAPTURE_ENGINE');
 for(const key of ['gate','west','east','court','court-contest',
  'keep','keep-contest','wipe'])
  assert.equal(await page.locator('[data-siege="'+key+'"]').isDisabled(),true,
   'False siege victory debug button exposed: '+key);
 report.checks.push('PASS_ALL_FAKE_GATE_LADDER_CAPTURE_WIPE_BUTTONS_LOCKED');
 await page.waitForFunction(()=>{
  const q=window.ktkSiegeArmyStatus?.();
  return q?.armyNativeTick>=4&&q?.genuinelyMovedSoldierTicks>0&&
   q?.genuineSoldierLadders?.sourceSoldierStepsGuided>0;
 },{timeout:85000});
 const progressed=await army();
 assert.equal(progressed.scenario.winner,null);
 assert.equal(progressed.realObjectiveCaptureConnected,true);
 assert.equal(progressed.realSquads.length,8);
 report.checks.push('PASS_NATIVE_G54_INITIAL_REAL_MOVEMENT_3D_AND_8_SQUADS: '+
  JSON.stringify({nativeTicks:progressed.armyNativeTick,
   armySeconds:progressed.realArmySeconds,
   movedSoldierTicks:progressed.genuinelyMovedSoldierTicks,
   ladderGuided:progressed.genuineSoldierLadders.sourceSoldierStepsGuided}));
 const banner=await page.locator('#s3-authentic-army-panel h3').textContent();
 assert.match(banner,/S3C3/);
 const line=await page.locator('#s3-army-state').textContent();
 assert.match(line,/Avlu/);
 assert.match(line,/İç kale/);
 report.checks.push('PASS_S3C3_LIVE_REAL_ZONE_COUNTS_AND_RESULT_HUD');
 await page.screenshot({path:resolve(folder,
  's3c3-140-real-soldier-castle-objective-hud.png'),fullPage:true});
 await page.locator('#siege-team-red').click();
 const red=await army();
 assert.equal(red.controlledPlayerTeam,'red');
 assert.equal(red.genuineAlive.red,70);
 assert.equal(red.genuineAlive.blue,70);
 assert.equal(red.realObjectiveCaptureConnected,true);
 assert.equal(red.realObjectiveCaptureNavigation.playerSquadProtected,true);
 report.checks.push('PASS_REAL_RED_COMMANDER_RESTART_WITH_OWNED_SQUAD_PROTECTED');
 assert.deepEqual(report.pageErrors,[]);
 assert.deepEqual(report.consoleErrors,[]);
 report.result='PASS_INITIAL_S3C3_REAL_CHROMIUM_3D_CAPTURE_AND_HUD';
}catch(err){
 report.result='FAIL';report.failure=String(err?.stack||err);throw err;
}finally{
 writeFileSync(resolve(folder,'s3c3-chromium-report.json'),
  JSON.stringify(report,null,2)+'\n');
 if(browser)await browser.close();
 console.log(JSON.stringify(report,null,2));
}
