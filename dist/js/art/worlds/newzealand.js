// New Zealand, the far south-west of it: Fiordland. Walls of rock going straight down into dark water, a waterfall wherever the rain has found a way,
// beech forest with moss on everything, tree ferns, and birds that walk. It rains here on about half the days of the year.
import { RNG } from '../../core/rng.js';
import { P, variants, sprite, mix, rgba } from '../paint.js';
import { tones, lamps, stock } from './kit.js';

const TIMES = {
  dawn:   { wash: [{ x: 0.72, y: 0.4, r: 0.9, col: '#ffe2a8', a: 0.5 }, { x: 0.1, y: 0.1, r: 0.8, col: '#3a7a8a', a: 0.36 }, { x: 0.5, y: 0.9, r: 0.7, col: '#bfe8d0', a: 0.4 }], sky: ['#38707e', '#86bcb8', '#e2ecc4', '#fff4d8'], skyAt: [0, 0.4, 0.78, 1], sun: { x: 0.72, y: 0.36, r: 0.034, col: '#fffbe0', glow: '#ffe0a0' }, bloom: 0.4, haze: '#d8e8d0', shade: '#1a3438', dark: 0.1, mist: 0.5, shafts: 0.2, tint: 'rgba(200,250,205,0.13)', rim: '#f4ffe0', water: '#3f7a80' },
  day:    { wash: [{ x: 0.3, y: 0.1, r: 0.8, col: '#ffffff', a: 0.3 }, { x: 0.85, y: 0.6, r: 0.9, col: '#8fe0c0', a: 0.3 }, { x: 0.1, y: 0.7, r: 0.7, col: '#4fa8c8', a: 0.26 }], sky: ['#4690c4', '#94c6dc', '#d6eae0', '#f2f8ea'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.3, y: 0.12, r: 0.03, col: '#fffdf0', glow: '#fff6c8' }, haze: '#d6eae0', shade: '#143038', dark: 0, mist: 0.3, shafts: 0.14, tint: 'rgba(190,250,215,0.12)', rim: '#ffffff', water: '#2f7a84' },
  golden: { wash: [{ x: 0.22, y: 0.42, r: 0.85, col: '#ffb85a', a: 0.5 }, { x: 0.88, y: 0.12, r: 0.9, col: '#3f808e', a: 0.36 }, { x: 0.55, y: 0.85, r: 0.7, col: '#e8f0a8', a: 0.4 }], sky: ['#3c7488', '#98b4a4', '#f4d08a', '#fff0c4'], skyAt: [0, 0.45, 0.82, 1], sun: { x: 0.22, y: 0.4, r: 0.04, col: '#fff4c8', glow: '#ffc060' }, bloom: 0.4, haze: '#f0dca4', shade: '#28322c', dark: 0.05, mist: 0.36, shafts: 0.22, tint: 'rgba(255,210,110,0.16)', rim: '#fff0b8', water: '#5a8a84' },
  dusk:   { wash: [{ x: 0.28, y: 0.52, r: 0.85, col: '#f08aa8', a: 0.42 }, { x: 0.88, y: 0.16, r: 0.9, col: '#1f3a78', a: 0.42 }, { x: 0.6, y: 0.85, r: 0.6, col: '#7fd0c8', a: 0.3 }], sky: ['#12284c', '#385884', '#a888aa', '#f0b8a4'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.28, y: 0.48, r: 0.04, col: '#ffe4cc', glow: '#f08a90' }, haze: '#a8a8ba', shade: '#10223c', dark: 0.26, mist: 0.4, shafts: 0.08, tint: 'rgba(160,160,230,0.14)', rim: '#e0d0e8', water: '#3a5a80', stars: 0.3, aura: 0.36 },
  night:  { wash: [{ x: 0.5, y: 0.98, r: 0.7, col: '#1f7a8a', a: 0.3 }, { x: 0.2, y: 0.15, r: 0.5, col: '#2f6fd8', a: 0.28 }, { x: 0.85, y: 0.3, r: 0.6, col: '#1f5a6a', a: 0.3 }], sky: ['#030916', '#081c30', '#103644', '#1a4e54'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.26, y: 0.15, r: 0.03, col: '#f6f4e8', glow: '#aed8e0', moon: true }, haze: '#1a444c', shade: '#04121c', dark: 0.58, mist: 0.34, tint: 'rgba(80,210,210,0.14)', rim: '#c4ece8', water: '#0e3044', stars: 0.9, cloud: 0.4, aura: 0.5, vignette: 0.5 },
  // rain, which is the ordinary weather
  mist:   { wash: [{ x: 0.5, y: 0.6, r: 0.9, col: '#e4eeea', a: 0.34 }, { x: 0.2, y: 0.2, r: 0.6, col: '#6f96a0', a: 0.34 }], sky: ['#58767e', '#96b0b0', '#d4ded8'], bow: true, haze: '#c4d6d0', shade: '#1a3236', dark: 0.12, mist: 0.75, cloud: 0.8, tint: 'rgba(180,225,210,0.12)', rim: '#f0fff6', water: '#4a7e86' },
};

export const newzealand = {
  id: 'newzealand', name: 'New Zealand', zone: 'moss', times: TIMES,
  stamps: [{ s: 'kiwi', name: 'Kiwi' }, { s: 'kea', name: 'Kea' }, { s: 'rata', name: 'Rātā in flower' }, { s: 'pongaS', name: 'Tree fern' }, { s: 'shroom', name: 'Sky-blue mushroom' }, { s: 'takahe', name: 'Takahē' }],
  note: 'This is Fiordland, the south-west corner of New Zealand. Rain falls there on about half the days of the year. A fiord is a valley that a glacier cut and the sea then filled.',

  far(time) {
    const t = tones(time);
    return [
      { par: 0.012, scale: 1.3, base: 0.42, amp: 0.14, style: 'round', seed: 5, col: mix('#ffffff', time.haze, 0.35), haze: 0.1, lit: 0.14, facet: 0, rimA: 0.55, foot: 0.9 },
      // the peaks behind the fiord: bare rock, and snow that lasts the summer
      { par: 0.02, scale: 0.7, base: 0.45, amp: 0.34, style: 'jag', seed: 71, col: t('#6a8298'), haze: 0.5, lit: 0.16, ribs: 0.14, ribGap: 1.1, fog: 0.26, bands: [{ col: t('#f4f8fc'), a: 0.9, at: 0, th: 0.17, w: 0.12, f: 6, s: 9 }, { col: t('#8aa890'), a: 0.45, at: 0.5, th: 0.3, w: 0.2, f: 3, s: 4 }] },
      // the walls of the fiord: forest holding on to rock too steep for it, and a waterfall wherever the rain has found a way down
      { par: 0.036, scale: 0.5, base: 0.5, amp: 0.3, style: 'jag', seed: 83, col: t('#3a6a62'), haze: 0.36, lit: 0.12, fog: 0.3, ribs: 0.12, ribGap: 0.9,
        bands: [{ col: t('#5a9a78'), a: 0.6, at: 0.2, th: 0.4, w: 0.2, f: 3, s: 2 }, { col: t('#8a9aa0'), a: 0.5, at: 0.02, th: 0.14, w: 0.1, f: 5, s: 6 }],
        stamps: [{ s: '-', kind: 'fall', every: 0.22, p: 0.6, size: 0.6, len: 0.2, seed: 5 }, { s: '-', kind: 'fall', every: 0.37, p: 0.5, size: 0.4, len: 0.13, seed: 9 }, { s: 'mistS', every: 0.45, p: 0.6, size: 0.3, seed: 15, drop: [0.2, 0.6] }, { s: '-', kind: 'flock', every: 1.3, p: 0.5, size: 0.022, seed: 7, n: 4, sink: -0.05 }] },
      // the fiord itself: the sea, a long way in from the coast and very still
      { kind: 'lake', y: 0.585, h: 0.065, par: 0.06, things: [{ s: 'boatFar', n: 1, seed: 4, size: 0.03, speed: 0.0012, at: 0.3, span: 0.5 }] },
      { par: 0.075, scale: 0.5, base: 0.62, amp: 0.18, style: 'round', seed: 37, col: t('#2f6a4a'), haze: 0.22, lit: 0.12, fog: 0.22,
        bands: [{ col: t('#6fb860'), a: 0.6, at: 0.06, th: 0.28, w: 0.2, f: 3, s: 3 }, { col: t('#1f5a40'), a: 0.5, at: 0.5, th: 0.2, w: 0.2, f: 4, s: 7 }],
        stamps: [{ s: 'beechFar', every: 0.07, p: 0.92, size: 0.085, seed: 11, sink: 0.006 }, { s: '-', kind: 'fall', every: 0.44, p: 0.45, size: 0.6, len: 0.13, seed: 13 }, { s: 'mistS', every: 0.5, p: 0.6, size: 0.28, seed: 15, drop: [0.1, 0.5] }] },
      // nearer: single great trees stand out of the canopy, tree ferns along every stream, and rātā in flower
      { par: 0.13, scale: 0.44, base: 0.7, amp: 0.15, style: 'round', seed: 49, col: t('#2a5a38'), haze: 0.12, fog: 0.18,
        bands: [{ col: t('#7fc858'), a: 0.7, at: 0.04, th: 0.26, w: 0.16, f: 3, s: 2 }, { col: t('#3f8a48'), a: 0.6, at: 0.36, th: 0.16, w: 0.14, f: 5, s: 6 }, { col: time.water, a: 0.8, at: 0.6, th: 0.035, w: 0.12, f: 1.4, s: 12, glint: 16 }],
        stamps: [{ s: 'beechFar', every: 0.09, p: 0.9, size: 0.14, seed: 21, sink: 0.01 }, { s: 'giantFar', every: 0.55, p: 0.5, size: 0.2, seed: 23, sink: 0.01 }, { s: 'pongaFar', every: 0.13, p: 0.55, size: 0.1, seed: 25, drop: [0.1, 0.55] },
          { s: 'rataFar', every: 0.1, p: 0.5, size: 0.04, seed: 27, drop: [0.05, 0.5] }, { s: '-', kind: 'flock', every: 1, p: 0.5, size: 0.03, seed: 29, n: 3, sink: -0.08 }] },
      { par: 0.24, scale: 0.4, base: 0.78, amp: 0.13, style: 'round', seed: 61, col: t('#1f4a2c'), haze: 0.05, foot: 0.3,
        bands: [{ col: t('#8fd858'), a: 0.75, at: 0.02, th: 0.24, w: 0.14, f: 4, s: 3 }, { col: t('#4f9a48'), a: 0.6, at: 0.3, th: 0.14, w: 0.14, f: 5, s: 5 }],
        stamps: [{ s: 'beechFar', every: 0.15, p: 0.85, size: 0.22, seed: 31, sink: 0.014 }, { s: 'giantFar', every: 0.8, p: 0.5, size: 0.3, seed: 33, sink: 0.014 }, { s: 'pongaFar', every: 0.11, p: 0.6, size: 0.17, seed: 34, sink: 0.01 }, { s: 'rockFar', every: 0.12, p: 0.5, size: 0.06, seed: 35, sink: 0.012 }, { s: 'fernFar', every: 0.07, p: 0.7, size: 0.05, seed: 37, sink: 0.004 },
          { s: 'rataFar', every: 0.12, p: 0.5, size: 0.07, seed: 39, drop: [0.05, 0.4] }] },
    ];
  },
  behind: [
    { s: 'giant', every: 21, p: 0.55, size: 1, seed: 1401, sink: 0.5 },
    { s: 'ponga', every: 6.5, p: 0.62, size: 1, seed: 1405, sink: 0.25 },
    { s: 'stump', every: 23, p: 0.5, size: 1, seed: 1409, sink: 0.3, zone: ['moss', 'litter', 'root'] },
    { s: 'rockBig', every: 9, p: 0.4, size: 1, seed: 1413, sink: 0.5 },
    { s: 'rata', every: 9, p: 0.42, size: 1, seed: 1417, sink: 0.15, zone: ['moss', 'litter'] },
    { s: 'flax', every: 8, p: 0.42, size: 1, seed: 1419, sink: 0.12, zone: ['moss', 'stream', 'litter'] },
    { s: 'takahe', frames: ['takahe', 'takahe', 'takaheB', 'takaheB', 'takaheB'], fps: 0.25, every: 31, p: 0.6, size: 1, seed: 1421, sink: 0.02, zone: ['moss', 'litter'], roam: 1.6, speed: 0.05 },
    { s: 'kea', frames: ['kea', 'kea', 'keaB'], fps: 0.7, every: 37, p: 0.55, size: 1, seed: 1425, sink: 0.01, zone: ['moss', 'root', 'litter'] },
    // kiwi come out after dark, and only then
    { s: 'kiwiNight', frames: ['kiwiNight', 'kiwiNightB'], fps: 0.6, every: 27, p: 0.55, size: 1, seed: 1429, sink: 0.01, zone: ['moss', 'litter', 'root'], roam: 1.3, speed: 0.04 },
  ],
  ground(time) {
    const t = tones(time), band = (a, b, c, w = [1, 0.46, 0.13]) => ({ bands: [{ col: t(a), w: w[0] }, { col: t(b), w: w[1] }, { col: t(c), w: w[2] }] });
    return {
      body: [t('#46382e'), t('#30251e'), t('#191410')],
      strata: [{ col: t('#8a6a50'), a: 0.4, w: 0.12, d: 1.2, follow: 0.92, f: 0.35, seed: 3, wob: 0.5 }, { col: t('#1a1410'), a: 0.4, w: 0.2, d: 2.5, follow: 0.84, f: 0.22, seed: 5, wob: 0.8 }, { col: t('#7a8a8a'), a: 0.3, w: 0.1, d: 4, follow: 0.75, f: 0.3, seed: 7, wob: 0.9 }],
      embed: { s: 'stone', every: 1.3, p: 0.5, a: 0.5 },
      skin: {
        moss: band('#2f6a2c', '#5fa83c', '#b8f060', [1.1, 0.5, 0.14]), litter: band('#5a3e2a', '#8a6240', '#c8a070'), root: band('#3a2a22', '#6a4c3c', '#a8886c', [0.8, 0.32, 0.08]), stream: band('#3a4a50', '#6a8088', '#b8ccd0', [0.8, 0.32, 0.08]),
      },
      decor: {
        moss: [{ s: 'mossy', p: 0.9, size: 1, sink: 0.05, steep: 1.6 }, { s: 'fern', p: 0.3, size: 1, sway: 0.08 }, { s: 'shroom', p: 0.09, size: 1, sink: 0.01 }, { s: 'tuft', p: 0.4, size: 0.9, sway: 0.1 }, { s: 'star', p: 0.18, size: 1, sway: 0.08 }, { s: 'koru', p: 0.14, size: 1, sway: 0.05 }],
        litter: [{ s: 'leaf', p: 0.8, size: 1, sink: 0.05, steep: 1.6 }, { s: 'fern', p: 0.36, size: 1, sway: 0.08 }, { s: 'shroom', p: 0.12, size: 1, sink: 0.01 }, { s: 'pebble', p: 0.2, size: 1, sink: 0.03 }, { s: 'koru', p: 0.16, size: 1, sway: 0.05 }],
        root: [{ s: 'rootS', p: 0.5, size: 1, sink: 0.08 }, { s: 'mossy', p: 0.4, size: 0.9, sink: 0.05, steep: 1.6 }, { s: 'pebble', p: 0.3, size: 1, sink: 0.03 }, { s: 'fern', p: 0.16, size: 0.9, sway: 0.08 }, { s: 'glow', p: 0.3, size: 1, sink: -0.02 }],
        stream: [{ s: 'pebble', p: 0.7, size: 1, sink: 0.03 }, { s: 'rock', p: 0.3, size: 1, sink: 0.08 }, { s: 'mossy', p: 0.2, size: 0.8, sink: 0.05 }, { s: 'glow', p: 0.25, size: 1, sink: -0.02 }],
      },
    };
  },
  lives: { every: 6, p: 0.5, zones: ['moss', 'litter', 'root'], cols: ['#ffffff', '#d8f8a0', '#ffe37a'] },
  fore: [
    { s: 'foreRock', par: 1.5, every: 21, p: 0.4, size: 1, seed: 1501, sink: 0.45, a: 1 },
    { s: 'foreGrass', par: 1.7, every: 3.2, p: 0.75, size: 1, seed: 1505, sink: 0.2, a: 0.95 },
  ],
  ambient(time) { return [{ n: 34, col: time.stars ? '#b8f4ff' : '#f4ffe0', size: 1.5, speed: 0.006, drift: 0.02, a: 0.5, par: 0.5, sway: 8 }]; },
  // Rain on one day in two, and cloud on the forest between showers.
  weather(key) {
    return { dawn: { wet: 0.5, fog: 0.7, wind: 0.6, gust: 0.5 }, day: { wet: 0.7, fog: 0.3, wind: 0.9, gust: 0.8 }, golden: { wet: 0.5, fog: 0.36, wind: 0.8, gust: 0.7 }, dusk: { wet: 0.7, fog: 0.4, wind: 0.9, gust: 0.8 },
      night: { wet: 0.75, fog: 0.4, wind: 0.8, gust: 0.8, clear: 0.2, storm: 0.3 }, mist: { wet: 1, fog: 0.9, wind: 1.1, gust: 1, early: true } }[key] || {};
  },

  sprites(time) {
    const t = tones(time), v = variants, dark = lamps(time);
    const S = stock(time, 'nz-', { rock: ['#5a6a66', '#4a5a58', '#6a7a74'], rockLit: '#a8c8a8', stone: ['#3a342c', '#6a6254'], near: '#081814', nearBloom: ['#ffffff', '#d8f8a0', 'cup'], nestBloom: { kind: 'cup', col: '#ffffff', col2: '#d8f8a0' } });
    const moss = (r) => ({ col: t(r.pick(['#3f8a34', '#4f9a3c', '#2f7a30'])), lit: t('#b8f060'), dots: t('#e0ffa0') });
    S.mossy = v(6, 'nz-moss', (r) => r.range(0.7, 1.4), (r) => r.range(0.18, 0.32), P.mound, moss);
    S.leaf = v(5, 'nz-leaf', (r) => r.range(0.7, 1.3), (r) => r.range(0.12, 0.2), P.mound, (r) => ({ col: t(r.pick(['#8a6240', '#7a5236'])), lit: t('#c8a070'), dots: t('#5fa83c') }));
    S.tuft = v(5, 'nz-tuft', (r) => r.range(0.4, 0.7), (r) => r.range(0.3, 0.5), P.tuft, (r) => ({ col: t(r.pick(['#3f8a34', '#5fa83c'])), tip: t('#c8f078'), n: r.int(9, 14) }));
    S.star = v(3, 'nz-star', 0.2, (r) => r.range(0.2, 0.3), P.flower, () => ({ kind: 'cup', col: t('#ffffff'), col2: t('#e8f8c0'), stem: t('#4f8a3c') }));
    S.koru = v(4, 'nz-koru', (r) => r.range(0.36, 0.5), (r) => r.range(0.4, 0.62), P.koru, () => ({ col: t('#5f8a44'), tip: t('#c8b070') }));
    const fn = (far) => () => ({ col: far ? t.h('#2f6a34', 0.1) : t('#2f6a34'), lit: far ? t.h('#8fd060', 0.1) : t('#9fe068'), stem: t('#2a4a2a') });
    S.fern = v(5, 'nz-fern', (r) => r.range(0.8, 1.4), (r) => r.range(0.5, 0.9), P.shrub, fn(false)); S.fernFar = v(3, 'nz-fernf', 0.9, 0.6, P.shrub, fn(true), { ppu: 48 });
    // rātā: dark leaves, and in summer the whole crown red with flower
    const ra = (far) => () => ({ col: far ? t.h('#2f5a34', 0.1) : t('#2f5a34'), lit: far ? t.h('#6fa050', 0.1) : t('#7fb058'), berry: t('#e8322c'), stem: t('#4a3a30') });
    const bloom = (n, k) => (ctx, w, h, r, o) => { P.shrub(ctx, w, h, r, o); for (let i = 0; i < n; i++) { const x = w * r.range(0.14, 0.86), y = h * r.range(0.08, 0.6); ctx.strokeStyle = mix(o.berry, '#ffb0a0', r.u() * 0.4); ctx.lineWidth = w * 0.012 * k; ctx.lineCap = 'round'; for (let j = 0; j < 9; j++) { const a = (j / 9) * 6.283 + r.u(), L = w * 0.035 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke(); } } };
    S.rata = v(4, 'nz-rata', (r) => r.range(1.4, 2), (r) => r.range(1, 1.5), bloom(16, 1), ra(false)); S.rataFar = v(3, 'nz-rataf', 1, 0.8, bloom(9, 1.6), ra(true), { ppu: 48 });
    S.flax = v(4, 'nz-flax', (r) => r.range(1.7, 2.3), (r) => r.range(1.8, 2.4), P.flax, () => ({ col: t('#3f7a3a'), lit: t('#9ac860'), stalk: t('#3a2a26'), bloom: t('#b8442c') }));
    // the sky-blue mushroom, blue from cap to foot
    S.shroom = v(4, 'nz-shroom', 0.5, (r) => r.range(0.26, 0.4), P.shroom, () => ({ cap: t('#2f8ad8'), lit: t('#a4dcff'), stem: t('#6fb4ec'), dot: t('#d8f2ff') }));
    S.rootS = v(4, 'nz-root', (r) => r.range(1, 1.8), (r) => r.range(0.2, 0.34), (ctx, w, h, r) => { ctx.strokeStyle = t('#6a4c3c'); ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { ctx.lineWidth = r.range(0.06, 0.12); ctx.beginPath(); ctx.moveTo(w * r.range(0, 0.2), h); ctx.bezierCurveTo(w * r.range(0.2, 0.4), h * r.range(-0.2, 0.3), w * r.range(0.6, 0.8), h * r.range(0, 0.5), w * r.range(0.8, 1), h); ctx.stroke(); } ctx.strokeStyle = rgba(t('#b8f060'), 0.7); ctx.lineWidth = 0.035; ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.5); ctx.quadraticCurveTo(w * 0.5, h * 0.1, w * 0.8, h * 0.5); ctx.stroke(); }, {});
    // glowworms: nothing by day, a scatter of small blue lights on a wet bank at night
    S.glow = [0, 1, 2].map((i) => sprite(1.2, 0.5, (ctx, w, h) => { if (!dark) return; const r = new RNG('nz-glow' + i); for (let k = 0; k < 9; k++) { const x = r.range(0.06, w - 0.06), y = r.range(0.1, h - 0.04), s = r.range(0.018, 0.034); ctx.fillStyle = 'rgba(120,235,255,0.22)'; ctx.beginPath(); ctx.arc(x, y, s * 3.2, 0, 7); ctx.fill(); ctx.fillStyle = '#c8fbff'; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); } }));
    const gt = (far) => () => ({ bark: far ? t.h('#625e58', 0.12) : t('#625e58'), lit: far ? t.h('#a8a89c', 0.12) : t('#b0b0a4'), dark: t('#2c2a2a'), moss: t('#4f9a3c'), mossLit: t('#b8f060'), leaf: far ? t.h('#2f5f3a', 0.12) : t('#2a5a36'), leafLit: far ? t.h('#6fa850', 0.12) : t('#7fb858') });
    S.giant = v(4, 'nz-giant', (r) => r.range(6, 8.5), (r) => r.range(14, 18), P.giant, gt(false), { ppu: 40 }); 
    // seen from far off the whole tree shows, so it needs its crown: flat tiers of small leaves, laid one over another
    const crowned = (ctx, w, h, r, o) => { P.giant(ctx, w, h, r, o); for (let i = 0; i < 9; i++) { const u = i / 8; ctx.fillStyle = mix(o.leaf, o.leafLit, 1 - u * 0.8); ctx.beginPath(); ctx.ellipse(w * (0.5 + r.range(-0.2, 0.2) * (0.3 + u)), h * (0.035 + u * 0.1), w * r.range(0.24, 0.4) * (0.6 + u * 0.5), h * 0.03, r.range(-0.1, 0.1), 0, 7); ctx.fill(); } };
    S.giantFar = v(3, 'nz-giantf', 1, 2.2, crowned, gt(true), { ppu: 56 });
    const pg = (far) => () => ({ trunk: t('#3a2c24'), lit: far ? t.h('#7a6250', 0.1) : t('#7a6250'), frond: far ? t.h('#2a6a36', 0.12) : t('#2a6a36'), frondLit: far ? t.h('#8fd060', 0.12) : t('#96d864'), dead: t('#8a6a48'), koru: t('#c8b070') });
    S.ponga = v(5, 'nz-ponga', (r) => r.range(4.4, 5.6), (r) => r.range(6, 9), P.ponga, pg(false), { ppu: 48 }); S.pongaFar = v(4, 'nz-pongaf', 1, (r) => r.range(1.3, 1.7), P.ponga, pg(true), { ppu: 56 }); S.pongaS = v(1, 'nz-pongas', 2.4, 3.2, P.ponga, pg(false), { ppu: 64 });
    const be = (r) => ({ col: t.h(r.pick(['#2a5a3a', '#1f4a34', '#3a6a40']), 0.12), lit: t.h('#7fb860', 0.12), trunk: t.h('#8a8478', 0.12) });
    S.beechFar = v(5, 'nz-beechf', 1, (r) => r.range(1.5, 2), P.beech, be, { ppu: 40 });
    S.stump = v(3, 'nz-stump', (r) => r.range(2.8, 3.8), (r) => r.range(1.8, 2.6), P.stump, () => ({ bark: t('#6a4c40'), lit: t('#a88a74'), dark: t('#1a1210'), moss: t('#4f9a3c'), mossLit: t('#b8f060') }));
    const tk = (graze) => () => ({ col: t('#2f4fa0'), lit: t('#5f8ae0'), back: t('#4f8a50'), red: t('#d8442c'), leg: t('#d86a4c'), graze });
    S.takahe = v(2, 'nz-takahe', 1.2, 1.0, P.takahe, tk(0)); S.takaheB = v(2, 'nz-takahe', 1.2, 1.0, P.takahe, tk(0.9));
    const ke = (open) => () => ({ col: t('#5f7a3c'), lit: t('#a4b868'), dark: t('#2f3f24'), bill: t('#3a3632'), under: t('#f08a3c'), open });
    S.kea = v(2, 'nz-kea', 0.9, 0.85, P.kea, ke(false)); S.keaB = v(2, 'nz-kea', 0.9, 0.85, P.kea, ke(true));
    const kw = (peck) => () => ({ col: t('#6a4c38'), lit: t('#a88462'), bill: t('#e8d8c0'), leg: t('#8a7460'), peck });
    S.kiwi = v(2, 'nz-kiwi', 1.0, 0.9, P.kiwi, kw(false)); S.kiwiB = v(2, 'nz-kiwi', 1.0, 0.9, P.kiwi, kw(true)); if (dark) { S.kiwiNight = S.kiwi; S.kiwiNightB = S.kiwiB; }
    // the old kākāpō who knows the path by heart
    const kp = (alt) => () => ({ col: t('#5f8a34'), lit: t('#b4d060'), dark: t('#2f4a22'), face: t('#e8dca0'), bill: t('#c8c0b0'), alt });
    S.elder = v(1, 'nz-elder', 1.35, 1.3, P.kakapo, kp(false)); S.elderB = v(1, 'nz-elder', 1.35, 1.3, P.kakapo, kp(true));
    S.mistS = v(3, 'nz-mists', 6, 1, P.mist, { col: mix('#ffffff', time.haze, 0.3) }, { ax: 0.5, ay: 0.5, ppu: 24 });
    S.boatFar = v(2, 'nz-boat', 1.4, 0.7, P.boat, () => ({ hull: t('#f4f0e8'), cabin: t('#3f6f95') }), { ppu: 64 });
    return S;
  },
  slab(w, kind, time) {
    const t = tones(time), r = new RNG('nzslab' + w + kind);
    if (kind === 'log') return sprite(w, 0.95, (ctx) => {      // a fallen tree lying across the gully: bark below, a pelt of moss above, the heartwood showing at the broken end
      const g = ctx.createLinearGradient(0, 0, 0, 0.95); g.addColorStop(0, t('#8a7460')); g.addColorStop(0.5, t('#6a5444')); g.addColorStop(1, t('#2a1e1a')); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(0, 0.06, w, 0.82, 0.4); ctx.fill();
      ctx.strokeStyle = rgba(t('#2a1c18'), 0.45); ctx.lineWidth = 0.03; for (let i = 0; i < w * 2.2; i++) { const x = r.range(0.3, w - 0.3), y = r.range(0.3, 0.8); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r.range(0.5, 1.4), y + r.range(-0.03, 0.03)); ctx.stroke(); }
      ctx.fillStyle = t('#c8a888'); ctx.beginPath(); ctx.ellipse(w - 0.22, 0.47, 0.17, 0.36, 0, 0, 7); ctx.fill(); ctx.strokeStyle = rgba(t('#6a4c3c'), 0.7); ctx.lineWidth = 0.02; for (const k of [0.1, 0.2, 0.28]) { ctx.beginPath(); ctx.ellipse(w - 0.22, 0.47, k * 0.6, k * 1.2, 0, 0, 7); ctx.stroke(); }
      for (let i = 0; i < w * 3; i++) { ctx.fillStyle = mix(t('#3f8a34'), t('#b8f060'), r.u()); ctx.beginPath(); ctx.ellipse(r.range(0.2, w - 0.5), r.range(0.04, 0.2), r.range(0.2, 0.45), r.range(0.06, 0.12), 0, 0, 7); ctx.fill(); } }, { ax: 0.5, ay: 0.06 });
    // a boulder standing in the stream, its head dry and green
    return sprite(w, 1.9, (ctx) => { const g = ctx.createLinearGradient(0, 0, w, 1.9); g.addColorStop(0, t('#a8b8b4')); g.addColorStop(0.5, t('#6a7a78')); g.addColorStop(1, t('#3a4a4c')); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0.02, 0.24); ctx.quadraticCurveTo(w * 0.1, 0.04, w * 0.3, 0.04); ctx.lineTo(w * 0.7, 0.04); ctx.quadraticCurveTo(w * 0.94, 0.06, w - 0.02, 0.3);
      ctx.quadraticCurveTo(w * (1 + r.range(0, 0.04)), 1.2, w * 0.86, 1.9); ctx.lineTo(w * 0.14, 1.9); ctx.quadraticCurveTo(-w * 0.03, 1.2, 0.02, 0.24); ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.25); ctx.fillRect(w * 0.1, 0.5, w * 0.8, 0.03); for (let i = 0; i < 7; i++) { ctx.fillStyle = mix(t('#3f8a34'), t('#b8f060'), r.u()); ctx.beginPath(); ctx.ellipse(r.range(0.25, w - 0.25), r.range(0.03, 0.12), r.range(0.2, 0.36), r.range(0.05, 0.09), 0, 0, 7); ctx.fill(); } }, { ax: 0.5, ay: 0.03 });
  },
};
