#!/usr/bin/env node
/** Usage: node g8_5e_compare_cli.mjs first_trace.json second_trace.json [report.json] */
import {readFileSync,writeFileSync} from 'node:fs';
import {compareDecisionTraces} from './g8_5e_decision_trace.mjs';
if(import.meta.url===new URL('file://'+process.argv[1]).href){
  const [,,first,second,output]=process.argv;
  if(!first||!second){console.error('Usage: node g8_5e_compare_cli.mjs first.json second.json [report.json]');process.exit(2)}
  try{
    const a=JSON.parse(readFileSync(first,'utf8'));
    const b=JSON.parse(readFileSync(second,'utf8'));
    const result=compareDecisionTraces(a,b);
    const json=JSON.stringify(result,null,2)+'\n';
    if(output)writeFileSync(output,json);
    else process.stdout.write(json);
    if(result.status!=='identical_trace')process.exitCode=3;
  }catch(e){console.error('Trace validation error: '+e.message);process.exitCode=2;}
}