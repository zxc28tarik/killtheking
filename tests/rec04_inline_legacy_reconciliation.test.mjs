import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
function inline(name){
 const matches=scripts.filter(s=>s.includes('root.'+name+'=api;'));
 assert.equal(matches.length,1,name+' must be in the actual playable exactly once');
 const ctx={};runInNewContext(matches[0],ctx);return ctx[name];
}
test('REC04 #28: playable duration choices and live scoreboard retained',()=>{
 const m=inline('ArenaMatch');
 assert.deepEqual(Array.from(m.DURATIONS),[120,240,480]);
 for(const n of m.DURATIONS){const match=m.create(n);m.begin(match);assert.equal(m.tick(match,n),true);assert.equal(match.phase,'results');}
 assert.match(html,/function renderLiveScoreboard\(\)/);
 assert.match(html,/function hideLiveScoreboard\(\)/);
});
test('REC04 #29/#31: telemetry remains live and counts stalled units even without waypoints',()=>{
 const t=inline('ArenaTelemetry'),s=t.create();
 t.sampleTargets(s,[{id:0,dead:false,arenaTargetType:'player',navStuck:3,navPath:[]}]);
 const report=t.snapshot(s);
 assert.equal(report.samples,1);assert.equal(report.targetSlots.player,1);assert.equal(report.stuckSamples['0'],1);
 assert.equal(typeof t.recordRangedShot,'function');
 assert.match(html,/killtheking-match-qa-v2/);
 assert.match(html,/ArenaTelemetry\.sampleTargets\(/);
 assert.match(html,/ArenaCharacterMotion\.turnToward\(/);
 const motion=inline('ArenaCharacterMotion');
 assert.ok(Math.abs(motion.turnToward(0,Math.PI,.05))<=.5);
});
test('REC04 #30/#32: existing recovery and current ranged cadence retained, no AI edits',()=>{
 const rec=inline('ArenaBotRecovery'),state=rec.create();
 let changed=false;
 for(let i=0;i<40;i++){const out=rec.advance(state,.1,{attempting:true,travel:0,targetKey:'bot:1'});if(out.retarget){changed=true;break;}}
 assert.equal(changed,true);assert.equal(rec.allows(state,'bot:1'),false);
 assert.match(html,/ArenaBotRecovery\.allows\(bot\.navRecovery/);
 const offense=inline('ArenaBotOffense');
 assert.equal(offense.nextCooldown('archer'),4);assert.equal(offense.nextCooldown('musket'),15);
});
test('REC04 #33–35/#38: weapon rules, bow recovery and true hit API',()=>{
 const w=inline('ArenaWeaponBalance');
 assert.equal(w.damage('musket','head'),135);assert.equal(w.damage('spear','head'),52.5);
 assert.equal(w.SHOT_INTERVAL.bow,4);assert.equal(w.SHOT_INTERVAL.musket,15);
 assert.equal(w.BOW_RECOVERY_SECONDS,1);assert.equal(w.BOW_MIN_DRAW_SECONDS,2);assert.equal(w.BOW_DRAW_SECONDS,3);
 assert.equal(w.bowCanDraw(0,.5),false);assert.equal(w.bowCanRelease(0,4,1.9),false);assert.equal(w.bowCanRelease(0,4,3),true);
 const hit=inline('ArenaCombatHit3D');
 assert.equal(typeof hit.resolveBot,'function');assert.equal(typeof hit.resolvePlayer,'function');
 assert.match(html,/ArenaCombatHit3D\.resolveBot\(/);assert.match(html,/ArenaCombatHit3D\.resolvePlayer\(/);
});
test('REC04 #36: 4v3 team assignment and friendly fire guard',()=>{
 const t=inline('ArenaTeams');const ids=Array.from({length:6},(_,i)=>t.teamForBot(i));
 assert.equal(ids.filter(x=>x==='blue').length+1,4);assert.equal(ids.filter(x=>x==='red').length,3);
 assert.equal(t.canDamage('tdm','blue','blue'),false);assert.equal(t.canDamage('tdm','blue','red'),true);
 assert.match(html,/ArenaTeams\.canDamage\(/);
});
test('REC04 #37/#39: frame metrics remain functional in actual playable',()=>{
 const p=inline('ArenaPerformance'),state=p.create(20);
 for(let i=0;i<20;i++)p.record(state,.02);
 const report=p.snapshot(state);assert.equal(report.averageFPS,50);assert.equal(report.onePercentLowFPS,50);
 assert.match(html,/ArenaPerformance\.record\(/);
});
test('REC04 #40: settings storage and pixel ratio limits retained',()=>{
 const a=inline('ArenaSettings');let value=null;
 const storage={getItem:()=>value,setItem:(_k,v)=>{value=v;}};
 assert.equal(a.save(storage,{sensitivity:1.5,volume:.4,lowMotion:true,quality:'medium'}),true);
 const actual=a.load(storage);assert.equal(actual.sensitivity,1.5);assert.equal(actual.volume,.4);assert.equal(actual.lowMotion,true);assert.equal(actual.quality,'medium');
 assert.equal(a.pixelRatio('low',3),1);assert.equal(a.pixelRatio('medium',3),1.5);assert.equal(a.pixelRatio('high',3),2);
});
test('REC04 #41/#42: old meadow layout replaced by current expanded layout',()=>{
 const m=inline('ArenaMeadowLayout');
 assert.equal(m.PREVIOUS_AREA_MULTIPLIER,20);assert.equal(m.AREA_MULTIPLIER,300);
 assert.ok(m.HALF>800);assert.ok(m.spec().boxes.length>0);
 assert.match(html,/function updateNearbyTuftsOptimized\(/);
});
