import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const map=process.env.KTK_MAP,width=Number(process.env.KTK_WIDTH||1920),height=width*9/16;
assert.ok(['arena','meadow','siege'].includes(map));
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
const errors=[],warnings=[];
p.on('pageerror',e=>errors.push(e.stack||e.message));
p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const report={schema:'ktk-opt09-spike-v2',source:process.env.GITHUB_SHA,map,width,height,quality:'medium',backend:'SwiftShader',errors,warnings};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const cdp=await p.context().newCDPSession(p);
let prof;
try{
  await p.goto(pathToFileURL(resolve('index.html')).href);
  await p.waitForFunction(()=>window.ktkUI32Status?.().ready==='true',null,{timeout:30000});
  await p.locator('[data-focus-map="arena"]').click();
  await p.locator('#fm-toggle-settings').click();
  await p.locator('[data-focus-duration="120"]').click();
  await p.locator('#fm-quality').selectOption('medium');
  await p.locator('#ui32-back').click();
  await p.locator('[data-focus-map="'+map+'"]').click();
  await p.locator('[data-approved-class="0"]:visible').click();
  const beginWall=Date.now();
  await p.locator('#play-btn').click();
  await p.waitForFunction(()=>arenaMatch.phase==='playing'&&document.pointerLockElement===canvas,null,{timeout:30000});
  report.startup={wallMs:Date.now()-beginWall,shaderWarmup:await p.evaluate(()=>window.ktkArenaShaderWarmupStatus?.()??null)};
  assert.equal(report.startup.shaderWarmup?.state,map==='arena'?'ready':'other-map');
  assert.equal(await p.evaluate(()=>nativeSiegeMode?'siege':meadowBattleMode?'meadow':'arena'),map);
  if(map==='siege')for(const key of ['F6','F7','F8'])await p.keyboard.press(key);
  if(map==='meadow')await p.keyboard.press('k');
  // OPT07 QA: force the real camera to look at one living soldier for a
  // single synchronous frame. This proves that the actual scene culler can
  // retain a nearby unit; normal game camera is restored before measurement.
  report.armySightline=await p.evaluate(()=>{
    if(!meadowBattleMode||nativeSiegeMode||!meadowBattleVisual)return null;
    const soldier=meadowBattleState.soldiers.find(s=>s.alive);
    if(!soldier)throw Error('OPT07: expected at least one living army unit');
    const originalPosition=camera.position.clone(),originalQuaternion=camera.quaternion.clone();
    const natural=window.ktkMeadowArmyVisibilityStatus?.()??null;
    const group=meadowBattleVisual.group;
    let testResult;
    try{
      camera.position.set(soldier.x-12,2.5,soldier.z);
      camera.lookAt(soldier.x,2.5,soldier.z);
      camera.updateMatrixWorld(true);
      const probe=createMeadowArmyVisibility(THREE,meadowBattleVisual);
      try{testResult=probe.prepare(meadowBattleState,camera);}
      finally{probe.restore();}
    }finally{
      camera.position.copy(originalPosition);
      camera.quaternion.copy(originalQuaternion);
      camera.updateMatrixWorld(true);
    }
    return {soldier:{id:soldier.id,x:soldier.x,z:soldier.z},
      natural,forcedLook:{...testResult},sceneVisible:group.visible};
  });
  if(report.armySightline){
    assert.ok(report.armySightline.sceneVisible,'Meadow army visuals not visible');
    assert.ok(report.armySightline.forcedLook.visible>0,
      'OPT07: nearby living soldier was wrongly culled even when camera faces it');
  }
  // OPT13: use the actual live rig, lift one real soldier's complete draw
  // matrices in the disposable QA page and prove the exact target survives.
  report.siegeSightline=await p.evaluate(()=>{
    if(!nativeSiegeMode||!meadowBattleVisual)return null;
    const visual=meadowBattleVisual,battle=meadowBattleState;
    const soldier=battle.soldiers.find(s=>s.alive);
    if(!soldier)throw Error('OPT13 missing live soldier');
    const role=visual.roles[soldier.type],slot=role.slots.get(soldier.id);
    const all=Object.values(role.parts).flatMap(part=>part.meshes);
    const before=all.map(mesh=>{const m=new THREE.Matrix4();mesh.getMatrixAt(slot,m);return m;});
    const originalPosition=camera.position.clone(),originalQuaternion=camera.quaternion.clone();
    const probe=createSiegeArmyVisibility(THREE,visual);
    let stats,found=false;
    try{
      for(let i=0;i<all.length;i++){
        const m=before[i].clone();m.elements[13]+=60;all[i].setMatrixAt(slot,m);
      }
      const expected=new THREE.Matrix4();all[0].getMatrixAt(slot,expected);
      camera.position.set(soldier.x-12,62,soldier.z);
      camera.lookAt(soldier.x,62,soldier.z);camera.updateMatrixWorld(true);
      stats={...probe.prepare(battle,camera)};
      const actual=new THREE.Matrix4();
      for(let i=0;i<all[0].count;i++){
        all[0].getMatrixAt(i,actual);
        if(actual.equals(expected)){found=true;break;}
      }
    }finally{
      probe.restore();
      for(let i=0;i<all.length;i++){
        all[i].setMatrixAt(slot,before[i]);all[i].instanceMatrix.needsUpdate=true;
      }
      camera.position.copy(originalPosition);camera.quaternion.copy(originalQuaternion);
      camera.updateMatrixWorld(true);
    }
    return {id:soldier.id,found,stats};
  });
  if(map==='siege')assert.ok(report.siegeSightline?.found,'OPT13 elevated actual model wrongly culled');
  await p.evaluate(()=>{
    const q={start:performance.now(),frame:[],frameWork:[],frameTimeline:[],longtasks:[],heapDrops:[],renderRoute:[],physics:[],armySim:[],armyVisual:[],siegeEquipment:[],siegeTowerRender:[],grass:[],render:[],draws:{},samples:[],phase:'warmup',active:true,gpu:[],gpuSupported:false};
    window.__optProfile=q;
    const gl=renderer.getContext();
    // OPT15 diagnostic: distinguish shader/driver API stalls from game JS.
    // Only this disposable QA page is instrumented, never the game itself.
    q.shaderCalls={};q.shaderSlow=[];q.shaderHookErrors=[];let currentShaderDraw=null;
    const shaderRestore=[];
    for(const name of ['compileShader','linkProgram','getShaderParameter','getProgramParameter','getShaderInfoLog','getProgramInfoLog']){
      const original=gl[name];if(typeof original!=='function')continue;
      const own=Object.getOwnPropertyDescriptor(gl,name);
      try{
        const hook=function(...args){
          const t=performance.now();
          try{return original.apply(this,args);}
          finally{
            if(q.active){
              const ms=performance.now()-t,a=q.shaderCalls[name]??(q.shaderCalls[name]={calls:0,totalMs:0,maxMs:0});
              a.calls++;a.totalMs+=ms;a.maxMs=Math.max(a.maxMs,ms);
              if(ms>=2&&q.shaderSlow.length<256)q.shaderSlow.push({name,ms,phase:q.phase,t:t-q.start,draw:currentShaderDraw});
            }
          }
        };
        Object.defineProperty(gl,name,{configurable:true,writable:true,value:hook});
        shaderRestore.push(()=>{if(own)Object.defineProperty(gl,name,own);else delete gl[name];});
      }catch(e){q.shaderHookErrors.push(name+': '+String(e));}
    }
    const ext=renderer.capabilities.isWebGL2?gl.getExtension('EXT_disjoint_timer_query_webgl2'):null;
    q.gpuSupported=!!ext;
    const pending=[];
    const category=new WeakMap();
    // OPT10 ME: armyVisibility status also reports emptyRoleMeshes after frustum compaction.
    function mark(root,tag){if(root?.traverse)root.traverse(o=>{category.set(o,tag);});}
    for(const root of castleMapData.visuals)mark(root,'castle-static');
    for(const root of meadowMapData.visuals)mark(root,'meadow-static');
    mark(nativeSiegeParts,'siege-architecture');
    mark(nativeSiegeRam,'siege-ram');mark(nativeSiegeCatapult,'siege-catapult');mark(nativeSiegeTower,'siege-tower');
    mark(meadowDenseGrass,'near-grass-simple');mark(ktkMeshyGrassHero,'near-grass-meshy');mark(meadowNearGrass,'far-grass');
    mark(weaponHolder,'viewmodel');
    if(meadowBattleVisual){mark(meadowBattleVisual.group,'army-soldiers-and-banners');mark(meadowBattleVisual.flightArrows,'army-flight-arrows');}
    for(const b of bots)mark(b.mesh,'arena-bots');
    function classify(o){
      let n=o;
      while(n){if(category.has(n))return category.get(n);n=n.parent;}
      if(o?.isInstancedMesh&&meadowBattleMode)return 'other-instanced-army-or-decor';
      return 'other';
    }
    // OPT09: isolated instrumentation is installed ONLY on this QA page.
    // rAF arrival gap vs callback work reveals browser scheduling stalls
    // that cannot be attributed to simulation or renderer JS alone.
    const wrap=(name,fn)=>function(...args){const t=performance.now();try{return fn.apply(this,args);}finally{if(q.active)q[name].push({phase:q.phase,ms:performance.now()-t});}};
    let previousAnimateStart=null,previousAnimateWork=0;
    const liveAnimate=animate;
    animate=function(...args){
      const start=performance.now(),arrivalGap=previousAnimateStart===null?null:start-previousAnimateStart;
      previousAnimateStart=start;
      const phase=q.phase;
      try{return liveAnimate.apply(this,args);}
      finally{
        if(q.active&&isGameActive&&arenaMatch.phase==='playing'){
          const callbackMs=performance.now()-start;
          q.frameWork.push({phase,ms:callbackMs});
          q.frameTimeline.push({phase,t:start-q.start,gapMs:arrivalGap,
            callbackMs,previousCallbackMs:previousAnimateWork,
            // This includes normal rAF/vsync delay, OS scheduling and browser work.
            // It cannot, by itself, prove that the GPU blocked.
            unaccountedGapMs:arrivalGap===null?null:Math.max(0,arrivalGap-previousAnimateWork)});
          previousAnimateWork=callbackMs;
        }
      }
    };
    let longTaskObserver=null;
    if(typeof PerformanceObserver!=='undefined'&&
       PerformanceObserver.supportedEntryTypes?.includes('longtask')){
      longTaskObserver=new PerformanceObserver(list=>{
        for(const entry of list.getEntries())if(q.active)
          q.longtasks.push({phase:q.phase,t:entry.startTime-q.start,ms:entry.duration,
            name:entry.name,attribution:entry.attribution?.map(x=>x.name).slice(0,3)??[]});
      });
      longTaskObserver.observe({entryTypes:['longtask']});
    }
    updateGame=wrap('physics',updateGame);
    updateActiveMeadowGrass=wrap('grass',updateActiveMeadowGrass);
    renderActiveMap=wrap('renderRoute',renderActiveMap);
    if(meadowBattleMode&&meadowBattleVisual){
      ArenaArmyBattle.step=wrap('armySim',ArenaArmyBattle.step);
      meadowBattleVisual.update=wrap('armyVisual',meadowBattleVisual.update);
    }
    if(nativeSiegeMode){
      nativeSiegeUpdate=wrap('siegeEquipment',nativeSiegeUpdate);
      nativeSiegeTowerRenderSoldiers=wrap('siegeTowerRender',nativeSiegeTowerRenderSoldiers);
    }
    const origDraw=renderer.renderBufferDirect;
    renderer.renderBufferDirect=function(cam,sc,geo,mat,obj,group){
      if(q.active){
        const key=q.phase+':'+(cam===camera?'main':'shadow-or-other')+':'+classify(obj);
        const a=q.draws[key]??(q.draws[key]={calls:0,triangles:0});
        a.calls++;
        const count=group?.count??geo.index?.count??geo.attributes.position?.count??0;
        a.triangles+=Math.floor(count/3)*(obj?.isInstancedMesh?obj.count:1);
      }
      const previous=currentShaderDraw;
      currentShaderDraw={category:classify(obj),name:obj.name||obj.type,material:mat.name||mat.type,
        geometry:geo.type,instanced:!!obj.isInstancedMesh,shadowPass:cam!==camera,
        map:!!mat.map,bump:!!mat.bumpMap,normal:!!mat.normalMap,transparent:mat.transparent,side:mat.side};
      try{return origDraw.call(this,cam,sc,geo,mat,obj,group);}
      finally{currentShaderDraw=previous;}
    };
    const original=renderer.render;
    let frameNo=0;
    renderer.render=function(...args){
      if(!q.active)return original.apply(this,args);
      const t=performance.now();let query=null;
      if(ext){
        while(pending.length&&gl.getQueryParameter(pending[0].query,gl.QUERY_RESULT_AVAILABLE)){
          const item=pending.shift();
          if(!gl.getParameter(ext.GPU_DISJOINT_EXT))q.gpu.push({phase:item.phase,ms:gl.getQueryParameter(item.query,gl.QUERY_RESULT)/1e6});
          gl.deleteQuery(item.query);
        }
        if(++frameNo%8===0&&pending.length<4&&!gl.getParameter(ext.GPU_DISJOINT_EXT)){
          query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,query);
        }
      }
      try{return original.apply(this,args);}
      finally{
        if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push({query,phase:q.phase});}
        q.render.push({phase:q.phase,ms:performance.now()-t,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
      }
    };
    let prev=null,last=0,previousHeap=null;
    function frame(t){
      if(!q.active)return;
      if(prev!==null&&isGameActive&&arenaMatch.phase==='playing')q.frame.push({phase:q.phase,ms:t-prev});
      prev=t;
      if(t-last>=3000){
        last=t;
        const r=renderer.info,m=r.memory;
        const heap=performance.memory?.usedJSHeapSize??null;
        if(previousHeap!==null&&heap!==null&&previousHeap-heap>2*1024*1024)
          q.heapDrops.push({phase:q.phase,t:t-q.start,bytes:previousHeap-heap});
        previousHeap=heap;
        q.samples.push({phase:q.phase,t:t-q.start,geometries:m.geometries,textures:m.textures,programs:r.programs?.length,heap:performance.memory?.usedJSHeapSize??null,calls:r.render.calls,triangles:r.render.triangles,remaining:arenaMatch.remaining,clock:arenaClock,armyElapsed:meadowBattleState?.elapsed??null,particles:particles.length,arrows:arrows.length,staticResources:window.ktkStaticResourceStatus?.(),castleDecor:window.ktkCastleDecorBatchStatus?.(),castleSolids:window.ktkCastleSolidBatchStatus?.(),siegeStatic:window.ktkSiegeStaticBatchStatus?.(),siegeRigid:window.ktkSiegeRigidBatchStatus?.(),siegeCosmetic:window.ktkSiegeCosmeticBatchStatus?.(),siegeArmyVisibility:window.ktkSiegeArmyVisibilityStatus?.(),armyVisibility:window.ktkMeadowArmyVisibilityStatus?.(),shaderWarmup:window.ktkArenaShaderWarmupStatus?.(),frameUi:window.ktkFrameUiStatus?.(),armyVertexBuffers:window.ktkArmyVertexBufferStatus?.(),grassCull:window.ktkMeshyGrassStatus?.(),armyVisualCpuPolicy:meadowBattleVisual?.performance?.()??null,armyArrowDrawCount:meadowBattleVisual?.flightArrows?.count??null});
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    q.stop=()=>{q.active=false;longTaskObserver?.disconnect();for(const item of pending)gl.deleteQuery(item.query);for(const restore of shaderRestore)restore();};
  });
  await cdp.send('Performance.enable');
  const chromePerfStart=await cdp.send('Performance.getMetrics');
  await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});await cdp.send('Profiler.start');
  const started=Date.now();
  for(let step=0;Date.now()-started<45000;step++){
    const elapsed=Date.now()-started,phase=elapsed<10000?'warmup':elapsed<25000?'moving':'combat';
    const active=await p.evaluate(phase=>{
      window.__optProfile.phase=phase;
      if(!isGameActive||arenaMatch.phase!=='playing')return false;
      document.dispatchEvent(new MouseEvent('mousemove',{movementX:45,movementY:0,bubbles:true}));
      return true;
    },phase);
    if(!active)break;
    if(phase!=='warmup'){
      await p.keyboard.down('w');
      try{if(phase==='combat')await p.mouse.click(width/2,height/2);await wait(500);}
      finally{await p.keyboard.up('w');}
    }else await wait(500);
  }
  prof=(await cdp.send('Profiler.stop')).profile;
  const chromePerfEnd=await cdp.send('Performance.getMetrics');
  writeFileSync('opt-profile-cpu.json',JSON.stringify(prof));
  report.measurements=await p.evaluate(()=>{
    const q=window.__optProfile;q.stop();
    const {stop,...data}=q;return data;
  });
  const nodes=new Map(prof.nodes.map(n=>[n.id,n.callFrame.functionName||'(anonymous)']));
  const counts={};for(const id of prof.samples||[]){const name=nodes.get(id)||'(unknown)';counts[name]=(counts[name]||0)+1;}
  report.cpuTop=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,30);
  const metricsOf=raw=>Object.fromEntries(raw.metrics.map(x=>[x.name,x.value]));
  const before=metricsOf(chromePerfStart),after=metricsOf(chromePerfEnd);
  report.chromeTaskMetrics={
    taskDurationSeconds:Math.max(0,(after.TaskDuration??0)-(before.TaskDuration??0)),
    scriptDurationSeconds:Math.max(0,(after.ScriptDuration??0)-(before.ScriptDuration??0)),
    layoutDurationSeconds:Math.max(0,(after.LayoutDuration??0)-(before.LayoutDuration??0)),
    recalcStyleDurationSeconds:Math.max(0,(after.RecalcStyleDuration??0)-(before.RecalcStyleDuration??0)),
    endHeapBytes:after.JSHeapUsedSize??null,
    startHeapBytes:before.JSHeapUsedSize??null
  };
  function summarize(rows){const a=rows.filter(x=>x.phase!=='warmup').map(x=>x.ms).sort((a,b)=>a-b);return a.length?{n:a.length,totalMs:a.reduce((x,y)=>x+y,0),meanMs:a.reduce((x,y)=>x+y,0)/a.length,p95Ms:a[Math.ceil(a.length*.95)-1],maxMs:a.at(-1)}:null;}
  report.summary=Object.fromEntries(['frame','frameWork','renderRoute','physics','armySim','armyVisual','siegeEquipment','siegeTowerRender','grass','render','gpu'].map(k=>[k,summarize(report.measurements[k])]));
  const timeline=report.measurements.frameTimeline.filter(x=>x.phase!=='warmup'&&x.gapMs!==null);
  const spikes=timeline.filter(x=>x.gapMs>=100).sort((a,b)=>b.gapMs-a.gapMs);
  const workHeavy=spikes.filter(x=>x.previousCallbackMs>=Math.min(50,x.gapMs*.5));
  const delayed=spikes.filter(x=>x.previousCallbackMs<Math.min(50,x.gapMs*.5));
  report.stallDiagnostics={
    framesObserved:timeline.length,spikes100ms:spikes.length,
    spikes500ms:spikes.filter(x=>x.gapMs>=500).length,
    callbackHeavyCandidates:workHeavy.length,schedulingOrBrowserCandidates:delayed.length,
    topSpikes:spikes.slice(0,10),
    longTaskCount:report.measurements.longtasks.length,
    longTaskMaxMs:Math.max(0,...report.measurements.longtasks.map(x=>x.ms)),
    heapDropCount:report.measurements.heapDrops.length,
    maxObservedHeapDropBytes:Math.max(0,...report.measurements.heapDrops.map(x=>x.bytes)),
    measuredGpuSamples:report.measurements.gpu.length,
    warning:'rAF gap is NOT GPU time. Callback work and CDP task time do not prove GPU, GC or driver stalls.'
  };
  report.drawCategories=Object.entries(report.measurements.draws).sort((a,b)=>b[1].calls-a[1].calls);
  console.log('OPT_PROFILE',JSON.stringify({map,width,startup:report.startup,summary:report.summary,cpuTop:report.cpuTop,drawCategories:report.drawCategories,samples:report.measurements.samples,armySightline:report.armySightline,siegeSightline:report.siegeSightline,gpuSupported:report.measurements.gpuSupported,stall:report.stallDiagnostics,shaderCalls:report.measurements.shaderCalls,shaderSlow:report.measurements.shaderSlow,shaderHookErrors:report.measurements.shaderHookErrors,chromeTasks:report.chromeTaskMetrics,errors}));
}catch(e){report.failure=e.stack||String(e);console.error(report.failure);}
finally{writeFileSync('opt-profile-report.json',JSON.stringify(report,null,2));await browser.close();}
assert.ok(!report.failure,report.failure);assert.deepEqual(errors,[]);assert.ok(report.summary?.frame?.n>0,'no measured frames');
