#!/usr/bin/env node
/**
 * Archive integrity smoke check for the recovered G5.4 HTML.
 * Source was reassembled from indexed Project text; original-byte identity NOT proven.
 * Syntax checks are not a substitute for GPU/WebGL playtesting.
 */
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {dirname, resolve} from 'node:path';
const sourcePath=resolve(process.argv[2]||'recovered/army/KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html');
const html=readFileSync(sourcePath,'utf8');
assert(html.startsWith('<!DOCTYPE html>'),'doctype missing');
assert(/<title>Kill the King — G5\.4 Hareketli Savunma Hattı<\/title>/.test(html),'not the G5.4 source');
assert(html.includes('ArenaArmyBattle'),'Army battle engine marker missing');
assert(html.trimEnd().endsWith('</body></html>'),'HTML tail missing');
assert(html.length>=1000000,'Truncated HTML');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].filter(m=>!/\bsrc\s*=/.test(m[1])&&!/\btype\s*=\s*["']?(?:application\/json|text\/plain)/i.test(m[1]));
assert(scripts.length>=2, 'Expected several inline JS script tags');
for(let i=0;i<scripts.length;i++){
 try{new vm.Script(scripts[i][2],{filename:'recovered-G5.4-script-'+(i+1)+'.js'});}
 catch(err){console.error('G5.4 script '+(i+1)+'/'+scripts.length+' syntax FAILED');throw err;}
}
const sha256=createHash('sha256').update(Buffer.from(html,'utf8')).digest('hex');
const lines=html.split('\n').length;
const manifest={
 format:'killtheking-recovered-project-text-v1',
 file_name:'KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html',
 recovered_from:'2026-11-16 Project text index, not exact original bytes',
 text_characters:html.length,
 utf8_bytes:Buffer.byteLength(html,'utf8'),
 lines,inline_scripts_syntax_checked:scripts.length,
 sha256,
 playable_in_gpu_browser_verified:false,
 newer_g8_4_source_recovered:false,
 is_game_engine_source:true,
 is_current_game:false
};
const out=process.env.RECOVERY_MANIFEST_OUT;
if(out){mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(manifest,null,2)+'\n');}
console.log(JSON.stringify(manifest,null,2));
