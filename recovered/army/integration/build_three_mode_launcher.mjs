/**
 * Kill the King — THIRD MODE: Castle Siege.
 *
 * Extends the APPROVED-CANDIDATE TWO-MODE MENU, not the original FFA or
 * army gameplay sources. Packs 3 separate complete original HTML games as
 * inert, UTF-8 base64 into ONE offline HTML (no server, no network).
 * Uses exactly one live iframe at a time, destroys old game on switch.
 *
 * This is a genuine SINGLE MAIN MENU with 3 PLAYABLE CHOICES, not one
 * unified shared physics/renderer. The siege has a separate 3D art system,
 * and the original FPS locomotion/bullet ballistics are NOT yet ported.
 * Main, original FFA, original G5.4, and all historical artifacts remain.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const base=dirname(fileURLToPath(import.meta.url));
const sha=t=>createHash('sha256').update(t).digest('hex');
const sourceScripts=s=>[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
const one=(s,needle)=>{if(s.split(needle).length!==2)throw Error('Expected exactly one: '+needle);return true;};
const oldTitle='<title>Kill the King — Arena ve Ordu Savaşı • İzole Entegrasyon Adayı</title>';
const oldIntro='<h1>İki oyun modu, ayrı çalışma ortamları</h1>';
const oldNav='<button type="button" class="pick" data-ktk-launch="army">🛡 140 ASKERLİ ORDU SAVAŞI</button>';
const siegeNav='<button type="button" class="pick" data-ktk-launch="siege">🏰 KALE KUŞATMASI</button>';
const oldControllerGuard='if(!["ffa","army"].includes(mode))return;';
const oldTitleExpr='frame.title=mode==="ffa"?"Kill the King Serbest Arena":"Kill the King G5.4 Ordu Savaşı";';
const oldInfoExpr='info.textContent=mode==="ffa"?"FFA / TDM • Oyuncu da hedeflenir":"G5.4 • 70 mavi + 70 kırmızı • oyuncu hedefleme düzeltmesi";';
const oldPayloadIntro='<script type="application/octet-stream" id="ktk-source-army">';
const oldPayloadEnd='</script><script>';
function expectSource(check,id){
 const needle='<script type="application/octet-stream" id="ktk-source-'+id+'">';
 if(!check.includes(needle))throw Error('Missing independently preserved '+id+' source');
 const rest=check.slice(check.indexOf(needle)+needle.length);
 const encoded=rest.slice(0,rest.indexOf('</script>')).trim();
 if(!/^[A-Za-z0-9+/=\s]+$/.test(encoded))throw Error('Invalid source base64 '+id);
 return Buffer.from(encoded,'base64').toString('utf8');
}
function fieldArmyAddon(){
 const module=readFileSync(resolve(base,'../modules/g54-four-squad-command.js'),'utf8');
 const runtime=readFileSync(resolve(base,'g54-field-four-squad-runtime.js'),'utf8');
 for(const [name,code]of [['four-squad module',module],['field runtime',runtime]]){
   if(!code.includes('AK-04')||/<\/script/i.test(code))
     throw Error('Unsafe or unverified AK-04b native field adapter: '+name);
   new vm.Script(code,{filename:name+'.js'});
 }
 return '<script>'+module+'</script>'+'<script>'+runtime+'</script>';
}
export function addCastleThirdMode(twoModeHtml, siegeHtml){
 if(typeof twoModeHtml!=='string'||typeof siegeHtml!=='string')
   throw Error('Give exact two-mode HTML and real S3D1 siege HTML');
 for(const id of ['ffa','army'])if(!expectSource(twoModeHtml,id).startsWith('<!'))
   throw Error('Historical '+id+' source not embedded');
 if(!siegeHtml.startsWith('<!')||!siegeHtml.includes('S3D1 GERÇEK OYUNCU SAVAŞ ADAYI')||
   !siegeHtml.includes('ktkSiegePlayerCombatStatus')||
   !siegeHtml.includes('ktkSiegeArmyStatus')||
   sourceScripts(siegeHtml).length!==27||
   !siegeHtml.includes('KTKSiegeRam')||
   !siegeHtml.includes('KTKSiegeCatapult')||
   !siegeHtml.includes('ktkSiegeArmyStatus')||
   !siegeHtml.includes('KTKG54FourSquadCommand')||
   !siegeHtml.includes('ktkSiegeFourSquadCommandStatus')||
   !siegeHtml.includes('KTKSharedG54PlayerInput')||
   !siegeHtml.includes('KTKSharedG54BattleSession')||
   !siegeHtml.includes('ktkSiegeSharedBattleSessionStatus')||
   !siegeHtml.includes('KTKSharedG54ArmyCommands')||
   !siegeHtml.includes('ktkSiegeArmyCommandStatus')||
   !siegeHtml.includes('KTKSiegeRampartAI')||
   !siegeHtml.includes('KTKSiegeDefenderAI')||
   !siegeHtml.includes('KTKSiege3DBallistics')||
   !siegeHtml.includes('KTKSiegeWeaponFeedback')||
   !siegeHtml.includes('KTKSiegePlayerLocomotion')||
   !siegeHtml.includes('KTKSiegeCharacterVisuals'))
   throw Error('Required real S3D1 140-man FPS castle candidate missing or mislabeled');
 for(const text of [oldTitle,oldIntro,oldNav,oldControllerGuard,oldTitleExpr,oldInfoExpr,oldPayloadIntro,oldPayloadEnd])one(twoModeHtml,text);
 if(twoModeHtml.includes('data-ktk-launch="siege"')||twoModeHtml.includes('ktk-source-siege'))
   throw Error('Third mode already present');
 let result=twoModeHtml;
 const replace=(a,b)=>{one(result,a);result=result.replace(a,b)};
 replace(oldTitle,'<title>Kill the King — Arena • Ordu Savaşı • Kale Kuşatması</title>');
 replace(oldIntro,'<h1>Kill the King — 3 Oyun Modu</h1>');
 replace(oldNav,oldNav+'\n'+siegeNav);
 // Existing TWO independently approved modes retain their exact embedded
 // sources, graphics, bot behaviors and combat code.
 replace('<div class="facts"><section><strong>Serbest Arena / TDM</strong>',
   '<div class="facts"><section><strong>Serbest Arena / TDM</strong>');
 // The facts container is anchored to the exact next paragraph.
 const twoEnd='Bu sürümde oyuncu tarafı mavi.</span></section></div>';
 one(result,twoEnd);
 result=result.replace(twoEnd,twoEnd.replace('</div>',
   '<section><strong>🏰 Kale Kuşatması — Üçüncü Mod</strong><span>'+
   '140 gerçek G5.4 askerle saldır veya savun. Kale kapısı kırılır; iki yan merdiven kurulur, avlu ve iç kale ele geçirilir. '+
   'FPS/TPS, 100 HP, kılıç/mızrak/yay/tüfek. Ayrı S3D1 3B sahnesi: sınıf bazlı kuşatma görsellerinin Arena ile birebir eşitliği ve tam özgün FPS motoru henüz sağlanmadı; oyuncu 3B ok/tüfek atışı mevcut, G5.4 botlarının 3B nişanı henüz yok.'+
   '</span></section></div>'));
 replace('<p>Bu aday, Ekim 2026 tarihli kabul edilmiş FFA oyununun özgün sürümünü arşivler; FFA hedef seçimine sınırlı düzeltme uygular. G5.4 ordu savaşı ayrı bir oyun penceresinde açılır; geçişte önceki oyun kapatılır. Her iki oyun aynı çevrimdışı HTML içindedir.</p>',
   '<p>Üç oyun modu artık aynı ana menüden açılır. Serbest Arena/TDM ve Ordu Savaşı özgün kaynaklarını korur. Kale Kuşatması üçüncü oynanabilir seçimdir; mod geçişinde önceki oyun kapatılır, yeni mod açılır. Üçü de bu tek çevrimdışı HTML dosyasındadır.</p>');
 replace('<p><strong>Bu henüz son birleşik oyun değildir.</strong> Modlar ayrı çalışır; paylaşılan ilerleme/kayıt sistemi, G8.4 senaryoları ve gerçek GPU kabulü daha sonra yapılacaktır. Moddan çıkmadan önce ESC ile fare kilidini bırak.</p>',
   '<p><strong>3 mod tek menüde — oyun motorları hâlâ izole.</strong> Oyuncu ok/tüfek için 3B kale balistiği var; G5.4 botlarının tam 3B fiziği, özgün FFA grafik/animasyon ortaklaştırması, paylaşılan kayıt, gerçek GPU ve nihai yayın kabulü açık. Mod değiştirmeden önce ESC ile fare kilidini bırak.</p>');
 replace('<small>BOT HEDEFLEME DÜZELTMESİ • ADAY</small>',
   '<small>3 OYUN MODU • GELİŞTİRME ADAYI</small>');
 replace(oldControllerGuard,'if(!["ffa","army","siege"].includes(mode))return;');
 replace(oldTitleExpr,
   'frame.title=mode==="ffa"?"Kill the King Serbest Arena":mode==="army"?"Kill the King G5.4 Ordu Savaşı":"Kill the King Kale Kuşatması";');
 replace(oldInfoExpr,
   'info.textContent=mode==="ffa"?"FFA / TDM • Oyuncu da hedeflenir":mode==="army"?"G5.4 • 70 mavi + 70 kırmızı • dört dost bölük komutası":"KALE KUŞATMASI • 70 saldıran + 70 savunan • kapı, sur ve iç kale";');
 // AK-04b: the original field game stays EXACTLY unchanged in the
 // original inert base64 archive. Only the DECODED army frame receives a
 // self-contained, source-audited, offline opt-in native command adapter.
 // Existing original FFA and S3D1 siege are never touched.
 const originalLoad='stage.appendChild(frame);frame.srcdoc=decode("ktk-source-"+mode);';
 const addonB64=Buffer.from(fieldArmyAddon(),'utf8').toString('base64');
 const horizonB64=Buffer.from(readFileSync(resolve(base,'g54-meadow-horizon-visual.js'),'utf8'),'utf8').toString('base64');
 const surfaceB64=Buffer.from(readFileSync(resolve(base,'g54-meadow-surface-visual.js'),'utf8'),'utf8').toString('base64');
 const runtimeLoad='stage.appendChild(frame);'+
   'const original=decode("ktk-source-"+mode);'+
   'const ak04b='+JSON.stringify(addonB64)+';'+
   'const horizonB64='+JSON.stringify(horizonB64)+';'+
   'const surfaceB64='+JSON.stringify(surfaceB64)+';'+
   'if(mode==="army"){'+
     'if(original.split("</body>").length!==2)throw Error("AK04b original body changed");'+
   // MAP2 native grass enhancement. The historical G5.4 HTML remains
   // unchanged inside the base64 archive. Patch the decoded field only.
   // Large meadow batches: distant sparse grass + dense, player-local grass.
   'const grassMark="            meadowNearGrass=null;\\n            const leafMat=";'+
   'if(original.split(grassMark).length!==2)throw Error("MAP2 grass anchor changed");'+
   'let visualArmy=original.replace(grassMark,'+
     '"            meadowNearGrass=ArenaMeadowGrass.createInstancedTufts(THREE,spec,2700);\\n'+
     '            scene.add(meadowNearGrass);\\n'+
     '            meadowDenseGrass=ArenaMeadowGrass.createNearbyTufts(THREE,12000);\\n'+
     '            scene.add(meadowDenseGrass);\\n'+
     '            window.ktkMeadowGrassVisualStatus=()=>({\\n'+
     '              count:meadowNearGrass.count,\\n'+
     '              nearbyCount:meadowDenseGrass.count,\\n'+
     '              meshName:meadowNearGrass.name,\\n'+
     '              visible:meadowNearGrass.visible,\\n'+
     '              nearbyVisible:meadowDenseGrass.visible,\\n'+
     '              lastTileX:meadowDenseGrass.userData.lastTileX\\n'+
     '            });\\n            const leafMat=");'+
   'const grassVar="        let meadowNearGrass=null;";'+
   'if(visualArmy.split(grassVar).length!==2)throw Error("MAP2 nearby variable anchor changed");'+
   'visualArmy=visualArmy.replace(grassVar,grassVar+"\\n        let meadowDenseGrass=null;");'+
   // The original grass blades were visually oversized in the real
   // Chromium screenshot. Keep density but narrow and lower each tuft.
   'const grassNearSize="   const size=.46+.3*rng(),height=.34+.44*rng();";'+
   'if(visualArmy.split(grassNearSize).length!==2)throw Error("MAP2 native grass size anchor changed");'+
   'visualArmy=visualArmy.replace(grassNearSize,'+
     '"   const size=.17+.11*rng(),height=.13+.20*rng();");'+
   'const grassFarSize="   const height=.3+.4*rng(),width=.43+.3*rng(),angle=2*Math.PI*rng();";'+
   'if(visualArmy.split(grassFarSize).length!==2)throw Error("MAP2 far grass size anchor changed");'+
   'visualArmy=visualArmy.replace(grassFarSize,'+
     '"   const height=.12+.18*rng(),width=.17+.13*rng(),angle=2*Math.PI*rng();");'+

   // Install visual-only hills as a local symbol in the original game script.
   // MAP2 interior surface: physically flat, spatially varied grass colors.
   'const surfaceScript=new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(atob(surfaceB64),c=>c.charCodeAt(0)));'+
   'const horizonScript=new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(atob(horizonB64),c=>c.charCodeAt(0)));'+
   'const horizonFunction="        function buildMeadowSquare() {";'+
   'if(visualArmy.split(horizonFunction).length!==2)throw Error("MAP2 horizon function anchor changed");'+
   'visualArmy=visualArmy.replace(horizonFunction,surfaceScript+"\\n"+horizonScript+"\\n"+horizonFunction);'+
   'const surfaceAnchor="            grassGround.rotation.x=-Math.PI/2;";'+
   'if(visualArmy.split(surfaceAnchor).length!==2)throw Error("MAP2 ground surface anchor changed");'+
   'visualArmy=visualArmy.replace(surfaceAnchor,surfaceAnchor+'+
     '"\\n            const meadowSurfaceStatus=KTKMeadowSurfaceVisual.apply(THREE,grassGround,spec);'+
     '\\n            window.ktkMeadowSurfaceStatus=()=>meadowSurfaceStatus;");'+
   'const horizonGround="            const leafMat=new THREE.MeshStandardMaterial({color:0x477a32,roughness:.95});";'+
   'if(visualArmy.split(horizonGround).length!==2)throw Error("MAP2 horizon ground anchor changed");'+
   'visualArmy=visualArmy.replace(horizonGround,'+
      '"            const meadowHorizon=KTKMeadowHorizon.build(THREE,scene,spec);\\n'+
      '            window.ktkMeadowHorizonStatus=()=>({\\n'+
      '              triangles:meadowHorizon.triangles,\\n'+
      '              vertices:meadowHorizon.vertices,\\n'+
      '              visible:meadowHorizon.mesh.visible,\\n'+
      '              innerRadius:meadowHorizon.innerRadius\\n'+
      '            });\\n"+horizonGround);'+
   'const mapVisualSwitch="            meadowMapData.visuals.forEach(obj=>{obj.visible=map===\'meadow\';});";'+
   'if(visualArmy.split(mapVisualSwitch).length!==2)throw Error("MAP2 switch anchor changed");'+
   'visualArmy=visualArmy.replace(mapVisualSwitch,mapVisualSwitch+'+
      '"\\n            scene.fog.density=map===\'meadow\'?.00065:.0046;'+
      '\\n            scene.fog.color.setHex(map===\'meadow\'?0xb9b7a3:0xd9824c);'+
      '\\n            if(skyDomeMesh)skyDomeMesh.scale.setScalar(map===\'meadow\'?Math.max(4,meadowSpec.half/90):1);'+
      '\\n            skyClouds.forEach(c=>{c.mesh.visible=map===\'castle\';});'+
      '\\n            window.ktkMeadowSkyVisualStatus=()=>({skyRadius:240*skyDomeMesh.scale.x,meadowHalf:meadowSpec.half,mode:arenaMap,visibleClouds:skyClouds.filter(c=>c.mesh.visible).length});'+
      '\\n            scene.background.setHex(map===\'meadow\'?0xb9c5b6:0xd97736);");'+
   // The existing G5.4 map switch resets sky scale to 8 AFTER our hook.
   'const quote=String.fromCharCode(39);'+
   'const oldSkyScale="                map==="+quote+"meadow"+quote+"?8:1);";'+
   'if(visualArmy.split(oldSkyScale).length!==2)throw Error("MAP2 original sky scale anchor changed");'+
   'visualArmy=visualArmy.replace(oldSkyScale,oldSkyScale.replace("?8:1);","?Math.max(8,meadowSpec.half/90):1);"));'+
   // TEMPORARY V17 QA probe: capture scene identity without changing physics.
   'const probeMarker="        const meadowMapData={";'+
   'if(visualArmy.split(probeMarker).length!==2)throw Error("MAP2 probe scene anchor changed");'+
   'visualArmy=visualArmy.replace(probeMarker,"        window.__ktkVisualProbeScene=scene;\\n"+probeMarker);'+
   'const renderMark="            renderer.render(scene, camera);";'+
   'if(visualArmy.split(renderMark).length!==2)throw Error("MAP2 render anchor changed");'+
   'visualArmy=visualArmy.replace(renderMark,'+
     '"            if(arenaMap===\'meadow\'&&meadowDenseGrass){\\n'+
     '              ArenaMeadowGrass.updateNearbyTufts(THREE,meadowDenseGrass,meadowSpec,player.pos.x,player.pos.z);\\n'+
     '            }\\n"+renderMark);'+
     'const bytes=Uint8Array.from(atob(ak04b),c=>c.charCodeAt(0));'+
     'const addon=new TextDecoder("utf-8",{fatal:true}).decode(bytes);'+
     'frame.srcdoc=visualArmy.replace("</body>",addon+"</body>");'+
   '}else frame.srcdoc=original;';
 replace(originalLoad,runtimeLoad);
 // Add the entire S3D1 game as a third inert payload, immediately before
 // the original controller script. No external file dependencies.
 one(result,oldPayloadEnd);
 result=result.replace(oldPayloadEnd,
   '</script>\n<script type="application/octet-stream" id="ktk-source-siege">\n'+
   Buffer.from(siegeHtml,'utf8').toString('base64')+
   '\n'+oldPayloadEnd);
 if(sourceScripts(result).length!==4||result.includes('<script src=')||
    !result.includes('ktk-source-siege')||
    !result.includes('data-ktk-launch="siege"'))
   throw Error('Three-game standalone HTML is malformed');
 const recovered=expectSource(result,'siege');
 if(recovered!==siegeHtml||expectSource(result,'ffa')!==expectSource(twoModeHtml,'ffa')||
    expectSource(result,'army')!==expectSource(twoModeHtml,'army'))
   throw Error('One of three game sources changed during packaging');
 const controller=sourceScripts(result).at(-1)[1];
 new vm.Script(controller,{filename:'ktk-three-mode-router.js'});
 return result;
}
export function build({dualFile,siegeFile,outFile}={}){
 if(!dualFile||!siegeFile||!outFile)throw Error('Dual, siege and output HTML filenames required');
 const dual=readFileSync(resolve(dualFile),'utf8');
 const siege=readFileSync(resolve(siegeFile),'utf8');
 const html=addCastleThirdMode(dual,siege);
 const dest=resolve(outFile);
 mkdirSync(dirname(dest),{recursive:true});
 writeFileSync(dest,html,'utf8');
 const manifest={
  kind:'KILL_THE_KING_THREE_MODES_ONE_HTML_ISOLATED_RUNTIME_CANDIDATE',
  modes:['ffa','army','siege'],
  modeLabels:['Serbest Arena / TDM','140 Askerli Ordu Savaşı','Kale Kuşatması'],
  combinedSingleOfflineHTML:true,singleLauncherMenu:true,
  oneLiveGameAtATime:true,gameSourcesBytePreserved:true,
  sourceSha256:{ffa:sha(expectSource(html,'ffa')),
    army:sha(expectSource(html,'army')),
    siege:sha(expectSource(html,'siege')),
    oldTwoModeLauncher:sha(dual)},
  sha256:sha(html),bytes:Buffer.byteLength(html),
  siegeRealSoldiers:140,
  siegeOriginalFFARendererShared:false,
  siegeOriginalFFAMovementShared:false,
  siegeSameNativeG54ArmyCommanderCommands:true,
  siegeAK03SharedNativeG54BattleSession:true,
  siegeAK03bFieldStylePointerLockAndAim:true,
  siegeAK04aNativeFourSquadCastleOrders:true,
  siegeAK05aNativeCrewOperatedRam:true,
  siegeAK05aRealRamThreeJSModel:true,
  siegeAK05c1GenuineArcherCrewCatapult:true,
  siegeAK05c1Actual3DStoneAndS1GateDamage:true,
  siegeAK05c1EnemySoldierSplashDamageImplemented:false,
  siegeAK05c1CounterBatteryAndSiegeTowerComplete:false,
  siegeAK05c2CatapultHPAndDestruction:true,
  siegeAK05c2RealG54BlueRampartCounterBattery:true,
  siegeAK05c2OriginalMusketFifteenSecondClock:true,
  siegeAK05c2CatapultBowCounterfireAndSplashNotYetImplemented:true,
  siegeAK05b1DynamicGroundCollision:true,
  siegeAK05b2NativeBlueRampartMusketRamShots:true,
  siegeAK05b2RamHPAndDestruction:true,
  siegeAK05b2NativePikeCrewRecall:true,
  siegeAK05b3NativeBowPhysical3DRamShots:true,
  siegeAK05b3ExistingBowFourSecondCadence:true,
  siegeAK05b3EquipmentImpactVisualFlash:true,
  siegeAK05b3FullAudioAndWindowsGPUAccepted:false,
  siegeAK05b2PlayerCounterfireAgainstRamImplemented:false,
  siegeAK05b2NativeBlueBowVsRamImplemented:false,
  siegeAK05aIndependentSiegeCatapultComplete:false,
  siegeAK05aIndependentSiegeTowerComplete:false,
  siegeAK04aFourDistinctAlliedNativeSquads:true,
  fieldArmyUnmodifiedSourceFourSquadUIIntegrated:true,
  fieldArmyOriginalPayloadByteIdentical:true,
  AK04bFieldNativeFourSquadRuntimeAddon:true,
  AK04bFieldRuntimeOnlyInjection:true,
  siegeAK03bSharedInputWASDJumpSlide:true,
  siegeAK03bOriginalFieldPhysicsPorted:false,
  siegeNativeFieldMovementPhysicsCopied:false,
  siegeFullyUnifiedCameraEngine:false,
  siegeExactOriginalArmyControlHUDShared:false,
  siegeAllFourSquadsIndividuallySelectable:true,
  siegeReal3DBallisticsAvailable:false,
  siegePlayer3DMusketAndPhysicalBow:true,
  siegeNativeG54Soldier3DBallistics:false,
  siegeG54BlueDefenderCoordinatedGroundRoles:true,
  siegeS4B1EightBlueRampartPostSoldiers:true,
  siegeS4B1Real3DBotVsSoldierFire:true,
  siegeBot3DPlayerCounterfire:false,
  siegeReciprocalNative3DBotFire:false,
  siegeFullNativeBotRampart3DCombat:false,
  originalFFAAIChanged:false,originalG54GameplayChanged:false,
  originalG84Recovered:false,mainBranchMerged:false,
  productionApproved:false
 };
 writeFileSync(dest+'.build.json',JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({file:dest,manifest},null,2));
 return {html,manifest};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [dualFile,siegeFile,outFile]=process.argv.slice(2);
 build({dualFile,siegeFile,outFile});
}
