import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/oyun.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

class FakeVector {
  constructor(x, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  clone() { return new FakeVector(this.x, this.y, this.z); }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  multiplyScalar(v) { this.x *= v; this.y *= v; this.z *= v; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
}

const helper = source.match(/function arenaWorldBlockBetween\(from, to\) \{[\s\S]*?\n        \}/)?.[0];

test('entrypoint includes original game dependencies', () => {
  for (const link of ['vendor/three-r128.js', 'styles/game.css', 'src/oyun.js']) {
    assert.ok(html.includes(link), `Missing ${link}`);
  }
});

test('combat visibility helper blocks solid geometry but not clear lines', () => {
  assert.ok(helper, 'Missing arenaWorldBlockBetween');
  const walls = [{}];
  const ray = {
    hit: false,
    set(origin, direction) { this.origin = origin; this.direction = direction; },
    intersectObjects(meshes, recursive) {
      assert.equal(meshes, walls);
      assert.equal(recursive, false);
      return this.hit ? [{ distance: 2 }] : [];
    }
  };
  const hasBlock = vm.runInNewContext(`(${helper})`, { arenaSightRay: ray, worldMeshes: walls });
  const origin = new FakeVector(0, 1.6, 0);
  const target = new FakeVector(0, 1.6, 8);
  assert.equal(hasBlock(origin, target), false);
  assert.ok(Math.abs(ray.far - 7.9) < 0.00001);
  assert.ok(Math.abs(ray.direction.z - 1) < 0.00001);
  ray.hit = true;
  assert.equal(hasBlock(origin, target), true);
  assert.equal(hasBlock(origin, new FakeVector(0, 1.6, 0.1)), false);
});

test('player shots and bot melee use world occlusion checks', () => {
  assert.match(source, /if \(!arenaLineOfSight\(bot, targetPos, target.type === 'player'\)\) return;/);
  assert.match(source, /if \(hits.length > 0 && !arenaWorldBlockBetween\(camera.position, hits\[0\].point\)\)/);
  assert.match(source, /if \(barrel && !arenaWorldBlockBetween\(camera.position, hits\[0\].point\)\)/);
  assert.match(source, /ArenaMeleeContact\.selectContact\(/);
  assert.match(source, /const hits = raycaster\.intersectObjects\(targets, false\)/);
  assert.match(source, /return \{kind:'world',distance:hit\.distance\}/);
});

test('bots retain free-for-all combat without awarding player kills', () => {
  assert.match(source, /function damageBotFromBot\(/);
  assert.match(source, /attacker\.arenaKills\+\+/);
  assert.match(source, /function chooseArenaTarget\(/);
  assert.match(source, /if \(other\.id === bot\.id \|\| other\.dead\) continue;/);
});
