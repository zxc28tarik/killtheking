/* OPT-11 disposable-browser render-cost attribution.
 * A/B/A intercepts WebGL draw calls in QA only. No production visibility,
 * lighting, AI, geometry, shadow settings, or canonical HTML are modified.
 * Skipped draws intentionally degrade ONLY the temporary test image.
 * SwiftShader timings are NOT hardware FPS estimates.
 */
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const map=process.env.KTK_MAP||'meadow';
const target=process.env.KTK_TARGET||'grass';
const allowed={
 meadow:['grass','army'],
 siege:['architecture','army']
};
assert.ok(allowed[map]?.includes(target), 'unsupported OPT11 map/target');
const report={schema:'ktk-opt11-render-ab-v1',map,target,source:process.env.GITHUB_SHA??null,
 backend:'SwiftShader',viewport:'960x540',quality:'medium',errors:[]};
const wait=ms=>new Promise(done=>setTimeout(done,ms));
const browser=await chromium.launch({args:[
 '--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage',
 '--disable-background-timer-throttling','--disable-renderer-backgrounding'
]});
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
 await page.locator('[data-focus-map="'+map+'"]').click();
 await page.locator('[data-approved-class="0"]:visible').click();
 await page.locator('#play-btn').click();
 await page.waitForFunction(()=>arenaMatch.phase==='playing'&&document.pointerLockElement===canvas,null,{timeout:45000});
 assert.equal(await page.evaluate(()=>nativeSiegeMode?'siege':meadowBattleMode?'meadow':'arena'),map);
 if(map==='siege')for(const k of ['F6','F7','F8'])await page.keyboard.press(k);
 if(map==='meadow')await page.keyboard.press('k');

 report.setup=await page.evaluate(target=>{
  const groupForArmy=meadowBattleVisual?.group;
  const named={
   grass:[meadowDenseGrass,ktkMeshyGrassHero,meadowNearGrass],
   army:[groupForArmy],
   architecture:[nativeSiegeParts]
  };
  const roots=[...new Set(named[target].filter(x=>x?.isObject3D))];
  if(!roots.length)throw Error('OPT11: no render roots for '+target);
  const set=new Set(roots);
  const isTarget=o=>{
   for(let node=o;node;node=node.parent)if(set.has(node))return true;
   return false;
  };
  const oldRender=renderer.render;
  const oldDraw=renderer.renderBufferDirect;
  const q={phase:'warmup',active:true,records:[],roots:roots.map(x=>({
   name:x.name||x.type,uuid:x.uuid,visible:x.visible,children:x.children?.length??0
  }))};
  window.__opt11AB=q;
  let stats;
  const reset=()=>stats={calls:0,mainCalls:0,shadowCalls:0,
   targetAllowed:0,targetSkipped:0,triangles:0,skippedTriangles:0};
  reset();
  renderer.renderBufferDirect=function(cam,sc,geo,mat,obj,grp){
   if(!q.active)return oldDraw.call(this,cam,sc,geo,mat,obj,grp);
   const hit=isTarget(obj);
   const triangles=Math.floor((grp?.count??geo.index?.count??
     geo.attributes?.position?.count??0)/3)*(obj?.isInstancedMesh?obj.count:1);
   if(hit&&q.phase==='targetOff'){
    stats.targetSkipped++;
    stats.skippedTriangles+=triangles;
    return;
   }
   stats.calls++;
   if(cam===camera)stats.mainCalls++;else stats.shadowCalls++;
   stats.triangles+=triangles;
   if(hit)stats.targetAllowed++;
   return oldDraw.call(this,cam,sc,geo,mat,obj,grp);
  };
  renderer.render=function(...args){
   if(!q.active)return oldRender.apply(this,args);
   reset();
   const started=performance.now();
   try{return oldRender.apply(this,args);}
   finally{
    q.records.push({phase:q.phase,ms:performance.now()-started,
     ...stats,gameActive:isGameActive,playing:arenaMatch.phase==='playing'});
   }
  };
  q.enter=phase=>{q.phase=phase;};
  q.finish=()=>{
   q.active=false;
   renderer.render=oldRender;
   renderer.renderBufferDirect=oldDraw;
   const {enter,finish,...snapshot}=q;
   return snapshot;
  };
  return {roots:q.roots,rendererPatched:renderer.render!==oldRender};
 },target);
 assert.equal(report.setup.rendererPatched,true);
 async function phase(name,ms){
  await page.evaluate(name=>window.__opt11AB.enter(name),name);
  await wait(ms);
 }
 await phase('targetOnA',12000);
 await phase('targetOff',16000);
 await phase('targetOnB',12000);
 report.measurements=await page.evaluate(()=>window.__opt11AB.finish());
 const summarize=rows=>{
  const r=rows.filter(x=>x.phase&&x.gameActive&&x.playing);
  if(!r.length)return null;
  const ms=r.map(x=>x.ms).sort((a,b)=>a-b);
  const mean=k=>r.reduce((sum,x)=>sum+x[k],0)/r.length;
  return {n:r.length,meanRenderCpuMs:mean('ms'),medianRenderCpuMs:ms[Math.floor(ms.length/2)],
   meanCalls:mean('calls'),meanMainCalls:mean('mainCalls'),
   meanShadowCalls:mean('shadowCalls'),
   meanTriangles:mean('triangles'),meanSkippedTriangles:mean('skippedTriangles'),
   meanTargetAllowed:mean('targetAllowed'),meanTargetSkipped:mean('targetSkipped')};
 };
 report.phases=Object.fromEntries(['targetOnA','targetOff','targetOnB'].map(name=>
  [name,summarize(report.measurements.records.filter(x=>x.phase===name))]));
 for(const phaseName of ['targetOnA','targetOff','targetOnB'])
  assert.ok(report.phases[phaseName]?.n>0,'no measured frames: '+phaseName);
 assert.ok(report.phases.targetOnA.meanTargetAllowed>0,
  'no visible matching objects in baseline; measurement not comparable');
 assert.ok(report.phases.targetOnB.meanTargetAllowed>0,
  'matching objects not redrawn after test phase');
 assert.ok(report.phases.targetOff.meanTargetSkipped>0,
  'no matching draw calls skipped in isolated test phase');
 assert.equal(report.phases.targetOff.meanTargetAllowed,0);
 assert.deepEqual(report.errors,[]);
 console.log('OPT11_RENDER_AB',JSON.stringify({map,target,phases:report.phases,
  note:'Only target-specific draw calls omitted in disposable QA browser. No FPS claims.'}));
}catch(e){report.failure=e.stack||String(e);console.error(report.failure);}
finally{
 // Restore all instrumentation even when a phase assertion fails.
 try{await page.evaluate(()=>window.__opt11AB?.finish?.());}catch{}
 writeFileSync('opt11-render-ab-'+map+'-'+target+'.json',JSON.stringify(report,null,2));
 await browser.close();
}
assert.ok(!report.failure,report.failure);
assert.deepEqual(report.errors,[]);
