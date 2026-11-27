import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function extract(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i,a);return html.slice(i,j);}
const make=runInNewContext(extract('function createFrameUiQueue(){','        const frameUiQueue=')+'\ncreateFrameUiQueue;', {});
const sync=runInNewContext(extract('function syncLiveScoreRows(','        function renderLiveScoreboard()')+'\nsyncLiveScoreRows;', {});
test('OPT15 four catch-up steps coalesce only the presentation, using latest speed and final game state',()=>{
 const q=make(),out=[];let simulated=0;
 for(let i=0;i<4;i++){simulated++;q.speed(100+i*20);q.radar();q.score();q.team();}
 q.flush(v=>out.push(['speed',v]),()=>out.push(['team',simulated]),()=>out.push(['score',simulated]),()=>out.push(['radar',simulated]));
 assert.deepEqual(out,[['speed',160],['team',4],['score',4],['radar',4]]);
 assert.equal(q.status().radarRequests,4);assert.equal(q.status().radarDraws,1);
 assert.equal(q.status().speedDraws,1);assert.equal(q.status().scoreDraws,1);
 q.flush(()=>assert.fail(),()=>assert.fail(),()=>assert.fail(),()=>assert.fail());
});
test('OPT15 clear and zero speed reset pending visuals; no stale cross-round state',()=>{
 const q=make();q.speed(200);q.radar();q.score();q.team();q.clear();
 q.flush(()=>assert.fail(),()=>assert.fail(),()=>assert.fail(),()=>assert.fail());
 q.speed(0);q.flush(v=>assert.equal(v,0),()=>assert.fail(),()=>assert.fail(),()=>assert.fail());
 assert.equal(q.status().speedDraws,1);
});
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.parent=null;this._text='';this._class='';this.writes=0;}
 get textContent(){return this._text;} set textContent(v){this._text=v;this.writes++;}
 get className(){return this._class;} set className(v){this._class=v;this.writes++;}
 appendChild(n){this.children.push(n);n.parent=this;}
 get lastElementChild(){return this.children.at(-1);}
 remove(){const a=this.parent.children;a.splice(a.indexOf(this),1);this.parent=null;}
}
test('OPT15 scoreboard reuses rows and cells with exact ranks, score, names, player style and size changes',()=>{
 let made=0;const doc={createElement:tag=>{made++;return new Node(tag);}},table=new Node('table');
 const a={isPlayer:true,values:[1,'★ Sen',3,0,'3.00']},b={isPlayer:false,values:[2,'🔴 Bot',1,2,'0.50']};
 sync(table,[a,b],doc);
 assert.equal(made,12);const first=table.children[0],cells=first.children.slice();
 const all=()=>table.children.flatMap(r=>[r,...r.children]);const writes=()=>all().reduce((n,x)=>n+x.writes,0);
 const before=writes();sync(table,[a,b],doc);assert.equal(writes(),before);assert.equal(made,12);
 sync(table,[{...b,values:[1,'🔴 Bot',5,2,'2.50']},{...a,values:[2,'★ Sen',3,0,'3.00']}],doc);
 assert.equal(table.children[0],first);assert.deepEqual(first.children,cells);
 assert.equal(first.className,'match-live-row');assert.equal(table.children[1].className,'match-live-row is-player');
 assert.deepEqual(first.children.map(c=>c.textContent),['1','🔴 Bot','5','2','2.50']);
 assert.equal(made,12);sync(table,[a],doc);assert.equal(table.children.length,1);
 assert.equal(table.children[0],first);assert.equal(first.className,'match-live-row is-player');
 sync(table,[a,b],doc);assert.equal(table.children.length,2);assert.equal(made,18);
});
test('OPT15 production route flushes after original substep logic, keeps 30Hz radar timer and canonical files',()=>{
 assert.match(html,/frameUiQueue\.flush\(renderSpeedLines,renderTeamHUD,renderLiveScoreboard,renderRadar\)/);
 assert.match(html,/radarRefreshElapsed %= 1 \/ 30;\s*frameUiQueue\.radar\(\)/);
 assert.match(html,/frameUiQueue\.clear\(\);\s*renderSpeedLines\(0\)/);
 assert.match(html,/updateGame\(sim-hold\*\.84,clock\)/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
