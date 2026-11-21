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
 const nativeGrass=await page.evaluate(()=>{
   const w=document.querySelector('#stage iframe')?.contentWindow;
   return w?.ktkMeadowGrassVisualStatus?.()||null;
 });
 assert(nativeGrass,'Original G5.4 meadow should mount grass visual');
 assert.equal(nativeGrass.count,2700);
 assert.equal(nativeGrass.nearbyCount,12000);
 assert.match(nativeGrass.meshName,/Meadow decorative grass/);
 assert.equal(nativeGrass.visible,true);
 assert.equal(nativeGrass.nearbyVisible,true);
 assert.ok(Number.isFinite(nativeGrass.lastTileX),
   'Nearby grass must be populated and updated by the live G5.4 render loop');
 report.checks.push('PASS_REAL_MEADOW_GRASS_2700_INSTANCES: '+JSON.stringify(nativeGrass));
 report.checks.push('PASS_ORIGINAL_140_ARMY_CHROMIUM_MODE_STILL_PLAYABLE: '+
  JSON.stringify(army));
 // AK-04b: unchanged historical field game, four authentic allied squads.
 assert.equal(await child().locator('[data-ak04-selector="hud"]').count(),1);
 assert.equal(await child().locator('[data-ak04-pick]').count(),12);
 assert.equal(await child().locator('[data-ak04-selector="floating"]').count(),1);
 assert.equal(await child().locator('[data-ak04-all]').count(),3);
 await child().locator('#play-btn').click();
 await page.waitForFunction(()=>{
   const w=document.querySelector('#stage iframe')?.contentWindow;
   return w?.ktkFieldFourSquadStatus?.()?.gameStarted===true;
 },{timeout:85000});
 const fieldStatus=()=>page.evaluate(()=>document.querySelector('#stage iframe')
   ?.contentWindow?.ktkFieldFourSquadStatus?.());
 const initialField=await fieldStatus();
 assert.equal(initialField.genuineSoldierCount,140);
 assert.equal(initialField.genuineSquadCount,8);
 assert.equal(initialField.visibleControlledSquadCount,4);
 assert.equal(initialField.physicalPlayerControlledSquadCount,1);
 assert.equal(initialField.playerTeam,'blue');
 assert.equal(initialField.authorizedFriendlySquadIds.length,4);
 const originalStatus=await page.evaluate(()=>document.querySelector('#stage iframe')
   ?.contentWindow?.krunkerArenaStatus?.());
 assert.equal(originalStatus.meadowBattleMode,true);
 assert.equal(originalStatus.meadowBattle.playerSquadId,
   initialField.truePhysicalPlayerSquadId);
 report.checks.push('PASS_AK04B_REAL_ORIGINAL_FIELD_BLUE_FOUR_SQUAD_AUTHORITY_140_NATIVE');
 await child().locator('#ak04-field-floating-commander').waitFor({state:'visible',timeout:85000});
 // The original G5.4 mouse pointer may still be locked after Play.
 await page.keyboard.press('Escape');
 await page.waitForTimeout(320);
 // Chromium headless may refuse ESC-based Pointer Lock release even though
 // real browser hardware accepts it. Same explicit test-only fallback as
 // the existing certified three-mode launcher switch routine.
 const fieldLocked=await page.evaluate(()=>!!document.querySelector('#stage iframe')
   ?.contentDocument?.pointerLockElement);
 if(fieldLocked){
   report.checks.push('AK04B_HEADLESS_POINTER_LOCK_TEST_ONLY_FALLBACK');
   await page.evaluate(async()=>document.querySelector('#stage iframe')
     ?.contentDocument?.exitPointerLock?.());
   await page.waitForTimeout(360);
 }
 assert.equal(await page.evaluate(()=>!!document.querySelector('#stage iframe')
   ?.contentDocument?.pointerLockElement),false);
 for(let i=0;i<4;i++){
   await child().locator('[data-ak04-selector="floating"] [data-ak04-pick="'+i+'"]').click();
   const selected=await fieldStatus();
   assert.deepEqual(selected.selectedSquadIds,
     [selected.authorizedFriendlySquadIds[i]]);
   await child().locator('[data-ak04-selector="floating"] [data-ak04-action="order"][data-ak04-value="hold"]').click();
   const after=await fieldStatus();
   assert.equal(after.squads.find(s=>s.id===selected.selectedSquadIds[0]).order,'hold');
 }
 await child().locator('[data-ak04-selector="floating"] [data-ak04-all]').click();
 assert.equal((await fieldStatus()).selectedSquadIds.length,4);
 await child().locator('[data-ak04-selector="floating"] [data-ak04-action="order"][data-ak04-value="charge"]').click();
 assert((await fieldStatus()).squads.every(s=>s.order==='charge'));
 assert.equal((await fieldStatus()).physicalPlayerControlledSquadCount,1);
 const beforeSnapshot=await fieldStatus();
 const beforeTicks=beforeSnapshot.nativeCommandTicks;
 const beforeNativeTick=beforeSnapshot.realNativeGameTick;
 // Original Three.js field battle is software-WebGL heavy. Do not assume
 // one real animation-frame/native 80ms step fits within 650ms wall-time
 // on a headless GitHub Actions runner.
 await page.waitForFunction((before)=>{
   const s=document.querySelector('#stage iframe')
     ?.contentWindow?.ktkFieldFourSquadStatus?.();
   return s?.nativeCommandTicks>before.command&&
     s.realNativeGameTick>before.native;
 },{command:beforeTicks,native:beforeNativeTick},
   {timeout:85000,polling:250});
 const afterTicks=await fieldStatus();
 assert(afterTicks.nativeCommandTicks>beforeTicks,
   'Native G5.4 command time frozen: '+JSON.stringify({
     beforeTicks,afterTicks:afterTicks.nativeCommandTicks,
     realNativeGameTick:afterTicks.realNativeGameTick,
     health:afterTicks.realNativePlayerHealth,
     winner:afterTicks.realNativeArmyWinner,
     phase:afterTicks.realOriginalMatchPhase,
     isActive:afterTicks.realOriginalGameIsActive,
     resumed:afterTicks.deliberateCommanderResumes
   }));
 assert.equal(afterTicks.physicalPlayerControlledSquadCount,1);
 assert.equal(afterTicks.uncommandedAlliedSquadsKeepOriginalAI,true);
 report.checks.push('PASS_AK04B_REAL_FIELD_FOUR_INDIVIDUAL_AND_ALL_ORDERS_NATIVE_TICKS');
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
 assert.equal(siege.army.realDefenderRoleCoordinationConnected,true);
 assert.equal(siege.army.realRampart3DDefenderAIConnected,true);
 assert.equal(siege.army.sharedNativeG54ArmyCommandContract,true);
 assert.equal(siege.army.realFourSquadNativeCommandConnected,true);
 assert.equal(siege.army.realPikeOperatedSiegeRamConnected,true);
 assert(siege.army.siegeRamThreeJSVisualMeshes>=12);
 assert.equal(siege.army.actualSiegeRamStatus.gateHp,600);
 assert.equal(siege.army.actualSiegeRamStatus.assigned,false);
 assert.equal(siege.army.actualSiegeRamStatus.actualGateDamage,0);
 assert.equal(await child().locator('#ak05-siege-ram-panel').count(),1);
 assert.equal(await child().locator('#ak05-ram-enlist').count(),1);
 report.checks.push('PASS_AK05A_CASTLE_ONLY_REAL_3D_RAM_NATIVE_G54_PIKES_NO_GATE_HIT');
 assert.equal(siege.army.realFourSquadNativeCommand.genuineSoldierCount,140);
 assert.equal(siege.army.realFourSquadNativeCommand.visibleControlledSquadCount,4);
 assert.equal(siege.army.realFourSquadNativeCommand.physicalPlayerControlledSquadCount,1);
 assert.equal(await child().locator('[data-four-squad-index]').count(),4);
 assert.equal(await child().locator('[data-four-squad-all]').count(),1);
 report.checks.push('PASS_AK04A_FOUR_NATIVE_REAL_TEAM_SQUADS_AVAILABLE_ON_SIEGE_HUD');
 assert.equal(siege.army.sharedNativeG54BattleSessionConnected,true);
 assert.equal(siege.scene.explorer.sharedG54InputContract,true);
 assert.equal(siege.player.sharedFieldSiegePlayerInputContract,true);
 assert.equal(siege.player.playerCameraAndWeaponAimUseSameDirection,true);
 report.checks.push('PASS_AK03B_CASTLE_G54_FIELD_INPUT_AND_CAMERA_PROJECTILE_AIM');
 assert.equal(siege.army.sharedNativeG54BattleSession.mode,'siege');
 assert.equal(siege.army.sharedNativeG54BattleSession.nativeSoldierCount,140);
 assert.equal(siege.army.sharedNativeG54BattleSession.nativeSquadCount,8);
 assert.equal(siege.army.sharedNativeG54BattleSession.view,'orbit');
 assert.equal(siege.player.sharedFieldSiegeSessionContract,true);
 report.checks.push('PASS_AK03A_SHARED_NATIVE_G54_BATTLE_SESSION_HUMAN_HP_CAMERA_TEAM');
 assert.equal(siege.army.sharedG54ArmyHudOverlayActive,true);
 assert.equal(siege.army.sharedG54OriginalFieldShortcutsEnabled,true);
 assert.equal(siege.army.sharedG54NativeShortcutBindings.length,18);
 assert.equal(siege.army.fieldG54HudBottomLeftNativeStyle,true);
 assert.equal(siege.army.fieldG54RealEightSquadRosterRendered,true);
 assert.equal(siege.army.fieldG54PMapConnected,true);
 assert.equal(siege.army.fieldSquareUsesVToPreserveCastleSlideC,true);
 assert.equal(await child().locator('[data-army-roster] > div').count(),8);
 const hudPos=await child().locator('#ak02-g54-commander-hud').evaluate(el=>{
   const rect=el.getBoundingClientRect();
   return {left:rect.left,right:rect.right,bottom:rect.bottom,
     parentWidth:el.parentElement.getBoundingClientRect().width};
 });
 assert(hudPos.left>=0&&hudPos.bottom>0&&hudPos.right<=hudPos.parentWidth+40);
 report.checks.push('PASS_AK02B_G54_BOTTOM_LEFT_EIGHT_SQUAD_HUD_FIELD_SHORTCUTS');
 assert.equal(await child().locator('#ak02-g54-commander-hud').count(),1);
 assert.match(await child().locator('[data-army-status]').textContent(),/ASKER/);
 report.checks.push('PASS_AK02A_SHARED_FIELD_HOTKEYS_AND_IN_WORLD_ARMY_HUD');
 assert.equal(siege.army.sharedNativeG54ArmyCommands.originalG54ArmyCommandFunctions,true);
 assert.equal(siege.army.exactOriginalFieldArmyHUDReused,false);
 report.checks.push('PASS_AK01_SIEGE_AND_FIELD_NATIVE_G54_COMMANDS_SHARED');
 assert.equal(siege.army.realRampart3DDefenderAI.initialGenuineDefendersOnRamparts,8);
 assert.equal(siege.army.realRampart3DDefenderAI.real3DHeightLineOfFire,true);
 assert.equal(siege.army.realRampart3DDefenderAI.botPlayer3DCounterfire,false);
 report.checks.push('PASS_S4B1_EIGHT_NATIVE_BLUE_RAMPART_3D_SOLDIER_COUNTERFIRE');
 assert.equal(siege.army.realDefenderRoleCoordination.authenticG54Bot3DShooting,false);
 report.checks.push('PASS_S4A_AUTHENTIC_BLUE_GROUND_DEFENSE_ROLES_OPT_IN');
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
 assert.equal(siege.player.real3dBulletAndArrowBallistics,true);
 assert.equal(siege.player.full3DNativeBotBallistics,false);
 assert.equal(siege.player.playerArrowPhysics?.musket3DHitscan,true);
 assert.equal(siege.player.playerArrowPhysics?.bowPhysicalFlight3D,true);
 report.checks.push('PASS_S3D2C_REAL_3D_PLAYER_BALLISTICS_ONLY_NATIVE_G54_DAMAGE');
 assert.equal(siege.scene.liveCombatViewConnected,true);
 const initialWeapon=await page.evaluate(()=>document.querySelector('#stage iframe')
  .contentWindow.ktkSiegeWeaponVisualStatus?.());
 assert.equal(initialWeapon?.modelCount,4);
 assert.equal(initialWeapon?.fakeProjectilesCreated,0);
 report.checks.push('PASS_S3D2B_FOUR_EVENT_ONLY_FPS_WEAPONS_READY');
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
 assert.equal(activePlayer.nativeBattleSession.view,'fps');
 assert.equal(activePlayer.nativeBattleSession.playerActive,true);
 assert.equal(activePlayer.nativeBattleSession.combatAllowed,true);
 assert.equal(activePlayer.playerHealth,100);
 const firstVisual=await page.evaluate(()=>document.querySelector('#stage iframe')
  .contentWindow.ktkSiegeWeaponVisualStatus());
 assert.equal(firstVisual.visibleFPS,true);
 assert.equal(firstVisual.visibleWeapon,'sword');
 // S3D2a real keyboard events travel into the third-mode iframe.
 await page.keyboard.down('Space');
 await page.waitForFunction(()=>{
  const s=document.querySelector('#stage iframe')?.contentWindow
   ?.ktkSiegePreviewStatus?.();
  return s?.explorer?.locomotion?.jumpCount>=1&&s.explorer.pos.y>.15;
 },{timeout:85000});
 await page.keyboard.up('Space');
 await page.waitForFunction(()=>document.querySelector('#stage iframe')
  ?.contentWindow?.ktkSiegePreviewStatus?.()?.explorer?.locomotion?.grounded,
  {timeout:85000});
 await page.keyboard.down('ShiftLeft');
 await page.waitForFunction(()=>document.querySelector('#stage iframe')
  ?.contentWindow?.ktkSiegePreviewStatus?.()?.explorer?.locomotion?.sliding,
  {timeout:85000});
 await page.keyboard.up('ShiftLeft');
 const movement=await page.evaluate(()=>document.querySelector('#stage iframe')
  ?.contentWindow?.ktkSiegePreviewStatus?.()?.explorer?.locomotion);
 assert.equal(movement.jumpCount,1);
 assert.equal(movement.realCastleSweptCollider,true);
 assert.equal(movement.fullArenaPhysicsShared,false);
 report.checks.push('PASS_S3D2A_KEYBOARD_JUMP_SLIDE_REAL_CHROMIUM: '+
  JSON.stringify(movement));
 await page.keyboard.press('Digit4');
 const currentWeapon=await page.evaluate(()=>document.querySelector('#stage iframe')
  .contentWindow.ktkSiegeWeaponVisualStatus());
 assert.equal(currentWeapon.visibleWeapon,'musket');
 assert.equal(currentWeapon.modelCount,4);
 report.checks.push('PASS_S3D2B_MUSKET_VIEWMODEL_REAL_CHROMIUM');
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
