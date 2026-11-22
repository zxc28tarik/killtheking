/**
 * KTK-SIEGE-SESSION-01 — end-to-end native siege progression in REAL Chromium
 * WebGL, using the unchanged original game's own updateGame(dt) loop.
 *
 * Important honesty: this is an ACCELERATED GAME-TIME logic endurance test,
 * not 4–8 minutes of wall-clock gameplay, GPU FPS benchmarking or human input.
 * Never set soldier positions/HP, gate damage, winner, timers or machine state.
 * The only simulated interaction is real menu + keyboard events. The sole
 * accelerated operation is repeated calls to the existing updateGame(1/20).
 */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';

const here=dirname(fileURLToPath(import.meta.url));
const input=resolve(process.argv[2]||resolve(here,'dist/KillTheKing_3_Harita_TEK_ORJINAL_OYUN_ADAY.html'));
const out=resolve(process.env.KTK_SIEGE_SESSION_REPORT||resolve(here,'siege-session-evidence'));
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({
 headless:true,
 executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle',
  '--use-angle=swiftshader','--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist','--disable-gpu-sandbox']
});
const results={kind:'ORIGINAL_G54_SIEGE_ACCELERATED_GAME_TIME_WEBGL',softwareWebGLOnly:true,
 noHealthDamageGateWinOrSoldierPositionInjection:true,source:input,trace:[],errors:[],assertions:[]};
let page;
async function snap(label){
 const v=await page.evaluate(()=>{
  const status=window.krunkerArenaStatus();
  let siege=null;
  try{siege=window.ktkNativeSiegeMapStatus?.()||null;}catch(e){siege={error:String(e)}}
  return {phase:status.matchPhase,map:status.map,army:status.meadowBattleMode,
   secondsRemaining:status.matchRemaining,matchResult:status.matchResults?{winnerId:status.matchResults.winnerId,seconds:status.matchResults.seconds,battleReason:status.matchResults.battleReason,playerWon:status.matchResults.playerWon}:null,
   blue:status.meadowBattle?.blue??null,red:status.meadowBattle?.red??null,
   winner:status.meadowBattle?.winner??null,actorTotal:status.meadowBattle?.total??null,
   canvas:!!document.querySelector('canvas'),iframeCount:document.querySelectorAll('iframe').length,
   siege,visualGate:window.ktkSiegeVisualV19Status?.()||null};
 });
 results.trace.push({label,...v});
 console.log('SIEGE_STEP',label,JSON.stringify({phase:v.phase,remaining:v.secondsRemaining,
  gateHp:v.siege?.gateHp,gateOpen:v.siege?.gateOpen,ramHits:v.siege?.ramHits,
  catHits:v.siege?.catapultHits,towerCrossed:v.siege?.realNativeTowerCrossed,
  crew:v.siege?.ramCrew,catCrew:v.siege?.catapultCrew,catLaunches:v.siege?.catapultLaunches,
  capture:v.siege?.captureHeldSeconds,winner:v.winner}));
 return v;
}
async function pass(statement,fn){
 await fn();results.assertions.push(statement);console.log('PASS',statement);
}
try{
 page=await browser.newPage({viewport:{width:1180,height:720}});
 page.setDefaultTimeout(35000);
 page.on('pageerror',e=>results.errors.push('page:'+String(e)));
 page.on('console',msg=>{if(msg.type()==='error')results.errors.push('console:'+msg.text())});
 await page.goto(pathToFileURL(input).href,{waitUntil:'load',timeout:60000});
 await page.waitForFunction(()=>typeof window.krunkerArenaStatus==='function',{timeout:35000});
 await page.click('#native-siege-start');
 await page.click('#play-btn');
 await page.waitForFunction(()=>window.krunkerArenaStatus().matchPhase==='playing',{timeout:35000});
 // The 140-soldier equipment status is published by the FIRST real frame,
 // a moment after the menu state flips to playing. Do not race the renderer.
 await page.waitForFunction(()=>window.ktkNativeSiegeMapStatus?.().realSoldiers===140,{timeout:35000});
 const started=await snap('start-native-siege');
 await pass('starts real native 140 soldier siege, no iframe',()=>{
  assert.equal(started.army,true);
  assert.equal(started.map,'castle');
  assert.equal(started.siege?.realSoldiers,140);
  assert.equal(started.siege?.nativeOriginalKrunkerFPSMovement,true);
  assert.equal(started.iframeCount,0);
  assert.equal(started.siege.gateHp,600);
  assert.equal(started.siege.gateOpen,false);
 });
 // A real keyboard event travels the normal game's original listener. We
 // never directly invoke private machine state or G5.4 commander internals.
 for(const hotkey of ['F6','F7','F8']){
  await page.evaluate(code=>window.dispatchEvent(new KeyboardEvent('keydown',{
   code,key:code,bubbles:true,cancelable:true})),hotkey);
 }
 const ordered=await snap('hotkeys-F6-F7-F8');
 await pass('three real commander equipment orders acknowledged',()=>{
  assert.equal(ordered.siege?.towerAssigned,true);
  assert.equal(ordered.siege?.ramCrewAssigned,true);
  assert.equal(ordered.siege?.catCrewAssigned,true);
  assert.equal(ordered.siege?.realSoldiers,140);
 });
 // Deterministic accelerated game-time stepping in live Three.js/Chromium:
 // run 60 original frames per chunk, return for a renderer pass/QA snapshot.
 const accessible=await page.evaluate(()=>window.eval('typeof updateGame'));
 await pass('original global game-loop function accessible without patching',()=>{
  assert.equal(accessible,'function');
 });
 let prev=started,firstBreach=null,firstLaunch=null,firstDamage=null;
 const MAX_STEPS=2400; // 120 in-game seconds; a complete battle may finish sooner.
 for(let steps=0;steps<MAX_STEPS;steps+=60){
  const got=await page.evaluate(()=>{
   let n=0;
   const source='(()=>{let count=0;while(count<60 && arenaMatch.phase==="playing")'+
    '{updateGame(0.05);count++;}return count;})()';
   return window.eval(source);
  });
  assert(Number.isInteger(got)&&got>=0&&got<=60,'Only original updateGame frames stepped');
  if(steps%240===0||got<60){
   const t=await snap('game-seconds-'+((steps+got)*.05).toFixed(1));
   if(!firstBreach&&t.siege?.gateOpen)firstBreach=t;
   if(!firstLaunch&&t.siege?.catapultLaunches>0)firstLaunch=t;
   if(!firstDamage&&t.siege?.gateHp<600)firstDamage=t;
   await pass('healthy game state at '+((steps+got)*.05).toFixed(1)+' s',()=>{
    assert.equal(t.iframeCount,0);
    assert(t.siege?.gateHp>=0&&t.siege?.gateHp<=600);
    assert(t.siege?.ramHp>=0&&t.siege?.ramHp<=340);
    assert(t.siege?.catapultHp>=0&&t.siege?.catapultHp<=280);
    assert(t.blue>=0&&t.blue<=70);
    assert(t.red>=0&&t.red<=70);
    assert(t.siege?.ramHits>=0&&t.siege?.catapultHits>=0);
    assert(t.siege?.captureHeldSeconds>=0);
    assert(t.secondsRemaining>=0);
    assert.equal(t.visualGate?.mortarStones,50,'Native castle masonry still rendered');
    assert.equal(t.visualGate?.gateDetails,32,'Gate has original mesh children');
    assert.equal(t.visualGate?.gateVisible,!t.siege?.gateOpen,
     'Real gate and gate dressing must disappear at the exact same breach');
   });
   prev=t;
   if(t.phase==='results'||t.siege?.done)break;
  }
  if(got===0)break;
 }
 const finished=await snap('post-accelerated-siege');
 await pass('actual unmodified G5.4 combat or siege equipment progressed',()=>{
  assert(finished.siege?.ramHits>0||
   finished.siege?.catapultLaunches>0||
   finished.siege?.towerDeployed||
   finished.blue<70||finished.red<70,
   'No real soldier losses or siege-equipment progression after 120 game seconds');
 });
 await pass('gate health never increases and battle only uses native actors',()=>{
  assert(finished.siege?.gateHp<=started.siege.gateHp);
  assert(finished.siege?.realSoldiers===140);
  assert.equal(finished.siege?.distinctSiegeRuntime,false);
 });
 // Returning to menu is only possible after the match results. If combat has
 // not ended, document the ongoing scenario rather than faking a victory.
 if(finished.phase==='results'){
  await pass('genuine native army result reports actual winner and elapsed time',()=>{
   assert(finished.matchResult?.winnerId==='g54:blue'||finished.matchResult?.winnerId==='g54:red');
   assert(Number.isFinite(finished.matchResult?.seconds));
   assert(finished.matchResult?.seconds>0&&finished.matchResult?.seconds<=120);
   assert(['castle-capture','elimination','time-limit'].includes(finished.matchResult?.battleReason));
  });
  await pass('battle HUD does not overlap native win/results overlay',async()=>{
   const v=await page.evaluate(()=>{
    const display=id=>getComputedStyle(document.getElementById(id)).display;
    const hint=document.querySelector('#match-results-overlay .text-center.mb-5 > p');
    return {hud:display('hud'),siege:display('native-siege-panel'),
      army:display('meadow-army-hud'),hint:hint?getComputedStyle(hint).display:null,
      results:document.getElementById('match-results-overlay').classList.contains('hidden'),
      body:document.body.classList.contains('ktk-native-army-results')};
   });
   assert.equal(v.body,true);
   assert.equal(v.results,false);
   assert.equal(v.hud,'none');
   assert.equal(v.siege,'none');
   assert.equal(v.army,'none');
   assert.equal(v.hint,'none');
  });
  await pass('result screen shows real G5.4 elapsed time, not old 04:00 preset or FFA columns',async()=>{
   const v=await page.evaluate(()=>{
    const header=document.querySelector('#match-results-overlay > section > div.grid');
    const lbl=document.getElementById('match-duration-label');
    const desc=document.getElementById('match-results-duration-description');
    return {clock:lbl?.textContent,description:desc?.textContent,
      headerDisplay:header?getComputedStyle(header).display:null};
   });
   const seconds=finished.matchResult.seconds;
   const mm=String(Math.floor(seconds/60)).padStart(2,'0');
   const ss=String(Math.ceil(seconds)%60).padStart(2,'0');
   assert.equal(v.clock,mm+':'+ss);
   assert.equal(v.description,'SÜREDE SONA ERDİ');
   assert.equal(v.headerDisplay,'none');
  });
  await page.screenshot({path:out+'/siege-results.png',timeout:40000});
  await page.click('#match-replay-btn');
  await page.waitForFunction(()=>{
   const a=window.krunkerArenaStatus();
   const s=window.ktkNativeSiegeMapStatus?.();
   return a.matchPhase==='playing'&&s?.gateHp===600&&s?.gateOpen===false&&
    s?.ramHits===0&&s?.catapultHits===0&&s?.done===false;
  },{timeout:35000});
  const restarted=await snap('replay-native-siege');
  await pass('replay restores the original in-game HUD without overlay bleed',async()=>{
   const v=await page.evaluate(()=>({
    isResultsBody:document.body.classList.contains('ktk-native-army-results'),
    hudDisplay:getComputedStyle(document.getElementById('hud')).display,
    siegeDisplay:getComputedStyle(document.getElementById('native-siege-panel')).display
   }));
   assert.equal(v.isResultsBody,false);
   assert.notEqual(v.hudDisplay,'none');
   assert.notEqual(v.siegeDisplay,'none');
  });
  await pass('replay resets genuine gate/machine state without duplicate soldiers',()=>{
   assert.equal(restarted.siege?.realSoldiers,140);
   assert.equal(restarted.siege?.gateHp,600);
   assert.equal(restarted.siege?.gateOpen,false);
   assert.equal(restarted.siege?.ramHits,0);
   assert.equal(restarted.siege?.catapultHits,0);
   assert.equal(restarted.siege?.ramDestroyed,false);
   assert.equal(restarted.siege?.catapultDestroyed,false);
   assert.equal(restarted.siege?.done,false);
   assert.equal(restarted.visualGate?.gateVisible,true,'Restored original native gate shows its dressing');
  });
 }else{
  results.acceptanceLimit='Accelerated 120 in-game seconds completed without results; real manual 4–8 min acceptance still required.';
 }
 await page.screenshot({path:out+'/siege-after-endurance.png',timeout:40000});
 await pass('no JS/console errors',()=>assert.deepEqual(results.errors,[]));
 results.pass=true;
 console.log('PASS_KTK_NATIVE_SIEGE_REAL_WEBGL_ACCELERATED_LONG_BATTLE');
}catch(e){
 results.pass=false;results.failure=String(e.stack||e);
 process.exitCode=1;
 console.error('FAILED_KTK_NATIVE_SIEGE_LONG_BATTLE',results.failure);
}finally{
 writeFileSync(out+'/report.json',JSON.stringify(results,null,2)+'\n');
 await page?.close().catch(()=>{});
 await browser.close();
}
