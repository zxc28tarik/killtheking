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
  await page.waitForTimeout(500);
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
    v19Hud:{
     armyClass:document.body.classList.contains('ktk-native-battle-ui'),
     orderPanelCompact:document.getElementById('meadow-army-hud').classList.contains('ktk-siege-slim'),
     centerLogoDisplay:getComputedStyle(document.querySelector('#hud > div:first-child > div:nth-child(2)')).display,
     armyPanelRect:document.getElementById('meadow-army-hud').getBoundingClientRect().toJSON()
    }};
  });
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
  if(mode.name==='siege'){
   assert.equal(playing.v20Siege?.installed,true,'V20 decor must run on the same original siege scene');
   assert.equal(playing.v20Siege?.textureMaps,5,'Five authentic stone/wood/ground original materials textured');
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
   assert(playing.v20Siege?.catapultArmVisualCount>1,'V20 sling is mounted ON actual projectile arm');
   assert(playing.v19Siege?.gateDetails>=25,'Original native gate is visually dressed');
   assert(playing.v19Siege?.mortarStones>=35,'Real outer wall masonry detail visible');
   assert.equal(playing.v19Siege?.groupVisible,true);
   assert.equal(playing.v19Siege?.gateVisible,true);
   assert.equal(playing.v19Siege?.noColliders,true);
   assert.equal(playing.siege?.realSoldiers,140,'Genuine 140 native G5.4 siege soldiers');
   assert.equal(playing.siege?.nativeOriginalKrunkerFPSMovement,true);
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
