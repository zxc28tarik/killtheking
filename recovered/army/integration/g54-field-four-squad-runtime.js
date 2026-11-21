/* AK-04b field-mode adapter, injected ONLY into the decoded, running army
 * iframe by the existing three-game router. The original G5.4 BASE64
 * payload and FFA source remain byte-identical to the pre-adaptation build.
 * This script executes after the historical G5.4 main script, but before
 * any human starts a battle. It wraps public create/step calls, and never
 * copies or alters the original native physics, HP, weapons or soldier AI.
 */
(function(root){
 'use strict';
 const native=root.ArenaArmyBattle;
 const shared=root.KTKG54FourSquadCommand;
 if(!native?.create||!native?.step||!native?.setTargetSquad||
    !shared?.create||!shared?.beginNativeTick||!shared?.execute)
   throw Error('AK-04b requires original live G5.4 and authentic four-squad authority');
 const hud=document.getElementById('meadow-army-hud');
 const mapOverlay=document.getElementById('army-tactical-overlay');
 const tacticalCanvas=document.getElementById('army-tactical-canvas');
 const mapMessage=document.getElementById('army-map-message');
 if(!hud||!mapOverlay||!tacticalCanvas||!mapMessage)
   throw Error('AK-04b requires original G5.4 live field commander HUD/map');
 let active=null,mapZoom=240,mapAction='destination',mapClicks=0,
   mapAccept=0,domCommands=0,keyCommands=0,statesCreated=0,
   deliberateCommanderResumes=0;
 const TYPES={sword:'Kılıçlı',pike:'Mızrakçı',bow:'Okçu',musket:'Tüfekçi'};
 // Original field C=square and V=quick ability. Preserve V combat input.
 const FORM_KEYS={KeyZ:'line',KeyX:'column',KeyC:'square',
   KeyB:'wedge',KeyM:'loose',KeyI:'shield'};
 const ORDER_KEYS={KeyG:'follow',KeyJ:'hold',KeyK:'advance',
   KeyL:'charge',KeyU:'retreat',KeyY:'flank',KeyN:'skirmish'};
 const FIRE_KEYS={Digit7:'free',Digit8:'volley',Digit9:'hold'};
 const mapFor=state=>({
   spec:{
     bounds:{minX:-native.BOUNDS,maxX:native.BOUNDS,
       minZ:-native.BOUNDS,maxZ:native.BOUNDS},
     get boxes(){return (state.worldObstacles||[]).map(o=>({
       x:(o.minX+o.maxX)/2,z:(o.minZ+o.maxZ)/2,
       w:o.maxX-o.minX,d:o.maxZ-o.minZ,
       solid:true,id:'field-obstacle'
     }));}
   }
 });
 const enhanced=Object.freeze({...native,
   create(...args){
     const state=native.create(...args);
     const bridge={state,scenario:{phase:'APPROACH',gate:{open:false}}};
     const cmd=shared.create({engine:native,bridge,map:mapFor(state)});
     active={state,bridge,cmd};
     statesCreated++;
     render();
     return state;
   },
   step(state,dt){
     if(!active||active.state!==state)return native.step(state,dt);
     const leased=shared.beginNativeTick(active.cmd);
     try{return native.step(state,dt);}
     finally{if(leased)shared.endNativeTick(active.cmd);}
   }
 });
 root.ArenaArmyBattle=enhanced;
 function status(){
   if(!active)return {
     kind:'AK04B_FIELD_NATIVE_G54_FOUR_SQUAD_RUNTIME_ADAPTER',
     enabled:true,gameStarted:false,statesCreated,
     originalSourcePayloadPreserved:true,
     physicalSoldierCount:null,mode:'field',mapClicks,
     mapAccepted:mapAccept,domCommands,keyCommands
   };
   const snap=shared.snapshot(active.cmd);
   return {...snap,mode:'field',gameStarted:true,
     originalSourcePayloadPreserved:true,
     adapterUsesOnlyOriginalNativeG54PublicAPI:true,
     statesCreated,mapClicks,mapAccepted:mapAccept,domCommands,keyCommands,
     deliberateCommanderResumes,
     realNativeGameTick:active.state.tick,
     realNativePlayerHealth:active.state.playerHealth,
     realNativeArmyWinner:active.state.winner,
     realOriginalMatchPhase:typeof arenaMatch==='undefined'?
       'unavailable':arenaMatch.phase,
     realOriginalGameIsActive:typeof isGameActive==='undefined'?
       false:isGameActive,
     fieldNativeMeleeAndRangedDamageUnmodified:true,
     mapOriginalFieldZoom:mapZoom,
     nativeFieldGameSourceEdited:false};
 }
 root.ktkFieldFourSquadStatus=status;
 function selectedIsOnlyPhysical(){
   if(!active)return true;
   const c=active.cmd;
   return c.selected.length===1&&c.selected[0]===c.realOwnerId;
 }
 function activateCommander(){
   if(!active)return;
   // The historic field FPS pauses on ESC/pointer-unlock. A deliberate
   // click on this unit-commander toolbar must be able to resume native
   // G5.4 AI combat WITHOUT recapturing the mouse (the player is issuing
   // orders). Normal ESC alone still pauses as in the original game.
   if(typeof arenaMatch==='undefined'||typeof isGameActive==='undefined'||
      typeof menuOverlay==='undefined')
     throw Error('Missing historic G5.4 field match lifecycle');
   if(arenaMatch.phase==='paused'){
     ArenaMatch.resume(arenaMatch);
     isGameActive=arenaMatch.phase==='playing';
     if(isGameActive){
       menuOverlay.classList.add('hidden');
       deliberateCommanderResumes++;
     }
   }
 }
 function command(action,value,x,z){
   if(!active)return {ok:false,reason:'No real G5.4 field army started'};
   activateCommander();
   const result=shared.execute(active.cmd,{action,value,x,z});
   if(result.someAccepted)domCommands++;
   show(result.ok?'✓ '+action+' · '+result.accepted+' bölük':
     (result.someAccepted?'✓ Kısmi: ':'× ')+action+' · '+
     result.accepted+'/'+result.results.length+' · '+(result.reason||''));
   render();
   return result;
 }
 function show(text){
   const msg=document.getElementById('ak04-field-message');
   if(msg)msg.textContent=text;
   const another=document.getElementById('ak04-field-map-message');
   if(another)another.textContent=text;
 }
 function choose(index,all){
   if(!active)throw Error('No original native G5.4 match');
   activateCommander();
   const ids=shared.snapshot(active.cmd).authorizedFriendlySquadIds;
   if(all)shared.pickAll(active.cmd);
   else shared.select(active.cmd,ids[index]);
   render();
   return status();
 }
 function controls(id){
   const suffix=id;
   const bar=document.createElement('div');
   bar.className='ak04-field-selector';
   bar.dataset.ak04Selector=suffix;
   bar.style.cssText='background:#132536ed;border:1px solid #ba9254;border-radius:8px;padding:8px 9px;margin:7px 0;color:#f8dfb1;font:700 11px system-ui;pointer-events:auto';
   const heading=document.createElement('div');
   heading.textContent='⚔ AK-04 · 4 GERÇEK G5.4 BÖLÜĞÜ';
   heading.style.cssText='font-weight:900;letter-spacing:.02em;margin-bottom:5px';
   bar.append(heading);
   const row=document.createElement('div');
   row.style.cssText='display:flex;gap:5px;flex-wrap:wrap';
   for(let i=0;i<4;i++){
     const b=document.createElement('button');
     b.type='button';b.dataset.ak04Pick=String(i);
     b.textContent='Bölük '+(i+1);
     row.append(b);
     b.addEventListener('click',()=>choose(i,false));
   }
   const all=document.createElement('button');
   all.type='button';all.dataset.ak04All='true';all.textContent='Tüm 4 Bölük';
   row.append(all);all.addEventListener('click',()=>choose(0,true));
   bar.append(row);
   const details=document.createElement('div');
   details.dataset.ak04Status='';
   details.style.cssText='margin-top:5px;color:#e5e7eb;font-weight:600';
   details.textContent='Meydan Savaşı başladığında dört gerçek bölük seçilebilir';
   bar.append(details);
   const notice=document.createElement('div');
   notice.id='ak04-field-'+suffix+'-message';
   notice.setAttribute('role','status');
   notice.style.cssText='margin-top:4px;font-weight:600;color:#f4cc88';
   bar.append(notice);
   for(const b of bar.querySelectorAll('button')){
     b.style.cssText='color:#f2e3c5;border:1px solid #65768b;background:#263449;padding:5px 7px;border-radius:5px;cursor:pointer';
   }
   return bar;
 }
 const originalCommander=controls('hud');
 hud.prepend(originalCommander);
 const tacticalCommander=controls('map');
 // Native G5.4's original left-bottom HUD can extend past a visible
 // play viewport. This floating, fixed commander stays clickable while
 // the historic HUD and original game layout remain untouched.
 const floating=controls('floating');
 floating.id='ak04-field-floating-commander';
 floating.style.cssText='position:fixed;right:12px;top:75px;z-index:999999;'+
   'width:min(455px,calc(100vw - 24px));max-height:43vh;overflow:auto;'+
   'display:none;background:rgba(13,27,44,.97);padding:9px 10px;'+
   'border:2px solid #d8ac64;border-radius:9px;'+
   'box-shadow:0 8px 25px rgba(0,0,0,.7);color:#f8dfb1;'+
   'font:700 11px system-ui;pointer-events:auto';
 document.body.append(floating);
 const header=mapOverlay.querySelector('h2, h3, strong, p')||mapOverlay.firstElementChild;
 if(header?.parentElement)header.insertAdjacentElement('afterend',tacticalCommander);
 else mapOverlay.prepend(tacticalCommander);
 const extra=document.createElement('div');
 extra.id='ak04-field-extra-commands';
 extra.style.cssText='display:flex;gap:5px;flex-wrap:wrap;margin-top:6px';
 const specs=[
  ['order','hold','Mevzi [J]'],['order','advance','İlerle [K]'],
  ['order','charge','Hücum [L]'],['order','retreat','Geri çekil [U]'],
  ['formation','line','Saf [Z]'],['formation','shield','Kalkan [I]'],
  ['fire','free','Serbest ateş [7]'],['fire','volley','Toplu ateş [8]'],
  ['fire','hold','Ateşi kes [9]']
 ];
 for(const [action,value,label]of specs){
   const b=document.createElement('button');
   b.type='button';b.dataset.ak04Action=action;b.dataset.ak04Value=value;
   b.textContent=label;b.style.cssText='background:#273449;color:#f9e7c1;padding:4px 7px;border:1px solid #78674d;border-radius:5px;cursor:pointer';
   b.addEventListener('click',()=>command(action,value));
   extra.append(b);
 }
 originalCommander.append(extra);
 const floatCommands=document.createElement('div');
 floatCommands.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin-top:7px';
 for(const [action,value,label]of specs){
   const btn=document.createElement('button');
   btn.type='button';btn.textContent=label;
   btn.dataset.ak04Action=action;btn.dataset.ak04Value=value;
   btn.style.cssText='border:1px solid #8a754e;background:#263449;'+
     'color:#f9e7c1;border-radius:5px;padding:5px 7px;cursor:pointer';
   btn.addEventListener('click',()=>command(action,value));
   floatCommands.append(btn);
 }
 floating.append(floatCommands);
 function render(){
   if(!active)return;
   const snap=shared.snapshot(active.cmd);
   const names=snap.squads.filter(s=>s.selected)
     .map(s=>TYPES[s.type]+' '+s.alive+'/'+s.startCount);
   const summary='Seçim: '+names.join(' + ')+
     ' • Fiziksel oyuncu: '+TYPES[active.state.playerType]+
     ' • gerçek G5.4 komut';
   // Keep commander accessible while native ESC has paused the battle;
   // only a conscious commander click resumes. Old full HUD may hide.
   floating.style.display=(
     !hud.classList.contains('hidden')||
     (typeof arenaMatch!=='undefined'&&arenaMatch.phase==='paused'))&&
     mapOverlay.classList.contains('hidden')?'block':'none';
   for(const bar of [originalCommander,tacticalCommander,floating]){
     bar.querySelector('[data-ak04-status]').textContent=summary;
     for(const b of bar.querySelectorAll('[data-ak04-pick]')){
       const i=Number(b.dataset.ak04Pick),s=snap.squads[i];
       if(!s)continue;
       b.textContent=TYPES[s.type]+' '+s.alive;
       b.disabled=!s.alive;
       const on=snap.selectedSquadIds.length===1&&
         snap.selectedSquadIds[0]===s.id;
       b.setAttribute('aria-pressed',String(on));
       b.style.borderColor=on?'#ffcd63':'#65768b';
       b.style.background=on?'#854d0e':'#263449';
     }
     const all=bar.querySelector('[data-ak04-all]');
     all.setAttribute('aria-pressed',String(snap.selectedSquadIds.length===4));
     all.style.background=snap.selectedSquadIds.length===4?'#854d0e':'#263449';
   }
 }
 // Native field HUD buttons retain their original handlers for the physical
 // player's squad. When a different or grouped allied squad is selected,
 // capture the click FIRST and delegate the SAME original G5.4 public method.
 document.addEventListener('click',e=>{
   if(!active||selectedIsOnlyPhysical())return;
   const target=e.target.closest?.(
     '[data-army-order],[data-army-formation],[data-army-fire],'+
     '[data-army-spacing],[data-army-depth],'+
     '#army-frontage-minus,#army-frontage-plus,'+
     '#army-map-clear-waypoints,#army-map-clear-facing');
   if(!target)return;
   let action,value;
   if(target.matches('[data-army-order]')){
     if(target.dataset.armyOrder==='position'){
       e.stopImmediatePropagation();e.preventDefault();
       document.getElementById('army-open-map')?.click();return;
     }
     action='order';value=target.dataset.armyOrder;
   }else if(target.matches('[data-army-formation]')){
     action='formation';value=target.dataset.armyFormation;
   }else if(target.matches('[data-army-fire]')){
     action='fire';value=target.dataset.armyFire;
   }else if(target.matches('[data-army-spacing]')){
     action='spacing';value=Number(target.dataset.armySpacing);
   }else if(target.matches('[data-army-depth]')){
     action='depth';value=Number(target.dataset.armyDepth);
   }else if(target.id==='army-frontage-minus'||
             target.id==='army-frontage-plus'){
     action='frontage';
     const first=active.state.squads[active.cmd.selected[0]];
     value=Math.max(2,Math.min(first.startCount,
       (first.frontage||6)+(target.id.endsWith('plus')?1:-1)));
   }else if(target.id==='army-map-clear-waypoints'){
     action='clear-waypoints';
   }else if(target.id==='army-map-clear-facing'){
     action='clear-face';
   }
   if(action){
     e.preventDefault();e.stopImmediatePropagation();
     command(action,value);
   }
 },true);
 // Native game hotkeys keep working unchanged when the real personal squad
 // is selected. Delegation occurs before the original game's bubble listener.
 root.addEventListener('keydown',e=>{
   if(!active||selectedIsOnlyPhysical()||e.repeat||
     e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;
   if(e.target?.isContentEditable||
     ['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;
   if(!mapOverlay.classList.contains('hidden'))return;
   let action,value;
   if(ORDER_KEYS[e.code]){action='order';value=ORDER_KEYS[e.code];}
   else if(FORM_KEYS[e.code]){action='formation';value=FORM_KEYS[e.code];}
   else if(FIRE_KEYS[e.code]){action='fire';value=FIRE_KEYS[e.code];}
   else if(e.code==='BracketLeft'||e.code==='BracketRight'){
     action='spacing-delta';value=e.code==='BracketLeft'?-.1:.1;
   }
   if(action){
     e.preventDefault();e.stopImmediatePropagation();
     keyCommands++;command(action,value);
   }
 },true);
 // Historical field P map zoom+cursor coordinates (not castle's alternate
 // north-up frame). Intercept only delegated clicks; physical own unit keeps
 // the old exact original event handler and original enemy-targeting code.
 document.addEventListener('click',e=>{
   const el=e.target.closest?.('[data-army-map-zoom],[data-army-map-action]');
   if(!el)return;
   if(el.dataset.armyMapZoom)mapZoom=Number(el.dataset.armyMapZoom);
   if(el.dataset.armyMapAction)mapAction=el.dataset.armyMapAction;
 },true);
 tacticalCanvas.addEventListener('click',e=>{
   if(!active||selectedIsOnlyPhysical()||
      mapOverlay.classList.contains('hidden'))return;
   e.preventDefault();e.stopImmediatePropagation();
   mapClicks++;
   const rect=tacticalCanvas.getBoundingClientRect(),size=tacticalCanvas.width;
   if(rect.width<=0||rect.height<=0)return;
   const px=(e.clientX-rect.left)*size/rect.width;
   const py=(e.clientY-rect.top)*tacticalCanvas.height/rect.height;
   const x=(px-size/2)*(2*mapZoom/size);
   const z=(py-tacticalCanvas.height/2)*(2*mapZoom/size);
   let action=mapAction,value;
   if(mapAction==='destination')action='position';
   else if(mapAction==='facing')action='face';
   else if(mapAction==='enemy'){
     action='target';
     const closest=active.state.squads
       .filter(q=>q.alive&&q.team!==active.state.playerTeam)
       .sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];
     const pixelDist=closest?Math.hypot(closest.x-x,closest.z-z)*
       size/(2*mapZoom):Infinity;
     value=pixelDist<=18?closest.id:null;
   }
   const res=command(action,value,x,z);
   if(res.someAccepted)mapAccept++;
   mapMessage.textContent=res.someAccepted?
     '✓ G5.4 '+res.accepted+'/'+res.results.length+' bölük · '+action:
     '× G5.4: '+res.reason;
 },true);
 // Selected-unit route glyphs over the original full G5.4 tactical canvas;
 // no fake army dots, no movement/physics modification.
 const frame=document.createElement('div');
 frame.style.cssText='width:100%;max-width:460px;position:relative;margin:auto';
 tacticalCanvas.parentNode.insertBefore(frame,tacticalCanvas);
 frame.append(tacticalCanvas);
 const overlay=document.createElement('canvas');
 overlay.id='ak04-field-map-markers';
 overlay.width=tacticalCanvas.width;overlay.height=tacticalCanvas.height;
 overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
 frame.append(overlay);
 function plot(){
   if(!active||mapOverlay.classList.contains('hidden'))return;
   const c=overlay.getContext('2d'),w=overlay.width,h=overlay.height;
   c.clearRect(0,0,w,h);
   // MAP2-V1 tactical-map visual polish: only UI pixels, not the 3D world.
   // The thin survey grid scales with the existing zoom and does not
   // intercept clicks, add fake soldiers or modify the native pathfinder.
   c.save();
   c.strokeStyle='rgba(210,225,182,.16)';
   c.lineWidth=1;
   const spacing=w*40/(2*mapZoom);
   if(spacing>=15){
     c.beginPath();
     for(let x=w/2%spacing;x<w;x+=spacing){c.moveTo(x,0);c.lineTo(x,h);}
     for(let y=h/2%spacing;y<h;y+=spacing){c.moveTo(0,y);c.lineTo(w,y);}
     c.stroke();
   }
   c.strokeStyle='rgba(251,222,157,.5)';
   c.beginPath();c.moveTo(w/2-10,h/2);c.lineTo(w/2+10,h/2);
   c.moveTo(w/2,h/2-10);c.lineTo(w/2,h/2+10);c.stroke();
   c.fillStyle='rgba(241,234,210,.78)';
   c.font='11px system-ui';
   c.fillText('KUZEY',w/2-19,17);
   c.restore();
   const ids=shared.snapshot(active.cmd).selectedSquadIds;
   for(let n=0;n<ids.length;n++){
     const squad=active.state.squads[ids[n]];
     const x=w/2+squad.x*w/(2*mapZoom),y=h/2+squad.z*w/(2*mapZoom);
     c.strokeStyle='#ffe19b';c.fillStyle='#fff4cb';
     c.lineWidth=2.5;
     c.beginPath();c.arc(x,y,9+n*1.7,0,Math.PI*2);c.stroke();
     c.font='bold 10px system-ui';c.fillText(TYPES[squad.type],x+11,y-9);
     if(squad.routeGoal){
       const to=point=>({x:w/2+point.x*w/(2*mapZoom),
         y:h/2+point.z*w/(2*mapZoom)});
       const dest=to(squad.routeGoal);
       c.beginPath();c.moveTo(x,y);c.lineTo(dest.x,dest.y);
       for(const q of squad.waypoints||[]){
         const p=to(q);c.lineTo(p.x,p.y);
       }
       c.stroke();c.fillRect(dest.x-3,dest.y-3,6,6);
     }
   }
 }
 root.setInterval(()=>{render();plot();},230);
 render();
})(typeof globalThis!=='undefined'?globalThis:window);
