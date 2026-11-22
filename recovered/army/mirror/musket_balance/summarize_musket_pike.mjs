/** Source-hash-bound quality audit; inputs are ONLY actual G5.4 engine traces. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const home=dirname(fileURLToPath(import.meta.url));
const key=r=>[r.seed,r.role,r.order,r.side].join('|');
export function validateAndSummarize(parts,ref,engineSHA){
 if(!/^[a-f0-9]{64}$/.test(engineSHA)||ref.source.engineSha256!==engineSHA)throw Error('Source hash mismatch');
 if(parts.length!==8||ref.rows?.length!==32)throw Error('Need exactly 8 blocks and 32 archived reference games');
 const expected=new Map(ref.rows.map(r=>[key(r),r]));
 if(expected.size!==32)throw Error('Duplicate archival reference');
 const unique=new Set(),rows=[];
 for(const part of parts){
  if(part.format!=='g54-musket-pike-observation-v1'||part.engineSha256!==engineSHA||part.count!==4||part.rows?.length!==4||part.start%4!==0||part.start<0||part.start>28)throw Error('Corrupt source, range or trace');
  for(const r of part.rows){
   const k=key(r),want=expected.get(k);
   if(unique.has(k)||!want||r.winner!==want.winner||Math.abs(r.seconds-want.seconds)>.00001)throw Error('Observed outcome differs from verified historic real battle '+k);
   if(!r.playerSquadSurvivors&&r.playerWon&&r.survivors<=0)throw Error('Impossible victorious army');
   if(r.samples<1||!Number.isInteger(r.shotsAttemptedByPlayerCompany)||r.shotsAttemptedByPlayerCompany<0||r.hitsByPlayerCompany<0||r.killsByPlayerCompany<0||r.killsByPlayerCompany>r.hitsByPlayerCompany||r.hitsByPlayerCompany>r.shotsAttemptedByPlayerCompany||
     !Number.isFinite(r.inRangeSoldierSamples)||r.inRangeSoldierSamples<0||r.readyToFireSoldierSamples<0||r.clearLineSoldierSamples<0||r.blockedLineSoldierSamples<0||
     r.clearLineSoldierSamples+r.blockedLineSoldierSamples!==r.readyToFireSoldierSamples)throw Error('Invalid raw observation counts '+k);
   unique.add(k);rows.push(r);
  }
 }
 if(unique.size!==32)throw Error('One or more missing/duplicated trials');
 rows.sort((a,b)=>a.seed-b.seed||a.role.localeCompare(b.role)||a.order.localeCompare(b.order)||a.side.localeCompare(b.side));
 const summary={battles:32,seeds:[1600,1776,2026,31415],roles:['musket','pike'],sideSwapObserved:true,realCPU:true,strictGeometricMirror:false,manualAvatarCombat:false,acceptedForRelease:false};
 const byRole={};
 for(const role of summary.roles){
  const part=rows.filter(r=>r.role===role);
  const sum=field=>part.reduce((n,r)=>n+r[field],0);
  const totalS=sum('shotsAttemptedByPlayerCompany'),hits=sum('hitsByPlayerCompany'),kills=sum('killsByPlayerCompany');
  const aliveSnapshots=sum('aliveSnapshots'),samples=sum('samples');
  const initialSize=role==='musket'?10:25;
  byRole[role]={games:part.length,playerWins:part.filter(r=>r.playerWon).length,
   byOrder:Object.fromEntries(['advance','hold'].map(ord=>[ord,part.filter(r=>r.order===ord&&r.playerWon).length])),
   attacksByHumanCompany:totalS,hitsByHumanCompany:hits,killsByHumanCompany:kills,
   attemptsPerInitialSoldierPer100GameSeconds:Math.round(100000*totalS/(initialSize*sum('seconds')))/1000,
   meanAliveTroops:Math.round(100*aliveSnapshots/samples)/100,
   meanSoldiersInWeaponRangePerSample:Math.round(100*sum('inRangeSoldierSamples')/samples)/100,
   meanReadySoldiersInWeaponRangePerSample:Math.round(100*sum('readyToFireSoldierSamples')/samples)/100,
   meanWithClearFiringLanePerSample:role==='musket'?Math.round(100*sum('clearLineSoldierSamples')/samples)/100:null,
   meanWithBlockedFiringLanePerSample:role==='musket'?Math.round(100*sum('blockedLineSoldierSamples')/samples)/100:null,
   hitEventsPerAttackPercent:totalS?Math.round(10000*hits/totalS)/100:null,
   meanGameSeconds:Math.round(100*sum('seconds')/part.length)/100};
 }
 return {format:'ktk-g54-musket-pike-explanation-v1',engineSha256:engineSHA,
  provenance:{referenceWorkflow:'https://github.com/zxc28tarik/killtheking/actions/runs/44085979061',referenceArtifactId:14329142853},
  summary,byRole,rows};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const source=readFileSync(existsSync(resolve(home,'arena-army-battle-true-side-swap.js'))?resolve(home,'arena-army-battle-true-side-swap.js'):resolve(home,'../arena-army-battle-true-side-swap.js'));
 const sha=createHash('sha256').update(source).digest('hex');
 const ref=JSON.parse(readFileSync(resolve(home,'reference_musket_pike_32.json'),'utf8'));
 const dir=resolve(home,'reports');
 const parts=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(resolve(dir,'musket_diagnostic_'+i*4+'_4.json'),'utf8')));
 const result=validateAndSummarize(parts,ref,sha);
 const json=resolve(dir,'MUSKET_PIKE_REAL_ENGINE_32_BATTLES.json');
 mkdirSync(dir,{recursive:true});writeFileSync(json,JSON.stringify(result,null,2)+'\n');
 const m=result.byRole,p=m.pike,a=m.musket;
 const report=['# G5.4: 32 real musket/pike commander games — diagnosis',
  '',
  '## Coverage and source integrity',
  '- Four seeded deployments × two commander roles × ADVANCE/HOLD × actual blue/red player control = **32 real CPU battles**, 600s cap. All match archived 64-battle outcomes exactly (winner and completion time).',
  '- Engine SHA-256: `'+sha+'`',
  '- No changes to combat code, damage, cooldown, AI formation decisions or player orders. Observation of temporary UI combat-event queue is read-only relative to combat logic; engine result checked against prior source-hash-bound artifact.',
  '- This is not actual manual shooting, GPU gameplay, strict team-mirrored traits, G8.4 or public-release balance approval.',
  '',
  '## Commander comparison',
  '| Metric | Musket (10 soldiers) | Pike (25 soldiers) |',
  '|---|---:|---:|',
  '| Human-commanded army wins | '+a.playerWins+'/16 | '+p.playerWins+'/16 |',
  '| ADVANCE order wins | '+a.byOrder.advance+'/8 | '+p.byOrder.advance+'/8 |',
  '| HOLD order wins | '+a.byOrder.hold+'/8 | '+p.byOrder.hold+'/8 |',
  '| Attack attempts by human squad | '+a.attacksByHumanCompany+' | '+p.attacksByHumanCompany+' |',
  '| Damage events by human squad | '+a.hitsByHumanCompany+' | '+p.hitsByHumanCompany+' |',
  '| Kills by human squad | '+a.killsByHumanCompany+' | '+p.killsByHumanCompany+' |',
  '| Average living troops in controlled squad per snapshot | '+a.meanAliveTroops+' | '+p.meanAliveTroops+' |',
  '| Average troops inside own weapon range per snapshot | '+a.meanSoldiersInWeaponRangePerSample+' | '+p.meanSoldiersInWeaponRangePerSample+' |',
  '| Average troops ready and in range per snapshot | '+a.meanReadySoldiersInWeaponRangePerSample+' | '+p.meanReadySoldiersInWeaponRangePerSample+' |',
  '| Musket ready troops with clear lane per snapshot | '+a.meanWithClearFiringLanePerSample+' | n/a |',
  '| Musket ready troops with obstructed lane per snapshot | '+a.meanWithBlockedFiringLanePerSample+' | n/a |',
  '',
  '## Interpretation and next gate',
  '- **The player-controlled company has different troop counts**: muskets 10 and pikes 25. The chosen order removes one autonomous AI commander of the selected class. Win rates therefore measure the *commander/order and team composition*, NOT a pure weapon 1v1.',
  '- Muskets are limited to 4 shots/minute (15-second cooldown); pikes can strike once per ~1.9s and have 2.5× as many bodies in the controlled unit. Neither parameter should be buffed merely to equalize commander win rates.',
  '- Measured firing-lane availability and actual musket attack attempts above distinguish range/access limitations from nominal cooldown.',
  '- Next: controlled non-mutating attribution of clear fire opportunities versus postponed/blocked volleys, plus independent strict trait-mirror variants and manual WebGL comparison.',
  '',
  '**Publication gate: remains OPEN.** Issue #47; original G5.4 source retained; G8.4 missing.'
 ].join('\n')+'\n';
 const md=resolve(dir,'G5_4_MUSKET_PIKE_CAUSE_REPORT.md');writeFileSync(md,report);
 console.log(report);console.log('WRITTEN',json,md);
}
