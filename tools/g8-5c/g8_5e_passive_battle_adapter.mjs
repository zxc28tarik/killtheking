/**
 * G8.5E instrumentation bridge to future restored production battle code.
 * It never sets soldier positions, changes battle state, or simulates outcomes.
 * Source labels are caller assertions; this cannot authenticate a live game.
 */
import {createBattleRecorder} from './g8_5c_live_telemetry.mjs';
import {measureStartLayout} from './g8_5d_seeded_mirror_start.mjs';
import {createDecisionTrace} from './g8_5e_decision_trace.mjs';

export function createPassiveBattleAdapter(meta, opts={}) {
  const {frameStride=8, maxSamples=4096, maxEvents=50000, maxEventBytes=8192}=opts;
  const declaredArmySize=meta.armySize;
  const recorder=createBattleRecorder(meta,{frameStride,maxSamples});
  const trace=createDecisionTrace(meta,{maxEvents,maxEventBytes});
  let startLayout=null, phase='created';
  const requireActive=()=>{if(phase!=='started')throw new Error('Battle observer requires captured start rosters and unfinished match')};
  return Object.freeze({
    captureInitialRosters(rosters) {
      if(phase!=='created')throw new Error('Can only capture initial rosters once');
      const count=(rosters?.blue?.length??0)+(rosters?.red?.length??0);
      if(count!==declaredArmySize)throw new RangeError('Roster total must match declared armySize');
      const layout=measureStartLayout(rosters);
      startLayout=layout;
      phase='started';
      return {blueCount:layout.blue.length,redCount:layout.red.length};
    },
    recordDecision(event) {requireActive();return trace.record(event)},
    recordFrameMs(ms) {requireActive();return recorder.recordFrameMs(ms)},
    recordStuckSoldiers(count) {requireActive();return recorder.recordStuckSoldiers(count)},
    finishMatch(outcome) {
      requireActive();
      const row=recorder.endMatch(outcome);
      const events=trace.finish();
      phase='finished';
      const record={...row,startLayout,
        traceFormat:events.format, traceDigest:events.digest, traceEventCount:events.count};
      return {record, decisionTrace:events};
    },
    abort() {
      if(phase==='finished'||phase==='aborted')throw new Error('Battle already closed');
      recorder.abort(); phase='aborted';
    },
    getStatus() {return phase},
    getDiagnostics() {return {phase,...recorder.getDiagnostics(),trace:trace.getDiagnostics()}}
  });
}
