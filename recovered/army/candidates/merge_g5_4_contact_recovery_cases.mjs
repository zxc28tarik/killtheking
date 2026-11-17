import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const types=['musket','pike','bow','sword'],orders=['advance','hold'];
export function mergeCases(cases){
 assert(Array.isArray(cases)&&cases.length===8,'Exactly eight genuine CPU matches required');
 const seen=new Set(),sourceHash=cases[0].sourceHash;
 assert(/^[0-9a-f]{64}$/.test(sourceHash),'Bad source SHA-256');
 for(const c of cases){
  const k=c.role+':'+c.command;
  assert(types.includes(c.role)&&orders.includes(c.command),'Unknown scenario');
  assert(!seen.has(k),'Duplicate scenario: '+k);seen.add(k);
  assert.equal(c.format,'killtheking-g5.4-actual-candidate-case-v1');
  assert.equal(c.sourceHash,sourceHash,'Mixed engine revisions');
  assert.equal(c.seed,1600,'Different seeds cannot be called same-seed evidence');
  assert.equal(c.maxSeconds,600);
  assert(c.seconds>0&&c.seconds<=600);
  assert(c.naturalElimination===true,'Match did not naturally finish: '+k);
  assert(c.playerOrderPreserved===true,'Player order changed: '+k);
  assert(c.winner==='blue'||c.winner==='red'||c.winner==='draw');
  assert.equal(c.final.winner,c.winner);
  assert.equal(c.checkpoints[0].blue,70);
  assert.equal(c.checkpoints[0].red,70);
  if(c.winner==='blue')assert(c.final.blue>0&&c.final.red===0);
  if(c.winner==='red')assert(c.final.red>0&&c.final.blue===0);
  if(c.winner==='draw')assert(c.final.red===0&&c.final.blue===0);
 }
 const sorted=[...cases].sort((a,b)=>types.indexOf(a.role)-types.indexOf(b.role)||orders.indexOf(a.command)-orders.indexOf(b.command));
 return {format:'killtheking-g5.4-8-real-closure-regressions-v1',sourceHash,seed:1600,
  formerBaseline:'0/8 natural wins by 600s in untouched original G5.4',
  observedCandidate:'8/8 natural wins before 600s; elimination unchanged',
  summary:{cases:8,naturalWinners:8,noneUnresolved:0,
   totalSimulatedSeconds:Math.round(sorted.reduce((n,c)=>n+c.seconds,0)*100)/100,
   blueWins:sorted.filter(c=>c.winner==='blue').length,
   redWins:sorted.filter(c=>c.winner==='red').length,
   highestSeconds:Math.max(...sorted.map(c=>c.seconds))},
  cases:sorted,
  limitations:'One seed; scripted player orders; not GPU/WebGL; not latest G8.4; not mirrored side-swap series.'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const path=resolve(process.argv[2]);
 const files=process.argv.slice(3);
 const rows=files.map(f=>JSON.parse(readFileSync(resolve(f),'utf8')));
 const matrix=mergeCases(rows);
 mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(matrix,null,2)+'\n');
 console.log(JSON.stringify(matrix.summary));
}
