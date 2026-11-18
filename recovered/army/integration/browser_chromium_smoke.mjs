/** Chromium software-WebGL smoke of the genuine shipped single-HTML launcher.
 * Not a hardware GPU / manual play / 30-minute performance acceptance.
 * This executes real DOM, Three.js rendering and browser pointer-lock requests.
 */
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const input=process.argv[2];
if(!input)throw Error('Usage: node browser_chromium_smoke.mjs COMBINED_HTML');
const reportDir=resolve(process.env.KTK_BROWSER_REPORT_DIR||'recovered/army/integration/browser-evidence');
mkdirSync(reportDir,{recursive:true});
const notes={kind:'CHROMIUM_SOFTWARE_WEBGL_SMOKE_NOT_REAL_GPU_APPROVAL',
  checks:[],pageErrors:[],consoleErrors:[],launcher:resolve(input),result:'RUNNING'};
const save=()=>writeFileSync(resolve(reportDir,'browser-smoke.json'),
  JSON.stringify(notes,null,2)+'\n');
let browser;
try{
 browser=await chromium.launch({headless:true,
  executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,args:[
   '--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl',
   '--no-sandbox','--disable-dev-shm-usage'
 ]});
 const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
 page.setDefaultTimeout(30000);
 page.on('pageerror',e=>notes.pageErrors.push(String(e.message||e)));
 page.on('console',m=>{if(m.type()==='error')notes.consoleErrors.push(m.text().slice(0,300));});
 page.on('dialog',d=>{notes.checks.push('Browser dialog during switch: '+d.type()+' '+d.message().slice(0,120));return d.accept();});
 await page.goto(pathToFileURL(resolve(input)).href,{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('[data-ktk-launch]').count(),2);
 notes.checks.push('Launcher shell and both mode choices loaded');
 const gameCanvas=async locator=>locator.evaluate(c=>{
   let context=null;
   try{context=c.getContext('webgl2')||c.getContext('webgl');}catch{}
   return {width:c.width,height:c.height,webgl:!!context,
      contextLost:context?context.isContextLost():null};
 });
 const waitGame=async (frame,label)=>{
   const canvas=frame.locator('#game-canvas');
   await canvas.waitFor({state:'attached',timeout:45000});
   await page.waitForTimeout(1200);
   const result=await gameCanvas(canvas);
   assert(result.width>=320&&result.height>=200,label+' invalid viewport '+JSON.stringify(result));
   assert(result.webgl&&!result.contextLost,label+' WebGL context missing/lost: '+JSON.stringify(result));
   notes.checks.push(label+' real WebGL canvas alive: '+JSON.stringify(result));
 };
 const exitPointerLockForHeadlessSwitch=async()=>{
   await page.keyboard.press('Escape');
   await page.waitForTimeout(650);
   const locked=await page.evaluate(()=>
      !!document.querySelector('#stage iframe')?.contentDocument?.pointerLockElement);
   if(locked){
     notes.checks.push('HEADLESS LIMITATION: real Escape did NOT release child-frame pointer lock; browser test explicitly calls exitPointerLock to continue. Manual ESC acceptance still OPEN.');
     await page.evaluate(async()=>{
       const doc=document.querySelector('#stage iframe')?.contentDocument;
       if(doc?.pointerLockElement)await doc.exitPointerLock();
     });
     await page.waitForTimeout(500);
   }
   const after=await page.evaluate(()=>
      !!document.querySelector('#stage iframe')?.contentDocument?.pointerLockElement);
   assert.equal(after,false,'Unable to release actual Chrome iframe pointer lock before mode switch');
 };
 const enterFFA=async (map)=>{
   await page.locator('[data-ktk-launch="ffa"]').click();
   const ffa=page.frameLocator('#stage iframe');
   await ffa.locator('#play-btn').waitFor({state:'visible',timeout:45000});
   await waitGame(ffa,'FFA '+map);
   if(map==='meadow')await ffa.locator('[data-arena-map="meadow"]').click();
   await ffa.locator('#card-class-0').click();
   await ffa.locator('#play-btn').click();
   await page.waitForTimeout(10500);
   const diagnostic=await ffa.locator('body').evaluate(()=>({
      status:typeof window.krunkerArenaStatus==='function'?window.krunkerArenaStatus():null,
      perf:typeof window.krunkerPerformanceReport==='function'?window.krunkerPerformanceReport():null,
      pointerLocked:!!document.pointerLockElement,
      visibility:document.visibilityState,
      hudTimer:document.querySelector('#hud-timer')?.textContent,
      hudFps:document.querySelector('#hud-fps')?.textContent,
      startError:document.querySelector('#ktk-startup-error')?.textContent
   }));
   const status=diagnostic.status;
   notes.checks.push('FFA '+map+' post-click diagnostics: '+JSON.stringify({
      matchPhase:status?.matchPhase,remaining:status?.matchRemaining,
      duration:status?.matchDurationSeconds,botCount:status?.botCount,
      samples:status?.telemetry?.samples,pointerLocked:diagnostic.pointerLocked,
      visibility:diagnostic.visibility,hudTimer:diagnostic.hudTimer,
      hudFps:diagnostic.hudFps,startError:diagnostic.startError,
      perf:diagnostic.perf
   }).slice(0,1400));
   await page.screenshot({path:resolve(reportDir,'ffa-'+map+'.png'),fullPage:true});
   assert(status,'FFA game status unavailable after actual button click');
   assert.equal(status.matchPhase,'playing','FFA did not start/resume');
   assert.equal(status.map,map,'Wrong rendered FFA map selected');
   assert.equal(status.botCount,6,'FFA bot roster changed');
   // Software SwiftShader often advances only a fraction of real-time;
   // assert nonzero simulation progress, NOT hardware-performance acceptance.
   assert(status.matchRemaining<status.matchDurationSeconds-0.1,
     'FFA game simulation has not advanced at all after Start');
   if((diagnostic.perf?.averageFPS||0)<25)
      notes.checks.push('WARNING: headless software WebGL is slow ('+
        diagnostic.perf?.averageFPS+' FPS); no real-GPU FPS approval');
   notes.checks.push('FFA '+map+' active: bots='+status.botCount+
     ', remaining='+status.matchRemaining+', player targets='+
     JSON.stringify(status.telemetry?.targetSlots||{}));
   return status;
 };
 await enterFFA('castle');
 await exitPointerLockForHeadlessSwitch();
 await page.waitForTimeout(800);
 const navState=async()=>page.evaluate(()=>{
    const frame=document.querySelector('#stage iframe');
    return {armyPressed:document.querySelector('[data-ktk-launch="army"]')?.getAttribute('aria-pressed'),
      ffaPressed:document.querySelector('[data-ktk-launch="ffa"]')?.getAttribute('aria-pressed'),
      frameTitle:frame?.title,childPointerLock:!!frame?.contentDocument?.pointerLockElement,
      outerPointerLock:!!document.pointerLockElement};
 });
 notes.checks.push('Pre-switch nav: '+JSON.stringify(await navState()));
 await page.locator('[data-ktk-launch="army"]').click();
 await page.waitForTimeout(900);
 let afterClick=await navState();
 notes.checks.push('First physical Army click: '+JSON.stringify(afterClick));
 if(afterClick.armyPressed!=='true'){
    notes.checks.push('WARNING: first physical mode switch not applied; checking second click');
    await page.locator('[data-ktk-launch="army"]').click();
    await page.waitForTimeout(1000);
    afterClick=await navState();
    notes.checks.push('Second physical Army click: '+JSON.stringify(afterClick));
 }
 await page.waitForTimeout(850);
 const armyDom=await page.evaluate(()=>{
    const iframe=document.querySelector('#stage iframe'),doc=iframe?.contentDocument;
    return {iframeExists:!!iframe,iframeTitle:iframe?.title,
      encodedDocLength:iframe?.srcdoc?.length||0,documentState:doc?.readyState,
      bodyLength:doc?.body?.innerHTML.length||0,
      autoselectExists:!!doc?.getElementById('meadow-army-demo-btn'),
      playExists:!!doc?.getElementById('play-btn'),
      headTitle:doc?.title,
      firstText:doc?.body?.textContent?.slice(0,150)};
 });
 notes.checks.push('Army iframe after switch: '+JSON.stringify(armyDom));
 await page.screenshot({path:resolve(reportDir,'army-after-switch.png'),fullPage:true});
 const army=page.frameLocator('#stage iframe');
 await army.locator('#meadow-army-demo-btn').waitFor({state:'attached',timeout:25000});
 const armySelected=await army.locator('#meadow-army-demo-btn').getAttribute('aria-pressed');
 assert.equal(armySelected,'true','G5.4 army demo was not auto-selected');
 await waitGame(army,'G5.4 Army');
 notes.checks.push('G5.4 army demo auto-selection is active');
 const armyPlay=army.locator('#play-btn');
 assert(await armyPlay.count(),'G5.4 army start button not present');
 await armyPlay.click();
 await page.waitForTimeout(7000);
 const armySnapshot=await army.locator('body').evaluate(()=>{
   const c=document.querySelector('#game-canvas');
   const state=typeof window.krunkerArenaStatus==='function'?window.krunkerArenaStatus():null;
   const battle=state?.meadowBattle;
   return {canvasWidth:c?.width,canvasHeight:c?.height,
     menuHidden:document.getElementById('menu-overlay')?.classList.contains('hidden'),
     playButtonVisible:!!document.getElementById('play-btn'),
     matchPhase:state?.matchPhase,map:state?.map,
     meadowBattleMode:state?.meadowBattleMode,
     blue: battle?.blue,red:battle?.red,squads:battle?.squads?.length,
     playerSquadId:battle?.playerSquadId,
     armyHudVisible:!document.getElementById('meadow-army-hud')?.classList.contains('hidden')};
 });
 assert.equal(armySnapshot.menuHidden,true,'Army menu did not close on Start');
 assert.equal(armySnapshot.meadowBattleMode,true,'Army engine mode not active despite demo selection');
 assert.equal(armySnapshot.matchPhase,'playing','Army match not actually running');
 assert.equal(armySnapshot.map,'meadow','Army field not loaded');
 assert(armySnapshot.blue>0&&armySnapshot.red>0,
   'The live 70/70 blue/red army engine is not populated');
 assert.equal(armySnapshot.squads,8,'Expected exactly 8 genuine army companies');
 assert.equal(armySnapshot.armyHudVisible,true,'Army command HUD not visible in actual battle');
 notes.checks.push('G5.4 native Army started and populated: '+JSON.stringify(armySnapshot));
 // Real user key events, delivered to the focused running iframe; no direct
 // ArenaArmyBattle API calls or game-state mutation in the test harness.
 const armyCommandState=async()=>army.locator('body').evaluate(()=>{
   const st=typeof window.krunkerArenaStatus==='function'?window.krunkerArenaStatus():null;
   const battle=st?.meadowBattle, own=battle?.squads?.[battle.playerSquadId];
   return {matchPhase:st?.matchPhase,playerSquadId:battle?.playerSquadId,
      totalSquads:battle?.squads?.length,playerControlled:own?.playerControlled,
      playerTeam:own?.team,playerType:own?.type,
      order:own?.order,formation:own?.formation,fireMode:own?.fireMode,
      ownerCount:battle?.squads?.filter(s=>s.playerControlled).length,
      redCount:battle?.squads?.filter(s=>s.team==='red').length};
 });
 const initialCommand=await armyCommandState();
 assert.equal(initialCommand.playerControlled,true,'Player does not own selected squad');
 assert.equal(initialCommand.playerTeam,'blue');
 assert.equal(initialCommand.ownerCount,1);
 assert.equal(initialCommand.totalSquads,8);
 assert.equal(initialCommand.redCount,4);
 notes.checks.push('Army initial real command snapshot: '+JSON.stringify(initialCommand));
 const armyKeys=[
   {key:'KeyK',field:'order',value:'İLERLE'},
   {key:'KeyJ',field:'order',value:'MEVZİ TUT'},
   {key:'KeyX',field:'formation',value:'Yürüyüş kolu'},
   {key:'KeyZ',field:'formation',value:'Saf düzeni'}
 ];
 if(initialCommand.playerType==='musket'||initialCommand.playerType==='bow'){
   armyKeys.push({key:'Digit9',field:'fireMode',value:'ATEŞİ KES'});
   armyKeys.push({key:'Digit7',field:'fireMode',value:'SERBEST ATIŞ'});
 }
 for(const command of armyKeys){
   await page.keyboard.press(command.key);
   const current=await armyCommandState();
   notes.checks.push('Army real keyboard '+command.key+': '+
     command.field+'='+current[command.field]+', ownerCount='+current.ownerCount);
   assert.equal(current.matchPhase,'playing','Army stopped during keyboard order');
   assert.equal(current[command.field],command.value,
     'Real browser key '+command.key+' failed to apply to owned company');
   assert.equal(current.playerSquadId,initialCommand.playerSquadId,
     'Keyboard command changed player ownership');
   assert.equal(current.ownerCount,1,'Keyboard command leaked command ownership');
 }
 await page.screenshot({path:resolve(reportDir,'army-g54.png'),fullPage:true});
 await exitPointerLockForHeadlessSwitch();
 await page.locator('[data-ktk-launch="ffa"]').click();
 assert.equal(await page.locator('#stage iframe').count(),1,'Old army scene survived mode switch');
 await page.frameLocator('#stage iframe').locator('#play-btn').waitFor({state:'visible'});
 notes.checks.push('Army -> FFA removed old iframe and loaded clean original menu');
 await enterFFA('meadow'); // Same-mode launcher click must not reset the new FFA menu.
 assert.equal(await page.locator('#stage iframe').count(),1);
 // Controlled *browser-only* close-contact encounter. The published game and
 // its rules are not patched; a genuine running FFA knight AI is repositioned
 // in the live Chromium page so test throughput does not depend on random
 // cross-map encounters. Target acquisition, windup, facing, damage and HUD
 // must then be handled by the game's normal requestAnimationFrame loop.
 const ffaCombat=page.frameLocator('#stage iframe');
 const prepared=await ffaCombat.locator('body').evaluate(()=>{
   const player=window.eval('player');
   const bots=window.eval('bots');
   const chooseTarget=window.eval('chooseArenaTarget');
   const lineOfSight=window.eval('arenaLineOfSight');
   const candidate=bots.find(b=>b.role==='knight'&&!b.dead);
   if(!candidate||!player||typeof chooseTarget!=='function')
     throw Error('Real FFA actor/targeting code not available to test');
   const origin={x:player.pos.x,y:player.pos.y,z:player.pos.z};
   const originalBotPosition=candidate.mesh.position.toArray();
   // Only the test session changes a spawn, never the shipped HTML.
   const offsets=[[3,0],[-3,0],[0,3],[0,-3],[2.2,2.2],
     [-2.2,2.2],[2.2,-2.2],[-2.2,-2.2]];
   let offset=null;
   for(const [dx,dz] of offsets){
     candidate.mesh.position.set(origin.x+dx,
       origin.y-player.currentHeight,origin.z+dz);
     if(lineOfSight(candidate,player.pos,true)){offset=[dx,dz];break;}
   }
   if(!offset)throw Error('No visible close-range placement on the real FFA map');
   // Release earlier player-hunter slots, so the controlled candidate can
   // acquire the player through the *normal* FFA candidate scoring rules.
   for(const b of bots){
     if(b!==candidate&&b.arenaTargetType==='player'){
       b.arenaTargetType=null;b.arenaTargetId=null;b.arenaLockTime=0;
     }
   }
   candidate.arenaTargetType=null;
   candidate.arenaTargetId=null;
   candidate.arenaLockTime=0;
   candidate.arenaAggroType=null;
   candidate.arenaAggroUntil=0;
   if(candidate.navRecovery){
     candidate.navRecovery.avoidKey=null;candidate.navRecovery.avoidFor=0;
   }
   candidate.mesh.rotation.y=Math.atan2(
     player.pos.x-candidate.mesh.position.x,
     player.pos.z-candidate.mesh.position.z);
   candidate.attackTimer=0;
   candidate.meleeWindup=0;candidate.rangedWindup=0;
   candidate.windupTargetKey=null;
   candidate.staggerTime=0;
   const choice=chooseTarget(candidate);
   return {botId:candidate.id,role:candidate.role,weapon:candidate.weapon,
     offset,originalBotPosition,playerPosition:origin,
     target:choice?.type||null,lockedTarget:candidate.arenaTargetType,
     playerHp:player.hp,playerMaxHp:player.maxHp,playerDeaths:player.deaths,
     visible:lineOfSight(candidate,player.pos,true),
     hudHp:document.querySelector('#hud-hp-text')?.textContent};
 });
 notes.checks.push('TEST-FIXTURE close-range FFA setup (not natural-map performance): '+
   JSON.stringify(prepared));
 assert.equal(prepared.role,'knight');
 assert.equal(prepared.target,'player',
   'A nearby enemy knight did not naturally acquire the actual player');
 assert.equal(prepared.lockedTarget,'player');
 assert.equal(prepared.visible,true,'World line of sight blocked target');
 const combatSamples=[];
 let damaged=false;
 for(let attempt=0;attempt<7;attempt++){
   await page.waitForTimeout(6000);
   const sample=await ffaCombat.locator('body').evaluate(()=>{
     const st=window.krunkerArenaStatus();
     const p=window.eval('player');
     const b=window.eval('bots').find(x=>x.role==='knight'&&!x.dead);
     return {playerHp:p.hp,playerMaxHp:p.maxHp,deaths:p.deaths,
       hudHp:document.querySelector('#hud-hp-text')?.textContent,
       target:b?.arenaTargetType,windup:b?.meleeWindup,
       attackTimer:b?.attackTimer,
       matchPhase:st.matchPhase,simulationElapsed:st.matchDurationSeconds-st.matchRemaining};
   });
   combatSamples.push(sample);
   if(sample.playerHp<prepared.playerHp||sample.deaths>prepared.playerDeaths){
     damaged=true;break;
   }
 }
 notes.checks.push('Real FFA autonomous melee windup -> HP/HUD combat samples: '+
   JSON.stringify(combatSamples));
 await page.screenshot({path:resolve(reportDir,'ffa-player-damage-fixture.png'),
   fullPage:true});
 assert(damaged,'Real running FFA knight failed to inflict player HP damage '+
   'within the fixture observation window: '+JSON.stringify(combatSamples));
 const damageSample=combatSamples[combatSamples.length-1];
 assert.match(damageSample.hudHp,/^\d+\s*\/\s*\d+$/,
   'Damage was not reflected on the real visible HUD');
 assert.equal(damageSample.matchPhase,'playing','FFA stopped after player damage');
 notes.checks.push('PASS_FIXTURE_ASSISTED_PLAYER_DAMAGE_REAL_BROWSER_LOOP: '+
   'normal AI frames and native damage lowered human HP and updated HUD');
 assert.equal(notes.pageErrors.length,0,
   'Uncaught browser JavaScript exceptions: '+notes.pageErrors.join(' | '));
 notes.result='PASS_HEADLESS_SOFTWARE_WEBGL_ONLY';
}catch(err){
 notes.result='FAIL';notes.failure=String(err?.stack||err);
 throw err;
}finally{
 save();
 if(browser)await browser.close();
 console.log(JSON.stringify({result:notes.result,checks:notes.checks,
   pageErrors:notes.pageErrors,consoleErrors:notes.consoleErrors.slice(0,10),
   failure:notes.failure||null},null,2));
}
