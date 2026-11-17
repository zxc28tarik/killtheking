/**
 * G5.4 read-only match closure QA: do not infer victory from casualty lead.
 * This file never changes the game engine. A timeout here is a FAILED RELEASE
 * ACCEPTANCE GATE, not a timed-win rule added to the product.
 */

export const ENDURANCE_SECONDS = 600;
export const STALE_WINDOW_SECONDS = 300;
const rosterSize=70;
const round=v=>Math.round(v*1000)/1000;
const isNum=x=>typeof x==='number'&&Number.isFinite(x);

export function evaluateBattleClosure(trial,{enduranceSeconds=ENDURANCE_SECONDS,staleWindowSeconds=STALE_WINDOW_SECONDS}={}){
  if(!trial || !Array.isArray(trial.checkpoints) || trial.checkpoints.length<2)
    throw new TypeError('Real battle checkpoints are required');
  if(!isNum(enduranceSeconds)||enduranceSeconds<=0||!isNum(staleWindowSeconds)||staleWindowSeconds<=0||staleWindowSeconds>=enduranceSeconds)
    throw new RangeError('Invalid endurance / stale windows');
  const list=trial.checkpoints;
  const start=list[0],last=list.at(-1);
  if(start.at!==0 || start.blueAlive!==rosterSize || start.redAlive!==rosterSize)
    throw new Error('Expected live 70v70 G5.4 battle from t=0');
  if(!isNum(trial.simulatedSeconds)||!isNum(last.at)||Math.abs(last.at-trial.simulatedSeconds)>.05)
    throw new Error('Inconsistent battle duration');
  for(let i=1;i<list.length;i++){
    const a=list[i-1],b=list[i];
    if(!isNum(b.at)||b.at<=a.at||!Number.isInteger(b.blueAlive)||!Number.isInteger(b.redAlive)||
      b.blueAlive<0||b.redAlive<0||b.blueAlive>a.blueAlive||b.redAlive>a.redAlive)
      throw new Error('Non-monotone battle checkpoint');
  }
  const winner=last.winner??null;
  if(![null,'blue','red','draw'].includes(winner))throw new Error('Invalid winner');
  const blue=last.blueAlive, red=last.redAlive;
  if(winner==='blue'&&!(blue>0&&red===0)||winner==='red'&&!(red>0&&blue===0)||
    winner==='draw'&&!(blue===0&&red===0)||winner===null&&(!blue||!red))
    throw new Error('Winner does not correspond to elimination');
  const timedOut=winner===null&&last.at+1e-6>=enduranceSeconds;
  const windowStart=Math.max(0,last.at-staleWindowSeconds);
  const base=[...list].reverse().find(c=>c.at<=windowStart+1e-5);
  if(!base)throw new Error('Missing evidence for the final casualty window');
  const lateLosses={blue:base.blueAlive-blue,red:base.redAlive-red};
  const totalLateLosses=lateLosses.blue+lateLosses.red;
  const noLateCasualties=totalLateLosses===0;
  const verdict=winner!==null?'terminal-elimination':timedOut?(noLateCasualties?'timeout-no-recent-casualties':'timeout-still-fighting'):'in-progress';
  const ciReleaseGatePassed=winner!==null; // explicit no fake draw or casualty-lead victory
  return {
    verdict,ciReleaseGatePassed,terminalWinner:winner,hasTerminalWinner:winner!==null,
    reachedEnduranceBoundary:timedOut,
    seconds:round(last.at),ticks:trial.ticks,
    startingSoldiers:{blue:rosterSize,red:rosterSize},
    surviving:{blue,red},casualties:{blue:rosterSize-blue,red:rosterSize-red},
    lastWindowSeconds:round(last.at-base.at),lastWindowLosses:lateLosses,
    zeroCasualtiesInLastWindow:noLateCasualties,
    ordersChanged:trial.analysis?.orderChanges??null,
    shortOrderReversals:trial.analysis?.shortReversals??null,
    blueWithdrawalTransitions:trial.analysis?.transitions?.blue?.withdrawal??null,
    redWithdrawalTransitions:trial.analysis?.transitions?.red?.withdrawal??null,
    note:winner===null?'Game has NOT ended. Do not invent a winner or call this a draw.':'Actual native elimination terminal condition',
  };
}

export function summarizeClosureMatrix(cases){
  if(!Array.isArray(cases)||cases.length<1)throw new TypeError('At least one real battle case required');
  const sum=f=>cases.filter(f).length;
  return {
    format:'killtheking-g5.4-endurance-gate-v1',engine:'G5.4 ArenaArmyBattle real CPU engine',
    scenarios:cases.length,simulatedSeconds:round(cases.reduce((n,c)=>n+c.seconds,0)),
    terminalWins:sum(c=>c.hasTerminalWinner),unresolvedAtBoundary:sum(c=>c.reachedEnduranceBoundary),
    stalematesWithZeroLateCasualties:sum(c=>c.verdict==='timeout-no-recent-casualties'),
    stillFightingAtTimeout:sum(c=>c.verdict==='timeout-still-fighting'),
    allCasesReleaseReady:cases.every(c=>c.ciReleaseGatePassed),
    winners:Object.fromEntries(['blue','red','draw'].map(w=>[w,sum(c=>c.terminalWinner===w)])),
    warning:'No terminal result at 600 seconds is an OPEN GAMEPLAY ISSUE; no new victory rule was applied.',
    scope:'Scripted CPU matches, one seed, four player roles x hold/advance; no GPU test; G8.4 source unavailable; 0/144 G8.5 matches.'
  };
}
