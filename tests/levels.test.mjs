// Every level must be finishable by the scripted player, wind and all, inside its bronze time, and gold must be out of reach of a run that only holds right.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runBot } from '../scripts/bot.mjs';
import { WORLDS, medals } from '../dist/js/data/worlds.js';

for (const w of WORLDS) for (const l of w.levels) {
  test(`${l.id} ${l.name}: can be finished`, () => {
    const r = runBot(l, { ...w.can, ...(l.can || {}) }), [gold, , bronze] = medals(l);
    assert.ok(r.ok, `stuck at x ${r.at}`); assert.ok(r.falls + (r.erupts || 0) <= 2, `lost ${r.falls + (r.erupts || 0)} lights: three loses the level`);
    assert.ok(r.t < l.par * (l.boss ? 2.5 : 2.3) * 0.7, `took ${r.t.toFixed(1)} s: too near the time limit of ${Math.round(l.par * (l.boss ? 2.5 : 2.3))} s for a scripted run`);
    assert.ok(r.t < bronze, `took ${r.t.toFixed(1)} s, bronze is ${bronze.toFixed(1)}`);
    assert.ok(r.t > gold * 0.72, `the scripted run (${r.t.toFixed(1)} s) is far under gold (${gold.toFixed(1)} s): the par is too slack`);
    assert.ok(r.drop > 20, 'the goal must be well below the start');
  });
}
