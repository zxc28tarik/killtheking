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
const report={schema:'ktk-opt-a-v1',source:process.env.GITHUB_SHA,map,width,height,quality:'medium',backend:'SwiftShader',errors,warnings};
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
  await p.locator('#play-btn').click();
  await p.waitForFunction(()=>arenaMatch.phase==='playing'&&document.pointerLockElement===canvas,null,{timeout:30000});
  assert.equal(await p.evaluate(()=>nativeSiegeMode?'siege':meadowBattleMode?'meadow':'arena'),map);
  if(map==='siege')for(const key of ['F6','F7','F8'])await p.keyboard.press(key);
  if(map==='meadow')await p.keyboard.press('k');
  await p.evaluate(()=>{
    const q={start:performance.now(),frame:[],physics:[],grass:[],render:[],draws:{},samples:[],phase:'warmup',active:true,gpu:[],gpuSupported:false};
    window.__optProfile=q;
    const gl=renderer.getContext();
    const ext=renderer.capabilities.isWebGL2?gl.getExtension('EXT_disjoint_timer_query_webgl2'):null;
    q.gpuSupported=!!ext;
    const pending=[];
    const category=new WeakMap();
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
    const wrap=(name,fn)=>function(...args){const t=performance.now();try{return fn.apply(this,args);}finally{if(q.active)q[name].push({phase:q.phase,ms:performance.now()-t});}};
    updateGame=wrap('physics',updateGame);
    updateActiveMeadowGrass=wrap('grass',updateActiveMeadowGrass);
    const origDraw=renderer.renderBufferDirect;
    renderer.renderBufferDirect=function(cam,sc,geo,mat,obj,group){
      if(q.active){
        const key=q.phase+':'+(cam===camera?'main':'shadow-or-other')+':'+classify(obj);
        const a=q.draws[key]??(q.draws[key]={calls:0,triangles:0});
        a.calls++;
        const count=group?.count??geo.index?.count??geo.attributes.position?.count??0;
        a.triangles+=Math.floor(count/3)*(obj?.isInstancedMesh?obj.count:1);
      }
      return origDraw.call(this,cam,sc,geo,mat,obj,group);
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
    let prev=null,last=0;
    function frame(t){
      if(!q.active)return;
      if(prev!==null&&isGameActive&&arenaMatch.phase==='playing')q.frame.push({phase:q.phase,ms:t-prev});
      prev=t;
      if(t-last>=3000){
        last=t;
        const r=renderer.info,m=r.memory;
        q.samples.push({phase:q.phase,t:t-q.start,geometries:m.geometries,textures:m.textures,programs:r.programs?.length,heap:performance.memory?.usedJSHeapSize??null,calls:r.render.calls,triangles:r.render.triangles,remaining:arenaMatch.remaining,clock:arenaClock,armyElapsed:meadowBattleState?.elapsed??null,particles:particles.length,arrows:arrows.length,staticResources:window.ktkStaticResourceStatus?.(),castleDecor:window.ktkCastleDecorBatchStatus?.(),castleSolids:window.ktkCastleSolidBatchStatus?.(),armyVisibility:window.ktkMeadowArmyVisibilityStatus?.(),armyArrowDrawCount:meadowBattleVisual?.flightArrows?.count??null});
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    q.stop=()=>{q.active=false;for(const item of pending)gl.deleteQuery(item.query);};
  });
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
  writeFileSync('opt-profile-cpu.json',JSON.stringify(prof));
  report.measurements=await p.evaluate(()=>{
    const q=window.__optProfile;q.stop();
    const {stop,...data}=q;return data;
  });
  const nodes=new Map(prof.nodes.map(n=>[n.id,n.callFrame.functionName||'(anonymous)']));
  const counts={};for(const id of prof.samples||[]){const name=nodes.get(id)||'(unknown)';counts[name]=(counts[name]||0)+1;}
  report.cpuTop=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,30);
  function summarize(rows){const a=rows.filter(x=>x.phase!=='warmup').map(x=>x.ms).sort((a,b)=>a-b);return a.length?{n:a.length,totalMs:a.reduce((x,y)=>x+y,0),meanMs:a.reduce((x,y)=>x+y,0)/a.length,p95Ms:a[Math.ceil(a.length*.95)-1],maxMs:a.at(-1)}:null;}
  report.summary=Object.fromEntries(['frame','physics','grass','render','gpu'].map(k=>[k,summarize(report.measurements[k])]));
  report.drawCategories=Object.entries(report.measurements.draws).sort((a,b)=>b[1].calls-a[1].calls);
  console.log('OPT_PROFILE',JSON.stringify({map,width,summary:report.summary,cpuTop:report.cpuTop,drawCategories:report.drawCategories,samples:report.measurements.samples,gpuSupported:report.measurements.gpuSupported,errors}));
}catch(e){report.failure=e.stack||String(e);console.error(report.failure);}
finally{writeFileSync('opt-profile-report.json',JSON.stringify(report,null,2));await browser.close();}
assert.ok(!report.failure,report.failure);assert.deepEqual(errors,[]);assert.ok(report.summary?.frame?.n>0,'no measured frames');
