import assert from 'node:assert/strict';
import {evaluateDeadline,shouldSwitchStrategicTarget,updateSupplyHold} from './g8_5_reference.mjs';
let passed=0;
function check(label, fn) {try {fn();passed++;console.log('PASS',label)} catch(err) {console.error('FAIL',label);throw err}}
const clock=(overrides={})=>({scenario:'supply',elapsed:240,duration:240,blueScore:60,redScore:45,contested:false,overtimeStart:null,...overrides});
check('classic is unlimited at any elapsed',()=>assert.equal(evaluateDeadline(clock({scenario:'classic',elapsed:1e8})).status,'active'));
check('scored scenario active before deadline',()=>assert.equal(evaluateDeadline(clock({elapsed:239.99})).status,'active'));
check('decisive lead finishes on deadline',()=>assert.equal(evaluateDeadline(clock()).status,'finished'));
check('tie starts overtime',()=>assert.equal(evaluateDeadline(clock({redScore:60})).status,'overtime'));
check('close lead starts overtime',()=>assert.equal(evaluateDeadline(clock({redScore:52})).status,'overtime'));
check('non-close but contested starts overtime',()=>assert.equal(evaluateDeadline(clock({contested:true})).status,'overtime'));
check('within overtime and close remains overtime',()=>assert.equal(evaluateDeadline(clock({elapsed:250,redScore:58,overtimeStart:240})).status,'overtime'));
check('within overtime and contested remains overtime',()=>assert.equal(evaluateDeadline(clock({elapsed:250,contested:true,overtimeStart:240})).status,'overtime'));
check('decisive uncontested overtime finishes',()=>assert.equal(evaluateDeadline(clock({elapsed:250,overtimeStart:240})).reason,'decisive_overtime_lead'));
check('overtime cap terminates contested matches',()=>assert.equal(evaluateDeadline(clock({elapsed:270,contested:true,overtimeStart:240})).reason,'overtime_cap'));
check('no negative duration accepted',()=>assert.throws(()=>evaluateDeadline(clock({duration:-1})),TypeError));
check('no NaN scores accepted',()=>assert.throws(()=>evaluateDeadline(clock({redScore:NaN})),TypeError));
check('no invalid overtime start before deadline',()=>assert.throws(()=>evaluateDeadline(clock({elapsed:250,overtimeStart:239})),RangeError));
check('invalid existing objective is replaced',()=>assert.equal(shouldSwitchStrategicTarget({currentTargetValid:false,heldSeconds:0}).switch,true));
check('small advantage cannot trigger retarget',()=>assert.equal(shouldSwitchStrategicTarget({currentScore:90,candidateScore:95,heldSeconds:8}).switch,false));
check('equal threshold is not sufficient',()=>assert.equal(shouldSwitchStrategicTarget({currentScore:90,candidateScore:100,heldSeconds:8}).switch,false));
check('clear advantage after hold does retarget',()=>assert.equal(shouldSwitchStrategicTarget({currentScore:90,candidateScore:101,heldSeconds:8}).switch,true));
check('clear advantage before hold does not retarget',()=>assert.equal(shouldSwitchStrategicTarget({currentScore:90,candidateScore:150,heldSeconds:1}).switch,false));
check('urgent retarget still needs a true advantage',()=>assert.equal(shouldSwitchStrategicTarget({currentScore:90,candidateScore:95,heldSeconds:1,urgent:true}).switch,false));
check('urgent strong advantage bypasses hold',()=>assert.equal(shouldSwitchStrategicTarget({currentScore:90,candidateScore:150,heldSeconds:1,urgent:true}).switch,true));
check('NaN candidate never triggers',()=>assert.equal(shouldSwitchStrategicTarget({currentScore:20,candidateScore:NaN,heldSeconds:8}).switch,false));
const allBlue={depotA:'blue',depotB:'blue',center:'blue'};
check('hold 11 seconds no bonus',()=>assert.equal(updateSupplyHold(null,11,allBlue).added.blue,0));
check('hold reaches 12 seconds exactly bonus once',()=>{const a=updateSupplyHold(null,11,allBlue),b=updateSupplyHold(a,1,allBlue);assert.equal(b.added.blue,12);assert.equal(updateSupplyHold(b,2,allBlue).added.blue,0)});
check('partial holding does not count',()=>assert.equal(updateSupplyHold(null,12,{...allBlue,center:'red'}).added.blue,0));
check('interruption resets consecutive hold',()=>{let s=updateSupplyHold(null,7,allBlue);s=updateSupplyHold(s,1,{...allBlue,depotB:'none'});s=updateSupplyHold(s,5,allBlue);assert.equal(s.added.blue,0)});
check('teams are symmetric in supply bonus',()=>{const s=updateSupplyHold(null,12,{depotA:'red',depotB:'red',center:'red'});assert.equal(s.added.red,12);assert.equal(s.added.blue,0)});
check('one-shot policy prevents repeated bonus',()=>{let s=updateSupplyHold(null,12,allBlue);s=updateSupplyHold(s,2,{});s=updateSupplyHold(s,12,allBlue);assert.equal(s.added.blue,0)});
check('rearm option awards again after interrupted hold',()=>{let s=updateSupplyHold(null,12,allBlue,{oneShotPerBattle:false});s=updateSupplyHold(s,1,{}, {oneShotPerBattle:false});s=updateSupplyHold(s,12,allBlue,{oneShotPerBattle:false});assert.equal(s.added.blue,12)});
// Scale coverage: the oracle must NEVER vary by 140/200/280 soldier scale.
for (const armySize of [140,200,280]) {
  check(`clock invariant at armySize=${armySize}`,()=>assert.equal(evaluateDeadline({...clock({redScore:60}),armySize}).status,'overtime'));
  check(`target lock invariant at armySize=${armySize}`,()=>assert.equal(shouldSwitchStrategicTarget({currentScore:50,candidateScore:55,heldSeconds:10,armySize}).switch,false));
  check(`supply bonus invariant at armySize=${armySize}`,()=>assert.equal(updateSupplyHold(null,12,allBlue,{armySize}).added.blue,12));
}
console.log(`\n${passed}/${passed} reference-oracle tests PASS (NOT production game tests).`);
