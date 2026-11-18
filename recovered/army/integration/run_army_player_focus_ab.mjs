/** True 140-soldier G5.4 CPU AB: source-pinned player engagement patch.
 * 16 native matched pairs (32 complete wars). This is NOT browser/WebGL.
 */
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {patchArmyAggro,sha256,ORIGINAL_ARMY_SHA} from './player_target_hotfix.mjs';

const dir=dirname(fileURLToPath(import.meta.url));
const source=readFileSync(resolve(dir,'../mirror/arena-army-battle-true-side-swap.js'),'utf8');
const weapons=readFileSync(resolve(dir,'../modules/weapon-balance.js'),'utf8');
if(sha256(source)!==ORIGINAL_ARMY_SHA)throw Error('Unexpected original G5.4 source');
const fixed=patchArmyAggro(source);
const sourceHashes={baseline:sha256(source),playerFocus:sha256(fixed)};
export const scenarios=['musket','pike','bow','sword'].flatMap(role=>
 ['advance','hold'].flatMap(command=>
 ['blue','red'].map(team=>({seed:1600,role,command,team}))));
export function loadEngine(code){
 const ctx=vm.createContext({console});
 vm.runInContext(weapons,ctx,{timeout:2000});
 vm.runInContext(code,ctx,{timeout:2000});
 if(!ctx.ArenaArmyBattle?.step||!ctx.ArenaArmyBattle?.create)
  throw Error('Not the real G5.4 battle engine');
 return ctx.ArenaArmyBattle;
}
const alive=(state,team)=>state.squads.filter(s=>s.team===team)
 .reduce((sum,s)=>sum+s.alive,0);
export function runMatch(engine,scenario){
 const {seed,role,command,team}=scenario;
 const state=engine.create(seed,role,team);
 if(state.playerTeam!==team||state.soldiers.length!==140||state.squads.length!==8||
    state.squads[state.playerSquadId]?.team!==team||
    alive(state,'blue')!==70||alive(state,'red')!==70)
  throw Error('Not a genuine blue/red G5.4 70v70 army');
 if(!engine.issueOrder(state,state.playerSquadId,command))
  throw Error('Human order not accepted');
 let avatarHits=0;
 for(let tick=0;tick<7500&&!state.winner;tick++){
  engine.step(state,.08);
  const hits=engine.drainPlayerHits(state);
  if(!Array.isArray(hits))throw Error('Missing native human hit evidence');
  avatarHits+=hits.length;
 }
 const blueAlive=alive(state,'blue'),redAlive=alive(state,'red');
 const natural=(state.winner==='blue'&&redAlive===0)||
               (state.winner==='red'&&blueAlive===0);
 return {winner:state.winner||null,endedNaturally:natural,
   elapsed:Number(state.elapsed.toFixed(2)),
   blueAlive,redAlive,avatarHits,playerHealth:state.playerHealth,
   playerActive:state.playerActive,
   humanOrderPreserved:state.squads[state.playerSquadId].order===command};
}
export function measure(index){
 if(!Number.isInteger(index)||index<0||index>=scenarios.length)
  throw Error('Scenario index must be 0..15');
 const scenario=scenarios[index];
 return {format:'ktk-g54-human-target-ab-v1',index,scenario,sourceHashes,
  baseline:runMatch(loadEngine(source),scenario),
  playerFocus:runMatch(loadEngine(fixed),scenario)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const start=Number(process.argv[2]),count=Number(process.argv[3]);
 if(!Number.isInteger(start)||start<0||start%4!==0||count!==4||start+count>16)
  throw Error('Usage: node run_army_player_focus_ab.mjs 0|4|8|12 4');
 const rows=[];
 for(let i=start;i<start+count;i++){
  const r=measure(i);rows.push(r);
  console.log(i,r.scenario.role,r.scenario.command,r.scenario.team,
   'old',r.baseline.winner,r.baseline.elapsed,'new',r.playerFocus.winner,r.playerFocus.elapsed,
   'avatarHits',r.baseline.avatarHits,r.playerFocus.avatarHits);
 }
 const destDir=resolve(dir,'dist/player-focus');
 mkdirSync(destDir,{recursive:true});
 const dest=resolve(destDir,'part_'+start+'.json');
 writeFileSync(dest,JSON.stringify({format:'ktk-g54-human-target-shard-v1',start,count,
  sourceHashes,rows},null,2)+'\n');
 console.log('WROTE',dest);
}
