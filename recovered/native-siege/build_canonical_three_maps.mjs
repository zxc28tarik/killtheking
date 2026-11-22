/**
 * KTK-MAIN-01 — one native FPS engine, three selectable battle maps.
 * Input is the verified AK09 ORIGINAL game, never S3D1/three-iframe launcher.
 * The native G5.4 source stays in its own historical file; output receives
 * the already developed Meadow-only cosmetic layers (no weapon/AI mutations).
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const HERE=dirname(fileURLToPath(import.meta.url));
const sha=s=>createHash('sha256').update(s).digest('hex');
const SCRIPTS=/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
export const extractedScripts=html=>[...html.matchAll(SCRIPTS)].map(m=>m[1]);
function one(src,needle,replacement,tag){
 const parts=src.split(needle);
 if(parts.length!==2)throw Error('Canonical native anchor mismatch ['+tag+']: '+(parts.length-1));
 return parts[0]+replacement+parts[1];
}
function append(src,anchor,addition,label){
 return one(src,anchor,anchor+addition,label);
}
function addon(name){
 const full=resolve(HERE,'../army/integration/'+name);
 const body=readFileSync(full,'utf8');
 if(body.includes('</script'))throw Error('Unsafe module '+name);
 new vm.Script(body,{filename:name});
 return body;
}
export function buildCanonical(original){
 if(typeof original!=='string'||!original.startsWith('<!DOCTYPE html>'))
   throw Error('Only real original native AK09 HTML accepted');
 if(!original.includes('id="native-siege-start"')||
    !original.includes('let nativeSiegeMode = false;')||
    !original.includes('let meadowBattleMode = false;')||
    !original.includes('window.ktkNativeSiegeMapStatus=')||
    !original.includes('AK-NATIVE-09'))
   throw Error('Wrong input: original AK09 single-engine three-map game required');
 if(original.includes('data-ktk-launch="siege"')||
    original.includes('ktk-source-siege')||
    original.includes('frame.srcdoc='))
   throw Error('An old isolated/iframe package is NOT the native original game');
 const matches=[...original.matchAll(SCRIPTS)];
 if(matches.length!==29)throw Error('Native original source expected exactly 29 script blocks, got '+matches.length);
 let body=matches[28][1];
 const before=sha(body);
 const scriptPrelude=[
  addon('g54-meadow-natural-lighting.js'),
  addon('g54-meadow-surface-visual.js'),
  addon('g54-meadow-horizon-visual.js'),
  readFileSync(resolve(HERE,'native-army-match-finish.js'),'utf8'),
  readFileSync(resolve(HERE,'native-battlefield-visual-v19.js'),'utf8'),
  readFileSync(resolve(HERE,'native-siege-visual-v20.js'),'utf8'),
  readFileSync(resolve(HERE,'native-ui-v21.js'),'utf8'),
  readFileSync(resolve(HERE,'native-ui-v22.js'),'utf8'),
  readFileSync(resolve(HERE,'native-ui-v23.js'),'utf8'),
  readFileSync(resolve(HERE,'native-ui-v24.js'),'utf8')
 ].join('\n');
 body=one(body,'        function buildMeadowSquare() {',
   scriptPrelude+'\n        KTKBattlefieldVisualV19.installHud(document);'+
   '\n        KTKNativeUiV21.install(document);'+
   '\n        window.ktkUiV21Status=()=>KTKNativeUiV21.status(document);'+
   '\n        KTKNativeUiV22.install(document);'+
   '\n        window.ktkUiV22Status=()=>KTKNativeUiV22.status(document);'+
   '\n        KTKNativeUiV23.install(document);'+
   '\n        window.ktkUiV23Status=()=>KTKNativeUiV23.status(document);'+
   '\n        KTKNativeUiV24.install(document);'+
   '\n        window.ktkUiV24Status=()=>KTKNativeUiV24.status(document);'+
   '\n        function buildMeadowSquare() {','visual module install');

 body=append(body,
  '        const nativeSiegeGateMesh=nativeSiegeMesh(nativeSiegeParts,\\n          0,3.5,-42,16,7,5,nativeSiegeGateMat);'.replace('\\n','\n'),
  '\n        const v19SiegeDressing=KTKBattlefieldVisualV19.dressSiegeGate(THREE,nativeSiegeParts,nativeSiegeGateMesh);'+
  '\n        window.ktkSiegeVisualV19Status=()=>({...v19SiegeDressing,gateVisible:nativeSiegeGateMesh.visible,groupVisible:nativeSiegeParts.visible});',
  'native wall/gate look');
 // VIS-20 materials and genuine moving equipment details. This is installed
 // after the original native ram/catapult/tower/bridge are fully created, but
 // before equipment is deployed. Nothing is added to native collision lists.
 body=append(body,
  '        nativeSiegeTowerBridge.visible=false;\n        // Narrow side beams are genuine physical collision, while the center\n        // lane remains passable on foot. Dynamic native G5.4 and player cover.',
  '\n        const v20SiegeSkin=KTKNativeSiegeVisualV20.install(THREE,document,nativeSiegeParts,{'+
  'stone:nativeSiegeStone,gateMat:nativeSiegeGateMat,wood:nativeSiegeWood,'+
  'towerWood:nativeSiegeTowerWood,approach:nativeSiegeApproach,'+
  'ram:nativeSiegeRam,catapult:nativeSiegeCatapult,catapultArm:nativeSiegeArm,'+
  'tower:nativeSiegeTower,bridge:nativeSiegeTowerBridge,gate:nativeSiegeGateMesh});'+
  '\n        window.ktkSiegeVisualV20Status=()=>({'+
  'installed:v20SiegeSkin.installed,textureMaps:v20SiegeSkin.textureMaps,'+
  'originalRamRoofReskinned:v20SiegeSkin.originalRamRoofReskinned,'+
  'guardWallStoneCladding:v20SiegeSkin.guardWallStoneCladding,'+
  'wallTrimCount:v20SiegeSkin.wallTrimCount,gateTrimCount:v20SiegeSkin.gateTrimCount,'+
  'ramTrimCount:v20SiegeSkin.ramTrimCount,catapultTrimCount:v20SiegeSkin.catapultTrimCount,'+
  'towerTrimCount:v20SiegeSkin.towerTrimCount,groundWheelTracks:v20SiegeSkin.groundWheelTracks,'+
  'noColliders:v20SiegeSkin.noColliders,noProjectileTargets:v20SiegeSkin.noProjectileTargets,'+
  'originalBattleEngine:v20SiegeSkin.originalBattleEngine,'+
  'realGateVisible:v20SiegeSkin.authenticGateMesh.visible,'+
  'realBridgeVisible:v20SiegeSkin.authenticTower.children.includes(nativeSiegeTowerBridge)&&nativeSiegeTowerBridge.visible,'+
  'ramVisualCount:v20SiegeSkin.authenticRam.children.length,'+
  'catapultArmVisualCount:v20SiegeSkin.authenticCatapultArm.children.length,'+
  'towerVisualCount:v20SiegeSkin.authenticTower.children.length});',
  'authentic G5.4 machine skin and castle materials');


 body=append(body,'        let meadowNearGrass=null;',
   '\n        let meadowDenseGrass=null;','dense variable');
 const grassMark='            meadowNearGrass=null;\n            const leafMat=';
 body=one(body,grassMark,
   '            meadowNearGrass=ArenaMeadowGrass.createInstancedTufts(THREE,spec,2700);\n'+
   '            meadowNearGrass.geometry.scale(.40,.40,.40);\n'+
   '            scene.add(meadowNearGrass);\n'+
   '            meadowDenseGrass=ArenaMeadowGrass.createNearbyTufts(THREE,12000);\n'+
   '            meadowDenseGrass.geometry.scale(.40,.40,.40);\n'+
   '            scene.add(meadowDenseGrass);\n'+
   '            window.ktkMeadowGrassVisualStatus=()=>({'+
   'count:meadowNearGrass.count,nearbyCount:meadowDenseGrass.count,'+
   'visible:meadowNearGrass.visible,nearbyVisible:meadowDenseGrass.visible,'+
   'lastTileX:meadowDenseGrass.userData.lastTileX});\n'+
   '            const leafMat=','native instanced grass');
 // Geometry-level scaling keeps all 28 native utility scripts byte identical.

 body=append(body,'            grassGround.rotation.x=-Math.PI/2;',
   '\n            const meadowSurfaceStatus=KTKMeadowSurfaceVisual.apply(THREE,grassGround,spec);'+
   '\n            window.ktkMeadowSurfaceStatus=()=>meadowSurfaceStatus;','ground colors');
 const leaf='            const leafMat=new THREE.MeshStandardMaterial({color:0x477a32,roughness:.95});';
 body=one(body,leaf,
   '            const meadowHorizon=KTKMeadowHorizon.build(THREE,scene,spec);\n'+
   '            window.ktkMeadowHorizonStatus=()=>({'+
   'triangles:meadowHorizon.triangles,vertices:meadowHorizon.vertices,'+
   'visible:meadowHorizon.mesh.visible,innerRadius:meadowHorizon.innerRadius});\n'+leaf,
   'outside hills');
 body=append(body,
   '            const meadowHorizon=KTKMeadowHorizon.build(THREE,scene,spec);',
   '\n            const v19Groves=KTKBattlefieldVisualV19.addMeadowGroves(THREE,scene,spec);'+
   '\n            window.ktkMeadowGrovesV19Status=()=>({trees:v19Groves.trees,drawBatches:v19Groves.drawBatches,'+
   'minDistanceFromCenter:v19Groves.minDistanceFromCenter,visible:v19Groves.group.visible,noColliders:true});',
   'perimeter grove');

 const mapSwitch="            meadowMapData.visuals.forEach(obj=>{obj.visible=map==='meadow';});";
 body=append(body,mapSwitch,
   "\n            scene.fog.density=map==='meadow'?.00065:.0046;"+
   "\n            scene.fog.color.setHex(map==='meadow'?0xb9b7a3:0xd9824c);"+
   "\n            if(skyDomeMesh)skyDomeMesh.scale.setScalar(map==='meadow'?Math.max(4,meadowSpec.half/90):1);"+
   "\n            skyClouds.forEach(c=>{c.mesh.visible=map==='castle';});"+
   "\n            window.ktkMeadowSkyVisualStatus=()=>({skyRadius:240*skyDomeMesh.scale.x,meadowHalf:meadowSpec.half,mode:arenaMap,visibleClouds:skyClouds.filter(c=>c.mesh.visible).length});"+
   "\n            scene.background.setHex(map==='meadow'?0xb9c5b6:0xd97736);",
   'map scoped horizon/fog');
 body=one(body,"                map==='meadow'?8:1);",
   "                map==='meadow'?Math.max(8,meadowSpec.half/90):1);",
   'large map sky radius');
 body=one(body,'                spawnSmokeCloud(camera.position, dir, 22, 3.0);',
   '                spawnSmokeCloud(meadowBattleMode?camera.position.clone().addScaledVector(dir,5):camera.position,dir,meadowBattleMode?8:22,meadowBattleMode?1.0:3.0);',
   'army-only camera-safe smoke');
 body=append(body,'            renderer.toneMappingExposure = atmo.exposure;',
   '\n            if(window.__ktkMeadowLightActive) window.ktkMeadowLightStatus='+
   'KTKMeadowNaturalLighting.apply(THREE,{scene,renderer,sunLight,hemiLight,'+
   'skyDomeMesh,sunDiscMesh,sunHaloMesh,createSkyGradientTexture},currentAtmosphereIdx);',
   'meadow atmosphere');
 body=append(body,'            arenaMap=map;',
   "\n            window.__ktkMeadowLightActive=map==='meadow';"+
   "\n            window.setAtmosphere(currentAtmosphereIdx);",
   'map-scoped daylight');
 // KTK-SIEGE-SESSION-02: the original ArenaMatch.finish() requires phase
 // 'results'. A real 140-soldier victory can happen before the 4-min timer;
 // synchronize only that genuine victory with the existing match lifecycle.
 const originalEarlyWin=
  "            if (matchFinished || (meadowBattleMode&&meadowBattleState&&meadowBattleState.winner))\n"+
  "                showMatchResults();";
 const correctedEarlyWin=
  "            const nativeArmyWinner=meadowBattleMode&&meadowBattleState&&meadowBattleState.winner;\n"+
  "            KTKNativeArmyMatchFinish.acceptEarlyWin(arenaMatch,nativeArmyWinner);\n"+
  "            if (matchFinished || nativeArmyWinner) showMatchResults();";
 body=one(body,originalEarlyWin,correctedEarlyWin,'early native army/siege finish');
 body=one(body,
  "                result.meadowBattle=summary;",
  "                KTKNativeArmyMatchFinish.decorate(arenaMatch,result,summary,nativeSiegeMode,\n"+
  "                  !!(nativeSiegeMode&&nativeSiegeEquipment?.win));",
  'real G5.4 winner and elapsed time metadata');
 // Native G5.4 field battles enter with a readable compact order panel,
 // and F10 can expand it in BOTH Army and Siege. F6-F9 remain siege-only.
 body=one(body,
  "            army.classList.toggle('ktk-siege-slim',nativeSiegeMode&&slim);",
  "            army.classList.toggle('ktk-siege-slim',meadowBattleMode&&slim);",
  'compact 70v70 meadow HUD');
 body=one(body,
  "            if(on){slim=true;army.querySelectorAll('details').forEach(d=>d.open=false);}",
  "            if(meadowBattleMode){slim=true;army.querySelectorAll('details').forEach(d=>d.open=false);}",
  'reset to compact for both army maps');
 body=one(body,
  "const flip=()=>{if(!nativeSiegeMode)return;slim=!slim;sync();};",
  "const flip=()=>{if(!meadowBattleMode)return;slim=!slim;sync();};",
  'expand G5.4 army orders');
 body=one(body,
  "                if(nativeSiegeMode){\n                    if(e.code==='F10'){e.preventDefault();KTKNativeSiegeHud.flip();return;}",
  "                if(e.code==='F10'){e.preventDefault();KTKNativeSiegeHud.flip();return;}\n                if(nativeSiegeMode){",
  'F10 toggles real same-game field commander HUD');
 body=append(body,"        function resetFreeForAllRound() {",
  "\n            KTKBattlefieldVisualV19.setBattleUi(document,meadowBattleMode);",
  'battle-only HUD and world panorama');
 body=append(body,
  "        document.getElementById('match-menu-btn').addEventListener('click', () => {",
  "\n            KTKBattlefieldVisualV19.setBattleUi(document,false);",
  'do not alter FFA original HUD');
 // Hide the in-game HUD only on real G5.4 victory/timeout overlay, and
 // restore it before the normal reset/replay or main-menu transition.
 body=one(body,
  "                armyBattleHud.classList.add('hidden');\n"+
  "                matchResultsOverlay.classList.remove('hidden');",
  "                armyBattleHud.classList.add('hidden');\n"+
  "                matchResultsOverlay.classList.remove('hidden');\n"+
  "                KTKNativeArmyMatchFinish.showResults(document);",
  'native result UI suppression');
 body=append(body,"        function resetFreeForAllRound() {",
  "\n            KTKNativeArmyMatchFinish.restoreHud(document);",
  'restore HUD on rematch');
 body=append(body,
  "        document.getElementById('match-menu-btn').addEventListener('click', () => {",
  "\n            KTKNativeArmyMatchFinish.restoreHud(document);",
  'restore HUD when leaving results for main menu');

 // The original match-duration UI is still used by all three maps.
 // In an early genuine G5.4 victory, pointerlockchange calls
 // syncMatchDurationControls() again; never overwrite actual elapsed time.
 body=one(body,
  "            matchDurationLabel.textContent = ArenaMatch.clock(arenaMatch.durationSeconds);",
  "            matchDurationLabel.textContent = ArenaMatch.clock(\n"+
  "              meadowBattleMode&&arenaMatch.phase==='results'&&arenaMatch.result?.battleOutcome\n"+
  "                ? arenaMatch.result.seconds:arenaMatch.durationSeconds);",
  'early G5.4 result duration survives pointer unlock');

 body=one(body,'            renderer.render(scene, camera);',
   "            if(arenaMap==='meadow'&&meadowDenseGrass){\n"+
   '              ArenaMeadowGrass.updateNearbyTufts(THREE,meadowDenseGrass,meadowSpec,player.pos.x,player.pos.z);\n'+
   '            }\n            renderer.render(scene, camera);','camera-local grass');

 new vm.Script(body,{filename:'canonical-native-ak09-game.js'});
 const last=matches[28], opener=last[0].slice(0,last[0].indexOf(last[1]));
 const entire=opener+body+last[0].slice(opener.length+last[1].length);
 let output=original.slice(0,last.index)+entire+original.slice(last.index+last[0].length);
 output=one(output,
  '<span id="match-duration-label">04:00</span> DAKİKALIK MAÇ',
  '<span id="match-duration-label">04:00</span> <span id="match-results-duration-description">DAKİKALIK MAÇ</span>',
  'native result duration label');
 const oldScripts=extractedScripts(original),newScripts=extractedScripts(output);
 if(newScripts.length!==29||oldScripts.length!==29)
   throw Error('Canonical script count changed');
 for(let i=0;i<28;i++)if(oldScripts[i]!==newScripts[i])
   throw Error('Original combat/movement/AI script changed: '+i);
 if(output.includes('ktk-source-siege')||output.includes('data-ktk-launch='))
   throw Error('Unexpected separate game launcher in canonical output');
 for(const key of ['id="native-siege-start"','meadowBattleMode = false','nativeSiegeMode = false',
   'window.ktkNativeSiegeMapStatus=','KTKMeadowHorizon.build','KTKMeadowSurfaceVisual.apply',
   'KTKMeadowNaturalLighting.apply','ArenaMeadowGrass.createNearbyTufts',
   'KTKNativeArmyMatchFinish.acceptEarlyWin','KTKNativeArmyMatchFinish.decorate',
   'KTKNativeArmyMatchFinish.showResults','KTKNativeArmyMatchFinish.restoreHud',
   'KTKBattlefieldVisualV19.addMeadowGroves','KTKBattlefieldVisualV19.dressSiegeGate',
   'KTKBattlefieldVisualV19.setBattleUi',
   'KTKNativeSiegeVisualV20.install','ktkSiegeVisualV20Status',
   'KTKNativeUiV21.install','ktkUiV21Status',
   'KTKNativeUiV22.install','ktkUiV22Status',
   'KTKNativeUiV23.install','ktkUiV23Status',
   'KTKNativeUiV24.install','ktkUiV24Status'])
   if(!output.includes(key))throw Error('Missing canonical marker: '+key);
 const manifest={
  product:'Kill the King',kind:'SINGLE_NATIVE_FPS_THREE_MAPS',
  maps:['arena','meadow-army','castle-siege'],
  oneRendererOneMovementEngine:true,oneLiveGameDocument:true,
  oldIframeOrSeparateS3D1Runtime:false,
  originalAK09SourceSha256:sha(original),originalAK09LastScriptSha256:before,
  unchangedOriginalScriptCount:28,totalScriptCount:29,
  usesNativeAK09G54Siege:true,
  nativeArmyAndSiegeTroops:140,
  meadowVisibleGrassInstanced:14700,
  meadowPerimeterTreesVisualOnly:180,
  siegeGateMasonryVisualOnly:true,
  castleSiegeVisualV20:{texturedMaterials:5,cosmeticOnly:true,includesNativeTower:true},
  armyAndSiegeCompactHudDefault:true,
  unifiedNativeUiV21:{design:'period-war-bronze',modes:3,renderOnly:true,originalControls:true},
  nativeUiV22:{design:'historical-war-room',modes:3,renderOnly:true,originalControls:true},
  nativeUiV23:{design:'class-heraldry-and-command',modes:3,decorativeOnly:true,originalControls:true},
  nativeUiV24:{design:'historical-war-council-etchings',modes:3,decorativeOnly:true,originalControls:true},
  meadowInteriorWalkableHillsAdded:false,
  sourceBytePreservedInRepository:true,
  userWindowsGPUAccepted:false,productionApproved:false,
  sha256:sha(output),bytes:Buffer.byteLength(output)
 };
 return {html:output,manifest};
}
export function build({inputFile,outFile}={}){
 const source=inputFile||resolve(HERE,'KillTheKing_AK_NATIVE_09_original_game_siege_map.html');
 const dest=outFile||resolve(HERE,'dist/KillTheKing_3_Harita_TEK_ORJINAL_OYUN_ADAY.html');
 const {html,manifest}=buildCanonical(readFileSync(source,'utf8'));
 mkdirSync(dirname(dest),{recursive:true});
 writeFileSync(dest,html,'utf8');
 writeFileSync(dest+'.build.json',JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({dest,manifest},null,2));
 return {html,manifest};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 build({inputFile:process.argv[2],outFile:process.argv[3]});
