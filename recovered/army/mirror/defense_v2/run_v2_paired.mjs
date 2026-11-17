/** Source-bound authentic G5.4 baseline-vs-bounded 600s CPU battles. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {scenarioIndex,simulate,getEngine} from '../defense/protection_pilot.mjs';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../..');
export const paths={baseline:resolve(root,'mirror/arena-army-battle-true-side-swap.js'),
 bounded:resolve(root,'mirror/arena-army-battle-protection-v2-bounded.js')};
export const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
export function loadBounded(){
 const ctx=vm.createContext({console});
 vm.runInContext(readFileSync(resolve(root,'modules/weapon-balance.js'),'utf8'),ctx,{timeout:3000});
 vm.runInContext(readFileSync(paths.bounded,'utf8'),ctx,{timeout:3000});
 if(typeof ctx.ArenaArmyBattle?.create!=='function')throw Error('G5.4 motor could not load');
 return ctx.ArenaArmyBattle;
}
export function runPair(i){
 if(!Number.isInteger(i)||i<0||i>=12)throw Error('Scenario 0..11 expected');
 return {format:'ktk-g54-bounded-guard-native-v1',scenarioIndex:i,scenario:scenarioIndex[i],
  sourceSha256:{baseline:sha(paths.baseline),bounded:sha(paths.bounded)},
  baseline:simulate(getEngine('baseline'),scenarioIndex[i]),
  bounded:simulate(loadBounded(),scenarioIndex[i])};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const i=Number(process.argv[2]);const row=runPair(i);
 const dir=resolve(here,process.env.KTK_V2_OUT_DIR||'dist/replay');
 mkdirSync(dir,{recursive:true});const output=resolve(dir,'part_'+i+'.json');
 writeFileSync(output,JSON.stringify(row,null,2)+'\n');
 console.log(i,row.scenario,'baseline',row.baseline.winner,row.baseline.seconds,row.baseline.protectedPct,
  'bounded',row.bounded.winner,row.bounded.seconds,row.bounded.protectedPct);
}