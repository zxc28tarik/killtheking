/** Source-pinned player-engagement correction: does NOT change weapons or FFA/TDM modes. */
import {createHash} from 'node:crypto';
export const sha256=text=>createHash('sha256').update(text).digest('hex');
export const ORIGINAL_FFA_SHA='18dca2a895763f0955566f2fc90651f1ab1a98f86597e399cbac42ac2fc6f15a';
export const ORIGINAL_ARMY_SHA='307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841';
function swapOne(source,oldStr,newStr){
 if(source.split(oldStr).length!==2)throw Error('Expected exactly one matching unchanged attack-selection block');
 return source.replace(oldStr,newStr);
}
export function patchFfaAggro(ffa){
 if(sha256(ffa)!==ORIGINAL_FFA_SHA)throw Error('Unsupported A5 FFA source; no hotfix applied');
 const before=`            // At most one normal bot pursues the player at once; retaliation is separate.
            if (playerDistance < Math.min(maxDetection,
                    arenaMap==='meadow'?120:26) &&
                arenaCanTarget(bot,'player',null) &&
                ArenaBotRecovery.allows(bot.navRecovery, 'player:player') &&
                arenaTargetCount('player', null, bot.id) === 0) {
                // Bots deliberately prefer other available opponents to a player dogpile.
                candidates.push({ type: 'player', id: null, position: player.pos,
                    score: playerDistance + 14 + Math.random() * 7 });
            }`;
 const after=`            // The human is a normal arena rival, not a permanently ignored bystander.
            // Permit TWO ordinary pursuers max; others still fight bots. Retaliation
            // after a player hit continues to have its existing short priority.
            const playerHunters = arenaTargetCount('player', null, bot.id);
            const playerDetect = arenaMap === 'meadow' ? 155 : 38;
            if (playerDistance < playerDetect &&
                arenaCanTarget(bot,'player',null) &&
                ArenaBotRecovery.allows(bot.navRecovery, 'player:player') &&
                playerHunters < 2) {
                // Near rivals must compete with nearby bots on distance, rather
                // than always receiving the former +14 artificial avoidance penalty.
                const closeToHuman = playerDistance <= (arenaMap === 'meadow' ? 22 : 17);
                candidates.push({ type: 'player', id: null, position: player.pos,
                    score: playerDistance + (closeToHuman ? -11 : 2) +
                        playerHunters * 7 + Math.random() * 5 });
            }`;
 // The actual movement/combat frame used to start a ranged or melee windup
 // solely because a target was inside weapon reach. With a wall in the way,
 // every cancelled windup restarted on the next frame, wasting decisions.
 // This gate only delays starting a windup until line of sight is clear;
 // it never changes cooldown, damage, movement, or target allegiance.
 return swapOne(swapOne(ffa,before,after),
  '                } else if (isGameActive && arenaTarget && arenaDist <= bot.range) {',
  '                } else if (isGameActive && arenaTarget && arenaDist <= bot.range && hasClearShot) {');
}
export function patchArmyAggro(engine){
 if(sha256(engine)!==ORIGINAL_ARMY_SHA)throw Error('Unsupported G5.4 army source; no hotfix applied');
 let out=engine;
 out=swapOne(out,
 `   const nearbyPlayer=soldier.team!==state.playerTeam&&state.playerActive&&
    ((soldier.id+state.seed)%4===0)&&dist(soldier,state.playerPosition)<role.range;
   const turnToPlayer=nearbyPlayer&&(!enemy||
    dist(soldier,state.playerPosition)<dist(soldier,enemy)*.72);`,
 `   // A limited, deterministic share of opposing soldiers may notice the
   // real human even while other soldiers are in range. No dogpile: only
   // one soldier in five actively prioritizes the human at a given moment.
   const nearbyPlayer=soldier.team!==state.playerTeam&&state.playerActive&&
    ((soldier.id+state.seed)%5===0)&&dist(soldier,state.playerPosition)<role.range;
   const turnToPlayer=nearbyPlayer&&(!enemy||
    dist(soldier,state.playerPosition)<Math.max(15,dist(soldier,enemy)*1.0));`);
 out=swapOne(out,
 `   const playerThreat=soldier.team!==state.playerTeam&&state.playerActive&&
    playerDist<role.range&&(!enemy||playerDist<dist(soldier,enemy)*.72)&&
    ((soldier.id+state.seed)%4===0);`,
 `   const playerThreat=soldier.team!==state.playerTeam&&state.playerActive&&
    playerDist<role.range&&(!enemy||playerDist<Math.max(15,dist(soldier,enemy)*1.0))&&
    ((soldier.id+state.seed)%5===0);`);
 return out;
}
