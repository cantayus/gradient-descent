// Yakushima: an island of granite that catches every cloud. Cedars a thousand years old and older, moss on everything, streams at every turn,
// small deer and grey macaques, and rain.
import { RNG } from '../../core/rng.js';
import { P, variants, sprite, mix, rgba } from '../paint.js';
import { tones, lamps, stock } from './kit.js';

const TIMES = {
  dawn:   { wash: [{ x: 0.72, y: 0.4, r: 0.9, col: '#ffe9a0', a: 0.5 }, { x: 0.1, y: 0.1, r: 0.8, col: '#3a8a7a', a: 0.36 }, { x: 0.5, y: 0.9, r: 0.7, col: '#bff0c8', a: 0.4 }], sky: ['#3a7a80', '#8ac4b0', '#e4eeb8', '#fff6d4'], skyAt: [0, 0.4, 0.78, 1], sun: { x: 0.72, y: 0.36, r: 0.034, col: '#fffbe0', glow: '#ffe9a0' }, bloom: 0.4, haze: '#dcecc8', shade: '#1c3a34', dark: 0.1, mist: 0.5, shafts: 0.2, tint: 'rgba(200,255,190,0.14)', rim: '#f4ffd8', water: '#5fb0a0' },
  day:    { wash: [{ x: 0.3, y: 0.1, r: 0.8, col: '#ffffff', a: 0.3 }, { x: 0.85, y: 0.6, r: 0.9, col: '#8fe0b8', a: 0.3 }, { x: 0.1, y: 0.7, r: 0.7, col: '#4fb0c8', a: 0.26 }], sky: ['#4f98c0', '#9accd8', '#d8ecdc', '#f2f8e8'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.3, y: 0.12, r: 0.03, col: '#fffdf0', glow: '#fff6c8' }, haze: '#d8ecdc', shade: '#143430', dark: 0, mist: 0.3, shafts: 0.14, tint: 'rgba(190,255,210,0.12)', rim: '#ffffff', water: '#3fa8a0' },
  golden: { wash: [{ x: 0.22, y: 0.42, r: 0.85, col: '#ffb85a', a: 0.5 }, { x: 0.88, y: 0.12, r: 0.9, col: '#3f8a8a', a: 0.36 }, { x: 0.55, y: 0.85, r: 0.7, col: '#e8f0a0', a: 0.4 }], sky: ['#3f7a84', '#9ab8a0', '#f4d088', '#fff0c0'], skyAt: [0, 0.45, 0.82, 1], sun: { x: 0.22, y: 0.4, r: 0.04, col: '#fff4c8', glow: '#ffc060' }, bloom: 0.4, haze: '#f0dca0', shade: '#2a3428', dark: 0.05, mist: 0.36, shafts: 0.22, tint: 'rgba(255,210,110,0.16)', rim: '#fff0b8', water: '#6fb098' },
  dusk:   { wash: [{ x: 0.28, y: 0.52, r: 0.85, col: '#f08aa8', a: 0.42 }, { x: 0.88, y: 0.16, r: 0.9, col: '#1f3a78', a: 0.42 }, { x: 0.6, y: 0.85, r: 0.6, col: '#7fd8c0', a: 0.3 }], sky: ['#142a4a', '#3a5a80', '#a888a8', '#f0b8a0'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.28, y: 0.48, r: 0.04, col: '#ffe4cc', glow: '#f08a90' }, haze: '#a8a8b8', shade: '#10243a', dark: 0.26, mist: 0.4, shafts: 0.08, tint: 'rgba(160,160,230,0.14)', rim: '#e0d0e8', water: '#4a6a8a', stars: 0.3, aura: 0.36 },
  night:  { wash: [{ x: 0.5, y: 0.98, r: 0.7, col: '#1f8a7a', a: 0.3 }, { x: 0.2, y: 0.15, r: 0.5, col: '#2f6fd8', a: 0.28 }, { x: 0.85, y: 0.3, r: 0.6, col: '#1f6a5a', a: 0.3 }], sky: ['#030a14', '#08202c', '#103a40', '#1a5450'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.26, y: 0.15, r: 0.03, col: '#f6f4e8', glow: '#aee0d0', moon: true }, haze: '#1a4a48', shade: '#04141a', dark: 0.58, mist: 0.34, tint: 'rgba(80,220,190,0.14)', rim: '#c4f0e0', water: '#103a48', stars: 0.9, cloud: 0.4, aura: 0.5, vignette: 0.5 },
  // rain, which is the island's ordinary weather
  mist:   { wash: [{ x: 0.5, y: 0.6, r: 0.9, col: '#e4f0e4', a: 0.34 }, { x: 0.2, y: 0.2, r: 0.6, col: '#6f9a90', a: 0.34 }], sky: ['#5a7a78', '#98b4a8', '#d4e0d4'], bow: true, haze: '#c4d8cc', shade: '#1a3430', dark: 0.12, mist: 0.75, cloud: 0.8, tint: 'rgba(180,230,200,0.12)', rim: '#f0fff0', water: '#5a9088' },
};

export const yakushima = {
  id: 'yakushima', name: 'Yakushima', zone: 'moss', times: TIMES,
  stamps: [{ s: 'deer', name: 'Yaku deer' }, { s: 'macaque', name: 'Yaku macaque' }, { s: 'rhodo', name: 'Rhododendron' }, { s: 'stump', name: 'Cedar stump' }, { s: 'shroom', name: 'Toadstools' }, { s: 'cedarS', name: 'Yakusugi' }],
  note: 'On Yakushima a cedar is called a yakusugi only when it is more than a thousand years old. The island is granite, and it is among the wettest places in Japan.',

  far(time) {
    const t = tones(time);
    return [
      { par: 0.012, scale: 1.3, base: 0.42, amp: 0.14, style: 'round', seed: 5, col: mix('#ffffff', time.haze, 0.35), haze: 0.1, lit: 0.14, facet: 0, rimA: 0.55, foot: 0.9 },
      // the granite heart of the island, its head in the cloud
      { par: 0.022, scale: 0.8, base: 0.46, amp: 0.3, style: 'jag', seed: 14, col: t('#5a8a8a'), haze: 0.5, lit: 0.1, ribs: 0.12, ribGap: 1.2, fog: 0.3, bands: [{ col: t('#8ab8a0'), a: 0.5, at: 0.3, th: 0.3, w: 0.2, f: 3, s: 4 }, { col: t('#d8e4dc'), a: 0.5, at: 0.02, th: 0.1, w: 0.1, f: 5, s: 8 }] },
      // the far forest: every ridge a different green, and a waterfall or two down the rock
      { par: 0.04, scale: 0.6, base: 0.53, amp: 0.2, style: 'round', seed: 23, col: t('#3f7a6a'), haze: 0.34, lit: 0.12, fog: 0.26, ribs: 0.1,
        bands: [{ col: t('#5fa878'), a: 0.6, at: 0.1, th: 0.3, w: 0.2, f: 3, s: 2 }, { col: t('#2f6a5a'), a: 0.5, at: 0.5, th: 0.2, w: 0.2, f: 4, s: 6 }],
        stamps: [{ s: 'sugiFar', every: 0.024, p: 0.9, size: 0.05, seed: 3, sink: 0.004 }, { s: '-', kind: 'fall', every: 0.5, p: 0.5, size: 0.5, len: 0.12, seed: 5 }, { s: '-', kind: 'flock', every: 1.3, p: 0.5, size: 0.022, seed: 7, n: 4, sink: -0.05 }] },
      // the sea, a long way down
      { kind: 'lake', y: 0.585, h: 0.06, par: 0.06, things: [{ s: 'boatFar', n: 2, seed: 4, size: 0.03, speed: 0.0012, at: 0.3, span: 0.5 }] },
      { par: 0.075, scale: 0.5, base: 0.62, amp: 0.18, style: 'round', seed: 37, col: t('#2f6a4a'), haze: 0.22, lit: 0.12, fog: 0.22,
        bands: [{ col: t('#6fb860'), a: 0.6, at: 0.06, th: 0.28, w: 0.2, f: 3, s: 3 }, { col: t('#1f5a40'), a: 0.5, at: 0.5, th: 0.2, w: 0.2, f: 4, s: 7 }],
        stamps: [{ s: 'sugiFar', every: 0.03, p: 0.92, size: 0.085, seed: 11, sink: 0.006 }, { s: '-', kind: 'fall', every: 0.44, p: 0.45, size: 0.6, len: 0.13, seed: 13 }, { s: 'mistS', every: 0.3, p: 0.6, size: 0.3, seed: 15, drop: [0.1, 0.5] }] },
      // nearer: single great trees stand out of the canopy, and there are deer in the clearings
      { par: 0.13, scale: 0.44, base: 0.7, amp: 0.15, style: 'round', seed: 49, col: t('#2a5a38'), haze: 0.12, fog: 0.18,
        bands: [{ col: t('#7fc858'), a: 0.7, at: 0.04, th: 0.26, w: 0.16, f: 3, s: 2 }, { col: t('#3f8a48'), a: 0.6, at: 0.36, th: 0.16, w: 0.14, f: 5, s: 6 }, { col: time.water, a: 0.8, at: 0.6, th: 0.035, w: 0.12, f: 1.4, s: 12, glint: 16 }],
        stamps: [{ s: 'sugiFar', every: 0.045, p: 0.9, size: 0.14, seed: 21, sink: 0.01 }, { s: 'cedarFar', every: 0.3, p: 0.6, size: 0.24, seed: 23, sink: 0.01 }, { s: 'deerFar', kind: 'graze', every: 0.3, p: 0.5, size: 0.034, seed: 25, drop: [0.1, 0.5], roam: 0.8, speed: 0.03 },
          { s: 'rhodoFar', every: 0.1, p: 0.5, size: 0.04, seed: 27, drop: [0.05, 0.5] }, { s: '-', kind: 'flock', every: 1, p: 0.5, size: 0.03, seed: 29, n: 3, sink: -0.08 }] },
      { par: 0.24, scale: 0.4, base: 0.78, amp: 0.13, style: 'round', seed: 61, col: t('#1f4a2c'), haze: 0.05, foot: 0.3,
        bands: [{ col: t('#8fd858'), a: 0.75, at: 0.02, th: 0.24, w: 0.14, f: 4, s: 3 }, { col: t('#4f9a48'), a: 0.6, at: 0.3, th: 0.14, w: 0.14, f: 5, s: 5 }],
        stamps: [{ s: 'sugiFar', every: 0.07, p: 0.8, size: 0.24, seed: 31, sink: 0.014 }, { s: 'cedarFar', every: 0.34, p: 0.55, size: 0.42, seed: 33, sink: 0.014 }, { s: 'rockFar', every: 0.12, p: 0.5, size: 0.06, seed: 35, sink: 0.012 }, { s: 'fernFar', every: 0.04, p: 0.7, size: 0.05, seed: 37, sink: 0.004 },
          { s: 'rhodoFar', every: 0.12, p: 0.5, size: 0.07, seed: 39, drop: [0.05, 0.4] }, { s: 'deerFar', kind: 'graze', every: 0.5, p: 0.5, size: 0.06, seed: 41, sink: 0.002, roam: 0.9, speed: 0.035 }] },
    ];
  },
  behind: [
    { s: 'cedar', every: 13, p: 0.62, size: 1, seed: 1401, sink: 0.5 },
    { s: 'sugi', every: 5, p: 0.6, size: 1, seed: 1405, sink: 0.25 },
    { s: 'stump', every: 23, p: 0.5, size: 1, seed: 1409, sink: 0.3, zone: ['moss', 'cedar', 'root'] },
    { s: 'rockBig', every: 9, p: 0.4, size: 1, seed: 1413, sink: 0.5 },
    { s: 'rhodo', every: 7, p: 0.45, size: 1, seed: 1417, sink: 0.15, zone: ['moss', 'cedar'] },
    { s: 'deer', frames: ['deer', 'deer', 'deerB', 'deerB', 'deerB'], fps: 0.25, every: 31, p: 0.6, size: 1, seed: 1421, sink: 0.04, zone: ['moss', 'cedar'], roam: 1.6, speed: 0.05 },
    { s: 'macaque', frames: ['macaque', 'macaqueB'], fps: 0.7, every: 37, p: 0.55, size: 1, seed: 1425, sink: 0.02, zone: ['moss', 'root', 'cedar'] },
  ],
  ground(time) {
    const t = tones(time), band = (a, b, c, w = [1, 0.46, 0.13]) => ({ bands: [{ col: t(a), w: w[0] }, { col: t(b), w: w[1] }, { col: t(c), w: w[2] }] });
    return {
      body: [t('#4a3a30'), t('#32261e'), t('#1a1410')],
      strata: [{ col: t('#8a6a50'), a: 0.4, w: 0.12, d: 1.2, follow: 0.92, f: 0.35, seed: 3, wob: 0.5 }, { col: t('#1a1410'), a: 0.4, w: 0.2, d: 2.5, follow: 0.84, f: 0.22, seed: 5, wob: 0.8 }, { col: t('#7a8a80'), a: 0.3, w: 0.1, d: 4, follow: 0.75, f: 0.3, seed: 7, wob: 0.9 }],
      embed: { s: 'stone', every: 1.3, p: 0.5, a: 0.5 },
      skin: {
        moss: band('#2f6a2c', '#5fa83c', '#b8f060', [1.1, 0.5, 0.14]), cedar: band('#5a3a28', '#8a5a3c', '#c89868'), root: band('#3a2a22', '#6a4c3c', '#a8886c', [0.8, 0.32, 0.08]), stream: band('#3a4a50', '#6a8088', '#b8ccd0', [0.8, 0.32, 0.08]),
      },
      decor: {
        moss: [{ s: 'mossy', p: 0.9, size: 1, sink: 0.05, steep: 1.6 }, { s: 'fern', p: 0.3, size: 1, sway: 0.08 }, { s: 'shroom', p: 0.1, size: 1, sink: 0.01 }, { s: 'tuft', p: 0.4, size: 0.9, sway: 0.1 }, { s: 'star', p: 0.18, size: 1, sway: 0.08 }],
        cedar: [{ s: 'needle', p: 0.8, size: 1, sink: 0.05, steep: 1.6 }, { s: 'fern', p: 0.36, size: 1, sway: 0.08 }, { s: 'shroom', p: 0.14, size: 1, sink: 0.01 }, { s: 'pebble', p: 0.2, size: 1, sink: 0.03 }],
        root: [{ s: 'rootS', p: 0.5, size: 1, sink: 0.08 }, { s: 'mossy', p: 0.4, size: 0.9, sink: 0.05, steep: 1.6 }, { s: 'pebble', p: 0.3, size: 1, sink: 0.03 }, { s: 'fern', p: 0.16, size: 0.9, sway: 0.08 }],
        stream: [{ s: 'pebble', p: 0.7, size: 1, sink: 0.03 }, { s: 'rock', p: 0.3, size: 1, sink: 0.08 }, { s: 'mossy', p: 0.2, size: 0.8, sink: 0.05 }],
      },
    };
  },
  lives: { every: 6, p: 0.5, zones: ['moss', 'cedar', 'root'], cols: ['#ffffff', '#d8f8a0', '#ffe37a'] },
  fore: [
    { s: 'foreRock', par: 1.5, every: 21, p: 0.4, size: 1, seed: 1501, sink: 0.45, a: 1 },
    { s: 'foreGrass', par: 1.7, every: 3.2, p: 0.75, size: 1, seed: 1505, sink: 0.2, a: 0.95 },
  ],
  ambient(time) { return [{ n: 34, col: time.stars ? '#d8ffb0' : '#f4ffe0', size: 1.5, speed: 0.006, drift: 0.02, a: 0.5, par: 0.5, sway: 8 }]; },
  // It rains here more days than not, and the cloud sits on the forest between showers.
  weather(key) {
    return { dawn: { wet: 0.5, fog: 0.7, wind: 0.6, gust: 0.5 }, day: { wet: 0.7, fog: 0.3, wind: 0.9, gust: 0.8 }, golden: { wet: 0.5, fog: 0.36, wind: 0.8, gust: 0.7 }, dusk: { wet: 0.7, fog: 0.4, wind: 0.9, gust: 0.8 },
      night: { wet: 0.75, fog: 0.4, wind: 0.8, gust: 0.8, clear: 0.2, storm: 0.3 }, mist: { wet: 1, fog: 0.9, wind: 1.1, gust: 1, early: true } }[key] || {};
  },

  sprites(time) {
    const t = tones(time), v = variants;
    const S = stock(time, 'yak-', { rock: ['#5a6a62', '#4a5a54', '#6a7a70'], rockLit: '#a8c8a0', stone: ['#3a342c', '#6a6254'], near: '#081810', nearBloom: ['#ffffff', '#d8f8a0', 'cup'], nestBloom: { kind: 'cup', col: '#ffffff', col2: '#d8f8a0' } });
    const moss = (r) => ({ col: t(r.pick(['#3f8a34', '#4f9a3c', '#2f7a30'])), lit: t('#b8f060'), dots: t('#e0ffa0') });
    S.mossy = v(6, 'yak-moss', (r) => r.range(0.7, 1.4), (r) => r.range(0.18, 0.32), P.mound, moss);
    S.needle = v(5, 'yak-needle', (r) => r.range(0.7, 1.3), (r) => r.range(0.12, 0.2), P.mound, (r) => ({ col: t(r.pick(['#8a5a3c', '#7a4c34'])), lit: t('#c89868'), dots: t('#5fa83c') }));
    S.tuft = v(5, 'yak-tuft', (r) => r.range(0.4, 0.7), (r) => r.range(0.3, 0.5), P.tuft, (r) => ({ col: t(r.pick(['#3f8a34', '#5fa83c'])), tip: t('#c8f078'), n: r.int(9, 14) }));
    S.star = v(3, 'yak-star', 0.2, (r) => r.range(0.2, 0.3), P.flower, () => ({ kind: 'cup', col: t('#ffffff'), col2: t('#e8f8c0'), stem: t('#4f8a3c') }));
    const fn = (far) => () => ({ col: far ? t.h('#2f6a34', 0.1) : t('#2f6a34'), lit: far ? t.h('#8fd060', 0.1) : t('#9fe068'), stem: t('#2a4a2a') });
    S.fern = v(5, 'yak-fern', (r) => r.range(0.8, 1.4), (r) => r.range(0.5, 0.9), P.shrub, fn(false)); S.fernFar = v(3, 'yak-fernf', 0.9, 0.6, P.shrub, fn(true), { ppu: 48 });
    const rh = (far) => () => ({ col: far ? t.h('#2f5a34', 0.1) : t('#2f5a34'), lit: far ? t.h('#6fa050', 0.1) : t('#7fb058'), berry: t('#ffc4d8'), stem: t('#4a3a30') });
    S.rhodo = v(4, 'yak-rhodo', (r) => r.range(1.2, 1.8), (r) => r.range(0.9, 1.3), P.shrub, rh(false)); S.rhodoFar = v(3, 'yak-rhodof', 1, 0.8, P.shrub, rh(true), { ppu: 48 });
    S.shroom = v(4, 'yak-shroom', 0.5, (r) => r.range(0.26, 0.4), P.shroom, (r) => ({ cap: t(r.pick(['#d8603c', '#e89a3c', '#c84a5a'])), lit: t('#ffc890'), stem: t('#f4ead8'), dot: t('#fff6e0') }));
    S.rootS = v(4, 'yak-root', (r) => r.range(1, 1.8), (r) => r.range(0.2, 0.34), (ctx, w, h, r) => { ctx.strokeStyle = t('#6a4c3c'); ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { ctx.lineWidth = r.range(0.06, 0.12); ctx.beginPath(); ctx.moveTo(w * r.range(0, 0.2), h); ctx.bezierCurveTo(w * r.range(0.2, 0.4), h * r.range(-0.2, 0.3), w * r.range(0.6, 0.8), h * r.range(0, 0.5), w * r.range(0.8, 1), h); ctx.stroke(); } ctx.strokeStyle = rgba(t('#b8f060'), 0.7); ctx.lineWidth = 0.035; ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.5); ctx.quadraticCurveTo(w * 0.5, h * 0.1, w * 0.8, h * 0.5); ctx.stroke(); }, {});
    const cd = (far) => () => ({ bark: far ? t.h('#7a5a4c', 0.12) : t('#7a5a4c'), lit: far ? t.h('#b89a84', 0.12) : t('#c0a088'), dark: t('#3a2a26'), moss: t('#4f9a3c'), mossLit: t('#b8f060'), leaf: far ? t.h('#2f5f3a', 0.12) : t('#2a5a36'), leafLit: far ? t.h('#6fa850', 0.12) : t('#7fb858') });
    S.cedar = v(4, 'yak-cedar', (r) => r.range(6, 8.5), (r) => r.range(14, 18), P.cedar, cd(false), { ppu: 40 }); S.cedarFar = v(3, 'yak-cedarf', 1, 2.2, P.cedar, cd(true), { ppu: 56 }); S.cedarS = v(1, 'yak-cedars', 1.5, 3, P.cedar, cd(false), { ppu: 64 });
    const sg = (far) => (r) => ({ col: far ? t.h(r.pick(['#2a5a3a', '#1f4a34', '#3a6a40']), 0.12) : t(r.pick(['#2a5a3a', '#1f4a34'])), lit: far ? t.h('#7fb860', 0.12) : t('#8fc868'), trunk: t('#4a3a30') });
    S.sugi = v(5, 'yak-sugi', (r) => r.range(2.4, 3.4), (r) => r.range(6, 9), P.sugi, sg(false), { ppu: 48 }); S.sugiFar = v(5, 'yak-sugif', 1, (r) => r.range(2.2, 3), P.sugi, sg(true), { ppu: 40 });
    S.stump = v(3, 'yak-stump', (r) => r.range(2.8, 3.8), (r) => r.range(1.8, 2.6), P.stump, () => ({ bark: t('#6a4c40'), lit: t('#a88a74'), dark: t('#1a1210'), moss: t('#4f9a3c'), mossLit: t('#b8f060') }));
    const dr = (graze, far, stag) => () => ({ col: far ? t.h('#8a6248', 0.1) : t('#8a6248'), pale: t('#e8dccc'), dark: t('#5a4034'), face: t('#7a5a48'), graze, spots: t('#f4ead8'), rump: t('#ffffff'), antler: stag ? t('#d8c8a8') : null });
    S.deer = [...v(1, 'yak-deer', 1.5, 1.35, P.deer, dr(0, false, true)), ...v(1, 'yak-doe', 1.4, 1.25, P.deer, dr(0, false, false))]; S.deerB = [...v(1, 'yak-deerb', 1.5, 1.35, P.deer, dr(0.85, false, true)), ...v(1, 'yak-doeb', 1.4, 1.25, P.deer, dr(0.85, false, false))];
    S.deerFar = [...v(2, 'yak-deerf', 1.5, 1.35, P.deer, dr(0, true, false), { ppu: 48 }), ...v(2, 'yak-deerg', 1.5, 1.35, P.deer, dr(0.9, true, false), { ppu: 48 })];
    const mq = (arm) => () => ({ col: t('#6a6460'), lit: t('#a8a098'), face: t('#e87a6a'), arm }); S.macaque = v(2, 'yak-mac', 0.75, 0.85, P.macaque, mq(0)); S.macaqueB = v(2, 'yak-mac', 0.75, 0.85, P.macaque, mq(1));
    S.elder = v(1, 'yak-elder', 1.5, 1.7, P.macaque, () => ({ col: t('#8a8680'), lit: t('#d8d4cc'), face: t('#e87a6a'), arm: 0 })); S.elderB = v(1, 'yak-elder', 1.5, 1.7, P.macaque, () => ({ col: t('#8a8680'), lit: t('#d8d4cc'), face: t('#e87a6a'), arm: 1 }));
    S.mistS = v(3, 'yak-mists', 6, 1, P.mist, { col: mix('#ffffff', time.haze, 0.3) }, { ax: 0.5, ay: 0.5, ppu: 24 });
    S.boatFar = v(2, 'yak-boat', 1.4, 0.7, P.boat, () => ({ hull: t('#f4f0e8'), cabin: t('#3f8f95') }), { ppu: 64 });
    return S;
  },
  slab(w, kind, time) {
    const t = tones(time), r = new RNG('yakslab' + w + kind);
    if (kind === 'log') return sprite(w, 0.95, (ctx) => {      // a fallen cedar lying across the gully: bark below, a pelt of moss above, the heartwood showing at the broken end
      const g = ctx.createLinearGradient(0, 0, 0, 0.95); g.addColorStop(0, t('#8a6a54')); g.addColorStop(0.5, t('#6a4c3c')); g.addColorStop(1, t('#2a1c18')); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(0, 0.06, w, 0.82, 0.4); ctx.fill();
      ctx.strokeStyle = rgba(t('#2a1c18'), 0.45); ctx.lineWidth = 0.03; for (let i = 0; i < w * 2.2; i++) { const x = r.range(0.3, w - 0.3), y = r.range(0.3, 0.8); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r.range(0.5, 1.4), y + r.range(-0.03, 0.03)); ctx.stroke(); }
      ctx.fillStyle = t('#c8a888'); ctx.beginPath(); ctx.ellipse(w - 0.22, 0.47, 0.17, 0.36, 0, 0, 7); ctx.fill(); ctx.strokeStyle = rgba(t('#6a4c3c'), 0.7); ctx.lineWidth = 0.02; for (const k of [0.1, 0.2, 0.28]) { ctx.beginPath(); ctx.ellipse(w - 0.22, 0.47, k * 0.6, k * 1.2, 0, 0, 7); ctx.stroke(); }
      for (let i = 0; i < w * 3; i++) { ctx.fillStyle = mix(t('#3f8a34'), t('#b8f060'), r.u()); ctx.beginPath(); ctx.ellipse(r.range(0.2, w - 0.5), r.range(0.04, 0.2), r.range(0.2, 0.45), r.range(0.06, 0.12), 0, 0, 7); ctx.fill(); } }, { ax: 0.5, ay: 0.06 });
    // a boulder standing in the stream, its head dry and green
    return sprite(w, 1.9, (ctx) => { const g = ctx.createLinearGradient(0, 0, w, 1.9); g.addColorStop(0, t('#a8b8b0')); g.addColorStop(0.5, t('#6a7a74')); g.addColorStop(1, t('#3a4a48')); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0.02, 0.24); ctx.quadraticCurveTo(w * 0.1, 0.04, w * 0.3, 0.04); ctx.lineTo(w * 0.7, 0.04); ctx.quadraticCurveTo(w * 0.94, 0.06, w - 0.02, 0.3);
      ctx.quadraticCurveTo(w * (1 + r.range(0, 0.04)), 1.2, w * 0.86, 1.9); ctx.lineTo(w * 0.14, 1.9); ctx.quadraticCurveTo(-w * 0.03, 1.2, 0.02, 0.24); ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.25); ctx.fillRect(w * 0.1, 0.5, w * 0.8, 0.03); for (let i = 0; i < 7; i++) { ctx.fillStyle = mix(t('#3f8a34'), t('#b8f060'), r.u()); ctx.beginPath(); ctx.ellipse(r.range(0.25, w - 0.25), r.range(0.03, 0.12), r.range(0.2, 0.36), r.range(0.05, 0.09), 0, 0, 7); ctx.fill(); } }, { ax: 0.5, ay: 0.03 });
  },
};
