// Cappadocia: fairy chimneys, valleys of soft rock in cream and rose and honey, rooms cut into the stone, vineyards and poplars,
// the snow of Mount Erciyes on the horizon, and at first light a sky full of balloons.
// Colours are written for full daylight and toned to the hour.
import { RNG } from '../../core/rng.js';
import { P, variants, sprite, stamp, mix, rgba, lighten, hash1, TAU } from '../paint.js';

const TIMES = {
  dawn:   { wash: [{ x: 0.7, y: 0.42, r: 0.9, col: '#ff8a70', a: 0.5 }, { x: 0.12, y: 0.06, r: 0.8, col: '#3c4fc0', a: 0.36 }, { x: 0.7, y: 0.55, r: 0.5, col: '#ffe08a', a: 0.5 }], sky: ['#34408e', '#8672b8', '#f5a183', '#ffe2ae'], skyAt: [0, 0.4, 0.76, 1], sun: { x: 0.7, y: 0.33, r: 0.036, col: '#fff3d6', glow: '#ffb070' }, bloom: 0.4, haze: '#f6c9a6', shade: '#4a3560', dark: 0.1, mist: 0.3, shafts: 0.07, tint: 'rgba(255,170,120,0.16)', rim: '#ffe0b8', snow: '#ffeede', water: '#b06a55', balloons: 18 },
  day:    { wash: [{ x: 0.82, y: 0.14, r: 0.7, col: '#fff3c0', a: 0.3 }, { x: 0.1, y: 0.8, r: 0.9, col: '#ffd9a8', a: 0.3 }, { x: 0.3, y: 0.02, r: 0.8, col: '#1858d8', a: 0.3 }], sky: ['#2f74cc', '#6fb0ea', '#cde6f4', '#f8ecd8'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.82, y: 0.14, r: 0.03, col: '#fffbe8', glow: '#fff0b8' }, haze: '#ecdcc4', shade: '#3a2c44', dark: 0, mist: 0.14, shafts: 0.04, tint: 'rgba(255,230,180,0.12)', rim: '#ffffff', snow: '#ffffff', water: '#b8684a', balloons: 5 },
  golden: { wash: [{ x: 0.2, y: 0.4, r: 0.85, col: '#ff8a3c', a: 0.5 }, { x: 0.88, y: 0.1, r: 0.9, col: '#5466d8', a: 0.36 }, { x: 0.55, y: 0.78, r: 0.7, col: '#ffcf8a', a: 0.4 }], sky: ['#3d62a6', '#96a6cc', '#f8c27e', '#ffe9b4'], skyAt: [0, 0.45, 0.82, 1], sun: { x: 0.2, y: 0.36, r: 0.04, col: '#fff0c4', glow: '#ffb85a' }, bloom: 0.38, haze: '#ffd39a', shade: '#55303c', dark: 0.05, mist: 0.24, shafts: 0.09, tint: 'rgba(255,170,80,0.2)', rim: '#ffe6b0', snow: '#fff0d8', water: '#b86c4a', balloons: 9 },
  dusk:   { wash: [{ x: 0.26, y: 0.5, r: 0.85, col: '#ff5f7e', a: 0.5 }, { x: 0.88, y: 0.16, r: 0.9, col: '#2a2ca8', a: 0.4 }, { x: 0.6, y: 0.8, r: 0.6, col: '#ffb06a', a: 0.4 }], sky: ['#1a1d50', '#51408a', '#d06c8e', '#ffb07a'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.26, y: 0.45, r: 0.04, col: '#ffe1c0', glow: '#ff8f6a' }, haze: '#d490a0', shade: '#2a1d4c', dark: 0.24, mist: 0.26, shafts: 0.05, tint: 'rgba(255,120,140,0.16)', rim: '#ffc8b8', snow: '#f4d6de', water: '#8a5068', stars: 0.35, aura: 0.38, balloons: 3 },
  night:  { wash: [{ x: 0.5, y: 0.98, r: 0.7, col: '#b0603a', a: 0.22 }, { x: 0.2, y: 0.15, r: 0.5, col: '#3a5fd8', a: 0.3 }, { x: 0.85, y: 0.3, r: 0.6, col: '#4a2f9a', a: 0.3 }], sky: ['#060920', '#0d1840', '#1a2c5c', '#2c4474'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.78, y: 0.16, r: 0.03, col: '#f6f4e8', glow: '#aebcff', moon: true }, haze: '#243a66', shade: '#0a0f2c', dark: 0.55, mist: 0.2, tint: 'rgba(90,140,255,0.14)', rim: '#cfd8ff', snow: '#c4d4ff', water: '#2c3460', stars: 1, cloud: 0.25, aura: 0.5, vignette: 0.5, balloons: 0 },
  winter: { wash: [{ x: 0.5, y: 0.6, r: 0.9, col: '#f2f4f6', a: 0.35 }, { x: 0.2, y: 0.2, r: 0.6, col: '#9fb4d8', a: 0.3 }], sky: ['#8a9cb8', '#b6c4d6', '#e4e8ec'], bow: true, haze: '#d6dde4', shade: '#3a4458', dark: 0.08, mist: 0.45, cloud: 0.6, tint: 'rgba(200,220,240,0.12)', rim: '#ffffff', snow: '#ffffff', water: '#7f8ea6', balloons: 4 },
};
function tones(time) { const t = (hex) => mix(hex, time.shade, time.dark); t.h = (hex, k) => mix(mix(hex, time.shade, time.dark), time.haze, k); return t; }
const lamps = (time) => (time.stars || 0) > 0.3 || time.dark > 0.2;

export const cappadocia = {
  id: 'cappadocia', name: 'Cappadocia', zone: 'tuff', times: TIMES,
  stamps: [{ s: 'chimneyBig', name: 'Fairy chimney' }, { s: 'balloon', name: 'Hot-air balloon' }, { s: 'jars', name: 'Clay jars' }, { s: 'poplar', name: 'Poplar' }, { s: 'apricot', name: 'Apricot tree' }, { s: 'castle', name: 'Rock castle' }],
  note: 'Cappadocia’s soft rock is tuff: ash from old volcanoes, hardened into stone. Where a harder cap protects it, a pillar is left standing.',

  far(time) {
    const t = tones(time), snowy = time === TIMES.winter;
    return [
      { par: 0.012, scale: 1.3, base: 0.47, amp: 0.12, style: 'round', seed: 3, col: mix('#ffffff', time.haze, 0.45), haze: 0.1, lit: 0.14, facet: 0, rimA: 0.55, foot: 0.9 },
      // Erciyes, the volcano whose ash made this country, with snow on it the year round
      { par: 0.022, scale: 1.5, base: 0.5, amp: 0.34, style: 'volc', seed: 9, col: t('#7c86b8'), haze: 0.4, snow: 0.34, snowA: 0.92, lit: 0.1, ribs: 0.2, ribGap: 1.1,
        bands: [{ col: t('#9aa6d6'), a: 0.4, at: 0.36, th: 0.12, w: 0.2, f: 3, s: 5 }] },
      // the tableland: beds of white, rose and ochre ash laid one on another, cut off flat at the top
      { par: 0.05, scale: 0.7, base: 0.56, amp: 0.17, style: 'table', seed: 21, col: t(snowy ? '#b9bcc8' : '#d9a996'), haze: 0.3, lit: 0.12, ribs: 0.18, snow: snowy ? 0.2 : 0,
        bands: [{ col: t('#f6ead6'), a: 0.75, at: 0.1, th: 0.12, w: 0.06, f: 2, s: 2 }, { col: t('#e58f86'), a: 0.6, at: 0.3, th: 0.16, w: 0.08, f: 2, s: 4 }, { col: t('#eac06c'), a: 0.6, at: 0.54, th: 0.14, w: 0.08, f: 2, s: 6 }, { col: t('#f4e6cc'), a: 0.6, at: 0.76, th: 0.1, w: 0.08, f: 2, s: 8 }],
        stamps: [{ s: 'castle', every: 2.2, p: 0.6, size: 0.06, seed: 2, sink: 0.01, glow: 0.5 }] },
      // a forest of chimneys a long way off
      { par: 0.085, scale: 0.34, base: 0.62, amp: 0.13, style: 'cone', seed: 33, col: t(snowy ? '#c9c6c8' : '#e3c08e'), haze: 0.2, lit: 0.16, snow: snowy ? 0.3 : 0, fog: 0.16,
        bands: [{ col: t('#f8e9c8'), a: 0.6, at: 0.3, th: 0.2, w: 0.1, f: 3, s: 3 }, { col: t('#d98a78'), a: 0.5, at: 0.62, th: 0.2, w: 0.1, f: 3, s: 7 }],
        stamps: [{ s: 'chimneyFar', every: 0.11, p: 0.6, size: 0.05, seed: 4, sink: 0.012 }, { s: '-', kind: 'flock', every: 0.8, p: 0.6, size: 0.012, seed: 6, n: 8, sink: -0.03 }] },
      // the valley floor: vineyards in rows, poplars along the stream, a village, the red river
      { par: 0.16, scale: 0.4, base: 0.69, amp: 0.12, style: 'round', seed: 47, col: t(snowy ? '#d2d6dc' : '#c9b07a'), haze: 0.12, foot: 0.45, fog: 0.14,
        bands: [{ col: t(snowy ? '#eef2f6' : '#7d9c46'), a: 0.75, at: 0.02, th: 0.2, w: 0.1, f: 3, s: 2 }, { col: t('#5f8a3a'), a: 0.6, at: 0.24, th: 0.07, w: 0.05, f: 9, s: 4 }, { col: t('#5f8a3a'), a: 0.6, at: 0.36, th: 0.07, w: 0.05, f: 9, s: 5 }, { col: t('#b9603f'), a: 0.85, at: 0.58, th: 0.045, w: 0.12, f: 1.4, s: 9, glint: 16 }],
        stamps: [{ s: 'poplarFar', every: 0.07, p: 0.55, size: 0.05, seed: 3, sink: 0.004 }, { s: 'stoneHouse', kind: 'smoke', every: 0.3, p: 0.5, size: 0.03, seed: 5, drop: [0.05, 0.4], glow: 0.7 }, { s: 'waveFar', every: 0.3, p: 0.5, size: 0.06, seed: 6, drop: [0, 0.3] }, { s: 'chimneyFar', every: 0.22, p: 0.5, size: 0.08, seed: 7, drop: [0, 0.3] },
          { s: 'horseFar', kind: 'graze', every: 0.3, p: 0.5, size: 0.034, seed: 11, drop: [0.1, 0.5], roam: 1.2, speed: 0.05 }, { s: 'poplarFar', every: 0.09, p: 0.5, size: 0.06, seed: 13, drop: [0.44, 0.54] }] },
      // the near slopes: waves of rose and cream rock, chimneys with rooms in them, apricot trees
      { par: 0.3, scale: 0.36, base: 0.79, amp: 0.14, style: 'round', seed: 61, col: t(snowy ? '#c4c8d0' : '#d9a888'), haze: 0.05, foot: 0.3,
        bands: [{ col: t(snowy ? '#f4f6fa' : '#f3dfc0'), a: 0.8, at: 0.02, th: 0.16, w: 0.12, f: 4, s: 3 }, { col: t('#e8958a'), a: 0.6, at: 0.2, th: 0.14, w: 0.12, f: 3, s: 5 }, { col: t('#ecc77a'), a: 0.55, at: 0.4, th: 0.12, w: 0.12, f: 4, s: 7 }, { col: t('#7d9c46'), a: 0.6, at: 0.6, th: 0.1, w: 0.14, f: 5, s: 9 }],
        stamps: [{ s: 'waveFar', every: 0.2, p: 0.6, size: 0.07, seed: 19, sink: 0.012 }, { s: 'chimneyMid', every: 0.16, p: 0.6, size: 0.085, seed: 21, sink: 0.01, glow: 0.35 }, { s: 'chimneyMid', every: 0.21, p: 0.5, size: 0.075, seed: 22, drop: [0.05, 0.35], glow: 0.35 }, { s: 'apricotFar', every: 0.08, p: 0.5, size: 0.05, seed: 23, drop: [0.05, 0.5] }, { s: 'poppyFar', every: 0.03, p: 0.6, size: 0.04, seed: 25, sink: 0.003 }, { s: 'tuftFar', every: 0.03, p: 0.7, size: 0.035, seed: 27, sink: 0.003 },
          { s: 'jarFar', every: 0.4, p: 0.5, size: 0.04, seed: 29, drop: [0.1, 0.4] }, { s: '-', kind: 'flock', every: 0.6, p: 0.5, size: 0.016, seed: 31, n: 6, sink: -0.04 }] },
    ];
  },
  // balloons, most of them at first light, drifting with whatever wind there is; the burner shows when the light is low
  sky(ctx, sc) {
    const n = sc.time.balloons || 0, list = sc.spr.balloon; if (!n || !list) return; const { W, H, t } = sc, low = sc.time.dark > 0.06 || !!sc.time.wash?.[0]?.col.startsWith('#ff8a70');
    for (let i = 0; i < n; i++) { const d = 0.25 + hash1(i, 201) * 0.75, x = ((((hash1(i, 202) + sc.windX * 0.0016 * d + t * 0.0009 * d) % 1.3) + 1.3) % 1.3 - 0.15) * W, y = (0.08 + hash1(i, 203) * 0.42 + Math.sin(t * 0.13 + i * 1.7) * 0.02) * H, s = d * H * 0.11;
      ctx.globalAlpha = 0.55 + 0.45 * d; stamp(ctx, list[i % list.length], x, y + s * 0.6, s, Math.sin(t * 0.3 + i) * 0.03);
      if (low && Math.sin(t * (1.1 + hash1(i, 204)) + i * 2.3) > 0.55) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.8; stamp(ctx, sc.fx.warm, x, y + s * 0.42, s * 0.5); ctx.restore(); } }
    ctx.globalAlpha = 1;
  },
  behind: [
    { s: 'wave', every: 8, p: 0.6, size: 1, seed: 397, sink: 0.35 },
    { s: 'chimney', every: 11, p: 0.62, size: 1, seed: 401, sink: 0.3, glow: 0.35 },
    { s: 'chimneyBig', every: 37, p: 0.6, size: 1, seed: 405, sink: 0.4, glow: 0.3 },
    { s: 'poplar', every: 7, p: 0.4, size: 1, seed: 409, sink: 0.25, zone: ['vine', 'dust', 'honey'] },
    { s: 'apricot', every: 6, p: 0.45, size: 1, seed: 413, sink: 0.2, zone: ['vine', 'tuff'] },
    { s: 'rockBig', every: 9, p: 0.35, size: 1, seed: 417, sink: 0.5 },
    { s: 'jars', every: 23, p: 0.5, size: 1, seed: 421, sink: 0.05, zone: ['dust', 'honey', 'tuff'] },
    { s: 'horse', frames: ['horse', 'horseB'], fps: 0.5, every: 29, p: 0.5, size: 1, seed: 425, sink: 0.04, zone: ['vine', 'dust'], roam: 1.7, speed: 0.07 },
  ],
  ground(time) {
    const t = tones(time), band = (a, b, c, w = [1, 0.46, 0.13]) => ({ bands: [{ col: t(a), w: w[0] }, { col: t(b), w: w[1] }, { col: t(c), w: w[2] }] });
    return {
      body: [t('#b8977c'), t('#8a6a5e'), t('#4a3640')],
      // the beds of ash show in every cut bank
      strata: [{ col: t('#f4e6cc'), a: 0.55, w: 0.22, d: 1.2, follow: 0.94, f: 0.3, seed: 3, wob: 0.4 }, { col: t('#d98a7c'), a: 0.5, w: 0.3, d: 2.3, follow: 0.88, f: 0.22, seed: 5, wob: 0.6 }, { col: t('#e8c078'), a: 0.45, w: 0.2, d: 3.6, follow: 0.8, f: 0.3, seed: 7, wob: 0.8 }, { col: t('#f1e0c4'), a: 0.4, w: 0.16, d: 5, follow: 0.66, f: 0.2, seed: 9, wob: 1 }, { col: t('#6a4a52'), a: 0.4, w: 0.3, d: 6.8, follow: 0.5, f: 0.2, seed: 11, wob: 1.2 }],
      embed: { s: 'stone', every: 1.8, p: 0.4, a: 0.5 },
      skin: {
        tuff: band('#c9a984', '#ecd8b4', '#fff4dc'), rose: band('#c77a70', '#eba79a', '#ffd8cc'), honey: band('#c99a48', '#edc878', '#fff0b4'), dust: band('#a88868', '#d4b890', '#f2e2c4', [0.8, 0.34, 0.09]),
        vine: band('#4f7030', '#86a84a', '#c2dc7a'), cap: band('#4a3e3a', '#75665e', '#a89888', [0.8, 0.3, 0.08]), snow: band('#b4c6e0', '#e6eefa', '#ffffff', [1.2, 0.6, 0.2]),
      },
      decor: {
        tuff: [{ s: 'pebble', p: 0.4, size: 1, sink: 0.03 }, { s: 'tuftDry', p: 0.3, size: 1, sway: 0.06 }, { s: 'thyme', p: 0.12, size: 1, sway: 0.04 }, { s: 'rock', p: 0.1, size: 1, sink: 0.08 }],
        rose: [{ s: 'pebble', p: 0.4, size: 1, sink: 0.03 }, { s: 'poppy', p: 0.3, size: 1, sway: 0.07 }, { s: 'tuftDry', p: 0.25, size: 1, sway: 0.06 }],
        honey: [{ s: 'tuftDry', p: 0.5, size: 1, sway: 0.06 }, { s: 'thyme', p: 0.25, size: 1, sway: 0.04 }, { s: 'pebble', p: 0.3, size: 1, sink: 0.03 }, { s: 'poppy', p: 0.1, size: 1, sway: 0.07 }],
        dust: [{ s: 'pebble', p: 0.5, size: 1, sink: 0.03 }, { s: 'rock', p: 0.14, size: 1, sink: 0.08 }, { s: 'tuftDry', p: 0.16, size: 0.9, sway: 0.06 }],
        vine: [{ s: 'tuft', p: 0.8, size: 1, sway: 0.06 }, { s: 'vine', p: 0.3, size: 1, sink: 0.04, steep: 0.8 }, { s: 'poppy', p: 0.3, size: 1, sway: 0.07 }, { s: 'thyme', p: 0.14, size: 1, sway: 0.04 }],
        cap: [{ s: 'rock', p: 0.3, size: 1, sink: 0.08 }, { s: 'pebble', p: 0.5, size: 1, sink: 0.03 }],
        snow: [{ s: 'drift', p: 0.5, size: 1, sink: 0.06, steep: 1.6 }, { s: 'tuftDry', p: 0.12, size: 0.8, sway: 0.05 }],
      },
    };
  },
  lives: { every: 6, p: 0.6, zones: ['vine', 'rose', 'honey'], cols: ['#ffffff', '#ffd23c', '#ff9a4a', '#c8a8ff'] },
  fore: [
    { s: 'foreRock', par: 1.5, every: 19, p: 0.45, size: 1, seed: 501, sink: 0.45, a: 1 },
    { s: 'foreGrass', par: 1.7, every: 3.8, p: 0.7, size: 1, seed: 505, sink: 0.2, a: 0.95 },
  ],
  ambient(time) { return time.stars > 0.5 ? [] : [{ n: 30, col: '#fff3d0', size: 1.6, speed: -0.01, drift: 0.02, a: 0.4, par: 0.4, sway: 10, twinkle: true }]; },
  // The plateau is high and dry: little rain, a breeze, and still air at dawn, which is why the balloons fly then. In winter it snows.
  weather(key) {
    return { dawn: { wet: 0.12, fog: 0.4, wind: 0.5, gust: 0.4 }, day: { wet: 0.3, fog: 0.08, wind: 1.5 }, golden: { wet: 0.25, fog: 0.15, wind: 1.2 }, dusk: { wet: 0.3, fog: 0.2, wind: 1.4, gust: 1.6 },
      night: { wet: 0.25, fog: 0.1, wind: 0.9, clear: 0.4 }, winter: { wet: 0.8, cold: 1, fog: 0.5, wind: 1.1, gust: 1, early: true } }[key] || {};
  },

  sprites(time) {
    const t = tones(time), S = {}, v = variants, dark = lamps(time), win = dark ? '#ffd76a' : t('#3a2c2a'), snowy = time === TIMES.winter;
    S.cloud = v(5, 'cap-cloud', (r) => r.range(3.4, 6), (r) => r.range(1, 1.5), P.cloud, { col: mix('#ffffff', time.haze, 0.2), under: mix(mix('#c8b8c8', time.shade, time.dark * 0.6), time.haze, 0.45) }, { ax: 0.5, ay: 0.5, ppu: 64, blur: 0.8 });
    S.cirrus = v(4, 'cap-cirrus', 9, 1.1, P.mist, { col: mix('#ffffff', time.haze, 0.3) }, { ax: 0.5, ay: 0.5, ppu: 28 });
    S.cloudlet = v(3, 'cap-smoke', 2.2, 1.2, P.mist, { col: '#ffffff' }, { ax: 0.5, ay: 1, ppu: 40 });
    S.mist = v(3, 'cap-mist', 12, 2, P.mist, { col: mix('#ffffff', time.haze, 0.4) }, { ax: 0.5, ay: 0.5, ppu: 24 });
    const pal = [['#e8503a', '#f6e7c4'], ['#f2a23a', '#3f6fb0', '#f6e7c4'], ['#d94f7a', '#ffd76a'], ['#3fa8a0', '#f6e7c4', '#e8503a'], ['#7a5fc8', '#ffd76a', '#f6e7c4'], ['#f2c53a', '#e8503a'], ['#2f6f9a', '#ffffff'], ['#e8503a', '#ffd76a', '#3fa8a0', '#f6e7c4'], ['#8fc84a', '#f6e7c4', '#2f6f5a'], ['#f08ab0', '#ffffff', '#7a5fc8']];
    S.balloon = pal.map((cols, i) => sprite(1, 1.32, (ctx, w, h) => P.balloon(ctx, w, h, new RNG('balloon' + i), { cols: cols.map((c) => mix(t(c), time.haze, 0.12)), basket: t('#6a4a30') }), { ax: 0.5, ay: 0.5, ppu: 110 }));
    const rockC = snowy ? ['#c9c2b8', '#b8b0a8'] : ['#d9c3a0', '#cdb090', '#e0cfae'];
    // the real colours are quiet: ivory, a pale rose, a pale honey, with a cool shadow side and a brown-grey cap
    const sunLeft = time.sun ? time.sun.x < 0.5 : true, snow = snowy ? '#ffffff' : null, stone = [['#e9dfc6', '#fdf6e2', '#a9a0b4'], ['#e6cdb8', '#fbe8d8', '#a8929c'], ['#e6d6a4', '#fbf0c8', '#a89a84']];
    const chim = (rooms, o = {}) => (r) => { const c = r.pick(stone); return { col: t(c[0]), lit: t(c[1]), shade: t(c[2]), cap: t('#6b5a50'), capLit: t('#a8927e'), win: dark ? '#ffd76a' : null, rooms: rooms(r), sunLeft, snow, ...o }; };
    S.chimney = v(8, 'cap-chim', (r) => r.range(2.3, 4.6), (r) => r.range(3.6, 5.6), P.chimney, chim((r) => r.pick([0, 0, 2, 3, 4])));
    S.chimneyBig = v(4, 'cap-chimb', (r) => r.range(4.4, 6.8), (r) => r.range(7, 9.2), P.chimney, chim((r) => r.int(3, 6)));
    S.chimneyMid = v(6, 'cap-chimm', (r) => r.range(0.75, 1.4), (r) => r.range(1.1, 1.7), P.chimney, chim((r) => r.pick([0, 2, 3])), { ppu: 64 });
    const far3 = (r) => { const c = r.pick(stone); return { col: t.h(c[0], 0.14), lit: t.h(c[1], 0.14), shade: t.h(c[2], 0.14), cap: t.h('#6b5a50', 0.14), capLit: t.h('#a8927e', 0.14), sunLeft, snow }; };
    S.chimneyFar = v(6, 'cap-chimf', (r) => r.range(0.65, 1.3), (r) => r.range(1, 1.6), P.chimney, far3, { ppu: 48 });
    S.wave = v(5, 'cap-wave', (r) => r.range(4, 8), (r) => r.range(1.1, 2.4), P.badland, (r) => { const c = r.pick(stone); return { col: t(c[0]), lit: t(c[1]), shade: t(c[2]), sunLeft }; });
    S.waveFar = v(4, 'cap-wavef', (r) => r.range(2, 3.4), (r) => r.range(0.5, 0.9), P.badland, (r) => { const c = r.pick(stone); return { col: t.h(c[0], 0.12), lit: t.h(c[1], 0.12), shade: t.h(c[2], 0.12), sunLeft }; }, { ppu: 48 });
    S.castle = [sprite(2.6, 2.2, (ctx, w, h) => { const r = new RNG('castle'); P.rock(ctx, w, h, r, { col: t.h('#d2b490', 0.2), lit: t.h('#f2e0c0', 0.2) }); ctx.fillStyle = dark ? '#ffd76a' : t.h('#5a4640', 0.2); for (let i = 0; i < 16; i++) ctx.fillRect(r.range(0.2, 0.8) * w, r.range(0.3, 0.9) * h, 0.05, 0.07); }, { ppu: 48 })];
    S.poplar = v(4, 'cap-poplar', (r) => r.range(0.9, 1.2), (r) => r.range(3.4, 5), P.poplar, () => ({ col: t(snowy ? '#8a8f86' : '#5f8a3f'), lit: t(snowy ? '#e8ecee' : '#b4d06a'), trunk: t('#6a5a48') }));
    S.poplarFar = v(3, 'cap-popf', 0.3, (r) => r.range(0.9, 1.3), P.poplar, () => ({ col: t.h(snowy ? '#8a8f86' : '#557d3a', 0.1), lit: t.h('#a4c060', 0.1), trunk: t('#5a4a3c') }), { ppu: 48 });
    S.apricot = v(4, 'cap-apri', (r) => r.range(1.5, 2.2), (r) => r.range(1.3, 1.9), P.shrub, (r) => ({ col: t('#557d36'), lit: t('#a8cc5f'), berry: snowy ? null : t('#f29a3a'), stem: t('#5a4636') }));
    S.apricotFar = v(3, 'cap-aprif', 0.9, 0.8, P.shrub, () => ({ col: t('#4f7534'), lit: t('#96b856'), berry: snowy ? null : t('#f29a3a'), stem: t('#5a4636') }), { ppu: 48 });
    S.vine = v(4, 'cap-vine', (r) => r.range(0.7, 1), (r) => r.range(0.5, 0.75), P.shrub, () => ({ col: t('#4f7a30'), lit: t('#a4c858'), berry: t('#6a3f8a'), stem: t('#5a4636') }));
    S.tuft = v(6, 'cap-tuft', (r) => r.range(0.4, 0.6), (r) => r.range(0.3, 0.5), P.tuft, (r) => ({ col: t(r.pick(['#6f9040', '#7d9c46'])), tip: t('#cfe07c'), n: r.int(8, 13) }));
    S.tuftDry = v(5, 'cap-dry', (r) => r.range(0.36, 0.6), (r) => r.range(0.3, 0.55), P.tuft, () => ({ col: t('#b89a50'), tip: t('#f4de98'), n: 10 }));
    S.tuftFar = v(3, 'cap-tfar', 0.5, 0.4, P.tuft, () => ({ col: t('#a88c4a'), tip: t('#e0c880'), n: 8 }), { ppu: 44 });
    S.poppy = v(5, 'cap-poppy', 0.22, (r) => r.range(0.3, 0.46), P.flower, () => ({ kind: 'cup', col: t('#e63a2e'), col2: t('#ff8a6a'), stem: t('#5a8a45') }));
    S.poppyFar = v(3, 'cap-poppyf', 0.22, 0.4, P.flower, () => ({ kind: 'cup', col: t('#e63a2e'), col2: t('#ff8a6a'), stem: t('#5a8a45') }), { ppu: 44 });
    S.thyme = v(4, 'cap-thyme', 0.26, (r) => r.range(0.22, 0.34), P.flower, () => ({ kind: 'pom', col: t('#a06ad0'), col2: t('#e0c0ff'), stem: t('#6a8a55') }));
    const rk = (r) => ({ col: t(r.pick(rockC)), lit: t('#fff4dc'), ...(snowy ? { snow: '#ffffff' } : {}) });
    S.rock = v(6, 'cap-rock', (r) => r.range(0.4, 0.9), (r) => r.range(0.25, 0.5), P.rock, rk);
    S.rockBig = v(5, 'cap-rockb', (r) => r.range(1.8, 3.4), (r) => r.range(1, 2), P.rock, rk);
    S.pebble = v(5, 'cap-peb', (r) => r.range(0.12, 0.26), (r) => r.range(0.07, 0.13), P.rock, rk);
    S.stone = v(4, 'cap-stone', (r) => r.range(0.3, 0.8), (r) => r.range(0.2, 0.45), P.rock, () => ({ col: t('#a88a78'), lit: t('#d4bca4') }));
    S.drift = v(4, 'cap-drift', (r) => r.range(0.8, 1.5), (r) => r.range(0.16, 0.3), P.mound, () => ({ col: t('#e4ecf8'), lit: t('#ffffff') }));
    S.stoneHouse = v(4, 'cap-house', 1.1, 0.8, P.house, (r) => ({ wall: t(r.pick(['#e6d2b0', '#d9c09a', '#f0e2c4'])), roof: t('#b89a78'), win, trim: t('#5a4636'), flat: true }), { ppu: 64 });
    S.jars = [0, 1, 2].map((i) => sprite(1.5, 0.8, (ctx, w, h) => { const r = new RNG('jars' + i); for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(k * 0.45 + r.range(0, 0.08), h - (0.5 + r.range(0, 0.28))); P.jar(ctx, 0.42, 0.5 + r.range(0, 0.28), r, { col: t(r.pick(['#b8643a', '#a8553a', '#c9784a'])), lit: t('#e8a870'), band: t('#f1e2c4') }); ctx.restore(); } }));
    S.jarFar = v(2, 'cap-jarf', 0.5, 0.7, P.jar, () => ({ col: t('#b8643a'), lit: t('#e8a870'), band: t('#f1e2c4') }), { ppu: 48 });
    const coat = (tail) => (r) => { const c = r.pick([['#8a5a3a', '#3a2a22'], ['#c9a268', '#f6ecd4'], ['#e8e2d8', '#bcb4a8'], ['#4a3830', '#1c1614']]), g = r.pick([0, 1]); return { col: t(c[0]), dark: t(mix(c[0], '#000000', 0.4)), mane: t(c[1]), neck: 0.7, head: 0.24, tail, graze: g }; };
    S.horse = v(4, 'cap-horse', 2, 1.6, P.quad, coat(0.25)); S.horseB = v(4, 'cap-horse', 2, 1.6, P.quad, coat(0.9)); S.horseFar = v(3, 'cap-hfar', 2, 1.6, P.quad, coat(0.5), { ppu: 48 });
    const near = t('#1c1420');
    S.foreRock = v(3, 'cap-frock', (r) => r.range(4, 7), (r) => r.range(1.4, 2.4), P.rock, () => ({ col: near, lit: mix(near, time.haze, 0.3) }), { ppu: 30, blur: 1.1 });
    S.foreGrass = v(4, 'cap-fgrass', (r) => r.range(1.6, 2.6), (r) => r.range(1.3, 2.4), (ctx, w, h, r) => { P.tuft(ctx, w, h, r, { col: near, tip: mix(near, time.haze, 0.25), n: 16 }); if (r.chance(0.6)) { ctx.save(); ctx.translate(w * 0.35, h * 0.2); P.flower(ctx, w * 0.3, h * 0.8, r, { kind: 'cup', col: mix('#e63a2e', near, 0.55), col2: mix('#ff8a6a', near, 0.5), stem: near }); ctx.restore(); } }, {}, { ppu: 30, blur: 1 });
    // the place the seed is planted: a ring of pale stones with poppies
    S.nest = [sprite(3.4, 0.7, (ctx, w, h) => { const r = new RNG('capnest'); for (let i = 0; i < 9; i++) { const x = ((i + 0.5) / 9) * w; ctx.save(); ctx.translate(x - 0.2, h - 0.3); P.rock(ctx, 0.4, 0.3, r, { col: t('#d9c3a0'), lit: t('#fff4dc') }); ctx.restore(); if (i % 2) { ctx.save(); ctx.translate(x - 0.1, h - 0.6); P.flower(ctx, 0.2, 0.36, r, { kind: 'cup', col: t('#e63a2e'), col2: t('#ff8a6a'), stem: t('#5a8a45') }); ctx.restore(); } } })];
    return S;
  },
  // a ledge: a slab of the hard cap rock with soft pale rock worn away beneath it
  slab(w, kind, time) {
    const t = tones(time), r = new RNG('capslab' + w + kind), h = 1.4;
    return sprite(w, h, (ctx) => { ctx.fillStyle = t('#e6d2ae'); ctx.beginPath(); ctx.moveTo(w * 0.1, 0.18); ctx.lineTo(w * 0.9, 0.18); ctx.quadraticCurveTo(w * 0.7, h * 0.6, w * (0.5 + r.range(-0.1, 0.1)), h); ctx.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.1, 0.18); ctx.fill();
      ctx.fillStyle = rgba('#b89a84', 0.5); for (let i = 0; i < 3; i++) ctx.fillRect(w * 0.2, 0.3 + i * 0.22, w * 0.6 * (1 - i * 0.25), 0.05);
      const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, t('#9c8a7c')); g.addColorStop(1, t('#5e504a')); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(0, 0, w, 0.24, 0.1); ctx.fill(); ctx.fillStyle = rgba('#ffffff', 0.3); ctx.fillRect(0.06, 0.02, w - 0.12, 0.035); }, { ax: 0.5, ay: 0 });
  },
};
