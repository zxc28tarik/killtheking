import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const qa=readFileSync(new URL('../qa/opt08_army_live_stress.mjs',import.meta.url),'utf8');
const yaml=readFileSync(new URL('../.github/workflows/opt08_live_rig.yml',import.meta.url),'utf8');
test('OPT08 live original 140 soldier stress only mutates disposable QA browser state',()=>{
 for(const marker of ['state.soldiers.length!==140','isGameActive=false',
 'visual.update(state,1/60);syncArmyArrowDrawCount()',
 's.alive=original[i].alive;s.hp=original[i].hp','state.projectiles=oldProjectiles',
 'isGameActive=previousActive','if(state.projectiles!==oldProjectiles',
 "assert.equal(report.results.length,10)"])
  assert.ok(qa.includes(marker),marker);
 assert.ok(yaml.includes('map: [meadow, siege]'));
 assert.ok(yaml.includes('playwright@1.58.2'));
 assert.ok(!qa.includes("writeFileSync('index.html'"));
});

test('OPT10 live 140-soldier benchmark isolates real role-specific buffer uploads',()=>{
 for(const marker of ["entire-musket-role-dead","entire-sword-role-dead",
 "s.alive=c.role?s.type!==c.role:i<140-c.dead",
 "const shouldSkip=c.role?visual.roles[c.role].batches",
 "counters.skippedBatchUploads!==shouldSkip",
 "counters.uploadedBatches!==visual.drawBatches-1-shouldSkip"])
  assert.ok(qa.includes(marker),marker);
});
