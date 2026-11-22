/** Merge only all eight authentic source-bound 4-way G5.4 CPU tests. */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {EXPECTED_ENGINE_SHA,plan,variants,summarize} from './protection_counterfactual.mjs';
const here=dirname(fileURLToPath(import.meta.url));
export function merge(parts){
 if(parts.length!==8)throw Error('Exactly eight independent scenario runs required');
 const rows=[],seen=new Set();
 for(const p of parts){
  if(p.format!=='ktk-g54-protection-counterfactual-v1'||
   p.sourceHash!==EXPECTED_ENGINE_SHA||!Number.isInteger(p.start)||
   p.start<0||p.start>7||seen.has(p.start)||p.rows?.length!==4)
   throw Error('Invalid, duplicate or wrong-engine CPU experiment');
  seen.add(p.start);
  const expected=plan[p.start];
  for(let i=0;i<4;i++){
   const r=p.rows[i];
   if(r.seed!==expected.seed||r.role!==expected.role||r.order!==expected.order||
    r.team!==expected.team||r.variant!==variants[i]||r.seconds<=0||r.seconds>600||
    !['blue','red'].includes(r.winner)||!r.metrics||
    r.metrics.samples<1||r.metrics.protectedShooterSamples<0||r.metrics.exposedShooterSamples<0||
    r.metrics.ownCompanyKills<0||r.metrics.avatarHits<0||
    !['musket','pike'].every(k=>r.metrics.opponentDamageByTargetType[k]>=0))
    throw Error('Invalid live game record, weapon role, verdict or protection measurement');
   rows.push(r);
  }
 }
 rows.sort((a,b)=>plan.findIndex(p=>p.role===a.role&&p.order===a.order&&p.team===a.team)-plan.findIndex(p=>p.role===b.role&&p.order===b.order&&p.team===b.team)||
  variants.indexOf(a.variant)-variants.indexOf(b.variant));
 const summary=summarize(rows);
 if(summary.scenarios!==8||summary.battles!==32)throw Error('Missing actual 32 CPU match results');
 const b=summary.byRoleOrder;
 const report=[
 '# G5.4 genuine CPU protection and stationary-avatar experiment',
 '',
 '- **Engine SHA-256:** '+EXPECTED_ENGINE_SHA,
 '- 1600 seed; 4 roles/orders combinations × blue/red teams × 4 controlled conditions = **32 actual G5.4 CPU battles**',
 '- Compared untouched scripted command (baseline), avatar-targeting disabled, AI takeover of commanded company, and both disabled',
 '- Win flips from disabling static avatar: **'+summary.avatarCounterfactualFlippedWinner+'/8**',
 '- Win flips from giving the human company back to AI: **'+summary.aiReplacementFlippedWinner+'/8**',
 '',
 '| Captain + order | Baseline victories | Baseline close escort | Baseline company kills |',
 '|---|---:|---:|---:|',
 ...['musket/advance','musket/hold','pike/advance','pike/hold'].map(key=>[
  '| '+key+' | '+b[key].baseline.wins+'/2 | '+b[key].baseline.closeEscortPercent+
  '% | '+b[key].baseline.companyKills+' |'].join('')),
 '',
 'Close escort = a living friendly pike or sword soldier within 30 world units of a living musket/bow soldier at a sampled simulation tick. This is a **proximity proxy**, not verified physical interception.',
 '',
 '### Boundaries',
 '- Avatar-disabled and AI-captain conditions are **counterfactual temporary simulation states**, NOT gameplay changes. No altered damage, cooldown, victory rule, projectile, or FFA movement.',
 '- AI takeover of a human company does **not** constitute an identical human decision; this isolates command authority, not one specific AI tactical cause.',
 '- One seed, CPU-scripted commands, no manually played avatar aiming, no physical GPU play, no true identical trait mirroring, and no newer G8.4 source.',
 '- Do **not** retune weapon lethality from these comparisons alone. Retain PR in draft and diagnose enemy targeting and screen role as follow-up.',
 ''
 ].join('\n');
 return {rows,summary,report};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const folder=resolve(process.argv[2]||resolve(here,'dist'));
 const parts=Array.from({length:8},(_,i)=>JSON.parse(readFileSync(resolve(folder,'part_'+i+'.json'),'utf8')));
 const result=merge(parts);
 writeFileSync(resolve(folder,'FULL_32_DEFENSE_COUNTERFACTUAL.json'),JSON.stringify({
  format:'ktk-g54-defense-counterfactual-full32-v1',sourceHash:EXPECTED_ENGINE_SHA,
  summary:result.summary,rows:result.rows,limits:{cpuOnly:true,notG8_4:true,productionEngineUnchanged:true}
 },null,2)+'\n');
 writeFileSync(resolve(folder,'DEFENSE_AVATAR_CAUSE_REPORT.md'),result.report);
 console.log(result.report);
}