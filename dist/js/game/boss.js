// The Geyser, at the foot of Iceland. Parts of the ground there are a thin crust over boiling water ("drum" ground).
// Every hard landing on the crust drives the pressure under it up; it leaks away again in a few seconds. Let it fill, and the crust gives way under
// the hero in a column of water that carries them up and holds them there until it is spent. Nothing is lost but time, and the cure is the lesson of the
// world: on steep ground take small steps. The crust then needs a while to fill again, as a real geyser does between eruptions.
export class Geyser {
  constructor(level, T) { this.T = T; this.drums = level.zones.filter((z) => z.kind === 'drum'); this.p = 0; this.spent = 0; this.jet = null; this.count = 0; this.thump = 0; this.events = []; }
  on(x) { return this.drums.some((d) => x >= d.x0 && x <= d.x1); }
  // once per physics step, after the body has moved
  step(b, dt) {
    this.events.length = 0; this.spent = Math.max(0, this.spent - dt); this.thump = Math.max(0, this.thump - dt * 3);
    this.p = Math.max(0, this.p - dt * 0.1);
    if (this.jet && b.t > this.jet.end) { const i = this.T.jets.indexOf(this.jet); if (i >= 0) this.T.jets.splice(i, 1); this.jet = null; }
    if (this.spent > 0 || !this.on(b.x)) return;
    for (const e of b.events) if (e === 'land' && b.impact > 8) { this.p += (b.impact - 8) * 0.07; this.thump = 1; this.events.push('thump'); }
    if (this.p >= 1) { // the crust breaks where the hero stands
      const t0 = b.t, len = 2.6; this.jet = { x: b.x, w: 2.6, top: 11, v: 19, grip: 7, raw: true, end: t0 + len, on: (t) => { const u = (t - t0) / len; return u < 0 || u > 1 ? 0 : Math.min(1, u * 9) * Math.min(1, (1 - u) * 4); } };
      this.T.jets.push(this.jet); this.p = 0; this.spent = 7; this.count++; this.events.push('erupt');
    }
  }
  // cracks in the crust, drawn over the ground: dark when the crust is spent, and filling with bright water as the pressure comes up
  draw(ctx, x0, x1, t, hot) {
    const T = this.T, lvl = this.spent > 0 ? 0 : this.p;
    for (const d of this.drums) { if (d.x1 < x0 || d.x0 > x1) continue;
      for (let x = Math.ceil(d.x0 / 0.9) * 0.9; x < d.x1; x += 0.9) { const k = Math.round(x / 0.9), r = (n) => { const v = Math.sin(k * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); }, cx = x + (r(1) - 0.5) * 0.5; if (Math.abs(T.dh(cx)) > 1.2) continue; const y = -T.h(cx);
        ctx.beginPath(); ctx.moveTo(cx, y + 0.02); let px = cx, py = y; for (let i = 1; i <= 3; i++) { px += (r(i + 2) - 0.5) * 0.34; py += 0.14 + r(i + 6) * 0.16; ctx.lineTo(px, py); }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(30,22,28,0.55)'; ctx.lineWidth = 0.075; ctx.stroke();
        if (lvl > 0.04) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hot; ctx.globalAlpha = Math.min(1, lvl * (0.75 + 0.25 * Math.sin(t * (4 + lvl * 14) + k))); ctx.lineWidth = 0.045 + lvl * 0.05; ctx.stroke(); ctx.restore(); } } }
  }
}
