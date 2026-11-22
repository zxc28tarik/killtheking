import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {buildCanonical,extractedScripts} from './build_canonical_three_maps.mjs';

const original=readFileSync(new URL('./KillTheKing_AK_NATIVE_09_original_game_siege_map.html',import.meta.url),'utf8');
const origScripts=extractedScripts(original);
const adapterSource=readFileSync(new URL('./native-army-match-finish.js',import.meta.url),'utf8');
const context=vm.createContext({console});
vm.runInContext(origScripts.find(s=>s.includes('Match is not finished')),context,{timeout:2500});
vm.runInContext(adapterSource,context,{timeout:2500});
const ArenaMatch=context.ArenaMatch;
const adapter=vm.runInContext('KTKNativeArmyMatchFinish',context);
function participants(){
 return [{name:'one bot',id:1,arenaKills:0,arenaDeaths:0}];
}
function player(){
 return {kills:0,deaths:0};
}
test('early authentic G5.4 victory enters original results state without shortening/faking time',()=>{
 const match=ArenaMatch.create(240);
 ArenaMatch.begin(match);
 assert.equal(ArenaMatch.tick(match,63.5),false);
 assert.equal(match.phase,'playing');
 assert.throws(()=>ArenaMatch.finish(match,player(),participants()),/not finished/);
 assert.equal(adapter.acceptEarlyWin(match,'blue'),true);
 assert.equal(match.phase,'results');
 assert.equal(match.remaining,176.5);
 const result=ArenaMatch.finish(match,player(),participants());
 const summary={winner:'blue',blue:50,red:18,squads:[]};
 adapter.decorate(match,result,summary,true,true);
 assert.equal(result.winnerId,'g54:blue');
 assert.equal(result.winnerName,'MAVİ ORDU');
 assert.equal(result.playerWon,true);
 assert.equal(result.seconds,63.5);
 assert.equal(result.battleReason,'castle-capture');
 assert.equal(result.battleOutcome,'blue');
 assert.strictEqual(result.meadowBattle,summary);
});
test('red siege defense wins at timer even if blue survivors outnumber defenders',()=>{
 const match=ArenaMatch.create(120);ArenaMatch.begin(match);
 assert.equal(ArenaMatch.tick(match,120),true);
 assert.equal(match.phase,'results');
 const result=ArenaMatch.finish(match,player(),participants());
 adapter.decorate(match,result,{winner:null,blue:52,red:2,squads:[]},true,false);
 assert.equal(result.playerWon,false);
 assert.equal(result.winnerId,'g54:red');
 assert.equal(result.seconds,120);
 assert.equal(result.battleReason,'time-limit');
});
test('non-siege meadow time limit uses G5.4 living soldier counts and draw logic',()=>{
 const match=ArenaMatch.create(240);ArenaMatch.begin(match);
 ArenaMatch.tick(match,240);
 const result=ArenaMatch.finish(match,player(),participants());
 adapter.decorate(match,result,{winner:null,blue:24,red:32,squads:[]},false,false);
 assert.equal(result.winnerId,'g54:red');
 assert.equal(result.playerWon,false);
 const again={...result};
 adapter.decorate(match,again,{winner:null,blue:18,red:18,squads:[]},false,false);
 assert.equal(again.winnerId,'g54:draw');
});
test('FFA unaffected: no genuine army winner never terminates early',()=>{
 const match=ArenaMatch.create(240);ArenaMatch.begin(match);
 ArenaMatch.tick(match,35);
 assert.equal(adapter.acceptEarlyWin(match,null),false);
 assert.equal(adapter.acceptEarlyWin(match,''),false);
 assert.equal(match.phase,'playing');
 assert.equal(ArenaMatch.tick(match,205),true);
 const result=ArenaMatch.finish(match,player(),participants());
 assert.equal(result.seconds,240);
});
test('replay clears prior blue winner and genuinely restarts the normal match',()=>{
 const match=ArenaMatch.create(240);ArenaMatch.begin(match);
 ArenaMatch.tick(match,10);
 adapter.acceptEarlyWin(match,'blue');
 const result=ArenaMatch.finish(match,player(),participants());
 adapter.decorate(match,result,{winner:'blue',blue:39,red:12,squads:[]},true,true);
 ArenaMatch.begin(match);
 assert.equal(match.phase,'playing');
 assert.equal(match.result,null);
 assert.equal(match.remaining,240);
 assert.equal(adapter.acceptEarlyWin(match,null),false);
});
test('army result presentation hides HUD, excludes old FFA advice and restores for replay',()=>{
 const styles=new Map(),classes=new Set();
 const doc={
  body:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}},
  head:{appendChild:el=>styles.set(el.id,el)},
  getElementById:id=>styles.get(id)||null,
  createElement:tag=>{assert.equal(tag,'style');return {id:null,textContent:''}}
 };
 adapter.showResults(doc);
 assert.equal(classes.has('ktk-native-army-results'),true);
 assert.equal(styles.size,1);
 const css=styles.values().next().value.textContent;
 for(const selector of ['#hud','#native-siege-panel','#meadow-army-hud','#match-results-overlay'])
  assert(css.includes(selector),selector);
 adapter.showResults(doc);
 assert.equal(styles.size,1,'idempotent result visual layer');
 adapter.restoreHud(doc);
 assert.equal(classes.size,0,'same original HUD restored for next match');
});

test('canonical build has exact original 28 engine scripts with only final native outcome fix',()=>{
 const {html,manifest}=buildCanonical(original);
 const scripts=extractedScripts(html);
 assert.equal(scripts.length,29);
 for(let i=0;i<28;i++)assert.equal(scripts[i],origScripts[i],String(i));
 assert.equal(createHash('sha256').update(scripts[26]).digest('hex'),
   '497c945c059b541fcf76231e7d9ff2983dd8b235e98d7b78b93e9ed52235c348');
 assert.match(scripts[28],/KTKNativeArmyMatchFinish\.acceptEarlyWin\(arenaMatch,nativeArmyWinner\)/);
 assert.match(scripts[28],/KTKNativeArmyMatchFinish\.decorate\(arenaMatch,result,summary,nativeSiegeMode/);
 assert.match(scripts[28],/KTKNativeArmyMatchFinish\.showResults\(document\)/);
 assert.match(scripts[28],/KTKNativeArmyMatchFinish\.restoreHud\(document\)/);
 assert.equal(manifest.oneLiveGameDocument,true);
 assert.equal(manifest.originalAK09SourceSha256,createHash('sha256').update(original).digest('hex'));
});
