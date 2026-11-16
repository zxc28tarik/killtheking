/**
 * Kill the King G8.5E — deterministic decision trace for production-match auditing.
 * Passive: records supplied events only; never changes AI, combat, or randomness.
 * An exact trace match is not proof that a particular playable game ran.
 */
const KINDS = new Set(['order', 'target', 'attack', 'damage', 'death', 'objective', 'supply', 'result', 'rng']);
const MAX_NEST = 8;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const enc = new TextEncoder();
function validateString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(field + ' must be nonempty text');
  if (value.length > 256) throw new RangeError(field + ' too long');
  return value;
}
function uint(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(field + ' must be nonnegative safe integer');
  return value;
}
function normalized(v, depth = 0, seen = new Set()) {
  if (depth > MAX_NEST) throw new RangeError('Trace payload is too deep');
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new TypeError('Trace payload contains nonfinite number');
    return Object.is(v, -0) ? 0 : v;
  }
  if (!v || typeof v !== 'object') throw new TypeError('Trace payload must be JSON-safe');
  if (seen.has(v)) throw new TypeError('Trace payload is cyclic');
  if (Array.isArray(v)) {
    seen.add(v); const out = v.map(x => normalized(x, depth + 1, seen)); seen.delete(v); return out;
  }
  const proto = Object.getPrototypeOf(v);
  if (proto !== Object.prototype && proto !== null) throw new TypeError('Trace payload needs plain objects');
  const keys = Object.keys(v).sort();
  if (keys.some(k => BAD_KEYS.has(k))) throw new TypeError('Unsafe key in trace payload');
  seen.add(v);
  const out = Object.create(null);
  for (const key of keys) out[key] = normalized(v[key], depth + 1, seen);
  seen.delete(v);
  return out;
}
export function canonicalEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new TypeError('Event object required');
  const tick = uint(event.tick, 'event.tick');
  if (!KINDS.has(event.kind)) throw new TypeError('Unknown trace event kind');
  const actorId = validateString(String(event.actorId ?? ''), 'event.actorId');
  const payload = normalized(event.payload ?? null);
  return JSON.stringify({tick, kind: event.kind, actorId, payload});
}
function hashEvents(strings) {
  // FNV-1a-32, explicitly NON-CRYPTOGRAPHIC. Full-event comparison is required.
  let hash = 2166136261 >>> 0;
  for (const s of strings) {
    const bytes = enc.encode(s + '\n');
    for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
function checkMeta(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new TypeError('Trace metadata object required');
  if (!['classic', 'control_points', 'supply_line'].includes(meta.scenario)) throw new TypeError('Unknown battle scenario');
  if (![140, 200, 280].includes(meta.armySize)) throw new TypeError('Unknown army size');
  uint(meta.seed, 'meta.seed');
  if (meta.seed > 0xffffffff) throw new RangeError('meta.seed must be uint32');
  if (!['original', 'swapped'].includes(meta.sideSwap)) throw new TypeError('Unknown sideSwap');
  validateString(meta.engineBuild, 'meta.engineBuild');
  const mirrorSeed = meta.mirrorSeed ?? null;
  if(mirrorSeed !== null && !((typeof mirrorSeed === 'string' && mirrorSeed.trim()) || (Number.isSafeInteger(mirrorSeed) && mirrorSeed >= 0))) throw new TypeError('Invalid mirrorSeed');
  return Object.freeze({scenario: meta.scenario, armySize: meta.armySize,
    seed: meta.seed, mirrorSeed,
    sideSwap: meta.sideSwap, engineBuild: meta.engineBuild});
}
export function createDecisionTrace(meta, {maxEvents=50000, maxEventBytes=8192}={}) {
  const m = checkMeta(meta);
  uint(maxEvents, 'maxEvents'); uint(maxEventBytes, 'maxEventBytes');
  if (maxEvents < 1 || maxEvents > 100000 || maxEventBytes < 64 || maxEventBytes > 65536) throw new RangeError('Trace limits exceeded');
  const events=[]; let lastTick=-1; let closed=false;
  return Object.freeze({
    record(event) {
      if (closed) throw new Error('Decision trace already finished');
      const serialized=canonicalEvent(event);
      const t=event.tick;
      if (t < lastTick) throw new Error('Trace ticks must be nondecreasing');
      if (enc.encode(serialized).length > maxEventBytes) throw new RangeError('Event exceeds byte limit');
      if (events.length >= maxEvents) throw new RangeError('Decision trace full; incomplete trace must never silently pass');
      events.push(serialized); lastTick=t;
      return events.length;
    },
    finish() {
      if (closed) throw new Error('Decision trace already finished');
      closed=true;
      return {format:'KTK_G8_5E_TRACE_V1',meta:{...m},count:events.length,
        digest:hashEvents(events),events:events.map(s=>JSON.parse(s))};
    },
    getDiagnostics() {return {closed,eventCount:events.length,lastTick,maxEvents};}
  });
}
function validateTrace(trace) {
  if (trace?.format !== 'KTK_G8_5E_TRACE_V1') throw new TypeError('Unknown trace format');
  const meta=checkMeta(trace.meta);
  if (!Array.isArray(trace.events) || trace.count !== trace.events.length) throw new TypeError('Malformed trace length');
  const lines=trace.events.map(canonicalEvent);
  for (let i=1;i<trace.events.length;i++) if (trace.events[i].tick < trace.events[i-1].tick) throw new Error('Trace tick order invalid');
  if (hashEvents(lines) !== trace.digest) throw new Error('Trace digest mismatch (corrupt or edited input)');
  return {meta,lines};
}
/** Compare same-side same-seed replays. Do NOT directly compare original against swapped. */
export function compareDecisionTraces(a, b) {
  const x=validateTrace(a), y=validateTrace(b);
  for(const k of ['scenario','armySize','seed','mirrorSeed','sideSwap','engineBuild']) {
    if (x.meta[k] !== y.meta[k]) return {status:'metadata_mismatch',field:k,expected:x.meta[k],observed:y.meta[k]};
  }
  const length=Math.max(x.lines.length,y.lines.length);
  for(let i=0;i<length;i++) {
    if (x.lines[i] !== y.lines[i]) return {status:'diverged',index:i,
      expected:a.events[i]??null,observed:b.events[i]??null,
      reason:i>=x.lines.length?'extra event':i>=y.lines.length?'missing event':'changed event'};
  }
  return {status:'identical_trace',eventCount:x.lines.length,digest:a.digest,
    warning:'Exact trace match is not independently authenticated production evidence'};
}
/** Each group needs two independent recorded replays of the SAME scenario/seed/side. */
export function auditRepeatedRuns(traces, {requiredRepeats=2}={}) {
  if (!Array.isArray(traces)) throw new TypeError('Array of trace artifacts required');
  if (!Number.isSafeInteger(requiredRepeats) || requiredRepeats < 2) throw new TypeError('requiredRepeats must be >=2');
  const groups = new Map();
  for(const trace of traces) {
    const {meta}=validateTrace(trace);
    const key=JSON.stringify([meta.scenario,meta.armySize,meta.seed,meta.mirrorSeed,meta.sideSwap,meta.engineBuild]);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(trace);
  }
  const results=[];
  for(const [key,rows] of groups) {
    const comparisons=rows.slice(1).map(t=>compareDecisionTraces(rows[0],t));
    const status=rows.length<requiredRepeats || rows.some(x=>x.count===0)?'missing_repeat':
      comparisons.some(x=>x.status!=='identical_trace')?'diverged':'trace_match_only';
    results.push({key:JSON.parse(key),count:rows.length,status,comparisons});
  }
  return {status:!results.length?'missing_evidence':results.some(x=>x.status==='diverged')?'diverged':
    results.some(x=>x.status==='missing_repeat')?'missing_evidence':'trace_match_only',
    groupCount:results.length,results};
}
