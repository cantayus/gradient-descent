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
export function sprite(w, h, paint, { ax = 0.5, ay = 1, ppu = PPU, blur = 0 } = {}) {
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
  quad(ctx, w, h, r, { col = '#6a4a35', dark = '#3a2a22', mane = null, neck = 0.5, head = 0.2, tail = 0.5, graze = 0, wool = false } = {}) {
    const by = h * 0.5; ctx.fillStyle = dark; for (const lx of [0.27, 0.36, 0.64, 0.73]) ctx.fillRect(lx * w - w * 0.025, by, w * 0.055, h * 0.5);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(w * 0.5, by, w * 0.3, h * 0.2, 0, 0, TAU); ctx.fill();
    const nx = w * 0.74, ny = by - h * 0.06, hx = nx + w * 0.12 * (1 - graze * 0.2), hy = lerp(by - h * neck * 0.7, by + h * 0.3, graze);
    ctx.strokeStyle = col; ctx.lineWidth = w * 0.115; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(nx - w * 0.03, ny); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(hx + w * 0.055, hy + h * 0.03, w * head * 0.55, h * 0.085, 0.55 - graze * 0.4, 0, TAU); ctx.fill();
    if (mane) { ctx.strokeStyle = mane; ctx.lineWidth = w * 0.05; ctx.beginPath(); ctx.moveTo(nx - w * 0.08, ny - h * 0.05); ctx.lineTo(hx - w * 0.04, hy - h * 0.04); ctx.stroke(); }
    ctx.strokeStyle = mane || dark; ctx.lineWidth = w * 0.04; ctx.beginPath(); ctx.moveTo(w * 0.21, by - h * 0.08); ctx.quadraticCurveTo(w * (0.13 - tail * 0.12), by + h * 0.04, w * (0.15 - tail * 0.1), by + h * 0.32); ctx.stroke();
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
  // a fairy chimney: a cone of soft pale rock under a cap of harder, darker stone. People have cut rooms into many of them, so some have a door and windows.
  chimney(ctx, w, h, r, { col = '#e6d2ae', lit = '#fbeecf', shade = '#b89a80', cap = '#6a5a52', capLit = '#9a8878', win = null, rooms = 0 } = {}) {
    const top = h * 0.2, bw = w * r.range(0.4, 0.48), nw = w * r.range(0.11, 0.16), bulge = r.range(0.02, 0.07) * w;
    ctx.beginPath(); ctx.moveTo(w / 2 - bw, h); ctx.bezierCurveTo(w / 2 - bw * 0.8 - bulge, h * 0.62, w / 2 - nw * 1.6, h * 0.4, w / 2 - nw, top); ctx.lineTo(w / 2 + nw, top); ctx.bezierCurveTo(w / 2 + nw * 1.6, h * 0.4, w / 2 + bw * 0.8 + bulge, h * 0.62, w / 2 + bw, h); ctx.closePath();
    const g = ctx.createLinearGradient(w / 2 - bw, 0, w / 2 + bw, 0); g.addColorStop(0, lit); g.addColorStop(0.45, col); g.addColorStop(1, shade); ctx.fillStyle = g; ctx.fill(); ctx.save(); ctx.clip();
    // the rock is laid down in beds, and rain has cut flutes down it
    for (let i = 0; i < 5; i++) { ctx.fillStyle = rgba(i % 2 ? '#ffffff' : shade, 0.16); const y = top + (h - top) * r.range(0.1, 0.95); ctx.beginPath(); ctx.ellipse(w / 2, y, w, h * r.range(0.012, 0.03), r.range(-0.05, 0.05), 0, TAU); ctx.fill(); }
    ctx.strokeStyle = rgba(shade, 0.5); ctx.lineWidth = w * 0.012; ctx.lineCap = 'round'; for (let i = 0; i < 9; i++) { const x = w / 2 + r.range(-1, 1) * bw * 0.8, y0 = top + (h - top) * r.range(0.15, 0.6); ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + r.range(-0.03, 0.03) * w, (y0 + h) / 2, x + (x - w / 2) * 0.25, h); ctx.stroke(); }
    if (rooms) { const dark = win || '#3a2c2a'; ctx.fillStyle = dark; const dw = w * 0.11, dh = h * 0.13; ctx.beginPath(); ctx.roundRect(w / 2 - dw / 2 + r.range(-0.08, 0.08) * w, h - dh, dw, dh * 1.2, [dw / 2, dw / 2, 0, 0]); ctx.fill();
      for (let i = 0; i < rooms; i++) { const y = h * r.range(0.42, 0.78), x = w / 2 + r.range(-0.5, 0.5) * bw * (y / h), s = w * r.range(0.05, 0.075); ctx.beginPath(); ctx.roundRect(x - s / 2, y - s * 0.7, s, s * 1.3, [s / 2, s / 2, 0, 0]); ctx.fill(); }
      ctx.fillStyle = rgba(shade, 0.8); for (let i = 0; i < 6; i++) ctx.fillRect(w / 2 + r.range(-0.3, 0.3) * bw, h * r.range(0.3, 0.42), w * 0.022, w * 0.022); }      // pigeon holes, high up
    ctx.restore();
    // the cap
    const cw = nw * r.range(1.9, 2.6), ch = h * r.range(0.15, 0.2); ctx.beginPath(); ctx.moveTo(w / 2 - cw, top + ch * 0.25); ctx.quadraticCurveTo(w / 2 - cw * 0.9, top - ch * 0.5, w / 2 + r.range(-0.2, 0.2) * cw, top - ch); ctx.quadraticCurveTo(w / 2 + cw * 0.9, top - ch * 0.5, w / 2 + cw, top + ch * 0.25); ctx.quadraticCurveTo(w / 2, top + ch * 0.5, w / 2 - cw, top + ch * 0.25); ctx.closePath();
    const cg = ctx.createLinearGradient(w / 2 - cw, 0, w / 2 + cw, 0); cg.addColorStop(0, capLit); cg.addColorStop(1, cap); ctx.fillStyle = cg; ctx.fill();
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
};

// Make `n` different sprites with one painter.
export function variants(n, seed, w, h, painter, opt = {}, sOpt = {}) {
  const out = []; for (let i = 0; i < n; i++) { const r = new RNG(seed + ':' + i), ww = typeof w === 'function' ? w(r) : w, hh = typeof h === 'function' ? h(r) : h; out.push(sprite(ww, hh, (ctx) => painter(ctx, ww, hh, r, typeof opt === 'function' ? opt(r, i) : opt), sOpt)); } return out;
}
