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
    grass:window.ktkMeadowGrassVisualStatus?.()};
  });
  assert.equal(playing.canvas,true,'Actual game canvas available');
  assert.equal(playing.iframeCount,0,'Still the same original game document');
  assert.equal(playing.meadowBattleMode,mode.army,'In-game army authority');
  if(mode.army)assert.equal(playing.meadowBattle,true,'Real G5.4 army state exists');
  if(mode.name==='siege'){
   assert.equal(playing.siege?.realSoldiers,140,'Genuine 140 native G5.4 siege soldiers');
   assert.equal(playing.siege?.nativeOriginalKrunkerFPSMovement,true);
  }
  await page.screenshot({path:evidence+'/'+mode.name+'-playing.png',timeout:30000});
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
