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

export function build(spec) {
  const r = new RNG(spec.seed || spec.id || 'level');
  const ys = [], surfs = [], platforms = [], waters = [], jets = [], winds = [], pits = [], seeds = [], marks = [], zones = [], rides = [];
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
  return {
    spec, T, start: { x: start.x, y: gy(start.x) }, goal, checks, pits, zones, marks, rides,
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
