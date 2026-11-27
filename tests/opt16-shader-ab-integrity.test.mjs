import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const qa=read('qa/opt16_shader_ab.mjs'),html=read('index.html');
test('OPT16 A/B uses real Arena factories, exact fog/light/environment and repeated rendering',()=>{
 for(const key of ['resetFreeForAllRound()','acquireEffectCube(kind,color,opacity,.45)','createPlayerArrowMesh()',
 'stage.fog=scene.fog;stage.environment=scene.environment','scene.traverseVisible','renderer.compile(stage,camera)',
 "take('first:'+kind","take('repeat:'+kind","assert.ok(m.hitNames.includes('first:'+kind"])
  assert.ok(qa.includes(key),key);
 assert.match(qa,/if\(mode==='prewarm'\)take/);
});
test('OPT16 diagnostics preserve shader validation and restore all hooks; canonical HTML unchanged',()=>{
 assert.doesNotMatch(qa,/checkShaderErrors\s*=\s*false/);
 assert.match(qa,/renderer\.renderBufferDirect=oldDraw/);
 assert.match(qa,/for\(const fn of restore.reverse\(\)\)fn\(\)/);
 assert.match(qa,/releaseParticle\(mesh\)/);
 assert.match(qa,/releaseArrow\(mesh\)/);
 assert.equal(html,read('playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html'));
 assert.doesNotMatch(html,/OPT16 actual|ktk-opt16-shader-ab/);
});
