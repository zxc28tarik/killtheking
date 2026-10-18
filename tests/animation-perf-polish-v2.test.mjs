import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const Motion=require('../src/character-motion.js');
const game=readFileSync(new URL('../src/oyun.js',import.meta.url),'utf8');

const common={travel:.25,windup:0,rangedWindup:0,strike:0,stagger:0,hit:0,guard:false};
test('positive and negative ramp grades lean the torso and move the gait symmetrically',()=>{
 const flat=Motion.update(Motion.createState(0),.04,{...common,role:'knight',slope:0});
 const up=Motion.update(Motion.createState(0),.04,{...common,role:'knight',slope:.65});
 const down=Motion.update(Motion.createState(0),.04,{...common,role:'knight',slope:-.65});
 assert.ok(up.torsoX>flat.torsoX && down.torsoX<flat.torsoX);
 assert.ok(up.leftLeg>flat.leftLeg && down.leftLeg<flat.leftLeg);
 assert.ok(up.rightLeg>flat.rightLeg && down.rightLeg<flat.rightLeg);
 assert.ok(up.headX<flat.headX && down.headX>flat.headX);
});
test('standing still or staggered in a ramp does not fake walking',()=>{
 const a=Motion.createState();
 const idle=Motion.update(a,.05,{...common,travel:0,role:'pikeman',slope:1});
 assert.equal(idle.locomotionWeight,0);
 assert.equal(idle.leftLeg,0);assert.equal(idle.rightLeg,0);
 const onRamp=Motion.update(a,.05,{...common,travel:.30,role:'pikeman',slope:1,stagger:.2});
 assert.ok(Number.isFinite(onRamp.leftLeg));
 assert.ok(Math.abs(onRamp.leftLeg)<.9);
});
test('bow firing produces a controlled string-release instead of a sword swing',()=>{
 const bow=Motion.update(Motion.createState(),.03,{...common,role:'archer',strike:.12});
 const sword=Motion.update(Motion.createState(),.03,{...common,role:'knight',strike:.12});
 assert.ok(bow.rightArm< -1 && bow.rightArm< sword.rightArm);
 assert.ok(bow.leftArm< -.9);
 assert.ok(Math.abs(bow.torsoZ)<.03);
});
test('musket firing produces small stock recoil while preserving shield and melee animation',()=>{
 const musket=Motion.update(Motion.createState(),.03,{...common,role:'musket',strike:.12});
 const melee=Motion.update(Motion.createState(),.03,{...common,role:'pikeman',strike:.12});
 assert.ok(musket.rightArm< -1 && musket.rightArm<melee.rightArm);
 assert.ok(musket.leftArm< -.8);
 const guard=Motion.update(Motion.createState(),.03,{...common,role:'knight',guard:true});
 assert.equal(guard.leftArm,-1.25);
});
test('ramp grade derives from actual collision-safe movement rather than velocity',()=>{
 assert.match(game,/const travelSlope = animationTravel > 0\.025/);
 assert.match(game,/\(navHeight - botGround\.y\) \/ animationTravel/);
 assert.match(game,/applyBotMotion\(bot, dt, animationTravel, travelSlope\)/);
 assert.match(game,/navigator\.safeAdvance\(botGround, stepDir/);
 assert.match(game,/bot\.mesh\.position\.y = THREE\.MathUtils\.lerp/);
});
test('render-only caches avoid new allocations in six bot hot loops',()=>{
 assert.match(game,/const botDefaultScale = new THREE\.Vector3\(1, 1, 1\)/);
 assert.match(game,/const botHeadProjection = new THREE\.Vector3\(\)/);
 assert.match(game,/bot\.mesh\.scale\.lerp\(botDefaultScale/);
 assert.match(game,/botHeadProjection\.set\(/);
 assert.doesNotMatch(game,/const toPlayer = new THREE\.Vector3\(\)\.subVectors\(player\.pos, bot\.mesh\.position\)/);
 assert.doesNotMatch(game,/const headWorld = bot\.mesh\.position\.clone\(\)\.add\(new THREE\.Vector3\(0, 3\.4, 0\)\)/);
});
test('UI minimap cadence and camera matrices are bounded independently of gameplay',()=>{
 assert.match(game,/radarRefreshElapsed \+= dt/);
 assert.match(game,/radarRefreshElapsed >= 1 \/ 30/);
 assert.match(game,/radarRefreshElapsed %= 1 \/ 30/);
 assert.match(game,/renderRadar\(\)/);
 assert.match(game,/Math\.abs\(camera\.fov - lastProjectedFov\) >= 0\.025/);
 assert.match(game,/camera\.updateProjectionMatrix\(\)/);
 assert.match(game,/if \(isGameActive && arenaMatch\.phase === 'playing'\) updateGame\(gameDt\)/);
});
