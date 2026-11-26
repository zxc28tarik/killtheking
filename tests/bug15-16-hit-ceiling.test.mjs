import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const ctx={console};
runInNewContext(readFileSync(new URL('../vendor/three-r128.js',import.meta.url),'utf8'),ctx);
for(const name of ['ArenaWeaponBalance','ArenaArmyBattle','ArenaPlayerCollision']){
 const script=scripts.find(s=>s.includes('root.'+name+'=api;'));assert.ok(script,name);runInNewContext(script,ctx);
}
const T=ctx.THREE;
const get=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert.ok(i>=0&&j>i);return html.slice(i,j)};
const shot=runInNewContext(get('function nearestMusketImpact(','// Ordered sampled blade contact')+'\nnearestMusketImpact;',ctx);
function mesh(x,data={}){
 const m=new T.Mesh(new T.BoxGeometry(1,2,2),new T.MeshBasicMaterial());m.position.set(x,1.5,0);
 m.userData=data;m.updateMatrixWorld(true);return m;
}
const origin=new T.Vector3(0,1.5,0),dir=new T.Vector3(1,0,0);
function setup(botX,barrelX,wallX){
 const b=mesh(barrelX,{barrelIndex:0}),soldier=mesh(botX,{botIndex:0});
 ctx.worldMeshes=wallX===undefined?[]:[mesh(wallX)];
 ctx.barrels=[{active:true,group:b}];ctx.bots=[{dead:false,mesh:soldier}];
 ctx.raycaster=new T.Raycaster();ctx.meadowBattleMode=false;ctx.meadowBattleState=null;
}
test('BUG15 first Arena target wins: bot, barrel, or wall',()=>{
 setup(5,10);assert.equal(shot(30,origin,dir).kind,'bot');
 setup(10,5);assert.equal(shot(30,origin,dir).kind,'barrel');
 setup(10,5,3);assert.equal(shot(30,origin,dir).kind,'world');
 ctx.worldMeshes=[];ctx.barrels[0].active=false;
 assert.equal(shot(30,origin,dir).kind,'bot');assert.equal(shot(3,origin,dir),null);
});
test('BUG15 real army bodies block a rear barrel, including friendly bodies',()=>{
 setup(99,10);
 const a=ctx.ArenaArmyBattle,s=a.create();ctx.meadowBattleMode=true;ctx.meadowBattleState=s;
 for(const u of s.soldiers)u.alive=false;
 const enemy=s.soldiers.find(u=>u.team==='red'),friend=s.soldiers.find(u=>u.team==='blue');
 Object.assign(enemy,{alive:true,x:5,z:0,siegeY:0});
 assert.equal(shot(30,origin,dir).kind,'army');
 Object.assign(friend,{alive:true,x:3,z:0,siegeY:0});
 assert.equal(shot(30,origin,dir).kind,'friendly');
 friend.alive=false;enemy.x=15;assert.equal(shot(30,origin,dir).kind,'barrel');
 ctx.worldMeshes=[mesh(2)];assert.equal(shot(30,origin,dir).kind,'world');
});
const physics=runInNewContext(get('function playerCeilingLimit(','// ============================================================================\n        // 12. SPEED LINES')+'\n({playerCeilingLimit,adjustPlayerHeight,resolvePlayerCollisions})',ctx);
const slab=(minY,maxY,minX=-3,maxX=3)=>({minX,maxX,minZ:-3,maxZ:3,minY,maxY});
function phys(y,h,vy,solids,x=0){
 ctx.player={pos:{x,y,z:0},vel:{x:0,y:vy,z:0},radius:.75,currentHeight:h,onGround:false};
 ctx.colliders=solids;ctx.jumpPads=[];ctx.getRampHeightAt=()=>0;return ctx.player;
}
test('BUG16 jumping hits underside and cancels upward velocity without teleport',()=>{
 const p=phys(2.35,2.35,10,[slab(2.6,2.8)]);
 physics.resolvePlayerCollisions(.05);
 assert.ok(p.pos.y<=2.6&&p.pos.y>2.59);assert.equal(p.vel.y,0);assert.equal(p.onGround,false);
 p.vel.y=30;physics.resolvePlayerCollisions(.05);assert.ok(p.pos.y<=2.6);
});
test('BUG16 nearest ceiling wins, outside footprint is not a ceiling, open sky unchanged',()=>{
 let p=phys(2.35,2.35,40,[slab(3.2,3.4),slab(2.8,3),slab(2.5,2.6,2,4)]);
 physics.resolvePlayerCollisions(.05);assert.ok(p.pos.y<=2.8&&p.pos.y>2.79);
 p=phys(2.35,2.35,10,[]);physics.resolvePlayerCollisions(.05);
 assert.equal(p.pos.y,2.85);assert.equal(p.vel.y,10);
});
test('BUG16 crouch under low roof preserves feet and prevents standing through it',()=>{
 const p=phys(1.35,1.35,0,[slab(1.8,2)]);
 physics.adjustPlayerHeight(2.35);assert.ok(p.pos.y<=1.8);assert.equal(p.pos.y-p.currentHeight,0);
 physics.adjustPlayerHeight(1.35);assert.equal(p.pos.y,1.35);
 ctx.colliders=[];physics.adjustPlayerHeight(2.35);assert.equal(p.pos.y,2.35);
});
test('BUG16 fast falling catches platform top and preserves normal landing',()=>{
 let p=phys(8,2.35,-100,[slab(3,3.2)]);
 physics.resolvePlayerCollisions(.05);assert.ok(Math.abs(p.pos.y-5.55)<1e-9);assert.equal(p.vel.y,0);assert.equal(p.onGround,true);
 p=phys(2.6,2.35,-10,[]);physics.resolvePlayerCollisions(.05);assert.equal(p.pos.y,2.35);assert.equal(p.onGround,true);
});
test('BUG15/16 live wiring and release parity',()=>{
 assert.match(html,/const impact=nearestMusketImpact\(cls.range,origin,dir\)/);
 assert.match(html,/adjustPlayerHeight\(THREE.MathUtils.lerp/);
 assert.equal(html,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
