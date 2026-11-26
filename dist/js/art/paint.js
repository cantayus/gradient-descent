// Tools for painting: colour, noise, and small pictures made once and stamped many times.
import { RNG } from '../core/rng.js';

export const TAU = Math.PI * 2;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const smooth = (t) => t * t * (3 - 2 * t);

// ---- colour ----
const hexCache = new Map();
export function rgb(hex) { let c = hexCache.get(hex); if (!c) { const n = parseInt(hex.slice(1), 16); c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; hexCache.set(hex, c); } return c; }
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return '#' + [0, 1, 2].map((i) => Math.round(lerp(A[i], B[i], clamp(t, 0, 1))).toString(16).padStart(2, '0')).join(''); }
export function rgba(hex, a) { const c = rgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
export const lighten = (hex, t) => mix(hex, '#ffffff', t);
export const darken = (hex, t) => mix(hex, '#000000', t);

// ---- noise ----
export function hash1(n, seed = 0) { let h = (Math.imul(n | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i; return lerp(hash1(i, seed), hash1(i + 1, seed), smooth(f)); }
export function fbm(x, seed = 0, oct = 4) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * noise1(x * f, seed + i * 17); n += a; a *= 0.5; f *= 2.03; } return s / n; }
export function ridge(x, seed = 0, oct = 4) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * (1 - Math.abs(noise1(x * f, seed + i * 31) * 2 - 1)); n += a; a *= 0.5; f *= 2.1; } return s / n; }

// ---- small pictures ----
// A sprite is painted once on its own canvas, at `ppu` pixels to the unit, and remembers where its foot is.
export const PPU = 72;
// How finely the small pictures are painted. The picture setting raises it, so that on a large screen nothing is a blown-up thumbnail:
// `k` for everything, and `far` on top of it for the things of the far country, which are painted small and then shown large.
export const Q = { k: 1, far: 1 };
export function sprite(w, h, paint, { ax = 0.5, ay = 1, ppu = PPU, blur = 0 } = {}) {
  { const f = Q.k * (ppu < PPU ? Q.far : 1); ppu *= f; blur *= f; }
  const pad = blur ? blur * 2.5 / ppu : 0.04, c = document.createElement('canvas'); c.width = Math.ceil((w + pad * 2) * ppu); c.height = Math.ceil((h + pad * 2) * ppu);
  const ctx = c.getContext('2d'); ctx.scale(ppu, ppu); ctx.translate(pad, pad);
  if (blur && 'filter' in ctx) ctx.filter = `blur(${blur}px)`;
  paint(ctx, w, h);
  return { c, w: w + pad * 2, h: h + pad * 2, ox: (ax * w + pad), oy: (ay * h + pad) };
}
// Stamp a sprite with its foot at (x, y), in the units of the current transform.
export function stamp(ctx, s, x, y, scale = 1, rot = 0, flip = false) {
  if (!rot && !flip) { ctx.drawImage(s.c, x - s.ox * scale, y - s.oy * scale, s.w * scale, s.h * scale); return; }
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(flip ? -scale : scale, scale); ctx.drawImage(s.c, -s.ox, -s.oy, s.w, s.h); ctx.restore();
}

export function blob(ctx, cx, cy, rx, ry, r, n = 9, jit = 0.18) {
  const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, k = 1 + r.range(-jit, jit); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  ctx.beginPath(); for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p[0], p[1], mx, my); } const p = pts[0], q = pts[1]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); ctx.closePath();
  return pts;
}

// ---- things that grow and things that lie about ----
// Every painter draws inside a box w wide and h tall, standing on the bottom edge.
export const P = {
  // a rock with a lit face, a shaded face and a crack or two
  rock(ctx, w, h, r, { col = '#5a6170', lit = null, moss = null, snow = null } = {}) {
    const n = r.int(6, 9), pts = []; for (let i = 0; i < n; i++) { const a = Math.PI + (i / (n - 1)) * Math.PI, k = 1 + r.range(-0.16, 0.12); pts.push([w / 2 + Math.cos(a) * (w / 2) * k * 0.96, h - Math.sin(-a) * h * k * 0.94]); }
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], h); for (const p of pts) ctx.lineTo(p[0], Math.max(0.01, p[1])); ctx.lineTo(pts[n - 1][0], h); ctx.closePath(); };
    const g = ctx.createLinearGradient(0, 0, w * 0.4, h); g.addColorStop(0, lit || lighten(col, 0.3)); g.addColorStop(0.45, col); g.addColorStop(1, darken(col, 0.35));
    path(); ctx.fillStyle = g; ctx.fill(); ctx.save(); ctx.clip();
    // facets
    const mid = r.range(0.4, 0.62) * w; ctx.fillStyle = rgba('#000000', 0.16); ctx.beginPath(); ctx.moveTo(mid, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(mid + r.range(-0.1, 0.1) * w, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.12); ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(mid * 0.9, r.range(0.05, 0.25) * h); ctx.lineTo(mid * 0.6, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba('#000000', 0.22); ctx.lineWidth = 0.015; for (let i = 0; i < 3; i++) { let x = r.range(0.15, 0.85) * w, y = r.range(0.2, 0.6) * h; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 3; k++) { x += r.range(-0.08, 0.08) * w; y += r.range(0.08, 0.2) * h; ctx.lineTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < 26; i++) { ctx.fillStyle = rgba(r.chance(0.5) ? '#ffffff' : '#000000', r.range(0.03, 0.09)); ctx.beginPath(); ctx.ellipse(r.range(0, w), r.range(0, h), r.range(0.01, 0.05) * w, r.range(0.006, 0.02) * w, r.range(0, 3), 0, TAU); ctx.fill(); }
    const cap = (c, t) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-0.1, -0.1); ctx.lineTo(w + 0.1, -0.1); ctx.lineTo(w + 0.1, h * t * 0.7); for (let x = w; x >= 0; x -= w / 9) ctx.lineTo(x, h * t * (0.75 + 0.5 * r.u())); ctx.closePath(); ctx.fill(); };
    if (moss) cap(moss, r.range(0.22, 0.4)); if (snow) cap(snow, r.range(0.2, 0.34));
    ctx.restore(); path(); ctx.strokeStyle = rgba(darken(col, 0.5), 0.5); ctx.lineWidth = 0.018; ctx.stroke();
  },
  // a tuft of grass: blades fanning from one root
  tuft(ctx, w, h, r, { col = '#6f9a4f', tip = '#b8d77a', n = 11 } = {}) {
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) { const t = i / (n - 1), bx = w / 2 + (t - 0.5) * w * 0.3, lean = (t - 0.5) * w * 1.1 + r.range(-0.1, 0.1) * w, hh = h * r.range(0.55, 1) * (1 - Math.abs(t - 0.5) * 0.5);
      const g = ctx.createLinearGradient(0, h, 0, h - hh); g.addColorStop(0, darken(col, 0.3)); g.addColorStop(0.6, col); g.addColorStop(1, tip); ctx.strokeStyle = g; ctx.lineWidth = r.range(0.018, 0.034);
      ctx.beginPath(); ctx.moveTo(bx, h); ctx.quadraticCurveTo(bx + lean * 0.2, h - hh * 0.6, bx + lean, h - hh); ctx.stroke(); }
  },
  // a low cushion of moss or a mound of snow
  mound(ctx, w, h, r, { col = '#7fa35a', lit = null, dots = null } = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, lit || lighten(col, 0.25)); g.addColorStop(1, darken(col, 0.2)); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, h); const n = r.int(2, 4); let x = 0; for (let i = 0; i < n; i++) { const ww = (w / n) * r.range(0.9, 1.25), hh = h * r.range(0.6, 1); ctx.bezierCurveTo(x + ww * 0.1, h - hh * 1.3, x + ww * 0.9, h - hh * 1.3, Math.min(w, x + ww * 0.96), h - (i === n - 1 ? 0 : hh * 0.25)); x += ww * 0.96; } ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    if (dots) { ctx.save(); ctx.clip(); for (let i = 0; i < 40; i++) { ctx.fillStyle = rgba(dots, r.range(0.25, 0.7)); ctx.beginPath(); ctx.arc(r.range(0, w), r.range(0, h), r.range(0.008, 0.022), 0, TAU); ctx.fill(); } ctx.restore(); }
  },
  // a flower on a stem. kind: spike (lupin), pom (thrift), cup (buttercup), puff (cotton grass), bell (heather)
  flower(ctx, w, h, r, { kind = 'spike', col = '#7b5cc0', col2 = '#c9a3ff', stem = '#4f7a3f' } = {}) {
    ctx.lineCap = 'round'; const x = w / 2, sway = r.range(-0.12, 0.12) * w;
    ctx.strokeStyle = stem; ctx.lineWidth = 0.022; ctx.beginPath(); ctx.moveTo(x, h); ctx.quadraticCurveTo(x + sway * 0.3, h * 0.5, x + sway, h * (kind === 'spike' ? 0.45 : 0.16)); ctx.stroke();
    for (let i = 0; i < 3; i++) { const ly = h * r.range(0.6, 0.92), d = r.chance(0.5) ? 1 : -1; ctx.fillStyle = mix(stem, '#9bd06a', 0.3); ctx.beginPath(); ctx.ellipse(x + d * w * 0.16, ly, w * 0.17, h * 0.035, d * 0.6, 0, TAU); ctx.fill(); }
    if (kind === 'spike') { const n = 11; for (let i = 0; i < n; i++) { const t = i / (n - 1), yy = lerp(h * 0.5, h * 0.05, t), ww = lerp(w * 0.2, w * 0.05, t); for (const d of [-1, 1]) { ctx.fillStyle = mix(col, col2, t * 0.8 + r.range(0, 0.2)); ctx.beginPath(); ctx.ellipse(x + sway * lerp(0.4, 1, t) + d * ww * 0.55, yy, ww * 0.62, h * 0.03, d * 0.5, 0, TAU); ctx.fill(); } } }
    else if (kind === 'pom') { const cy = h * 0.14; for (let i = 0; i < 16; i++) { ctx.fillStyle = mix(col, col2, r.u()); ctx.beginPath(); ctx.arc(x + sway + r.range(-1, 1) * w * 0.22, cy + r.range(-1, 1) * w * 0.2, w * r.range(0.07, 0.12), 0, TAU); ctx.fill(); } }
    else if (kind === 'cup') { const cy = h * 0.15; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.3; ctx.fillStyle = mix(col, col2, i / 5); ctx.beginPath(); ctx.ellipse(x + sway + Math.cos(a) * w * 0.15, cy + Math.sin(a) * w * 0.13, w * 0.14, w * 0.1, a, 0, TAU); ctx.fill(); } ctx.fillStyle = '#f2a41e'; ctx.beginPath(); ctx.arc(x + sway, cy, w * 0.07, 0, TAU); ctx.fill(); }
    else if (kind === 'puff') { const cy = h * 0.14; for (let i = 0; i < 9; i++) { ctx.fillStyle = rgba('#ffffff', r.range(0.55, 0.95)); ctx.beginPath(); ctx.arc(x + sway + r.range(-1, 1) * w * 0.16, cy + r.range(-1, 0.6) * w * 0.2, w * r.range(0.1, 0.17), 0, TAU); ctx.fill(); } }
    else { for (let i = 0; i < 7; i++) { const t = i / 6, yy = lerp(h * 0.5, h * 0.12, t), d = i % 2 ? 1 : -1; ctx.fillStyle = mix(col, col2, t); ctx.beginPath(); ctx.ellipse(x + sway * t + d * w * 0.1, yy, w * 0.09, h * 0.04, 0, 0, TAU); ctx.fill(); } }
  },
  // a low shrub: many small leaves on a few stems
  shrub(ctx, w, h, r, { col = '#557d3c', lit = '#9dbf62', berry = null, stem = '#5a4636' } = {}) {
    ctx.strokeStyle = stem; ctx.lineWidth = 0.025; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.quadraticCurveTo(w / 2 + r.range(-0.2, 0.2) * w, h * 0.6, r.range(0.15, 0.85) * w, h * r.range(0.2, 0.5)); ctx.stroke(); }
    for (let i = 0; i < 70; i++) { const a = r.range(0, TAU), d = Math.sqrt(r.u()), x = w / 2 + Math.cos(a) * d * w * 0.46, y = h * 0.52 + Math.sin(a) * d * h * 0.46; ctx.fillStyle = mix(col, lit, clamp(0.5 - Math.sin(a) * 0.5 * d + r.range(-0.2, 0.2), 0, 1)); ctx.beginPath(); ctx.ellipse(x, y, w * 0.055, w * 0.03, r.range(0, 3), 0, TAU); ctx.fill(); }
    if (berry) for (let i = 0; i < 7; i++) { ctx.fillStyle = berry; ctx.beginPath(); ctx.arc(r.range(0.2, 0.8) * w, r.range(0.25, 0.8) * h, 0.022, 0, TAU); ctx.fill(); }
  },
  // a stand of basalt columns: six-sided pillars of cooled lava, each a little taller or shorter than its neighbour
  basalt(ctx, w, h, r, { col = '#4a4f5c', lit = '#8a90a0', moss = null, n = 0 } = {}) {
    n = n || Math.max(3, Math.round(w / 0.24)); const cw = w / n;
    for (let i = 0; i < n; i++) { const t = i / (n - 1 || 1), hh = h * (0.45 + 0.55 * Math.sin(t * Math.PI) ** 0.7) * r.range(0.72, 1), x = i * cw, top = h - hh;
      const g = ctx.createLinearGradient(x, 0, x + cw, 0); g.addColorStop(0, lighten(col, 0.16)); g.addColorStop(0.35, col); g.addColorStop(1, darken(col, 0.35)); ctx.fillStyle = g; ctx.fillRect(x, top, cw + 0.004, hh);
      ctx.fillStyle = rgba('#000000', 0.2); ctx.fillRect(x + cw * 0.66, top, cw * 0.34, hh);
      ctx.fillStyle = moss || lit; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + cw * 0.3, top - cw * 0.16); ctx.lineTo(x + cw * 0.8, top - cw * 0.16); ctx.lineTo(x + cw + 0.004, top); ctx.lineTo(x + cw * 0.7, top + cw * 0.12); ctx.lineTo(x + cw * 0.25, top + cw * 0.12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba('#000000', 0.25); ctx.lineWidth = 0.012; for (let k = 0; k < 3; k++) { const yy = top + hh * r.range(0.15, 0.95); ctx.beginPath(); ctx.moveTo(x + 0.01, yy); ctx.lineTo(x + cw - 0.01, yy + r.range(-0.02, 0.02)); ctx.stroke(); } }
  },
  // a shard of ice
  ice(ctx, w, h, r, { col = '#bfe6f5', deep = '#5fa9d6' } = {}) {
    const n = r.int(2, 4); for (let i = 0; i < n; i++) { const x = (i + 0.5) / n * w + r.range(-0.08, 0.08) * w, ww = w / n * r.range(0.7, 1.2), hh = h * r.range(0.5, 1), lean = r.range(-0.2, 0.2) * w;
      const g = ctx.createLinearGradient(x - ww / 2, 0, x + ww / 2, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, col); g.addColorStop(1, deep); ctx.fillStyle = g; ctx.globalAlpha = 0.92;
      ctx.beginPath(); ctx.moveTo(x - ww / 2, h); ctx.lineTo(x + lean - ww * 0.12, h - hh); ctx.lineTo(x + lean + ww * 0.14, h - hh * 0.92); ctx.lineTo(x + ww / 2, h); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = rgba('#ffffff', 0.8); ctx.lineWidth = 0.014; ctx.beginPath(); ctx.moveTo(x - ww * 0.2, h); ctx.lineTo(x + lean, h - hh * 0.96); ctx.stroke(); }
  },
  // a cloud: heaped round tops on a level base, bright above and tinted below
  cloud(ctx, w, h, r, { col = '#ffffff', under = '#c9d4e6', n = 0 } = {}) {
    n = n || Math.round(w / h * 4.5); const base = h * 0.8, puffs = [];
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, bulge = Math.sin(u * Math.PI) ** 0.8; puffs.push([w * (0.08 + 0.84 * u) + r.range(-0.03, 0.03) * w, base - h * 0.22 * bulge * r.range(0.5, 1.2), h * (0.16 + 0.26 * bulge) * r.range(0.75, 1.15)]); }
    const path = () => { ctx.beginPath(); for (const [x, y, rr] of puffs) { ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, TAU); } ctx.rect(w * 0.1, base - h * 0.16, w * 0.8, h * 0.16); };
    const g = ctx.createLinearGradient(0, 0, 0, base); g.addColorStop(0, col); g.addColorStop(0.55, mix(col, under, 0.25)); g.addColorStop(1, under);
    ctx.save(); path(); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // light catching the upper left of each heap
    for (const [x, y, rr] of puffs) { const hg = ctx.createRadialGradient(x - rr * 0.3, y - rr * 0.4, 0, x - rr * 0.3, y - rr * 0.4, rr); hg.addColorStop(0, rgba('#ffffff', 0.6)); hg.addColorStop(1, rgba('#ffffff', 0)); ctx.fillStyle = hg; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    // the base fades out, so that the cloud floats
    const fg = ctx.createLinearGradient(0, base - h * 0.2, 0, base); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,1)'); ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = fg; ctx.fillRect(0, base - h * 0.2, w, h); ctx.restore();
  },
  // a bank of mist: long, low and faint
  mist(ctx, w, h, r, { col = '#ffffff' } = {}) {
    for (let i = 0; i < 14; i++) { const x = r.range(0.2, 0.8) * w, y = h * r.range(0.35, 0.65), rx = w * r.range(0.14, 0.3), ry = h * r.range(0.18, 0.34); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgba(col, 0.2)); g.addColorStop(1, rgba(col, 0)); ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore(); }
  },
  glow(ctx, w, h, r, { col = '#ffffff', a = 1 } = {}) { const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.35)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); },
  // a small house with a pitched roof, gable end on. `turf` grows grass on the roof; `spire` gives it a tower and makes it a country church
  house(ctx, w, h, r, { wall = '#f4f1ea', roof = '#c8483a', trim = '#3a3f4a', win = '#2c3644', turf = null, spire = false, flat = false } = {}) {
    const bw = spire ? w * 0.6 : w * 0.86, bx = spire ? w * 0.36 : w * 0.07, wh = h * (spire ? 0.32 : flat ? 0.8 : 0.44), top = h - wh, ridge = top - h * (spire ? 0.2 : 0.36);
    ctx.fillStyle = wall; ctx.fillRect(bx, top, bw, wh); ctx.fillStyle = rgba('#000000', 0.12); ctx.fillRect(bx + bw * 0.62, top, bw * 0.38, wh);
    ctx.fillStyle = turf || roof; if (flat) ctx.fillRect(bx - w * 0.03, top - h * 0.05, bw + w * 0.06, h * 0.07); else { ctx.beginPath(); ctx.moveTo(bx - w * 0.05, top + h * 0.01); ctx.lineTo(bx + bw / 2, ridge); ctx.lineTo(bx + bw + w * 0.05, top + h * 0.01); ctx.closePath(); ctx.fill(); }
    if (turf) { ctx.strokeStyle = lighten(turf, 0.25); ctx.lineWidth = w * 0.012; ctx.lineCap = 'round'; for (let i = 0; i < 26; i++) { const u = r.u(), x = bx + bw * u, y = lerp(ridge, top, Math.abs(u - 0.5) * 2) + r.range(-0.01, 0.02) * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r.range(-0.02, 0.02) * w, y - r.range(0.03, 0.08) * h); ctx.stroke(); } }
    ctx.fillStyle = win; ctx.fillRect(bx + bw * 0.16, top + wh * 0.28, bw * 0.17, wh * 0.36); ctx.fillRect(bx + bw * 0.67, top + wh * 0.28, bw * 0.17, wh * 0.36); if (!spire && !flat) ctx.fillRect(bx + bw * 0.44, lerp(ridge, top, 0.55), bw * 0.12, wh * 0.26);
    ctx.fillStyle = trim; ctx.fillRect(bx + bw * 0.42, top + wh * 0.36, bw * 0.16, wh * 0.64);
    if (spire) { ctx.fillStyle = wall; ctx.fillRect(w * 0.1, h * 0.36, w * 0.27, h * 0.64); ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(w * 0.06, h * 0.37); ctx.lineTo(w * 0.235, 0); ctx.lineTo(w * 0.41, h * 0.37); ctx.closePath(); ctx.fill(); ctx.fillStyle = win; ctx.fillRect(w * 0.19, h * 0.5, w * 0.09, h * 0.14); }
  },
  // a lighthouse
  tower(ctx, w, h, r, { col = '#f2a23a', band = '#ffffff', top = '#2c3038', lamp = '#fff3b0' } = {}) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(w * 0.2, h); ctx.lineTo(w * 0.33, h * 0.2); ctx.lineTo(w * 0.67, h * 0.2); ctx.lineTo(w * 0.8, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = band; ctx.fillRect(w * 0.27, h * 0.48, w * 0.46, h * 0.13); ctx.fillStyle = rgba('#000000', 0.14); ctx.beginPath(); ctx.moveTo(w * 0.55, h * 0.2); ctx.lineTo(w * 0.67, h * 0.2); ctx.lineTo(w * 0.8, h); ctx.lineTo(w * 0.6, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = top; ctx.fillRect(w * 0.24, h * 0.16, w * 0.52, h * 0.05); ctx.fillStyle = lamp; ctx.fillRect(w * 0.36, h * 0.07, w * 0.28, h * 0.1); ctx.fillStyle = top; ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.075); ctx.lineTo(w * 0.5, 0); ctx.lineTo(w * 0.7, h * 0.075); ctx.closePath(); ctx.fill();
  },
  // a four-legged animal from the side, facing right. graze: 0 head up, 1 head down in the grass
  quad(ctx, w, h, r, { col = '#6a4a35', dark = '#3a2a22', mane = null, neck = 0.5, head = 0.2, tail = 0.5, graze = 0, wool = false, horns = null, belly = null } = {}) {
    const by = h * 0.5; ctx.fillStyle = dark; for (const lx of [0.27, 0.36, 0.64, 0.73]) ctx.fillRect(lx * w - w * 0.025, by, w * 0.055, h * 0.5);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(w * 0.5, by, w * 0.3, h * 0.2, 0, 0, TAU); ctx.fill();
    const nx = w * 0.74, ny = by - h * 0.06, hx = nx + w * 0.12 * (1 - graze * 0.2), hy = lerp(by - h * neck * 0.7, by + h * 0.3, graze);
    ctx.strokeStyle = col; ctx.lineWidth = w * 0.115; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(nx - w * 0.03, ny); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(hx + w * 0.055, hy + h * 0.03, w * head * 0.55, h * 0.085, 0.55 - graze * 0.4, 0, TAU); ctx.fill();
    if (mane) { ctx.strokeStyle = mane; ctx.lineWidth = w * 0.05; ctx.beginPath(); ctx.moveTo(nx - w * 0.08, ny - h * 0.05); ctx.lineTo(hx - w * 0.04, hy - h * 0.04); ctx.stroke(); }
    ctx.strokeStyle = mane || dark; ctx.lineWidth = w * 0.04; ctx.beginPath(); ctx.moveTo(w * 0.21, by - h * 0.08); ctx.quadraticCurveTo(w * (0.13 - tail * 0.12), by + h * 0.04, w * (0.15 - tail * 0.1), by + h * 0.32); ctx.stroke();
    if (belly) { ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(w * 0.5, by + h * 0.1, w * 0.26, h * 0.09, 0, 0, TAU); ctx.fill(); ctx.fillStyle = dark; ctx.fillRect(w * 0.26, by + h * 0.01, w * 0.48, h * 0.035); }
    if (horns) { ctx.strokeStyle = horns; ctx.lineWidth = w * 0.018; for (const o of [0, 0.03]) { ctx.beginPath(); ctx.moveTo(hx + w * (0.02 + o), hy - h * 0.05); ctx.lineTo(hx - w * (0.1 - o), hy - h * (0.5 - graze * 0.2)); ctx.stroke(); } }
    if (wool) { ctx.fillStyle = col; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(w * r.range(0.24, 0.76), by + h * r.range(-0.18, 0.14), w * 0.075, 0, TAU); ctx.fill(); } }
  },
  boat(ctx, w, h, r, { hull = '#c8483a', cabin = '#f4f1ea', trim = '#2c3644' } = {}) {
    ctx.fillStyle = hull; ctx.beginPath(); ctx.moveTo(0, h * 0.55); ctx.lineTo(w, h * 0.5); ctx.lineTo(w * 0.86, h); ctx.lineTo(w * 0.1, h); ctx.closePath(); ctx.fill(); ctx.fillStyle = rgba('#ffffff', 0.85); ctx.fillRect(w * 0.04, h * 0.6, w * 0.9, h * 0.07);
    ctx.fillStyle = cabin; ctx.fillRect(w * 0.3, h * 0.2, w * 0.3, h * 0.34); ctx.fillStyle = trim; ctx.fillRect(w * 0.36, h * 0.27, w * 0.18, h * 0.12); ctx.fillStyle = '#2c3038'; ctx.fillRect(w * 0.64, 0, w * 0.025, h * 0.52);
  },
  // a cairn: stones piled to mark the way
  cairn(ctx, w, h, r, { col = '#565b69', lit = '#9aa0b0' } = {}) {
    let y = h; for (let i = 0; i < 5; i++) { const sw = w * (0.95 - i * 0.16) * r.range(0.85, 1), sh = h * 0.24 * r.range(0.8, 1.1), cx = w / 2 + r.range(-0.04, 0.04) * w; ctx.fillStyle = mix(col, lit, 0.1 + i * 0.12); ctx.beginPath(); ctx.ellipse(cx, y - sh / 2, sw / 2, sh / 2, r.range(-0.1, 0.1), 0, TAU); ctx.fill(); ctx.fillStyle = rgba('#ffffff', 0.2); ctx.beginPath(); ctx.ellipse(cx - sw * 0.12, y - sh * 0.72, sw * 0.25, sh * 0.13, 0, 0, TAU); ctx.fill(); y -= sh * 0.8; }
  },
  // a puffin standing
  puffin(ctx, w, h, r, { blink = false } = {}) {
    ctx.fillStyle = '#f08a2a'; ctx.fillRect(w * 0.36, h * 0.88, w * 0.11, h * 0.12); ctx.fillRect(w * 0.54, h * 0.88, w * 0.11, h * 0.12);
    ctx.fillStyle = '#1c1e24'; ctx.beginPath(); ctx.ellipse(w * 0.47, h * 0.6, w * 0.3, h * 0.33, -0.15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f7f5ef'; ctx.beginPath(); ctx.ellipse(w * 0.55, h * 0.66, w * 0.2, h * 0.26, -0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1c1e24'; ctx.beginPath(); ctx.arc(w * 0.54, h * 0.24, w * 0.25, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f1efe8'; ctx.beginPath(); ctx.ellipse(w * 0.6, h * 0.27, w * 0.16, h * 0.13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f0752a'; ctx.beginPath(); ctx.moveTo(w * 0.72, h * 0.16); ctx.lineTo(w * 0.99, h * 0.28); ctx.lineTo(w * 0.72, h * 0.39); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a6a92'; ctx.beginPath(); ctx.moveTo(w * 0.72, h * 0.16); ctx.lineTo(w * 0.81, h * 0.2); ctx.lineTo(w * 0.81, h * 0.355); ctx.lineTo(w * 0.72, h * 0.39); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1c1e24'; if (blink) ctx.fillRect(w * 0.58, h * 0.245, w * 0.09, h * 0.018); else { ctx.beginPath(); ctx.arc(w * 0.625, h * 0.25, w * 0.038, 0, TAU); ctx.fill(); }
  },
  // A fairy chimney, drawn from what the real ones look like. A shaft of pale, soft tuff stands on a flared skirt of its own washed-down rock, narrows to a
  // neck, and carries a darker cap of harder stone that overhangs it and throws a shadow down the neck. The rock is in beds of slightly different colour,
  // rain has cut rills down the skirt, and no two sides are alike. Three kinds stand in Cappadocia and all three are here: the capped pillar (as at
  // Paşabağ), the plain pointed cone (as round Göreme), and the tall column with a rounded tip. They often stand two or three to one base.
  // Where people have cut rooms: a door with a dressed frame, small square windows with soot above them, and the rows of holes of a pigeon house.
  chimney(ctx, w, h, r, { col = '#e9dfc6', lit = '#fdf6e2', shade = '#a9a0b4', cap = '#6b5a50', capLit = '#a8927e', win = null, rooms = 0, kind = null, heads = 0, sunLeft = true, snow = null } = {}) {
    const K = kind || r.pick(['cap', 'cap', 'cap', 'cap', 'cone', 'cone', 'column']), n = heads || (w / h > 0.62 ? r.pick([2, 2, 3]) : r.pick([1, 1, 1, 2]));
    const wob = (m) => { const a = Array.from({ length: 9 }, () => r.range(-1, 1)); return (v) => { const x = clamp(v, 0, 1) * 8, i = Math.min(7, Math.floor(x)), f = x - i, u = f * f * (3 - 2 * f); return (a[i] * (1 - u) + a[i + 1] * u) * m; }; };
    const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }, dusk = '#3a2c3c';
    const shafts = Array.from({ length: n }, (_, i) => ({ x: w * (n === 1 ? 0.5 : 0.24 + (0.52 * i) / (n - 1) + r.range(-0.03, 0.03)), hh: h * (n === 1 || i === (n > 2 ? 1 : 0) ? r.range(0.93, 1) : r.range(0.55, 0.84)), b: (w / n) * r.range(0.4, 0.47) * (n > 1 ? 1.2 : 1), lean: r.range(-0.04, 0.04) * w, kind: n > 1 && r.chance(0.3) ? 'cone' : K })).sort((a, b) => b.hh - a.hh);
    shafts.forEach((s, si) => {
      const capH = s.kind === 'cap' ? s.hh * r.range(0.15, 0.21) : 0, top = h - s.hh + capH, bodyH = h - top, neck = s.b * r.range(0.34, 0.46), nl = wob(0.045), nr = wob(0.045), sway = wob(0.01 * w);
      const half = (v) => { const fl = sm(0.68, 1, v) ** 2; if (s.kind === 'cone') return s.b * Math.min(1, Math.sqrt(v / 0.05 + 0.01)) * (0.1 + 0.64 * v ** 0.85 + 0.26 * fl); if (s.kind === 'column') return s.b * Math.min(1, Math.sqrt(v / 0.09 + 0.015)) * (0.5 + 0.2 * v + 0.3 * fl); return neck + (s.b - neck) * (0.72 * v ** 0.95 + 0.28 * fl); };      // a steady taper from a broad foot, as the real ones have
      const cx = (v) => s.x + s.lean * (1 - v) + sway(v), Lf = (v) => cx(v) - half(v) * (1 + nl(v)), Rt = (v) => cx(v) + half(v) * (1 + nr(v)), Y = (v) => top + bodyH * v, N = 26;
      ctx.beginPath(); for (let i = 0; i <= N; i++) { const v = i / N; i ? ctx.lineTo(Lf(v), Y(v)) : ctx.moveTo(Lf(v), Y(v)); } for (let i = N; i >= 0; i--) ctx.lineTo(Rt(i / N), Y(i / N)); ctx.closePath();
      const g = ctx.createLinearGradient(s.x - s.b, 0, s.x + s.b, 0); g.addColorStop(0, sunLeft ? lit : shade); g.addColorStop(sunLeft ? 0.4 : 0.6, col); g.addColorStop(1, sunLeft ? shade : lit); ctx.fillStyle = g; ctx.fill(); ctx.save(); ctx.clip();
      // beds of ash, each sagging a little round the pillar; two of them harder, standing out as ledges
      const tints = ['#ffffff', shade, '#e2a090', '#e8cc80', '#ffffff', shade, '#d9b8a8'];
      for (let i = 0, nb = r.int(6, 9); i < nb; i++) { const v = r.range(0.08, 0.95), th = bodyH * r.range(0.012, 0.04), sag = r.range(0.012, 0.03) * bodyH, x0 = s.x - s.b * 1.4, x1 = s.x + s.b * 1.4;
        ctx.fillStyle = rgba(tints[i % tints.length], r.range(0.1, 0.24)); ctx.beginPath(); ctx.moveTo(x0, Y(v)); ctx.quadraticCurveTo(cx(v), Y(v) + sag * 2, x1, Y(v)); ctx.lineTo(x1, Y(v) + th); ctx.quadraticCurveTo(cx(v), Y(v) + th + sag * 2, x0, Y(v) + th); ctx.closePath(); ctx.fill();
        if (i < 2) { ctx.strokeStyle = rgba(dusk, 0.3); ctx.lineWidth = Math.max(0.012, bodyH * 0.006); ctx.beginPath(); ctx.moveTo(x0, Y(v) + th); ctx.quadraticCurveTo(cx(v), Y(v) + th + sag * 2, x1, Y(v) + th); ctx.stroke(); if (snow) { ctx.strokeStyle = snow; ctx.lineWidth = bodyH * 0.012; ctx.beginPath(); ctx.moveTo(x0, Y(v)); ctx.quadraticCurveTo(cx(v), Y(v) + sag * 2, x1, Y(v)); ctx.stroke(); } } }
      // rills, fanning out with the skirt
      ctx.lineCap = 'round'; for (let i = 0, m = Math.round(10 + s.b * 12); i < m; i++) { const u = r.range(-0.92, 0.92), v0 = r.range(0.3, 0.82); ctx.strokeStyle = i % 3 ? rgba(dusk, 0.2) : rgba('#ffffff', 0.22); ctx.lineWidth = w * r.range(0.005, 0.012); ctx.beginPath(); for (let k = 0; k <= 5; k++) { const v = v0 + ((1 - v0) * k) / 5, x = cx(v) + u * half(v); k ? ctx.lineTo(x, Y(v)) : ctx.moveTo(x, Y(v)); } ctx.stroke(); }
      for (let i = 0; i < 90; i++) { ctx.fillStyle = rgba(i % 2 ? '#ffffff' : dusk, 0.07); ctx.fillRect(s.x + r.range(-1, 1) * s.b, Y(r.u()), w * 0.012, w * 0.008); }      // grain
      if (capH) { const sg = ctx.createLinearGradient(0, top, 0, top + bodyH * 0.13); sg.addColorStop(0, rgba(dusk, 0.55)); sg.addColorStop(1, rgba(dusk, 0)); ctx.fillStyle = sg; ctx.fillRect(s.x - s.b, top, s.b * 2, bodyH * 0.13); }      // the cap's shadow
      if (s.kind === 'column') { const tg = ctx.createLinearGradient(0, top, 0, top + bodyH * 0.2); tg.addColorStop(0, rgba(cap, 0.6)); tg.addColorStop(1, rgba(cap, 0)); ctx.fillStyle = tg; ctx.fillRect(s.x - s.b, top, s.b * 2, bodyH * 0.2); }
      const fg = ctx.createLinearGradient(0, h - bodyH * 0.1, 0, h); fg.addColorStop(0, rgba(dusk, 0)); fg.addColorStop(1, rgba(dusk, 0.24)); ctx.fillStyle = fg; ctx.fillRect(s.x - s.b * 1.5, h - bodyH * 0.1, s.b * 3, bodyH * 0.1);
      // rooms cut into the rock
      if (rooms && si === 0) { const dark = win || '#2c2228', dw = Math.min(0.5, s.b * 0.5), dh = dw * 1.75, dx = cx(1) + r.range(-0.3, 0.3) * s.b - dw / 2;
        ctx.fillStyle = rgba(lit, 0.9); ctx.beginPath(); ctx.roundRect(dx - dw * 0.14, h - dh - dw * 0.14, dw * 1.28, dh * 1.2, [dw * 0.64, dw * 0.64, 0, 0]); ctx.fill(); ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(dx, h - dh, dw, dh * 1.1, [dw / 2, dw / 2, 0, 0]); ctx.fill(); if (!win) { ctx.fillStyle = '#6a4a30'; ctx.fillRect(dx + dw * 0.5, h - dh * 0.78, dw * 0.5, dh); }
        for (let i = 0; i < rooms; i++) { const v = r.range(0.42, 0.86), ws = dw * r.range(0.34, 0.5), x = cx(v) + r.range(-0.55, 0.55) * half(v) - ws / 2, y = Y(v);
          const st = ctx.createLinearGradient(0, y - ws * 2.2, 0, y); st.addColorStop(0, rgba(dusk, 0)); st.addColorStop(1, rgba(dusk, 0.28)); ctx.fillStyle = st; ctx.fillRect(x, y - ws * 2.2, ws, ws * 2.2);      // soot from the hearth inside
          ctx.fillStyle = dark; ctx.beginPath(); ctx.roundRect(x, y - ws * 0.2, ws, ws * 1.2, i % 2 ? [ws / 2, ws / 2, 0, 0] : ws * 0.08); ctx.fill(); ctx.fillStyle = rgba(lit, 0.8); ctx.fillRect(x - ws * 0.12, y + ws, ws * 1.24, ws * 0.14); }
        if (rooms >= 3) { const v = r.range(0.26, 0.36), c = r.int(3, 5), q = dw * 0.15, gx = cx(v) - (c * q * 1.9) / 2, gy = Y(v); ctx.fillStyle = rgba('#ffffff', 0.4); ctx.fillRect(gx - q * 0.6, gy - q * 0.6, c * q * 1.9 + q * 0.3, q * 4.1); ctx.strokeStyle = rgba('#b5523a', 0.55); ctx.lineWidth = q * 0.22; ctx.strokeRect(gx - q * 0.6, gy - q * 0.6, c * q * 1.9 + q * 0.3, q * 4.1); ctx.fillStyle = dark; for (let a = 0; a < 2; a++) for (let b = 0; b < c; b++) ctx.fillRect(gx + b * q * 1.9, gy + a * q * 1.9, q, q); } }      // the pigeon house, whitewashed and edged in red
      ctx.restore();
      if (capH) { // the cap: an uneven pointed block, wider than the neck it sits on
        const cw = Math.max(neck * r.range(1.5, 2.1), s.b * 0.42), c0 = cx(0), ax = c0 + r.range(-0.25, 0.25) * cw, ty = top - capH, by = top + capH * 0.12, lk = [r.range(0.75, 0.95), r.range(0.3, 0.45), r.range(0.7, 0.92), r.range(0.25, 0.42)];
        const hat = () => { ctx.beginPath(); ctx.moveTo(c0 - cw, by); ctx.lineTo(c0 - cw * lk[0], top - capH * lk[1]); ctx.lineTo(ax - cw * 0.12, ty + capH * 0.08); ctx.lineTo(ax + cw * 0.1, ty); ctx.lineTo(c0 + cw * lk[2], top - capH * lk[3]); ctx.lineTo(c0 + cw, by); ctx.quadraticCurveTo(c0, by + capH * 0.24, c0 - cw, by); ctx.closePath(); };
        hat(); const cg = ctx.createLinearGradient(c0 - cw, 0, c0 + cw, 0); cg.addColorStop(0, sunLeft ? capLit : cap); cg.addColorStop(1, sunLeft ? cap : capLit); ctx.fillStyle = cg; ctx.fill(); ctx.save(); ctx.clip();
        ctx.fillStyle = rgba('#2a2028', 0.3); ctx.beginPath(); ctx.moveTo(ax, ty); ctx.lineTo(sunLeft ? c0 + cw * 1.1 : c0 - cw * 1.1, by + capH * 0.2); ctx.lineTo(c0 + (sunLeft ? 0.12 : -0.12) * cw, by + capH * 0.3); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba('#2a2028', 0.3); ctx.lineWidth = Math.max(0.012, capH * 0.03); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(c0 + r.range(-0.7, 0.7) * cw, top - capH * r.range(0.2, 0.7)); ctx.lineTo(c0 + r.range(-0.8, 0.8) * cw, by); ctx.stroke(); }
        ctx.fillStyle = rgba(dusk, 0.3); ctx.fillRect(c0 - cw, by - capH * 0.02, cw * 2, capH * 0.3);
        if (snow) { ctx.fillStyle = snow; ctx.beginPath(); ctx.moveTo(c0 - cw * 0.9, top - capH * 0.3); ctx.lineTo(c0 - cw * lk[0], top - capH * lk[1]); ctx.lineTo(ax - cw * 0.12, ty + capH * 0.08); ctx.lineTo(ax + cw * 0.1, ty); ctx.lineTo(c0 + cw * lk[2], top - capH * lk[3]); ctx.lineTo(c0 + cw * 0.88, top - capH * 0.26); ctx.quadraticCurveTo(c0, top - capH * 0.5, c0 - cw * 0.9, top - capH * 0.3); ctx.closePath(); ctx.fill(); }
        ctx.restore(); }
    });
    // blocks that have come down, lying at the foot
    for (let i = 0; i < 3; i++) { const bw = w * r.range(0.04, 0.09), x = w * r.range(0.08, 0.92); ctx.fillStyle = mix(col, shade, r.range(0.1, 0.5)); ctx.beginPath(); ctx.ellipse(x, h - bw * 0.3, bw, bw * 0.5, r.range(-0.3, 0.3), 0, TAU); ctx.fill(); }
  },
  // the soft rock between the pillars: low rounded waves of it, rilled by rain, with a pink or a white bed showing
  badland(ctx, w, h, r, { col = '#e9dfc6', lit = '#fdf6e2', shade = '#a9a0b4', sunLeft = true } = {}) {
    for (let i = 0, n = r.int(3, 5); i < n; i++) { const cx = w * (0.16 + (0.68 * (i + r.range(0.2, 0.8))) / n), hw = w * r.range(0.14, 0.24), hh = h * r.range(0.5, 1), g = ctx.createLinearGradient(cx - hw * 1.4, 0, cx + hw * 1.4, 0); g.addColorStop(0, sunLeft ? lit : shade); g.addColorStop(0.5, col); g.addColorStop(1, sunLeft ? shade : lit); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx - hw * 1.5, h); ctx.bezierCurveTo(cx - hw, h - hh * 0.2, cx - hw * 0.5, h - hh, cx, h - hh); ctx.bezierCurveTo(cx + hw * 0.5, h - hh, cx + hw, h - hh * 0.2, cx + hw * 1.5, h); ctx.closePath(); ctx.fill(); ctx.save(); ctx.clip();
      for (let k = 0; k < 2; k++) { ctx.fillStyle = rgba(k ? '#e2a090' : '#ffffff', 0.2); ctx.fillRect(cx - hw * 1.5, h - hh * r.range(0.25, 0.7), hw * 3, hh * 0.07); }
      ctx.lineCap = 'round'; for (let k = 0; k < 10; k++) { const u = r.range(-1.2, 1.2); ctx.strokeStyle = k % 3 ? rgba('#3a2c3c', 0.2) : rgba('#ffffff', 0.25); ctx.lineWidth = w * 0.006; ctx.beginPath(); ctx.moveTo(cx + u * hw * 0.3, h - hh * r.range(0.6, 0.95)); ctx.quadraticCurveTo(cx + u * hw * 0.7, h - hh * 0.4, cx + u * hw * 1.25, h); ctx.stroke(); } ctx.restore(); }
  },
  // a poplar: the tall thin tree that lines every stream and field edge in Anatolia
  poplar(ctx, w, h, r, { col = '#5f8a3f', lit = '#b4d06a', trunk = '#6a5a48' } = {}) {
    ctx.fillStyle = trunk; ctx.fillRect(w / 2 - w * 0.04, h * 0.7, w * 0.08, h * 0.3);
    for (let i = 0; i < 140; i++) { const v = r.u(), y = h * (0.02 + v * 0.8), half = w * 0.46 * Math.sin(Math.min(1, v * 1.25 + 0.12) * Math.PI) ** 0.7, x = w / 2 + r.range(-1, 1) * half; ctx.fillStyle = mix(col, lit, clamp(0.5 - (x - w / 2) / w + r.range(-0.25, 0.25), 0, 1)); ctx.beginPath(); ctx.ellipse(x, y, w * 0.07, w * 0.12, r.range(-0.4, 0.4), 0, TAU); ctx.fill(); }
  },
  // a hot-air balloon
  balloon(ctx, w, h, r, { cols = ['#e8503a', '#f6e7c4'], basket = '#6a4a30', n = 0 } = {}) {
    const cx = w / 2, R = w * 0.48, cy = R, by = h * 0.74; ctx.beginPath(); ctx.moveTo(cx - w * 0.07, by); ctx.bezierCurveTo(cx - R * 0.5, by - h * 0.14, cx - R, cy + R * 0.55, cx - R, cy); ctx.arc(cx, cy, R, Math.PI, 0); ctx.bezierCurveTo(cx + R, cy + R * 0.55, cx + R * 0.5, by - h * 0.14, cx + w * 0.07, by); ctx.closePath(); ctx.save(); ctx.clip();
    const gores = n || r.pick([6, 8, 10]), style = r.int(0, 2);
    for (let i = 0; i < gores; i++) { const a0 = -1 + (2 * i) / gores, a1 = -1 + (2 * (i + 1)) / gores; ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(cx + Math.sin((a0 * Math.PI) / 2) * w * 0.07, by); ctx.bezierCurveTo(cx + Math.sin((a0 * Math.PI) / 2) * R * 1.05, cy + R * 0.6, cx + Math.sin((a0 * Math.PI) / 2) * R * 1.05, cy - R * 0.5, cx + a0 * R * 0.1, 0); ctx.lineTo(cx + a1 * R * 0.1, 0); ctx.bezierCurveTo(cx + Math.sin((a1 * Math.PI) / 2) * R * 1.05, cy - R * 0.5, cx + Math.sin((a1 * Math.PI) / 2) * R * 1.05, cy + R * 0.6, cx + Math.sin((a1 * Math.PI) / 2) * w * 0.07, by); ctx.closePath(); ctx.fill(); }
    if (style === 1) { ctx.fillStyle = cols[cols.length - 1]; ctx.fillRect(0, cy - R * 0.12, w, R * 0.3); } else if (style === 2) { ctx.strokeStyle = cols[0]; ctx.lineWidth = R * 0.16; ctx.beginPath(); ctx.moveTo(0, cy + R * 0.5); ctx.lineTo(w, cy - R * 0.6); ctx.stroke(); }
    const sh = ctx.createLinearGradient(0, 0, w, 0); sh.addColorStop(0, 'rgba(255,255,255,0.28)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(20,10,30,0.3)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, w, h); ctx.restore();
    ctx.strokeStyle = rgba(basket, 0.9); ctx.lineWidth = w * 0.012; ctx.beginPath(); ctx.moveTo(cx - w * 0.07, by); ctx.lineTo(cx - w * 0.055, h * 0.88); ctx.moveTo(cx + w * 0.07, by); ctx.lineTo(cx + w * 0.055, h * 0.88); ctx.stroke();
    ctx.fillStyle = basket; ctx.beginPath(); ctx.roundRect(cx - w * 0.075, h * 0.88, w * 0.15, h * 0.12, w * 0.02); ctx.fill(); ctx.fillStyle = rgba('#000000', 0.2); ctx.fillRect(cx - w * 0.075, h * 0.93, w * 0.15, h * 0.015);
  },
  // a clay jar, such as the potters of Avanos have made from the red river clay for a very long time
  jar(ctx, w, h, r, { col = '#b8643a', lit = '#e09a62', band = '#f1e2c4' } = {}) {
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, lit); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * 0.38, h * 0.06); ctx.lineTo(w * 0.62, h * 0.06); ctx.lineTo(w * 0.6, h * 0.2); ctx.bezierCurveTo(w * 1.02, h * 0.34, w * 0.95, h * 0.86, w * 0.66, h); ctx.lineTo(w * 0.34, h); ctx.bezierCurveTo(w * 0.05, h * 0.86, w * -0.02, h * 0.34, w * 0.4, h * 0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; ctx.fillRect(w * 0.33, 0, w * 0.34, h * 0.08); ctx.strokeStyle = band; ctx.lineWidth = h * 0.03; ctx.beginPath(); ctx.moveTo(w * 0.17, h * 0.46); ctx.quadraticCurveTo(w / 2, h * 0.52, w * 0.83, h * 0.46); ctx.stroke();
  },
  // a prickly pear grown into a tree, as they have on the Galápagos: a trunk the colour of rust and a crown of flat green pads
  cactus(ctx, w, h, r, { trunk = '#b8683a', trunkLit = '#e09a62', pad = '#5f8f45', padLit = '#a8cc6a', bloom = '#ffd23c' } = {}) {
    const g = ctx.createLinearGradient(w * 0.4, 0, w * 0.6, 0); g.addColorStop(0, trunkLit); g.addColorStop(1, trunk); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * 0.42, h); ctx.lineTo(w * 0.45, h * 0.45); ctx.lineTo(w * 0.55, h * 0.45); ctx.lineTo(w * 0.58, h); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 16; i++) { const a = r.range(-Math.PI, 0), d = Math.sqrt(r.u()), x = w / 2 + Math.cos(a) * d * w * 0.38, y = h * 0.42 + Math.sin(a) * d * h * 0.34, pw = w * r.range(0.1, 0.16), ph = pw * r.range(1.2, 1.6), rot = r.range(-0.7, 0.7); ctx.fillStyle = mix(pad, padLit, clamp(0.5 - (x - w / 2) / w + r.range(-0.2, 0.2), 0, 1)); ctx.beginPath(); ctx.ellipse(x, y, pw, ph, rot, 0, TAU); ctx.fill(); ctx.fillStyle = rgba('#ffffff', 0.35); for (let k = 0; k < 4; k++) ctx.fillRect(x + r.range(-0.6, 0.6) * pw, y + r.range(-0.6, 0.6) * ph, 0.02, 0.02); if (bloom && r.chance(0.3)) { ctx.fillStyle = bloom; ctx.beginPath(); ctx.arc(x + Math.sin(rot) * ph, y - Math.cos(rot) * ph, pw * 0.3, 0, TAU); ctx.fill(); } }
  },
  // a giant tortoise, facing right: a high domed shell in plates, a long neck, legs like pillars
  tortoise(ctx, w, h, r, { shell = '#5a5248', shellLit = '#8a8070', skin = '#4a463e' } = {}) {
    ctx.fillStyle = skin; for (const lx of [0.2, 0.34, 0.6, 0.72]) ctx.fillRect(lx * w, h * 0.66, w * 0.09, h * 0.34);
    ctx.strokeStyle = skin; ctx.lineWidth = h * 0.13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w * 0.72, h * 0.6); ctx.quadraticCurveTo(w * 0.84, h * 0.56, w * 0.88, h * 0.36); ctx.stroke(); ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(w * 0.91, h * 0.33, w * 0.075, h * 0.1, 0.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#1c1a18'; ctx.beginPath(); ctx.arc(w * 0.935, h * 0.31, w * 0.012, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(0, 0, w * 0.6, h); g.addColorStop(0, shellLit); g.addColorStop(1, shell); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.72); ctx.bezierCurveTo(w * 0.06, h * 0.2, w * 0.3, 0, w * 0.46, 0); ctx.bezierCurveTo(w * 0.66, 0, w * 0.82, h * 0.3, w * 0.8, h * 0.72); ctx.closePath(); ctx.fill(); ctx.save(); ctx.clip();
    ctx.strokeStyle = rgba('#1c1a18', 0.3); ctx.lineWidth = w * 0.012; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(w * (0.2 + i * 0.17), h * 0.5, w * 0.13, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(w * (0.28 + i * 0.17), h * 0.18, w * 0.11, 0, TAU); ctx.stroke(); } ctx.restore();
  },
  // a marine iguana, facing right: dark as the lava it lies on, a crest of spines down the back, salt on its head
  iguana(ctx, w, h, r, { col = '#33302c', lit = '#6a645c' } = {}) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h * 0.86); ctx.quadraticCurveTo(w * 0.2, h * 0.7, w * 0.36, h * 0.6); ctx.quadraticCurveTo(w * 0.6, h * 0.36, w * 0.8, h * 0.4); ctx.quadraticCurveTo(w, h * 0.42, w, h * 0.56); ctx.quadraticCurveTo(w * 0.9, h * 0.7, w * 0.76, h * 0.72); ctx.quadraticCurveTo(w * 0.5, h * 0.92, w * 0.3, h * 0.9); ctx.quadraticCurveTo(w * 0.1, h * 0.96, 0, h * 0.86); ctx.fill();
    for (let i = 0; i < 12; i++) { const u = 0.26 + i * 0.045, y = h * (0.66 - (u - 0.26) * 0.55); ctx.beginPath(); ctx.moveTo(u * w, y); ctx.lineTo((u + 0.012) * w, y - h * 0.16); ctx.lineTo((u + 0.035) * w, y - h * 0.01); ctx.fill(); }
    ctx.fillRect(w * 0.4, h * 0.8, w * 0.05, h * 0.2); ctx.fillRect(w * 0.66, h * 0.66, w * 0.05, h * 0.34); ctx.fillStyle = rgba('#ffffff', 0.5); ctx.beginPath(); ctx.ellipse(w * 0.88, h * 0.44, w * 0.06, h * 0.05, 0, 0, TAU); ctx.fill(); ctx.fillStyle = lit; ctx.fillRect(w * 0.45, h * 0.62, w * 0.25, h * 0.04);
  },
  // a blue-footed booby, standing
  booby(ctx, w, h, r, { foot = '#3fa8e0' } = {}) {
    ctx.fillStyle = foot; ctx.beginPath(); ctx.ellipse(w * 0.4, h * 0.95, w * 0.17, h * 0.05, 0, 0, TAU); ctx.ellipse(w * 0.66, h * 0.95, w * 0.17, h * 0.05, 0, 0, TAU); ctx.fill(); ctx.fillRect(w * 0.37, h * 0.78, w * 0.06, h * 0.16); ctx.fillRect(w * 0.6, h * 0.78, w * 0.06, h * 0.16);
    ctx.fillStyle = '#5a4636'; ctx.beginPath(); ctx.ellipse(w * 0.44, h * 0.56, w * 0.3, h * 0.27, -0.25, 0, TAU); ctx.fill(); ctx.fillStyle = '#f6f2ea'; ctx.beginPath(); ctx.ellipse(w * 0.54, h * 0.58, w * 0.2, h * 0.24, -0.15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e4d8c4'; ctx.beginPath(); ctx.ellipse(w * 0.56, h * 0.24, w * 0.17, h * 0.15, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba('#5a4636', 0.5); ctx.lineWidth = w * 0.02; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(w * (0.46 + i * 0.05), h * 0.13); ctx.lineTo(w * (0.44 + i * 0.05), h * 0.3); ctx.stroke(); }
    ctx.fillStyle = '#6a7a8a'; ctx.beginPath(); ctx.moveTo(w * 0.7, h * 0.18); ctx.lineTo(w, h * 0.3); ctx.lineTo(w * 0.7, h * 0.31); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.arc(w * 0.63, h * 0.21, w * 0.035, 0, TAU); ctx.fill(); ctx.fillStyle = '#1c1a18'; ctx.beginPath(); ctx.arc(w * 0.635, h * 0.21, w * 0.016, 0, TAU); ctx.fill();
  },
  // a sea lion hauled out on the rock, head up
  sealion(ctx, w, h, r, { col = '#7a5a40', lit = '#b08a62' } = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, lit); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, h * 0.9); ctx.quadraticCurveTo(w * 0.1, h * 0.62, w * 0.4, h * 0.6); ctx.quadraticCurveTo(w * 0.62, h * 0.56, w * 0.7, h * 0.2); ctx.quadraticCurveTo(w * 0.78, 0, w * 0.9, h * 0.1); ctx.quadraticCurveTo(w, h * 0.2, w * 0.92, h * 0.3); ctx.quadraticCurveTo(w * 0.9, h * 0.8, w * 0.72, h); ctx.lineTo(w * 0.1, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.95, w * 0.2, h * 0.07, -0.2, 0, TAU); ctx.ellipse(w * 0.06, h * 0.92, w * 0.1, h * 0.06, 0.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#1c1a18'; ctx.beginPath(); ctx.arc(w * 0.87, h * 0.17, w * 0.016, 0, TAU); ctx.arc(w * 0.975, h * 0.2, w * 0.02, 0, TAU); ctx.fill();
  },
  // a Sally Lightfoot crab: the brightest thing on a black shore
  crab(ctx, w, h, r, { col = '#e8442a', lit = '#ffb04a' } = {}) {
    ctx.strokeStyle = col; ctx.lineWidth = h * 0.11; ctx.lineCap = 'round'; for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + sd * w * 0.2, h * 0.55); ctx.quadraticCurveTo(w / 2 + sd * w * (0.34 + i * 0.06), h * (0.2 + i * 0.12), w / 2 + sd * w * (0.4 + i * 0.045), h * 0.98); ctx.stroke(); }
    const g = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.8); g.addColorStop(0, lit); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(w / 2, h * 0.55, w * 0.26, h * 0.3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7fd0e8'; ctx.beginPath(); ctx.ellipse(w / 2, h * 0.7, w * 0.16, h * 0.12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1c1a18'; ctx.fillRect(w * 0.42, h * 0.22, w * 0.04, h * 0.14); ctx.fillRect(w * 0.54, h * 0.22, w * 0.04, h * 0.14);
  },
  // a tree long dead and still standing: bare limbs, nothing else
  deadtree(ctx, w, h, r, { col = '#2a1c18', lit = '#5a4038' } = {}) {
    ctx.lineCap = 'round'; const limb = (x, y, a, len, wd, d) => { const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len, mx = (x + x1) / 2 + r.range(-0.08, 0.08) * len, my = (y + y1) / 2 + r.range(-0.08, 0.08) * len; ctx.strokeStyle = d % 2 ? col : mix(col, lit, 0.35); ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke(); if (d < 4) for (let i = 0, n = d < 2 ? 2 : r.int(1, 2); i < n; i++) limb(x1, y1, a + r.range(-0.9, 0.9) - 0.1 * Math.sign(Math.cos(a)), len * r.range(0.55, 0.75), wd * 0.62, d + 1); };
    limb(w * 0.5, h, -Math.PI / 2 + r.range(-0.15, 0.15), h * 0.34, w * 0.075, 0);
  },
  // a pine such as clings to rock: a bent trunk and flat, layered pads of needles
  pine(ctx, w, h, r, { col = '#2f5f3a', lit = '#7fb060', trunk = '#5a4034' } = {}) {
    const lean = r.range(-0.18, 0.18) * w; ctx.strokeStyle = trunk; ctx.lineWidth = w * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.quadraticCurveTo(w / 2 - lean, h * 0.6, w / 2 + lean, h * 0.2); ctx.stroke();
    for (let i = 0; i < 5; i++) { const y = h * (0.12 + i * 0.13), cx = w / 2 + lean * (1 - i * 0.35) + r.range(-0.12, 0.12) * w, pw = w * (0.2 + i * 0.07) * r.range(0.8, 1.15), g = ctx.createLinearGradient(0, y - h * 0.05, 0, y + h * 0.05); g.addColorStop(0, lit); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, y, pw, h * 0.05, r.range(-0.12, 0.12), 0, TAU); ctx.fill(); }
  },
  // a pillar of sandstone: blocks one on another, split by level joints and upright cracks, with green wherever a ledge will hold a root
  pillar(ctx, w, h, r, { col = '#b8a88a', lit = '#e4d6b4', shade = '#6f6a78', green = '#3f7a45', greenLit = '#8fc060', sunLeft = true } = {}) {
    const n = Math.max(4, Math.round(h / (w * 0.55))), hw = (v) => w * (0.3 + 0.12 * v + 0.05 * Math.sin(v * 9 + w)); let y = h;
    for (let i = 0; i < n; i++) { const v0 = 1 - i / n, bh = (h / n) * r.range(0.85, 1.15), bw = hw(v0) * r.range(0.9, 1.08), cx = w / 2 + r.range(-0.04, 0.04) * w, g = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0); g.addColorStop(0, sunLeft ? lit : shade); g.addColorStop(0.45, col); g.addColorStop(1, sunLeft ? shade : lit); ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(cx - bw, y - bh, bw * 2, bh + 0.05, w * 0.05); ctx.fill(); ctx.strokeStyle = rgba('#2a2430', 0.3); ctx.lineWidth = w * 0.012; for (let k = 0; k < 3; k++) { const x = cx + r.range(-0.8, 0.8) * bw; ctx.beginPath(); ctx.moveTo(x, y - bh * r.range(0.6, 1)); ctx.lineTo(x + r.range(-0.03, 0.03) * w, y - bh * r.range(0, 0.3)); ctx.stroke(); }
      ctx.fillStyle = rgba('#a0522a', 0.14); ctx.fillRect(cx - bw, y - bh * r.range(0.3, 0.7), bw * 2, bh * 0.12);      // a rust-stained bed
      if (r.chance(0.55)) for (let k = 0; k < 5; k++) { ctx.fillStyle = mix(green, greenLit, r.u()); ctx.beginPath(); ctx.ellipse(cx + (r.chance(0.5) ? -1 : 1) * bw * r.range(0.6, 1.05), y - bh + r.range(-0.03, 0.05) * w, w * r.range(0.06, 0.12), w * r.range(0.035, 0.06), 0, 0, TAU); ctx.fill(); }
      y -= bh; }
    for (let k = 0; k < 9; k++) { ctx.fillStyle = mix(green, greenLit, r.u()); ctx.beginPath(); ctx.ellipse(w / 2 + r.range(-1, 1) * hw(0) * 0.9, y + r.range(-0.02, 0.06) * w, w * r.range(0.08, 0.14), w * r.range(0.05, 0.08), 0, 0, TAU); ctx.fill(); }
  },
  // a macaque sitting
  macaque(ctx, w, h, r, { col = '#8a7458', lit = '#c0a888', face = '#e89a8a', arm = 0 } = {}) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(w * 0.46, h * 0.68, w * 0.3, h * 0.3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = lit; ctx.beginPath(); ctx.ellipse(w * 0.52, h * 0.72, w * 0.17, h * 0.2, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = w * 0.09; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w * 0.62, h * 0.56); ctx.lineTo(w * (0.74 + arm * 0.06), h * (0.84 - arm * 0.5)); ctx.moveTo(w * 0.3, h * 0.86); ctx.lineTo(w * 0.56, h * 0.95); ctx.moveTo(w * 0.2, h * 0.84); ctx.quadraticCurveTo(w * 0.02, h * 0.8, w * 0.08, h * 0.6); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(w * 0.54, h * 0.28, w * 0.2, 0, TAU); ctx.fill(); ctx.fillStyle = face; ctx.beginPath(); ctx.ellipse(w * 0.6, h * 0.31, w * 0.12, h * 0.12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1c1a18'; ctx.beginPath(); ctx.arc(w * 0.57, h * 0.28, w * 0.02, 0, TAU); ctx.arc(w * 0.66, h * 0.28, w * 0.02, 0, TAU); ctx.fill();
  },
  // a small pavilion with a curved roof, such as stands on a lookout
  pavilion(ctx, w, h, r, { roof = '#4a5a52', post = '#a83a2c', lamp = '#3a2c2a' } = {}) {
    ctx.fillStyle = post; for (const x of [0.24, 0.72]) ctx.fillRect(x * w, h * 0.45, w * 0.05, h * 0.5); ctx.fillStyle = lamp; ctx.fillRect(w * 0.42, h * 0.55, w * 0.16, h * 0.2); ctx.fillStyle = '#6a5a4a'; ctx.fillRect(w * 0.14, h * 0.93, w * 0.72, h * 0.07);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.quadraticCurveTo(w * 0.22, h * 0.42, w * 0.5, h * 0.08); ctx.quadraticCurveTo(w * 0.78, h * 0.42, w, h * 0.5); ctx.quadraticCurveTo(w * 0.5, h * 0.36, 0, h * 0.5); ctx.fill(); ctx.fillRect(w * 0.47, 0, w * 0.06, h * 0.12);
  },
  // a tree that has grown up in a wind that never stops: the trunk leans and everything green streams off to one side
  flagtree(ctx, w, h, r, { col = '#3f6a3a', lit = '#8fb858', trunk = '#4a3a30' } = {}) {
    ctx.strokeStyle = trunk; ctx.lineWidth = w * 0.045; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w * 0.22, h); ctx.quadraticCurveTo(w * 0.24, h * 0.55, w * 0.42, h * 0.3); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.lineWidth = w * 0.02; ctx.beginPath(); ctx.moveTo(w * (0.28 + i * 0.04), h * (0.55 - i * 0.07)); ctx.lineTo(w * (0.6 + i * 0.08), h * (0.42 - i * 0.08)); ctx.stroke(); }
    for (let i = 0; i < 80; i++) { const u = r.u(), x = w * (0.3 + 0.66 * u), y = h * (0.34 - 0.22 * u + r.range(-0.12, 0.12) * (1 - u * 0.5)); ctx.fillStyle = mix(col, lit, clamp(1 - y / (h * 0.5) + r.range(-0.2, 0.2), 0, 1)); ctx.beginPath(); ctx.ellipse(x, y, w * 0.07, w * 0.028, -0.3, 0, TAU); ctx.fill(); }
  },
  // the beetle that stands on its head on a dune crest in the morning fog and drinks what runs down its back
  beetle(ctx, w, h, r, { col = '#1e1a1c', lit = '#6a6470', leg = '#2a2224' } = {}) {
    ctx.save(); ctx.translate(w * 0.5, h * 0.62); ctx.rotate(-0.5); ctx.strokeStyle = leg; ctx.lineWidth = w * 0.035; ctx.lineCap = 'round';
    for (const [a, b, c] of [[-0.2, 0.3, 0.42], [0, 0.34, 0.36], [0.18, 0.4, 0.3]]) { ctx.beginPath(); ctx.moveTo(w * a, 0); ctx.lineTo(w * (a + 0.05), h * 0.16); ctx.lineTo(w * (a + b * 0.3), h * c); ctx.stroke(); }
    const g = ctx.createLinearGradient(0, -h * 0.3, 0, h * 0.12); g.addColorStop(0, lit); g.addColorStop(0.6, col); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-w * 0.04, -h * 0.04, w * 0.3, h * 0.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(w * 0.28, 0, w * 0.1, h * 0.1, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = w * 0.012; ctx.beginPath(); ctx.moveTo(-w * 0.3, -h * 0.05); ctx.lineTo(w * 0.2, -h * 0.05); ctx.stroke();
    ctx.fillStyle = 'rgba(220,240,255,0.9)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-w * 0.2 + i * w * 0.11, -h * (0.17 + 0.03 * Math.sin(i * 2)), w * 0.022, 0, TAU); ctx.fill(); } ctx.restore();
  },
  // a condor on the wind: long plank wings with the feathers at the tips spread like fingers, and a white collar
  condor(ctx, w, h, r, { col = '#1c1c22', lit = '#5a5a66', collar = '#f4f0e8', head = '#c88a7a' } = {}) {
    const cx = w * 0.5, cy = h * 0.55; ctx.fillStyle = col;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx, cy - h * 0.1); ctx.quadraticCurveTo(cx + s * w * 0.25, cy - h * 0.36, cx + s * w * 0.44, cy - h * 0.3);
      for (let i = 0; i < 5; i++) { const u = i / 4; ctx.lineTo(cx + s * w * (0.5 - u * 0.05), cy - h * (0.34 - u * 0.2) - h * 0.1); ctx.lineTo(cx + s * w * (0.43 - u * 0.03), cy - h * (0.22 - u * 0.2)); }
      ctx.quadraticCurveTo(cx + s * w * 0.2, cy + h * 0.12, cx, cy + h * 0.1); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = lit; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * w * 0.08, cy - h * 0.12); ctx.quadraticCurveTo(cx + s * w * 0.25, cy - h * 0.3, cx + s * w * 0.4, cy - h * 0.26); ctx.quadraticCurveTo(cx + s * w * 0.25, cy - h * 0.18, cx + s * w * 0.08, cy - h * 0.02); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.07, h * 0.2, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - w * 0.06, cy + h * 0.14); ctx.lineTo(cx, cy + h * 0.38); ctx.lineTo(cx + w * 0.06, cy + h * 0.14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = collar; ctx.beginPath(); ctx.ellipse(cx, cy - h * 0.17, w * 0.05, h * 0.05, 0, 0, TAU); ctx.fill(); ctx.fillStyle = head; ctx.beginPath(); ctx.ellipse(cx, cy - h * 0.25, w * 0.03, h * 0.06, 0, 0, TAU); ctx.fill();
  },
  // a guanaco, the wild cousin of the llama: cinnamon above and white below, a long straight neck, a grey face, and ears that are never still
  guanaco(ctx, w, h, r, { col = '#c98f5c', pale = '#f6efe2', dark = '#8a6244', face = '#8a7c78', graze = 0, top = 0.1, spots = null, antler = null, rump = null } = {}) {
    const leg = (x, top, bend, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(w * (x - 0.034), h * top); ctx.lineTo(w * (x + 0.034), h * top); ctx.lineTo(w * (x + bend + 0.016), h * 0.8); ctx.lineTo(w * (x + 0.014), h * 0.985); ctx.lineTo(w * (x - 0.02), h * 0.985); ctx.lineTo(w * (x + bend - 0.018), h * 0.8); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3a2e2a'; ctx.fillRect(w * (x - 0.022), h * 0.965, w * 0.04, h * 0.03); };
    leg(0.3, 0.55, -0.02, dark); leg(0.62, 0.55, 0.012, dark);
    // the neck, thick at the shoulder and slim under the jaw
    const hx = lerp(0.76, 0.9, graze), hy = lerp(top, 0.84, graze); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(w * 0.56, h * 0.42); ctx.quadraticCurveTo(w * lerp(0.66, 0.74, graze), h * lerp(0.3, 0.5, graze), w * (hx - 0.035), h * (hy + 0.02)); ctx.lineTo(w * (hx + 0.03), h * (hy + 0.07)); ctx.quadraticCurveTo(w * lerp(0.76, 0.84, graze), h * lerp(0.4, 0.62, graze), w * 0.7, h * 0.58); ctx.closePath(); ctx.fill();
    ctx.fillStyle = pale; ctx.beginPath(); ctx.moveTo(w * 0.7, h * 0.58); ctx.quadraticCurveTo(w * lerp(0.77, 0.84, graze), h * lerp(0.42, 0.63, graze), w * (hx + 0.03), h * (hy + 0.07)); ctx.lineTo(w * (hx + 0.005), h * (hy + 0.06)); ctx.quadraticCurveTo(w * lerp(0.73, 0.8, graze), h * lerp(0.42, 0.6, graze), w * 0.66, h * 0.6); ctx.closePath(); ctx.fill();
    // the body, and the white of the belly and the insides of the legs
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(w * 0.46, h * 0.5, w * 0.27, h * 0.135, -0.06, 0, TAU); ctx.fill(); ctx.fillStyle = pale; ctx.beginPath(); ctx.ellipse(w * 0.47, h * 0.57, w * 0.22, h * 0.062, -0.04, 0, TAU); ctx.fill();
    leg(0.25, 0.52, -0.03, col); leg(0.67, 0.54, 0.008, col); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(w * 0.27, h * 0.5, w * 0.1, h * 0.13, 0.25, 0, TAU); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = w * 0.035; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.42); ctx.quadraticCurveTo(w * 0.14, h * 0.42, w * 0.15, h * 0.5); ctx.stroke();
    if (spots) { ctx.fillStyle = spots; for (let i = 0; i < 11; i++) { ctx.beginPath(); ctx.arc(w * (0.27 + r.u() * 0.38), h * (0.41 + r.u() * 0.1), w * 0.011, 0, TAU); ctx.fill(); } }
    if (rump) { ctx.fillStyle = rump; ctx.beginPath(); ctx.ellipse(w * 0.2, h * 0.48, w * 0.045, h * 0.07, 0.2, 0, TAU); ctx.fill(); }
    if (antler) { ctx.strokeStyle = antler; ctx.lineWidth = w * 0.018; ctx.lineCap = 'round'; for (const e of [-0.01, 0.03]) { ctx.beginPath(); ctx.moveTo(w * (hx + e), h * (hy + 0.005)); ctx.quadraticCurveTo(w * (hx + e - 0.05), h * (hy - 0.1), w * (hx + e - 0.02), h * (hy - 0.2)); ctx.moveTo(w * (hx + e - 0.035), h * (hy - 0.09)); ctx.lineTo(w * (hx + e + 0.03), h * (hy - 0.14)); ctx.stroke(); } }
    // the head: small, grey in the face, with long ears
    ctx.fillStyle = col; for (const e of [-0.018, 0.022]) { ctx.beginPath(); ctx.moveTo(w * (hx + e - 0.014), h * (hy + 0.01)); ctx.lineTo(w * (hx + e - 0.012 - graze * 0.02), h * (hy - 0.07)); ctx.lineTo(w * (hx + e + 0.016), h * (hy + 0.005)); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = face; ctx.beginPath(); ctx.ellipse(w * (hx + 0.035), h * (hy + 0.035), w * 0.065, h * 0.036, 0.25 + graze * 0.7, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2224'; ctx.beginPath(); ctx.arc(w * (hx + 0.03), h * (hy + 0.022), w * 0.011, 0, TAU); ctx.fill();
  },
  deer(ctx, w, h, r, o = {}) { P.guanaco(ctx, w, h, r, { col: '#8a6248', pale: '#e8dccc', dark: '#5a4034', face: '#7a5a48', top: 0.25, ...o }); },
  // one of the old cedars: a trunk as wide as a house at the root, bark in long grey-red fibres, moss to the height of a man, and the first boughs a long way up
  cedar(ctx, w, h, r, { bark = '#7a5a4c', lit = '#b89a84', dark = '#3a2a26', moss = '#5f9a3c', mossLit = '#b4e060', leaf = '#2f5f3a', leafLit = '#6fa850' } = {}) {
    const cx = w * 0.5, tw = w * r.range(0.15, 0.19), lean = r.range(-0.04, 0.04) * w;
    // boughs first, so the trunk stands in front of where they leave it
    for (let i = 0; i < 6; i++) { const y = h * (0.04 + i * 0.075 + r.range(-0.01, 0.01)), sd = i % 2 ? 1 : -1, len = w * r.range(0.22, 0.34), ex = cx + lean + sd * (tw + len), ey = y - h * r.range(0.0, 0.03);
      ctx.strokeStyle = dark; ctx.lineWidth = w * 0.03; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + lean, y + h * 0.02); ctx.quadraticCurveTo(cx + lean + sd * tw, y + h * 0.015, ex, ey); ctx.stroke();
      for (let k = 0; k < 9; k++) { const u = r.u(), fx = lerp(cx + lean + sd * tw * 1.3, ex + sd * w * 0.03, u) + r.range(-0.04, 0.04) * w, fy = lerp(y, ey, u) + r.range(-0.012, 0.02) * h; ctx.fillStyle = mix(leaf, leafLit, r.u() * (1 - i / 7)); ctx.beginPath(); ctx.ellipse(fx, fy, w * r.range(0.06, 0.1), h * r.range(0.012, 0.02), r.range(-0.3, 0.3), 0, TAU); ctx.fill(); } }
    // the trunk: flared at the root, a little out of true
    const path = () => { ctx.beginPath(); ctx.moveTo(cx - w * 0.48, h); ctx.bezierCurveTo(cx - w * 0.3, h * 0.94, cx - tw * 1.25, h * 0.84, cx - tw * 1.1 + lean * 0.3, h * 0.6); ctx.lineTo(cx - tw * 0.9 + lean, 0); ctx.lineTo(cx + tw * 0.9 + lean, 0); ctx.lineTo(cx + tw * 1.1 + lean * 0.3, h * 0.6); ctx.bezierCurveTo(cx + tw * 1.25, h * 0.84, cx + w * 0.3, h * 0.94, cx + w * 0.48, h); ctx.closePath(); };
    const g = ctx.createLinearGradient(cx - tw * 1.4, 0, cx + tw * 1.4, 0); g.addColorStop(0, lit); g.addColorStop(0.45, bark); g.addColorStop(1, dark); ctx.fillStyle = g; path(); ctx.fill();
    ctx.save(); path(); ctx.clip();
    for (let i = 0; i < 34; i++) { const x = cx + r.range(-1.3, 1.3) * tw, y0 = h * r.range(0, 0.8), len = h * r.range(0.08, 0.3), sw = r.range(-0.012, 0.012) * w; ctx.strokeStyle = rgba(r.chance(0.5) ? dark : lit, r.range(0.2, 0.5)); ctx.lineWidth = w * r.range(0.006, 0.014); ctx.beginPath(); ctx.moveTo(x, y0); ctx.bezierCurveTo(x + sw, y0 + len * 0.3, x - sw, y0 + len * 0.7, x + sw * 0.5 + (x - cx) * 0.1, y0 + len); ctx.stroke(); }
    for (let i = 0; i < 3; i++) { const bx = cx + r.range(-0.8, 0.8) * tw, by = h * r.range(0.3, 0.75); ctx.fillStyle = rgba(dark, 0.55); ctx.beginPath(); ctx.ellipse(bx, by, w * 0.03, h * 0.012, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = rgba(lit, 0.5); ctx.lineWidth = w * 0.008; ctx.beginPath(); ctx.ellipse(bx, by, w * 0.045, h * 0.02, 0, 0, TAU); ctx.stroke(); }
    // moss, thickest at the root and on the weather side
    for (let i = 0; i < 46; i++) { const u = r.u(), y = h * (1 - u * u * 0.5), x = cx + r.range(-1, 0.6) * (tw * 1.2 + (y / h - 0.6) * w * 0.7); ctx.fillStyle = rgba(mix(moss, mossLit, r.u() * 0.7), 0.85); ctx.beginPath(); ctx.ellipse(x, y, w * r.range(0.03, 0.07), h * r.range(0.006, 0.014), r.range(-0.4, 0.4), 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a cedar as the far slopes show it: a spire of drooping tiers
  sugi(ctx, w, h, r, { col = '#2f5f3a', lit = '#6fa850', trunk = '#4a3a30' } = {}) {
    ctx.fillStyle = trunk; ctx.fillRect(w * 0.47, h * 0.5, w * 0.06, h * 0.5); const n = 7;
    for (let i = n - 1; i >= 0; i--) { const u = i / (n - 1), y = h * (0.05 + u * 0.72), hw = w * (0.1 + u * 0.36) * r.range(0.85, 1.1); ctx.fillStyle = mix(lit, col, 0.25 + u * 0.75); ctx.beginPath(); ctx.moveTo(w * 0.5, y - h * 0.1); ctx.quadraticCurveTo(w * 0.5 + hw * 0.5, y, w * 0.5 + hw, y + h * 0.1); ctx.quadraticCurveTo(w * 0.5, y + h * 0.04, w * 0.5 - hw, y + h * 0.1); ctx.quadraticCurveTo(w * 0.5 - hw * 0.5, y, w * 0.5, y - h * 0.1); ctx.fill(); }
  },
  // what is left of a cedar cut down long ago: hollow, roofless, green all over, big enough to stand in
  stump(ctx, w, h, r, { bark = '#6a4c40', lit = '#a88a74', dark = '#2a1c1a', moss = '#5f9a3c', mossLit = '#b4e060' } = {}) {
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, lit); g.addColorStop(0.5, bark); g.addColorStop(1, dark); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, h); ctx.quadraticCurveTo(w * 0.14, h * 0.8, w * 0.17, h * 0.3);
    const n = 9; for (let i = 0; i <= n; i++) ctx.lineTo(w * (0.17 + (0.66 * i) / n), h * (i % 2 ? r.range(0.02, 0.14) : r.range(0.16, 0.3))); ctx.quadraticCurveTo(w * 0.86, h * 0.8, w, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(w * 0.4, h); ctx.quadraticCurveTo(w * 0.38, h * 0.45, w * 0.5, h * 0.42); ctx.quadraticCurveTo(w * 0.62, h * 0.45, w * 0.6, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(dark, 0.4); ctx.lineWidth = w * 0.012; for (let i = 0; i < 10; i++) { const x = w * r.range(0.14, 0.86); ctx.beginPath(); ctx.moveTo(x, h * r.range(0.3, 0.5)); ctx.lineTo(x + r.range(-0.03, 0.03) * w, h * 0.98); ctx.stroke(); }
    for (let i = 0; i < 26; i++) { const x = w * r.range(0.04, 0.96), y = r.chance(0.5) ? h * r.range(0.14, 0.34) : h * r.range(0.8, 1); ctx.fillStyle = rgba(mix(moss, mossLit, r.u() * 0.8), 0.9); ctx.beginPath(); ctx.ellipse(x, y, w * r.range(0.04, 0.09), h * r.range(0.03, 0.06), 0, 0, TAU); ctx.fill(); }
  },
  // toadstools in the moss
  shroom(ctx, w, h, r, { cap = '#d8603c', lit = '#ffb080', stem = '#f4ead8', dot = '#fff6e0' } = {}) {
    for (const [x, s] of [[0.3, 1], [0.62, 0.72], [0.82, 0.5]]) { const hh = h * s, cw = w * 0.2 * s; ctx.fillStyle = stem; ctx.fillRect(w * x - cw * 0.16, h - hh * 0.7, cw * 0.32, hh * 0.7); const g = ctx.createLinearGradient(0, h - hh, 0, h - hh * 0.55); g.addColorStop(0, lit); g.addColorStop(1, cap); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * x - cw, h - hh * 0.6); ctx.quadraticCurveTo(w * x, h - hh * 1.3, w * x + cw, h - hh * 0.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = dot; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(w * x + (i - 1) * cw * 0.5, h - hh * (0.72 + (i % 2) * 0.1), cw * 0.09, 0, TAU); ctx.fill(); } }
  },
};

// Make `n` different sprites with one painter.
export function variants(n, seed, w, h, painter, opt = {}, sOpt = {}) {
  const out = []; for (let i = 0; i < n; i++) { const r = new RNG(seed + ':' + i), ww = typeof w === 'function' ? w(r) : w, hh = typeof h === 'function' ? h(r) : h; out.push(sprite(ww, hh, (ctx) => painter(ctx, ww, hh, r, typeof opt === 'function' ? opt(r, i) : opt), sOpt)); } return out;
}
