/** G5.4 guard-v3 native CPU replay: use the proven v1 pilot event sampler unmodified. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {scenarioIndex,simulate} from '../defense/protection_pilot.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'../..');
const path=resolve(here,'../arena-army-battle-protection-v3-role-gated.js');
const reference=JSON.parse(readFileSync(resolve(here,'guard_v3_reference.json'),'utf8'));
export const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
export function engine(){
 if(hash(path)!==reference.sourceSHA256.v3)throw Error('Candidate engine changed: refusing stale reference match');
 const context=vm.createContext({console});
 vm.runInContext(readFileSync(resolve(root,'modules/weapon-balance.js'),'utf8'),context);
 vm.runInContext(readFileSync(path,'utf8'),context,{timeout:3000});
 if(!context.ArenaArmyBattle?.create||!context.ArenaArmyBattle?.step)
  throw Error('Missing original G5.4 battle implementation');
 return context.ArenaArmyBattle;
}
export function runOne(index){
 if(!Number.isInteger(index)||index<0||index>=scenarioIndex.length)throw Error('Scenario index must be 0..11');
 const scenario=scenarioIndex[index],data=simulate(engine(),scenario);
 return {format:reference.format,index,scenario,data,sourceSHA256:reference.sourceSHA256.v3};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const index=Number(process.argv[2]);
 const record=runOne(index);
 const destDir=resolve(here,process.env.KTK_GUARD_V3_OUT_DIR||'replay');
 mkdirSync(destDir,{recursive:true});
 const dest=resolve(destDir,'part_'+index+'.json');
 writeFileSync(dest,JSON.stringify(record,null,2)+'\n');
 console.log('NATIVE_G54',index,record.data.winner,record.data.seconds,record.data.protectedPct,dest);
}