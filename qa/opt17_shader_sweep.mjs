/* OPT17: controlled Arena camera sweep with active-map-only program prewarm.
 * QA only; no simulation, geometry, lighting, or shader validation changes.
 * A/B uses independent browsers, the same camera points and actual materials.
 */
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const mode=process.env.KTK_SHADER_ARM||'cold';
assert.ok(['cold','prewarm','production'].includes(mode));
const report={schema:'ktk-opt17-arena-sweep-v1',mode,source:process.env.GITHUB_SHA,backend:'SwiftShader',errors:[]};
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
page.on('pageerror',e=>report.errors.push(e.stack||e.message));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
try{
 await page.goto(pathToFileURL(resolve('index.html')).href);
 await page.waitForFunction(()=>window.ktkUI32Status?.().ready==='true',null,{timeout:45000});
 await page.locator('[data-focus-map="arena"]').click();
 await page.locator('#fm-toggle-settings').click();
 await page.locator('[data-focus-duration="120"]').click();
 await page.locator('#fm-quality').selectOption('medium');
 await page.locator('#ui32-back').click();
 await page.locator('[data-focus-map="arena"]').click();
 await page.locator('[data-approved-class="0"]:visible').click();
 report.measurements=await page.evaluate(mode=>{
  if(nativeSiegeMode||meadowBattleMode)throw Error('OPT17 requires Arena');
  // Historical A/B arms bypass the production warmup in this disposable page only.
  const oldWarm=prepareArenaShadersForRound;
  if(mode!=='production')prepareArenaShadersForRound=()=>{};
  try{resetFreeForAllRound();}finally{prepareArenaShadersForRound=oldWarm;}
  isGameActive=false;
  const productionWarmup=window.ktkArenaShaderWarmupStatus();
  // Keep shadow/light counts, active camera layer and actual material variants.
  const gl=renderer.getContext(),oldDraw=renderer.renderBufferDirect;
  const oldDebug=renderer.debug.checkShaderErrors,restore=[],events=[],phases=[];
  const oldPosition=camera.position.clone(),oldQuaternion=camera.quaternion.clone();
  const cameraPoints=[COURTYARD_SPAWNS[0],COURTYARD_SPAWNS[3],RAMPART_SPAWNS[0]];
  const ids=new WeakMap();
  for(const root of castleMapData.visuals)root.traverse(o=>ids.set(o,'castle'));
  for(const bot of bots)bot.mesh.traverse(o=>ids.set(o,'bot:'+bot.role));
  weaponHolder.traverse(o=>ids.set(o,'viewmodel'));
  let phase='setup',drawing=null,drawCalls=0;
  const programKeys=()=>new Set(renderer.info.programs.map(p=>p.cacheKey));
  const take=(name,fn)=>{
   phase=name;drawCalls=0;const before=programKeys(),start=performance.now();
   fn();
   const after=programKeys(),rows=events.filter(e=>e.phase===name);
   phases.push({name,ms:performance.now()-start,drawCalls,before:before.size,after:after.size,
    newKeys:[...after].filter(k=>!before.has(k)),shaderCalls:rows.length,
    shaderMs:rows.reduce((s,e)=>s+e.ms,0),links:rows.filter(e=>e.name==='linkProgram').length,
    slow:rows.filter(e=>e.ms>=2).sort((a,b)=>b.ms-a.ms).slice(0,12)});
  };
  const snapshot=()=>({children:scene.children.length,visible:[],materials:[]});
  const visibility=()=>{const x=snapshot();scene.traverse(o=>{x.visible.push(o.uuid+':'+o.visible);
   if(o.material)x.materials.push(o.uuid+':'+(Array.isArray(o.material)?o.material.map(m=>m.uuid).join(','):o.material.uuid));
  });return x;};
  const beforeScene=visibility();
  let stage=null,candidates=0,lights=0,skipped=0;
  try{
   for(const name of ['compileShader','linkProgram','getShaderParameter','getProgramParameter','getShaderInfoLog','getProgramInfoLog']){
    const fn=gl[name],own=Object.getOwnPropertyDescriptor(gl,name);
    if(typeof fn!=='function')continue;
    Object.defineProperty(gl,name,{configurable:true,writable:true,value:function(...args){
     const start=performance.now();
     try{return fn.apply(this,args);}
     finally{events.push({phase,name,ms:performance.now()-start,drawing});}
    }});
    restore.push(()=>{if(own)Object.defineProperty(gl,name,own);else delete gl[name];});
   }
   renderer.renderBufferDirect=function(cam,sc,geo,mat,obj,group){
    const prev=drawing;drawCalls++;
    drawing={category:ids.get(obj)||'other',object:obj.name||obj.type,
     material:mat.name||mat.type,materialId:mat.id,geometry:geo.type,
     instanced:!!obj.isInstancedMesh,shadowPass:cam!==camera,
     map:!!mat.map,bump:!!mat.bumpMap,normal:!!mat.normalMap,
     transparent:mat.transparent,vertexColors:mat.vertexColors,side:mat.side};
    try{return oldDraw.call(this,cam,sc,geo,mat,obj,group);}
    finally{drawing=prev;}
   };
   const setView=(p,yaw,pitch)=>{
    camera.position.copy(p);camera.rotation.set(pitch,yaw,0,'YXZ');camera.updateMatrixWorld(true);
   };
   setView(cameraPoints[0],0,0);
   take('baseline',()=>renderer.render(scene,camera));
   if(mode==='prewarm'){
    stage=new THREE.Scene();stage.fog=scene.fog;stage.environment=scene.environment;
    const seen=new Set();
    scene.traverseVisible(o=>{
     if(!o.layers.test(camera.layers))return;
     if(o.isLight){stage.add(o.clone(false));lights++;return;}
     if(!o.isMesh||!o.geometry||!o.material||o.isSkinnedMesh){if(o.material)skipped++;return;}
     const mats=Array.isArray(o.material)?o.material:[o.material];
     for(const mat of mats){
      if(!mat.visible)continue;
      const key=[mat.uuid,o.geometry.uuid,!!o.isInstancedMesh,!!o.instanceColor].join(':');
      if(seen.has(key))continue;seen.add(key);
      const proxy=o.isInstancedMesh?new THREE.InstancedMesh(o.geometry,mat,1):new THREE.Mesh(o.geometry,mat);
      if(o.isInstancedMesh&&o.instanceColor)proxy.instanceColor=o.instanceColor;
      proxy.layers.mask=o.layers.mask;
      stage.add(proxy);candidates++;
     }
    });
    take('prewarm',()=>renderer.compile(stage,camera));
   }else phases.push({name:'prewarm',ms:0,drawCalls:0,before:programKeys().size,after:programKeys().size,newKeys:[],shaderCalls:0,shaderMs:0,links:0,slow:[]});
   const headings=[Math.PI/2,Math.PI,-Math.PI/2,0];
   for(let i=0;i<cameraPoints.length;i++){
    for(let j=0;j<headings.length;j++){
     setView(cameraPoints[i],headings[j],i===2?-.22:0);
     take('sweep:'+i+':'+j,()=>renderer.render(scene,camera));
    }
   }
   for(let j=0;j<headings.length;j++){
    setView(cameraPoints[0],headings[j],0);
    take('repeat:'+j,()=>renderer.render(scene,camera));
   }
   const afterScene=visibility();
   return {phases,candidates,lights,skipped,productionWarmup,debugUnchanged:renderer.debug.checkShaderErrors===oldDebug,
    sceneUnchanged:JSON.stringify(beforeScene)===JSON.stringify(afterScene),
    sweep:phases.filter(p=>p.name.startsWith('sweep:')).reduce((a,p)=>{
     a.newPrograms+=p.newKeys.length;a.links+=p.links;a.shaderMs+=p.shaderMs;a.renderMs+=p.ms;a.worstMs=Math.max(a.worstMs,p.ms);return a;
    },{newPrograms:0,links:0,shaderMs:0,renderMs:0,worstMs:0})};
  }finally{
   renderer.renderBufferDirect=oldDraw;for(const fn of restore.reverse())fn();
   camera.position.copy(oldPosition);camera.quaternion.copy(oldQuaternion);camera.updateMatrixWorld(true);
   if(stage)stage.clear(); // do NOT dispose the shared production geometry or materials
  }
 },mode);
 const m=report.measurements;
 assert.equal(m.debugUnchanged,true);
 assert.equal(m.sceneUnchanged,true);
 assert.equal(m.phases.filter(p=>p.name.startsWith('sweep:')).length,12);
 assert.ok(m.phases.filter(p=>p.name.startsWith('sweep:')).every(p=>p.drawCalls>0));
 if(mode==='prewarm'){assert.ok(m.candidates>0);assert.ok(m.lights>0);}
 if(mode==='production'){assert.equal(m.productionWarmup.state,'ready');assert.equal(m.sweep.links,0,'unexpected shader link during controlled Arena sweep');}
 assert.deepEqual(report.errors,[]);
 console.log('OPT17_SWEEP',JSON.stringify({mode,candidates:m.candidates,lights:m.lights,skipped:m.skipped,productionWarmup:m.productionWarmup,sweep:m.sweep,
 phases:m.phases.map(p=>({name:p.name,ms:p.ms,drawCalls:p.drawCalls,newPrograms:p.newKeys.length,links:p.links,shaderMs:p.shaderMs,slow:p.slow.slice(0,3)})),sceneUnchanged:m.sceneUnchanged,debugUnchanged:m.debugUnchanged}));
}catch(e){report.failure=e.stack||String(e);console.error(report.failure);}
finally{writeFileSync('opt17-arena-sweep-'+mode+'.json',JSON.stringify(report,null,2));await browser.close();}
assert.ok(!report.failure,report.failure);assert.deepEqual(report.errors,[]);
