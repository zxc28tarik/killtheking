import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const h=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('KISS-B Arena HUD is scoped and keeps shared live nodes',()=>{
 const css=h.match(/<style id="ktk-kiss-b-arena">([\s\S]*?)<\/style>/)[1];
 assert.ok(css.includes('body:not(.ktk-native-battle-ui) #kiss-arena-radar-label{display:none!important}'));
 assert.ok(css.includes('body:not(.ktk-native-battle-ui) #hud-team-score:not(.hidden)'));
 for(const id of ['radar-canvas','hud-timer','hud-kills','hud-deaths','hud-streak','hud-ammo','bow-charge-ui','hud-ability-badge','match-live-scoreboard','hud-team-blue','hud-team-red'])assert.ok(h.includes('id="'+id+'"'),id);
 assert.ok(h.includes("streakNode.dataset.kissZeroStreak!==zeroStreak"));
 assert.ok(h.includes("const enabled = arenaMode === 'tdm' && !meadowBattleMode;"));
 assert.equal(h,readFileSync(new URL('../playables/KillTheKing_AK30_Amblemler_Korundu_Tam_Ekran_Arka_Plan.html',import.meta.url),'utf8'));
});
test('KISS-B radar shape distinction leaves army markers intact',()=>{
 assert.ok(h.includes("if(arenaMode==='tdm'&&botTeam(bot)==='blue')"));
 assert.ok(h.includes('radarCtx.fillRect(bx-3,bz-3,6,6)'));
 assert.ok(h.includes('radarCtx.arc(px,pz,3.5,0,Math.PI*2)'));
 assert.ok(h.includes('radarCtx.moveTo(px+Math.cos(lookAngle)*6'));
});
