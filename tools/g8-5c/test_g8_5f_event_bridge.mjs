import assert from 'node:assert/strict';
import {attachPassiveBattleTelemetry} from './g8_5f_event_bridge.mjs';

const tests=[];const test=(name,fn)=>tests.push({name,fn});
const rosters=()=>{
  const types=[['musket',10],['pike',25],['bow',15],['sword',20]];
  const team=(name,shift)=>types.flatMap(([type,n])=>Array.from({length:n},(_,i)=>({
    id:name+'-'+type+'-'+i,team:name,type,x:shift+i*.2,z:(i%7)*3, y:0, facing:0,
    hp:100,behavior:'preserved'})));
  return {blue:team('blue',-80),red:team('red',80)};
};
const meta=(id='v1')=>({scenario:'classic',armySize:140,seed:101,mirrorSeed:'M-101',sideSwap:'original',engineBuild:id,source:'external_unverified'});
const outcome=()=>({winner:'blue',blueScore:60,redScore:49,elapsedSeconds:240,durationSeconds:240,objectiveSwitches:3});
class Bus {
  constructor(){this.map=new Map();this.unsubCount=0;this.subCount=0}
  subscribe(topic,cb){this.subCount++;this.map.set(topic,cb);return ()=>{this.unsubCount++;this.map.delete(topic)}}
  emit(topic,data){const fn=this.map.get(topic);return fn?.(data)}
}
const start=(bus,id='A')=>bus.emit('battle:ready',{battleId:id,meta:meta(),rosters:rosters()});
const send=(bus,id='A')=>{
  bus.emit('battle:frame',{battleId:id,frameMs:16.67,stuckSoldiers:0});
  bus.emit('army:decision',{battleId:id,tick:1,kind:'order',actorId:'blue-sword-1',payload:{order:'charge'}});
};
const end=(bus,id='A')=>bus.emit('battle:result',{battleId:id,outcome:outcome()});

test('fails on missing engine',()=>assert.throws(()=>attachPassiveBattleTelemetry(null),/subscription/));
test('requires subscribe function',()=>assert.throws(()=>attachPassiveBattleTelemetry({}),/subscription/));
test('requires callback types',()=>assert.throws(()=>attachPassiveBattleTelemetry(new Bus(),{onError:1}),/Callbacks/));
test('requires positive capture cap',()=>assert.throws(()=>attachPassiveBattleTelemetry(new Bus(),{maxCaptured:0}),/maxCaptured/));
test('subscribes exactly five topics',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);assert.equal(bus.subCount,5);a.stop()});
test('captures real caller-provided record',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);send(bus);end(bus);const rows=a.getSnapshot().completed;assert.equal(rows.length,1);assert.equal(rows[0].record.winner,'blue');assert.equal(rows[0].decisionTrace.count,1);a.stop()});
test('captured layout contains 140 soldiers',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);end(bus);const r=a.getSnapshot().completed[0].record;assert.equal(r.startLayout.blue.length+r.startLayout.red.length,140);a.stop()});
test('never invents production provenance',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);end(bus);assert.equal(a.getSnapshot().completed[0].record.source,'external_unverified');a.stop()});
test('does not alter supplied rosters',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);const rs=rosters(),before=structuredClone(rs);bus.emit('battle:ready',{battleId:'A',meta:meta(),rosters:rs});assert.deepEqual(rs,before);a.stop()});
test('collects optional stuck soldiers',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);bus.emit('battle:frame',{battleId:'A',frameMs:18,stuckSoldiers:4});end(bus);assert.equal(a.getSnapshot().completed[0].record.stuckSoldiers,4);a.stop()});
test('onResult receives captured record',()=>{const bus=new Bus();let value=null;const a=attachPassiveBattleTelemetry(bus,{onResult:r=>value=r});start(bus);end(bus);assert.equal(value.battleId,'A');a.stop()});
test('mismatched battleId aborts and records error',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);bus.emit('battle:frame',{battleId:'B',frameMs:16});assert.equal(a.getSnapshot().activeBattleId,null);assert.equal(a.getSnapshot().errors.length,1);a.stop()});
test('record without start fails safely',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);bus.emit('battle:frame',{battleId:'A',frameMs:16});assert.equal(a.getSnapshot().completed.length,0);assert.equal(a.getSnapshot().errors.length,1);a.stop()});
test('invalid roster fails without completed result',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);bus.emit('battle:ready',{battleId:'A',meta:meta(),rosters:{blue:[],red:[]}});assert.equal(a.getSnapshot().activeBattleId,null);a.stop()});
test('two ready events abort old battle',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);start(bus,'B');assert.equal(a.getSnapshot().completed.length,0);assert.equal(a.getSnapshot().activeBattleId,null);a.stop()});
test('bad frame aborts but never throws into bus',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);assert.doesNotThrow(()=>bus.emit('battle:frame',{battleId:'A',frameMs:-1}));assert.equal(a.getSnapshot().activeBattleId,null);a.stop()});
test('unknown decision event aborts',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);bus.emit('army:decision',{battleId:'A',tick:0,kind:'fabricated',actorId:'x',payload:{}});assert.equal(a.getSnapshot().errors.length,1);a.stop()});
test('invalid result rejects and aborts',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);bus.emit('battle:result',{battleId:'A',outcome:{winner:'blue'}});assert.equal(a.getSnapshot().completed.length,0);a.stop()});
test('aborted battle never yields result',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);bus.emit('battle:aborted',{battleId:'A'});assert.equal(a.getSnapshot().completed.length,0);a.stop()});
test('supports multiple completed battles',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);end(bus);start(bus,'B');end(bus,'B');assert.equal(a.getSnapshot().completed.length,2);a.stop()});
test('caps completed record history',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus,{maxCaptured:1});start(bus);end(bus);start(bus,'B');end(bus,'B');assert.deepEqual(a.getSnapshot().completed.map(x=>x.battleId),['B']);a.stop()});
test('snapshots are defensive copies',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);end(bus);const snap=a.getSnapshot();snap.completed[0].record.winner='red';assert.equal(a.getSnapshot().completed[0].record.winner,'blue');a.stop()});
test('onResult throwing never crashes the game',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus,{onResult:()=>{throw Error('UI render failed')}});start(bus);assert.doesNotThrow(()=>end(bus));assert.equal(a.getSnapshot().errors[0].topic,'onResult');a.stop()});
test('onError throwing never crashes game',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus,{onError:()=>{throw Error('logger broken')}});assert.doesNotThrow(()=>bus.emit('battle:frame',{battleId:'A',frameMs:-1}));a.stop()});
test('stop unsubscribes all and closes active recorder',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);start(bus);a.stop();assert.equal(bus.unsubCount,5);assert.equal(a.getSnapshot().activeBattleId,null);assert(a.getSnapshot().closed)});
test('stop is idempotent',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);a.stop();a.stop();assert.equal(bus.unsubCount,5)});
test('events after stop ignored',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);a.stop();start(bus);assert.equal(a.getSnapshot().completed.length,0)});
test('partial subscription failure unwinds',()=>{const bus=new Bus();const real=bus.subscribe.bind(bus);bus.subscribe=(topic,cb)=>topic==='army:decision'?null:real(topic,cb);assert.throws(()=>attachPassiveBattleTelemetry(bus),/unsubscribe callback/);assert.equal(bus.map.size,0);});
test('missing battle id causes error and no crash',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);assert.doesNotThrow(()=>bus.emit('battle:ready',{meta:meta(),rosters:rosters()}));assert.equal(a.getSnapshot().errors.length,1);a.stop()});
test('emitter state is not changed by observer',()=>{const bus=new Bus();const a=attachPassiveBattleTelemetry(bus);const rs=rosters();bus.emit('battle:ready',{battleId:'A',meta:meta(),rosters:rs});send(bus);end(bus);assert(rs.blue.every(x=>x.hp===100));a.stop()});
let passed=0;
for(const {name,fn} of tests){try{await fn();passed++}catch(e){console.error('FAIL',name,e);process.exitCode=1}}
console.log(`${passed}/${tests.length} G8.5F passive event bridge tests PASS (fake event emitter, NOT actual game engine).`);
