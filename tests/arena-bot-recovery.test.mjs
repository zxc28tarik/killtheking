import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const R=require('../src/arena-bot-recovery.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('continuous blocked time survives repeated route retries and remains measurable',()=>{
 const s=R.create();let replans=0;
 for(let i=0;i<25;i++){
  const a=R.advance(s,.1,{attempting:true,travel:0,targetKey:'bot:2'});
  if(a.replan)replans++;
  assert.equal(a.retarget,false);
 }
 assert.ok(s.blockedFor>=2.49,'the 2 second stuck QA threshold must be observable');
 assert.ok(replans>=2,'multiple route refresh opportunities');
 assert.ok(replans<7,'bounded refresh instead of every frame');
 assert.equal(s.replans,replans);
});

test('after sustained blocked path bot avoids only the unreachable opponent briefly',()=>{
 const s=R.create();let event=null;
 for(let i=0;i<33;i++){
  const a=R.advance(s,.1,{attempting:true,travel:0,targetKey:'bot:4'});
  if(a.retarget)event=a;
 }
 assert.deepEqual(event,{replan:true,retarget:true});
 assert.equal(s.retargets,1);
 assert.equal(R.allows(s,'bot:4'),false);
 assert.equal(R.allows(s,'bot:3'),true);
 assert.equal(R.allows(s,'player:player'),true);
 // A current retaliatory lock must respect the same avoid-key path.
 R.advance(s,2.6,{attempting:false});
 assert.equal(R.allows(s,'bot:4'),true);
});

test('hold position and actual movement never trigger a fake stall',()=>{
 const s=R.create();
 for(let i=0;i<200;i++)R.advance(s,.05,{attempting:false,travel:0,targetKey:'bot:0'});
 assert.equal(s.blockedFor,0);
 assert.equal(s.replans,0);
 for(let i=0;i<100;i++)R.advance(s,.05,{attempting:true,travel:.04,targetKey:'bot:0'});
 assert.equal(s.blockedFor,0);
 assert.equal(s.retargets,0);
});

test('successful short movement interrupts stuck accumulation and resets retry window',()=>{
 const s=R.create();
 for(let i=0;i<6;i++)R.advance(s,.1,{attempting:true,travel:0,targetKey:'bot:0'});
 assert.ok(s.blockedFor>.5);
 R.advance(s,.1,{attempting:true,travel:.05,targetKey:'bot:0'});
 assert.equal(s.blockedFor,0);
 assert.equal(s.replanCooldown,0);
 R.advance(s,.1,{attempting:true,travel:0,targetKey:'bot:0'});
 assert.equal(s.blockedFor,.1);
});

test('invalid time steps do not corrupt recover state, reset clears all transient state',()=>{
 const s=R.create();const initial=JSON.stringify(s);
 R.advance(s,-1,{attempting:true});
 R.advance(s,NaN,{attempting:true});
 R.advance(s,Infinity,{attempting:true});
 assert.equal(JSON.stringify(s),initial);
 for(let i=0;i<34;i++)R.advance(s,.1,{attempting:true,targetKey:'player:player'});
 assert.equal(R.allows(s,'player:player'),false);
 R.reset(s);
 assert.deepEqual(s,R.create());
});

test('engine uses collision-safe movement only and guards against same-frame stale attacks',()=>{
 assert.match(game,/navigator\.safeAdvance\(botGround, stepDir/);
 assert.match(game,/ArenaBotRecovery\.advance\(bot\.navRecovery, dt/);
 assert.match(game,/bot\.navStuck = bot\.navRecovery\.blockedFor/);
 assert.match(game,/if \(recovery\.replan\) \{[\s\S]*?bot\.navPath\.length = 0/);
 assert.match(game,/if \(recovery\.retarget\) \{[\s\S]*?arenaTarget = null/);
 assert.match(game,/ArenaBotRecovery\.allows\(bot\.navRecovery, 'bot:' \+ other\.id\)/);
 assert.match(game,/ArenaBotRecovery\.allows\(bot\.navRecovery, 'player:player'\)/);
 assert.doesNotMatch(game,/bot\.mesh\.position\.copy\([^)]*navRecovery/);
 assert.ok(html.indexOf('src/arena-bot-recovery.js')<html.indexOf('src/oyun.js'));
});

test('new match and respawn reset recovery state while FFA target rules remain in place',()=>{
 assert.match(game,/ArenaBotRecovery\.reset\(bot\.navRecovery\)/);
 assert.match(game,/arenaTargetCount\('player', null, bot\.id\) === 0/);
 assert.match(game,/chooseArenaTarget\(bot\)/);
 assert.match(game,/bot\.navRecovery: /g)===false;
});
