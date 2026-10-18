/* Lightweight performance diagnostics for the existing Three.js arena.
 * O(1) per frame, fixed-size sample ring. Sorting happens on explicit QA read.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaPerformance=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX_FRAMES=1800;
 function create(size=MAX_FRAMES){
  if(!Number.isInteger(size)||size<10||size>10000)throw Error('Invalid sample capacity');
  return {frames:new Float32Array(size),index:0,count:0};
 }
 function record(state,dtSeconds){
  if(!state||!Number.isFinite(dtSeconds)||dtSeconds<=0||dtSeconds>.5)return false;
  const ms=dtSeconds*1000;
  state.frames[state.index]=ms;
  state.index=(state.index+1)%state.frames.length;
  state.count=Math.min(state.count+1,state.frames.length);
  return true;
 }
 function snapshot(state,renderer=null){
  const vals=Array.from(state.frames.slice(0,state.count));
  if(!vals.length)return {
   sampleCount:0,averageFPS:null,onePercentLowFPS:null,
   p95FrameMs:null,p99FrameMs:null,drawCalls:null,triangles:null,
   geometries:null,textures:null
  };
  const sum=vals.reduce((v,x)=>v+x,0);
  vals.sort((a,b)=>a-b);
  const percentile=q=>vals[Math.min(vals.length-1,Math.max(0,Math.ceil(vals.length*q)-1))];
  const p95=percentile(.95),p99=percentile(.99);
  // 1% low FPS uses the mean frame time of the slowest 1%, not just the
  // 99th percentile; otherwise a single 100ms hitch could disappear.
  const tail=vals.slice(-Math.max(1,Math.ceil(vals.length*.01)));
  const onePercentLowMs=tail.reduce((sum,ms)=>sum+ms,0)/tail.length;
  const info=renderer&&renderer.info;
  return {
   sampleCount:state.count,
   averageFPS:Math.round((1000/(sum/vals.length))*10)/10,
   onePercentLowFPS:Math.round(1000/onePercentLowMs*10)/10,
   p95FrameMs:Math.round(p95*100)/100,
   p99FrameMs:Math.round(p99*100)/100,
   drawCalls:Number.isFinite(info?.render?.calls)?info.render.calls:null,
   triangles:Number.isFinite(info?.render?.triangles)?info.render.triangles:null,
   geometries:Number.isFinite(info?.memory?.geometries)?info.memory.geometries:null,
   textures:Number.isFinite(info?.memory?.textures)?info.memory.textures:null
  };
 }
 return {MAX_FRAMES,create,record,snapshot};
});
