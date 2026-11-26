// The lab computes the real rule, and each of its ready-made settings must go wrong in the way its caption says and be cured by the change it suggests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LAND, PRESETS, runRule, stepRule, slope } from '../dist/js/data/lab.js';

const lowest = (land) => { let bx = 0, bv = 1e9; for (let x = 0; x <= 10; x += 0.005) if (land.f(x) < bv) { bv = land.f(x); bx = x; } return bx; };
const by = (name) => PRESETS.find((p) => p.name === name), run = (p, change = {}, opt = {}) => runRule(LAND[p.land], { eta: p.eta, mu: p.mu, sigma: p.sigma, limit: p.limit, ...change }, opt), endAt = (r) => r.path[r.path.length - 1].theta;

test('one step is exactly the rule: v ← μv − ηg, θ ← θ + v', () => {
  const land = LAND.bowl, s = { theta: 2, v: 0.3, g: 0, loss: 0, n: 0 }, g = slope(land.f, 2), out = stepRule(s, land, { eta: 0.25, mu: 0.6 });
  assert.ok(Math.abs(out.v - (0.6 * 0.3 - 0.25 * g)) < 1e-9); assert.ok(Math.abs(out.theta - (2 + out.v)) < 1e-12);
  const plain = stepRule({ theta: 2, v: 5, g: 0, loss: 0, n: 0 }, land, { eta: 0.25, mu: 0 }); assert.ok(Math.abs(plain.theta - (2 - 0.25 * g)) < 1e-9, 'with no momentum it is plain gradient descent');
  const held = stepRule({ theta: 0, v: 0, g: 0, loss: 0, n: 0 }, LAND.cliff, { eta: 1, mu: 0, limit: 3 }); assert.ok(Math.abs(held.g) <= 3 + 1e-9, 'the limit holds the slope');
});
test('The Geyser: too long a step leaves the valley, a shorter one settles in it', () => { const p = by('The Geyser'); assert.equal(run(p).end, 'left'); const r = run(p, { eta: 0.3 }); assert.equal(r.end, 'settled'); assert.ok(Math.abs(endAt(r) - lowest(LAND.narrow)) < 0.05); });
test('The Hollows: plain descent stops in the hollow, momentum carries over the rim', () => { const p = by('The Hollows'), low = lowest(LAND.hollow); assert.ok(Math.abs(endAt(run(p)) - low) > 3, 'stuck in the hollow'); assert.ok(Math.abs(endAt(run(p, { mu: 0.9 }, { steps: 200 })) - low) < 0.3, 'over the rim'); });
test('The Tide: noise ends lower than no noise, most of the time', () => { const p = by('The Tide'), still = LAND.rough.f(endAt(run(p))); let seed = 11, better = 0;
  const rnd = () => { let u = 0; while (!u) { seed = (seed * 16807) % 2147483647; u = seed / 2147483647; } seed = (seed * 16807) % 2147483647; return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * (seed / 2147483647)); };
  for (let i = 0; i < 20; i++) if (LAND.rough.f(endAt(run(p, { sigma: 3 }, { rand: rnd }))) < still - 0.3) better++; assert.ok(better >= 14, `only ${better} of 20 noisy runs ended lower`); });
test('The Long Flat: plain descent is still on the flat, momentum crosses it', () => { const p = by('The Long Flat'); assert.ok(endAt(run(p)) < 4); assert.ok(endAt(run(p, { mu: 0.9 })) > 7.5); });
test('The Thousand Pillars: a long step bounces for ever, a short one settles', () => { const p = by('The Thousand Pillars'); assert.equal(run(p).end, 'moving'); assert.equal(run(p, { eta: 0.05 }).end, 'settled'); });
test('The Towers: the step explodes, and a limit on the slope cures it', () => { const p = by('The Towers'); assert.equal(run(p).end, 'left'); const r = run(p, { limit: 3 }); assert.equal(r.end, 'settled'); assert.ok(Math.abs(endAt(r) - 6.5) < 0.5); });
