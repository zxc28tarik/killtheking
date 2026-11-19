/* S3D1/V1: role-specific 1600s soldier silhouettes on genuine G5.4 IDs.
 * Draw-only. No changes to native HP, orders, attacks, weapon timings or collision.
 * Inspired by the existing Arena role shapes; NOT identical Arena mesh sharing.
 */
(function(root){
 'use strict';
 const ROLE_TYPES=['sword','spear','bow','musket'];
 const TONES={
   red:{cloth:0xa9443b,trim:0xdbba70},
   blue:{cloth:0x39769b,trim:0xe3ca83}
 };
 const SURFACES={
   leather:0x593820,boot:0x29251f,mail:0x69747a,
   steel:0xa7b3b7,skin:0xd8a37a,wood:0x593f2a,
   dark:0x30383c,feather:0xf0e7d4
 };
 function create({THREE,scene,groups}={}){
   if(!THREE||!scene||!Array.isArray(groups)||groups.length!==8)
     throw Error('S3D1 authentic visual adapter requires eight native role groups');
   const canvasGroup=new THREE.Group();
   canvasGroup.name='S3D1_GenuineSoldierRoleVisuals';
   scene.add(canvasGroup);
   const geoCache=new Map(),materialCache=new Map();
   const bodyParts=[];
   const states=new Map();
   const rootPose=new THREE.Object3D();
   const partPose=new THREE.Object3D();
   const composed=new THREE.Matrix4();
   let drawnSoldiers=0;
   function material(tone,team){
     const key=team+'-'+tone;
     if(!materialCache.has(key)){
       const hex=tone==='cloth'||tone==='trim'?TONES[team][tone]:SURFACES[tone];
       if(!Number.isFinite(hex))throw Error('Unsupported soldier material '+tone);
       materialCache.set(key,new THREE.MeshStandardMaterial({
         color:hex,roughness:tone==='steel'?0.46:0.77,
         metalness:tone==='steel'||tone==='mail'?0.23:0.02
       }));
     }
     return materialCache.get(key);
   }
   function geometry(shape,args){
     const key=shape+':'+args.join(',');
     if(!geoCache.has(key)){
       const C={box:THREE.BoxGeometry,cylinder:THREE.CylinderGeometry,
         sphere:THREE.SphereGeometry,cone:THREE.ConeGeometry}[shape];
       if(!C)throw Error('Unsupported soldier mesh '+shape);
       geoCache.set(key,new C(...args));
     }
     return geoCache.get(key);
   }
   // Dimension/placement follows Arena's 1600s silhouettes: flared tunic,
   // mail, boots, jointed arms, distinguishing class headgear and weapon.
   function parts(role){
     const a=[];
     function add(name,shape,args,tone,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,limb=''){
       a.push({name,shape,args,tone,x,y,z,sx,sy,sz,rx,ry,rz,limb});
     }
     add('tunic','cylinder',[.49,.37,1.01,10],'cloth',0,1.46,0,1,1,.78);
     add('mail-skirt','cylinder',[.39,.53,.35,10],'mail',0,.91,0,1,1,.75);
     add('belt','cylinder',[.43,.43,.13,10],'leather',0,1.15,0,1,1,.82);
     add('head','sphere',[.32,10,8],'skin',0,2.32,.04,1,1,.94);
     add('neck','cylinder',[.19,.25,.20,9],'mail',0,2.06,0);
     for(const left of [true,false]){
       const sign=left?-1:1;
       add(left?'leg-left':'leg-right','cylinder',[.17,.135,.82,9],
         role==='sword'||role==='spear'?'mail':'dark',
         sign*.23,.56,0,1,1,1,0,0,0,left?'legL':'legR');
       add(left?'boot-left':'boot-right','box',[.30,.29,.48],
         'boot',sign*.23,.19,.12,1,1,1,0,0,0,left?'legL':'legR');
       add(left?'arm-left':'arm-right','cylinder',[.185,.14,.75,9],
         role==='sword'||role==='spear'?'steel':'cloth',
         sign*.59,1.57,0,1,1,1,0,0,sign*.12,left?'armL':'armR');
       add(left?'hand-left':'hand-right','sphere',[.15,8,6],
         'skin',sign*.62,1.13,.06,1,1,1,0,0,0,left?'armL':'armR');
     }
     if(role==='sword'){
       add('helm','cylinder',[.36,.33,.33,10],'steel',0,2.60,0);
       add('helm-rim','cylinder',[.44,.44,.09,10],'trim',0,2.45,0);
       add('sword-grip','cylinder',[.052,.052,.27,8],'leather',.72,1.10,.28,1,1,1,-.35,0,-.12);
       add('sword-blade','box',[.13,1.10,.045],'steel',.80,1.75,.43,1,1,1,-.28,0,-.12);
       add('shield','cylinder',[.39,.40,.12,10],'steel',-.80,1.30,.35,1,1,1,Math.PI/2);
     }else if(role==='spear'){
       add('half-helm','cylinder',[.37,.33,.24,10],'steel',0,2.58,0);
       add('helm-band','cylinder',[.41,.41,.10,10],'trim',0,2.48,0);
       add('pike-shaft','cylinder',[.052,.052,3.38,9],'wood',.72,2.03,.25);
       add('pike-tip','cone',[.15,.55,6],'steel',.72,3.96,.25);
       add('pike-collar','cylinder',[.075,.075,.18,8],'trim',.72,3.65,.25);
     }else if(role==='bow'){
       add('hood','cone',[.43,.53,10],'cloth',0,2.66,0);
       add('quiver','cylinder',[.19,.17,.88,10],'leather',.35,1.69,-.40,1,1,1,0,0,-.25);
       add('arrows','cylinder',[.08,.08,.74,8],'feather',.38,2.19,-.39);
       add('bow-upper','cylinder',[.042,.033,1.00,8],'wood',.83,1.90,.38,1,1,1,0,0,.25);
       add('bow-lower','cylinder',[.033,.042,1.00,8],'wood',.83,1.03,.38,1,1,1,0,0,-.25);
       add('bow-string','cylinder',[.012,.012,1.84,6],'feather',1.04,1.47,.38);
     }else if(role==='musket'){
       add('hat','cylinder',[.40,.45,.33,10],'dark',0,2.65,0);
       add('hat-brim','cylinder',[.70,.70,.07,12],'trim',0,2.48,0);
       add('bandolier','box',[.11,1.06,.055],'leather',.04,1.53,.36,1,1,1,0,0,-.62);
       add('stock','box',[.15,.19,1.72],'wood',.63,1.48,.48,1,1,1,.12,0,-.09);
       add('barrel','cylinder',[.062,.062,1.72,9],'steel',.63,1.57,1.36,1,1,1,Math.PI/2);
       add('muzzle','cylinder',[.08,.08,.09,9],'trim',.63,1.57,2.23,1,1,1,Math.PI/2);
     }
     return a;
   }
   for(const g of groups){
     if(!TONES[g.team]||!ROLE_TYPES.includes(g.role)||!g.inst||
        !Number.isInteger(g.count)||g.count<=0)
       throw Error('Unknown or mismatched G5.4 visual role group');
     const list=parts(g.role).map(part=>{
       const mesh=new THREE.InstancedMesh(
         geometry(part.shape,part.args),material(part.tone,g.team),g.count);
       mesh.name='g54-'+g.team+'-'+g.role+'-'+part.name;
       mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
       mesh.frustumCulled=false;
       mesh.userData={nativeSoldierVisual:true,team:g.team,
         type:g.role,part:part.name,visualOnly:true};
       canvasGroup.add(mesh);
       return {part,mesh};
     });
     bodyParts.push({group:g,list});
     // Keep genuine native pose instancing available for QA but do not draw
     // the old anonymous deployment cylinders over the visible role models.
     g.inst.visible=false;
   }
   function reset(){
     states.clear();
   }
   function render(){
     drawnSoldiers=0;
     for(const {group,list} of bodyParts){
       if(!Array.isArray(group.units)||group.units.length!==group.count)
         throw Error('S3D1 render requires authentic live G5.4 unit pointers');
       for(let i=0;i<group.units.length;i++){
         const u=group.units[i];
         if(!Number.isFinite(u.x)||!Number.isFinite(u.z)||
            !Number.isFinite(u.facing))
           throw Error('Nonfinite genuine soldier role model: '+u.id);
         let state=states.get(u.id);
         if(!state){
           state={x:u.x,z:u.z,phase:i*.87,walk:0};
           states.set(u.id,state);
         }
         const d=Math.hypot(u.x-state.x,u.z-state.z);
         state.phase+=Math.min(d,.5)*7;
         state.walk=d>.003?1:state.walk*.88;
         state.x=u.x;state.z=u.z;
         const step=Math.sin(state.phase)*state.walk*.40;
         rootPose.position.set(u.x,Number.isFinite(u.siegeY)?u.siegeY:0,u.z);
         rootPose.rotation.set(0,u.facing,0);
         const s=u.alive?1:.00001;
         rootPose.scale.set(s,s,s);
         rootPose.updateMatrix();
         for(const {part,mesh} of list){
           const limb=part.limb||'';
           const flip=limb.endsWith('L')?1:-1;
           const anim=limb.startsWith('leg')?flip*step:
             limb.startsWith('arm')?-flip*step*.60:0;
           partPose.position.set(part.x,part.y,part.z);
           partPose.rotation.set(part.rx+anim,part.ry,part.rz);
           partPose.scale.set(part.sx,part.sy,part.sz);
           partPose.updateMatrix();
           composed.multiplyMatrices(rootPose.matrix,partPose.matrix);
           mesh.setMatrixAt(i,composed);
         }
         if(u.alive)drawnSoldiers++;
       }
       for(const {mesh} of list)mesh.instanceMatrix.needsUpdate=true;
     }
   }
   const count=groups.reduce((n,g)=>n+g.count,0);
   if(count!==140)throw Error('Expected exactly 140 historical G5.4 soldier poses');
   return Object.freeze({
     reset,render,status:()=>Object.freeze({
       source:'Genuine G5.4 soldier identities / draw-only role meshes',
       roleModels:ROLE_TYPES.length,
       renderedActorSlots:count,
       aliveVisualActors:drawnSoldiers,
       instancedPartDrawCalls:bodyParts.reduce((n,g)=>n+g.list.length,0),
       animatedArmsAndLegs:true,
       nativePhysicsOrDamageChanged:false,
       exactOriginalFFAMeshReuse:false
     })
   });
 }
 root.KTKSiegeCharacterVisuals=Object.freeze({create});
})(globalThis);
