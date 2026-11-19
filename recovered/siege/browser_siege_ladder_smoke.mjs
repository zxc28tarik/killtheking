/** Actual Chromium / SwiftShader S3C2 preview acceptance.
 * Natural 3D ladder climbs and real 60s battle are checked by native Node
 * test; this browser smoke proves same true army is rendered, S2 scene is
 * alive, ladder UI cannot fake work, and all original modes are isolated.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const file=process.argv[2];
if(!file)throw Error('Expected S3C2 standalone HTML');
const evidence=resolve(process.env.KTK_S3C2_REPORT_DIR||
  'recovered/siege/browser-evidence-s3c2');
mkdirSync(evidence,{recursive:true});
let browser;
const report={
 kind:'S3C2_ACTUAL_CHROMIUM_SWIFTSHADER_NOT_PHYSICAL_GPU',
 result:'RUNNING',physicalGPU:false,
 nativeG54HasBallisticElevation:false,
 nativeSoldierLaddersBuiltFromRealSoldierPresence:true,
 completeCastleSiege:false,
 checks:[],pageErrors:[],consoleErrors:[]
};
try{
 browser=await chromium.launch({headless:true,
   executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader',
     '--enable-webgl','--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1260,height:840}});
 page.setDefaultTimeout(85000);
 page.on('pageerror',e=>report.pageErrors.push(String(e?.stack||e)));
 page.on('console',m=>{if(m.type()==='error')
   report.consoleErrors.push(m.text().slice(0,500));});
 await page.goto(pathToFileURL(resolve(file)).href,{
   waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>
   !!window.ktkSiegeArmyStatus?.()&&
   !!window.ktkSiegePreviewStatus?.().sceneWebGL,{timeout:85000});
 const army=()=>page.evaluate(()=>window.ktkSiegeArmyStatus());
 const scene=()=>page.evaluate(()=>window.ktkSiegePreviewStatus());
 const first=await army();
 assert.equal((await scene()).sceneWebGL,true);
 assert.equal(first.authentic140Soldiers,140);
 assert.equal(first.renderedRealSoldierCount,140);
 assert.equal(first.realSquads.length,8);
 assert.equal(first.real3DLadderSoldierPositions,true);
 assert.equal(first.realLadderClimbConnected,true);
 assert.equal(first.genuineSoldierLadders.connected,true);
 assert(first.genuineSoldierLadders.actualEligiblePikeBuilders.west>0);
 assert(first.genuineSoldierLadders.actualEligiblePikeBuilders.east>0);
 assert.equal(first.genuineSoldierLadders.originalG54LadderEventsExist,false);
 assert.equal(first.genuineSoldierLadders.nativeCombatHas3DBallistics,false);
 assert.equal(first.originalArmyAIModified,false);
 assert.equal(first.fullSiegeBattleReady,false);
 report.checks.push('PASS_S3C2_140_GENUINE_G54_SOLDIERS_8_SQUADS_AND_DUAL_LADDER_ADAPTER');
 for(const key of ['gate','west','east','court','court-contest',
   'keep','keep-contest','wipe'])
   assert.equal(await page.locator('[data-siege="'+key+'"]').isDisabled(),
     true,'Unauthorized debug event in real S3C2: '+key);
 report.checks.push('PASS_BOTH_LADDER_AND_GATE_FAKE_DEBUG_BUTTONS_LOCKED');
 await page.waitForFunction(()=>{
   const s=window.ktkSiegeArmyStatus?.();
   return s?.armyNativeTick>=4&&s?.genuinelyMovedSoldierTicks>0&&
     s?.genuineSoldierLadders?.sourceSoldierStepsGuided>0;
 },{timeout:85000});
 const moved=await army();
 assert(moved.genuineSoldierLadders.sourceSoldierStepsGuided>0);
 assert(moved.genuinelyMovedSoldierTicks>0);
 assert.equal(moved.genuineSoldierLadders.playerControlledSquadReassigned,false);
 report.checks.push('PASS_NATIVE_AI_SPEED_LIMITED_DUAL_LADDER_TRAVEL: '+
   JSON.stringify({realNativeTicks:moved.armyNativeTick,
     actualMovedSoldierTicks:moved.genuinelyMovedSoldierTicks,
     realLadderGuidedSteps:moved.genuineSoldierLadders.sourceSoldierStepsGuided}));
 await page.screenshot({
   path:resolve(evidence,'s3c2-actual-140-soldier-dual-ladder-map.png'),
   fullPage:true});
 await page.locator('#siege-team-blue').click();
 const blue=await army();
 assert.equal(blue.controlledPlayerTeam,'blue');
 assert.equal(blue.genuineAlive.red,70);
 assert.equal(blue.genuineAlive.blue,70);
 assert.equal(blue.genuineSoldierLadders.connected,true);
 report.checks.push('PASS_BLUE_COMMANDER_NATIVE_NEW_140_ARMY_AND_DUAL_LADDERS');
 assert.deepEqual(report.pageErrors,[]);
 assert.deepEqual(report.consoleErrors,[]);
 report.result='PASS_S3C2_CHROMIUM_INITIAL_REAL_LADDER_UNIT_PHYSICS';
 report.laterNaturalWallClimbProvenByNodeNotThisBrowserSmoke=true;
}catch(e){
 report.result='FAIL';report.failure=String(e?.stack||e);throw e;
}finally{
 writeFileSync(resolve(evidence,'s3c2-chromium-report.json'),
   JSON.stringify(report,null,2)+'\n');
 if(browser)await browser.close();
 console.log(JSON.stringify(report,null,2));
}
