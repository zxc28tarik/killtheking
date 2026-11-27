/* OPT09 diagnostic-only A/B/A. Shadow caching changes lighting in the disposable
 * browser test but NEVER in canonical game sources. It is NOT a proposed fix.
 * Run by GitHub Actions at 960x540 SwiftShader to isolate shadow-pass load.
 */
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const map=process.env.KTK_MAP||'arena';
assert.ok(['arena','meadow','siege'].includes(map));
const b=await chromium.launch({args:['--use-angle=swiftshader',
 '--enable-unsafe-swiftshader','--disable-dev-shm-usage',
 '--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const p=await b.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
const errors=[],report={schema:'ktk-opt09-shadow-ab-v1',map,backend:'SwiftShader',
 source:process.env.GITHUB_SHA??null,errors};
p.on('pageerror',e=>errors.push(e.stack||e.message));
p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const wait=ms=>new Promise(done=>setTimeout(done,ms));
try{
 await p.goto(pathToFileURL(resolve('index.html')).href);
 await p.waitForFunction(()=>window.ktkUI32Status?.().ready==='true',null,{timeout:45000});
 await p.locator('[data-focus-map="arena"]').click();
 await p.locator('#fm-toggle-settings').click();
 await p.locator('[data-focus-duration="120"]').click();
 await p.locator('#fm-quality').selectOption('medium');
 await p.locator('#ui32-back').click();
 await p.locator('[data-focus-map="'+map+'"]').click();
 await p.locator('[data-approved-class="0"]:visible').click();
 await p.locator('#play-btn').click();
 await p.waitForFunction(()=>arenaMatch.phase==='playing'&&document.pointerLockElement===canvas,null,{timeout:45000});
 assert.equal(await p.evaluate(()=>nativeSiegeMode?'siege':meadowBattleMode?'meadow':'arena'),map);
 await p.evaluate(()=>{
  const gl=renderer.getContext();
  const ext=renderer.capabilities.isWebGL2?
   gl.getExtension('EXT_disjoint_timer_query_webgl2'):null;
  const oldRender=renderer.render,oldDraw=renderer.renderBufferDirect;
  const q={phase:'warmup',samples:[],gpu:[],pending:[],gpuSupported:!!ext,
   active:true,originalAutoUpdate:renderer.shadowMap.autoUpdate};
  window.__opt09ShadowAB=q;
  let shadowCalls=0,mainCalls=0,queryNumber=0;
  renderer.renderBufferDirect=function(cam,...args){
    if(q.active){
      if(cam===camera)mainCalls++;else shadowCalls++;
    }
    return oldDraw.call(this,cam,...args);
  };
  renderer.render=function(...args){
    if(!q.active)return oldRender.apply(this,args);
    const t=performance.now(),beforeShadow=shadowCalls,beforeMain=mainCalls;
    let query=null;
    if(ext){
      while(q.pending.length&&gl.getQueryParameter(q.pending[0].query,gl.QUERY_RESULT_AVAILABLE)){
        const item=q.pending.shift();
        const disjoint=gl.getParameter(ext.GPU_DISJOINT_EXT);
        if(!disjoint)q.gpu.push({phase:item.phase,ms:gl.getQueryParameter(item.query,gl.QUERY_RESULT)/1e6});
        gl.deleteQuery(item.query);
      }
      // No overlapping query; disjoint may be unavailable on software GL.
      if(q.pending.length<3&&++queryNumber%2===0&&!gl.getParameter(ext.GPU_DISJOINT_EXT)){
        query=gl.createQuery();
        gl.beginQuery(ext.TIME_ELAPSED_EXT,query);
      }
    }
    try{return oldRender.apply(this,args);}
    finally{
      if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);q.pending.push({query,phase:q.phase});}
      q.samples.push({phase:q.phase,ms:performance.now()-t,
       shadowCalls:shadowCalls-beforeShadow,mainCalls:mainCalls-beforeMain,
       triangles:renderer.info.render.triangles,
       shadowsUpdated:renderer.shadowMap.autoUpdate});
    }
  };
  q.enter=phase=>{
    // A/B/A diagnostic ONLY; cached shadows can be visually incorrect for
    // moving casters. NEVER deploy this switch to production.
    q.phase=phase;
    renderer.shadowMap.autoUpdate=phase!=='cached';
    if(phase!=='cached')renderer.shadowMap.needsUpdate=true;
  };
  q.finish=()=>{
    q.active=false;
    renderer.render=oldRender;
    renderer.renderBufferDirect=oldDraw;
    renderer.shadowMap.autoUpdate=q.originalAutoUpdate;
    renderer.shadowMap.needsUpdate=true;
    for(const item of q.pending)gl.deleteQuery(item.query);
    q.pending.length=0;
    const {enter,finish,...out}=q;
    return out;
  };
 });
 async function phase(name,duration){
   await p.evaluate(name=>window.__opt09ShadowAB.enter(name),name);
   await wait(duration);
 }
 await phase('shadowOnA',13000);
 await phase('cached',18000);
 await phase('shadowOnB',13000);
 report.test=await p.evaluate(()=>window.__opt09ShadowAB.finish());
 const summarize=(rows)=>rows.length?{
  n:rows.length,medianMs:rows.map(x=>x.ms).sort((a,b)=>a-b)[Math.floor(rows.length/2)],
  meanMs:rows.reduce((a,x)=>a+x.ms,0)/rows.length,
  meanShadowDrawCalls:rows.reduce((a,x)=>a+x.shadowCalls,0)/rows.length,
  meanMainDrawCalls:rows.reduce((a,x)=>a+x.mainCalls,0)/rows.length
 }:null;
 report.phases=Object.fromEntries(['shadowOnA','cached','shadowOnB'].map(name=>
  [name,{render:summarize(report.test.samples.filter(x=>x.phase===name)),
   gpu:summarize(report.test.gpu.filter(x=>x.phase===name))}]));
 assert.ok(report.phases.shadowOnA.render?.n>0,'no full-shadow frames');
 assert.ok(report.phases.cached.render?.n>0,'no cached-shadow frames');
 assert.ok(report.phases.shadowOnB.render?.n>0,'no restored full-shadow frames');
 assert.ok(report.phases.shadowOnA.render.meanShadowDrawCalls>
            report.phases.cached.render.meanShadowDrawCalls,
            'shadow disabled A/B must remove shadow draw calls');
 assert.equal(report.phases.cached.render.meanShadowDrawCalls,0);
 assert.deepEqual(errors,[]);
 console.log('OPT09_SHADOW_AB',JSON.stringify({
  map,gpuSupported:report.test.gpuSupported,phases:report.phases,
  note:'QA-only diagnostic; cached shadows would break moving shadows in a real game.'}));
}catch(e){report.failure=e.stack||String(e);console.error(report.failure);}
finally{
 writeFileSync('opt09-shadow-ab-'+map+'.json',JSON.stringify(report,null,2));
 await b.close();
}
assert.ok(!report.failure,report.failure);
assert.deepEqual(errors,[]);
