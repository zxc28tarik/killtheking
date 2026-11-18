import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyRenderer,summarizeFrames,assessAcceptance}
 from './windows_acceptance_rules.mjs';

test('Windows native WebGL hardware GPU string is only likely until user signoff',()=>{
 const o=classifyRenderer({webglUnmasked:'ANGLE (NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0)'});
 assert.equal(o.kind,'LIKELY_HARDWARE');
 const v=assessAcceptance({renderer:{webglUnmasked:'NVIDIA RTX 4060'},
  manualEscape:{nativeReleased:true,phaseAfter:'paused'},
  samples:[{phase:'playing',webgl:{contextLost:false},
    performance:{averageFPS:87,onePercentLowFPS:62,p95FrameMs:20}}],
  end:{phase:'results',remaining:0,durationSeconds:240,
    scoreboardRows:7,elapsedWallSeconds:240}});
 assert.equal(v.finalDisposition,'MEASURED_HARDWARE_SESSION_PENDING_USER_SIGNOFF');
 assert.equal(v.publicationApproval,'NOT_GRANTED');
 assert.equal(v.performanceApproval,'NOT_DECIDED_NO_USER_APPROVED_FPS_THRESHOLD');
 assert.equal(v.checks.complete240GameSeconds,true);
 assert.equal(v.checks.nativeManualEscapeAndPause,true);
});

test('Software-emulated and Microsoft WARP GPU is never approved as native hardware',()=>{
 for(const s of ['Google SwiftShader','llvmpipe LLVM 17','Microsoft Basic Render Driver',
   'ANGLE (D3D11 WARP)', 'Mesa offscreen']){
   const v=assessAcceptance({renderer:{webglUnmasked:s},
     manualEscape:{nativeReleased:true,phaseAfter:'paused'},
     end:{phase:'results',remaining:0,durationSeconds:240,scoreboardRows:7}});
   assert.equal(v.gpu.kind,'SOFTWARE_OR_EMULATED',s);
   assert.equal(v.finalDisposition,'NOT_HARDWARE_GPU_ACCEPTANCE');
 }
});

test('Physical ESC unverified even if the game completes and hardware is likely',()=>{
 const v=assessAcceptance({renderer:{webglUnmasked:'Intel UHD Graphics'},
  manualEscape:{nativeReleased:false,phaseAfter:'paused'},
  end:{phase:'results',remaining:0,durationSeconds:240,scoreboardRows:7}});
 assert.equal(v.checks.nativeManualEscapeAndPause,false);
 assert.equal(v.finalDisposition,'MANUAL_OR_FULL_ROUND_GATE_OPEN');
});

test('End-of-round needs exactly 240s, zero remaining, results phase and seven rows',()=>{
 const renderer={webglUnmasked:'AMD Radeon RX 7800 XT'};
 for(const end of [
   {phase:'playing',remaining:1,scoreboardRows:0,durationSeconds:240},
   {phase:'results',remaining:.05,scoreboardRows:7,durationSeconds:240},
   {phase:'results',remaining:0,scoreboardRows:6,durationSeconds:240},
   {phase:'results',remaining:0,scoreboardRows:7,durationSeconds:120}
 ]){
   const v=assessAcceptance({renderer,manualEscape:{
     nativeReleased:true,phaseAfter:'paused'},end});
   assert.equal(v.checks.complete240GameSeconds,false);
 }
});

test('Interrupted real-render session and lost WebGL context cannot count as continuous',()=>{
 for(const sample of [
   {phase:'paused',webgl:{contextLost:false}},
   {phase:'playing',webgl:{contextLost:true}}
 ]){
   const v=assessAcceptance({renderer:{webglUnmasked:'Intel Iris Xe'},
     manualEscape:{nativeReleased:true,phaseAfter:'paused'},
     end:{phase:'results',remaining:0,durationSeconds:240,scoreboardRows:7},
     samples:[sample]});
   assert.equal(v.checks.continuousObservedRun,false);
 }
});

test('Performance aggregates are observational, not fabricated thresholds',()=>{
 const a=summarizeFrames([
   {performance:{averageFPS:60,onePercentLowFPS:45,p95FrameMs:20}},
   {performance:{averageFPS:30,onePercentLowFPS:20,p95FrameMs:51}},
   {performance:{averageFPS:null,onePercentLowFPS:NaN,p95FrameMs:undefined}}
 ]);
 assert.equal(a.validFPSObservations,2);
 assert.equal(a.averageObservedFPS,45);
 assert.equal(a.minimumObservedFPS,30);
 assert.equal(a.minimumObservedOnePercentLowFPS,20);
 assert.equal(a.maximumObservedP95FrameMs,51);
 assert.equal(summarizeFrames([]).averageObservedFPS,null);
});

test('WebGL software takes priority even if CDP lists physical GPU',()=>{
 const o=classifyRenderer({webglUnmasked:'SwiftShader',
   gpuDevices:[{deviceString:'NVIDIA GeForce RTX 4060'}]});
 assert.equal(o.kind,'SOFTWARE_OR_EMULATED');
});
