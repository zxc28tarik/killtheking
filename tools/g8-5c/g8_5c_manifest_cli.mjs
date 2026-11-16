#!/usr/bin/env node
/** Prints 144 real-engine run requests, never fabricated match outcomes. */
import {buildMirrorManifest} from './g8_5c_mirror_runner.mjs';
import {writeFileSync} from 'node:fs';
const manifest=buildMirrorManifest();
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(manifest,null,2)+'\n');
else process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
console.error('Prepared '+manifest.length+' run requests; executed 0 real battles.');
