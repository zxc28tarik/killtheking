import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createNavigator}=require('../src/arena-navigation.js');
const {plan}=require('../src/combat-tactics.js');
const p=(x,z,y=0)=>({x,y,z});
const box=(x1,x2,z1,z2)=>({minX:x1,maxX:x2,minY:0,maxY:6,minZ:z1,maxZ:z2});
const make=(colliders)=>createNavigator(colliders,[],{step:2.5,min:-15,max:15,upperEdge:50});

test('reachable detour even when direct path is blocked',()=>{
 const nav=make([box(-1,1,-6,6)]);
 assert.equal(nav.clearSegment(p(-10,0),p(10,0)),false);
 assert.equal(nav.isReachable(p(-10,0),p(10,0)),true);
 assert.ok(nav.findPath(p(-10,0),p(10,0)).length>0);
});
test('full wall separates navigation regions',()=>{
 const nav=make([box(-1,1,-15,15)]);
 assert.equal(nav.isReachable(p(-10,0),p(10,0)),false);
 assert.equal(nav.findPath(p(-10,0),p(10,0)).length,0);
 assert.equal(nav.isReachable(p(-10,0),p(-10,10)),true);
});
test('invalid endpoints are not made reachable by snapping to other cells',()=>{
 const nav=make([box(3,6,3,6)]);
 assert.equal(nav.isReachable(p(0,0),p(5,5)),false);
 assert.equal(nav.isReachable(p(0,0),p(100,100)),false);
});
test('blocked sight never selects disconnected firing position',()=>{
 const nav=make([box(-1,1,-15,15)]);
 const result=plan({role:'archer',from:p(-10,0),target:p(10,0),range:34,hasLineOfSight:false,navigator:nav,
    canSeeFrom:candidate=>candidate.x>0});
 assert.equal(result.mode,'advance');
});
test('ranged unit uses visible accessible firing position instead of disconnected area',()=>{
 const nav=make([box(-1,1,-15,15)]),from=p(-8,0);
 const result=plan({role:'musket',from,target:p(9,0),range:34,hasLineOfSight:false,navigator:nav,
    canSeeFrom:candidate=>candidate.z>=4 || candidate.x>0});
 assert.equal(result.mode,'seek-shot');
 assert.equal(nav.isReachable(from,result.goal),true);
 assert.ok(result.goal.x<0);
});
test('close retreat remains reachable without passing solid obstacles',()=>{
 const nav=make([box(-1,1,-15,15)]),from=p(-5,0);
 const result=plan({role:'pikeman',from,target:p(-3,0),range:5.8,hasLineOfSight:true,navigator:nav,
    canSeeFrom:()=>true});
 assert.ok(['retreat','hold'].includes(result.mode));
 if(result.goal)assert.equal(nav.isReachable(from,result.goal),true);
});
