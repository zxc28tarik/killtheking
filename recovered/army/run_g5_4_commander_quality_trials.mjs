/** Actual G5.4 combat engine QA, never the missing G8.4 or live WebGL game. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {createQualityAudit} from './g5_4_commander_quality_audit.mjs';
const root=import.meta.dirname;
const roles=['musket','pike','bow','sword'];
const seeds=[1600,1701,1802];
export function loadActualEngine(){
  const ctx=vm.createContext({console});
  vm.runInContext(readFileSync(resolve(root,'modules','weapon-balance.js'),'utf8'),ctx,{timeout:3000});
  vm.runInContext(readFileSync(resolve(root,'modules','arena-army-battle.js'),'utf8'),ctx,{timeout:3000});
  assert.equal(typeof ctx.ArenaArmyBattle?.step,'function');
  return ctx.ArenaArmyBattle;
}
export function runTrial(engine,{role,seed,command='advance',steps=750}) {
  assert(roles.includes(role));assert(Number.isInteger(seed));
  assert(['hold','advance'].includes(command));
  assert(Number.isInteger(steps)&&steps>0&&steps<=50000);
  const state=engine.create(seed,role),qa=createQualityAudit();
  // Reproducible noninteractive input; NOT a human-controlled match.
  assert.equal(engine.issueOrder(state,state.playerSquadId,command),true);
  qa.start(state);
  let combatEventCount=0;
  for(let i=0;i<steps&&!state.winner;i++){
    engine.step(state,.08);
    qa.afterStep(state);
    // Match actual browser order: renderer drains combat events after the observer.
    combatEventCount+=engine.drainCombatEvents(state).length;
  }
  const report=qa.finish(state,engine.snapshot(state));
  return {role,seed,command,simulatedSeconds:Math.round(state.elapsed*1000)/1000,
    ticks:state.tick,winner:state.winner,combatEventsDrainedByNativeEngine:combatEventCount,
    finalAlive: {blue:report.final.blue,red:report.final.red},
    ...report};
}
export function matrixSummary(trials) {
  const total=(field)=>trials.reduce((sum,trial)=>sum+trial.totals[field],0);
  const byRole=roles.filter(role=>trials.some(t=>t.role===role)).map(role=>{
    const subset=trials.filter(t=>t.role===role);
    return {role,n:subset.length,
      averageBlueAlive:Math.round(subset.reduce((x,t)=>x+t.finalAlive.blue,0)/subset.length*100)/100,
      averageRedAlive:Math.round(subset.reduce((x,t)=>x+t.finalAlive.red,0)/subset.length*100)/100,
      decisions:subset.reduce((x,t)=>x+t.totals.decisions,0),
      shortReversals:subset.reduce((x,t)=>x+t.totals.shortReversals,0),
      engineStallWarnings:subset.reduce((x,t)=>x+t.totals.nativeSoldierStallWarnings,0)};
  });
  return {source:'recovered G5.4 actual ArenaArmyBattle',g8_4GameRecovered:false,
    g8_5PairedMirrorMatches:0,
    limitations:'CPU-only, no WebGL, scripted player commands; each trial is standalone G5.4 rather than paired G8.5 mirrored battle.',
    trials:trials.length,simulatedSeconds:trials.reduce((x,t)=>x+t.simulatedSeconds,0),
    totalDecisions:total('decisions'),totalOrderChanges:total('orderChanges'),
    totalShortReversals:total('shortReversals'),totalTargetChanges:total('targetChanges'),
    totalNativeSoldierStallWarnings:total('nativeSoldierStallWarnings'),
    totalStationaryOrderWarnings:total('stationaryMovementOrderWarnings'),
    totalRouteReplans:total('routeReplans'),
    finalWins:{blue:trials.filter(t=>t.winner==='blue').length,
      red:trials.filter(t=>t.winner==='red').length,
      draw:trials.filter(t=>t.winner==='draw').length,
      none:trials.filter(t=>!t.winner).length},
    byRole};
}
export function createMatrix(engine,{steps=500}={}){
  const trials=[];
  for(const role of roles)for(const seed of seeds)trials.push(runTrial(engine,{role,seed,command:'advance',steps}));
  for(const role of roles)trials.push(runTrial(engine,{role,seed:1600,command:'hold',steps}));
  return {format:'killtheking-g5.4-quality-matrix-v1',summary:matrixSummary(trials),trials};
}
if(import.meta.url===`file://${process.argv[1]}`){
  const engine=loadActualEngine();const matrix=createMatrix(engine);
  const output=process.argv[2]||resolve(root,'G5_4_REAL_ENGINE_QUALITY_MATRIX.json');
  mkdirSync(dirname(output),{recursive:true});
  writeFileSync(output,JSON.stringify(matrix,null,2)+'\n','utf8');
  console.log(JSON.stringify(matrix.summary,null,2));
}
