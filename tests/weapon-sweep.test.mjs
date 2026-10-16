import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const W=require('../src/weapon-sweep.js');
const rayHit={kind:'bot',bot:{id:3},distance:2};
test('attack samples multiple animation frames, not instant button press',()=>{
 const s=W.begin('sword',5.5,0);
 assert.equal(s.elapsed,0);
 const hit=W.advance(s,.016,()=>rayHit);
 assert.equal(hit,null);
 assert.equal(s.resolved,false);
 const later=W.advance(s,.035,()=>rayHit);
 assert.equal(later.kind,'bot');
});
test('one swing never doubles damage at high FPS',()=>{
 const s=W.begin('sword',5.5);let calls=0,hits=0;
 for(let i=0;i<45;i++){const h=W.advance(s,.008,()=>{calls++;return rayHit;});if(h)hits++;}
 assert.equal(hits,1);assert.equal(s.resolved,true);
});
test('wall-first response blocks damage (no target past wall)',()=>{
 const s=W.begin('spear',8.2);let hits=0;
 for(let i=0;i<8;i++)if(W.advance(s,.035,()=>({kind:'world',distance:1})))hits++;
 assert.equal(hits,0);assert.equal(s.finished,true);
});
test('late target can be hit when blade reaches it',()=>{
 const s=W.begin('sword',5.5);let calls=0;
 let h=null;
 for(let i=0;i<9;i++){
   h=W.advance(s,.03,()=>++calls>12?rayHit:null);
   if(h)break;
 }
 assert.equal(h?.bot.id,3);
});
test('sword sweeps across camera frame while spear thrusts straight ahead',()=>{
 const left=W.pose('sword',5.5,0,.2),right=W.pose('sword',5.5,0,.8);
 assert.ok(left.x<0);assert.ok(right.x>0);
 const a=W.pose('spear',8.2,0,.15),b=W.pose('spear',8.2,0,.5);
 assert.ok(Math.abs(a.x)<.5);assert.ok(Math.abs(b.z)>Math.abs(a.z));
});
test('combo flips slash direction',()=>{
 assert.ok(W.pose('sword',5.5,1,.2).x>0);
 assert.ok(W.pose('sword',5.5,1,.8).x<0);
});
test('large frame steps are subdivided and active window checked',()=>{
 const s=W.begin('sword',5.5);let n=0;
 W.advance(s,.1,()=>{n++;return null;});
 assert.ok(n>=4); assert.ok(s.elapsed>.09);
});
test('barrel is a first-class contact and exactly once per swing',()=>{
 const s=W.begin('sword',5.5);
 const contact={kind:'barrel',barrel:{id:0}};
 const hit=W.advance(s,.09,()=>contact);
 assert.equal(hit.kind,'barrel');assert.equal(W.advance(s,.04,()=>contact),null);
});
test('player integration starts attack on click, resolves during animation',()=>{
 const src=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(src,/ArenaWeaponSweep\.begin\(/);
 assert.match(src,/ArenaWeaponSweep\.advance\(/);
 assert.ok(src.indexOf('ArenaWeaponSweep.advance(')>src.indexOf('function performPrimaryAttack()'));
 assert.ok(html.indexOf('src/weapon-sweep.js')<html.indexOf('src/oyun.js'));
});
