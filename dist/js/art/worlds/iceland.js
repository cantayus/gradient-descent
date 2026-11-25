// Iceland: black sand, basalt columns, bright moss, glaciers, waterfalls, geysers and hot springs, lupins in summer, the northern lights.
// A theme gives the scene painter its colours, its layers and its small pictures. Colours are written for full daylight and toned to the hour.
import { RNG } from '../../core/rng.js';
import { P, variants, sprite, mix, rgba, lighten, darken, TAU } from '../paint.js';

const TIMES = {
  dawn:   { wash: [{ x: 0.74, y: 0.3, r: 0.9, col: '#ff7f9a', a: 0.4 }, { x: 0.12, y: 0.08, r: 0.8, col: '#2f46b8', a: 0.35 }, { x: 0.74, y: 0.46, r: 0.5, col: '#ffd27a', a: 0.45 }], sky: ['#2a3566', '#6a66a6', '#e9987e', '#ffdca6'], skyAt: [0, 0.42, 0.78, 1], sun: { x: 0.735, y: 0.218, r: 0.036, col: '#fff3d6', glow: '#ffb070' }, bloom: 0.38, haze: '#f1c3a4', shade: '#3a2f5a', dark: 0.13, mist: 0.34, shafts: 0.06, tint: 'rgba(255,160,110,0.16)', rim: '#ffd6ad', snow: '#ffe9dc', water: '#6c8fb8', hot: '#7fd3d6' },
  day:    { wash: [{ x: 0.83, y: 0.13, r: 0.7, col: '#fff3c0', a: 0.3 }, { x: 0.08, y: 0.8, r: 0.9, col: '#6fe6d6', a: 0.28 }, { x: 0.3, y: 0.02, r: 0.8, col: '#1650d8', a: 0.3 }], sky: ['#2c72bf', '#69aee6', '#bfe1f6', '#eef7f8'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.83, y: 0.13, r: 0.03, col: '#fffbe8', glow: '#fff0b8' }, haze: '#d4e5f0', shade: '#1c2a44', dark: 0, mist: 0.16, shafts: 0.045, tint: 'rgba(255,236,190,0.1)', rim: '#ffffff', snow: '#ffffff', water: '#3f8ac4', hot: '#62cfd4' },
  mist:   { wash: [{ x: 0.5, y: 0.62, r: 0.9, col: '#eef4f2', a: 0.32 }, { x: 0.85, y: 0.2, r: 0.6, col: '#9fb6d8', a: 0.25 }], sky: ['#8496ad', '#aebcc9', '#dbe2e6'], bow: true, haze: '#cbd5db', shade: '#35414f', dark: 0.12, mist: 0.6, cloud: 0.5, tint: 'rgba(200,220,235,0.12)', rim: '#f2f6f8', snow: '#f4f8fb', water: '#6f93ad', hot: '#84d2d2' },
  golden: { wash: [{ x: 0.22, y: 0.4, r: 0.85, col: '#ff8f4a', a: 0.45 }, { x: 0.88, y: 0.12, r: 0.9, col: '#4f5fd8', a: 0.36 }, { x: 0.55, y: 0.78, r: 0.7, col: '#ffc890', a: 0.35 }], sky: ['#375f97', '#8fa5c6', '#f6c486', '#ffe8ba'], skyAt: [0, 0.45, 0.82, 1], sun: { x: 0.22, y: 0.38, r: 0.038, col: '#fff0c4', glow: '#ffbd66' }, haze: '#ffd49c', shade: '#4a3040', dark: 0.07, mist: 0.28, shafts: 0.08, tint: 'rgba(255,180,90,0.2)', rim: '#ffe2ae', snow: '#fff0d8', water: '#7d95b5', hot: '#8fd6cf' },
  dusk:   { wash: [{ x: 0.28, y: 0.5, r: 0.85, col: '#ff4f86', a: 0.45 }, { x: 0.88, y: 0.18, r: 0.9, col: '#2326a0', a: 0.4 }, { x: 0.62, y: 0.78, r: 0.6, col: '#ffac6a', a: 0.35 }], sky: ['#141944', '#463c80', '#c56a96', '#ffa775'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.28, y: 0.44, r: 0.04, col: '#ffe1c0', glow: '#ff8f6a' }, haze: '#c486a4', shade: '#231b49', dark: 0.27, mist: 0.3, shafts: 0.05, tint: 'rgba(255,120,150,0.16)', rim: '#ffc6c0', snow: '#f1d3e2', water: '#5b5f9a', hot: '#74c6d0', stars: 0.35, aura: 0.38 },
  night:  { wash: [{ x: 0.5, y: 0.98, r: 0.75, col: '#168f8f', a: 0.34 }, { x: 0.2, y: 0.15, r: 0.5, col: '#3a5fd8', a: 0.3 }, { x: 0.85, y: 0.3, r: 0.6, col: '#4a2f9a', a: 0.3 }], sky: ['#050818', '#0a1535', '#11294f', '#1c4266'], skyAt: [0, 0.4, 0.8, 1], sun: { x: 0.2, y: 0.15, r: 0.03, col: '#f4f6ff', glow: '#9ab6ff', moon: true }, haze: '#1c3358', shade: '#070c26', dark: 0.6, mist: 0.22, tint: 'rgba(70,150,255,0.14)', rim: '#a8ffd8', snow: '#bcd4ff', water: '#16335e', hot: '#2f8aa0', stars: 1, aurora: 1, cloud: 0.25, aura: 0.5, vignette: 0.5 },
};

function tones(time) { const t = (hex) => mix(hex, time.shade, time.dark); t.h = (hex, k) => mix(mix(hex, time.shade, time.dark), time.haze, k); return t; }

export const iceland = {
  id: 'iceland', name: 'Iceland', zone: 'sand', times: TIMES,
  note: 'Iceland sits on the Mid-Atlantic Ridge, where two plates of the Earth’s crust pull apart.',

  far(time) {
    const t = tones(time);
    return [
      // a bank of cloud lying along the horizon, lit by the hour
      { par: 0.012, scale: 1.3, base: 0.46, amp: 0.13, style: 'round', seed: 5, col: mix('#ffffff', time.haze, 0.4), haze: 0.1, lit: 0.14, facet: 0, rimA: 0.55, foot: 0.9 },
      // the ice cap, with blue shadow in its ice and, some way along it, a fissure in eruption
      { par: 0.028, scale: 1.05, base: 0.5, amp: 0.3, style: 'table', seed: 11, col: t('#6f86b8'), haze: 0.36, snow: 0.2, lit: 0.1, ribs: 0.16, ribGap: 1.2,
        bands: [{ col: t('#9fc8ee'), a: 0.4, at: 0.2, th: 0.07, w: 0.1, f: 5, s: 9 }, { col: t('#4f6aa8'), a: 0.35, at: 0.55, th: 0.3, w: 0.3, f: 2, s: 13 }],
        stamps: [{ s: '-', kind: 'erupt', every: 1.25, p: 0.42, size: 0.022, seed: 31, sink: 0.006 }] },
      // the coloured mountains: rhyolite, in rust and ochre and sage, with old snow in the gullies
      { par: 0.055, scale: 0.55, base: 0.54, amp: 0.22, style: 'jag', seed: 23, col: t('#566a98'), haze: 0.24, snow: 0.13, snowA: 0.8, ribs: 0.22,
        bands: [{ col: t('#cf7a3f'), a: 0.6, at: 0.16, th: 0.2, w: 0.3, f: 3, s: 2 }, { col: t('#e0b85a'), a: 0.55, at: 0.42, th: 0.16, w: 0.3, f: 4, s: 4 }, { col: t('#7fb592'), a: 0.55, at: 0.62, th: 0.2, w: 0.26, f: 2.5, s: 6 }, { col: t('#d98aa0'), a: 0.4, at: 0.84, th: 0.12, w: 0.2, f: 5, s: 8 }],
        stamps: [{ s: 'cloudlet', kind: 'steam', every: 0.5, p: 0.35, size: 0.05, seed: 2, a: 0.5 }, { s: '-', kind: 'fall', every: 0.37, p: 0.3, size: 0.5, len: 0.07, seed: 6 }] },
      // the fjord: sea stacks, ice adrift from the glacier, a fishing boat, and now and then a whale
      { kind: 'lake', y: 0.5, h: 0.12, par: 0.08, things: [{ s: 'stack', n: 4, seed: 3, size: 0.04, at: 0.12, span: 0.12 }, { s: 'berg', n: 9, seed: 7, size: 0.045, speed: 0.0011, at: 0.16, span: 0.34 }, { s: 'boat', n: 1, seed: 11, size: 0.03, speed: 0.0035, at: 0.3, span: 0.12 }, { kind: 'spout', cycle: 27 }] },
      { par: 0.1, scale: 0.4, base: 0.645, amp: 0.115, style: 'round', seed: 37, col: t('#3b5a6e'), haze: 0.18, fog: 0.2, ribs: 0.08, ribGap: 1.6,
        bands: [{ col: t('#7fae46'), a: 0.7, at: 0.03, th: 0.36, w: 0.14, f: 2, s: 4 }, { col: t('#8a6fd0'), a: 0.55, at: 0.3, th: 0.1, w: 0.12, f: 4, s: 10 }, { col: t('#62c8d8'), a: 0.85, at: 0.62, th: 0.035, w: 0.1, f: 1.6, s: 14, glint: 16 }],
        stamps: [{ s: '-', kind: 'fall', every: 0.3, p: 0.4, size: 0.5, len: 0.1, seed: 5 }, { s: 'basaltFar', every: 0.4, p: 0.3, size: 0.045, seed: 7, sink: 0.012 }, { s: 'church', every: 1.1, p: 0.5, size: 0.034, seed: 41, drop: [0.1, 0.3], glow: 0.7 },
          { s: 'light', kind: 'beam', every: 2.9, p: 0.6, size: 0.034, seed: 43, sink: 0.004 }, { s: 'vent', kind: 'geyser', every: 0.9, p: 0.5, size: 0.014, seed: 45, drop: [0.2, 0.45], cycle: 11 }, { s: 'farm', kind: 'smoke', every: 0.6, p: 0.4, size: 0.022, seed: 47, drop: [0.12, 0.5], glow: 0.6 }] },
      { par: 0.19, scale: 0.36, base: 0.705, amp: 0.14, style: 'round', seed: 53, col: t('#3a5a3c'), haze: 0.1, fog: 0.22, foot: 0.4,
        bands: [{ col: t('#93b846'), a: 0.8, at: 0.01, th: 0.22, w: 0.1, f: 3, s: 6 }, { col: t('#7a62c8'), a: 0.55, at: 0.22, th: 0.08, w: 0.1, f: 5, s: 8 }, { col: t('#d9c24a'), a: 0.4, at: 0.36, th: 0.06, w: 0.1, f: 6, s: 12 }, { col: t('#5fc4d4'), a: 0.85, at: 0.56, th: 0.04, w: 0.12, f: 1.3, s: 16, glint: 20 }],
        stamps: [{ s: 'basaltFar', every: 0.5, p: 0.3, size: 0.07, seed: 9, sink: 0.016 }, { s: 'sheep', kind: 'graze', every: 0.17, p: 0.36, size: 0.03, seed: 12, sink: -0.002, roam: 0.8, speed: 0.04 }, { s: 'sheep', kind: 'graze', every: 0.2, p: 0.4, size: 0.034, seed: 18, drop: [0.1, 0.5], roam: 0.7, speed: 0.035 },
          { s: 'horseFar', kind: 'graze', every: 0.34, p: 0.45, size: 0.034, seed: 20, drop: [0.05, 0.4], roam: 1.3, speed: 0.05 }, { s: 'farm', kind: 'smoke', every: 0.75, p: 0.5, size: 0.04, seed: 22, drop: [0.08, 0.3], glow: 0.7 }, { s: 'cloudlet', kind: 'steam', every: 0.42, p: 0.4, size: 0.07, seed: 14, a: 0.55 }, { s: '-', kind: 'flock', every: 0.9, p: 0.6, size: 0.014, seed: 26, n: 7, sink: -0.02 }] },
      { par: 0.34, scale: 0.34, base: 0.79, amp: 0.14, style: 'round', seed: 71, col: t('#28432f'), haze: 0.04, foot: 0.3,
        bands: [{ col: t('#86ab3e'), a: 0.85, at: 0.01, th: 0.26, w: 0.14, f: 4, s: 3 }, { col: t('#6a52b8'), a: 0.5, at: 0.3, th: 0.1, w: 0.14, f: 6, s: 5 }],
        stamps: [{ s: 'rockFar', every: 0.09, p: 0.5, size: 0.06, seed: 21, sink: 0.012 }, { s: 'lupinFar', every: 0.035, p: 0.6, size: 0.05, seed: 23, sink: 0.004 }, { s: 'tuftFar', every: 0.03, p: 0.7, size: 0.035, seed: 25, sink: 0.003 }, { s: 'lupinFar', every: 0.05, p: 0.5, size: 0.055, seed: 27, drop: [0.1, 0.5] },
          { s: 'cairnFar', every: 0.5, p: 0.5, size: 0.05, seed: 29, sink: 0.004 }, { s: 'puffinFar', every: 0.3, p: 0.4, size: 0.06, seed: 33, sink: 0.002 }, { s: '-', kind: 'flock', every: 0.7, p: 0.5, size: 0.018, seed: 35, n: 5, sink: -0.03 }] },
    ];
  },
  behind: [
    { s: 'basalt', every: 17, p: 0.36, size: 1, seed: 201, sink: 0.7, zone: ['sand', 'rock', 'basalt', 'moss'] },
    { s: 'rockBig', every: 6, p: 0.4, size: 1, seed: 205, sink: 0.5 },
    { s: 'iceBig', every: 4, p: 0.6, size: 1, seed: 209, sink: 0.4, zone: ['ice', 'snow'] },
    { s: 'birch', every: 5, p: 0.5, size: 1, seed: 213, sink: 0.2, zone: ['meadow', 'moss'] },
    // what lives beside the path: cairns that mark the way, a turf house with its lamp and its smoke, horses, puffins, and steam where the ground is hot
    { s: 'cairn', every: 19, p: 0.5, size: 1, seed: 221, sink: 0.06, zone: ['sand', 'rock', 'basalt', 'moss', 'snow'] },
    { s: 'turf', every: 53, p: 0.6, size: 1, seed: 233, sink: 0.12, zone: ['meadow', 'moss'], glow: 1.1, emit: 'steam', ex: 0.3, ey: 1.5 },
    { s: 'horse', frames: ['horse', 'horseB'], fps: 0.5, every: 27, p: 0.55, size: 1, seed: 225, sink: 0.04, zone: ['meadow'], roam: 1.7, speed: 0.07 },
    { s: 'puffin', frames: ['puffin', 'puffin', 'puffin', 'puffinB'], fps: 1.6, every: 11, p: 0.42, size: 1, seed: 229, sink: 0.03, zone: ['rock', 'basalt', 'sand', 'moss'] },
    { s: 'vent', every: 7, p: 0.5, size: 0.7, seed: 237, sink: 0.08, zone: ['hot', 'drum'], emit: 'steam', ey: 0.3 },
  ],
  ground(time) {
    const t = tones(time), band = (a, b, c, w = [1, 0.48, 0.14]) => ({ bands: [{ col: t(a), w: w[0] }, { col: t(b), w: w[1] }, { col: t(c), w: w[2] }] });
    return {
      body: [t('#2a2c36'), t('#1d1e27'), t('#121319')],
      strata: [{ col: t('#4a4d5a'), a: 0.5, w: 0.1, d: 1.3, follow: 0.92, f: 0.35, seed: 3, wob: 0.5 }, { col: t('#0b0c10'), a: 0.4, w: 0.2, d: 2.5, follow: 0.84, f: 0.22, seed: 5, wob: 0.8 }, { col: t('#565a68'), a: 0.35, w: 0.07, d: 3.9, follow: 0.75, f: 0.3, seed: 7, wob: 0.9 }, { col: t('#3a3d48'), a: 0.4, w: 0.14, d: 5.6, follow: 0.6, f: 0.18, seed: 9, wob: 1.2 }, { col: t('#7a4a3a'), a: 0.25, w: 0.1, d: 7.4, follow: 0.5, f: 0.2, seed: 11, wob: 1.2 }],
      embed: { s: 'stone', every: 1.4, p: 0.5, a: 0.55 },
      joints: { every: 0.55, zones: ['sand', 'rock', 'basalt', 'wet', 'hot'], top: 0.5, len: 2.6, dark: t('#07080c'), light: t('#5a5f6e'), a: 0.6 },
      skin: {
        sand: band('#15161c', '#2c2e38', '#4d505c', [0.9, 0.36, 0.08]), rock: band('#23262f', '#474c59', '#737a8a', [0.8, 0.3, 0.07]), basalt: band('#1d2028', '#3d424e', '#6a7181', [0.8, 0.3, 0.07]),
        moss: band('#35501f', '#74a038', '#b4d455'), meadow: band('#34512a', '#5d9147', '#96c861'), snow: band('#aac4e2', '#e2eefb', '#ffffff', [1.2, 0.62, 0.2]),
        ice: band('#4f9dcf', '#9ad6ef', '#eafcff', [1.1, 0.5, 0.12]), hot: band('#7e5230', '#c98a4b', '#f2cf8f'), drum: band('#6b4a3a', '#b98a66', '#ecd9b6'), wet: band('#1d2530', '#3f5266', '#8fb0c8', [0.8, 0.3, 0.08]),
      },
      decor: {
        sand: [{ s: 'pebble', p: 0.5, size: 1, sink: 0.03 }, { s: 'rock', p: 0.1, size: 1, sink: 0.08, steep: 0.8 }, { s: 'tuftDry', p: 0.16, size: 1, sway: 0.05 }, { s: 'thrift', p: 0.07, size: 1, sway: 0.05 }],
        rock: [{ s: 'pebble', p: 0.4, size: 1, sink: 0.03 }, { s: 'rock', p: 0.2, size: 1, sink: 0.08 }, { s: 'rockMoss', p: 0.1, size: 1, sink: 0.08 }, { s: 'tuftDry', p: 0.12, size: 1, sway: 0.05 }],
        basalt: [{ s: 'rock', p: 0.25, size: 1, sink: 0.08 }, { s: 'pebble', p: 0.5, size: 1, sink: 0.03 }, { s: 'mossy', p: 0.2, size: 0.8, sink: 0.05 }],
        moss: [{ s: 'mossy', p: 0.75, size: 1, sink: 0.07, steep: 1.6 }, { s: 'rockMoss', p: 0.12, size: 1, sink: 0.08 }, { s: 'cotton', p: 0.12, size: 1, sway: 0.07 }, { s: 'tuft', p: 0.25, size: 0.9, sway: 0.05 }, { s: 'buttercup', p: 0.1, size: 1, sway: 0.06 }],
        meadow: [{ s: 'tuft', p: 0.85, size: 1, sway: 0.06 }, { s: 'lupin', p: 0.42, size: 1, sway: 0.05, steep: 0.9 }, { s: 'buttercup', p: 0.2, size: 1, sway: 0.06 }, { s: 'thrift', p: 0.14, size: 1, sway: 0.05 }, { s: 'rockMoss', p: 0.06, size: 1, sink: 0.08 }],
        snow: [{ s: 'drift', p: 0.5, size: 1, sink: 0.06, steep: 1.6 }, { s: 'rockSnow', p: 0.1, size: 1, sink: 0.08 }, { s: 'ice', p: 0.08, size: 0.8, sink: 0.04 }],
        ice: [{ s: 'ice', p: 0.22, size: 1, sink: 0.04, steep: 0.7 }, { s: 'drift', p: 0.14, size: 0.8, sink: 0.06 }],
        drum: [{ s: 'pebbleHot', p: 0.22, size: 0.8, sink: 0.03 }],
        hot: [{ s: 'pebbleHot', p: 0.5, size: 1, sink: 0.03 }, { s: 'mossy', p: 0.14, size: 0.8, sink: 0.06 }, { s: 'tuftDry', p: 0.12, size: 0.9, sway: 0.05 }],
        wet: [{ s: 'pebble', p: 0.5, size: 1, sink: 0.03 }, { s: 'rock', p: 0.14, size: 1, sink: 0.08 }],
      },
    };
  },
  // butterflies over the flowers by day, and small lights after dark (Iceland has no fireflies; these are the seeds' kin, the same warm light the hero carries)
  lives: { every: 6, p: 0.6, zones: ['meadow', 'moss'], cols: ['#ffffff', '#ffe37a', '#9fc4ff', '#ffb3c8'] },
  fore: [
    { s: 'foreRock', par: 1.5, every: 19, p: 0.45, size: 1, seed: 301, sink: 0.45, a: 1 },
    { s: 'foreGrass', par: 1.7, every: 3.6, p: 0.7, size: 1, seed: 305, sink: 0.2, a: 0.95 },
  ],
  // the small things that hang in the air whatever the weather: pollen by day, sparks of frost at night. Rain and snow come from the weather.
  ambient(time) {
    if (time.aurora) return [{ n: 24, col: '#a8ffd8', size: 1.6, speed: -0.012, drift: 0.01, a: 0.6, par: 0.3, sway: 12, twinkle: true }];
    if (time.mist > 0.5) return [];
    return [{ n: 34, col: '#ffffff', size: 1.7, speed: -0.012, drift: 0.02, a: 0.4, par: 0.4, sway: 10, twinkle: true }];
  },
  // Iceland's weather turns quickly: showers come in off the sea and are gone again, and the wind hardly ever drops. Thunder is rare there, so there is none.
  weather(key) {
    return { dawn: { wet: 0.42, fog: 0.4, wind: 1.3 }, day: { wet: 0.55, fog: 0.15, wind: 1.8 }, mist: { wet: 0.78, fog: 0.8, wind: 1.2, gust: 1, early: true }, golden: { wet: 0.46, fog: 0.2, wind: 1.6 },
      dusk: { wet: 0.5, fog: 0.3, wind: 1.9, gust: 1.8 }, night: { wet: 0.62, cold: 1, fog: 0.15, wind: 1.2, clear: 0.42 } }[key] || {};
  },

  sprites(time) {
    const t = tones(time), S = {}, v = variants;
    S.cloud = v(5, 'ice-cloud', (r) => r.range(3.4, 6), (r) => r.range(1, 1.5), P.cloud, { col: mix('#ffffff', time.haze, 0.18), under: mix(mix('#aebcd6', time.shade, time.dark * 0.6), time.haze, 0.45) }, { ax: 0.5, ay: 0.5, ppu: 64, blur: 0.8 });
    S.cloudlet = v(3, 'ice-steam', 2.2, 1.2, P.mist, { col: '#ffffff' }, { ax: 0.5, ay: 1, ppu: 40 });
    S.mist = v(3, 'ice-mist', 12, 2, P.mist, { col: mix('#ffffff', time.haze, 0.4) }, { ax: 0.5, ay: 0.5, ppu: 24 });
    S.tuft = v(6, 'ice-tuft', (r) => r.range(0.4, 0.6), (r) => r.range(0.3, 0.55), P.tuft, (r) => ({ col: t(r.pick(['#5f8f45', '#6d9a3f', '#7aa64a'])), tip: t('#c2de7c'), n: r.int(8, 13) }));
    S.tuftDry = v(4, 'ice-dry', (r) => r.range(0.36, 0.55), (r) => r.range(0.28, 0.5), P.tuft, (r) => ({ col: t('#a08a4a'), tip: t('#ecd690'), n: r.int(7, 11) }));
    S.mossy = v(5, 'ice-moss', (r) => r.range(0.7, 1.3), (r) => r.range(0.18, 0.3), P.mound, (r) => ({ col: t(r.pick(['#7ea83a', '#8fb53f', '#6f9a36'])), lit: t('#c4e062'), dots: t('#dff08a') }));
    S.drift = v(4, 'ice-drift', (r) => r.range(0.8, 1.5), (r) => r.range(0.16, 0.3), P.mound, () => ({ col: t('#dfeaf8'), lit: t('#ffffff') }));
    const rockO = (o) => (r) => ({ col: t(r.pick(['#4b505d', '#3e434f', '#565b69'])), lit: t('#8d93a4'), ...o(r) });
    S.rock = v(6, 'ice-rock', (r) => r.range(0.4, 0.9), (r) => r.range(0.25, 0.55), P.rock, rockO(() => ({})));
    S.rockMoss = v(4, 'ice-rockm', (r) => r.range(0.5, 1), (r) => r.range(0.3, 0.6), P.rock, rockO(() => ({ moss: t('#86ad3e') })));
    S.rockSnow = v(4, 'ice-rocks', (r) => r.range(0.5, 1), (r) => r.range(0.3, 0.6), P.rock, rockO(() => ({ snow: t('#f2f7ff') })));
    S.rockBig = v(5, 'ice-rockb', (r) => r.range(1.6, 3.2), (r) => r.range(1.1, 2.4), P.rock, rockO((r) => (r.chance(0.5) ? { moss: t('#7fa63c') } : {})));
    S.pebble = v(5, 'ice-peb', (r) => r.range(0.12, 0.26), (r) => r.range(0.07, 0.13), P.rock, rockO(() => ({})));
    S.pebbleHot = v(4, 'ice-pebh', (r) => r.range(0.12, 0.28), (r) => r.range(0.07, 0.14), P.rock, (r) => ({ col: t(r.pick(['#b8743a', '#d9a05a', '#8c8f5a', '#9ab3a8'])) }));
    S.stone = v(4, 'ice-stone', (r) => r.range(0.3, 0.8), (r) => r.range(0.2, 0.45), P.rock, () => ({ col: t('#3a3d48'), lit: t('#555968') }));
    S.lupin = v(6, 'ice-lupin', 0.3, (r) => r.range(0.6, 0.95), P.flower, (r) => ({ kind: 'spike', col: t(r.pick(['#6a4fc0', '#7a5fd0', '#5a48b0'])), col2: t(r.pick(['#d6b8ff', '#f0c8f5'])), stem: t('#4f7a3f') }));
    S.thrift = v(3, 'ice-thrift', 0.24, (r) => r.range(0.24, 0.36), P.flower, () => ({ kind: 'pom', col: t('#e86fa0'), col2: t('#ffc0d8'), stem: t('#5a7a45') }));
    S.cotton = v(3, 'ice-cotton', 0.22, (r) => r.range(0.34, 0.5), P.flower, () => ({ kind: 'puff', stem: t('#7a8a55') }));
    S.buttercup = v(3, 'ice-butter', 0.2, (r) => r.range(0.2, 0.32), P.flower, () => ({ kind: 'cup', col: t('#ffd23c'), col2: t('#fff08a'), stem: t('#5a8a45') }));
    S.birch = v(4, 'ice-birch', (r) => r.range(1.1, 1.8), (r) => r.range(0.8, 1.4), P.shrub, (r) => ({ col: t('#4f7a36'), lit: t('#a8cc5f'), berry: r.chance(0.4) ? t('#c93a4a') : null, stem: t('#6a5a4a') }));
    S.basalt = v(5, 'ice-basalt', (r) => r.range(2.4, 4.6), (r) => r.range(2.6, 5.2), P.basalt, (r) => ({ col: t('#434854'), lit: t('#8f96a8'), moss: r.chance(0.6) ? t('#7fa63c') : null }));
    S.ice = v(5, 'ice-ice', (r) => r.range(0.3, 0.6), (r) => r.range(0.3, 0.7), P.ice, () => ({ col: t('#c8ecf8'), deep: t('#62acd8') }));
    S.iceBig = v(4, 'ice-iceb', (r) => r.range(1.4, 2.6), (r) => r.range(1.6, 3.4), P.ice, () => ({ col: t('#bfe6f5'), deep: t('#4f9dcf') }));
    // far things are painted flat and pale: they are seen through a lot of air
    const farC = t.h('#34475a', 0.12);
    S.basaltFar = v(4, 'ice-bfar', (r) => r.range(1.2, 2.6), (r) => r.range(0.8, 1.7), P.basalt, (r) => ({ col: farC, lit: t.h('#5d7388', 0.15) }), { ppu: 44 });
    S.rockFar = v(4, 'ice-rfar', (r) => r.range(0.9, 2), (r) => r.range(0.5, 1), P.rock, () => ({ col: t('#27333f'), lit: t('#4a5a68') }), { ppu: 44 });
    S.lupinFar = v(4, 'ice-lfar', 0.3, (r) => r.range(0.5, 0.9), P.flower, (r) => ({ kind: 'spike', col: t('#5a48a8'), col2: t('#b79ae8'), stem: t('#3f6a35') }), { ppu: 44 });
    S.tuftFar = v(3, 'ice-tfar', 0.5, 0.4, P.tuft, () => ({ col: t('#4f7a3a'), tip: t('#93b85a'), n: 8 }), { ppu: 44 });
    S.sheep = v(3, 'ice-sheep', 1, 0.75, (ctx, w, h, r) => { const wool = t(r.pick(['#f4efe4', '#f4efe4', '#5a4a40'])); ctx.fillStyle = t('#2a2422'); for (const x of [0.28, 0.4, 0.6, 0.72]) ctx.fillRect(x * w, h * 0.62, w * 0.05, h * 0.38); ctx.fillStyle = wool; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(w * (0.28 + 0.055 * i), h * (0.42 + 0.06 * Math.sin(i * 2.1)), h * 0.22, 0, TAU); ctx.fill(); } ctx.fillStyle = t('#2a2422'); ctx.beginPath(); ctx.ellipse(w * 0.84, h * 0.38, w * 0.09, h * 0.13, 0.4, 0, TAU); ctx.fill(); }, {}, { ppu: 48 });
    // more of the far country: cloud, houses, a church, a lighthouse, boats, ice afloat, animals
    const dark = (time.stars || 0) > 0.3 || time.dark > 0.25, win = dark ? '#ffd76a' : t('#2c3644');
    S.cirrus = v(4, 'ice-cirrus', 9, 1.1, P.mist, { col: mix('#ffffff', time.haze, 0.3) }, { ax: 0.5, ay: 0.5, ppu: 28 });
    S.church = v(2, 'ice-church', 1.3, 1.5, P.house, () => ({ wall: t('#f6f3ec'), roof: t('#c8483a'), win, spire: true, trim: t('#3a3f4a') }), { ppu: 64 });
    S.farm = v(5, 'ice-farm', 1.2, 0.9, P.house, (r) => ({ wall: t(r.pick(['#f6f3ec', '#ecd9a0', '#c94f43', '#3f72a6'])), roof: t(r.pick(['#c8483a', '#3a3f4a', '#2f6f5a'])), win, trim: t('#3a3f4a') }), { ppu: 64 });
    S.turf = v(3, 'ice-turf', 2.6, 1.8, P.house, () => ({ wall: t('#4a3a30'), turf: t('#6f9a3f'), win, trim: t('#241c1a') }));
    S.light = v(1, 'ice-light', 0.7, 1.8, P.tower, () => ({ col: t('#f2a23a'), band: t('#ffffff'), top: t('#2c3038'), lamp: dark ? '#fff3b0' : t('#dfe8ee') }), { ppu: 64 });
    const coat = (tail) => (r) => { const c = r.pick([['#8a5a3a', '#ecdcb4'], ['#3a2c26', '#1c1614'], ['#c9a268', '#f6ecd4'], ['#74747c', '#ececee']]), g = r.pick([0, 0, 1]); return { col: t(c[0]), dark: t(mix(c[0], '#000000', 0.4)), mane: t(c[1]), neck: 0.55, head: 0.22, tail, graze: g }; };
    S.horse = v(4, 'ice-horse', 1.7, 1.25, P.quad, coat(0.25)); S.horseB = v(4, 'ice-horse', 1.7, 1.25, P.quad, coat(0.9)); S.horseFar = v(3, 'ice-hfar', 1.7, 1.25, P.quad, coat(0.5), { ppu: 48 });
    S.puffin = v(2, 'ice-puffin', 0.42, 0.56, P.puffin, () => ({})); S.puffinB = v(2, 'ice-puffin', 0.42, 0.56, P.puffin, () => ({ blink: true })); S.puffinFar = v(2, 'ice-pfar', 0.42, 0.56, P.puffin, () => ({}), { ppu: 48 });
    S.cairn = v(3, 'ice-cairn', 0.62, 0.9, P.cairn, () => ({ col: t('#4b505d'), lit: t('#9aa0b0') })); S.cairnFar = v(2, 'ice-cfar', 0.62, 0.9, P.cairn, () => ({ col: t('#27333f'), lit: t('#55626e') }), { ppu: 48 });
    S.boat = v(2, 'ice-boat', 1.3, 0.7, P.boat, (r) => ({ hull: t(r.pick(['#c8483a', '#2f6f9a'])), cabin: t('#f4f1ea'), trim: win }), { ppu: 64 });
    S.berg = v(4, 'ice-berg', (r) => r.range(0.5, 1.1), (r) => r.range(0.3, 0.6), P.ice, () => ({ col: t('#e4f6fc'), deep: t('#6fc0e0') }), { ppu: 64 });
    S.stack = v(3, 'ice-stack', (r) => r.range(0.5, 0.9), (r) => r.range(1, 1.8), P.rock, () => ({ col: t.h('#262c34', 0.2), lit: t.h('#4a5564', 0.2) }), { ppu: 48 });
    // near things are dark and out of focus
    const near = t('#0d1118');
    S.foreRock = v(3, 'ice-frock', (r) => r.range(4, 7), (r) => r.range(1.4, 2.4), P.rock, () => ({ col: near, lit: mix(near, time.haze, 0.3) }), { ppu: 30, blur: 1.1 });
    S.foreGrass = v(4, 'ice-fgrass', (r) => r.range(1.6, 2.6), (r) => r.range(1.3, 2.4), (ctx, w, h, r) => { P.tuft(ctx, w, h, r, { col: near, tip: mix(near, time.haze, 0.2), n: 16 }); if (r.chance(0.6)) { ctx.save(); ctx.translate(w * 0.3, 0); P.flower(ctx, w * 0.3, h, r, { kind: 'spike', col: mix('#3a2f70', near, 0.5), col2: mix('#7a62b8', near, 0.4), stem: near }); ctx.restore(); } }, {}, { ppu: 30, blur: 2 });
    // the mouth of a geyser: a low mound of pale sinter, wet and ringed
    S.vent = [sprite(3.2, 0.6, (ctx, w, h) => { for (let i = 0; i < 4; i++) { const k = 1 - i * 0.2; ctx.fillStyle = t(mix('#d9c9a8', '#f4ead2', i / 3)); ctx.beginPath(); ctx.ellipse(w / 2, h, (w / 2) * k, h * (0.5 + i * 0.16), 0, Math.PI, TAU); ctx.fill(); } ctx.fillStyle = t('#3f6f8a'); ctx.beginPath(); ctx.ellipse(w / 2, h * 0.34, w * 0.13, h * 0.1, 0, 0, TAU); ctx.fill(); })];
    // the place the seed will be planted on this level: a ring of stones with small flowers
    S.nest = [sprite(3.4, 0.7, (ctx, w, h) => { const r = new RNG('nest'); for (let i = 0; i < 9; i++) { const x = (i + 0.5) / 9 * w, d = Math.abs(i - 4) / 4; ctx.save(); ctx.translate(x - 0.2, h - 0.3 - (1 - d) * 0.02); P.rock(ctx, 0.4, 0.3, r, { col: t('#5b6070'), lit: t('#a9b0c0'), moss: i % 2 ? t('#8fb53f') : null }); ctx.restore(); } for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(r.range(0.3, w - 0.5), h - 0.36); P.flower(ctx, 0.2, 0.34, r, { kind: 'cup', col: t('#ffd23c'), col2: t('#fff3a8'), stem: t('#5a8a45') }); ctx.restore(); } })];
    return S;
  },
  // a ledge: a slab of basalt with broken columns hanging under it
  slab(w, kind, time) {
    const t = tones(time), r = new RNG('slab' + w + kind), h = 1.5;
    return sprite(w, h, (ctx) => { const n = Math.max(3, Math.round(w / 0.3)), cw = w / n; for (let i = 0; i < n; i++) { const d = Math.sin((i + 0.5) / n * Math.PI), hh = (0.35 + 0.85 * d) * r.range(0.6, 1), g = ctx.createLinearGradient(i * cw, 0, (i + 1) * cw, 0); g.addColorStop(0, t('#59606e')); g.addColorStop(1, t('#2c303a')); ctx.fillStyle = g; ctx.fillRect(i * cw, 0.12, cw + 0.004, hh); }
      ctx.fillStyle = kind === 'ice' ? t('#cfeefa') : t('#7fa63c'); ctx.beginPath(); ctx.roundRect(0, 0, w, 0.2, 0.09); ctx.fill(); ctx.fillStyle = rgba('#ffffff', 0.35); ctx.fillRect(0.05, 0.02, w - 0.1, 0.035); }, { ax: 0.5, ay: 0 });
  },
};
