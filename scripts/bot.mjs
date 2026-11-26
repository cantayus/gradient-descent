// A scripted player, for checking that every level can be finished and for timing it. No browser: it drives the physics directly.
// usage: node scripts/bot.mjs [level id ...]      (no ids: every level)
import { Body, step, STEP, R } from '../dist/js/game/physics.js';
import { build } from '../dist/js/game/level.js';
import { WORLDS, levelById, ALL } from '../dist/js/data/worlds.js';
import { Weather } from '../dist/js/game/weather.js';
import { Geyser } from '../dist/js/game/boss.js';
import { Rides } from '../dist/js/game/ride.js';
import { tides } from '../dist/js/game/tide.js';

export function runBot(spec, can, { maxT = 240, trace = false } = {}) {
  const L = build(spec, { mu: !!can.mu }), T = L.T, b = new Body(L.start.x, L.start.y + R); Object.assign(b.can, can); b.grounded = true;
  const f0 = levelById(spec.id), wx = new Weather(spec.id + (spec.time || 'day'), f0 && f0.world.theme.weather ? f0.world.theme.weather(spec.time || 'day') : {}); T.air = (tt) => wx.windAt(tt);
  const boss = spec.boss === 'geyser' || spec.boss === 'doves' ? new Geyser(L, T) : null; let erupts = 0; const rides = new Rides(L, T); let retreat = 0, retreats = 0, leaping = false;
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
    if (can.roll && b.grounded && (s < -0.06 || (sp > 6 && s > 0.25) || b.mode === 'ball' && sp > 9) && !pitAhead(b.x, 3)) inp.tuck = true;
    { const rd = rides.list.find((r) => !r.done && r.x > b.x - 1.5 && r.x - b.x < 12); if (rd && !rides.on) { inp.tuck = false; const d = rd.x - b.x; inp.move = Math.abs(d) < 0.5 ? 0 : d > 0 ? (sp > 4 && d < 5 ? 0 : 1) : -1; inp.jumpNow = false; holdT = 0; inp.jump = false; } }
    if (f0 && f0.world.cautious) { const pz = pitAhead(b.x, 30); if (pz && b.grounded && sp > 10.2 && pz.x1 - pz.x0 < 7) { inp.tuck = false; inp.move = sp > 11.5 ? -1 : 0; } else if (pz && pz.x1 - pz.x0 < 7) inp.tuck = false; }      // among pillars: walk, do not roll
    let inBasin = false;
    { const wtr = T.waterAt(b.x); if (wtr && wtr.tide && wtr.tide.amp > 2) { // a tide basin: get on the raft, wait for the water, hop out near the top
        const pf = T.platforms.find((p) => p.move && (p.x0 + p.x1) / 2 > wtr.x0 && (p.x0 + p.x1) / 2 < wtr.x1); if (pf) { inBasin = true; retreat = 0; lastMove = t; inp.tuck = false;
          const mid = (pf.x0 + pf.x1) / 2, top = pf.move(b.t).y0, feet = b.y - b.r, dx = mid - b.x, on = b.grounded && Math.abs(dx) < (pf.x1 - pf.x0) / 2 - 0.15 && Math.abs(feet - top) < 0.25, rim = T.h(wtr.x1 + 0.8);
          if (on) { if (top + 1.1 >= rim) { inp.move = 1; leaping = true; if (b.x > pf.x1 - 1.1 && holdT <= 0) { inp.jumpNow = true; holdT = 0.34; } } else { inp.move = Math.abs(dx) > 0.5 ? Math.sign(dx) : 0; holdT = 0; } }
          else if (leaping && b.inWater < 0.2) inp.move = 1;
          else if (b.x < wtr.x1 - 0.5 || feet < rim - 0.3) { leaping = false; inp.move = Math.abs(dx) > 0.35 ? Math.sign(dx) : 0; if (b.grounded && Math.abs(dx) < 1.3 && top - feet > 0.15 && top - feet < 2.4 && holdT <= 0) { inp.jumpNow = true; holdT = 0.26; } }
          inp.jump = holdT > 0; } } }
    if (retreat > 0) { retreat -= STEP; inp.move = -1; inp.tuck = false; inp.jump = false; inp.jumpNow = false; }
    if (trace > 1 && inp.jumpNow) console.log('   jump at', b.x.toFixed(2), 'vx', b.vx.toFixed(1), 'hold', holdT.toFixed(2));
    tides(T, b.t); if (!rides.step(b, STEP)) step(b, T, inp); inp.jumpNow = false; t += STEP; if (rides.on) { lastX = b.x; lastMove = t; }
    if (can.roll && !inBasin && !jet && retreat <= 0 && t - lastMove > 2.2 && retreats < 30 && !rides.list.some((r) => !r.done && Math.abs(r.x - b.x) < 3)) { retreat = 3.2 + (retreats % 3) * 0.8; retreats++; lastMove = t; if (trace) console.log('  stopped at x', b.x.toFixed(1), '- going back for a run-up'); }
    top = Math.max(top, b.speed()); if (boss) { boss.step(b, STEP); if (boss.events.includes('erupt')) { erupts++; if (trace) console.log('  eruption at x', b.x.toFixed(1), 't', t.toFixed(1)); } }
    if (trace > 2 && Math.round(t / STEP) % (+process.env.BOTDT || 60) === 0) console.log('   ', t.toFixed(2), 'x', b.x.toFixed(2), 'y', b.y.toFixed(2), 'v', b.vx.toFixed(1), b.vy.toFixed(1), 'move', inp.move, b.grounded ? 'ground' : 'air', b.inJet.toFixed(2), b.mode, inp.tuck ? 'tuck' : '', 'hops', b.hops);
    if (trace > 1) for (const e of b.events) if (e === 'land') console.log('   land at', b.x.toFixed(2), 'y', b.y.toFixed(2), 'impact', b.impact.toFixed(1));
    for (const sd of L.seeds) if (!sd.got && Math.abs(sd.x - b.x) < 0.75 && Math.abs(sd.y - b.y) < 0.85) { sd.got = true; seeds++; }
    if (b.grounded && Math.abs(T.dh(b.x)) < 0.35) { const c = L.checkFor(b.x); if (c.x > check.x) check = c; }
    if (L.fell(b)) { falls++; if (trace) console.log('  fell at x', b.x.toFixed(1), 't', t.toFixed(1)); b.x = check.x; b.y = check.y + R + 0.05; b.vx = b.vy = b.w = 0; b.mode = 'run'; b.grounded = true; holdT = 0; lastX = b.x; lastMove = t; if (falls > 12) { stuckAt = b.x; break; } }
    if (Math.abs(b.x - L.goal.x) < 1.5 && b.y - L.goal.y < 2.2) return { ok: true, t, falls, erupts, retreats, seeds, seedsAll: L.seeds.length, len: L.length, top, drop: L.start.y - L.goal.y };
    if (b.x > lastX + 0.5) { lastX = b.x; lastMove = t; } else if (t - lastMove > 9) { stuckAt = b.x; break; }
  }
  return { ok: false, t, falls, at: stuckAt ?? b.x, len: L.length, goal: L.goal.x };
}

if (process.argv[1] && process.argv[1].endsWith('bot.mjs')) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-')), ids = args.length ? args : ALL; let bad = 0;
  for (const id of ids) { const f = levelById(id); const r = runBot(f.spec, { ...f.world.can, ...(f.spec.can || {}) }, { trace: process.argv.includes('-vvv') ? 3 : process.argv.includes('-vv') ? 2 : process.argv.includes('-v') ? 1 : 0 });
    if (!r.ok) bad++; console.log(id.padEnd(5), r.ok ? `ok   ${r.t.toFixed(1)}s  par ${f.spec.par}  falls ${r.falls}${r.erupts ? '  eruptions ' + r.erupts : ''}${r.retreats ? '  run-ups ' + r.retreats : ''}  seeds ${r.seeds}/${r.seedsAll}  length ${r.len.toFixed(0)}  drop ${r.drop.toFixed(0)}  top speed ${r.top.toFixed(0)}` : `STUCK at x ${r.at.toFixed(1)} of ${r.goal.toFixed(0)} after ${r.t.toFixed(0)}s, falls ${r.falls}`); }
  console.log('levels', ids.length, 'bad', bad);
}
