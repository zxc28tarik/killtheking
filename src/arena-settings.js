/* Kill the King — optional local settings for offline HTML play.
 * No remote storage, telemetry or alteration to weapon/movement rules.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.ArenaSettings=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='killtheking.settings.v1';
 const DEFAULTS=Object.freeze({sensitivity:1,volume:.8,lowMotion:false,quality:'high'});
 const qualities=new Set(['low','medium','high']);
 function clamp(value,lo,hi,fallback){
  const n=Number(value);
  return Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):fallback;
 }
 function normalize(raw){
  const x=raw&&typeof raw==='object'?raw:{};
  return {
   sensitivity:Math.round(clamp(x.sensitivity,.3,2.5,1)*10)/10,
   volume:Math.round(clamp(x.volume,0,1,.8)*100)/100,
   lowMotion:x.lowMotion===true,
   quality:qualities.has(x.quality)?x.quality:'high'
  };
 }
 function load(storage){
  try{
   const value=storage?.getItem(KEY);
   return value?normalize(JSON.parse(value)):{...DEFAULTS};
  }catch(_){return {...DEFAULTS};}
 }
 function save(storage,settings){
  try{
   if(!storage||typeof storage.setItem!=='function')return false;
   storage.setItem(KEY,JSON.stringify(normalize(settings)));
   return true;
  }catch(_){return false;}
 }
 function pixelRatio(quality,dpr){
  const max=quality==='low'?1:quality==='medium'?1.5:2;
  return Math.max(.5,Math.min(clamp(dpr,.5,4,1),max));
 }
 return {KEY,DEFAULTS,normalize,load,save,pixelRatio};
});
