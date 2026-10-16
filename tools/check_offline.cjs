/* Validate syntax and self-contained script order in the release HTML. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2]||'dist/KillTheKing_Oyna.html','utf8');
assert(!/<script\s+src=/i.test(html),'release still has external JavaScript dependencies');
assert(!/<link\s+rel="stylesheet"\s+href="styles\//i.test(html),'release still has local CSS dependencies');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
assert(scripts.length>=12,'Unexpected script count: '+scripts.length);
scripts.forEach((source,i)=>new vm.Script(source,{filename:'inlined-'+i+'.js'}));
assert(html.includes('ArenaCharacterMotion'), 'Missing bot/TPS animation code');
assert(html.includes('THREE.WebGLRenderer'), 'Missing Three.js scene');
assert(html.includes('krunkerArenaStatus'), 'Missing game runtime status');
console.log('Offline HTML OK: '+scripts.length+' valid inline scripts; '+Buffer.byteLength(html)+' bytes');
