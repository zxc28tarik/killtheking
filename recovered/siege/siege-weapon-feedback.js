/* Kill the King S3D2b — FIRST-PERSON COSMETIC WEAPON / TRUE COMBAT FEEDBACK.
 * Four 3D viewmodels are bound to the actual siege camera, not the firing API.
 * Recoil, flashes, hit markers and hurt flash are ONLY driven by native
 * G5.4 player-combat events/HP. No fake hit, projectile, damage or cooldown.
 * Neither the October FFA nor the historic G5.4 soldier sources are modified.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeWeaponFeedback=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TYPES=Object.freeze(['sword','spear','bow','musket']);
 const ACTUAL_FIRE=Object.freeze(['miss','hit','friendly-block',
   'shield-blocked','no-authorized-target','castle-blocked',
   'arrow-launched']);
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 function create({THREE,scene,camera,sceneRoot=null}={}){
   if(!THREE?.Group||!THREE?.Mesh||!scene?.add||
      !camera?.add)throw Error('S3D2b requires real Three.js siege camera');
   const root=new THREE.Group();
   root.name='S3D2b_RealCameraFirstPersonWeapons';
   camera.add(root);
   // The camera was previously unparented in the S2 preview. Adding it to
   // the same scene makes children render, but does not change native aim.
   if(!camera.parent)scene.add(camera);
   const palette={
     wood:new THREE.MeshStandardMaterial({color:0x6f462c,roughness:.72}),
     leather:new THREE.MeshStandardMaterial({color:0x38271e,roughness:.74}),
     steel:new THREE.MeshStandardMaterial({color:0xb9c5c8,metalness:.56,roughness:.36}),
     dark:new THREE.MeshStandardMaterial({color:0x394247,metalness:.35,roughness:.53}),
     gold:new THREE.MeshStandardMaterial({color:0xe1b65e,metalness:.62,roughness:.3}),
     blue:new THREE.MeshStandardMaterial({color:0x355c78,roughness:.88}),
     string:new THREE.MeshStandardMaterial({color:0xe7d7b5,roughness:.8}),
   };
   const geo={};
   function part(parent,name,shape,args,tone,x,y,z,rx=0,ry=0,rz=0){
     const key=shape+args.join('_');
     if(!geo[key]){
       const C={box:THREE.BoxGeometry,cylinder:THREE.CylinderGeometry,
         sphere:THREE.SphereGeometry,cone:THREE.ConeGeometry}[shape];
       if(!C)throw Error('Invalid viewmodel geometry');
       geo[key]=new C(...args);
     }
     const m=new THREE.Mesh(geo[key],palette[tone]);
     m.name=name;
     m.position.set(x,y,z);m.rotation.set(rx,ry,rz);
     m.castShadow=false;m.frustumCulled=false;
     parent.add(m);return m;
   }
   function makeWeapon(type){
     const g=new THREE.Group();g.name='S3D2b_'+type+'_model';
     const z=-.45;
     // Actual same four 1600s-class silhouettes as the Arena game:
     // role-shaped weapons, cuffs and hands, with compact first-person scale.
     part(g,'left-sleeve','cylinder',[.095,.135,.40,10],'blue',-.23,-.34,-.03,Math.PI/2.9);
     part(g,'left-gauntlet','sphere',[.102,10,8],'leather',-.20,-.20,-.18);
     part(g,'right-sleeve','cylinder',[.11,.145,.43,10],'blue',.29,-.37,.05,Math.PI/2.7);
     part(g,'right-gauntlet','sphere',[.10,10,8],'leather',.28,-.20,-.14);
     if(type==='sword'){
       part(g,'sword-pommel','sphere',[.075,10,8],'gold',.28,-.23,z+.22);
       part(g,'sword-grip','cylinder',[.045,.055,.33,10],'wood',.28,-.025,z+.12,0,0,.22);
       part(g,'sword-guard','box',[.48,.055,.095],'gold',.28,.13,z);
       part(g,'sword-ricasso','box',[.12,.2,.08],'dark',.28,.24,z);
       part(g,'sword-blade','box',[.13,.94,.044],'steel',.28,.77,z);
       part(g,'sword-tip','cone',[.098,.28,4],'steel',.28,1.31,z,0,Math.PI/4);
       part(g,'sword-fuller','box',[.018,.72,.018],'gold',.28,.78,z-.03);
     }else if(type==='spear'){
       part(g,'spear-shaft','cylinder',[.047,.052,2.14,10],'wood',.29,.72,z);
       part(g,'spear-binding','cylinder',[.065,.065,.19,10],'gold',.29,1.76,z);
       part(g,'spear-blade','cone',[.17,.55,8],'steel',.29,2.08,z);
       part(g,'spear-grip','cylinder',[.063,.063,.34,10],'leather',.29,-.03,z);
     }else if(type==='bow'){
       part(g,'bow-grip','cylinder',[.077,.092,.34,10],'wood',.22,-.03,z);
       part(g,'bow-upper','cylinder',[.035,.070,.72,10],'wood',.22,.47,z-.02,0,0,-.26);
       part(g,'bow-lower','cylinder',[.070,.035,.72,10],'wood',.22,-.52,z-.02,0,0,.26);
       part(g,'bow-string','cylinder',[.012,.012,1.64,6],'string',.38,-.025,z-.06);
       part(g,'nocked-arrow','cylinder',[.018,.018,1.07,8],'wood',.22,-.025,z-.44,Math.PI/2);
       part(g,'arrow-point','cone',[.05,.16,8],'steel',.22,-.025,z-1.00,Math.PI/2);
       part(g,'bow-silk-wrap','cylinder',[.093,.097,.11,10],'gold',.22,-.03,z);
     }else{
       part(g,'musket-stock','box',[.19,.19,.98],'wood',.27,-.12,-.15);
       part(g,'musket-cheek','box',[.26,.13,.31],'leather',.27,-.10,.27);
       part(g,'musket-barrel','cylinder',[.053,.053,1.54,12],'steel',.27,-.012,-.91,Math.PI/2);
       part(g,'musket-front-band','cylinder',[.075,.075,.13,10],'gold',.27,-.012,-1.18,Math.PI/2);
       part(g,'musket-muzzle','cylinder',[.069,.069,.10,12],'dark',.27,-.012,-1.68,Math.PI/2);
       part(g,'musket-flintlock','box',[.18,.13,.22],'gold',.17,.053,-.38);
       part(g,'musket-hammer','box',[.065,.12,.08],'steel',.17,.16,-.33);
       part(g,'musket-triggerguard','box',[.13,.045,.22],'gold',.27,-.28,-.15);
       part(g,'musket-frontsight','box',[.032,.067,.065],'gold',.27,.078,-1.49);
     }
     root.add(g);return g;
   }
   const models={};
   for(const w of TYPES)models[w]=makeWeapon(w);
   let visualWeapon='sword',time=0,recoil=0,hitTime=0,hurtTime=0;
   let combatShots=0,hitMarkers=0,damagePulses=0,lastNativeHits=null;
   let isVisible=false,drawPower=0;
   let hitEl=null,hurtEl=null;
   if(sceneRoot){
     if(!sceneRoot.appendChild||!sceneRoot.ownerDocument)
       throw Error('Invalid viewmodel HUD parent');
     const doc=sceneRoot.ownerDocument;
     hitEl=doc.createElement('div');
     hitEl.id='s3d-native-hitmarker';
     hitEl.textContent='×';
     hitEl.setAttribute('aria-hidden','true');
     hitEl.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:700 39px system-ui;color:#fff0bf;text-shadow:0 0 8px #d49b29;pointer-events:none;z-index:6;opacity:0';
     sceneRoot.appendChild(hitEl);
     hurtEl=doc.createElement('div');
     hurtEl.id='s3d-native-hurt-pulse';
     hurtEl.setAttribute('aria-hidden','true');
     hurtEl.style.cssText='position:absolute;inset:0;border:0 solid #b6312d;pointer-events:none;z-index:5;opacity:0';
     sceneRoot.appendChild(hurtEl);
   }
   function select(type){
     if(!TYPES.includes(type))throw Error('Unsupported siege cosmetic weapon '+type);
     visualWeapon=type;recoil=0;drawPower=0;
     for(const t of TYPES)models[t].visible=t===type;
   }
   function reset(type='sword'){
     select(type);recoil=0;hitTime=0;hurtTime=0;combatShots=0;
     hitMarkers=0;damagePulses=0;lastNativeHits=null;
     if(hitEl)hitEl.style.opacity='0';
     if(hurtEl)hurtEl.style.opacity='0';
   }
   function consume(result){
     if(!result||typeof result.status!=='string')
       throw Error('Only native player-combat results may drive feedback');
     if(!TYPES.includes(result.weapon))return;
     if(ACTUAL_FIRE.includes(result.status)&&
        !result.sourceProjectileImpact){
       combatShots++;recoil=1;
     }
     if(result.status==='hit'&&result.hit===true&&
        finite(result.damage)&&result.damage>0){
       hitTime=.22;hitMarkers++;
     }
   }
   function update(dt,snapshot,pose={}){
     if(!finite(dt)||dt<0||dt>.15||
        !snapshot||!TYPES.includes(snapshot.weapon)||
        !finite(snapshot.playerHealth))
       throw Error('Invalid genuine G5.4 feedback frame');
     if(visualWeapon!==snapshot.weapon)select(snapshot.weapon);
     const active=snapshot.view==='fps'&&snapshot.playerHealth>0;
     root.visible=active;isVisible=active;
     time+=dt;
     recoil=Math.max(0,recoil-dt*(visualWeapon==='musket'?2.7:5.5));
     hitTime=Math.max(0,hitTime-dt);
     hurtTime=Math.max(0,hurtTime-dt);
     if(lastNativeHits!==null&&finite(snapshot.receivedNativeHits)&&
        snapshot.receivedNativeHits>lastNativeHits){
       hurtTime=.34;damagePulses+=snapshot.receivedNativeHits-lastNativeHits;
     }
     if(finite(snapshot.receivedNativeHits))
       lastNativeHits=snapshot.receivedNativeHits;
     drawPower=visualWeapon==='bow'&&finite(snapshot.pendingBowDrawSeconds)
       ?clamp(snapshot.pendingBowDrawSeconds/3,0,1):0;
     const locomotion=pose.locomotion||{};
     const vel=Math.hypot(locomotion.vx||0,locomotion.vz||0);
     const bob=active?.013*Math.sin(time*8.2)*clamp(vel/13.5,0,1):0;
     const kick=visualWeapon==='musket'?recoil*.13:recoil*.055;
     root.position.set(.18, -.17+bob-drawPower*.012,
       -.59+kick+drawPower*.06);
     root.rotation.set(visualWeapon==='musket'?-recoil*.25:
       visualWeapon==='bow'?-drawPower*.12:recoil*.32,
       recoil*(visualWeapon==='sword'?-.43:.1),
       recoil*(visualWeapon==='spear'?-.2:.14));
     // Presentation flags are NEVER used to change native aim or damage.
     if(hitEl)hitEl.style.opacity=active&&hitTime>0?'1':'0';
     if(hurtEl){
       hurtEl.style.opacity=active&&hurtTime>0?
         String(clamp(hurtTime/.34,0,1)*.85):'0';
       hurtEl.style.borderWidth=active&&hurtTime>0?'18px':'0';
     }
     return status();
   }
   function status(){
     return Object.freeze({
       actualThreeJSViewmodels:true,modelCount:4,
       modelNames:TYPES.map(t=>models[t].name),
       visibleWeapon:visualWeapon,visibleFPS:isVisible,
       nativeShotFeedbackEvents:combatShots,
       nativeHitMarkers:hitMarkers,
       nativeReceivedDamagePulses:damagePulses,
       drawVisualCharge:drawPower,
       fakeProjectilesCreated:0,
       damageOrCooldownRulesModified:false,
       sameArenaViewmodelSource:false
     });
   }
   reset();
   return Object.freeze({select,reset,consume,update,status});
 }
 return Object.freeze({create,TYPES});
});
