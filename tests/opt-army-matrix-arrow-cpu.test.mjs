import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
const T=ctx.THREE;
const moduleSource=scripts.find(x=>x.includes('root.ArenaArmyRender=api;'));
assert.ok(moduleSource);
runInNewContext(moduleSource,ctx);
const API=ctx.ArenaArmyRender;
function fixture(){
 const scene=new T.Scene();
 const soldiers=['musket','musket','pike','pike','bow','sword'].map((type,id)=>({
  id,type,x:id*3,z:-id*4,facing:id*.1,alive:true,reload:0,
  attackPose:0,hitPose:0,microState:'',guardUntil:0
 }));
 const battle={soldiers,squads:[],projectiles:[],elapsed:0,accumulator:0};
 let poseCalls=0;
 const motion={createState:n=>({phase:n,weight:0}),update:(st,dt,o)=>{
  poseCalls++;st.phase+=dt;
  return {leftLeg:0,rightLeg:0,leftArm:0,rightArm:0,headX:0,torsoX:0,torsoZ:0};
 }};
 function botFactory(){
  const model=new T.Group();model._parts={};
  for(const name of API.PART_NAMES){
   const part=new T.Group();part.name=name;part.position.set(0,1,0);
   part.add(new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial()));
   model.add(part);model._parts[name]=part;
  }
  return model;
 }
 const visual=API.create(T,scene,battle,botFactory,motion);
 return {battle,scene,visual,poseCalls:()=>poseCalls};
}
test('OPT07 draws only active arrow prefix without changing projectile data',()=>{
 const {battle,visual}=fixture();
 let writes=0;
 const old=visual.flightArrows.setMatrixAt;
 visual.flightArrows.setMatrixAt=function(...args){writes++;return old.apply(this,args);};
 visual.update(battle,1/60);
 assert.equal(writes,0);
 assert.equal(visual.flightArrows.count,0);
 assert.equal(visual.performance().arrowMatricesWritten,0);
 const make=i=>({x:i,y:3,z:-12,vx:1,vy:2,vz:10});
 const arrow=make(2);battle.projectiles=[arrow];
 visual.update(battle,1/60);
 assert.equal(writes,1);
 assert.equal(visual.flightArrows.count,1);
 assert.equal(visual.performance().arrowMatricesWritten,1);
 assert.equal(battle.projectiles[0],arrow);
 const mat=new T.Matrix4();visual.flightArrows.getMatrixAt(0,mat);
 assert.ok(mat.elements.every(Number.isFinite));
 battle.projectiles=[];
 visual.update(battle,1/60);
 assert.equal(writes,1);assert.equal(visual.flightArrows.count,0);
 battle.projectiles=Array.from({length:99},(_,i)=>make(i));
 visual.update(battle,1/60);
 assert.equal(writes,97);assert.equal(visual.flightArrows.count,96);
 assert.equal(battle.projectiles.length,99);
 visual.dispose();
});
test('OPT07 dead soldiers keep zero-scale transforms; repeated writes are skipped, but pose phase still advances',()=>{
 const {battle,visual,poseCalls}=fixture();
 const unit=battle.soldiers[0],role=visual.roles[unit.type],slot=role.slots.get(unit.id);
 const meshes=Object.values(role.parts).flatMap(p=>p.meshes);
 let writes=0;
 for(const mesh of meshes){const old=mesh.setMatrixAt;mesh.setMatrixAt=function(...a){
  if(a[0]===slot)writes++;return old.apply(this,a);
 };}
 visual.update(battle,.016);
 const initial=writes;assert.equal(initial,meshes.length);
 unit.alive=false;
 visual.update(battle,.016);
 assert.equal(writes,initial+meshes.length);
 const invisible=meshes.map(mesh=>{const m=new T.Matrix4();mesh.getMatrixAt(slot,m);return Array.from(m.elements);});
 assert.ok(invisible.every(a=>a[0]===0&&a[5]===0&&a[10]===0));
 const poses=poseCalls();
 unit.x=200;unit.z=-200;
 visual.update(battle,.016);
 assert.equal(writes,initial+meshes.length);
 assert.equal(visual.performance().hiddenSoldiersSkipped,1);
 assert.equal(poseCalls(),poses+battle.soldiers.length);
 for(let i=0;i<meshes.length;i++){
  const m=new T.Matrix4();meshes[i].getMatrixAt(slot,m);
  assert.deepEqual(Array.from(m.elements),invisible[i]);
 }
 unit.alive=true;
 visual.update(battle,.016);
 assert.equal(writes,initial+meshes.length*2);
 assert.equal(visual.performance().hiddenSoldiersSkipped,0);
 const revived=new T.Matrix4();meshes[0].getMatrixAt(slot,revived);
 assert.ok(Math.abs(revived.elements[12]-200)<1e-6);
 assert.ok(Math.abs(revived.elements[14]+200)<1e-6);
 visual.dispose();
});
test('OPT07 entirely new battle state resets hidden flags and all original slots',()=>{
 const {battle,visual}=fixture();
 battle.soldiers[0].alive=false;
 visual.update(battle,.016);visual.update(battle,.016);
 assert.equal(visual.performance().hiddenSoldiersSkipped,1);
 const replacement={...battle,soldiers:battle.soldiers.map(s=>({...s}))};
 visual.update(replacement,.016);
 assert.equal(visual.performance().hiddenSoldiersSkipped,0);
 const mesh=Object.values(visual.roles.musket.parts)[0].meshes[0];
 const m=new T.Matrix4();mesh.getMatrixAt(0,m);
 assert.equal(m.elements[0],0);
 visual.dispose();
});
test('OPT07 keeps canonical HTML equal and profiles army simulation, rendering and equipment separately',()=>{
 const other=readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8');
 assert.equal(html,other);
 const qa=readFileSync(new URL('../qa/opt_map_profile.mjs',import.meta.url),'utf8');
 for(const key of ['armySim','armyVisual','siegeEquipment','siegeTowerRender','armyVisualCpuPolicy'])
  assert.ok(qa.includes(key),key);
 assert.match(html,/syncArmyArrowDrawCount\(\)/);
 assert.match(html,/nativeSiegeTowerRenderSoldiers\(\)/);
});

test('OPT07 exact approved render module identity is verified independently; live battle pin remains unchanged',()=>{
 const sync=readFileSync(new URL('../tools/sync_canonical_entrypoint.mjs',import.meta.url),'utf8');
 const pin=sync.match(/const approvedArmyRenderBlob='([0-9a-f]{40})'/);
 assert.ok(pin);
 const script=scripts[27],id=createHash('sha1').update('blob '+Buffer.byteLength(script)+'\0').update(script).digest('hex');
 assert.equal(id,pin[1]);
 assert.match(sync,/approvedArmyBlob='7936fa83981fb4ed0beb1900e5224da816c653d7'/);
 assert.match(sync,/else if\(i!==26&&i!==27\)throw Error/);
 assert.match(sync,/manifest\.unchangedOriginalScriptCount!==26/);
});
