// The promises the physics makes. Run with: node --test tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { Terrain, Body, step, advance, G, STEP, R, SURF } from '../dist/js/game/physics.js';
import { build } from '../dist/js/game/level.js';

const still = { move: 0, jump: false, jumpNow: false, tuck: false };
const incline = (drop, run, type = 'rock', flatAfter = 40) => {
  // level, then a straight slope, then level again
  const dx = 0.25, ys = []; for (let x = 0; x <= 20 + run + flatAfter; x += dx) ys.push(x < 20 ? 0 : x < 20 + run ? (-drop * (x - 20)) / run : -drop);
  const T = new Terrain({ ys: Float32Array.from(ys), dx }); T.base = type; return T;
};
const sdist = (T, b) => { const s = T.dh(b.x), inv = 1 / Math.hypot(1, s); return (b.y - T.h(b.x)) * inv; };

test('a ball rolling down a known slope reaches the speed the textbook gives', () => {
  const drop = 12, run = 40, T = incline(drop, run), b = new Body(21, T.h(21) + R); b.mode = 'ball';
  const inp = { ...still, tuck: true }; let v = 0;
  for (let i = 0; i < 240 * 20 && b.x < 20 + run - 1; i++) { step(b, T, inp); v = b.speed(); }
  // Rolling without slipping, with k = 2/5 for a solid ball: (1 + k) v' = g sin a - c v², less rolling resistance. No air and no resistance gives v² = 2 g h / (1 + k).
  const fallen = T.h(21) - T.h(b.x), ideal = Math.sqrt((2 * G * fallen) / 1.4), ang = Math.atan2(drop, run);
  let ve = 0, xe = 21; while (xe < b.x) { const a = Math.atan(-T.dh(xe)); ve += ((G * Math.sin(a) - 0.0032 * ve * ve) / 1.4 - SURF.rock.crr * G * Math.cos(a)) * 1e-4; xe += ve * Math.cos(a) * 1e-4; }
  assert.ok(v < ideal, `not faster than a ball with no air: ${v} vs ${ideal}`);
  assert.ok(Math.abs(v - ve) / ve < 0.025, `within two and a half per cent of the equation: ${v} vs ${ve}`);
  assert.ok(Math.abs(b.w * b.r - (b.vx * b.ny - b.vy * b.nx)) < 0.05, 'the spin matches the speed over the ground');
});

test('a slide on ice is faster than a slide on sand, and both match friction', () => {
  const run = 40, drop = 12, out = {};
  for (const type of ['ice', 'sand']) {
    const T = incline(drop, run, type), b = new Body(21, T.h(21) + R); b.can.roll = false; b.grounded = true;
    const inp = { ...still, tuck: true }; let t = 0;
    for (let i = 0; i < 240 * 30 && b.x < 20 + run - 1; i++) { step(b, T, inp); t += STEP; if (i > 240 && b.speed() < 0.01) break; }
    out[type] = { v: b.speed(), x: b.x };
  }
  // v' = g (sin a - mu cos a) - c v²
  const Ti = incline(drop, run, 'ice'); let ve = 0, xe = 21; while (xe < out.ice.x) { const a = Math.atan(-Ti.dh(xe)); ve = Math.max(0, ve + (G * (Math.sin(a) - SURF.ice.muk * Math.cos(a)) - 0.008 * ve * ve) * 1e-4); xe += Math.max(ve, 0.01) * Math.cos(a) * 1e-4; }
  assert.ok(Math.abs(out.ice.v - ve) / ve < 0.025, `ice speed ${out.ice.v} near ${ve}`);
  assert.ok(out.sand.x < 21.02, `on sand of this slope friction beats the pull and the hero stays put (moved to ${out.sand.x})`);
});

test('energy never rises except by work that can be seen', () => {
  const L = build({ id: 't-energy', strokes: [['flat', 6], ['slope', 30, -9], ['valley', 20, 4], ['hill', 14, 3], ['waves', 30, 1.5, 4, -4], ['kicker', 6, 2], ['flat', 30], ['bowl', 16, 4, 3]] });
  for (const mode of ['ball', 'slide', 'run']) {
    const b = new Body(L.start.x, L.start.y + R); const inp = { ...still, tuck: mode !== 'run', move: mode === 'run' ? 1 : 0 }; if (mode === 'slide') b.can.roll = false;
    b.vx = 6; const e0 = b.energy(); let worst = -Infinity;
    for (let i = 0; i < 240 * 25; i++) { step(b, L.T, inp); worst = Math.max(worst, b.energy() - e0 - b.work); }
    assert.ok(worst < 0.5, `${mode}: energy rose by ${worst} beyond the work put in`);
  }
});

test('nothing gets through the ground or a thin ledge, however fast', () => {
  const dx = 0.25, ys = new Float32Array(400).fill(0);
  const T = new Terrain({ ys, dx, platforms: [{ x0: 40, x1: 46, y0: 8, y1: 8, type: 'rock' }] });
  for (const v of [20, 60, 140]) {
    const b = new Body(43, 30); b.vy = -v; let low = Infinity; for (let i = 0; i < 240 * 3; i++) { step(b, T, still); low = Math.min(low, b.y); }
    assert.ok(low >= 8 + R - 0.02, `stopped by the ledge at ${v} units a second (lowest ${low})`);
    const c = new Body(20, 30); c.vy = -v; low = Infinity; for (let i = 0; i < 240 * 3; i++) { step(c, T, still); low = Math.min(low, c.y); }
    assert.ok(low >= R - 0.02, `stopped by the ground at ${v} units a second (lowest ${low})`);
  }
});

test('the hero is never inside the ground, whatever the player does', () => {
  const L = build({ id: 't-rough', strokes: [['flat', 6], ['slope', 20, -10], ['valley', 8, 3], ['steps', 16, 4, -1.5], ['waves', 24, 2, 5, -3], ['hill', 6, 3], ['valley', 6, 4], ['kicker', 5, 2.5], ['gap', 5], ['flat', 10], ['slope', 30, -14], ['bowl', 14, 4, 3]] });
  let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const b = new Body(L.start.x, L.start.y + R); const inp = { ...still }; let worst = Infinity;
  for (let i = 0; i < 240 * 90; i++) {
    if (i % 37 === 0) { inp.move = rnd() < 0.75 ? 1 : rnd() < 0.5 ? -1 : 0; inp.tuck = rnd() < 0.5; inp.jump = rnd() < 0.4; inp.jumpNow = inp.jump && rnd() < 0.5; }
    step(b, L.T, inp); inp.jumpNow = false;
    if (L.fell(b)) { const c = L.checkFor(b.x); b.x = c.x; b.y = c.y + R; b.vx = b.vy = b.w = 0; continue; }
    if (!L.pits.some((p) => b.x > p.x0 - 1 && b.x < p.x1 + 1)) worst = Math.min(worst, sdist(L.T, b) - R);
    assert.ok(Number.isFinite(b.x + b.y + b.vx + b.vy + b.w), 'no numbers go bad');
  }
  assert.ok(worst > -0.06, `deepest the hero ever sank: ${worst}`);
});

test('the same run at 30, 60 and 144 frames a second ends in the same place', () => {
  const L = build({ id: 't-fps', strokes: [['flat', 6], ['slope', 30, -9], ['valley', 20, 4], ['waves', 30, 1.5, 4, -4], ['bowl', 16, 4, 3]] });
  const run = (fps) => { const b = new Body(L.start.x, L.start.y + R); const inp = { ...still, move: 1, tuck: true }; let acc = 0, steps = 0; const frames = Math.round(6 * fps); for (let f = 0; f < frames; f++) acc = advance(b, L.T, inp, acc, 1 / fps, () => steps++); while (steps < 240 * 6) { step(b, L.T, inp); steps++; } return [b.x, b.y, b.vx]; };
  const a = run(30), c = run(60), d = run(144);
  for (let i = 0; i < 3; i++) { assert.ok(Math.abs(a[i] - c[i]) < 1e-6 && Math.abs(c[i] - d[i]) < 1e-6, `same result: ${a} ${c} ${d}`); }
});

test('a jump is the same jump every time, and holding the button makes it higher', () => {
  const T = incline(0, 10), apex = (hold) => { const b = new Body(10, R); b.grounded = true; let top = 0; const inp = { ...still, jump: true, jumpNow: true }; for (let i = 0; i < 240 * 2; i++) { if (i > hold) inp.jump = false; step(b, T, inp); inp.jumpNow = false; top = Math.max(top, b.y - R); } return top; };
  const tap = apex(2), full = apex(200);
  assert.equal(apex(200), full); assert.ok(tap > 0.5 && tap < 1.0, `a tap: ${tap}`); assert.ok(full > 2.4 && full < 3.4, `held: ${full}`);
});

test('the hero floats in water with about six tenths of the body under', () => {
  const dx = 0.25, ys = []; for (let x = 0; x < 80; x += dx) ys.push(x > 20 && x < 60 ? -6 : 0);
  const T = new Terrain({ ys: Float32Array.from(ys), dx, waters: [{ x0: 20, x1: 60, y: -0.5 }] }), b = new Body(40, 4);
  for (let i = 0; i < 240 * 8; i++) step(b, T, still);
  const under = (-0.5 - (b.y - R)) / (2 * R);
  assert.ok(Math.abs(b.vy) < 0.05, 'comes to rest'); assert.ok(under > 0.5 && under < 0.72, `share under water: ${under}`);
});

test('turbo adds its speed along the ground and its energy is counted as work', async () => {
  const { turbo, TURBO_V } = await import('../dist/js/game/physics.js');
  const T = new Terrain({ ys: Float32Array.from({ length: 400 }, (_, i) => -0.3 * i * 0.25), dx: 0.25 }), b = new Body(20, T.h(20) + R); b.grounded = true;
  for (let i = 0; i < 120; i++) step(b, T, { move: 1, jump: false, jumpNow: false, tuck: false });
  const v0 = Math.hypot(b.vx, b.vy), e0 = b.energy(), w0 = b.work; assert.ok(turbo(b)); const v1 = Math.hypot(b.vx, b.vy);
  assert.ok(Math.abs(v1 - v0 - TURBO_V) < 0.05, `speed rose by ${(v1 - v0).toFixed(2)}, expected ${TURBO_V}`);
  assert.ok(Math.abs((b.energy() - e0) - (b.work - w0)) < 1e-6, 'the energy gained must equal the work entered');
});
