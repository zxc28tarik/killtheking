import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../recovered/native-siege/native-siege-ground-garrison-v33.js',import.meta.url),'utf8');
const ctx={};vm.runInNewContext(source+'\nthis.AK33=KTKSiegeGroundGarrisonV33;',ctx);
const ak=ctx.AK33;
function mock(){
 const squads=[
  {id:0,team:'red',type:'musket',alive:10,x:-24,z:-31,playerControlled:false,fireMode:'free'},
  {id:1,team:'red',type:'pike',alive:25,x:-8,z:14},
  {id:2,team:'red',type:'bow',alive:15,x:8,z:84},
  {id:3,team:'red',type:'sword',alive:20,x:24,z:4},
  {id:4,team:'blue',type:'musket',alive:10},
  {id:5,team:'blue',type:'pike',alive:25},
  {id:6,team:'blue',type:'bow',alive:15},
  {id:7,team:'blue',type:'sword',alive:20}
 ];
 const soldiers=Array.from({length:140},(_,i)=>({
  id:i,team:i<70?'red':'blue',
  x:i<70?i-35:((i-70)%10)-5,
  z:i<70?30:-110,alive:true,hp:100
 }));
 const calls=[];
 const battle={issueOrder(){return true;},
  setDestination(state,id,x,z){
   calls.push({id,x,z});
   if(!state.mockAccept)return false;
   state.squads[id].routeGoal={x,z};
   return true;
  }
 };
 const state={soldiers,squads,elapsed:0,mockAccept:true,winner:null};
 return {state,battle,calls};
}
function makeThreat(state,x=-16,z=-65,n=6){
 for(let i=0;i<n;i++){const u=state.soldiers[70+i];u.x=x;u.z=z;}
}
test('AK33 never changes actor count, health, individual positions, weapons or damage',()=>{
 const {state,battle,calls}=mock();
 makeThreat(state);
 const originalPositions=state.soldiers.map(u=>[u.x,u.z,u.hp,u.alive]);
 const v=ak.create(state,battle);
 assert.equal(ak.update(v,{gateHp:575,gateOpen:false},{musketGateHeld:false}).realAcceptedRoutes,1);
 assert.equal(calls.length,1);
 assert.equal(state.squads[0].aiRole,'siege-ground-crossfire');
 assert.equal(state.squads[0].playerControlled,true);
 assert.deepEqual(state.soldiers.map(u=>[u.x,u.z,u.hp,u.alive]),originalPositions);
 assert.equal(state.soldiers.length,140);
 assert.equal(ak.status(v).noTeleport,true);
 assert.equal(ak.status(v).noElevationFiringClaim,true);
 assert.equal(ak.status(v).noNewShots,true);
});
test('AK33 follows actual threat flank and staged rear intrusion with path validation',()=>{
 const {state,battle,calls}=mock();
 const v=ak.create(state,battle);
 assert.equal(ak.preferred(ak.observe(state,{gateHp:600})).length,0);
 makeThreat(state,19,-62,5);
 let x=ak.observe(state,{gateHp:500});
 assert.equal(ak.preferred(x)[0],'eastGate');
 ak.update(v,{gateHp:500},{musketGateHeld:false});
 assert.deepEqual(calls[0],{id:0,x:24,z:-16});
 for(let i=0;i<4;i++)state.soldiers[70+i].z=58;
 state.elapsed=12;
 ak.update(v,{gateHp:350,gateOpen:true},{musketGateHeld:false});
 assert.deepEqual(calls[1],{id:0,x:29,z:28});
 assert.equal(ak.status(v).currentPost,'eastInner');
});
test('AK33 denied path is NOT a legal post and restores original captain authority',()=>{
 const {state,battle,calls}=mock();
 const v=ak.create(state,battle);
 makeThreat(state,-12,-61,5);
 state.mockAccept=false;
 ak.update(v,{gateHp:550},{musketGateHeld:false});
 assert.equal(calls.length,2,'both legitimate alternatives get one original plan attempt');
 assert.equal(v.rejected,2);
 assert.equal(v.accepted,0);
 assert.equal(state.squads[0].playerControlled,false);
 assert.equal(state.squads[0].siegeDefenseAIControlled,undefined);
 assert.equal(v.assigned,null);
});
test('AK33 yields emergency doctrine hold without override and is throttled',()=>{
 const {state,battle,calls}=mock();
 const v=ak.create(state,battle);
 makeThreat(state,15,-62,5);
 ak.update(v,{gateHp:300},{musketGateHeld:true});
 assert.equal(calls.length,0);
 assert.equal(v.protectedByDoctrine,true);
 state.elapsed=4;
 ak.update(v,{gateHp:280},{musketGateHeld:false});
 assert.equal(calls.length,1);
 state.elapsed=5;
 ak.update(v,{gateHp:280},{musketGateHeld:false});
 assert.equal(calls.length,1,'same stage and cooldown must not spam plans');
 state.elapsed=14;
 ak.update(v,{gateHp:100},{musketGateHeld:true});
 assert.equal(calls.length,1,'AK27 emergency hold has priority even after prior patrol');
});
test('AK33 is packaged inside original one-game siege only; HTML and playable identical',()=>{
 const h=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const p=readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8');
 assert.equal(h,p);
 assert.ok(h.includes(source));
 assert.match(h,/nativeSiegeGarrisonV33=nativeSiegeMode\?/);
 assert.match(h,/KTKSiegeGroundGarrisonV33\.update\(nativeSiegeGarrisonV33/);
 assert.match(h,/window\.ktkSiegeGroundGarrisonStatus=\(\)=>/);
 assert.equal((h.match(/<script\b/g)||[]).length,31);
});

test('AK33 every defender goal has real clearance from AK26 and AK31 stone',()=>{
 const source26=readFileSync(new URL('../recovered/native-siege/native-siege-defense-v26.js',import.meta.url),'utf8');
 const source31=readFileSync(new URL('../recovered/native-siege/native-siege-interior-v31.js',import.meta.url),'utf8');
 const world={};
 vm.runInNewContext(source26+'\nthis.F26=KTKSiegeFortificationV26;',world);
 vm.runInNewContext(source31+'\nthis.F31=KTKSiegeInteriorV31;',world);
 const blocks=[...world.F26.features,...world.F31.features];
 for(const [name,p] of Object.entries(ak.POSTS)){
  for(const f of blocks){
   const xClear=Math.abs(p.x-f.x)>f.w/2+3.4;
   const zClear=Math.abs(p.z-f.z)>f.d/2+3.4;
   assert.ok(xClear||zClear,
    'G5.4 3.4m route clearance violated: '+name+' / '+f.name);
  }
 }
});
