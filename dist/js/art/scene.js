// Paints a level: sky, far country, the ground the hero runs on, everything living on it, the weather and the light.
// A world's theme (js/art/worlds/*.js) says what to paint; this file knows how.
// Layers, back to front: sky, far ridges, middle ridges, ground and what stands on it, the hero, near silhouettes, air and light.
import { RNG } from '../core/rng.js';
import { TAU, lerp, clamp, smooth, mix, rgba, lighten, darken, hash1, noise1, fbm, ridge, sprite, stamp, P, Q } from './paint.js';
import { stampSprite } from './stamps.js';
import { drawTheta } from '../game/theta.js';
import { Weather } from '../game/weather.js';

const RIDGE = {
  jag: (u, s) => ridge(u, s, 5) * 0.75 + fbm(u * 0.31, s + 9, 2) * 0.35,
  round: (u, s) => fbm(u, s, 3),
  table: (u, s) => { const v = fbm(u, s, 3); return smooth(clamp((v - 0.36) * 4.2, 0, 1)) * 0.72 + fbm(u * 3.1, s + 5, 2) * 0.1 + v * 0.18; },
  dune: (u, s) => { const v = noise1(u, s), w = noise1(u * 2.3 + 4, s + 3); return Math.pow(v, 1.6) * 0.75 + w * 0.25; },
  cone: (u, s) => { const c = Math.abs(((u * 0.5 + hash1(Math.floor(u * 0.5), s)) % 1) - 0.5) * 2; return Math.pow(1 - c, 2.2) * (0.5 + 0.5 * hash1(Math.floor(u * 0.5), s + 1)) * 0.8 + fbm(u * 2, s, 2) * 0.2; },
  // one great volcano standing alone on the horizon, with low country either side of it
  volc: (u, s) => { const d = Math.abs(u - 0.35 - (s % 7) * 0.05); return Math.pow(Math.max(0, 1 - d * 0.95), 1.7) * 0.92 * (1 + (fbm(u * 6, s, 2) - 0.5) * 0.12) + fbm(u * 1.3, s + 4, 2) * 0.1; },
  // towers of rock: three sheer spires shoulder to shoulder on a lower massif, the way granite stands when the softer rock round it has been carried off
  torres: (u, s) => { const k = Math.floor(u * 0.8), f = u * 0.8 - k, on = hash1(k, s) > 0.3; let v = 0;
    if (on) for (let i = 0; i < 3; i++) { const c = 0.32 + i * 0.18 + (hash1(k, s + i) - 0.5) * 0.05, wd = 0.085 + 0.03 * hash1(k, s + 5 + i), hh = (i === 1 ? 0.8 : 0.62) + 0.2 * hash1(k, s + 9 + i), d = Math.abs(f - c) / wd; if (d < 1) v = Math.max(v, hh * Math.pow(1 - d, 0.42)); }
    const mass = on ? Math.pow(Math.sin(Math.PI * clamp((f - 0.12) / 0.76, 0, 1)), 0.7) * 0.34 : 0; return Math.max(v, mass) * 0.9 + fbm(u * 2.2, s + 7, 3) * 0.16; },
  pillar: (u, s) => { const k = Math.floor(u * 1.7), f = u * 1.7 - k, on = hash1(k, s) > 0.42, hh = hash1(k, s + 2); return (on ? smooth(clamp(Math.min(f, 1 - f) * 7, 0, 1)) * (0.45 + 0.55 * hh) : 0) * 0.85 + fbm(u * 0.6, s + 7, 2) * 0.2; },
};

// Which shapes of skyline throw spurs, and how strongly: peaks and dunes do, rounded hills and table-lands do not.
const SPUR = { jag: 1, torres: 1.1, cone: 0.8, volc: 0.9, dune: 1.15 };

// A tile of brushwork, one unit to 64 pixels, to lay over a flat colour.
function tile(kind, seed, s = 1) {
  const n = 192, c = document.createElement('canvas'); c.width = c.height = n * s; const x = c.getContext('2d'), r = new RNG('tile' + kind + seed); x.scale(s, s);
  const dab = (col, a, w, h, rot) => { x.fillStyle = col; x.globalAlpha = a; const px = r.range(0, n), py = r.range(0, n); for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { x.beginPath(); x.ellipse(px + ox, py + oy, w, h, rot, 0, TAU); x.fill(); } };
  if (kind === 'grass') for (let i = 0; i < 260; i++) dab(r.chance(0.5) ? '#ffffff' : '#000000', r.range(0.05, 0.16), r.range(0.8, 1.6), r.range(4, 11), r.range(-0.35, 0.35));
  else if (kind === 'snow') { for (let i = 0; i < 90; i++) dab('#7fa2d0', r.range(0.05, 0.14), r.range(5, 16), r.range(1.5, 4), r.range(-0.2, 0.2)); for (let i = 0; i < 60; i++) dab('#ffffff', r.range(0.3, 0.8), 0.9, 0.9, 0); }
  else if (kind === 'ice') { for (let i = 0; i < 40; i++) dab('#ffffff', r.range(0.08, 0.25), r.range(8, 30), r.range(0.6, 1.5), r.range(-0.5, 0.5)); for (let i = 0; i < 40; i++) dab('#1f5f9a', r.range(0.05, 0.14), r.range(6, 18), r.range(1, 3), r.range(-0.3, 0.3)); }
  else if (kind === 'rock') { for (let i = 0; i < 130; i++) dab(r.chance(0.45) ? '#ffffff' : '#000000', r.range(0.03, 0.1), r.range(2, 12), r.range(1, 5), r.range(0, 3.1)); for (let i = 0; i < 120; i++) dab('#ffffff', r.range(0.05, 0.2), 0.8, 0.8, 0); }
  else for (let i = 0; i < 380; i++) dab(r.chance(0.5) ? '#ffffff' : '#000000', r.range(0.04, 0.14), r.range(0.7, 1.8), r.range(0.7, 1.8), 0);   // sand: a fine speckle
  return c;
}
const TILE_OF = { granite: 'rock', moraine: 'rock', pampa: 'grass', lenga: 'grass', cedar: 'grass', root: 'rock', stream: 'rock', stone: 'rock', ledge: 'rock', mossy: 'grass', forest: 'grass', wetstone: 'rock', dune: 'sand', soft: 'sand', pan: 'rock', gravel: 'rock', grassy: 'grass', lava: 'rock', beach: 'sand', scoria: 'sand', green: 'grass', carpet: 'grass', wetrock: 'rock', tuff: 'sand', rose: 'sand', honey: 'sand', dust: 'sand', vine: 'grass', cap: 'rock', drum: 'sand', meadow: 'grass', moss: 'grass', snow: 'snow', ice: 'ice', sand: 'sand', hot: 'sand', rock: 'rock', basalt: 'rock', wet: 'rock' };

export class Scene {
  constructor(theme, level, timeKey = 'day') {
    this.theme = theme; this.level = level; this.T = level.T; this.time = { ...theme.times[timeKey] || theme.times.day }; this.timeKey = timeKey;
    this.spr = theme.sprites(this.time); this.far = theme.far(this.time); this.G = theme.ground(this.time); this.parts = []; this.t = 0; this.W = 1; this.H = 1; this.q = 2;     // q: 0 plain, 1 good, 2 full
    this.fx = { glow: sprite(1, 1, (c) => P.glow(c, 1, 1, null, { col: '#ffffff' }), { ax: 0.5, ay: 0.5, ppu: 96 }), warm: sprite(1, 1, (c) => P.glow(c, 1, 1, null, { col: '#ffd76a' }), { ax: 0.5, ay: 0.5, ppu: 96 }) };
    this.sky = null; this.y0 = level.start.y; this.shake = 0; this.flash = 0;
    this.zoneAt = (x) => { let z = level.spec.zone || theme.zone || 'rock'; for (const r of level.zones) if (x >= r.x0 && x < r.x1) z = r.kind; return z; };
    this.amb = theme.ambient ? theme.ambient(this.time) : []; this.ambParts = [];
    this.slabs = new Map(); this.tiles = {}; this.grain = null;
    this._glint = [];
    { const gd = typeof document !== 'undefined' && document.getElementById('grade'); if (gd) { gd.children[0].style.background = this.time.tint || 'transparent'; gd.children[2].style.opacity = String(Math.min(1, (this.time.vignette ?? 0.42) / 0.5)); } }      // the hour's tint and the dark corners belong to the page (see css): cheaper there, and the same on every machine
    this.wx = new Weather(level.spec.id + timeKey, theme.weather ? theme.weather(timeKey) : {}); this.cloudX = 0; this.windX = 0; this.coldNow = this.wx.c.cold; this.own = true;   // Play hands in the weather it shares with the physics; a scene on its own keeps its own
  }
  _pat(ctx, kind) { let p = this.tiles[kind]; if (!p) { const s = Q.k >= 2 ? 3 : Q.k > 1 ? 2 : 1; p = ctx.createPattern(tile(kind, 1, s), 'repeat'); p.setTransform(new DOMMatrix().scale(1 / (64 * s))); this.tiles[kind] = p; } return p; }
  resize(W, H) { this.W = W; this.H = H; this.sky = null; }

  // ---- small moving things ----
  emit(kind, x, y, n = 1, o = {}) {
    if (this.parts.length > (this.q ? 520 : 200)) return;
    for (let i = 0; i < n; i++) {
      const a = (o.dir ?? -Math.PI / 2) + (Math.random() - 0.5) * (o.spread ?? 1.2), sp = (o.speed ?? 3) * (0.4 + Math.random() * 0.9);
      this.parts.push({ kind, x: x + (Math.random() - 0.5) * (o.jx ?? 0.3), y: y + (Math.random() - 0.5) * (o.jy ?? 0.1), vx: Math.cos(a) * sp + (o.vx || 0), vy: -Math.sin(a) * sp + (o.vy || 0), life: 0, max: (o.life ?? 0.6) * (0.6 + Math.random() * 0.8), size: (o.size ?? 0.09) * (0.6 + Math.random() * 0.9), col: o.col || '#ffffff', g: o.g ?? 18, drag: o.drag ?? 1.2, add: !!o.add, rot: Math.random() * TAU });
    }
  }
  update(dt, cam) {
    this.t += dt; this.shake = Math.max(0, this.shake - dt * 3); this.flash = Math.max(0, this.flash - dt * 2.2);
    const wx = this.wx; if (this.own) wx.set(this.t, dt); this.cloudX += (0.0035 + wx.wind * 0.004) * dt; this.windX += wx.wind * dt; if (wx.flash > 0.9) this.flash = Math.max(this.flash, 0.7);
    if (cam && this.q) for (const z of this.T.winds) { const a0 = Math.max(z.x0, cam.x - cam.vw / 2), a1 = Math.min(z.x1, cam.x + cam.vw / 2); if (a1 <= a0) continue; const g = z.gust ? z.gust(this.pt ?? this.t) : 1; let n = Math.abs(z.wx) * g * (a1 - a0) * 0.05 * dt; n = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0); for (let i = 0; i < n; i++) { const x = a0 + Math.random() * (a1 - a0); this.emit('line', x, this.T.h(x) + 0.2 + Math.random() * 3.2, 1, { speed: 0, life: 0.5, size: 0.07, col: this.theme.dustCol || '#ffffff', g: 0, vx: z.wx * g * 0.9, vy: 0, drag: 0 }); } }      // the wind made visible
    if (cam) { // it snows on the snow and the ice, where the ground is cold enough to keep it, and rains lower down
      const z = this.zoneAt(cam.x), cold = wx.cold >= 0.5 || z === 'snow' || z === 'ice' ? 1 : 0; this.coldNow += (cold - this.coldNow) * Math.min(1, dt * 0.8);
      const wet = wx.rain * (1 - this.coldNow); if (wet > 0.04 && this.q) { let n = wet * 70 * dt; n = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0); for (let i = 0; i < n; i++) { const x = cam.x + (Math.random() - 0.5) * cam.vw, w = this.T.waterAt(x), gy = this.T.h(x), y = w && w.y > gy ? w.y : gy; if (y < cam.y - cam.vh) continue; this.emit('drop', x, y + 0.04, 2, { speed: 1.7, spread: 1.5, life: 0.2, size: 0.032, col: '#eef6ff', g: 16, jx: 0.05 }); } }
    }
    for (let i = this.parts.length - 1; i >= 0; i--) { const p = this.parts[i]; p.life += dt; if (p.life > p.max) { this.parts[i] = this.parts[this.parts.length - 1]; this.parts.pop(); continue; } p.vy -= p.g * dt; const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 'dust' || p.kind === 'drop' || p.kind === 'snow') { const gy = this.T.h(p.x); if (p.y < gy) { p.y = gy; p.vy *= -0.2; p.vx *= 0.6; } } }
    // geysers and hot pools breathe by themselves
    if (cam) for (const j of this.T.jets) { if (Math.abs(j.x - cam.x) > cam.vw) continue; const on = j.on ? j.on(this.t) : 1, gy = this.T.h(j.x); if (on > 0.05) { this.emit('drop', j.x, gy + 0.3, on > 0.8 ? 5 : 2, { speed: j.v * 0.75 * on, spread: 0.22, life: 0.9, size: 0.13, col: '#eaf7ff', g: 24, drag: 0.5, jx: j.w * 0.5 }); if (Math.random() < 0.5) this.emit('steam', j.x, gy + j.top * 0.5 * on, 1, { speed: 1.5, life: 2.2, size: 0.9, col: '#ffffff', g: -1.5, drag: 0.6, jx: j.w }); } else if (Math.random() < 0.08) this.emit('steam', j.x, gy + 0.2, 1, { speed: 0.8, life: 1.8, size: 0.5, col: '#ffffff', g: -1.2, drag: 0.6 }); }
    if (cam) for (const w of this.T.waters) if (w.hot && Math.random() < 0.3 && w.x1 > cam.x - cam.vw && w.x0 < cam.x + cam.vw) this.emit('steam', lerp(w.x0, w.x1, Math.random()), w.y, 1, { speed: 0.5, life: 3, size: 0.8, col: '#ffffff', g: -0.9, drag: 0.4 });
  }

  // ---- the picture ----
  draw(ctx, cam, actors = {}) {
    const { W, H, time, theme } = this, S = H / cam.vh, t = this.t;
    const sx = (Math.random() - 0.5) * this.shake * 10, sy = (Math.random() - 0.5) * this.shake * 10;
    // The far country is painted smaller than the screen and laid in as one picture: it is soft with distance anyway, and this is most of the cost of a frame.
    const k = this.q >= 3 ? 1 : this.q === 2 ? (W > 2600 ? 0.8 : 1) : this.q === 1 ? 0.7 : 0.5, fw = Math.ceil(W * k), fh = Math.ceil(H * k);
    if (!this.farC || this.farC.width !== fw || this.farC.height !== fh) { this.farC = document.createElement('canvas'); this.farC.width = fw; this.farC.height = fh; this.farX = this.farC.getContext('2d', { alpha: false }); }
    const main = ctx; ctx = this.farX; ctx.setTransform(k, 0, 0, k, 0, 0);
    this._sky(ctx);
    const fall = (this.y0 - cam.y);                 // how far the camera has come down since the start
    for (const L of this.far) L.kind === 'lake' ? this._lake(ctx, L, cam, S) : this._ridge(ctx, L, cam, S, fall);
    if (this._glint.length) this._glints(ctx);
    { const wx = this.wx, mist = Math.min(0.9, (time.mist || 0) + wx.fog * 0.42 + wx.rain * 0.1); if (mist > 0.02) { const g = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.85); g.addColorStop(0, rgba(this.hz, 0)); g.addColorStop(1, rgba(this.hz, mist)); ctx.fillStyle = g; ctx.fillRect(0, H * 0.3, W, H * 0.7);  const m = this.spr.mist, t = this.t; if (m && this.q) { for (let i = 0; i < 6; i++) { const u = ((hash1(i, 61) + this.windX * 0.0009 * (1 + i * 0.3) + t * 0.004 - cam.x * 0.0016 * (1 + i * 0.3)) % 1.4 + 1.4) % 1.4 - 0.2; ctx.globalAlpha = mist * (0.5 + 0.5 * hash1(i, 63)); stamp(ctx, m[i % m.length], u * W, (0.4 + hash1(i, 64) * 0.3) * H, (H / 7) * (0.6 + hash1(i, 65) * 0.6)); } ctx.globalAlpha = 1; } } }      // valley mist over the far country; the ground is drawn after it and stays clear
    { const wx = this.wx, t = this.t;
    if (time.shafts && this.q && time.sun) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const s = time.sun || { x: 0.8, y: 0.1 }; for (let i = 0; i < 6; i++) { const a = 0.9 + i * 0.16 + Math.sin(t * 0.13 + i) * 0.03, len = H * 1.5, wdt = H * (0.03 + 0.03 * hash1(i, 71)), al = time.shafts * (1 - wx.cover) * (0.5 + 0.5 * Math.sin(t * 0.35 + i * 1.7)); const g = ctx.createLinearGradient(s.x * W, s.y * H, s.x * W - Math.cos(a) * len, s.y * H + Math.sin(a) * len); g.addColorStop(0, rgba(time.sun?.glow || '#ffffff', al)); g.addColorStop(1, rgba(time.sun?.glow || '#ffffff', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(s.x * W, s.y * H); ctx.lineTo(s.x * W - Math.cos(a - 0.03) * len - wdt, s.y * H + Math.sin(a - 0.03) * len); ctx.lineTo(s.x * W - Math.cos(a + 0.03) * len + wdt, s.y * H + Math.sin(a + 0.03) * len); ctx.closePath(); ctx.fill(); } ctx.restore(); } }      // shafts of light fall through the air behind the ground, never through the earth
    ctx = main; ctx.setTransform(1, 0, 0, 1, sx, sy); ctx.drawImage(this.farC, 0, 0, W, H);
    if (this.safe) { ctx.fillStyle = rgba(time.dark > 0.3 ? time.shade : '#ffffff', 0.42); ctx.fillRect(0, 0, W, H); }      // high contrast: the far country is pushed back, so that nothing in it can be taken for the ground
    // world space from here: one unit is S pixels, and y is flipped by hand (draw at -y)
    const ox = W / 2 - cam.x * S + sx, oy = H / 2 + cam.y * S + sy;
    ctx.setTransform(S, 0, 0, S, ox, oy);
    const x0 = cam.x - cam.vw / 2 - 2, x1 = cam.x + cam.vw / 2 + 2;
    this._behind(ctx, x0, x1, cam);
    this._water(ctx, x0, x1, false);
    this._ground(ctx, x0, x1, cam);
    if (this.safe) { // high contrast: a bright line along everything that can be stood on
      const T = this.T, tt = this.pt ?? this.t; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; for (const [col, lw] of [['rgba(10,16,28,0.9)', 0.2], ['#ffffff', 0.09]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); let pen = false; for (let x = x0; x <= x1; x += 0.25) { if (this.level.pits.some((p) => x > p.x0 && x < p.x1)) { pen = false; continue; } const y = -T.h(x); pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; }
        for (const p of T.platforms) { const st = p.move ? p.move(tt) : p, a = st.x0 ?? p.x0, b = st.x1 ?? p.x1; if (b < x0 || a > x1) continue; ctx.moveTo(a, -(st.y0 ?? p.y0)); ctx.lineTo(b, -(st.y1 ?? p.y1)); } ctx.stroke(); } }
    if (this.overlay) this.overlay(ctx, x0, x1);
    this._things(ctx, x0, x1, actors);
    this._water(ctx, x0, x1, true);
    this._lives(ctx, x0, x1);
    this._actors(ctx, actors, S);
    for (const r of this.rides || []) { if (r.bx < x0 - 3 || r.bx > x1 + 3) continue; const g = ctx.createLinearGradient(0, -r.by - 0.62, 0, -r.by + 0.1); g.addColorStop(0, '#9a7448'); g.addColorStop(1, '#6a4a30'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(r.bx - 0.75, -r.by - 0.62, 1.5, 0.72, [0, 0, 0.12, 0.12]); ctx.fill(); ctx.fillStyle = '#b8905c'; ctx.fillRect(r.bx - 0.8, -r.by - 0.68, 1.6, 0.1); }      // the near side of a basket, in front of whoever stands in it
    this._parts(ctx, x0, x1);
    this._fore(ctx, cam, S, ox, oy);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this._air(ctx, cam, S);
  }

  _sky(ctx) {
    const { W, H, time, t } = this;
    if (!this.sky) { const c = document.createElement('canvas'), w = (c.width = Math.max(2, Math.round(W / 4))), h = (c.height = Math.max(2, Math.round(H / 4))); const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, h); time.sky.forEach((col, i) => g.addColorStop(time.skyAt ? time.skyAt[i] : i / (time.sky.length - 1), col)); x.fillStyle = g; x.fillRect(0, 0, w, h);
      // washes of colour laid over the gradient, as a painter would: warm round the sun, cool away from it
      for (const ws of time.wash || []) { const gr = x.createRadialGradient(ws.x * w, ws.y * h, 0, ws.x * w, ws.y * h, ws.r * h); gr.addColorStop(0, rgba(ws.col, ws.a)); gr.addColorStop(1, rgba(ws.col, 0)); x.fillStyle = gr; x.fillRect(0, 0, w, h); }
      const r = new RNG('stars');
      if (time.stars > 0.5) { x.save(); x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 260; i++) { const u = r.u(), d = r.n() * 0.07, px = u * w, py = (0.62 - u * 0.5 + d) * h, rr = r.range(2, 9) * h / 225; const gr = x.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, rgba(r.pick(['#8fa8ff', '#c9b4ff', '#9fe0ff']), 0.05)); gr.addColorStop(1, 'rgba(120,150,255,0)'); x.fillStyle = gr; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); } x.restore(); }      // the band of the galaxy
      this.sky = c; this.stars = time.stars ? Array.from({ length: 460 }, (_, i) => ({ x: r.u(), y: r.u() * 0.78, s: i < 14 ? r.range(2, 3) : r.range(0.5, 1.8), p: r.range(0, 6), c: i < 40 ? r.pick(['#ffe2b0', '#b9d2ff', '#ffd0d0']) : '#ffffff' })) : null; }
    const wx = this.wx, cov = wx.cover; ctx.drawImage(this.sky, 0, 0, W, H);
    this.hz = mix(time.haze, mix(time.shade, '#aab6c4', 0.66), cov * 0.72);      // under cloud the haze loses the colour the sun gave it
    if (this.stars) { for (const s of this.stars) { ctx.globalAlpha = (0.45 + 0.4 * Math.sin(t * 1.3 + s.p)) * time.stars * (1 - cov * 0.9); ctx.fillStyle = s.c; ctx.fillRect(s.x * W, s.y * H, s.s * H / 900, s.s * H / 900); } ctx.globalAlpha = 1;
      // a falling star now and then
      if (time.stars > 0.5 && cov < 0.6) { const cyc = 7.5, n = Math.floor(t / cyc), q = (t / cyc) % 1; if (q < 0.1 && hash1(n, 71) > 0.35) { const u = q / 0.1, x0 = (0.15 + hash1(n, 72) * 0.7) * W, y0 = (0.05 + hash1(n, 73) * 0.3) * H, dx = (hash1(n, 74) > 0.5 ? 1 : -1) * H * 0.22, dy = H * 0.1, g = ctx.createLinearGradient(x0 + dx * u, y0 + dy * u, x0 + dx * Math.max(0, u - 0.35), y0 + dy * Math.max(0, u - 0.35)); g.addColorStop(0, `rgba(255,255,255,${0.9 * Math.sin(u * Math.PI)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.strokeStyle = g; ctx.lineWidth = 1.6 * H / 900; ctx.beginPath(); ctx.moveTo(x0 + dx * u, y0 + dy * u); ctx.lineTo(x0 + dx * Math.max(0, u - 0.35), y0 + dy * Math.max(0, u - 0.35)); ctx.stroke(); } } }
    if (time.sun) { const s = time.sun, cx = s.x * W, cy = s.y * H, R = s.r * H; let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 7); g.addColorStop(0, rgba(s.glow, 0.55 * (1 - cov * 0.6))); g.addColorStop(0.3, rgba(s.glow, 0.16 * (1 - cov * 0.6))); g.addColorStop(1, rgba(s.glow, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1 - cov * 0.7; ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      if (s.moon) { ctx.fillStyle = rgba(time.sky[1], 0.22); for (const [mx, my, mr] of [[-0.3, -0.25, 0.3], [0.25, -0.1, 0.24], [-0.05, 0.35, 0.34], [0.42, 0.4, 0.16], [-0.5, 0.2, 0.14]]) { ctx.beginPath(); ctx.arc(cx + mx * R, cy + my * R, mr * R, 0, TAU); ctx.fill(); } ctx.strokeStyle = rgba(s.glow, 0.25); ctx.lineWidth = R * 0.08; ctx.beginPath(); ctx.arc(cx, cy, R * 2.6, 0, TAU); ctx.stroke(); }      // the moon's seas, and the ring that ice in the air puts round it
      ctx.globalAlpha = 1; }
    if (time.aurora && cov < 0.9) this._aurora(ctx, 1 - cov);
    // cloud cover: a grey sheet that thickens from the top of the sky down
    if (cov > 0.02) { const oc = mix(time.haze, time.shade, 0.42), g = ctx.createLinearGradient(0, 0, 0, H * 0.8); g.addColorStop(0, rgba(oc, cov * 0.62)); g.addColorStop(1, rgba(mix(oc, time.haze, 0.6), cov * 0.2)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    // a rainbow stands opposite the sun, so it is only drawn at hours when the sun is behind the viewer (no sun in the picture): red outside, violet inside
    if (time.bow && wx.bow > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const cx = W * 0.62, cy = H * 1.02, R0 = H * 0.78, lw = H * 0.0085, cols = ['#ff5a4a', '#ff9a3a', '#ffe14a', '#6fdc6a', '#4ab4ff', '#5a6cff', '#9a5cff']; ctx.lineWidth = lw * 1.25; cols.forEach((c, i) => { ctx.strokeStyle = rgba(c, 0.2 * wx.bow); ctx.beginPath(); ctx.arc(cx, cy, R0 - i * lw, Math.PI, TAU); ctx.stroke(); }); ctx.restore(); }
    // the highest cloud is thin and fast; the heaped cloud below it is slower
    const ci = this.spr.cirrus; if (ci && this.q) for (let i = 0; i < 5; i++) { const u = (((hash1(i, 13) + this.cloudX * 1.9 * (0.8 + hash1(i, 15) * 0.4)) % 1.5) + 1.5) % 1.5 - 0.25; ctx.globalAlpha = (time.cirrus ?? 0.55) * (0.5 + 0.5 * hash1(i, 17)) * (1 - cov * 0.6); stamp(ctx, ci[i % ci.length], u * W, (0.03 + hash1(i, 19) * 0.2) * H, H / 9 * (0.7 + hash1(i, 21) * 0.8), -0.06); } ctx.globalAlpha = 1;
    const cl = this.spr.cloud; if (cl && time.cloud !== 0) for (let i = 0, n = 5 + Math.round(cov * 11); i < n; i++) { const u = (((hash1(i, 3) + this.cloudX * (0.7 + hash1(i, 5) * 0.8)) % 1.3) + 1.3) % 1.3 - 0.15, y = (0.05 + hash1(i, 7) * 0.36) * H, sc = (0.5 + hash1(i, 9) + cov * 0.5) * H / 620; ctx.globalAlpha = Math.min(1, (time.cloud ?? 0.8) + cov * 0.3) * (0.5 + hash1(i, 11) * 0.5) * (i < 5 ? 1 : Math.min(1, cov * 11 - (i - 5))); stamp(ctx, cl[i % cl.length], u * W, y, sc * 60); } ctx.globalAlpha = 1;
    if (this.theme.sky) this.theme.sky(ctx, this);      // whatever else this country has in its sky
    this._birds(ctx);
  }
  _aurora(ctx, k = 1) {
    const { W, H, t } = this, time = { aurora: this.time.aurora * k }, n = this.q ? 90 : 40, w = W / n; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let band = 0; band < 3; band++) for (let i = 0; i < n; i++) {
      const u = i / n, wave = Math.sin(u * 5 + t * 0.25 + band * 2) * 0.5 + Math.sin(u * 13 - t * 0.4 + band) * 0.25, top = (0.04 + band * 0.08 + wave * 0.07) * H, len = (0.3 + 0.16 * Math.sin(u * 9 + t * 0.6 + band * 1.7)) * H;
      const a = (0.16 + 0.14 * Math.sin(u * 17 + t * 0.9 + band * 3) + 0.08 * Math.sin(u * 61 + t * 2.1)) * time.aurora * (band === 1 ? 1 : 0.7);
      const g = ctx.createLinearGradient(0, top, 0, top + len); g.addColorStop(0, 'rgba(200,110,255,0)'); g.addColorStop(0.16, `rgba(170,110,255,${a * 0.55})`); g.addColorStop(0.42, `rgba(70,255,170,${a})`); g.addColorStop(0.7, `rgba(60,255,190,${a * 0.5})`); g.addColorStop(1, 'rgba(60,255,160,0)'); ctx.fillStyle = g; ctx.fillRect(i * w - w * 0.75, top, w * 2.5, len);
    } ctx.restore();
  }

  // Water lying between two ridges: the sky upside down, and the sun broken into a path of glitter.
  _lake(ctx, L, cam, S) {
    const { W, H, time, t } = this, y = (L.y + (this.drop || 0)) * H, h = L.h * H, cov = this.wx.cover, top = mix(time.sky[time.sky.length - 1], time.water || '#5f8fb8', 0.3 + cov * 0.3), g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, mix(top, this.hz, 0.35)); g.addColorStop(1, mix(time.water || '#5f8fb8', time.shade, 0.15)); ctx.fillStyle = g; ctx.fillRect(0, y, W, h);
    if (time.sun && this.q) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = time.sun.col; const k = H / 900; for (let i = 0; i < 34; i++) { const u = i / 34, w = (5 + hash1(i, 51) * 26) * k * (0.5 + u), gx = time.sun.x * W + (hash1(i, 52) - 0.5) * W * (0.02 + u * 0.09) + Math.sin(t * 0.7 + i) * 3 * k; ctx.globalAlpha = (0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * (2 + hash1(i, 53) * 3) + i * 1.7))) * (1 - cov * 0.85) * (1 - this.wx.rain); ctx.fillRect(gx - w / 2, y + u * h, w, 1.4 * k); } ctx.restore(); }
    const K = H / 900, off = (cam.x * (L.par ?? 0.07) * S) / W;
    for (const th of L.things || []) { const list = this.spr[th.s];
      if (th.kind === 'spout') { const cyc = th.cycle || 31, n = Math.floor(t / cyc), q = ((t / cyc) % 1) * cyc; if (q < 4.2 && this.q) { const x = (((0.15 + hash1(n, 91) * 0.7 - off) % 1) + 1) % 1 * W, yy = y + h * 0.55, e = Math.sin((q / 4.2) * Math.PI), s = H * 0.012; ctx.fillStyle = rgba(time.shade, 0.9); ctx.beginPath(); ctx.ellipse(x, yy + s * (1 - e) * 0.9, s * 2.4, s * 0.8 * e, 0, Math.PI, TAU); ctx.fill();
          if (q > 0.5 && q < 2.4) { const u = (q - 0.5) / 1.9; ctx.strokeStyle = `rgba(255,255,255,${0.75 * Math.sin(u * Math.PI)})`; ctx.lineWidth = 1.6 * K; ctx.lineCap = 'round'; ctx.beginPath(); for (const d of [-1, -0.35, 0.35, 1]) { ctx.moveTo(x - s * 1.2, yy - s * 0.6); ctx.quadraticCurveTo(x - s * 1.2 + d * s * 0.5, yy - s * (2.2 + u), x - s * 1.2 + d * s * (1 + u), yy - s * (1.6 + u * 0.4)); } ctx.stroke(); } }
        continue; }
      if (!list) continue;
      for (let i = 0; i < th.n; i++) { const u = ((((hash1(i, th.seed) + (th.speed || 0) * t * (0.6 + 0.8 * hash1(i, th.seed + 4)) - off) % 1.3) + 1.3) % 1.3) - 0.15, x = u * W, yy = y + h * ((th.at ?? 0.25) + (th.span ?? 0.5) * hash1(i, th.seed + 1)), sc = th.size * H * (0.6 + 0.8 * hash1(i, th.seed + 2)), bob = th.speed != null ? Math.sin(t * 0.8 + i * 2) * 1.2 * K : 0, sp = list[i % list.length], tilt = th.speed != null ? Math.sin(t * 0.6 + i) * 0.03 : 0;
        ctx.save(); ctx.globalAlpha = 0.3; ctx.translate(x, yy + bob); ctx.scale(1, -0.55); stamp(ctx, sp, 0, 0, sc, tilt, i % 2 === 0); ctx.restore(); stamp(ctx, sp, x, yy + bob, sc, tilt, i % 2 === 0); } }
    if (this.wx.rain > 0.1) { ctx.fillStyle = rgba(this.hz, this.wx.rain * 0.35); ctx.fillRect(0, y, W, h); }
  }
  // Birds a long way off, crossing in a loose line.
  _birds(ctx) {
    const { W, H, t, time } = this; if (!this.q || time.stars > 0.5 || this.wx.rain > 0.5) return; const cyc = 46, n0 = Math.floor(t / cyc), ph = (t / cyc) % 1, dir = hash1(n0, 21) > 0.5 ? 1 : -1, n = 5 + Math.floor(hash1(n0, 22) * 5), k = H / 900;
    const bx = (dir > 0 ? ph * 1.5 - 0.25 : 1.25 - ph * 1.5) * W, by = (0.24 + hash1(n0, 23) * 0.2) * H; ctx.strokeStyle = rgba(time.shade, 0.75); ctx.lineWidth = 1.5 * k; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i < n; i++) { const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, x = bx - dir * row * 19 * k + Math.sin(t * 0.5 + i) * 4 * k, y = by + side * row * 9 * k + Math.sin(t * 0.8 + i * 2) * 3 * k, f = Math.sin(t * 6.5 + i * 1.3), s = (5.5 + hash1(i, 24) * 2) * k;
      ctx.moveTo(x - s, y - f * s * 0.55); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.25 - f * s * 0.2, x, y); ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.25 - f * s * 0.2, x + s, y - f * s * 0.55); }
    ctx.stroke();
  }

  // A far ridge: a skyline from noise, filled and hazed, with whatever stands along it.
  _ridge(ctx, L, cam, S, fall) {
    const { W, H, time, t } = this, wx = this.wx, hz0 = L.haze ?? 0, hz = this.hz || time.haze, col = mix(L.col, hz, Math.min(1, hz0 + (wx.fog * 0.34 + wx.rain * 0.3 + wx.cover * 0.08) * (1 - hz0))), fn = RIDGE[L.style || 'jag'];
    const px = L.scale * H, camU = (cam.x * L.par * S) / px, base = (L.base + (this.drop || 0) * (1 - L.par) + fall * L.par * 0.0035 * (L.rise ?? 1)) * H, amp = L.amp * H, step = this.q ? 5 : 9;
    const yAt = (sxp) => base - amp * fn((sxp - W / 2) / px + camU, L.seed);
    ctx.beginPath(); ctx.moveTo(-2, H + 2); for (let x = -2; x <= W + step; x += step) ctx.lineTo(x, yAt(x)); ctx.lineTo(W + 2, H + 2); ctx.closePath();
    // each ridge stands in the mist of the valley in front of it: dark at the crest, paling toward its foot
    const g = ctx.createLinearGradient(0, base - amp, 0, base + H * 0.14); g.addColorStop(0, lighten(col, L.lit ?? 0.08)); g.addColorStop(0.45, col); g.addColorStop(1, mix(col, lighten(hz, 0.08), L.foot ?? (L.par < 0.15 ? 0.8 : 0.5))); ctx.fillStyle = g; ctx.fill();
    if (this.q) { ctx.strokeStyle = rgba(time.rim || '#ffffff', (L.rimA ?? 0.3) * (1 - wx.cover * 0.7)); ctx.lineWidth = H * 0.0017; ctx.lineJoin = 'round'; ctx.stroke(); }      // the light catching the crest
    if (this.q && L.facet !== 0) { // the side of each slope turned away from the sun is a shade darker
      const d = (time.sun && time.sun.x < 0.5 ? 1 : -1) * H * 0.012 * (L.facet ?? 1); ctx.save(); ctx.clip(); ctx.beginPath(); ctx.moveTo(-2, H + 2); for (let x = -2; x <= W + step; x += step) ctx.lineTo(x, yAt(x + d) + H * 0.004); ctx.lineTo(W + 2, H + 2); ctx.closePath(); ctx.fillStyle = rgba(time.shade, 0.2); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-2, H + 2); for (let x = -2; x <= W + step; x += step) ctx.lineTo(x, yAt(x)); ctx.lineTo(W + 2, H + 2); ctx.closePath(); }
    if (this.q && (L.spurs ?? SPUR[L.style || 'jag'])) { // every peak throws a spur toward the viewer, and the face on the far side of it from the sun stands in shade
      const ks = L.spurs ?? SPUR[L.style || 'jag'], du = (W / 420) / px, sd = time.sun && time.sun.x < 0.5 ? 1 : -1, i0 = Math.floor((-W / 2 / px + camU) / du) - 40, i1 = Math.ceil((W / 2 / px + camU) / du) + 40, f = [];
      for (let i = i0; i <= i1; i++) f.push(fn(i * du, L.seed)); const X = (i) => ((i0 + i) * du - camU) * px + W / 2, Y = (i) => base - amp * f[i], lit = 1 - wx.cover * 0.7;
      ctx.save(); ctx.clip();
      for (let i = 4; i < f.length - 4; i++) { if (!(f[i] > f[i - 1] && f[i] >= f[i + 1] && f[i] > f[i - 4] && f[i] > f[i + 4]) || f[i] < 0.2) continue;
        let v = i; while (v + sd > 0 && v + sd < f.length - 1 && f[v + sd] <= f[v] + 1e-4 && Math.abs(v - i) < 70) v += sd; if (Math.abs(v - i) < 3) continue;
        const a = i0 + i, xp = X(i), yp = Y(i), xv = X(v), hgt = amp * f[i] * (0.7 + 0.5 * hash1(a, L.seed + 70)), xs = xp + (xv - xp) * (0.22 + 0.3 * hash1(a, L.seed + 71)), yf = yp + hgt;
        const g2 = ctx.createLinearGradient(0, yp, 0, yf); g2.addColorStop(0, rgba(time.shade, 0.3 * ks)); g2.addColorStop(0.6, rgba(time.shade, 0.16 * ks)); g2.addColorStop(1, rgba(time.shade, 0)); ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(xp, yp - 1); for (let j = i; j !== v + sd; j += sd) ctx.lineTo(X(j), Y(j) - 1); ctx.lineTo(xv, yf); ctx.lineTo(xs, yf); ctx.closePath(); ctx.fill();
        // a second, smaller fold lower on the same face
        const xm = xp + (xv - xp) * 0.55, ym = Y(Math.round(i + (v - i) * 0.55)); ctx.fillStyle = rgba(time.shade, 0.1 * ks); ctx.beginPath(); ctx.moveTo(xm, ym); ctx.lineTo(xv, Y(v)); ctx.lineTo(xv, yf); ctx.lineTo(xm + (xv - xm) * 0.3, ym + hgt * 0.7); ctx.closePath(); ctx.fill();
        // and the lit edge of the spur itself
        const g3 = ctx.createLinearGradient(0, yp, 0, yf); g3.addColorStop(0, rgba(time.rim || '#ffffff', 0.3 * ks * lit)); g3.addColorStop(1, rgba(time.rim || '#ffffff', 0)); ctx.fillStyle = g3; ctx.beginPath(); ctx.moveTo(xp, yp); ctx.lineTo(xs, yf); ctx.lineTo(xs - sd * hgt * 0.14, yf); ctx.closePath(); ctx.fill(); }
      ctx.restore(); ctx.beginPath(); ctx.moveTo(-2, H + 2); for (let x = -2; x <= W + step; x += step) ctx.lineTo(x, yAt(x)); ctx.lineTo(W + 2, H + 2); ctx.closePath(); }
    if (this.q >= 2 && L.grain !== 0) { // brushwork over the flat of the paint, coarser on the nearer ridges
      if (!this.farPat) { const s = Q.k >= 2 ? 2 : 1; this.farPat = ctx.createPattern(tile('rock', 7, s), 'repeat'); this.farPatS = s; }
      const z = (H / 1080) * (0.9 + L.par * 5) / this.farPatS; this.farPat.setTransform(new DOMMatrix().translate(-camU * px, 0).scale(z)); ctx.save(); ctx.clip(); ctx.globalAlpha = (L.grain ?? 0.5) * (1 - Math.min(0.7, hz0)); ctx.fillStyle = this.farPat; ctx.fillRect(0, base - amp - 4, W, H - (base - amp) + 8); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-2, H + 2); for (let x = -2; x <= W + step; x += step) ctx.lineTo(x, yAt(x)); ctx.lineTo(W + 2, H + 2); ctx.closePath(); }
    if (this.q && L.ribs) { // gullies running down from the crest, which is what makes a far mountain look like rock and not like paper
      ctx.save(); ctx.clip(); const gap = H * 0.011 * (L.ribGap ?? 1), lean = (time.sun && time.sun.x < 0.5 ? 1 : -1) * 0.16; ctx.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) { ctx.strokeStyle = pass ? rgba(lighten(col, 0.25), L.ribs * 0.5) : rgba(time.shade, L.ribs); ctx.lineWidth = H * (pass ? 0.0012 : 0.0022); ctx.beginPath();
        for (let k = Math.floor((-W / 2 / px + camU) * px / gap) - 1, k1 = Math.ceil((W / 2 / px + camU) * px / gap) + 1; k <= k1; k++) { if (hash1(k, L.seed + 60 + pass) > 0.62) continue; const sxp = (k * gap / px - camU) * px + W / 2 + (pass ? gap * 0.4 : 0), y = yAt(sxp), len = amp * (0.12 + 0.5 * hash1(k, L.seed + 61)), wob = (hash1(k, L.seed + 62) - 0.5) * gap * 2; ctx.moveTo(sxp, y + H * 0.004); ctx.quadraticCurveTo(sxp + len * lean * 0.3 + wob, y + len * 0.5, sxp + len * lean + wob * 1.6, y + len); }
        ctx.stroke(); }
      ctx.restore(); ctx.beginPath(); ctx.moveTo(-2, H + 2); for (let x = -2; x <= W + step; x += step) ctx.lineTo(x, yAt(x)); ctx.lineTo(W + 2, H + 2); ctx.closePath(); }
    if ((L.snow || L.bands) && this.q) { ctx.save(); ctx.clip();
      if (L.snow) { ctx.fillStyle = mix(time.snow || '#ffffff', time.haze, (L.haze ?? 0) * 0.7); ctx.beginPath(); ctx.moveTo(-2, 0); for (let x = -2; x <= W + step * 2; x += step * 2) { const y = yAt(x), u = (x - W / 2) / px + camU; ctx.lineTo(x, y + amp * L.snow * (0.25 + 1.3 * noise1(u * 7, L.seed + 3) * noise1(u * 23, L.seed + 4))); } ctx.lineTo(W + 2, 0); ctx.closePath(); ctx.globalAlpha = L.snowA ?? 0.9; ctx.fill(); ctx.globalAlpha = 1; }
      if (L.bands) for (const b of L.bands) { if (b.glint) this._glint.push([b, L, px, camU, amp, yAt]); ctx.fillStyle = rgba(mix(b.col, time.haze, (L.haze ?? 0) * 0.8), b.a ?? 0.5); ctx.beginPath(); for (let x = -2; x <= W + step * 2; x += step * 2) { const u = (x - W / 2) / px + camU; ctx.lineTo(x, yAt(x) + amp * (b.at + (noise1(u * (b.f || 3), L.seed + b.s) - 0.5) * b.w)); } for (let x = W + step * 2; x >= -2; x -= step * 2) { const u = (x - W / 2) / px + camU; ctx.lineTo(x, yAt(x) + amp * (b.at + b.th + (noise1(u * (b.f || 3), L.seed + b.s + 1) - 0.5) * b.w)); } ctx.closePath(); ctx.fill(); }
      ctx.restore(); }
    // what stands on the ridge
    for (const st of L.stamps || []) { const list = this.spr[st.s]; if (!list && !['fall', 'erupt', 'flock'].includes(st.kind)) continue; const cw = st.every, u0 = -W / 2 / px + camU, k0 = Math.floor(u0 / cw) - 1, k1 = Math.ceil((W / 2 / px + camU) / cw) + 1;
      for (let k = k0; k <= k1; k++) { if (hash1(k, L.seed + st.seed) > st.p) continue; const u = (k + hash1(k, L.seed + st.seed + 1)) * cw, x = (u - camU) * px + W / 2, dr = st.drop ? st.drop[0] + (st.drop[1] - st.drop[0]) * hash1(k, L.seed + st.seed + 5) : 0, y = yAt(x) + (st.sink ?? 0.004) * H + dr * amp, sc = st.size * H * (0.7 + 0.6 * hash1(k, L.seed + st.seed + 2)) * (1 + dr * 0.5);
        ctx.globalAlpha = st.a ?? 1; const sp = list ? list[Math.floor(hash1(k, st.seed + 3) * list.length)] : null;
        this._stamp(ctx, st, sp, x, y, sc, k, col); } ctx.globalAlpha = 1; }
    if (L.fog) { const fg = ctx.createLinearGradient(0, base - amp * 0.2, 0, base + amp * 0.6); fg.addColorStop(0, rgba(time.haze, 0)); fg.addColorStop(1, rgba(time.haze, L.fog)); ctx.fillStyle = fg; ctx.fillRect(0, base - amp * 0.2, W, H); }
  }
  // One thing standing in the far country. Most are a sprite set down once; the kinds below move.
  _stamp(ctx, st, sp, x, y, sc, k, col) {
    const { H, t, time } = this, wx = this.wx, K = H / 900, a0 = st.a ?? 1, night = (time.stars || 0) > 0.3 || time.dark > 0.25, flip = hash1(k, 8) > 0.5, cl = this.spr.cloudlet;
    const lamp = () => { if (st.glow && night) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.65 + 0.2 * Math.sin(t * 3 + k); stamp(ctx, this.fx.warm, x, y - sc * 0.28, sc * st.glow); ctx.restore(); } };
    switch (st.kind) {
      case 'fall': this._fall(ctx, x, y, st, k, H, col); return;
      case 'steam': { const ph = (t * 0.07 + hash1(k, 4)) % 1; ctx.globalAlpha = (st.a ?? 0.6) * Math.sin(ph * Math.PI); stamp(ctx, sp, x + Math.sin(ph * 5) * 6 + wx.wind * K * 10 * ph, y - ph * st.size * H * 2.2, sc * (0.6 + ph * 0.9)); ctx.globalAlpha = 1; return; }
      case 'geyser': { // a far geyser goes off every so often and its steam drifts away downwind
        const T = st.cycle || 12, ph = (t / T + hash1(k, 4)) % 1; if (sp) stamp(ctx, sp, x, y, sc);
        if (ph < 0.3) { const e = Math.sin((ph / 0.3) * Math.PI), hh = sc * 3.4 * e, w = sc * 0.2, g = ctx.createLinearGradient(0, y, 0, y - hh); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 0.4 + wx.wind * K * 2, y - hh * 0.6, x + wx.wind * K * 6 * e, y - hh); ctx.quadraticCurveTo(x + w * 0.4 + wx.wind * K * 2, y - hh * 0.6, x + w, y); ctx.fill(); }
        if (cl) for (let i = 0; i < 3; i++) { const q = (ph + i * 0.13) % 1; if (q > 0.62) continue; ctx.globalAlpha = a0 * 0.6 * Math.sin((q / 0.62) * Math.PI); stamp(ctx, cl[i % cl.length], x + wx.wind * K * 30 * q + i * 3 * K, y - sc * (1.2 + q * 3), sc * (1 + q * 2)); } ctx.globalAlpha = 1; return; }
      case 'smoke': { stamp(ctx, sp, x, y, sc, 0, flip); if (cl) for (let i = 0; i < 4; i++) { const q = (t * 0.1 + i / 4 + hash1(k, 4)) % 1; ctx.globalAlpha = 0.42 * (1 - q); stamp(ctx, cl[i % cl.length], x + (st.cx ?? 0.22) * sc * (flip ? -1 : 1) + wx.wind * K * 16 * q * q + Math.sin(q * 6 + k) * 2 * K, y - sc * (0.9 + q * 1.5), sc * (0.14 + q * 0.42)); } ctx.globalAlpha = 1; lamp(); return; }
      case 'graze': { const ph = t * (st.speed || 0.05) + hash1(k, 4) * 20, dx = Math.sin(ph) * sc * (st.roam || 1.6); stamp(ctx, sp, x + dx, y, sc, 0, Math.cos(ph) < 0); return; }
      case 'flock': { if (sp) stamp(ctx, sp, x, y, sc, 0, flip); const n = st.n || 6; ctx.strokeStyle = rgba(time.shade, 0.8); ctx.lineWidth = 1.2 * K; ctx.lineCap = 'round'; ctx.beginPath();
        for (let i = 0; i < n; i++) { const a = t * (0.5 + hash1(k * 7 + i, 5) * 0.5) + i * 2.1 + k, bx = x + Math.cos(a) * sc * (1.4 + hash1(i, 6) * 2.2), by = y - sc * 1.3 + Math.sin(a * 1.3) * sc * (0.4 + hash1(i, 7)), f = Math.sin(t * 9 + i * 2), w = 3.2 * K * (0.7 + 0.5 * hash1(i, 9)); ctx.moveTo(bx - w, by - f * w * 0.6); ctx.quadraticCurveTo(bx - w * 0.4, by - w * 0.3, bx, by); ctx.quadraticCurveTo(bx + w * 0.4, by - w * 0.3, bx + w, by - f * w * 0.6); }
        ctx.stroke(); return; }
      case 'beam': { stamp(ctx, sp, x, y, sc); if (night) { const a = t * 0.9 + k, c = Math.cos(a), top = y - sc * 0.9, len = (sc * 8 * Math.abs(c) + sc) * Math.sign(c); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x, top, x + len, top); g.addColorStop(0, 'rgba(255,240,190,0.55)'); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + len, top - sc * 0.55); ctx.lineTo(x + len, top + sc * 0.55); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(a)); stamp(ctx, this.fx.warm, x, top, sc * 1.1); ctx.restore(); } return; }
      case 'erupt': { // a fissure far off: by day a plume, and when the light goes the fire shows
        const lit = clamp(time.dark * 2.4 + (time.stars || 0), 0, 1); ctx.save();
        if (lit > 0.05) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = lit * (0.75 + 0.25 * Math.sin(t * 5 + k)); const g = ctx.createRadialGradient(x, y, 0, x, y, sc * 2.6); g.addColorStop(0, 'rgba(255,180,70,0.95)'); g.addColorStop(0.3, 'rgba(255,80,30,0.45)'); g.addColorStop(1, 'rgba(255,40,20,0)'); ctx.fillStyle = g; ctx.fillRect(x - sc * 3, y - sc * 3, sc * 6, sc * 4.4);
          ctx.fillStyle = '#ffd27a'; for (let i = 0; i < 16; i++) { const q = (t * (0.5 + hash1(i, 3) * 0.4) + hash1(i, 4)) % 1, vx = (hash1(i, 5) - 0.5) * sc * 1.3, hh = sc * (0.8 + hash1(i, 6) * 1.2); ctx.globalAlpha = lit * (1 - q); ctx.fillRect(x + vx * q, y - hh * 4 * q * (1 - q), 1.7 * K, 1.7 * K); } }
        ctx.restore(); if (cl) for (let i = 0; i < 5; i++) { const q = (t * 0.03 + i / 5) % 1; ctx.globalAlpha = (0.5 - 0.28 * lit) * Math.sin(q * Math.PI); stamp(ctx, cl[i % cl.length], x + wx.wind * K * 32 * q, y - sc * (0.6 + q * 4.6), sc * (0.8 + q * 2.5)); } ctx.globalAlpha = 1; return; }
      default: ctx.globalAlpha = a0; stamp(ctx, sp, x, y, sc, 0, flip); ctx.globalAlpha = 1; lamp();
    }
  }
  // light dancing on a river or a tarn far off
  _glints(ctx) {
    const { W, H, t } = this, K = H / 900, cov = this.wx.cover; ctx.fillStyle = '#ffffff';
    for (const [b, L, px, camU, amp, yAt] of this._glint) for (let i = 0; i < (b.glint | 0); i++) { const u = Math.floor((camU - W / 2 / px) * 40 + i * 1.7) / 40 + hash1(i, 55) * 0.02, x = (u - camU) * px + W / 2 + i * (W / (b.glint | 0)) * 0.97 % W; const xx = ((x % W) + W) % W, uu = (xx - W / 2) / px + camU, y = yAt(xx) + amp * (b.at + b.th * (0.25 + 0.5 * hash1(i, 56)) + (noise1(uu * (b.f || 3), L.seed + b.s) - 0.5) * b.w); ctx.globalAlpha = Math.max(0, Math.sin(t * (2 + hash1(i, 57) * 3) + i * 1.9)) * 0.8 * (1 - cov * 0.7); ctx.fillRect(xx, y, (2 + hash1(i, 58) * 5) * K, 1.2 * K); }
    ctx.globalAlpha = 1; this._glint.length = 0;
  }
  // a waterfall on a far hillside: a white thread with light running down it and a breath of mist at the foot
  _fall(ctx, x, y, st, k, H, col) {
    const len = st.len * H * (0.7 + 0.9 * hash1(k, 21)), w = H * 0.006 * (0.7 + hash1(k, 22)), t = this.t; y += H * 0.012;
    const g = ctx.createLinearGradient(0, y, 0, y + len); const wc = this.time.snow || '#ffffff'; g.addColorStop(0, rgba(wc, 0.9)); g.addColorStop(0.8, rgba(wc, 0.65)); g.addColorStop(1, rgba(wc, 0)); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - w * 0.4, y); ctx.lineTo(x + w * 0.4, y); ctx.lineTo(x + w * 1.1, y + len); ctx.lineTo(x - w * 1.1, y + len); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba(wc, 0.8); for (let i = 0; i < 4; i++) { const ph = ((t * 0.7 + i / 4 + hash1(k, i)) % 1); ctx.fillRect(x - w * 0.3 + (i % 2) * w * 0.3, y + ph * len * 0.9, w * 0.35, len * 0.08); }
    const m = this.spr.cloudlet; if (m) { ctx.globalAlpha = 0.8; stamp(ctx, m[k & 1], x, y + len + H * 0.012, H * 0.022); ctx.globalAlpha = 1; }
  }

  // things standing just behind the ground: tall rocks, columns, trees
  _behind(ctx, x0, x1, cam) {
    const B = this.theme.behind; if (!B) return;
    for (const st of B) { const list = this.spr[st.s]; if (!list) continue; const cw = st.every;
      for (let k = Math.floor(x0 / cw) - 2; k <= Math.ceil(x1 / cw) + 1; k++) { if (hash1(k, st.seed) > st.p) continue; const x = (k + hash1(k, st.seed + 1)) * cw; if (st.zone && !st.zone.includes(this.zoneAt(x))) continue; if (this.level.pits.some((p) => x > p.x0 - 1 && x < p.x1 + 1)) continue;
        const sc = st.size * (0.7 + 0.6 * hash1(k, st.seed + 2)), t = this.t, ph = t * (st.speed || 0.06) + hash1(k, 4) * 20, gx = st.roam ? x + Math.sin(ph) * st.roam : x, y = this.T.h(gx) - (st.sink ?? 0.5), fl = st.roam ? Math.cos(ph) < 0 : hash1(k, 9) > 0.5;
        const fr = st.frames ? this.spr[st.frames[Math.floor(t * (st.fps || 1) + hash1(k, 5) * 9) % st.frames.length]] || list : list; ctx.globalAlpha = st.a ?? 1; stamp(ctx, fr[Math.floor(hash1(k, st.seed + 3) * list.length) % fr.length], gx, -y, sc, st.roam ? -Math.atan(this.T.dh(gx)) * 0.6 : 0, fl);
        if (st.glow && ((this.time.stars || 0) > 0.3 || this.time.dark > 0.25)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.2 * Math.sin(t * 3 + k); stamp(ctx, this.fx.warm, gx, -y - sc * 0.35, sc * st.glow); ctx.restore(); }
        if (st.emit && this.q && Math.random() < 0.05) this.emit('steam', gx + (st.ex || 0) * sc * (fl ? -1 : 1), y + (st.ey ?? 1) * sc, 1, { speed: 0.5, life: 2.4, size: 0.35, col: '#ffffff', g: -0.8, drag: 0.4, vx: this.wx.wind * 0.25 }); } }
    ctx.globalAlpha = 1;
  }

  _ground(ctx, x0, x1, cam) {
    const T = this.T, G = this.G, time = this.time, dx = 0.25, bottom = -(cam.y - cam.vh / 2 - 2);
    const xs = []; for (let x = Math.floor(x0 / dx) * dx; x <= x1 + dx; x += dx) xs.push(x);
    const ys = xs.map((x) => -T.h(x));
    const surface = () => { ctx.beginPath(); ctx.moveTo(xs[0], ys[0]); for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]); };
    surface(); ctx.lineTo(xs[xs.length - 1], bottom); ctx.lineTo(xs[0], bottom); ctx.closePath();
    const top = -(cam.y + cam.vh / 2), g = ctx.createLinearGradient(0, top, 0, bottom); const body = G.body; body.forEach((c, i) => g.addColorStop(i / (body.length - 1), c)); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    // layers in the rock: copies of the skyline, sunk and softened
    if (this.q) for (const s of G.strata || []) { ctx.strokeStyle = rgba(s.col, s.a); ctx.lineWidth = s.w; ctx.beginPath(); for (let i = 0; i < xs.length; i += 2) { const y = ys[i] * s.follow + (1 - s.follow) * ys[0] + s.d + (noise1(xs[i] * s.f, s.seed) - 0.5) * s.wob; i ? ctx.lineTo(xs[i], y) : ctx.moveTo(xs[i], y); } ctx.stroke(); }
    // columns in the rock: where lava cooled slowly it cracked into upright pillars, and their joints show in every cut bank
    if (this.q && G.joints) { const cwj = G.joints.every; ctx.lineCap = 'round'; for (let k = Math.floor(x0 / cwj); k <= Math.ceil(x1 / cwj); k++) { const x = (k + 0.5 * hash1(k, 41)) * cwj, z = this.zoneAt(x); if (!G.joints.zones.includes(z)) continue; const top = -T.h(x) + G.joints.top, len = G.joints.len * (0.35 + hash1(k, 42)); ctx.strokeStyle = rgba(hash1(k, 43) > 0.25 ? G.joints.dark : G.joints.light, G.joints.a * (hash1(k, 43) > 0.25 ? 1 : 0.35) * (0.5 + 0.5 * hash1(k, 44))); ctx.lineWidth = 0.035 + 0.03 * hash1(k, 45); ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + (hash1(k, 46) - 0.5) * 0.1, top + len); ctx.stroke(); if (hash1(k, 47) > 0.6) { ctx.beginPath(); ctx.moveTo(x, top + len * 0.5); ctx.lineTo(x + cwj * 0.9, top + len * (0.45 + 0.1 * hash1(k, 48))); ctx.stroke(); } } }
    // stones in the earth
    const em = this.spr[G.embed?.s]; if (em && this.q) { const cw = G.embed.every; for (let k = Math.floor(x0 / cw); k <= Math.ceil(x1 / cw); k++) for (let j = 0; j < 3; j++) { if (hash1(k * 7 + j, 31) > G.embed.p) continue; const x = (k + hash1(k * 7 + j, 32)) * cw, d = 0.7 + hash1(k * 7 + j, 33) * 6; ctx.globalAlpha = G.embed.a ?? 0.5; stamp(ctx, em[(((k * 3 + j) % em.length) + em.length) % em.length], x, -T.h(x) + d, 0.5 + hash1(k + j, 34) * 0.9, hash1(k, 35) * 6); } ctx.globalAlpha = 1; }
    // brushwork over the body of the ground
    ctx.globalAlpha = 0.55; ctx.fillStyle = this._pat(ctx, 'rock'); ctx.fillRect(xs[0], top, xs[xs.length - 1] - xs[0], bottom - top); ctx.globalAlpha = 1;
    // The skin of the ground: layers that follow the surface, each a little uneven below, in the colours of whatever lies there.
    // Where one kind of ground meets the next, the new one comes in as a wedge over the old.
    const zs = []; let i0 = 0; while (i0 < xs.length - 1) { const z = this.zoneAt(xs[i0] + dx / 2); let i1 = i0 + 1; while (i1 < xs.length - 1 && this.zoneAt(xs[i1] + dx / 2) === z) i1++; zs.push([z, i0, i1]); i0 = i1; }
    for (let zi = 0; zi < zs.length; zi++) { const [z, a0, a1] = zs[zi], sk = G.skin[z] || G.skin[this.theme.zone] || G.skin.rock || Object.values(G.skin)[0], xa = xs[a0], xb = xs[a1], e1 = Math.min(xs.length - 1, a1 + (zi < zs.length - 1 ? 6 : 0));
      // the true start of this stretch may lie off the left of the picture: then there is no wedge to draw
      const fresh = zi > 0;
      for (let bi = 0; bi < sk.bands.length; bi++) { const bd = sk.bands[bi];
        ctx.beginPath(); ctx.moveTo(xs[a0], ys[a0]); for (let i = a0 + 1; i <= e1; i++) ctx.lineTo(xs[i], ys[i]);
        for (let i = e1; i >= a0; i--) { const x = xs[i], ramp = fresh ? smooth(clamp((x - xa) / 1.6, 0, 1)) : 1, th = bd.w * (0.78 + 0.5 * noise1(x * (1.1 + bi * 0.7), 7 + bi * 5)) * ramp; ctx.lineTo(x, ys[i] + th); }
        ctx.closePath(); ctx.fillStyle = bd.col; ctx.globalAlpha = bd.a ?? 1; ctx.fill();
        if (bi > 0 && this.q) { ctx.fillStyle = this._pat(ctx, TILE_OF[z] || 'sand'); ctx.globalAlpha = bi === sk.bands.length - 1 ? 0.9 : 0.6; ctx.fill(); } }
      ctx.globalAlpha = 1; }
    ctx.restore();
    // a line of light along the top edge
    surface(); ctx.strokeStyle = rgba(time.rim || '#ffffff', 0.35); ctx.lineWidth = 0.035; ctx.stroke();
    if (this.wx.wetness > 0.05) { surface(); ctx.strokeStyle = rgba(time.sky[time.sky.length - 1], 0.3 * this.wx.wetness); ctx.lineWidth = 0.11; ctx.stroke(); }   // wet ground shines with the sky
    // what grows and lies on it
    const cw = 0.5;
    for (let k = Math.floor(x0 / cw); k <= Math.ceil(x1 / cw); k++) {
      const xm = (k + 0.5) * cw, z = this.zoneAt(xm), set = G.decor[z]; if (!set) continue;
      if (this.level.pits.some((p) => xm > p.x0 - 0.3 && xm < p.x1 + 0.3)) continue;
      for (let j = 0; j < set.length; j++) { const d = set[j]; if (hash1(k, 100 + j * 13) > d.p) continue; const list = this.spr[d.s]; if (!list) continue;
        const x = (k + hash1(k, 101 + j * 13)) * cw, s = T.dh(x); if (Math.abs(s) > (d.steep ?? 1.2)) continue; if (T.waterAt(x) && T.h(x) < T.waterAt(x).y) continue;
        const sc = d.size * (0.65 + 0.7 * hash1(k, 102 + j * 13)), wv = this.wx.wind, sway = d.sway ? (wv * 0.07 + Math.sin(this.t * (1.2 + hash1(k, 5)) + k) * (0.5 + Math.abs(wv) * 0.3) + Math.sin(x * 0.4 - this.t * 2.4 * Math.sign(wv || 1)) * this.wx.gust * 0.9) * d.sway : 0;
        stamp(ctx, list[Math.floor(hash1(k, 103 + j * 13) * list.length)], x, -T.h(x) + (d.sink ?? 0.04), sc, -Math.atan(s) * (d.tilt ?? 0.5) + sway, hash1(k, 104 + j) > 0.5); }
    }
  }

  _water(ctx, x0, x1, front) {
    for (const w of this.T.waters) { if (w.x1 < x0 || w.x0 > x1) continue; const t = this.t, a = Math.max(w.x0, x0 - 1), b = Math.min(w.x1, x1 + 1), col = w.hot ? this.time.hot || '#6fd0d8' : this.time.water || '#4a8fc0';
      const top = (x) => -w.y - Math.sin(x * 1.7 + t * 1.6) * 0.035 - Math.sin(x * 0.6 - t * 0.9) * 0.03;
      ctx.beginPath(); ctx.moveTo(a, top(a)); for (let x = a; x <= b; x += 0.3) ctx.lineTo(x, top(x)); ctx.lineTo(b, top(b)); ctx.lineTo(b, -w.y + 12); ctx.lineTo(a, -w.y + 12); ctx.closePath();
      if (!front) { const g = ctx.createLinearGradient(0, -w.y, 0, -w.y + 5); g.addColorStop(0, lighten(col, 0.25)); g.addColorStop(0.25, col); g.addColorStop(1, darken(col, 0.45)); ctx.fillStyle = g; ctx.fill(); }
      else { // the veil of water in front of whatever is in it: only down to the bed, never over the cut earth
        ctx.beginPath(); ctx.moveTo(a, top(a)); for (let x = a; x <= b; x += 0.3) ctx.lineTo(x, top(x)); ctx.lineTo(b, top(b)); for (let x = b; x >= a; x -= 0.3) ctx.lineTo(x, Math.max(top(x), -this.T.h(x))); ctx.closePath();
        ctx.save(); ctx.clip(); ctx.fillStyle = rgba(col, 0.38); ctx.fillRect(a, -w.y - 0.2, b - a, 12); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.04; for (let x = Math.floor(a); x < b; x += 1.7) { const ph = Math.sin(t * 1.3 + x * 2.1); ctx.globalAlpha = 0.25 + 0.3 * ph * ph; ctx.beginPath(); ctx.moveTo(x, top(x) + 0.12 + 0.05 * ph); ctx.lineTo(x + 0.6 + 0.3 * ph, top(x + 0.6) + 0.12 + 0.05 * ph); ctx.stroke(); } ctx.restore(); ctx.globalAlpha = 1;
        ctx.beginPath(); let pen = false; for (let x = a; x <= b; x += 0.3) { if (-this.T.h(x) > top(x)) { pen ? ctx.lineTo(x, top(x)) : ctx.moveTo(x, top(x)); pen = true; } else pen = false; } ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.05; ctx.stroke(); } }      // the bright line of the surface, only where there is water under it
  }

  // ledges, geysers, seeds, the goal, the animals
  _things(ctx, x0, x1, A) {
    const T = this.T, t = this.pt ?? this.t, th = this.theme;
    for (const p of T.platforms) { const st = p.move ? p.move(t) : p, y0 = st.y0 ?? p.y0, y1 = st.y1 ?? p.y1, px0 = st.x0 ?? p.x0, px1 = st.x1 ?? p.x1; if (px1 < x0 - 4 || px0 > x1 + 4) continue; const w = p.x1 - p.x0, key = Math.round(w * 4) + ':' + (p.kind || 'slab'); let s = this.slabs.get(key); if (!s) { s = th.slab(w, p.kind || 'slab', this.time); this.slabs.set(key, s); }
      stamp(ctx, s, (px0 + px1) / 2, -(y0 + y1) / 2, 1, -Math.atan2(y1 - y0, w), p.dir ? p.dir(t) < 0 : false); }
    for (const j of T.jets) { if (j.x < x0 - 3 || j.x > x1 + 3) continue; const on = j.on ? j.on(t) : 1, gy = T.h(j.x); if (this.spr.vent && !j.raw) stamp(ctx, this.spr.vent[0], j.x, -gy + 0.12, 1);
      if (on > 0.02) { const hh = j.top * on, g = ctx.createLinearGradient(0, -gy, 0, -gy - hh); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.6, 'rgba(200,236,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); const ww = j.w * 0.55; ctx.moveTo(j.x - ww * 0.6, -gy); for (let k = 0; k <= 10; k++) { const u = k / 10; ctx.lineTo(j.x - ww * (0.6 + u * 0.7) + Math.sin(t * 14 + k) * 0.06, -gy - hh * u); } for (let k = 10; k >= 0; k--) { const u = k / 10; ctx.lineTo(j.x + ww * (0.6 + u * 0.7) + Math.sin(t * 11 + k * 2) * 0.06, -gy - hh * u); } ctx.closePath(); ctx.fill(); } }
    // a balloon with its basket, waiting or in flight
    for (const r of this.rides || []) { if (r.bx < x0 - 8 || r.bx > x1 + 8) continue; const bl = this.spr.balloon, sw = Math.sin(t * 0.9 + r.x) * 0.04 * (r.t > 0 && !r.done ? 1 : 0.4); ctx.save(); ctx.translate(r.bx, -r.by); ctx.rotate(sw); if (bl) stamp(ctx, bl[Math.floor(r.x) % bl.length], 0, -4.4, 6.6);
      ctx.strokeStyle = 'rgba(70,50,36,0.9)'; ctx.lineWidth = 0.04; ctx.beginPath(); for (const sx of [-0.62, -0.2, 0.2, 0.62]) { ctx.moveTo(sx, -0.95); ctx.lineTo(sx * 0.55, -3.1); } ctx.stroke();
      if (r.t > 0 && !r.done && Math.sin(t * 9) > -0.2) { ctx.globalCompositeOperation = 'lighter'; stamp(ctx, this.fx.warm, 0, -2.7, 1.5); ctx.globalCompositeOperation = 'source-over'; }
      const g = ctx.createLinearGradient(0, -1, 0, 0.1); g.addColorStop(0, '#9a7448'); g.addColorStop(1, '#6a4a30'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-0.75, -0.95, 1.5, 1.05, 0.12); ctx.fill(); ctx.strokeStyle = 'rgba(40,26,16,0.5)'; ctx.lineWidth = 0.03; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-0.75, -0.95 + i * 0.26); ctx.lineTo(0.75, -0.95 + i * 0.26); ctx.stroke(); } ctx.fillStyle = '#b8905c'; ctx.fillRect(-0.8, -1, 1.6, 0.12); ctx.restore(); }
    // the goal: a bed of light at the lowest point, with a beam that can be seen from far up the slope
    const g = this.level.goal; if (g.x > x0 - 30 && g.x < x1 + 30) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const pul = 0.75 + 0.25 * Math.sin(t * 2.2), beam = ctx.createLinearGradient(0, -g.y, 0, -g.y - 34); beam.addColorStop(0, `rgba(255,224,130,${0.5 * pul})`); beam.addColorStop(1, 'rgba(255,224,130,0)'); ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(g.x - 0.7, -g.y); ctx.lineTo(g.x - 2.6, -g.y - 34); ctx.lineTo(g.x + 2.6, -g.y - 34); ctx.lineTo(g.x + 0.7, -g.y); ctx.closePath(); ctx.fill(); stamp(ctx, this.fx.warm, g.x, -g.y - 0.2, 7 * pul); ctx.restore();
      if (this.spr.nest) stamp(ctx, this.spr.nest[0], g.x, -g.y + 0.1, 1); for (let i = 0; i < 6; i++) { const a = t * 0.8 + i * 1.047, rr = 1.2 + 0.3 * Math.sin(t * 1.5 + i); ctx.globalAlpha = 0.8; stamp(ctx, this.fx.warm, g.x + Math.cos(a) * rr, -g.y - 1.2 - Math.sin(a * 1.3) * 0.6 - i * 0.25, 0.35); } ctx.globalAlpha = 1; }
    // seeds to collect
    for (const s of this.level.seeds) { if (s.got || s.x < x0 || s.x > x1) continue; const bob = Math.sin(t * 3 + s.x) * 0.1; ctx.save(); ctx.globalCompositeOperation = 'lighter'; stamp(ctx, this.fx.warm, s.x, -s.y - bob, 1.25 + 0.15 * Math.sin(t * 5 + s.x)); ctx.restore(); ctx.save(); ctx.translate(s.x, -s.y - bob); ctx.rotate(Math.sin(t * 2 + s.x) * 0.25); ctx.beginPath(); ctx.moveTo(0, -0.2); ctx.bezierCurveTo(0.14, -0.08, 0.11, 0.12, 0, 0.12); ctx.bezierCurveTo(-0.11, 0.12, -0.14, -0.08, 0, -0.2); ctx.fillStyle = '#ffe58a'; ctx.fill(); ctx.strokeStyle = '#c98a1e'; ctx.lineWidth = 0.025; ctx.stroke(); ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.ellipse(-0.03, -0.05, 0.03, 0.05, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    // the other things to find: the level's stamp, turning on its thread of light; a dewdrop; one of Mu's feathers
    for (const it of this.level.items || []) { if (it.got || it.x < x0 - 2 || it.x > x1 + 2) continue; const bob = Math.sin(t * 2.4 + it.x) * 0.12, y = -it.y - bob;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; stamp(ctx, it.kind === 'dew' ? this.fx.glow : this.fx.warm, it.x, y, it.kind === 'stamp' ? 3.4 + 0.4 * Math.sin(t * 3) : 1.7 + 0.15 * Math.sin(t * 4 + it.x)); ctx.restore();
      ctx.save(); ctx.translate(it.x, y);
      if (it.kind === 'stamp') { if (!this.stampS) this.stampS = stampSprite(th, this.level.li, this.spr); ctx.rotate(Math.sin(t * 1.1) * 0.1); const tw = Math.cos(t * 1.5 + it.x); ctx.scale(0.3 + 0.7 * Math.abs(tw), 1); stamp(ctx, this.stampS, 0, 0, 0.95);
        ctx.restore(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const a = t * 1.3 + i * 1.571; stamp(ctx, this.fx.warm, it.x + Math.cos(a) * 0.95, y + Math.sin(a) * 0.95, 0.3 + 0.1 * Math.sin(t * 6 + i)); } }
      else if (it.kind === 'dew') { const g = ctx.createRadialGradient(-0.06, 0.02, 0.02, 0, 0.04, 0.26); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#a8e4ff'); g.addColorStop(1, '#4fa8e8'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -0.34); ctx.bezierCurveTo(0.08, -0.14, 0.24, -0.04, 0.22, 0.1); ctx.bezierCurveTo(0.2, 0.26, -0.2, 0.26, -0.22, 0.1); ctx.bezierCurveTo(-0.24, -0.04, -0.08, -0.14, 0, -0.34); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(-0.08, 0.02, 0.04, 0.07, 0.5, 0, TAU); ctx.fill(); }
      else { ctx.rotate(-0.6 + Math.sin(t * 1.7 + it.x) * 0.3); ctx.strokeStyle = '#fff3e4'; ctx.lineWidth = 0.035; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-0.42, 0); ctx.lineTo(0.42, 0); ctx.stroke(); const g = ctx.createLinearGradient(-0.3, 0, 0.42, 0); g.addColorStop(0, '#f6a27e'); g.addColorStop(1, '#e8603c'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-0.26, 0); ctx.quadraticCurveTo(0.05, -0.26, 0.44, -0.02); ctx.quadraticCurveTo(0.05, 0.24, -0.26, 0); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.015; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-0.1 + i * 0.1, 0); ctx.lineTo(-0.02 + i * 0.1, -0.11 + i * 0.012); ctx.moveTo(-0.1 + i * 0.1, 0); ctx.lineTo(-0.02 + i * 0.1, 0.1 - i * 0.012); ctx.stroke(); } }
      ctx.restore(); }
    for (const c of A.critters || []) { if (c.hide || c.x < x0 - 4 || c.x > x1 + 4) continue; const list = c.sp ? [c.sp] : this.spr[c.s]; if (!list) continue; if (c.a != null) { if (c.a <= 0) continue; ctx.globalAlpha = c.a; }
      stamp(ctx, list[Math.floor(c.frame || 0) % list.length], c.x, -c.y, c.size || 1, c.rot || 0, c.flip); ctx.globalAlpha = 1;
      if (c.q) { const bx = c.x + 0.5, by = -c.y - 2.05 - Math.sin(t * 3) * 0.05; ctx.fillStyle = 'rgba(255,255,255,0.94)'; ctx.beginPath(); ctx.ellipse(bx, by, 0.36, 0.4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(bx - 0.2, by + 0.3); ctx.lineTo(bx - 0.36, by + 0.62); ctx.lineTo(bx, by + 0.38); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#23434d'; ctx.lineWidth = 0.075; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(bx, by - 0.1, 0.13, Math.PI * 1.05, Math.PI * 2.45); ctx.lineTo(bx, by + 0.1); ctx.stroke(); ctx.fillStyle = '#23434d'; ctx.beginPath(); ctx.arc(bx, by + 0.24, 0.045, 0, TAU); ctx.fill(); } }
  }

  _actors(ctx, A, S) {
    const T = this.T, t = this.t;
    const one = (b, pose, ghost) => {
      if (!ghost) { const gy = T.h(b.x), hgt = Math.max(0, b.y - b.r - gy), sh = clamp(1 - hgt / 9, 0, 1); if (sh > 0.02 && !this.level.pits.some((p) => b.x > p.x0 && b.x < p.x1)) { ctx.fillStyle = `rgba(20,16,30,${0.28 * sh})`; ctx.beginPath(); ctx.ellipse(b.x, -gy + 0.02, 0.42 * (0.6 + 0.4 * sh), 0.085 * sh, -Math.atan(T.dh(b.x)), 0, TAU); ctx.fill(); }
        // a soft light the hero carries, so that nothing in the scenery can hide it
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = this.time.aura ?? 0.3; stamp(ctx, this.fx.glow, b.x, -b.y, 3.1); ctx.restore(); }
      if (!ghost && b.fast > 0.02) { const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = -b.vy / sp, len = 0.7 + b.fast * 1.7, g = ctx.createLinearGradient(b.x, -b.y, b.x - ux * len, -b.y - uy * len); g.addColorStop(0, `rgba(255,255,255,${0.3 * b.fast})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(b.x - uy * 0.4, -b.y + ux * 0.4); ctx.lineTo(b.x - ux * len, -b.y - uy * len); ctx.lineTo(b.x + uy * 0.4, -b.y - ux * 0.4); ctx.closePath(); ctx.fill(); }      // speed, drawn the way a brush would draw it
      ctx.save(); ctx.translate(b.x, -b.y); drawTheta(ctx, ghost ? { ...pose, ghost: true } : pose); ctx.restore();
    };
    if (A.ghost) one(A.ghost.b, A.ghost.pose, true);
    if (A.hero) one(A.hero.b, A.hero.pose, false);
    for (const f of A.flyers || []) { ctx.save(); ctx.translate(f.x, -f.y); f.draw(ctx, t); ctx.restore(); }
  }

  _lives(ctx, x0, x1) {
    const L = this.theme.lives, T = this.T, t = this.t, time = this.time; if (!L || !this.q || this.wx.rain > 0.35) return; const cw = L.every || 7, night = (time.stars || 0) > 0.3 || time.dark > 0.3;
    for (let k = Math.floor(x0 / cw); k <= Math.ceil(x1 / cw); k++) { if (hash1(k, 131) > (L.p ?? 0.6)) continue; const z = this.zoneAt((k + 0.5) * cw); if (L.zones && !L.zones.includes(z)) continue;
      const n = 1 + Math.floor(hash1(k, 132) * 3); for (let i = 0; i < n; i++) { const ph = hash1(k * 5 + i, 133) * 20, bx = (k + hash1(k * 5 + i, 134)) * cw + Math.sin(t * 0.37 + ph) * 1.6 + Math.sin(t * 1.3 + ph * 2) * 0.35 + this.wx.wind * 0.12, by = T.h(bx) + 0.7 + hash1(k * 5 + i, 135) * 1.4 + Math.sin(t * 0.9 + ph) * 0.4 + Math.sin(t * 2.9 + ph) * 0.12;
        if (night) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.6 + ph * 3)); stamp(ctx, this.fx.warm, bx, -by, 0.34); ctx.restore(); }
        else { const col = L.cols[Math.floor(hash1(k * 5 + i, 136) * L.cols.length)], f = Math.abs(Math.sin(t * 13 + ph)), dir = Math.cos(t * 0.37 + ph) > 0 ? 1 : -1, s = 0.085 + hash1(k * 5 + i, 137) * 0.04; ctx.save(); ctx.translate(bx, -by); ctx.rotate(dir * 0.3); ctx.fillStyle = col;
          for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * s * 1.5 * (0.25 + 0.75 * f), -s * 1.7, sd * s * 1.25 * (0.25 + 0.75 * f), -s * 0.2); ctx.quadraticCurveTo(sd * s * 1.1 * (0.25 + 0.75 * f), s * 0.9, 0, s * 0.35); ctx.fill(); }
          ctx.fillStyle = 'rgba(30,30,40,0.8)'; ctx.fillRect(-s * 0.09, -s * 0.5, s * 0.18, s); ctx.restore(); } } }
  }

  _parts(ctx, x0, x1) {
    for (const p of this.parts) { if (p.x < x0 || p.x > x1) continue; const u = p.life / p.max, a = (1 - u) * (p.kind === 'steam' ? 0.35 * Math.sin(u * Math.PI) / (1 - u + 0.01) * (1 - u) : 1);
      if (p.kind === 'steam') { ctx.globalAlpha = clamp(0.4 * Math.sin(u * Math.PI), 0, 1); stamp(ctx, this.fx.glow, p.x, -p.y, p.size * (1 + u * 2.2)); }
      else if (p.kind === 'spark') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - u; stamp(ctx, this.fx.warm, p.x, -p.y, p.size * 3 * (1 - u * 0.5)); ctx.globalCompositeOperation = 'source-over'; }
      else if (p.kind === 'line') { ctx.globalAlpha = (1 - u) * 0.5; ctx.strokeStyle = p.col; ctx.lineWidth = p.size * 0.4; ctx.beginPath(); ctx.moveTo(p.x, -p.y); ctx.lineTo(p.x - p.vx * 0.06, -p.y + p.vy * 0.06); ctx.stroke(); }
      else { ctx.globalAlpha = clamp(a, 0, 1) * 0.9; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, -p.y, p.size * (p.kind === 'dust' ? 0.6 + u : 1 - u * 0.5), 0, TAU); ctx.fill(); } }
    ctx.globalAlpha = 1;
  }

  // near things, out of focus, that frame the picture and rush past
  _fore(ctx, cam, S, ox, oy) {
    const F = this.theme.fore; if (!F || !this.q) return;
    for (const L of F) { const list = this.spr[L.s]; if (!list) continue; const par = L.par, cw = L.every, cx = cam.x * par, half = cam.vw / 2 + 4, bottomY = (cam.y - cam.vh / 2);
      ctx.setTransform(S, 0, 0, S, this.W / 2 - cx * S, this.H / 2 + cam.y * S);
      for (let k = Math.floor((cx - half) / cw); k <= Math.ceil((cx + half) / cw); k++) { if (hash1(k, L.seed) > L.p) continue; const x = (k + hash1(k, L.seed + 1)) * cw, sc = L.size * (0.7 + 0.7 * hash1(k, L.seed + 2)); ctx.globalAlpha = L.a ?? 1; stamp(ctx, list[Math.floor(hash1(k, L.seed + 3) * list.length)], x, -bottomY + (L.sink ?? 0.3) * sc, sc, 0, hash1(k, 7) > 0.5); } }
    ctx.globalAlpha = 1; ctx.setTransform(S, 0, 0, S, ox, oy);
  }

  // Cloud shadows crossing the country, and the flat light under a full cover.
  _shadows(ctx, cam) {
    const { W, H, time } = this, wx = this.wx, cov = wx.cover; if (cov < 0.03) return;
    if (this.q && time.sun && !time.stars) { const a = Math.min(1, cov * 2.4) * (1 - cov * 0.55) * 0.2; for (let i = 0; i < 4; i++) { const u = (((hash1(i, 41) + this.cloudX * (5 + i * 1.3) - cam.x * 0.004) % 1.7) + 1.7) % 1.7 - 0.35, cx = u * W, cy = (0.5 + hash1(i, 42) * 0.45) * H, rx = H * (0.5 + hash1(i, 43) * 0.5); ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.42); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(time.shade, a)); g.addColorStop(0.6, rgba(time.shade, a * 0.6)); g.addColorStop(1, rgba(time.shade, 0)); ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore(); } }
    ctx.fillStyle = rgba(mix(time.shade, time.haze, 0.25), cov * (time.stars ? 0.1 : 0.2)); ctx.fillRect(0, 0, W, H);
  }
  // Rain and snow, drawn in two depths. Rain falls at about 22 units a second and snow at about 2.4, and the wind carries both sideways at its own speed, which is why snow blows nearly flat and rain only leans.
  _precip(ctx, cam, S) {
    const { W, H, t } = this, wx = this.wx, rain = wx.rain * (1 - this.coldNow), snow = wx.rain * this.coldNow, k = H / 900; if (wx.rain < 0.02) return;
    if (rain > 0.02) { const n = Math.round(rain * (this.q === 2 ? 340 : this.q ? 200 : 90)), vf = 22; ctx.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) { const near = pass === 1; ctx.strokeStyle = near ? 'rgba(232,242,255,0.42)' : 'rgba(215,230,250,0.24)'; ctx.lineWidth = (near ? 1.5 : 0.9) * k; ctx.beginPath();
        for (let i = pass; i < n; i += 2) { const d = (near ? 0.75 : 0.4) + hash1(i, 91) * 0.3, len = vf * S * 0.022 * d, sl = wx.wind / vf, px = (((hash1(i, 92) * W + this.windX * S * d - cam.x * S * d * 0.6) % W) + W) % W, py = (((hash1(i, 93) * H + t * vf * S * d * 0.55 + cam.y * S * d * 0.6) % H) + H) % H; ctx.moveTo(px, py); ctx.lineTo(px - sl * len, py - len); }
        ctx.stroke(); } }
    if (snow > 0.02) { const n = Math.round(snow * (this.q === 2 ? 260 : this.q ? 150 : 70)), vf = 2.4; ctx.fillStyle = '#ffffff';
      for (let i = 0; i < n; i++) { const d = 0.35 + hash1(i, 95) * 0.75, px = (((hash1(i, 96) * W + this.windX * S * d * 0.8 + Math.sin(t * (0.7 + hash1(i, 97)) + i) * 9 * k - cam.x * S * d * 0.6) % W) + W) % W, py = (((hash1(i, 98) * H + t * vf * S * d + cam.y * S * d * 0.6) % H) + H) % H; ctx.globalAlpha = 0.45 + 0.5 * d; ctx.beginPath(); ctx.arc(px, py, (0.9 + 1.9 * d) * k, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
  }

  // haze, shafts of light, the tint of the hour, and a darkening toward the corners
  _air(ctx, cam, S) {
    const { W, H, time, t } = this, wx = this.wx, mist = Math.min(0.9, (time.mist || 0) + wx.fog * 0.42 + wx.rain * 0.1);
    this._shadows(ctx, cam);
    // the sun's light spilling over whatever stands in front of it
    if (time.sun && this.q && !time.stars) { const s = time.sun, a = (time.bloom ?? 0.3) * (1 - wx.cover * 0.85); if (a > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(s.x * W, s.y * H, 0, s.x * W, s.y * H, H * 0.75); g.addColorStop(0, rgba(s.glow, a)); g.addColorStop(0.25, rgba(s.glow, a * 0.42)); g.addColorStop(1, rgba(s.glow, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
    this._precip(ctx, cam, S);
    // the air itself: pollen, ash, spray
    for (const A of this.amb) { const n = this.q ? A.n : Math.floor(A.n / 3); ctx.fillStyle = A.col; for (let i = 0; i < n; i++) { const sp = A.speed * (0.5 + hash1(i, 81)), dr = A.drift * (0.5 + hash1(i, 82)), px = ((hash1(i, 83) * W + t * dr * H + this.windX * S * 0.5 * (0.5 + hash1(i, 82)) - cam.x * S * A.par * (0.5 + hash1(i, 86))) % W + W) % W, py = ((hash1(i, 84) * H + t * sp * H + cam.y * S * A.par) % H + H) % H, sz = A.size * (0.5 + hash1(i, 85)) * H / 900; ctx.globalAlpha = A.a * (0.4 + 0.6 * hash1(i, 87)) * (A.twinkle ? 0.5 + 0.5 * Math.sin(t * 3 + i) : 1); { ctx.beginPath(); ctx.arc(px + Math.sin(t * 1.7 + i) * A.sway, py, sz, 0, TAU); ctx.fill(); } } ctx.globalAlpha = 1; }
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
  }
}
