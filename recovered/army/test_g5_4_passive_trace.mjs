/** Tests execute the real recovered G5.4 battle engine, not a simulated event bus. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {integrate,validateInlineScripts} from './inject_g5_4_passive_trace.mjs';
const root=import.meta.dirname;
const original=readFileSync(resolve(root,'KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html'),'utf8');
const telescope=readFileSync(resolve(root,'g5_4_passive_battle_trace.js'),'utf8');
const scripts=[...original.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]);
const ctx=vm.createContext({console});
for(const marker of ['root.ArenaWeaponBalance=api','root.ArenaArmyBattle=api']) {
 const found=scripts.filter(x=>x.includes(marker));
 assert.equal(found.length,1,'Missing real engine: '+marker);
 vm.runInContext(found[0],ctx,{timeout:3000});
}
vm.runInContext(telescope,ctx,{timeout:3000});
const engine=ctx.ArenaArmyBattle,library=ctx.G54PassiveBattleTrace;
const state=(seed=1600,role='sword')=>engine.create(seed,role);
const observer=(o={})=>library.create(o);
const strictState=s=>JSON.stringify(s);

test('real recovered ArenaArmyBattle engine loaded with passive observer',()=>{
 assert.equal(engine.TYPE_ORDER.length,4);
 assert.equal(typeof library.create,'function');
 assert.equal(engine.create(1600,'pike').soldiers.length,140);
});
test('observer alone never starts a simulation or updates a single soldier',()=>{
 const s=state(),prior=strictState(s),t=observer();
 assert.equal(t.start(s).soldierCount,140);
 assert.equal(strictState(s),prior);
 assert.equal(t.getStatus(),'running');
});
test('roster is true 70 vs 70 and 8 squads from authoritative state',()=>{
 const s=state(),t=observer();t.start(s);
 const r=t.getReport();
 assert.equal(r.initial.roster.length,140);
 assert.equal(r.initial.squadCount,8);
 assert.equal(JSON.stringify(r.initial.perSide),JSON.stringify({blue:70,red:70}));
 assert.equal(r.initial.seed,s.seed);
 assert.equal(r.gameVersionG8_4Verified,false);
});
test('observational starts are one-shot and wrong engine state is refused',()=>{
 const s=state(),t=observer();t.start(s);
 assert.throws(()=>t.start(s),/once/);
 assert.throws(()=>t.afterStep(state(),.08,80),/not tracking/);
});
test('invalid cap and frame inputs are rejected without engine edits',()=>{
 for(const options of [{maxSamples:0},{sampleEveryTicks:0},{maxDecisions:-1},{maxCombat:70000},{sourceTag:''}]){
  assert.throws(()=>observer(options));
 }
 const s=state(),t=observer();t.start(s);
 const before=strictState(s);
 assert.throws(()=>t.afterStep(s,NaN,25),/dt/);
 assert.throws(()=>t.afterStep(s,.08,Infinity),/frameMs/);
 assert.equal(strictState(s),before);
});
test('passive observer does not alter native fixed-step tick cadence',()=>{
 const a=state(77),b=state(77),t=observer();t.start(b);
 for(let i=0;i<45;i++) {
  const dt=[.01,.04,.12,.08,.03][i%5];
  engine.step(a,dt);engine.step(b,dt);
  const before=strictState(b);t.afterStep(b,dt,dt*1000);
  assert.equal(strictState(b),before);
  assert.equal(strictState(a),strictState(b));
 }
 assert.ok(b.tick>0);
 assert.equal(t.getReport().framesObserved,45);
});
test('bounded frame sampling records actual positions and computed signature',()=>{
 const s=state(1900),t=observer({sampleEveryTicks:1,maxSamples:3});t.start(s);
 for(let i=0;i<12;i++){engine.step(s,.08);t.afterStep(s,.08,16.6)}
 const r=t.getReport();
 assert.equal(r.samples.length,3);
 assert.equal(r.dropped.samples,9);
 assert.match(r.samples[0].stateSignature,/^[0-9a-f]{8}$/);
 assert.equal(r.samples[0].squads.length,8);
});
test('real AI changes generate decision events but do not change engine state',()=>{
 const s=state(1600,'bow'),t=observer({sampleEveryTicks:5});t.start(s);
 for(let i=0;i<80;i++) {engine.step(s,.08);t.afterStep(s,.08,16.6);}
 const r=t.getReport();
 assert.ok(r.decisions.length>0,'Actual AI must have generated decisions');
 assert.ok(r.decisions.some(e=>e.ai&&e.after.decisionCount>e.before.decisionCount));
 assert.equal(r.ticksAdvanced,s.tick);
});
test('player-issued order is logged after real successful engine command',()=>{
 const s=state(),t=observer();t.start(s);
 assert.equal(engine.issueOrder(s,s.playerSquadId,'charge'),true);
 engine.step(s,.08);t.afterStep(s,.08,16);
 const r=t.getReport();
 assert.ok(r.decisions.some(e=>e.squadId===s.playerSquadId&&e.after.order==='charge'&&!e.ai));
});
test('real battlefield impact event read passively WITHOUT draining original queue',()=>{
 const s=state(),t=observer();t.start(s);
 const unit=s.soldiers.find(u=>u.team==='red');
 const actual=engine.damageSoldier(s,unit.id,10,{source:'player',zone:'body'});
 assert.ok(actual);
 const before=strictState(s);
 t.afterStep(s,.08,16);
 assert.equal(strictState(s),before,'Observer must not mutate hit events, damage or hp');
 assert.equal(s.combatEvents.length,1);
 assert.equal(t.getReport().combat.length,1);
 assert.equal(t.getReport().combat[0].event.targetId,unit.id);
 assert.equal(engine.drainCombatEvents(s).length,1,'Game still receives native hit');
 t.afterStep(s,.08,16);
 assert.equal(t.getReport().combat.length,1);
});
test('observer deduplicates repeated event references without changing the queue',()=>{
 const s=state(),t=observer();t.start(s);
 engine.damageSoldier(s,s.soldiers.find(u=>u.team==='red').id,10,{source:'player'});
 const n=s.combatEvents.length;
 t.afterStep(s,.08);t.afterStep(s,.08);
 assert.equal(t.getReport().combat.length,n);
 assert.equal(s.combatEvents.length,n);
});
test('maxCombat is bounded and dropped diagnostics remain honest',()=>{
 const s=state(),t=observer({maxCombat:1});t.start(s);
 const red=s.soldiers.filter(u=>u.team==='red').slice(0,2);
 for(const u of red)engine.damageSoldier(s,u.id,10,{source:'player'});
 t.afterStep(s,.08,15);
 assert.equal(t.getReport().combat.length,1);
 assert.equal(t.getReport().dropped.combat,1);
 assert.equal(s.combatEvents.length,2);
});
test('finishing requires real ArenaArmyBattle.snapshot but does not change state',()=>{
 const s=state(),t=observer();t.start(s);
 for(let i=0;i<25;i++){engine.step(s,.08);t.afterStep(s,.08,16)}
 const snap=engine.snapshot(s),before=strictState(s);
 const result=t.finish(s,snap);
 assert.equal(result.phase,'finished');
 assert.equal(JSON.stringify(result.finalSnapshot),JSON.stringify(snap));
 assert.equal(strictState(s),before);
 assert.equal(result.finalSnapshot.squads.length,8);
 assert.equal(result.gameVersionG8_4Verified,false);
});
test('final report is defensive copy, not a reference to native state',()=>{
 const s=state(),t=observer();t.start(s);
 const a=t.getReport(); a.initial.roster[0].hp=-100;
 assert.ok(s.soldiers[0].hp>0);
 assert.ok(t.getReport().initial.roster[0].hp>0);
});
test('finish, abort, wrong phase cannot mutate or restart battle',()=>{
 const s=state(),t=observer();t.start(s);
 const before=strictState(s);
 assert.throws(()=>t.finish(s,{}),/snapshot/);
 assert.equal(strictState(s),before);
 assert.equal(t.abort('discard'),true);
 assert.equal(t.abort('again'),false);
 assert.throws(()=>t.afterStep(s,.08),/not tracking/);
 assert.equal(t.getStatus(),'aborted');
});
test('recovered standalone build adds one script, while engine text stays identical',()=>{
 const built=integrate(original,telescope);
 assert.equal(validateInlineScripts(original),29);
 assert.equal(validateInlineScripts(built),30);
 const origEngine=scripts.find(x=>x.includes('root.ArenaArmyBattle=api'));
 const outScripts=[...built.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]);
 assert.equal(outScripts.find(x=>x.includes('root.ArenaArmyBattle=api')),origEngine);
 assert.equal(outScripts.find(x=>x.includes('root.ArenaWeaponBalance=api')),scripts.find(x=>x.includes('root.ArenaWeaponBalance=api')));
 assert.ok(built.includes("window.killTheKingArmyTelemetryReport = function()"));
 assert.ok(built.includes("meadowTraceCall('afterStep',meadowBattleState,dt);"));
 assert.ok(built.includes("meadowTraceCall('finish',meadowBattleState,summary,'match-results')"));
});
test('injector refuses reapplication, missing hook, or wrong source',()=>{
 const built=integrate(original,telescope);
 assert.throws(()=>integrate(built,telescope),/already instrumented/);
 assert.throws(()=>integrate(original.replace('ArenaArmyBattle.step(meadowBattleState,dt);',''),telescope),/step missing/);
 assert.throws(()=>integrate('not game',telescope),/Wrong G5.4/);
});
test('FFA default and original army mode toggles remain verbatim',()=>{
 const built=integrate(original,telescope);
 for(const line of ["let arenaMode = 'ffa';", "let arenaMap = 'castle';",'meadowBattleMode = false;',"bot.respawnTimer=Infinity",'ArenaArmyBattle.drainCombatEvents(meadowBattleState)']) {
  assert.ok(original.includes(line));assert.ok(built.includes(line));
 }
});
test('sample fingerprints match across repeated real seeded battles',()=>{
 const traces=[];
 for(let run=0;run<2;run++){
  const s=state(888,'musket'),t=observer({sampleEveryTicks:2});t.start(s);
  for(let i=0;i<50;i++){engine.step(s,.08);t.afterStep(s,.08,16)}
  traces.push(t.getReport().samples.map(x=>x.stateSignature));
 }
 assert.deepEqual(traces[0],traces[1]);
 assert.ok(traces[0].length>10);
});
for(const role of ['musket','pike','bow','sword']) {
 test('observed and unobserved REAL G5.4 engine produce byte-identical states for 120 ticks: '+role,()=>{
  const a=state(1740,role),b=state(1740,role),t=observer({sampleEveryTicks:8});t.start(b);
  for(let i=0;i<120;i++){
    if(i===8){engine.issueOrder(a,a.playerSquadId,'hold');engine.issueOrder(b,b.playerSquadId,'hold');}
    if(i===28){engine.issueOrder(a,a.playerSquadId,'advance');engine.issueOrder(b,b.playerSquadId,'advance');}
    engine.step(a,.08);engine.step(b,.08);
    const before=strictState(b);t.afterStep(b,.08,16.67);
    assert.equal(strictState(b),before);
    assert.equal(strictState(a),strictState(b),'State divergence at tick '+i);
    // Native game drains combat events for visual presentation every frame.
    assert.equal(JSON.stringify(engine.drainCombatEvents(a)),JSON.stringify(engine.drainCombatEvents(b)));
  }
  const snap=engine.snapshot(b),before=strictState(b);
  assert.equal(t.finish(b,snap).phase,'finished');
  assert.equal(strictState(b),before);
  assert.equal(JSON.stringify(engine.snapshot(a)),JSON.stringify(snap));
 });
}
