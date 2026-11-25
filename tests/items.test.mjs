// The things to find. Every level hides one stamp, and it must be within reach of what the hero can do in that country: a jump in Iceland,
// a jump and Mu's lift from Cappadocia on. A scripted hero is stood near each stamp and tries a few plain ways of getting it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Body, step, STEP, R, HOP_V, G } from '../dist/js/game/physics.js';
import { build } from '../dist/js/game/level.js';
import { WORLDS } from '../dist/js/data/worlds.js';

function reach(L, can, st, from, jumpAt, steer) {
  const T = L.T, b = new Body(from, T.h(from) + R); Object.assign(b.can, { slide: true, roll: true, spread: true }, can); b.grounded = true;
  const feathers = L.items.filter((i) => i.kind === 'feather').map((f) => ({ ...f, got: false })); let jumped = false, held = 0, was = false;
  for (let i = 0; i < 240 * 9; i++) {
    const dx = st.x - b.x, inp = { move: Math.abs(dx) > 0.12 ? Math.sign(dx) : 0, jump: false, jumpNow: false, tuck: false };
    if (!steer && jumped && !b.grounded) inp.move = 0;
    if (!jumped && b.grounded && Math.abs(dx) <= jumpAt) { inp.jumpNow = true; jumped = true; held = 0.5; }
    if (held > 0) { inp.jump = true; held -= STEP; }
    // the lift: at the top of the rise, and again after a feather
    if (jumped && !b.grounded && b.pushT <= 0 && b.vy < 1 && b.hops > 0 && b.y < st.y - 0.6 && !was) inp.jumpNow = true;
    was = inp.jumpNow; step(b, T, inp, STEP);
    for (const f of feathers) if (!f.got && b.hops === 0 && !b.grounded && Math.abs(f.x - b.x) < 0.85 && Math.abs(f.y - b.y) < 0.9) { f.got = true; b.hops = 1; }
    if (Math.abs(st.x - b.x) < 0.85 && Math.abs(st.y - b.y) < 0.9) return true;
    if (jumped && b.grounded && b.groundT > 0.3) { if (Math.abs(dx) > jumpAt + 0.5 || L.fell(b)) return false; jumped = false; }
    if (L.fell(b)) return false;
  }
  return false;
}

test('Mu lifts once in the air, and not again until the ground or a feather', () => {
  const L = build({ id: 'flat', items: false, strokes: [['flat', 60], ['bowl', 12, 2]] }), T = L.T, b = new Body(L.start.x, L.start.y + R); b.can.mu = true; b.grounded = true;
  const inp = { move: 0, jump: true, jumpNow: true, tuck: false }; let top = -1e9, hops = 0;
  for (let i = 0; i < 240 * 3; i++) { step(b, T, inp, STEP); inp.jumpNow = false; if (i > 30 && b.grounded) break; if (b.events.includes('hop')) hops++; if (!b.grounded && b.pushT <= 0 && b.vy < 0.5 && i % 12 === 0) inp.jumpNow = true; top = Math.max(top, b.y - L.start.y - R); }
  assert.equal(hops, 1); assert.ok(top > 3.3 && top < 2.9 + (HOP_V * HOP_V) / (2 * G) + 0.3, `rose ${top.toFixed(2)}`);
  const c = new Body(L.start.x, L.start.y + R); c.grounded = true; let n = 0; const j = { move: 0, jump: true, jumpNow: true, tuck: false };
  for (let i = 0; i < 240 * 2; i++) { step(c, T, j, STEP); if (i > 30 && c.grounded) break; j.jumpNow = !c.grounded && i % 12 === 0; if (c.events.includes('hop')) n++; }
  assert.equal(n, 0, 'no lift without Mu');
});

for (const w of WORLDS) for (const l of w.levels) {
  test(`${l.id} ${l.name}: the stamp is within reach`, () => {
    const can = { ...w.can, ...(l.can || {}) }, L = build(l, { mu: !!can.mu }), st = L.items.find((i) => i.kind === 'stamp');
    assert.ok(st, 'no stamp'); assert.ok(w.theme.stamps?.[L.li]?.name, 'the stamp has no name');
    let ok = false;
    for (const d of [0, -2, 2, -4, 4, -6, -8, -10]) { const from = st.x + d; if (from < 1 || Math.abs(L.T.dh(from)) > 1.2 || L.pits.some((p) => from > p.x0 - 0.5 && from < p.x1 + 0.5)) continue;
      for (const ja of [0.2, 0.6, 1, 1.6, 2.2, 3, 4, 5]) for (const steer of [true, false]) if (reach(L, can, st, from, ja, steer)) { ok = true; break; } if (ok) break; }
    assert.ok(ok, `the ${st.how} stamp at x ${st.x.toFixed(1)}, ${(st.y - L.T.h(st.x)).toFixed(1)} up, cannot be reached`);
    assert.ok(L.items.some((i) => i.kind === 'dew'), 'no dewdrop');
  });
}

// The practice slope teaches by asking: a crack a tap can clear, a gap that wants the jump held, and one that wants a turbo. Each must ask for exactly that.
import { turbo } from '../dist/js/game/physics.js';
import { TUTORIAL } from '../dist/js/data/worlds.js';
import { TUTOR } from '../dist/js/data/notebook.js';
test('the practice slope: each gap asks for what its lesson teaches', () => {
  const L = build(TUTORIAL), T = L.T;
  const cross = (p, how) => { for (const off of [0.2, 0.5, 0.9, 1.4, 2, 3]) { const b = new Body(p.x0 - 9, T.h(p.x0 - 9) + R); b.can.roll = false; b.grounded = true; let jumped = false, held = 0, tb = false, ok = null;
    for (let i = 0; i < 240 * 5 && ok == null; i++) { const inp = { move: 1, jump: held > 0, jumpNow: false, tuck: false }; if (!jumped && b.grounded && b.x >= p.x0 - off) { inp.jumpNow = true; inp.jump = true; jumped = true; held = how === 'tap' ? 0.03 : 0.5; } held -= STEP; step(b, T, inp, STEP);
      if (how === 'turbo' && jumped && !tb && b.pushT <= 0) { turbo(b); tb = true; } if (L.fell(b)) ok = false; if (b.x > p.x1 + 0.4 && b.grounded) ok = true; }
    if (ok) return true; } return false; };
  assert.equal(L.pits.length, 3); const [crack, gap, wide] = L.pits;
  assert.ok(cross(crack, 'tap'), 'a tap clears the crack'); assert.ok(!cross(gap, 'tap') && cross(gap, 'hold'), 'the gap wants the jump held'); assert.ok(!cross(wide, 'hold') && cross(wide, 'turbo'), 'the wide gap wants a turbo');
  for (const m of L.marks.filter((k) => k.kind === 'tutor')) assert.ok(TUTOR[m.text]?.key && TUTOR[m.text]?.touch && TUTOR[m.text]?.pad, 'lesson text for ' + m.text);
  assert.ok(L.items.some((i) => i.kind === 'stamp') && L.items.some((i) => i.kind === 'dew'));
});
