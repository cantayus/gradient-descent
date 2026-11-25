// Zhangjiajie: thousands of sandstone pillars standing out of a sea of mist, pines on every ledge, deep narrow gorges, azaleas, and macaques who own the place.
import { RNG } from '../../core/rng.js';
import { P, variants, sprite, mix, rgba } from '../paint.js';
import { tones, lamps, stock } from './kit.js';

const TIMES = {
  dawn:   { wash: [{ x: 0.7, y: 0.4, r: 0.9, col: '#ffa08a', a: 0.45 }, { x: 0.12, y: 0.06, r: 0.8, col: '#3a56b0', a: 0.34 }, { x: 0.7, y: 0.55, r: 0.5, col: '#ffe4a0', a: 0.45 }], sky: ['#3a4a8a', '#8a86b8', '#f2b09a', '#ffe8c4'], skyAt: [0, 0.4, 0.76, 1], sun: { x: 0.7, y: 0.36, r: 0.036, col: '#fff3d6', glow: '#ffb080' }, bloom: 0.4, haze: '#f0d4c4', shade: '#2c3a50', dark: 0.1, mist: 0.5, shafts: 0.08, tint: 'rgba(255,180,140,0.14)', rim: '#ffe4c4', snow: '#ffffff', water: '#6fa8a0' },
  day:    { wash: [{ x: 0.8, y: 0.12, r: 0.7, col: '#fff3c0', a: 0.28 }, { x: 0.1, y: 0.8, r: 0.9, col: '#b8f0d8', a: 0.3 }, { x: 0.3, y: 0.02, r: 0.8, col: '#2060d0', a: 0.3 }], sky: ['#3a7cc8', '#7ab4e4', '#c8e4ec', '#eef6ee'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.8, y: 0.13, r: 0.03, col: '#fffbe8', glow: '#fff0b8' }, haze: '#dcecea', shade: '#1c3040', dark: 0, mist: 0.34, shafts: 0.06, tint: 'rgba(210,255,230,0.1)', rim: '#ffffff', snow: '#ffffff', water: '#4fa8a0' },
  golden: { wash: [{ x: 0.2, y: 0.4, r: 0.85, col: '#ff9a4a', a: 0.45 }, { x: 0.88, y: 0.1, r: 0.9, col: '#4a6ad0', a: 0.34 }, { x: 0.55, y: 0.78, r: 0.7, col: '#ffd8a0', a: 0.4 }], sky: ['#3a629e', '#94a8c8', '#f6c48a', '#ffeabc'], skyAt: [0, 0.45, 0.82, 1], sun: { x: 0.2, y: 0.38, r: 0.04, col: '#fff0c4', glow: '#ffb85a' }, bloom: 0.38, haze: '#ffdcb0', shade: '#3a3044', dark: 0.05, mist: 0.4, shafts: 0.1, tint: 'rgba(255,180,90,0.16)', rim: '#ffe8b8', snow: '#ffffff', water: '#6fa898' },
  dusk:   { wash: [{ x: 0.26, y: 0.5, r: 0.85, col: '#ff6a8a', a: 0.48 }, { x: 0.88, y: 0.16, r: 0.9, col: '#2a2ca8', a: 0.4 }, { x: 0.6, y: 0.8, r: 0.6, col: '#ffb880', a: 0.4 }], sky: ['#181c50', '#4c4488', '#c8709a', '#ffb890'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.26, y: 0.46, r: 0.04, col: '#ffe1c0', glow: '#ff8f7a' }, haze: '#d09ab0', shade: '#1c1c44', dark: 0.24, mist: 0.42, shafts: 0.05, tint: 'rgba(255,130,160,0.14)', rim: '#ffd0c8', snow: '#ffffff', water: '#5a6a9a', stars: 0.3, aura: 0.38 },
  night:  { wash: [{ x: 0.5, y: 0.98, r: 0.7, col: '#2a8a8a', a: 0.26 }, { x: 0.2, y: 0.15, r: 0.5, col: '#3a5fd8', a: 0.3 }, { x: 0.85, y: 0.3, r: 0.6, col: '#3a3f9a', a: 0.3 }], sky: ['#060a22', '#0c1a44', '#16305c', '#244a70'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.76, y: 0.15, r: 0.032, col: '#f6f4e8', glow: '#aebcff', moon: true }, haze: '#28446a', shade: '#080e28', dark: 0.55, mist: 0.45, tint: 'rgba(90,150,255,0.14)', rim: '#cfe0ff', snow: '#ffffff', water: '#1c3a5c', stars: 0.8, cloud: 0.3, aura: 0.5, vignette: 0.5 },
  mist:   { wash: [{ x: 0.5, y: 0.6, r: 0.9, col: '#f2f6f2', a: 0.36 }, { x: 0.2, y: 0.2, r: 0.6, col: '#a8c4c8', a: 0.3 }], sky: ['#88a0a8', '#b4c8c8', '#e4ece8'], bow: true, haze: '#dce6e2', shade: '#2c4044', dark: 0.08, mist: 0.7, cloud: 0.6, tint: 'rgba(210,235,225,0.12)', rim: '#ffffff', snow: '#ffffff', water: '#6f9a98' },
};

export const zhangjiajie = {
  id: 'zhangjiajie', name: 'Zhangjiajie', zone: 'stone', times: TIMES,
  note: 'Zhangjiajie’s pillars are sandstone. Water and frost split the rock along its cracks and carried the pieces away, and more than three thousand pillars were left standing.',

  far(time) {
    const t = tones(time), pil = (par, scale, base, amp, seed, col, haze, fog, stamps = []) => ({ par, scale, base, amp, style: 'pillar', seed, col: t(col), haze, lit: 0.12, fog, ribs: 0.2, ribGap: 0.7, facet: 1.4, foot: 0.85, bands: [{ col: t('#4f8a52'), a: 0.6, at: 0.0, th: 0.07, w: 0.03, f: 9, s: seed }], stamps });
    return [
      { par: 0.012, scale: 1.3, base: 0.46, amp: 0.14, style: 'round', seed: 8, col: mix('#ffffff', time.haze, 0.45), haze: 0.1, lit: 0.14, facet: 0, rimA: 0.55, foot: 0.9 },
      { par: 0.025, scale: 0.9, base: 0.52, amp: 0.2, style: 'jag', seed: 15, col: t('#6f8aa8'), haze: 0.5, lit: 0.1, ribs: 0.14, fog: 0.3 },
      // pillars behind pillars, each rank paler than the one in front of it, with the mist lying between
      pil(0.045, 0.5, 0.6, 0.34, 23, '#6a8090', 0.42, 0.5, [{ s: 'pineFar', every: 0.3, p: 0.5, size: 0.03, seed: 2, sink: 0.002 }]),
      pil(0.08, 0.6, 0.68, 0.4, 37, '#7a8a80', 0.28, 0.5, [{ s: 'pineFar', every: 0.24, p: 0.55, size: 0.04, seed: 4, sink: 0.002 }, { s: 'pavilion', every: 1.6, p: 0.6, size: 0.035, seed: 6, sink: 0.002, glow: 0.8 }, { s: '-', kind: 'fall', every: 0.5, p: 0.4, size: 0.5, len: 0.16, seed: 8 }, { s: '-', kind: 'flock', every: 0.9, p: 0.6, size: 0.014, seed: 10, n: 6, sink: -0.04 }]),
      pil(0.14, 0.7, 0.78, 0.46, 51, '#8a8c78', 0.16, 0.45, [{ s: 'pineFar', every: 0.2, p: 0.6, size: 0.055, seed: 3, sink: 0.002 }, { s: 'macaqueFar', every: 0.5, p: 0.5, size: 0.03, seed: 5, sink: 0.001 }, { s: '-', kind: 'fall', every: 0.6, p: 0.4, size: 0.6, len: 0.2, seed: 7 }]),
      { par: 0.28, scale: 0.4, base: 0.86, amp: 0.16, style: 'round', seed: 71, col: t('#2f5a3c'), haze: 0.06, foot: 0.4, fog: 0.3,
        bands: [{ col: t('#4f8a48'), a: 0.8, at: 0.02, th: 0.3, w: 0.14, f: 4, s: 3 }, { col: t('#e86a9a'), a: 0.4, at: 0.2, th: 0.07, w: 0.1, f: 7, s: 5 }],
        stamps: [{ s: 'pineFar', every: 0.07, p: 0.6, size: 0.09, seed: 21, sink: 0.004 }, { s: 'fernFar', every: 0.04, p: 0.6, size: 0.05, seed: 23, sink: 0.003 }, { s: 'macaqueFar', every: 0.3, p: 0.5, size: 0.05, seed: 25, sink: 0.002 }, { s: '-', kind: 'flock', every: 0.7, p: 0.5, size: 0.018, seed: 27, n: 5, sink: -0.05 }] },
    ];
  },
  behind: [
    { s: 'pillar', every: 14, p: 0.6, size: 1, seed: 1001, sink: 1.2 },
    { s: 'pine', every: 6, p: 0.5, size: 1, seed: 1005, sink: 0.2 },
    { s: 'rockBig', every: 9, p: 0.35, size: 1, seed: 1009, sink: 0.5 },
    { s: 'bamboo', every: 5, p: 0.4, size: 1, seed: 1013, sink: 0.1, zone: ['forest', 'mossy'] },
    { s: 'macaque', frames: ['macaque', 'macaque', 'macaqueB'], fps: 1.2, every: 13, p: 0.55, size: 1, seed: 1017, sink: 0.02 },
  ],
  ground(time) {
    const t = tones(time), band = (a, b, c, w = [1, 0.46, 0.13]) => ({ bands: [{ col: t(a), w: w[0] }, { col: t(b), w: w[1] }, { col: t(c), w: w[2] }] });
    return {
      body: [t('#8a7c68'), t('#5a5050'), t('#2a2630')],
      strata: [{ col: t('#c8b898'), a: 0.45, w: 0.14, d: 1.2, follow: 0.94, f: 0.3, seed: 3, wob: 0.3 }, { col: t('#3a3440'), a: 0.4, w: 0.1, d: 2.4, follow: 0.9, f: 0.22, seed: 5, wob: 0.4 }, { col: t('#a0623a'), a: 0.3, w: 0.16, d: 3.8, follow: 0.84, f: 0.3, seed: 7, wob: 0.5 }, { col: t('#c8b898'), a: 0.35, w: 0.1, d: 5.4, follow: 0.7, f: 0.18, seed: 9, wob: 0.7 }],
      embed: { s: 'stone', every: 1.6, p: 0.45, a: 0.5 },
      joints: { every: 0.9, zones: ['stone', 'ledge', 'wetstone'], top: 0.5, len: 3.4, dark: t('#2a2630'), light: t('#c8b898'), a: 0.45 },
      skin: {
        stone: band('#6a6258', '#a89a80', '#dccfae', [0.8, 0.32, 0.08]), ledge: band('#8a7c68', '#c4b494', '#f0e4c4', [0.8, 0.32, 0.08]), mossy: band('#2f5a30', '#5f9a48', '#a8d868'), forest: band('#2a4a30', '#4a7a40', '#8ab858'), wetstone: band('#2a3440', '#5a6a78', '#a0b8c0', [0.8, 0.3, 0.08]),
      },
      decor: {
        stone: [{ s: 'pebble', p: 0.4, size: 1, sink: 0.03 }, { s: 'rock', p: 0.16, size: 1, sink: 0.08 }, { s: 'tuft', p: 0.2, size: 0.9, sway: 0.05 }, { s: 'mossy', p: 0.2, size: 0.8, sink: 0.05 }],
        ledge: [{ s: 'pebble', p: 0.4, size: 1, sink: 0.03 }, { s: 'tuft', p: 0.3, size: 0.9, sway: 0.05 }, { s: 'azalea', p: 0.12, size: 1, sway: 0.03 }],
        mossy: [{ s: 'mossy', p: 0.8, size: 1, sink: 0.07, steep: 1.6 }, { s: 'fern', p: 0.3, size: 1, sway: 0.05 }, { s: 'tuft', p: 0.4, size: 1, sway: 0.05 }],
        forest: [{ s: 'fern', p: 0.6, size: 1, sway: 0.05 }, { s: 'tuft', p: 0.7, size: 1, sway: 0.05 }, { s: 'azalea', p: 0.25, size: 1, sway: 0.03 }, { s: 'mossy', p: 0.3, size: 1, sink: 0.07 }],
        wetstone: [{ s: 'pebble', p: 0.5, size: 1, sink: 0.03 }, { s: 'mossy', p: 0.3, size: 0.8, sink: 0.05 }],
      },
    };
  },
  lives: { every: 6, p: 0.6, zones: ['forest', 'mossy'], cols: ['#ffffff', '#ffd23c', '#9fe0ff', '#ffb3c8'] },
  fore: [
    { s: 'foreRock', par: 1.5, every: 19, p: 0.45, size: 1, seed: 1101, sink: 0.45, a: 1 },
    { s: 'foreGrass', par: 1.7, every: 3.4, p: 0.75, size: 1, seed: 1105, sink: 0.2, a: 0.95 },
  ],
  ambient(time) { return [{ n: 30, col: time.stars > 0.5 ? '#bfe8ff' : '#ffffff', size: 1.6, speed: -0.008, drift: 0.015, a: 0.4, par: 0.4, sway: 12, twinkle: true }]; },
  // Wet, mild and still: cloud sits in the gorges most mornings, it rains often and not for long, and there is seldom much wind down among the pillars.
  weather(key) {
    return { dawn: { wet: 0.5, fog: 0.8, wind: 0.7, gust: 0.6 }, day: { wet: 0.62, fog: 0.5, wind: 1 }, golden: { wet: 0.5, fog: 0.55, wind: 0.9 }, dusk: { wet: 0.55, fog: 0.6, wind: 1, gust: 1 },
      night: { wet: 0.5, fog: 0.6, wind: 0.7, clear: 0.5 }, mist: { wet: 0.8, fog: 1, wind: 0.6, gust: 0.5, early: true } }[key] || {};
  },

  sprites(time) {
    const t = tones(time), v = variants, dark = lamps(time), sunLeft = time.sun ? time.sun.x < 0.5 : true;
    const S = stock(time, 'zh-', { rock: ['#8a7c68', '#746a5c', '#9a8c74'], rockLit: '#dccfae', stone: ['#6a6258', '#a89a80'], near: '#0c1614', nearBloom: ['#e86a9a', '#ffb8d0', 'pom'], cloudUnder: '#b8c8cc', nestBloom: { kind: 'pom', col: '#e86a9a', col2: '#ffc0d8' } });
    S.tuft = v(6, 'zh-tuft', (r) => r.range(0.4, 0.6), (r) => r.range(0.3, 0.55), P.tuft, (r) => ({ col: t(r.pick(['#3f7a3a', '#4f8a45'])), tip: t('#b8e07c'), n: r.int(8, 13) }));
    S.mossy = v(5, 'zh-moss', (r) => r.range(0.7, 1.3), (r) => r.range(0.18, 0.3), P.mound, (r) => ({ col: t(r.pick(['#4f8a3a', '#5f9a45'])), lit: t('#b0e068'), dots: t('#d8f090') }));
    S.fern = v(5, 'zh-fern', (r) => r.range(0.8, 1.3), (r) => r.range(0.5, 0.9), P.shrub, () => ({ col: t('#2f6a34'), lit: t('#8fd060'), stem: t('#2a4a2a') })); S.fernFar = v(3, 'zh-fernf', 0.9, 0.6, P.shrub, () => ({ col: t.h('#2f6a34', 0.1), lit: t.h('#7fc058', 0.1), stem: t('#2a4a2a') }), { ppu: 48 });
    S.azalea = v(4, 'zh-azalea', (r) => r.range(0.6, 0.9), (r) => r.range(0.45, 0.7), P.shrub, () => ({ col: t('#3a6a3a'), lit: t('#7fb058'), berry: t('#f06aa0'), stem: t('#4a3a30') }));
    const pn = (far) => () => ({ col: far ? t.h('#2f5f3a', 0.14) : t('#2f5f3a'), lit: far ? t.h('#7fb060', 0.14) : t('#8fc068'), trunk: t('#5a4034') });
    S.pine = v(5, 'zh-pine', (r) => r.range(2, 3), (r) => r.range(2.6, 4.2), P.pine, pn(false)); S.pineFar = v(4, 'zh-pinef', 1, (r) => r.range(1, 1.5), P.pine, pn(true), { ppu: 48 });
    S.bamboo = v(4, 'zh-bamboo', 1.2, (r) => r.range(3, 4.6), (ctx, w, h, r) => { for (let i = 0; i < 4; i++) { const x = w * (0.2 + i * 0.2 + r.range(-0.05, 0.05)), lean = r.range(-0.1, 0.1) * w; ctx.strokeStyle = t(r.pick(['#5f9a45', '#7ab050'])); ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(x, h); ctx.quadraticCurveTo(x, h * 0.5, x + lean, h * 0.08); ctx.stroke(); for (let k = 0; k < 7; k++) { const y = h * r.range(0.1, 0.6); ctx.fillStyle = t(r.pick(['#4f8a3a', '#8fc060'])); ctx.beginPath(); ctx.ellipse(x + lean * (1 - y / h) + r.range(-0.2, 0.2), y, 0.2, 0.04, r.range(-0.8, 0.8), 0, 7); ctx.fill(); } } });
    S.pillar = v(4, 'zh-pillar', (r) => r.range(3.4, 5.4), (r) => r.range(11, 17), (ctx, w, h, r) => { P.pillar(ctx, w, h, r, { col: t('#b0a084'), lit: t('#e4d6b4'), shade: t('#6a6878'), green: t('#3f7a45'), greenLit: t('#8fc060'), sunLeft }); ctx.save(); ctx.translate(w * 0.2, -0.2); P.pine(ctx, w * 0.6, 3, r, pn(false)()); ctx.restore(); }, {}, { ppu: 44, ay: 0.985 });
    const mq = (arm) => (r) => ({ col: t('#8a7458'), lit: t('#c8b090'), face: t('#e89a8a'), arm }); S.macaque = v(2, 'zh-mac', 0.7, 0.8, P.macaque, mq(0)); S.macaqueB = v(2, 'zh-mac', 0.7, 0.8, P.macaque, mq(1)); S.macaqueFar = v(2, 'zh-macf', 0.7, 0.8, P.macaque, mq(0), { ppu: 48 });
    S.pavilion = v(1, 'zh-pav', 1.4, 1.2, P.pavilion, () => ({ roof: t.h('#4a5a52', 0.15), post: t.h('#a83a2c', 0.1), lamp: dark ? '#ffd76a' : t.h('#3a2c2a', 0.15) }), { ppu: 64 });
    return S;
  },
  // what there is to stand on across a gorge: a bridge of living vines, or the top of a broken pillar
  slab(w, kind, time) {
    const t = tones(time), r = new RNG('zhslab' + w + kind);
    if (kind === 'vine') return sprite(w, 1.3, (ctx) => { ctx.strokeStyle = t('#3a5a30'); ctx.lineWidth = 0.09; ctx.lineCap = 'round'; for (const o of [0, 0.1]) { ctx.beginPath(); ctx.moveTo(0, 0.05 + o); ctx.quadraticCurveTo(w / 2, 0.16 + o, w, 0.05 + o); ctx.stroke(); } ctx.fillStyle = t('#6a4a34'); for (let x = 0.15; x < w; x += 0.34) ctx.fillRect(x, 0.03, 0.22, 0.12); for (let i = 0; i < w * 2.4; i++) { const x = r.range(0.1, w - 0.1), l = r.range(0.3, 1.1); ctx.strokeStyle = t(r.pick(['#3f7a3a', '#5f9a45'])); ctx.lineWidth = 0.035; ctx.beginPath(); ctx.moveTo(x, 0.14); ctx.quadraticCurveTo(x + r.range(-0.12, 0.12), 0.14 + l * 0.5, x + r.range(-0.1, 0.1), 0.14 + l); ctx.stroke(); ctx.fillStyle = t('#8fc060'); ctx.beginPath(); ctx.ellipse(x, 0.14 + l, 0.06, 0.035, 0.5, 0, 7); ctx.fill(); } }, { ax: 0.5, ay: 0 });
    return sprite(w, 1.6, (ctx) => { const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, t('#e4d6b4')); g.addColorStop(1, t('#6a6878')); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0.05); ctx.lineTo(w, 0.05); ctx.lineTo(w * 0.86, 1.6); ctx.lineTo(w * 0.14, 1.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = t('#5f9a45'); ctx.beginPath(); ctx.roundRect(0, 0, w, 0.16, 0.08); ctx.fill(); }, { ax: 0.5, ay: 0 });
  },
};
