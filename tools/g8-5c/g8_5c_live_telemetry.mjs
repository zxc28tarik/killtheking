/**
 * Kill the King G8.5C — opt-in, side-effect-free browser/Node battle telemetry.
 * NOT connected to G8.4/G8.5 gameplay until its source is available.
 * Never writes to an army, combat state, FFA state, storage or DOM.
 * All match outcomes must be supplied by the real game's authoritative result.
 */
const SCENARIOS = new Set(['classic','control_points','supply_line']);
const SIZES = new Set([140,200,280]);
const SWAPS = new Set(['original','swapped']);
const WINNERS = new Set(['blue','red','draw']);
const finite = n => typeof n === 'number' && Number.isFinite(n);
const requiredString = (v,k) => {if(typeof v!=='string'||!v.trim())throw new TypeError(k+' must be a nonempty string');return v.trim()};
const nonneg = (v,k) => {if(!finite(v)||v<0)throw new TypeError(k+' must be a finite nonnegative number');return v;};
const integer = (v,k) => {if(!Number.isSafeInteger(v)||v<0)throw new TypeError(k+' must be a nonnegative safe integer');return v;};
const median = values => {if(!values.length)return undefined;const sorted=[...values].sort((a,b)=>a-b);return (sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2};
const p95 = values => {if(!values.length)return undefined;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.ceil(sorted.length*.95)-1]};
function checkMeta(meta){
  if(!meta || typeof meta!=='object'||Array.isArray(meta))throw new TypeError('meta must be an object');
  if(!SCENARIOS.has(meta.scenario))throw new TypeError('invalid scenario');
  if(!SIZES.has(meta.armySize))throw new TypeError('invalid armySize');
  integer(meta.seed,'seed');
  const ms=meta.mirrorSeed;
  if(!(typeof ms==='string'&&ms.trim()) && !(Number.isSafeInteger(ms)&&ms>=0))throw new TypeError('mirrorSeed must be a nonempty string or nonnegative safe integer');
  if(!SWAPS.has(meta.sideSwap))throw new TypeError('invalid sideSwap');
  requiredString(meta.engineBuild,'engineBuild');
  const source=meta.source??'external_unverified';
  if(!['external_unverified','production_game','synthetic'].includes(source))throw new TypeError('invalid source');
  return Object.freeze({scenario:meta.scenario,armySize:meta.armySize,seed:meta.seed,
    mirrorSeed:meta.mirrorSeed,sideSwap:meta.sideSwap,engineBuild:meta.engineBuild,source});
}
function checkOutcome(result){
  if(!result || typeof result!=='object'||Array.isArray(result))throw new TypeError('end result must be an object');
  if(!WINNERS.has(result.winner))throw new TypeError('invalid winner');
  for(const key of ['durationSeconds','elapsedSeconds','blueScore','redScore'])nonneg(result[key],key);
  integer(result.objectiveSwitches,'objectiveSwitches');
  const optional=['overtimeSeconds','supplyBonusBlue','supplyBonusRed'];
  for(const key of optional)if(result[key]!==undefined)nonneg(result[key],key);
  if(result.elapsedSeconds<0)throw new Error('invalid elapsedSeconds');
  if(result.winner==='blue' && result.blueScore===undefined)throw Error('Missing score');
  return result;
}
/**
 * frame stride: collecting every 8th frame at 60 fps yields ~1800 samples for a 4-min match;
 * bounded maxSamples prevents telemetry itself from growing indefinitely.
 */
export function createBattleRecorder(meta,{frameStride=8,maxSamples=4096}={}){
  const normalized=checkMeta(meta);
  if(!Number.isSafeInteger(frameStride)||frameStride<1||frameStride>10000)throw new RangeError('frameStride must be in 1..10000');
  if(!Number.isSafeInteger(maxSamples)||maxSamples<10||maxSamples>100000)throw new RangeError('maxSamples must be in 10..100000');
  let status='recording',frameCount=0,frames=[],stuck=[],result=null;
  function ensureActive(){if(status!=='recording')throw Error('Recorder is '+status)}
  return Object.freeze({
    recordFrameMs(ms){ensureActive();if(!finite(ms)||ms<=0||ms>5000)throw new TypeError('frame time must be >0 and <=5000 ms');
      frameCount++;
      if((frameCount-1)%frameStride===0){if(frames.length===maxSamples)frames.shift();frames.push(ms)}
      return frameCount;
    },
    recordStuckSoldiers(count){ensureActive();integer(count,'stuckSoldiers');if(stuck.length===maxSamples)stuck.shift();stuck.push(count);},
    endMatch(outcome){ensureActive();checkOutcome(outcome);
      const row={...normalized,winner:outcome.winner,durationSeconds:outcome.durationSeconds,
        elapsedSeconds:outcome.elapsedSeconds,blueScore:outcome.blueScore,redScore:outcome.redScore,
        objectiveSwitches:outcome.objectiveSwitches};
      for(const key of ['overtimeSeconds','supplyBonusBlue','supplyBonusRed']){
        if(outcome[key]!==undefined)row[key]=outcome[key];
      }
      if(frames.length){row.fpsMedian=1000/median(frames);row.frameP95Ms=p95(frames)}
      if(stuck.length)row.stuckSoldiers=Math.round(median(stuck));
      result=Object.freeze(row);status='finished';return {...result};
    },
    abort(){ensureActive();status='aborted';frames=[];stuck=[];},
    getRecord(){return result?{...result}:null;},
    getStatus(){return status;},
    getDiagnostics(){return {status,frameCount,retainedFrameSamples:frames.length,stuckSamples:stuck.length,
      note:'Frame/fps metrics are optional observational samples; not proof of real GPU performance'};}
  });
}
export function recordsToNdjson(records){if(!Array.isArray(records))throw new TypeError('records must be an array');
  return records.map((row,i)=>{if(!row||typeof row!=='object'||Array.isArray(row))throw new TypeError('record '+(i+1)+' invalid');return JSON.stringify(row)}).join('\n')+(records.length?'\n':'');}
export const PRODUCTION_SOURCE_IS_NOT_PROVEN_BY_LABEL=true;
