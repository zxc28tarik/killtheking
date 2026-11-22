/** CPU-only long-duration actual G5.4 trials. Default: 8×120 seconds. */
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {runExtendedBattle,aggregateExtendedTrials} from './g5_4_long_battle_diagnostics.mjs';
const root=dirname(fileURLToPath(import.meta.url));
export function loadEngine(){
  const context=vm.createContext({console});
  vm.runInContext(readFileSync(resolve(root,'modules/weapon-balance.js'),'utf8'),context,{timeout:3000});
  vm.runInContext(readFileSync(resolve(root,'modules/arena-army-battle.js'),'utf8'),context,{timeout:3000});
  if(typeof context.ArenaArmyBattle?.create!=='function'||typeof context.ArenaArmyBattle?.step!=='function')
    throw new Error('Expected actual G5.4 engine code');
  return context.ArenaArmyBattle;
}
export function runLongMatrix(engine,{durationSeconds=120,bucketSeconds=15}={}){
  const trials=[];
  for(const role of ['musket','pike','bow','sword']){
    for(const command of ['advance','hold']){
      const trial=runExtendedBattle(engine,{role,command,seed:1600,durationSeconds,bucketSeconds});
      trials.push(trial);
    }
  }
  return {format:'killtheking-g5.4-long-battle-matrix-v1',summary:aggregateExtendedTrials(trials),trials};
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
  const out=resolve(process.argv[2]||resolve(root,'G5_4_LONG_BATTLE_MATRIX.json'));
  const duration=process.argv[3]?Number(process.argv[3]):120;
  const matrix=runLongMatrix(loadEngine(),{durationSeconds:duration,bucketSeconds:15});
  mkdirSync(dirname(out),{recursive:true});
  writeFileSync(out,JSON.stringify(matrix,null,2)+'\n','utf8');
  console.log(JSON.stringify(matrix.summary,null,2));
}
