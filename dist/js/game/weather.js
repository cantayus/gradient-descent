// The weather of one place at one hour: wind, cloud, rain or snow, fog. Everything here is a plain function of time,
// so a level has the same weather on every run, a ghost meets the same wind the player does, and the tests can run it without a screen.
// The wind is real to the body: air drag in physics.js is taken against the moving air, so a float drifts downwind and a leap into a gust falls a little short.
const hash = (n, s) => { const x = Math.sin(n * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
const vn = (x, s) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i, s) * (1 - u) + hash(i + 1, s) * u; };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const num = (str) => { let h = 7; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; };

// What a place is like. wind and gust in units a second; wet: how often it rains (0 never, 1 nearly always); cold: 0 rain, 1 snow;
// fog: how much fog drifts through; clear: the most cloud allowed (for nights that must show their sky); storm: thunder far off.
const PLAIN = { wind: 1.6, gust: 1.5, wet: 0.5, cold: 0, fog: 0.25, clear: 1, storm: 0, lean: 0.2 };

export class Weather {
  constructor(seed, clim = {}) { this.s = num(seed); this.c = { ...PLAIN, ...clim }; this.t = 0; this.wetness = 0; this.bow = 0; this.flash = 0; this.next = 0; this.set(0, 0); }
  // the slow front: 0 fair, 1 foul
  // (a level opens in fair weather, so that its hour is seen first, and turns as the run goes on; a place marked `early` is in its weather from the start)
  front(t) { const s = this.s; return vn(t / 34 + 3.3, s) * 0.62 + vn(t / 11, s + 1) * 0.2 + this.c.wet * 0.5 - 0.12 - (this.c.early ? 0 : 0.45 * (1 - sm(6, 24, t))); }
  windAt(t) { const s = this.s, c = this.c, f = this.front(t), base = (vn(t / 21, s + 2) - 0.5 + c.lean) * 2 * c.wind * (0.7 + 0.6 * f), g = Math.max(0, vn(t / 2.7, s + 3) - 0.56) * 2.3 * c.gust * (0.5 + f); return base + Math.sign(base || 1) * g; }
  gustAt(t) { return Math.max(0, vn(t / 2.7, this.s + 3) - 0.56) * 2.3; }
  set(t, dt = 0) {
    const c = this.c, f = this.front(t); this.t = t;
    this.cover = Math.min(c.clear, sm(0.22, 0.8, f)); this.rain = c.wet <= 0 ? 0 : sm(0.66, 0.92, f) * Math.min(1, c.clear + 0.3); this.fog = Math.min(1, c.fog * (0.45 + 0.9 * vn(t / 47 + 9, this.s + 5)) + this.rain * 0.18);
    this.wind = this.windAt(t); this.gust = this.gustAt(t); this.cold = c.cold;
    // the ground takes a few seconds to get wet and much longer to dry; a bow needs wet air, thinning cloud and the sun behind you
    this.wetness += ((this.rain > 0.05 ? 1 : 0) - this.wetness) * Math.min(1, dt / (this.rain > 0.05 ? 5 : 28));
    this.bow += ((this.wetness > 0.25 && this.rain < 0.12 && this.cover < 0.75 ? 1 : 0) - this.bow) * Math.min(1, dt / 4);
    if (c.storm && this.rain > 0.55) { this.next -= dt; if (this.next <= 0) { this.flash = 1; this.next = 5 + hash(Math.floor(t), this.s) * 14 / c.storm; this.thunder = true; } } this.flash = Math.max(0, this.flash - dt * 3.5);
    return this;
  }
}
