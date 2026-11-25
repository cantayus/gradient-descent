// What every world's theme needs and would otherwise write out again: toning colours to the hour, and the stock of small pictures that only differ by palette
// (cloud, high cloud, smoke, mist, loose stones, the dark shapes near the lens, the ring of stones where the seed is planted).
import { RNG } from '../../core/rng.js';
import { P, variants, sprite, mix } from '../paint.js';

export function tones(time) { const t = (hex) => mix(hex, time.shade, time.dark); t.h = (hex, k) => mix(mix(hex, time.shade, time.dark), time.haze, k); return t; }
export const lamps = (time) => (time.stars || 0) > 0.3 || time.dark > 0.2;

// pal: { rock: [colours], rockLit, stone: [col, lit], near, nearBloom: [col, col2] | null, cloudUnder, nestBloom: { kind, col, col2 } }
export function stock(time, tag, pal) {
  const t = tones(time), S = {}, v = variants;
  S.cloud = v(5, tag + 'cloud', (r) => r.range(3.4, 6), (r) => r.range(1, 1.5), P.cloud, { col: mix('#ffffff', time.haze, 0.2), under: mix(mix(pal.cloudUnder || '#b8c4d8', time.shade, time.dark * 0.6), time.haze, 0.45) }, { ax: 0.5, ay: 0.5, ppu: 64, blur: 0.8 });
  S.cirrus = v(4, tag + 'cirrus', 9, 1.1, P.mist, { col: mix('#ffffff', time.haze, 0.3) }, { ax: 0.5, ay: 0.5, ppu: 28 });
  S.cloudlet = v(3, tag + 'smoke', 2.2, 1.2, P.mist, { col: '#ffffff' }, { ax: 0.5, ay: 1, ppu: 40 });
  S.mist = v(3, tag + 'mist', 12, 2, P.mist, { col: mix('#ffffff', time.haze, 0.4) }, { ax: 0.5, ay: 0.5, ppu: 24 });
  const rk = (r) => ({ col: t(r.pick(pal.rock)), lit: t(pal.rockLit) });
  S.rock = v(6, tag + 'rock', (r) => r.range(0.4, 0.9), (r) => r.range(0.25, 0.5), P.rock, rk);
  S.rockBig = v(5, tag + 'rockb', (r) => r.range(1.8, 3.4), (r) => r.range(1, 2.1), P.rock, rk);
  S.pebble = v(5, tag + 'peb', (r) => r.range(0.12, 0.26), (r) => r.range(0.07, 0.13), P.rock, rk);
  S.rockFar = v(4, tag + 'rfar', (r) => r.range(0.9, 2), (r) => r.range(0.5, 1), P.rock, (r) => ({ col: t.h(r.pick(pal.rock), 0.1), lit: t.h(pal.rockLit, 0.1) }), { ppu: 44 });
  S.stone = v(4, tag + 'stone', (r) => r.range(0.3, 0.8), (r) => r.range(0.2, 0.45), P.rock, () => ({ col: t(pal.stone[0]), lit: t(pal.stone[1]) }));
  const near = t(pal.near);
  S.foreRock = v(3, tag + 'frock', (r) => r.range(4, 7), (r) => r.range(1.4, 2.4), P.rock, () => ({ col: near, lit: mix(near, time.haze, 0.3) }), { ppu: 30, blur: 1.1 });
  S.foreGrass = v(4, tag + 'fgrass', (r) => r.range(1.6, 2.6), (r) => r.range(1.3, 2.4), (ctx, w, h, r) => { P.tuft(ctx, w, h, r, { col: near, tip: mix(near, time.haze, 0.25), n: 16 }); if (pal.nearBloom && r.chance(0.6)) { ctx.save(); ctx.translate(w * 0.35, h * 0.2); P.flower(ctx, w * 0.3, h * 0.8, r, { kind: pal.nearBloom[2] || 'cup', col: mix(pal.nearBloom[0], near, 0.55), col2: mix(pal.nearBloom[1], near, 0.5), stem: near }); ctx.restore(); } }, {}, { ppu: 30, blur: 1 });
  S.nest = [sprite(3.4, 0.7, (ctx, w, h) => { const r = new RNG(tag + 'nest'); for (let i = 0; i < 9; i++) { const x = ((i + 0.5) / 9) * w; ctx.save(); ctx.translate(x - 0.2, h - 0.3); P.rock(ctx, 0.4, 0.3, r, { col: t(pal.rock[0]), lit: t(pal.rockLit) }); ctx.restore(); if (i % 2 && pal.nestBloom) { ctx.save(); ctx.translate(x - 0.1, h - 0.6); P.flower(ctx, 0.2, 0.36, r, { kind: pal.nestBloom.kind, col: t(pal.nestBloom.col), col2: t(pal.nestBloom.col2), stem: t('#5a8a45') }); ctx.restore(); } } })];
  return S;
}
