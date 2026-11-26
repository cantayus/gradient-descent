// Ground that answers a hard landing. It was first made for a geyser in Iceland, and the same thing is now the Dovecotes at the foot of Cappadocia:
// thin roofs over the rooms where the pigeons live. Land hard and they take fright; frighten them enough and the whole flock comes up at once,
// carries the hero up with it, and lets go. What follows describes the geyser; for `doves` read roof for crust and pigeons for water.
// The Geyser, at the foot of Iceland. Parts of the ground there are a thin crust over boiling water ("drum" ground).
// Every hard landing on the crust drives the pressure under it up; it leaks away again in a few seconds. Let it fill, and the crust gives way under
// the hero in a column of water that carries them up and holds them there until it is spent. Nothing is lost but time, and the cure is the lesson of the
// world: on steep ground take small steps. The crust then needs a while to fill again, as a real geyser does between eruptions.
export class Geyser {
  constructor(level, T, kind = 'geyser') { this.kind = kind; this.T = T; this.drums = level.zones.filter((z) => z.kind === 'drum'); this.p = 0; this.spent = 0; this.jet = null; this.count = 0; this.thump = 0; this.events = []; }
  on(x) { return this.drums.some((d) => x >= d.x0 && x <= d.x1); }
  // once per physics step, after the body has moved
  step(b, dt) {
    this.events.length = 0; this.spent = Math.max(0, this.spent - dt); this.thump = Math.max(0, this.thump - dt * 3);
    this.p = Math.max(0, this.p - dt * 0.1);
    if (this.jet && b.t > this.jet.end) { const i = this.T.jets.indexOf(this.jet); if (i >= 0) this.T.jets.splice(i, 1); this.jet = null; }
    if (this.spent > 0 || !this.on(b.x)) return;
    for (const e of b.events) if (e === 'land' && b.impact > 8) { this.p += (b.impact - 8) * 0.07; this.thump = 1; this.events.push('thump'); }
    if (this.p >= 1) { // the crust breaks where the hero stands
      const t0 = b.t, len = 2.6; this.jet = { x: b.x, w: 2.6, top: 11, v: 19, grip: 7, raw: true, flock: this.kind === 'doves', end: t0 + len, on: (t) => { const u = (t - t0) / len; return u < 0 || u > 1 ? 0 : Math.min(1, u * 9) * Math.min(1, (1 - u) * 4); } };
      this.T.jets.push(this.jet); this.p = 0; this.spent = 7; this.count++; this.events.push('erupt');
    }
  }
  // cracks in the crust, drawn over the ground: dark when the crust is spent, and filling with bright water as the pressure comes up
  draw(ctx, x0, x1, t, hot) {
    const T = this.T, lvl = this.spent > 0 ? 0 : this.p;
    if (this.kind === 'doves') return this.holes(ctx, x0, x1, t, lvl);
    for (const d of this.drums) { if (d.x1 < x0 || d.x0 > x1) continue;
      for (let x = Math.ceil(d.x0 / 0.9) * 0.9; x < d.x1; x += 0.9) { const k = Math.round(x / 0.9), r = (n) => { const v = Math.sin(k * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); }, cx = x + (r(1) - 0.5) * 0.5; if (Math.abs(T.dh(cx)) > 1.2) continue; const y = -T.h(cx);
        ctx.beginPath(); ctx.moveTo(cx, y + 0.02); let px = cx, py = y; for (let i = 1; i <= 3; i++) { px += (r(i + 2) - 0.5) * 0.34; py += 0.14 + r(i + 6) * 0.16; ctx.lineTo(px, py); }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(30,22,28,0.55)'; ctx.lineWidth = 0.075; ctx.stroke();
        if (lvl > 0.04) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hot; ctx.globalAlpha = Math.min(1, lvl * (0.75 + 0.25 * Math.sin(t * (4 + lvl * 14) + k))); ctx.lineWidth = 0.045 + lvl * 0.05; ctx.stroke(); ctx.restore(); } } }
  }
  // the pigeonholes, cut in a row under the roof, each with its painted frame. The more frightened the birds, the more heads at the doors
  holes(ctx, x0, x1, t, lvl) {
    const T = this.T, gone = this.spent > 0;
    for (const d of this.drums) { if (d.x1 < x0 || d.x0 > x1) continue;
      for (let x = Math.ceil((d.x0 + 0.4) / 1.3) * 1.3; x < d.x1 - 0.4; x += 1.3) { if (Math.abs(T.dh(x)) > 0.5) continue; const k = Math.round(x / 1.3), r = (n) => { const v = Math.sin(k * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); }, y = -T.h(x) + 0.36;
        ctx.fillStyle = 'rgba(255,246,226,0.9)'; ctx.beginPath(); ctx.moveTo(x - 0.27, y + 0.5); ctx.lineTo(x - 0.27, y + 0.14); ctx.arc(x, y + 0.14, 0.27, Math.PI, 0); ctx.lineTo(x + 0.27, y + 0.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2b1d22'; ctx.beginPath(); ctx.moveTo(x - 0.19, y + 0.46); ctx.lineTo(x - 0.19, y + 0.15); ctx.arc(x, y + 0.15, 0.19, Math.PI, 0); ctx.lineTo(x + 0.19, y + 0.46); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c0553a'; ctx.fillRect(x - 0.33, y + 0.47, 0.66, 0.05);
        if (!gone && lvl > 0.06 + r(1) * 0.75) { // somebody is looking out
          const bob = Math.sin(t * (5 + lvl * 9) + k * 1.7) * 0.02 * (0.4 + lvl), side = r(2) > 0.5 ? 1 : -1, hx = x + side * 0.02, hy = y + 0.29 + bob;
          ctx.fillStyle = '#aeb8c8'; ctx.beginPath(); ctx.ellipse(hx, hy + 0.13, 0.13, 0.11, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#c9d2de'; ctx.beginPath(); ctx.arc(hx, hy, 0.085, 0, 7); ctx.fill();
          ctx.fillStyle = '#f0a860'; ctx.beginPath(); ctx.moveTo(hx + side * 0.07, hy - 0.015); ctx.lineTo(hx + side * 0.15, hy + 0.02); ctx.lineTo(hx + side * 0.07, hy + 0.04); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#231a22'; ctx.beginPath(); ctx.arc(hx + side * 0.03, hy - 0.015, 0.02 + lvl * 0.008, 0, 7); ctx.fill(); } } }
  }
}
