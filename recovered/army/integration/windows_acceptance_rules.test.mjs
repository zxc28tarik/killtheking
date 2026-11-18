import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyRenderer,summarizeFrames,assessAcceptance}
 from './windows_acceptance_rules.mjs';

test('Windows native WebGL hardware GPU string is only likely until user signoff',()=>{
 const o=classifyRenderer({webglUnmasked:'ANGLE (NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0)'});
 assert.equal(o.kind,'LIKELY_HARDWARE');
 const v=assessAcceptance({renderer:{webglUnmasked:'NVIDIA RTX 4060'},
  manualEscape:{nativeReleased:true,phaseAfter:'paused',playerMovedCamera:true},
  samples:Array.from({length:48},(_,i)=>({phase:'playing',
    atWallSeconds:(i+1)*5,atGameSeconds:(i+1)*5,
    webgl:{contextLost:false},
    performance:{averageFPS:87,onePercentLowFPS:62,p95FrameMs:20}})),
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

test('Actual WebGL NVIDIA renderer is not mislabeled because CDP listed a backup SwiftShader',()=>{
 const a=classifyRenderer({webglUnmasked:'ANGLE (NVIDIA GeForce RTX 4060)',
   gpuDevices:[{deviceString:'NVIDIA GeForce RTX 4060'},
     {deviceString:'Google SwiftShader'}]});
 assert.equal(a.kind,'LIKELY_HARDWARE');
});

test('CDP list alone does not prove which GPU renders WebGL',()=>{
 const a=classifyRenderer({webglUnmasked:'WebKit WebGL',
   gpuDevices:[{deviceString:'NVIDIA RTX 4060'}]});
 assert.equal(a.kind,'UNVERIFIED');
});

test('A single benchmark sample never passes continuous 240s real-render gate',()=>{
 const a=assessAcceptance({renderer:{webglUnmasked:'NVIDIA RTX 4060'},
   manualEscape:{nativeReleased:true,phaseAfter:'paused'},
   samples:[{phase:'playing',atWallSeconds:240,atGameSeconds:240}],
   end:{phase:'results',remaining:0,scoreboardRows:7,
     durationSeconds:240,elapsedWallSeconds:240}});
 assert.equal(a.checks.complete240GameSeconds,true);
 assert.equal(a.checks.continuousObservedRun,false);
 assert.equal(a.finalDisposition,'MANUAL_OR_FULL_ROUND_GATE_OPEN');
});


test('Manual camera movement must be observed before granting measured physical session',()=>{
 const samples=Array.from({length:48},(_,i)=>({phase:'playing',
   atWallSeconds:(i+1)*5,atGameSeconds:(i+1)*5,
   webgl:{contextLost:false},performance:{averageFPS:60}}));
 const base={renderer:{webglUnmasked:'NVIDIA RTX 4070'},
   manualEscape:{nativeReleased:true,phaseAfter:'paused',
     playerMovedCamera:false},samples,
   end:{phase:'results',remaining:0,scoreboardRows:7,
     durationSeconds:240,elapsedWallSeconds:240}};
 const noCamera=assessAcceptance(base);
 assert.equal(noCamera.checks.physicalMouseCameraMovement,false);
 assert.equal(noCamera.finalDisposition,'MANUAL_OR_FULL_ROUND_GATE_OPEN');
 const fault=assessAcceptance({...base,
   manualEscape:{...base.manualEscape,playerMovedCamera:true},
   errors:['PAGE TypeError: bad runtime event']});
 assert.equal(fault.checks.noRuntimeJavaScriptErrors,false);
 assert.equal(fault.checks.continuousObservedRun,false);
 assert.equal(fault.finalDisposition,'MANUAL_OR_FULL_ROUND_GATE_OPEN');
});
