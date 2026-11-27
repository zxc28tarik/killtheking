/**
 * OPT08 / CPU-only deterministic A-B of the REAL r128 army renderer:
 * snapshot before OPT07 vs current UI32 script 27. It measures the transform
 * pipeline, not GPU throughput or a natural match. No game file is modified.
 *
 * Run: node qa/opt_army_stress.mjs
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const baselineFile=readFileSync(new URL('./fixtures/army_render_pre_opt07.js',import.meta.url),'utf8');
const baselineBlob='2bb9631a139e8646a2010a1653901ee4ed0088fb';
const gitBlob=s=>createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
assert.equal(gitBlob(baselineFile),baselineBlob,'Historic baseline source changed');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
assert.equal(scripts.length,31);
const currentFile=scripts[27];
assert.match(currentFile,/root\.ArenaArmyRender=api;/);
assert.match(currentFile,/hiddenLastFrame/);
assert.match(currentFile,/const arrowCount=Math.min\(arrowCapacity,arrows.length\)/);
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
function sourceAPI(source){
 const world={console};
 runInNewContext(source,world,{timeout:12000});
 assert.ok(world.ArenaArmyRender?.create);
 return world.ArenaArmyRender;
}
const base=sourceAPI(baselineFile),opt=sourceAPI(currentFile);
const types=['musket','pike','bow','sword'];
const cases=[
 {key:'full-army-0-arrows',dead:0,arrows:0},
 {key:'35-dead-0-arrows',dead:35,arrows:0},
 {key:'70-dead-0-arrows',dead:70,arrows:0},
 {key:'105-dead-0-arrows',dead:105,arrows:0},
 {key:'140-dead-0-arrows',dead:140,arrows:0},
 {key:'full-army-1-arrow',dead:0,arrows:1},
 {key:'full-army-32-arrows',dead:0,arrows:32},
 {key:'full-army-96-arrows',dead:0,arrows:96}
];
function stateFor({dead,arrows}){
 const soldiers=Array.from({length:140},(_,id)=>({
  id,type:types[id%4],team:id<70?'blue':'red',squadId:id%8,
  x:(id<70?-135:135)+id%7*2.1,z:(id%14-7)*9.2,
  alive:id<140-dead,hp:id<140-dead?100:0,
  facing:id*.021,attackPose:id%10===0?.5:0,hitPose:0,
  reload:id%4===2?2.3:0,guardUntil:0,microState:'formation'
 }));
 const squads=Array.from({length:8},(_,id)=>{
  const units=soldiers.filter(s=>s.squadId===id);
  return {id,x:units[0].x,z:units[0].z,team:id%2?'red':'blue',alive:units.filter(s=>s.alive).length};
 });
 const projectiles=Array.from({length:arrows},(_,i)=>({
  x:i*.6,y:2+(i%3)*.2,z:-45+i*.31,vx:3+i%4,vy:1,vz:20
 }));
 return {soldiers,squads,projectiles,elapsed:5,accumulator:.025};
}
function botFactory(){
 const model=new T.Group();model._parts={};
 for(const [index,name] of base.PART_NAMES.entries()){
  const part=new T.Group();part.name=name;part.position.set(0,.6+index*.1,0);
  part.rotation.z=index*.018;
  const metal=new T.Mesh(new T.BoxGeometry(.28+index*.015,.55,.27),
    new T.MeshLambertMaterial({color:0x777879}));
  const accent=new T.Mesh(new T.BoxGeometry(.1,.2,.12),
    new T.MeshLambertMaterial({color:0x51422c}));
  accent.position.set(.08,.12,.04);
  part.add(metal,accent);model.add(part);model._parts[name]=part;
 }
 return model;
}
function setup(api,scenario){
 const scene=new T.Scene(),state=stateFor(scenario);
 const monitor={motionUpdates:0};
 const motion={
  createState:seed=>({phase:seed,weight:0}),
  update:(m,dt,arg)=>{
   monitor.motionUpdates++;m.phase+=dt;
   const swing=Math.sin(m.phase)*(arg.travel?0.3:0.12);
   return {leftLeg:swing,rightLeg:-swing,leftArm:-swing,rightArm:swing,
    headX:.025*Math.sin(m.phase),torsoX:.02*Math.cos(m.phase),torsoZ:.01*Math.sin(m.phase)};
  }
 };
 const visual=api.create(T,scene,state,botFactory,motion);
 visual.flightArrows.count=Math.min(96,state.projectiles.length);
 const allMeshes=Object.values(visual.roles).flatMap(role=>
  Object.values(role.parts).flatMap(part=>part.meshes));
 assert.equal(state.soldiers.length,140);
 assert.equal(visual.flightArrows.instanceMatrix.count,96);
 return {visual,state,allMeshes,monitor};
}
function update(item){
 item.visual.update(item.state,1/60);
 // Existing native caller always does this after visual.update().
 item.visual.flightArrows.count=Math.min(96,item.state.projectiles.length);
}
function countsFor(item){
 const writes={soldier:0,arrow:0};
 const undo=[];
 for(const mesh of item.allMeshes){
  const original=mesh.setMatrixAt;
  mesh.setMatrixAt=function(...args){writes.soldier++;return original.apply(this,args);};
  undo.push(()=>{mesh.setMatrixAt=original;});
 }
 const arrowMesh=item.visual.flightArrows,fn=arrowMesh.setMatrixAt;
 arrowMesh.setMatrixAt=function(...args){writes.arrow++;return fn.apply(this,args);};
 undo.push(()=>{arrowMesh.setMatrixAt=fn;});
 try{update(item);}finally{for(const f of undo)f();}
 return writes;
}
function sameVisibleTransforms(before,after,scenario){
 assert.equal(before.allMeshes.length,after.allMeshes.length);
 for(const roleKey of Object.keys(before.visual.roles)){
  const b=before.visual.roles[roleKey],a=after.visual.roles[roleKey];
  for(const partName of Object.keys(b.parts)){
   const bm=b.parts[partName].meshes,am=a.parts[partName].meshes;
   assert.equal(bm.length,am.length);
   for(let i=0;i<bm.length;i++){
    assert.equal(bm[i].count,am[i].count);
    const bb=bm[i].instanceMatrix.array,aa=am[i].instanceMatrix.array;
    assert.equal(bb.length,aa.length);
    for(let j=0;j<bb.length;j++)
     assert.ok(Math.abs(bb[j]-aa[j])<=1e-6,
      scenario.key+' '+roleKey+'/'+partName+' inst='+Math.floor(j/16)+' element='+j);
   }
  }
 }
 assert.equal(before.visual.flightArrows.count,after.visual.flightArrows.count);
 const n=Math.min(96,scenario.arrows)*16;
 const beforeArrow=before.visual.flightArrows.instanceMatrix.array;
 const afterArrow=after.visual.flightArrows.instanceMatrix.array;
 for(let i=0;i<n;i++)
  assert.ok(Math.abs(beforeArrow[i]-afterArrow[i])<1e-6,scenario.key+' arrow element='+i);
}
function median(values){
 const a=values.slice().sort((x,y)=>x-y);
 return (a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2;
}
function timePerUpdate(item){
 // No instrumentation during timing: measure native matrix writes only.
 for(let i=0;i<30;i++)update(item);
 const samples=[];
 for(let round=0;round<5;round++){
  const start=performance.now();
  for(let i=0;i<36;i++)update(item);
  samples.push((performance.now()-start)/36);
 }
 return {medianMs:median(samples),samplesMs:samples};
}
const results=[];
for(const scenario of cases){
 const old=setup(base,scenario),fresh=setup(opt,scenario);
 for(let i=0;i<5;i++){update(old);update(fresh);}
 sameVisibleTransforms(old,fresh,scenario);
 const oldWrites=countsFor(old),newWrites=countsFor(fresh);
 // Role batches contain 35 soldiers each, not 140 in every batch.
 const rigMeshesPerActor=base.PART_NAMES.length*2;
 assert.equal(oldWrites.soldier,rigMeshesPerActor*140);
 assert.equal(oldWrites.arrow,96);
 assert.equal(newWrites.soldier,rigMeshesPerActor*(140-scenario.dead));
 assert.equal(newWrites.arrow,scenario.arrows);
 assert.equal(old.monitor.motionUpdates,fresh.monitor.motionUpdates);
 const order=results.length%2===0?[['before',old],['after',fresh]]:[['after',fresh],['before',old]];
 const timing={};
 for(const [key,item] of order)timing[key]=timePerUpdate(item);
 sameVisibleTransforms(old,fresh,scenario);
 assert.equal(old.monitor.motionUpdates,fresh.monitor.motionUpdates,'All soldier motion phases must advance');
 const result={...scenario,oldWrites,newWrites,
  oldCpuMs:timing.before.medianMs,optCpuMs:timing.after.medianMs,
  ratio:timing.after.medianMs/timing.before.medianMs,
  savedSoldierWrites:oldWrites.soldier-newWrites.soldier,
  savedArrowWrites:oldWrites.arrow-newWrites.arrow};
 results.push(result);
 console.log('OPT08_CASE',JSON.stringify(result));
 old.visual.dispose();fresh.visual.dispose();
}
const report={schema:'ktk-opt08-army-cpu-v1',env:'Node22 + Three r128 (CPU only, mock rig 2 mesh/part)',
 baselineSource:'bcb6c6d983a77ac872670d02a4171663c09cae31',
 baselineBlob,productionSource:process.env.GITHUB_SHA??null,
 soldierCount:140,arrowCapacity:96,rigParts:7,meshPerPart:2,
 note:'Synthetic deterministic fixture. Not a GPU/FPS benchmark or natural-match outcome.',
 results};
writeFileSync('opt08-army-stress-report.json',JSON.stringify(report,null,2));
console.log('OPT08_FINISHED',JSON.stringify({cases:results.length,pass:true,
 savedWrites:results.map(x=>({case:x.key,soldier:x.savedSoldierWrites,arrow:x.savedArrowWrites}))}));
