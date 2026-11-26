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

// Generated ground must be as fair as made ground. Three weeks of daily valleys, and the first stretch of a long descent in every country.
import { levelById as byId, todayId } from '../dist/js/data/worlds.js';
for (let d = 0; d < 21; d++) { const id = todayId(new Date(Date.UTC(2026, 10, 20 + d)));
  test(`${id}: the daily valley can be finished`, () => { const f = byId(id), r = runBot(f.spec, { ...f.world.can }); assert.ok(r.ok, `stuck at x ${r.at} in ${f.world.id}`); assert.ok(r.falls <= 2, `lost ${r.falls} lights`); assert.ok(r.t < f.spec.par * 2.3 * 0.75, `took ${r.t.toFixed(1)} s against a limit of ${Math.round(f.spec.par * 2.3)}`); }); }

test('H: the hidden valley can be finished, and nothing in it can be lost', () => { const f = byId('H'), r = runBot(f.spec, { ...f.world.can, ...f.spec.can }); assert.ok(r.ok, `stuck at x ${r.at}`); assert.equal(r.falls, 0); });
