import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const qa=readFileSync(new URL('../qa/opt11_render_ab.mjs',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/opt11_render_ab.yml',import.meta.url),'utf8');

test('OPT11 only modifies temporary QA draw interception, not production game files',()=>{
 for(const signature of [
  'targetOnA','targetOff','targetOnB',
  'const oldRender=renderer.render',
  'const oldDraw=renderer.renderBufferDirect',
  "if(hit&&q.phase==='targetOff')",
  'renderer.render=oldRender',
  'renderer.renderBufferDirect=oldDraw',
  "window.__opt11AB?.finish?.()",
  'assert.equal(report.phases.targetOff.meanTargetAllowed,0)'
 ])assert.ok(qa.includes(signature),signature);
 assert.doesNotMatch(qa,/writeFileSync\(['"]index\.html/);
 assert.doesNotMatch(qa,/renderer\.shadowMap\.autoUpdate\s*=/);
 assert.match(qa,/No production visibility/);
 assert.match(workflow,/max-parallel:\s*1/);
 for(const group of [
  '{map: meadow, target: grass}',
  '{map: meadow, target: army}',
  '{map: siege, target: architecture}',
  '{map: siege, target: army}'
 ])assert.ok(workflow.includes(group),group);
});
