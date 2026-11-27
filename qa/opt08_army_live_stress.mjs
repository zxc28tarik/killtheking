// OPT08: Disposable real-original-140-soldier visual stress in Chromium.
// Not natural-match FPS or a hardware GPU run.
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const map=process.env.KTK_MAP;
assert.ok(['meadow','siege'].includes(map));
const browser=await chromium.launch({args:['--use-angle=swiftshader',
 '--enable-unsafe-swiftshader','--disable-dev-shm-usage',
 '--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const p=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
const errors=[],report={schema:'ktk-opt08-live-v1',map,backend:'SwiftShader',
 source:process.env.GITHUB_SHA??null,results:[],errors};
p.on('pageerror',e=>errors.push(e.stack||e.message));
p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try {
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
 report.results=await p.evaluate(()=>{
  const state=meadowBattleState,visual=meadowBattleVisual;
  if(!state||!visual||state.soldiers.length!==140)throw Error('OPT08 original 140 soldiers absent');
  const previousActive=isGameActive,oldProjectiles=state.projectiles;
  const original=state.soldiers.map(s=>({alive:s.alive,hp:s.hp}));
  const median=arr=>{const v=arr.slice().sort((a,b)=>a-b);
   return (v[Math.floor((v.length-1)/2)]+v[Math.ceil((v.length-1)/2)])/2;};
  const cases=[
   {name:'0-dead-0-arrow',dead:0,arrows:0},
   {name:'35-dead-0-arrow',dead:35,arrows:0},
   {name:'70-dead-0-arrow',dead:70,arrows:0},
   {name:'105-dead-0-arrow',dead:105,arrows:0},
   {name:'140-dead-0-arrow',dead:140,arrows:0},
   {name:'0-dead-1-arrow',dead:0,arrows:1},
   {name:'0-dead-32-arrow',dead:0,arrows:32},
   {name:'0-dead-96-arrow',dead:0,arrows:96},
   // OPT10: wipe an actual G5.4 role (not an arbitrary array prefix).
   {name:'entire-musket-role-dead',role:'musket',arrows:0},
   {name:'entire-sword-role-dead',role:'sword',arrows:0}];
  const output=[];
  try{
   isGameActive=false;
   for(const c of cases){
    state.soldiers.forEach((s,i)=>{
     s.alive=c.role?s.type!==c.role:i<140-c.dead;
     s.hp=s.alive?original[i].hp:0;
    });
    state.projectiles=Array.from({length:c.arrows},(_,i)=>({
     x:i*.5,y:3+(i%4)*.2,z:-40+i*.25,vx:3,vy:1,vz:20
    }));
    // First death frame zeros matrices; repeated frames expose steady load.
    visual.update(state,1/60);syncArmyArrowDrawCount();
    visual.update(state,1/60);syncArmyArrowDrawCount();
    const counters={...visual.performance()};
    const deadCount=state.soldiers.filter(s=>!s.alive).length;
    // G5.4 roster order is role-grouped. A prefix casualty may eliminate
    // entire roles before every soldier is dead; derive from actual survivors.
    const shouldSkip=Object.entries(visual.roles).reduce((sum,[type,role])=>
      sum+(state.soldiers.some(u=>u.alive&&u.type===type)?0:role.batches),0);
    if(counters.alive!==140-deadCount||
       counters.hiddenSoldiersSkipped!==deadCount||
       counters.arrowMatricesWritten!==c.arrows||
       counters.skippedBatchUploads!==shouldSkip||
       counters.uploadedBatches!==visual.drawBatches-1-shouldSkip||
       visual.flightArrows.count!==c.arrows)
     throw Error('OPT08 real model counters incorrect '+c.name+' '+JSON.stringify(counters));
    const samples=[];
    for(let r=0;r<5;r++){
     const start=performance.now();
     for(let j=0;j<24;j++){visual.update(state,1/60);syncArmyArrowDrawCount();}
     samples.push((performance.now()-start)/24);
    }
    output.push({...c,deadCount,medianVisualUpdateMs:median(samples),samples,
     drawBatches:visual.drawBatches,counters:{...visual.performance()},
     sceneVisible:visual.group.visible});
   }
  }finally{
   state.soldiers.forEach((s,i)=>{s.alive=original[i].alive;s.hp=original[i].hp;});
   state.projectiles=oldProjectiles;
   visual.update(state,1/60);syncArmyArrowDrawCount();
   isGameActive=previousActive;
  }
  if(state.projectiles!==oldProjectiles||
   state.soldiers.some((s,i)=>s.alive!==original[i].alive||s.hp!==original[i].hp))
   throw Error('OPT08 did not restore original game fields');
  if(output.some(x=>!x.sceneVisible||x.drawBatches<=0))
   throw Error('OPT08 army original models not rendered');
  return output;
 });
 assert.equal(report.results.length,10);
 assert.deepEqual(errors,[]);
 console.log('OPT08_LIVE',JSON.stringify(report));
}catch(e){report.failure=e.stack||String(e);console.error(report.failure);}
finally{
 writeFileSync('opt08-live-'+map+'.json',JSON.stringify(report,null,2));
 await browser.close();
}
assert.ok(!report.failure,report.failure);
assert.deepEqual(errors,[]);
