import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEngine} from '../run_g5_4_extended_trials.mjs';
import {loadCandidateEngine,runActualCandidate} from './run_g5_4_contact_recovery_case.mjs';
import {buildCandidate} from './build_g5_4_contact_recovery.mjs';
import {mergeCases} from './merge_g5_4_contact_recovery_cases.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
const before=readFileSync(resolve(dir,'../modules/arena-army-battle.js'),'utf8');
const after=readFileSync(resolve(dir,'arena-army-battle-contact-recovery.js'),'utf8');
const old=loadEngine(),fixed=loadCandidateEngine();
test('only runaway shooter anchor changed; rest of original G5.4 engine is byte-identical',()=>{
 const marker='  // If the screen breaks, a surviving shooter must not walk into the enemy.';
 const replacement='  // G5.4 contact recovery:';
 const next='  const threats=[];';
 const i=before.indexOf(marker),j=after.indexOf(replacement);
 assert(i>0&&j>0);
 assert.equal(before.slice(0,i),after.slice(0,j));
 assert.equal(before.slice(before.indexOf(next,i)),after.slice(after.indexOf(next,j)));
 assert(after.includes('preferredStandOff'));
});
test('retained team roster, commands, formations, firing modes and native elimination winner',()=>{
 assert.equal(fixed.TYPE_ORDER.length,4);
 assert.equal(Object.keys(fixed.ORDERS).length,8);
 assert.equal(Object.keys(fixed.FORMATIONS).length,6);
 assert.equal(Object.keys(fixed.FIRE_MODES).length,3);
 assert(after.includes("if(!blue||!red)state.winner=blue>red?'blue':red>blue?'red':'draw';"));
});
test('opening combat stays bit-for-bit equivalent before last melee escort is destroyed',()=>{
 const a=old.create(1600,'musket'),b=fixed.create(1600,'musket');
 assert(old.issueOrder(a,a.playerSquadId,'hold'));
 assert(fixed.issueOrder(b,b.playerSquadId,'hold'));
 for(let i=0;i<125;i++){old.step(a,.08);fixed.step(b,.08);}
 assert.deepEqual(JSON.parse(JSON.stringify(old.snapshot(a))),JSON.parse(JSON.stringify(fixed.snapshot(b))));
});
test('orphaned shooters move toward effective range, rather than fleeing from an absent melee enemy',()=>{
 const a=old.create(1600,'pike'),b=fixed.create(1600,'pike');
 for(const st of [a,b]){
  st.playerActive=false;
  for(const u of st.soldiers)if(u.type==='pike'||u.type==='sword'){u.alive=false;u.hp=0;}
  for(const s of st.squads)if(s.type==='pike'||s.type==='sword')s.alive=0;
 }
 for(let i=0;i<1000;i++){old.step(a,.08);fixed.step(b,.08);}
 const dist=state=>{
  const blue=state.squads.filter(s=>s.team==='blue'&&s.alive),red=state.squads.filter(s=>s.team==='red'&&s.alive);
  return Math.min(...blue.flatMap(x=>red.map(y=>Math.hypot(x.x-y.x,x.z-y.z))));
 };
 assert(dist(b)<dist(a)-80,'Candidate must stop progressive retreat');
 assert(dist(b)<180,'Candidate must restore firing range');
});
test('player-controlled order and chosen formation are not silently replaced',()=>{
 const s=fixed.create(1600,'musket');
 assert(fixed.issueOrder(s,s.playerSquadId,'hold'));
 assert(fixed.setFormation(s,s.playerSquadId,'square'));
 for(let i=0;i<1250&&!s.winner;i++)fixed.step(s,.08);
 assert.equal(s.squads[s.playerSquadId].order,'hold');
 assert.equal(s.squads[s.playerSquadId].formation,'square');
});
test('HTML rebuild validates 30 inline scripts and preserves a separate historic source',()=>{
 const built=buildCandidate();
 assert.equal(built.manifest.verifiedInlineScripts,30);
 assert.equal(built.manifest.gameplayWinRuleChanged,false);
 assert.equal(built.manifest.playerOrdersChanged,false);
 assert.equal(built.manifest.novemberG8_4Recovered,false);
 assert.equal(readFileSync(built.output,'utf8').includes('G54PassiveBattleTrace'),true);
});
test('actual CPU engine naturally ends the formerly frozen pike hold scenario',()=>{
 const c=runActualCandidate({role:'pike',command:'hold'});
 assert.equal(c.naturalElimination,true);
 assert.equal(c.winner,'blue');
 assert(c.seconds>200&&c.seconds<350);
 assert.equal(c.playerOrderPreserved,true);
});
test('matrix gate refuses incomplete or fake tournament summaries',()=>{
 assert.throws(()=>mergeCases([]),/eight/);
 assert.throws(()=>mergeCases([{role:'pike',command:'hold'}]),/eight/);
});
test('invalid scenarios rejected before computing any game state',()=>{
 assert.throws(()=>runActualCandidate({role:'mage',command:'advance'}),/Invalid/);
 assert.throws(()=>runActualCandidate({role:'musket',command:'explode'}),/Invalid/);
});
