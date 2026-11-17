/**
 * G8.5B explicit game-report bridge; NOT wired into any existing game source.
 * No auto-discovered names, guessed values, or silent zeros.
 * Every required value must be mapped from a verified engine field/path.
 */
const required=['scenario','armySize','seed','winner','durationSeconds','elapsedSeconds','blueScore','redScore','objectiveSwitches'];
const optional=['overtimeSeconds','supplyBonusBlue','supplyBonusRed','fpsMedian','frameP95Ms','stuckSoldiers'];
function readPath(obj,path){
  if(typeof path==='function')return path(obj);
  if(typeof path!=='string'||!path.trim())throw Error('Invalid mapping: expected path or function');
  return path.split('.').reduce((v,k)=>v==null?undefined:v[k],obj);
}
export function normalizeGameReport(raw,{fieldMap={},mirrorSeed,sideSwap,engineBuild,source='external_unverified'}={}){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Game report must be an object');
  const result={};
  for(const key of required){
    if(!(key in fieldMap))throw Error(`Missing explicit field mapping: ${key}`);
    const v=readPath(raw,fieldMap[key]);
    if(v===undefined||v===null)throw Error(`Missing source value: ${key}`);
    result[key]=v;
  }
  for(const key of optional){
    if(key in fieldMap){
      const v=readPath(raw,fieldMap[key]);
      if(v!==undefined&&v!==null)result[key]=v;
    }
  }
  if(mirrorSeed!==undefined||sideSwap!==undefined){
    if(mirrorSeed===undefined||sideSwap===undefined)throw Error('mirrorSeed and sideSwap must be provided together');
    result.mirrorSeed=mirrorSeed;
    result.sideSwap=sideSwap;
  }
  if(engineBuild!==undefined)result.engineBuild=engineBuild;
  result.source=source;
  return result;
}
