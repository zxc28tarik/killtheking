/**
 * G5.4 native multiseed release-gate audit.
 * Runs actual CPU engine; reports failures instead of inventing win/draw.
 * NOT G8.4 and NOT valid mirrored-side G8.5 testing.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadCandidateEngine,runCandidateMatrix} from './run_g5_4_contact_recovery_matrix.mjs';
import {evaluateBattleClosure} from '../g5_4_battle_closure_audit.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
export const SEEDS=Object.freeze([1776,2026,31415]);
export const EXPECTED=Object.freeze({1776:5,2026:5,31415:7});
const ROLE=['musket','pike','bow','sword'],ORDER=['advance','hold'];
export function nativeMirrorCapability(engine){
 const p=engine.create(1600,'pike','red');
 return {playerSide:p.squads[p.playerSquadId].team,
  trueMirrorSupported:p.squads[p.playerSquadId].team==='red',
  note:'G5.4 create(seed,playerType) hardcodes player to BLUE; flipping raw X is invalid without team-aware AI/facing/player-hit transformation.'};
}
export function engineHash(){
 return createHash('sha256').update(readFileSync(resolve(dir,'arena-army-battle-contact-recovery.js'))).digest('hex');
}
export function checkNativeSeed(p){
 assert.equal(p.format,'killtheking-g5.4-contact-recovery-real-engine-matrix-v1');
 assert(SEEDS.includes(p.seed),'Unexpected seed');
 assert.equal(p.maxSeconds,600);
 assert.equal(p.engineSha256,engineHash(),'Mixed source game versions');
 assert.equal(p.cases.length,8,'Expected four classes x two commands');
 const seen=new Set();
 for(const c of p.cases){
  assert.equal(c.seed,p.seed);
  assert(ROLE.includes(c.role)&&ORDER.includes(c.command));
  const key=c.role+':'+c.command;
  assert(!seen.has(key),'Duplicate scenario');seen.add(key);
  assert(Array.isArray(c.checkpoints)&&c.checkpoints.length>=2);
  const v=evaluateBattleClosure({checkpoints:c.checkpoints,
    simulatedSeconds:c.seconds,ticks:c.ticks},{enduranceSeconds:600,staleWindowSeconds:300});
  assert.equal(v.terminalWinner,c.terminalWinner,'Fabricated winner');
  assert.equal(v.verdict,c.verdict,'Fabricated timeout/verdict');
  assert.equal(v.ciReleaseGatePassed,c.ciReleaseGatePassed,'Release result altered');
  assert.equal(v.seconds,c.seconds);
 }
 const completed=p.cases.filter(c=>c.hasTerminalWinner).length;
 assert.equal(completed,EXPECTED[p.seed],'Unexpected seed result; investigate before updating reviewed fixture');
 return p;
}
export function combinedNativeAudit(parts){
 assert(Array.isArray(parts)&&parts.length===SEEDS.length,'Three seed matrices required');
 const unique=new Set(parts.map(p=>p.seed));
 assert.equal(unique.size,SEEDS.length,'Duplicated seed');
 const ordered=[...parts].sort((a,b)=>a.seed-b.seed);
 assert.deepEqual(ordered.map(p=>p.seed),[...SEEDS]);
 ordered.forEach(checkNativeSeed);
 const cases=ordered.flatMap(p=>p.cases);
 const ended=cases.filter(c=>c.hasTerminalWinner);
 const unresolved=cases.filter(c=>!c.hasTerminalWinner);
 const quiet=unresolved.filter(c=>c.verdict==='timeout-no-recent-casualties');
 const cap=nativeMirrorCapability(loadCandidateEngine());
 assert.equal(cap.trueMirrorSupported,false,'Native side-swap support changed; re-evaluate mirror rules');
 return {format:'killtheking-g5.4-multiseed-native-audit-v1',
  candidateSha256:engineHash(),seeds:[...SEEDS],cases:cases.length,
  naturalEliminations:ended.length,unresolved:unresolved.length,
  noRecentCasualties:quiet.length,releaseGatePassed:unresolved.length===0,
  trueMirrorsExecuted:0,mirroredSideCapability:cap,
  perSeed:ordered.map(p=>({seed:p.seed,naturalEliminations:p.cases.filter(c=>c.hasTerminalWinner).length,
    unresolved:p.cases.filter(c=>!c.hasTerminalWinner).length})),
  cases:cases.map(c=>({seed:c.seed,role:c.role,command:c.command,seconds:c.seconds,
    winner:c.terminalWinner,verdict:c.verdict,surviving:c.surviving,
    closestAtEnd:c.checkpoints.at(-1).closestOpposingSoldiers})),
  warning:'RELEASE BLOCKED: seven real native matches do not finish at 600s; 0 genuine matched side-swaps, 0/144 G8.5 G8.4 matches.'};
}
function write(p,x){mkdirSync(dirname(resolve(p)),{recursive:true});
 writeFileSync(resolve(p),JSON.stringify(x,null,2)+'\n');}
const called=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(called){
 const [mode,dest,...args]=process.argv.slice(2);
 if(!dest)throw Error('Usage: node g5_4_multiseed_gate.mjs run OUTPUT.json SEED | merge OUTPUT.json SEED*.json');
 if(mode==='run'){
  const seed=Number(args[0]);
  if(!SEEDS.includes(seed)||!args[0]||! /^\d+$/.test(args[0]))throw Error('Unsupported seed');
  const cap=nativeMirrorCapability(loadCandidateEngine());
  if(cap.trueMirrorSupported)throw Error('Side support unexpectedly changed');
  const data=runCandidateMatrix({seed,maxSeconds:600,
    logger:c=>console.log('NATIVE G5.4',seed,c.role,c.command,c.seconds,c.winner??'UNRESOLVED')});
  checkNativeSeed(data);write(dest,data);
  console.log('RECORDED',seed,'naturally finished',data.cases.filter(c=>c.hasTerminalWinner).length,'of 8');
 }else if(mode==='merge'){
  const out=combinedNativeAudit(args.map(p=>JSON.parse(readFileSync(resolve(p),'utf8'))));
  write(dest,out);
  console.log(JSON.stringify({cases:out.cases,natural:out.naturalEliminations,unresolved:out.unresolved,mirror:out.trueMirrorsExecuted,releaseGate:out.releaseGatePassed}));
 }else throw Error('Unknown mode');
}
