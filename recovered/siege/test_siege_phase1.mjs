import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const map=require('./siege-map.js');
const e=require('./siege-objectives.js');
const S=()=>e.createScenario();
const tick=(s,seconds)=>{for(let n=0;n<Math.round(seconds*4);n++)e.step(s,.25);return s;};
const gate=s=>{for(let i=0;i<4;i++)e.applyEvent(s,{
 type:'GATE_HIT',team:'red',weapon:'ram',damage:150});};
const ladder=(s,lane='west')=>{
 for(let i=0;i<4;i++)e.applyEvent(s,{
  type:'LADDER_BUILD',team:'red',lane,effort:25});
};
const advanceToKeep=s=>{
 gate(s);
 e.applyEvent(s,{type:'ZONE_PRESENCE',zone:'courtyard',red:2,blue:0});
 tick(s,12);
 assert.equal(s.phase,'KEEP');
};

test('a single castle has finite geometries and three independent breach routes',()=>{
 assert.equal(map.validate().ok,true,map.validate().errors.join('; '));
 assert.equal(map.spec.version,'SIEGE_CASTLE_S1');
 assert.equal(map.spec.boxes.filter(b=>b.id==='gate-main').length,1);
 assert.equal(map.spec.boxes.find(b=>b.id==='gate-main').destructible,true);
 assert.deepEqual(Object.keys(map.spec.lanes).sort(),['east','gate','west']);
 assert.deepEqual(map.spec.objectiveOrder,['entry','courtyard','keep']);
 assert.deepEqual(map.spec.teams,{red:'attacker',blue:'defender'});
 assert.equal(map.spec.bounds.minZ<map.spec.castle.minZ,true);
});

test('soldier classes remain G5.4 10 musket,25 pike,15 bow,20 sword per side',()=>{
 assert.deepEqual(map.spec.composition,{sword:20,pike:25,archer:15,musket:10});
 assert.equal(Object.values(map.spec.composition).reduce((a,b)=>a+b,0),70);
 assert.deepEqual(Object.keys(map.spec.spawns).sort(),['blue','red']);
 for(const team of Object.keys(map.spec.spawns))
   assert.deepEqual(Object.keys(map.spec.spawns[team]).sort(),
     ['archer','commander','musket','pike','sword']);
});

test('main gate takes genuine bounded event damage; open gate alone does not win',()=>{
 const s=S();
 assert.equal(s.gate.hp,600);
 e.applyEvent(s,{type:'GATE_HIT',team:'red',weapon:'ram',damage:150});
 assert.equal(s.gate.hp,450);assert.equal(s.phase,'APPROACH');
 for(let i=0;i<3;i++)e.applyEvent(s,{type:'GATE_HIT',team:'red',
   weapon:'ram',damage:150});
 assert.equal(s.gate.hp,0);
 assert.equal(s.gate.open,true);
 assert.equal(s.lanes.gate,true);
 assert.equal(s.lanes.west,false);
 assert.equal(s.phase,'BREACH');
 assert.equal(s.winner,null);
 tick(s,10);
 assert.equal(s.phase,'BREACH');
 assert.equal(s.winner,null);
});

test('left ladder breaches while gate remains solid; no phantom lane opens',()=>{
 const s=S();ladder(s);
 assert.equal(s.gate.hp,600);
 assert.equal(s.phase,'BREACH');
 assert.deepEqual(s.lanes,{gate:false,west:true,east:false});
 assert.equal(s.winner,null);
});

test('right ladder is an independent alternative breach route',()=>{
 const s=S();ladder(s,'east');
 assert.deepEqual(s.lanes,{gate:false,west:false,east:true});
});

test('ladder progress alone does not breach before required progress',()=>{
 const s=S();
 for(let i=0;i<3;i++)e.applyEvent(s,{type:'LADDER_BUILD',
   team:'red',lane:'west',effort:25});
 assert.equal(s.ladders.west.progress,75);
 assert.equal(s.phase,'APPROACH');
 assert.equal(s.lanes.west,false);
});

test('no courtyard capture is allowed until a valid gate or ladder breach',()=>{
 const s=S();
 e.applyEvent(s,{type:'ZONE_PRESENCE',zone:'courtyard',red:8,blue:0});
 tick(s,14);
 assert.equal(s.phase,'APPROACH');
 assert.equal(s.capture.courtyard,0);
});

test('after entry, holding an empty courtyard unlocks the inner keep',()=>{
 const s=S();ladder(s,'east');
 e.applyEvent(s,{type:'ZONE_PRESENCE',zone:'courtyard',red:5,blue:0});
 tick(s,6);
 assert.equal(s.phase,'COURTYARD');
 assert.equal(s.capture.courtyard,6);
 tick(s,6);
 assert.equal(s.phase,'KEEP');
 assert.equal(s.capture.courtyard,12);
 assert.equal(s.winner,null);
});

test('defending a contested courtyard pauses and resets capture progress',()=>{
 const s=S();gate(s);
 e.applyEvent(s,{type:'ZONE_PRESENCE',zone:'courtyard',red:6,blue:4});
 tick(s,3);
 assert.equal(s.phase,'BREACH');
 assert.equal(s.capture.courtyard,0);
 e.applyEvent(s,{type:'ZONE_PRESENCE',zone:'courtyard',red:6,blue:0});
 tick(s,4);
 assert.equal(s.phase,'COURTYARD');
 assert.equal(s.capture.courtyard,4);
 e.applyEvent(s,{type:'ZONE_PRESENCE',zone:'courtyard',red:6,blue:1});
 tick(s,.25);
 assert.equal(s.phase,'BREACH');
 assert.equal(s.capture.courtyard,0);
});

test('a keep cannot be taken without securing courtyard first',()=>{
 const s=S();gate(s);
 e.applyEvent(s,{type:'ZONE_PRESENCE',zone:'keep',red:10,blue:0});
 tick(s,30);
 assert.equal(s.phase,'BREACH');
 assert.equal(s.capture.keep,0);
 assert.equal(s.winner,null);
});

test('successful red victory requires both courtyard and keep control',()=>{
 const s=S();advanceToKeep(s);
 e.applyEvent(s,{type:'ZONE_PRESENCE',zone:'keep',red:3,blue:0});
 tick(s,20);
 assert.equal(s.phase,'RESULT');
 assert.equal(s.winner,'red');
 assert.equal(s.resultReason,'ATTACKER_KEEP_CAPTURED');
 const result=e.snapshot(s);
 assert.equal(result.capture.keep,20);
 assert.equal(result.events.at(-1).type,'MATCH_FINISH');
});

test('defender can contest inner keep; control timer is reset',()=>{
 const s=S();advanceToKeep(s);
 e.applyEvent(s,{type:'ZONE_PRESENCE',zone:'keep',red:5,blue:0});
 tick(s,5);
 assert.equal(s.capture.keep,5);
 e.applyEvent(s,{type:'ZONE_PRESENCE',zone:'keep',red:5,blue:1});
 tick(s,.25);
 assert.equal(s.capture.keep,0);
 assert.equal(s.phase,'KEEP');
 assert.equal(s.winner,null);
});

test('defending until the clock expires wins even if gate breached',()=>{
 const s=e.createScenario({durationSeconds:3});
 gate(s);
 tick(s,3);
 assert.equal(s.phase,'RESULT');
 assert.equal(s.winner,'blue');
 assert.equal(s.remaining,0);
 assert.equal(s.resultReason,'DEFENDER_HELD_TO_TIMEOUT');
});

test('if attacking force is eliminated, blue wins without waiting',()=>{
 const s=S();gate(s);
 e.applyEvent(s,{type:'FORCE_COUNTS',red:0,blue:1});
 assert.equal(s.winner,'blue');
 assert.equal(s.resultReason,'DEFENDER_ELIMINATED_ATTACKERS');
 assert.equal(s.phase,'RESULT');
});

test('no unit counts can grow through unauthorized reinforcements',()=>{
 const s=S();
 e.applyEvent(s,{type:'FORCE_COUNTS',red:55,blue:50});
 assert.throws(()=>e.applyEvent(s,{type:'FORCE_COUNTS',red:70,blue:50}),
   /cannot increase/);
 assert.deepEqual(s.forces,{red:55,blue:50});
});

test('capture positions cannot contain more units than are alive',()=>{
 const s=S();
 e.applyEvent(s,{type:'FORCE_COUNTS',red:4,blue:10});
 assert.throws(()=>e.applyEvent(s,{type:'ZONE_PRESENCE',
   zone:'keep',red:5,blue:1}),/Invalid zone red/);
 assert.deepEqual(s.occupancy.keep,{red:0,blue:0});
});

test('blue never takes attacker-only gate damage or builds ladders',()=>{
 const s=S();
 assert.throws(()=>e.applyEvent(s,{type:'GATE_HIT',
   team:'blue',weapon:'ram',damage:1}),/Only attacker/);
 assert.throws(()=>e.applyEvent(s,{type:'LADDER_BUILD',
   team:'blue',lane:'west',effort:5}),/Only attacker/);
 assert.equal(s.gate.hp,600);
 assert.equal(s.ladders.west.progress,0);
});

test('invalid event types, weapons, excessive damage, lane, zone, dt, NaN fail closed',()=>{
 const s=S();
 for(const ev of [
   {type:'VICTORY_NOW'},
   {type:'GATE_HIT',team:'red',weapon:'nuke',damage:1},
   {type:'GATE_HIT',team:'red',weapon:'ram',damage:Infinity},
   {type:'GATE_HIT',team:'red',weapon:'ram',damage:151},
   {type:'LADDER_BUILD',team:'red',lane:'north',effort:5},
   {type:'LADDER_BUILD',team:'red',lane:'west',effort:NaN},
   {type:'ZONE_PRESENCE',zone:'none',red:1,blue:0},
   {type:'ZONE_PRESENCE',zone:'keep',red:-1,blue:0},
   {type:'FORCE_COUNTS',red:71,blue:0},
 ]){
   assert.throws(()=>e.applyEvent(s,ev));
 }
 for(const dt of [-.1,NaN,Infinity,.26])assert.throws(()=>e.step(s,dt));
 assert.equal(s.phase,'APPROACH');
 assert.equal(s.gate.hp,600);
});

test('finished match refuses forged later events or time travel',()=>{
 const s=e.createScenario({durationSeconds:1});
 tick(s,1);
 assert.throws(()=>e.applyEvent(s,{type:'GATE_HIT',
   team:'red',weapon:'ram',damage:150}),/already ended/);
 assert.throws(()=>e.step(s,.05),/already ended/);
});

test('snapshot is a defensive, serializable copy and event log stays bounded',()=>{
 const s=S();
 const copy=e.snapshot(s);
 copy.gate.hp=0;copy.occupancy.courtyard.red=60;
 assert.equal(s.gate.hp,600);
 assert.equal(s.occupancy.courtyard.red,0);
 for(let i=0;i<250;i++)e.applyEvent(s,{type:'ZONE_PRESENCE',
   zone:'courtyard',red:0,blue:1});
 assert.equal(s.events.length,180);
 assert.equal(e.snapshot(s).events.length,35);
 assert.doesNotThrow(()=>JSON.stringify(e.snapshot(s)));
});

test('siege source cannot import or mutate production arena/G5.4 modules',()=>{
 const src=readFileSync(new URL('./siege-objectives.js',import.meta.url),'utf8')+
   readFileSync(new URL('./siege-map.js',import.meta.url),'utf8');
 for(const forbidden of ['ArenaArmyBattle.step','ArenaWeaponBalance.SHOT_INTERVAL',
   'patchFfaAggro','window.eval(', 'G8_4_Ikmal_Hatti_Savas_Raporu_Oyna'])
   assert.equal(src.includes(forbidden),false,'Unsafe cross-game import: '+forbidden);
 assert.equal(e.config.gateHp,600);
 assert.equal(e.PHASES.length,5);
});
