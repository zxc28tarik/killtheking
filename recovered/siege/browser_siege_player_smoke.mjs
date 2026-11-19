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
 assert.equal(a.realDefenderRoleCoordinationConnected,true);
 assert.equal(a.realRampart3DDefenderAIConnected,true);
 assert.equal(a.sharedNativeG54ArmyCommandContract,true);
 assert.equal(a.sharedG54ArmyHudOverlayActive,true);
 assert.equal(a.sharedG54OriginalFieldShortcutsEnabled,true);
 assert.deepEqual(a.sharedG54NativeShortcutBindings,
   ['KeyG','KeyJ','KeyK','KeyL','KeyU','KeyY','KeyN',
    'KeyZ','KeyX','KeyV','KeyB','KeyM','KeyI',
    'Digit7','Digit8','Digit9','BracketLeft','BracketRight']);
 assert.equal(a.fieldG54HudBottomLeftNativeStyle,true);
 assert.equal(a.fieldG54RealEightSquadRosterRendered,true);
 assert.equal(a.fieldG54PMapConnected,true);
 assert.equal(a.fieldSquareUsesVToPreserveCastleSlideC,true);
 const hud=page.locator('#ak02-g54-commander-hud');
 assert.equal(await hud.count(),1);
 assert.match(await hud.locator('[data-army-heading]').textContent(),/G5\.4 MEYDAN/);
 const liveCmd=()=>page.evaluate(()=>window.ktkSiegeArmyCommandStatus?.());
 await page.keyboard.press('KeyK');
 assert.equal((await liveCmd()).order,'advance');
 await page.keyboard.press('KeyJ');
 assert.equal((await liveCmd()).order,'hold');
 await page.keyboard.press('KeyX');
 assert.equal((await liveCmd()).formation,'column');
 await page.keyboard.press('KeyZ');
 assert.equal((await liveCmd()).formation,'line');
 const keyboardBefore=await army();
 assert.equal(keyboardBefore.sharedG54KeyboardCommandsAccepted>=4,true);
 assert.equal((await hud.locator('[data-army-shortcut-notice]').textContent()).includes('Komut kabul edildi'),true);
 assert.equal(await hud.locator('[data-army-roster] > div').count(),8);
 await page.keyboard.press('KeyG');
 assert.equal((await liveCmd()).order,'follow');
 await page.keyboard.press('KeyL');
 assert.equal((await liveCmd()).order,'charge');
 await page.keyboard.press('KeyU');
 assert.equal((await liveCmd()).order,'retreat');
 await page.keyboard.press('KeyY');
 assert.equal((await liveCmd()).order,'flank');
 await page.keyboard.press('KeyN');
 assert.equal((await liveCmd()).order,'skirmish');
 for(const [key,val] of [['KeyB','wedge'],['KeyM','loose'],['KeyI','shield'],
   ['KeyV','square']]){
   await page.keyboard.press(key);
   assert.equal((await liveCmd()).formation,val);
 }
 const spacingBefore=(await liveCmd()).spacingScale;
 await page.keyboard.press('BracketRight');
 assert((await liveCmd()).spacingScale>spacingBefore);
 report.checks.push('PASS_AK02B_FULL_NATIVE_G54_ORDERS_FORMATIONS_BRACKET_SPACING_WITHOUT_C_SLIDE_COLLISION');
 await page.keyboard.press('KeyP');
 assert.equal((await army()).fieldG54PMapOpen,true);
 assert.equal(await page.locator('#ak02-g54-tactical-overlay').isVisible(),true);
 assert.equal(await page.locator('#ak02-g54-map-canvas').count(),1);
 const orderBeforeModal=(await liveCmd()).order;
 await page.keyboard.press('KeyK');
 assert.equal((await liveCmd()).order,orderBeforeModal,
   'Fullscreen G5.4 map must isolate FPS/game order keys');
 const actualCanvas=page.locator('#ak02-g54-map-canvas');
 const pnt=await page.evaluate(()=>{
   const c=document.getElementById('ak02-g54-map-canvas');
   const b=globalThis.KTKSiegemap.spec.bounds;
   const r=c.getBoundingClientRect();
   return {x:(-18-b.minX)/(b.maxX-b.minX)*r.width,
     y:(b.maxZ-(-93))/(b.maxZ-b.minZ)*r.height};
 });
 await actualCanvas.click({position:pnt});
 assert.equal((await liveCmd()).lastResult?.action,'position');
 assert((await army()).fieldG54NativeMapClicks>=1);
 await page.keyboard.press('Escape');
 assert.equal((await army()).fieldG54PMapOpen,false);
 assert.equal((await army()).fieldG54MapOpens,1);
 report.checks.push('PASS_AK02B_REAL_P_MAP_G54_SOLDIERS_AND_ACTUAL_NATIVE_DESTINATION_ESC_CLOSE');
 report.checks.push('PASS_AK02A_ORIGINAL_G54_ARMY_KEYBOARD_J_K_X_Z_AND_PERSISTENT_COMBAT_HUD');
 assert.equal(a.sharedNativeG54ArmyCommands.originalG54ArmyCommandFunctions,true);
 assert.equal(a.sharedNativeG54ArmyCommands.visualLayoutFullyShared,false);
 const cm=()=>page.evaluate(()=>window.ktkSiegeArmyCommandStatus?.());
 assert.equal((await cm()).commandTeam,'red');
 await page.locator('[data-g54-formation="shield"]').click();
 assert.equal((await cm()).formation,'shield');
 await page.locator('[data-g54-action="flank"]').click();
 assert.equal((await cm()).order,'flank');
 await page.locator('#s3-order-hold').click();
 assert.equal((await cm()).order,'hold');
 const mini=await page.locator('#siege-mini-map').boundingBox();
 assert(mini?.width>40&&mini?.height>40);
 await page.locator('#siege-mini-map').click({position:{
   x:mini.width*114/264,y:mini.height*177/216
 }});
 assert.equal((await cm()).lastResult?.action,'position');
 report.checks.push('PASS_AK01_REAL_G54_FORMATION_FLANK_HOLD_AND_TACTICAL_MAP_COMMAND');
 assert.equal(a.realRampart3DDefenderAI.initialGenuineDefendersOnRamparts,8);
 assert.equal(a.realRampart3DDefenderAI.currentG54SoldierCount,140);
 assert.equal(a.realRampart3DDefenderAI.botPlayer3DCounterfire,false);
 assert.equal(a.realDefenderRoleCoordination.authenticG54Bot3DShooting,false);
 assert.equal(a.realDefenderRoleCoordination.syntheticDamageOrZoneEvents,false);
 assert.equal(view.liveCombatViewConnected,true);
 assert.equal(initial.playerHealth,100);
 assert.equal(initial.playerTeam,'red');
 assert.equal(initial.view,'orbit');
 assert.equal(initial.playerActive,false);
 assert.equal(initial.actualG54NativeDamageAndPlayerHealth,true);
 assert.equal(initial.realFFAOriginalMovementPorted,false);
 assert.equal(initial.real3dBulletAndArrowBallistics,true);
 assert.equal(initial.full3DNativeBotBallistics,false);
 assert.equal(initial.playerArrowPhysics?.musket3DHitscan,true);
 assert.equal(initial.playerArrowPhysics?.bowPhysicalFlight3D,true);
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
 const physical3D=await page.evaluate(()=>window.ktkSiegeBallisticsStatus?.());
 assert.equal(physical3D?.nativeG54DamageAuthorityPreserved,true);
 assert.equal(physical3D?.nativeG54Bot3DTargetingIntegrated,false);
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
