/* KTK-SIEGE-SESSION-02 — genuine G5.4 outcome in the original ArenaMatch UI.
 * The original 28 combat/renderer scripts are never modified. This adapter
 * changes only final match lifecycle ownership and the result metadata.
 */
const KTKNativeArmyMatchFinish=(function(){
 'use strict';
 // In G5.4 a real soldier victory can arrive with minutes still on the clock.
 // ArenaMatch.finish normally accepts ONLY phase='results'. This performs
 // exactly the same terminal phase transition that ArenaMatch.tick() does when
 // its clock reaches zero, without changing the clock or any soldier state.
 function acceptEarlyWin(match,armyWinner){
  if(!match||!armyWinner||match.phase!=='playing')return false;
  match.phase='results';
  return true;
 }
 function decorate(match,result,summary,isSiege,captured){
  if(!match||!result||!summary||match.phase!=='results')
   throw Error('Native G5.4 result requires an actual finished battle');
  const blue=Number(summary.blue),red=Number(summary.red);
  if(!Number.isInteger(blue)||!Number.isInteger(red)||blue<0||red<0)
   throw Error('Invalid G5.4 surviving soldier counts');
  // A castle only belongs to blue after an authentic G5.4 capture; a time-out
  // is a red defense victory even when blue has more survivors outside.
  const winner=summary.winner==='blue'||captured?'blue':
   summary.winner==='red'?'red':
   isSiege?'red':blue>red?'blue':red>blue?'red':'draw';
  result.meadowBattle=summary;
  result.winnerId='g54:'+winner;
  result.winnerName=winner==='blue'?'MAVİ ORDU':
   winner==='red'?'KIRMIZI ORDU':'BERABERE';
  result.playerWon=winner==='blue';
  result.seconds=Math.max(0,Math.min(match.durationSeconds,
   match.durationSeconds-match.remaining));
  result.battleOutcome=winner;
  result.battleReason=!!captured?'castle-capture':
   !!summary.winner?'elimination':'time-limit';
  result.armyStandings=Array.isArray(summary.squads)?summary.squads:null;
  return result;
 }
 // The native game retains its original in-match HUD. On army/siege
 // results it must not visibly cover the outcome. Suppress visuals only;
 // original input listeners, DOM nodes and game mode flags are untouched.
 function showResults(doc){
  if(!doc?.body||!doc?.head)throw Error('Real native results document required');
  let style=doc.getElementById('ktk-native-army-results-style');
  if(!style){
   style=doc.createElement('style');
   style.id='ktk-native-army-results-style';
   style.textContent=[
    'body.ktk-native-army-results #hud,',
    'body.ktk-native-army-results #native-siege-panel,',
    'body.ktk-native-army-results #meadow-army-hud',
    '{display:none!important;}',
    // The default FFA tips are not the G5.4 siege win criteria.
    'body.ktk-native-army-results #match-results-overlay .text-center.mb-5 > p',
    '{display:none!important;}'
   ].join('\n');
   doc.head.appendChild(style);
  }
  doc.body.classList.add('ktk-native-army-results');
 }
 function restoreHud(doc){
  doc?.body?.classList?.remove('ktk-native-army-results');
 }
 return Object.freeze({acceptEarlyWin,decorate,showResults,restoreHud});
})();
