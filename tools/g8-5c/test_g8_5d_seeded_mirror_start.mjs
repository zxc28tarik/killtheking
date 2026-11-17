import assert from 'node:assert/strict';
import {createBattleRandom,createMirroredSpawns,measureStartLayout,BATTLE_RNG_VERSION} from './g8_5d_seeded_mirror_start.mjs';
import {verifyMirrorStartLayout} from './g8_5c_start_layout_gate.mjs';
const tests=[];const t=(n,f)=>tests.push([n,f]);
const army=()=>({
  blue:[{id:'B-2',type:'bow',team:'blue',x:-20,z:2,y:1,facing:0,hp:80},{id:'B-1',type:'musket',team:'blue',x:-30,z:1,y:0,facing:0,hp:100},{id:'B-3',type:'bow',team:'blue',x:-18,z:5,facing:0,hp:60}],
  red:[{id:'R-3',type:'bow',team:'red',x:18,z:-5,facing:3.14,hp:71},{id:'R-1',type:'musket',team:'red',x:30,z:-1,y:0,facing:3.14,hp:97},{id:'R-2',type:'bow',team:'red',x:20,z:-2,y:1,facing:3.14,hp:95}]
});
t('algorithm identifier explicit',()=>assert.equal(BATTLE_RNG_VERSION,'g8d-stateless-v1'));
t('seed repeat exact',()=>assert.deepEqual(Array.from({length:60},(_,i)=>createBattleRandom(42).at('AI','B-2',i,1)),Array.from({length:60},(_,i)=>createBattleRandom(42).at('AI','B-2',i,1))));
t('different seeds normally diverge',()=>assert.notEqual(createBattleRandom(42).at('AI','B-2',3,1),createBattleRandom(43).at('AI','B-2',3,1)));
t('different domains isolated',()=>assert.notEqual(createBattleRandom(42).at('AI','B-2',3,1),createBattleRandom(42).at('VFX','B-2',3,1)));
t('different entities isolated',()=>assert.notEqual(createBattleRandom(42).at('AI','B-2',3,1),createBattleRandom(42).at('AI','R-2',3,1)));
t('different ticks isolated',()=>assert.notEqual(createBattleRandom(42).at('AI','B-2',3,1),createBattleRandom(42).at('AI','B-2',4,1)));
t('different draw indices isolated',()=>assert.notEqual(createBattleRandom(42).at('AI','B-2',3,1),createBattleRandom(42).at('AI','B-2',3,2)));
t('at() is independent of invocation order',()=>{let a=createBattleRandom(123),x=a.at('AI','B-1',2,7);a.at('VFX','red',999,4);assert.equal(a.at('AI','B-1',2,7),x)});
t('values in [0,1)',()=>{const r=createBattleRandom(0);for(let i=0;i<500;i++){const x=r.at('AI',i,i+1,i);assert(x>=0&&x<1)}});
t('stream repeat exact',()=>{let a=createBattleRandom(42).stream('AI','B'),b=createBattleRandom(42).stream('AI','B');for(let i=0;i<50;i++)assert.equal(a.next(),b.next())});
t('stream position tracks consumed values',()=>{let s=createBattleRandom(42).stream('AI','B');s.next();s.next();assert.equal(s.position(),2)});
t('stream consumer independence',()=>{const rng=createBattleRandom(11),a=rng.stream('AI','unit'),b=rng.stream('AI','unit');a.next();a.next();assert.equal(b.next(),rng.at('AI','unit',0,0))});
t('seed 0 is valid',()=>assert.equal(createBattleRandom(0).seed,0));
t('max uint32 is valid',()=>assert.equal(createBattleRandom(4294967295).seed,4294967295));
t('reject negative seed',()=>assert.throws(()=>createBattleRandom(-1),/unsigned/));
t('reject noninteger seed',()=>assert.throws(()=>createBattleRandom(.5),/unsigned/));
t('reject >uint32 seed',()=>assert.throws(()=>createBattleRandom(4294967296),/unsigned/));
t('reject invalid tick',()=>assert.throws(()=>createBattleRandom(1).at('AI','B',-1),/unsigned/));
t('reject empty domain',()=>assert.throws(()=>createBattleRandom(1).at('','B',1),/domain/));
t('reject empty entity',()=>assert.throws(()=>createBattleRandom(1).at('AI','',1),/identity/));
t('original preserves exact rosters values',()=>assert.deepEqual(createMirroredSpawns(army(),'original'),army()));
t('original returns distinct references',()=>{const a=army(),b=createMirroredSpawns(a,'original');assert.notStrictEqual(a.blue,b.blue);assert.notStrictEqual(a.blue[0],b.blue[0])});
t('swapped moves true start positions by type and team',()=>{const base=army(),old=measureStartLayout(base),newLayout=measureStartLayout(createMirroredSpawns(base,'swapped'));assert.equal(verifyMirrorStartLayout({sideSwap:'original',startLayout:old},{sideSwap:'swapped',startLayout:newLayout}).verified,true)});
t('swap twice restores exact roster',()=>assert.deepEqual(createMirroredSpawns(createMirroredSpawns(army(),'swapped'),'swapped'),army()));
t('team identities do not change',()=>{const v=createMirroredSpawns(army(),'swapped');assert(v.blue.every(x=>x.team==='blue'));assert(v.red.every(x=>x.team==='red'))});
t('soldier IDs do not change',()=>{const a=army(),v=createMirroredSpawns(a,'swapped');assert.deepEqual(v.blue.map(x=>x.id),a.blue.map(x=>x.id));assert.deepEqual(v.red.map(x=>x.id),a.red.map(x=>x.id))});
t('HP and unit classes preserved',()=>{const a=army(),v=createMirroredSpawns(a,'swapped');for(const team of ['blue','red']){assert.deepEqual(v[team].map(x=>x.hp),a[team].map(x=>x.hp));assert.deepEqual(v[team].map(x=>x.type),a[team].map(x=>x.type))}});
t('orientation follows swapped spawn',()=>{const v=createMirroredSpawns(army(),'swapped');assert(v.blue.every(x=>x.facing===3.14));assert(v.red.every(x=>x.facing===0))});
t('optional altitude follows transferred spawn',()=>{const v=createMirroredSpawns(army(),'swapped');assert.equal(v.blue.find(x=>x.type==='musket').y,0);assert.equal(v.red.find(x=>x.id==='R-3').y,undefined)});
t('immutable result roster and soldier',()=>{let v=createMirroredSpawns(army(),'swapped');assert(Object.isFrozen(v.blue));assert(Object.isFrozen(v.blue[0]));assert.throws(()=>{v.blue[0].x=6},/read only/)});
t('does not mutate source roster',()=>{const a=army(),before=structuredClone(a);createMirroredSpawns(a,'swapped');assert.deepEqual(a,before)});
t('reordered input yields same unit spawn assignments',()=>{let a=army();let b=army();b.blue.reverse();b.red.reverse();const ordered=createMirroredSpawns(a,'swapped');const shuffled=createMirroredSpawns(b,'swapped');for(const team of ['blue','red'])assert.deepEqual(Object.fromEntries(ordered[team].map(u=>[u.id,[u.x,u.z]])),Object.fromEntries(shuffled[team].map(u=>[u.id,[u.x,u.z]])))});
t('reject asymmetric type counts',()=>{let a=army();a.red.pop();assert.throws(()=>createMirroredSpawns(a,'swapped'),/asymmetric/)});
t('reject incorrect team label',()=>{let a=army();a.blue[0].team='red';assert.throws(()=>createMirroredSpawns(a,'swapped'),/belongs/)});
t('reject invalid roster',()=>assert.throws(()=>createMirroredSpawns({blue:[],red:[]},'original'),/nonempty/));
t('reject non finite spawn x',()=>{let a=army();a.blue[0].x=NaN;assert.throws(()=>createMirroredSpawns(a,'swapped'),/finite x/)});
t('reject duplicate IDs',()=>{let a=army();a.blue[0].id=a.blue[1].id;assert.throws(()=>createMirroredSpawns(a,'swapped'),/duplicate/)});
t('reject unknown side swap',()=>assert.throws(()=>createMirroredSpawns(army(),'mirror'),/sideSwap/));
t('read-only measured start layout',()=>{let v=measureStartLayout(army());assert(Object.isFrozen(v.blue));assert(Object.isFrozen(v.blue[0]))});
let count=0;for(const [name,fn] of tests){fn();count++;console.log('PASS',name)}
console.log(`${count}/${tests.length} G8.5D deterministic RNG and physical-start-swap tests PASS (pure modules; NOT production battle tests).`);
