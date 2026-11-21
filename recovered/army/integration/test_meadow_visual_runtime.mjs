import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const dir=dirname(fileURLToPath(import.meta.url));
test('MAP2 visual patch is isolated to real decoded native G5.4 mode',()=>{
 const builder=readFileSync(resolve(dir,'build_three_mode_launcher.mjs'),'utf8');
 assert.match(builder,/const grassMark=/);
 assert.match(builder,/MAP2 grass anchor changed/);
 assert.match(builder,/ArenaMeadowGrass\.createInstancedTufts\(THREE,spec,2700\)/);
 assert.match(builder,/ArenaMeadowGrass\\.createNearbyTufts\\(THREE,12000\\)/);
 assert.match(builder,/ArenaMeadowGrass\\.updateNearbyTufts/);
 assert.match(builder,/MAP2 nearby variable anchor changed/);
 assert.match(builder,/MAP2 render anchor changed/);
 assert.match(builder,/frame\.srcdoc=visualArmy\.replace/);
 assert.match(builder,/else frame\.srcdoc=original/);
 assert.match(builder,/expectSource\(result,'army'\)!==expectSource\(twoModeHtml,'army'\)/);
});
test('visual patch does not add collision, movement or attack code',()=>{
 const builder=readFileSync(resolve(dir,'build_three_mode_launcher.mjs'),'utf8');
 const b=builder.slice(builder.indexOf('const grassMark='),builder.indexOf('const bytes=Uint8Array',builder.indexOf('const grassMark=')));
 assert.ok(!/setWorldObstacles|damageSoldier|\.step\(|colliders\.push|raycastSoldier/.test(b));
 assert.match(b,/scene\.add\(meadowNearGrass\)/);
});
