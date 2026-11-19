/** Real Chromium/SwiftShader 3D S3 candidate verification.
 * Genuine G5.4 140 troop actors and native 0.08s AI steps/render matrices.
 * Does NOT pretend to prove real GPU, gate structure damage or ladder AI.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const file=process.argv[2];
if(!file)throw Error('Usage: node browser_siege_real_army_smoke.mjs S3_REAL_ARMY_HTML');
const folder=resolve(process.env.KTK_S3_BROWSER_REPORT_DIR||
 'recovered/siege/browser-evidence-s3');
mkdirSync(folder,{recursive:true});
let browser;
const report={
 kind:'S3_G54_AUTHENTIC_140_REAL_AI_RENDER_SWIFTSHADER_NOT_RELEASE',
 physicalGpuAccepted:false,fullSiegeBattleReady:false,
 checks:[],pageErrors:[],consoleErrors:[],result:'RUNNING'
};
try{
 browser=await chromium.launch({headless:true,
  executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader',
   '--enable-webgl','--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1260,height:800}});
 page.setDefaultTimeout(85000);
 page.on('pageerror',e=>report.pageErrors.push(String(e?.stack||e)));
 page.on('console',msg=>{if(msg.type()==='error')
  report.consoleErrors.push(msg.text().slice(0,700));});
 await page.goto(pathToFileURL(resolve(file)).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.ktkSiegeArmyStatus?.()&&
   !!window.ktkSiegePreviewStatus?.().sceneWebGL,{timeout:85000});
 const army=()=>page.evaluate(()=>window.ktkSiegeArmyStatus());
 const siege=()=>page.evaluate(()=>window.ktkSiegePreviewStatus());
 const first=await army(),map=await siege();
 report.initial={army:first,scene:{
  sceneWebGL:map.sceneWebGL,gateVisible:map.gateVisible,
  activeColliders:map.activeColliders}};
 assert.equal(first.authentic140Soldiers,140);
 assert.equal(first.renderedRealSoldierCount,140);
 assert.equal(first.renderedActualPositions,true,
   '3D instance meshes still static fake deployment markers');
 assert.equal(first.genuineAlive.red,70);
 assert.equal(first.genuineAlive.blue,70);
 assert.equal(first.realSquads.length,8);
 assert.equal(first.controlledPlayerTeam,'red');
 assert.equal(first.authenticGateDamageSupported,false);
 assert.equal(first.fullSiegeBattleReady,false);
 assert.equal(first.realStructureDamageConnected,false);
 assert.equal(first.originalArmyAIModified,false);
 assert.equal(first.worldObstacleCount,15);
 assert.equal(map.activeColliders,15);
 assert.equal(map.sceneWebGL,true);
 // A real 140-soldier match must NEVER let S1 debug buttons fabricate
 // defender casualties or courtyard/keep capture decisions.
 for(const key of ['court','court-contest','keep','keep-contest','wipe'])
   assert.equal(await page.locator('[data-siege="'+key+'"]').isDisabled(),
     true,'Authentic siege still exposes fake win control '+key);
 report.checks.push('PASS_GENUINE_ARMY_REJECTS_FAKE_DEBUG_CAPTURE_AND_WIPE_CONTROLS');
 report.checks.push('PASS_REAL_G54_140_SOLDIERS_IN_GENUINE_THREE_JS_INSTANCES: '+
  JSON.stringify({actors:first.authentic140Soldiers,
   movableMeshes:first.renderedRealSoldierCount,squads:first.realSquads.length,
   obstacles:first.worldObstacleCount,gateAI:false}));
 await page.waitForFunction(()=>{
   const v=window.ktkSiegeArmyStatus?.();
   return v?.armyNativeTick>=3&&v?.genuinelyMovedSoldierTicks>0;
 },{timeout:85000});
 const moving=await army();
 assert(moving.realArmySeconds>0,'Real G5.4 engine did not tick');
 assert(moving.genuinelyMovedSoldierTicks>0,'No authentic soldier moved');
 assert(moving.realSquads.some(x=>x.team==='red'));
 assert(moving.realSquads.some(x=>x.team==='blue'));
 report.checks.push('PASS_NATIVE_G54_AI_TICK_AND_ACTUAL_3D_SOLDIER_MOTION: '+
  JSON.stringify({nativeTicks:moving.armyNativeTick,
   realSeconds:moving.realArmySeconds,
   movedSoldierTicks:moving.genuinelyMovedSoldierTicks,
   combatEvents:moving.realCombatEvents}));
 await page.screenshot({path:resolve(folder,'s3-140-real-soldiers-in-3d-castle.png'),
  fullPage:true});
 await page.locator('#s3-order-hold').click();
 const ordered=await army();
 assert.equal(ordered.realSquads.find(x=>x.playerControlled).order,'MEVZİ TUT');
 report.checks.push('PASS_AUTHENTIC_G54_PLAYER_OWNED_SQUAD_COMMAND_FROM_UI');
 // Switching teams must instantiate a fresh real blue player commander,
 // not cosmetically change a red unit's tint.
 await page.locator('#siege-team-blue').click();
 const blue=await army();
 assert.equal(blue.controlledPlayerTeam,'blue');
 assert.equal(blue.realSquads.find(x=>x.playerControlled).team,'blue');
 assert.equal(blue.authentic140Soldiers,140);
 assert.equal(blue.genuineAlive.red,70);
 assert.equal(blue.genuineAlive.blue,70);
 assert.equal(blue.realArmySeconds,0);
 report.checks.push('PASS_REAL_BLUE_COMMANDER_FRESH_140_SOLDIER_G54_ENGINE');
 // Gate is opened solely by S1 explicit DEBUG UI; never label this genuine
 // army gate attack. The authentic G5.4 LOS obstacles MUST be synchronized.
 for(let i=0;i<8;i++)
   await page.locator('[data-siege="gate"]').click();
 await page.waitForFunction(()=>window.ktkSiegeArmyStatus().worldObstacleCount===14,
  {timeout:85000});
 const gate=await army(),state=await siege();
 assert.equal(gate.realStructureDamageConnected,false);
 assert.equal(gate.worldObstacleCount,14);
 assert.equal(state.gate.open,true);
 assert.equal(state.gateVisible,false);
 report.checks.push('PASS_DEBUG_ONLY_BREACH_UPDATES_REAL_ARMY_LOS_OBSTACLES_WITHOUT_FAKE_HIT');
 await page.screenshot({path:resolve(folder,'s3-g54-true-soldiers-gate-debug-open.png'),
   fullPage:true});
 assert.deepEqual(report.pageErrors,[]);
 assert.deepEqual(report.consoleErrors,[]);
 report.result='PASS_S3_G54_REAL_ARMY_3D_BROWSER_CANDIDATE_ONLY';
}catch(e){
 report.result='FAIL';report.failure=String(e?.stack||e);throw e;
}finally{
 writeFileSync(resolve(folder,'s3-140-real-army-browser.json'),
   JSON.stringify(report,null,2)+'\n');
 if(browser)await browser.close();
 console.log(JSON.stringify(report,null,2));
}
