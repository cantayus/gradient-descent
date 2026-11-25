// A level is written as a list of strokes, like directions for a drawing: flat for 8, down 12 over 30, a valley 5 deep, and so on.
// build() turns the strokes into ground (physics.js), and places what stands on it. No drawing in here; the tests and the scripted player use it too.
import { Terrain } from './physics.js';
import { RNG } from '../core/rng.js';

const DX = 0.25;
const ease = (t) => t * t * (3 - 2 * t);
const bell = (t) => 0.5 - 0.5 * Math.cos(2 * Math.PI * t);

// Each stroke: (out, L, args, cursor) -> pushes heights for its length and returns the height it ends at.
const STROKES = {
  flat: (push, L, a, y) => { push(L, () => y); return y; },
  // an S-shaped fall or rise of dy over L: level at both ends, steepest in the middle
  slope: (push, L, [dy = 0], y) => { push(L, (t) => y + dy * ease(t)); return y + dy; },
  // a straight incline
  line: (push, L, [dy = 0], y) => { push(L, (t) => y + dy * t); return y + dy; },
  // a dip `depth` deep that comes back up, ending `dy` away from where it began. The lowest point sits at `at` of the way along.
  valley: (push, L, [depth = 3, dy = 0, at = 0.5], y) => {
    push(L, (t) => { const u = t < at ? (t / at) * 0.5 : 0.5 + ((t - at) / (1 - at)) * 0.5; return y + dy * ease(t) - depth * bell(u); }); return y + dy;
  },
  hill: (push, L, [h = 2, dy = 0], y) => { push(L, (t) => y + dy * ease(t) + h * bell(t)); return y + dy; },
  waves: (push, L, [amp = 1, n = 3, dy = 0], y) => { push(L, (t) => y + dy * t - amp * (0.5 - 0.5 * Math.cos(2 * Math.PI * n * t)) * Math.min(1, t * 6, (1 - t) * 6)); return y + dy; },
  // a ramp that steepens and then stops: the launch
  kicker: (push, L, [h = 2], y) => { push(L, (t) => y + h * t * t); return y + h; },
  // terraces: n steps, each `w` wide, each `h` lower (or higher) than the last
  steps: (push, L, [n = 4, h = -1.5], y) => { const w = L / n; push(L, (t) => { const k = Math.min(n - 1, Math.floor(t * n)), f = t * n - k, rise = 0.22; return y + h * (k + (f < rise ? ease(f / rise) : 1)); }); return y + h * n; },
  // the bowl at the end of a level: the lowest ground there is. Its far side rises so that nothing rolls out by accident.
  bowl: (push, L, [depth = 4, lip = 3], y) => { push(L, (t) => (t < 0.5 ? y - depth * ease(t * 2) : y - depth + lip * ease((t - 0.5) * 2))); return y - depth + lip; },
  // a pit: the ground is simply not there. The next stroke starts `dy` away in height.
  gap: (push, L, [dy = 0], y) => { push(L, () => NaN); return y + dy; },
};

export function build(spec, opt = {}) {
  const r = new RNG(spec.seed || spec.id || 'level');
  const ys = [], surfs = [], platforms = [], waters = [], jets = [], winds = [], pits = [], seeds = [], marks = [], zones = [], rides = [], placed = [];
  let x = 0, y = spec.y0 ?? 0;
  const lead = 14; for (let i = 0; i < lead / DX; i++) ys.push(y); x = lead;            // a run-in behind the start
  const start = { x: lead - 3, y };
  for (const st of spec.strokes) {
    const type = st[0], L = st[1], opt = typeof st[st.length - 1] === 'object' && !Array.isArray(st[st.length - 1]) ? st[st.length - 1] : {};
    const args = st.slice(2, opt === st[st.length - 1] ? -1 : undefined), fn = STROKES[type]; if (!fn) throw new Error('unknown stroke ' + type);
    const x0 = x, y0 = y, i0 = ys.length;
    y = fn((len, f) => { const n = Math.round(len / DX); for (let i = 0; i < n; i++) ys.push(f((i + 0.5) / n)); x += n * DX; }, L, args, y);
    const x1 = x, at = (t) => x0 + (x1 - x0) * t;
    if (type === 'gap') pits.push({ x0, x1, y: Math.min(y0, y) });
    if (type === 'bowl') marks.push({ kind: 'goal', x: at(0.5) });      // the goal is the lowest point of the last bowl
    if (opt.surf) surfs.push({ x0, x1, type: opt.surf });
    if (opt.water != null) { const wy = y0 + (opt.water[2] ?? -0.4); waters.push({ x0: at(opt.water[0] ?? 0), x1: at(opt.water[1] ?? 1), y: wy, y0: wy, hot: !!opt.hot, tide: opt.tide || null }); }
    for (const p of opt.plat || []) platforms.push({ x0: at(p.at) - p.w / 2, x1: at(p.at) + p.w / 2, y0: y0 + p.up, y1: y0 + p.up + (p.tilt || 0), type: p.type || 'rock', kind: p.kind || 'slab', ...(p.bob ? bob(y0 + p.up, p.bob, at(p.at)) : {}), ...moving(p.float && opt.tide ? afloat(y0 + p.up, opt.tide) : null, p.walk ? walk(at(p.at) - p.w / 2, at(p.at) + p.w / 2, p.walk, at(p.at)) : null) });
    for (const j of opt.jets || []) jets.push({ x: at(j.at), w: j.w || 1.3, top: j.top || 9, v: j.v || 17, every: j.every || 0, phase: j.phase || 0, on: j.every ? pulse(j.every, j.phase || 0, j.len || 1.6) : null });
    for (const w of opt.wind || []) winds.push({ x0: at(w.from ?? 0), x1: at(w.to ?? 1), y0: -1e9, y1: 1e9, wx: w.wx || 0, wy: w.wy || 0, gust: w.gusty ? (t) => 0.55 + 0.45 * Math.sin(t * 1.3 + x0) : null });
    if (opt.seeds) { const list = Array.isArray(opt.seeds) ? opt.seeds : Array.from({ length: opt.seeds }, (_, i) => ({ at: (i + 1) / (opt.seeds + 1) })); for (const s of list) seeds.push({ x: at(s.at), up: s.up ?? 1.3, i0 }); }
    for (const it of opt.items || []) placed.push({ kind: it.kind, x: at(it.at ?? 0.5), up: it.up ?? 1.3 });
    if (opt.mark) marks.push({ x: at(opt.at ?? 0.5), kind: opt.mark, text: opt.text });
    if (opt.zone) zones.push({ x0, x1, kind: opt.zone });
    if (opt.ride) rides.push({ x: at(opt.ride.at ?? 0.5), x1: at(opt.ride.at ?? 0.5) + opt.ride.to, up: opt.ride.up ?? 12 });
    if (type === 'bowl') marks.push({ x: at(0.5), kind: 'goal' });
  }
  // Past the end the ground stands up as a cliff, so that nothing that overshoots the last bowl can leave the level: it meets the wall and comes back down.
  for (let i = 0; i < 5 / DX; i++) ys.push(y + 16 * ease((i + 1) / (5 / DX))); for (let i = 0; i < 25 / DX; i++) ys.push(y + 16);
  // Smooth the joins between strokes. Pits keep their edges.
  const pit = ys.map((v) => Number.isNaN(v));
  let last = spec.y0 ?? 0; for (let i = 0; i < ys.length; i++) { if (pit[i]) ys[i] = last; else last = ys[i]; }
  for (let pass = 0; pass < (spec.smooth ?? 3); pass++) { const c = ys.slice(); for (let i = 2; i < ys.length - 2; i++) if (!pit[i]) ys[i] = (c[i - 2] + 2 * c[i - 1] + 3 * c[i] + 2 * c[i + 1] + c[i + 2]) / 9; }
  let lo = Infinity, hi = -Infinity; for (let i = 0; i < ys.length; i++) { if (!pit[i]) { lo = Math.min(lo, ys[i]); hi = Math.max(hi, ys[i]); } }
  const floor = lo - 60;
  // A pit falls away steeply at each edge instead of standing as a wall, which a height field cannot have.
  for (let i = 0; i < ys.length; i++) if (pit[i]) { let a = i; while (a > 0 && pit[a - 1]) a--; let b = i; while (b < ys.length - 1 && pit[b + 1]) b++; const d = Math.min(i - a + 1, b - i + 1) * DX; ys[i] = ys[i] - Math.min(48, d * d * 14 + d * 6); }
  const T = new Terrain({ ys: Float32Array.from(ys), dx: DX, x0: 0, surfs, platforms, waters, jets, winds, floor });
  T.base = spec.base || 'rock'; T.pits = pits;
  const gy = (px) => T.h(px);
  const goal = marks.find((m) => m.kind === 'goal') || { x: T.x1 - 34 }; goal.y = gy(goal.x);
  // Safe places to put the hero back: every so often, on ground that is nearly level and not over a pit or under water.
  const checks = [{ x: start.x, y: gy(start.x) }];
  for (let cx = start.x + 18; cx < goal.x - 6; cx += 2) {
    const prev = checks[checks.length - 1]; if (cx - prev.x < (spec.checkEvery || 34)) continue;
    if (Math.abs(T.dh(cx)) < 0.3 && !pits.some((p) => cx > p.x0 - 3 && cx < p.x1 + 3) && !T.waterAt(cx)) checks.push({ x: cx, y: gy(cx) });
  }
  // Things to find, besides the seeds. One stamp is hidden in every level, each in a different sort of place. A dewdrop relights a light that has gone out.
  // Where Mu flies, a feather hanging in the air gives her lift back, so a wide gap can be crossed in two beats, and a high stamp reached by a stair of them.
  const items = [], idn = String(spec.id || ''), li = spec.li ?? (/-B$/.test(idn) ? 5 : Math.max(0, (parseInt(idn.split('-')[1], 10) || 1) - 1)), r2 = new RNG('items:' + idn);
  for (const o of placed) items.push({ kind: o.kind, x: o.x, y: gy(o.x) + o.up, how: 'placed' });      // a level may place its own
  if (spec.id && spec.items !== false && spec.items !== 'own') {
    const near = (list, px, m) => list.some((q) => px > (q.x0 ?? q.x) - m && px < (q.x1 ?? q.x) + m);
    const clear = (px) => px > start.x + 8 && px < goal.x - 9 && Math.abs(T.dh(px)) < 0.4 && !near(pits, px, 3) && !near(waters, px, 3) && !near(winds, px, 2) && !near(jets, px, 4) && !near(platforms, px, 7) && !near(rides, px, 7) && !zones.some((z) => z.kind === 'drum' && px > z.x0 - 2 && px < z.x1 + 2);
    const span = goal.x - start.x, pickX = (u0, u1, crest, avoid) => { let best = null, bs = -1e9; for (let px = start.x + span * u0; px < start.x + span * u1; px += 0.5) { if (!clear(px) || (avoid != null && Math.abs(px - avoid) < 5)) continue; const hh = T.h(px), sc = (crest ? Math.min(hh - T.h(px - 4), hh - T.h(px + 4), 1.5) : 0) + r2.u() * 0.4; if (sc > bs) { bs = sc; best = px; } } return best; };
    const mid = (p) => (p.x0 + p.x1) / 2, lip = (p) => Math.max(T.h(p.x0 - 0.6), T.h(p.x1 + 0.6)), bare = (p) => !near(platforms, mid(p), (p.x1 - p.x0) / 2 + 2) && !near(winds, mid(p), 2) && !near(waters, mid(p), (p.x1 - p.x0) / 2 + 1);
    const want = spec.stamp || ['low', 'high', 'back', opt.mu ? 'stair' : 'high', 'pit', 'high'][li]; let st = null, used = null;
    if (want === 'pit') { const ok = pits.filter((p) => p.x1 - p.x0 >= 3 && p.x1 - p.x0 <= 8 && Math.abs(T.h(p.x0 - 0.6) - T.h(p.x1 + 0.6)) < 1 && p.x0 > start.x + 10 && bare(p)); if (ok.length) { used = ok[Math.floor(r2.u() * ok.length)]; st = { x: mid(used), y: lip(used) + 2.5, how: 'pit' }; } }
    const back = () => ({ x: start.x - 7.5, y: gy(start.x - 7.5) + 1.5, how: 'back' });
    if (!st && want === 'back') st = back();
    if (!st) { const w = want === 'pit' ? 'high' : want, sp = { low: [0.4, 0.62], stair: [0.42, 0.75] }[w] || (li === 5 ? [0.62, 0.9] : li === 3 ? [0.28, 0.5] : [0.55, 0.82]), px = pickX(sp[0], sp[1], true) ?? pickX(0.12, 0.93, true);
      if (px == null) st = back(); else { st = { x: px, y: gy(px) + (w === 'low' ? 2.5 : w === 'stair' ? 6.2 : opt.mu ? 4.3 : 3.25), how: w }; if (w === 'stair') items.push({ kind: 'feather', x: px, y: gy(px) + 4.6 }); } }
    items.push({ kind: 'stamp', ...st });
    for (const u of li === 5 ? [[0.3, 0.42], [0.62, 0.76]] : [[0.5, 0.68]]) { const px = pickX(u[0], u[1], false, st.x) ?? pickX(0.25, 0.85, false, st.x); if (px != null) items.push({ kind: 'dew', x: px, y: gy(px) + 1.25 }); }
    if (opt.mu) for (const p of pits) if (p.x1 - p.x0 >= 5.75 && p !== used && bare(p)) items.push({ kind: 'feather', x: mid(p), y: lip(p) + 2 });
  }
  return {
    spec, T, start: { x: start.x, y: gy(start.x) }, goal, checks, pits, zones, marks, rides, li, items: items.map((it, i) => ({ id: i, got: false, ...it })),
    seeds: seeds.map((s, i) => ({ id: i, x: s.x, y: gy(s.x) + s.up, got: false })),
    lo, hi, length: goal.x - start.x, rng: r,
    fell: (b) => b.y < T.floor + 30 || pits.some((p) => b.x > p.x0 && b.x < p.x1 && b.y < p.y - 9),
    checkFor: (px) => { let c = checks[0]; for (const k of checks) if (k.x <= px) c = k; return c; },
  };
}

// a platform that rides up and down, as a balloon or a floating rock does
// a thing afloat rises and falls with the water under it; a thing that walks goes to and fro
function afloat(y, td) { const k = (2 * Math.PI) / td.per; return { move: (t) => { const o = td.amp * Math.sin(t * k + (td.ph || 0)); return { y0: y + o, y1: y + o }; }, vy: (t) => td.amp * k * Math.cos(t * k + (td.ph || 0)) }; }
function walk(x0, x1, wk, seed) { const k = (2 * Math.PI) / (wk.per || 8), ph = (seed * 0.61) % 6.28, d = wk.dist || 3; return { move: (t) => { const o = d * Math.sin(t * k + ph); return { x0: x0 + o, x1: x1 + o }; }, vx: (t) => d * k * Math.cos(t * k + ph), dir: (t) => Math.cos(t * k + ph) }; }
const moving = (fl, wk) => (fl && wk ? { move: (t) => ({ ...fl.move(t), ...wk.move(t) }), vy: fl.vy, vx: wk.vx, dir: wk.dir } : fl || wk || {});
function bob(y, b, seed) { const amp = b.amp || 1, per = b.per || 4, ph = (seed * 0.37) % 6.28; return { move: (t) => { const o = amp * Math.sin((t * 2 * Math.PI) / per + ph); return { y0: y + o, y1: y + o }; }, vy: (t) => amp * ((2 * Math.PI) / per) * Math.cos((t * 2 * Math.PI) / per + ph) }; }
// a geyser that comes and goes: quiet, then a rise, a hold and a fall
function pulse(every, phase, len) { return (t) => { const u = ((t + phase) % every + every) % every; return u < 0.35 ? u / 0.35 : u < len ? 1 : u < len + 0.5 ? 1 - (u - len) / 0.5 : 0; }; }
