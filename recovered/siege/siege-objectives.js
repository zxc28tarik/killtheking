/* Kill the King S1 — deterministic, isolated SIEGE objective rules.
 * Not a replacement for real G5.4/G8.4 soldier combat. Event adapter S3
 * must supply ONLY genuine battle-engine hits, alive counts and occupancy.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.KTKSiegeObjectives=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PHASES=Object.freeze(['APPROACH','BREACH','COURTYARD','KEEP','RESULT']);
 const SUCCESS=Object.freeze({
   ATTACKER_KEEP:'ATTACKER_KEEP_CAPTURED',
   DEFENDER_TIME:'DEFENDER_HELD_TO_TIMEOUT',
   DEFENDER_ELIMINATION:'DEFENDER_ELIMINATED_ATTACKERS'
 });
 const config=Object.freeze({
   durationSeconds:900,gateHp:600,ladderBuildRequired:100,
   courtyardHoldSeconds:12,keepHoldSeconds:20,maxSoldiersPerSide:70
 });
 function finite(v){return typeof v==='number'&&Number.isFinite(v);}
 function requireFinite(v,label,min=0,max=Infinity){
   if(!finite(v)||v<min||v>max)throw Error('Invalid '+label);
   return v;
 }
 function requireInt(v,label,min=0,max=70){
   if(!Number.isInteger(v)||v<min||v>max)throw Error('Invalid '+label);
   return v;
 }
 function createScenario(options={}){
   if(!options||typeof options!=='object'||Array.isArray(options))
     throw Error('Invalid siege scenario options');
   const unknown=Object.keys(options).filter(k=>!Object.hasOwn(config,k));
   if(unknown.length)throw Error('Unknown siege options: '+unknown.join(','));
   const opts={...config,...options};
   for(const [k,value] of Object.entries(opts))
     requireFinite(value,k,k==='maxSoldiersPerSide'?1:1,3600);
   for(const k of ['gateHp','ladderBuildRequired','maxSoldiersPerSide'])
     requireInt(opts[k],k,1,k==='maxSoldiersPerSide'?280:3600);
   return {
     kind:'SIEGE_S1_NOT_REAL_ARMY_ENGINE',
     rules:opts,phase:'APPROACH',clock:0,remaining:opts.durationSeconds,
     winner:null,resultReason:null,
     gate:{hp:opts.gateHp,maxHp:opts.gateHp,open:false},
     ladders:{west:{progress:0,open:false},east:{progress:0,open:false}},
     lanes:{gate:false,west:false,east:false},
     forces:{red:opts.maxSoldiersPerSide,blue:opts.maxSoldiersPerSide},
     occupancy:{courtyard:{red:0,blue:0},keep:{red:0,blue:0}},
     capture:{courtyard:0,keep:0},
     events:[]
   };
 }
 function log(state,type,detail){
   state.events.push({at:Math.round(state.clock*1000)/1000,type,detail});
   if(state.events.length>180)state.events.shift();
 }
 function finish(state,winner,reason){
   if(state.phase==='RESULT')return;
   state.phase='RESULT';state.winner=winner;state.resultReason=reason;
   log(state,'MATCH_FINISH',{winner,reason});
 }
 function requireActive(state){
   if(!state||state.kind!=='SIEGE_S1_NOT_REAL_ARMY_ENGINE')
     throw Error('Unrecognized siege state');
   if(state.phase==='RESULT')throw Error('Siege match already ended');
 }
 function applyEvent(state,event){
   requireActive(state);
   if(!event||typeof event!=='object'||Array.isArray(event))
     throw Error('Invalid siege event');
   switch(event.type){
     case 'GATE_HIT':{
       if(event.team!=='red')throw Error('Only attacker may hit siege gate');
       if(!['sword','pike','musket','archer','ram','catapult'].includes(event.weapon))
         throw Error('Unrecognized gate attack source');
       const damage=requireFinite(event.damage,'gate damage',.001,150);
       if(state.gate.open)return false;
       state.gate.hp=Math.max(0,Math.round((state.gate.hp-damage)*1000)/1000);
       if(state.gate.hp===0){
         state.gate.open=true;state.lanes.gate=true;
         log(state,'GATE_BREACHED',{weapon:event.weapon});
       }else log(state,'GATE_HIT',{weapon:event.weapon,damage,hp:state.gate.hp});
       break;
     }
     case 'LADDER_BUILD':{
       if(event.team!=='red')throw Error('Only attacker may place a siege ladder');
       if(!['west','east'].includes(event.lane))throw Error('Invalid ladder lane');
       const effort=requireFinite(event.effort,'ladder effort',.001,25);
       const ladder=state.ladders[event.lane];
       if(ladder.open)return false;
       ladder.progress=Math.min(state.rules.ladderBuildRequired,
         Math.round((ladder.progress+effort)*1000)/1000);
       if(ladder.progress>=state.rules.ladderBuildRequired){
         ladder.open=true;state.lanes[event.lane]=true;
         log(state,'LADDER_READY',{lane:event.lane});
       }else log(state,'LADDER_PROGRESS',{lane:event.lane,progress:ladder.progress});
       break;
     }
     case 'FORCE_COUNTS':{
       const red=requireInt(event.red,'red soldier count',0,state.rules.maxSoldiersPerSide);
       const blue=requireInt(event.blue,'blue soldier count',0,state.rules.maxSoldiersPerSide);
       if(red>state.forces.red||blue>state.forces.blue)
         throw Error('Siege force counts cannot increase without authorized reinforcement contract');
       state.forces.red=red;state.forces.blue=blue;
       if(red===0)finish(state,'blue',SUCCESS.DEFENDER_ELIMINATION);
       log(state,'FORCE_COUNTS',{red,blue});
       break;
     }
     case 'ZONE_PRESENCE':{
       if(!['courtyard','keep'].includes(event.zone))
         throw Error('Unrecognized siege capture zone');
       const red=requireInt(event.red,'zone red presence',0,state.forces.red);
       const blue=requireInt(event.blue,'zone blue presence',0,state.forces.blue);
       // Occupancy must be measured by real soldiers on the zone in S3.
       state.occupancy[event.zone]={red,blue};
       log(state,'ZONE_PRESENCE',{zone:event.zone,red,blue});
       break;
     }
     default:throw Error('Unknown siege event: '+String(event.type));
   }
   if(state.phase==='RESULT')return true;
   if(state.phase==='APPROACH'&&Object.values(state.lanes).some(Boolean)){
     state.phase='BREACH';log(state,'PHASE_BREACH',{lanes:{...state.lanes}});
   }
   return true;
 }
 function step(state,dt){
   requireActive(state);
   requireFinite(dt,'simulation step',0,.25);
   if(dt===0)return snapshot(state);
   state.clock=Math.round((state.clock+dt)*1000000)/1000000;
   state.remaining=Math.max(0,
     Math.round((state.rules.durationSeconds-state.clock)*1000000)/1000000);
   if(state.phase==='BREACH'||state.phase==='COURTYARD'){
     const {red,blue}=state.occupancy.courtyard;
     if(red>0&&blue===0){
       if(state.phase==='BREACH'){
         state.phase='COURTYARD';log(state,'PHASE_COURTYARD',{red});
       }
       state.capture.courtyard=Math.min(state.rules.courtyardHoldSeconds,
         Math.round((state.capture.courtyard+dt)*1000000)/1000000);
       if(state.capture.courtyard>=state.rules.courtyardHoldSeconds){
         state.phase='KEEP';log(state,'PHASE_KEEP_UNLOCKED',{});
       }
     }else if(state.capture.courtyard>0){
       state.capture.courtyard=0;
       if(state.phase==='COURTYARD'){
         state.phase='BREACH';log(state,'COURTYARD_CONTESTED',{red,blue});
       }
     }
   }else if(state.phase==='KEEP'){
     const {red,blue}=state.occupancy.keep;
     if(red>0&&blue===0){
       state.capture.keep=Math.min(state.rules.keepHoldSeconds,
         Math.round((state.capture.keep+dt)*1000000)/1000000);
       if(state.capture.keep>=state.rules.keepHoldSeconds){
         finish(state,'red',SUCCESS.ATTACKER_KEEP);
       }
     }else if(state.capture.keep>0){
       state.capture.keep=0;
       log(state,'KEEP_CONTESTED',{red,blue});
     }
   }
   if(state.remaining<=0&&state.phase!=='RESULT')
     finish(state,'blue',SUCCESS.DEFENDER_TIME);
   return snapshot(state);
 }
 function snapshot(s){
   if(!s||s.kind!=='SIEGE_S1_NOT_REAL_ARMY_ENGINE')
     throw Error('Invalid siege state');
   return {
     kind:s.kind,phase:s.phase,clock:s.clock,remaining:s.remaining,
     rules:{...s.rules},winner:s.winner,resultReason:s.resultReason,
     gate:{...s.gate},
     ladders:{west:{...s.ladders.west},east:{...s.ladders.east}},
     lanes:{...s.lanes},forces:{...s.forces},
     occupancy:{courtyard:{...s.occupancy.courtyard},
       keep:{...s.occupancy.keep}},
     capture:{...s.capture},events:s.events.slice(-35).map(e=>({...e}))
   };
 }
 return Object.freeze({PHASES,SUCCESS,config,createScenario,applyEvent,step,snapshot});
});
