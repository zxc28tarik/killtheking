/* AK-02b: read-only archive audit. No edits to original G5.4 HTML. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const p=resolve('recovered/army/KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html');
const s=readFileSync(p,'utf8');
const patterns=[
 'id="meadow-army-hud"','id=\\"meadow-army-hud\\"',
 'meadow-army-hud','meadow-army-command',
 'meadow-army-demo-btn','updateMeadowArmyHud',
 'meadow-army-orders','meadow-army-map',
 'KeyJ','KeyK','KeyZ','KeyX','Digit7','Digit8','Digit9',
 'setFireMode(','setFormation(','setDestination('
];
const report={kind:'READ_ONLY_HISTORIC_G54_UI_AUDIT',
 bytes:Buffer.byteLength(s),sha256:createHash('sha256').update(s).digest('hex'),
 patterns:[]};
for(const q of patterns){
 const occurrences=[];let pos=0;
 while((pos=s.indexOf(q,pos))!==-1){
  const from=Math.max(0,pos-370),to=Math.min(s.length,pos+480);
  occurrences.push({offset:pos,excerpt:s.slice(from,to)});
  pos+=q.length;
  if(occurrences.length===5)break;
 }
 report.patterns.push({query:q,examples:occurrences});
}
assert(report.patterns.some(p=>p.query==='meadow-army-hud'&&p.examples.length>0),
 'Original real G5.4 HUD markup not found in original archive');
const selected=report.patterns.map(p=>({query:p.query,countAtLeast:p.examples.length,
 excerpts:p.examples.slice(0,3).map(e=>e.excerpt)}));
console.log('=== AK02B ORIGINAL G54 GAME CONTROL/UI AUDIT BEGIN ===');
console.log(JSON.stringify({bytes:report.bytes,sha256:report.sha256,selected},null,2));
console.log('=== AK02B ORIGINAL G54 GAME CONTROL/UI AUDIT END ===');
