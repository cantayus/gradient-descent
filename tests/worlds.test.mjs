// The countries as a whole: their order, their words, and the ground each one is painted with.
import test from 'node:test';
import assert from 'node:assert/strict';
// the painters ask for a canvas when sprites are made; none are made here, but the modules must load
globalThis.document = { createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) }), width: 0, height: 0 }) };
const { build } = await import('../dist/js/game/level.js');
const { WORLDS, TUTORIAL, HIDDEN, ENDING, TITLE, levelById } = await import('../dist/js/data/worlds.js');
const { STORY, ROUTE } = await import('../dist/js/data/story.js');
const { CARDS, HINTS, TUTOR, ASK, BOSS } = await import('../dist/js/data/notebook.js');

test('the journey begins in Cappadocia, goes on to Iceland, and ends in New Zealand', () => {
  assert.deepEqual(WORLDS.map((w) => w.id), ['cappadocia', 'iceland', 'galapagos', 'namib', 'zhangjiajie', 'patagonia', 'newzealand']);
  assert.deepEqual(ROUTE, WORLDS.map((w) => w.name)); WORLDS.forEach((w, i) => { assert.equal(w.n, i + 1); assert.equal(w.levels.length, 6); w.levels.forEach((l, k) => assert.equal(l.id, `${i + 1}-${k < 5 ? k + 1 : 'B'}`)); });
  assert.equal(levelById('T').world.id, 'cappadocia', 'the practice slope is in the first country'); assert.equal(levelById('H').world.id, 'iceland');
});
test('the lessons keep their order whatever the country', () => {
  assert.deepEqual(WORLDS[0].levels.slice(0, 5).map((l) => l.card), ['loss', 'gradient', 'rate', 'overshoot', 'descent']);
  assert.deepEqual(WORLDS[1].levels.slice(0, 5).map((l) => l.card), ['momentum', 'local', 'carry', 'start', 'heavy']);
  assert.deepEqual(WORLDS[6].levels.slice(0, 5).map((l) => l.card), ['general', 'overfit', 'valid', 'early', 'regular']);
});
test('every level has its page, its question, its hints and its story', () => {
  for (const w of WORLDS) { assert.ok(STORY[w.levels[0].id], 'a chapter before ' + w.name); assert.equal(STORY[w.levels[0].id].at, w.n - 1);
    for (const l of w.levels) { assert.ok(ASK[l.id], 'a question for ' + l.id); if (l.boss) assert.ok(BOSS[l.boss], 'an idea for ' + l.boss); else assert.ok(CARDS[l.card], 'a page for ' + l.id);
      for (const m of build(l).marks) if (m.kind === 'hint') for (const k of ['key', 'touch', 'pad']) assert.ok(HINTS[m.text]?.[k], `hint "${m.text}" (${k}) in ${l.id}`); } }
  assert.ok(STORY.end); for (const m of build(TUTORIAL).marks) if (m.kind === 'tutor') assert.ok(TUTOR[m.text], 'lesson ' + m.text);
});
test('Mu joins in Cappadocia, at the third level, and is with Theta from then on', () => {
  const can = (id) => { const f = levelById(id); return { ...f.world.can, ...(f.spec.can || {}) }; };
  assert.equal(!!can('1-1').mu, false); assert.equal(!!can('1-2').mu, false); assert.equal(!!can('T').mu, false);
  for (const w of WORLDS) for (const l of w.levels) if (l.id !== '1-1' && l.id !== '1-2') assert.ok(can(l.id).mu, l.id);
  for (const w of WORLDS) for (const l of w.levels) assert.ok(can(l.id).roll, 'the roll is there from the start: ' + l.id);
});
test('every kind of ground a level names is painted by its country, and every country has its stamps', () => {
  for (const w of WORLDS) { const skins = Object.keys(w.theme.ground(w.theme.times.day).skin);
    for (const spec of [...w.levels, TITLE(...w.title), ...(w.n === 1 ? [TUTORIAL] : []), ...(w.id === 'iceland' ? [HIDDEN] : []), ...(w.n === 7 ? [ENDING] : [])]) for (const z of build(spec).zones) assert.ok(skins.includes(z.kind), `${w.name} has no ground called ${z.kind} (${spec.id})`);
    for (const l of w.levels) assert.ok(w.theme.times[l.time], `${w.name} has no hour called ${l.time}`);
    assert.ok(w.theme.stamps.length >= 6); for (const s of w.theme.stamps) assert.ok(s.s && s.name); }
  assert.ok(WORLDS[0].theme.stamps[TUTORIAL.li], 'a stamp for the practice slope');
});
