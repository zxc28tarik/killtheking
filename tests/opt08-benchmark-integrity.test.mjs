import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const historic=readFileSync(new URL('../qa/fixtures/army_render_pre_opt07.js',import.meta.url),'utf8');
const latest=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const bench=readFileSync(new URL('../qa/opt_army_stress.mjs',import.meta.url),'utf8');
const scripts=[...latest.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
const blob=s=>createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test('OPT08 historic 140-army render baseline is pinned, not a synthetic rewrite',()=>{
 assert.equal(blob(historic),'2bb9631a139e8646a2010a1653901ee4ed0088fb');
 assert.match(historic,/root\.ArenaArmyRender=api;/);
 assert.match(historic,/for\(let index=0;index<arrowCapacity;index\+\+\)/);
 assert.doesNotMatch(historic,/hiddenLastFrame/);
 assert.match(scripts[27],/root\.ArenaArmyRender=api;/);
 assert.match(scripts[27],/hiddenLastFrame/);
 assert.equal(scripts.length,31);
});
test('OPT08 CPU fixture exercises death density, projectile saturation and exact matrix parity',()=>{
 for(const code of ['dead:0,arrows:0','dead:35,arrows:0','dead:70,arrows:0',
  'dead:105,arrows:0','dead:140,arrows:0','dead:0,arrows:1',
  'dead:0,arrows:32','dead:0,arrows:96']){
  assert.ok(bench.includes(code),code);
 }
 assert.match(bench,/sameVisibleTransforms\(old,fresh,scenario\)/);
 assert.match(bench,/assert\.equal\(old\.monitor\.motionUpdates,fresh\.monitor\.motionUpdates/);
 assert.match(bench,/const soldiers=Array\.from\(\{length:140\}/);
 assert.match(bench,/assert\.equal\(newWrites\.arrow,scenario\.arrows\)/);
 assert.match(bench,/writeFileSync\('opt08-army-stress-report\.json'/);
 assert.equal(latest,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
