// One run of one level: the body, the rig, the camera, the clock, the ghost, and everything that happens along the way.
import { Body, advance, step, turbo, R, STEP } from './physics.js';
import { build } from './level.js';
import { Rig, POSE } from './theta.js';
import { Scene } from '../art/scene.js';
import { clamp, lerp, smooth } from '../art/paint.js';
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
  constructor(x, y) { this.x = x; this.y = y; this.glow = 0.6; }
  update(b, dt, t) { const sp = b.speed(), ahead = 1.3 + clamp(sp * 0.16, 0, 4.2), tx = b.x + b.face * ahead + Math.sin(t * 2.3) * 0.25, ty = b.y + 1.05 + Math.sin(t * 3.1) * 0.22 + clamp(b.vy * 0.06, -0.8, 0.8); this.x += (tx - this.x) * Math.min(1, dt * 5); this.y += (ty - this.y) * Math.min(1, dt * 5); this.glow += (0.55 + clamp(sp / 22, 0, 1) * 0.7 - this.glow) * Math.min(1, dt * 3); }
  draw(ctx, t, fx) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, this.glow); const s = 1.5 + this.glow * 1.4 + Math.sin(t * 9) * 0.08; ctx.drawImage(fx.c, -s / 2, -s / 2, s, s); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; const w = Math.sin(t * 38) * 0.5; ctx.beginPath(); ctx.ellipse(-0.05, -0.05, 0.09, 0.04 + 0.03 * w, -0.6, 0, 7); ctx.ellipse(0.05, -0.05, 0.09, 0.04 - 0.03 * w, 0.6, 0, 7); ctx.fill();
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
  constructor({ spec, theme, can = {}, ghost = null, hooks = {}, cine = false, intro = false, ending = false, lights = 3, limit = Infinity }) {
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
    // the old macaque who knows the path by heart: he is waiting at the same place in every verse of it
    this.critters = this.level.marks.filter((k) => k.kind === 'memo').map((k) => ({ x: k.x, y: this.T.h(k.x), s: 'elder', size: 1 }));
    // the end of the story: the seed set down in the moss, and what comes of it
    if (ending) { const b = this.b; b.x = b.px = 14 + 14 + 11.5; b.y = b.py = this.T.h(b.x) + R; this.end = { t: 0, x: b.x + 1.7 }; this.end.y = this.T.h(this.end.x);
      this.flyers.push({ x: this.end.x, y: this.end.y, draw: (ctx, t) => { const g = smooth(clamp((this.end.t - 3) / 16, 0, 1)), fx = this.scene.fx.warm, top = -1.9 * g - 0.12;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const s = 1.6 + 6.5 * g + 0.25 * Math.sin(t * 2); ctx.globalAlpha = clamp(this.end.t / 3, 0, 1); ctx.drawImage(fx.c, -s / 2, top - s / 2, s, s); ctx.restore();
        ctx.strokeStyle = '#7fc850'; ctx.lineWidth = 0.05 + 0.04 * g; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0.1); ctx.quadraticCurveTo(0.14 * Math.sin(t * 0.7) * g, top * 0.5, 0, top + 0.1); ctx.stroke();
        for (let i = 0; i < 5; i++) { const u = clamp((g - 0.1 - i * 0.16) / 0.2, 0, 1); if (u <= 0) continue; const y = top * (0.22 + i * 0.17); for (const sd of [-1, 1]) { ctx.save(); ctx.translate(0, y); ctx.rotate(sd * (1 - 0.14 * Math.sin(t * 1.3 + i + sd))); ctx.scale(u * (1 - i * 0.1), u * (1 - i * 0.1)); ctx.fillStyle = (i + (sd > 0 ? 1 : 0)) % 2 ? '#b8f060' : '#7fc850'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0.17, -0.22, 0, -0.56); ctx.quadraticCurveTo(-0.17, -0.22, 0, 0); ctx.fill(); ctx.restore(); } }
        ctx.translate(0, top); ctx.rotate(Math.sin(t * 1.4) * 0.15); ctx.fillStyle = '#fff3b8'; ctx.strokeStyle = '#c9861a'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.moveTo(0, -0.2); ctx.bezierCurveTo(0.16, -0.06, 0.13, 0.15, 0, 0.17); ctx.bezierCurveTo(-0.13, 0.15, -0.16, -0.06, 0, -0.2); ctx.fill(); ctx.stroke(); } }); }
    this.rides = new Rides(this.level, this.T); if (this.rides.list.length) this.scene.rides = this.rides.list;
    // one weather for the picture and the physics
    this.weather = this.scene.wx; this.scene.own = false; this.T.air = (t) => this.weather.windAt(t);
    if (spec.boss === 'geyser') { this.boss = new Geyser(this.level, this.T); this.scene.overlay = (ctx, x0, x1) => this.boss.draw(ctx, x0, x1, this.t, this.scene.time.hot); }
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
    if (!e.a && e.t > 2.6) { e.a = 1; this.rig.feel('wow', 2.4); this.rig.sq.kick(4); } if (e.a === 1 && e.t > 8) { e.a = 2; this.rig.feel('proud', 6); } if (e.a === 2 && e.t > 16) { e.a = 3; this.rig.feel('joy', 30); this.rig.sq.kick(5); }
    // the picture begins close on the two of them and draws slowly back until the trees are in it
    const k = smooth(clamp(e.t / 26, 0, 1)); c.vh = (8.2 + 7 * k) * (a < 1 ? 1.35 : 1); c.vw = c.vh * a; c.x = this.b.x + 0.9 + c.vw * 0.05 * k; c.y = this.b.y - c.vh * (0.12 - 0.03 * k); }
  _cine(dt) { const c = this.cam, b = this.view || this.b, a = (this.W || 16) / (this.H || 9), t = this.t; c.vh = (16.5 + Math.sin(t * 0.05) * 0.6) * (a < 1 ? 1.35 : 1); c.vw = c.vh * a; c.x = b.x + c.vw * 0.21 + Math.sin(t * 0.06) * 1.8; c.y = b.y + c.vh * 0.25 + Math.sin(t * 0.045) * 0.3; }
  resize(W, H) { this.W = W; this.H = H; this.scene.resize(W, H); }

  update(dt, inp) {
    const b = this.b, sc = this.scene; this.t += dt;
    if (this.intro) inp = this._intro(dt, inp);
    this.turboT = Math.max(0, this.turboT - dt); this.turboCd = Math.max(0, this.turboCd - dt);
    if (inp.turboNow && !this.cine && !this.intro && !this.done && !this.failed && this.dead <= 0 && !this.rides.on && this.sparks > 0 && this.turboCd <= 0 && turbo(b)) {
      this.sparks--; this.turboT = 0.8; this.turboCd = 0.45; if (!this.started) { this.started = true; this.hooks.start?.(); } this.rig.feel('glee', 0.9); this.rig.sq.kick(4); this.eta.glow = 1.8; this.scene.flash = Math.max(this.scene.flash, 0.16);
      for (let i = 0; i < 3; i++) this.scene.emit('spark', b.x - b.face * 0.3, b.y, 8, { speed: 6, dir: b.face > 0 ? Math.PI : 0, spread: 1.4, life: 0.6, size: 0.12, g: 3 }); this.hooks.event?.('turbo', b); }
    if (!this.started && !this.cine && !this.intro && (inp.move || inp.jump || inp.tuck)) { this.started = true; this.hooks.start?.(); }
    this.weather.set(b.t + (this.cine ? this.t : 0), dt); this.rig.wind = this.weather.wind; this.rig.rain = this.weather.rain * (1 - this.scene.coldNow);
    if (this.dead > 0) { this.dead -= dt; if (this.dead <= 0) this._respawn(); }
    else if (!this.done && !this.failed) {
      if (this.rides.on || this.rides.list.length) { // a balloon carries the hero step by step in place of the ordinary physics
        this.acc += Math.min(dt, 0.1); while (this.acc >= STEP) { b.px = b.x; b.py = b.y; if (this.rides.step(b, STEP)) { b.events.length = 0; } else step(b, this.T, inp, STEP); for (const e of this.rides.events) { this.hooks.event?.(e, b); if (e === 'lift') this.rig.feel('wow', 1.4); else this.rig.feel('joy', 1.5); } this._onStep(); inp.jumpNow = false; this.acc -= STEP; } b.mix = this.acc / STEP;
      } else this.acc = advance(b, this.T, inp, this.acc, dt, () => this._onStep());
      if (this.started) this.clock += dt;
      if (this.clock > this.limit) this._fail('time');
    } else { // at the goal the hero is let down gently and the level is over
      this.acc = advance(b, this.T, { move: 0, jump: false, jumpNow: false, tuck: false }, this.acc, dt);
    }
    const v = this.view, m = this.dead > 0 || b.px == null ? 1 : b.mix ?? 1; v.x = b.px == null ? b.x : b.px + (b.x - b.px) * m; v.y = b.py == null ? b.y : b.py + (b.y - b.py) * m; v.vx = b.vx; v.vy = b.vy; v.face = b.face; v.fast = clamp((b.speed() - 13) / 14, 0, 1);
    this.scene.pt = b.t - (1 - m) * STEP;      // the physics clock, for everything in the picture that the physics also moves
    const pose = this.rig.update(b, dt, inp);
    pose.seed = (0.7 + 0.3 * clamp((this.level.hi - b.y) / Math.max(1, this.level.hi - this.level.lo), 0, 1)) * this.seedGlow;   // the seed glows warmer the lower Theta gets
    if (this.mu) { this.mu.update(v, dt, this.t, this.weather.wind); const f = this.muF; f.x = this.mu.x; f.y = this.mu.y; }
    this.eta.update(v, dt, this.t); this.flyers[0].x = this.eta.x; this.flyers[0].y = this.eta.y; if (this.star) { this.flyers[1].x = this.star.x; this.flyers[1].y = this.star.y; }
    for (const m of this.critters) { const near = Math.abs(m.x - this.b.x) < 7; m.s = near && Math.sin(this.t * 5) > -0.3 ? 'elderB' : 'elder'; m.flip = this.b.x < m.x - 0.5; }
    if (this.end) this._ending(dt); else if (this.cine) this._cine(dt); else this.cam.update(v, dt, this.W / this.H, false, this.intro ? 'close' : !this.started || !!this.rides.on); sc.update(dt, this.cam);
    this._effects(dt);
    // the record of the run: where the hero was (for the ghost) and how high (for the loss curve)
    if (this.started && !this.done && !this.failed) {
      this.recT -= dt; if (this.recT <= 0) { this.recT += 1 / 30; this.rec.push(+b.x.toFixed(2), +b.y.toFixed(2), +pose.tuck.toFixed(2), +pose.roll.toFixed(2), +pose.lean.toFixed(2), b.face); }
      this.curT -= dt; if (this.curT <= 0) { this.curT += 0.1; this.curve.push(+b.y.toFixed(2)); }
    }
    if (this.ghost && this.started) { const d = this.ghostData, n = d.length / 6, ft = Math.min(this.clock * 30, n - 1), i = Math.floor(ft) * 6, k = Math.min(i + 6, (n - 1) * 6), u = ft - Math.floor(ft), L = (a) => d[i + a] + (d[k + a] - d[i + a]) * u, g = this.ghost; if (n > 0) { g.b.x = L(0); g.b.y = L(1); Object.assign(g.pose, { tuck: L(2), roll: L(3), lean: L(4), face: d[i + 5], seed: 0, expr: 'smile', t: this.t }); g.show = Math.abs(g.b.x - b.x) > 0.6; } }
    this.maxSpeed = Math.max(this.maxSpeed, b.speed());
  }

  _onStep() {
    const b = this.b, L = this.level; if (this.dead > 0 || this.failed) return; tides(this.T, b.t);
    for (const e of b.events) this.hooks.event?.(e, b);
    if (this.boss) { this.boss.step(b, STEP); for (const e of this.boss.events) { this.hooks.event?.(e, b, this.boss.p); if (e === 'erupt') { this.scene.shake = 0.6; this.rig.dizzy = 3.2; this.lights--; if (this.lights <= 0) this._fail('falls'); } else this.scene.emit('steam', b.x, b.y - 0.3, 3, { speed: 1.2, life: 1.2, size: 0.5, col: '#ffffff', g: -1.2, drag: 0.6 }); } }
    if (b.grounded && Math.abs(this.T.dh(b.x)) < 0.35) { const c = L.checkFor(b.x); if (c.x > this.check.x) this.check = c; }
    for (const s of L.seeds) if (!s.got && Math.abs(s.x - b.x) < (this.turboT > 0 ? 2.4 : 0.75) && Math.abs(s.y - b.y) < (this.turboT > 0 ? 2.4 : 0.85)) { s.got = true; this.seeds++; if (this.seeds % 5 === 0 && this.sparks < this.sparksAll) { this.sparks++; this.hooks.event?.('spark', b); } this.scene.emit('spark', s.x, s.y, 8, { speed: 3, spread: 6.3, life: 0.5, size: 0.12, g: 4 }); this.hooks.event?.('seed', b, this.seeds); }
    for (const it of L.items) {
      if (it.got) { if (it.kind === 'feather' && (it.back -= STEP) <= 0) it.got = false; continue; }
      if (Math.abs(it.x - b.x) > 0.85 || Math.abs(it.y - b.y) > 0.9) continue;
      if (it.kind === 'feather') { if (b.hops > 0 || b.grounded) continue; b.hops = 1; it.got = true; it.back = 2.5; }                                   // a feather is only taken by wings that need it
      else if (it.kind === 'dew') { if (this.lights < this.lightsAll) this.lights++; else if (this.sparks < this.sparksAll) this.sparks++; else continue; it.got = true; }   // and a dewdrop only by a seed with a light out, or a spark short
      else { it.got = true; this.stamp = true; this.rig.feel('glee', 2.4); this.rig.sq.kick(5); this.scene.flash = Math.max(this.scene.flash, 0.14); }
      this.scene.emit('spark', it.x, it.y, it.kind === 'stamp' ? 26 : 10, { speed: it.kind === 'stamp' ? 5 : 3, spread: 6.3, life: 0.8, size: 0.12, g: 4 }); this.hooks.event?.(it.kind, b);
    }
    if (L.fell(b)) { this.falls++; if (this.sparks > 0) { this.sparks--; this.dead = 0.4; this.hooks.event?.('saved', b); return; }      // a spark in hand: Eta catches the fall, and no light is lost
      this.lights--; if (this.spec.tutorial && this.lights <= 0) this.lights = 1;      // on the practice slope the last light never goes out
      this.hooks.event?.('fall', b); if (this.lights <= 0) { this.dead = 1e9; this._fail('falls'); } else this.dead = 0.55; return; }
    if (!this.done && !this.failed && Math.abs(b.x - L.goal.x) < 1.5 && b.y - L.goal.y < 2.2) { this.done = true; this.rig.feel('proud', 4); for (let i = 0; i < 4; i++) this.scene.emit('spark', L.goal.x, L.goal.y + 0.5, 12, { speed: 7, spread: 2.4, life: 1.2, size: 0.14, g: 5 }); this.hooks.event?.('goal', b); this.hooks.finish?.(this.result()); }
  }
  _fail(why) { if (this.failed || this.done) return; this.failed = why; this.rig.feel('sulk', 6); this.hooks.fail?.(why, this.result()); }
  _respawn() { const b = this.b, c = this.check; if (this.spec.tutorial && this.sparks < 1) this.sparks = 1; b.x = b.px = c.x; b.y = b.py = c.y + R + 0.05; b.vx = b.vy = b.w = 0; b.mode = 'run'; b.grounded = true; this.rig.feel('sulk', 0.9); this.rig.sq.kick(4); this.scene.emit('dust', c.x, c.y + 0.3, 14, { speed: 2.5, spread: 6.3, life: 0.5, size: 0.16, col: '#ffffff', g: -1 }); this.cam.update(b, 0.016, this.W / this.H, true); this.hooks.event?.('back', b); }
  result() { return { id: this.spec.id, sparks: this.sparks, lights: this.lights, lightsAll: this.lightsAll, limit: this.limit, time: this.clock, seeds: this.seeds, seedsAll: this.level.seeds.length, stamp: this.stamp, li: this.level.li, falls: this.falls, curve: this.curve.slice(), rec: this.rec.slice(), top: this.level.start.y, bottom: this.level.goal.y, maxSpeed: this.maxSpeed }; }

  // dust, spray and streaks: small things that say what the body is doing
  _effects(dt) {
    const b = this.b, sc = this.scene, T = this.T, sp = b.speed(), gy = b.y - b.r, z = sc.zoneAt(b.x);
    const soil = { stone: '#dccfae', ledge: '#f0e4c4', mossy: '#a8d868', forest: '#8ab858', wetstone: '#a0b8c0', dune: '#f8ac64', soft: '#ffe4b4', pan: '#fffaf0', gravel: '#c8b8a4', grassy: '#f6e490', lava: '#6a6a78', beach: '#fff4dc', scoria: '#dc8458', green: '#aadc62', carpet: '#f48c5c', wetrock: '#8ab0c8', tuff: '#f2e2c4', rose: '#f0c0b4', honey: '#f0d898', dust: '#e0cca8', vine: '#b4d07a', cap: '#a89888', granite: '#d4ccd0', moraine: '#b4acb0', pampa: '#f4e08c', lenga: '#f89a50', cedar: '#8ab858', root: '#a88a68', stream: '#bfe0e8', snow: '#ffffff', ice: '#dff6ff', sand: '#5a5d6a', moss: '#a9c94f', meadow: '#9cc267', hot: '#e0b070', rock: '#8a90a0', basalt: '#8a90a0', wet: '#bfd9ea' }[z] || '#bbbbbb';
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
    if (sp > 17 && Math.random() < dt * 40) sc.emit('line', b.x + (Math.random() - 0.5) * 2, b.y + (Math.random() - 0.5) * 1.6, 1, { speed: 0, life: 0.22, size: 0.08, col: '#ffffff', g: 0, vx: -b.vx * 0.5, vy: -b.vy * 0.5, drag: 0 });
    if (b.inJet > 0.2 && Math.random() < 0.6) sc.emit('drop', b.x, b.y - 0.3, 2, { speed: 4, spread: 2.6, life: 0.5, size: 0.08, col: '#eaf7ff', g: 20 });
  }

  draw(ctx) { this.scene.draw(ctx, this.cam, { hero: this.dead > 0 ? null : { b: this.view, pose: this.rig.p }, ghost: this.ghost && this.ghost.show ? this.ghost : null, flyers: this.flyers, critters: this.critters }); }
}
