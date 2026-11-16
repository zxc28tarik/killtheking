/**
 * G8.5D: deterministik tohum ve iki taraflı gerçek spawn yerleşimi için saf yardımcılar.
 * Tek kişilik FFA sistemine dokunmaz. Bağımsız modüldür; oyun motoruna henüz bağlı değildir.
 *
 * Sözleşme: İlk kurulumda gerçek ordu kadroları eşit tür sayılarıyla verilir.
 * Spawn koordinatları takas edilir; takım kimliği, birim kimliği, ekipman ve durum değişmez.
 * Rastgelelik platformdan bağımsız bir 32-bit karıştırıcı ile hesaplanır.
 */
const UINT32_MAX = 0xffffffff;
const SPAWN_KEYS = ['x','y','z','facing'];
const has = (o,k) => Object.prototype.hasOwnProperty.call(o,k);

function u32(n, name) {
  if (!Number.isSafeInteger(n) || n < 0 || n > UINT32_MAX) {
    throw new RangeError(`${name} must be an unsigned 32-bit integer`);
  }
  return n >>> 0;
}
function nonempty(v, name) {
  if (typeof v !== 'string' || v.length === 0 || !v.trim()) {
    throw new TypeError(`${name} must be a nonempty string`);
  }
  return v;
}
function identity(v) {
  if (typeof v === 'string') return nonempty(v,'identity');
  if (Number.isSafeInteger(v) && v >= 0) return `#${v}`;
  throw new TypeError('identity must be a nonempty string or nonnegative safe integer');
}
/** FNV-1a over UTF-16 code units, then Murmur-inspired avalanche. */
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    const v = s.charCodeAt(i);
    h = Math.imul(h ^ (v & 255), 16777619) >>> 0;
    h = Math.imul(h ^ (v >>> 8), 16777619) >>> 0;
  }
  return h >>> 0;
}
function avalanche(n) {
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b);
  n ^= n >>> 16;
  return n >>> 0;
}
export const BATTLE_RNG_VERSION = 'g8d-stateless-v1';

/**
 * `at` is independent of call order. AI may request by unit-id, tick and draw-index.
 * `stream` is isolated per consumer; it does not share an advancing global Math.random.
 * Side swap deliberately does NOT change seed, stream keys, or unit identities.
 */
export function createBattleRandom(seed) {
  const root = u32(seed,'seed');
  function at(domain, unitId, tick, drawIndex=0) {
    const name = nonempty(domain,'domain');
    const id = identity(unitId);
    const t = u32(tick,'tick');
    const draw = u32(drawIndex,'drawIndex');
    const state = avalanche(root ^ hashString(`${name}\u0000${id}`) ^ avalanche(t) ^ Math.imul(draw,0x9e3779b1));
    return state / 4294967296;
  }
  function stream(domain,unitId) {
    nonempty(domain,'domain'); identity(unitId);
    let counter=0;
    return Object.freeze({
      next() { if(counter>UINT32_MAX) throw new RangeError('stream counter overflow'); return at(domain,unitId,0,counter++); },
      position() {return counter;}
    });
  }
  return Object.freeze({seed:root,algorithm:BATTLE_RNG_VERSION,at,stream});
}
function validateTeam(team,expectedName) {
  if(!Array.isArray(team)||team.length===0)throw new TypeError(`${expectedName} roster must be a nonempty array`);
  const ids=new Set(), counts=new Map();
  const copied=team.map((unit,index)=>{
    if(!unit||typeof unit!=='object'||Array.isArray(unit))throw new TypeError(`invalid ${expectedName} soldier ${index}`);
    const id=identity(unit.id);
    if(ids.has(id))throw new Error(`duplicate ${expectedName} soldier id: ${id}`);
    ids.add(id);
    const type=nonempty(unit.type,'soldier.type');
    if (unit.team !== undefined && unit.team !== expectedName) throw new Error(`soldier ${id} belongs to ${unit.team}, not ${expectedName}`);
    for(const key of ['x','z'])if(!Number.isFinite(unit[key]))throw new TypeError(`soldier ${id} missing finite ${key}`);
    for(const key of ['y','facing'])if(has(unit,key) && !Number.isFinite(unit[key]))throw new TypeError(`soldier ${id} invalid ${key}`);
    counts.set(type,(counts.get(type)||0)+1);
    return {...unit};
  });
  return {copied,counts};
}
function sortByStableOrdinal(units) {
  // Deterministic independent of array iteration order; stable unit identity is mandatory.
  return [...units].sort((a,b)=>{
    const x=identity(a.id),y=identity(b.id);
    return x<y?-1:x>y?1:0;
  });
}
/**
 * Returns freshly allocated rosters. Does not mutate original rosters.
 * In swapped mode each soldier keeps his team, class, HP and ID while acquiring
 * a corresponding opposite-team spawn. A facing/y supplied by that spawn travels with it.
 * All mirrored pairs are checked for the exact same types and counts.
 */
export function createMirroredSpawns(rosters,sideSwap) {
  if(!rosters||typeof rosters!=='object'||Array.isArray(rosters))throw new TypeError('rosters object required');
  if(!['original','swapped'].includes(sideSwap))throw new TypeError('sideSwap must be original or swapped');
  const blue=validateTeam(rosters.blue,'blue'),red=validateTeam(rosters.red,'red');
  const all=new Set([...blue.counts.keys(),...red.counts.keys()]);
  for(const type of all)if(blue.counts.get(type)!==red.counts.get(type))throw new Error(`asymmetric rosters for type ${type}`);
  const result={blue:blue.copied,red:red.copied};
  if(sideSwap==='swapped') {
    const byType = team => {
      const m = new Map();
      for(const u of team){if(!m.has(u.type))m.set(u.type,[]);m.get(u.type).push(u);}
      for(const [type,list] of m)m.set(type,sortByStableOrdinal(list));
      return m;
    };
    const b=byType(result.blue),r=byType(result.red);
    for(const type of all){
      const bList=b.get(type),rList=r.get(type);
      const bStarts=bList.map(x=>Object.fromEntries(SPAWN_KEYS.filter(k=>has(x,k)).map(k=>[k,x[k]])));
      const rStarts=rList.map(x=>Object.fromEntries(SPAWN_KEYS.filter(k=>has(x,k)).map(k=>[k,x[k]])));
      const assign=(soldier,spawn)=>{
        for(const key of SPAWN_KEYS){if(has(spawn,key))soldier[key]=spawn[key];else delete soldier[key];}
      };
      bList.forEach((u,i)=>assign(u,rStarts[i]));
      rList.forEach((u,i)=>assign(u,bStarts[i]));
    }
  }
  return Object.freeze({
    blue:Object.freeze(result.blue.map(u=>Object.freeze(u))),
    red:Object.freeze(result.red.map(u=>Object.freeze(u)))
  });
}
/** Reporting-only starting coordinates, measured from the returned spawn objects. */
export function measureStartLayout(rosters) {
  const blue=validateTeam(rosters?.blue,'blue').copied;
  const red=validateTeam(rosters?.red,'red').copied;
  const project=units=>units.map(x=>Object.freeze({type:x.type,x:x.x,z:x.z}));
  return Object.freeze({blue:Object.freeze(project(blue)),red:Object.freeze(project(red))});
}
