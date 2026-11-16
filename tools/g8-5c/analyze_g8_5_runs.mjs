#!/usr/bin/env node
/** Offline report analyzer for normalized Kill the King G8.5 scenario runs.
 * Does not simulate real units or assert production test outcomes.
 * CLI: node analyze_g8_5_runs.mjs normalized-runs.ndjson [report.json]
 */
import fs from 'node:fs';
const required=['scenario','armySize','seed','winner','durationSeconds','elapsedSeconds','blueScore','redScore','objectiveSwitches'];
const allowedSizes=new Set([140,200,280]);
function median(arr){if(!arr.length)return null;const s=[...arr].sort((a,b)=>a-b);return (s[(arr.length-1)>>1]+s[arr.length>>1])/2}
function average(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null}
function percentile(arr,p){if(!arr.length)return null;return [...arr].sort((a,b)=>a-b)[Math.floor((arr.length-1)*p)];}
export function parseRuns(text){
  const raw=text.trim();if(!raw)return [];
  if(raw[0]==='['){const v=JSON.parse(raw);if(!Array.isArray(v))throw new Error('Expected JSON array');return v;}
  return raw.split(/\r?\n/).filter(Boolean).map((line,i)=>{try{return JSON.parse(line)}catch(e){throw new Error('Line '+(i+1)+': '+e.message)}});
}
function checkRun(run, index){
  if(!run||typeof run!=='object'||Array.isArray(run))throw new Error('Run '+(index+1)+' not an object');
  for(const key of required)if(!(key in run))throw new Error('Run '+(index+1)+' missing '+key);
  if(!allowedSizes.has(run.armySize))throw new Error('Run '+(index+1)+' invalid armySize');
  if(!['blue','red','draw'].includes(run.winner))throw new Error('Run '+(index+1)+' invalid winner');
  for(const key of ['seed','durationSeconds','elapsedSeconds','blueScore','redScore','objectiveSwitches']) {
    if(!Number.isFinite(run[key])||run[key]<0)throw new Error('Run '+(index+1)+' '+key+' must be nonnegative number');
  }
  if(typeof run.scenario!=='string'||!run.scenario.trim())throw new Error('Run '+(index+1)+' invalid scenario');
  if(run.overtimeSeconds!==undefined&&(!Number.isFinite(run.overtimeSeconds)||run.overtimeSeconds<0))throw new Error('Run '+(index+1)+' invalid overtimeSeconds');
  if(run.supplyBonusBlue!==undefined&&(!Number.isFinite(run.supplyBonusBlue)||run.supplyBonusBlue<0))throw new Error('Run '+(index+1)+' invalid supplyBonusBlue');
  if(run.supplyBonusRed!==undefined&&(!Number.isFinite(run.supplyBonusRed)||run.supplyBonusRed<0))throw new Error('Run '+(index+1)+' invalid supplyBonusRed');
}
export function analyzeRuns(runs,{minSample=12, maxSideWinShare=.75, maxTargetSwitchesPerMinute=6, maxOvertimeSeconds=null}={}){
  if(!Array.isArray(runs))throw new Error('Expected array of run objects');
  runs.forEach(checkRun);
  const byGroup=new Map();
  for(const run of runs){const key=run.scenario+'|'+run.armySize;if(!byGroup.has(key))byGroup.set(key,[]);byGroup.get(key).push(run)}
  const groups=[...byGroup.entries()].map(([key,rr])=>{
    const [scenario,size]=key.split('|');const decisive=rr.filter(x=>x.winner!=='draw');
    const blueWins=decisive.filter(x=>x.winner==='blue').length,redWins=decisive.filter(x=>x.winner==='red').length;
    const switchRates=rr.map(x=>x.objectiveSwitches/Math.max(x.elapsedSeconds,1)*60);
    const overtimes=rr.filter(x=>(x.overtimeSeconds??Math.max(0,x.elapsedSeconds-x.durationSeconds))>0);
    const warnings=[];
    if(rr.length<minSample)warnings.push('Only '+rr.length+' runs (recommended >='+minSample+')');
    if(decisive.length>=minSample&&Math.max(blueWins,redWins)/decisive.length>maxSideWinShare)warnings.push('Possible side bias; audit mirror-seed pairs');
    if(median(switchRates)>maxTargetSwitchesPerMinute)warnings.push('Frequent objective retargeting; inspect command hysteresis');
    if(maxOvertimeSeconds!==null&&rr.some(x=>x.elapsedSeconds-x.durationSeconds>maxOvertimeSeconds+.01)&&scenario!=='classic')warnings.push('A match may exceed the configured overtime budget');
    if(scenario==='supply_line'&&rr.some(x=>((x.supplyBonusBlue??0)%12)!==0||((x.supplyBonusRed??0)%12)!==0))warnings.push('Unexpected supply bonus; verify G8.4 rules');
    return {scenario,armySize:Number(size),runs:rr.length,uniqueSeeds:new Set(rr.map(x=>x.seed)).size,
      wins:{blue:blueWins,red:redWins,draw:rr.length-decisive.length},blueWinShare:decisive.length?blueWins/decisive.length:null,
      medianElapsedSeconds:median(rr.map(x=>x.elapsedSeconds)),meanScoreMargin:average(rr.map(x=>Math.abs(x.blueScore-x.redScore))),
      overtimeShare:overtimes.length/rr.length,medianRetargetsPerMinute:median(switchRates),p95RetargetsPerMinute:percentile(switchRates,.95),warnings};
  }).sort((a,b)=>a.scenario.localeCompare(b.scenario)||a.armySize-b.armySize);
  return {source:'normalized battle telemetry only; independent G8.5 QA, not verified gameplay',runCount:runs.length,groupCount:groups.length,groups};
}
if(process.argv[1] && import.meta.url === new URL('file://'+process.argv[1]).href){
  const [, , inPath, outPath]=process.argv;
  if(!inPath){console.error('Usage: node analyze_g8_5_runs.mjs runs.ndjson [report.json]');process.exit(2)}
  try{const result=analyzeRuns(parseRuns(fs.readFileSync(inPath,'utf8')));const json=JSON.stringify(result,null,2); if(outPath)fs.writeFileSync(outPath,json+'\n');console.log(json)}catch(err){console.error(err.message);process.exit(1)}
}
