import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const map=require('./siege-map.js');
const rules=require('./siege-objectives.js');
const phys=require('./siege-traversal.js');
const spec=map.spec;
const S=()=>rules.createScenario();
const gate=s=>{for(let i=0;i<4;i++)
  rules.applyEvent(s,{type:'GATE_HIT',team:'red',weapon:'ram',damage:150});};
const ladder=(s,side)=>{for(let i=0;i<4;i++)
  rules.applyEvent(s,{type:'LADDER_BUILD',team:'red',lane:side,effort:25});};

test('S2 uses actual S1 castle collision geometry, not synthesized test boxes',()=>{
 const s=S(),world=phys.activeColliders(spec,s);
 assert(world.length>=14);
 assert.equal(world.some(b=>b.id==='gate-main'),true);
 assert.equal(world.find(b=>b.id==='gate-main'),
   spec.boxes.find(b=>b.id==='gate-main'));
 assert.equal(world.some(b=>b.id==='west-wall'),true);
 assert.equal(map.validate().ok,true);
});

test('near closed gate, true swept 280m/s player cannot tunnel from front',()=>{
 const s=S(),from={x:0,y:0,z:-49};
 const p=phys.move(from,{x:0,z:280},.25,spec,s);
 assert.equal(p.blockedZ,true);
 assert(p.z>from.z+4,'Player should move until gate collision');
 assert(p.z<=-42.5-phys.RADIUS+0.0001,'Player crossed gate front face');
 assert.equal(phys.overlaps(p,spec,s),false);
});

test('destroying gate removes EXACTLY the gate collider, and physical crossing works',()=>{
 const s=S(),before=phys.activeColliders(spec,s);
 gate(s);
 const after=phys.activeColliders(spec,s);
 assert.equal(before.length-after.length,1);
 assert(!after.some(b=>b.id==='gate-main'));
 const p=phys.move({x:0,y:0,z:-49},{x:0,z:70},.25,spec,s);
 assert(p.z>-42.5,'Player should cross open gate');
 assert.equal(phys.overlaps(p,spec,s),false);
});

test('approaching solid stone wall never permits crossing even when gate is open',()=>{
 const s=S();gate(s);
 const p=phys.move({x:-60,y:0,z:-8},{x:280,z:0},.25,spec,s);
 assert.equal(p.blockedX,true);
 assert(p.x<=-54.5-phys.RADIUS+.0001);
 assert.equal(phys.overlaps(p,spec,s),false);
});

test('a high speed diagonal move slides along wall instead of phasing through',()=>{
 const s=S(),from={x:-59,y:0,z:-21};
 const p=phys.move(from,{x:140,z:140},.25,spec,s);
 assert.equal(p.blockedX,true);
 assert.equal(phys.overlaps(p,spec,s),false);
 assert(p.x<=-54.5-phys.RADIUS+.0002);
 assert(p.z>from.z,'Expected slide along the west castle wall');
});

test('closed gate and both unbuilt ladders make keep inaccessible from outside',()=>{
 const s=S();
 assert.equal(phys.route('outer','keep',spec,s),null);
 assert.equal(phys.route('outer','court',spec,s),null);
 assert.equal(phys.route('court','keep',spec,s)?.at(-1).id,'keep');
});

test('destroyed gate unlocks only gate corridor in objective route graph',()=>{
 const s=S();gate(s);
 const r=phys.route('outer','keep',spec,s).map(p=>p.id);
 assert.deepEqual(r,['outer','front','gateIn','court','keep']);
 assert.equal(s.lanes.west,false);
 assert.equal(s.lanes.east,false);
});

test('west ladder enables an alternative outside-to-courtyard route with gate intact',()=>{
 const s=S();ladder(s,'west');
 const r=phys.route('outer','keep',spec,s).map(p=>p.id);
 assert.deepEqual(r,['outer','westOuter','westInside','court','keep']);
 assert.equal(s.gate.hp,600);
});

test('east ladder enables a third independent outside-to-courtyard route',()=>{
 const s=S();ladder(s,'east');
 const r=phys.route('outer','keep',spec,s).map(p=>p.id);
 assert.deepEqual(r,['outer','eastOuter','eastInside','court','keep']);
});

test('cannot climb an unbuilt ladder or from across the castle',()=>{
 const s=S();
 assert.equal(phys.beginClimb({x:-59,y:0,z:-9},'west',spec,s),null);
 ladder(s,'west');
 assert.equal(phys.beginClimb({x:-59,y:0,z:-80},'west',spec,s),null);
 assert.equal(phys.beginClimb({x:-59,y:12,z:-9},'west',spec,s),null);
 assert.equal(phys.beginClimb({x:59,y:0,z:-9},'east',spec,s),null);
});

test('built west ladder crosses original west-wall TOP without intersecting solid stone',()=>{
 const s=S();ladder(s,'west');
 const start={x:-59,y:0,z:-9};
 const c=phys.beginClimb(start,'west',spec,s);
 assert(c&&c.side==='west');
 let maxY=0,steps=0;
 while(!c.done&&steps<120){
   const next=phys.stepClimb(c,.05,spec,s);
   maxY=Math.max(maxY,next.position.y);
   assert.equal(phys.overlaps(next.position,spec,s),false);
   steps++;
 }
 assert.equal(c.done,true);
 assert(maxY>13,'Need physically traverse ABOVE original 13m-high wall');
 assert(c.position.x>-49.5+phys.RADIUS);
 assert.equal(c.position.y,0);
 assert.equal(c.position.z,-9);
 assert(steps>10);
});

test('east ladder climbs through mirror route and ends inside the courtyard',()=>{
 const s=S();ladder(s,'east');
 const c=phys.beginClimb({x:59,y:0,z:-9},'east',spec,s);
 for(let i=0;i<120&&!c.done;i++){
   const next=phys.stepClimb(c,.05,spec,s);
   assert.equal(phys.overlaps(next.position,spec,s),false);
 }
 assert.equal(c.done,true);
 assert(c.position.x<49.5-phys.RADIUS);
 assert.equal(c.position.y,0);
});

test('a partially built ladder does not permit a hidden climb',()=>{
 const s=S();
 rules.applyEvent(s,{type:'LADDER_BUILD',team:'red',
   lane:'west',effort:25});
 assert.equal(phys.beginClimb({x:-59,y:0,z:-9},'west',spec,s),null);
 assert.equal(phys.route('outer','keep',spec,s),null);
});

test('teams spawn at genuine safe commander points for player exploration',()=>{
 const s=S();
 for(const team of ['red','blue']){
   const [x,z]=spec.spawns[team].commander;
   const p=phys.spawn({x,y:0,z},spec,s);
   assert.equal(phys.overlaps(p,spec,s),false);
 }
 assert.throws(()=>phys.spawn({x:0,y:0,z:-40},spec,s),
   /Unsafe siege player spawn/);
});

test('solid gate still blocks walking when a side ladder has opened',()=>{
 const s=S();ladder(s,'west');
 const p=phys.move({x:0,y:0,z:-49},{x:0,z:120},.25,spec,s);
 assert.equal(p.blockedZ,true);
 assert(p.z<=-43.35+.0001);
});

test('high-altitude traversal above wall is legal, but ground-level tunneling is not',()=>{
 const s=S();ladder(s,'west');
 assert.equal(phys.overlaps({x:-52,y:0,z:-9},spec,s),true);
 assert.equal(phys.overlaps({x:-52,y:15.2,z:-9},spec,s),false);
 const p=phys.move({x:-59,y:15.2,z:-9},{x:200,z:0},.12,spec,s);
 assert(p.x>-49);
 assert.equal(phys.overlaps(p,spec,s),false);
});

test('invalid physics inputs, bad routes, missing state and forced closed climbs fail',()=>{
 const s=S();ladder(s,'west');
 for(const dt of [NaN,Infinity,-.1,.3]){
   assert.throws(()=>phys.move({x:0,y:0,z:0},{x:1,z:0},dt,spec,s));
 }
 assert.throws(()=>phys.move({x:NaN,y:0,z:0},{x:0,z:0},.05,spec,s));
 assert.throws(()=>phys.route('teleport','keep',spec,s),/Unknown/);
 assert.throws(()=>phys.overlaps({x:NaN,y:0,z:0},spec,s),/Invalid/);
 const c=phys.beginClimb({x:-59,y:0,z:-9},'west',spec,s);
 const close={...rules.snapshot(s),lanes:{...s.lanes,west:false}};
 assert.throws(()=>phys.stepClimb(c,.05,spec,close),/closed/);
});

test('no cross-import of historic arena, G5.4 or weapons; no combat authority',()=>{
 assert.equal(typeof phys.move,'function');
 assert.equal(typeof phys.route,'function');
 assert.equal(typeof phys.beginClimb,'function');
 assert.equal(Object.keys(phys).includes('damageSoldier'),false);
 assert.equal(Object.keys(phys).includes('attackGate'),false);
});
