import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const qa=readFileSync(new URL('../qa/opt_map_profile.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const playable=readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8');
test('OPT09 profiles spike gaps versus animation JS, renderer, simulation and Chrome task time',()=>{
 for(const piece of ['frameWork:[]','frameTimeline:[]','longtasks:[]','heapDrops:[]',
 'renderRoute:[]',"renderActiveMap=wrap('renderRoute',renderActiveMap)",
 'const liveAnimate=animate','animate=function(...args)',
 'previousCallbackMs:previousAnimateWork','PerformanceObserver.supportedEntryTypes',
 "await cdp.send('Performance.getMetrics')",'spikes500ms','callbackHeavyCandidates',
 'schedulingOrBrowserCandidates','longTaskCount','measuredGpuSamples'])
  assert.ok(qa.includes(piece),piece);
 assert.match(qa,/warning:'rAF gap is NOT GPU time/);
 assert.match(qa,/q\.stop=\(\)=>\{q\.active=false;longTaskObserver\?\.disconnect\(\)/);
});
test('OPT09 affects QA only, not approved game HTML or original army behavior',()=>{
 assert.equal(html,playable);
 assert.match(qa,/runActiveFrame|updateGame=wrap/);
 assert.ok(qa.includes('function frame(t)'));
 assert.ok(qa.includes("const map=process.env.KTK_MAP"));
});
