import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const __dirname = require('node:path').dirname(fileURLToPath(import.meta.url));
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { sweep, cylinderFraction } = require('../src/arrow-collision.js');
const from = { x: 0, y: 1.6, z: 0 };
const to = { x: 0, y: 1.6, z: 20 };
const bot = (z, dead=false) => ({ dead, mesh: { position: {x:0,y:0,z} } });
const barrel = z => ({ active: true, pos: {x:0,y:0,z} });
const wall = z => ({ object: { id:'stone' }, distance: z });

test('wall BEFORE target blocks all arrow damage', () => {
    const a = sweep(from,to,{ worldHit:()=>wall(6), bots:[bot(12)], barrels:[barrel(15)] });
    assert.equal(a.type,'world'); assert.equal(a.point.z,6);
});
test('target BEFORE wall receives hit', () => {
    const b = bot(4);
    const a = sweep(from,to,{ worldHit:()=>wall(15), bots:[b] });
    assert.equal(a.type,'bot'); assert.equal(a.target,b); assert.ok(a.point.z>=3 && a.point.z<=4);
});
test('nearest overlapping target wins independent of input ordering', () => {
    const a = sweep(from,to,{ bots:[bot(10),bot(3)] });
    assert.equal(a.type,'bot'); assert.ok(a.point.z<3);
});
test('barrel collision is swept and beats later bot', () => {
    const a = sweep(from,to,{ barrels:[barrel(6)],bots:[bot(10)] });
    assert.equal(a.type,'barrel'); assert.ok(a.point.z<6);
});
test('dead bots and inactive barrels do not collide', () => {
    const a = sweep(from,to,{ bots:[bot(4,true)], barrels:[{...barrel(5),active:false}] });
    assert.equal(a,null);
});
test('no hit returns null', () => assert.equal(sweep(from,to,{worldHit:()=>null, bots:[bot(30)]}),null));
test('head-height and vertical drop included in swept cylinder', () => {
    assert.equal(cylinderFraction({x:0,y:4,z:0},{x:0,y:1,z:0},{x:0,y:0,z:0},.9,0,3.1) !== null,true);
    assert.equal(cylinderFraction({x:1.1,y:2,z:0},{x:1.1,y:2,z:10},{x:0,y:0,z:4},.9,0,3.1),null);
});
test('ground crossing stops arrow before behind-ground target', () => {
    const a=sweep({x:0,y:1,z:0},{x:0,y:-1,z:20},{bots:[bot(17)]});
    assert.equal(a.type,'ground'); assert.ok(Math.abs(a.point.y-0.15)<1e-9);
});
test('stationary horizontal segment inside cylinder still hits', () => {
    assert.equal(cylinderFraction({x:0,y:4,z:4},{x:0,y:1,z:4},{x:0,y:0,z:4},.9,0,3.1)!==null,true);
});
test('arrow source uses collision resolver and removes frame-end-only overlap loops', () => {
    const js=fs.readFileSync(path.join(__dirname,'../src/oyun.js'),'utf8');
    const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
    assert.match(js,/ArenaArrowCollision\.sweep\(prevPos, arr\.mesh\.position/);
    assert.match(html,/src\/arrow-collision\.js/);
    assert.ok(html.indexOf('src/arrow-collision.js') < html.indexOf('src/oyun.js'));
    assert.doesNotMatch(js,/arr\.mesh\.position\.distanceTo\(b\.pos\.clone\(\)/);
});
