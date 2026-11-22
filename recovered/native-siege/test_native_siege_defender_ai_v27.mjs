/** AK27 genuine red-G5.4 siege strategy with no teleport / false damage. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';
import {applyNativeSiegeDefenderDoctrineV27} from './siege-defender-patch-v27.mjs';

const source=readFileSync(new URL('./native-siege-defender-ai-v27.js',import.meta.url),'utf8');
const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const ctx=vm.createContext({console});new vm.Script(source);vm.runInContext(source,ctx);
const AI=vm.runInContext('KTKSiegeDefenderDoctrineV27',ctx);

function fixture(){
 const types=[['musket',10],['pike',25],['bow',15],['sword',20]];
 const squads=[],soldiers=[];
 let id=0;
 for(const team of ['blue','red'])
  for(const [type,count] of types){
   const squad={id:id++,team,type,alive:count,playerControlled:team==='blue'&&type==='sword',
    x:type==='pike'?-8:type==='sword'?24:type==='musket'?-24:8,
    z:team==='blue'?-70:(type==='bow'?84:type==='musket'?-31:type==='pike'?14:4),
    targetX:0,targetZ:0,aiRole:'original-g54',order:'advance',fireMode:'free'};
   squads.push(squad);
   for(let n=0;n<count;n++)soldiers.push({id:soldiers.length,
    squadId:squad.id,team,type,alive:true,hp:100,
    x:squad.x+(n%5-2)*2,z:squad.z+Math.floor(n/5)*.35});
  }
 const state={elapsed:0,winner:null,squads,soldiers,playerSquadId:3};
 const calls=[],rejections=new Set();
 const battle={
  issueOrder(a,i,order,onlyPlayer=true){
   const sq=a.squads[i];
   if(!sq||!sq.alive||onlyPlayer&&!sq.playerControlled)return false;
   calls.push({kind:'order',team:sq.team,type:sq.type,order});
   sq.order=order;sq.targetX=sq.x;sq.targetZ=sq.z;return true;
  },
  setDestination(a,i,x,z,onlyPlayer=true){
   const sq=a.squads[i];
   if(!sq||!sq.alive||onlyPlayer&&!sq.playerControlled||rejections.has(sq.type))return false;
   calls.push({kind:'route',team:sq.team,type:sq.type,x,z});
   sq.order='position';sq.routeGoal={x,z};sq.targetX=x;sq.targetZ=z;
   return true;
  }
 };
 return {state,battle,calls,rejections,red:t=>squads.find(s=>s.team==='red'&&s.type===t)};
}
const normal={gateHp:600,gateOpen:false,towerCrossed:0,towerAssigned:false};
test('AK27 garrison retains all 140 actors, original blue commander and pins real red bow reserve',()=>{
 const f=fixture();
 const identities=f.state.soldiers.map(u=>u.id);
 const locations=f.state.soldiers.map(u=>[u.x,u.z]);
 const runtime=AI.create(f.state,f.battle);
 const score=AI.update(runtime,normal);
 assert.equal(score.phase,'garrison');
 assert.equal(score.totalRealSoldiers,140);
 assert.equal(score.originalRearArcherCount,15);
 assert.equal(score.rearArchersAnchored,true);
 assert.equal(score.realDefensiveLeases,1,'only red bow reserve is held at garrison');
 assert.equal(f.red('bow').playerControlled,true);
 assert.equal(f.red('bow').siegeDefenseAIControlled,true);
 assert.equal(f.red('pike').playerControlled,false);
 assert.equal(f.red('sword').playerControlled,false);
 assert.equal(f.state.playerSquadId,3);
 assert.equal(score.playerSquadTeam,'blue');
 assert.equal(score.noAddedFirepower,true);
 assert.equal(score.noSoldierTeleports,true);
 assert.equal(score.noBlueOrderOverrides,true);
 assert.deepEqual(f.state.soldiers.map(u=>u.id),identities);
 assert.deepEqual(f.state.soldiers.map(u=>[u.x,u.z]),locations);
 assert(f.calls.every(c=>c.team==='red'));
});
test('AK27 reacts to real first damage with native G5.4 routes, no personal actor moves',()=>{
 const f=fixture(),r=AI.create(f.state,f.battle);
 const positions=f.state.soldiers.map(u=>[u.x,u.z,u.hp]);
 f.state.elapsed=2;
 const score=AI.update(r,{gateHp:540,gateOpen:false,towerCrossed:0});
 assert.equal(score.phase,'gate-response');
 assert.equal(score.phaseLevel,1);
 assert.equal(score.frontCommands,2);
 assert.equal(score.orders,2);
 assert.equal(score.realDefensiveLeases,3);
 assert.equal(f.red('pike').order,'position');
 assert.equal(f.red('pike').routeGoal.x,-18);
 assert.equal(f.red('sword').routeGoal.x,18);
 assert.equal(f.red('bow').order,'hold');
 assert.equal(f.red('musket').playerControlled,false,'original musket counterfire autonomy unchanged');
 assert.deepEqual(f.state.soldiers.map(u=>[u.x,u.z,u.hp]),positions,
  'Defensive commander can never teleport or damage a real soldier');
 assert(f.calls.filter(c=>c.kind==='route').every(c=>c.team==='red'));
 const duplicate=AI.update(r,{gateHp:540,gateOpen:false,towerCrossed:0});
 assert.equal(duplicate.orders,2,'no per-frame reissued position orders');
});
test('AK27 only falls back after living enemies physically enter the inner courtyard',()=>{
 const f=fixture(),r=AI.create(f.state,f.battle);
 f.state.elapsed=2;AI.update(r,{gateHp:530,gateOpen:false});
 f.state.elapsed=4;
 const score=AI.update(r,{gateHp:530,gateOpen:true,towerCrossed:0});
 assert.equal(score.phase,'gate-response','gate open alone never triggers rear retreat');
 assert.equal(score.fallbackCommands,0);
 // Real living original blue soldiers enter the interior; no fake timer trigger.
 for(const u of f.state.soldiers.filter(u=>u.team==='blue').slice(0,2)){
  u.x=4;u.z=39;
 }
 f.state.elapsed=6;
 const response=AI.update(r,{gateHp:0,gateOpen:true,towerCrossed:0});
 assert.equal(response.phase,'postern-fallback');
 assert.equal(response.fallbackCommands,2);
 assert.equal(f.red('pike').routeGoal.z,50);
 assert.equal(f.red('sword').routeGoal.z,50);
 assert.equal(response.rearCommands,0,'no instant rear-line jump before a physical postern arrival');
 // Simulate movement completed by the ORIGINAL G5.4 step (not by AI update).
 f.red('pike').x=-5;f.red('pike').z=49;
 f.state.elapsed=8;
 const reached=AI.update(r,{gateHp:0,gateOpen:true,towerCrossed:0});
 assert.equal(reached.phase,'rear-line');
 assert.equal(reached.rearCommands,1);
 assert.equal(f.red('pike').routeGoal.z,76);
 assert.equal(f.red('sword').routeGoal.z,50,
  'second melee company must still physically reach the postern');
 assert.equal(reached.posternArrivals,1);
 assert.equal(f.state.playerSquadId,3);
});
test('AK27 rejects blocked original routes without controlling or teleporting enemy squads',()=>{
 const f=fixture(),r=AI.create(f.state,f.battle);
 f.rejections.add('pike');
 const pike=f.red('pike'),old={x:pike.x,z:pike.z,order:pike.order};
 f.state.elapsed=2;
 const score=AI.update(r,{gateHp:530,gateOpen:false});
 assert.equal(score.orders,1);
 assert.equal(score.rejected,1);
 assert.equal(pike.playerControlled,false,'rejected tactical lease returned to native red AI');
 assert.equal(pike.siegeDefenseAIControlled,undefined);
 assert.deepEqual([pike.x,pike.z,pike.order],[old.x,old.z,old.order]);
 assert.equal(f.red('sword').playerControlled,true);
 assert.equal(score.deniedRoutes.includes('pike'),true);
 assert.equal(score.noSoldierTeleports,true);
});
test('AK27 requires original four defender roles and actual 140-soldier G5.4 authority',()=>{
 const f=fixture();
 assert.throws(()=>AI.create({squads:[],soldiers:[]},f.battle),/four REAL red/);
 assert.throws(()=>AI.create(f.state,{}),/authentic G5.4/);
 assert.throws(()=>applyNativeSiegeDefenderDoctrineV27('wrong native source'),/native siege defender anchor/);
});
test('AK27 canonical one-game build preserves first 28 exact native scripts, 3 maps, gate & machines',()=>{
 const {html,manifest}=buildCanonical(original);
 const now=extractedScripts(html),before=extractedScripts(original);
 assert.equal(before.length,29);assert.equal(now.length,29);
 for(let i=0;i<28;i++)assert.equal(now[i],before[i],'protected original FPS script '+i);
 assert.doesNotThrow(()=>new vm.Script(now[28]));
 assert.equal(manifest.kind,'SINGLE_NATIVE_FPS_THREE_MAPS');
 assert.equal(manifest.oneLiveGameDocument,true);
 assert.equal(manifest.oneRendererOneMovementEngine,true);
 assert.equal(manifest.nativeArmyAndSiegeTroops,140);
 assert(manifest.nativeSiegeV25.castleAreaFactor>=4);
 assert(manifest.nativeSiegeV25.mapAreaFactor>=8);
 assert.equal(manifest.nativeSiegeV26.physicalDefenseBoxes,19);
 assert.equal(manifest.nativeSiegeV27.noSoldierTeleports,true);
 assert.equal(manifest.nativeSiegeV27.genuineUnitRoutes,true);
 assert(html.includes('window.ktkSiegeDefenderDoctrineStatus='));
 assert(html.includes('nativeSiegeTowerCollapseStep(dt);'));
 assert(html.includes('KTKNativeUiV24.install(document)'));
 assert(!html.includes('frame.srcdoc='));
});