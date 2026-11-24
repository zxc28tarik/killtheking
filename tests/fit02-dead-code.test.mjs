import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const playable=readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8');
test('FIT02 removes unused declarations from the shipped runtime only',()=>{
 const scripts=[...root.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
 assert.equal(scripts.length,31);
 const runtime=scripts.slice(1).join('\n');
 for(const name of ['armorPlateTex','FRONT_RADIUS','skinMat','sleeveMat','enemyTracers']){
  assert.doesNotMatch(runtime,new RegExp('\\b'+name+'\\b'));
 }
 assert.equal(root,playable);
});
