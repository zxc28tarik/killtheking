/** AK28 protected original 29th script only, on top of AK25–AK27. */
export function applyNativeSiegeRouteWatchV28(input){
 let s=input;
 const edits=[{"anchor":"        let nativeSiegeDoctrineV27=null;","replace":"        let nativeSiegeDoctrineV27=null;\n        // AK28 real collision-aware passage audit and bounded G5.4 AI\n        // route recovery. No new actor, no alternative movement engine.\n        let nativeSiegeRouteWatchV28=null;\n        window.ktkSiegeRouteWatchStatus=()=>({\n          ...KTKSiegeRouteWatchV28.status(nativeSiegeRouteWatchV28),\n          active:!!nativeSiegeMode&&!!meadowBattleState,\n          originalThreeMaps:true\n        });","label":"register siege-only native route watcher without changing original FPS"},{"anchor":"                  KTKSiegeDefenderDoctrineV27.create(meadowBattleState,ArenaArmyBattle):null;","replace":"                  KTKSiegeDefenderDoctrineV27.create(meadowBattleState,ArenaArmyBattle):null;\n                nativeSiegeRouteWatchV28=nativeSiegeMode?\n                  KTKSiegeRouteWatchV28.create(\n                    meadowBattleState,ArenaArmyBattle,nativeSiegeDoctrineV27):null;","label":"audit all six staged G5.4 routes on the true 140-soldier collision scene"},{"anchor":"              towerCrossed:st.towerCrossed,towerAssigned:st.towerAssigned\n            });","replace":"              towerCrossed:st.towerCrossed,towerAssigned:st.towerAssigned\n            });\n          if(nativeSiegeRouteWatchV28)\n            KTKSiegeRouteWatchV28.update(nativeSiegeRouteWatchV28);","label":"bounded recovery after original red captain makes its live defense decision"}];
 for(const {anchor,replace,label} of edits){
  const count=s.split(anchor).length-1;
  if(count!==1)throw Error('AK28 verified native route ['+label+'] matched '+count);
  s=s.replace(anchor,replace);
 }
 return s;
}
