// Theta, the hero: how the body is drawn and how it moves. Everything is drawn in code, every frame, from a pose.
//
// The design. A small soft creature the colour of rice cake, shaped like a gumdrop when it stands and a ball when it tucks.
// A teal band runs round the body at eye level, so that standing it looks like the letter it is named after, and rolling
// the band turns and shows the spin. Two big gold eyes sit in the band, with a plain smile under it. Round ears with teal tips,
// a pom of a tail, teal feet, and a warm light low on the belly where the seed is kept. Nothing here is borrowed from any other character.
//
// drawTheta(ctx, pose) draws one pose; Rig turns what the physics body is doing into a pose, with springs for everything soft.

export const COL = {
  body: '#fff3dc', light: '#fffbf0', shade: '#eccfa6', belly: '#fff8e8', line: '#23434d',
  band: '#3f8f95', bandDark: '#2b6c76', bandLight: '#69b8b8',     // a calm lagoon teal; it was plum, which the owner found restless
  eyeWhite: '#fffdf6', iris: '#ffc23d', irisDeep: '#e9781c', pupil: '#14313a',
  cheek: '#ff9f8a', mouth: '#7a3a45', tongue: '#ff9aa2',
  foot: '#34808a', earIn: '#ffc9b8', pouch: '#f5ddb8', seed: '#ffd75e', seedHot: '#fff6c8', flap: '#ffdcc6',
};
const TAU = Math.PI * 2, lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// The neutral pose. Every number can be changed; drawTheta reads them all.
export const POSE = () => ({
  tuck: 0,        // 0 standing, 1 rolled into a ball
  roll: 0,        // angle of the ball
  sy: 1,          // squash (below 1) and stretch (above 1) along the body's own up; the width follows so the volume stays the same
  lean: 0,        // tilt of the whole body, radians, positive leaning toward +x
  face: 1,        // 1 looks right, -1 left
  turn: 0.5,      // how far the face is turned toward `face`: 0 full front, 1 three-quarter view
  run: 0, runAmt: 0,   // phase of the run cycle, and how much of it shows
  air: 0,         // -1 falling, +1 rising: tucks the feet and lifts the arms
  spread: 0,      // limbs flung wide, with the flaps open
  slide: 0,       // on the belly
  crouch: 0,
  side: 1,        // 1 in profile, 0 at the moment of turning round, when the hero faces the viewer
  earL: 0, earR: 0, tail: 0,   // what the springs have done to the ears and tail
  lookX: 0, lookY: 0, blink: 0, lid: 0,
  expr: 'smile',  // smile | joy | effort | worry | wow | proud | squint | sleepy | dizzy | sulk | glee
  seed: 1,        // glow of the seed
  wet: 0, t: 0, alpha: 1, ghost: false,
});

function bodyPath(ctx, tuck) {
  // standing: a gumdrop, wider below. tucked: a circle of the physics radius
  const r = 0.46, k = r * 0.5523, L = (a, b) => lerp(a, b, tuck);
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.bezierCurveTo(L(0.36, k), r, L(0.53, r), L(0.36, k), L(0.5, r), L(0.07, 0));
  ctx.bezierCurveTo(L(0.47, r), L(-0.33, -k), L(0.29, k), L(-0.64, -r), 0, L(-0.64, -r));
  ctx.bezierCurveTo(L(-0.29, -k), L(-0.64, -r), L(-0.47, -r), L(-0.33, -k), L(-0.5, -r), L(0.07, 0));
  ctx.bezierCurveTo(L(-0.53, -r), L(0.36, k), L(-0.36, -k), r, 0, r);
  ctx.closePath();
}
function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); }

function ear(ctx, bx, by, ang, len, wid, p, behind) {
  ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, 0, 0, -len); g.addColorStop(0, COL.body); g.addColorStop(0.5, COL.body); g.addColorStop(0.62, COL.band); g.addColorStop(1, COL.bandDark);
  ctx.beginPath(); ctx.moveTo(-wid * 0.4, 0.04); ctx.bezierCurveTo(-wid * 0.9, -len * 0.5, -wid * 0.62, -len * 1.04, 0, -len); ctx.bezierCurveTo(wid * 0.62, -len * 1.04, wid * 0.9, -len * 0.5, wid * 0.4, 0.04); ctx.closePath();
  ctx.fillStyle = p.ghost ? 'rgba(255,255,255,0.5)' : g; ctx.fill();
  if (!p.ghost) {
    ctx.strokeStyle = COL.line; ctx.lineWidth = 0.028; ctx.lineJoin = 'round'; ctx.stroke();
    if (!behind) { ctx.fillStyle = COL.earIn; ctx.globalAlpha *= 0.8; ell(ctx, 0, -len * 0.34, wid * 0.3, len * 0.26); ctx.fill(); ctx.globalAlpha /= 0.8; }
  }
  ctx.restore();
}

function eye(ctx, x, y, s, p, far) {
  const rx = 0.112 * s * (far ? 0.9 : 1), ry = 0.146 * s, e = p.expr;
  const closed = p.blink > 0.85 || e === 'proud' || e === 'glee' || e === 'sleepy' && p.lid > 0.9;
  ctx.lineCap = 'round';
  if (e === 'squint') { ctx.strokeStyle = COL.eyeWhite; ctx.lineWidth = 0.04; const d = far ? 1 : -1; ctx.beginPath(); ctx.moveTo(x - rx * 0.8 * d, y - ry * 0.55); ctx.lineTo(x + rx * 0.5 * d, y); ctx.lineTo(x - rx * 0.8 * d, y + ry * 0.55); ctx.stroke(); return; }
  if (e === 'dizzy') { ctx.strokeStyle = COL.eyeWhite; ctx.lineWidth = 0.032; ctx.beginPath(); for (let a = 0; a < 11; a += 0.3) { const r = a * 0.0105 * s, px = x + Math.cos(a + p.t * 9) * r, py = y + Math.sin(a + p.t * 9) * r; a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke(); return; }
  if (closed) { ctx.strokeStyle = COL.eyeWhite; ctx.lineWidth = 0.042; ctx.beginPath(); if (e === 'sleepy') ctx.arc(x, y - ry * 0.2, rx * 0.9, 0.15 * Math.PI, 0.85 * Math.PI); else ctx.arc(x, y + ry * 0.45, rx * 0.95, 1.12 * Math.PI, 1.88 * Math.PI); ctx.stroke(); return; }
  const open = e === 'wow' || e === 'worry' ? 1.1 : e === 'joy' ? 1.04 : 1;
  ctx.save();
  ell(ctx, x, y, rx, ry * open); ctx.fillStyle = COL.eyeWhite; ctx.fill(); ctx.clip();
  const lx = clamp(p.lookX, -1, 1) * rx * 0.2, ly = clamp(p.lookY, -1, 1) * ry * 0.16, ix = x + lx, iy = y + ly + ry * 0.03;
  const g = ctx.createLinearGradient(0, iy - ry, 0, iy + ry); g.addColorStop(0, '#5b2a14'); g.addColorStop(0.3, COL.irisDeep); g.addColorStop(0.72, COL.iris); g.addColorStop(1, '#ffe59a');
  ell(ctx, ix, iy, rx * 0.86, ry * 0.9 * open); ctx.fillStyle = g; ctx.fill();
  ell(ctx, ix, iy - ry * 0.05, rx * 0.44 * (e === 'wow' ? 0.72 : 1), ry * 0.52 * (e === 'wow' ? 0.72 : 1)); ctx.fillStyle = COL.pupil; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.96)'; ell(ctx, ix - rx * 0.36, iy - ry * 0.4, rx * 0.3, ry * 0.26); ctx.fill();
  ell(ctx, ix + rx * 0.34, iy + ry * 0.38, rx * 0.15, ry * 0.12); ctx.fill();
  // lids come down for sleepiness, effort and sulking; brows are the top edge of the lid
  const lid = Math.max(p.lid, p.blink, e === 'effort' ? 0.34 : e === 'sulk' ? 0.42 : e === 'sleepy' ? 0.6 : 0);
  if (lid > 0.01) { ctx.fillStyle = COL.band; const tilt = (e === 'effort' ? 0.5 : e === 'sulk' ? -0.45 : e === 'worry' ? -0.3 : 0) * (far ? -1 : 1); ctx.beginPath(); const top = y - ry * 1.3, edge = y - ry * open + 2 * ry * open * lid; ctx.moveTo(x - rx * 1.4, top); ctx.lineTo(x + rx * 1.4, top); ctx.lineTo(x + rx * 1.4, edge - tilt * rx * 0.5); ctx.lineTo(x - rx * 1.4, edge + tilt * rx * 0.5); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ell(ctx, x, y, rx, ry * open); ctx.strokeStyle = COL.bandDark; ctx.lineWidth = 0.022; ctx.stroke();
}

function mouth(ctx, x, y, p) {
  const e = p.expr; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = COL.mouth; ctx.lineWidth = 0.026;
  if (e === 'joy' || e === 'glee' || e === 'wow') {
    const w = e === 'wow' ? 0.055 : 0.1, h = e === 'wow' ? 0.08 : 0.1;
    ctx.beginPath(); if (e === 'wow') ctx.ellipse(x, y + 0.03, w, h, 0, 0, TAU); else { ctx.moveTo(x - w, y - 0.01); ctx.quadraticCurveTo(x, y + 0.02, x + w, y - 0.01); ctx.bezierCurveTo(x + w * 0.9, y + h * 1.25, x - w * 0.9, y + h * 1.25, x - w, y - 0.01); }
    ctx.closePath(); ctx.fillStyle = COL.mouth; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = COL.tongue; ell(ctx, x, y + h * 1.05, w * 0.75, h * 0.55); ctx.fill(); ctx.restore();
  } else if (e === 'worry' || e === 'dizzy') { ctx.beginPath(); ctx.moveTo(x - 0.07, y + 0.03); ctx.quadraticCurveTo(x - 0.035, y - 0.012, x, y + 0.03); ctx.quadraticCurveTo(x + 0.035, y + 0.07, x + 0.07, y + 0.025); ctx.stroke(); }
  else if (e === 'effort' || e === 'squint') { ctx.beginPath(); ctx.moveTo(x - 0.055, y + 0.03); ctx.lineTo(x + 0.055, y + 0.03); ctx.stroke(); }
  else if (e === 'sulk') { ctx.beginPath(); ctx.arc(x, y + 0.085, 0.06, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); }
  else if (e === 'sleepy') { ctx.beginPath(); ctx.ellipse(x, y + 0.035, 0.022, 0.028, 0, 0, TAU); ctx.fillStyle = COL.mouth; ctx.fill(); }
  else { // the everyday mouth: one plain smile
    ctx.lineWidth = 0.032; ctx.beginPath(); ctx.moveTo(x - 0.085, y + 0.005); ctx.quadraticCurveTo(x, y + 0.095, x + 0.085, y + 0.005); ctx.stroke();
  }
}

// Draw one pose with the body's centre at the origin, y down, one unit about the hero's height. The caller sets position and scale.
export function drawTheta(ctx, p) {
  const tk = clamp(p.tuck, 0, 1), up = 1 - tk, f = p.face >= 0 ? 1 : -1, ghost = p.ghost;
  ctx.save(); ctx.globalAlpha *= p.alpha;
  if (ghost) ctx.globalAlpha *= 0.42;
  // the whole body turns with the roll when tucked, and leans when standing
  ctx.rotate(tk > 0.02 ? p.roll * tk + p.lean * up : p.lean);
  // squash and stretch about the feet when standing, about the centre when rolled; the volume is kept
  const sy = clamp(p.sy, 0.5, 1.6) * (1 - p.crouch * 0.22 * up), sx = 1 / Math.sqrt(sy), piv = 0.46 * up;
  ctx.translate(0, piv); ctx.scale(sx, sy); ctx.translate(0, -piv);
  ctx.scale(f, 1);                                   // from here on, +x is the way the hero faces
  const turn = p.turn * up, shift = 0.085 * turn;    // features slide toward the facing side in three-quarter view
  const line = ghost ? 'rgba(255,255,255,0.9)' : COL.line;
  const runA = p.runAmt * up, ph = p.run, air = p.air * up, spr = p.spread * up, sl = p.slide * up;

  // tail
  if (!ghost) { ctx.save(); ctx.translate(lerp(-0.4, -0.3, tk) * (0.2 + 0.8 * (p.side ?? 1)), lerp(0.25, 0.26, tk)); ctx.rotate(p.tail * up); ell(ctx, -0.07, 0, 0.115, 0.105); ctx.fillStyle = COL.body; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 0.028; ctx.stroke(); ell(ctx, -0.115, -0.02, 0.055, 0.05); ctx.fillStyle = COL.band; ctx.fill(); ctx.restore(); }

  // limbs: where each foot and hand is
  const foot = (side) => {
    const o = side > 0 ? 0 : Math.PI, c = Math.cos(ph + o), s = Math.sin(ph + o);
    let x = lerp(0.19 * side * (1 - turn * 0.3) + 0.04 * turn, 0.23 * c, runA), y = 0.5 - Math.max(0, s) * 0.14 * runA, rot = -s * 0.5 * runA;
    x = lerp(x, 0.1 + 0.1 * side, Math.abs(air)); y = lerp(y, air > 0 ? 0.44 : 0.4, Math.abs(air)); rot = lerp(rot, air > 0 ? 0.5 : -0.35, Math.abs(air));
    x = lerp(x, side > 0 ? 0.36 : -0.42, spr); y = lerp(y, 0.4, spr); rot = lerp(rot, side > 0 ? -0.5 : 0.5, spr);
    x = lerp(x, 0.3 + 0.12 * side, sl); y = lerp(y, 0.4, sl); rot = lerp(rot, -0.9, sl);
    return { x, y, rot };
  };
  const hand = (side) => {
    const o = side > 0 ? Math.PI : 0, s = Math.sin(ph + o);
    let x = 0.43 * side * (1 - turn * 0.2) + 0.03 + s * 0.1 * runA, y = 0.17 - Math.abs(s) * 0.03 * runA, rot = side * 0.35 + s * 0.8 * runA;
    x = lerp(x, x + 0.03 * side, Math.abs(air)); y = lerp(y, air > 0 ? -0.12 : -0.2, Math.abs(air)); rot = lerp(rot, side * 1.5, Math.abs(air));
    x = lerp(x, side > 0 ? 0.58 : -0.56, spr); y = lerp(y, -0.24, spr); rot = lerp(rot, side * 2.0, spr);
    x = lerp(x, 0.36 + side * 0.1, sl); y = lerp(y, -0.02 - side * 0.03, sl); rot = lerp(rot, 1.4, sl);
    return { x, y, rot };
  };
  const limb = (o, rx, ry, col) => { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot); ell(ctx, 0, 0, rx, ry); ctx.fillStyle = ghost ? 'rgba(255,255,255,0.5)' : col; ctx.fill(); if (!ghost) { ctx.strokeStyle = line; ctx.lineWidth = 0.028; ctx.stroke(); } ctx.restore(); };
  const fA = foot(-1), fB = foot(1), hA = hand(-1), hB = hand(1);
  if (up > 0.05) {
    ctx.save(); ctx.globalAlpha *= clamp(up * 1.6, 0, 1);
    // the flaps between hand and foot, open only when spread
    if (spr > 0.05 && !ghost) for (const [h, ft, s] of [[hA, fA, -1], [hB, fB, 1]]) { ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.quadraticCurveTo(s * 0.42 + 0.02, 0.12, ft.x, ft.y - 0.04); ctx.lineTo(s * 0.2, 0.3); ctx.lineTo(s * 0.3, -0.15); ctx.closePath(); ctx.globalAlpha *= spr; ctx.fillStyle = COL.flap; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 0.022; ctx.stroke(); ctx.globalAlpha /= spr; }
    limb(hA, 0.06, 0.095, COL.body);
    ctx.restore();
  }
  // the ear on the far side
  const earBase = (side) => ({ x: lerp(side * 0.27 * (1 - turn * 0.18) + shift * 0.5, side * 0.2, tk), y: lerp(-0.5, -0.4, tk), a: lerp(side * 0.66, side * 1.25, tk) + (side < 0 ? p.earL : p.earR) * (1 - tk * 0.7) });
  const eA = earBase(-1), eB = earBase(1), earLen = lerp(0.29, 0.18, tk), earWid = lerp(0.24, 0.16, tk);
  ear(ctx, eA.x, eA.y, eA.a, earLen * 0.94, earWid, p, true);

  // body
  bodyPath(ctx, tk);
  if (ghost) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill(); }
  else {
    const g = ctx.createRadialGradient(-0.14, lerp(-0.3, -0.16, tk), 0.04, 0.02, lerp(-0.05, 0, tk), 0.78);
    g.addColorStop(0, COL.light); g.addColorStop(0.55, COL.body); g.addColorStop(1, COL.shade); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    // belly
    ell(ctx, shift * 0.6, lerp(0.22, 0.2, tk), lerp(0.3, 0.26, tk), lerp(0.25, 0.2, tk)); ctx.fillStyle = COL.belly; ctx.globalAlpha *= 0.85; ctx.fill(); ctx.globalAlpha /= 0.85;
    // the band: the bar of the theta
    const yT = lerp(-0.36, -0.2, tk), yB = lerp(-0.02, 0.1, tk), bow = lerp(0.045, 0.03, tk);
    const gb = ctx.createLinearGradient(0, yT, 0, yB); gb.addColorStop(0, COL.bandLight); gb.addColorStop(0.35, COL.band); gb.addColorStop(1, COL.bandDark);
    ctx.beginPath(); ctx.moveTo(-0.7, yT - bow); ctx.quadraticCurveTo(0, yT + bow * 1.6, 0.7, yT - bow); ctx.lineTo(0.7, yB - bow); ctx.quadraticCurveTo(0, yB + bow * 2.2, -0.7, yB - bow); ctx.closePath(); ctx.fillStyle = gb; ctx.fill();
    // soft shadow down the far side, to round the body
    const gs = ctx.createLinearGradient(-0.5, 0, 0.5, 0); gs.addColorStop(0, 'rgba(30,62,78,0.2)'); gs.addColorStop(0.3, 'rgba(30,62,78,0)'); gs.addColorStop(1, 'rgba(30,62,78,0)'); ctx.fillStyle = gs; ctx.fillRect(-0.7, -0.8, 1.4, 1.5);
    if (p.wet > 0.02) { ctx.fillStyle = `rgba(120,170,220,${0.18 * p.wet})`; ctx.fillRect(-0.7, -0.8, 1.4, 1.5); }
    // face
    const ey = (yT + yB) / 2 + 0.012, ex = 0.185;
    eye(ctx, -ex * (1 - turn * 0.22) + shift, ey, 1, p, true); eye(ctx, ex * (1 + turn * 0.05) + shift, ey, 1, p, false);
    ctx.fillStyle = COL.cheek; ctx.globalAlpha *= 0.55; ell(ctx, -0.29 + shift, yB + 0.075, 0.07, 0.045); ctx.fill(); ell(ctx, 0.31 + shift, yB + 0.075, 0.075, 0.048); ctx.fill(); ctx.globalAlpha /= 0.55;
    mouth(ctx, shift * 1.25, yB + 0.07, p);
    // the seed is kept safe in the fur: all that shows of it is a warm light low on the belly
    if (p.seed > 0) { const py = lerp(0.27, 0.24, tk), px = shift * 0.7; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gg = ctx.createRadialGradient(px, py, 0, px, py, 0.27); gg.addColorStop(0, `rgba(255,205,84,${0.55 * p.seed})`); gg.addColorStop(0.45, `rgba(255,205,84,${0.2 * p.seed})`); gg.addColorStop(1, 'rgba(255,205,84,0)'); ctx.fillStyle = gg; ctx.fillRect(px - 0.3, py - 0.3, 0.6, 0.6); ctx.restore(); }
    ctx.restore();
  }
  bodyPath(ctx, tk); ctx.strokeStyle = line; ctx.lineWidth = ghost ? 0.03 : 0.036; ctx.lineJoin = 'round'; ctx.stroke();
  if (!ghost) { // a rim of light along the upper edge
    ctx.save(); bodyPath(ctx, tk); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.arc(0.02, lerp(-0.06, 0, tk), lerp(0.56, 0.42, tk), 1.08 * Math.PI, 1.5 * Math.PI); ctx.stroke(); ctx.restore();
  }
  if (up > 0.05) { ctx.save(); ctx.globalAlpha *= clamp(up * 1.6, 0, 1); limb(fA, 0.14, 0.08, COL.foot); limb(fB, 0.15, 0.085, COL.foot); limb(hB, 0.062, 0.098, COL.body); ctx.restore(); }
  ear(ctx, eB.x, eB.y, eB.a, earLen, earWid, p, false);
  ctx.restore();
}

// ---- the rig: from what the body is doing to a pose ----
class Spring { constructor(k = 120, d = 12) { this.x = 0; this.v = 0; this.k = k; this.d = d; } step(target, dt) { const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n; for (let i = 0; i < n; i++) { this.v += ((target - this.x) * this.k - this.v * this.d) * h; this.x += this.v * h; } return this.x; } kick(v) { this.v += v; } }

export class Rig {
  constructor() {
    this.p = POSE(); this.sq = new Spring(260, 14); this.sq.x = 1; this.lean = new Spring(90, 14);
    this.earL = new Spring(70, 7); this.earR = new Spring(64, 6.4); this.tail = new Spring(80, 8);
    this.tuck = 0; this.run = 0; this.blinkT = 2; this.idle = 0; this.mood = null; this.moodT = 0; this.lookX = 0; this.lookY = 0; this.pvx = 0; this.pvy = 0; this.spin = 0; this.dizzy = 0; this.wind = 0; this.rain = 0; this.awake = false; this.head = 1; this.ax = 0; this.expr = 'smile'; this.exprT = 1;
  }
  feel(expr, secs = 1) { this.mood = expr; this.moodT = secs; }     // an expression that holds for a while: pride at the goal, a sulk after a fall
  update(b, dt, inp = {}) {
    // (for the animation the hero counts as on the ground through the few hundredths of a second it leaves it on a bump, so the pose does not flicker)
    const gnd = b.grounded || b.airT < 0.07, ease = (k) => 1 - Math.exp(-k * dt);
    const p = this.p, sp = Math.hypot(b.vx, b.vy), tx = b.ny, ty = -b.nx, vt = gnd ? b.vx * tx + b.vy * ty : b.vx;
    p.t += dt;
    // turning round goes through the front view: the features slide to the middle, the body mirrors there where nothing shows, and they slide out the other way
    this.head += clamp(b.face - this.head, -dt * 11, dt * 11); p.face = this.head >= 0 ? 1 : -1; p.side = Math.abs(this.head);
    const ball = b.mode === 'ball'; this.tuck += ((ball ? 1 : 0) - this.tuck) * ease(16); p.tuck = this.tuck;
    if (ball) { p.roll += b.w * dt; this.spin += Math.abs(b.w) * dt; } else { p.roll += (Math.round(p.roll / TAU) * TAU - p.roll) * ease(14); this.spin = Math.max(0, this.spin - dt * 20); }
    // what just happened
    for (const e of b.events) {
      if (e === 'jump') this.sq.kick(5.5);
      if (e === 'land') this.sq.kick(-clamp(b.impact * 0.55, 1.2, 9));
      if (e === 'splash') this.sq.kick(-3);
    }
    if (b.impact > 4 && ball) this.sq.kick(-clamp(b.impact * 0.3, 0, 6));
    // stretch with speed in the air; press flat when sliding
    const airStretch = gnd ? 0 : clamp(Math.abs(b.vy) * 0.012, 0, 0.2), want = 1 + airStretch - (b.mode === 'slide' ? 0.28 : 0) + (inp.tuck && !ball && gnd && b.mode !== 'slide' ? -0.12 : 0);
    p.sy = this.sq.step(want, dt);
    // lean: into the slope when standing on one, into the motion when running, along the path when in the air
    const slope = Math.atan2(-b.nx, b.ny); this.ax += ((b.vx - this.pvx) / Math.max(dt, 0.004) - this.ax) * ease(14); const ax = this.ax; this.pvx = b.vx; this.pvy = b.vy;
    let wantLean = 0;
    if (gnd) wantLean = slope * 0.75 + clamp(vt * 0.022, -0.3, 0.3) + clamp(ax * 0.0035, -0.25, 0.25) * (b.mode === 'run' ? 1 : 0);
    else wantLean = clamp(b.vx * 0.02, -0.4, 0.4) * (b.spread ? 2.2 : 1) - (b.spread ? 0 : clamp(b.vy * 0.012, -0.25, 0.25) * b.face);
    if (b.mode === 'slide') wantLean = slope + 1.15 * b.face;
    p.lean = this.lean.step(wantLean, dt);
    // legs
    const running = gnd && b.mode === 'run' && Math.abs(vt) > 0.4;
    this.run += Math.abs(vt) * dt * 2.3; p.run = this.run; p.runAmt += ((running ? clamp(Math.abs(vt) / 4, 0.3, 1) : 0) - p.runAmt) * ease(12);
    const airT = gnd || b.inWater > 0.3 ? 0 : clamp(b.vy / 8, -1, 1); p.air += (airT - p.air) * ease(14);
    p.spread += ((b.spread ? 1 : 0) - p.spread) * ease(12);
    p.slide += ((b.mode === 'slide' ? 1 : 0) - p.slide) * ease(12);
    this.turnT = (this.turnT ?? 0.5) + ((Math.abs(vt) > 0.3 || !gnd ? 0.9 : 0.35) - (this.turnT ?? 0.5)) * ease(6); p.turn = this.turnT * p.side;
    // ears and tail trail behind whatever the body does, and answer the air as it passes, wind included
    const drag = clamp(-(b.vx - this.wind) * b.face * 0.03, -0.9, 0.9), lift = clamp(b.vy * 0.035, -0.6, 0.6);
    p.earL = this.earL.step(-drag * 0.9 * b.face - lift * 0.5 - 0.1 * Math.sin(p.t * 1.7), dt) * b.face; p.earR = this.earR.step(-drag * b.face + lift * 0.5 + 0.08 * Math.sin(p.t * 1.3 + 1), dt) * b.face;
    if (!gnd && this.earL) { this.earL.kick(0); }
    p.tail = this.tail.step(clamp(b.vy * 0.05, -0.8, 0.8) + Math.sin(p.t * (running ? 14 : 2.2)) * (running ? 0.3 : 0.12), dt);
    // eyes
    this.blinkT -= dt; if (this.blinkT < 0) this.blinkT = 2.2 + Math.random() * 3.2; p.blink = this.blinkT < 0.13 ? 1 : 0;
    const still = gnd && sp < 0.2; this.idle = still ? this.idle + dt : 0;
    const lx = still ? Math.sin(p.t * 0.6) * (this.idle > 3 ? 0.9 : 0.2) : clamp(b.vx * 0.12 * b.face, -1, 1), ly = still ? 0 : clamp(-b.vy * 0.08, -1, 1);
    this.lookX += (lx - this.lookX) * ease(6); this.lookY += (ly - this.lookY) * ease(6); p.lookX = this.lookX; p.lookY = this.lookY;
    // the face
    this.moodT -= dt; this.dizzy = Math.max(0, this.dizzy - dt);
    let e = 'smile';
    if (this.idle > 14 && !this.awake) { e = 'sleepy'; p.lid += (1 - p.lid) * dt * 0.6; } else { p.lid += (0 - p.lid) * ease(8); }
    if (ball) e = sp > 9 ? 'glee' : 'smile';
    else if (b.mode === 'slide') e = 'glee';
    else if (!gnd) e = b.spread ? 'effort' : b.vy > 2 ? 'joy' : b.vy < -16 ? 'wow' : b.vy < -6 ? 'worry' : 'joy';
    else if (running) e = Math.abs(vt) > 7 ? 'joy' : 'smile';
    if (b.impact > 12) this.feel('squint', 0.45);
    if (this.dizzy > 0) e = 'dizzy';
    if (this.moodT > 0 && this.mood) e = this.mood;
    // a face holds for a moment before it changes, so that it never flickers between two looks
    this.exprT += dt; if (e !== this.expr && (this.exprT > 0.14 || this.moodT > 0 || e === 'squint')) { this.expr = e; this.exprT = 0; } e = this.expr;
    p.expr = e; p.wet += ((b.inWater > 0.2 || this.rain > 0.3 ? 1 : 0) - p.wet) * Math.min(1, dt * (b.inWater > 0.2 ? 6 : 0.4));
    return p;
  }
}
