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
 const sharedBattleSession=globalThis.KTKSharedG54BattleSession||null;
 const fourSquadEngine=globalThis.KTKG54FourSquadCommand||null;
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
 let bridge=null,sharedCommand=null,liveSession=null,fourCommand=null,lastArmyCommandNotice='';
 let commandHUD=null,shortcutsAccepted=0;
 let fieldTactical=null,fieldMapOpen=false,fieldMapAction='position';
 let fieldMapOpens=0,fieldMapCloses=0,fieldMapClicks=0,fieldMapAccepted=0;
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
     defenderRender:rampartAI?{THREE,scene:preview.scene}:null,
     fourSquadCommandEngine:fourSquadEngine
   });
   if(bridge.state.soldiers.length!==140||
      bridge.state.squads.length!==8)
     throw Error('Actual G5.4 units missing from siege S3 candidate');
   // Same native G5.4 commands as the open-field Army Battle, rather
   // than a second invented castle squad controller.
   sharedCommand=sharedArmyCommands?.create({
     engine:source,bridge,map
   })||null;
   fourCommand=bridge.multiSquadCommand;
   if(!fourCommand)
     throw Error('AK-04a requires genuine four-squad native authority');
   liveSession=sharedBattleSession?.create({
     engine:source,state:bridge.state,scenario:bridge.scenario,
     mode:'siege',playerTeam:team
   })||null;
   if(!liveSession)throw Error('AK-03a missing native shared battle session');
   lastArmyCommandNotice='';
   if(commandHUD)drawSharedCommandHUD();
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
     const c=displayCommand();
     drawSharedCommandHUD(c);
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
     for(const b of panel.querySelectorAll('[data-g54-fire]')){
       b.disabled=!ranged||c.aliveInSquad<=0;
       b.setAttribute('aria-pressed',String(c.fireMode===b.dataset.g54Fire));
     }
     for(const b of panel.querySelectorAll('[data-g54-formation]'))
       b.setAttribute('aria-pressed',String(c.formation===b.dataset.g54Formation));
     for(const b of panel.querySelectorAll('[data-g54-action]'))
       b.setAttribute('aria-pressed',String(c.order===b.dataset.g54Action));
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
 function displayCommand(){
   const c=sharedArmyCommands.snapshot(sharedCommand);
   if(!fourCommand)return c;
   const multi=fourSquadEngine.snapshot(fourCommand);
   const ids=multi.selectedSquadIds;
   const own=bridge.state.squads[ids[0]];
   if(!own)throw Error('AK-04a selected native squad missing');
   const all=ids.length>1;
   return {...c,
     commandedRole:all?'4 BÖLÜK':own.type,
     aliveInSquad:ids.reduce((n,id)=>n+bridge.state.squads[id].alive,0),
     order:all?'mixed':own.order,
     formation:all?'mixed':own.formation,
     fireMode:all?
       (ids.some(id=>['bow','musket'].includes(bridge.state.squads[id].type))
         ?'mixed':null):
       (['bow','musket'].includes(own.type)?own.fireMode:null),
     commandSquadId:ids[0],
     lastResult:fourCommand.lastResult?
       {ok:fourCommand.lastResult.someAccepted,
        action:fourCommand.lastResult.action,
        reason:fourCommand.lastResult.reason}:c.lastResult
   };
 }
 function setFourSquadSelection(index,all=false){
   if(!fourCommand)throw Error('Missing real native G5.4 allied squads');
   const own=fourSquadEngine.snapshot(fourCommand).authorizedFriendlySquadIds;
   if(all)fourSquadEngine.pickAll(fourCommand);
   else {
     if(!Number.isInteger(index)||index<0||index>=own.length)
       throw Error('Invalid allied unit index');
     fourSquadEngine.select(fourCommand,own[index]);
   }
   drawMetrics();
   return fourSquadEngine.snapshot(fourCommand);
 }
 function drawSharedCommandHUD(state=null){
   if(!commandHUD||!sharedCommand)return;
   const c=state||displayCommand();
   const roles={bow:'OKÇU',musket:'TÜFEKÇİ',pike:'MIZRAKÇI',sword:'KILIÇLI'};
   const status=commandHUD.querySelector('[data-army-status]');
   const header=commandHUD.querySelector('[data-army-heading]');
   const notice=commandHUD.querySelector('[data-army-shortcut-notice]');
   header.textContent='⚔ KALE KUŞATMASI • G5.4 MEYDAN KOMUTASI • '+bridge.playerTeam.toUpperCase();
   commandHUD.querySelector('[data-army-blue]').textContent='MAVİ '+bridge.state.soldiers.filter(x=>x.alive&&x.team==='blue').length;
   commandHUD.querySelector('[data-army-red]').textContent='KIRMIZI '+bridge.state.soldiers.filter(x=>x.alive&&x.team==='red').length;
   status.textContent=(roles[c.commandedRole]||c.commandedRole)+
     ' · '+c.aliveInSquad+' ASKER · '+(source.ORDERS[c.order]||c.order)+
     ' · '+(source.FORMATIONS[c.formation]?.name||c.formation)+
     (c.fireMode?' · '+(source.FIRE_MODES[c.fireMode]||c.fireMode):'');
   const latest=c.lastResult;
   notice.textContent=latest
     ?(latest.ok?'✓ ':'× ')+
       (latest.ok?'Komut kabul edildi':'Komut reddedildi')+
       ' · '+latest.action+
       (latest.reason?' · '+latest.reason:'')
     :'J: mevzi · K: ileri · Z: saf · X: kol · 7/8/9: ateş';
   const choose=fourCommand?fourSquadEngine.snapshot(fourCommand):null;
   for(const b of commandHUD.querySelectorAll('[data-four-squad-index]')){
     const id=choose?.authorizedFriendlySquadIds[Number(b.dataset.fourSquadIndex)];
     const sq=bridge.state.squads[id];
     if(!sq)continue;
     b.textContent=(roles[sq.type]||sq.type)+' · '+sq.alive+'/'+sq.startCount;
     const selected=choose.selectedSquadIds.length===1&&
       choose.selectedSquadIds[0]===id;
     b.setAttribute('aria-pressed',String(selected));
     b.disabled=!sq.alive;b.style.borderColor=selected?'#e9b657':'#52676a';
   }
   const allBtn=commandHUD.querySelector('[data-four-squad-all]');
   if(allBtn)allBtn.setAttribute('aria-pressed',String(
     choose?.selectedSquadIds.length===4));
   for(const el of commandHUD.querySelectorAll('[data-field-kind]')){
     const kind=el.dataset.fieldKind,selected=el.dataset.fieldCommand;
     const actual=kind==='order'?c.order:
       kind==='formation'?c.formation:c.fireMode;
     const isActive=actual===selected;
     el.setAttribute('aria-pressed',String(isActive));
     el.style.color=isActive?'#ffe2a0':'#e2e8f0';
     el.style.borderColor=isActive?'#e9b657':'#52676a';
     el.style.background=isActive?'#854d0e':'#1e293b';
     el.disabled=(kind==='fire'&&!c.fireMode)||c.aliveInSquad<=0;
   }
   const ro=commandHUD.querySelector('[data-army-roster]');
   if(ro){
     ro.replaceChildren();
     for(const squad of bridge.state.squads){
       const item=document.createElement('div');
       item.textContent=(squad.team==='blue'?'Mavi ':'Kırmızı ')+
         (roles[squad.type]||squad.type)+' '+squad.alive+'/'+squad.startCount+
         ' · '+(source.ORDERS[squad.order]||squad.order)+
         (squad.playerControlled?' ★':'');
       item.style.color=squad.playerControlled?'#ffe2a0':
         squad.team==='blue'?'#9dd5f9':'#f2aa9e';
       ro.appendChild(item);
     }
   }
   if(fieldMapOpen)drawFieldMap();
 }
 function setFieldMap(open){
   if(!fieldTactical)return;
   if(fieldMapOpen===!!open)return;
   fieldMapOpen=!!open;
   fieldTactical.style.display=fieldMapOpen?'flex':'none';
   fieldTactical.dataset.open=String(fieldMapOpen);
   if(fieldMapOpen){
     fieldMapOpens++;
     const unlock=document.exitPointerLock?.();
     if(unlock?.catch)unlock.catch(()=>{});
     drawFieldMap();
   }else fieldMapCloses++;
 }
 function drawFieldMap(){
   if(!fieldMapOpen||!fieldTactical||!bridge?.state)return;
   const canvas=fieldTactical.querySelector('canvas');
   const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
   if(!ctx)throw Error('G5.4 tactical map lost its real canvas');
   const state=bridge.state,spec=map.spec,b=spec.bounds;
   const sx=x=>(x-b.minX)/(b.maxX-b.minX)*w;
   const sz=z=>(b.maxZ-z)/(b.maxZ-b.minZ)*h;
   ctx.clearRect(0,0,w,h);
   ctx.fillStyle='#12232d';ctx.fillRect(0,0,w,h);
   ctx.strokeStyle='#71877e';ctx.lineWidth=2;
   ctx.strokeRect(sx(spec.castle.minX),sz(spec.castle.maxZ),
     sx(spec.castle.maxX)-sx(spec.castle.minX),
     sz(spec.castle.minZ)-sz(spec.castle.maxZ));
   for(const block of spec.boxes){
     if(!block.solid||(block.id==='gate-main'&&bridge.scenario.gate.open))continue;
     ctx.fillStyle=block.type==='gate'?'#dfae61':'#687b84';
     ctx.fillRect(sx(block.x-block.w/2),sz(block.z+block.d/2),
       block.w/(b.maxX-b.minX)*w,block.d/(b.maxZ-b.minZ)*h);
   }
   for(const side of ['west','east']){
     if(!bridge.scenario.lanes[side])continue;
     const pos=spec.lanes[side].entry;
     ctx.fillStyle='#f7df87';ctx.beginPath();
     ctx.arc(sx(pos[0]),sz(pos[1]),5,0,Math.PI*2);ctx.fill();
   }
   for(const u of state.soldiers){
     if(!u.alive)continue;
     const x=sx(u.x),y=sz(u.z);
     if(x<0||x>w||y<0||y>h)continue;
     ctx.fillStyle=u.team==='red'?'#ea786f':'#73c7f3';
     ctx.beginPath();ctx.arc(x,y,1.9,0,Math.PI*2);ctx.fill();
   }
   for(const squad of state.squads){
     if(!squad.alive)continue;
     const x=sx(squad.x),y=sz(squad.z);
     ctx.strokeStyle=squad.playerControlled?'#ffe3a1':
       squad.team==='red'?'#f6b5ab':'#9bdcff';
     ctx.lineWidth=squad.playerControlled?3:1.4;
     ctx.beginPath();ctx.arc(x,y,squad.playerControlled?8:5,0,Math.PI*2);
     ctx.stroke();
   }
   const primary=fourCommand?
     fourSquadEngine.snapshot(fourCommand).selectedSquadIds[0]:
     state.playerSquadId;
   const own=state.squads[primary];
   if(own?.routeGoal){
     ctx.strokeStyle='#ffe099';ctx.fillStyle='#ffe099';
     ctx.beginPath();ctx.moveTo(sx(own.x),sz(own.z));
     ctx.lineTo(sx(own.routeGoal.x),sz(own.routeGoal.z));
     for(const wp of own.waypoints||[])ctx.lineTo(sx(wp.x),sz(wp.z));
     ctx.stroke();
     ctx.fillRect(sx(own.routeGoal.x)-3,sz(own.routeGoal.z)-3,6,6);
   }
   for(const btn of fieldTactical.querySelectorAll('[data-field-map-action]')){
     const yes=btn.dataset.fieldMapAction===fieldMapAction;
     btn.setAttribute('aria-pressed',String(yes));
     btn.style.background=yes?'#854d0e':'#273449';
     btn.style.borderColor=yes?'#fbbf24':'#8d744b';
   }
   fieldTactical.querySelector('[data-field-map-units]').textContent=
     'Mavi '+state.soldiers.filter(x=>x.alive&&x.team==='blue').length+
     ' / Kırmızı '+state.soldiers.filter(x=>x.alive&&x.team==='red').length+
     ' · 8 G5.4 bölük · Seçili: '+(source.ORDERS[own?.order]||own?.order||'–');
   fieldTactical.dataset.actualNativeTroops=String(state.soldiers.length);
 }
 function sendArmy(action,value,x,z){
   if(!sharedCommand){
     if(action!=='order')return;
     const yes=bridgeApi.command(bridge,value);
     if(!yes)throw Error('Native G5.4 player squad rejected '+value);
     drawMetrics();return;
   }
   const result=fourCommand?
     fourSquadEngine.execute(fourCommand,{action,value,x,z}):
     sharedArmyCommands.execute(sharedCommand,{action,value,x,z});
   if(fieldMapOpen)drawFieldMap();
   lastArmyCommandNotice=(result.ok||result.someAccepted)
     ?'G5.4 komutu kabul etti: '+action+' '+(value??'')+
       (fourCommand?' · '+result.accepted+'/'+result.results.length+' bölük':'')+
       (Number.isFinite(x)?' ('+x.toFixed(0)+', '+z.toFixed(0)+')':'')
     :'G5.4 reddetti: '+result.reason;
   drawMetrics();
   return result;
 }
 for(const order of ['hold','advance','charge','retreat']){
   document.getElementById('s3-order-'+order).addEventListener('click',
     ()=>sendArmy('order',order));
 }
 if(sharedArmyCommands){
   const scene=document.getElementById('scene');
   if(!scene)throw Error('AK-02a shared commander HUD requires active castle canvas');
   commandHUD=document.createElement('section');
   commandHUD.id='ak02-g54-commander-hud';
   commandHUD.setAttribute('aria-label','Ordu Savaşı ile ortak G5.4 komuta HUD');
   commandHUD.style.cssText='position:absolute;left:12px;bottom:46px;width:min(530px,calc(100% - 24px));max-height:min(70vh,690px);overflow:auto;z-index:6;background:#101b2ff2;border:1px solid #d3ab57;border-radius:8px;padding:10px 12px;box-shadow:0 6px 24px #000a;pointer-events:auto;color:#f2ebd5;font:600 11px/1.45 system-ui';
   const fieldOrderKeys=[
     ['G','KeyG','follow','Takip et'],
     ['J','KeyJ','hold','Mevzi tut'],
     ['K','KeyK','advance','İlerle'],
     ['L','KeyL','charge','Hücum'],
     ['U','KeyU','retreat','Geri çekil'],
     ['Y','KeyY','flank','Kanat saldırısı'],
     ['N','KeyN','skirmish','Taciz']
   ];
   const fieldFormationKeys=[
     ['Z','KeyZ','line','Saf'],
     ['X','KeyX','column','Yürüyüş kolu'],
     // Meydan C=kare, fakat Kale C=oyuncu kayması; bu tuşu koru.
     ['V','KeyV','square','Kare (C kayma)'],
     ['B','KeyB','wedge','Kama'],
     ['M','KeyM','loose','Dağınık'],
     ['I','KeyI','shield','Kalkan duvarı']
   ];
   const fieldFireKeys=[
     ['7','Digit7','free','Serbest ateş'],
     ['8','Digit8','volley','Toplu ateş'],
     ['9','Digit9','hold','Ateşi kes']
   ];
   const fieldButtons=(entries,kind)=>entries.map(([key,code,value,label])=>
     '<button type="button" data-army-hotkey="'+code+'" data-field-kind="'+kind+
     '" data-field-command="'+value+'" aria-pressed="false"'+
     ' style="border:1px solid #52676a;border-radius:5px;padding:4px 6px;'+
     'background:#1e293b;color:#e2e8f0;font:700 11px system-ui;cursor:pointer">'+
     '<b>'+key+'</b> · '+label+'</button>').join('');
   const fieldRow='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:3px">';
   const fieldLabel=x=>'<div style="margin-top:8px;color:#e9bf79;font-weight:800">'+x+'</div>';
   commandHUD.innerHTML=[
     '<div data-army-heading style="color:#f6ca82;font-weight:900;letter-spacing:.04em"></div>',
     '<div style="margin-top:3px;font-weight:800"><span data-army-blue style="color:#91d0ff">MAVİ 70</span>',
     ' / <span data-army-red style="color:#f19a8c">KIRMIZI 70</span></div>',
     '<div data-army-status style="font-size:11px;margin:5px 0"></div>',
     fieldLabel('AK-04a · Hangi bölüğü yöneteceksin?'),
     '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">',
     '<button type="button" data-four-squad-index="0">Bölük 1</button>',
     '<button type="button" data-four-squad-index="1">Bölük 2</button>',
     '<button type="button" data-four-squad-index="2">Bölük 3</button>',
     '<button type="button" data-four-squad-index="3">Bölük 4</button>',
     '<button type="button" data-four-squad-all>Tüm 4 Bölük</button>',
     '</div>',
     fieldLabel('Bölük emirleri'),fieldRow,fieldButtons(fieldOrderKeys,'order'),'</div>',
     fieldLabel('Formasyonlar'),fieldRow,fieldButtons(fieldFormationKeys,'formation'),'</div>',
     fieldLabel('Menzilli birlik ateşi'),fieldRow,fieldButtons(fieldFireKeys,'fire'),'</div>',
     fieldLabel('Taktik komuta'),fieldRow,
     '<button type="button" data-field-map-open>P · Taktik harita</button>',
     '<button type="button" data-field-spacing="-0.1">[ · Safı daralt</button>',
     '<button type="button" data-field-spacing="0.1">] · Safı aç</button>',
     '</div>',
     '<div data-army-shortcut-notice role="status" style="font-size:10px;color:#e1ceaa;margin-top:6px"></div>',
     '<details style="margin-top:8px;border-top:1px solid #445566;padding-top:4px">',
     '<summary style="cursor:pointer;color:#f7d58d">8 bölük durumu</summary>',
     '<div data-army-roster style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;margin-top:5px;font-size:10px"></div>',
     '</details>'
   ].join('');
   for(const b of commandHUD.querySelectorAll('button')){
     b.style.border='1px solid #52676a';b.style.borderRadius='5px';
     b.style.background='#1e293b';b.style.color='#e2e8f0';
     b.style.padding='4px 6px';b.style.cursor='pointer';
     b.style.font='700 11px system-ui';
   }
   commandHUD.addEventListener('pointerdown',event=>event.stopPropagation());
   commandHUD.addEventListener('click',event=>event.stopPropagation());
   scene.appendChild(commandHUD);
   for(const b of commandHUD.querySelectorAll('[data-four-squad-index]'))
     b.addEventListener('click',()=>
       setFourSquadSelection(Number(b.dataset.fourSquadIndex)));
   commandHUD.querySelector('[data-four-squad-all]')
     .addEventListener('click',()=>setFourSquadSelection(0,true));
   for(const b of commandHUD.querySelectorAll('[data-field-kind]'))
     b.addEventListener('click',()=>sendArmy(b.dataset.fieldKind,b.dataset.fieldCommand));
   for(const b of commandHUD.querySelectorAll('[data-field-spacing]'))
     b.addEventListener('click',()=>sendArmy('spacing-delta',Number(b.dataset.fieldSpacing)));
   commandHUD.querySelector('[data-field-map-open]')
     .addEventListener('click',()=>setFieldMap(true));
   // Same native G5.4 P key opens a real full-screen command map.
   globalThis.addEventListener('keydown',event=>{
     const focused=String(event.target?.tagName||'').toUpperCase();
     if(!fieldMapOpen&&event.code==='KeyP'&&!event.repeat&&
        !event.ctrlKey&&!event.altKey&&!event.metaKey&&
        !['INPUT','TEXTAREA','SELECT'].includes(focused)&&
        !event.target?.isContentEditable){
       event.preventDefault();event.stopImmediatePropagation();
       setFieldMap(true);return;
     }
     if(!fieldMapOpen)return;
     if(event.code==='KeyP'||event.code==='Escape'){
       event.preventDefault();event.stopImmediatePropagation();
       if(!event.repeat)setFieldMap(false);return;
     }
     // No soldier movement/weapon actions behind an open modal map.
     if(!['INPUT','TEXTAREA','SELECT'].includes(focused)){
       event.preventDefault();event.stopImmediatePropagation();
     }
   },true);
   globalThis.addEventListener('keydown',event=>{
     const command=sharedArmyCommands.shortcut(event);
     if(!command||!sharedCommand)return;
     event.preventDefault();
     shortcutsAccepted++;
     sendArmy(command.action,command.value);
   });
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
   // Compact game HUD and panel are simultaneous views of the
   // EXACT SAME original native player squad and command revision.
   const fieldKeys={hold:'J',advance:'K',line:'Z',
     column:'X',free:'7',volley:'8'};
   for(const b of section.querySelectorAll('[data-g54-action]')){
     const key=fieldKeys[b.dataset.g54Action];
     if(key)b.textContent+=' ['+key+']';
   }
   for(const b of section.querySelectorAll('[data-g54-formation]')){
     const key=fieldKeys[b.dataset.g54Formation];
     if(key)b.textContent+=' ['+key+']';
   }
   for(const b of section.querySelectorAll('[data-g54-fire]')){
     const key=fieldKeys[b.dataset.g54Fire]||
       (b.dataset.g54Fire==='hold'?'9':null);
     if(key)b.textContent+=' ['+key+']';
   }
   const oldHold=document.getElementById('s3-order-hold');
   const oldAdvance=document.getElementById('s3-order-advance');
   if(oldHold)oldHold.textContent='Bölüğüm: mevzi tut [J]';
   if(oldAdvance)oldAdvance.textContent='Bölüğüm: ilerle [K]';
   drawSharedCommandHUD();
   fieldTactical=document.createElement('section');
   fieldTactical.id='ak02-g54-tactical-overlay';
   fieldTactical.dataset.open='false';
   fieldTactical.style.cssText='position:fixed;inset:0;z-index:1200;background:#050d18f0;display:none;align-items:center;justify-content:center;pointer-events:auto;padding:10px;overflow:auto';
   fieldTactical.innerHTML=[
     '<div role="dialog" aria-modal="true" aria-label="G5.4 Taktik Harita"',
     ' style="width:min(650px,97vw);max-height:96vh;overflow:auto;background:#172637;border:1px solid #d7ad59;border-radius:10px;padding:14px;color:#f7efdb;font:12px system-ui">',
     '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">',
     '<strong style="color:#f6c77a">G5.4 TAKTİK HARİTA • KALE KUŞATMASI</strong>',
     '<button type="button" data-field-map-close>Esc · Kapat</button></div>',
     '<div data-field-map-units style="margin:8px 0">140 gerçek asker</div>',
     '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px">',
     '<button type="button" data-field-map-action="position">Hedef seç</button>',
     '<button type="button" data-field-map-action="waypoint">Ara nokta ekle</button>',
     '<button type="button" data-field-map-action="face">Yön belirle</button>',
     '<button type="button" data-field-map-clear>Rotayı temizle</button></div>',
     '<canvas id="ak02-g54-map-canvas" width="550" height="400" aria-label="140 canlı asker içeren 3B kale komuta haritası"',
     ' style="width:100%;height:auto;display:block;max-width:550px;aspect-ratio:11/8;cursor:crosshair;background:#14242d;border:1px solid #ac986f"></canvas>',
     '<p style="color:#cfc5b3">🔴 Kırmızı saldıran · 🔵 Mavi savunan · 🟡 Kendi bölüğün</p>',
     '<div data-field-map-message role="status" style="color:#f2d69d">',
     'Haritaya tıkla: hedef · Shift+tıkla: ara nokta · P/Esc: kapat</div>',
     '<p style="color:#bbc1bc;font-size:10px">Emirler doğrudan özgün G5.4 bölük motoruna gider. Sahte hasar veya işgal oluşturulmaz.</p>',
     '</div>'
   ].join('');
   document.body.appendChild(fieldTactical);
   fieldTactical.addEventListener('pointerdown',event=>event.stopPropagation());
   for(const b of fieldTactical.querySelectorAll('button')){
     b.style.cssText='border:1px solid #a68752;background:#273449;color:#f6e4bf;padding:7px 10px;border-radius:6px;font:700 12px system-ui;cursor:pointer';
   }
   fieldTactical.querySelector('[data-field-map-close]')
     .addEventListener('click',()=>setFieldMap(false));
   fieldTactical.querySelector('[data-field-map-clear]')
     .addEventListener('click',()=>{
       const result=sendArmy('clear-waypoints');
       fieldTactical.querySelector('[data-field-map-message]').textContent=
         result?.ok?'G5.4 ara nokta kuyruğu temizlendi':'G5.4 rota temizlemeyi reddetti';
     });
   for(const b of fieldTactical.querySelectorAll('[data-field-map-action]'))
     b.addEventListener('click',()=>{
       fieldMapAction=b.dataset.fieldMapAction;
       drawFieldMap();
     });
   fieldTactical.querySelector('canvas').addEventListener('click',event=>{
     const canvas=event.currentTarget,rect=canvas.getBoundingClientRect();
     if(!rect.width||!rect.height)return;
     const bounds=map.spec.bounds;
     const x=bounds.minX+Math.max(0,Math.min(1,
       (event.clientX-rect.left)/rect.width))*(bounds.maxX-bounds.minX);
     const z=bounds.maxZ-Math.max(0,Math.min(1,
       (event.clientY-rect.top)/rect.height))*(bounds.maxZ-bounds.minZ);
     const action=event.shiftKey?'waypoint':fieldMapAction;
     const result=sendArmy(action,undefined,x,z);
     fieldMapClicks++;
     if(result?.ok)fieldMapAccepted++;
     fieldTactical.querySelector('[data-field-map-message]').textContent=
       (result?.ok?'G5.4 kabul: ':'G5.4 reddetti: ')+action+
       ' ('+Math.round(x)+', '+Math.round(z)+')'+
       (result?.reason?' • '+result.reason:'');
     drawFieldMap();
   });
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
   getSession:()=>liveSession,
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
 globalThis.ktkSiegeSharedBattleSessionStatus=()=>liveSession?
   sharedBattleSession.snapshot(liveSession):null;
 globalThis.ktkSiegeArmyCommandStatus=()=>sharedCommand?
   displayCommand():null;
 globalThis.ktkSiegeFourSquadCommandStatus=()=>fourCommand?
   fourSquadEngine.snapshot(fourCommand):null;
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
   realFourSquadNativeCommandConnected:!!fourCommand,
   realFourSquadNativeCommand:fourCommand?
     fourSquadEngine.snapshot(fourCommand):null,
   sharedNativeG54BattleSessionConnected:!!liveSession,
   sharedNativeG54BattleSession:liveSession?
     sharedBattleSession.snapshot(liveSession):null,
   sharedNativeG54ArmyCommands:sharedCommand?
     sharedArmyCommands.snapshot(sharedCommand):null,
   exactOriginalFieldArmyHUDReused:false,
   sharedG54ArmyHudOverlayActive:!!commandHUD,
   sharedG54OriginalFieldShortcutsEnabled:!!sharedCommand,
   sharedG54NativeShortcutBindings:sharedCommand?
     Object.keys(sharedArmyCommands.FIELD_KEYS):[],
   sharedG54KeyboardCommandsAccepted:shortcutsAccepted,
   fieldG54HudBottomLeftNativeStyle:true,
   fieldG54RealEightSquadRosterRendered:!!commandHUD?.querySelector('[data-army-roster]')&&
     commandHUD.querySelector('[data-army-roster]').children.length===8,
   fieldG54PMapConnected:!!fieldTactical,
   fieldG54PMapOpen:fieldMapOpen,
   fieldG54MapOpens:fieldMapOpens,
   fieldG54MapCloses:fieldMapCloses,
   fieldG54NativeMapClicks:fieldMapClicks,
   fieldG54NativeAcceptedMapClicks:fieldMapAccepted,
   fieldSquareUsesVToPreserveCastleSlideC:true,
   fullOriginalG54FieldLayoutPixelIdentical:false,
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
