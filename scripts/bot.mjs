// A scripted player, for checking that every level can be finished and for timing it. No browser: it drives the physics directly.
// usage: node scripts/bot.mjs [level id ...]      (no ids: every level)
import { Body, step, STEP, R } from '../dist/js/game/physics.js';
import { build } from '../dist/js/game/level.js';
import { WORLDS, levelById, ALL } from '../dist/js/data/worlds.js';
import { Weather } from '../dist/js/game/weather.js';
import { Geyser } from '../dist/js/game/boss.js';

export function runBot(spec, can, { maxT = 240, trace = false } = {}) {
  const L = build(spec), T = L.T, b = new Body(L.start.x, L.start.y + R); Object.assign(b.can, can); b.grounded = true;
  const f0 = levelById(spec.id), wx = new Weather(spec.id + (spec.time || 'day'), f0 && f0.world.theme.weather ? f0.world.theme.weather(spec.time || 'day') : {}); T.air = (tt) => wx.windAt(tt);
  const boss = spec.boss === 'geyser' ? new Geyser(L, T) : null; let erupts = 0;
  const inp = { move: 1, jump: false, jumpNow: false, tuck: false }; let t = 0, falls = 0, check = L.checks[0], holdT = 0, lastX = b.x, lastMove = 0, seeds = 0, stuckAt = null, top = 0;
  const pitAhead = (x, d) => L.pits.find((p) => p.x0 >= x - 0.2 && p.x0 - x < d);
  const riseAhead = (x, d) => { let m = -1e9; for (let u = 0.3; u <= d; u += 0.3) m = Math.max(m, T.h(x + u) - T.h(x)); return m; };
  while (t < maxT) {
    const sp = Math.abs(b.vx), surf = T.surfAt(b.x), s = T.dh(b.x);
    inp.move = 1; inp.tuck = false;
    const jet = T.jets.find((j) => Math.abs(j.x - b.x) < 6 && riseAhead(j.x, 7) > 2.2);
    if (jet) { // a geyser under a wall: stand in it and ride up, then step off at the top
      const wallTop = T.h(jet.x) + riseAhead(jet.x, 7);
      if (b.y < wallTop + 2.2 && b.x < jet.x + 1.2) { const dx = jet.x - b.x, want = Math.abs(dx) < 0.3 ? 0 : Math.sign(dx); inp.move = b.grounded ? (Math.abs(b.vx) > 3.5 && Math.abs(dx) < 4 ? 0 : want) : want; }
    }
    if (b.grounded && holdT <= 0) {
      const near = pitAhead(b.x, 3), w = near ? near.x1 - near.x0 : 0, pit = pitAhead(b.x, Math.max(0.5, sp * (w > 3 ? 0.1 : 0.06)));
      if (pit) { inp.jumpNow = true; holdT = w > 5.5 ? 0.3 : w > 3 ? 0.12 : 0.004; }
      else if (!jet && riseAhead(b.x, 1.6) > 0.75) { inp.jumpNow = true; holdT = 0.3; }
    }
    { const nx = pitAhead(b.x, 9); if (nx && nx.x1 - nx.x0 <= 3.2 && sp > 9.8 && b.grounded) inp.move = 0; }
    inp.jump = holdT > 0; holdT -= STEP;
    if (can.slide && !can.roll && b.grounded && s < -0.1 && (surf === 'ice' || surf === 'snow') && !pitAhead(b.x, 3)) inp.tuck = true;
    if (can.roll && b.grounded && s < -0.06 && !pitAhead(b.x, 3)) inp.tuck = true;
    if (trace > 1 && inp.jumpNow) console.log('   jump at', b.x.toFixed(2), 'vx', b.vx.toFixed(1), 'hold', holdT.toFixed(2));
    step(b, T, inp); inp.jumpNow = false; t += STEP; top = Math.max(top, b.speed()); if (boss) { boss.step(b, STEP); if (boss.events.includes('erupt')) { erupts++; if (trace) console.log('  eruption at x', b.x.toFixed(1), 't', t.toFixed(1)); } }
    if (trace > 2 && Math.round(t / STEP) % 60 === 0) console.log('   ', t.toFixed(2), 'x', b.x.toFixed(2), 'y', b.y.toFixed(2), 'v', b.vx.toFixed(1), b.vy.toFixed(1), 'move', inp.move, b.grounded ? 'ground' : 'air', b.inJet.toFixed(2));
    if (trace > 1) for (const e of b.events) if (e === 'land') console.log('   land at', b.x.toFixed(2), 'y', b.y.toFixed(2), 'impact', b.impact.toFixed(1));
    for (const sd of L.seeds) if (!sd.got && Math.abs(sd.x - b.x) < 0.75 && Math.abs(sd.y - b.y) < 0.85) { sd.got = true; seeds++; }
    if (b.grounded && Math.abs(T.dh(b.x)) < 0.35) { const c = L.checkFor(b.x); if (c.x > check.x) check = c; }
    if (L.fell(b)) { falls++; if (trace) console.log('  fell at x', b.x.toFixed(1), 't', t.toFixed(1)); b.x = check.x; b.y = check.y + R + 0.05; b.vx = b.vy = b.w = 0; b.mode = 'run'; b.grounded = true; holdT = 0; lastX = b.x; lastMove = t; if (falls > 12) { stuckAt = b.x; break; } }
    if (Math.abs(b.x - L.goal.x) < 1.5 && b.y - L.goal.y < 2.2) return { ok: true, t, falls, erupts, seeds, seedsAll: L.seeds.length, len: L.length, top, drop: L.start.y - L.goal.y };
    if (b.x > lastX + 0.5) { lastX = b.x; lastMove = t; } else if (t - lastMove > 9) { stuckAt = b.x; break; }
  }
  return { ok: false, t, falls, at: stuckAt ?? b.x, len: L.length, goal: L.goal.x };
}

if (process.argv[1] && process.argv[1].endsWith('bot.mjs')) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-')), ids = args.length ? args : ALL; let bad = 0;
  for (const id of ids) { const f = levelById(id); const r = runBot(f.spec, { ...f.world.can, ...(f.spec.can || {}) }, { trace: process.argv.includes('-vvv') ? 3 : process.argv.includes('-vv') ? 2 : process.argv.includes('-v') ? 1 : 0 });
    if (!r.ok) bad++; console.log(id.padEnd(5), r.ok ? `ok   ${r.t.toFixed(1)}s  par ${f.spec.par}  falls ${r.falls}${r.erupts ? '  eruptions ' + r.erupts : ''}  seeds ${r.seeds}/${r.seedsAll}  length ${r.len.toFixed(0)}  drop ${r.drop.toFixed(0)}  top speed ${r.top.toFixed(0)}` : `STUCK at x ${r.at.toFixed(1)} of ${r.goal.toFixed(0)} after ${r.t.toFixed(0)}s, falls ${r.falls}`); }
  console.log('levels', ids.length, 'bad', bad);
}
