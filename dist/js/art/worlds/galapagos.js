// Galápagos: islands of black and rust-red lava in a clear sea, white beaches, prickly pears grown into trees, a red carpet of sesuvium,
// and animals that do not move out of the way: giant tortoises, marine iguanas, blue-footed boobies, sea lions, scarlet crabs.
import { RNG } from '../../core/rng.js';
import { P, variants, sprite, mix, rgba } from '../paint.js';
import { tones, lamps, stock } from './kit.js';

const TIMES = {
  dawn:   { wash: [{ x: 0.72, y: 0.4, r: 0.9, col: '#ff9a7a', a: 0.45 }, { x: 0.1, y: 0.06, r: 0.8, col: '#2f56c0', a: 0.36 }, { x: 0.72, y: 0.52, r: 0.5, col: '#ffe08a', a: 0.45 }], sky: ['#2c4a9a', '#7a86c8', '#f6a88a', '#ffe6b8'], skyAt: [0, 0.4, 0.76, 1], sun: { x: 0.72, y: 0.4, r: 0.036, col: '#fff3d6', glow: '#ffb070' }, bloom: 0.38, haze: '#f4cdb0', shade: '#2c3a66', dark: 0.1, mist: 0.24, shafts: 0.06, tint: 'rgba(255,170,120,0.14)', rim: '#ffe0b8', snow: '#ffffff', water: '#3aa8b8' },
  day:    { wash: [{ x: 0.8, y: 0.12, r: 0.7, col: '#fff3c0', a: 0.3 }, { x: 0.1, y: 0.8, r: 0.9, col: '#5fe8d8', a: 0.34 }, { x: 0.3, y: 0.02, r: 0.8, col: '#0f52e0', a: 0.34 }], sky: ['#1f6cd8', '#58aef0', '#bfe8f8', '#eefaf4'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.8, y: 0.12, r: 0.03, col: '#fffbe8', glow: '#fff0b8' }, haze: '#cfeaf0', shade: '#12304c', dark: 0, mist: 0.12, shafts: 0.04, tint: 'rgba(200,255,240,0.1)', rim: '#ffffff', snow: '#ffffff', water: '#1fb6c8' },
  golden: { wash: [{ x: 0.2, y: 0.4, r: 0.85, col: '#ff8a3c', a: 0.5 }, { x: 0.88, y: 0.1, r: 0.9, col: '#4a66d8', a: 0.36 }, { x: 0.55, y: 0.78, r: 0.7, col: '#ffcf8a', a: 0.4 }], sky: ['#34609e', '#8ea6cc', '#f8c27e', '#ffe9b4'], skyAt: [0, 0.45, 0.82, 1], sun: { x: 0.2, y: 0.38, r: 0.04, col: '#fff0c4', glow: '#ffb85a' }, bloom: 0.38, haze: '#ffd39a', shade: '#3c2c44', dark: 0.05, mist: 0.2, shafts: 0.08, tint: 'rgba(255,170,80,0.18)', rim: '#ffe6b0', snow: '#ffffff', water: '#4aa8b0' },
  dusk:   { wash: [{ x: 0.26, y: 0.5, r: 0.85, col: '#ff5f7e', a: 0.5 }, { x: 0.88, y: 0.16, r: 0.9, col: '#2a2ca8', a: 0.4 }, { x: 0.6, y: 0.8, r: 0.6, col: '#ffb06a', a: 0.4 }], sky: ['#161a4c', '#4a4088', '#d06c8e', '#ffb07a'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.26, y: 0.46, r: 0.04, col: '#ffe1c0', glow: '#ff8f6a' }, haze: '#d490a0', shade: '#1c1a48', dark: 0.24, mist: 0.22, shafts: 0.05, tint: 'rgba(255,120,140,0.16)', rim: '#ffc8b8', snow: '#ffffff', water: '#5a5a9a', stars: 0.35, aura: 0.38 },
  night:  { wash: [{ x: 0.5, y: 0.98, r: 0.7, col: '#1fa0a0', a: 0.3 }, { x: 0.2, y: 0.15, r: 0.5, col: '#3a5fd8', a: 0.3 }, { x: 0.85, y: 0.3, r: 0.6, col: '#4a2f9a', a: 0.3 }], sky: ['#050a20', '#0b1a44', '#143060', '#1f4a78'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.78, y: 0.16, r: 0.03, col: '#f6f4e8', glow: '#aebcff', moon: true }, haze: '#1c3a66', shade: '#060c26', dark: 0.55, mist: 0.18, tint: 'rgba(70,160,255,0.14)', rim: '#bfe8ff', snow: '#ffffff', water: '#123a66', stars: 1, cloud: 0.25, aura: 0.5, vignette: 0.5 },
  // the garúa: in the cool months a fine mist sits on the islands for days
  mist:   { wash: [{ x: 0.5, y: 0.6, r: 0.9, col: '#eef4f2', a: 0.34 }, { x: 0.2, y: 0.2, r: 0.6, col: '#9fc0d0', a: 0.3 }], sky: ['#7f9cb0', '#aec4d0', '#e0e8ea'], bow: true, haze: '#d0dde0', shade: '#2c4050', dark: 0.08, mist: 0.5, cloud: 0.6, tint: 'rgba(200,230,235,0.12)', rim: '#ffffff', snow: '#ffffff', water: '#5f9aa8' },
};

export const galapagos = {
  id: 'galapagos', name: 'Galápagos', zone: 'lava', times: TIMES,
  stamps: [{ s: 'tortoise', name: 'Giant tortoise' }, { s: 'iguana', name: 'Marine iguana' }, { s: 'booby', name: 'Blue-footed booby' }, { s: 'sealion', name: 'Sea lion' }, { s: 'crab', name: 'Sally Lightfoot crab' }, { s: 'cactus', name: 'Prickly pear' }],
  note: 'The Galápagos Islands are the tops of volcanoes that rose from the sea floor. The youngest, in the west, still erupt.',

  far(time) {
    const t = tones(time);
    return [
      { par: 0.012, scale: 1.3, base: 0.46, amp: 0.13, style: 'round', seed: 4, col: mix('#ffffff', time.haze, 0.4), haze: 0.1, lit: 0.14, facet: 0, rimA: 0.55, foot: 0.9 },
      // a shield volcano across the water: long, low, its top lost in cloud more often than not
      { par: 0.02, scale: 1.7, base: 0.5, amp: 0.16, style: 'volc', seed: 12, col: t('#5a78a8'), haze: 0.42, lit: 0.1, ribs: 0.12, ribGap: 1.4,
        bands: [{ col: t('#6f9a78'), a: 0.4, at: 0.1, th: 0.3, w: 0.2, f: 2, s: 3 }], stamps: [{ s: 'cloudlet', kind: 'steam', every: 0.9, p: 0.5, size: 0.07, seed: 2, a: 0.45 }] },
      // the sea: islets, a rock like a sleeping lion, a boat, a whale now and then
      { kind: 'lake', y: 0.5, h: 0.17, par: 0.05, things: [{ s: 'kicker', n: 2, seed: 3, size: 0.055, at: 0.08, span: 0.12 }, { s: 'islet', n: 3, seed: 5, size: 0.05, at: 0.2, span: 0.2 }, { s: 'boat', n: 2, seed: 11, size: 0.03, speed: 0.003, at: 0.35, span: 0.3 }, { kind: 'spout', cycle: 23 }] },
      // the island's high ground: green on top where the mist waters it, bare lava and red cinder cones below
      { par: 0.09, scale: 0.5, base: 0.66, amp: 0.12, style: 'round', seed: 31, col: t('#4a4450'), haze: 0.18, fog: 0.14, ribs: 0.1, ribGap: 1.6,
        bands: [{ col: t('#5f9a48'), a: 0.75, at: 0.02, th: 0.3, w: 0.14, f: 2, s: 4 }, { col: t('#a84a32'), a: 0.6, at: 0.4, th: 0.14, w: 0.14, f: 3, s: 8 }, { col: t('#2a2a30'), a: 0.6, at: 0.62, th: 0.2, w: 0.2, f: 4, s: 12 }],
        stamps: [{ s: 'coneFar', every: 0.5, p: 0.55, size: 0.07, seed: 7, sink: 0.01 }, { s: 'cactusFar', every: 0.1, p: 0.5, size: 0.045, seed: 9, sink: 0.004 }, { s: '-', kind: 'flock', every: 0.7, p: 0.6, size: 0.016, seed: 13, n: 6, sink: -0.05 }] },
      // the shore: a white beach with the surf on it, red sesuvium, animals hauled out and standing about
      { par: 0.18, scale: 0.38, base: 0.72, amp: 0.1, style: 'round', seed: 47, col: t('#2e2c34'), haze: 0.1, foot: 0.4,
        bands: [{ col: t('#c8483a'), a: 0.7, at: 0.03, th: 0.16, w: 0.12, f: 4, s: 2 }, { col: t('#f6ecd4'), a: 0.9, at: 0.34, th: 0.12, w: 0.1, f: 2, s: 6 }, { col: time.water, a: 0.9, at: 0.48, th: 0.07, w: 0.08, f: 1.6, s: 10, glint: 22 }, { col: t('#5f9a48'), a: 0.6, at: 0.66, th: 0.12, w: 0.14, f: 4, s: 14 }],
        stamps: [{ s: 'cactusFar', every: 0.12, p: 0.5, size: 0.07, seed: 3, sink: 0.004 }, { s: 'tortoiseFar', kind: 'graze', every: 0.3, p: 0.5, size: 0.04, seed: 5, drop: [0.02, 0.26], roam: 0.5, speed: 0.02 }, { s: 'sealionFar', every: 0.22, p: 0.5, size: 0.036, seed: 7, drop: [0.3, 0.42] },
          { s: 'boobyFar', every: 0.16, p: 0.45, size: 0.04, seed: 9, sink: 0.002 }, { s: 'mangroveFar', every: 0.14, p: 0.5, size: 0.05, seed: 11, drop: [0.5, 0.64] }, { s: '-', kind: 'flock', every: 0.5, p: 0.5, size: 0.02, seed: 15, n: 5, sink: -0.06 }] },
      { par: 0.32, scale: 0.36, base: 0.8, amp: 0.13, style: 'round', seed: 63, col: t('#1c1b22'), haze: 0.04, foot: 0.3,
        bands: [{ col: t('#3a3840'), a: 0.8, at: 0.02, th: 0.2, w: 0.14, f: 5, s: 3 }, { col: t('#c8483a'), a: 0.6, at: 0.26, th: 0.1, w: 0.14, f: 5, s: 5 }, { col: t('#f6ecd4'), a: 0.7, at: 0.5, th: 0.1, w: 0.12, f: 3, s: 9 }],
        stamps: [{ s: 'rockFar', every: 0.08, p: 0.55, size: 0.06, seed: 21, sink: 0.012 }, { s: 'cactusFar', every: 0.13, p: 0.55, size: 0.1, seed: 23, sink: 0.004 }, { s: 'iguanaFar', every: 0.1, p: 0.5, size: 0.05, seed: 25, sink: 0.002 }, { s: 'crabFar', kind: 'graze', every: 0.07, p: 0.5, size: 0.03, seed: 27, sink: 0.002, roam: 0.6, speed: 0.3 },
          { s: 'tuftFar', every: 0.035, p: 0.6, size: 0.035, seed: 29, sink: 0.003 }, { s: 'boobyFar', every: 0.2, p: 0.5, size: 0.06, seed: 31, drop: [0.05, 0.3] }] },
    ];
  },
  behind: [
    { s: 'cactus', every: 9, p: 0.55, size: 1, seed: 601, sink: 0.15, zone: ['lava', 'scoria', 'carpet', 'green'] },
    { s: 'rockBig', every: 7, p: 0.4, size: 1, seed: 605, sink: 0.5 },
    { s: 'mangrove', every: 6, p: 0.5, size: 1, seed: 609, sink: 0.2, zone: ['beach', 'green'] },
    { s: 'tortoise', every: 31, p: 0.6, size: 1, seed: 613, sink: 0.04, zone: ['green', 'carpet', 'scoria'], roam: 1.2, speed: 0.025 },
    { s: 'iguana', every: 11, p: 0.5, size: 1, seed: 617, sink: 0.03, zone: ['lava', 'wetrock'] },
    { s: 'booby', every: 17, p: 0.5, size: 1, seed: 621, sink: 0.02, zone: ['lava', 'beach', 'scoria'] },
    { s: 'sealion', every: 23, p: 0.55, size: 1, seed: 625, sink: 0.05, zone: ['beach', 'wetrock'] },
    { s: 'crab', every: 5, p: 0.45, size: 1, seed: 629, sink: 0.01, zone: ['lava', 'wetrock'], roam: 1.4, speed: 0.5 },
  ],
  ground(time) {
    const t = tones(time), band = (a, b, c, w = [1, 0.46, 0.13]) => ({ bands: [{ col: t(a), w: w[0] }, { col: t(b), w: w[1] }, { col: t(c), w: w[2] }] });
    return {
      body: [t('#2a2830'), t('#1c1a22'), t('#0e0d14')],
      // lava flows one on another, with the red baked soil between them
      strata: [{ col: t('#4a4854'), a: 0.5, w: 0.12, d: 1.3, follow: 0.92, f: 0.35, seed: 3, wob: 0.5 }, { col: t('#8a3a2a'), a: 0.45, w: 0.16, d: 2.6, follow: 0.84, f: 0.22, seed: 5, wob: 0.8 }, { col: t('#55535f'), a: 0.35, w: 0.08, d: 3.9, follow: 0.75, f: 0.3, seed: 7, wob: 0.9 }, { col: t('#7a3426'), a: 0.35, w: 0.2, d: 5.8, follow: 0.6, f: 0.18, seed: 9, wob: 1.2 }],
      embed: { s: 'stone', every: 1.5, p: 0.45, a: 0.5 },
      skin: {
        lava: band('#14141a', '#32323c', '#5c5c6a', [0.9, 0.34, 0.08]), beach: band('#cdb890', '#f2e6c8', '#fffaf0'), scoria: band('#6a2e22', '#a84a32', '#dc8458'), green: band('#33602a', '#62a040', '#aadc62'),
        carpet: band('#8a2a2a', '#cc4a3a', '#f48c5c'), wetrock: band('#1a222e', '#3a5064', '#8ab0c8', [0.8, 0.3, 0.08]),
      },
      decor: {
        lava: [{ s: 'pebble', p: 0.4, size: 1, sink: 0.03 }, { s: 'rock', p: 0.2, size: 1, sink: 0.08 }, { s: 'lavaCactus', p: 0.1, size: 1, sink: 0.02 }, { s: 'tuftDry', p: 0.1, size: 0.9, sway: 0.05 }],
        beach: [{ s: 'shell', p: 0.3, size: 1, sink: 0.01 }, { s: 'tuftDry', p: 0.12, size: 1, sway: 0.06 }, { s: 'pebble', p: 0.12, size: 0.8, sink: 0.03 }],
        scoria: [{ s: 'pebbleRed', p: 0.5, size: 1, sink: 0.03 }, { s: 'tuftDry', p: 0.2, size: 1, sway: 0.05 }, { s: 'lavaCactus', p: 0.1, size: 1, sink: 0.02 }],
        green: [{ s: 'tuft', p: 0.85, size: 1, sway: 0.06 }, { s: 'daisy', p: 0.3, size: 1, sway: 0.06 }, { s: 'fern', p: 0.25, size: 1, sway: 0.05 }],
        carpet: [{ s: 'sesuvium', p: 0.8, size: 1, sink: 0.05, steep: 1.6 }, { s: 'daisy', p: 0.12, size: 1, sway: 0.06 }, { s: 'pebble', p: 0.2, size: 1, sink: 0.03 }],
        wetrock: [{ s: 'pebble', p: 0.5, size: 1, sink: 0.03 }, { s: 'rock', p: 0.16, size: 1, sink: 0.08 }],
      },
    };
  },
  lives: { every: 6, p: 0.6, zones: ['green', 'carpet'], cols: ['#ffffff', '#ffd23c', '#ffb04a'] },
  fore: [
    { s: 'foreRock', par: 1.5, every: 19, p: 0.45, size: 1, seed: 701, sink: 0.45, a: 1 },
    { s: 'foreGrass', par: 1.7, every: 3.8, p: 0.65, size: 1, seed: 705, sink: 0.2, a: 0.95 },
  ],
  ambient(time) { return time.stars > 0.5 ? [{ n: 20, col: '#9ff0ff', size: 1.5, speed: -0.01, drift: 0.01, a: 0.5, par: 0.3, sway: 12, twinkle: true }] : [{ n: 26, col: '#ffffff', size: 1.5, speed: -0.01, drift: 0.02, a: 0.35, par: 0.4, sway: 10, twinkle: true }]; },
  // On the equator but cooled by the sea: a trade wind most days, short showers in the warm months, fine mist in the cool ones, and no thunder to speak of.
  weather(key) {
    return { dawn: { wet: 0.3, fog: 0.3, wind: 1.2 }, day: { wet: 0.45, fog: 0.08, wind: 2 }, golden: { wet: 0.35, fog: 0.12, wind: 1.8 }, dusk: { wet: 0.4, fog: 0.16, wind: 1.9, gust: 1.7 },
      night: { wet: 0.35, fog: 0.1, wind: 1.3, clear: 0.45 }, mist: { wet: 0.72, fog: 0.85, wind: 1.1, gust: 0.8, early: true } }[key] || {};
  },

  sprites(time) {
    const t = tones(time), v = variants, dark = lamps(time);
    const S = stock(time, 'gal-', { rock: ['#2c2c34', '#3a3840', '#24242a'], rockLit: '#6a6a78', stone: ['#3a3840', '#5a5864'], near: '#0c0d14', nearBloom: ['#ffd23c', '#fff08a', 'cup'], nestBloom: { kind: 'cup', col: '#ffd23c', col2: '#fff08a' } });
    S.pebbleRed = v(4, 'gal-pebr', (r) => r.range(0.12, 0.28), (r) => r.range(0.07, 0.14), P.rock, (r) => ({ col: t(r.pick(['#8a3a2a', '#a84a32', '#6a2e22'])), lit: t('#dc8458') }));
    S.shell = v(4, 'gal-shell', 0.16, 0.1, P.rock, (r) => ({ col: t(r.pick(['#fff4e0', '#f6c8b8', '#e8d8f0'])), lit: t('#ffffff') }));
    S.tuft = v(6, 'gal-tuft', (r) => r.range(0.4, 0.6), (r) => r.range(0.3, 0.5), P.tuft, (r) => ({ col: t(r.pick(['#4f8a3a', '#62a040'])), tip: t('#c8ec7c'), n: r.int(8, 13) }));
    S.tuftDry = v(4, 'gal-dry', (r) => r.range(0.36, 0.55), (r) => r.range(0.28, 0.5), P.tuft, () => ({ col: t('#a89858'), tip: t('#f0e09a'), n: 9 }));
    S.tuftFar = v(3, 'gal-tfar', 0.5, 0.4, P.tuft, () => ({ col: t('#6a8a45'), tip: t('#b0cc6a'), n: 8 }), { ppu: 44 });
    S.fern = v(4, 'gal-fern', (r) => r.range(0.7, 1.1), (r) => r.range(0.5, 0.8), P.shrub, () => ({ col: t('#3f7a36'), lit: t('#9ad860'), stem: t('#3a5a30') }));
    S.daisy = v(4, 'gal-daisy', 0.22, (r) => r.range(0.26, 0.4), P.flower, () => ({ kind: 'cup', col: t('#ffd23c'), col2: t('#fff4b0'), stem: t('#5a8a45') }));
    S.sesuvium = v(5, 'gal-ses', (r) => r.range(0.7, 1.3), (r) => r.range(0.16, 0.26), P.mound, (r) => ({ col: t(r.pick(['#c8483a', '#e0603a', '#b83a3a'])), lit: t('#ffa070'), dots: t('#ffd0a0') }));
    S.lavaCactus = v(3, 'gal-lcac', 0.4, (r) => r.range(0.4, 0.6), (ctx, w, h, r) => { for (let i = 0; i < 5; i++) { const x = w * (0.15 + i * 0.17), hh = h * r.range(0.5, 1); const g = ctx.createLinearGradient(0, h - hh, 0, h); g.addColorStop(0, t('#f0d060')); g.addColorStop(1, t('#6a7a3a')); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - w * 0.06, h - hh, w * 0.12, hh, w * 0.06); ctx.fill(); } });
    const cac = (far) => () => ({ trunk: far ? t.h('#b8683a', 0.1) : t('#b8683a'), trunkLit: far ? t.h('#e09a62', 0.1) : t('#e09a62'), pad: far ? t.h('#5f8f45', 0.1) : t('#5f8f45'), padLit: far ? t.h('#a8cc6a', 0.1) : t('#a8cc6a'), bloom: t('#ffd23c') });
    S.cactus = v(5, 'gal-cac', (r) => r.range(1.6, 2.4), (r) => r.range(2.6, 4.4), P.cactus, cac(false)); S.cactusFar = v(4, 'gal-cacf', 0.7, (r) => r.range(0.9, 1.4), P.cactus, cac(true), { ppu: 48 });
    S.mangrove = v(4, 'gal-mang', (r) => r.range(1.8, 2.8), (r) => r.range(1.3, 2), P.shrub, () => ({ col: t('#3f7a40'), lit: t('#a0d868'), stem: t('#6a4a36') })); S.mangroveFar = v(3, 'gal-mangf', 1, 0.7, P.shrub, () => ({ col: t.h('#3f7a40', 0.1), lit: t.h('#90c860', 0.1), stem: t('#6a4a36') }), { ppu: 48 });
    const tor = () => ({ shell: t('#4a443c'), shellLit: t('#8a8070'), skin: t('#3e3a34') });
    S.tortoise = v(3, 'gal-tort', (r) => r.range(1.9, 2.4), (r) => r.range(1.1, 1.4), P.tortoise, tor); S.tortoiseFar = v(2, 'gal-tortf', 1.9, 1.1, P.tortoise, tor, { ppu: 48 });
    S.iguana = v(3, 'gal-ig', (r) => r.range(1.2, 1.6), 0.42, P.iguana, () => ({ col: t('#2a2826'), lit: t('#5a544c') })); S.iguanaFar = v(2, 'gal-igf', 1.3, 0.42, P.iguana, () => ({ col: t('#1c1b1a'), lit: t('#4a4640') }), { ppu: 48 });
    S.booby = v(2, 'gal-boob', 0.5, 0.78, P.booby, () => ({ foot: t('#3fa8e0') })); S.boobyFar = v(2, 'gal-boobf', 0.5, 0.78, P.booby, () => ({ foot: t('#3fa8e0') }), { ppu: 48 });
    S.sealion = v(3, 'gal-seal', (r) => r.range(1.6, 2.1), (r) => r.range(0.8, 1), P.sealion, (r) => ({ col: t(r.pick(['#6a4a36', '#7a5a40'])), lit: t('#b08a62') })); S.sealionFar = v(2, 'gal-sealf', 1.8, 0.9, P.sealion, () => ({ col: t('#6a4a36'), lit: t('#a8825c') }), { ppu: 48 });
    S.crab = v(3, 'gal-crab', 0.4, 0.22, P.crab, () => ({ col: t('#e8442a'), lit: t('#ffb04a') })); S.crabFar = v(2, 'gal-crabf', 0.4, 0.22, P.crab, () => ({ col: t('#e8442a'), lit: t('#ffb04a') }), { ppu: 48 });
    // cinder cones on the far slopes, a rock in the sea shaped like a sleeping lion, small islets with a cactus or two
    S.coneFar = v(3, 'gal-cone', (r) => r.range(1.4, 2.2), (r) => r.range(0.6, 0.9), (ctx, w, h, r) => { const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, t.h('#c8603a', 0.15)); g.addColorStop(1, t.h('#7a3426', 0.15)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w * 0.36, h * 0.12); ctx.quadraticCurveTo(w * 0.5, h * 0.3, w * 0.64, h * 0.12); ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); }, {}, { ppu: 48 });
    S.kicker = [sprite(2.4, 1.5, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, t.h('#6a6058', 0.25)); g.addColorStop(1, t.h('#3a3438', 0.25)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w * 0.06, h * 0.5); ctx.lineTo(w * 0.3, h * 0.12); ctx.lineTo(w * 0.56, h * 0.2); ctx.lineTo(w * 0.62, h); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(w * 0.7, h); ctx.lineTo(w * 0.76, h * 0.28); ctx.lineTo(w * 0.9, h * 0.34); ctx.lineTo(w * 0.96, h); ctx.closePath(); ctx.fill(); }, { ppu: 48 })];
    S.islet = v(3, 'gal-islet', (r) => r.range(1.4, 2.6), (r) => r.range(0.4, 0.7), (ctx, w, h, r) => { P.rock(ctx, w, h, r, { col: t.h('#3a3840', 0.2), lit: t.h('#6a6a78', 0.2) }); ctx.save(); ctx.translate(w * r.range(0.3, 0.6), -h * 0.2); P.cactus(ctx, w * 0.2, h * 0.9, r, cac(true)()); ctx.restore(); }, {}, { ppu: 48 });
    S.boat = v(2, 'gal-boat', 1.3, 0.7, P.boat, (r) => ({ hull: t(r.pick(['#ffffff', '#2f8fb8'])), cabin: t('#f4f1ea'), trim: dark ? '#ffd76a' : t('#2c3644') }), { ppu: 64 });
    return S;
  },
  // what there is to stand on out in the water: a raft of driftwood, a slab of lava, or the back of a tortoise
  slab(w, kind, time) {
    const t = tones(time), r = new RNG('galslab' + w + kind);
    if (kind === 'tortoise') return sprite(w * 1.25, w * 0.72, (ctx) => P.tortoise(ctx, w * 1.25, w * 0.72, r, { shell: t('#4a443c'), shellLit: t('#8a8070'), skin: t('#3e3a34') }), { ax: 0.37, ay: 0.0 });
    if (kind === 'raft') return sprite(w, 0.5, (ctx) => { const n = Math.max(3, Math.round(w / 0.42)), lw = w / n; for (let i = 0; i < n; i++) { const g = ctx.createLinearGradient(0, 0, 0, 0.36); g.addColorStop(0, t(i % 2 ? '#c9a878' : '#b8946a')); g.addColorStop(1, t('#7a5a3c')); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(i * lw + 0.02, r.range(0, 0.03), lw - 0.04, 0.34, 0.08); ctx.fill(); } ctx.fillStyle = t('#5a4630'); ctx.fillRect(w * 0.12, 0.1, w * 0.76, 0.05); }, { ax: 0.5, ay: 0 });
    return sprite(w, 1.2, (ctx) => { const g = ctx.createLinearGradient(0, 0, 0, 1.2); g.addColorStop(0, t('#4a4854')); g.addColorStop(1, t('#1c1a22')); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0.05); ctx.lineTo(w, 0.05); ctx.quadraticCurveTo(w * 0.8, 0.8, w * (0.5 + r.range(-0.1, 0.1)), 1.2); ctx.quadraticCurveTo(w * 0.2, 0.8, 0, 0.05); ctx.fill(); ctx.fillStyle = rgba('#ffffff', 0.22); ctx.fillRect(0.06, 0.05, w - 0.12, 0.04); }, { ax: 0.5, ay: 0 });
  },
};
