// One run of one level: the body, the rig, the camera, the clock, the ghost, and everything that happens along the way.
import { Body, advance, step, turbo, R, STEP } from './physics.js';
import { build } from './level.js';
import { Rig, POSE, WEAR } from './theta.js';
import { Scene } from '../art/scene.js';
import { clamp, lerp, smooth, sprite, P } from '../art/paint.js';
import { RNG } from '../core/rng.js';
import { drawTheta } from './theta.js';
import { Geyser } from './boss.js';
import { Rides } from './ride.js';
import { tides } from './tide.js';

export class Camera {
  constructor(x, y) { this.x = x; this.y = y; this.vh = 11.6; this.vw = 22; this.lx = 3; this.ly = 0.9; }
  update(b, dt, aspect, snap = false, wide = false) {
    const ease = (k) => 1 - Math.exp(-k * dt);
    // wide: true for the long look at a level before the first step, 'close' for the opening scene, otherwise the picture opens out as the hero speeds up
    const sp = b.speed(), vh = (wide === 'close' ? 8.6 : wide ? 20 : lerp(11.6, 19, smooth(clamp((sp - 9) / 22, 0, 1)))) * (aspect < 1 ? 1.3 : 1);
    if (snap && wide) this.vh = vh;
    this.vh += (vh - this.vh) * ease(1.4); this.vw = this.vh * aspect;
    // look where the hero is going, and a little below, since the way is down
    this.lx += (clamp(b.vx * 0.42, -7, 9) + b.face * 1.6 - this.lx) * ease(2.2);
    this.ly += (clamp(b.vy * 0.2, -5.5, 2.5) + 0.9 - this.ly) * ease(2.6);
    const tx = b.x + this.lx * Math.min(1, this.vw / 26), ty = b.y + this.ly + this.vh * 0.11;      // the hero rides below the middle of the picture: more country, less cut earth
    if (snap) { this.x = tx; this.y = ty; } else { this.x += (tx - this.x) * ease(7); this.y += (ty - this.y) * ease(6); }
    // never lose the hero. Near the edge of the middle of the picture the camera is drawn after them, harder the further out they get; past that it simply cannot go
    const pull = (v, lo, hi) => v < lo ? v + (lo - v) * ease(16) : v > hi ? v + (hi - v) * ease(16) : v;
    this.x = pull(this.x, b.x - this.vw * 0.3, b.x + this.vw * 0.3); this.y = pull(this.y, b.y - this.vh * 0.2, b.y + this.vh * 0.3);
    this.x = clamp(this.x, b.x - this.vw * 0.4, b.x + this.vw * 0.4); this.y = clamp(this.y, b.y - this.vh * 0.3, b.y + this.vh * 0.38);
  }
}

// Eta, the firefly: the learning rate. Eta flies ahead of Theta, further and brighter the faster the going.
class Eta {
  constructor(x, y) { this.x = x; this.y = y; this.glow = 0.6; this.hold = null; }
  update(b, dt, t) { if (this.hold) { this.x = this.hold.x; this.y = this.hold.y; this.glow += (1.5 + Math.sin(t * 31) * 0.25 - this.glow) * Math.min(1, dt * 10); return; } const sp = b.speed(), ahead = 1.3 + clamp(sp * 0.16, 0, 4.2), tx = b.x + b.face * ahead + Math.sin(t * 2.3) * 0.25, ty = b.y + 1.05 + Math.sin(t * 3.1) * 0.22 + clamp(b.vy * 0.06, -0.8, 0.8); this.x += (tx - this.x) * Math.min(1, dt * 5); this.y += (ty - this.y) * Math.min(1, dt * 5); this.glow += (0.55 + clamp(sp / 22, 0, 1) * 0.7 - this.glow) * Math.min(1, dt * 3); }
  draw(ctx, t, fx) {
    if (this.hold && this.hold.rope) { const h = this.hold, dx = h.hx - this.x, dy = -(h.hy - this.y); ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter'; for (const [w, a] of [[0.16, 0.16], [0.07, 0.5], [0.028, 1]]) { ctx.strokeStyle = h.gold ? `rgba(255,236,170,${a})` : `rgba(255,205,96,${a})`; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dx, dy); ctx.stroke(); } ctx.restore(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, this.glow); const s = 1.5 + this.glow * 1.4 + Math.sin(t * 9) * 0.08; ctx.drawImage(fx.c, -s / 2, -s / 2, s, s); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; const w = Math.sin(t * (this.hold ? 70 : 38)) * 0.5; ctx.beginPath(); ctx.ellipse(-0.05, -0.05, 0.09, 0.04 + 0.03 * w, -0.6, 0, 7); ctx.ellipse(0.05, -0.05, 0.09, 0.04 - 0.03 * w, 0.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a3a20'; ctx.beginPath(); ctx.ellipse(0, 0, 0.045, 0.075, 0.3, 0, 7); ctx.fill(); ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(0.012, 0.045, 0.045, 0, 7); ctx.fill(); }
}

// Mu, the bird: momentum. Mu rides the air behind Theta, close when the going is slow and strung far out behind, wings set, when it is fast.
class Mu {
  constructor(x, y) { this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.glide = 0; this.dir = 1; this.lift = 0; }
  update(b, dt, t, wind) {
    // the lift: Mu is on Theta's head, beating hard, for as long as it lasts
    if (this.lift > 0) { this.lift -= dt; const k = 1 - Math.exp(-dt * 30); this.x += (b.x - this.x) * k; this.y += (b.y + 0.78 - this.y) * k; this.vx = b.vx; this.vy = b.vy; this.glide = 0; if (Math.abs(b.vx) > 0.5) this.dir = b.vx > 0 ? 1 : -1; return; }
    const sp = b.speed(), back = 1.1 + clamp(sp * 0.13, 0, 3.4), tx = b.x - b.face * back + Math.sin(t * 1.7) * 0.2, ty = b.y + 1.5 + clamp(sp * 0.04, 0, 0.8) + Math.sin(t * 2.6) * 0.18, k = 1 - Math.exp(-dt * 3.2);
    // Mu has weight: it does not turn the moment Theta does, it swings wide and comes round
    this.vx += ((tx - this.x) * 9 - this.vx * 4.2) * dt; this.vy += ((ty - this.y) * 9 - this.vy * 4.2) * dt; this.x += (this.vx + wind * 0.2) * dt; this.y += this.vy * dt; this.x += (tx - this.x) * k * 0.15; this.y += (ty - this.y) * k * 0.15;
    this.glide += (clamp((sp - 8) / 8, 0, 1) - this.glide) * (1 - Math.exp(-dt * 4)); if (Math.abs(b.vx) > 0.5) this.dir = b.vx > 0 ? 1 : -1; }
  draw(ctx, t) { const g = this.glide, f = this.lift > 0 ? Math.sin(t * 46) * 1.15 : Math.sin(t * 17) * (1 - g) * 0.9 - g * 0.25; ctx.scale(this.dir, 1); ctx.rotate(clamp(-this.vy * 0.05, -0.5, 0.5));
    ctx.fillStyle = '#e8785a'; ctx.beginPath(); ctx.moveTo(-0.3, 0.02); ctx.lineTo(-0.52, -0.1); ctx.lineTo(-0.44, 0.03); ctx.lineTo(-0.52, 0.14); ctx.closePath(); ctx.fill();           // the forked tail
    for (const s of [0.55, 1]) { ctx.fillStyle = s < 1 ? '#c9583f' : '#f08c68'; ctx.beginPath(); ctx.moveTo(-0.08, 0); ctx.quadraticCurveTo(-0.12, -0.34 * f * s - 0.06, -0.3 - g * 0.12, -0.5 * f * s - 0.03); ctx.quadraticCurveTo(0.0, -0.2 * f * s, 0.14, 0); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#f6a27e'; ctx.beginPath(); ctx.ellipse(0, 0.02, 0.24, 0.13, -0.1, 0, 7); ctx.fill(); ctx.fillStyle = '#fff3e4'; ctx.beginPath(); ctx.ellipse(0.04, 0.07, 0.15, 0.07, -0.1, 0, 7); ctx.fill();
    ctx.fillStyle = '#f08c68'; ctx.beginPath(); ctx.arc(0.2, -0.05, 0.105, 0, 7); ctx.fill(); ctx.fillStyle = '#ffc23d'; ctx.beginPath(); ctx.moveTo(0.29, -0.08); ctx.lineTo(0.42, -0.04); ctx.lineTo(0.29, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#23434d'; ctx.beginPath(); ctx.arc(0.23, -0.07, 0.026, 0, 7); ctx.fill(); }
}

export class Play {
  // The rules. A level is won by bringing the seed to the lowest valley. It is lost if the seed's lights all go out (each fall puts one out, and so does
  // being thrown by the Geyser), or if its light fades before the valley is reached (the time limit). A lost level starts again from the top.
  constructor({ spec, theme, can = {}, ghost = null, hooks = {}, cine = false, intro = false, ending = false, meet = false, travel = null, lights = 3, limit = Infinity }) {
    this.lights = this.lightsAll = lights; this.limit = limit; this.failed = null;
    // Sparks: Eta's gift. One to begin with, another for every five seeds, three at most. A spark is a turbo when asked for, and a rescue when Theta falls with one in hand.
    this.sparks = 1; this.sparksAll = 3; this.turboT = 0; this.turboCd = 0;
    this.cine = cine; this.intro = intro ? { t: 0, stage: 0 } : null; this.seedGlow = intro ? 0 : 1; this.etaIn = intro ? 0 : 1; this.star = null; this.spec = spec; this.theme = theme; this.level = build(spec, { mu: !!can.mu }); if (cine) this.level.items = []; this.stamp = false; this.T = this.level.T; this.hooks = hooks;
    this.scene = new Scene(theme, this.level, spec.time || 'day');
    this.b = new Body(this.level.start.x, this.level.start.y + R); Object.assign(this.b.can, { slide: true, roll: true, spread: true }, can); this.b.grounded = true;
    this.rig = new Rig(); this.cam = new Camera(this.b.x, this.b.y); this.eta = new Eta(this.b.x, this.b.y + 1);
    this.acc = 0; this.t = 0; this.clock = 0; this.started = false; this.done = false; this.dead = 0; this.falls = 0; this.seeds = 0;
    this.curve = []; this.rec = []; this.recT = 0; this.curT = 0; this.ghostData = ghost; this.ghost = ghost ? { b: { x: 0, y: 0, r: R }, pose: POSE() } : null;
    this.check = this.level.checks[0]; this.trailT = 0; this.maxSpeed = 0;
    this.view = { x: this.b.x, y: this.b.y, r: R, vx: 0, vy: 0, face: 1, speed: () => this.b.speed() };      // the body as drawn: between the last two physics steps
    this.flyers = [{ x: 0, y: 0, draw: (ctx, t) => { if (this.etaIn > 0.02) { ctx.scale(this.etaIn, this.etaIn); this.eta.draw(ctx, t, this.scene.fx.warm); } } },
      { x: 0, y: 0, draw: (ctx, t) => { if (!this.star) return; const fx = this.scene.fx.warm, s = 2.2 + Math.sin(t * 7) * 0.25; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(fx.c, -s / 2, -s / 2, s, s); ctx.restore(); ctx.rotate(Math.sin(t * 2) * 0.2); ctx.fillStyle = '#fff3b8'; ctx.strokeStyle = '#c9861a'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(0, -0.2); ctx.bezierCurveTo(0.16, -0.06, 0.13, 0.15, 0, 0.17); ctx.bezierCurveTo(-0.13, 0.15, -0.16, -0.06, 0, -0.2); ctx.fill(); ctx.stroke(); } }];
    if (can.mu) { this.mu = new Mu(this.b.x - 1.5, this.b.y + 1.5); this.muF = { x: this.b.x - 1.5, y: this.b.y + 1.5, draw: (ctx, t) => this.mu.draw(ctx, t) }; this.flyers.push(this.muF); }
    // the old kākāpō who knows the path by heart: it is waiting at the same place in every verse of it
    this.critters = this.level.marks.filter((k) => k.kind === 'memo').map((k) => ({ x: k.x, y: this.T.h(k.x), s: 'elder', size: 1, memo: true, ask: k.text === 'q' }));
    // when the path he knew has gone and Theta has got through anyway, he is not beaten. He is curious, and he comes along to see.
    if (this.critters.length) { const last = this.critters[this.critters.length - 1]; this.follower = { x: last.x, y: last.y, s: 'elder', size: 1, from: last.x, hide: true }; this.critters.push(this.follower); }
    // the end of the story: the seed set down in the moss, and what comes of it
    if (ending) { const b = this.b; b.x = b.px = 14 + 14 + 11.5; b.y = b.py = this.T.h(b.x) + R; this.end = { t: 0, x: b.x + 1.9 }; this.end.y = this.T.h(this.end.x);
      const E = this.end, rr = (n) => { const v = Math.sin(n * 91.7) * 43758.5; return v - Math.floor(v); }, leafs = Array.from({ length: 34 }, (_, i) => { const a = rr(i) * 6.283, d = Math.sqrt(rr(i + 50)); return [Math.cos(a) * d * 2.3, -Math.abs(Math.sin(a)) * d * 1.7 - 0.2 + rr(i + 9) * 0.5, 0.6 + rr(i + 20) * 0.5, rr(i + 30)]; }).sort((p, q) => q[1] - p[1]);
      const lights = Array.from({ length: 9 }, (_, i) => [(rr(i + 70) - 0.5) * 3.6, -rr(i + 80) * 1.4 + 0.5, rr(i + 90) * 6]);
      // the seed, the sapling, and then the tree: every stage is the same plant, grown
      this.flyers.push({ x: E.x, y: E.y, draw: (ctx, t) => { const g = smooth(clamp((E.t - 3) / 13, 0, 1)), g2 = smooth(clamp((E.t - 15) / 22, 0, 1)), fx = this.scene.fx.warm, hgt = 1.9 * g + 3.1 * g2, top = -hgt - 0.12;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const s = 1.6 + 6.5 * g + 7 * g2 + 0.3 * Math.sin(t * 2); ctx.globalAlpha = clamp(E.t / 3, 0, 1); ctx.drawImage(fx.c, -s / 2, top * (1 - 0.25 * g2) - s / 2, s, s); ctx.restore();
        // the stem thickens into a trunk
        const tw = 0.03 + 0.03 * g + 0.2 * g2; ctx.fillStyle = g2 > 0.05 ? '#8a6a4a' : '#7fc850'; ctx.beginPath(); ctx.moveTo(-tw * 1.9, 0.12); ctx.quadraticCurveTo(-tw, top * 0.4, -tw * 0.45 + 0.1 * Math.sin(t * 0.7) * g * (1 - g2), top + 0.1); ctx.lineTo(tw * 0.45 + 0.1 * Math.sin(t * 0.7) * g * (1 - g2), top + 0.1); ctx.quadraticCurveTo(tw, top * 0.4, tw * 1.9, 0.12); ctx.closePath(); ctx.fill();
        if (g2 > 0.05) { ctx.strokeStyle = 'rgba(60,40,30,0.35)'; ctx.lineWidth = 0.02; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * tw * 0.8, 0.05); ctx.quadraticCurveTo(i * tw * 0.5, top * 0.5, i * tw * 0.25, top * 0.9); ctx.stroke(); } }
        // the first leaves, in pairs up the stem, while it is a sapling
        if (g2 < 1) for (let i = 0; i < 5; i++) { const u = clamp((g - 0.1 - i * 0.16) / 0.2, 0, 1) * (1 - g2); if (u <= 0) continue; const y = top * (0.22 + i * 0.17); for (const sd of [-1, 1]) { ctx.save(); ctx.translate(0, y); ctx.rotate(sd * (1 - 0.14 * Math.sin(t * 1.3 + i + sd))); ctx.scale(u * (1 - i * 0.1), u * (1 - i * 0.1)); ctx.fillStyle = (i + (sd > 0 ? 1 : 0)) % 2 ? '#b8f060' : '#7fc850'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0.17, -0.22, 0, -0.56); ctx.quadraticCurveTo(-0.17, -0.22, 0, 0); ctx.fill(); ctx.restore(); } }
        // the crown: it fills from the trunk outward, and every part of it moves a little in the air
        if (g2 > 0) { ctx.save(); ctx.translate(0, top + 0.5); leafs.forEach(([lx, ly, ls, lr], i) => { const u = clamp(g2 * 1.5 - Math.hypot(lx, ly) * 0.22 - lr * 0.2, 0, 1); if (u <= 0) return; const sw = Math.sin(t * 0.9 + i) * 0.05; ctx.fillStyle = ['#3f8a3c', '#5fa848', '#7fc850', '#a8e060'][(i + (ly < -0.9 ? 2 : 0)) % 4]; ctx.beginPath(); ctx.ellipse(lx * g2 + sw, ly * g2, 0.75 * ls * u, 0.5 * ls * u, lx * 0.1, 0, 7); ctx.fill(); });
          ctx.globalCompositeOperation = 'lighter'; for (const [lx, ly, ph] of lights) { const u = clamp((g2 - 0.55) / 0.3, 0, 1); if (u <= 0) continue; const ss = (0.9 + 0.25 * Math.sin(t * 2.2 + ph)) * u; ctx.drawImage(fx.c, lx - ss / 2, ly - ss / 2, ss, ss); ctx.fillStyle = 'rgba(255,243,184,0.95)'; ctx.beginPath(); ctx.ellipse(lx, ly, 0.07 * u, 0.1 * u, 0, 0, 7); ctx.fill(); } ctx.restore(); }
        // the seed of light itself, at the growing tip until the crown closes over it
        if (g2 < 0.5) { ctx.translate(0, top); ctx.rotate(Math.sin(t * 1.4) * 0.15); ctx.globalAlpha = 1 - g2 * 2; ctx.fillStyle = '#fff3b8'; ctx.strokeStyle = '#c9861a'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(0, -0.2); ctx.bezierCurveTo(0.16, -0.06, 0.13, 0.15, 0, 0.17); ctx.bezierCurveTo(-0.13, 0.15, -0.16, -0.06, 0, -0.2); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; } } });
      // the animals of the seven countries come to see: each one steps out of the trees in its turn
      for (const gst of ending.guests || []) { const gx = E.x + gst.dx; this.critters.push({ sp: gst.sp, s: gst.s, x: gx, x1: gx, x0: gx + Math.sign(gst.dx) * 3, y: this.T.h(gx) + (gst.up || 0), up: gst.up || 0, size: gst.size || 1, flip: gst.dx > 0, a: 0, at: gst.t, guest: true }); } }
    // the meeting with Mu, once, at the start of Cappadocia: she comes down out of the sky in a long spiral and takes her place
    if (meet && this.mu) { this.meet = { t: 0 }; this.mu.x = this.b.x + 12; this.mu.y = this.b.y + 9; }
    // the way from one country to the next: by balloon, on a current of air, or on the back of a bird
    if (travel) { const V = this.trav = { t: 0, kind: travel.kind, dark: !!travel.dark }, rider = (ctx, t, o = {}) => { ctx.save(); ctx.translate(0, -0.46 * 0.85); ctx.scale(0.85, 0.85); drawTheta(ctx, { ...POSE(), turn: 0.7, expr: 'joy', seed: 0.8, t, ...o }); ctx.restore(); };
      if (V.kind === 'balloon') V.spr = sprite(3.4, 4.2, (ctx) => P.balloon(ctx, 3.4, 4.2, new RNG('travel'), { cols: ['#e8503a', '#f6e7c4'], n: 1 }), { ax: 0.5, ay: 1 });
      this.travF = { x: this.b.x - 15, y: this.b.y + 8, draw: (ctx, t) => { const on = !V.done;
        if (V.kind === 'balloon') { ctx.rotate(Math.sin(t * 0.9) * 0.04); ctx.drawImage(V.spr.c, -V.spr.ox, -V.spr.oy - 1.5, V.spr.w, V.spr.h); ctx.strokeStyle = 'rgba(70,50,36,0.9)'; ctx.lineWidth = 0.035; ctx.beginPath(); for (const sx of [-0.5, -0.17, 0.17, 0.5]) { ctx.moveTo(sx, -0.75); ctx.lineTo(sx * 0.7, -1.75); } ctx.stroke();
          if (on) rider(ctx, t); const g = ctx.createLinearGradient(0, -0.8, 0, 0.1); g.addColorStop(0, '#9a7448'); g.addColorStop(1, '#6a4a30'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-0.62, -0.62, 1.24, 0.72, 0.1); ctx.fill(); ctx.fillStyle = '#b8905c'; ctx.fillRect(-0.67, -0.68, 1.34, 0.1); }
        else if (V.kind === 'bird') { const f = Math.sin(t * 4.2), body = V.dark ? '#24242c' : '#f4f2ec', wing = V.dark ? '#16161c' : '#8a94a4'; ctx.rotate(-0.06 + Math.sin(t * 1.1) * 0.03);
          ctx.fillStyle = wing; ctx.beginPath(); ctx.moveTo(-0.3, -0.2); ctx.quadraticCurveTo(-1.2, -1.2 * f - 0.5, -2.9, -1.5 * f - 0.2); ctx.quadraticCurveTo(-1.3, -0.5 * f + 0.1, 0.5, -0.1); ctx.closePath(); ctx.fill();
          ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, 1.25, 0.42, -0.05, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-1.1, -0.05); ctx.lineTo(-1.9, 0.14); ctx.lineTo(-1.1, 0.24); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.ellipse(1.28, -0.2, 0.32, 0.25, 0, 0, 7); ctx.fill(); if (V.dark) { ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(1.02, -0.08, 0.14, 0.26, 0.3, 0, 7); ctx.fill(); }
          ctx.fillStyle = V.dark ? '#c8b8a0' : '#f0b83c'; ctx.beginPath(); ctx.moveTo(1.52, -0.26); ctx.lineTo(1.98, -0.1); ctx.lineTo(1.52, -0.06); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#14313a'; ctx.beginPath(); ctx.arc(1.38, -0.26, 0.045, 0, 7); ctx.fill();
          if (on) { ctx.save(); ctx.translate(-0.1, -0.36); rider(ctx, t); ctx.restore(); }
          ctx.fillStyle = V.dark ? '#2c2c36' : '#b4bcc8'; ctx.beginPath(); ctx.moveTo(-0.4, 0); ctx.quadraticCurveTo(0.3, 1.3 * f + 0.5, 2.3, 1.6 * f + 0.4); ctx.quadraticCurveTo(0.8, 0.5 * f, 0.6, 0); ctx.closePath(); ctx.fill(); }
        else { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { const yy = -0.5 + i * 0.42, ph = t * 2.4 + i * 1.7; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(-4.4 - (ph % 1.5), yy + Math.sin(ph) * 0.2); ctx.bezierCurveTo(-3, yy - 0.5, -1.8, yy + 0.5, -0.5 - (ph % 1.5) * 0.3, yy + Math.sin(ph + 1) * 0.15); ctx.stroke(); }
          if (on) { ctx.rotate(0.2 + Math.sin(t * 1.6) * 0.08); rider(ctx, t, { spread: 1, air: -0.4, turn: 0.9 }); } } } }; this.flyers.push(this.travF); }
    this.rides = new Rides(this.level, this.T); if (this.rides.list.length) this.scene.rides = this.rides.list;
    // one weather for the picture and the physics
    this.weather = this.scene.wx; this.scene.own = false; this.T.air = (t) => this.weather.windAt(t);
    if (spec.boss === 'geyser' || spec.boss === 'doves') { this.boss = new Geyser(this.level, this.T, spec.boss); this.scene.overlay = (ctx, x0, x1) => this.boss.draw(ctx, x0, x1, this.t, this.scene.time.hot); }
    if (cine) { this.rig.awake = true; this._cine(0); const tm = this.scene.time; { if (tm.sun && !tm.stars) { tm.sun = { ...tm.sun, x: 0.705, y: 0.235 }; tm.bloom = 0.4; tm.shafts = (tm.shafts || 0.05) * 0.7; } this.scene.drop = 0.075; } }      // on the title the sun stands over the valley the hero is looking into else this.cam.update(this.b, 0.016, 16 / 9, true, intro ? 'close' : true);      // the opening scene is watched from close by; the long look comes when it ends
  }
  // The opening, shown once: Theta asleep on the ledge, a seed of light falling out of the dawn, the waking, the finding, and Eta rising out of the glow.
  // Nothing is said. Any key skips it. It returns the input the hero is given while it runs.
  _intro(dt, inp) {
    const I = this.intro, b = this.b, T = this.T, sc = this.scene, out = { move: 0, jump: false, jumpNow: false, tuck: false }; I.t += dt; const t = I.t, say = (what) => this.hooks.event?.('intro', b, what);
    if (!I.sx) { I.sx = b.x + 2.8; I.sy = T.h(I.sx) + 0.3; }
    if (t > 0.8 && (inp.move || inp.jump || inp.tuck || inp.jumpNow)) I.skip = true;
    if (I.skip) { this.seedGlow = 1; this.etaIn = 1; this.star = null; this.intro = null; this.rig.p.lid = 0; this.rig.idle = 0; say('end'); return out; }
    if (t < 3.4) { this.rig.idle = 20; this.rig.p.lid = 1; }
    if (t > 1.1 && I.stage === 0) { I.stage = 1; this.star = { x: I.sx + 9, y: I.sy + 11, land: false }; say('fall'); }
    if (this.star && !this.star.land) { const u = clamp((t - 1.1) / 1.8, 0, 1); this.star.x = I.sx + 9 * (1 - u); this.star.y = I.sy + 11 * (1 - u) * (1 - u * 0.35) / 1; if (Math.random() < 0.8) sc.emit('spark', this.star.x, this.star.y, 1, { speed: 0.6, spread: 6.3, life: 0.7, size: 0.09, g: 1.5 });
      if (u >= 1) { this.star.land = true; this.star.x = I.sx; this.star.y = I.sy; sc.emit('spark', I.sx, I.sy, 22, { speed: 4, spread: 3, life: 0.9, size: 0.12, g: 6 }); sc.flash = 0.22; say('land'); } }
    if (t > 3.4 && I.stage === 1) { I.stage = 2; this.rig.idle = 0; this.rig.p.lid = 0; this.rig.feel('wow', 1.1); this.rig.sq.kick(6); say('wake'); }
    if (t > 4.6 && I.stage === 2) { if (b.x < I.sx - 0.7) out.move = 1; else { I.stage = 3; I.t3 = t; this.star = null; sc.emit('spark', b.x + 0.4, b.y, 30, { speed: 5, spread: 6.3, life: 1, size: 0.13, g: 4 }); this.rig.feel('glee', 2); this.rig.sq.kick(5.5); this.eta.x = b.x; this.eta.y = b.y; say('take'); } }
    if (I.stage === 3) { this.seedGlow = clamp((t - I.t3) / 0.8, 0, 1); this.etaIn = smooth(clamp((t - I.t3 - 0.6) / 0.8, 0, 1)); if (t - I.t3 > 2.6) { this.intro = null; say('end'); } }
    return out;
  }
  // the title's camera: a wide, slow look across the country, the hero small in one corner of it
  _ending(dt) { const e = this.end, sc = this.scene, c = this.cam, a = (this.W || 16) / (this.H || 9); e.t += dt; this.seedGlow = clamp(1 - e.t / 2.5, 0, 1); this.b.face = 1;
    if (e.t > 3 && Math.random() < dt * (3 + 9 * clamp((e.t - 3) / 16, 0, 1))) sc.emit('spark', e.x + (Math.random() - 0.5) * 1.6, e.y + 0.3 + Math.random() * 1.6, 1, { speed: 0.7, dir: Math.PI / 2, spread: 0.8, life: 2.2, size: 0.09, g: -0.5 });
    if (!e.a && e.t > 2.6) { e.a = 1; this.rig.feel('wow', 2.4); this.rig.sq.kick(4); } if (e.a === 1 && e.t > 8) { e.a = 2; this.rig.feel('proud', 6); } if (e.a === 2 && e.t > 16) { e.a = 3; this.rig.feel('joy', 300); this.rig.sq.kick(5); }
    // the picture begins close on the two of them and draws slowly back until the trees are in it
    const k = smooth(clamp(e.t / 34, 0, 1)); c.vh = (8.2 + 9.3 * k) * (a < 1 ? 1.35 : 1); c.vw = c.vh * a; c.x = this.b.x + 0.9 + c.vw * 0.05 * k; c.y = this.b.y - c.vh * (0.12 - 0.2 * k); }
  _cine(dt) { const c = this.cam, b = this.view || this.b, a = (this.W || 16) / (this.H || 9), t = this.t; c.vh = (16.5 + Math.sin(t * 0.05) * 0.6) * (a < 1 ? 1.35 : 1); c.vw = c.vh * a; c.x = b.x + c.vw * 0.21 + Math.sin(t * 0.06) * 1.8; c.y = b.y + c.vh * 0.25 + Math.sin(t * 0.045) * 0.3; }
  resize(W, H) { this.W = W; this.H = H; this.scene.resize(W, H); }

  update(dt, inp) {
    const b = this.b, sc = this.scene; this.t += dt;
    if (this.intro) inp = this._intro(dt, inp);
    if (this.meet) { const M = this.meet; M.t += dt; const u = clamp(M.t / 3.4, 0, 1), e = smooth(u), ang = (1 - e) * 8, rad = (1 - e) * 9; M.x = b.x - e * 1.1 + Math.cos(ang) * rad; M.y = b.y + 1.5 + Math.sin(ang) * rad * 0.4 + (1 - e) * 5;
      if (!M.a && M.t > 0.8) { M.a = 1; this.rig.feel('wow', 1.8); this.hooks.event?.('meet', b, 'see'); }
      if (M.t > 3.4 || (M.t > 1 && (inp.move || inp.jumpNow || inp.tuck))) { this.meet = null; this.rig.feel('joy', 1.8); this.rig.sq.kick(4.5); this.mu.lift = 0.5; this.hooks.event?.('meet', b, 'end'); } else inp = { move: 0, jump: false, jumpNow: false, tuck: false, turboNow: false }; }
    if (this.trav) { const V = this.trav, F = this.travF; V.t += dt; const u = clamp(V.t / 11, 0, 1), e = smooth(u);
      if (!V.done) { F.x = b.x - 16 * (1 - e) - (V.kind === 'balloon' ? 0 : 0.2); F.y = b.y - R + (V.kind === 'balloon' ? 0.15 : 0.5) + 9 * Math.pow(1 - e, 1.4) + Math.sin(this.t * 1.3) * 0.25 * (1 - e); if (u >= 1) { V.done = true; V.t1 = V.t; this.rig.feel('joy', 2.2); this.rig.sq.kick(5); sc.emit('dust', b.x, b.y - R, 10, { speed: 2.2, spread: 3.1, dir: Math.PI / 2, life: 0.5, size: 0.13, col: '#ffffff', g: 2 }); this.hooks.event?.('land', b); } }
      else { const k = V.t - V.t1; F.x += dt * (1.2 + k * 1.5); F.y += dt * (0.6 + k * 1.2); } }
    this.turboT = Math.max(0, this.turboT - dt); this.turboCd = Math.max(0, this.turboCd - dt);
    if (inp.turboNow && !this.cine && !this.intro && !this.done && !this.failed && this.dead <= 0 && !this.rides.on && this.sparks > 0 && this.turboCd <= 0 && turbo(b)) {
      this.sparks--; this.turboT = 0.8; this.turboCd = 0.45; if (!this.started) { this.started = true; this.hooks.start?.(); } this.rig.feel('glee', 0.9); this.rig.sq.kick(4); this.eta.glow = 1.8; this.scene.flash = Math.max(this.scene.flash, 0.16);
      for (let i = 0; i < 3; i++) this.scene.emit('spark', b.x - b.face * 0.3, b.y, 8, { speed: 6, dir: b.face > 0 ? Math.PI : 0, spread: 1.4, life: 0.6, size: 0.12, g: 3 }); this.hooks.event?.('turbo', b); }
    if (!this.started && !this.cine && !this.intro && (inp.move || inp.jump || inp.tuck)) { this.started = true; this.hooks.start?.(); }
    this.weather.set(b.t + (this.cine ? this.t : 0), dt); this.rig.wind = this.weather.wind; this.rig.rain = this.weather.rain * (1 - this.scene.coldNow);
    if (this.resc) this._rescue(dt);
    else if (this.dead > 0) { this.dead -= dt; if (this.dead <= 0) this._respawn(); }
    else if (!this.done && !this.failed) {
      if (this.rides.on || this.rides.list.length) { // a balloon carries the hero step by step in place of the ordinary physics
        this.acc += Math.min(dt, 0.1); while (this.acc >= STEP) { b.px = b.x; b.py = b.y; if (this.rides.step(b, STEP)) { b.events.length = 0; } else step(b, this.T, inp, STEP); for (const e of this.rides.events) { this.hooks.event?.(e, b); if (e === 'lift') this.rig.feel('wow', 1.4); else this.rig.feel('joy', 1.5); } this._onStep(); inp.jumpNow = false; this.acc -= STEP; } b.mix = this.acc / STEP;
      } else this.acc = advance(b, this.T, inp, this.acc, dt, () => this._onStep());
      if (this.started) this.clock += dt;
      if (this.clock > this.limit) this._fail('time');
    } else { // at the goal the hero is let down gently and the level is over
      this.acc = advance(b, this.T, { move: 0, jump: false, jumpNow: false, tuck: false }, this.acc, dt);
    }
    if (!this.resc && this.rig.falling) this.rig.falling = 0;
    const v = this.view, m = this.dead > 0 || b.px == null ? 1 : b.mix ?? 1; v.x = b.px == null ? b.x : b.px + (b.x - b.px) * m; v.y = b.py == null ? b.y : b.py + (b.y - b.py) * m; v.vx = b.vx; v.vy = b.vy; v.face = b.face; v.fast = clamp((b.speed() - 13) / 14, 0, 1);
    this.scene.pt = b.t - (1 - m) * STEP;      // the physics clock, for everything in the picture that the physics also moves
    const pose = this.rig.update(b, dt, inp);
    pose.seed = (0.7 + 0.3 * clamp((this.level.hi - b.y) / Math.max(1, this.level.hi - this.level.lo), 0, 1)) * this.seedGlow;   // the seed glows warmer the lower Theta gets
    if (this.mu) { this.mu.update(v, dt, this.t, this.weather.wind); if (this.meet && this.meet.x != null) { this.mu.x = this.meet.x; this.mu.y = this.meet.y; this.mu.vx = this.mu.vy = 0; this.mu.glide = 0.5; } const f = this.muF; f.x = this.mu.x; f.y = this.mu.y; }
    this.eta.update(v, dt, this.t); this.flyers[0].x = this.eta.x; this.flyers[0].y = this.eta.y; if (this.star) { this.flyers[1].x = this.star.x; this.flyers[1].y = this.star.y; }
    for (const m of this.critters) { if (m.guest) { const u = smooth(clamp((this.end.t - m.at) / 1.6, 0, 1)); m.a = u; m.x = m.x0 + (m.x1 - m.x0) * u; m.y = this.T.h(m.x) + m.up + (m.up ? Math.sin(this.t * 0.5 + m.x) * 0.3 : Math.abs(Math.sin(u * 9.42)) * 0.25 * (1 - u)); continue; }
      if (!m.memo) continue; const near = Math.abs(m.x - this.b.x) < 7; m.s = near && Math.sin(this.t * 5) > -0.3 ? 'elderB' : 'elder'; m.flip = this.b.x < m.x - 0.5; m.q = m.ask && this.b.x > m.x + 2.5 && this.b.x < m.x + 26; }
    if (this.follower) { const f = this.follower, L = this.level; if (f.hide && this.b.x > f.from + 5) { f.hide = false; const last = this.critters[this.critters.length - 2]; last.hide = true; }
      if (!f.hide) { const want = Math.min(this.b.x - 2.8, L.goal.x - 2.6), dx = clamp(want - f.x, 0, 9.5 * dt); f.x += dx; const pit = L.pits.find((p) => f.x > p.x0 && f.x < p.x1); f.y = pit ? pit.y + Math.sin(((f.x - pit.x0) / (pit.x1 - pit.x0)) * Math.PI) * 1.2 : this.T.h(f.x) + (dx > 0.01 ? Math.abs(Math.sin(this.t * 11)) * 0.12 : 0); f.s = dx > 0.01 || Math.sin(this.t * 4) > 0.2 ? 'elder' : 'elderB'; f.flip = false; } }
    if (this.end) this._ending(dt); else if (this.cine) this._cine(dt); else this.cam.update(this._eye(v), dt, this.W / this.H, false, this.intro ? 'close' : !this.started || !!this.rides.on); sc.update(dt, this.cam);
    this._effects(dt);
    // the record of the run: where the hero was (for the ghost) and how high (for the loss curve)
    if (this.started && !this.done && !this.failed && !this.resc) {
      this.recT -= dt; if (this.recT <= 0) { this.recT += 1 / 30; this.rec.push(+b.x.toFixed(2), +b.y.toFixed(2), +pose.tuck.toFixed(2), +pose.roll.toFixed(2), +pose.lean.toFixed(2), b.face); }
      this.curT -= dt; if (this.curT <= 0) { this.curT += 0.1; this.curve.push(+b.y.toFixed(2)); }
    }
    if (this.ghost && this.started) { const d = this.ghostData, n = d.length / 6, ft = Math.min(this.clock * 30, n - 1), i = Math.floor(ft) * 6, k = Math.min(i + 6, (n - 1) * 6), u = ft - Math.floor(ft), L = (a) => d[i + a] + (d[k + a] - d[i + a]) * u, g = this.ghost; if (n > 0) { g.b.x = L(0); g.b.y = L(1); Object.assign(g.pose, { tuck: L(2), roll: L(3), lean: L(4), face: d[i + 5], seed: 0, expr: 'smile', t: this.t }); g.show = Math.abs(g.b.x - b.x) > 0.6; } }
    if (!this.resc) this.maxSpeed = Math.max(this.maxSpeed, b.speed());
  }

  _onStep() {
    const b = this.b, L = this.level; if (this.dead > 0 || this.failed) return; tides(this.T, b.t);
    for (const e of b.events) this.hooks.event?.(e, b);
    if (this.boss) { this.boss.step(b, STEP); for (const e of this.boss.events) { this.hooks.event?.(e, b, this.boss.p); if (e === 'erupt') { this.scene.shake = 0.6; this.rig.dizzy = 3.2; this.lights--; if (this.lights <= 0) this._fail('falls'); } else if (this.boss.kind === 'doves') this.scene.emit('dust', b.x, b.y - 0.4, 6, { speed: 2, spread: 3, dir: Math.PI / 2, life: 0.6, size: 0.14, col: '#f2e2c4', g: 1 }); else this.scene.emit('steam', b.x, b.y - 0.3, 3, { speed: 1.2, life: 1.2, size: 0.5, col: '#ffffff', g: -1.2, drag: 0.6 }); } }
    if (b.grounded && Math.abs(this.T.dh(b.x)) < 0.35) { const c = L.checkFor(b.x); if (c.x > this.check.x) this.check = c; }
    if (b.x > (this.farX || 0)) this.farX = b.x;
    for (const s of L.seeds) if (!s.got && Math.abs(s.x - b.x) < (this.turboT > 0 ? 2.4 : 0.75) && Math.abs(s.y - b.y) < (this.turboT > 0 ? 2.4 : 0.85)) { s.got = true; this.seeds++; if (this.seeds % 5 === 0 && this.sparks < this.sparksAll) { this.sparks++; this.hooks.event?.('spark', b); } this.scene.emit('spark', s.x, s.y, 8, { speed: 3, spread: 6.3, life: 0.5, size: 0.12, g: 4 }); this.hooks.event?.('seed', b, this.seeds); }
    for (const it of L.items) {
      if (it.got) { if (it.kind === 'feather' && (it.back -= STEP) <= 0) it.got = false; continue; }
      if (Math.abs(it.x - b.x) > 0.85 || Math.abs(it.y - b.y) > 0.9) continue;
      if (it.kind === 'feather') { if (b.hops > 0 || b.grounded) continue; b.hops = 1; it.got = true; it.back = 2.5; }                                   // a feather is only taken by wings that need it
      else if (it.kind === 'dew') { if (this.lights < this.lightsAll) this.lights++; else if (this.sparks < this.sparksAll) this.sparks++; else continue; it.got = true; }   // and a dewdrop only by a seed with a light out, or a spark short
      else { it.got = true; this.stamp = true; this.rig.feel('glee', 2.4); this.rig.sq.kick(5); this.scene.flash = Math.max(this.scene.flash, 0.14); }
      this.scene.emit('spark', it.x, it.y, it.kind === 'stamp' ? 26 : 10, { speed: it.kind === 'stamp' ? 5 : 3, spread: 6.3, life: 0.8, size: 0.12, g: 4 }); this.hooks.event?.(it.kind, b);
    }
    if (L.fell(b)) { this.falls++; const saved = this.sparks > 0;      // a spark in hand: Eta makes the catch with it, and no light is lost
      if (saved) this.sparks--; else { this.lights--; if (this.spec.tutorial && this.lights <= 0) this.lights = 1; }      // on the practice slope the last light never goes out
      const lost = !saved && this.lights <= 0; this.dead = 1e9; this.resc = { t: 0, saved, lost, fall: saved ? 0.06 : 0.16 }; b.grounded = false; b.mode = 'run'; b.w = 0;
      this.hooks.event?.(saved ? 'saved' : 'fall', b); if (lost) this._fail('falls'); return; }
    if (!this.done && !this.failed && Math.abs(b.x - L.goal.x) < 1.5 && b.y - L.goal.y < 2.2) { this.done = true; this.rig.feel('proud', 4); for (let i = 0; i < 4; i++) this.scene.emit('spark', L.goal.x, L.goal.y + 0.5, 12, { speed: 7, spread: 2.4, life: 1.2, size: 0.14, g: 5 }); this.hooks.event?.('goal', b); this.hooks.finish?.(this.result()); }
  }
  // What the camera follows. It does not go down into a gap after a falling hero: it stays with the rim, and the hero drops out of the picture as they would.
  _eye(v) { const r = this.resc, pit = this.level.pits.find((p) => v.x > p.x0 - 0.5 && v.x < p.x1 + 0.5), low = pit ? pit.y - 2.2 : -1e9;
    if (r && (r.t < r.fall || r.lost)) { r.hold = r.hold ?? Math.max(v.y, low); return { x: v.x, y: r.hold, vx: v.vx * 0.3, vy: 0, face: v.face, speed: () => 0 }; }
    if (r) return { x: v.x, y: Math.max(v.y, r.hold ?? v.y), vx: v.vx * 0.5, vy: 0, face: v.face, speed: () => 6 };      // and waits there for the two of them to come back up into it
    if (pit && v.y < low && v.vy < 0) return { x: v.x, y: low, vx: v.vx, vy: 0, face: v.face, speed: v.speed };
    return v; }
  _fail(why) { if (this.failed || this.done) return; this.failed = why; this.rig.feel('sulk', 6); this.hooks.fail?.(why, this.result()); }
  // What happens after a fall into a gap. Theta goes on falling, as anything would, arms going round. Eta dives after, makes the catch on a thread of the
  // seed's own light (which is why a fall costs one of its lights, or a spark if there is one to spend), and hauls Theta back to the last safe ground.
  // Theta hangs on the thread as a weight hangs on a string: it swings when Eta speeds up, slows down or turns.
  _rescue(dt) {
    const r = this.resc, b = this.b, c = this.check, e = this.eta, G = 34, D = 1.3; r.t += dt; const px = b.x, py = b.y; b.events.length = 0; b.impact = 0;
    if (r.t < r.fall || r.lost) {
      b.vy = Math.max(b.vy - G * dt, -36); b.vx *= Math.exp(-1.6 * dt); b.x += b.vx * dt; b.y += b.vy * dt; b.px = b.x; b.py = b.y; b.airT = 1; this.rig.falling = 1; this.rig.hang = 0;
      if (!r.lost) e.hold = { x: e.x + (b.x - e.x) * Math.min(1, dt * 14), y: e.y + (b.y + D - e.y) * Math.min(1, dt * 14), rope: false }; return; }
    if (!r.c) { r.c = 1; r.x0 = b.x; r.y0 = b.y + D; r.x1 = c.x; r.y1 = c.y + R + 0.3 + D; const d = Math.hypot(r.x1 - r.x0, r.y1 - r.y0); r.T = clamp(0.85 + d / 55, 1, 1.9) * (r.saved ? 0.8 : 1); r.top = Math.max(r.y0, r.y1) + 1.6 + d * 0.05; r.phi = 0; r.om = clamp(b.vx * 0.2, -1.5, 1.5); r.pvx = 0;
      this.rig.falling = 0; this.rig.hang = 1; this.rig.sq.kick(7); this.scene.emit('spark', b.x, b.y + 0.5, r.saved ? 22 : 12, { speed: 4, spread: 6.3, life: 0.6, size: 0.12, g: 3 }); if (r.saved) this.scene.flash = Math.max(this.scene.flash, 0.12); this.hooks.event?.('catch', b, r.T); }
    const u = clamp((r.t - r.fall) / r.T, 0, 1), s = 1 - (1 - u) * (1 - u), q = 1 - s;      // a hard pull at the catch, and a slow, careful arrival
    // Eta's way back: up out of the gap in one long curve, with the small sag and recovery of something carrying more than it should
    const ex = q * q * r.x0 + 2 * q * s * ((r.x0 + r.x1) / 2) + s * s * r.x1, ey = q * q * r.y0 + 2 * q * s * r.top + s * s * r.y1 + Math.sin(r.t * 27) * 0.035 - Math.abs(Math.sin(r.t * 5.2)) * 0.12 * (1 - u);
    const evx = (ex - (r.ex ?? ex)) / Math.max(dt, 0.004), ax = clamp((evx - r.pvx) / Math.max(dt, 0.004), -90, 90); r.pvx = evx; r.ex = ex;
    r.om += (-(G / D) * Math.sin(r.phi) - ((ax * 0.6) / D) * Math.cos(r.phi) - 2.2 * r.om) * dt; r.phi = clamp(r.phi + r.om * dt, -0.9, 0.9);
    b.x = ex + Math.sin(r.phi) * D; b.y = ey - Math.cos(r.phi) * D; b.vx = (b.x - px) / Math.max(dt, 0.004); b.vy = (b.y - py) / Math.max(dt, 0.004); b.px = b.x; b.py = b.y; b.airT = 1; if (Math.abs(evx) > 1) b.face = evx > 0 ? 1 : -1;
    this.rig.swing = -r.phi; e.hold = { x: ex, y: ey, hx: b.x - Math.sin(r.phi) * 0.56, hy: b.y + Math.cos(r.phi) * 0.56, rope: true, gold: r.saved };
    if (Math.random() < dt * 22) this.scene.emit('spark', ex, ey, 1, { speed: 1.2, spread: 1.2, dir: -Math.PI / 2, life: 0.5, size: 0.08, g: 6 });
    if (u >= 1) {      // let go a hand's breadth above the ground; the last of the way is Theta's own
      this.resc = null; this.dead = 0; e.hold = null; e.glow = 0.25; this.rig.hang = 0; this.rig.falling = 0; this.rig.dizzy = r.saved ? 0.5 : 1.1; if (this.spec.tutorial && this.sparks < 1) this.sparks = 1;
      b.vx = 0; b.vy = -1; b.w = 0; b.mode = 'run'; b.grounded = false; b.x = b.px = c.x; this.acc = 0; this.scene.emit('dust', c.x, c.y + 0.2, 10, { speed: 2, spread: 6.3, life: 0.5, size: 0.14, col: '#ffffff', g: -1 }); this.hooks.event?.('back', b); }
  }
  _respawn() { const b = this.b, c = this.check; if (this.spec.tutorial && this.sparks < 1) this.sparks = 1; b.x = b.px = c.x; b.y = b.py = c.y + R + 0.05; b.vx = b.vy = b.w = 0; b.mode = 'run'; b.grounded = true; this.rig.feel('sulk', 0.9); this.rig.sq.kick(4); this.scene.emit('dust', c.x, c.y + 0.3, 14, { speed: 2.5, spread: 6.3, life: 0.5, size: 0.16, col: '#ffffff', g: -1 }); this.cam.update(b, 0.016, this.W / this.H, true); this.hooks.event?.('back', b); }
  result() { return { id: this.spec.id, sparks: this.sparks, lights: this.lights, lightsAll: this.lightsAll, limit: this.limit, time: this.clock, seeds: this.seeds, seedsAll: this.level.seeds.length, stamp: this.stamp, li: this.level.li, dist: Math.max(0, (this.farX || this.b.x) - this.level.start.x), falls: this.falls, curve: this.curve.slice(), rec: this.rec.slice(), top: this.level.start.y, bottom: this.level.goal.y, maxSpeed: this.maxSpeed }; }

  // dust, spray and streaks: small things that say what the body is doing
  _effects(dt) {
    const b = this.b, sc = this.scene, T = this.T, sp = b.speed(), gy = b.y - b.r, z = sc.zoneAt(b.x);
    const soil = { stone: '#dccfae', ledge: '#f0e4c4', mossy: '#a8d868', forest: '#8ab858', wetstone: '#a0b8c0', dune: '#f8ac64', soft: '#ffe4b4', pan: '#fffaf0', gravel: '#c8b8a4', grassy: '#f6e490', lava: '#6a6a78', beach: '#fff4dc', scoria: '#dc8458', green: '#aadc62', carpet: '#f48c5c', wetrock: '#8ab0c8', tuff: '#f2e2c4', rose: '#f0c0b4', honey: '#f0d898', dust: '#e0cca8', vine: '#b4d07a', cap: '#a89888', granite: '#d4ccd0', moraine: '#b4acb0', pampa: '#f4e08c', lenga: '#f89a50', litter: '#b89468', root: '#a88a68', stream: '#bfe0e8', snow: '#ffffff', ice: '#dff6ff', sand: '#5a5d6a', moss: '#a9c94f', meadow: '#9cc267', hot: '#e0b070', rock: '#8a90a0', basalt: '#8a90a0', wet: '#bfd9ea' }[z] || '#bbbbbb';
    for (const e of b.events) {
      if (e === 'hop') { if (this.mu) this.mu.lift = 0.3; this.rig.sq.kick(3.5); sc.emit('dust', b.x, b.y + 0.6, 7, { speed: 2.4, spread: 6.3, life: 0.6, size: 0.1, col: '#f6a27e', g: 5 }); sc.emit('spark', b.x, b.y + 0.5, 5, { speed: 2, spread: 6.3, life: 0.4, size: 0.09, g: 2 }); }
      if (e === 'jump') sc.emit('dust', b.x, gy, 6, { speed: 2.2, spread: 2.6, life: 0.4, size: 0.11, col: soil, g: 3 });
      if (e === 'land') { const n = Math.round(clamp(b.impact * 0.9, 3, 16)); sc.emit('dust', b.x, gy, n, { speed: clamp(b.impact * 0.3, 1.5, 5), spread: 3.1, dir: Math.PI / 2, life: 0.5, size: 0.13, col: soil, g: 2 }); if (b.impact > 13) sc.shake = Math.min(0.5, b.impact * 0.02); }
      if (e === 'splash') sc.emit('drop', b.x, gy + 0.3, 16, { speed: 6, spread: 1.6, life: 0.7, size: 0.09, col: '#eaf7ff', g: 22 });
    }
    this.trailT -= dt;
    if (b.grounded && this.trailT <= 0 && sp > 3) {
      this.trailT = 0.035;
      if (b.mode === 'slide') sc.emit(z === 'ice' || z === 'snow' ? 'snow' : 'dust', b.x - b.face * 0.3, gy, 2, { speed: sp * 0.25, dir: b.face > 0 ? 2.6 : 0.5, spread: 0.7, life: 0.45, size: 0.09, col: soil, g: 9 });
      else if (b.mode === 'ball' && sp > 8) sc.emit('dust', b.x - b.face * 0.2, gy, 1, { speed: 1.5, dir: b.face > 0 ? 2.6 : 0.5, spread: 0.8, life: 0.4, size: 0.1, col: soil, g: 2 });
      else if (b.mode === 'run' && sp > 6 && Math.random() < 0.5) sc.emit('dust', b.x - b.face * 0.2, gy, 1, { speed: 1.2, dir: b.face > 0 ? 2.5 : 0.6, spread: 0.6, life: 0.32, size: 0.08, col: soil, g: 2 });
    }
    if (WEAR.trail && sp > 5 && !this.cine && Math.random() < dt * 22) { const tx = b.x - b.face * 0.35, ty = b.y + (Math.random() - 0.5) * 0.5; if (WEAR.trail === 'sparks') sc.emit('spark', tx, ty, 1, { speed: 1.2, spread: 6.3, life: 0.6, size: 0.1, g: 2 }); else if (WEAR.trail === 'petals') sc.emit('dust', tx, ty, 1, { speed: 1, spread: 6.3, life: 1.1, size: 0.11, col: Math.random() < 0.5 ? '#ffb4c8' : '#ffe0ea', g: 1.5 }); else sc.emit('spark', tx, ty + 0.3, 1, { speed: 0.5, spread: 6.3, life: 1.8, size: 0.08, g: -0.4 }); }
    if (sp > 17 && Math.random() < dt * 40) sc.emit('line', b.x + (Math.random() - 0.5) * 2, b.y + (Math.random() - 0.5) * 1.6, 1, { speed: 0, life: 0.22, size: 0.08, col: '#ffffff', g: 0, vx: -b.vx * 0.5, vy: -b.vy * 0.5, drag: 0 });
    if (b.inJet > 0.2 && Math.random() < 0.6) sc.emit('drop', b.x, b.y - 0.3, 2, { speed: 4, spread: 2.6, life: 0.5, size: 0.08, col: '#eaf7ff', g: 20 });
  }

  draw(ctx) { this.scene.draw(ctx, this.cam, { hero: (this.dead > 0 && !this.resc) || (this.trav && !this.trav.done) ? null : { b: this.view, pose: this.rig.p }, ghost: this.ghost && this.ghost.show ? this.ghost : null, flyers: this.flyers, critters: this.critters }); }
}
