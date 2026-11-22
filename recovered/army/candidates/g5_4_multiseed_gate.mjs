/** Native seed-varied G5.4 CPU audit. No arbitrary winner, no side-flip claim. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadCandidateEngine,runActualCandidate} from './run_g5_4_contact_recovery_case.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
export const SEEDS=[1776,2026,31415];
export const EXPECTED={1776:5,2026:5,31415:7};
const ROLE=['musket','pike','bow','sword'],ORDER=['advance','hold'];
export function nativeMirrorCapability(engine){
 const p=engine.create(1600,'pike','red');
 return {playerSide:p.squads[p.playerSquadId].team,
  trueMirrorSupported:p.squads[p.playerSquadId].team==='red',
  note:'G5.4 create(seed, playerType) always selects BLUE at negative X; manually inverting X without team-aware AI does NOT give a valid mirror.'};
}
export function engineHash(){
 return createHash('sha256').update(readFileSync(resolve(dir,'arena-army-battle-contact-recovery.js'))).digest('hex');
}
function verifyNativeCase(c,seed,source){
 assert.equal(c.format,'killtheking-g5.4-actual-candidate-case-v1');
 assert.equal(c.seed,seed);assert.equal(c.sourceHash,source);
 assert.equal(c.maxSeconds,600);
 assert.equal(c.initial.blue,70);assert.equal(c.initial.red,70);
 assert(c.playerOrderPreserved,'Scripted player order was overwritten');
 assert(Array.isArray(c.checkpoints)&&c.checkpoints.length>2);
 assert.equal(c.checkpoints[0].second,0);
 const last=c.checkpoints.at(-1);
 assert.equal(last.winner,c.winner);
 assert.equal(last.second,c.seconds);
 assert.deepEqual(c.final,last);
 for(let i=1;i<c.checkpoints.length;i++){
  const a=c.checkpoints[i-1],b=c.checkpoints[i];
  assert(b.second>a.second&&b.blue>=0&&b.red>=0&&b.blue<=a.blue&&b.red<=a.red,'Non-monotone real unit casualties');
 }
 const elimination=c.winner==='blue'&&last.blue>0&&last.red===0||
   c.winner==='red'&&last.red>0&&last.blue===0||
   c.winner==='draw'&&last.red===0&&last.blue===0;
 assert.equal(c.naturalElimination,!!elimination,'Fabricated natural victory');
 if(!elimination)assert(last.blue>0&&last.red>0&&Math.abs(c.seconds-600)<.01,'Unresolved case must have both live teams at timeout');
 assert(c.seconds>0&&c.seconds<=600);
 const halfway=[...c.checkpoints].reverse().find(x=>x.second<=300.01);
 assert(halfway,'Missing actual midbattle source checkpoint');
 const quiet=!elimination&&halfway.blue===last.blue&&halfway.red===last.red;
 return {quiet,terminal:!!elimination};
}
export function checkNativeSeed(p){
 assert.equal(p.format,'killtheking-g5.4-multiseed-raw-v1');
 assert(SEEDS.includes(p.seed),'Unexpected seed');
 assert.equal(p.maxSeconds,600);
 assert.equal(p.engineSha256,engineHash(),'Mixed source game versions');
 assert.equal(p.cases.length,8,'Expected four classes x two commands');
 const seen=new Set();
 for(const c of p.cases){
  assert(ROLE.includes(c.role)&&ORDER.includes(c.command));
  const key=c.role+':'+c.command;
  assert(!seen.has(key),'Duplicate scenario');seen.add(key);
  verifyNativeCase(c,p.seed,p.engineSha256);
 }
 assert.equal(p.cases.filter(c=>c.naturalElimination).length,EXPECTED[p.seed],
  'Native results differ from measured fixture; investigate before updating');
 return p;
}
export function combinedNativeAudit(parts){
 assert(Array.isArray(parts)&&parts.length===SEEDS.length,'Three seed matrices required');
 assert.equal(new Set(parts.map(p=>p.seed)).size,SEEDS.length,'Duplicate seed');
 const ordered=[...parts].sort((a,b)=>a.seed-b.seed);
 assert.deepEqual(ordered.map(p=>p.seed),SEEDS);
 ordered.forEach(checkNativeSeed);
 const cases=ordered.flatMap(p=>p.cases);
 const natural=cases.filter(c=>c.naturalElimination).length;
 const quiet=cases.filter(c=>verifyNativeCase(c,c.seed,engineHash()).quiet).length;
 const cap=nativeMirrorCapability(loadCandidateEngine());
 assert.equal(cap.trueMirrorSupported,false,'Side-swap behavior changed; re-evaluate mirror contract');
 return {format:'killtheking-g5.4-multiseed-native-audit-v1',
  candidateSha256:engineHash(),seeds:[...SEEDS],cases:cases.length,
  naturalEliminations:natural,unresolved:cases.length-natural,
  noRecentCasualties:quiet,releaseGatePassed:natural===cases.length,
  trueMirrorsExecuted:0,mirroredSideCapability:cap,
  perSeed:ordered.map(p=>({seed:p.seed,naturalEliminations:p.cases.filter(c=>c.naturalElimination).length,
    unresolved:p.cases.filter(c=>!c.naturalElimination).length})),
  cases:cases.map(c=>({seed:c.seed,role:c.role,command:c.command,seconds:c.seconds,
    winner:c.winner,verdict:c.naturalElimination?'terminal-elimination':(
      verifyNativeCase(c,c.seed,engineHash()).quiet?'timeout-no-recent-casualties':'timeout-still-fighting'),
    surviving:{blue:c.final.blue,red:c.final.red},
    closestAtEnd:c.final.minEnemyDistance})),
  warning:'RELEASE BLOCKED: seven native matches do not finish by 600s. Genuine mirrors 0; G8.4 still missing.'};
}
function write(p,x){mkdirSync(dirname(resolve(p)),{recursive:true});
 writeFileSync(resolve(p),JSON.stringify(x,null,2)+'\n');}
const called=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(called){
 const [mode,dest,...args]=process.argv.slice(2);
 if(!dest)throw Error('Usage: run OUTPUT.json SEED | merge OUTPUT.json SEED*.json');
 if(mode==='run'){
  const seed=Number(args[0]);
  if(!SEEDS.includes(seed)||!args[0]||!/^\d+$/.test(args[0]))throw Error('Unsupported seed');
  const cap=nativeMirrorCapability(loadCandidateEngine());
  assert.equal(cap.trueMirrorSupported,false);
  const cases=[];
  for(const role of ROLE)for(const command of ORDER){
   const c=runActualCandidate({role,command,seed,maxSeconds:600});
   cases.push(c);
   console.log('REAL G5.4',seed,role,command,c.seconds,c.winner??'UNRESOLVED');
  }
  const p={format:'killtheking-g5.4-multiseed-raw-v1',
    engineSha256:engineHash(),seed,maxSeconds:600,cases};
  checkNativeSeed(p);write(dest,p);
  console.log('RECORDED',seed,cases.filter(c=>c.naturalElimination).length,'of 8 native endings');
 }else if(mode==='merge'){
  const out=combinedNativeAudit(args.map(p=>JSON.parse(readFileSync(resolve(p),'utf8'))));
  write(dest,out);
  console.log(JSON.stringify({cases:out.cases,natural:out.naturalEliminations,unresolved:out.unresolved,mirror:out.trueMirrorsExecuted,releaseGate:out.releaseGatePassed}));
 }else throw Error('Unknown mode');
}
