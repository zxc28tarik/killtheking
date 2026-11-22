/** AK-NATIVE-06 preservation and original G5.4 mechanical smoke test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const newer=readFileSync(new URL('./KillTheKing_AK_NATIVE_06_original_game_siege_map.html',import.meta.url),'utf8');
const older=readFileSync(new URL('./KillTheKing_AK_NATIVE_05_original_game_siege_map.html',import.meta.url),'utf8');
const scripts=s=>[...s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const a=scripts(newer),b=scripts(older);
function deploySource(text){
 const start=text.indexOf('function nativeSiegeDeployOriginalG54(');
 assert(start>=0);
 let n=0;
 for(let i=text.indexOf('{',start);i<text.length;i++){
  if(text[i]==='{')n++;
  if(text[i]==='}'&&!--n)return text.slice(start,i+1);
 }
 throw Error('Unterminated G5.4 siege deploy function');
}
function model(useOld=false){
 const c=vm.createContext({console});
 vm.runInContext(a[19],c,{timeout:5000});
 vm.runInContext(a[26],c,{timeout:5000});
 let fn=deploySource(a[28]);
 if(useOld)fn=fn.replace('outpost?-38','outpost?-13')
     .replace('outpost?-49.5','outpost?-53.5')
     .replace('Math.max(-43,Math.min(43','Math.max(-35,Math.min(35')
     .replace('u.z=outpost?Math.min(-45.6,deployedZ):deployedZ','u.z=deployedZ');
 vm.runInContext(fn.replace('function nativeSiegeDeployOriginalG54','function siegeDeploy'),c,{timeout:5000});
 const m=c.ArenaArmyBattle,s=m.create(1600,'sword','blue');c.siegeDeploy(s);
 m.setWorldObstacles(s,[
  {x:-26,y:3.5,z:-42,w:36,h:7,d:5},
  {x:26,y:3.5,z:-42,w:36,h:7,d:5},
  {x:0,y:3.5,z:-42,w:16,h:7,d:5},
  {x:0,y:1.55,z:-63,w:4,h:3.1,d:6},
  {x:-22,y:1.65,z:-70,w:4.4,h:3.3,d:5.5},
  {x:25.9,y:3.8,z:-62,w:.42,h:7.6,d:8},
  {x:30.1,y:3.8,z:-62,w:.42,h:7.6,d:8}
 ].map(t=>({...t,solid:true})));
 return {m,s};
}
test('28 original engine/visual/weapon scripts completely unchanged',()=>{
 assert.equal(a.length,29);assert.equal(b.length,29);
 for(let i=0;i<28;i++)assert.equal(a[i],b[i],String(i));
 assert.equal(createHash('sha256').update(a[26]).digest('hex'),
 '497c945c059b541fcf76231e7d9ff2983dd8b235e98d7b78b93e9ed52235c348');
});
test('genuine ten red muskets spawn outside south stone, 140 real IDs',()=>{
 const {s}=model();
 assert.equal(s.soldiers.length,140);assert.equal(s.squads.length,8);
 const guns=s.soldiers.filter(u=>u.team==='red'&&u.type==='musket');
 assert.equal(guns.length,10);
 assert(guns.every(u=>u.alive&&u.z<=-45.6&&u.x>=-43&&u.x<-30));
});
test('real 10-second original G5.4 natural simulation, new post vs prior post',()=>{
 const now=model(),old=model(true);
 for(let i=0;i<200;i++){now.m.step(now.s,.05);old.m.step(old.s,.05);}
 const live=s=>s.soldiers.filter(u=>u.alive&&u.hp>0&&u.team==='red'&&u.type==='musket').length;
 assert(live(now.s)>live(old.s),String(live(now.s))+'/'+live(old.s));
 assert.equal(now.s.soldiers.length,140);
});
test('post-breach tower counterfire still spends original musket cooldown',()=>{
 const s=a[28];
 assert.match(s,/const reload=ArenaArmyBattle\.TYPES\.musket\.cooldown/);
 assert.match(s,/u\.reload=reload/);
 assert.match(s,/hp:nativeSiegeGateOpen\?0:st\.ramHp/);
 assert.match(s,/hp:nativeSiegeGateOpen\?0:st\.catHp/);
 assert.doesNotMatch(s.slice(s.indexOf('function nativeSiegeDefenderCounterfire('),
 s.indexOf('function nativeSiegeDamageGate(')),/\|\|nativeSiegeGateOpen\|\|/);
});
test('ram and catapult lower their live collision and correctly reset next match',()=>{
 const s=a[28];
 for(const v of ['1.05','3.1','3.3'])assert(s.includes('maxY='+v));
 assert.match(s,/ArenaArmyBattle\.setWorldObstacles\(\s*meadowBattleState,nativeSiegeNativeBoxes\(\)\)/);
});
