/**
 * KTK-MAIN-04: real Chromium/SwiftShader smoke for ONE original AK09 HTML.
 * NO iframes, NO test-only fake soldier state. Start each native choice from
 * its actual menu button; capture screenshots and console/page errors.
 * This is not Windows hardware GPU/user play acceptance.
 */
import {chromium} from 'playwright';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const here=dirname(fileURLToPath(import.meta.url));
const game=resolve(process.argv[2]||here+'/dist/KillTheKing_3_Harita_TEK_ORJINAL_OYUN_ADAY.html');
const evidence=resolve(process.env.KTK_CANONICAL_BROWSER_REPORT||here+'/canonical-browser-evidence');
mkdirSync(evidence,{recursive:true});
const browser=await chromium.launch({
 headless:true,
 executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle',
       '--use-angle=swiftshader','--enable-unsafe-swiftshader',
       '--ignore-gpu-blocklist','--disable-gpu-sandbox']
});
const report={game,softwareWebGLOnly:true,modes:[],errors:[]};
try{
 for(const mode of [
  {name:'ffa',button:null,map:'castle',army:false},
  {name:'army',button:'#meadow-army-demo-btn',map:'meadow',army:true},
  {name:'siege',button:'#native-siege-start',map:'castle',army:true}
 ]){
  const page=await browser.newPage({viewport:{width:1000,height:680}});
  const errs=[];
  page.on('pageerror',e=>errs.push('page: '+String(e)));
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  page.setDefaultTimeout(30000);
  await page.goto(pathToFileURL(game).href,{waitUntil:'load',timeout:60000});
  await page.waitForFunction(()=>typeof window.krunkerArenaStatus==='function',{timeout:30000});
  const uiBoot=await page.evaluate(()=>({
   ...window.ktkUiV21Status?.(),
   v22:window.ktkUiV22Status?.(),
   v23:window.ktkUiV23Status?.(),
   v24:window.ktkUiV24Status?.(),
   mapEtchings:[...document.querySelectorAll('#arena-map-controls>button')].map(b=>getComputedStyle(b).backgroundImage),
   heraldry:[...document.querySelectorAll('#menu-overlay .class-card')].map(card=>({
    role:card.getAttribute('data-ktk-v23-role'),
    heading:card.querySelector('h3,h4,strong')?.textContent.trim()||card.textContent.trim().slice(0,100),
    crest:getComputedStyle(card,'::before').backgroundImage
   })),
   selectedMapCount:document.querySelectorAll('#arena-map-controls>button').length,
   menuPanelBorder:getComputedStyle(document.querySelector('#menu-overlay>div')).borderTopWidth,
   menuPanelBackground:getComputedStyle(document.querySelector('#menu-overlay>div')).backgroundImage,
   selectorDisplay:getComputedStyle(document.getElementById('arena-map-controls')).display,
   primaryButtonBackground:getComputedStyle(document.getElementById('play-btn')).backgroundImage,
   originalModeButtons:document.querySelectorAll('#match-mode-controls button').length
  }));
  assert.equal(uiBoot.installed,true,'V21 shared visual design installed in the original game');
  assert.equal(uiBoot.v22?.installed,true,'V22 War Room UI installed over original game');
  assert.equal(uiBoot.v22?.v21Retained,true,'V21 retained');
  assert.equal(uiBoot.v22?.mapButtons,3,'Three original map controls');
  assert.equal(uiBoot.v22?.noGameStateMutation,true,'V22 only presentation');
  assert.equal(uiBoot.v23?.installed,true,'V23 command heraldry installed in native menu');
  assert.equal(uiBoot.v23?.v21Retained,true,'Original V21 identity retained');
  assert.equal(uiBoot.v23?.v22Retained,true,'Approved V22 still installed');
  assert.equal(uiBoot.v23?.originalMaps,3,'V23 preserves three native maps');
  assert.equal(uiBoot.v23?.classCards,4,'Original four class choices remain');
  console.log('V23_REAL_CLASS_HEADINGS',JSON.stringify(uiBoot.heraldry.map(({role,heading})=>({role,heading}))));
  assert.equal(uiBoot.v23?.roleCards,4,'Each real player class has a matching heraldic crest');
  assert.equal(uiBoot.v24?.installed,true,'War Council V24 is installed in native menu');
  assert.equal(uiBoot.v24?.maps,3,'V24 retains the three native map controls');
  assert.equal(uiBoot.v24?.heraldryCards,4,'All four genuine class crests survived V24');
  assert.equal(uiBoot.v24?.cosmeticOnly,true,'V24 cannot affect original game state');
  assert.equal(uiBoot.mapEtchings.length,3);
  assert(uiBoot.mapEtchings.every(image=>image.includes('data:image/svg+xml,')),
   'Three original War Council map silhouette etchings are actually rendered');
  assert.equal(new Set(uiBoot.mapEtchings).size,3,'Three maps have distinct native decorative motifs');
  assert(uiBoot.mapEtchings.every(image=>image.trim().startsWith('url(')),
   'All three actual map motifs must be painted in foreground, not obscured behind the panel gradient');
  assert.equal(uiBoot.heraldry.filter(c=>c.role&&c.crest.includes('data:image/svg+xml')).length,4,
   'All four existing class cards use original vector crests');
  assert.equal(uiBoot.originalMapButtons,3,'Three real original map controls remain');
  assert.equal(uiBoot.selectedMapCount,3,'Do not substitute isolated menu buttons');
  assert(uiBoot.originalSiegeButtons>=4,'Original commands plus existing F10 panel control');
  const equipmentIds=await page.evaluate(()=>['native-siege-tower-order','native-siege-ram-order',
   'native-siege-cat-order','native-siege-assault-order'].every(id=>
   document.getElementById(id)?.closest('#native-siege-panel')));
  assert.equal(equipmentIds,true,'Real F6-F9 equipment commands unchanged');
  assert(uiBoot.originalArmyOrderButtons>=7,'Real G5.4 tactical order elements remain');
  assert.equal(uiBoot.actualSiegeDisabled,true,'Cannot visually unlock real gate assault');
  assert.equal(uiBoot.selectorDisplay,'grid','Map selection is three equal visual cards');
  assert.equal(uiBoot.menuPanelBorder,'4px','V22 War Room menu brass molding');
  assert(uiBoot.menuPanelBackground.includes('gradient'),'Premium background surface is applied');
  assert(uiBoot.primaryButtonBackground.includes('gradient'),'Main PLAY action uses the same bronze/gold system');
  assert.equal(uiBoot.originalModeButtons,2,'FFA/TDM modes unchanged');
  const boot=await page.evaluate(()=>window.krunkerArenaStatus());
  assert.equal(boot.matchPhase,'menu','Boot is native match menu');
  if(mode.button)await page.click(mode.button);
  const selected=await page.evaluate(()=>window.krunkerArenaStatus());
  assert.equal(selected.map,mode.map,mode.name+' native map');
  assert.equal(selected.meadowBattleMode,mode.army,mode.name+' native army authority');
  assert.equal(selected.botCount,6,'No modification of original six FFA bots');
  assert.equal(await page.locator('iframe').count(),0,'No separate S3D1 iframe');
  if(mode.name==='army'){
   const grass=await page.evaluate(()=>window.ktkMeadowGrassVisualStatus?.());
   assert(grass,'Native Meadow grass exists');
   assert.equal(grass.count,2700);
   assert.equal(grass.nearbyCount,12000);
  }
  await page.screenshot({path:evidence+'/'+mode.name+'-menu.png',timeout:30000});
  await page.click('#play-btn');
  await page.waitForFunction(()=>window.krunkerArenaStatus().matchPhase==='playing',{timeout:30000});
  // Wait for actual original G5.4 soldier readiness, not a timing guess.
  // Read-only wait: never injects soldiers or game state.
  if(mode.name==='siege')await page.waitForFunction(()=>{
   try{return window.ktkNativeSiegeMapStatus?.().realSoldiers===140}catch{return false}
  },null,{timeout:45000});
  else await page.waitForTimeout(350);
  const playing=await page.evaluate(()=>{
   const s=window.krunkerArenaStatus();
   const cv=document.querySelector('canvas');
   let siege=null;
   if(s.meadowBattleMode&&s.map==='castle'){
    try{siege=window.ktkNativeSiegeMapStatus?.()}catch(e){siege={error:String(e)}}
   }
   return {map:s.map,mode:s.mode,meadowBattleMode:s.meadowBattleMode,
    botCount:s.botCount,phase:s.matchPhase,meadowBattle:!!s.meadowBattle,
    siege,canvas:!!cv&&cv.width>0&&cv.height>0,iframeCount:document.querySelectorAll('iframe').length,
    grass:window.ktkMeadowGrassVisualStatus?.(),
    v19Groves:window.ktkMeadowGrovesV19Status?.(),
    v19Siege:window.ktkSiegeVisualV19Status?.(),
    v20Siege:window.ktkSiegeVisualV20Status?.(),
    v21Ui:window.ktkUiV21Status?.(),
    v22Ui:window.ktkUiV22Status?.(),
    v23Ui:window.ktkUiV23Status?.(),
    v24Ui:window.ktkUiV24Status?.(),
    expandedSiege:window.ktkSiegeExpandedMapStatus?.(),
    siegeFortification:window.ktkSiegeFortificationStatus?.(),
    defenderDoctrine:window.ktkSiegeDefenderDoctrineStatus?.(),
    siegeRouteWatch:window.ktkSiegeRouteWatchStatus?.(),
    v19Hud:{
     armyClass:document.body.classList.contains('ktk-native-battle-ui'),
     orderPanelCompact:document.getElementById('meadow-army-hud').classList.contains('ktk-siege-slim'),
     centerLogoDisplay:getComputedStyle(document.querySelector('#hud > div:first-child > div:nth-child(2)')).display,
     armyPanelRect:document.getElementById('meadow-army-hud').getBoundingClientRect().toJSON()
    }};
  });
  assert.equal(playing.v21Ui?.installed,true,'V21 remains installed during real FPS battles');
  assert.equal(playing.v22Ui?.installed,true,'V22 stays installed in FPS battle');
  assert.equal(playing.v22Ui?.noNewControls,true,'No alternate battle controls');
  assert.equal(playing.v23Ui?.installed,true,'V23 remains in native battle UI');
  assert.equal(playing.v23Ui?.cosmeticOnly,true,'Class heraldry never changes game state');
  assert.equal(playing.v23Ui?.originalSiegeControls>=4,true,'Original siege orders retained');
  assert.equal(playing.v24Ui?.installed,true,'V24 remains present in real native FPS battle');
  assert.equal(playing.v24Ui?.originalSiegeOrders>=4,true,'V24 preserves genuine F6–F9 equipment orders');
  assert.equal(playing.v24Ui?.noGameplayHooks,true,'V24 is cosmetic with no new game loops');
  assert(playing.v21Ui?.originalSiegeButtons>=4,'F6-F9 real siege commands and existing panel control');
  assert.equal(playing.v21Ui?.originalMapButtons,3,'No new menu or mode runtime');
  assert.equal(playing.v21Ui?.renderOnly,true,'No game logic rebindings in UI');
  assert.equal(playing.canvas,true,'Actual game canvas available');
  assert.equal(playing.iframeCount,0,'Still the same original game document');
  assert.equal(playing.meadowBattleMode,mode.army,'In-game army authority');
  if(mode.army)assert.equal(playing.meadowBattle,true,'Real G5.4 army state exists');
  assert.equal(playing.v19Hud.armyClass,mode.army,'V19 army HUD is scoped to genuine G5.4 modes');
  if(mode.army){
   assert.equal(playing.v19Hud.orderPanelCompact,true,'V19 default compact 140 soldier orders');
   assert.equal(playing.v19Hud.centerLogoDisplay,'none','No giant banner over battlefield view');
   assert(playing.v19Hud.armyPanelRect.height<=112,'No 500px tactical HUD covering the actual battle');
  }
  if(mode.name==='army'){
   assert.equal(playing.v19Groves?.trees,180,'Native 180 meadow periphery trees');
   assert.equal(playing.v19Groves?.drawBatches,3,'Only three instanced forest draw batches');
   assert(playing.v19Groves?.minDistanceFromCenter>240,'No decorative groves in central army positions');
   assert(playing.v19Groves?.minDistanceFromCenter<540,'Distant groves still actually readable from player');
   assert.equal(playing.v19Groves?.visible,true,'Meadow-only groves visible when selected');
   assert.equal(playing.v19Groves?.noColliders,true,'No invented tree colliders');
  }
  if(mode.name!=='siege'){
   assert.equal(playing.siegeRouteWatch?.active,false,
    'AK28 route-watch must never touch the original Arena/Meadow battle');
   assert.equal(playing.defenderDoctrine?.active,false,
    'AK27 red defensive AI must never run on Arena or Meadow');
   assert.equal(playing.siegeFortification?.activated,false,
    'AK26 defensive obstacles must be invisible/uncollidable outside siege mode');
   assert.equal(playing.siegeFortification?.activeProjectileCover,false,
    'AK26 must not change Arena or Meadow world raycasts');
   assert.equal(playing.expandedSiege?.activated,false,
    'AK25 enlarged fortress must remain invisible/uncollidable in FFA and Meadow');
  }
  if(mode.name==='siege'){
   assert(playing.expandedSiege,'AK25 expanded siege layout status exists in the same game');
   assert.equal(playing.expandedSiege.activated,true,'Physical outer fort active only in siege');
   const fort=playing.siegeFortification;
   const doctrine=playing.defenderDoctrine;
   const routeWatch=playing.siegeRouteWatch;
   assert.equal(routeWatch?.active,true,'AK28 watches only the true third map');
   assert.equal(routeWatch?.installed,true,'Real G5.4 collision-aware route audit is installed');
   assert.equal(routeWatch?.originalBattleRouting,true);
   assert.equal(routeWatch?.checkedFromLiveG54Colliders,true);
   assert.equal(routeWatch?.actorCount,140);
   assert.equal(routeWatch?.maxReplansPerStage,2);
   assert.equal(routeWatch?.noTeleport,true);
   assert.equal(routeWatch?.noExtraDamage,true);
   assert.equal(Object.keys(routeWatch?.routeReadiness||{}).length,6,
    'Both defender companies have real front, postern and rear destinations');
   assert.equal(routeWatch?.allRequiredRoutesClear,true,
    'All SIX defender routes must be walkable in actual AK25/26 castle collider graph');
   assert.equal(doctrine?.installed,true,'Original G5.4 red defensive captain created');
   assert.equal(doctrine?.active,true,'AK27 runs only inside actual siege battle');
   assert.equal(doctrine?.phase,'garrison','Authentic defenders begin at intended posts');
   assert.equal(doctrine?.rearArchersAnchored,true,'Existing red bow reserve guards the second stone line');
   assert(doctrine?.originalRearArcherCount>=10,'Real red bow soldiers actually stand behind defenses');
   assert.equal(doctrine?.totalRealSoldiers,140,'No extra AK27 soldiers');
   assert.equal(doctrine?.playerSquadTeam,'blue','Real FPS squad authority remains on the original attacking player');
   assert(Number.isInteger(doctrine.playerSquadIdUnchanged),'Original player G5.4 squad identity retained');
   assert.equal(doctrine?.noBlueOrderOverrides,true);
   assert.equal(doctrine?.noSoldierTeleports,true);
   assert.equal(doctrine?.noAddedFirepower,true);
   assert.equal(doctrine?.realDefensiveLeases,1,'Initial garrison pins only the rear red bow company');
   assert.equal(fort?.activated,true,'Five defensive lines actually belong to playing siege map');
   assert.equal(fort?.realDefensiveLayers,5,'A functional fort needs five defense zones');
   assert.equal(fort?.realCollisionBoxes,19,'Nineteen authentic gameplay cover bodies');
   assert.equal(fort?.spawnIntrusions,0,'No actual G5.4 troop may spawn inside new bastion or wall');
   assert(fort?.defenderRearBowReserve>=10,'Actual red archer squad occupies rear defensive line');
   assert(fort?.frontBastions>=6,'Fortified flanking gate and integrated projecting bastions');
   assert.equal(fort?.antiRushObstacles,3,'Original breach has actual anti-rush dogleg/guardrooms');
   assert.equal(fort?.secondLineBlocks,4,'Rear bailey defended by real second line');
   assert.equal(fort?.entranceChokeWidth,16,'Original destructible gate aperture stays open');
   assert.equal(fort?.backRetreatPassageWidth,24,'Second line has walkable reserve passage');
   assert.equal(fort?.activeProjectileCover,true,'Original projectile raycasts see the physical bastions');
   assert.equal(fort?.realG54PlayerBotCollisions,true,'Existing FPS and G5.4 collision engines own new walls');
   assert.equal(fort?.noAdditionalSoldiers,true);
   assert.equal(fort?.noSecondGame,true);
   assert.deepEqual(Object.keys(fort?.corridors||{}).sort(),
    ['ram','tower','catapult','westBreach','eastBreach','innerPostern'].sort());
   assert(Object.values(fort.corridors).every(Boolean),
    'All existing original siege machines, two breach flanks and retreat corridor remain walkable');
   assert(playing.expandedSiege.castleAreaFactor>=4,'Castle footprint at least 4x original');
   assert(playing.expandedSiege.mapAreaFactor>=8,'Siege terrain/nav area at least 8x original');
   assert.equal(playing.expandedSiege.castleWidth,224);
   assert.equal(playing.expandedSiege.fieldSide,624);
   assert(playing.expandedSiege.fortressSolidCount>=14,'Outer fort has physical wall and barracks colliders');
   assert.equal(playing.expandedSiege.northPosternWidth,16,
    'New rear bailey accessible from original inner castle through real postern');
   const start=playing.expandedSiege.deployment;
   assert.equal(start?.redInside,70,'All 70 red G5.4 defenders spawn WITHIN the castle');
   assert.equal(start?.blueOutside,70,'All 70 blue G5.4 attackers spawn OUTSIDE');
   assert.equal(start?.redOutside,0,'No defender starts outside castle');
   assert.equal(start?.blueInside,0,'No attacker starts inside castle');
   assert.equal(start?.playerOutside,true,'Player starts with attackers outside');
   assert.equal(playing.siege?.defenderInsideAtSpawn,70);
   assert.equal(playing.siege?.attackerOutsideAtSpawn,70);
   assert.equal(playing.siege?.realSoldiers,140,'Original G5.4 soldier authority');
   assert.equal(playing.v20Siege?.installed,true,'V20 decor must run on the same original siege scene');
   assert.equal(playing.v20Siege?.textureMaps,5,'Five authentic stone/wood/ground original materials textured');
   assert.equal(playing.v20Siege?.originalRamRoofReskinned,true,'Actual bulky original grey ram roof becomes timber');
   assert.equal(playing.v20Siege?.guardWallStoneCladding,true,'Giant grey original castle guard wall becomes textured stone');
   assert(playing.v20Siege?.wallTrimCount>=45,'Detailed real southern castle curtain');
   assert(playing.v20Siege?.gateTrimCount>=25,'Original 600HP gate hardware and hinge rings');
   assert(playing.v20Siege?.ramTrimCount>=28,'Moving ram has a timber shingle roof');
   assert(playing.v20Siege?.catapultTrimCount>=14,'Real catapult owns the sling and framing');
   assert(playing.v20Siege?.towerTrimCount>=40,'Climbable real tower clad with timber, iron and banners');
   assert.equal(playing.v20Siege?.groundWheelTracks,4,'Native attack approach has wheel ruts');
   assert.equal(playing.v20Siege?.noColliders,true,'V20 did not invent impassable terrain');
   assert.equal(playing.v20Siege?.noProjectileTargets,true,'V20 cosmetics are not bullet targets');
   assert.equal(playing.v20Siege?.originalBattleEngine,true,'One original Krunker/G5.4 FPS');
   assert.equal(playing.v20Siege?.realGateVisible,true,'Gate 600HP remains closed at match start');
   assert.equal(playing.v20Siege?.realBridgeVisible,false,'Real moving tower bridge starts retracted');
   assert.equal(playing.v20Siege?.catapultArmVisualCount,3,'V20 leather sling and two tethers follow actual projectile arm');
   assert(playing.v19Siege?.gateDetails>=25,'Original native gate is visually dressed');
   assert(playing.v19Siege?.mortarStones>=35,'Real outer wall masonry detail visible');
   assert.equal(playing.v19Siege?.groupVisible,true);
   assert.equal(playing.v19Siege?.gateVisible,true);
   assert.equal(playing.v19Siege?.noColliders,true);
   assert.equal(playing.siege?.realSoldiers,140,'Genuine 140 native G5.4 siege soldiers');
   assert.equal(playing.siege?.nativeOriginalKrunkerFPSMovement,true);
  }
  if(mode.name==='siege'){
   const skin=await page.evaluate(()=>({
    gradient:getComputedStyle(document.getElementById('native-siege-panel')).backgroundImage,
    border:getComputedStyle(document.getElementById('native-siege-panel')).borderTopWidth,
    realAssaultDisabled:document.getElementById('native-siege-assault-order').disabled,
    armyGradient:getComputedStyle(document.getElementById('meadow-army-hud')).backgroundImage,
    resultGradient:getComputedStyle(document.querySelector('#match-results-overlay>section')).backgroundImage
   }));
   assert(skin.gradient.includes('gradient'),'Actual active siege panel is textured');
   assert.equal(skin.border,'3px','Genuine original siege panel now has bronze top molding');
   assert.equal(skin.realAssaultDisabled,true,'Assault button remains locked until real breach');
   assert(skin.armyGradient.includes('gradient'),'Real army commands have same design system');
   assert(skin.resultGradient.includes('gradient'),'Actual result card also shares this design');
  }
  await page.screenshot({path:evidence+'/'+mode.name+'-playing.png',timeout:30000});
  if(mode.army){
   // Same native F10 controls, no additional overlay/mode or input engine.
   await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'F10',key:'F10',bubbles:true,cancelable:true})));
   const expanded=await page.evaluate(()=>!document.getElementById('meadow-army-hud').classList.contains('ktk-siege-slim'));
   assert.equal(expanded,true,'Real F10 expands native G5.4 commands in '+mode.name);
   await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'F10',key:'F10',bubbles:true,cancelable:true})));
   const restored=await page.evaluate(()=>document.getElementById('meadow-army-hud').classList.contains('ktk-siege-slim'));
   assert.equal(restored,true,'Real F10 restores readable battle HUD in '+mode.name);
  }
  console.log('PASS_V19_'+mode.name.toUpperCase(),JSON.stringify(playing.v19Hud));
  report.modes.push({name:mode.name,selected:{map:selected.map,meadowBattleMode:selected.meadowBattleMode},playing,errors:errs});
  report.errors.push(...errs.map(e=>mode.name+': '+e));
  console.log('PASS_NATIVE_'+mode.name.toUpperCase(),JSON.stringify(playing).slice(0,600));
  await page.close();
 }
 // UI responsiveness evidence: screenshot real menu on compact smartphone viewport.
 const compact=await browser.newPage({viewport:{width:390,height:844}});
 const compactErrors=[];
 compact.on('pageerror',e=>compactErrors.push(String(e)));
 await compact.goto(pathToFileURL(game).href,{waitUntil:'load',timeout:60000});
 await compact.waitForFunction(()=>!!window.ktkUiV24Status?.().installed,null,{timeout:30000});
 const mobileUi=await compact.evaluate(()=>({
  selectedCount:document.querySelectorAll('#arena-map-controls>button').length,
  mapDisplay:getComputedStyle(document.getElementById('arena-map-controls')).gridTemplateColumns,
  menuWidth:document.querySelector('#menu-overlay>div').getBoundingClientRect().width,
  viewportWidth:innerWidth,
  sameNativeGame:typeof window.krunkerArenaStatus==='function',
  v22:window.ktkUiV22Status?.(),
  v23:window.ktkUiV23Status?.(),
  v24:window.ktkUiV24Status?.(),
  mapEtchings:[...document.querySelectorAll('#arena-map-controls>button')].map(b=>getComputedStyle(b).backgroundImage),
  mapCardHeight:document.querySelector('#arena-map-controls>button').getBoundingClientRect().height,
  cardsFit:[...document.querySelectorAll('#arena-map-controls>button')].every(b=>b.getBoundingClientRect().width<=innerWidth),
  buttonsUnchanged:!!document.getElementById('native-siege-start')&&!!document.getElementById('play-btn')
 }));
 assert.equal(mobileUi.selectedCount,3,'Small-screen menu retains three battle choices');
 assert.equal(mobileUi.sameNativeGame,true);
 assert.equal(mobileUi.buttonsUnchanged,true);
 assert.equal(mobileUi.v22?.installed,true,'V22 present on 390px display');
 assert.equal(mobileUi.v23?.installed,true,'V23 readable on 390px display');
 assert.equal(mobileUi.v23?.classCards,4,'Four original soldier class cards on mobile');
 assert.equal(mobileUi.v24?.installed,true,'War Council V24 at 390px');
 assert.equal(mobileUi.v24?.originalClassCards,4,'Four original class cards at 390px');
 assert(mobileUi.mapEtchings.every(x=>x.includes('data:image/svg+xml,')),
  '390px map silhouettes remain rendered on all three native cards');
 assert.equal(mobileUi.cardsFit,true,'Three map choices fit mobile viewport');
 assert(mobileUi.mapCardHeight>=40,'Map choices remain legible/tappable');
 assert(mobileUi.menuWidth<=mobileUi.viewportWidth,'Mobile original menu fits screen');
 await compact.locator('#arena-map-controls').scrollIntoViewIfNeeded();
 await compact.screenshot({path:evidence+'/v24-mobile-menu.png',timeout:30000});
 report.mobileUi=mobileUi;
 report.errors.push(...compactErrors.map(x=>'mobile: '+x));
 await compact.close();
 assert.equal(report.errors.length,0,'No JS/console errors');
 console.log('PASS_CANONICAL_ONE_FPS_3_MAPS_REAL_SOFTWARE_WEBGL');
}catch(e){
 report.failed=String(e.stack||e);
 console.error('CANONICAL_BROWSER_FAIL',report.failed);
 process.exitCode=1;
}finally{
 writeFileSync(evidence+'/report.json',JSON.stringify(report,null,2)+'\n');
 await browser.close();
}
