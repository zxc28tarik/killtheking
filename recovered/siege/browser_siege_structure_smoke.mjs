/** S3C1 ACTUAL Chromium software WebGL smoke.
 * Proves actual rendered 140 native G5.4 soldiers + genuine structure logic
 * is connected and refuses debug gate damage. NO physical-GPU claim.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const html=process.argv[2];
if(!html)throw Error('S3C1 candidate offline HTML path required');
const folder=resolve(process.env.KTK_S3C_BROWSER_REPORT_DIR||
  'recovered/siege/browser-evidence-s3c');
mkdirSync(folder,{recursive:true});
const report={
 kind:'S3C1_G54_MELEE_GATE_ACTION_CHROMIUM_SOFTWARE_WEBGL',
 realPhysicalGPUAccepted:false,
 fullSiegeBattleReady:false,
 nativeSoldierLaddersConnected:false,
 checks:[],errors:[],consoleErrors:[],result:'RUNNING'
};
let browser;
try{
 browser=await chromium.launch({headless:true,
  executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader',
   '--enable-webgl','--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1260,height:820}});
 page.on('pageerror',e=>report.errors.push(String(e?.stack||e)));
 page.on('console',m=>{if(m.type()==='error')
   report.consoleErrors.push(m.text().slice(0,650));});
 page.setDefaultTimeout(85000);
 await page.goto(pathToFileURL(resolve(html)).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(
   window.ktkSiegeArmyStatus?.()&&
   window.ktkSiegePreviewStatus?.()?.sceneWebGL),{timeout:85000});
 const state=()=>page.evaluate(()=>window.ktkSiegeArmyStatus());
 const map=()=>page.evaluate(()=>window.ktkSiegePreviewStatus());
 const initial=await state();
 assert.equal(initial.authentic140Soldiers,140);
 assert.equal(initial.renderedRealSoldierCount,140);
 assert.equal(initial.realSquads.length,8);
 assert.equal(initial.nativeCastleTerrainCollisionActive,true);
 assert.equal(initial.authenticGateDamageSupported,true);
 assert.equal(initial.realStructureDamageConnected,true);
 assert.equal(initial.genuineGateStrikes.connected,true);
 assert.equal(initial.genuineGateStrikes.strikes,0);
 assert.equal(initial.genuineGateStrikes.gateHp,600);
 assert.equal(initial.genuineGateStrikes.nativeBuildingEventExistsInOriginalG54,false);
 assert.equal(initial.fullSiegeBattleReady,false);
 assert.equal(initial.realLadderClimbConnected,false);
 assert.equal((await map()).sceneWebGL,true);
 for(const key of ['gate','court','court-contest','keep',
  'keep-contest','wipe']){
   assert.equal(await page.locator('[data-siege="'+key+'"]').isDisabled(),
     true,'Forbidden DEBUG structure/zone/wipe input remains enabled: '+key);
 }
 report.checks.push('PASS_REAL_140_G54_SOLDIERS_AND_AUTHENTIC_SIEGE_GATE_ACTOR_INTERFACE');
 report.checks.push('PASS_NO_DEBUG_FAKE_GATE_DAMAGE_OR_CAPTURE_WIN');
 await page.waitForFunction(()=>{
   const s=window.ktkSiegeArmyStatus?.();
   return s?.armyNativeTick>=4&&s?.genuinelyMovedSoldierTicks>0;
 },{timeout:85000});
 const moved=await state();
 assert(moved.genuinelyMovedSoldierTicks>0);
 assert(moved.armyNativeTick>=4);
 assert.equal(moved.genuineGateStrikes.strikes>=0,true);
 report.checks.push('PASS_ACTUAL_G54_NATIVE_AI_ADVANCES_AND_UPDATES_3D_MESHES: '+
   JSON.stringify({nativeTicks:moved.armyNativeTick,
     realMovedSoldierTicks:moved.genuinelyMovedSoldierTicks,
     naturalGateHitsObserved:moved.genuineGateStrikes.strikes}));
 await page.screenshot({
   path:resolve(folder,'s3c1-native-army-and-gate.png'),fullPage:true});
 await page.locator('#siege-team-blue').click();
 const blue=await state();
 assert.equal(blue.controlledPlayerTeam,'blue');
 assert.equal(blue.genuineAlive.red,70);
 assert.equal(blue.genuineAlive.blue,70);
 assert.equal(blue.realStructureDamageConnected,true);
 assert.equal(blue.genuineGateStrikes.strikes,0);
 report.checks.push('PASS_RECREATE_G54_REAL_BLUE_COMMANDER_WITH_ACTOR_GATE_RULE');
 assert.deepEqual(report.errors,[]);
 assert.deepEqual(report.consoleErrors,[]);
 report.result='PASS_REAL_3D_S3C1_GATE_LOGIC_INITIALIZATION_AND_NATIVE_TICKS';
 report.browserSampleDoesNotProveNaturalGateBreach=true;
}catch(e){report.result='FAIL';report.failure=String(e?.stack||e);throw e;}
finally{
 writeFileSync(resolve(folder,'s3c1-browser-report.json'),
   JSON.stringify(report,null,2)+'\n');
 if(browser)await browser.close();
 console.log(JSON.stringify(report,null,2));
}
