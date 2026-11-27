import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const h=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('KISS-A removes obsolete visual HUD content but retains live combat and QA nodes',()=>{
 const hud=h.slice(h.indexOf('<div id="hud"'),h.indexOf('<!-- Optional offline team match scoreboard'));
 assert.doesNotMatch(hud,/KRUNKER 1600|HD KARAKTERLER|id="chat-messages"|id="pill-[1-4]"/);
 for(const id of ['hud-hp-text','hud-hp-bar','hud-class-name','hud-class-tip','hud-ammo','hud-ability-badge','hud-status-badge','hud-fps','hud-speed','hud-slide-indicator','medal-container','kill-feed','reload-indicator','bow-charge-ui'])
  assert.ok(hud.includes('id="'+id+'"'),id);
 assert.doesNotMatch(h,/body\.ktk-calm-ui #hud>div:last-child>div:first-child>div:first-child \{display:none!important\}/);
});
test('KISS-A optional telemetry and contextual help keep existing settings and keys',()=>{
 assert.match(h,/body:not\(\.ktk-kiss-debug\) :is\(#kiss-debug-telemetry,#kiss-debug-speed,#match-qa-export-btn\)\{display:none!important\}/);
 assert.match(h,/id="kiss-debug-toggle" type="checkbox"/);
 assert.match(h,/data-kiss-help="arena"><strong>P<\/strong> Kamera değiştir/);
 assert.match(h,/data-kiss-help="army" hidden><strong>P<\/strong> Taktik harita/);
 assert.match(h,/if \(e\.code === 'KeyP'\) toggleThirdPerson\(\)/);
 assert.equal(h,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
