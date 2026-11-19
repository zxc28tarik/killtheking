/* S1 — visual castle/siege OBJECTIVE PREVIEW ONLY.
 * 140 InstancedMesh tokens are deployment markers, NOT real soldier AI.
 * Buttons inject DEBUG events into the isolated siege FSM; S3 connects real army.
 */
(function(){
 'use strict';
 const THREE=globalThis.THREE;
 const layout=globalThis.KTKSiegemap;
 const rules=globalThis.KTKSiegeObjectives;
 const traversal=globalThis.KTKSiegeTraversal;
 const error=document.getElementById('status-error');
 function fail(err){
   error.style.display='block';
   error.textContent='S1 kuşatma önizleme hatası: '+String(err?.stack||err);
   console.error(err);
 }
 if(!THREE||!layout||!rules||!traversal){
   fail('Three.js veya S1 kuşatma modülleri eksik');return;
 }
 const validation=layout.validate();
 if(!validation.ok){fail(validation.errors.join(' | '));return;}
 const spec=layout.spec;
 let siege=rules.createScenario();
 const root=document.getElementById('scene');
 const scene=new THREE.Scene();
 scene.background=new THREE.Color(0xa9bec0);
 scene.fog=new THREE.Fog(0xa8c0c0,240,580);
 const camera=new THREE.PerspectiveCamera(55,1,.1,900);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,
   powerPreference:'high-performance'});
 renderer.setClearColor(0xa9bec0,1);
 renderer.setPixelRatio(Math.min(1.4,globalThis.devicePixelRatio||1));
 renderer.shadowMap.enabled=false; // First-pass preview; no GPU perf claim.
 renderer.outputEncoding=THREE.sRGBEncoding;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.05;
 root.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xe8f8ff,0x65503a,1.2));
 const sun=new THREE.DirectionalLight(0xffdbb0,1.7);
 sun.position.set(-84,140,75);scene.add(sun);
 const colors={
   wall:0x8a8270,'keep-wall':0x686f73,roof:0x4a4542,
   battlement:0xa59c83,gate:0x65402a,cover:0x847e6b
 };
 const material=(hex,roughness=1)=>new THREE.MeshStandardMaterial({
   color:hex,roughness,metalness:0});
 const mats={};
 for(const [k,v] of Object.entries(colors))mats[k]=material(v);
 const addBlock=(w,h,d,x,y,z,mat,shadow=true)=>{
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
   mesh.position.set(x,y,z);mesh.receiveShadow=shadow;
   scene.add(mesh);return mesh;
 };
 // Courtyard and earth all use the original low-poly, simple stylization.
 addBlock(270,1,220,0,-.55,-23,material(0x62775b));
 addBlock(106,.14,99,0,.02,7.5,material(0x777b60));
 addBlock(21,.12,77,0,.04,-82,material(0x9b9075));
 addBlock(116,.13,6,0,.04,-44,material(0x988d6f));
 addBlock(35,.15,22,0,.06,32,material(0x9e997e));
 // Weathered paving strips, not physics solids.
 for(let j=0;j<13;j++){
   addBlock(17,.018,1.1,0,.16,-113+j*7,material(j%2?0xaaa58b:0x938a76));
 }
 const meshesById=new Map();
 for(const box of spec.boxes){
   const mesh=addBlock(box.w,Math.max(.08,box.h),box.d,
     box.x,box.y+Math.max(.08,box.h)/2,box.z,mats[box.type]||mats.wall);
   mesh.userData.layoutId=box.id;meshesById.set(box.id,mesh);
   if(box.type==='wall'){
     // Blocky battlement notches give the original stylized Krunker feeling.
     const longX=box.w>box.d;
     const count=Math.max(2,Math.floor((longX?box.w:box.d)/6));
     for(let k=0;k<count;k++){
       const u=(k+.5)/count-.5;
       const x=box.x+(longX?u*box.w:0);
       const z=box.z+(longX?0:u*box.d);
       addBlock(longX?2.3:box.w,1.4,longX?box.d:2.3,
         x,box.h+.7,z,material(0xa9a08b));
     }
   }
 }
 // Two low-poly towers on the outer corners, guarding the main gate.
 for(const [x,z] of [[-51,-40],[51,-40],[-51,55],[51,55]]){
   const tower=new THREE.Mesh(new THREE.CylinderGeometry(7,7.8,19,8),
     material(0x77776f));tower.position.set(x,9.5,z);scene.add(tower);
   const crown=new THREE.Mesh(new THREE.CylinderGeometry(8.2,8.2,2.3,8),
     material(0xb0a38a));crown.position.set(x,20.1,z);scene.add(crown);
 }
 // Real gate is a solid map obstacle now, hidden only when the FSM breaches it.
 const gate=meshesById.get('gate-main');
 const gateDecor=new THREE.Group();scene.add(gateDecor);
 const metal=material(0x3c3e40,.55);
 for(let x=-6.5;x<=6.5;x+=2.6){
   const bar=new THREE.Mesh(new THREE.BoxGeometry(.24,9.2,.45),metal);
   bar.position.set(x,5.1,-37.05);gateDecor.add(bar);
 }
 for(const y of [2.2,7.7]){
   const band=new THREE.Mesh(new THREE.BoxGeometry(15,.28,.4),metal);
   band.position.set(0,y,-37.0);gateDecor.add(band);
 }
 function addFlag(x,z,team){
   addBlock(.25,9,.25,x,4.5,z,metal);
   const flag=new THREE.Mesh(new THREE.BoxGeometry(4,2.1,.2),
     material(team==='red'?0xcc5546:0x4f9abe));
   flag.position.set(x+2,7.8,z);scene.add(flag);
 }
 for(const [x,z,t] of [[-48,-35,'blue'],[48,-35,'blue'],
   [-25,-112,'red'],[25,-112,'red'],[0,42,'blue']])addFlag(x,z,t);
 const rampMat=material(0xa48e64);
 const ladderMeshes={};
 for(const side of ['west','east']){
   const x=side==='west'?-53:53,z=-9;
   const ramp=addBlock(15,.65,4.5,x,6.3,z,rampMat);
   ramp.rotation.z=side==='west'?.66:-.66;
   ramp.visible=false;
   ladderMeshes[side]=ramp;
   for(let k=0;k<7;k++){
     const step=new THREE.Mesh(new THREE.BoxGeometry(.7,1.1,4.6),
       material(0x64563e));
     step.position.set((k-3)*1.8,0,0);
     ramp.add(step);
   }
 }
 // 70 BLUE + 70 RED stationary *deployment tokens* (NOT G5.4 soldiers).
 // Class color variation, repeated shared geometry and instanced rendering.
 const armyTokens=[];
 const geometry=new THREE.CylinderGeometry(.55,.67,2.4,6);
 const roleColors={
   red:{sword:0xd15441,pike:0xb34d38,archer:0xf27f54,musket:0x8e332f},
   blue:{sword:0x5595b5,pike:0x3d799e,archer:0x82bad1,musket:0x294e80}
 };
 const dummy=new THREE.Object3D();
 for(const team of ['red','blue']){
   for(const [role,count] of Object.entries(spec.composition)){
     const center=spec.spawns[team][role];
     const inst=new THREE.InstancedMesh(geometry,material(roleColors[team][role]),count);
     inst.instanceMatrix.setUsage(THREE.StaticDrawUsage);
     const width=5;
     for(let i=0;i<count;i++){
       const c=i%width,r=Math.floor(i/width);
       dummy.position.set(center[0]+(c-2)*3,1.2,
         center[1]+(r-(Math.ceil(count/width)-1)/2)*3);
       dummy.scale.set(role==='pike'?.8:1,
         role==='archer'?.83:role==='musket'?.92:1,1);
       dummy.rotation.set(0,0,0);dummy.updateMatrix();
       inst.setMatrixAt(i,dummy.matrix);
     }
     inst.instanceMatrix.needsUpdate=true;
     inst.userData={team,role,count,visualOnly:true};
     scene.add(inst);armyTokens.push(inst);
   }
 }
 // Objective rings/labels, suspended slightly above ground.
 const objectiveMeshes={};
 function createRing(id,zone,color){
   const mesh=new THREE.Mesh(new THREE.RingGeometry(
     Math.min(zone.w,zone.d)*.35,Math.min(zone.w,zone.d)*.40,48),
     new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,
       transparent:true,opacity:.85,depthWrite:false}));
   mesh.rotation.x=-Math.PI/2;
   mesh.position.set(zone.x,.25,zone.z);scene.add(mesh);
   objectiveMeshes[id]=mesh;
 }
 createRing('courtyard',spec.areas.courtyard,0xefba5d);
 createRing('keep',spec.areas.keep,0xe7a948);
 function label(text,x,z,fill='#f9efd8'){
   const cv=document.createElement('canvas');cv.width=512;cv.height=96;
   const ctx=cv.getContext('2d');
   ctx.fillStyle='#243027cf';ctx.fillRect(3,10,506,70);
   ctx.strokeStyle='#b79b61';ctx.lineWidth=3;ctx.strokeRect(3,10,506,70);
   ctx.fillStyle=fill;ctx.font='bold 32px Segoe UI,system-ui';
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,45);
   const tex=new THREE.CanvasTexture(cv);
   const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
     map:tex,transparent:true,depthTest:false}));
   sprite.position.set(x,13,z);sprite.scale.set(24,4.5,1);
   scene.add(sprite);
 }
 label('DIŞ SALDIRI HATTI',0,-119);
 label('KALE KAPISI',0,-43);
 label('İÇ AVLU',0,3);
 label('İÇ KALE',0,37);
 label('BATI ÇIKIŞI',-55,-13);
 label('DOĞU ÇIKIŞI',55,-13);
 // S2 EXPLORATION: one physical player avatar with *actual* swept world
 // collision, keyboard movement, gate collider removal and guided climbs.
 // Army soldier markers remain NONCOMBAT and no S1 siege events are forged.
 const explorer={view:'orbit',team:'red',
   position:{x:0,y:0,z:-110},yaw:0,pitch:0,
   keys:Object.create(null),climb:null,walkTicks:0,
   blockedX:false,blockedZ:false,status:'Başlangıç',
   qaPositionChanges:0};
 const playerGlyph=new THREE.Group();
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.65,.8,2.0,7),
   material(0xdfb679));
 body.position.y=1.45;playerGlyph.add(body);
 const helm=new THREE.Mesh(new THREE.SphereGeometry(.61,9,6),
   material(0xece9d9));helm.position.y=2.8;playerGlyph.add(helm);
 const arrow=new THREE.Mesh(new THREE.ConeGeometry(.75,2,5),
   material(0xf3d06b));
 arrow.rotation.x=Math.PI/2;arrow.position.set(0,2.0,1.1);
 playerGlyph.add(arrow);scene.add(playerGlyph);
 const mini=document.getElementById('siege-mini-map');
 const mini2d=mini.getContext('2d');
 function updatePlayerGlyph(){
   playerGlyph.position.set(explorer.position.x,explorer.position.y,
     explorer.position.z);
   playerGlyph.rotation.y=explorer.yaw;
   playerGlyph.visible=explorer.view!=='fps';
   body.material.color.setHex(explorer.team==='red'?0xd96648:0x5ab4cb);
 }
 function selectSide(team){
   if(!['red','blue'].includes(team))throw Error('Unknown player army side');
   const [x,z]=spec.spawns[team].commander;
   explorer.team=team;
   explorer.position=traversal.spawn({x,y:0,z},spec,
     rules.snapshot(siege));
   explorer.yaw=team==='red'?0:Math.PI;
   explorer.climb=null;explorer.status='Güvenli takım doğuşu';
   updatePlayerGlyph();
 }
 function qaLocate(where){
   const points={
     gate:{x:0,y:0,z:-44.65},
     west:{x:-59,y:0,z:-9},
     east:{x:59,y:0,z:-9}
   };
   if(!points[where])throw Error('Invalid QA player-placement marker');
   explorer.position=traversal.spawn(points[where],spec,
     rules.snapshot(siege));
   explorer.yaw=where==='gate'?0:where==='west'?Math.PI/2:-Math.PI/2;
   explorer.climb=null;
   explorer.qaPositionChanges++;
   explorer.status='QA konumu (askerler taşınmadı)';
   updatePlayerGlyph();
 }
 function setView(view){
   if(!['orbit','fps','tps'].includes(view))throw Error('Unsupported S2 preview camera');
   explorer.view=view;
   explorer.status=view==='orbit'?'Harita incelemesi':'WASD ile özgür keşif';
   document.getElementById('view-mode-banner').textContent=
     view==='orbit'?'S2 • Harita kamerası':
     view==='fps'?'S2 • Birinci şahıs • fizik önizlemesi':
       'S2 • Üçüncü şahıs • fizik önizlemesi';
   updatePlayerGlyph();
   updateCamera();
 }
 function tryClimb(){
   if(explorer.view==='orbit'||explorer.climb)return;
   const state=rules.snapshot(siege);
   for(const side of ['west','east']){
     const climb=traversal.beginClimb(explorer.position,side,spec,state);
     if(climb){
       explorer.climb=climb;
       explorer.status=(side==='west'?'Batı':'Doğu')+' merdivenine çıkıyor';
       return;
     }
   }
   explorer.status='Merdiven kapalı veya girişe yeterince yakın değilsin';
 }
 for(const [id,fn] of [
   ['siege-orbit',()=>setView('orbit')],
   ['siege-fps',()=>setView('fps')],
   ['siege-tps',()=>setView('tps')],
   ['siege-team-red',()=>selectSide('red')],
   ['siege-team-blue',()=>selectSide('blue')],
   ['siege-fixture-gate',()=>qaLocate('gate')],
   ['siege-fixture-west',()=>qaLocate('west')],
   ['siege-fixture-east',()=>qaLocate('east')]
 ]){
   const button=document.getElementById(id);
   if(!button)throw Error('S2 exploration UI missing: '+id);
   button.addEventListener('click',()=>{try{fn();}catch(e){fail(e);}});
 }
 globalThis.addEventListener('keydown',e=>{
   if(['KeyW','KeyA','KeyS','KeyD','KeyE'].includes(e.code)&&
     explorer.view!=='orbit'){
     explorer.keys[e.code]=true;
     if(e.code==='KeyE'&&!e.repeat)tryClimb();
     e.preventDefault();
   }
 });
 globalThis.addEventListener('keyup',e=>{
   if(['KeyW','KeyA','KeyS','KeyD','KeyE'].includes(e.code))
     explorer.keys[e.code]=false;
 });
 globalThis.addEventListener('blur',()=>{
   for(const key of Object.keys(explorer.keys))explorer.keys[key]=false;
 });
 function stepExplorer(dt){
   if(explorer.view==='orbit')return;
   const state=rules.snapshot(siege);
   if(explorer.climb){
     const step=traversal.stepClimb(explorer.climb,dt,spec,state);
     explorer.position=step.position;
     if(step.done){
       explorer.climb=null;
       explorer.status='Sur geçişi tamamlandı • iç avlu';
     }
   }else{
     const yaw=explorer.yaw,
       fwd=(explorer.keys.KeyW?1:0)-(explorer.keys.KeyS?1:0),
       str=(explorer.keys.KeyD?1:0)-(explorer.keys.KeyA?1:0);
     const magnitude=Math.hypot(fwd,str);
     const speed=magnitude?traversal.SPEED/magnitude:0;
     const move=traversal.move(explorer.position,{
       x:(Math.sin(yaw)*fwd+Math.cos(yaw)*str)*speed,
       z:(Math.cos(yaw)*fwd-Math.sin(yaw)*str)*speed
     },dt,spec,state);
     explorer.position={x:move.x,y:move.y,z:move.z};
     explorer.blockedX=move.blockedX;explorer.blockedZ=move.blockedZ;
     if((move.blockedX||move.blockedZ)&&magnitude)
       explorer.status='Çarpışma: kale engeli / kapalı kapı';
     else if(magnitude)explorer.status='Yürüyor';
   }
   explorer.walkTicks++;
   updatePlayerGlyph();
 }
 function drawMini(){
   const w=mini.width,h=mini.height,ctx=mini2d,b=spec.bounds;
   const sx=x=>(x-b.minX)/(b.maxX-b.minX)*w;
   const sz=z=>h-(z-b.minZ)/(b.maxZ-b.minZ)*h;
   ctx.clearRect(0,0,w,h);
   ctx.fillStyle='#182c25';ctx.fillRect(0,0,w,h);
   ctx.strokeStyle='#445d47';ctx.lineWidth=1;
   ctx.strokeRect(sx(spec.castle.minX),sz(spec.castle.maxZ),
     sx(spec.castle.maxX)-sx(spec.castle.minX),
     sz(spec.castle.minZ)-sz(spec.castle.maxZ));
   const snapshot=rules.snapshot(siege);
   for(const block of spec.boxes){
     if(block.id==='gate-main'&&snapshot.gate.open)continue;
     ctx.fillStyle=block.type==='gate'?'#e5aa5d':
       block.solid?'#8b8979':'#587369';
     if(!block.solid&&block.type!=='battlement')continue;
     ctx.fillRect(sx(block.x-block.w/2),sz(block.z+block.d/2),
       (block.w/(b.maxX-b.minX))*w,
       (block.d/(b.maxZ-b.minZ))*h);
   }
   for(const lane of ['west','east'])
     if(snapshot.lanes[lane]){
       const p=spec.lanes[lane].entry;
       ctx.fillStyle='#f7d481';ctx.beginPath();
       ctx.arc(sx(p[0]),sz(p[1]),4,0,Math.PI*2);ctx.fill();
     }
   for(const [side,member] of Object.entries(spec.spawns)){
     const p=member.commander;
     ctx.fillStyle=side==='red'?'#db6553':'#56b5df';
     ctx.beginPath();ctx.arc(sx(p[0]),sz(p[1]),3,0,Math.PI*2);ctx.fill();
   }
   const p=explorer.position;
   ctx.fillStyle='#fff2b0';ctx.strokeStyle='#252525';ctx.lineWidth=1.5;
   ctx.beginPath();ctx.arc(sx(p.x),sz(p.z),5,0,Math.PI*2);
   ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.moveTo(sx(p.x),sz(p.z));
   ctx.lineTo(sx(p.x+Math.sin(explorer.yaw)*9),
     sz(p.z+Math.cos(explorer.yaw)*9));ctx.stroke();
 }
 selectSide('red');
 // Existing original S1 orbit view retains its free preview camera.
 const orbit={yaw:.45,pitch:.67,distance:250,panZ:-17};
 let drag=null;
 function updateCamera(){
   if(explorer.view==='orbit'){
     const cos=Math.cos(orbit.pitch);
     camera.position.set(
       Math.sin(orbit.yaw)*cos*orbit.distance,
       Math.sin(orbit.pitch)*orbit.distance,
       orbit.panZ+Math.cos(orbit.yaw)*cos*orbit.distance
     );
     camera.lookAt(0,1,orbit.panZ);
   }else{
     const p=explorer.position,yaw=explorer.yaw,pitch=explorer.pitch,
       dx=Math.sin(yaw),dz=Math.cos(yaw);
     if(explorer.view==='fps'){
       camera.position.set(p.x,p.y+2.7,p.z);
       camera.lookAt(p.x+dx*19,p.y+2.7+pitch*12,p.z+dz*19);
     }else{
       camera.position.set(p.x-dx*12,p.y+8.6,p.z-dz*12);
       camera.lookAt(p.x+dx*4,p.y+2.6+pitch*5,p.z+dz*4);
     }
   }
 }
 updateCamera();
 renderer.domElement.addEventListener('pointerdown',ev=>{
   drag={x:ev.clientX,y:ev.clientY,
     yaw:explorer.view==='orbit'?orbit.yaw:explorer.yaw,
     pitch:explorer.view==='orbit'?orbit.pitch:explorer.pitch};
   renderer.domElement.setPointerCapture(ev.pointerId);
 });
 renderer.domElement.addEventListener('pointermove',ev=>{
   if(!drag)return;
   if(explorer.view==='orbit'){
     orbit.yaw=drag.yaw+(ev.clientX-drag.x)*.006;
     orbit.pitch=Math.max(.21,Math.min(1.40,
       drag.pitch+(ev.clientY-drag.y)*.005));
   }else{
     explorer.yaw=drag.yaw+(ev.clientX-drag.x)*.006;
     explorer.pitch=Math.max(-.7,Math.min(.7,
       drag.pitch-(ev.clientY-drag.y)*.004));
     updatePlayerGlyph();
   }
   updateCamera();
 });
 function releaseDrag(){drag=null;}
 renderer.domElement.addEventListener('pointerup',releaseDrag);
 renderer.domElement.addEventListener('pointercancel',releaseDrag);
 renderer.domElement.addEventListener('wheel',ev=>{
   ev.preventDefault();
   orbit.distance=Math.max(92,Math.min(410,
     orbit.distance*Math.exp(ev.deltaY*.001)));
   updateCamera();
 },{passive:false});
 function resize(){
   const w=root.clientWidth,h=root.clientHeight;
   if(w<10||h<10)return;
   renderer.setSize(w,h,false);
   camera.aspect=w/h;camera.updateProjectionMatrix();
 }
 globalThis.addEventListener('resize',resize);
 new ResizeObserver(resize).observe(root);resize();
 const nodes={
   phase:document.getElementById('phase-value'),
   help:document.getElementById('phase-help'),
   result:document.getElementById('result'),
   timer:document.getElementById('timer-value'),
   gate:document.getElementById('gate-value'),
   gateBar:document.getElementById('gate-bar'),
   route:document.getElementById('route-value'),
   court:document.getElementById('courtyard-value'),
   keep:document.getElementById('keep-value'),
   log:document.getElementById('event-log')
 };
 const phaseNames={APPROACH:'1 • DIŞ KUŞATMA',
   BREACH:'2 • GEÇİT AÇILDI',
   COURTYARD:'3 • AVLU MÜCADELESİ',
   KEEP:'4 • İÇ KALE',
   RESULT:'SONUÇ'};
 const phaseHints={
   APPROACH:'Kapıyı kır veya batı/doğu merdivenlerinden birini hazırla.',
   BREACH:'Giriş açık. İç avluya saldıran askerleri sok.',
   COURTYARD:'İç avluda savunucu yoksa kontrol süresi dolsun.',
   KEEP:'Avlu ele geçirildi. İç kale komuta noktasını tut.',
   RESULT:'Senaryo tamamlandı. Yeniden başlatabilirsin.'
 };
 let oldEvents=-1,oldPhase='';
 function updateUI(){
   const s=rules.snapshot(siege);
   nodes.phase.textContent=phaseNames[s.phase];
   nodes.help.textContent=phaseHints[s.phase];
   const min=Math.floor(s.remaining/60).toString().padStart(2,'0');
   const sec=Math.floor(s.remaining%60).toString().padStart(2,'0');
   nodes.timer.textContent=min+':'+sec;
   nodes.gate.textContent=s.gate.hp+' HP';
   nodes.gateBar.style.width=(100*(1-s.gate.hp/s.gate.maxHp))+'%';
   nodes.route.textContent=Object.values(s.lanes).filter(Boolean).length+' / 3';
   const p=explorer.position;
   document.getElementById('explorer-location').textContent=
     p.x.toFixed(0)+' / '+p.z.toFixed(0)+
     (p.y>2?' ↑'+p.y.toFixed(0):'');
   document.getElementById('explorer-collision').textContent=
     explorer.climb?'Tırmanıyor':
       explorer.blockedX||explorer.blockedZ?'Duvar bloke':
         'Serbest • '+explorer.team.toUpperCase();
   nodes.court.textContent=s.capture.courtyard.toFixed(1)+' / '+
     s.rules.courtyardHoldSeconds+' s';
   nodes.keep.textContent=s.capture.keep.toFixed(1)+' / '+
     s.rules.keepHoldSeconds+' s';
   gate.visible=!s.gate.open;gateDecor.visible=!s.gate.open;
   for(const side of ['west','east'])
     ladderMeshes[side].visible=s.ladders[side].open;
   objectiveMeshes.courtyard.material.color.setHex(
     s.phase==='KEEP'||s.phase==='RESULT'?0x80d39e:0xefba5d);
   objectiveMeshes.keep.material.color.setHex(
     s.phase==='KEEP'?0xffcf60:0x85694c);
   nodes.result.style.display=s.phase==='RESULT'?'block':'none';
   if(s.phase==='RESULT'){
     nodes.result.textContent=s.winner==='red'
       ?'⚔ KALE ELE GEÇİRİLDİ (S1 prototip)'
       :'🛡 KALE SAVUNULDU (S1 prototip)';
   }
   for(const b of document.querySelectorAll('[data-siege]')){
     const key=b.dataset.siege;
     b.disabled=s.phase==='RESULT'&&key!=='reset';
     if(key==='gate'&&s.gate.open)b.disabled=true;
     if((key==='west'||key==='east')&&s.ladders[key].open)b.disabled=true;
     if((key==='court'||key==='court-contest')&&
       !['BREACH','COURTYARD','KEEP'].includes(s.phase))b.disabled=true;
     if((key==='keep'||key==='keep-contest')&&s.phase!=='KEEP')b.disabled=true;
   }
   if(oldPhase!==s.phase||oldEvents!==siege.events.length){
     const last=s.events.slice(-6);
     nodes.log.textContent=last.length
       ?last.map(e=>e.at.toFixed(1)+'s · '+e.type).join('\n')
       :'Henüz olay yok.';
     oldPhase=s.phase;oldEvents=siege.events.length;
   }
 }
 function action(which){
   if(which==='reset'){
     siege=rules.createScenario();oldEvents=-1;oldPhase='';
     selectSide(explorer.team);
     updateUI();drawMini();return;
   }
   const event={
     gate:{type:'GATE_HIT',team:'red',weapon:'ram',damage:75},
     west:{type:'LADDER_BUILD',team:'red',lane:'west',effort:25},
     east:{type:'LADDER_BUILD',team:'red',lane:'east',effort:25},
     court:{type:'ZONE_PRESENCE',zone:'courtyard',red:5,blue:0},
     'court-contest':{type:'ZONE_PRESENCE',zone:'courtyard',red:5,blue:3},
     keep:{type:'ZONE_PRESENCE',zone:'keep',red:3,blue:0},
     'keep-contest':{type:'ZONE_PRESENCE',zone:'keep',red:3,blue:2},
     wipe:{type:'FORCE_COUNTS',red:0,blue:70}
   }[which];
   if(!event)throw Error('Unknown S1 UI debug command');
   rules.applyEvent(siege,event);updateUI();
 }
 for(const b of document.querySelectorAll('[data-siege]'))
   b.addEventListener('click',()=>{try{action(b.dataset.siege);}catch(e){fail(e);}});
 let frames=0,last=performance.now(),running=true;
 function loop(now){
   if(!running)return;
   try{
     if(siege.phase!=='RESULT'){
       const dt=Math.min(.05,Math.max(0,(now-last)/1000));
       if(dt>0)rules.step(siege,dt);
     }
     const dt=Math.min(.05,Math.max(0,(now-last)/1000));
     stepExplorer(dt);
     updateCamera();
     last=now;
     if(frames++%8===0){
       updateUI();drawMini();
     }
     renderer.render(scene,camera);
     requestAnimationFrame(loop);
   }catch(e){running=false;fail(e);}
 }
 updateUI();
 // Read-only browser acceptance status: never exposes mutable engine state.
 globalThis.ktkSiegePreviewStatus=()=>({
   ready:running,
   sceneWebGL:!!renderer.getContext()&&!renderer.getContext().isContextLost(),
   markers:armyTokens.reduce((a,b)=>a+b.count,0),
   geometryObjects:spec.boxes.length,
   gateVisible:gate.visible,
   ladderWestVisible:ladderMeshes.west.visible,
   ladderEastVisible:ladderMeshes.east.visible,
   explorer:{
     view:explorer.view,team:explorer.team,
     pos:{...explorer.position},
     yaw:explorer.yaw,pitch:explorer.pitch,
     climb:explorer.climb?.side||null,
     walkTicks:explorer.walkTicks,
     qaPositionChanges:explorer.qaPositionChanges,
     blockedX:explorer.blockedX,blockedZ:explorer.blockedZ,
     status:explorer.status,
     embedded:traversal.overlaps(explorer.position,spec,
       rules.snapshot(siege)),
     availableRoute:traversal.route('outer','keep',spec,
       rules.snapshot(siege))?.map(n=>n.id)||null
   },
   activeColliders:traversal.activeColliders(spec,
     rules.snapshot(siege)).length,
   ...rules.snapshot(siege)
 });
 requestAnimationFrame(loop);
})();
