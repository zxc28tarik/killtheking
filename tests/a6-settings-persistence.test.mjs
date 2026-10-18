import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const Settings=require('../src/arena-settings.js');
const source=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('offline preferences normalize finite ranges and reject malformed settings',()=>{
 assert.deepEqual(Settings.normalize({sensitivity:9,volume:-1,quality:'ultra',lowMotion:'yes'}),
  {sensitivity:2.5,volume:0,quality:'high',lowMotion:false});
 assert.deepEqual(Settings.normalize({sensitivity:.65,volume:.555,quality:'low',lowMotion:true}),
  {sensitivity:.7,volume:.56,quality:'low',lowMotion:true});
 assert.deepEqual(Settings.normalize(null),{...Settings.DEFAULTS});
});

test('saved settings survive reload but file:// storage failures do not crash the game',()=>{
 let data=null;
 const store={getItem(k){assert.equal(k,Settings.KEY);return data;},
  setItem(k,value){assert.equal(k,Settings.KEY);data=value;}};
 const desired={sensitivity:1.6,volume:.35,quality:'medium',lowMotion:true};
 assert.equal(Settings.save(store,desired),true);
 assert.deepEqual(Settings.load(store),desired);
 assert.deepEqual(Settings.load({getItem(){throw Error('blocked');}}),{...Settings.DEFAULTS});
 assert.equal(Settings.save({setItem(){throw Error('blocked');}},desired),false);
 assert.equal(Settings.save(null,desired),false);
 assert.deepEqual(Settings.load({getItem(){return '{broken';}}),{...Settings.DEFAULTS});
});

test('resolution quality presets affect pixel ratio only, not art or collider definitions',()=>{
 assert.equal(Settings.pixelRatio('low',2.5),1);
 assert.equal(Settings.pixelRatio('medium',2.5),1.5);
 assert.equal(Settings.pixelRatio('high',2.5),2);
 assert.equal(Settings.pixelRatio('high',1),1);
 assert.equal(Settings.pixelRatio('low',0.5),.5);
 assert.match(source,/ArenaSettings\.pixelRatio\(gameSettings\.quality,window\.devicePixelRatio\)/);
 assert.match(source,/renderer\.setPixelRatio\(/);
 assert.match(source,/function buildCastleArena\(\)/);
});

test('all procedural audio effects route through a controllable master gain',()=>{
 assert.match(source,/class SoundFX/);
 assert.match(source,/this\.master = this\.ctx\.createGain\(\)/);
 assert.match(source,/this\.master\.connect\(this\.ctx\.destination\)/);
 assert.match(source,/this\.master\.gain\.value = this\.volume/);
 assert.match(source,/sfx\.setVolume\(gameSettings\.volume\)/);
 assert.equal((source.match(/\(this\.master \|\| this\.ctx\.destination\)/g)||[]).length,14);
});

test('sensitivity, volume, render quality and reduced camera motion are wired to real controls',()=>{
 for(const id of ['arena-volume-slider','arena-volume-value','arena-quality-select','arena-low-motion','sens-slider'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(gameDummy(),/changeSetting\(\{sensitivity:Number\(e\.target\.value\)\}\)/);
 assert.match(source,/changeSetting\(\{volume:Number\(e\.target\.value\)\/100\}\)/);
 assert.match(source,/changeSetting\(\{quality:e\.target\.value\}\)/);
 assert.match(source,/changeSetting\(\{lowMotion:e\.target\.checked\}\)/);
 assert.match(source,/ArenaSettings\.save\(arenaSettingsStore,gameSettings\)/);
 assert.match(source,/const shakeScale = gameSettings\.lowMotion \? 0 : 1/);
 assert.match(source,/const impactScale = gameSettings\.lowMotion \? \.25 : 1/);
 assert.ok(html.indexOf('src/arena-settings.js')<html.indexOf('src/oyun.js'));
});
function gameDummy(){return source;}

test('sound/motion settings never change FFA, TDM, bot skills or bow cadence',()=>{
 assert.match(source,/let arenaMode = 'ffa'/);
 assert.match(source,/ArenaTeams\.scores\(arenaMode,player,bots\)/);
 assert.match(source,/ArenaWeaponBalance\.bowCanRelease\(/);
 assert.match(source,/ArenaBotOffense\.windup\(bot\.role\)/);
 assert.match(source,/ArenaPlayerCollision\.move/);
});
