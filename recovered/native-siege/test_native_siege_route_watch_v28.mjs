/** AK28: six native wall routes and bounded G5.4 stalled siege captain recovery. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';
import {applyNativeSiegeRouteWatchV28} from './siege-route-patch-v28.mjs';
const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const source=readFileSync(new URL('./native-siege-route-watch-v28.js',import.meta.url),'utf8');
const ctx=vm.createContext({console});new vm.Script(source);vm.runInContext(source,ctx);
const W=vm.runInContext('KTKSiegeRouteWatchV28',ctx);
function fixture(){
 const types=[['musket',10],['pike',25],['bow',15],['sword',20]];
 const squads=[],soldiers=[];let id=0;
 for(const team of ['blue','red'])for(const [type,n] of types){
  const squad={id:id++,team,type,alive:n,playerControlled:team==='blue'&&type==='sword',
   x:type==='pike'?-8:type==='sword'?24:type==='musket'?-24:8,
   z:team==='blue'?-70:(type==='bow'?84:type==='musket'?-31:type==='pike'?14:4),
   order:'hold',routeGoal:null,commandRoute:[]};
  squads.push(squad);
  for(let i=0;i<n;i++)soldiers.push({id:soldiers.length,squadId:squad.id,team,type,
   x:squad.x+(i%5-2)*2,z:squad.z+Math.floor(i/5),hp:100,alive:true});
 }
 const state={squads,soldiers,elapsed:0,winner:null,playerSquadId:3};
 const doctrine={assigned:Object.create(null)};
 const rejected=new Set(),calls=[],routes=[];
 const battle={
  planSquadRoute:(state,from,to)=>{
   routes.push({from:{...from},to:{...to}});
   return [{x:to.x,z:to.z}];
  },
  setDestination:(state,id,x,z,onlyPlayer)=>{
   const s=state.squads[id];calls.push({id,type:s.type,team:s.team,x,z,onlyPlayer});
   if(rejected.has(s.type))return false;
   s.order='position';s.routeGoal={x,z};return true;
  }
 };
 const red=t=>squads.find(s=>s.team==='red'&&s.type===t);
 return {state,doctrine,battle,calls,routes,rejected,red};
}
test('AK28 probes six true native G5.4 paths without creating actors or mutating positions',()=>{
 const f=fixture();
 const before=f.state.soldiers.map(s=>[s.id,s.x,s.z,s.hp]);
 const watch=W.create(f.state,f.battle,f.doctrine);
 const t=W.status(watch);
 assert.equal(t.installed,true);
 assert.equal(t.actorCount,140);
 assert.equal(t.checkedFromLiveG54Colliders,true);
 assert.equal(t.originalBattleRouting,true);
 assert.equal(t.allRequiredRoutesClear,true);
 assert.equal(f.routes.length,6);
 assert.deepEqual(Object.keys(t.routeReadiness).sort(),
  ['frontPike','frontSword','posternPike','posternSword','rearPike','rearSword'].sort());
 assert.deepEqual(f.state.soldiers.map(s=>[s.id,s.x,s.z,s.hp]),before);
 assert.equal(t.maxReplansPerStage,2);
});
test('AK28 early garrison is observational only and never overwrites player or red captain AI',()=>{
 const f=fixture(),watch=W.create(f.state,f.battle,f.doctrine);
 for(let t=0;t<200;t+=5){
  f.state.elapsed=t;W.update(watch);
 }
 const score=W.status(watch);
 assert.equal(score.replans,0);assert.equal(score.releasedToOriginalAI,0);
 assert.equal(f.calls.length,0);
 assert.equal(f.red('pike').playerControlled,false);
 assert.equal(f.red('sword').playerControlled,false);
 assert.equal(f.state.squads[3].playerControlled,true);
});
test('AK28 invokes exactly original native red setDestination after physical 13.5s stall, not earlier',()=>{
 const f=fixture(),w=W.create(f.state,f.battle,f.doctrine),captain=f.red('pike');
 captain.playerControlled=true;captain.siegeDefenseAIControlled=true;
 captain.order='position';captain.routeGoal={x:-18,z:10};
 f.doctrine.assigned.pike={stage:'front',x:-18,z:10};
 const before=f.state.soldiers.map(s=>[s.x,s.z,s.hp]);
 f.state.elapsed=2;W.update(w);
 f.state.elapsed=12;W.update(w);
 assert.equal(f.calls.length,0,'do not interfere with native engine until the real stall threshold');
 f.state.elapsed=16;W.update(w);
 assert.equal(f.calls.length,1);
 assert.equal(f.calls[0].team,'red');
 assert.equal(f.calls[0].onlyPlayer,true,'genuine native captain authority');
 assert.equal(W.status(w).replans,1);
 assert.equal(W.status(w).noTeleport,true);
 assert.equal(W.status(w).noExtraDamage,true);
 assert.deepEqual(f.state.soldiers.map(s=>[s.x,s.z,s.hp]),before);
 f.state.elapsed=33;W.update(w);
 assert.equal(f.calls.length,2);
 f.state.elapsed=52;W.update(w);
 assert.equal(f.calls.length,2,'maximum two retries per stage, not endless reissue');
 assert.equal(f.state.squads[3].playerControlled,true);
});
test('AK28 rejected routes safely restore original red G5.4 autonomous AI after two failed attempts',()=>{
 const f=fixture(),w=W.create(f.state,f.battle,f.doctrine),captain=f.red('sword');
 captain.playerControlled=true;captain.siegeDefenseAIControlled=true;
 captain.order='position';captain.routeGoal={x:18,z:10};
 f.doctrine.assigned.sword={stage:'front',x:18,z:10};
 f.rejected.add('sword');
 f.state.elapsed=2;W.update(w);
 f.state.elapsed=17;W.update(w);
 assert.equal(w.routeFailures,1);
 assert.equal(captain.playerControlled,true,'first failure retains existing original route');
 f.state.elapsed=35;W.update(w);
 const stat=W.status(w);
 assert.equal(stat.routeFailures,2);
 assert.equal(stat.releasedToOriginalAI,1);
 assert.equal(captain.playerControlled,false);
 assert.equal(captain.siegeDefenseAIControlled,false);
 assert.equal(captain.routeGoal,null);
 assert.equal(f.doctrine.assigned.sword,undefined);
 assert.equal(stat.tracked.sword,undefined);
 assert.equal(stat.maxReplansPerStage,2);
 assert.equal(f.state.soldiers.length,140);
});
test('AK28 movement resets stalled-clock but not two-retries-per-stage; postern stage renews allowance',()=>{
 const f=fixture(),w=W.create(f.state,f.battle,f.doctrine),c=f.red('pike');
 c.playerControlled=true;c.siegeDefenseAIControlled=true;c.order='position';
 c.routeGoal={x:-5,z:50};
 f.doctrine.assigned.pike={stage:'postern',x:-5,z:50};
 f.state.elapsed=2;W.update(w);
 f.state.elapsed=18;W.update(w);
 assert.equal(w.replans,1);
 c.z+=8;
 f.state.elapsed=21;W.update(w);
 assert.equal(w.progressEvents,1,'real original captain advanced');
 f.state.elapsed=28;W.update(w);
 assert.equal(w.replans,1);
 f.state.elapsed=40;W.update(w);
 assert.equal(w.replans,2,'second replan after a later distinct stall');
 c.routeGoal={x:-7,z:76};
 f.doctrine.assigned.pike={stage:'rear',x:-7,z:76};
 f.state.elapsed=43;W.update(w);
 assert.equal(W.status(w).tracked.pike?.stage,'rear');
 assert.equal(W.status(w).tracked.pike?.attempts,0);
});
test('AK28 new original 29th-script overlay cannot silently patch unrelated games',()=>{
 assert.throws(()=>applyNativeSiegeRouteWatchV28('wrong script'),/verified native route/);
 const {html,manifest}=buildCanonical(original);
 const before=extractedScripts(original),after=extractedScripts(html);
 assert.equal(before.length,29);assert.equal(after.length,29);
 for(let i=0;i<28;i++)assert.equal(after[i],before[i],'protected original FPS script '+i);
 assert.doesNotThrow(()=>new vm.Script(after[28]));
 assert.equal(manifest.kind,'SINGLE_NATIVE_FPS_THREE_MAPS');
 assert.equal(manifest.oneRendererOneMovementEngine,true);
 assert.equal(manifest.oneLiveGameDocument,true);
 assert.equal(manifest.nativeArmyAndSiegeTroops,140);
 assert.equal(manifest.nativeSiegeV28.liveRouteProbes,6);
 assert.equal(manifest.nativeSiegeV28.boundedReplansPerDefenseStage,2);
 assert.equal(manifest.nativeSiegeV28.noDirectPositionWrites,true);
 assert(after[28].includes('window.ktkSiegeRouteWatchStatus='));
 assert(after[28].includes('KTKSiegeRouteWatchV28.update(nativeSiegeRouteWatchV28);'));
 assert(!html.includes('frame.srcdoc='));
});