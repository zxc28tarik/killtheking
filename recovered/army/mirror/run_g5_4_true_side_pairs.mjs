/** REAL G5.4 player-team swap trials. No post-hoc coordinate flip or synthetic victory. */
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'..');
export const ENGINE=resolve(here,'arena-army-battle-true-side-swap.js');
export const seeds=[1600,1776,2026,31415],roles=['musket','pike','bow','sword'],commands=['advance','hold'];
export const plan=seeds.flatMap(seed=>roles.flatMap(role=>commands.map(command=>({seed,role,command}))));
export const engineDigest=()=>createHash('sha256').update(readFileSync(ENGINE)).digest('hex');
export function loadEngine(){
 const ctx=vm.createContext({console});
 vm.runInContext(readFileSync(resolve(root,'modules/weapon-balance.js'),'utf8'),ctx,{timeout:3000});
 vm.runInContext(readFileSync(ENGINE,'utf8'),ctx,{timeout:3000});
 if(typeof ctx.ArenaArmyBattle?.create!=='function')throw Error('Missing real G5.4 army engine');
 return ctx.ArenaArmyBattle;
}
const alive=(state,team)=>state.squads.filter(s=>s.team===team).reduce((n,s)=>n+s.alive,0);
const checkpoint=state=>({tick:state.tick,seconds:Math.round(state.elapsed*100)/100,
 blueAlive:alive(state,'blue'),redAlive:alive(state,'red'),winner:state.winner??null,
 blueDecisions:state.squads.filter(s=>s.team==='blue').reduce((n,s)=>n+s.decisionCount,0),
 redDecisions:state.squads.filter(s=>s.team==='red').reduce((n,s)=>n+s.decisionCount,0)});
export function runOne(engine,{seed,role,command},team){
 if(!plan.some(p=>p.seed===seed&&p.role===role&&p.command===command)||!['blue','red'].includes(team))throw Error('Invalid scenario');
 const state=engine.create(seed,role,team),human=state.squads[state.playerSquadId];
 if(state.playerTeam!==team||human.team!==team||!human.playerControlled||
   state.squads.filter(s=>s.playerControlled).length!==1||state.soldiers.length!==140||
   state.squads.length!==8||alive(state,'blue')!==70||alive(state,'red')!==70)
  throw Error('Invalid real side swap / roster');
 if(!engine.issueOrder(state,human.id,command))throw Error('Human order rejected');
 const checkpoints=[checkpoint(state)];
 for(let i=0;i<7500&&!state.winner;i++){
  engine.step(state,.08);
  if(state.tick%750===0||state.winner)checkpoints.push(checkpoint(state));
 }
 if(checkpoints.at(-1).tick!==state.tick)checkpoints.push(checkpoint(state));
 if(human.team!==team||!human.playerControlled||human.order!==command)throw Error('Human order overwritten');
 const first=checkpoints[0],last=checkpoints.at(-1);
 return {team,playerSquadId:human.id,orderPreserved:true,initial:first,final:last,
  checkpoints,naturalWinner:last.winner,seconds:last.seconds,playerWon:last.winner===team,
  endedBeforeDeadline:last.winner!==null};
}
export function runPair(engine,c){
 const blue=runOne(engine,c,'blue'),red=runOne(engine,c,'red');
 return {...c,blue,red,contrastingPlayerWins:blue.playerWon!==red.playerWon,
  winnerStableAcrossSides:blue.naturalWinner===red.naturalWinner&&blue.naturalWinner!==null,
  unresolved:blue.naturalWinner===null||red.naturalWinner===null};
}
export function summarize(rows){
 const games=rows.flatMap(r=>[r.blue,r.red]);
 return {pairs:rows.length,battles:games.length,
  naturalWins:games.filter(g=>g.naturalWinner!=null).length,
  unresolved:games.filter(g=>g.naturalWinner==null).length,
  bluePlayerWins:rows.filter(r=>r.blue.playerWon).length,
  redPlayerWins:rows.filter(r=>r.red.playerWon).length,
  sameColorWinnerPairs:rows.filter(r=>r.winnerStableAcrossSides).length,
  opposingColorWinnerPairs:rows.filter(r=>r.blue.naturalWinner&&r.red.naturalWinner&&r.blue.naturalWinner!==r.red.naturalWinner).length,
  maxSeconds:Math.max(0,...games.map(g=>g.seconds)),
  playerSideSwapIsReal:true,strictGeometricMirrorVerified:false,gpuVerified:false,acceptedForRelease:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const start=Number(process.argv[2]),count=Number(process.argv[3]);
 if(!Number.isInteger(start)||start%4!==0||start<0||count!==4||start+4>32)
  throw Error('Usage: run_g5_4_true_side_pairs.mjs START 4 (START must be 0,4,...28)');
 const engine=loadEngine(),rows=[];
 for(const scenario of plan.slice(start,start+4)){
  const r=runPair(engine,scenario);rows.push(r);
  console.log(scenario.seed,scenario.role,scenario.command,
   'blue-player',r.blue.naturalWinner||'UNRESOLVED',r.blue.seconds,
   'red-player',r.red.naturalWinner||'UNRESOLVED',r.red.seconds);
 }
 const dest=resolve(here,'dist/mirror/part_'+start+'.json');
 mkdirSync(dirname(dest),{recursive:true});
 writeFileSync(dest,JSON.stringify({format:'ktk-g54-true-side-swap-v1',engineSha256:engineDigest(),
  start,count,rows,summary:summarize(rows)},null,2)+'\n');
 console.log('WROTE',dest);
}