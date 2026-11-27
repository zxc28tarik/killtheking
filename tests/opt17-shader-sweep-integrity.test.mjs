import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const qa=read('qa/opt17_shader_sweep.mjs'),html=read('index.html');
test('OPT17 fixed view sweep uses actual Arena materials, active lights and visibility',()=>{
 for(const key of ['COURTYARD_SPAWNS[0]','COURTYARD_SPAWNS[3]','RAMPART_SPAWNS[0]',
 'scene.traverseVisible','o.layers.test(camera.layers)','new THREE.InstancedMesh(o.geometry,mat,1)',
 'new THREE.Mesh(o.geometry,mat)','stage.fog=scene.fog;stage.environment=scene.environment',
 "take('baseline'","take('sweep:'","take('repeat:'","assert.equal(m.sceneUnchanged,true)"])
  assert.ok(qa.includes(key),key);
});
test('OPT17 isolated instrumentation restores camera and render hooks, no production shader bypass',()=>{
 assert.match(qa,/renderer\.renderBufferDirect=oldDraw/);
 assert.match(qa,/camera\.position\.copy\(oldPosition\);camera\.quaternion\.copy\(oldQuaternion\)/);
 assert.doesNotMatch(qa,/checkShaderErrors\s*=\s*false/);
 assert.equal(html,read('playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html'));
 assert.doesNotMatch(html,/ktk-opt17-arena-sweep/);
});
