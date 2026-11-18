/** Kill the King Windows acceptance reporting: pure, independently testable helpers.
 * No gameplay changes, no external requests, no GPU-driver writes.
 */
const SOFTWARE=/(?:swiftshader|llvmpipe|softpipe|software rasterizer|microsoft basic render|d3d11 warp|\bwarp\b|mesa offscreen|gdi generic)/i;
const KNOWN_HARDWARE=/(?:nvidia|geforce|quadro|rtx\s*\d|gtx\s*\d|radeon|amd\s+graphics|intel.{0,36}(?:arc|iris|uhd|hd graphics)|adreno|apple\s+m[1-9])/i;

export function classifyRenderer({webglUnmasked='',webglRenderer='',gpuDevices=[]}={}){
 const devices=Array.isArray(gpuDevices)?gpuDevices:[];
 const strings=[webglUnmasked,webglRenderer,...devices.map(d=>
   [d.vendorString,d.deviceString].filter(Boolean).join(' '))];
 const combined=strings.join(' / ');
 if(SOFTWARE.test(combined))
   return {kind:'SOFTWARE_OR_EMULATED',reason:'Software rasterizer indicator found',details:combined.slice(0,700)};
 if(KNOWN_HARDWARE.test(combined))
   return {kind:'LIKELY_HARDWARE',reason:'Named physical GPU detected; user must confirm physical GPU and driver',details:combined.slice(0,700)};
 return {kind:'UNVERIFIED',reason:'Insufficient GPU vendor/renderer evidence',details:combined.slice(0,700)};
}
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const r=n=>Math.round(n*100)/100;
export function summarizeFrames(samples){
 const data=Array.isArray(samples)?samples:[];
 const fps=data.map(s=>s?.performance?.averageFPS).filter(n=>finite(n)&&n>=0);
 const oneLow=data.map(s=>s?.performance?.onePercentLowFPS).filter(n=>finite(n)&&n>=0);
 const p95=data.map(s=>s?.performance?.p95FrameMs).filter(n=>finite(n)&&n>=0);
 return {
   observationCount:data.length,
   validFPSObservations:fps.length,
   averageObservedFPS:fps.length?r(fps.reduce((a,b)=>a+b,0)/fps.length):null,
   minimumObservedFPS:fps.length?r(Math.min(...fps)):null,
   minimumObservedOnePercentLowFPS:oneLow.length?r(Math.min(...oneLow)):null,
   maximumObservedP95FrameMs:p95.length?r(Math.max(...p95)):null,
   note:'Sampled rolling in-game FPS metrics, NOT a hardware benchmark or fixed target approval'
 };
}
/** Strict observational gates. Never claim a manual or real-GPU pass without evidence. */
export function assessAcceptance({renderer={},manualEscape={},end={},samples=[]}={}){
 const gpu=classifyRenderer(renderer);
 const frames=summarizeFrames(samples);
 const escapeVerified=manualEscape.nativeReleased===true&&
   manualEscape.phaseAfter==='paused';
 const naturalEnd=end.phase==='results'&&
   end.remaining===0&&end.scoreboardRows===7&&
   end.durationSeconds===240;
 const contextLost=samples.some(s=>s.webgl?.contextLost===true);
 const interrupted=samples.some(s=>s.phase==='paused'||s.phase==='menu');
 const continuous=naturalEnd&&!interrupted&&!contextLost;
 return {
   gpu,frames,
   checks:{
     actualHardwareIdentified:gpu.kind==='LIKELY_HARDWARE',
     nativeManualEscapeAndPause:escapeVerified,
     complete240GameSeconds:naturalEnd,
     continuousObservedRun:continuous,
     noWebGLContextLoss:!contextLost,
     elapsedWallSeconds:end.elapsedWallSeconds??null
   },
   finalDisposition:gpu.kind==='SOFTWARE_OR_EMULATED'
     ?'NOT_HARDWARE_GPU_ACCEPTANCE'
     :gpu.kind!=='LIKELY_HARDWARE'
       ?'HARDWARE_IDENTITY_NOT_VERIFIED'
       :!escapeVerified||!continuous
         ?'MANUAL_OR_FULL_ROUND_GATE_OPEN'
         :'MEASURED_HARDWARE_SESSION_PENDING_USER_SIGNOFF',
   performanceApproval:'NOT_DECIDED_NO_USER_APPROVED_FPS_THRESHOLD',
   publicationApproval:'NOT_GRANTED',
   note:'A single real-machine session is evidence, not approval to merge PR #48 or publish.'
 };
}
