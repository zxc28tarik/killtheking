/**
 * Kill the King — G8.5 reference invariants.
 * This file is a portable QA ORACLE, not the game's existing production implementation.
 * Parameters must be mapped from the verified G8.4/G8.5 source before integration.
 */
const finite = (x) => Number.isFinite(x);
const nonneg = (x, field) => {
  if (!finite(x) || x < 0) throw new TypeError(`${field} must be a nonnegative finite number`);
  return x;
};
export const CLASSIC = 'classic';

/**
 * Returns {status, reason, overtimeStart}. Status: active|overtime|finished.
 * Time values are absolute seconds after match start; no hidden wall clock.
 */
export function evaluateDeadline(snapshot, options = {}) {
  const {scenario, elapsed, duration, blueScore, redScore, contested=false, overtimeStart=null} = snapshot;
  nonneg(elapsed, 'elapsed');
  if (scenario === CLASSIC) return {status:'active',reason:'classic_unlimited',overtimeStart:null};
  nonneg(duration, 'duration'); nonneg(blueScore, 'blueScore'); nonneg(redScore, 'redScore');
  const closeMargin = nonneg(options.closeMargin ?? 8, 'closeMargin');
  const overtimeMax = nonneg(options.overtimeMax ?? 30, 'overtimeMax');
  const lead = Math.abs(blueScore - redScore);
  if (elapsed < duration) return {status:'active',reason:'within_main_clock',overtimeStart:null};
  const close = lead <= closeMargin;
  if (overtimeStart === null) {
    if (close || contested) return {status:'overtime',reason:contested?'contested_at_deadline':'close_score',overtimeStart:duration};
    return {status:'finished',reason:'decisive_at_deadline',overtimeStart:null};
  }
  nonneg(overtimeStart, 'overtimeStart');
  if (overtimeStart < duration) throw new RangeError('overtimeStart cannot precede deadline');
  if (elapsed >= overtimeStart + overtimeMax) return {status:'finished',reason:'overtime_cap',overtimeStart};
  if (!contested && !close) return {status:'finished',reason:'decisive_overtime_lead',overtimeStart};
  return {status:'overtime',reason:contested?'objective_still_contested':'score_still_close',overtimeStart};
}

/**
 * Hysteresis guards against squads ping-ponging among near-identical targets.
 * Setting urgent=true only bypasses hold time for actual tactical emergencies.
 */
export function shouldSwitchStrategicTarget(input, options = {}) {
  const {currentTargetValid=true, currentScore, candidateScore, heldSeconds=0, urgent=false} = input;
  nonneg(heldSeconds, 'heldSeconds');
  if (!currentTargetValid) return {switch:true,reason:'invalid_previous_target'};
  if (!finite(currentScore) || !finite(candidateScore)) return {switch:false,reason:'invalid_candidate_score'};
  const minHold = nonneg(options.minHold ?? 5, 'minHold');
  const advantage = nonneg(options.minAdvantage ?? 10, 'minAdvantage');
  const delta = candidateScore - currentScore;
  if (!urgent && heldSeconds < minHold) return {switch:false,reason:'minimum_hold'};
  if (delta <= advantage) return {switch:false,reason:'hysteresis'};
  return {switch:true,reason:urgent?'urgent_clear_advantage':'clear_advantage'};
}

/**
 * G8.4 rule probe: 2 depots + center simultaneously held for 12s => 12 points.
 * By default the test oracle awards only one bonus per battle. This is explicitly
 * configurable because a production re-arm policy is not yet verified.
 */
export function updateSupplyHold(previous, dt, ownership, options = {}) {
  nonneg(dt, 'dt');
  const required = nonneg(options.requiredSeconds ?? 12, 'requiredSeconds');
  const reward = nonneg(options.reward ?? 12, 'reward');
  const oneShot = options.oneShotPerBattle !== false;
  const teams = ['blue','red'];
  const next = {
    hold: {...(previous?.hold ?? {blue:0,red:0})},
    paid: {...(previous?.paid ?? {blue:false,red:false})},
    added: {blue:0,red:0}
  };
  for (const team of teams) {
    const ownsAll = ['depotA','depotB','center'].every(point => ownership?.[point] === team);
    if (!ownsAll) { next.hold[team]=0; if (!oneShot) next.paid[team]=false; continue; }
    next.hold[team] = nonneg(next.hold[team] || 0, `hold.${team}`) + dt;
    if (next.hold[team] + 1e-9 >= required && !next.paid[team]) {
      next.added[team] = reward;
      next.paid[team] = true;
    }
  }
  return next;
}
