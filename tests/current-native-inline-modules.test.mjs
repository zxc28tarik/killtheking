// These tests execute the exact inline modules shipped in main/index.html.
// Historical src/ tests alone cannot detect regressions in the actual native FPS.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const modules=vm.createContext({});
const names=[];
for(const code of scripts){
 const m=code.match(/\broot\.(Arena\w+)\s*=/);
 if(!m)continue;
 assert.ok(!names.includes(m[1]),'Duplicate live module: '+m[1]);
 vm.runInContext(code,modules,{filename:m[1]+'.js',timeout:3000});
 names.push(m[1]);
}
const expected=['ArrowCollision','SpawnSafety','Navigation','CombatTactics','CombatDefense','MeleeContact','WeaponSweep','ModelWeaponContact','CharacterMotion','PlayerCollision','Match','QAReport','Telemetry','BotRecovery','BotOffense','BotDuel','BotBrain','WeaponBalance','CombatHit3D','Teams','Performance','Settings','MeadowGrass','MeadowLayout','ArmyBattle','ArmyRender'];
test('all native arena and army modules are present and executable exactly once',()=>{
 for(const name of expected)assert.ok(modules['Arena'+name],name);
});
test('shared weapon damage and cadence from current playable',()=>{
 const w=modules.ArenaWeaponBalance;
 assert.equal(w.SHOT_INTERVAL.bow,4);assert.equal(w.SHOT_INTERVAL.musket,15);
 assert.equal(w.damage('musket','body'),90);assert.equal(w.damage('musket','arm'),80);
 assert.equal(w.damage('dagger','body'),10);
 assert.equal(w.damage('bow','head',1),w.damage('bow','body',1)*1.5);
 assert.equal(w.bowCanDraw(0,.9),false);assert.equal(w.bowCanDraw(0,1),true);
 assert.equal(w.bowCanRelease(0,4,1.9),false);assert.equal(w.bowCanRelease(0,4,3),true);
});
test('match lifecycle and settings remain offline-safe',()=>{
 const m=modules.ArenaMatch,x=m.create(120);
 m.begin(x);m.tick(x,10);m.pause(x);m.tick(x,90);assert.equal(x.remaining,110);
 m.resume(x);assert.equal(m.tick(x,110),true);assert.equal(x.phase,'results');
 const s=modules.ArenaSettings;assert.equal(s.load({getItem(){throw Error('blocked');}}).sensitivity,1);
 assert.equal(s.normalize({sensitivity:99,volume:-1}).sensitivity,2.5);
 assert.equal(s.normalize({sensitivity:99,volume:-1}).volume,0);
});
const nav={heightAt:()=>0,walkableAt:()=>true,clearSegment:()=>true,isReachable:()=>true};
const decide=(role,x,extra={})=>modules.ArenaCombatTactics.plan({role,from:{x:0,y:0,z:0},target:{x,y:0,z:0},range:role==='pikeman'?5.8:role==='knight'?3.9:34,hasLineOfSight:true,navigator:nav,canSeeFrom:()=>true,seed:0,...extra});
test('legacy and newer tactical decisions coexist in the actual game',()=>{
 assert.equal(decide('knight',10).mode,'advance');assert.equal(decide('pikeman',1.5).mode,'retreat');
 assert.equal(decide('archer',5).mode,'retreat');assert.equal(decide('musket',18).mode,'hold');
 assert.equal(decide('archer',18,{hasLineOfSight:false,canSeeFrom:p=>p.z>0}).mode,'seek-shot');
 assert.equal(decide('archer',18,{seekCover:true,attackReady:false,underPressure:true,canSeeFrom:p=>p.z>=0}).mode,'take-cover');
 assert.equal(decide('archer',3,{navigator:{...nav,clearSegment:()=>false}}).mode,'hold');
 assert.equal(decide('knight',10,{flank:true}).mode,'flank');
});
test('newer character motion and contact features are not downgraded',()=>{
 const m=modules.ArenaCharacterMotion;
 const s=m.createState();m.update(s,.05,{role:'knight',travel:.36});const phase=s.phase;
 m.update(s,.05,{role:'knight',travel:0});assert.equal(s.phase,phase);
 assert.equal(typeof m.turnToward,'function');
 assert.equal(typeof modules.ArenaWeaponSweep.visualPose,'function');
 assert.equal(typeof modules.ArenaPlayerCollision.limitRampEntry,'function');
 assert.equal(typeof modules.ArenaNavigation.createNavigator,'function');
});
test('meadow area, deterministic grass and 70 versus 70 army are retained',()=>{
 const l=modules.ArenaMeadowLayout.spec(),g=modules.ArenaMeadowGrass,a=modules.ArenaArmyBattle;
 assert.equal(l.areaMultiplier,300);assert.equal(l.expansionMultiplier,15);
 const one=g.samplePositions(l.half,l.boxes,64,123),two=g.samplePositions(l.half,l.boxes,64,123);
 assert.ok(one.length>0);assert.equal(JSON.stringify(one),JSON.stringify(two));
 assert.deepEqual(Object.values(a.TYPES).map(x=>x.count),[10,25,15,20]);
 assert.equal(a.DEPLOYMENTS.length,8);
 assert.equal(typeof a.friendlyFireLaneBlocked,'function');
 assert.equal(typeof a.updatePersonalTactics,'function');
});
