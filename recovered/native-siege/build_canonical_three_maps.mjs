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
  addon('g54-meadow-horizon-visual.js')
 ].join('\n');
 body=one(body,'        function buildMeadowSquare() {',
   scriptPrelude+'\n        function buildMeadowSquare() {','visual module install');

 body=append(body,'        let meadowNearGrass=null;',
   '\n        let meadowDenseGrass=null;','dense variable');
 const grassMark='            meadowNearGrass=null;\n            const leafMat=';
 body=one(body,grassMark,
   '            meadowNearGrass=ArenaMeadowGrass.createInstancedTufts(THREE,spec,2700);\n'+
   '            scene.add(meadowNearGrass);\n'+
   '            meadowDenseGrass=ArenaMeadowGrass.createNearbyTufts(THREE,12000);\n'+
   '            scene.add(meadowDenseGrass);\n'+
   '            window.ktkMeadowGrassVisualStatus=()=>({'+
   'count:meadowNearGrass.count,nearbyCount:meadowDenseGrass.count,'+
   'visible:meadowNearGrass.visible,nearbyVisible:meadowDenseGrass.visible,'+
   'lastTileX:meadowDenseGrass.userData.lastTileX});\n'+
   '            const leafMat=','native instanced grass');
 body=one(body,'   const size=.46+.3*rng(),height=.34+.44*rng();',
   '   const size=.17+.11*rng(),height=.13+.20*rng();','small near grass');
 body=one(body,'   const height=.3+.4*rng(),width=.43+.3*rng(),angle=2*Math.PI*rng();',
   '   const height=.12+.18*rng(),width=.17+.13*rng(),angle=2*Math.PI*rng();','small far grass');

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
 body=one(body,'            renderer.render(scene, camera);',
   "            if(arenaMap==='meadow'&&meadowDenseGrass){\n"+
   '              ArenaMeadowGrass.updateNearbyTufts(THREE,meadowDenseGrass,meadowSpec,player.pos.x,player.pos.z);\n'+
   '            }\n            renderer.render(scene, camera);','camera-local grass');

 new vm.Script(body,{filename:'canonical-native-ak09-game.js'});
 const last=matches[28], opener=last[0].slice(0,last[0].indexOf(last[1]));
 const entire=opener+body+last[0].slice(opener.length+last[1].length);
 const output=original.slice(0,last.index)+entire+original.slice(last.index+last[0].length);
 const oldScripts=extractedScripts(original),newScripts=extractedScripts(output);
 if(newScripts.length!==29||oldScripts.length!==29)
   throw Error('Canonical script count changed');
 for(let i=0;i<28;i++)if(oldScripts[i]!==newScripts[i])
   throw Error('Original combat/movement/AI script changed: '+i);
 if(output.includes('ktk-source-siege')||output.includes('data-ktk-launch='))
   throw Error('Unexpected separate game launcher in canonical output');
 for(const key of ['id="native-siege-start"','meadowBattleMode = false','nativeSiegeMode = false',
   'window.ktkNativeSiegeMapStatus=','KTKMeadowHorizon.build','KTKMeadowSurfaceVisual.apply',
   'KTKMeadowNaturalLighting.apply','ArenaMeadowGrass.createNearbyTufts'])
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
