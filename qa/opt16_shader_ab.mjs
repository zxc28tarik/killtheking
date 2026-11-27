/* OPT16: disposable Arena shader prewarm experiment, no production change.
 * Both arms use the actual game effect and arrow factories, same camera,
 * renderer, lighting/fog/environment and draw geometry. Compile only in B.
 * Shader checks remain enabled. Timings are software backend, not hardware FPS.
 */
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const mode=process.env.KTK_SHADER_ARM||'cold';
assert.ok(['cold','prewarm'].includes(mode));
const report={schema:'ktk-opt16-shader-ab-v1',mode,source:process.env.GITHUB_SHA,backend:'SwiftShader',errors:[]};
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
  if(nativeSiegeMode||meadowBattleMode)throw Error('OPT16 requires Arena');
  // Real round initialization, but no natural simulation or input interleaving
  // during this synchronous disposable test. No game clock is benchmarked.
  // Preserve the original transient-only experiment now that OPT18
  // prewarms the active map in production. This page alone bypasses it.
  const oldWarmup=prepareArenaShadersForRound;
  prepareArenaShadersForRound=()=>{};
  try{resetFreeForAllRound();}finally{prepareArenaShadersForRound=oldWarmup;}
  isGameActive=false;
  const gl=renderer.getContext(),oldDraw=renderer.renderBufferDirect;
  const oldDebug=renderer.debug.checkShaderErrors;
  const events=[],restore=[],phases=[],effects=[];
  let phase='setup',drawing=null,probeRoot=null;
  const hitNames=new Set(),callsByTarget={};
  const shaders=['compileShader','linkProgram','getShaderParameter','getProgramParameter','getShaderInfoLog','getProgramInfoLog','getActiveUniform','getActiveAttrib'];
  const programs=()=>new Set((renderer.info.programs||[]).map(p=>p.cacheKey));
  const take=(name,fn)=>{
   phase=name;const before=programs(),start=performance.now();
   fn();
   const after=programs();
   phases.push({name,ms:performance.now()-start,programsBefore:before.size,programsAfter:after.size,
    newKeys:[...after].filter(k=>!before.has(k)),events:events.filter(e=>e.phase===name)});
  };
  try{
   for(const name of shaders){
    const fn=gl[name],own=Object.getOwnPropertyDescriptor(gl,name);
    if(typeof fn!=='function')continue;
    Object.defineProperty(gl,name,{configurable:true,writable:true,value:function(...args){
     const start=performance.now();
     try{return fn.apply(this,args);}
     finally{const ms=performance.now()-start;
      events.push({phase,name,ms,drawing});
     }
    }});
    restore.push(()=>{if(own)Object.defineProperty(gl,name,own);else delete gl[name];});
   }
   renderer.renderBufferDirect=function(cam,sc,geo,mat,obj,group){
    const old=drawing;
    drawing={object:obj.name||obj.type,material:mat.type,transparent:mat.transparent,kind:obj.userData.effectPoolKind||null};
    if(probeRoot){
     for(let n=obj;n;n=n.parent)if(n===probeRoot){
      hitNames.add(phase);callsByTarget[phase]=(callsByTarget[phase]||0)+1;break;
     }
    }
    try{return oldDraw.call(this,cam,sc,geo,mat,obj,group);}
    finally{drawing=old;}
   };
   // Initialize existing world programs first, before any probe effect.
   take('worldBaseline',()=>renderer.render(scene,camera));
   const stage=new THREE.Scene();
   stage.fog=scene.fog;stage.environment=scene.environment;
   const lightTypes=[];
   scene.traverseVisible(o=>{
    if(o.isLight&&o.layers.test(camera.layers)){
     const copy=o.clone(false);stage.add(copy);lightTypes.push(o.type+':'+!!o.castShadow);
    }
   });
   const initialSceneChildren=scene.children.length;
   const specs=[['opaque',0xfbbf24,1],['basic',0xef4444,.96],['lambert',0xd1d5db,.78]];
   for(const [kind,color,opacity] of specs){
    const mesh=acquireEffectCube(kind,color,opacity,.45);
    effects.push({kind,mesh,originalCull:mesh.frustumCulled});
    mesh.name='OPT16 actual '+kind+' effect';
    scene.remove(mesh);stage.add(mesh);
   }
   const arrow=createPlayerArrowMesh();effects.push({kind:'arrow',mesh:arrow});
   arrow.name='OPT16 actual arrow';stage.add(arrow);
   // Actual material/geometry objects remain alive; no debug flag change.
   if(mode==='prewarm')take('prewarm',()=>renderer.compile(stage,camera));
   else phases.push({name:'prewarm',ms:0,programsBefore:programs().size,programsAfter:programs().size,newKeys:[],events:[]});
   // Use identical real objects for the first draw and repeat draw in both arms.
   // Place them in front of the existing camera without changing camera state.
   camera.updateMatrixWorld(true);
   const point=camera.getWorldPosition(new THREE.Vector3()).addScaledVector(camera.getWorldDirection(new THREE.Vector3()),4);
   for(const {kind,mesh} of effects){
    stage.remove(mesh);scene.add(mesh);mesh.position.copy(point);
    mesh.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});
    probeRoot=mesh;
    take('first:'+kind,()=>renderer.render(scene,camera));
    take('repeat:'+kind,()=>renderer.render(scene,camera));
    scene.remove(mesh);probeRoot=null;
   }
   const afterProbeChildren=scene.children.length;
   return {phases:phases.map(p=>({...p,events:p.events.filter(e=>e.ms>=2||e.name==='linkProgram'||e.name==='compileShader') })),
    shaderSummary:Object.fromEntries(phases.map(p=>[p.name,Object.fromEntries(shaders.map(n=>{
     const rows=p.events.filter(e=>e.name===n);return [n,{calls:rows.length,totalMs:rows.reduce((s,e)=>s+e.ms,0),maxMs:Math.max(0,...rows.map(e=>e.ms))}];
    }))])),lightTypes,initialSceneChildren,afterProbeChildren,hitNames:[...hitNames],callsByTarget,debugUnchanged:renderer.debug.checkShaderErrors===oldDebug,
    note:'Cold/prewarm stages are only in this disposable browser. World baseline excludes probe effects.'};
  }finally{
   renderer.renderBufferDirect=oldDraw;
   for(const fn of restore.reverse())fn();
   for(const {kind,mesh,originalCull} of effects){
    if(mesh.parent)mesh.parent.remove(mesh);
    if(kind==='arrow')releaseArrow(mesh);
    else{mesh.frustumCulled=originalCull;releaseParticle(mesh);}
   }
  }
 },mode);
 const m=report.measurements;
 assert.equal(m.debugUnchanged,true);
 assert.equal(m.afterProbeChildren,m.initialSceneChildren);
 for(const kind of ['opaque','basic','lambert','arrow']){
  assert.ok(m.hitNames.includes('first:'+kind),'first draw missing: '+kind);
  assert.ok(m.hitNames.includes('repeat:'+kind),'repeat draw missing: '+kind);
 }
 assert.deepEqual(report.errors,[]);
 console.log('OPT16_SHADER_AB',JSON.stringify({mode,phases:m.phases.map(p=>({
  name:p.name,ms:p.ms,newPrograms:p.newKeys.length,
  slow:p.events.filter(e=>e.ms>=2).sort((a,b)=>b.ms-a.ms).slice(0,8)
 })),shaderSummary:m.shaderSummary,lightTypes:m.lightTypes,callsByTarget:m.callsByTarget,
 debugUnchanged:m.debugUnchanged}));
}catch(e){report.failure=e.stack||String(e);console.error(report.failure);}
finally{writeFileSync('opt16-shader-ab-'+mode+'.json',JSON.stringify(report,null,2));await browser.close();}
assert.ok(!report.failure,report.failure);
assert.deepEqual(report.errors,[]);
