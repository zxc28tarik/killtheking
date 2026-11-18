/** Kill the King: independent castle real-browser camera/collision/render acceptance.
 * The original shipped game, weapon balance and AI never change.
 * Real input + requestAnimationFrame are exercised on actual Chromium WebGL.
 * Collision probes use the genuine live castle AABB set and source solver,
 * not fake boxes. This is software SwiftShader, NOT hardware GPU/60 FPS acceptance.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const file=process.argv[2];
if(!file)throw Error('Usage: node browser_castle_collision_camera_render.mjs COMBINED_HTML');
const reportDir=resolve(process.env.KTK_BROWSER_REPORT_DIR||
  'recovered/army/integration/browser-evidence-castle');
mkdirSync(reportDir,{recursive:true});
const report={kind:'CASTLE_CHROMIUM_SOFTWARE_WEBGL_INPUT_COLLISION',
  source:'real FFA castle scene in unmodified isolated dual-mode HTML',
  approval:'TEST_ONLY_NOT_REAL_HARDWARE_ACCEPTANCE',checks:[],result:'RUNNING',
  pageErrors:[],consoleErrors:[]};
const save=()=>writeFileSync(resolve(reportDir,'castle-browser-acceptance.json'),
  JSON.stringify(report,null,2)+'\n');
let browser;
try{
 browser=await chromium.launch({headless:true,
   executablePath:process.env.KTK_CHROME_EXECUTABLE||undefined,
   args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl',
     '--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1100,height:680},deviceScaleFactor:1});
 page.setDefaultTimeout(35000);
 page.on('pageerror',e=>report.pageErrors.push(String(e.message||e)));
 page.on('console',e=>{if(e.type()==='error')
   report.consoleErrors.push(e.text().slice(0,240));});
 await page.goto(pathToFileURL(resolve(file)).href,{waitUntil:'domcontentloaded'});
 await page.locator('[data-ktk-launch="ffa"]').click();
 const f=page.frameLocator('#stage iframe');
 await f.locator('#play-btn').waitFor({state:'visible',timeout:45000});
 await f.locator('#game-canvas').waitFor({state:'attached'});
 await f.locator('#card-class-0').click();
 await f.locator('#play-btn').click();
 await page.waitForTimeout(5500);
 const snapshot=()=>f.locator('body').evaluate(()=>{
   const player=window.eval('player'),status=window.krunkerArenaStatus();
   const c=document.getElementById('game-canvas'),
     gl=c.getContext('webgl2')||c.getContext('webgl');
   return {match:status.matchPhase,map:status.map,
     clock:status.matchDurationSeconds-status.matchRemaining,
     pointerLocked:document.pointerLockElement===c,
     menuHidden:document.getElementById('menu-overlay').classList.contains('hidden'),
     canvas:{width:c.width,height:c.height,
       webgl:!!gl,contextLost:gl?.isContextLost()??true},
     yaw:player.yaw,pitch:player.pitch,
     player:{x:player.pos.x,y:player.pos.y,z:player.pos.z,
       hp:player.hp,onGround:player.onGround,radius:player.radius,
       height:player.currentHeight},
     perf:window.krunkerPerformanceReport(),
     collisions:window.eval('colliders').length,
     originalBotArcherDraw:window.ArenaBotOffense.windup('archer'),
     originalPlayerBowMin:window.ArenaWeaponBalance.BOW_MIN_DRAW_SECONDS,
     originalPlayerBowFull:window.ArenaWeaponBalance.BOW_DRAW_SECONDS};
 });
 const started=await snapshot();
 report.initial=started;
 assert.equal(started.match,'playing','Castle must be playing after real Start click');
 assert.equal(started.map,'castle','Expected original castle instead of meadow');
 assert(started.canvas.webgl&&!started.canvas.contextLost,
   'Live Three.js WebGL context missing/lost');
 assert(started.canvas.width>=320&&started.canvas.height>=200);
 assert(started.collisions>30,'Real original castle AABB list unexpectedly empty');
 assert.equal(started.originalBotArcherDraw,.5);
 assert.equal(started.originalPlayerBowMin,2);
 assert.equal(started.originalPlayerBowFull,3);
 report.checks.push('PASS_CASTLE_ORIGINAL_REAL_WEBGL_STARTED: '+
   JSON.stringify({clock:started.clock,colliders:started.collisions,
     webgl:started.canvas.webgl,pointerLocked:started.pointerLocked}));

 // Real pointer lock and mouse movements (no direct yaw/pitch game-state edits).
 // Pointerlock request in Chromium SwiftShader is a genuine browser API action.
 if(started.pointerLocked){
   await page.mouse.move(545,320);
   await page.mouse.move(575,338,{steps:2});
   await page.waitForTimeout(1200);
   const turned=await snapshot();
   report.mouse={before:{yaw:started.yaw,pitch:started.pitch},
     after:{yaw:turned.yaw,pitch:turned.pitch},
     pointerLockedAfter:turned.pointerLocked};
   assert(turned.pointerLocked,'Canvas unexpectedly lost pointer lock during camera input');
   assert(Math.abs(turned.yaw-started.yaw)>1e-4||
     Math.abs(turned.pitch-started.pitch)>1e-4,
     'Physical mouse did not move live player yaw/pitch while pointer-locked');
   report.checks.push('PASS_PHYSICAL_MOUSE_CAMERA_ROTATION: '+JSON.stringify(report.mouse));
 }else{
   report.checks.push('HEADLESS_LIMITATION: pointer lock missing after Play; physical mouse camera proof OPEN');
   report.mouse={verified:false,reason:'No headless pointer lock'};
 }
 // Real hardware-like key presses during unaccelerated native RAF frames.
 const beforeMove=await snapshot();
 await page.keyboard.down('w');
 await page.waitForTimeout(3400);
 await page.keyboard.up('w');
 const afterMove=await snapshot();
 const movement=Math.hypot(afterMove.player.x-beforeMove.player.x,
   afterMove.player.z-beforeMove.player.z);
 report.keyboard={movement,before:beforeMove.player,after:afterMove.player,
   clockAdvanced:afterMove.clock-beforeMove.clock};
 assert(afterMove.match==='playing');
 assert(Number.isFinite(movement));
 assert(movement>.015,'Physical KeyW did not change genuine player position in RAF loop');
 report.checks.push('PASS_REAL_KEYBOARD_W_MOVES_PLAYER: '+JSON.stringify(report.keyboard));

 // LIVE scene world-collider probe. We never insert a synthetic collider and
 // NEVER move the actual player for this test. Pick real castle walls and make
 // high-speed sweeps (>100 m/s) toward their boundary on X and Z.
 // The original ArenaPlayerCollision.move/overlaps code MUST prevent tunneling.
 const collision=await f.locator('body').evaluate(()=>{
   const api=window.ArenaPlayerCollision;
   const walls=window.eval('colliders'),p=window.eval('player');
   const radius=p.radius,h=p.currentHeight;
   if(!api?.move||!api?.overlaps)throw Error('Native castle sweep solver unavailable');
   const probes=[],skips={vertical:0,overlap:0,noHit:0};
   const unique=new Set();
   for(let i=0;i<walls.length;i++){
     const c=walls[i],spanY=c.maxY-c.minY;
     if(spanY<2.2||(c.maxX-c.minX)<1.5||(c.maxZ-c.minZ)<1.5){
       skips.vertical++;continue;
     }
     // Test both axes against the collider's near face, with feet inside
     // its vertical blocking interval. No artificial wall placement.
     for(const axis of ['x','z']){
       if(probes.filter(q=>q.axis===axis).length>=6)continue;
       const foot=c.minY+.12;
       const y=foot+h;
       const from=axis==='x'
         ?{x:c.minX-radius-1.75,y,z:(c.minZ+c.maxZ)*.5}
         :{x:(c.minX+c.maxX)*.5,y,z:c.minZ-radius-1.75};
       if(api.overlaps(from,radius,h,walls)){
         skips.overlap++;continue;
       }
       const velocity=axis==='x'?{x:280,z:0}:{x:0,z:280};
       const end=api.move({from,velocity,dt:.05,radius,height:h,
         colliders:walls});
       if(!end[axis==='x'?'hitX':'hitZ']){
         skips.noHit++;continue;
       }
       const boundary=axis==='x'?c.minX-radius:c.minZ-radius;
       const out={x:end.x,y,z:end.z};
       const notThrough=end[axis]<=boundary+.004;
       const notEmbedded=!api.overlaps(out,radius,h,walls);
       probes.push({wallIndex:i,axis,from,end,
         boundary,notThrough,notEmbedded,speed:280});
       unique.add(i);
     }
     if(probes.length>=8&&unique.size>=4)break;
   }
   return {colliders:walls.length,probes,wallCount:unique.size,
     xCount:probes.filter(x=>x.axis==='x').length,
     zCount:probes.filter(x=>x.axis==='z').length,
     skips};
 });
 report.wallSweeps=collision;
 assert(collision.probes.length>=4&&collision.wallCount>=2,
   'Not enough usable REAL castle walls for high-speed collision probes: '+
   JSON.stringify(collision));
 assert(collision.xCount>=1&&collision.zCount>=1,
   'Collision tests did not cover X and Z wall faces');
 assert(collision.probes.every(x=>x.notThrough&&x.notEmbedded),
   'Live castle wall tunneling or embedded player detected: '+
   JSON.stringify(collision.probes.filter(x=>!x.notThrough||!x.notEmbedded)));
 report.checks.push('PASS_REAL_CASTLE_COLLIDERS_SPEED_280_M_S: '+
   JSON.stringify({probes:collision.probes.length,
     distinctWalls:collision.wallCount,x:collision.xCount,z:collision.zCount}));
 await page.screenshot({path:resolve(reportDir,'castle-after-camera-and-collision-tests.png'),
   fullPage:true});

 // Escape is a real browser key. Some CI Chrome pointer-lock implementations
 // ignore it; never silently claim ESC works if the native release fails.
 if((await snapshot()).pointerLocked){
   await page.keyboard.press('Escape');
   await page.waitForTimeout(1000);
   let s=await snapshot();
   report.escape={nativeReleased:!s.pointerLocked,phase:s.match};
   if(s.pointerLocked){
     report.checks.push('OPEN_NATIVE_ESC_POINTER_LOCK: CI Chromium ignored Escape. '+
       'This is not a successful manual ESC acceptance.');
     await f.locator('body').evaluate(async()=>{
       if(document.pointerLockElement)await document.exitPointerLock();
     });
     await page.waitForTimeout(600);
     s=await snapshot();
     assert(!s.pointerLocked,'Native exitPointerLock API failed to unlock');
   }else{
     report.checks.push('PASS_REAL_ESCAPE_UNLOCKED_POINTER_LOCK');
   }
   assert.equal(s.match,'paused','Pointer-lock loss did not pause actual FFA');
   assert(!s.menuHidden,'Pause must show the FFA menu');
   report.checks.push('PASS_POINTER_LOCK_RELEASE_PAUSES_GAME');
   // Real button click resumes the game and requests browser lock again.
   await f.locator('#play-btn').click();
   await page.waitForTimeout(1200);
   const resumed=await snapshot();
   assert.equal(resumed.match,'playing');
   assert(resumed.menuHidden);
   report.checks.push('PASS_PAUSED_FFA_RESUMED_FROM_REAL_UI_BUTTON');
 }
 // Observe unmodified real requestAnimationFrame + render for a sustained,
 // bounded wall-clock interval, not manual updateGame() fast-forward.
 const perfStart=await snapshot();
 await page.waitForTimeout(12500);
 const perfEnd=await snapshot();
 report.render={
   wallClockObservationSeconds:12.5,
   gameSecondsAdvanced:perfEnd.clock-perfStart.clock,
   initial:perfStart.perf,final:perfEnd.perf,
   contextAlive:perfEnd.canvas.webgl&&!perfEnd.canvas.contextLost,
   map:perfEnd.map,phase:perfEnd.match,
   player:perfEnd.player};
 assert(report.render.contextAlive,'WebGL context died during native real rendering');
 assert.equal(perfEnd.map,'castle');
 assert.equal(perfEnd.match,'playing');
 assert(report.render.gameSecondsAdvanced>.1,
   'Unmodified native RAF simulation stalled during real WebGL render');
 assert(report.render.final&&typeof report.render.final==='object');
 report.checks.push('PASS_NATIVE_RAF_RENDER_OBSERVATION_SWIFTSHADER: '+
   JSON.stringify({wallClockSeconds:12.5,
     simulatedSeconds:report.render.gameSecondsAdvanced,
     performance:report.render.final}).slice(0,1900));
 assert.equal(report.pageErrors.length,0,'Unexpected uncaught JavaScript exceptions');
 assert.equal(report.consoleErrors.length,0,'Console JS errors');
 report.result='PASS_SWIFTSHADER_INPUT_SCENE_COLLISION_RAF_SMOKE';
}catch(err){
 report.result='FAIL';report.failure=String(err?.stack||err);
 throw err;
}finally{
 save();
 if(browser)await browser.close();
 console.log(JSON.stringify(report,null,2));
}
