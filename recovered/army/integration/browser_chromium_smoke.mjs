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
      startError:document.querySelector('#ktk-startup-error')?.textContent,
      bowTiming:{arenaBot:window.ArenaBotOffense?.windup('archer'),
        normalPlayerMinDraw:window.ArenaWeaponBalance?.BOW_MIN_DRAW_SECONDS,
        normalPlayerFullDraw:window.ArenaWeaponBalance?.BOW_DRAW_SECONDS,
        bowCadence:window.ArenaWeaponBalance?.SHOT_INTERVAL?.bow,
        postShotRecovery:window.ArenaWeaponBalance?.BOW_RECOVERY_SECONDS}
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
   assert.deepEqual(diagnostic.bowTiming,{
     arenaBot:.5,normalPlayerMinDraw:2,normalPlayerFullDraw:3,
     bowCadence:4,postShotRecovery:1},
     'FFA must speed ONLY the arena bot archer, not the normal player bow');
   notes.checks.push('FFA '+map+' BOW TIMING: '+JSON.stringify(diagnostic.bowTiming));
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
 // PASSIVE real-map observation BEFORE any test fixtures reposition an actor.
 // There is no simulation or actor mutation in this read-only diagnostic.
 // Do not call chooseArenaTarget here: that would change live AI targets.
 const naturalFFA=await page.frameLocator('#stage iframe')
   .locator('body').evaluate(()=>{
     const p=window.eval('player'),bots=window.eval('bots');
     const st=window.krunkerArenaStatus();
     return {mode:st.mode,map:st.map,matchPhase:st.matchPhase,
       elapsed:st.matchDurationSeconds-st.matchRemaining,
       player:{x:p.pos.x,z:p.pos.z,hp:p.hp},
       actors:bots.map(b=>({
         id:b.id,role:b.role,dead:b.dead,targetType:b.arenaTargetType,
         targetId:b.arenaTargetId,
         distanceToPlayer:Math.hypot(b.mesh.position.x-p.pos.x,
           b.mesh.position.z-p.pos.z),
         position:{x:b.mesh.position.x,z:b.mesh.position.z}
       }))};
   });
 notes.checks.push('PASSIVE natural Meadow FFA after launch (no bot teleports): '+
   JSON.stringify(naturalFFA));
 assert.equal(naturalFFA.actors.length,6,
   'Natural live FFA bot roster is not the configured six fighters');
 assert(naturalFFA.actors.every(a=>a.targetType!=='player'||
    Number.isFinite(a.distanceToPlayer)),
   'A hunter has an invalid player distance');
 assert(naturalFFA.actors.filter(a=>a.targetType==='player').length<=2,
   'FFA natural-map player targeting violates two-hunter safety cap');
 assert(naturalFFA.actors.every(a=>
   a.targetType!=='bot'||(a.targetId!==a.id&&
     naturalFFA.actors.some(other=>other.id===a.targetId))),
   'FFA natural-map bot tried to hunt itself or a missing target');
 notes.checks.push('PASS_NATURAL_MAP_READ_ONLY_ROSTER_AND_TARGET_SAFETY; '+
   'natural pursuit/kill rate NOT proven by this short software-WebGL sample');
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
 // Second controlled melee role: real FFA pikeman aims, winds up and hits
 // human on the live browser's normal requestAnimationFrame update path.
 // Keep the pike's original 0.40s telegraph, 35 body damage, defense and
 // world collision; no direct arenaBotAttack or damage call is allowed.
 const pikemanFixture=await ffaCombat.locator('body').evaluate(()=>{
   const p=window.eval('player'),bots=window.eval('bots');
   const choose=window.eval('chooseArenaTarget');
   const canSee=window.eval('arenaLineOfSight');
   const b=bots.find(x=>x.role==='pikeman'&&!x.dead);
   if(!b||!p||typeof choose!=='function')
     throw Error('Pikeman bot missing from real FFA arena');
   const ground=p.pos.y-p.currentHeight;
   for(const other of bots){
     if(other===b)continue;
     // TEST ONLY: isolate which fighter inflicted the measured damage.
     other.mesh.position.set(p.pos.x+365+other.id*13,ground,
       p.pos.z+355+other.id*11);
     other.attackTimer=9999;other.meleeWindup=0;other.rangedWindup=0;
     other.arenaTargetType=null;other.arenaTargetId=null;
     other.arenaLockTime=0;other.arenaAggroType=null;other.arenaAggroUntil=0;
   }
   const options=[[3.4,0],[-3.4,0],[0,3.4],[0,-3.4],
     [2.4,2.4],[-2.4,2.4],[2.4,-2.4],[-2.4,-2.4]];
   let offset=null;
   for(const [dx,dz] of options){
     b.mesh.position.set(p.pos.x+dx,ground,p.pos.z+dz);
     if(canSee(b,p.pos,true)){offset=[dx,dz];break;}
   }
   if(!offset)throw Error('No clear native pikeman engagement position');
   b.arenaTargetType=null;b.arenaTargetId=null;b.arenaLockTime=0;
   b.arenaAggroType=null;b.arenaAggroUntil=0;
   b.staggerTime=0;b.attackTimer=0;
   b.meleeWindup=0;b.rangedWindup=0;b.windupTargetKey=null;
   b.navPath.length=0;b.navGoal=null;b.navRefresh=0;
   b.navRecovery=window.ArenaBotRecovery.create();
   b.tacticMode='hold';b.tacticGoal=null;b.tacticRefresh=10000;
   b.mesh.rotation.y=Math.atan2(p.pos.x-b.mesh.position.x,
     p.pos.z-b.mesh.position.z);
   p.hp=p.maxHp;p.isShielding=false;p.shieldParryTime=0;
   window.eval('updateHUD()');
   const target=choose(b);
   return {botId:b.id,role:b.role,offset,
     playerHp:p.hp,deaths:p.deaths,matchClock:window.eval('arenaClock'),
     target:target?.type,lockedTarget:b.arenaTargetType,
     lineOfSight:canSee(b,p.pos,true),
     windupSeconds:window.ArenaBotOffense.windup('pikeman'),
     expectedBodyDamage:window.ArenaWeaponBalance.damage('spear','body')};
 });
 notes.checks.push('PIKEMAN close-encounter TEST ONLY: '+
   JSON.stringify(pikemanFixture));
 assert.equal(pikemanFixture.role,'pikeman');
 assert.equal(pikemanFixture.windupSeconds,.40);
 assert.equal(pikemanFixture.expectedBodyDamage,35);
 assert.equal(pikemanFixture.target,'player');
 assert.equal(pikemanFixture.lockedTarget,'player');
 assert.equal(pikemanFixture.lineOfSight,true);
 const pikemanSamples=[];
 let pikemanDamaged=false;
 for(let i=0;i<9;i++){
   await page.waitForTimeout(5000);
   const s=await ffaCombat.locator('body').evaluate((_body,botId)=>{
     const p=window.eval('player');
     const b=window.eval('bots').find(bot=>bot.id===botId);
     const st=window.krunkerArenaStatus();
     return {hp:p.hp,deaths:p.deaths,
       hud:document.querySelector('#hud-hp-text')?.textContent,
       meleeWindup:b?.meleeWindup,attackTimer:b?.attackTimer,
       targetType:b?.arenaTargetType,phase:st.matchPhase,
       clock:window.eval('arenaClock')};
   },pikemanFixture.botId);
   pikemanSamples.push(s);
   if(s.hp<pikemanFixture.playerHp||s.deaths>pikemanFixture.deaths){
     pikemanDamaged=true;break;
   }
 }
 notes.checks.push('PIKEMAN actual Chromium AI windup and health snapshots: '+
   JSON.stringify(pikemanSamples));
 await page.screenshot({path:resolve(reportDir,'ffa-pikeman-player-hit.png'),
   fullPage:true});
 assert(pikemanDamaged,'Real FFA pikeman did not land genuine melee damage: '+
   JSON.stringify(pikemanSamples));
 const pikeFinal=pikemanSamples[pikemanSamples.length-1];
 assert.equal(pikeFinal.phase,'playing');
 assert.match(pikeFinal.hud,/^\d+\s*\/\s*\d+$/);
 assert.equal(Number(pikeFinal.hud.split('/')[0].trim()),
   Math.ceil(pikeFinal.hp),'Pikeman hit not reflected on HUD');
 const pikeDamage=pikemanFixture.playerHp-pikeFinal.hp;
 assert.equal(pikeDamage,35,'Actual pike damage changed from approved body 35');
 notes.checks.push('PASS_FIXTURE_ASSISTED_REAL_BROWSER_PIKEMAN_HIT: '+
   'player HP '+pikemanFixture.playerHp+' -> '+pikeFinal.hp+
   ', pike 0.40s windup and 35 body damage intact');
 // Ranged tests use a browser-session-only controlled close encounter. Keep
 // unmodified weapon spread, 3s bow draw, 15s musket cadence, hitscan/Box3
 // collision, AI windup and HUD update in the native requestAnimationFrame loop.
 // Only navigation and rival positions are frozen by the TEST FIXTURE, never
 // in production or in the published combined HTML.
 const testRangedRole=async role=>{
   const first=await ffaCombat.locator('body').evaluate((_body,role)=>{
     const p=window.eval('player'),bots=window.eval('bots');
     const attacker=bots.find(b=>b.role===role&&!b.dead);
     const choose=window.eval('chooseArenaTarget');
     const see=window.eval('arenaLineOfSight');
     if(!attacker||!p||!choose||!see)throw Error('Missing original FFA '+role);
     const ground=p.pos.y-p.currentHeight;
     // Preserve all six living bots while keeping only the test shooter nearby.
     for(const b of bots){
       if(b===attacker)continue;
       b.mesh.position.set(p.pos.x+370+b.id*12,ground,
         p.pos.z+380+b.id*7);
       b.attackTimer=9999;b.rangedWindup=0;b.meleeWindup=0;
       b.arenaTargetType=null;b.arenaTargetId=null;
       b.arenaAggroType=null;b.arenaAggroUntil=0;b.arenaLockTime=0;
     }
     // Preflight real unmodified 3D hit volumes / world obstruction over
     // a small fixed aim grid. This is a READ-ONLY geometry probe; it does
     // not fire a shot, override random spread, or alter live weapon damage.
     // A valid LOS to the actor's CENTER does not guarantee that its
     // anatomically shaped hit volumes are intersected by a spread shot.
     const options=[[3,3],[-3,-3],[3,-3],[-3,3],
       [4,4],[-4,4],[4,-4],[-4,-4],[7,0],[0,7]];
     const rolls=[.05,.275,.5,.725,.95];
     const aim=window.ArenaWeaponBalance.aimedShot;
     const collide=window.ArenaCombatHit3D.resolvePlayer;
     const blocked=window.eval('arenaWorldBlockBetween');
     const THREE=window.THREE;
     const trialScores=[];
     let offset=null,bestHitGrid=-1;
     for(const [dx,dz] of options){
       attacker.mesh.position.set(p.pos.x+dx,ground,p.pos.z+dz);
       if(!see(attacker,p.pos,true)){
         trialScores.push({offset:[dx,dz],centerVisible:false,hits:0});
         continue;
       }
       const origin=attacker.mesh.position.clone().add(
         new THREE.Vector3(0,1.8,0));
       const base={x:p.pos.x,y:ground,z:p.pos.z};
       let hits=0;
       for(const a of rolls)for(const b of rolls){
         const point=aim(role,origin,base,a,b,3).point;
         if(!point)continue;
         const impact=collide(THREE,origin,
           new THREE.Vector3(point.x,point.y,point.z),p);
         if(impact&&!blocked(origin,impact.point))hits++;
       }
       trialScores.push({offset:[dx,dz],centerVisible:true,hits});
       if(hits>bestHitGrid){bestHitGrid=hits;offset=[dx,dz];}
     }
     if(!offset||bestHitGrid<20)throw Error('No high-confidence open '+
       role+' 3D hit position in real scene: '+JSON.stringify(trialScores));
     attacker.mesh.position.set(p.pos.x+offset[0],ground,
       p.pos.z+offset[1]);
     // Stationary target practice; attack direction/draw/shot remain native.
     attacker.tacticMode='hold';attacker.tacticGoal=null;
     attacker.tacticTargetKey='player:player';
     attacker.tacticLastTarget=p.pos.clone();attacker.tacticRefresh=10000;
     attacker.navPath.length=0;attacker.navGoal=null;
     attacker.navRecovery=window.ArenaBotRecovery.create();
     attacker.arenaTargetType=null;attacker.arenaTargetId=null;
     attacker.arenaLockTime=0;attacker.arenaAggroType=null;
     attacker.arenaAggroUntil=0;
     attacker.meleeWindup=0;attacker.rangedWindup=0;
     attacker.windupTargetKey=null;attacker.staggerTime=0;
     attacker.attackTimer=0;
     const priorShotAt=Number.isFinite(attacker.lastRangedShotAt)
       ?attacker.lastRangedShotAt:null;
     // Fresh first round in this isolated encounter. Original post-shot
     // cadence is still enforced by the live weapon system.
     attacker.lastRangedShotAt=-Infinity;
     attacker.mesh.rotation.y=Math.atan2(
       p.pos.x-attacker.mesh.position.x,p.pos.z-attacker.mesh.position.z);
     p.hp=p.maxHp;p.isShielding=false;p.shieldParryTime=0;
     window.eval('updateHUD()');
     const picked=choose(attacker);
     const shots=window.krunkerArenaStatus().telemetry.rangedFire[role];
     return {role,id:attacker.id,weapon:attacker.weapon,
       offset,predictedHits:bestHitGrid,trialScores,target:picked?.type,locked:attacker.arenaTargetType,
       visible:see(attacker,p.pos,true),hp:p.hp,deaths:p.deaths,
       shots:shots.shots,hits:shots.hits,
       startClock:window.eval('arenaClock'),priorShotAt};
   },role);
   notes.checks.push('RANGED CONTROLLED BROWSER FIXTURE '+role+': '+
      JSON.stringify(first));
   assert.equal(first.target,'player',role+' did not select human normally');
   assert.equal(first.locked,'player');
   assert(first.visible,role+' lacks unobstructed sight');
   let fired=false,damaged=false,shotTime=null;
   const observations=[];
   for(let i=0;i<20;i++){
     await page.waitForTimeout(5500);
     const s=await ffaCombat.locator('body').evaluate((_body,{role,id})=>{
       const st=window.krunkerArenaStatus(),p=window.eval('player');
       const b=window.eval('bots').find(e=>e.id===id);
       const fire=st.telemetry.rangedFire[role];
       return {clock:window.eval('arenaClock'),hp:p.hp,deaths:p.deaths,
         hud:document.querySelector('#hud-hp-text')?.textContent,
         phase:st.matchPhase,target:b?.arenaTargetType,
         windup:b?.rangedWindup,attackTimer:b?.attackTimer,
         shotAt:Number.isFinite(b?.lastRangedShotAt)?b.lastRangedShotAt:null,
         shots:fire.shots,hits:fire.hits};
     },{role,id:first.id});
     observations.push(s);
     if(s.shots>first.shots){fired=true;if(shotTime===null)shotTime=s.shotAt;}
     if(s.hp<first.hp||s.deaths>first.deaths){damaged=true;break;}
   }
   notes.checks.push('RANGED '+role+' LIVE FRAME LOOP: '+
     JSON.stringify({fixture:first,observations}).slice(0,13000));
   await page.screenshot({path:resolve(reportDir,'ffa-'+role+'-player-hit.png'),
     fullPage:true});
   assert(fired,role+' never fired a real round: '+JSON.stringify(observations));
   assert(shotTime!==null,role+' missing absolute shot time');
   assert(shotTime-first.startClock>=(role==='archer'?.47:0.28),
     role+' fired without full original windup');
   assert(damaged,role+' failed to lower player HP in a controlled real '+
     'browser encounter: '+JSON.stringify(observations));
   const final=observations[observations.length-1];
   assert(final.hits>first.hits,role+' real 3D hit counter did not increase');
   assert.equal(final.phase,'playing',role+' encounter stopped');
   assert.match(final.hud,/^\d+\s*\/\s*\d+$/,role+' HUD missing');
   assert.equal(Number(final.hud.split('/')[0].trim()),Math.ceil(final.hp),
     role+' visible HUD does not match actual player HP');
   notes.checks.push('PASS_FIXTURE_ASSISTED_REAL_BROWSER_'+
      role.toUpperCase()+'_HIT: player HP '+first.hp+' -> '+final.hp+
      ', real shots '+first.shots+' -> '+final.shots+
      ', hits '+first.hits+' -> '+final.hits+
      ', original attack time '+(shotTime-first.startClock).toFixed(2)+'s');
 };
 await testRangedRole('archer');
 await testRangedRole('musket');
 // Independent natural-map investigation: start a FRESH actual FFA meadow
 // match with real UI buttons. Do not relocate, freeze, choose targets for,
 // rearm, reset timers for, or override any bot/player. Unlike the earlier
 // close-range fixtures, only the game's native updateGame(dt) is invoked
 // to fast-step a naturally spawned FFA match (0.05s per tick). This runs
 // real targeting, movement, navigation, attack timing, hit geometry, HUD,
 // and all six bot brains in actual Chromium DOM, without GPU render per
 // accelerated tick. It is NOT a claim of RAF realtime/GPU performance.
 await page.reload({waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('[data-ktk-launch]').count(),2,
   'Natural experiment must begin in a clean dual-mode launcher');
 await enterFFA('meadow');
 const freshFFA=page.frameLocator('#stage iframe');
 const naturalStart=await freshFFA.locator('body').evaluate(()=>{
   const st=window.krunkerArenaStatus(),p=window.eval('player');
   const b=window.eval('bots');
   return {phase:st.matchPhase,map:st.map,botCount:b.length,
     simClock:window.eval('arenaClock'),hp:p.hp,deaths:p.deaths,
     positions:b.map(x=>({id:x.id,role:x.role,x:x.mesh.position.x,
       z:x.mesh.position.z,target:x.arenaTargetType,
       distance:Math.hypot(x.mesh.position.x-p.pos.x,
         x.mesh.position.z-p.pos.z)}))};
 });
 notes.checks.push('NATURAL FAST-STEP CONTROL: no actor reposition/AI '+
   'override, fresh menu-launched meadow: '+JSON.stringify(naturalStart));
 assert.equal(naturalStart.phase,'playing');
 assert.equal(naturalStart.botCount,6);
 const naturalTrace={
   kind:'NATIVE_BROWSER_GAME_UPDATE_NO_REPOSITION_NO_RENDER_ACCELERATED',
   purpose:'Natural FFA target/approach/attack/player damage, not real-time FPS',
   initial:naturalStart,gameSecondsPerTick:.05,batches:[],
   playerDamageEvents:[],playerTargetedFires:[],playerTargetedMelee:[],
   playerChases:[],result:'NOT_YET_OBSERVED'
 };
 let simulatedFrames=0;
 for(let batch=0;batch<15;batch++){
   const snap=await freshFFA.locator('body').evaluate((_body,frames)=>{
     const update=window.eval('updateGame');
     const p=window.eval('player'),bots=window.eval('bots');
     if(typeof update!=='function')throw Error('Real FFA native updateGame missing');
     const hpBefore=p.hp,deathsBefore=p.deaths;
     const starts=bots.map(b=>({id:b.id,x:b.mesh.position.x,
       z:b.mesh.position.z,target:b.arenaTargetType}));
     const damage=[],shots=[],melee=[],chases=[];
     let targetedFrames=0,botFightFrames=0,highestPursuers=0;
     const elapsedStart=window.eval('arenaClock');
     const t0=performance.now();
     for(let i=0;i<frames;i++){
       if(window.krunkerArenaStatus().matchPhase!=='playing')break;
       const prevHP=p.hp,prevDeaths=p.deaths;
       const previous=bots.map(b=>({id:b.id,shot:b.lastRangedShotAt,
         melee:b.meleeWindup,target:b.arenaTargetType,
         x:b.mesh.position.x,z:b.mesh.position.z}));
       update(.05); // Actual source, 100% native AI/combat. No direct attack.
       const clock=window.eval('arenaClock');
       const hunters=bots.filter(b=>!b.dead&&b.arenaTargetType==='player');
       if(hunters.length>highestPursuers)highestPursuers=hunters.length;
       targetedFrames+=hunters.length;
       botFightFrames+=bots.filter(b=>!b.dead&&b.arenaTargetType==='bot').length;
       if(p.hp<prevHP-1e-6||p.deaths>prevDeaths)
         damage.push({clock,hpBefore:prevHP,hpAfter:p.hp,
           deathsBefore:prevDeaths,deathsAfter:p.deaths});
       for(let k=0;k<bots.length;k++){
         const b=bots[k],v=previous[k];
         if((b.role==='archer'||b.role==='musket')&&
           b.lastRangedShotAt!==v.shot&&
           Number.isFinite(b.lastRangedShotAt))
           shots.push({clock,id:b.id,role:b.role,
             targetBefore:v.target,targetAfter:b.arenaTargetType,
             shotAt:b.lastRangedShotAt});
         if((b.role==='knight'||b.role==='pikeman')&&
           v.melee>0&&b.meleeWindup<=0)
           melee.push({clock,id:b.id,role:b.role,
             targetBefore:v.target,targetAfter:b.arenaTargetType});
         if(v.target==='player'||b.arenaTargetType==='player'){
           const before=Math.hypot(v.x-p.pos.x,v.z-p.pos.z);
           const after=Math.hypot(b.mesh.position.x-p.pos.x,
             b.mesh.position.z-p.pos.z);
           if(after<before-.05)
             chases.push({clock,id:b.id,role:b.role,
               from:before,to:after});
         }
       }
     }
     const stat=window.krunkerArenaStatus();
     return {elapsedStart,elapsedEnd:window.eval('arenaClock'),
       cpuMs:performance.now()-t0,phase:stat.matchPhase,
       hpBefore,hpAfter:p.hp,deathsBefore,deathsAfter:p.deaths,
       hud:document.querySelector('#hud-hp-text')?.textContent,
       targetFrames:targetedFrames,botFightFrames,
       highestPursuers,damage,shots,melee,
       chases:chases.slice(0,14),
       final:bots.map(b=>({id:b.id,role:b.role,
         x:b.mesh.position.x,z:b.mesh.position.z,
         target:b.arenaTargetType,dead:b.dead,
         distToPlayer:Math.hypot(b.mesh.position.x-p.pos.x,
           b.mesh.position.z-p.pos.z)})),
       totalShotCounters:stat.telemetry.rangedFire};
   },80);
   simulatedFrames+=Math.round((snap.elapsedEnd-snap.elapsedStart)/.05);
   naturalTrace.batches.push({...snap,
     damage:snap.damage.slice(0,12),shots:snap.shots.slice(0,18),
     melee:snap.melee.slice(0,18)});
   naturalTrace.playerDamageEvents.push(...snap.damage);
   naturalTrace.playerTargetedFires.push(...snap.shots.filter(s=>
     s.targetBefore==='player'||s.targetAfter==='player'));
   naturalTrace.playerTargetedMelee.push(...snap.melee.filter(s=>
     s.targetBefore==='player'||s.targetAfter==='player'));
   naturalTrace.playerChases.push(...snap.chases);
   if(naturalTrace.playerDamageEvents.length>=1&&
     (naturalTrace.playerTargetedFires.length+
      naturalTrace.playerTargetedMelee.length)>=1)break;
   if(snap.phase!=='playing')break;
 }
 naturalTrace.simulatedFrames=simulatedFrames;
 naturalTrace.totalSimulatedSeconds=naturalTrace.batches.reduce((s,b)=>
   s+b.elapsedEnd-b.elapsedStart,0);
 naturalTrace.playerTargetTotalFrames=naturalTrace.batches.reduce((s,b)=>
   s+b.targetFrames,0);
 naturalTrace.botVsBotTotalFrames=naturalTrace.batches.reduce((s,b)=>
   s+b.botFightFrames,0);
 naturalTrace.result=naturalTrace.playerDamageEvents.length>0
   ?'NATURAL_PLAYER_HP_DAMAGE_CONFIRMED'
   :naturalTrace.playerTargetedFires.length>0
     ?'NATURAL_PLAYER_TARGETED_SHOTS_OBSERVED_NO_HP_DAMAGE'
     :'NATURAL_TARGETING_OBSERVED_WITHOUT_CONFIRMED_SHOT';
 notes.naturalMatch=naturalTrace;
 notes.checks.push('NATURAL UNMODIFIED MATCH native logic fast-step: '+
   JSON.stringify({kind:naturalTrace.kind,result:naturalTrace.result,
     simulatedSeconds:naturalTrace.totalSimulatedSeconds,
     targetedFrames:naturalTrace.playerTargetTotalFrames,
     botFightFrames:naturalTrace.botVsBotTotalFrames,
     targetedShots:naturalTrace.playerTargetedFires.slice(0,8),
     targetedMelee:naturalTrace.playerTargetedMelee.slice(0,8),
     damageEvents:naturalTrace.playerDamageEvents.slice(0,8),
     chases:naturalTrace.playerChases.slice(0,8)}));
 assert(naturalTrace.totalSimulatedSeconds>=2,
   'Natural FFA native logic failed to advance after clean UI start');
 assert(naturalTrace.playerTargetTotalFrames>0,
   'Normal six-bot FFA never targeted the player during native simulation');
 assert(naturalTrace.botVsBotTotalFrames>0,
   'FFA must continue bot-vs-bot fights; no everyone-targets-player regressions');
 if(naturalTrace.playerDamageEvents.length){
   const last=naturalTrace.batches[naturalTrace.batches.length-1];
   assert.match(last.hud,/^\d+\s*\/\s*\d+$/,
     'HUD missing after naturally inflicted player damage');
   assert.equal(Number(last.hud.split('/')[0]),Math.ceil(last.hpAfter),
     'Natural damage left incorrect player HP HUD');
   notes.checks.push('PASS_NATURAL_SPAWN_NO_MANUAL_ACTOR_CHANGES: '+
     'real AI native engine ticks naturally wounded player at least once');
 }else{
   notes.checks.push('OPEN_NATURAL_DAMAGE_PROOF: no player HP reduction '+
     'in '+naturalTrace.totalSimulatedSeconds.toFixed(1)+
     's native fast-step; test is explicitly INCONCLUSIVE, not PASS');
 }
 writeFileSync(resolve(reportDir,'ffa-natural-spawn-native-match.json'),
   JSON.stringify(naturalTrace,null,2)+'\n');
 await page.screenshot({path:resolve(reportDir,
   'ffa-natural-spawn-after-native-match.png'),fullPage:true});
 // Continue the SAME naturally spawned match to the full four-minute result.
 // This is an accelerated NATIVE updateGame(.05) test in a real Chromium DOM,
 // not 4 wall-clock minutes, RAF/FPS validation, hardware GPU, or a bot fixture.
 // No actor positions, AI state, target choice, reloads or HP are manipulated.
 const fullRound={
   kind:'NATURAL_240_SECOND_FFA_NATIVE_UPDATE_NO_RENDER_ACCELERATION',
   environment:'Chromium DOM/real Three.js modules, manual updateGame(.05)',
   didManipulateActors:false,startMatchSeconds:naturalTrace.totalSimulatedSeconds,
   ticksAfterEarlyProof:0,batches:[],totals:{targetPlayerFrames:0,
     targetBotFrames:0,targetChanges:0,naturalShots:0,
     naturalMeleeCompletes:0,botDeaths:0,botRespawns:0,
     playerHitEvents:0,playerDeaths:0,invalidTargetTicks:0,
     excessPlayerHunterTicks:0,nonFinitePositionTicks:0,
     cadenceViolations:0,approachTicks:0},
   result:'RUNNING'
 };
 for(let batch=0;batch<45;batch++){
   const item=await freshFFA.locator('body').evaluate((_body,limit)=>{
     const update=window.eval('updateGame');
     const match=window.eval('arenaMatch'),p=window.eval('player');
     const bots=window.eval('bots');
     const counters={targetPlayerFrames:0,targetBotFrames:0,
       targetChanges:0,naturalShots:0,naturalMeleeCompletes:0,
       botDeaths:0,botRespawns:0,playerHitEvents:0,playerDeaths:0,
       invalidTargetTicks:0,excessPlayerHunterTicks:0,
       nonFinitePositionTicks:0,cadenceViolations:0,approachTicks:0};
     const events={targetChanges:[],shots:[],melee:[],
       botDeaths:[],botRespawns:[],playerHits:[],playerDeaths:[],
       suspicious:[]};
     const startRemaining=match.remaining;
     const cpuStarted=performance.now();
     let steps=0,maxNavStuck=0;
     for(let i=0;i<limit&&match.phase==='playing';i++){
       const previousHP=p.hp,previousDeaths=p.deaths;
       const old=bots.map(b=>({
         x:b.mesh.position.x,z:b.mesh.position.z,
         target:b.arenaTargetType,targetId:b.arenaTargetId,
         dead:b.dead,shot:b.lastRangedShotAt,
         melee:b.meleeWindup,health:b.hp}));
       update(.05);steps++;
       const elapsed=match.durationSeconds-match.remaining;
       const hunters=bots.filter(b=>!b.dead&&b.arenaTargetType==='player');
       counters.targetPlayerFrames+=hunters.length;
       counters.targetBotFrames+=bots.filter(b=>
         !b.dead&&b.arenaTargetType==='bot').length;
       if(hunters.length>2)counters.excessPlayerHunterTicks++;
       if(p.hp<previousHP-1e-6){
         counters.playerHitEvents++;
         if(events.playerHits.length<20)events.playerHits.push({
           at:elapsed,from:previousHP,to:p.hp});
       }
       if(p.deaths>previousDeaths){
         counters.playerDeaths+=p.deaths-previousDeaths;
         if(events.playerDeaths.length<12)events.playerDeaths.push({
           at:elapsed,from:previousDeaths,to:p.deaths,hp:p.hp});
       }
       for(let j=0;j<bots.length;j++){
         const b=bots[j],before=old[j];
         if(!Number.isFinite(b.mesh.position.x)||
           !Number.isFinite(b.mesh.position.z)||
           !Number.isFinite(b.hp))counters.nonFinitePositionTicks++;
         if(Number.isFinite(b.navStuck))
           maxNavStuck=Math.max(maxNavStuck,b.navStuck);
         if(!b.dead&&b.arenaTargetType==='bot'&&
            (b.arenaTargetId===b.id||
             !bots.some(q=>q.id===b.arenaTargetId)))
           counters.invalidTargetTicks++;
         if(b.arenaTargetType!==before.target||
            b.arenaTargetId!==before.targetId){
           counters.targetChanges++;
           if(events.targetChanges.length<28)
             events.targetChanges.push({at:elapsed,id:b.id,
               was:before.target,now:b.arenaTargetType,
               oldTargetId:before.targetId,targetId:b.arenaTargetId});
         }
         if(b.dead&&!before.dead){
           counters.botDeaths++;
           if(events.botDeaths.length<18)
             events.botDeaths.push({at:elapsed,id:b.id,
               role:b.role,deathCount:b.arenaDeaths});
         }
         if(!b.dead&&before.dead){
           counters.botRespawns++;
           if(events.botRespawns.length<18)
             events.botRespawns.push({at:elapsed,id:b.id,
               hp:b.hp,maxHp:b.maxHp,spawnPos:b.mesh.position.toArray()});
         }
         if((b.role==='musket'||b.role==='archer')&&
            Number.isFinite(b.lastRangedShotAt)&&
            b.lastRangedShotAt!==before.shot){
           counters.naturalShots++;
           const interval=b.role==='archer'?4:15;
           const cooldownGap=Number.isFinite(before.shot)
             ?b.lastRangedShotAt-before.shot:null;
           if(cooldownGap!==null&&cooldownGap<interval-.06)
             counters.cadenceViolations++;
           if(events.shots.length<24)
             events.shots.push({at:elapsed,id:b.id,role:b.role,
               gap:cooldownGap,atPlayer:before.target==='player'||
               b.arenaTargetType==='player'});
         }
         if((b.role==='knight'||b.role==='pikeman')&&
            before.melee>0&&b.meleeWindup<=0){
           counters.naturalMeleeCompletes++;
           if(events.melee.length<24)
             events.melee.push({at:elapsed,id:b.id,role:b.role,
               target:before.target});
         }
         if(!b.dead&&b.arenaTargetType==='player'){
           const nowDist=Math.hypot(b.mesh.position.x-p.pos.x,
             b.mesh.position.z-p.pos.z);
           const prevDist=Math.hypot(before.x-p.pos.x,
             before.z-p.pos.z);
           if(nowDist<prevDist-.05)counters.approachTicks++;
         }
       }
     }
     const st=window.krunkerArenaStatus();
     return {startRemaining,endRemaining:match.remaining,
       phase:match.phase,steps,cpuMs:performance.now()-cpuStarted,
       counters,maxNavStuck,
       events,player:{hp:p.hp,deaths:p.deaths,kills:p.kills},
       botCount:bots.length,
       bots:bots.map(b=>({id:b.id,role:b.role,
         dead:b.dead,hp:b.hp,arenaKills:b.arenaKills,
         arenaDeaths:b.arenaDeaths})),
       finalTelemetry:st.telemetry,matchResults:st.matchResults,
       standings:st.matchStandings,
       resultsShown:!document.getElementById('match-results-overlay')
         ?.classList.contains('hidden'),
       scoreboardRows:document.getElementById('match-results-table')
         ?.children.length,
       hudClock:document.getElementById('hud-timer')?.textContent};
   },120);
   fullRound.ticksAfterEarlyProof+=item.steps;
   fullRound.batches.push(item);
   for(const key of Object.keys(fullRound.totals))
     fullRound.totals[key]+=item.counters[key];
   notes.longMatchProgress={batches:fullRound.batches.length,
     matchElapsed:240-item.endRemaining,remaining:item.endRemaining,
     botDeaths:fullRound.totals.botDeaths,
     botRespawns:fullRound.totals.botRespawns,
     playerDeaths:fullRound.totals.playerDeaths};
   // Persist progress each batch in case a later one encounters an engine bug.
   writeFileSync(resolve(reportDir,'ffa-natural-240s-match.json'),
     JSON.stringify(fullRound,null,2)+'\n');
   if(item.phase!=='playing')break;
 }
 const finalRound=fullRound.batches.at(-1);
 fullRound.elapsedSeconds=240-finalRound.endRemaining;
 fullRound.result=finalRound.phase==='results'&&
   finalRound.endRemaining<.0001
   ?'FULL_240_SECOND_GAME_REACHED_RESULTS'
   :'INCOMPLETE_OR_WRONG_MATCH_END_STATE';
 notes.longMatch= {
   result:fullRound.result,elapsedSeconds:fullRound.elapsedSeconds,
   batches:fullRound.batches.length,totals:fullRound.totals,
   finalPhase:finalRound.phase,remaining:finalRound.endRemaining,
   matchResults:finalRound.matchResults,
   scoreRows:finalRound.scoreboardRows,
   botDeaths:finalRound.bots.map(b=>({id:b.id,
     deaths:b.arenaDeaths,kills:b.arenaKills})),
   player:finalRound.player,
   rangedFire:finalRound.finalTelemetry?.rangedFire,
   targetSlots:finalRound.finalTelemetry?.targetSlots
 };
 notes.checks.push('NATURAL 240 SECOND MATCH (unmodified six AI bots, no render '+
   'during native accelerated ticks): '+JSON.stringify(notes.longMatch));
 writeFileSync(resolve(reportDir,'ffa-natural-240s-match.json'),
   JSON.stringify(fullRound,null,2)+'\n');
 await page.screenshot({path:resolve(reportDir,'ffa-natural-240s-results.png'),
   fullPage:true});
 assert.equal(fullRound.result,'FULL_240_SECOND_GAME_REACHED_RESULTS',
   'Natural four-minute match did not reach a valid end state');
 assert.equal(finalRound.phase,'results');
 assert.equal(finalRound.endRemaining,0);
 assert.equal(finalRound.hudClock,'00:00');
 assert.equal(finalRound.botCount,6);
 assert.equal(finalRound.resultsShown,true,
   'Real end-of-game results overlay is hidden');
 assert.equal(finalRound.scoreboardRows,7,
   'Final FFA scoreboard should show one human and six bots');
 assert.equal(finalRound.standings.length,7);
 assert.equal(finalRound.matchResults.standings.length,7);
 assert.equal(finalRound.matchResults.seconds,240);
 assert(finalRound.matchResults.winnerId==='player'||
   /^bot:[0-5]$/.test(finalRound.matchResults.winnerId),
   'Result winner is not one of the actual combatants');
 assert(fullRound.totals.targetBotFrames>0,
   'FFA bots stopped competing with each other');
 assert.equal(fullRound.totals.nonFinitePositionTicks,0,
   'Non-finite actor positions or HP in natural four-minute match');
 assert.equal(fullRound.totals.invalidTargetTicks,0,
   'Self-target or missing bot ID in natural four-minute match');
 assert.equal(fullRound.totals.cadenceViolations,0,
   'Ranged bot fired before approved bow 4s/musket 15s interval');
 assert(finalRound.finalTelemetry.kills.botToBot+
   finalRound.finalTelemetry.kills.botToPlayer>0,
   'No true combat kill was produced across full four-minute FFA');
 const botDeathSum=finalRound.bots.reduce((v,b)=>v+b.arenaDeaths,0);
 assert.equal(finalRound.finalTelemetry.kills.botToBot,botDeathSum,
   'Bot-vs-bot telemetry kills do not reconcile with bot deaths');
 assert.equal(finalRound.finalTelemetry.kills.botToPlayer,
   finalRound.player.deaths,
   'Player death counter differs from native kill telemetry');
 if(fullRound.totals.botDeaths>0){
   assert(fullRound.totals.botRespawns>0,
     'Natural FFA bot never respawned after a detected death');
 }
 notes.checks.push('PASS_NATURAL_240_SEC_FFA_MATCH_END_SCOREBOARD_AND_COMBAT: '+
   'valid 00:00 end, winner+7 rows, true kills, real AI targeting, '+
   'zero invalid targets/nonfinite states/early ranged shots; '+
   'deaths='+fullRound.totals.botDeaths+
   ' respawns='+fullRound.totals.botRespawns);
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
