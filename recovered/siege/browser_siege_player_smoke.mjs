/** S3D1 real Chromium software-WebGL human commander acceptance.
 * Actual KeyW from Three.js preview -> same original G5.4 playerPosition.
 * Actual KeyF/fire uses original G5.4 soldier damage API. No claim of
 * restored historic FFA movement or full 3D musket/arrow ballistics.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const filename=process.argv[2];
if(!filename)throw Error('S3D1 offline candidate HTML path required');
const dir=resolve(process.env.KTK_S3D1_REPORT_DIR||
  'recovered/siege/browser-evidence-s3d1');
mkdirSync(dir,{recursive:true});
const report={
 kind:'S3D1_NATIVE_G54_HUMAN_COMMANDER_CHROMIUM_SOFTWARE_WEBGL',
 realPhysicalGPUAccepted:false,fullOriginalFFAPlayerPorted:false,
 real3DBallisticsProven:false,checks:[],
 pageErrors:[],consoleErrors:[],result:'RUNNING'
};
let browser=null;
try{
 browser=await chromium.launch({headless:true,
  executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader',
   '--enable-webgl','--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1300,height:820}});
 page.setDefaultTimeout(85000);
 page.on('pageerror',e=>report.pageErrors.push(String(e?.stack||e)));
 page.on('console',msg=>{if(msg.type()==='error')
  report.consoleErrors.push(msg.text().slice(0,800));});
 await page.goto(pathToFileURL(resolve(filename)).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.ktkSiegeArmyStatus?.()&&
  window.ktkSiegePlayerCombatStatus?.()&&
  window.ktkSiegePreviewStatus?.().sceneWebGL),{timeout:85000});
 const army=()=>page.evaluate(()=>window.ktkSiegeArmyStatus());
 const player=()=>page.evaluate(()=>window.ktkSiegePlayerCombatStatus());
 const scene=()=>page.evaluate(()=>window.ktkSiegePreviewStatus());
 const initial=await player(),a=await army(),view=await scene();
 assert.equal(a.authentic140Soldiers,140);
 assert.equal(a.renderedRealSoldierCount,140);
 assert.equal(a.realSquads.length,8);
 assert.equal(a.realObjectiveCaptureConnected,true);
 assert.equal(view.liveCombatViewConnected,true);
 assert.equal(initial.playerHealth,100);
 assert.equal(initial.playerTeam,'red');
 assert.equal(initial.view,'orbit');
 assert.equal(initial.playerActive,false);
 assert.equal(initial.actualG54NativeDamageAndPlayerHealth,true);
 assert.equal(initial.realFFAOriginalMovementPorted,false);
 assert.equal(initial.real3dBulletAndArrowBallistics,false);
 report.checks.push('PASS_TRUE_140_G54_ARMY_AND_100_HP_HUMAN_COMBAT_MODULE');
 for(const id of ['siege-fixture-gate','siege-fixture-west','siege-fixture-east'])
  assert.equal(await page.locator('#'+id).isDisabled(),true);
 for(const key of ['gate','west','east','court','court-contest',
  'keep','keep-contest','wipe'])
  assert.equal(await page.locator('[data-siege="'+key+'"]').isDisabled(),
   true,'Genuine player must not fake event '+key);
 report.checks.push('PASS_REAL_HUMAN_NO_QA_TELEPORT_OR_FAKE_SIEGE_WIN');
 await page.locator('#siege-fps').click();
 await page.waitForFunction(()=>window.ktkSiegePlayerCombatStatus?.().playerActive,
   {timeout:85000});
 const playerBefore=await player();
 const before=await scene();
 assert.equal(playerBefore.view,'fps');
 assert.equal(playerBefore.playerHealth,100);
 const fpsWeapon=await page.evaluate(()=>window.ktkSiegeWeaponVisualStatus?.());
 assert.equal(fpsWeapon?.actualThreeJSViewmodels,true);
 assert.equal(fpsWeapon?.modelCount,4);
 assert.equal(fpsWeapon?.visibleWeapon,'sword');
 assert.equal(fpsWeapon?.visibleFPS,true);
 assert.equal(fpsWeapon?.fakeProjectilesCreated,0);
 assert.equal(playerBefore.nativePosition.z,before.explorer.pos.z);
 await page.keyboard.down('w');
 await page.waitForTimeout(800);
 await page.keyboard.up('w');
 await page.waitForFunction(()=>{
  const p=window.ktkSiegePreviewStatus?.()?.explorer;
  const g=window.ktkSiegePlayerCombatStatus?.();
  return p&&g&&Math.abs(p.pos.z-g.nativePosition.z)<.2;
 },{timeout:85000});
 const moved=await player(),movedScene=await scene();
 assert(movedScene.explorer.pos.z>before.explorer.pos.z+.2,
  'Actual KeyW failed to move player physical castle avatar');
 assert(Math.abs(moved.nativePosition.z-movedScene.explorer.pos.z)<.2,
  'Human 3D player walk not synced into genuine native G5.4 AI target');
 report.checks.push('PASS_REAL_KEYW_CASTLE_COLLISION_TO_NATIVE_PLAYER_POSITION: '+
  JSON.stringify({start:before.explorer.pos,final:movedScene.explorer.pos,
   sourcePosition:moved.nativePosition}));
 await page.keyboard.press('f');
 const first=await player();
 const swordVisual=await page.evaluate(()=>window.ktkSiegeWeaponVisualStatus());
 assert.equal(swordVisual.nativeShotFeedbackEvents,1);
 assert.equal(first.attempts,1);
 assert.equal(first.weapon,'sword');
 await page.keyboard.press('Digit4');
 assert.equal((await player()).weapon,'musket');
 assert.equal((await page.evaluate(()=>window.ktkSiegeWeaponVisualStatus())).visibleWeapon,'musket');
 await page.keyboard.press('f');
 const musket=await player();
 assert.equal(musket.attempts,2);
 await page.keyboard.press('f');
 const second=await player();
 assert.equal(second.attempts,2,
  'Native musket cooldown bypassed with instant double shot');
 assert(second.cooldownDenied>=1);
 assert.equal((await page.evaluate(()=>window.ktkSiegeWeaponVisualStatus())).nativeShotFeedbackEvents,2,
  'Cooldown may not create cosmetic recoil or a fake shot');
 report.checks.push('PASS_NATIVE_PLAYER_WEAPON_SELECT_F_ATTACK_REAL_15S_MUSKET_COOLDOWN');
 await page.keyboard.press('Digit3');
 assert.equal((await player()).weapon,'bow');
 await page.keyboard.down('f');
 await page.waitForTimeout(270);
 await page.keyboard.up('f');
 assert.equal((await player()).attempts,2,
  'Sub-2-second bow did an illegal player projectile shot');
 assert((await player()).bowDrawDenied>=1);
 assert.equal((await page.evaluate(()=>window.ktkSiegeWeaponVisualStatus())).nativeHitMarkers,0,
  'Weak bow release must not produce a fake hit');
 report.checks.push('PASS_PLAYER_BOW_REJECTS_WEAK_DRAW_UNDER_2_NATIVE_SECONDS');
 await page.screenshot({path:resolve(dir,'s3d1-native-human-fps-140-real-army.png'),
  fullPage:true});
 await page.locator('#siege-team-blue').click();
 await page.waitForFunction(()=>window.ktkSiegePlayerCombatStatus?.().playerTeam==='blue',
   {timeout:85000});
 const blue=await player(),blueArmy=await army();
 assert.equal(blue.playerHealth,100);
 assert.equal(blue.playerTeam,'blue');
 assert.equal(blueArmy.controlledPlayerTeam,'blue');
 assert.equal(blueArmy.genuineAlive.red,70);
 assert.equal(blueArmy.genuineAlive.blue,70);
 assert.equal(blueArmy.realSquads.length,8);
 assert.equal(blue.nativePosition.z,(await scene()).explorer.pos.z);
 report.checks.push('PASS_NATIVE_BLUE_HUMAN_PLAYER_AND_REAL_140_SOLDIER_FRESH_ARMY');
 assert.deepEqual(report.pageErrors,[]);
 assert.deepEqual(report.consoleErrors,[]);
 report.result='PASS_NATIVE_S3D1_COMBAT_FPS_PLAYER_BROWSER_CANDIDATE_ONLY';
}catch(e){
 report.result='FAIL';report.failure=String(e?.stack||e);throw e;
}finally{
 writeFileSync(resolve(dir,'s3d1-native-player-browser.json'),
  JSON.stringify(report,null,2)+'\n');
 if(browser)await browser.close();
 console.log(JSON.stringify(report,null,2));
}
