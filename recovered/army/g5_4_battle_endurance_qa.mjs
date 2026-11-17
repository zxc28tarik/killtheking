/**
 * G5.4 endurance audit; executes the ACTUAL recovered 140-soldier engine.
 * This tool does not modify AI, physics or match-winner logic.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEngine} from './run_g5_4_extended_trials.mjs';
import {runExtendedBattle} from './g5_4_long_battle_diagnostics.mjs';

const HERE=dirname(fileURLToPath(import.meta.url));
const CLASSES=['musket','pike','bow','sword'];
const COMMANDS=['advance','hold'];
export function classifyClosure({checkpoints,ticks,simulatedSeconds,analysis}) {
 if(!Array.isArray(checkpoints)||checkpoints.length<2)throw Error('Missing actual snapshots');
 const first=checkpoints[0],last=checkpoints.at(-1);
 if(first.at!==0||first.blueAlive!==70||first.redAlive!==70)throw Error('Not a real 70v70 start');
 for(let i=1;i<checkpoints.length;i++){
  const a=checkpoints[i-1],b=checkpoints[i];
  if(b.at<=a.at||b.blueAlive>a.blueAlive||b.redAlive>a.redAlive||
     b.blueAlive<0||b.redAlive<0)throw Error('Non-monotone casualty history');
 }
 if(Math.abs(simulatedSeconds-last.at)>.05)throw Error('Timeline mismatch');
 const winner=last.winner??null;
 if(![null,'blue','red','draw'].includes(winner))throw Error('Invalid native winner');
 if((winner==='blue'&&!(last.blueAlive>0&&last.redAlive===0))||
    (winner==='red'&&!(last.redAlive>0&&last.blueAlive===0))||
    (winner==='draw'&&!(last.blueAlive===0&&last.redAlive===0))||
    (winner===null&&(!last.blueAlive||!last.redAlive)))throw Error('Winner/elimination mismatch');
 const base=[...checkpoints].reverse().find(c=>c.at<=last.at-300+0.001);
 if(!base)throw Error('No final-300-second evidence');
 const lateLoss=(base.blueAlive-last.blueAlive)+(base.redAlive-last.redAlive);
 const complete=winner!==null;
 return {
  status:complete?'native-finished':last.at>=600?(lateLoss===0?'stalled-at-600':'unresolved-at-600'):'still-running',
  winner,releaseGatePassed:complete,seconds:last.at,ticks,
  blueAlive:last.blueAlive,redAlive:last.redAlive,
  casualtiesBlue:70-last.blueAlive,casualtiesRed:70-last.redAlive,
  casualtiesLast300s:lateLoss,
  orderChanges:analysis?.orderChanges??null,
  shortOrderReversals:analysis?.shortReversals??null,
  warning:complete?null:'Do not report a winner or draw: game is still running.'
 };
}
export function summarizeCases(cases){
 if(!Array.isArray(cases)||!cases.length)throw Error('Empty actual match matrix');
 const wins=cases.filter(x=>x.releaseGatePassed).length;
 return {
  cases:cases.length,totalSimulatedSeconds:cases.reduce((a,x)=>a+x.seconds,0),
  terminalMatches:wins,unresolvedMatches:cases.length-wins,
  noCasualtiesFinal300s:cases.filter(x=>x.casualtiesLast300s===0).length,
  releaseReady:wins===cases.length,
  g8_4SourceAvailable:false,g8_5RealMirrorMatches:0,
  limitations:'Actual G5.4 CPU engine, scripted orders, one seed; no WebGL or G8.4 test.'
 };
}
export function runEndurance({seed=1600,classes=CLASSES,commands=COMMANDS,duration=600,onCase=()=>{}}={}){
 if(!Number.isInteger(seed)||!Number.isInteger(duration)||duration<600||duration>600)
  throw new Error('Use the documented 600-second trial window');
 if(!classes.length||!commands.length||classes.some(c=>!CLASSES.includes(c))||
    commands.some(c=>!COMMANDS.includes(c)))throw Error('Unsupported class/order');
 const engine=loadEngine(),cases=[];
 for(const role of classes)for(const command of commands){
  const t=runExtendedBattle(engine,{role,command,seed,durationSeconds:duration,bucketSeconds:60,
    qualityOptions:{maxFindings:250}});
  const data={role,command,seed,...classifyClosure(t)};
  cases.push(data);onCase(data);
 }
 const source=readFileSync(resolve(HERE,'modules/arena-army-battle.js'));
 return {format:'ktk-g5.4-actual-engine-endurance-v1',
   engineSha256:createHash('sha256').update(source).digest('hex'),
   seed,secondsPerBattle:duration,summary:summarizeCases(cases),cases};
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 const out=resolve(process.argv[2]||resolve(HERE,'dist/G5_4_ENDURANCE_EVIDENCE.json'));
 const report=runEndurance({onCase:c=>console.log(c.role,c.command,c.status,c.blueAlive,c.redAlive)});
 mkdirSync(dirname(out),{recursive:true});
 writeFileSync(out,JSON.stringify(report,null,2)+'\n','utf8');
 console.log(JSON.stringify(report.summary,null,2));
 console.log('Evidence:',out);
 if(!report.summary.releaseReady)console.log('RELEASE BLOCKED: no natural match closure in the tested scenarios');
}
