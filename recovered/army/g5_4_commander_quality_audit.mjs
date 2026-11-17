/**
 * Read-only quality audit for the actual, recovered G5.4 ArenaArmyBattle state.
 * This is NOT G8.4 nor G8.5 paired-mirror evidence.
 * Measurements: role/target changes, short A-B-A orders, real movement, engine
 * stall counters, and team communication/operation state. Never writes to state.
 */
const finite = n => typeof n === 'number' && Number.isFinite(n);
const round = n => Math.round(n * 1000) / 1000;
const asCount = n => Number.isInteger(n) && n >= 0 ? n : 0;
const dist = (a,b) => Math.hypot(a.x - b.x, a.z - b.z);
const ACTIVE_MOVE = new Set(['position','follow','advance','charge','flank','retreat']);
const keyOf = o => o?.stage || o?.status || null;
function assertRealState(s) {
  if (!s || !finite(s.elapsed) || !Number.isInteger(s.tick) || s.tick < 0 ||
      !Array.isArray(s.squads) || !Array.isArray(s.soldiers) ||
      !s.squads.length || !s.soldiers.length ||
      s.squads.some(q => !Number.isInteger(q.id) || !finite(q.x) || !finite(q.z)) ||
      s.soldiers.some(u => !Number.isInteger(u.id) || !finite(u.x) || !finite(u.z))) {
    throw new TypeError('A real, finite ArenaArmyBattle G5.4 state is required');
  }
}
function addCount(obj, k, delta = 1) { obj[k] = (obj[k] || 0) + delta; }
export function createQualityAudit({minStallTicks=10, stationaritySeconds=3.2,
                                    maxFindings=80, reversalWindowSeconds=10}={}) {
  if (!Number.isInteger(minStallTicks) || minStallTicks < 2 || minStallTicks > 18)
    throw new RangeError('minStallTicks 2..18');
  if (!finite(stationaritySeconds) || stationaritySeconds < 0.4 || stationaritySeconds > 120)
    throw new RangeError('stationaritySeconds 0.4..120');
  if (!Number.isInteger(maxFindings) || maxFindings < 1 || maxFindings > 10000)
    throw new RangeError('maxFindings 1..10000');
  if (!finite(reversalWindowSeconds) || reversalWindowSeconds < 0 || reversalWindowSeconds > 120)
    throw new RangeError('reversalWindowSeconds 0..120');
  let phase='new', current=null, prevTick=null, prevTime=null;
  let initial=null, totals=null, squadLast=new Map(), soldierLast=new Map(),
      perSquad=new Map(), findings=[], droppedFindings=0, teamEvents={}, steps=0;
  function finding(type, payload) {
    if (findings.length >= maxFindings) {droppedFindings++;return;}
    findings.push({kind:type,...payload});
  }
  function report() {
    const finalSnapshot = phase === 'finished' ? totals.final : null;
    return {
      format:'killtheking-g5.4-commander-quality-v1',
      engine:'actual recovered ArenaArmyBattle G5.4',
      newerG8_4Verified:false, actualG8_5MirrorTrials:0,
      phase, initial, observedSteps:steps,
      elapsedObserved:prevTime===null?0:round(prevTime-initial.elapsed),
      totals: {
        decisions:totals.decisions,
        orderChanges:totals.orderChanges,
        shortReversals:totals.shortReversals,
        targetChanges:totals.targetChanges,
        movementDistance:round(totals.movementDistance),
        routeReplans:totals.routeReplans,
        nativeSoldierStallWarnings:totals.nativeSoldierStallWarnings,
        stationaryMovementOrderWarnings:totals.stationaryMovementOrderWarnings,
        engineWinner:finalSnapshot?.winner ?? current?.winner ?? null,
      },
      bySquad:[...perSquad.values()].sort((a,b)=>a.id-b.id).map(q=>({...q,
        pathDistance:round(q.pathDistance), decisionIntervals:q.decisionIntervals.map(round),
        decisionIntervalMean:q.decisionIntervals.length?round(q.decisionIntervals.reduce((a,b)=>a+b,0)/q.decisionIntervals.length):null,
      })),
      teamPlanTransitions:teamEvents,
      final:finalSnapshot,
      findings, droppedFindings,
      limits:'Stall warnings are heuristics: standing still can be tactically correct. No rendered/WebGL or human-played match was tested.',
    };
  }
  const api={
    start(state) {
      if (phase!=='new')throw new Error('Already started');
      assertRealState(state);
      const ids=state.squads.map(q=>q.id), uids=state.soldiers.map(u=>u.id);
      if(new Set(ids).size!==ids.length || new Set(uids).size!==uids.length)throw new Error('Duplicate entity IDs');
      current=state;
      initial={seed:state.seed, playerType:state.playerType, elapsed:state.elapsed,
        tick:state.tick, soldierCount:state.soldiers.length, squadCount:state.squads.length,
        humanSquadId:state.playerSquadId,
        scenario:'G5.4 historic 140-soldier field; scripted command inputs, no human play'};
      totals={decisions:0,orderChanges:0,shortReversals:0,targetChanges:0,movementDistance:0,
        routeReplans:0,nativeSoldierStallWarnings:0,stationaryMovementOrderWarnings:0,final:null};
      for(const q of state.squads) {
        squadLast.set(q.id,{x:q.x,z:q.z,order:q.order,target:q.targetSquadId,
          decisionCount:asCount(q.decisionCount), routeReplans:asCount(q.routeReplans),
          decisionAt:null,stationaryFor:0,stationaryIssued:false,
          recentChanges:[], lastRole:q.aiRole});
        perSquad.set(q.id,{id:q.id,team:q.team,type:q.type,playerControlled:!!q.playerControlled,
          decisions:0,orderChanges:0,shortReversals:0,targetChanges:0,pathDistance:0,
          nativeSoldierStallWarnings:0,routeReplans:0,stationaryMovementOrderWarnings:0,
          orders:{[q.order]:1}, roles:{[String(q.aiRole??'none')]:1}, decisionIntervals:[]});
      }
      for(const u of state.soldiers) soldierLast.set(u.id,{x:u.x,z:u.z,aboveStall:false});
      for(const team of ['blue','red']){
        const plan=state.teamPlans?.[team] ?? {};
        teamEvents[team]={operationChanges:0,defenseChanges:0,withdrawalChanges:0,
          lastOperation:keyOf(plan.operation),lastWithdrawal:keyOf(plan.withdrawal),
          lastDefense:plan.defense?.status ?? null,
          communicationsDelivered:0,communicationsExpired:0};
      }
      prevTick=state.tick;prevTime=state.elapsed;phase='running';
    },
    afterStep(state) {
      if(phase!=='running' || state!==current)throw new Error('Expected same active battle');
      assertRealState(state);
      if(state.tick<prevTick || state.elapsed<prevTime)throw new Error('Battle clock rolled back');
      if(state.tick===prevTick)return false;
      const elapsed=state.elapsed-prevTime;
      steps++;
      for(const q of state.squads){
        const last=squadLast.get(q.id),m=perSquad.get(q.id);
        if(!last)throw new Error('Squad roster changed unexpectedly');
        const path=dist(q,last);m.pathDistance+=path;totals.movementDistance+=path;
        const count=asCount(q.decisionCount);
        if(count<last.decisionCount)throw new Error('AI decision counter rolled back');
        const freshDecisions=count-last.decisionCount;
        m.decisions+=freshDecisions;totals.decisions+=freshDecisions;
        if(freshDecisions){
          if(last.decisionAt!==null)m.decisionIntervals.push(state.elapsed-last.decisionAt);
          last.decisionAt=state.elapsed;
          addCount(m.roles,String(q.aiRole??'none'));
        }
        if(q.order!==last.order){
          m.orderChanges++;totals.orderChanges++;addCount(m.orders,q.order);
          if(last.recentChanges.length &&
             q.order===last.recentChanges[last.recentChanges.length-1].from &&
             state.elapsed-last.recentChanges[last.recentChanges.length-1].time<=reversalWindowSeconds) {
            m.shortReversals++;totals.shortReversals++;
            finding('short-order-reversal',{at:round(state.elapsed),squadId:q.id,
              from:last.order,to:q.order});
          }
          last.recentChanges.push({time:state.elapsed,from:last.order,to:q.order});
          if(last.recentChanges.length>3)last.recentChanges.shift();
          last.stationaryFor=0;last.stationaryIssued=false;
        }
        if(q.targetSquadId!==last.target){m.targetChanges++;totals.targetChanges++;}
        const deltaReplans=asCount(q.routeReplans)-last.routeReplans;
        if(deltaReplans>0){m.routeReplans+=deltaReplans;totals.routeReplans+=deltaReplans;}
        // A movement order is not enough to prove stalling: use actual motion,
        // not the AI's static initial targetX/targetZ (unreliable for AI).
        // We report a *warning* only for near-zero motion over a long interval.
        if(q.alive>0 && ACTIVE_MOVE.has(q.order) && path<0.005) {
          last.stationaryFor+=elapsed;
          if(last.stationaryFor>=stationaritySeconds&&!last.stationaryIssued){
            last.stationaryIssued=true;
            m.stationaryMovementOrderWarnings++;totals.stationaryMovementOrderWarnings++;
            const enemies=state.squads.filter(enemy=>enemy.alive>0&&enemy.team!==q.team);
            const nearestEnemyDistance=enemies.length?Math.min(...enemies.map(e=>dist(e,q))):null;
            const tacticalStandRange=q.type==='musket'?64:q.type==='bow'?60:12;
            const mayBeTacticalStand=q.order==='advance'&&nearestEnemyDistance!==null&&
              nearestEnemyDistance<=tacticalStandRange+12;
            const routeTargetDistance=q.order==='position'&&q.routeGoal&&
              finite(q.routeGoal.x)&&finite(q.routeGoal.z)?round(dist(q,q.routeGoal)):null;
            finding('stationary-movement-order',{at:round(state.elapsed),squadId:q.id,
              order:q.order,seconds:round(last.stationaryFor),
              nearestEnemyDistance:nearestEnemyDistance===null?null:round(nearestEnemyDistance),
              routeTargetDistance,
              classification:mayBeTacticalStand?'possible-tactical-engagement':'needs-review'});
          }
        } else {last.stationaryFor=0;last.stationaryIssued=false;}
        last.x=q.x;last.z=q.z;last.order=q.order;last.target=q.targetSquadId;
        last.decisionCount=count;last.routeReplans=asCount(q.routeReplans);
      }
      for(const u of state.soldiers){
        const last=soldierLast.get(u.id);if(!last)throw new Error('Soldier roster changed');
        const crossing=u.alive && asCount(u.stalledTicks)>=minStallTicks;
        if(crossing && !last.aboveStall){
          totals.nativeSoldierStallWarnings++;
          const squad=perSquad.get(u.squadId);
          if(squad)squad.nativeSoldierStallWarnings++;
          finding('engine-native-soldier-stall',{at:round(state.elapsed),soldierId:u.id,
            squadId:u.squadId,stalledTicks:u.stalledTicks});
        }
        last.aboveStall=Boolean(crossing);
        last.x=u.x;last.z=u.z;
      }
      for(const team of ['blue','red']){
        const p=state.teamPlans?.[team]||{},ev=teamEvents[team];
        const o=keyOf(p.operation),w=keyOf(p.withdrawal),d=p.defense?.status??null;
        if(o!==ev.lastOperation){ev.operationChanges++;ev.lastOperation=o;}
        if(w!==ev.lastWithdrawal){ev.withdrawalChanges++;ev.lastWithdrawal=w;}
        if(d!==ev.lastDefense){ev.defenseChanges++;ev.lastDefense=d;}
        ev.communicationsDelivered=asCount(p.communications?.delivered);
        ev.communicationsExpired=asCount(p.communications?.expired);
      }
      prevTick=state.tick;prevTime=state.elapsed;
      return true;
    },
    finish(state, snapshot) {
      if(phase!=='running' || state!==current)throw new Error('Expected same active battle');
      if(!snapshot || !Array.isArray(snapshot.squads)||snapshot.winner!==state.winner)
        throw new TypeError('Authentic G5.4 engine snapshot required');
      // No references to the real state or snapshot leave the audit.
      totals.final=JSON.parse(JSON.stringify({winner:snapshot.winner,blue:snapshot.blue,
        red:snapshot.red,elapsed:snapshot.elapsed,playerSquadId:snapshot.playerSquadId}));
      phase='finished';current=null;
      return JSON.parse(JSON.stringify(report()));
    },
    getReport(){return JSON.parse(JSON.stringify(report()));},
    getPhase(){return phase;},
  };
  return Object.freeze(api);
}
