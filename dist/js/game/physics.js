// The physics of the game. No drawing and no browser in here, so the same code runs in the tests and under a scripted player.
//
// Units: one unit is about the hero's height. y is up. Height is the lesson: the height of the ground stands for error.
// The rules, which the tests in tests/physics.test.mjs hold us to:
//   - one gravity, everywhere;
//   - nothing gains energy from nowhere (a jump, a geyser, a gust and a wave are the only sources, and each can be seen);
//   - a rolling ball really rolls: its spin matches its speed over the ground, and spin is part of its energy;
//   - the step is fixed, so the game plays the same on every machine.

export const G = 30;            // gravity, units per second squared
export const STEP = 1 / 240;    // the fixed step
export const R = 0.46;          // the hero's radius
const K = 0.4;                  // moment of inertia of a solid ball, as a share of m r²

// Each surface: mu = grip for feet, muk = sliding friction, crr = rolling resistance, e = bounce of a tucked ball.
export const SURF = {
  rock:  { mu: 0.95, muk: 0.6,   crr: 0.012, e: 0.2 },
  grass: { mu: 0.85, muk: 0.5,   crr: 0.026, e: 0.12 },
  moss:  { mu: 0.8,  muk: 0.46,  crr: 0.036, e: 0.05 },
  sand:  { mu: 0.75, muk: 0.62,  crr: 0.07,  e: 0.02 },
  snow:  { mu: 0.55, muk: 0.1,   crr: 0.05,  e: 0.02 },
  ice:   { mu: 0.14, muk: 0.022, crr: 0.006, e: 0.1 },
  wet:   { mu: 0.55, muk: 0.28,  crr: 0.014, e: 0.14 },
  lava:  { mu: 1.0,  muk: 0.68,  crr: 0.02,  e: 0.16 },
  clay:  { mu: 0.85, muk: 0.55,  crr: 0.014, e: 0.14 },
  wood:  { mu: 0.8,  muk: 0.45,  crr: 0.016, e: 0.22 },
};

// What the legs can do.
export const RUN_V = 9.5, RUN_A = 46, BRAKE = 60, AIR_A = 16;
export const HOP_V = 8.4, HOP_J = 14;   // Mu's lift in the air: the speed it leaves a still body with, and the most it can change a moving one by
export const JUMP_V = 6.2, PUSH_A = 62, PUSH_T = 0.125;   // a jump is a small kick and then a push for as long as the button is held: a tap is a hop, a hold is a leap
const COYOTE = 0.1, BUFFER = 0.12;
// Drag through the air, per unit of mass: tucked is small, spread wide is large.
const CD = { ball: 0.0032, run: 0.011, slide: 0.008, spread: 0.075 };
const FLOATS = 0.6;             // the hero's density, as a share of water's

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---- the ground ----
// A height field sampled every `dx`, read through a cubic so the surface and its slope are both smooth: no joints to snag on.
export class Terrain {
  constructor({ ys, dx = 0.5, x0 = 0, surfs = [], platforms = [], waters = [], jets = [], winds = [], floor = -1e9 }) {
    this.ys = ys; this.dx = dx; this.x0 = x0; this.x1 = x0 + (ys.length - 1) * dx;
    this.surfs = surfs;           // [{ x0, x1, type }], later entries win; the rest is `base`
    this.base = 'rock';
    this.platforms = platforms;   // [{ x0, x1, y0, y1, type, vx(t), vy(t), move(t) }] ledges that hold from above only
    this.waters = waters;         // [{ x0, x1, y }]
    this.jets = jets;             // [{ x, w, top, v, on(t) }] a column of water moving up at speed v
    this.winds = winds;           // [{ x0, x1, y0, y1, wx, wy, gust(t) }]
    this.floor = floor;           // below this the hero has fallen out of the level
  }
  _i(x) { const u = (x - this.x0) / this.dx, n = this.ys.length; const i = clamp(Math.floor(u), 1, n - 3); return [i, clamp(u - i, -1, 2)]; }
  h(x) {
    const [i, t] = this._i(x), y = this.ys, p0 = y[i - 1], p1 = y[i], p2 = y[i + 1], p3 = y[i + 2];
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  }
  dh(x) {
    const [i, t] = this._i(x), y = this.ys, p0 = y[i - 1], p1 = y[i], p2 = y[i + 1], p3 = y[i + 2];
    return (0.5 * ((-p0 + p2) + 2 * (2 * p0 - 5 * p1 + 4 * p2 - p3) * t + 3 * (-p0 + 3 * p1 - 3 * p2 + p3) * t * t)) / this.dx;
  }
  ddh(x) { const e = this.dx * 0.5; return (this.dh(x + e) - this.dh(x - e)) / (2 * e); }
  surfAt(x) { let s = this.base; for (const r of this.surfs) if (x >= r.x0 && x < r.x1) s = r.type; return s; }
  waterAt(x) { for (const w of this.waters) if (x >= w.x0 && x <= w.x1) return w; return null; }
  // The nearest point of the ground to a circle. Returns how far the circle has sunk in, and the way out.
  contact(cx, cy, r, seed = 0) {
    const top = this.h(cx);
    if (cy < top) { // the centre itself is under the surface: out along the surface's own normal
      const s = this.dh(cx), inv = 1 / Math.hypot(1, s), nx = -s * inv, ny = inv, dist = (cy - top) * ny;
      return { depth: r - dist, nx, ny, px: cx, py: top, surf: this.surfAt(cx), pvx: 0, pvy: 0 };
    }
    if (cy - top > r * 3.2 && Math.abs(this.dh(cx)) < 2) return null;          // well clear
    let x = cx + seed;
    for (let k = 0; k < 6; k++) { const hy = this.h(x), s = this.dh(x), inv = 1 / Math.hypot(1, s); x += ((cx - x) * inv + (cy - hy) * s * inv) * inv * 0.9; }
    const hy = this.h(x), ddx = cx - x, ddy = cy - hy, d = Math.hypot(ddx, ddy);
    if (d >= r) return null;
    let nx, ny; if (d > 1e-4) { nx = ddx / d; ny = ddy / d; } else { const s = this.dh(x), inv = 1 / Math.hypot(1, s); nx = -s * inv; ny = inv; }
    return { depth: r - d, nx, ny, px: x, py: hy, surf: this.surfAt(x), pvx: 0, pvy: 0 };
  }
}

// ---- the hero as a body ----
export class Body {
  constructor(x = 0, y = 0) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.w = 0;        // w: spin, positive when rolling toward +x
    this.r = R; this.mode = 'run';                                      // run | slide | ball
    this.spread = false; this.grounded = false; this.nx = 0; this.ny = 1; this.surf = 'rock';
    this.hops = 0; this.coyote = 0; this.buffer = 0; this.pushT = 0; this.pnx = 0; this.pny = 1; this.noSnap = 0;
    this.airT = 0; this.groundT = 0; this.impact = 0; this.inWater = 0; this.inJet = 0; this.t = 0; this.face = 1;
    this.can = { slide: true, roll: true, spread: true };               // what the hero has learned so far
    this.events = [];                                                   // what happened this step, for sound and animation
    this.work = 0;                                                      // energy put in by legs, jets, wind and water, for the tests
  }
  speed() { return Math.hypot(this.vx, this.vy); }
  energy() { return 0.5 * (this.vx * this.vx + this.vy * this.vy) + (this.mode === 'ball' ? 0.5 * K * this.r * this.r * this.w * this.w : 0) + G * this.y; }
}

// One fixed step. `inp` = { move: -1..1, jump: held, jumpNow: pressed this step, tuck: held }.
export function step(b, T, inp, dt = STEP) {
  b.t += dt; b.events.length = 0; b.impact = 0;
  if (inp.move) b.face = inp.move > 0 ? 1 : -1;

  // --- posture ---
  const wantTuck = !!inp.tuck;
  if (wantTuck && b.can.roll) {
    if (b.mode !== 'ball') {
      // Throwing itself into the roll, the hero sets the ball spinning to match its speed over the ground. That is work done by the body.
      const vt = b.grounded ? b.vx * b.ny - b.vy * b.nx : b.vx; const w0 = vt / b.r, e0 = b.energy();
      b.mode = 'ball'; b.w = b.grounded ? w0 : b.w * 0.5 + w0 * 0.5; b.work += b.energy() - e0; b.events.push('tuck');
    }
  } else if (wantTuck && b.can.slide && b.grounded) { if (b.mode !== 'slide') { b.mode = 'slide'; b.events.push('slide'); } }
  else if (b.mode !== 'run') {
    if (b.mode === 'ball') { const e0 = b.energy(); b.mode = 'run'; b.work += b.energy() - e0; b.w = 0; b.events.push('untuck'); }   // the spin is thrown away
    else if (!wantTuck || !b.grounded) b.mode = 'run';
  }

  // --- jump ---
  if (b.grounded || b.inWater > FLOATS) b.hops = b.can.mu ? 1 : 0;      // Mu's wings are fresh again on any footing
  b.buffer = inp.jumpNow ? BUFFER : Math.max(0, b.buffer - dt);
  b.coyote = b.grounded && b.noSnap <= 0 ? COYOTE : Math.max(0, b.coyote - dt);
  if (b.buffer > 0 && b.coyote > 0 && b.pushT <= 0 && b.noSnap <= 0) {
    // Off the ground along a line between straight up and the slope's normal, so a jump off a ramp carries forward.
    let jx = b.nx * 0.45, jy = b.ny * 0.45 + 0.55; const l = Math.hypot(jx, jy); jx /= l; jy /= l;
    const vn = b.vx * jx + b.vy * jy, e0 = b.energy(); if (vn < 0) { b.vx -= vn * jx; b.vy -= vn * jy; }
    b.vx += jx * JUMP_V; b.vy += jy * JUMP_V; b.work += b.energy() - e0;
    b.pushT = PUSH_T; b.pnx = jx; b.pny = jy; b.buffer = 0; b.coyote = 0; b.grounded = false; b.noSnap = 0.12; b.events.push('jump');
  }
  // Mu's lift, once between one footing and the next: the bird takes hold and beats upward. It is a push of a fixed size at most, so it turns a slow fall
  // into a rise and only checks a fast one. The work is the bird's, and it goes in the accounts like any other.
  if (!b.grounded && b.inWater <= FLOATS && inp.jumpNow && b.hops > 0 && b.coyote <= 0 && b.pushT <= 0 && (b.vy > 0 || b.y - b.r - T.h(b.x) > 0.6)) {
    const e0 = b.energy(); b.vy = Math.min(b.vy + HOP_J, Math.max(b.vy, 0) * 0.5 + HOP_V); b.work += Math.max(0, b.energy() - e0); b.hops--; b.buffer = 0; b.events.push('hop');
  }
  b.spread = b.can.spread && !b.grounded && inp.jump && b.pushT <= 0 && b.vy < -1.5 && b.mode !== 'ball';

  // --- forces in the open ---
  let ax = 0, ay = -G, wx = T.air ? T.air(b.t) : 0, wy = 0;      // T.air: the weather's wind, the same everywhere along the level
  for (const z of T.winds) if (b.x >= z.x0 && b.x <= z.x1 && b.y >= z.y0 && b.y <= z.y1) { const g = z.gust ? z.gust(b.t) : 1; wx += z.wx * g; wy += z.wy * g; }
  const cd = b.spread ? CD.spread : CD[b.mode], rvx = b.vx - wx, rvy = b.vy - wy, rs = Math.hypot(rvx, rvy);
  let fx = -cd * rs * rvx, fy = -cd * rs * rvy;
  if (wx || wy) b.work += (fx * b.vx + fy * b.vy) * dt > 0 ? (fx * b.vx + fy * b.vy) * dt : 0;
  ax += fx; ay += fy;
  // water: it holds the hero up by the share of the body under the surface, and drags hard
  const wtr = T.waterAt(b.x); b.inWater = 0;
  if (wtr && b.y - b.r < wtr.y && b.y + b.r > T.h(b.x)) {
    const sub = clamp((wtr.y - (b.y - b.r)) / (2 * b.r), 0, 1); b.inWater = sub;
    const up = (G * sub) / FLOATS, sp = b.speed(), k = (1.1 + 0.5 * sp) * sub;
    ay += up; ax -= k * b.vx; ay -= k * b.vy; if (b.vy > 0) b.work += up * b.vy * dt;
    if (inp.move && sub > 0.2) { ax += inp.move * 9; b.work += Math.max(0, inp.move * 9 * b.vx * dt); }   // paddling
  }
  // a jet of water: it pushes toward its own speed, harder near the middle
  b.inJet = 0;
  for (const j of T.jets) {
    const on = j.on ? j.on(b.t) : 1; if (on <= 0) continue;
    const dxj = Math.abs(b.x - j.x), base = T.h(j.x); if (dxj > j.w || b.y < base - 1 || b.y > base + j.top) continue;
    const s = on * (1 - dxj / j.w) * (1 - Math.max(0, (b.y - base) / j.top) * 0.6), rel = j.v - b.vy;
    if (rel > 0) { const a = Math.min(rel * 9, 160) * s; ay += a; if (b.vy > 0) b.work += a * b.vy * dt; b.inJet = Math.max(b.inJet, s); }
    if (j.grip) ax -= j.grip * b.vx * s;      // a thick column of water also slows whatever crosses it
  }
  // the push of a jump, for as long as the button is held
  if (b.pushT > 0) { if (inp.jump) { ax += b.pnx * PUSH_A; ay += b.pny * PUSH_A; b.work += PUSH_A * Math.max(0, b.pnx * b.vx + b.pny * b.vy) * dt; b.pushT -= dt; } else b.pushT = 0; }
  // steering in the air: small, and it is the body twisting against the air, so it only works while there is air speed to twist against
  if (!b.grounded && inp.move && !b.inWater) { const want = inp.move * RUN_V; if ((want - b.vx) * inp.move > 0) { ax += inp.move * AIR_A; b.work += Math.max(0, inp.move * AIR_A * b.vx * dt); } }

  b.vx += ax * dt; b.vy += ay * dt;
  const px = b.x, py = b.y; b.x += b.vx * dt; b.y += b.vy * dt;

  // --- contact ---
  const was = b.grounded; b.grounded = false;
  for (let it = 0; it < 3; it++) {
    let c = T.contact(b.x, b.y, b.r, 0);
    const c2 = T.contact(b.x, b.y, b.r, it === 0 ? b.r * 0.7 : -b.r * 0.7); if (c2 && (!c || c2.depth > c.depth)) c = c2;
    const cp = ledge(b, T, px, py); if (cp && (!c || cp.depth > c.depth)) c = cp;
    if (!c) break;
    resolve(b, c, inp, dt, it === 0);
  }
  b.noSnap = Math.max(0, b.noSnap - dt);
  // Feet and bellies keep to the ground over a crest unless the hero is going fast enough to leave it: v² κ > g cos(slope).
  if (!b.grounded && was && b.mode !== 'ball' && b.noSnap <= 0 && b.pushT <= 0) {
    const s = T.dh(b.x), inv = 1 / Math.hypot(1, s), nx = -s * inv, ny = inv, gap = (b.y - T.h(b.x)) * ny - b.r;
    const vt = b.vx * ny - b.vy * nx, kappa = -T.ddh(b.x) * inv * inv * inv;
    const vn = b.vx * nx + b.vy * ny;
    if (gap < 0.2 && gap >= 0 && vn < 0.4 && !b.inJet && b.inWater <= FLOATS && vt * vt * Math.max(0, kappa) <= G * ny) { b.x -= nx * gap; b.y -= ny * gap; b.vx -= vn * nx; b.vy -= vn * ny; b.grounded = true; b.nx = nx; b.ny = ny; b.surf = T.surfAt(b.x); }
  }
  if (b.grounded) { if (!was && b.airT > 0.08) b.events.push('land'); b.airT = 0; b.groundT += dt; } else { b.airT += dt; b.groundT = 0; }
  if (b.inWater > 0.3 && !b._wet) { b._wet = true; b.events.push('splash'); } else if (b.inWater === 0) b._wet = false;
}

// Ledges: thin pieces that hold from above. Tested along the path of the step, so that no speed gets through them.
function ledge(b, T, px, py) {
  let best = null;
  for (const p of T.platforms) {
    const st = p.move ? p.move(b.t) : p; const x0 = st.x0 ?? p.x0, x1 = st.x1 ?? p.x1, y0 = st.y0 ?? p.y0, y1 = st.y1 ?? p.y1;
    if (b.x < x0 - b.r || b.x > x1 + b.r) continue;
    const s = (y1 - y0) / (x1 - x0), inv = 1 / Math.hypot(1, s), nx = -s * inv, ny = inv;
    const cx = clamp(b.x, x0, x1), top = y0 + (cx - x0) * s, pcx = clamp(px, x0, x1), ptop = y0 + (pcx - x0) * s;
    const dNow = (b.x - cx) * nx + (b.y - top) * ny, dBefore = (px - pcx) * nx + (py - ptop) * ny;
    const pvy = p.vy ? p.vy(b.t) : 0, pvx = p.vx ? p.vx(b.t) : 0;
    if (dBefore >= b.r - 0.06 - Math.abs(pvy) * STEP * 2 && dNow < b.r && (b.vy - pvy) <= 0.01) {
      const c = { depth: b.r - dNow, nx, ny, px: cx, py: top, surf: p.type || 'rock', pvx, pvy };
      if (!best || c.depth > best.depth) best = c;
    }
  }
  return best;
}

function resolve(b, c, inp, dt, first) {
  const { nx, ny } = c, tx = ny, ty = -nx, S = SURF[c.surf] || SURF.rock;
  b.x += nx * c.depth; b.y += ny * c.depth;
  let rvx = b.vx - c.pvx, rvy = b.vy - c.pvy, vn = rvx * nx + rvy * ny, vt = rvx * tx + rvy * ty, jn = 0;
  if (vn < 0) {
    const hit = -vn, e = b.mode === 'ball' && hit > 3 ? S.e : 0;
    jn = (1 + e) * hit; vn += jn; if (first) b.impact = hit;
  }
  // How hard the ground pushed back over this step. It already holds the hero's weight and whatever a curve in the path adds to it.
  const nImp = first ? jn : 0, vt0 = vt;
  if (!first) { /* a second touch in the same step only moves the hero out; friction has had its turn */ }
  else if (b.mode === 'ball') {
    // Friction at the point of contact acts on the slip between the ball's surface and the ground. Enough of it and the ball rolls.
    const slip = vt - b.w * b.r, stick = -slip / (1 + 1 / K), lim = S.mu * nImp, jt = clamp(stick, -lim, lim);
    vt += jt; b.w -= jt / (K * b.r);
    const rr = S.crr * nImp, cut = Math.min(Math.abs(vt), rr) * Math.sign(vt); vt -= cut; b.w -= cut / b.r;
    if (inp.move) { const push = inp.move * 7 * dt, lim2 = S.mu * nImp; const p = clamp(push, -lim2, lim2); const e0 = vt * vt; vt += p; b.w += p / b.r; b.work += Math.max(0, 0.5 * (1 + K) * (vt * vt - e0)); }   // leaning into the roll
  } else if (b.mode === 'slide') {
    const f = S.muk * nImp; vt -= Math.min(Math.abs(vt), f) * Math.sign(vt);
  } else {
    const lim = S.mu * nImp; let dv = 0;
    if (inp.move) { if (Math.abs(vt) < RUN_V || vt * inp.move < 0) dv = inp.move * RUN_A * dt; else dv = -Math.sign(vt) * 5 * dt; }
    else dv = -Math.sign(vt) * Math.min(Math.abs(vt), BRAKE * dt);
    dv = clamp(dv, -lim, lim); if (dv * vt > 0) b.work += Math.abs(dv * vt) + 0.5 * dv * dv; vt += dv;
  }
  // Held still by friction, the hero must not creep: take back the little slip this step made before friction caught it.
  if (first && vt === 0 && Math.abs(vt0) < 0.6 && b.mode !== 'ball') { b.x -= tx * vt0 * dt; b.y -= ty * vt0 * dt; }
  b.vx = vn * nx + vt * tx + c.pvx; b.vy = vn * ny + vt * ty + c.pvy;
  if (ny > 0.25 && vn < 1.2) { b.grounded = true; b.nx = nx; b.ny = ny; b.surf = c.surf; }   // touching while flying away from the ground is not standing on it
}

// Run the fixed step as many times as real time asks for. Returns how far into the next step we are, for smooth drawing.
// Turbo. A burst from the hero's own store of light: a push of TURBO_V along the ground in the way it faces, or forward and a little up when in the air.
// It is work done by the body, and it is entered in the body's accounts like a jump, so the tests that watch the energy still balance.
export const TURBO_V = 11;
export function turbo(b) {
  if (b.inWater > 0.5) return false;                       // nothing to push against
  const e0 = b.energy(), f = b.face || 1, dx = b.grounded ? b.ny * f : 0.94 * f, dy = b.grounded ? -b.nx * f : 0.34;
  b.vx += dx * TURBO_V; b.vy += dy * TURBO_V; if (b.mode === 'ball' && b.grounded) b.w = (b.vx * b.ny - b.vy * b.nx) / b.r;      // a rolling ball goes on rolling without slipping
  b.work += Math.max(0, b.energy() - e0); b.events.push('turbo'); return true;
}
export function advance(b, T, inp, acc, dtReal, onStep) {
  acc += Math.min(dtReal, 0.1);
  while (acc >= STEP) { b.px = b.x; b.py = b.y; step(b, T, inp, STEP); if (onStep) onStep(b); inp.jumpNow = false; acc -= STEP; }
  b.mix = acc / STEP;      // how far the picture is past the last step: play.js draws the body there, between the last two steps, so motion is even at any frame rate
  return acc;
}
