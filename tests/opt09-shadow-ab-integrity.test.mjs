import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const qa=readFileSync(new URL('../qa/opt09_shadow_ab.mjs',import.meta.url),'utf8');
const yml=readFileSync(new URL('../.github/workflows/opt09_shadow_ab.yml',import.meta.url),'utf8');
test('OPT09 shadow A/B/A uses disposable QA page, restores original shadow policy',()=>{
 for(const s of ['shadowOnA','cached','shadowOnB',
 'originalAutoUpdate:renderer.shadowMap.autoUpdate',
 'renderer.shadowMap.autoUpdate=q.originalAutoUpdate',
 'renderer.shadowMap.needsUpdate=true',
 'renderer.render=oldRender',
 'renderer.renderBufferDirect=oldDraw',
 'const {enter,finish,...out}=q',
 'gl.getExtension',
 'EXT_disjoint_timer_query_webgl2'])assert.ok(qa.includes(s),s);
 assert.ok(!qa.includes("writeFileSync('index.html'"));
 assert.match(qa,/NEVER deploy this switch to production/);
 assert.match(yml,/max-parallel: 1/);
 assert.match(yml,/map: \[arena, meadow, siege\]/);
});
