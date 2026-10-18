import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const P=require('../src/arena-performance.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('frame sample buffer has bounded capacity and rejects bogus time measurements',()=>{
 const s=P.create(10);
 for(const dt of [0,-1,NaN,Infinity,.6])assert.equal(P.record(s,dt),false);
 for(let i=0;i<110;i++)assert.equal(P.record(s,.016),true);
 assert.equal(s.count,10);
 assert.equal(s.index,0);
 assert.equal(s.frames.length,10);
 assert.throws(()=>P.create(3),/Invalid sample capacity/);
 assert.throws(()=>P.create(99999),/Invalid sample capacity/);
});
test('steady 60fps reflects both average FPS and 1% low',()=>{
 const s=P.create(100);
 for(let i=0;i<100;i++)P.record(s,1/60);
 const x=P.snapshot(s);
 assert.equal(x.sampleCount,100);
 assert.ok(Math.abs(x.averageFPS-60)<.2);
 assert.ok(Math.abs(x.onePercentLowFPS-60)<.2);
 assert.ok(x.p99FrameMs>16&&x.p99FrameMs<17);
});
test('outlier frames lower 1 percent low without altering game movement timestep',()=>{
 const s=P.create(100);
 for(let i=0;i<99;i++)P.record(s,1/60);
 P.record(s,.1);
 const result=P.snapshot(s);
 assert.ok(result.onePercentLowFPS<=10);
 assert.ok(result.averageFPS>50);
 assert.ok(result.p99FrameMs>16&&result.p99FrameMs<17);
});
test('small sample and no renderer return null metrics, no invented WebGL data',()=>{
 const s=P.create();
 const empty=P.snapshot(s);
 assert.equal(empty.sampleCount,0);
 assert.equal(empty.averageFPS,null);
 assert.equal(empty.drawCalls,null);
 P.record(s,.033);
 const one=P.snapshot(s);
 assert.ok(one.averageFPS>30);
 assert.equal(one.drawCalls,null);
});
test('drawcalls, triangles, geometry and texture count use renderer.info only',()=>{
 const s=P.create(20);
 P.record(s,.02);
 const result=P.snapshot(s,{info:{render:{calls:42,triangles:2300},
  memory:{geometries:120,textures:8}}});
 assert.deepEqual([result.drawCalls,result.triangles,result.geometries,result.textures],
  [42,2300,120,8]);
});
test('runtime captures unscaled frame samples and only sorts on explicit report read',()=>{
 assert.match(game,/ArenaPerformance\.record\(performanceSamples,rawDt\)/);
 assert.match(game,/window\.krunkerPerformanceReport = \(\) =>/);
 assert.match(game,/ArenaPerformance\.snapshot\(performanceSamples,renderer\)/);
 assert.match(game,/renderPerformance: window\.krunkerPerformanceReport\(\)/);
 assert.match(game,/if \(isGameActive && arenaMatch\.phase === 'playing'\) updateGame\(gameDt\)/);
 assert.ok(html.indexOf('src/arena-performance.js')<html.indexOf('src/oyun.js'));
});
