import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {limitRampEntry}=require('../src/player-collision.js');
const src=readFileSync(new URL('../recovered/native-siege/native-siege-wall-access-v32.js',import.meta.url),'utf8');
const ctx={};
vm.runInNewContext(src+'\nthis.WallAccess=KTKSiegeWallAccessV32;',ctx);
const access=ctx.WallAccess;
const close=(a,b,eps=1e-7)=>Math.abs(a-b)<=eps;

function mockInstall(){
 class Group{constructor(){this.children=[];}add(x){this.children.push(x);}}
 const group=new Group(),mat={};
 const mesh=(parent,x,y,z,w,h,d,material)=>{
  const m={position:{x,y,z},w,h,d,material,name:''};
  parent.add(m);return m;
 };
 const box=(x,y,z,w,h,d)=>({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,
  minZ:z-d/2,maxZ:z+d/2});
 return access.install({Group},group,mesh,box,{stone:mat,wood:mat});
}
test('AK32 gives exactly four continuous authentic 0-to-9m ramp slopes',()=>{
 assert.equal(access.validate(),true);
 assert.equal(access.rampSpec.length,4);
 for(const r of access.rampSpec){
  const x=(r.minX+r.maxX)/2;
  assert.ok(close(access.heightAt(r,x,r.maxZ),0));
  assert.ok(close(access.heightAt(r,x,r.minZ),9));
  assert.ok(close(access.heightAt(r,x,r.maxZ-13),4.5));
  assert.equal(access.heightAt(r,x+20,r.maxZ-10),null);
  for(let i=0;i<26*4;i++){
   const z=r.maxZ-i/4;
   const z2=r.maxZ-(i+1)/4;
   assert.ok(access.heightAt(r,x,z2)-access.heightAt(r,x,z)<.2);
  }
 }
});
test('AK32 authentic player ramp entry allows uphill movement, blocks impassable side teleports',()=>{
 for(const r of access.rampSpec){
  const x=(r.minX+r.maxX)/2, y=2.35;
  const groundAt=(a,b)=>access.heightAt(r,a,b)??0;
  // The ordinary FPS player sweeps 0.35m steps across a continuous slope.
  let from={x,y,z:r.maxZ+.8};
  for(let i=0;i<80;i++){
   const to={x,z:r.maxZ+.8-(i+1)*.3};
   const step=limitRampEntry({from,to,radius:.75,height:y,groundAt});
   assert.ok(close(step.z,to.z,0.002),r.ak32Name+' blocked straight uphill at '+i);
   from={x,y:y+groundAt(x,step.z),z:step.z};
  }
  // A runner outside the ramp side cannot jump horizontally into the 5m high middle.
  const z=(r.minZ+r.maxZ)/2;
  const side=limitRampEntry({
   from:{x:r.maxX+2.6,y,z},to:{x:r.maxX-.2,z},
   radius:.75,height:y,groundAt
  });
  assert.ok(side.x>r.maxX+.5,r.ak32Name+' incorrectly teleported into raised ramp');
 }
});
test('AK32 physical bridge and teeth are genuine projectile blockers without ground-level bot ghost walls',()=>{
 const built=mockInstall();
 assert.equal(built.ramps.length,4);
 assert.equal(built.bridgeCount,4);
 assert.equal(built.fourContinuousWalkableRamps,true);
 assert.equal(built.originalG54HighLevelAI,false);
 assert.ok(built.merlons>=20);
 assert.equal(built.rampVisualMeshes.length,80,'20 visible gradient treads per ramp');
 assert.equal(built.highCoverAndRampShotMeshes.length,
  built.solidMeshes.length+built.rampVisualMeshes.length);
 assert.equal(built.wallBoxes.length,built.realAabbCount);
 for(const b of built.wallBoxes)
  assert.ok(b.minY>2.65,'Elevated walls must NEVER block native ground-plane G5.4 movement');
 for(const r of built.ramps){
  assert.ok(built.wallBoxes.some(b=>b.minX<r.maxX&&b.maxX>r.minX&&
    b.minZ<=r.minZ&&b.maxZ>r.minZ&&b.maxY>=8.95),
   'Missing real walkable landing '+r.ak32Name);
 }
});
test('AK32 native siege module is inline; actual playable is one identical original game',()=>{
 const h=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const p=readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8');
 assert.equal(h,p);
 assert.ok(h.includes(src));
 assert.equal((h.match(/<script\b/g)||[]).length,31);
 assert.match(h,/nativeSiegeWallAccessV32=KTKSiegeWallAccessV32\.install\(/);
 assert.match(h,/window\.ktkSiegeWallAccessStatus=\(\)=>/);
 assert.match(h,/nativeSiegeWallAccessV32\.ramps\.filter\(r=>ramps\.includes\(r\)\)/);
 assert.ok(h.includes('if(!castleMapData.ramps.includes(r))castleMapData.ramps.push(r)'));
 assert.ok(h.includes('if(i>=0)castleMapData.ramps.splice(i,1)'));
 assert.equal((h.match(/\.\.\.nativeSiegeWallAccessV32\.highCoverAndRampShotMeshes/g)||[]).length,2);
 assert.equal((h.match(/\.\.\.nativeSiegeWallAccessV32\.wallBoxes/g)||[]).length,2);
 assert.equal((h.match(/nativeSiegeWallBoxes\.push\(\.\.\.nativeSiegeWallAccessV32\.wallBoxes\)/g)||[]).length,0,
  'Ground-plane red G5.4 route constrain must ignore elevated wall elements');
});