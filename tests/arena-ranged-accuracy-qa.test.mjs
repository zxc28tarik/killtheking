import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const T=require('../src/arena-telemetry.js');
const Q=require('../src/arena-qa-report.js');
const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');

test('AI accuracy is measured per real discharged shot and hit zone',()=>{
 const s=T.create();
 T.recordRangedShot(s,'musket','body');
 T.recordRangedShot(s,'musket',null);
 T.recordRangedShot(s,'musket','head');
 T.recordRangedShot(s,'archer','leg');
 T.recordRangedShot(s,'archer',null);
 assert.deepEqual(s.rangedFire.musket,
  {shots:3,hits:2,head:1,body:1,arm:0,leg:0});
 assert.deepEqual(s.rangedFire.archer,
  {shots:2,hits:1,head:0,body:0,arm:0,leg:1});
 const report=Q.summarize({bots:[],matchStandings:[],telemetry:T.snapshot(s)});
 assert.equal(report.rangedFireAccuracy.musket.accuracy,2/3);
 assert.equal(report.rangedFireAccuracy.archer.accuracy,1/2);
});
test('misses, invalid roles and absence of fire leave weapon balance unchanged',()=>{
 const s=T.create();
 assert.equal(T.recordRangedShot(s,'knight','head'),false);
 assert.equal(T.recordRangedShot(s,'musket','fantasy'),true);
 assert.equal(s.rangedFire.musket.shots,1);
 assert.equal(s.rangedFire.musket.hits,0);
 const report=Q.summarize({bots:[],matchStandings:[],telemetry:T.snapshot(T.create())});
 assert.equal(report.rangedFireAccuracy.archer.accuracy,null);
 assert.equal(report.rangedFireAccuracy.musket.accuracy,null);
});
test('new match resets all shot metrics, export is cloned from state',()=>{
 const s=T.create();
 T.recordRangedShot(s,'archer','head');
 const snapshot=T.snapshot(s);
 snapshot.rangedFire.archer.hits=999;
 assert.equal(s.rangedFire.archer.hits,1);
 T.reset(s);
 assert.deepEqual(T.snapshot(s),T.snapshot(T.create()));
});
test('game records hit only when actual triangle/box and wall test both agree',()=>{
 assert.match(source,/ArenaCombatHit3D\.resolveBot\(THREE/);
 assert.match(source,/ArenaCombatHit3D\.resolvePlayer\(THREE/);
 assert.match(source,/ArenaTelemetry\.recordRangedShot\(arenaTelemetry,bot\.role,/);
 assert.match(source,/hitConfirmed \? hit3d\.zone : null/);
 assert.match(source,/if \(!hitConfirmed\) return/);
});
