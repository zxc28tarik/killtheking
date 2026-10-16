import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {createNavigator}=require('../src/arena-navigation.js');
const solid=(x1,x2,z1,z2,h=5)=>({minX:x1,maxX:x2,minZ:z1,maxZ:z2,minY:0,maxY:h});
const make=(colliders=[],config={})=>createNavigator(colliders,[],{min:-15,max:15,step:2.5,upperEdge:50,...config});
const p=(x,z,y=0)=>({x,y,z});
test('solid walls block direct paths',()=>{
 const n=make([solid(-1,1,-6,6)]);
 assert.equal(n.clearSegment(p(-10,0),p(10,0)),false);
 const path=n.findPath(p(-10,0),p(10,0));
 assert.ok(path.length>2);
 let last=p(-10,0);
 for(const point of path){assert.equal(n.clearSegment(last,point),true,JSON.stringify(point));last=point;}
});
test('bot does not ghost through walls when stepping',()=>{
 const n=make([solid(-1,1,-7,7)]);
 let pos=p(-4,0);
 for(let i=0;i<30;i++)pos=n.safeAdvance(pos,{x:1,z:0},0.6);
 assert.ok(pos.x<-1,JSON.stringify(pos));
});
test('navigates around two offset obstacles',()=>{
 const n=make([solid(-5,-2,-15,3),solid(2,5,-3,15)]);
 const path=n.findPath(p(-12,10),p(12,-10));
 assert.ok(path.length>0);
});
test('unreachable actor stays put instead of going through wall',()=>{
 const n=make([solid(-1,1,-15,15)]);
 assert.equal(n.findPath(p(-10,0),p(10,0)).length,0);
});
test('world height ramps are sampled and too-steep jumps blocked',()=>{
 const ramps=[{minX:-2,maxX:2,minZ:0,maxZ:10,startY:0,endY:7,dir:'S'}];
 const n=createNavigator([],ramps,{min:-15,max:15,upperEdge:50});
 assert.equal(n.heightAt(0,5),3.5);
 assert.equal(n.clearSegment(p(0,0),p(0,10,7)),true);
 assert.equal(n.clearSegment(p(0,0),p(0,12)),false);
});
test('six bots can plan bounded A* routes',()=>{
 const n=make([solid(-1,1,-6,6)]);
 for(let i=0;i<6;i++)assert.ok(n.findPath(p(-10,i-3),p(10,3-i)).length>0);
});
test('main source integrates navigation and keeps free-for-all targets',()=>{
 const src=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(src,/ArenaNavigation\.createNavigator/);
 assert.match(src,/navigator\.safeAdvance\(/);
 assert.match(src,/navigator\.findPath\(/);
 assert.match(src,/chooseArenaTarget\(bot\)/);
 assert.match(html,/src\/arena-navigation\.js/);
 assert.ok(html.indexOf('src/arena-navigation.js')<html.indexOf('src/oyun.js'));
});
