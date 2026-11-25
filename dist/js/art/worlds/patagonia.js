// Patagonia: towers of granite, glaciers coming down to turquoise lakes, golden grass laid flat by a wind that never stops, beech forest gone red,
// guanacos on the ridges and condors over everything.
import { RNG } from '../../core/rng.js';
import { P, variants, sprite, mix, rgba } from '../paint.js';
import { tones, lamps, stock } from './kit.js';

const TIMES = {
  dawn:   { wash: [{ x: 0.7, y: 0.36, r: 0.9, col: '#ff8a8a', a: 0.5 }, { x: 0.1, y: 0.06, r: 0.8, col: '#2f4ab8', a: 0.36 }, { x: 0.7, y: 0.5, r: 0.5, col: '#ffd890', a: 0.45 }], sky: ['#2a3c8a', '#7a78b8', '#f29a90', '#ffe0b4'], skyAt: [0, 0.4, 0.76, 1], sun: { x: 0.7, y: 0.34, r: 0.034, col: '#fff3d6', glow: '#ffa080' }, bloom: 0.38, haze: '#f0c4b8', shade: '#2c3458', dark: 0.1, mist: 0.26, shafts: 0.06, tint: 'rgba(255,150,130,0.14)', rim: '#ffd8c4', snow: '#ffe4dc', water: '#3fb0b8' },
  day:    { wash: [{ x: 0.8, y: 0.12, r: 0.7, col: '#fff3c0', a: 0.28 }, { x: 0.1, y: 0.8, r: 0.9, col: '#7fe8e0', a: 0.3 }, { x: 0.3, y: 0.02, r: 0.8, col: '#1050d8', a: 0.34 }], sky: ['#1f62cc', '#5fa4ea', '#c0e0f6', '#eef6f6'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.8, y: 0.13, r: 0.03, col: '#fffbe8', glow: '#fff0b8' }, haze: '#d4e6f0', shade: '#182a48', dark: 0, mist: 0.12, shafts: 0.04, tint: 'rgba(210,240,255,0.1)', rim: '#ffffff', snow: '#ffffff', water: '#2fc0c8' },
  golden: { wash: [{ x: 0.2, y: 0.4, r: 0.85, col: '#ff8a3c', a: 0.5 }, { x: 0.88, y: 0.1, r: 0.9, col: '#4a62d8', a: 0.36 }, { x: 0.55, y: 0.78, r: 0.7, col: '#ffcc8a', a: 0.4 }], sky: ['#335c9e', '#8ea2cc', '#f8c080', '#ffe8b8'], skyAt: [0, 0.45, 0.82, 1], sun: { x: 0.2, y: 0.38, r: 0.04, col: '#fff0c4', glow: '#ffb45a' }, bloom: 0.38, haze: '#ffd098', shade: '#3c2c48', dark: 0.05, mist: 0.2, shafts: 0.08, tint: 'rgba(255,170,80,0.18)', rim: '#ffe4b0', snow: '#fff0dc', water: '#5ab0b0' },
  dusk:   { wash: [{ x: 0.26, y: 0.5, r: 0.85, col: '#ff5a82', a: 0.5 }, { x: 0.88, y: 0.16, r: 0.9, col: '#2628a4', a: 0.42 }, { x: 0.6, y: 0.8, r: 0.6, col: '#ffac6a', a: 0.4 }], sky: ['#14184a', '#483e88', '#d0688e', '#ffac78'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.26, y: 0.46, r: 0.04, col: '#ffe1c0', glow: '#ff8a6a' }, haze: '#d08ca4', shade: '#1c1a48', dark: 0.24, mist: 0.22, shafts: 0.05, tint: 'rgba(255,120,150,0.16)', rim: '#ffc4c0', snow: '#f4d4e0', water: '#5a5e9a', stars: 0.35, aura: 0.38 },
  night:  { wash: [{ x: 0.5, y: 0.98, r: 0.7, col: '#1f8a9a', a: 0.28 }, { x: 0.2, y: 0.15, r: 0.5, col: '#3a5fd8', a: 0.3 }, { x: 0.85, y: 0.3, r: 0.6, col: '#4a2f9a', a: 0.3 }], sky: ['#04081c', '#0a1640', '#132c5a', '#1f4672'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.24, y: 0.15, r: 0.03, col: '#f6f4e8', glow: '#aebcff', moon: true }, haze: '#1e3a64', shade: '#060c26', dark: 0.56, mist: 0.18, tint: 'rgba(80,150,255,0.14)', rim: '#c4dcff', snow: '#c0d4ff', water: '#143660', stars: 1.1, cloud: 0.25, aura: 0.5, vignette: 0.5 },
  // weather coming over the ice field: low cloud, sleet, the towers gone
  mist:   { wash: [{ x: 0.5, y: 0.6, r: 0.9, col: '#eef2f4', a: 0.34 }, { x: 0.2, y: 0.2, r: 0.6, col: '#98aec8', a: 0.32 }], sky: ['#6f84a0', '#a4b4c6', '#dce2e6'], bow: true, haze: '#ccd6de', shade: '#2a3a50', dark: 0.1, mist: 0.55, cloud: 0.7, tint: 'rgba(200,220,240,0.12)', rim: '#ffffff', snow: '#f4f8fc', water: '#6f98a8' },
};

export const patagonia = {
  id: 'patagonia', name: 'Patagonia', zone: 'pampa', times: TIMES, dustCol: '#ffffff',
  stamps: [{ s: 'guanaco', name: 'Guanaco' }, { s: 'flag', name: 'Flag tree' }, { s: 'lenga', name: 'Lenga beech' }, { s: 'calafate', name: 'Calafate' }, { s: 'ranch', name: 'Estancia' }, { s: 'condor', name: 'Andean condor' }],
  note: 'The Southern Patagonian Ice Field is what is left of an ice sheet that once covered the whole of the southern Andes. Its glaciers cut these valleys.',

  far(time) {
    const t = tones(time);
    return [
      { par: 0.012, scale: 1.3, base: 0.45, amp: 0.13, style: 'round', seed: 9, col: mix('#ffffff', time.haze, 0.4), haze: 0.1, lit: 0.14, facet: 0, rimA: 0.55, foot: 0.9 },
      // the ice field and the peaks that stand out of it
      { par: 0.022, scale: 1, base: 0.5, amp: 0.26, style: 'jag', seed: 16, col: t('#8a9cc8'), haze: 0.4, snow: 0.62, snowA: 0.95, lit: 0.1, ribs: 0.14, ribGap: 1.1, bands: [{ col: t('#9fd0f0'), a: 0.45, at: 0.5, th: 0.2, w: 0.2, f: 3, s: 4 }] },
      // the towers: pale granite, with a cap of older, darker rock on some of them
      { par: 0.045, scale: 0.46, base: 0.56, amp: 0.34, style: 'pillar', seed: 27, col: t('#b8a8a8'), haze: 0.26, lit: 0.16, ribs: 0.3, ribGap: 0.6, facet: 1.6, foot: 0.7, snow: 0.06, snowA: 0.9,
        bands: [{ col: t('#4a4450'), a: 0.75, at: 0.0, th: 0.09, w: 0.03, f: 6, s: 2 }, { col: t('#e8d8d0'), a: 0.4, at: 0.3, th: 0.2, w: 0.1, f: 4, s: 6 }], stamps: [{ s: '-', kind: 'flock', every: 1.1, p: 0.7, size: 0.03, seed: 3, n: 2, sink: -0.06 }] },
      // the lake the glacier feeds: milky turquoise, with ice afloat on it
      { kind: 'lake', y: 0.555, h: 0.11, par: 0.07, things: [{ s: 'berg', n: 10, seed: 7, size: 0.05, speed: 0.0009, at: 0.1, span: 0.6 }, { kind: 'spout', cycle: 1e9 }] },
      // the glacier's snout and the red beech woods beside it
      { par: 0.1, scale: 0.44, base: 0.66, amp: 0.12, style: 'round', seed: 39, col: t('#5a6a80'), haze: 0.16, fog: 0.16, ribs: 0.1,
        bands: [{ col: t('#bfe4f6'), a: 0.85, at: 0.0, th: 0.26, w: 0.2, f: 1.4, s: 3 }, { col: t('#c8502c'), a: 0.7, at: 0.34, th: 0.18, w: 0.12, f: 4, s: 7 }, { col: t('#e0a030'), a: 0.6, at: 0.56, th: 0.12, w: 0.12, f: 5, s: 9 }],
        stamps: [{ s: '-', kind: 'fall', every: 0.4, p: 0.4, size: 0.5, len: 0.09, seed: 5 }, { s: 'lengaFar', every: 0.08, p: 0.55, size: 0.045, seed: 9, drop: [0.34, 0.6] }] },
      // the pampa: gold tussock to the horizon, a ranch house, guanacos, sheep
      { par: 0.18, scale: 0.4, base: 0.73, amp: 0.11, style: 'round', seed: 53, col: t('#8a7a3a'), haze: 0.1, foot: 0.4,
        bands: [{ col: t('#e0c058'), a: 0.8, at: 0.02, th: 0.3, w: 0.12, f: 3, s: 2 }, { col: t('#c8502c'), a: 0.5, at: 0.36, th: 0.08, w: 0.1, f: 6, s: 6 }, { col: time.water, a: 0.85, at: 0.58, th: 0.04, w: 0.12, f: 1.3, s: 12, glint: 18 }],
        stamps: [{ s: 'guanacoFar', kind: 'graze', every: 0.24, p: 0.5, size: 0.04, seed: 3, drop: [0.02, 0.4], roam: 1.3, speed: 0.05 }, { s: 'ranch', kind: 'smoke', every: 1, p: 0.6, size: 0.04, seed: 5, drop: [0.1, 0.3], glow: 0.7 }, { s: 'flagFar', every: 0.2, p: 0.5, size: 0.06, seed: 7, sink: 0.004 },
          { s: 'sheepFar', kind: 'graze', every: 0.14, p: 0.4, size: 0.026, seed: 9, drop: [0.1, 0.5], roam: 0.7, speed: 0.035 }, { s: '-', kind: 'flock', every: 0.9, p: 0.5, size: 0.034, seed: 13, n: 2, sink: -0.1 }] },
      { par: 0.32, scale: 0.36, base: 0.8, amp: 0.13, style: 'round', seed: 67, col: t('#5a4a2a'), haze: 0.04, foot: 0.3,
        bands: [{ col: t('#d8b850'), a: 0.85, at: 0.02, th: 0.26, w: 0.14, f: 4, s: 3 }, { col: t('#b8442a'), a: 0.6, at: 0.3, th: 0.12, w: 0.14, f: 5, s: 5 }],
        stamps: [{ s: 'rockFar', every: 0.1, p: 0.5, size: 0.06, seed: 21, sink: 0.012 }, { s: 'tuftFar', every: 0.03, p: 0.7, size: 0.04, seed: 23, sink: 0.003 }, { s: 'lengaFar', every: 0.09, p: 0.5, size: 0.08, seed: 25, drop: [0.2, 0.5] }, { s: 'guanacoFar', kind: 'graze', every: 0.4, p: 0.5, size: 0.065, seed: 27, sink: 0.002, roam: 1, speed: 0.04 }] },
    ];
  },
  behind: [
    { s: 'flag', every: 9, p: 0.5, size: 1, seed: 1201, sink: 0.15, zone: ['pampa', 'moraine'] },
    { s: 'lenga', every: 5, p: 0.55, size: 1, seed: 1205, sink: 0.2, zone: ['lenga', 'pampa'] },
    { s: 'rockBig', every: 8, p: 0.4, size: 1, seed: 1209, sink: 0.5 },
    { s: 'iceBig', every: 5, p: 0.5, size: 1, seed: 1213, sink: 0.4, zone: ['ice', 'snow'] },
    { s: 'guanaco', frames: ['guanaco', 'guanacoB'], fps: 0.5, every: 27, p: 0.6, size: 1, seed: 1217, sink: 0.04, zone: ['pampa', 'moraine'], roam: 2, speed: 0.06 },
  ],
  ground(time) {
    const t = tones(time), band = (a, b, c, w = [1, 0.46, 0.13]) => ({ bands: [{ col: t(a), w: w[0] }, { col: t(b), w: w[1] }, { col: t(c), w: w[2] }] });
    return {
      body: [t('#6a6470'), t('#46424e'), t('#22202a')],
      strata: [{ col: t('#a89ca0'), a: 0.45, w: 0.12, d: 1.3, follow: 0.92, f: 0.35, seed: 3, wob: 0.5 }, { col: t('#2a2630'), a: 0.4, w: 0.18, d: 2.6, follow: 0.84, f: 0.22, seed: 5, wob: 0.8 }, { col: t('#c4b8b4'), a: 0.3, w: 0.08, d: 4, follow: 0.75, f: 0.3, seed: 7, wob: 0.9 }],
      embed: { s: 'stone', every: 1.2, p: 0.55, a: 0.55 },
      skin: {
        granite: band('#6a6068', '#a89ca0', '#e4d8d4', [0.8, 0.32, 0.08]), moraine: band('#4a4650', '#7a7480', '#b4acb0', [0.8, 0.32, 0.08]), pampa: band('#8a7430', '#d8b850', '#f8e890'), lenga: band('#7a2c1c', '#c8502c', '#f89a50'),
        ice: band('#4f9dcf', '#9ad6ef', '#eafcff', [1.1, 0.5, 0.12]), snow: band('#aac4e2', '#e2eefb', '#ffffff', [1.2, 0.62, 0.2]),
      },
      decor: {
        granite: [{ s: 'pebble', p: 0.4, size: 1, sink: 0.03 }, { s: 'rock', p: 0.22, size: 1, sink: 0.08 }, { s: 'tussock', p: 0.1, size: 0.9, sway: 0.1 }],
        moraine: [{ s: 'pebble', p: 0.6, size: 1, sink: 0.03 }, { s: 'rock', p: 0.25, size: 1, sink: 0.08 }, { s: 'tussock', p: 0.14, size: 0.9, sway: 0.1 }],
        pampa: [{ s: 'tussock', p: 0.9, size: 1.1, sway: 0.12 }, { s: 'tussock', p: 0.5, size: 0.8, sway: 0.12 }, { s: 'calafate', p: 0.12, size: 1, sway: 0.05 }, { s: 'daisy', p: 0.14, size: 1, sway: 0.08 }],
        lenga: [{ s: 'leaf', p: 0.8, size: 1, sink: 0.05, steep: 1.6 }, { s: 'calafate', p: 0.2, size: 1, sway: 0.05 }, { s: 'tussock', p: 0.3, size: 0.9, sway: 0.1 }],
        ice: [{ s: 'ice', p: 0.2, size: 1, sink: 0.04, steep: 0.7 }, { s: 'drift', p: 0.12, size: 0.8, sink: 0.06 }],
        snow: [{ s: 'drift', p: 0.5, size: 1, sink: 0.06, steep: 1.6 }, { s: 'ice', p: 0.08, size: 0.8, sink: 0.04 }, { s: 'rock', p: 0.08, size: 1, sink: 0.08 }],
      },
    };
  },
  lives: { every: 9, p: 0.4, zones: ['pampa', 'lenga'], cols: ['#ffffff', '#ffe37a'] },
  fore: [
    { s: 'foreRock', par: 1.5, every: 19, p: 0.45, size: 1, seed: 1301, sink: 0.45, a: 1 },
    { s: 'foreGrass', par: 1.7, every: 3.6, p: 0.7, size: 1, seed: 1305, sink: 0.2, a: 0.95 },
  ],
  ambient(time) { return [{ n: 30, col: '#ffffff', size: 1.5, speed: 0.01, drift: 0.06, a: 0.4, par: 0.5, sway: 6 }]; },
  // The wind is the weather here: it comes off the ice field and does not stop. Rain and sleet arrive and leave within the hour, and it can snow in any month.
  weather(key) {
    return { dawn: { wet: 0.4, fog: 0.25, wind: 2.6, gust: 2.6, lean: 0.5 }, day: { wet: 0.5, fog: 0.08, wind: 3.2, gust: 3, lean: 0.5 }, golden: { wet: 0.42, fog: 0.12, wind: 3, gust: 3, lean: 0.5 }, dusk: { wet: 0.5, fog: 0.16, wind: 3.2, gust: 3.2, lean: 0.5 },
      night: { wet: 0.5, cold: 1, fog: 0.1, wind: 2.4, gust: 2.4, lean: 0.5, clear: 0.45 }, mist: { wet: 0.85, cold: 0.6, fog: 0.8, wind: 3.4, gust: 3.4, lean: 0.5, early: true } }[key] || {};
  },

  sprites(time) {
    const t = tones(time), v = variants, dark = lamps(time);
    const S = stock(time, 'pat-', { rock: ['#7a7480', '#6a6068', '#8a848c'], rockLit: '#d4ccd0', stone: ['#5a5660', '#8a848c'], near: '#0e0f18', nearBloom: ['#ffd23c', '#fff08a', 'cup'], nestBloom: { kind: 'cup', col: '#ffd23c', col2: '#fff08a' } });
    S.tussock = v(6, 'pat-tus', (r) => r.range(0.5, 0.8), (r) => r.range(0.36, 0.6), P.tuft, (r) => ({ col: t(r.pick(['#c8a848', '#b89838', '#d8b850'])), tip: t('#fff0a0'), n: r.int(10, 15) }));
    S.tuftFar = v(3, 'pat-tfar', 0.5, 0.4, P.tuft, () => ({ col: t('#c8a848'), tip: t('#f4e08c'), n: 8 }), { ppu: 44 });
    S.daisy = v(3, 'pat-daisy', 0.22, (r) => r.range(0.24, 0.36), P.flower, () => ({ kind: 'cup', col: t('#ffd23c'), col2: t('#fff4b0'), stem: t('#7a8a45') }));
    S.calafate = v(4, 'pat-cal', (r) => r.range(0.7, 1), (r) => r.range(0.5, 0.7), P.shrub, () => ({ col: t('#3f5a34'), lit: t('#8aa858'), berry: t('#3a2a6a'), stem: t('#4a3a30') }));
    S.leaf = v(5, 'pat-leaf', (r) => r.range(0.7, 1.3), (r) => r.range(0.14, 0.24), P.mound, (r) => ({ col: t(r.pick(['#c8502c', '#e07030', '#a83a24'])), lit: t('#ffb060'), dots: t('#ffd890') }));
    const lg = (far) => (r) => ({ col: far ? t.h(r.pick(['#b8442a', '#d86a2c']), 0.12) : t(r.pick(['#b8442a', '#d86a2c', '#c89030'])), lit: far ? t.h('#ffa850', 0.12) : t('#ffb860'), stem: t('#4a3a30') });
    S.lenga = v(5, 'pat-lenga', (r) => r.range(2.2, 3.2), (r) => r.range(2.2, 3.4), P.shrub, lg(false)); S.lengaFar = v(4, 'pat-lengaf', 1, 0.9, P.shrub, lg(true), { ppu: 48 });
    const fl = (far) => () => ({ col: far ? t.h('#3f6a3a', 0.12) : t('#3f6a3a'), lit: far ? t.h('#8fb858', 0.12) : t('#9fc860'), trunk: t('#4a3a30') });
    S.flag = v(4, 'pat-flag', (r) => r.range(3, 4.2), (r) => r.range(2.6, 3.6), P.flagtree, fl(false)); S.flagFar = v(3, 'pat-flagf', 1.3, 1, P.flagtree, fl(true), { ppu: 48 });
    S.drift = v(4, 'pat-drift', (r) => r.range(0.8, 1.5), (r) => r.range(0.16, 0.3), P.mound, () => ({ col: t('#dfeaf8'), lit: t('#ffffff') }));
    S.ice = v(5, 'pat-ice', (r) => r.range(0.3, 0.6), (r) => r.range(0.3, 0.7), P.ice, () => ({ col: t('#c8ecf8'), deep: t('#62acd8') })); S.iceBig = v(4, 'pat-iceb', (r) => r.range(1.4, 2.6), (r) => r.range(1.6, 3.4), P.ice, () => ({ col: t('#bfe6f5'), deep: t('#4f9dcf') }));
    S.berg = v(4, 'pat-berg', (r) => r.range(0.5, 1.2), (r) => r.range(0.3, 0.7), P.ice, () => ({ col: t('#e4f6fc'), deep: t('#5fc0e0') }), { ppu: 64 });
    const gu = (tail) => () => ({ col: t('#c89a68'), dark: t('#6a4a34'), mane: null, neck: 0.95, head: 0.2, tail, graze: 0, belly: t('#f4ece0') });
    S.guanaco = v(2, 'pat-gua', 1.8, 2, P.quad, gu(0.2)); S.guanacoB = v(2, 'pat-gua', 1.8, 2, P.quad, gu(0.7)); S.guanacoFar = v(2, 'pat-guaf', 1.8, 2, P.quad, gu(0.4), { ppu: 48 });
    S.sheepFar = v(2, 'pat-sheep', 1, 0.75, P.quad, () => ({ col: t('#f4efe4'), dark: t('#2a2422'), neck: 0.2, head: 0.2, tail: 0.1, graze: 1, wool: true }), { ppu: 48 });
    S.condor = v(1, 'pat-condor', 2.6, 1.3, P.condor, () => ({}));
    S.ranch = v(2, 'pat-ranch', 1.3, 0.9, P.house, () => ({ wall: t('#f6f3ec'), roof: t('#b8322a'), win: dark ? '#ffd76a' : t('#2c3644'), trim: t('#3a3f4a') }), { ppu: 64 });
    return S;
  },
  slab(w, kind, time) {
    const t = tones(time), r = new RNG('patslab' + w + kind);
    return sprite(w, 1.3, (ctx) => { const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, t(kind === 'ice' ? '#eafcff' : '#d4ccd0')); g.addColorStop(1, t(kind === 'ice' ? '#62acd8' : '#5a5660')); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0.04); ctx.lineTo(w, 0.04); ctx.lineTo(w * (0.7 + r.range(-0.1, 0.1)), 1.3); ctx.lineTo(w * (0.3 + r.range(-0.1, 0.1)), 1.3); ctx.closePath(); ctx.fill(); ctx.fillStyle = rgba('#ffffff', 0.4); ctx.fillRect(0.05, 0.04, w - 0.1, 0.05); }, { ax: 0.5, ay: 0 });
  },
};
