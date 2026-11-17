/**
 * Verifies that two declared mirror matches ACTUALLY exchanged starting sides.
 * Does not prove identical AI decisions or identical RNG call sequence.
 * Layout must be measured from the real game immediately after spawning.
 */
function canonicalRoster(roster) {
  if(!Array.isArray(roster)||!roster.length)throw Error('startLayout team must be a nonempty array');
  const points=roster.map((p,i)=>{
    if(!p||typeof p!=='object')throw Error('invalid spawn '+i);
    if(typeof p.type!=='string'||!p.type.trim())throw Error('missing unit type at '+i);
    if(!Number.isFinite(p.x)||!Number.isFinite(p.z))throw Error('invalid spawn coordinate at '+i);
    return p.type.trim()+'|'+p.x.toFixed(4)+'|'+p.z.toFixed(4);
  }).sort();
  return points.join('\n');
}
function readLayout(record){
  if(!record?.startLayout?.blue||!record?.startLayout?.red)throw Error('missing startLayout.blue/red measured from game spawns');
  return {blue:canonicalRoster(record.startLayout.blue),red:canonicalRoster(record.startLayout.red)};
}
/**
 * A swapped match must use the original RED roster's locations for BLUE and vice versa.
 * This confirms only setup parity (up to 4-decimal world coordinates), not path parity.
 */
export function verifyMirrorStartLayout(original,swapped){
  if(original?.sideSwap!=='original'||swapped?.sideSwap!=='swapped')throw Error('mirror pair requires original then swapped');
  const a=readLayout(original),b=readLayout(swapped);
  const blueChanged=a.blue!==b.blue,redChanged=a.red!==b.red;
  if(!blueChanged||!redChanged)throw Error('declared mirror did not change both teams’ starts');
  if(a.blue!==b.red)throw Error('swapped red does not match original blue starting layout');
  if(a.red!==b.blue)throw Error('swapped blue does not match original red starting layout');
  return {verified:true,originalBlueCount:original.startLayout.blue.length,originalRedCount:original.startLayout.red.length,
    swappedBlueCount:swapped.startLayout.blue.length,swappedRedCount:swapped.startLayout.red.length};
}
/**
 * Strict group-wide evidence. Missing layouts always block mirror verification.
 */
export function auditMirrorStartLayouts(records){
  if(!Array.isArray(records))throw Error('records must be an array');
  const groups=new Map();
  for(const record of records){
    const key=record.scenario+'|'+record.armySize+'|'+record.mirrorSeed;
    const row=groups.get(key)??{};
    if(!['original','swapped'].includes(record.sideSwap))throw Error('invalid sideSwap');
    if(row[record.sideSwap])throw Error('duplicate layout record for '+key);
    row[record.sideSwap]=record;groups.set(key,row);
  }
  let verifiedPairs=0;const errors=[];
  for(const [key,p] of groups){
    if(!p.original||!p.swapped){errors.push(key+': incomplete pair');continue;}
    try{verifyMirrorStartLayout(p.original,p.swapped);verifiedPairs++}
    catch(e){errors.push(key+': '+e.message)}
  }
  return {status:errors.length?'missing_evidence':'start_layout_verified',verifiedPairs,pairCount:groups.size,errors};
}
