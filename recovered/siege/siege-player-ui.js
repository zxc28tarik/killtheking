/* S3D1 optional browser UI: native G5.4 player HP and four genuine
 * pre-approved weapon-balance rules. Attaches to existing S2 exploration
 * camera but DOES NOT claim historic FFA movement or 3D arrow trajectories.
 */
(function(){
 'use strict';
 const api=globalThis.KTKSiegePlayerCombat;
 const native=globalThis.ktkSiegeNativeBattleAdapter;
 const preview=globalThis.ktkSiegePreviewAdapter;
 const G54=globalThis.ArenaArmyBattle;
 const W=globalThis.ArenaWeaponBalance;
 const Ballistics=globalThis.KTKSiege3DBallistics;
 const sharedBattleSession=globalThis.KTKSharedG54BattleSession;
 const sharedInput=globalThis.KTKSharedG54PlayerInput;
 if(!api||!native||!preview||!G54||!W||!Ballistics||!sharedBattleSession||!sharedInput)
   throw Error('Native S3D1 140 soldier + live player UI dependencies missing');
 let combat=null;
 let frames=0;
 const el=document.querySelector('aside');
 const panel=document.createElement('section');
 panel.id='s3d-real-player-panel';
 panel.style.cssText='padding:13px;background:#182e2c;border:2px solid #7cbdba;color:#e2f5ea';
 panel.innerHTML=[
  '<h3 style="color:#94e7ca;margin:0 0 8px">S3D1 • GERÇEK OYUNCU SAVAŞI (ADAY)</h3>',
  '<p style="font-size:11px;line-height:1.55">FPS/TPS seç, WASD ile yürü, Space ile zıpla, Shift/C ile kay; 3B kamera serbest bakış için oyun alanına tıkla (Esc serbest bırakır).',
  ' Fareyle veya F ile vur; yay için basılı tutup bırak.',
  ' Silahlar ve hasar onaylı silah tablosundan, oyuncu HP ve gerçek asker',
  ' ölümleri orijinal G5.4 motorundan gelir. <b>Tüfek 3B engel ışını,',
  ' yay gerçek uçuş ve düşüşle, sur üstü atışlar 3B hedef yüksekliğiyle işler.</b></p>',
  '<div class="grid">',
  '<div class="stat"><strong id="s3d-hp">100 / 100 HP</strong><span>GERÇEK G5.4 oyuncu canı</span></div>',
  '<div class="stat"><strong id="s3d-score">0 / 0</strong><span>Vuruş / Ölüm (oyuncu)</span></div>',
  '<div class="stat"><strong id="s3d-weapon">Kılıç</strong><span>Seçili silah</span></div>',
  '<div class="stat"><strong id="s3d-draw">Hazır</strong><span>Şarjör / yay germe</span></div>',
  '</div>',
  '<div class="controls" style="margin-top:10px">',
  '<button id="s3d-sword" type="button">1 • Kılıç</button>',
  '<button id="s3d-spear" type="button">2 • Mızrak</button>',
  '<button id="s3d-bow" type="button">3 • Yay (2–3 sn)</button>',
  '<button id="s3d-musket" type="button">4 • Tüfek (15 sn)</button>',
  '<button id="s3d-fire" type="button" class="success full">ATEŞ / VUR (F veya fare)</button>',
  '</div>',
  '<div id="s3d-player-feedback" role="status" style="font-size:11px;margin-top:9px;color:#cce6d9">FPS/TPS moduna geç ve hedef al.</div>',
  '<p style="font-size:11px;color:#eac18a;margin-top:9px">Dost ateşi kapalı, dost asker atışı durdurur.',
  ' E ile açık yan merdivene çıkıp sur üstünden ateş edebilirsin.',
  ' Sadece oyuncu menzilli atışı 3B; G5.4 asker AI 3B değil. Ölürsen senaryoyu yeniden başlat.</p>'
 ].join('');
 el.insertBefore(panel,el.firstChild);
 const canvas=preview.getCanvas();
 if(!canvas||typeof canvas.addEventListener!=='function')
   throw Error('Native S3D1 cannot access actual Three.js scene controls');
 const weapons={sword:'Kılıç',spear:'Mızrak',bow:'Yay',musket:'Tüfek'};
 const feedbackApi=globalThis.KTKSiegeWeaponFeedback;
 const feedback=feedbackApi?.create({
   THREE:globalThis.THREE,scene:preview.scene,
   camera:preview.getCamera(),sceneRoot:document.getElementById('scene')
 })||null;
 let visualTime=performance.now();
 function nativeFeedback(result){
   if(feedback&&result?.status)feedback.consume(result);
 }
 let holdingBow=false,lastVisible=null;
 let threeD=null,threeDConfigured=false;
 function draw(){
   if(!combat)return;
   const s=api.snapshot(combat);
   const hp=document.getElementById('s3d-hp');
   hp.textContent=s.playerHealth.toFixed(0)+' / 100 HP';
   hp.style.color=s.playerHealth<=0?'#f15c4d':
     s.playerHealth<40?'#e7b264':'#adeabf';
   document.getElementById('s3d-score').textContent=
     s.hits+' isabet / '+s.playerKills+' öldürme';
   document.getElementById('s3d-weapon').textContent=weapons[s.weapon];
   document.getElementById('s3d-draw').textContent=
     s.weapon==='bow'&&holdingBow?
       'Germe '+s.pendingBowDrawSeconds.toFixed(1)+' sn':
     s.playerHealth<=0?'ÖLDÜ':
     s.view==='orbit'?'FPS/TPS seç':
     s.lastResult?.status==='cooldown'?'Yeniden hazır değil':'Hazır';
   const status=document.getElementById('s3d-player-feedback');
   if(s.playerHealth<=0)
     status.textContent='OYUNCU ÖLDÜ • Gerçek G5.4 HP 0. Senaryoyu yeniden başlat.';
   else if(s.view==='orbit')
     status.textContent='FPS veya TPS seç. F/sol tık ateş eder, 3 yayını gerer.';
   else if(lastVisible){
     const result=lastVisible;
     status.textContent=result.status==='hit'?
       weapons[result.weapon]+' • gerçek '+result.zone+' vuruşu • '+
       result.damage.toFixed(1)+' hasar'+(result.killed?' • HEDEF ÖLDÜ':''):
       'Son eylem: '+result.status;
   }else status.textContent='Hazır • Sol tık/F: saldır • E: merdiven • Space: zıpla • Shift/C: kay';
   for(const key of Object.keys(weapons)){
     const button=document.getElementById('s3d-'+key);
     button.style.borderColor=s.weapon===key?'#88ddba':'#ae8954';
     button.disabled=s.playerHealth<=0;
   }
   document.getElementById('s3d-fire').disabled=
     s.playerHealth<=0||s.view==='orbit'||!s.playerCanMove;
 }
 function selected(name){
   if(!combat)return;
   api.setWeapon(combat,name);
   if(feedback)feedback.select(name);
   holdingBow=false;lastVisible=null;
   draw();
 }
 for(const name of Object.keys(weapons)){
   const el=document.getElementById('s3d-'+name);
   el.addEventListener('click',()=>selected(name));
 }
 function start(){
   if(!combat)return;
   api.sync(combat,preview.getPlayerPose());
   const old=api.snapshot(combat);
   if(old.weapon==='bow'){
     holdingBow=true;
     lastVisible=api.beginBow(combat);
   }else{
     lastVisible=api.trigger(combat);
     holdingBow=false;
   }
   nativeFeedback(lastVisible);
   draw();
 }
 function end(){
   if(!combat||!holdingBow)return;
   api.sync(combat,preview.getPlayerPose());
   lastVisible=api.releaseBow(combat);
   nativeFeedback(lastVisible);
   holdingBow=false;draw();
 }
 canvas.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;
   // Existing drag-to-aim remains intact and controls a native shot.
   start();
 });
 globalThis.addEventListener('pointerup',e=>{
   if(e.button===0)end();
 });
 globalThis.addEventListener('pointercancel',end);
 const btn=document.getElementById('s3d-fire');
 btn.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;
   start();
 });
 btn.addEventListener('pointerup',end);
 // Keyboard also supports full 2-3 sec bow charging while looking around.
 globalThis.addEventListener('keydown',e=>{
   const menu={'Digit1':'sword','Digit2':'spear',
     'Digit3':'bow','Digit4':'musket'};
   if(menu[e.code]&&!e.repeat){
     selected(menu[e.code]);e.preventDefault();return;
   }
   if(e.code==='KeyF'&&!e.repeat){
     start();e.preventDefault();
   }
 });
 globalThis.addEventListener('keyup',e=>{
   if(e.code==='KeyF')end();
 });
 globalThis.addEventListener('blur',()=>{
   if(holdingBow)end();
 });
 // Crosshair drawn outside Three.js game world; hidden in map spectator mode.
 const scene=document.getElementById('scene');
 const cross=document.createElement('div');
 cross.id='s3d-crosshair';
 cross.textContent='+';
 cross.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font:bold 31px monospace;color:#f8efd2;text-shadow:0 1px 4px #000;pointer-events:none;z-index:3;display:none';
 scene.appendChild(cross);
 function onCreate(b){
   if(threeD)threeD.reset();
   threeD=Ballistics.create({
     map:globalThis.KTKSiegemap,scene:preview.scene,THREE:globalThis.THREE
   });
   if(!threeDConfigured){
     preview.registerBallistics();
     threeDConfigured=true;
   }
   combat=api.create({bridge:b,engine:G54,balance:W,ballistics:threeD,
     session:native.getSession(),sessionAPI:sharedBattleSession,
     inputContract:sharedInput});
   holdingBow=false;lastVisible=null;
   if(feedback)feedback.reset('sword');
   api.sync(combat,preview.getPlayerPose());
   draw();
 }
 function onBeforeFrame(){
   if(!combat)return;
   api.sync(combat,preview.getPlayerPose());
 }
 function onAfterFrame(){
   if(!combat)return;
   api.receive(combat);
   // Native 3D arrow flight resolves only on a genuine G5.4 clock tick;
   // impact cannot masquerade as an immediate firing-time hit marker.
   for(const actual of api.drainProjectileEvents(combat)){
     lastVisible=actual;nativeFeedback(actual);
   }
   const genuine=api.snapshot(combat);
   const clock=performance.now();
   if(feedback)feedback.update(Math.min(.05,Math.max(0,(clock-visualTime)/1000)),
     genuine,{locomotion:preview.getLocomotion()});
   visualTime=clock;
   cross.style.display=genuine.view==='orbit'?'none':'block';
   if(frames++%6===0)draw();
 }
 native.registerPlayerCombat({onCreate,onBeforeFrame,onAfterFrame});
 preview.registerCombat({canMove:()=>!!combat&&api.canMove(combat)});
 draw();
 globalThis.ktkSiegePlayerCombatStatus=()=>api.snapshot(combat);
 globalThis.ktkSiegeWeaponVisualStatus=()=>feedback?.status()||null;
 globalThis.ktkSiegeBallisticsStatus=()=>threeD?.status()||null;
})();
