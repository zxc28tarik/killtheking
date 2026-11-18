/** Kill the King S1 3D siege preview WebGL acceptance.
 * Headless SwiftShader is NOT a physical GPU/player/army battle acceptance.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const file=process.argv[2];
if(!file)throw Error('Usage: node browser_siege_preview_smoke.mjs S1_OFFLINE_HTML');
const reportDir=resolve(process.env.KTK_SIEGE_REPORT_DIR||
  'recovered/siege/browser-evidence');
mkdirSync(reportDir,{recursive:true});
const report={
  source:'GITHUB_ACTUAL_CHROMIUM_SWIFTSHADER_SIEGE_S1_PREVIEW',
  hardwareGPU:false,realArmyConnected:false,realFPSPlayer:false,
  result:'IN_PROGRESS',checks:[],pageErrors:[],consoleErrors:[]
};
const save=()=>writeFileSync(resolve(reportDir,'siege-s1-browser-smoke.json'),
  JSON.stringify(report,null,2)+'\n');
let browser;
try{
 browser=await chromium.launch({headless:true,
   executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader',
     '--enable-webgl','--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1220,height:820},
   deviceScaleFactor:1});
 page.setDefaultTimeout(65000);
 page.on('pageerror',e=>report.pageErrors.push(String(e?.stack||e)));
 page.on('console',m=>{if(m.type()==='error')
   report.consoleErrors.push(m.text().slice(0,300));});
 await page.goto(pathToFileURL(resolve(file)).href,{
   waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>
   !!window.ktkSiegePreviewStatus?.().ready,{timeout:85000});
 const status=()=>page.evaluate(()=>window.ktkSiegePreviewStatus());
 const beginning=await status();
 assert.equal(beginning.sceneWebGL,true,'Actual Three.js WebGL scene did not render');
 assert.equal(beginning.markers,140,
   'G5.4 70+70 static deployment marker preview missing');
 assert(beginning.geometryObjects>=14,'Castle geometry unexpectedly missing');
 assert.equal(beginning.phase,'APPROACH');
 assert.equal(beginning.gateVisible,true);
 assert.equal(beginning.gate.hp,600);
 assert.equal(beginning.winner,null);
 report.checks.push('PASS_S1_ACTUAL_3D_CASTLE_AND_140_EXPLICITLY_NONCOMBAT_MARKERS: '+
   JSON.stringify({markers:beginning.markers,sceneObjects:beginning.geometryObjects,
     realArmyConnected:false}));
 await page.screenshot({path:resolve(reportDir,'siege-s1-initial-castle.png'),
   fullPage:true});
 // Use real UI clicks, not direct scenario API calls.
 for(let i=0;i<4;i++)await page.locator('[data-siege="west"]').click();
 await page.waitForFunction(()=>
   window.ktkSiegePreviewStatus().phase==='BREACH',{timeout:30000});
 const afterLadder=await status();
 assert.equal(afterLadder.gate.hp,600,'Ladder must not magically damage gate');
 assert.equal(afterLadder.lanes.west,true);
 assert.equal(afterLadder.lanes.east,false);
 assert.equal(afterLadder.lanes.gate,false);
 assert.equal(afterLadder.ladderWestVisible,true);
 report.checks.push('PASS_REAL_UI_WEST_LADDER_WITH_GATE_INTACT');
 await page.screenshot({path:resolve(reportDir,'siege-s1-west-ladder-breach.png'),
   fullPage:true});
 // Red courtyard occupancy originates from a DEBUG UI button, NOT battle AI.
 await page.locator('[data-siege="court"]').click();
 await page.waitForFunction(()=>
   window.ktkSiegePreviewStatus().phase==='COURTYARD',{timeout:30000});
 const courtyard=await status();
 assert.equal(courtyard.occupancy.courtyard.red,5);
 assert.equal(courtyard.occupancy.courtyard.blue,0);
 assert.equal(courtyard.winner,null);
 report.checks.push('PASS_DEBUG_UI_COURTYARD_PHASE_WITHOUT_FALSE_VICTORY');
 await page.locator('[data-siege="reset"]').click();
 const reset=await status();
 assert.equal(reset.phase,'APPROACH');
 assert.equal(reset.ladderWestVisible,false);
 assert.equal(reset.gateVisible,true);
 assert.equal(reset.capture.courtyard,0);
 report.checks.push('PASS_SCENARIO_RESET_WITH_ORIGINAL_GATE_AND_ALL_ROUTES_CLOSED');
 // Enter a different physical breach route through eight genuine UI hits.
 for(let i=0;i<8;i++)await page.locator('[data-siege="gate"]').click();
 const open=await status();
 assert.equal(open.phase,'BREACH');
 assert.equal(open.lanes.gate,true);
 assert.equal(open.gate.hp,0);
 assert.equal(open.gateVisible,false);
 assert.equal(open.lanes.west,false);
 report.checks.push('PASS_REAL_UI_GATE_DAMAGE_BREACH_AND_VISUAL_REMOVAL');
 await page.screenshot({path:resolve(reportDir,'siege-s1-gate-breached.png'),
   fullPage:true});
 assert.equal(report.pageErrors.length,0,'Actual browser uncaught errors');
 assert.equal(report.consoleErrors.length,0,'Actual browser console errors');
 report.result='PASS_S1_SWIFTSHADER_VISUAL_AND_DEBUG_UI_ONLY';
}catch(e){
 report.result='FAIL';report.failure=String(e?.stack||e);throw e;
}finally{
 save();
 if(browser)await browser.close();
 console.log(JSON.stringify(report,null,2));
}
