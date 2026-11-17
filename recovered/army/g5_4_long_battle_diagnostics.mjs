/**
 * Read-only, time-bucketed G5.4 army battle health and tactical quality report.
 * No AI, physics, squad orders, or RNG changes. NOT a G8.4/G8.5 game test.
 */
import {createQualityAudit} from './g5_4_commander_quality_audit.mjs';

const roles=new Set(['musket','pike','bow','sword']);
const commands=new Set(['advance','hold']);
const round=n=>Math.round(n*1000)/1000;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const stage=v=> v==null?'none':(typeof v==='string'?v:String(v.stage??v.status??'unknown'));

function snapshot(state){
  const byTeam=(team)=>state.squads.filter(s=>s.team===team).reduce((n,s)=>n+s.alive,0);
  const bySquad=state.squads.map(s=>({id:s.id,team:s.team,type:s.type,alive:s.alive,
    x:round(s.x),z:round(s.z),order:s.order,aiRole:s.aiRole??null,
    defenseRole:s.defenseRole??null,operationRole:s.operationRole??null,
    decisionCount:s.decisionCount??0,routeReplans:s.routeReplans??0,
    stalledSeconds:round(s.stuckSeconds||0),
    tactic:s.tacticalReason??null}));
  const teamPlans=Object.fromEntries(['blue','red'].map(team=>{
    const p=state.teamPlans?.[team]||{};
    return [team,{phase:p.phase??null,operation:stage(p.operation),
      defense:stage(p.defense),withdrawal:stage(p.withdrawal),
      intelligenceMode:p.intelligence?.mode??null,
      communicationsDelivered:p.communications?.delivered??0,
      communicationsExpired:p.communications?.expired??0}];
  }));
  return {at:round(state.elapsed),tick:state.tick,blueAlive:byTeam('blue'),redAlive:byTeam('red'),
    winner:state.winner??null,bySquad,teamPlans};
}

function validateSnapshot(snapshot){
  if(!finite(snapshot.at)||snapshot.at<0||!Number.isInteger(snapshot.tick)||
      !Array.isArray(snapshot.bySquad)||snapshot.bySquad.length!==8||
      !Number.isInteger(snapshot.blueAlive)||!Number.isInteger(snapshot.redAlive)||
      snapshot.blueAlive<0||snapshot.redAlive<0||
      snapshot.bySquad.some(s=>!finite(s.x)||!finite(s.z)||s.alive<0)){
    throw new Error('Non-finite or invalid real G5.4 battle snapshot');
  }
}

export function analyzeCheckpoints(checkpoints,qualityReport){
  if(!Array.isArray(checkpoints)||checkpoints.length<2)throw new TypeError('At least two checkpoints required');
  for(const cp of checkpoints)validateSnapshot(cp);
  const periods=[];
  const transitions=Object.fromEntries(['blue','red'].map(team=>[team,{
    operation:0,defense:0,withdrawal:0,intelligenceMode:0,
    enteredWithdrawal:0,finishedWithdrawal:0,
    statuses:[],
  }]));
  for(let i=1;i<checkpoints.length;i++){
    const a=checkpoints[i-1],b=checkpoints[i];
    if(b.at<=a.at||b.tick<=a.tick||b.blueAlive>a.blueAlive||b.redAlive>a.redAlive)
      throw new Error('Non-monotone battle time, ticks or soldier casualties');
    for(const team of ['blue','red']){
      const x=a.teamPlans[team],y=b.teamPlans[team],sum=transitions[team];
      for(const k of ['operation','defense','withdrawal','intelligenceMode'])if(x[k]!==y[k])sum[k]++;
      if(x.withdrawal==='none'&&y.withdrawal!=='none')sum.enteredWithdrawal++;
      if(x.withdrawal!=='none'&&y.withdrawal==='none')sum.finishedWithdrawal++;
      if(!sum.statuses.some(s=>s.operation===y.operation&&s.defense===y.defense&&s.withdrawal===y.withdrawal)){
        sum.statuses.push({at:b.at,operation:y.operation,defense:y.defense,withdrawal:y.withdrawal});
      }
    }
    const aliveLoss=(team)=>team==='blue'?a.blueAlive-b.blueAlive:a.redAlive-b.redAlive;
    periods.push({from:a.at,to:b.at,seconds:round(b.at-a.at),blueLoss:aliveLoss('blue'),redLoss:aliveLoss('red'),
      blueAlive:b.blueAlive,redAlive:b.redAlive,
      ordersChanged:b.bySquad.filter((s,j)=>s.order!==a.bySquad[j].order).length,
      decisionsAdded:b.bySquad.reduce((n,s,j)=>n+(s.decisionCount-a.bySquad[j].decisionCount),0),
      nonFinitePositions:b.bySquad.filter(s=>!finite(s.x)||!finite(s.z)).length});
  }
  const native=qualityReport?.totals||{};
  const found=qualityReport?.findings||[];
  const classified=Object.fromEntries(['possible-tactical-engagement','possible-protective-screen','needs-review']
    .map(key=>[key,found.filter(f=>f.kind==='stationary-movement-order'&&f.classification===key).length]));
  const reversals=found.filter(f=>f.kind==='short-order-reversal');
  const sameSquadCounts=Object.entries(reversals.reduce((m,f)=>{m[f.squadId]=(m[f.squadId]||0)+1;return m;},{}))
    .map(([squadId,count])=>({squadId:Number(squadId),count})).sort((a,b)=>b.count-a.count);
  const first=checkpoints[0],last=checkpoints.at(-1);
  return {format:'killtheking-g5.4-long-battle-quality-v1',
    engine:'actual recovered G5.4 ArenaArmyBattle (CPU, scripted player order)',
    g8_4Recovered:false,g8_5MirroredMatches:0,gpuWebglVerified:false,
    seconds:round(last.at-first.at),checkpoints:checkpoints.length,
    initialAlive:{blue:first.blueAlive,red:first.redAlive},
    finalAlive:{blue:last.blueAlive,red:last.redAlive},
    winner:last.winner,
    shortReversals:native.shortReversals??null,
    orderChanges:native.orderChanges??null,
    decisions:native.decisions??null,
    nativeSoldierStallWarnings:native.nativeSoldierStallWarnings??null,
    stationaryMovementOrderWarnings:native.stationaryMovementOrderWarnings??null,
    stationaryClassifications:classified,
    topOrderReversers:sameSquadCounts.slice(0,4),
    findingBufferOverflow:qualityReport?.droppedFindings??0,
    transitions,periods,
    limits:'A sampled team-plan transition may miss intermediate changes. Stops during defense are not proof of stuck soldiers. No WebGL, no human play, no G8.4 source.'};
}

/** Live, read-only evidence for each 3.2s stationary movement-order finding. */
export function createStopEvidenceObserver({thresholdSeconds=3.28}={}){
  if(!finite(thresholdSeconds)||thresholdSeconds<.4)throw new RangeError('Invalid stationary threshold');
  const last=new Map(),evidence=[];
  function observe(state){
    for(const s of state.squads){
      let x=last.get(s.id);
      if(!x){last.set(s.id,{x:s.x,z:s.z,order:s.order,time:state.elapsed,for:0,issued:false});continue;}
      const elapsed=Math.max(0,state.elapsed-x.time);
      const moved=Math.hypot(s.x-x.x,s.z-x.z);
      const active=new Set(['position','follow','advance','charge','flank','retreat']).has(s.order);
      if(s.alive>0&&active&&s.order===x.order&&moved<.005){
        x.for+=elapsed;
        if(x.for+1e-8>=thresholdSeconds&&!x.issued){
          const plan=state.teamPlans?.[s.team]?.withdrawal;
          const staged=plan?.shooterIds?.includes(s.id)?(plan.rallies?.[s.id]??plan.rally):null;
          const personal=['rally','operational-reform'].includes(s.aiRole)?{x:s.rallyX,z:s.rallyZ}:null;
          // Exact G5.4 flank-staging rule: only for AI-led operational flank orders.
          const op=state.teamPlans?.[s.team]?.operation;
          const obj=op&&state.squads[op.targetId];
          const inFlankStage=op?.stage==='enveloping'||op?.stage==='assault';
          const flank=(!s.playerControlled&&s.order==='flank'&&s.operationRole==='flank'&&
            obj?.alive>0&&finite(op.flankSide))?{
            x:obj.x+(s.team==='blue'?1:-1)*(inFlankStage?20:-35),
            z:obj.z+op.flankSide*(inFlankStage?24:58),
          }:null;
          const destination=staged??personal??flank;
          const destinationDistance=destination&&finite(destination.x)&&finite(destination.z)?
            round(Math.hypot(s.x-destination.x,s.z-destination.z)):null;
          const reached=destinationDistance!==null&&destinationDistance<=2.8;
          evidence.push({at:round(state.elapsed),squadId:s.id,team:s.team,
            type:s.type,order:s.order,aiRole:s.aiRole??null,
            atPlannedDestination:reached,plannedDestinationDistance:destinationDistance,
            targetKind:staged?'staged-withdrawal-rally':personal?'personal-rally':flank?'flank-staging-point':'unknown',
            withdrawalStage:plan?.stage??null,
            position:{x:round(s.x),z:round(s.z)},
            classification:reached?'reached-planned-destination':'unexplained-stationarity'});
          x.issued=true;
        }
      }else{x.for=0;x.issued=false;}
      x.x=s.x;x.z=s.z;x.order=s.order;x.time=state.elapsed;
    }
  }
  return Object.freeze({observe,getEvidence:()=>structuredClone(evidence)});
}

export function runExtendedBattle(engine,{role='musket',seed=1600,command='advance',
  durationSeconds=120,bucketSeconds=15,dt=.08,qualityOptions={maxFindings:200}}={}){
  if(!roles.has(role)||!commands.has(command)||!Number.isInteger(seed)||
      !finite(durationSeconds)||durationSeconds<1||durationSeconds>600||
      !finite(bucketSeconds)||bucketSeconds<1||bucketSeconds>durationSeconds||
      !finite(dt)||dt<=0||dt>.1)throw new RangeError('Invalid long trial parameters');
  const state=engine.create(seed,role);
  if(state.soldiers.length!==140||state.squads.length!==8)throw new Error('Expected real G5.4 army roster');
  if(engine.issueOrder(state,state.playerSquadId,command)!==true)throw new Error('Player order rejected');
  const audit=createQualityAudit(qualityOptions);audit.start(state);
  const stopEvidence=createStopEvidenceObserver();stopEvidence.observe(state);
  const checkpoints=[snapshot(state)];
  let nextBucket=bucketSeconds,drainedEvents=0;
  const totalTicks=Math.ceil(durationSeconds/dt);
  for(let i=0;i<totalTicks&&!state.winner;i++){
    engine.step(state,dt);audit.afterStep(state);stopEvidence.observe(state);
    drainedEvents+=engine.drainCombatEvents(state).length;
    if(state.elapsed+0.00001>=nextBucket){checkpoints.push(snapshot(state));nextBucket+=bucketSeconds;}
  }
  if(state.tick>checkpoints.at(-1).tick)checkpoints.push(snapshot(state));
  const quality=audit.finish(state,engine.snapshot(state));
  const analysis=analyzeCheckpoints(checkpoints,quality);
  const evidence=stopEvidence.getEvidence();
  analysis.destinationEvidence={reached:evidence.filter(e=>e.atPlannedDestination).length,
    unresolved:evidence.filter(e=>!e.atPlannedDestination).length,
    notes:'Destination reached is not a stuck bug. Unknown destination still needs route investigation.'};
  return {role,seed,command,simulatedSeconds:round(state.elapsed),ticks:state.tick,
    drainedEvents,analysis,stopEvidence:evidence,checkpoints,quality};
}

export function aggregateExtendedTrials(trials){
  if(!Array.isArray(trials)||trials.length===0)throw new TypeError('nonempty trials required');
  const sum=key=>trials.reduce((n,t)=>n+(t.analysis[key]||0),0);
  const classificationKeys=['possible-tactical-engagement','possible-protective-screen','needs-review'];
  return {format:'killtheking-g5.4-long-battle-matrix-v1',trials:trials.length,
    totalSimulatedSeconds:round(trials.reduce((n,t)=>n+t.simulatedSeconds,0)),
    durationRange:[Math.min(...trials.map(t=>t.simulatedSeconds)),Math.max(...trials.map(t=>t.simulatedSeconds))],
    totalDecisions:sum('decisions'),totalOrderChanges:sum('orderChanges'),
    totalShortReversals:sum('shortReversals'),totalNativeStallWarnings:sum('nativeSoldierStallWarnings'),
    totalStationaryWarnings:sum('stationaryMovementOrderWarnings'),
    totalFindingBufferOverflow:sum('findingBufferOverflow'),
    reachedDestinationPauses:trials.reduce((n,t)=>n+(t.analysis.destinationEvidence?.reached||0),0),
    unexplainedPauses:trials.reduce((n,t)=>n+(t.analysis.destinationEvidence?.unresolved||0),0),
    stationaryClassifications:Object.fromEntries(classificationKeys.map(k=>[k,trials.reduce((n,t)=>n+t.analysis.stationaryClassifications[k],0)])),
    totalCasualties:{blue:trials.reduce((n,t)=>n+t.analysis.initialAlive.blue-t.analysis.finalAlive.blue,0),
      red:trials.reduce((n,t)=>n+t.analysis.initialAlive.red-t.analysis.finalAlive.red,0)},
    winCounts:{blue:trials.filter(t=>t.analysis.winner==='blue').length,
      red:trials.filter(t=>t.analysis.winner==='red').length,
      draw:trials.filter(t=>t.analysis.winner==='draw').length,
      noWinner:trials.filter(t=>!t.analysis.winner).length},
    g8_4Recovered:false,realG8_5MirrorTrials:0,gpuWebglVerified:false,
    limitations:'Historic G5.4 scripted CPU tests only; not full G8.4 or 144 G8.5 mirrored matches'};
}
