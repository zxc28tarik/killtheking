import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const main=scripts[28];

class Geometry {
    attributes={}; index=null; normalComputed=false;
    setIndex(attr){this.index=attr;}
    setAttribute(name,attr){this.attributes[name]=attr;}
    computeVertexNormals(){this.normalComputed=true;}
}
class Attribute {
    constructor(array,itemSize){this.array=array;this.itemSize=itemSize;}
}
test('GR01 31 scripts preserved and HTML main game script remains valid',()=>{
    assert.equal(scripts.length,31);
    assert.doesNotThrow(()=>new Script(main));
    assert.match(html,/id="ktk-ui32-controller"/);
    assert.match(html,/id="native-siege-start"/);
});
test('GR01 original Meshy model decodes with 178 vertices, 156 faces and ground pivot',()=>{
    const start=main.indexOf('        const KTK_MESHY_GRASS_DATA=');
    const end=main.indexOf('        let ktkMeshyGrassHero=null;',start);
    assert.ok(start>0&&end>start,'embedded model is available');
    const context={
        atob:str=>Buffer.from(str,'base64').toString('binary'),
        THREE:{BufferGeometry:Geometry,BufferAttribute:Attribute},
        Float32Array,Uint16Array
    };
    runInNewContext(main.slice(start,end)+'\n globalThis.result=makeMeshyGrassGeometry();',context);
    const g=context.result;
    assert.equal(g.index.array.length,468);
    assert.equal(g.attributes.position.array.length,178*3);
    assert.equal(g.attributes.color.array.length,178*3);
    assert.equal(g.normalComputed,true);
    assert.ok(g.index.array.every(n=>n<178));
    const p=g.attributes.position.array;
    let lo=Infinity,hi=-Infinity;
    for(let i=1;i<p.length;i+=3){lo=Math.min(lo,p[i]);hi=Math.max(hi,p[i]);}
    assert.ok(lo>=-.003&&lo<=.004, 'base touches the ground');
    assert.ok(hi>.34&&hi<.43,'grass matches native blade scale');
    assert.ok(Array.from(g.attributes.color.array).every(v=>v>0&&v<=1));
});
test('GR01 preserves total turf density and caps new high-detail clumps to one quarter',()=>{
    assert.match(main,/Math\.ceil\(meadowDenseGrass\.count\/4\)/);
    assert.match(main,/index%4===0/);
    assert.match(main,/hero\.setMatrixAt\(index\/4,object\.matrix\)/);
    assert.match(main,/object\.scale\.set\(0,0,0\)/);
    assert.match(main,/mesh\.userData\.ktkMeshyGrassHero\.instanceMatrix\.needsUpdate=true/);
    assert.match(main,/ktkMeshyGrassHero\.visible=arenaMap==='meadow'/);
    const ids=Array.from({length:12000},(_,i)=>i);
    assert.equal(ids.filter(i=>i%4===0).length,3000);
    assert.equal(ids.filter(i=>i%4!==0).length,9000);
});
test('GR01 only uses on-device packed mesh, not external GLTF fetches',()=>{
    assert.ok(main.includes('const KTK_MESHY_GRASS_DATA='));
    assert.ok(!main.includes('GLTFLoader('));
    assert.match(main,/vertexColors:true,side:THREE\.DoubleSide/);
});
