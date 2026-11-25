// A balloon ride. A basket stands on the ground; when the hero stands still in it the balloon lifts, crosses to another place and sets them down:
// a new start, which is the lesson. The path is fixed, so the ride is the same every time, and it is the same code for the game and for the tests.
const sm = (t) => t * t * (3 - 2 * t);
export class Rides {
  constructor(level, T) { this.list = (level.rides || []).map((r) => ({ ...r, y: T.h(r.x), y1: T.h(r.x1), t: -1, done: false, bx: r.x, by: T.h(r.x) })); this.on = null; this.events = []; }
  // once per physics step. Returns true while the hero is being carried (the caller then skips the ordinary step).
  step(b, dt) {
    this.events.length = 0;
    if (!this.on) { for (const r of this.list) if (!r.done && b.grounded && Math.abs(b.x - r.x) < 0.85 && Math.abs(b.vx) < 2.5) { this.on = r; r.t = 0; r.T = 4.5 + Math.abs(r.x1 - r.x) / 11; this.events.push('lift'); break; } if (!this.on) return false; }
    const r = this.on; r.t += dt; const u = Math.min(1, r.t / r.T), e = sm(u), px = b.x, py = b.y;
    r.bx = r.x + (r.x1 - r.x) * e; r.by = r.y + (r.y1 - r.y) * e + r.up * Math.sin(Math.PI * u) ** 1.2;
    b.x = r.bx; b.y = r.by + b.r + 0.12; b.vx = (b.x - px) / dt; b.vy = (b.y - py) / dt; b.w = 0; b.mode = 'run'; b.grounded = true; b.nx = 0; b.ny = 1; b.t += dt; b.airT = 0;
    if (u >= 1) { r.done = true; this.on = null; b.vx = b.vy = 0; this.events.push('down'); }
    return true;
  }
}
