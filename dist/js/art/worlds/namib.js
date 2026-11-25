// The Namib: a sea of red dunes, white clay pans where rivers end, trees that died centuries ago and are still standing, oryx, fog off the cold sea at dawn,
// and at night more stars than anywhere.
import { RNG } from '../../core/rng.js';
import { P, variants, sprite, mix, rgba } from '../paint.js';
import { tones, lamps, stock } from './kit.js';

const TIMES = {
  dawn:   { wash: [{ x: 0.72, y: 0.42, r: 0.9, col: '#ff8a5a', a: 0.5 }, { x: 0.1, y: 0.06, r: 0.8, col: '#3a4ab8', a: 0.36 }, { x: 0.72, y: 0.55, r: 0.5, col: '#ffe08a', a: 0.5 }], sky: ['#343c8a', '#8a70b0', '#f59a70', '#ffe0a4'], skyAt: [0, 0.4, 0.76, 1], sun: { x: 0.72, y: 0.36, r: 0.038, col: '#fff3d6', glow: '#ffa860' }, bloom: 0.42, haze: '#f6c098', shade: '#4a2c50', dark: 0.1, mist: 0.4, shafts: 0.07, tint: 'rgba(255,150,100,0.16)', rim: '#ffd8a8', snow: '#ffffff', water: '#7a9ab0', cloud: 0.5 },
  day:    { wash: [{ x: 0.8, y: 0.12, r: 0.7, col: '#fff3c0', a: 0.3 }, { x: 0.1, y: 0.85, r: 0.9, col: '#ffc890', a: 0.34 }, { x: 0.3, y: 0.02, r: 0.8, col: '#0e48d0', a: 0.36 }], sky: ['#1c5cc8', '#5a9ee8', '#c4dcf0', '#f8e4c8'], skyAt: [0, 0.42, 0.82, 1], sun: { x: 0.8, y: 0.12, r: 0.03, col: '#fffbe8', glow: '#fff0b8' }, haze: '#f0d8b8', shade: '#3a2030', dark: 0, mist: 0.1, shafts: 0.03, tint: 'rgba(255,220,170,0.12)', rim: '#fff4e0', snow: '#ffffff', water: '#7a9ab0', cloud: 0.35 },
  golden: { wash: [{ x: 0.2, y: 0.4, r: 0.85, col: '#ff7a2c', a: 0.55 }, { x: 0.88, y: 0.1, r: 0.9, col: '#5060d0', a: 0.36 }, { x: 0.55, y: 0.78, r: 0.7, col: '#ffc070', a: 0.42 }], sky: ['#3a58a0', '#98a0c8', '#f8b86a', '#ffe4a4'], skyAt: [0, 0.45, 0.82, 1], sun: { x: 0.2, y: 0.38, r: 0.042, col: '#fff0c4', glow: '#ffa84a' }, bloom: 0.42, haze: '#ffc88a', shade: '#55243a', dark: 0.05, mist: 0.2, shafts: 0.09, tint: 'rgba(255,150,60,0.2)', rim: '#ffe0a0', snow: '#ffffff', water: '#7a9ab0', cloud: 0.4 },
  dusk:   { wash: [{ x: 0.26, y: 0.5, r: 0.85, col: '#ff5a6e', a: 0.52 }, { x: 0.88, y: 0.16, r: 0.9, col: '#2a2aa0', a: 0.42 }, { x: 0.6, y: 0.8, r: 0.6, col: '#ffa860', a: 0.42 }], sky: ['#181848', '#523a84', '#d8647a', '#ffa868'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.26, y: 0.46, r: 0.042, col: '#ffe1c0', glow: '#ff8050' }, haze: '#d88a8a', shade: '#2a1840', dark: 0.24, mist: 0.2, shafts: 0.05, tint: 'rgba(255,110,120,0.16)', rim: '#ffc0a8', snow: '#ffffff', water: '#5a5a8a', stars: 0.4, aura: 0.38, cloud: 0.35 },
  // the darkest sky there is: no town for a long way in any direction
  night:  { wash: [{ x: 0.5, y: 0.98, r: 0.7, col: '#a0502c', a: 0.2 }, { x: 0.2, y: 0.15, r: 0.5, col: '#3a5fd8', a: 0.3 }, { x: 0.85, y: 0.3, r: 0.6, col: '#5a2f9a', a: 0.32 }], sky: ['#04061a', '#0a1238', '#17234e', '#2a3660'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.24, y: 0.14, r: 0.028, col: '#f6f4e8', glow: '#aebcff', moon: true }, haze: '#202c58', shade: '#080a24', dark: 0.55, mist: 0.12, tint: 'rgba(90,120,255,0.14)', rim: '#c8d0ff', snow: '#ffffff', water: '#1c2850', stars: 1.25, cloud: 0.12, aura: 0.5, vignette: 0.5 },
  // fog: on many mornings it rolls in off the cold Atlantic and lies between the dunes until the sun burns it away
  mist:   { wash: [{ x: 0.5, y: 0.6, r: 0.9, col: '#f6ece0', a: 0.36 }, { x: 0.2, y: 0.2, r: 0.6, col: '#b0b8d0', a: 0.3 }], sky: ['#8f98b0', '#bcc0cc', '#ece4dc'], bow: true, haze: '#e4d8cc', shade: '#4a3440', dark: 0.08, mist: 0.6, cloud: 0.6, tint: 'rgba(240,220,200,0.12)', rim: '#ffffff', snow: '#ffffff', water: '#8a9aa8' },
};

export const namib = {
  id: 'namib', name: 'Namib', zone: 'dune', times: TIMES, dustCol: '#ffd9a8',
  note: 'The Namib is among the oldest deserts on Earth. Some of its dunes stand more than three hundred metres high.',

  far(time) {
    const t = tones(time);
    return [
      { par: 0.012, scale: 1.3, base: 0.47, amp: 0.08, style: 'round', seed: 6, col: mix('#ffffff', time.haze, 0.5), haze: 0.1, lit: 0.14, facet: 0, rimA: 0.5, foot: 0.9 },
      // mountains of bare rock at the desert's inland edge
      { par: 0.022, scale: 1.1, base: 0.5, amp: 0.18, style: 'table', seed: 14, col: t('#7a6aa8'), haze: 0.42, lit: 0.1, ribs: 0.18, ribGap: 1.2, bands: [{ col: t('#a888b8'), a: 0.4, at: 0.3, th: 0.2, w: 0.2, f: 2, s: 3 }] },
      // the dune sea: crest behind crest, one face in the sun and one in shadow, as dunes always are
      { par: 0.05, scale: 0.8, base: 0.56, amp: 0.16, style: 'dune', seed: 22, col: t('#d9683a'), haze: 0.26, lit: 0.2, facet: 2.4, rimA: 0.5, foot: 0.7 },
      { par: 0.09, scale: 0.62, base: 0.63, amp: 0.15, style: 'dune', seed: 35, col: t('#e2733a'), haze: 0.16, lit: 0.2, facet: 2.6, rimA: 0.55, foot: 0.55,
        stamps: [{ s: '-', kind: 'flock', every: 1.2, p: 0.5, size: 0.014, seed: 3, n: 4, sink: -0.08 }] },
      // the pan: white clay, cracked, with the dead trees standing in it and oryx crossing
      { par: 0.16, scale: 0.5, base: 0.7, amp: 0.1, style: 'dune', seed: 49, col: t('#c9562c'), haze: 0.1, lit: 0.18, facet: 2.4, foot: 0.35,
        bands: [{ col: t('#f4ecda'), a: 0.95, at: 0.5, th: 0.2, w: 0.06, f: 1.2, s: 4, glint: 10 }, { col: t('#d8b858'), a: 0.5, at: 0.34, th: 0.08, w: 0.08, f: 4, s: 8 }],
        stamps: [{ s: 'deadtreeFar', every: 0.12, p: 0.55, size: 0.06, seed: 5, drop: [0.52, 0.66] }, { s: 'oryxFar', kind: 'graze', every: 0.3, p: 0.5, size: 0.04, seed: 7, drop: [0.5, 0.68], roam: 1.6, speed: 0.04 }, { s: 'acaciaFar', every: 0.26, p: 0.45, size: 0.06, seed: 9, drop: [0.3, 0.44] }, { s: 'tuftFar', every: 0.05, p: 0.5, size: 0.03, seed: 11, drop: [0.3, 0.46] }] },
      { par: 0.3, scale: 0.44, base: 0.8, amp: 0.14, style: 'dune', seed: 67, col: t('#a8401f'), haze: 0.04, lit: 0.16, facet: 2.4, foot: 0.25,
        bands: [{ col: t('#d8b858'), a: 0.55, at: 0.5, th: 0.12, w: 0.1, f: 4, s: 5 }],
        stamps: [{ s: 'tuftFar', every: 0.03, p: 0.55, size: 0.04, seed: 21, drop: [0.4, 0.7] }, { s: 'deadtreeFar', every: 0.2, p: 0.45, size: 0.1, seed: 23, drop: [0.45, 0.6] }, { s: 'rockFar', every: 0.14, p: 0.4, size: 0.05, seed: 25, drop: [0.5, 0.7] }, { s: 'oryxFar', kind: 'graze', every: 0.4, p: 0.5, size: 0.065, seed: 27, drop: [0.45, 0.6], roam: 1.2, speed: 0.04 }] },
    ];
  },
  behind: [
    { s: 'deadtree', every: 9, p: 0.5, size: 1, seed: 801, sink: 0.1, zone: ['pan', 'gravel'] },
    { s: 'acacia', every: 13, p: 0.5, size: 1, seed: 805, sink: 0.15, zone: ['grassy', 'gravel'] },
    { s: 'rockBig', every: 11, p: 0.35, size: 1, seed: 809, sink: 0.5, zone: ['gravel', 'grassy', 'dune'] },
    { s: 'oryx', frames: ['oryx', 'oryxB'], fps: 0.5, every: 29, p: 0.6, size: 1, seed: 813, sink: 0.04, zone: ['pan', 'grassy', 'gravel'], roam: 2, speed: 0.06 },
    { s: 'welw', every: 15, p: 0.45, size: 1, seed: 817, sink: 0.05, zone: ['gravel', 'dune'] },
  ],
  ground(time) {
    const t = tones(time), band = (a, b, c, w = [1, 0.46, 0.13]) => ({ bands: [{ col: t(a), w: w[0] }, { col: t(b), w: w[1] }, { col: t(c), w: w[2] }] });
    return {
      body: [t('#9a4a2a'), t('#6a2e22'), t('#32181c')],
      // sand laid down by the wind in sloping sheets
      strata: [{ col: t('#e08a52'), a: 0.4, w: 0.1, d: 1.2, follow: 0.94, f: 0.3, seed: 3, wob: 0.4 }, { col: t('#5a241c'), a: 0.4, w: 0.16, d: 2.4, follow: 0.86, f: 0.22, seed: 5, wob: 0.7 }, { col: t('#c96a3a'), a: 0.35, w: 0.08, d: 3.8, follow: 0.76, f: 0.3, seed: 7, wob: 0.9 }, { col: t('#f0e2c8'), a: 0.3, w: 0.2, d: 5.6, follow: 0.6, f: 0.18, seed: 9, wob: 1.1 }],
      embed: { s: 'stone', every: 2.2, p: 0.35, a: 0.45 },
      skin: {
        dune: band('#b8482a', '#e2733a', '#f8ac64'), soft: band('#d98a4a', '#f2bc7c', '#ffe4b4'), pan: band('#c4b8a4', '#eee4d0', '#fffaf0', [0.7, 0.3, 0.09]), gravel: band('#5e4e48', '#94806e', '#c8b8a4', [0.8, 0.3, 0.08]), grassy: band('#a8883a', '#dcbc5c', '#f6e490'),
      },
      decor: {
        dune: [{ s: 'ripple', p: 0.5, size: 1, sink: 0.02, steep: 1.4 }, { s: 'tuftDry', p: 0.06, size: 1, sway: 0.08 }],
        soft: [{ s: 'ripple', p: 0.8, size: 1, sink: 0.02, steep: 1.4 }],
        pan: [{ s: 'crack', p: 0.7, size: 1, sink: -0.01 }, { s: 'pebble', p: 0.1, size: 0.8, sink: 0.03 }],
        gravel: [{ s: 'pebble', p: 0.6, size: 1, sink: 0.03 }, { s: 'rock', p: 0.16, size: 1, sink: 0.08 }, { s: 'tuftDry', p: 0.14, size: 1, sway: 0.08 }],
        grassy: [{ s: 'tuftDry', p: 0.9, size: 1.1, sway: 0.09 }, { s: 'tuftDry', p: 0.5, size: 0.8, sway: 0.09 }, { s: 'pebble', p: 0.2, size: 1, sink: 0.03 }, { s: 'devil', p: 0.12, size: 1, sway: 0.05 }],
      },
    };
  },
  lives: { every: 9, p: 0.4, zones: ['grassy'], cols: ['#ffffff', '#ffe37a'] },
  fore: [
    { s: 'foreRock', par: 1.5, every: 23, p: 0.4, size: 1, seed: 901, sink: 0.45, a: 1 },
    { s: 'foreGrass', par: 1.7, every: 5, p: 0.55, size: 1, seed: 905, sink: 0.2, a: 0.95 },
  ],
  // grains of sand on the air, always
  ambient(time) { return [{ n: time.stars > 0.5 ? 14 : 46, col: time.stars > 0.5 ? '#c8d0ff' : '#ffe0b0', size: 1.4, speed: 0.004, drift: 0.05, a: 0.45, par: 0.5, sway: 6 }]; },
  // It almost never rains. The weather here is wind, the sand it carries, the fog that comes in from the sea before dawn, and a sky that is clear at night.
  weather(key) {
    return { dawn: { wet: 0, fog: 0.75, wind: 1.2, gust: 1 }, day: { wet: 0.04, fog: 0.04, wind: 2.4, gust: 2.2 }, golden: { wet: 0.04, fog: 0.08, wind: 2, gust: 2 }, dusk: { wet: 0.04, fog: 0.12, wind: 2.2, gust: 2.2 },
      night: { wet: 0, fog: 0.06, wind: 1.2, clear: 0.15 }, mist: { wet: 0.1, fog: 1, wind: 0.9, gust: 0.8, early: true } }[key] || {};
  },

  sprites(time) {
    const t = tones(time), v = variants;
    const S = stock(time, 'nam-', { rock: ['#6a3a30', '#5a2e28', '#7a4a3a'], rockLit: '#c88a68', stone: ['#7a3a2a', '#b06a48'], near: '#1c0e14', cloudUnder: '#d8b8a8', nestBloom: { kind: 'cup', col: '#ffd23c', col2: '#fff08a' } });
    S.tuftDry = v(6, 'nam-dry', (r) => r.range(0.4, 0.7), (r) => r.range(0.34, 0.6), P.tuft, (r) => ({ col: t(r.pick(['#c8a848', '#b89840'])), tip: t('#f8e89a'), n: r.int(9, 14) }));
    S.tuftFar = v(3, 'nam-tfar', 0.5, 0.4, P.tuft, () => ({ col: t('#c0a048'), tip: t('#f0dc8c'), n: 8 }), { ppu: 44 });
    S.devil = v(3, 'nam-devil', 0.24, (r) => r.range(0.24, 0.36), P.flower, () => ({ kind: 'cup', col: t('#ffd23c'), col2: t('#fff08a'), stem: t('#8a8a45') }));
    S.ripple = v(4, 'nam-rip', (r) => r.range(0.8, 1.4), 0.1, (ctx, w, h) => { ctx.strokeStyle = rgba('#5a1c14', 0.22); ctx.lineWidth = 0.02; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0.05, 0.03 + i * 0.03); ctx.quadraticCurveTo(w / 2, i * 0.03 - 0.01, w - 0.05, 0.03 + i * 0.03); ctx.stroke(); } }, {}, { ay: 0 });
    S.crack = v(4, 'nam-crack', (r) => r.range(0.6, 1), 0.3, (ctx, w, h, r) => { ctx.strokeStyle = rgba('#6a5a4a', 0.5); ctx.lineWidth = 0.018; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { ctx.beginPath(); let x = r.range(0.1, 0.9) * w, y = 0; ctx.moveTo(x, y); for (let k = 0; k < 3; k++) { x += r.range(-0.12, 0.12); y += 0.09; ctx.lineTo(x, y); } ctx.stroke(); } }, {}, { ay: 0 });
    const dt = (far) => () => ({ col: far ? t.h('#2a1c18', 0.12) : t('#2a1c18'), lit: far ? t.h('#5a4038', 0.12) : t('#6a4a40') });
    S.deadtree = v(6, 'nam-dead', (r) => r.range(2.6, 3.8), (r) => r.range(2.8, 4.4), P.deadtree, dt(false)); S.deadtreeFar = v(5, 'nam-deadf', 1.1, (r) => r.range(1, 1.5), P.deadtree, dt(true), { ppu: 48 });
    const ac = (far) => (ctx, w, h, r) => { ctx.save(); ctx.translate(0, h * 0.3); P.deadtree(ctx, w, h * 0.7, r, { col: t('#4a3428'), lit: t('#7a5a44') }); ctx.restore(); for (let i = 0; i < 60; i++) { const x = r.range(0.04, 0.96) * w, y = h * (0.06 + 0.28 * r.u() * (1 - Math.abs(x / w - 0.5))); ctx.fillStyle = mix(t(far ? '#6a8a4a' : '#5f7f3f'), t('#b4c870'), r.u()); ctx.beginPath(); ctx.ellipse(x, y + h * 0.1, w * 0.06, h * 0.03, 0, 0, 7); ctx.fill(); } };
    S.acacia = v(4, 'nam-acacia', (r) => r.range(3.4, 4.6), (r) => r.range(2.6, 3.4), ac(false)); S.acaciaFar = v(3, 'nam-acaciaf', 1.4, 1, ac(true), {}, { ppu: 48 });
    S.welw = v(3, 'nam-welw', (r) => r.range(1.2, 1.8), 0.4, P.mound, () => ({ col: t('#4f6a3a'), lit: t('#9ab060'), dots: t('#c8b070') }));
    const oryx = (tail) => () => ({ col: t('#c9a888'), dark: t('#2a2220'), mane: t('#2a2220'), neck: 0.6, head: 0.24, tail, graze: 0, horns: t('#2a2220'), belly: t('#f4ece0') });
    S.oryx = v(2, 'nam-oryx', 2, 1.7, P.quad, oryx(0.25)); S.oryxB = v(2, 'nam-oryx', 2, 1.7, P.quad, oryx(0.9)); S.oryxFar = v(2, 'nam-oryxf', 2, 1.7, P.quad, oryx(0.5), { ppu: 48 });
    return S;
  },
  // a ledge: a slab of hard red rock, undercut by the wind
  slab(w, kind, time) {
    const t = tones(time), r = new RNG('namslab' + w + kind);
    return sprite(w, 1.2, (ctx) => { const g = ctx.createLinearGradient(0, 0, 0, 1.2); g.addColorStop(0, t('#b8603a')); g.addColorStop(1, t('#5a241c')); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0.04); ctx.lineTo(w, 0.04); ctx.quadraticCurveTo(w * 0.8, 0.7, w * (0.5 + r.range(-0.1, 0.1)), 1.2); ctx.quadraticCurveTo(w * 0.2, 0.7, 0, 0.04); ctx.fill(); ctx.fillStyle = rgba('#ffe0b0', 0.4); ctx.fillRect(0.06, 0.04, w - 0.12, 0.05); }, { ax: 0.5, ay: 0 });
  },
};
