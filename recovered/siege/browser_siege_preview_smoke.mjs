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
 // S2: a real physical KeyW event through the actual native RAF movement
 // must stop the preview player at the real original castle gate.
 // QA placement is explicitly test-only and moves NO armies/AI state.
 await page.locator('[data-siege="reset"]').click();
 await page.locator('#siege-fps').click();
 await page.locator('#siege-fixture-gate').click();
 const s2Start=await status();
 assert.equal(s2Start.explorer.view,'fps');
 assert.equal(s2Start.explorer.team,'red');
 assert.equal(s2Start.explorer.embedded,false);
 assert.equal(s2Start.explorer.qaPositionChanges,1);
 assert.equal(s2Start.gate.open,false);
 assert.equal(s2Start.explorer.availableRoute,null,
   'Closed castle should not have an attacker keep route');
 await page.keyboard.down('w');
 await page.waitForTimeout(3100);
 await page.keyboard.up('w');
 const closedWalk=await status();
 assert(closedWalk.explorer.pos.z>s2Start.explorer.pos.z+.1,
   'Physical KeyW did not move the S2 preview avatar at all');
 assert(closedWalk.explorer.pos.z<=-42.5-.85+.02,
   'Physical KeyW tunneled through CLOSED original main gate');
 assert.equal(closedWalk.explorer.embedded,false);
 report.checks.push('PASS_S2_CHROMIUM_PHYSICAL_KEYW_BLOCKED_BY_CLOSED_GATE: '+
   JSON.stringify({start:s2Start.explorer.pos,
     stopped:closedWalk.explorer.pos,
     gateHp:closedWalk.gate.hp,qaPlacementUsed:true}));
 // Open by existing genuine S1 debug gate events; only then crossing occurs.
 for(let i=0;i<8;i++)await page.locator('[data-siege="gate"]').click();
 const openAgain=await status();
 assert.equal(openAgain.gate.open,true);
 assert.equal(openAgain.activeColliders,s2Start.activeColliders-1);
 assert(openAgain.explorer.availableRoute?.includes('gateIn'),
   'Actual objective route graph did not open after main gate was destroyed');
 await page.keyboard.down('w');
 await page.waitForTimeout(3700);
 await page.keyboard.up('w');
 const walkedInside=await status();
 assert(walkedInside.explorer.pos.z>-42.5,
   'Physical KeyW still cannot cross a successfully opened gate');
 assert.equal(walkedInside.explorer.embedded,false);
 report.checks.push('PASS_S2_ACTUAL_GATE_COLLIDER_REMOVED_AND_PHYSICAL_WALK_ACROSS: '+
   JSON.stringify({position:walkedInside.explorer.pos,
     routes:walkedInside.explorer.availableRoute,
     activeColliders:walkedInside.activeColliders}));
 await page.screenshot({path:resolve(reportDir,'siege-s2-fps-open-gate-player.png'),
   fullPage:true});
 // Separate side passage with real KeyE, no fake direct climb-state mutation.
 await page.locator('[data-siege="reset"]').click();
 await page.locator('#siege-fixture-west').click();
 for(let i=0;i<4;i++)await page.locator('[data-siege="west"]').click();
 const beforeClimb=await status();
 assert.equal(beforeClimb.lanes.west,true);
 assert.equal(beforeClimb.gate.open,false);
 assert(beforeClimb.explorer.availableRoute?.includes('westInside'));
 await page.keyboard.press('e');
 await page.waitForTimeout(1700);
 const climbing=await status();
 assert(climbing.explorer.pos.y>beforeClimb.explorer.pos.y+.1||
   climbing.explorer.climb==='west',
   'Real keyboard E failed to start the S2 guided west-ladder climb');
 assert.equal(climbing.explorer.embedded,false);
 report.checks.push('PASS_S2_KEYE_REAL_WEST_LADDER_PLAYER_VERTICAL_PATH: '+
   JSON.stringify({from:beforeClimb.explorer.pos,
     during:climbing.explorer.pos,climb:climbing.explorer.climb}));
 await page.screenshot({path:resolve(reportDir,'siege-s2-west-climb.png'),
   fullPage:true});
 // Team selection and TPS are real UI interactions, but no 140-man G5.4
 // army is simulated in this visual preview; markers stay unchanged.
 await page.locator('#siege-tps').click();
 await page.locator('#siege-team-blue').click();
 const blue=await status();
 assert.equal(blue.explorer.team,'blue');
 assert.equal(blue.explorer.view,'tps');
 assert.equal(blue.explorer.embedded,false);
 assert.equal(blue.markers,140);
 assert.equal(blue.realArmyConnected,undefined);
 report.checks.push('PASS_S2_TPS_BLUE_SAFE_SPAWN_WITH_140_STATIONARY_MARKERS');
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
