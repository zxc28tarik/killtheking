/** Build separate S3D1 native human FPS/TPS combat + 140 G5.4 siege HTML.
 * Native 140 soldiers + human HP/ground weapon bridge; old FFA movement and 3D ballistics NOT ported.
 * Preserves S2 standalone 3D exploratory HTML builder unchanged.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const dir=dirname(fileURLToPath(import.meta.url));
const root=resolve(dir,'../..');
const files={
 KTK_THREE_JS:resolve(root,'vendor/three-r128.js'),
 KTK_SIEGE_MAP_JS:resolve(dir,'siege-map.js'),
 KTK_SIEGE_OBJECTIVES_JS:resolve(dir,'siege-objectives.js'),
 KTK_SIEGE_TRAVERSAL_JS:resolve(dir,'siege-traversal.js'),
 KTK_G54_WEAPON_REAL_JS:resolve(root,'recovered/army/modules/weapon-balance.js'),
 KTK_G54_ARMY_REAL_JS:resolve(root,'recovered/army/mirror/arena-army-battle-true-side-swap.js'),
 KTK_SHARED_G54_ARMY_COMMANDS_JS:resolve(root,'recovered/army/modules/shared-g54-army-commands.js'),
 KTK_SIEGE_REAL_ARMY_BRIDGE_JS:resolve(dir,'siege-real-army-bridge.js'),
 KTK_SIEGE_STRUCTURE_COMBAT_JS:resolve(dir,'siege-structure-combat.js'),
 KTK_SIEGE_ASSAULT_NAV_JS:resolve(dir,'siege-assault-navigation.js'),
 KTK_SIEGE_LADDER_AI_JS:resolve(dir,'siege-ladder-ai.js'),
 KTK_SIEGE_CAPTURE_AI_JS:resolve(dir,'siege-capture-ai.js'),
 KTK_SIEGE_DEFENDER_AI_JS:resolve(dir,'siege-defender-ai.js'),
 KTK_SIEGE_PLAYER_BALLISTICS_3D_JS:resolve(dir,'siege-player-ballistics-3d.js'),
 KTK_SIEGE_RAMPART_AI_JS:resolve(dir,'siege-rampart-ai.js'),
 KTK_SIEGE_PLAYER_COMBAT_JS:resolve(dir,'siege-player-combat.js'),
 KTK_SIEGE_PREVIEW_JS:resolve(dir,'siege-preview.js'),
 KTK_SIEGE_PLAYER_LOCOMOTION_JS:resolve(dir,'siege-player-locomotion.js'),
 KTK_SIEGE_CHARACTER_VISUALS_JS:resolve(dir,'siege-character-visuals.js'),
 KTK_SIEGE_REAL_ARMY_OVERLAY_JS:resolve(dir,'siege-real-army-overlay.js'),
 KTK_SIEGE_WEAPON_FEEDBACK_JS:resolve(dir,'siege-weapon-feedback.js'),
 KTK_SIEGE_PLAYER_UI_JS:resolve(dir,'siege-player-ui.js')
};
const sha=s=>createHash('sha256').update(s).digest('hex');
const dest=resolve(process.argv[2]||resolve(dir,
  'dist/KillTheKing_Kusatma_S3D1_FPS_140_Gercek_Asker_Savas_Aday.html'));
let html=readFileSync(resolve(dir,'siege-preview-template.html'),'utf8');
html=html.replace(
 '<!-- KTK_SIEGE_PREVIEW_JS -->',
 [
 '<!-- KTK_G54_WEAPON_REAL_JS -->',
 '<!-- KTK_G54_ARMY_REAL_JS -->',
 '<!-- KTK_SHARED_G54_ARMY_COMMANDS_JS -->',
 '<!-- KTK_SIEGE_REAL_ARMY_BRIDGE_JS -->',
 '<!-- KTK_SIEGE_STRUCTURE_COMBAT_JS -->',
 '<!-- KTK_SIEGE_ASSAULT_NAV_JS -->',
 '<!-- KTK_SIEGE_LADDER_AI_JS -->',
 '<!-- KTK_SIEGE_CAPTURE_AI_JS -->',
 '<!-- KTK_SIEGE_DEFENDER_AI_JS -->',
 '<!-- KTK_SIEGE_PLAYER_BALLISTICS_3D_JS -->',
 '<!-- KTK_SIEGE_RAMPART_AI_JS -->',
 '<!-- KTK_SIEGE_PLAYER_COMBAT_JS -->',
 '<!-- KTK_SIEGE_PREVIEW_JS -->',
 '<!-- KTK_SIEGE_PLAYER_LOCOMOTION_JS -->',
 '<!-- KTK_SIEGE_CHARACTER_VISUALS_JS -->',
 '<!-- KTK_SIEGE_REAL_ARMY_OVERLAY_JS -->',
 '<!-- KTK_SIEGE_WEAPON_FEEDBACK_JS -->',
 '<!-- KTK_SIEGE_PLAYER_UI_JS -->'
 ].join('\n')
);
const originalWarning='<b>Geliştirici önizlemesi:</b> Kale yerleşimi ve kuşatma hedef kuralları çalışır. Görünen askerler <b>yerleşim işaretleri</b>, gerçek 140 asker savaş AI\'sı değil.';
const realWarning='<b>S3D1 GERÇEK OYUNCU SAVAŞ ADAYI:</b> Gerçek G5.4 ordusunda 140 asker ve 100 HP\'li insan komutan. <b>FPS/TPS kamera ve WASD ile kılıç, mızrak, yay ve tüfek hasarı G5.4 orijinal asker HP\'sine bağlı.</b> Space zıplama/Shift/C kayma ve oyuncu ok/tüfek 3B kale balistiği eklendi; özgün FFA hareket motoru ve G5.4 botlarının 3B atışları henüz ortak değil; sur üstünden oyuncu 3B menzilli atışları etkin. S4A mavi kara mevzi koordinasyonu, S4B1 gerçek G5.4 sur okçu/tüfekçileri ve 3B asker karşı ateşi var; botların oyuncuya 3B ve karşılıklı sur atışı henüz açık. DEBUG ışınlama/zafer kilitli.';
if(!html.includes(originalWarning))throw Error('Expected original S2 disclaimer missing');
html=html.replace(originalWarning,realWarning);
html=html.replace('Kuşatma Kalesi S1 Harita ve Hedef Önizlemesi',
 'Kuşatma Kalesi — S3D1 FPS ve 140 gerçek G5.4 asker');
html=html.replace('Geliştirici önizlemesi','Geliştirme adayı');
const manifest={
 kind:'S3D1_REAL_G54_HUMAN_HP_AND_GROUNDED_WEAPONS_NOT_FULL_FPS',
 sourceSha256:{},outputSha256:null,bytes:null,
 armyEngine:'G5.4 true-side-swap untouched mirrored source',
 authenticSoldiersAndCombatEngine:true,
 objectiveOccupancyDerivedFromActualSoldiers:true,
 gateStructureAttackFromActualSoldiers:true,
 gateDamageUsesNativeMeleeStats:true,
 siegeAIRealSoldierGateApproachEnabled:true,
 nativeG54HasBuildingEvents:false,
 nativeBlueRoleCoordinatedGroundDefenders:true,
 eightTrueNativeBlueRangedRampartPosts:true,
 optIn3DSoldierVsSoldierCounterfire:true,
 botPlayer3DCounterfire:false,
 nativeG54Reciprocal3DRampartTargeting:false,
 fullS4ElevatedNativeBotRangedAI:false,
 ladderClimbByRealSoldierAI:true,
 ladderConstructionFromGenuineG54SoldierPresence:true,
 realCaptureOnlyFromAliveG54SoldierPositions:true,
 disputedZoneTimerFromS1FSM:true,
 resultFromGenuineSoldierCountsAndHoldClock:true,
 genuineNativePlayerHealthAndHits:true,
 humanG54GroundWeaponDamage:true,
 originalWeaponBalancePreserved:true,
 sharedG54ArmyCommandsUsedInSiege:true,
 nativeG54OrderFormationFireWaypointCommands:true,
 realArmyAndSiegeVisualHUDUnified:false,
 allFourNativePlayerSquadsDirectlyCommandable:false,
 nativeRoleAwareInstancedSoldierVisuals:true,
 exactOriginalFFAMeshReuse:false,
 friendlyFireSuppression:true,
 originalFFAMovementImported:false,
 ballistic3dProjectileImplemented:false,
 actualG54Native3DBallistics:false,
 realFPSPlayerWeaponConnected:true,
 fullOriginalFFAPlayerMovementConnected:false,
 genuineEventOnlyFirstPersonWeaponModels:true,
 genuineG54SourceBackedPlayer3DHitscan:true,
 physicalPlayerBowArrowGravityAndCollision:true,
 player3DBallisticsOnlyNotNativeBotAI:true,
 cosmeticRecoilAndNativeHitFeedback:true,
 actualArenaWeaponMeshesReused:false,
 arenaStyleJumpSlideCastleAdapter:true,
 usesRealCastleSweptCollision:true,
 G84Restored:false,originalFFAChanged:false,mainChanged:false,
 productionSiegeApproved:false
};
for(const [id,path] of Object.entries(files)){
 const js=readFileSync(path,'utf8');
 if(/<\/script/iu.test(js))throw Error('Unsafe inline script close in '+id);
 new vm.Script(js,{filename:path});
 const needle='<!-- '+id+' -->';
 if(!html.includes(needle))throw Error('Missing dependency marker '+id);
 html=html.replace(needle,'<script id="'+id.toLowerCase()+'">\n'+js+'\n</script>');
 manifest.sourceSha256[id]=sha(js);
}
const original='307987855abc0973ea9177fdd659c39d1d02673c8381c0501be8b63c04ddf841';
if(manifest.sourceSha256.KTK_G54_ARMY_REAL_JS!==original)
 throw Error('Original G5.4 true-side engine changed! No unsafe substitution.');
if((html.match(/<script\b/giu)||[]).length!==22||
   html.includes('<!-- KTK_')||
   !html.includes('GERÇEK OYUNCU SAVAŞ ADAYI')||
   !html.includes('Gerçek G5.4 ordusunda 140 asker'))
 throw Error('S3 HTML package cannot substantiate its explicit limits');
mkdirSync(dirname(dest),{recursive:true});
writeFileSync(dest,html,'utf8');
manifest.outputSha256=sha(html);
manifest.bytes=Buffer.byteLength(html,'utf8');
writeFileSync(dest+'.build.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({file:dest,manifest},null,2));
