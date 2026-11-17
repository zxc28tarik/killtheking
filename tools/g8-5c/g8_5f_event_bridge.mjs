/**
 * G8.5F passive event bridge. It attaches only to an explicitly supplied
 * engine.subscribe(topic, callback) interface and never calls game-mutating APIs.
 * The game must emit actual, authoritative events after real spawns / decisions.
 * No monkey patches; no Math.random overrides; no automatic "production" claim.
 *
 * Event protocol:
 *  battle:ready    { battleId, meta, rosters } after soldiers physically spawn
 *  battle:frame    { battleId, frameMs, stuckSoldiers? }
 *  army:decision   { battleId, tick, kind, actorId, payload }
 *  battle:result   { battleId, outcome }
 *  battle:aborted  { battleId, reason? }
 */
import {createPassiveBattleAdapter} from './g8_5e_passive_battle_adapter.mjs';

const TOPICS=Object.freeze(['battle:ready','battle:frame','army:decision','battle:result','battle:aborted']);
const id=v=> typeof v==='string'&&v.trim().length>0&&v.length<=256;
const clone=v=>JSON.parse(JSON.stringify(v));

export function attachPassiveBattleTelemetry(engine,{onResult=()=>{},onError=()=>{},maxCaptured=5,recorderOptions={}}={}) {
  if(!engine||typeof engine.subscribe!=='function')throw new TypeError('An explicit event subscription API is required');
  if(typeof onResult!=='function'||typeof onError!=='function')throw new TypeError('Callbacks must be functions');
  if(!Number.isInteger(maxCaptured)||maxCaptured<1||maxCaptured>500)throw new RangeError('maxCaptured must be 1..500');
  let closed=false,active=null,completed=[],errors=[],received=Object.create(null);
  const unsubs=[];
  const captureError=(err,topic)=>{
    const message=err instanceof Error?err.message:String(err);
    errors.push({topic,message});if(errors.length>100)errors.shift();
    try{onError({topic,message})}catch{} // never throw into the game loop
  };
  const abortActive=()=>{
    if(active){
      try{active.observer.abort()}catch{}
      active=null;
    }
  };
  const handle=(topic,data)=>{
    if(closed)return;
    received[topic]=(received[topic]??0)+1;
    try {
      if(!data||typeof data!=='object'||!id(data.battleId))throw new TypeError('Event requires battleId');
      if(topic==='battle:ready') {
        if(active)throw new Error('Cannot open new battle while previous battle remains active');
        if(!data.meta||typeof data.meta!=='object')throw new TypeError('Missing authoritative meta');
        const observer=createPassiveBattleAdapter(data.meta,recorderOptions);
        try{observer.captureInitialRosters(data.rosters)}catch(e){observer.abort();throw e}
        active={battleId:data.battleId,observer};return;
      }
      if(!active || active.battleId!==data.battleId)throw new Error('Event has no matching active battle: '+data.battleId);
      if(topic==='battle:frame') {
        active.observer.recordFrameMs(data.frameMs);
        if(data.stuckSoldiers!==undefined)active.observer.recordStuckSoldiers(data.stuckSoldiers);
      } else if(topic==='army:decision') {
        active.observer.recordDecision({tick:data.tick,kind:data.kind,actorId:data.actorId,payload:data.payload??null});
      } else if(topic==='battle:result') {
        // The authoritative game supplies outcome; this observer never computes wins.
        const finished=active.observer.finishMatch(data.outcome);
        const item={battleId:data.battleId, ...finished};
        completed.push(item);if(completed.length>maxCaptured)completed.shift();
        active=null;
        try{onResult(clone(item))}catch(e){captureError(e,'onResult')}
      } else if(topic==='battle:aborted') abortActive();
    }catch(err) {
      captureError(err,topic);
      // Once an input is invalid, this battle's trace cannot be certified complete.
      abortActive();
    }
  };
  try {
    for(const topic of TOPICS) {
      const unsubscribe=engine.subscribe(topic, data=>handle(topic,data));
      if(typeof unsubscribe!=='function')throw new TypeError('subscribe must return an unsubscribe callback for '+topic);
      unsubs.push(unsubscribe);
    }
  } catch(err) {
    for(const fn of unsubs.reverse())try{fn()}catch{}
    throw err;
  }
  return Object.freeze({
    stop() {
      if(closed)return;
      closed=true;abortActive();
      for(const unsubscribe of unsubs.reverse())try{unsubscribe()}catch(e){captureError(e,'unsubscribe')}
    },
    getSnapshot() {return {closed,activeBattleId:active?.battleId??null,completed:clone(completed),
      received:{...received},errors:clone(errors),
      disclaimer:'Untrusted game-emitted events: trace completeness and source provenance still need external verification'}},
  });
}
