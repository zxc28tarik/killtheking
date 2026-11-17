/*
 * Kill the King G5.4 — OPT-IN, passive battle telemetry.
 * Reads the actual ArenaArmyBattle state after authoritative engine calls.
 * Never patches ArenaArmyBattle, player/FFA AI, Math.random, combat events,
 * positions, health, commands, physics, or timers. No network or storage.
 * Only the recovered G5.4 source is covered. NOT the missing G8.4 game.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.G54PassiveBattleTrace = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const isFiniteNumber = n => typeof n === 'number' && Number.isFinite(n);
  const copy = obj => JSON.parse(JSON.stringify(obj));
  const safePositiveInt = (n, min, max, label) => {
    if (!Number.isInteger(n) || n < min || n > max) throw new RangeError(label + ' out of range');
    return n;
  };
  function assertMatch(state) {
    if (!state || !Array.isArray(state.soldiers) || !Array.isArray(state.squads) ||
        !isFiniteNumber(state.tick) || !isFiniteNumber(state.elapsed) ||
        !state.squads.every(s => Number.isInteger(s.id))) {
      throw new TypeError('Expected a real ArenaArmyBattle state');
    }
  }
  function nativeScores(state) {
    let blue = 0, red = 0;
    for (const soldier of state.soldiers) {
      if (!soldier.alive) continue;
      if (soldier.team === 'blue') blue++;
      else if (soldier.team === 'red') red++;
    }
    return {blue, red};
  }
  function signature(state) {
    // Deterministic sample fingerprint, NOT authentication or a save-state hash.
    let h = 2166136261;
    const add = value => {
      const s = String(value);
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      h ^= 31; h = Math.imul(h, 16777619);
    };
    add(state.tick); add(state.elapsed);
    for (const unit of state.soldiers) {
      add(unit.id);add(unit.x);add(unit.z);add(unit.hp);add(unit.alive);
    }
    for (const squad of state.squads) {
      add(squad.id);add(squad.order);add(squad.decisionCount);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }
  function create({sampleEveryTicks = 8, maxSamples = 512, maxDecisions = 4096,
                    maxCombat = 2048, sourceTag = 'recovered-G5.4'} = {}) {
    safePositiveInt(sampleEveryTicks, 1, 10000, 'sampleEveryTicks');
    safePositiveInt(maxSamples, 1, 4096, 'maxSamples');
    safePositiveInt(maxDecisions, 1, 65536, 'maxDecisions');
    safePositiveInt(maxCombat, 1, 65536, 'maxCombat');
    if (typeof sourceTag !== 'string' || !sourceTag.trim() || sourceTag.length > 128)
      throw new TypeError('sourceTag must be a short nonempty string');

    let phase = 'new', observedState = null, initial = null, last = null;
    let decisions = [], samples = [], combat = [], dropped = {decisions: 0, samples: 0, combat: 0};
    let decisionSeen = new Map(), consumedCombat = new WeakSet(), frames = 0, observedTicks = 0;
    let lastSampleTick = -1, finishSummary = null, resultReason = null;
    const assertStarted = state => {
      if (phase !== 'running' || state !== observedState) throw new Error('Observer is not tracking this active battle');
    };
    const append = (bucket, value, limit, counter) => {
      if (bucket.length >= limit) {dropped[counter]++;return;}
      bucket.push(value);
    };
    const squadView = s => ({
      id: s.id, team: s.team, type: s.type, order: s.order,
      formation: s.formation, role: s.aiRole ?? null,
      targetSquadId: s.targetSquadId ?? null,
      decisionCount: s.decisionCount ?? 0,
      reason: s.tacticalReason ?? null,
      defenseRole: s.defenseRole ?? null,
      operationRole: s.operationRole ?? null,
      playerControlled: Boolean(s.playerControlled),
    });
    const report = () => ({
      format: 'killtheking-g5.4-passive-trace-v1',
      sourceTag,
      phase,
      authoritativeEngine: 'ArenaArmyBattle G5.4',
      gameVersionG8_4Verified: false,
      outcomeIsEngineSupplied: true,
      battleId: initial ? initial.battleId : null,
      initial,
      framesObserved: frames,
      ticksAdvanced: observedTicks,
      samples,
      decisions,
      combat,
      dropped,
      finalSnapshot: finishSummary,
      resultReason,
      caveat: 'Only G5.4 observational evidence; the missing G8.4 game and 144 paired G8.5 battles are not validated',
    });
    return Object.freeze({
      start(state) {
        if (phase !== 'new') throw new Error('Battle may be started once');
        assertMatch(state);
        if (!state.soldiers.length || !state.squads.length) throw new Error('Empty engine roster');
        observedState = state;
        const scores = nativeScores(state);
        initial = {
          battleId: 'G5.4-' + String(state.seed) + '-' + String(state.playerType),
          seed: state.seed, playerType: state.playerType,
          startTick: state.tick, startElapsed: state.elapsed,
          soldierCount: state.soldiers.length, squadCount: state.squads.length,
          perSide: scores,
          roster: state.soldiers.map(u => ({id: u.id, squadId: u.squadId,
            team: u.team, type: u.type, x: u.x, z: u.z, hp: u.hp, alive: Boolean(u.alive)})),
          initialSignature: signature(state),
        };
        for (const s of state.squads) decisionSeen.set(s.id, squadView(s));
        phase = 'running';
        return {battleId: initial.battleId, soldierCount: initial.soldierCount};
      },
      afterStep(state, dt, frameMs) {
        assertStarted(state);
        assertMatch(state);
        if (!isFiniteNumber(dt) || dt < 0) throw new RangeError('dt must be nonnegative');
        if (frameMs !== undefined && (!isFiniteNumber(frameMs) || frameMs < 0))
          throw new RangeError('frameMs must be nonnegative');
        frames++;
        // Detect an actual fixed-step tick without changing game state.
        const lastTick = last === null ? initial.startTick : last.tick;
        observedTicks += Math.max(0, state.tick - lastTick);
        const view = {tick: state.tick, elapsed: state.elapsed};
        last = view;
        for (const s of state.squads) {
          const current = squadView(s), previous = decisionSeen.get(s.id);
          if (previous && (current.decisionCount !== previous.decisionCount ||
              current.order !== previous.order || current.targetSquadId !== previous.targetSquadId ||
              current.formation !== previous.formation)) {
            append(decisions, {tick: state.tick, squadId: s.id,
              ai: !current.playerControlled, before: previous, after: current}, maxDecisions, 'decisions');
          }
          decisionSeen.set(s.id, current);
        }
        // DO NOT drain or splice combatEvents. The game's existing renderer still owns them.
        for (const hit of state.combatEvents || []) {
          if (!hit || typeof hit !== 'object' || consumedCombat.has(hit)) continue;
          consumedCombat.add(hit);
          append(combat, {tick: state.tick, event: copy(hit)}, maxCombat, 'combat');
        }
        if (lastSampleTick < 0 || state.tick - lastSampleTick >= sampleEveryTicks || state.winner) {
          lastSampleTick = state.tick;
          const scores = nativeScores(state);
          append(samples, {
            tick: state.tick, elapsed: state.elapsed, dt, frameMs: frameMs ?? null,
            ...scores, winner: state.winner ?? null,
            stateSignature: signature(state),
            squads: state.squads.map(s => ({id: s.id, alive: s.alive,
              x: s.x, z: s.z, order: s.order, decisionCount: s.decisionCount})),
          }, maxSamples, 'samples');
        }
      },
      finish(state, engineSnapshot, reason = 'match-ended') {
        assertStarted(state);
        if (!engineSnapshot || !Array.isArray(engineSnapshot.squads))
          throw new TypeError('Authoritative ArenaArmyBattle.snapshot() required');
        finishSummary = copy(engineSnapshot);
        resultReason = String(reason);
        phase = 'finished';
        // No further references to the engine after match completion.
        observedState = null;
        return copy(report());
      },
      abort(reason = 'aborted') {
        if (phase !== 'running') return false;
        phase = 'aborted'; observedState = null; resultReason = String(reason);
        return true;
      },
      getReport() {return copy(report());},
      getStatus() {return phase;},
    });
  }
  return Object.freeze({create});
});
