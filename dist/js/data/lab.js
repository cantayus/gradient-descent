// The lab: gradient descent by the real rule, on a hill in one dimension. Nothing here is steered by hand.
//   g ← the slope of the loss at θ, plus noise if any, held within the limit if there is one
//   v ← μ · v − η · g
//   θ ← θ + v
// With μ = 0 that is plain gradient descent: θ ← θ − η · g.
const bump = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
export const LAND = {
  bowl: { name: 'A wide bowl', start: 1, f: (x) => 0.16 * (x - 6.5) ** 2 },
  narrow: { name: 'A narrow valley', start: 4.2, f: (x) => 1.5 * (x - 6) ** 2 },
  hollow: { name: 'A hollow on the way', start: 0.5, f: (x) => 3.6 - 0.9 * bump(x, 2.5, 1) - 3.3 * bump(x, 7.5, 1.7) + 0.06 * (x - 5.5) ** 2 },
  rough: { name: 'Rough ground', start: 0.8, f: (x) => 0.14 * (x - 6.5) ** 2 + 0.22 * Math.sin(5 * x) + 0.22 },
  flat: { name: 'A long flat', start: 0.8, f: (x) => 2.6 / (1 + Math.exp((x - 6.8) / 0.35)) + 0.05 * (x - 8.4) ** 2 * (x > 6.8 ? 1 : 0) + 0.03 * Math.max(0, 6.8 - x) },
  ravine: { name: 'A steep ravine', start: 1.5, f: (x) => 1.2 * Math.sqrt((x - 6) ** 2 + 0.02) },
  cliff: { name: 'A wall and a floor', start: 2.6, f: (x) => 0.03 * (x - 6.5) ** 4 },
};
export const slope = (f, x) => (f(x + 1e-4) - f(x - 1e-4)) / 2e-4;
// One step of the rule. `noise` is a number drawn by the caller (a standard normal), so that a run can be repeated exactly.
export function stepRule(s, land, { eta, mu = 0, sigma = 0, limit = 0 }, noise = 0) {
  let g = slope(land.f, s.theta) + sigma * noise; if (limit > 0) g = Math.max(-limit, Math.min(limit, g));
  const v = mu * s.v - eta * g, theta = s.theta + v; return { theta, v, g, loss: land.f(theta), n: s.n + 1 };
}
// Run it until it settles, leaves the picture, or uses up its steps. Returns the path and how it ended.
export function runRule(land, o, { steps = 150, start = land.start, rand = () => 0 } = {}) {
  let s = { theta: start, v: 0, g: 0, loss: land.f(start), n: 0 }; const path = [s]; let still = 0;
  while (s.n < steps) { s = stepRule(s, land, o, rand()); path.push(s);
    if (!(Math.abs(s.theta) < 60) || s.loss > 400) return { path, end: 'left' };
    still = Math.abs(s.v) < 2e-3 && Math.abs(slope(land.f, s.theta)) < 0.05 ? still + 1 : 0; if (still >= 4 && !o.sigma) return { path, end: 'settled' }; }
  return { path, end: o.sigma ? 'noisy' : 'moving' };
}
// Each boss again, as numbers: what went wrong there, and the one thing to change.
export const PRESETS = [
  { name: 'The Dovecotes', land: 'narrow', eta: 0.72, mu: 0, sigma: 0, limit: 0, say: 'The step is too long for this valley. Each one lands higher on the far wall than the last. Bring η down to 0.3 and run it again.' },
  { name: 'The Craters', land: 'hollow', eta: 0.3, mu: 0, sigma: 0, limit: 0, say: 'Without momentum Theta comes to rest in the first hollow, which is not the lowest. Raise μ to 0.9 and run it again.' },
  { name: 'The Tide', land: 'rough', eta: 0.05, mu: 0, sigma: 0, limit: 0, say: 'Every ripple in this ground is a place to get stuck. Raise the noise to 3 and the shaking carries Theta from one to the next, lower each time.' },
  { name: 'The Long Flat', land: 'flat', eta: 0.3, mu: 0, sigma: 0, limit: 0, say: 'Almost no slope, so almost no step. Raise μ to 0.9, and the little steps add up until the flat is crossed.' },
  { name: 'The Thousand Pillars', land: 'ravine', eta: 0.6, mu: 0, sigma: 0, limit: 0, say: 'The walls are steep right down to the floor, so every step crosses it and lands on the other side. Bring η down to 0.05 and watch it settle.' },
  { name: 'The Towers', land: 'cliff', eta: 1.2, mu: 0, sigma: 0, limit: 0, say: 'High on the wall the slope is enormous, and so is the step it calls for. Set the limit to 3 and run it again.' },
];
