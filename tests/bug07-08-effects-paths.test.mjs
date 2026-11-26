import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const main=scripts[28];
function part(a,b){const i=main.indexOf(a),j=main.indexOf(b,i);assert.ok(i>=0&&j>i,a);return main.slice(i,j);}
const ctx={window:{},particles:[]};
runInNewContext(scripts[0],ctx);
ctx.scene=new ctx.THREE.Scene();
runInNewContext(part('        const effectCubeGeometry','        function releaseArrow(')+
 part('        function spawnSmokeCloud(','        function triggerBarrelExplosion(')+
 part('        function arenaShotTracer(','        function damageBotFromBot(')+
 '\nthis.api={admitParticle,spawnSmokeCloud,spawnHitSparks,arenaShotTracer,releaseParticle};',ctx);
const {THREE,api,particles,scene}=ctx;
const pos=new THREE.Vector3(0,2,0),dir=new THREE.Vector3(1,0,0);
function reset(){for(const p of particles)api.releaseParticle(p.mesh);particles.length=0;}
test('BUG07 actual smoke and impact generators never exceed active cap, reserve prioritized',()=>{
 reset();
 for(let i=0;i<30;i++)api.spawnSmokeCloud(pos,dir,20);
 let state=ctx.window.ktkParticlePoolStatus();
 assert.ok(particles.length>=256&&particles.length<=320);
 assert.ok(state.skippedNormalEffects>0);
 assert.equal(scene.children.length,particles.length);
 for(let i=0;i<200;i++)api.spawnHitSparks(pos,true);
 for(let i=0;i<200;i++)api.arenaShotTracer(pos,new THREE.Vector3(10,2,0),false);
 state=ctx.window.ktkParticlePoolStatus();
 assert.equal(particles.length,320);assert.equal(scene.children.length,320);
 assert.ok(state.skippedPriorityEffects>0);
 reset();assert.equal(scene.children.length,0);
 api.spawnSmokeCloud(pos,dir,5);assert.equal(particles.length,5);
 reset();
});
test('BUG07 64 slots remain reserved after normal admission reaches 256',()=>{
 const fake={mesh:null};
 particles.push(...Array(256).fill(fake));
 assert.equal(api.admitParticle(false),false);assert.equal(api.admitParticle(true),true);
 particles.length=320;assert.equal(api.admitParticle(true),false);particles.length=0;
});
test('BUG07 effect saturation never skips arrow swept collision or barrel damage',()=>{
 const trail=part('// Spawn wind trail cube behind arrow','// Swept collision:');
 assert.match(trail,/if\(admitParticle\(\)\)/);assert.doesNotMatch(trail,/\bcontinue\b/);
 const explosion=part('function triggerBarrelExplosion(','// Use the actual active mode');
 assert.match(explosion,/if\(!admitParticle\(i<8\)\)continue/);
 assert.equal((main.match(/particles\.push\(/g)||[]).length,6);
});
function load(name,path){
 const source=readFileSync(new URL(path,import.meta.url),'utf8');
 assert.ok(main.includes(source),name+' module matches live game');
 return runInNewContext(source+'\n'+name+';', {});
}
const d=load('KTKSiegeFortificationV26','../recovered/native-siege/native-siege-defense-v26.js');
const v=load('KTKSiegeInteriorV31','../recovered/native-siege/native-siege-interior-v31.js');
const pt=(x,z)=>({x,z});
test('BUG08 every solid blocks continuous segment even with clear endpoints',()=>{
 for(const fort of [d,v])for(const f of fort.features){
  const a=pt(f.x-f.w/2-2,f.z),b=pt(f.x+f.w/2+2,f.z);
  assert.equal(fort.pathClear([a,b],0),false,f.name);
  assert.equal(fort.pathClear([b,a],0),false,f.name+' reverse');
 }
 assert.equal(d.pathClear([pt(0,-20),pt(0,0)],0),false,'dogleg between endpoints');
 assert.equal(v.pathClear([pt(98,91),pt(98,101)],0),false,'post between endpoints');
});
test('BUG08 genuine routes stay clear; tangent, invalid and zero length handled',()=>{
 for(const fort of [d,v]){
  for(const x of [-19,19])assert.equal(fort.pathClear([pt(x,-24),pt(x,12)],2),true);
  assert.equal(fort.pathClear([pt(0,50),pt(0,83)],2),true);
  assert.equal(fort.pathClear([pt(NaN,0),pt(0,0)],1),false);
  assert.equal(fort.pathClear([pt(0,0),pt(0,1)],-1),false);
  const f=fort.features[0],a=pt(f.x-f.w/2-2,f.z-f.d/2-1),b=pt(f.x+f.w/2+2,a.z);
  assert.equal(fort.pathClear([a,b],1),false,'tangent counts as contact');
 }
 assert.equal(v.pathClear([pt(98,96)],0),false);
 assert.equal(v.pathClear([pt(0,130)],1),true);
 assert.equal(d.pathClear([pt(0,-70),pt(0,-70)],1),true);
});
test('BUG08 canonical HTML identical and all original 31 script boundaries retained',()=>{
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
 assert.equal(scripts.length,31);
});
