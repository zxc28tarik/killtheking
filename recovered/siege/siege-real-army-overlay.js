/* Kill the King S3B — actual G5.4 soldier meshes on the separate S2 castle.
 * The soldiers are native G5.4 real AI units, NOT fake animation markers.
 * Gate/ladder structure damage, 3D soldier climbing and combat-player integration
 * are explicitly UNIMPLEMENTED. The S1 DEBUG buttons remain debug events.
 */
(function(){
 'use strict';
 const source=globalThis.ArenaArmyBattle;
 const bal=globalThis.ArenaWeaponBalance;
 const bridgeApi=globalThis.KTKSiegeRealArmyBridge;
 const siegeCombat=globalThis.KTKSiegeStructureCombat||null;
 const assaultNav=globalThis.KTKSiegeAssaultNavigation||null;
 const ladderAI=globalThis.KTKSiegeLadderAI||null;
 const captureAI=globalThis.KTKSiegeCaptureAI||null;
 const defenderAI=globalThis.KTKSiegeDefenderAI||null;
 const rampartAI=globalThis.KTKSiegeRampartAI||null;
 const sharedArmyCommands=globalThis.KTKSharedG54ArmyCommands||null;
 if(rampartAI&&!defenderAI)throw Error('S4B1 rampart counterfire requires native S4A defense');
 if(defenderAI&&!captureAI)throw Error('S4 blue role defender requires S3C3 real capture');
 if(captureAI&&!ladderAI)throw Error('S3C3 objective assault requires actual S3C2 ladder bridge');
 if(ladderAI&&!siegeCombat)throw Error('S3C2 actual ladders require real gate combat');
 if(siegeCombat&&!assaultNav)throw Error('S3C siege assault path adapter missing');
 const map=globalThis.KTKSiegemap;
 const objectives=globalThis.KTKSiegeObjectives;
 const traversal=globalThis.KTKSiegeTraversal;
 const preview=globalThis.ktkSiegePreviewAdapter;
 const THREE=globalThis.THREE;
 if(!source||!bal||!bridgeApi||!map||!objectives||!traversal||
   !preview||!THREE)throw Error('Authentic G5.4 siege overlay missing runtime contracts');
 const el=document.querySelector('aside');
 const panel=document.createElement('section');
 panel.id='s3-authentic-army-panel';
 panel.style.cssText='padding:12px;border:2px solid #4c928e;background:#142b2a;color:#e1f7ed';
 panel.innerHTML=[
   '<h3 style="color:#94e7ca;margin:0 0 7px">S3 • GERÇEK G5.4 ORDU MOTORU</h3>',
   '<p style="font-size:11px;line-height:1.5">140 gerçek asker / 8 bölük, orijinal',
   ' G5.4 yapay zekâsıyla hareket eder ve savaşır. Kapı darbesi ve',
   ' sur merdiveni AI bağlantısı HENÜZ YOK. Sağdaki kuşatma',
   ' düğmeleri DEBUG olaylarıdır; gerçek asker saldırısı sayılmaz.</p>',
   '<div class="grid"><div class="stat"><strong id="s3-red-count">70</strong>',
   '<span>Canlı kırmızı asker</span></div><div class="stat">',
   '<strong id="s3-blue-count">70</strong><span>Canlı mavi asker</span></div>',
   '<div class="stat"><strong id="s3-real-ticks">0</strong>',
   '<span>Gerçek G5.4 AI tikleri</span></div><div class="stat">',
   '<strong id="s3-real-events">0</strong>',
   '<span>Gerçek savaş olayı</span></div></div>',
   '<div class="controls" style="margin-top:10px">',
   '<button type="button" id="s3-order-hold">Bölüğüm: mevzi tut</button>',
   '<button type="button" id="s3-order-advance">Bölüğüm: ilerle</button>',
   '<button type="button" id="s3-order-charge">Bölüğüm: hücum</button>',
   '<button type="button" id="s3-order-retreat">Bölüğüm: geri çekil</button>',
   '</div>',
   '<div id="s3-army-state" style="font-size:11px;margin-top:9px"></div>'
 ].join('');
 if(siegeCombat){
   panel.querySelector('h3').textContent='S3C1 • GERÇEK ASKER KAPI SALDIRISI';
   panel.querySelector('p').textContent='140 gerçek G5.4 asker. Yalnız kapının dış yüzüne ulaşan kırmızı kılıçlı ve mızraklılar, özgün menzil/hasar/yeniden saldırma süreleriyle kapıya vurur. Kapı hasarı için DEBUG tuşları kapalı. Kırmızı otomatik yakın dövüş birlikleri, yeni kuşatma AI yolu ile kapı önüne kendi yürüyüş hızında gelir. Gerçek asker merdiven AI ve tam kuşatma zaferi HENÜZ YOK.';
 }
 if(captureAI){
   panel.querySelector('h3').textContent='S3C3 • GERÇEK AVLU VE İÇ KALE SAVAŞI';
   panel.querySelector('p').textContent='Gerçek G5.4 savaş askerleri, doğal kapı veya merdiven girişinden sonra iç avlu ve iç kaleye yürür. Mavi savunucuların gerçekten yaşayan askerleri bölgeyi çekişmeli tutar. Yalnız gerçek asker konumları, ölümleri ve S1 bekleme süreleri sonucu belirler; sahte avlu/sonuç butonları kilitlidir. Bu oyun henüz ana FPS ve gerçek 3B balistik ile entegre değil.';
 }
 if(ladderAI){
   if(!captureAI){panel.querySelector('h3').textContent='S3C2 • GERÇEK ASKER MERDİVENLERİ';
   panel.querySelector('p').textContent='Kırmızı G5.4 AI mızraklıları iki yan merdivene gerçek hızlarıyla ulaşır, orada gerçek asker varlığından inşa ilerlemesi üretir, suru 3B yükselip aşar ve iç avluya iner. Asker kimlikleri, HP ve özgün motor korunur; G5.4 gerçek 3B atış fiziği ve bütün kuşatma kazanma döngüsü henüz tamamlanmadı. Sahte merdiven/kapı/zafer düğmeleri devre dışı.';}
 }
 if(defenderAI){
   panel.querySelector('h3').textContent='S4A • GERÇEK MAVİ KALE SAVUNMASI';
   panel.querySelector('p').textContent='Mavi kılıçlı/mızraklılar kapı ve avlu ön hattını, okçu/tüfekçiler arka destek mevzilerini korur. Yaşayan kırmızı askerler kapıdan veya merdivenden girince savunma avluya; iç kale fazında son hatta çekilir. Askerler gerçek G5.4 yürüyüş hızlarıyla ilerler. 3B sur üstü BOT atışı S4B için açık.';
 }
 if(rampartAI){
   panel.querySelector('h3').textContent='S4B1 • GERÇEK 3B SUR SAVUNUCULARI';
   panel.querySelector('p').textContent='Gerçek G5.4 mavi okçu/tüfekçilerden 8 asker oyunun başlangıcında sur üstünde mevzilenir. Oklar 3B gerçek uçuş, tüfekler 3B ilk temas ile kırmızı askerlere karşılık verir; zarar ve kadans gerçek G5.4 kaynağından gelir. Mavi kara savunması S4A devam eder. Oyuncuya 3B karşı ateş ve tam karşılıklı bot fizik S4B2 için açık.';
 }
  el.insertBefore(panel,el.firstChild);
 const dummy=new THREE.Object3D();
 const groups=preview.tokens.map(inst=>({
   inst,team:inst.userData.team,
   role:inst.userData.role==='archer'?'bow':inst.userData.role,
   count:inst.userData.count
 }));
 const roleVisuals=globalThis.KTKSiegeCharacterVisuals?.create({
   THREE,scene:preview.scene,groups
 })||null;
 let bridge=null,sharedCommand=null,lastArmyCommandNotice='';
 let nativeHumanCombatListener=null,nativePreStep=null,nativePostStep=null;
 let frames=0,lastSourceDeaths=0;
 function createRealArmy(team,scenario){
   bridge=bridgeApi.create({
     armyEngine:source,map,objectives,traversal,
     scenario,playerTeam:team,playerType:'sword',seed:1600,
     structureCombatEngine:siegeCombat,
     assaultNavigationEngine:siegeCombat?assaultNav:null,
     ladderAIEngine:ladderAI,
     captureAIEngine:captureAI,
     defenderAIEngine:defenderAI,
     rampartAIEngine:rampartAI,
     ballisticsAPI:rampartAI?globalThis.KTKSiege3DBallistics:null,
     weaponBalance:rampartAI?bal:null,
     defenderRender:rampartAI?{THREE,scene:preview.scene}:null
   });
   if(bridge.state.soldiers.length!==140||
      bridge.state.squads.length!==8)
     throw Error('Actual G5.4 units missing from siege S3 candidate');
   // Same native G5.4 commands as the open-field Army Battle, rather
   // than a second invented castle squad controller.
   sharedCommand=sharedArmyCommands?.create({
     engine:source,bridge,map
   })||null;
   lastArmyCommandNotice='';
   for(const g of groups){
     if(g.inst.count!==g.count)throw Error('Instanced troop count changed');
     g.inst.userData.visualOnly=false;
     g.inst.userData.actualRealArmyUnitPoses=true;
     g.units=bridge.state.soldiers.filter(u=>
       u.team===g.team&&u.type===g.role);
     if(g.units.length!==g.count)
       throw Error('Real soldiers do not match authentic G5.4 troop types');
     g.inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   }
   lastSourceDeaths=0;
   if(roleVisuals)roleVisuals.reset();
   renderRealSoldiers();
   if(nativeHumanCombatListener)nativeHumanCombatListener(bridge);
 }
 function renderRealSoldiers(){
   if(!bridge)return;
   for(const g of groups){
     for(let i=0;i<g.units.length;i++){
       const u=g.units[i];
       if(!Number.isFinite(u.x)||!Number.isFinite(u.z)||
          !Number.isFinite(u.facing))
         throw Error('Nonfinite native G5.4 soldier pose: '+u.id);
       dummy.position.set(u.x,u.alive?1.2+(u.siegeY||0):-3,u.z);
       dummy.rotation.set(0,u.facing,0);
       dummy.scale.set(u.alive?1:.001,u.alive?1:.001,u.alive?1:.001);
       dummy.updateMatrix();
       g.inst.setMatrixAt(i,dummy.matrix);
     }
     g.inst.instanceMatrix.needsUpdate=true;
     g.inst.geometry.computeBoundingSphere();
     g.inst.frustumCulled=false;
   }
   if(roleVisuals){
     // Role-model pointers are resolved from the same native IDs as QA tokens.
     // Rebind groups after a genuine army reset/team switch (no dummy AI).
     roleVisuals.render();
   }
 }
 function drawMetrics(){
   const view=bridgeApi.snapshot(bridge);
   if(sharedCommand){
     const c=sharedArmyCommands.snapshot(sharedCommand);
     const line=document.getElementById('s3-shared-army-command-line');
     if(line)line.textContent='G5.4 bölüğü: '+c.commandedRole+
       ' ('+c.aliveInSquad+' canlı) • emir '+c.order+
       ' • düzen '+c.formation+' • ateş '+(c.fireMode||'yakın dövüş')+
       ' • komut '+(c.nativeCommandStatus||'bekliyor')+
       ' • hedef '+(Number.isFinite(c.targetX)?c.targetX.toFixed(0):'–')+
       '/'+(Number.isFinite(c.targetZ)?c.targetZ.toFixed(0):'–');
     const note=document.getElementById('s3-shared-army-command-notice');
     if(note)note.textContent=lastArmyCommandNotice||'Taktik haritada tıkla: hedef • Shift+tıkla: ara nokta';
     const ranged=c.commandedRole==='bow'||c.commandedRole==='musket';
     for(const b of panel.querySelectorAll('[data-g54-fire]'))
       b.disabled=!ranged||c.aliveInSquad<=0;
     for(const b of panel.querySelectorAll('[data-g54-action]'))
       b.disabled=c.aliveInSquad<=0;
   }
   const ladderCaption=ladderAI
     ?' • Merdivenler: batı '+(view.scenario.lanes.west?'HAZIR':view.scenario.ladders.west.progress.toFixed(1)+'%')+
       ', doğu '+(view.scenario.lanes.east?'HAZIR':view.scenario.ladders.east.progress.toFixed(1)+'%')+
       ' • Tamamlanan gerçek 3B tırmanış: '+
       view.genuineSoldierLadders.distinctNativeSoldiersFinished
     :'';
   const captureCaption=captureAI
     ?' • Faz: '+view.scenario.phase+' • Avlu '+view.scenario.occupancy.courtyard.red+
        ' K / '+view.scenario.occupancy.courtyard.blue+' M'+
        ' • İç kale '+view.scenario.occupancy.keep.red+' K / '+
        view.scenario.occupancy.keep.blue+' M'+
        (view.scenario.phase==='RESULT'
          ?' • SONUÇ: '+view.scenario.winner.toUpperCase()+' / '+view.scenario.resultReason
          :' • Avlu '+view.scenario.capture.courtyard.toFixed(1)+'s'+
            ' • İç kale '+view.scenario.capture.keep.toFixed(1)+'s')
     :'';
   const rampartCaption=rampartAI&&view.realRampart3DDefenderAI
     ?' • Sur: '+view.realRampart3DDefenderAI.survivingRampartDefenders+
       '/'+view.realRampart3DDefenderAI.initialGenuineDefendersOnRamparts+
       ' • 3B tüfek/ok: '+view.realRampart3DDefenderAI.musket3DShots+
       '/'+view.realRampart3DDefenderAI.bow3DShots+
       ' • Gerçek isabet: '+view.realRampart3DDefenderAI.successfulAuthenticSoldierHits
     :'';
   const defenderCaption=defenderAI&&view.realDefenderRoleCoordination
     ?' • Savunma: '+view.realDefenderRoleCoordination.activeDefensivePhase+
       ' • Gerçek mavi asker adımları: '+
       view.realDefenderRoleCoordination.actualGuidedDefenderSteps
     :'';
   const gateCaption=siegeCombat
     ?' • Gerçek asker kapı vuruşları: '+view.genuineSoldierGateStrikes.strikes+
       ' / kalan kapı HP: '+view.scenario.gate.hp
     :' • Kapı AI hasarı: henüz bağlı değil';
   document.getElementById('s3-red-count').textContent=view.genuineAlive.red;
   document.getElementById('s3-blue-count').textContent=view.genuineAlive.blue;
   document.getElementById('s3-real-ticks').textContent=view.armyNativeTick;
   document.getElementById('s3-real-events').textContent=view.realCombatEvents;
   document.getElementById('s3-army-state').textContent=
     'Oyuncu: '+bridge.playerTeam.toUpperCase()+' / Kılıçlı • '+
     'G5.4 süre: '+view.realArmySeconds.toFixed(1)+'s • '+
     'Yer değiştiren gerçek asker-tikleri: '+view.genuinelyMovedSoldierTicks+
     gateCaption+ladderCaption+captureCaption+defenderCaption+rampartCaption;
 }
 function onFrame(dt){
   if(nativePreStep)nativePreStep(dt);
   // Native G5.4 0.08s substeps are used, no handcrafted soldiers/damage.
   if(bridge.scenario.phase!=='RESULT')
     bridgeApi.step(bridge,dt);
   if(nativePostStep)nativePostStep(dt);
   renderRealSoldiers();
   if(frames++%8===0)drawMetrics();
 }
 function onReset(scenario){
   createRealArmy(preview.getTeam(),scenario);
   drawMetrics();
 }
 function onTeamChange(team,scenario){
   createRealArmy(team,scenario);
   drawMetrics();
 }
 createRealArmy(preview.getTeam(),preview.getScenario());
 preview.register({onFrame,onReset,onTeamChange,
   realStructureCombat:!!siegeCombat,realLadderAI:!!ladderAI});
 // Army (G5.4) is the ONLY order/formation/fire authority in both
 // field and castle; siege-specific structure orders are a future layer.
 function sendArmy(action,value,x,z){
   if(!sharedCommand){
     if(action!=='order')return;
     const yes=bridgeApi.command(bridge,value);
     if(!yes)throw Error('Native G5.4 player squad rejected '+value);
     drawMetrics();return;
   }
   const result=sharedArmyCommands.execute(sharedCommand,{
     action,value,x,z
   });
   lastArmyCommandNotice=result.ok
     ?'G5.4 komutu kabul etti: '+action+' '+(value??'')+
       (Number.isFinite(x)?' ('+x.toFixed(0)+', '+z.toFixed(0)+')':'')
     :'G5.4 reddetti: '+result.reason;
   drawMetrics();
 }
 for(const order of ['hold','advance','charge','retreat']){
   document.getElementById('s3-order-'+order).addEventListener('click',
     ()=>sendArmy('order',order));
 }
 if(sharedArmyCommands){
   const section=document.createElement('section');
   section.id='s3-shared-army-commands';
   section.style.cssText='padding:11px;background:#1b3434;border:1px solid #58ad92;color:#f2f0de';
   section.innerHTML=[
     '<h3>G5.4 ORTAK ORDU KOMUTLARI • MEYDAN + KALE</h3>',
     '<p class="help">Komutlar yeni bir kuşatma motoruna değil,',
     ' doğrudan Meydan Savaşı ile aynı G5.4 komut fonksiyonlarına gider.',
     ' Sadece kendi gerçek bölüğünü yönetirsin.</p>',
     '<div id="s3-shared-army-command-line" class="help"></div>',
     '<h3 style="margin-top:10px">Bölük emirleri</h3>',
     '<div class="controls">',
     '<button data-g54-action="follow">Takip et</button>',
     '<button data-g54-action="flank">Kanattan saldır</button>',
     '<button data-g54-action="skirmish">Taciz et</button>',
     '</div>',
     '<h3 style="margin-top:10px">Formasyonlar</h3>',
     '<div class="controls">',
     '<button data-g54-formation="line">Saf</button>',
     '<button data-g54-formation="column">Yürüyüş kolu</button>',
     '<button data-g54-formation="square">Kare</button>',
     '<button data-g54-formation="wedge">Kama</button>',
     '<button data-g54-formation="loose">Dağınık</button>',
     '<button data-g54-formation="shield">Kalkan duvarı</button>',
     '</div>',
     '<h3 style="margin-top:10px">Menzilli bölük atışları</h3>',
     '<div class="controls">',
     '<button data-g54-fire="free">Serbest ateş</button>',
     '<button data-g54-fire="volley">Toplu ateş</button>',
     '<button data-g54-fire="hold">Ateşi kes</button>',
     '</div>',
     '<h3 style="margin-top:10px">Taktik harita</h3>',
     '<p class="help">Yukarıdaki kale taktik haritasına tıklayarak',
     ' bölüğüne hedef ver. Shift + tık ile ara nokta sırala.</p>',
     '<div id="s3-shared-army-command-notice" role="status"',
     ' class="help" style="margin-top:6px;color:#e9c68c"></div>'
   ].join('');
   panel.querySelector('#s3-army-state').insertAdjacentElement(
     'beforebegin',section);
   for(const b of section.querySelectorAll('[data-g54-action]'))
     b.addEventListener('click',()=>sendArmy('order',b.dataset.g54Action));
   for(const b of section.querySelectorAll('[data-g54-formation]'))
     b.addEventListener('click',()=>sendArmy('formation',b.dataset.g54Formation));
   for(const b of section.querySelectorAll('[data-g54-fire]'))
     b.addEventListener('click',()=>sendArmy('fire',b.dataset.g54Fire));
   const tactical=document.getElementById('siege-mini-map');
   if(!tactical)throw Error('Genuine S2 castle tactical map missing');
   tactical.style.cursor='crosshair';
   tactical.title='G5.4: hedefe tıkla • Shift + tık: ara nokta';
   tactical.addEventListener('click',event=>{
     const area=tactical.getBoundingClientRect();
     if(area.width<=0||area.height<=0)return;
     const bounds=map.spec.bounds;
     const ux=Math.max(0,Math.min(1,(event.clientX-area.left)/area.width));
     const uz=Math.max(0,Math.min(1,(event.clientY-area.top)/area.height));
     const x=bounds.minX+ux*(bounds.maxX-bounds.minX);
     const z=bounds.maxZ-uz*(bounds.maxZ-bounds.minZ);
     sendArmy(event.shiftKey?'waypoint':'position',undefined,x,z);
   });
 }
 drawMetrics();
 // S3D1 opt-in-only adapter. Existing S3B/S3C real 140 soldier games
 // register no player-combat module and retain byte-identical G5.4 AI.
 globalThis.ktkSiegeNativeBattleAdapter=Object.freeze({
   getBridge:()=>bridge,
   registerPlayerCombat({onCreate,onBeforeFrame,onAfterFrame}={}){
     if(nativeHumanCombatListener||typeof onCreate!=='function'||
        typeof onBeforeFrame!=='function'||typeof onAfterFrame!=='function')
       throw Error('Duplicate/incomplete genuine S3D1 player integration');
     nativeHumanCombatListener=onCreate;
     nativePreStep=onBeforeFrame;
     nativePostStep=onAfterFrame;
     onCreate(bridge);
   }
 });
 globalThis.ktkSiegeArmyCommandStatus=()=>sharedCommand?
   sharedArmyCommands.snapshot(sharedCommand):null;
 globalThis.ktkSiegeArmyStatus=()=>({
   ...bridgeApi.snapshot(bridge),
   renderedRealSoldierCount:groups.reduce((a,g)=>a+g.units.length,0),
   roleCharacterVisuals:roleVisuals?roleVisuals.status():null,
   renderedActualPositions:groups.every(g=>
     g.inst.userData.actualRealArmyUnitPoses===true),
   controlledPlayerTeam:bridge.playerTeam,
   controlledPlayerSquadId:bridge.state.playerSquadId,
   visualRenderer:'Original Three.js r128 instanced meshes updated from G5.4 soldiers',
   sourceEngine:'PINNED_G5_4_TRUE_SIDE_SWAP_SHA_30798785',
   fullSiegeBattleReady:false,
   playerControlsRealArmySquad:true,
   sharedNativeG54ArmyCommandContract:!!sharedCommand,
   sharedNativeG54ArmyCommands:sharedCommand?
     sharedArmyCommands.snapshot(sharedCommand):null,
   exactOriginalFieldArmyHUDReused:false,
   authenticGateDamageSupported:!!siegeCombat,
   genuineGateStrikes:bridge.structureCombat?
     bridge.structureCombatEngine.snapshot(bridge.structureCombat):null,
   nativeCastleTerrainCollisionActive:!!siegeCombat,
   real3DLadderSoldierPositions:!!ladderAI,
   genuineCaptureAndMatchResultEnabled:!!captureAI,
   siegeRealSoldierAssaultRouting:bridge.assaultNavigation?
     bridge.assaultNavigationEngine.snapshot(bridge.assaultNavigation):null,
   independentFFAUnmodified:true
 });
})();
