/**
 * G8.5C controlled mirror-run orchestrator. Does not simulate or launch game by itself.
 * The actual G8.4/G8.5 engine must implement runBattle(config) and true side swapping.
 */
import { auditMirrorPairs } from './g8_5_mirror_gate.mjs';
import { recordsToNdjson } from './g8_5c_live_telemetry.mjs';
import { auditMirrorStartLayouts } from './g8_5c_start_layout_gate.mjs';
const scenarios=['classic','control_points','supply_line'];
const sizes=[140,200,280];
export function buildMirrorManifest({seeds=[101,103,107,109,113,127,131,137],scenarios:sc=scenarios,armySizes= sizes}={}){
  if(!Array.isArray(seeds)||!seeds.length||!seeds.every(n=>Number.isSafeInteger(n)&&n>=0)||new Set(seeds).size!==seeds.length)throw new Error('seeds must be distinct nonnegative safe integers');
  if(!Array.isArray(sc)||!sc.length||sc.some(x=>!scenarios.includes(x))||new Set(sc).size!==sc.length)throw Error('invalid scenarios');
  if(!Array.isArray(armySizes)||!armySizes.length||armySizes.some(x=>!sizes.includes(x))||new Set(armySizes).size!==armySizes.length)throw Error('invalid armySizes');
  const manifest=[];
  for(const scenario of sc)for(const armySize of armySizes)for(const seed of seeds)
    for(const sideSwap of ['original','swapped'])manifest.push(Object.freeze({scenario,armySize,seed,mirrorSeed:scenario+'-'+armySize+'-'+seed,sideSwap}));
  return Object.freeze(manifest);
}
function verifyRecord(request,row){
  if(!row||typeof row!=='object'||Array.isArray(row))throw Error('runBattle must return a normalized match record');
  for(const k of ['scenario','armySize','seed','mirrorSeed','sideSwap'])if(row[k]!==request[k])throw Error('runBattle returned mismatched '+k);
  if(typeof row.engineBuild!=='string'||!row.engineBuild.trim())throw Error('runBattle did not return engineBuild');
  return {...row};
}
export async function executeMirrorManifest(runBattle,manifest,{onProgress,signal,requireLayoutProof=false}={}){
  if(typeof runBattle!=='function')throw new TypeError('runBattle must be a function');
  if(!Array.isArray(manifest)||manifest.length===0)throw new TypeError('manifest must be a nonempty array');
  const pairs=new Map(),records=[];
  // Fail fast on duplicates and incomplete pairs; never invent missing mirror results.
  for(const config of manifest){
    if(!['original','swapped'].includes(config.sideSwap))throw Error('manifest sideSwap invalid');
    const id=config.scenario+'|'+config.armySize+'|'+config.mirrorSeed;
    const set=pairs.get(id)??new Set();
    if(set.has(config.sideSwap))throw Error('duplicate manifest run: '+id+'/'+config.sideSwap);
    set.add(config.sideSwap);pairs.set(id,set);
  }
  for(const [id,set] of pairs)if(set.size!==2)throw Error('incomplete manifest pair: '+id);
  for(let i=0;i<manifest.length;i++){
    if(signal?.aborted)throw Error('Mirror run cancelled at '+i+'/'+manifest.length+'; no verified complete result');
    const request=manifest[i];
    const row=verifyRecord(request,await runBattle({...request}));
    records.push(row);onProgress?.({done:i+1,total:manifest.length,record:row});
  }
  // Respect production attribution as emitted by the engine, not by this runner.
  const report=auditMirrorPairs(records,{minPairs:Math.min(8,manifest.length/2)});
  const layoutReport=requireLayoutProof?auditMirrorStartLayouts(records):null;
  if(layoutReport&&layoutReport.status!=='start_layout_verified')
    throw Error('Mirrored starting positions not verified: '+layoutReport.errors.slice(0,2).join('; '));
  return {records,ndjson:recordsToNdjson(records),report,layoutReport};
}
