/**
 * Reproducibly build the G5.4 + passive trace offline HTML.
 * This program does NOT overwrite the original recovered G5.4 file.
 * Only four tiny battle-mode hooks are added; engine and FFA source stay exact.
 */
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const root=resolve(import.meta.dirname);
export const DEFAULT_SRC=resolve(root,'KillTheKing_G5_4_Kanat_Savunmasi_Oyna.html');
export const DEFAULT_TEL=resolve(root,'g5_4_passive_battle_trace.js');
export const DEFAULT_DEST=resolve(root,'KillTheKing_G5_4_Pasif_Telemetri_Oyna.html');
function once(text,needle,replacement){
  const a=text.indexOf(needle);
  assert(a>=0,'Cannot find expected source anchor: '+needle.slice(0,95));
  assert(text.indexOf(needle,a+needle.length)<0,'Ambiguous source anchor: '+needle.slice(0,95));
  return text.slice(0,a)+replacement+text.slice(a+needle.length);
}
export function integrate(original, telemetry) {
  assert(original.includes('Kill the King — G5.4 Hareketli Savunma Hattı'),'Wrong G5.4 source');
  assert(original.includes('ArenaArmyBattle.step(meadowBattleState,dt);'),'Actual battle step missing');
  assert(!original.includes('G54PassiveBattleTrace'),'G5.4 already instrumented');
  assert(!telemetry.includes('</script'),'Inline script cannot contain closing script tag');
  const initial='        let meadowBattleState = null;';
  const declaration=`${initial}
        let meadowTrace = null, meadowTraceLastReport = null;
        function meadowTraceCall(method, ...args) {
            if (!meadowTrace) return null;
            try { return meadowTrace[method](...args); }
            catch (error) {
                console.warn('G5.4 passive telemetry stopped; battle unaffected:', error);
                meadowTrace = null;
                return null;
            }
        }
        window.killTheKingArmyTelemetryReport = function() {
            return meadowTraceCall('getReport') || meadowTraceLastReport;
        };
        window.downloadKillTheKingArmyTelemetry = function() {
            const report=window.killTheKingArmyTelemetryReport();
            if (!report) return false;
            const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
            const link=document.createElement('a');
            link.href=url;link.download='KillTheKing_G5_4_Gercek_Savas_Kaydi.json';
            link.click();
            // Resource revocation is deferred because browsers may read after click.
            setTimeout(()=>URL.revokeObjectURL(url),1000);
            return true;
        };`;
  let html=once(original,initial,declaration);
  const createAnchor='                ArenaArmyBattle.setWorldObstacles(meadowBattleState,meadowSpec.boxes);';
  html=once(html,createAnchor,`${createAnchor}
                meadowTraceCall('abort','new-match');
                meadowTrace = typeof G54PassiveBattleTrace !== 'undefined'
                    ? G54PassiveBattleTrace.create() : null;
                meadowTraceCall('start',meadowBattleState);`);
  const tickAnchor='                ArenaArmyBattle.step(meadowBattleState,dt);';
  html=once(html,tickAnchor,`${tickAnchor}
                // Observe authoritative tick / AI / hit state BEFORE the original drain.
                meadowTraceCall('afterStep',meadowBattleState,dt);`);
  const finishAnchor='                const summary=ArenaArmyBattle.snapshot(meadowBattleState);\n                result.meadowBattle=summary;';
  html=once(html,finishAnchor,`                const summary=ArenaArmyBattle.snapshot(meadowBattleState);
                meadowTraceLastReport = meadowTraceCall('finish',meadowBattleState,summary,'match-results') || meadowTraceLastReport;
                meadowTrace = null;
                result.meadowBattle=summary;`);
  const leaveAnchor='                meadowBattleState=null;\n                if(meadowBattleVisual)meadowBattleVisual.group.visible=false;';
  html=once(html,leaveAnchor,`                meadowTraceCall('abort','leave-army-mode');
                meadowTrace = null;
                meadowBattleState=null;
                if(meadowBattleVisual)meadowBattleVisual.group.visible=false;`);

  // Insert the opt-in UMD library immediately before the final main game script.
  const finalScriptNeedle='\n    <script>\n\n        // Browser file:// storage may be blocked; use defaults';
  html=once(html,finalScriptNeedle,'\n<script>\n'+telemetry+'\n</script>'+finalScriptNeedle);
  return html;
}
export function validateInlineScripts(html) {
  const matches=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  let tested=0;
  for(let i=0;i<matches.length;i++) {
    const [tag,attrs,body]=matches[i];
    if (/\bsrc\s*=/.test(attrs)||/\btype\s*=\s*["']?(?:application\/json|text\/plain)/i.test(attrs))continue;
    new vm.Script(body,{filename:'G5.4-telemetry-inline-'+i+'.js'});
    tested++;
  }
  return tested;
}
export function build(src=DEFAULT_SRC,tel=DEFAULT_TEL,dest=DEFAULT_DEST) {
  const old=readFileSync(src,'utf8'),module=readFileSync(tel,'utf8');
  const html=integrate(old,module);
  const scripts=validateInlineScripts(html);
  assert(scripts===30, 'Expected 30 inline scripts (29 original + 1 observer)');
  const manifest={format:'killtheking-g5.4-observer-build-v1',
    source:'G5.4 recovered historical game, not G8.4',
    originalSha256:createHash('sha256').update(old).digest('hex'),
    telemetrySha256:createHash('sha256').update(module).digest('hex'),
    integratedSha256:createHash('sha256').update(html).digest('hex'),
    bytes:Buffer.byteLength(html),inlineScriptsChecked:scripts,
    passiveObserverOnly:true,gameplayEngineChanged:false,
    gpuGameplayVerified:false,novemberG8_4Recovered:false,realG8_5MirrorBattles:0};
  mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,html);
  writeFileSync(dest.replace(/\.html$/i,'_BUILD.json'),JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
if(import.meta.url===`file://${process.argv[1]}`){
  console.log(JSON.stringify(build(resolve(process.argv[2]||DEFAULT_SRC),resolve(process.argv[3]||DEFAULT_TEL),resolve(process.argv[4]||DEFAULT_DEST)),null,2));
}
