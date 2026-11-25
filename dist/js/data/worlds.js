// The worlds and their levels. A level is a list of strokes (see js/game/level.js); lengths and heights are in units, one unit about the hero's height.
// `can` says what the hero has learned by then. `time` is the hour the level is painted in. `card` is the notebook page it opens.
// `par` is the time a good first run takes; the medal times are set from it (see medals()).
import { iceland } from '../art/worlds/iceland.js';
import { cappadocia } from '../art/worlds/cappadocia.js';
import { galapagos } from '../art/worlds/galapagos.js';
import { namib } from '../art/worlds/namib.js';

const m = 'meadow', g = 'grass';
const ICE = [
  { id: '1-1', name: 'First Light', time: 'dawn', card: 'loss', par: 33, intro: true,
    strokes: [['flat', 10, { mark: 'hint', text: 'move' }], ['slope', 36, -9, { zone: 'sand', seeds: 3 }], ['flat', 9, { zone: 'moss', mark: 'hint', text: 'jump' }], ['steps', 8, 2, 1, { zone: 'moss' }], ['slope', 30, -11, { zone: 'moss', seeds: 3 }],
      ['valley', 16, 2.2, -2, { zone: 'moss' }], ['hill', 12, 1.6, -1, { zone: 'sand' }], ['flat', 8, { zone: 'snow', surf: 'snow', mark: 'hint', text: 'slide' }], ['slope', 46, -18, { surf: 'ice', zone: 'ice', seeds: 4 }], ['flat', 12, { zone: 'snow', surf: 'snow' }],
      ['steps', 24, 4, -1.6, { zone: 'basalt' }], ['slope', 34, -12, { zone: m, surf: g, seeds: 3 }], ['waves', 30, 1.1, 3, -5, { zone: m, surf: g }], ['slope', 26, -9, { zone: 'sand' }], ['bowl', 20, 4, 3.5, { zone: m, surf: g }]] },
  { id: '1-2', name: 'The Slope Knows', time: 'day', card: 'gradient', par: 38,
    strokes: [['flat', 8], ['slope', 24, -4, { zone: m, surf: g, seeds: 2 }], ['slope', 26, -14, { zone: m, surf: g, seeds: 3 }], ['flat', 9, { zone: 'sand' }], ['gap', 4], ['flat', 8, { zone: 'sand', seeds: [{ at: 0.5 }] }], ['gap', 5], ['flat', 10, { zone: 'rock' }],
      ['slope', 22, -5, { surf: 'ice', zone: 'ice', seeds: 2 }], ['slope', 30, -19, { surf: 'ice', zone: 'ice', seeds: 3 }], ['kicker', 7, 1.6, { surf: 'ice', zone: 'ice' }], ['gap', 7, -4], ['flat', 12, { zone: 'snow', surf: 'snow', seeds: 2 }], ['slope', 30, -8, { zone: 'snow', surf: 'snow' }],
      ['valley', 24, 3, 0, { zone: 'hot', water: [0.2, 0.8, -1.3], hot: true, plat: [{ at: 0.36, up: -0.9, w: 2.6 }, { at: 0.64, up: -0.9, w: 2.6 }], seeds: [{ at: 0.36, up: 0.6 }, { at: 0.64, up: 0.6 }] }],
      ['flat', 10, { zone: 'hot', jets: [{ at: 0.84, top: 10, v: 18, w: 1.6 }], mark: 'hint', text: 'jet', at: 0.2 }], ['line', 2.5, 5.5, { zone: 'rock' }], ['flat', 12, { zone: 'moss', seeds: 2 }], ['slope', 40, -21, { zone: 'moss', seeds: 4 }],
      ['waves', 28, 1.4, 3, -6, { zone: m, surf: g }], ['bowl', 20, 4.5, 3.5, { zone: m, surf: g }]] },
  { id: '1-3', name: 'Short Steps, Long Steps', time: 'golden', card: 'rate', par: 44,
    strokes: [['flat', 8], ['slope', 22, -7, { zone: 'sand', seeds: 2 }], ['flat', 5, { zone: 'basalt' }], ['gap', 2.4], ['flat', 3, { zone: 'basalt', seeds: [{ at: 0.5 }] }], ['gap', 2.4], ['flat', 3, { zone: 'basalt' }], ['gap', 2.4], ['flat', 3, { zone: 'basalt', seeds: [{ at: 0.5 }] }], ['gap', 2.4], ['flat', 8, { zone: 'basalt' }],
      ['slope', 26, -9, { zone: 'moss', seeds: 3 }], ['flat', 10, { zone: 'sand' }], ['gap', 6.5], ['flat', 12, { zone: 'sand', seeds: 1 }], ['gap', 7], ['flat', 10, { zone: m, surf: g }],
      ['steps', 15, 5, -1.3, { zone: 'basalt', seeds: 5 }], ['gap', 3, -1], ['steps', 12, 4, -1.3, { zone: 'basalt' }], ['flat', 8, { zone: 'moss' }],
      ['slope', 34, -15, { surf: 'ice', zone: 'ice', seeds: 3 }], ['kicker', 8, 2, { surf: 'ice', zone: 'ice' }], ['gap', 9, -6, { plat: [{ at: 0.5, up: -3.2, w: 3 }] }], ['flat', 12, { zone: 'snow', surf: 'snow', seeds: 2 }],
      ['slope', 28, -10, { zone: m, surf: g, seeds: 3 }], ['flat', 14, { zone: m, surf: g }], ['gap', 2.6], ['flat', 3.4, { zone: 'basalt', seeds: [{ at: 0.5 }] }], ['gap', 6], ['flat', 4, { zone: 'basalt' }], ['gap', 2.6], ['flat', 10, { zone: m, surf: g }],
      ['slope', 30, -12, { zone: m, surf: g, seeds: 3 }], ['bowl', 18, 4, 3.5, { zone: m, surf: g }]] },
  { id: '1-4', name: 'Overshoot', time: 'mist', card: 'overshoot', par: 46,
    strokes: [['flat', 8, { zone: 'snow', surf: 'snow' }], ['slope', 30, -14, { surf: 'ice', zone: 'ice', seeds: 3 }], ['valley', 9, 3.2, 0.5, { zone: 'snow', surf: 'snow', seeds: [{ at: 0.5, up: 0.9 }] }], ['flat', 7, { zone: 'snow', surf: 'snow' }], ['gap', 3.2], ['flat', 9, { zone: 'rock' }],
      ['slope', 26, -13, { surf: 'ice', zone: 'ice', seeds: 2 }], ['valley', 8, 3.6, 1, { zone: 'hot', seeds: [{ at: 0.5, up: 0.9 }] }], ['hill', 9, 1.2, -1, { zone: 'rock' }], ['valley', 8, 3.4, 0, { zone: 'hot', seeds: [{ at: 0.5, up: 0.9 }] }], ['flat', 8, { zone: 'rock' }],
      ['slope', 20, -8, { zone: 'sand', seeds: 2 }], ['flat', 10, { zone: 'hot', jets: [{ at: 0.84, top: 11, v: 19, every: 3.6, len: 2, w: 1.6 }] }], ['line', 2.5, 6, { zone: 'rock' }], ['flat', 9, { zone: 'moss', seeds: 1 }], ['gap', 4.5], ['flat', 3.2, { zone: 'basalt', seeds: [{ at: 0.5 }] }], ['gap', 4.5], ['flat', 9, { zone: 'moss' }],
      ['slope', 36, -20, { surf: 'ice', zone: 'ice', seeds: 4 }], ['valley', 12, 4, 2, { zone: 'snow', surf: 'snow', seeds: [{ at: 0.45, up: 0.9 }] }], ['flat', 6, { zone: 'snow', surf: 'snow' }], ['gap', 5, -2], ['flat', 10, { zone: 'snow', surf: 'snow' }],
      ['slope', 30, -12, { zone: 'snow', surf: 'snow', seeds: 3 }], ['valley', 20, 2.6, 0, { zone: 'hot', water: [0.22, 0.78, -1.1], hot: true, plat: [{ at: 0.5, up: -0.8, w: 3 }], seeds: [{ at: 0.5, up: 0.7 }] }],
      ['slope', 26, -11, { zone: 'moss', seeds: 3 }], ['bowl', 12, 4.2, 4, { zone: 'moss' }]] },
  { id: '1-5', name: 'Under the Lights', time: 'night', card: 'descent', par: 62,
    strokes: [['flat', 10, { zone: 'snow', surf: 'snow' }], ['slope', 40, -16, { zone: 'snow', surf: 'snow', seeds: 4 }], ['waves', 30, 1.3, 3, -5, { surf: 'ice', zone: 'ice', seeds: 3 }], ['kicker', 7, 1.8, { surf: 'ice', zone: 'ice' }], ['gap', 8, -5], ['flat', 12, { zone: 'snow', surf: 'snow', seeds: 2 }],
      ['steps', 20, 5, -1.4, { zone: 'basalt', seeds: 5 }], ['flat', 6, { zone: 'basalt' }], ['gap', 2.6], ['flat', 3, { zone: 'basalt' }], ['gap', 2.6], ['flat', 3, { zone: 'basalt', seeds: [{ at: 0.5 }] }], ['gap', 6], ['flat', 9, { zone: 'moss' }],
      ['slope', 30, -13, { zone: 'moss', seeds: 3 }], ['valley', 26, 3, 0, { zone: 'hot', water: [0.18, 0.82, -1.2], hot: true, plat: [{ at: 0.32, up: -0.85, w: 2.4 }, { at: 0.5, up: -0.85, w: 2.4, bob: { amp: 0.25, per: 3 } }, { at: 0.68, up: -0.85, w: 2.4 }], seeds: [{ at: 0.32, up: 0.7 }, { at: 0.5, up: 0.9 }, { at: 0.68, up: 0.7 }] }],
      ['flat', 10, { zone: 'hot', jets: [{ at: 0.84, top: 12, v: 20, w: 1.6 }] }], ['line', 2.5, 7.5, { zone: 'rock' }], ['flat', 10, { zone: 'snow', surf: 'snow', seeds: 2 }],
      ['slope', 50, -27, { surf: 'ice', zone: 'ice', seeds: 5 }], ['valley', 14, 3.6, 1.5, { zone: 'snow', surf: 'snow', seeds: [{ at: 0.48, up: 0.9 }] }], ['flat', 8, { zone: 'snow', surf: 'snow' }], ['gap', 4.5], ['flat', 8, { zone: 'rock' }],
      ['slope', 26, -10, { zone: m, surf: g, seeds: 3 }], ['flat', 7, { zone: 'hot', jets: [{ at: 0.3, top: 8, v: 17, every: 3, len: 1.4 }, { at: 0.8, top: 8, v: 17, every: 3, phase: 1.5, len: 1.4 }] }],
      ['slope', 34, -14, { zone: m, surf: g, seeds: 4 }], ['waves', 26, 1.2, 3, -4, { zone: m, surf: g }], ['bowl', 18, 4.5, 4, { zone: m, surf: g }]] },
  { id: '1-B', name: 'The Geyser', time: 'dusk', boss: 'geyser', par: 31, music: 'boss',
    strokes: [['flat', 10, { zone: 'hot' }], ['slope', 20, -7, { zone: 'hot', seeds: 2 }],
      ['steps', 21, 3, -2, { zone: 'drum', seeds: 3 }], ['flat', 8, { zone: 'hot' }], ['gap', 3], ['flat', 7, { zone: 'hot', seeds: [{ at: 0.5 }] }], ['gap', 3], ['flat', 8, { zone: 'hot' }],
      ['steps', 28, 4, -2, { zone: 'drum', seeds: 4 }], ['slope', 18, -6, { zone: 'hot' }], ['flat', 5, { zone: 'hot' }], ['gap', 2.6], ['flat', 3, { zone: 'hot' }], ['gap', 2.6], ['flat', 3, { zone: 'hot', seeds: [{ at: 0.5 }] }], ['gap', 2.6], ['flat', 8, { zone: 'hot' }],
      ['steps', 30, 5, -1.8, { zone: 'drum', seeds: 5 }], ['slope', 24, -9, { zone: 'hot', seeds: 2 }], ['bowl', 11, 3.5, 5, { zone: 'hot' }]] },
];

// ---- Cappadocia: rolling, hollows, and where you start ----
// A hollow: a long way in (gentle enough to walk back up), a short floor, and a rim too steep to walk and too high to jump. Speed is the only way over.
const T2 = 'tuff', R2 = 'rose', H2 = 'honey', V2 = 'vine', D2 = 'dust';
const hollow = (inL, inD, rimL, rimH, o = {}, seeds = 3) => [['slope', inL, -inD, { ...o, seeds }], ['flat', 3, o], ['line', rimL, rimH, o]];
// Building blocks. After a rim the ball is in the air, so the ground beyond it is always long and level: no pit is ever hidden behind a rim.
const run = (L, dy, zone, seeds = 3, surf) => ['slope', L, dy, { zone, seeds, ...(surf ? { surf } : {}) }];
const land = (zone, L = 16, seeds = 2) => ['flat', L, { zone, seeds }];
const dustFlat = (L = 12) => ['flat', L, { zone: D2, surf: 'sand' }];      // deep dust takes the speed out of a roll: a place to slow down
const CAP = [
  { id: '2-1', name: 'A Running Start', time: 'dawn', card: 'momentum', par: 35,
    strokes: [['flat', 10, { zone: D2, mark: 'hint', text: 'roll' }], run(34, -11, V2, 4, g), ['flat', 6, { zone: D2 }], ['line', 3.4, 1.7, { zone: T2 }], land(T2), run(24, -8, R2), ...hollow(26, 9, 3, 2.8, { zone: R2 }), land(R2),
      run(36, -13, H2, 4), ['waves', 32, 1.2, 3, -6, { zone: T2, seeds: 3 }], dustFlat(), run(28, -9, V2, 3, g), ...hollow(26, 10, 3.2, 3.2, { zone: V2, surf: g }), land(D2), run(30, -10, T2), ['hill', 14, 1.6, -1, { zone: R2 }],
      run(34, -12, R2, 4), ...hollow(24, 9, 3.2, 3.4, { zone: H2 }), land(H2), ['waves', 30, 1.1, 3, -5, { zone: V2, surf: g, seeds: 3 }], dustFlat(10), run(30, -10, T2), ['flat', 10, { zone: V2, surf: g }], ['bowl', 22, 4, 4, { zone: V2, surf: g }]] },
  { id: '2-2', name: 'The Hollow', time: 'day', card: 'local', par: 42,
    strokes: [['flat', 9, { zone: T2 }], run(20, -6, T2, 2), ['flat', 7, { zone: D2, mark: 'hint', text: 'rim', at: 0.4 }], ['line', 2.8, 3, { zone: H2 }], land(H2), ...hollow(30, 12, 3.2, 3.6, { zone: R2 }, 4), land(R2, 18),
      ['gap', 4, -1], land(T2, 12), run(26, -9, T2), ...hollow(32, 13, 3.4, 4.2, { zone: H2 }, 4), land(D2, 18, 1), run(28, -10, V2, 3, g), ['valley', 18, 2.4, 0, { zone: V2, surf: g, seeds: [{ at: 0.5, up: 0.8 }] }], dustFlat(),
      run(30, -11, T2), ...hollow(24, 9, 3, 3.4, { zone: R2 }), land(R2), run(22, -7, H2), ...hollow(28, 11, 3.2, 3.8, { zone: H2 }), land(T2), ['waves', 30, 1.3, 3, -6, { zone: T2, seeds: 3 }], dustFlat(10),
      run(30, -11, R2), ...hollow(26, 10, 3.4, 4, { zone: V2, surf: g }), land(D2), run(28, -9, H2), ['flat', 10, { zone: V2, surf: g }], ['bowl', 22, 4.4, 4, { zone: V2, surf: g }]] },
  { id: '2-3', name: 'Carry It Over', time: 'golden', card: 'carry', par: 46,
    strokes: [['flat', 9, { zone: H2 }], run(36, -14, H2, 4), ['flat', 3, { zone: T2 }], ['line', 3, 2.6, { zone: T2 }], run(24, -9, R2), ['flat', 3, { zone: R2 }], ['line', 3, 2.8, { zone: R2 }], run(26, -10, T2), ['flat', 3, { zone: T2 }], ['line', 3.2, 3, { zone: H2 }], land(H2, 20),
      dustFlat(8), run(30, -11, V2, 4, g), ['flat', 4, { zone: T2 }], ['kicker', 6, 2.2, { zone: H2 }], ['gap', 8, -4], land(D2, 20), run(32, -12, R2, 4), ['waves', 38, 1.6, 4, -7, { zone: R2, seeds: 4 }], ['flat', 4, { zone: T2 }], ['line', 3.4, 3.4, { zone: T2 }], land(T2, 20),
      run(26, -9, H2), ...hollow(30, 13, 3.6, 4.4, { zone: H2 }, 4), run(26, -10, R2), ['flat', 3, { zone: R2 }], ['line', 3, 2.6, { zone: R2 }], run(24, -9, T2), ['flat', 3, { zone: T2 }], ['line', 3.2, 3.2, { zone: T2 }], land(V2, 18),
      dustFlat(8), run(30, -11, V2, 3, g), ...hollow(26, 11, 3.4, 4, { zone: H2 }), land(H2), run(28, -9, R2), ['flat', 10, { zone: V2, surf: g }], ['bowl', 22, 4.4, 4, { zone: V2, surf: g }]] },
  { id: '2-4', name: 'Where You Start', time: 'winter', card: 'start', par: 49,
    strokes: [['flat', 9, { zone: 'snow' }], run(30, -10, 'snow'), ...hollow(24, 9, 3, 3, { zone: 'snow' }), land(T2), run(34, -14, 'snow', 4),
      // the deep place: no speed gets you out of this one. A balloon is waiting at the bottom
      ['flat', 14, { zone: T2, surf: 'sand', mark: 'hint', text: 'ride', at: 0.2, ride: { at: 0.62, to: 48, up: 15 } }], ['line', 5, 11, { zone: 'cap' }], ['flat', 34, { zone: 'snow', seeds: 3 }],
      run(32, -12, 'snow', 4), ...hollow(26, 11, 3.2, 3.8, { zone: T2 }), land('snow', 18), ['gap', 4, -1], land('snow', 12), run(30, -11, 'snow'), ['waves', 30, 1.3, 3, -5, { zone: T2, seeds: 3 }], run(30, -12, 'snow', 4),
      ['flat', 14, { zone: T2, surf: 'sand', ride: { at: 0.62, to: 42, up: 13 } }], ['line', 5, 9, { zone: 'cap' }], ['flat', 28, { zone: 'snow', seeds: 3 }], run(34, -14, 'snow', 4), ...hollow(26, 10, 3.2, 3.6, { zone: T2 }), land('snow'),
      run(30, -11, 'snow'), ['hill', 14, 1.6, -1, { zone: T2 }], run(28, -10, 'snow'), ['flat', 10, { zone: 'snow' }], ['bowl', 22, 4.4, 4, { zone: 'snow' }]] },
  { id: '2-5', name: 'Past the Mark', time: 'dusk', card: 'heavy', par: 52,
    strokes: [['flat', 9, { zone: R2 }], run(34, -13, R2, 4), ['flat', 3, { zone: R2 }], ['line', 3, 2.6, { zone: T2 }], land(T2, 20, 3), dustFlat(8), ['gap', 5, -1], land(T2, 12), run(30, -12, H2),
      ['valley', 10, 2.6, 0.4, { zone: H2, seeds: [{ at: 0.5, up: 0.8 }] }], dustFlat(10), ['gap', 4.5], land(D2, 10, 1), run(24, -8, R2), ...hollow(26, 11, 3.2, 3.6, { zone: R2 }), land(R2, 20), dustFlat(8),
      ['gap', 3], ['flat', 4, { zone: 'cap', seeds: [{ at: 0.5 }] }], ['gap', 3], land(T2, 12), run(36, -15, T2, 4), ['kicker', 6, 2, { zone: T2 }], ['gap', 9, -6, { plat: [{ at: 0.5, up: -3.2, w: 3 }] }], land(V2, 20),
      run(28, -10, V2, 3, g), ['valley', 12, 3, 1, { zone: R2, seeds: [{ at: 0.5, up: 0.8 }] }], dustFlat(10), run(30, -11, H2), ...hollow(24, 10, 3.2, 3.6, { zone: H2 }), land(H2, 20), dustFlat(8), ['gap', 4], land(T2, 10),
      run(28, -10, R2), ['flat', 12, { zone: V2, surf: g }], ['bowl', 22, 4.4, 4.2, { zone: V2, surf: g }]] },
  { id: '2-B', name: 'The Hollows', time: 'night', boss: 'hollows', par: 47, music: 'boss',
    strokes: [['flat', 9, { zone: T2 }], run(32, -12, T2), ['flat', 3, { zone: T2 }], ['line', 3, 3, { zone: R2 }], run(24, -10, R2), ['flat', 3, { zone: R2 }], ['line', 3.2, 3.6, { zone: H2 }], run(26, -11, H2), ['flat', 3, { zone: H2 }], ['line', 3.4, 4.2, { zone: T2 }], land(T2, 20),
      dustFlat(8), ['gap', 3.4, -1], land('cap', 12), run(32, -14, R2, 4), ['flat', 3, { zone: R2 }], ['line', 3.6, 4.8, { zone: R2 }], run(28, -12, T2), ['flat', 3, { zone: T2 }], ['line', 3.4, 4, { zone: T2 }], land(H2, 20),
      run(30, -12, H2), ['flat', 4, { zone: H2 }], ['kicker', 6, 2.4, { zone: H2 }], ['gap', 9, -5], land(H2, 20), run(34, -15, H2, 4), ['flat', 3, { zone: T2 }], ['line', 3.8, 5.2, { zone: T2 }], run(26, -10, R2), ['flat', 3, { zone: R2 }], ['line', 3.4, 4.2, { zone: R2 }], land(T2, 20),
      run(30, -12, T2), ...hollow(28, 12, 3.8, 5.4, { zone: R2 }, 4), land(R2), run(26, -9, H2), ['flat', 12, { zone: R2 }], ['bowl', 22, 4.6, 4.4, { zone: R2 }]] },
];

// ---- Galápagos: a noisy slope, and what chance is good for ----
const LV = 'lava', BE = 'beach', SC = 'scoria', GR = 'green', CP = 'carpet', WR = 'wetrock';
const surf = { amp: 0.3, per: 4.2 }, swell = { amp: 0.55, per: 6 };
const raft = (at, w = 2.6) => ({ at, up: -0.12, w, float: true, kind: 'raft' });
const turtle = (at, dist = 3.5, per = 9) => ({ at, up: -0.1, w: 1.9, float: true, kind: 'tortoise', walk: { dist, per } });
// A lagoon: clear water over a dip in the beach, with driftwood afloat on it. Staying dry is the fast line; falling in costs only time, since Theta floats and can paddle.
const lagoon = (L, depth, td, things, o = {}) => ['valley', L, depth, 0, { zone: BE, surf: 'sand', water: [0.08, 0.92, -0.42], tide: td, plat: things, seeds: things.map((p) => ({ at: p.at, up: 0.75 })), ...o }];
// A tide basin: rock walls too high to roll or jump out of, with the sea coming and going in it through the rock, and a raft of driftwood afloat.
// Stand on the raft. The tide lifts it, and near the top a hop clears the rim. Fall in and nothing is lost: at low water the raft can be boarded again from the floor.
// The walls stand higher than the highest tide, so the water never has anywhere to spill.
const basin = (per = 9, o = {}) => [['flat', 6, { zone: WR, ...o }], ['line', 2.6, -7, { zone: WR }], ['flat', 9, { zone: WR, water: [-0.27, 1.27, 3.5], tide: { amp: 2.9, per }, plat: [{ at: 0.76, up: 3.8, w: 4, float: true, kind: 'raft' }], seeds: [{ at: 0.76, up: 6.2 }, { at: 0.76, up: 7.4 }] }], ['line', 2.6, 7, { zone: WR }], ['flat', 16, { zone: LV, seeds: 2 }]];
const GAL = [
  { id: '3-1', name: 'A Handful', time: 'dawn', card: 'batch', par: 45,
    strokes: [['flat', 10, { zone: LV }], run(30, -10, LV), ['flat', 8, { zone: BE, surf: 'sand', mark: 'hint', text: 'raft' }], lagoon(22, 2, surf, [raft(0.3), raft(0.5), raft(0.7)]), land(BE, 12), run(30, -11, CP, 4), ...hollow(24, 9, 3, 3, { zone: SC }), land(SC),
      run(28, -9, GR, 3, g), lagoon(26, 2.2, surf, [raft(0.26), raft(0.44), raft(0.62), raft(0.8)]), land(BE, 12), run(34, -12, LV, 4), ['waves', 30, 1.2, 3, -5, { zone: CP, seeds: 3 }], dustFlat(8), lagoon(24, 2, surf, [raft(0.3, 2.2), raft(0.52, 2.2), raft(0.74, 2.2)]),
      land(BE, 12), run(30, -10, SC), ...hollow(24, 9, 3.2, 3.2, { zone: LV }), land(LV), run(28, -9, GR, 3, g), ['flat', 10, { zone: GR, surf: g }], ['bowl', 22, 4, 4, { zone: GR, surf: g }]] },
  { id: '3-2', name: 'A Noisy Slope', time: 'day', card: 'noise', par: 50,
    strokes: [['flat', 10, { zone: BE, surf: 'sand' }], run(32, -11, CP, 4), lagoon(26, 2.2, swell, [raft(0.26), turtle(0.52), raft(0.8)]), land(BE, 12), run(30, -10, LV), ['flat', 4, { zone: LV }], ['line', 3, 2.8, { zone: SC }], land(SC, 18), run(28, -10, SC),
      lagoon(30, 2.4, swell, [raft(0.2, 2.2), raft(0.38, 2.2), turtle(0.6, 3), raft(0.84, 2.2)]), land(BE, 12), run(34, -13, GR, 4, g), ['waves', 32, 1.3, 3, -6, { zone: LV, seeds: 3 }], dustFlat(8), ['gap', 4, -1], land(LV, 12), run(26, -9, CP),
      lagoon(28, 2.2, swell, [turtle(0.3, 3), raft(0.56), turtle(0.8, 2.5, 7)]), land(BE, 12), run(30, -11, SC), ...hollow(26, 10, 3.2, 3.6, { zone: LV }), land(LV), run(28, -9, GR, 3, g), ['flat', 10, { zone: BE, surf: 'sand' }], ['bowl', 22, 4.2, 4, { zone: GR, surf: g }]] },
  { id: '3-3', name: 'By Chance', time: 'golden', card: 'sgd', par: 47,
    strokes: [['flat', 10, { zone: SC }], run(36, -14, SC, 4), ['flat', 3, { zone: LV }], ['line', 3, 2.6, { zone: LV }], land(LV, 18), lagoon(30, 2.4, swell, [raft(0.2, 2), turtle(0.42, 3), raft(0.64, 2), raft(0.84, 2)]), land(BE, 12), run(30, -11, CP, 4), ['flat', 4, { zone: LV }], ['kicker', 6, 2, { zone: LV }], ['gap', 8, -4],
      land(LV, 18), run(28, -10, GR, 3, g), lagoon(26, 2.2, { amp: 0.7, per: 5 }, [turtle(0.3, 3, 8), turtle(0.7, 3, 6)]), land(BE, 12), run(32, -12, SC, 4), ...hollow(28, 12, 3.4, 4, { zone: SC }, 4), land(SC), ['waves', 30, 1.4, 3, -6, { zone: CP, seeds: 3 }], dustFlat(8),
      lagoon(32, 2.4, { amp: 0.7, per: 5 }, [raft(0.18, 2), raft(0.36, 2), turtle(0.56, 2.5, 7), raft(0.8, 2)]), land(BE, 12), run(30, -11, LV), ['flat', 10, { zone: GR, surf: g }], ['bowl', 22, 4.2, 4, { zone: GR, surf: g }]] },
  { id: '3-4', name: 'Shaken Loose', time: 'mist', card: 'shake', par: 64,
    strokes: [['flat', 10, { zone: LV }], run(30, -10, LV), ...basin(9, { mark: 'hint', text: 'tide', at: 0.3 }), run(30, -11, CP, 4), lagoon(24, 2.2, swell, [raft(0.3), raft(0.52), raft(0.74)]), land(BE, 12), run(28, -10, SC), ...hollow(24, 9, 3, 3.2, { zone: SC }), land(SC),
      run(30, -11, GR, 3, g), ...basin(8), run(32, -12, LV, 4), ['waves', 30, 1.2, 3, -5, { zone: CP, seeds: 3 }], dustFlat(8), lagoon(26, 2.2, swell, [turtle(0.32, 3), turtle(0.7, 3, 7)]), land(BE, 12), run(28, -10, SC), ...basin(8),
      run(28, -9, GR, 3, g), ['flat', 10, { zone: GR, surf: g }], ['bowl', 22, 4.2, 4, { zone: GR, surf: g }]] },
  { id: '3-5', name: 'Settling', time: 'dusk', card: 'settle', par: 56,
    strokes: [['flat', 10, { zone: CP }], run(34, -13, CP, 4), lagoon(30, 2.4, { amp: 0.8, per: 4.6 }, [raft(0.2, 1.8), raft(0.36, 1.8), raft(0.52, 1.8), raft(0.68, 1.8), raft(0.84, 1.8)]), land(BE, 12), run(30, -11, LV), ['flat', 3, { zone: LV }], ['line', 3, 2.8, { zone: SC }], land(SC, 18),
      run(28, -10, SC), lagoon(28, 2.2, { amp: 0.6, per: 5 }, [turtle(0.26, 2.5, 6), raft(0.5, 1.8), turtle(0.76, 2.5, 7)]), land(BE, 12), run(32, -12, GR, 4, g), ...hollow(26, 11, 3.4, 3.8, { zone: LV }), land(LV), dustFlat(8), ['gap', 4], land(LV, 12),
      run(28, -10, CP), lagoon(28, 2.2, { amp: 0.4, per: 5.5 }, [raft(0.22, 1.7), raft(0.4, 1.7), raft(0.6, 1.7), raft(0.8, 1.7)]), land(BE, 12), run(30, -11, SC), lagoon(24, 2, { amp: 0.15, per: 6 }, [raft(0.3, 1.6), raft(0.52, 1.6), raft(0.74, 1.6)]), land(BE, 12),
      run(26, -8, GR, 3, g), ['flat', 10, { zone: GR, surf: g }], ['bowl', 22, 4.2, 4.2, { zone: GR, surf: g }]] },
  { id: '3-B', name: 'The Tide', time: 'night', boss: 'tide', par: 66, music: 'boss',
    strokes: [['flat', 10, { zone: LV }], run(32, -12, LV), ...basin(8), run(28, -10, SC), lagoon(30, 2.4, { amp: 0.9, per: 5 }, [raft(0.2, 2), turtle(0.44, 3, 7), raft(0.68, 2), raft(0.86, 2)]), land(BE, 12), run(30, -12, CP, 4), ['flat', 3, { zone: LV }], ['line', 3.2, 3.4, { zone: LV }], land(LV, 18),
      ...basin(7), run(32, -13, SC, 4), lagoon(28, 2.2, { amp: 0.9, per: 4.6 }, [turtle(0.28, 2.5, 6), turtle(0.56, 2.5, 7), raft(0.82, 1.8)]), land(BE, 12), run(28, -10, LV), ...hollow(26, 11, 3.6, 4.4, { zone: LV }), land(LV), ...basin(7),
      run(30, -11, CP), ['flat', 12, { zone: BE, surf: 'sand' }], ['bowl', 22, 4.4, 4.4, { zone: BE, surf: 'sand' }]] },
];

// ---- Namib: level ground, and a plan for the length of the step ----
const DU = 'dune', SO = 'soft', PA = 'pan', GV = 'gravel', GY = 'grassy';
const dune = (L, h, dy = 0, seeds = 2) => ['hill', L, h, dy, { zone: DU, seeds }];                 // up and over: a slope to walk, or speed to carry
const pan = (L, seeds = 3) => ['flat', L, { zone: PA, seeds }];                                     // hard clay, dead level: nothing here tells you which way to go, and a ball keeps what speed it brought
const softFlat = (L = 12) => ['flat', L, { zone: SO, surf: 'sand' }];                               // soft sand: a roll dies in it
const gale = (L, wx = 13, o = {}) => ['flat', L, { zone: GV, wind: [{ from: 0, to: 1, wx, gusty: true }], seeds: [{ at: 0.3, up: 2.6 }, { at: 0.55, up: 3 }, { at: 0.8, up: 2.6 }], ...o }];
const down = (L, dy, zone = DU, seeds = 3) => ['slope', L, dy, { zone, seeds }];
const NAM = [
  { id: '4-1', name: 'Level Ground', time: 'dawn', card: 'plateau', par: 31,
    strokes: [['flat', 10, { zone: GV }], down(34, -12), pan(40), down(26, -9, GV), softFlat(10), pan(30), dune(16, 2.4, -1), down(30, -11), pan(46, 4), ['flat', 10, { zone: GY, surf: g }], down(28, -10, GY),
      dune(18, 3, -1), pan(36), softFlat(8), down(32, -12), pan(40, 4), dune(16, 2.6, -1), down(26, -9, GV), ['flat', 12, { zone: PA }], ['bowl', 22, 4, 4, { zone: PA }]] },
  { id: '4-2', name: 'Keep Going', time: 'day', card: 'patience', par: 43,
    strokes: [['flat', 10, { zone: GY, surf: g }], down(36, -14), pan(50, 4), dune(18, 3.4, 0), pan(30), down(28, -10, GV), softFlat(12), ['gap', 4, -1], land(GV, 12), down(32, -13), pan(44, 4), dune(16, 3, -1), dune(16, 3.4, -1),
      pan(36), down(30, -12, GY), ...hollow(26, 10, 3.2, 3.6, { zone: GV }), land(GV, 18), pan(40, 4), dune(18, 3.6, -1), down(28, -10), ['flat', 12, { zone: PA }], ['bowl', 22, 4.2, 4, { zone: PA }]] },
  { id: '4-3', name: 'Long Steps First', time: 'golden', card: 'schedule', par: 44,
    strokes: [['flat', 10, { zone: GV }], down(40, -17, DU, 4), ['kicker', 7, 2.6, { zone: DU }], ['gap', 10, -6], land(DU, 20), gale(34, 13, { mark: 'hint', text: 'gale', at: 0.1 }), down(36, -15, DU, 4), dune(20, 4.2, -1), pan(34), down(30, -12),
      ['kicker', 6, 2.2, { zone: DU }], ['gap', 8, -4], land(GV, 18), gale(30, 12), down(28, -10, GY), dune(16, 3, -1), pan(30), down(24, -8), dune(14, 2.2, -1), down(20, -6, GV), ['gap', 3.4, -1], land(GV, 10),
      dune(12, 1.6, -1), down(16, -4), ['gap', 2.6], ['flat', 8, { zone: PA }], ['gap', 2.6], ['flat', 12, { zone: PA }], ['bowl', 22, 4, 4, { zone: PA }]] },
  { id: '4-4', name: 'Shorter and Shorter', time: 'mist', card: 'decay', par: 40,
    strokes: [['flat', 10, { zone: DU }], down(38, -16, DU, 4), dune(22, 5, -1, 3), dune(20, 4.2, -1, 3), dune(18, 3.5, -1), pan(30), down(30, -12), dune(16, 3, -1), dune(15, 2.5, -1), dune(14, 2, -1), softFlat(8), gale(30, 12),
      down(28, -10, GV), ['waves', 30, 1.6, 3, -5, { zone: DU, seeds: 3 }], ['waves', 26, 1.1, 3, -4, { zone: DU, seeds: 3 }], ['waves', 22, 0.7, 3, -3, { zone: DU, seeds: 3 }], pan(26), ['gap', 3.6], ['flat', 7, { zone: PA, seeds: [{ at: 0.5 }] }], ['gap', 3],
      ['flat', 6, { zone: PA, seeds: [{ at: 0.5 }] }], ['gap', 2.4], ['flat', 12, { zone: PA }], down(22, -7, GY), ['flat', 10, { zone: PA }], ['bowl', 22, 4, 4, { zone: PA }]] },
  { id: '4-5', name: 'Warming Up', time: 'dusk', card: 'warmup', par: 50,
    strokes: [['flat', 10, { zone: PA }], ['gap', 2.2], ['flat', 6, { zone: PA, seeds: [{ at: 0.5 }] }], ['gap', 2.6], ['flat', 7, { zone: PA, seeds: [{ at: 0.5 }] }], ['gap', 3.2], land(GV, 12), down(20, -6, GV), dune(12, 1.6, -1), down(24, -8), dune(15, 2.4, -1),
      down(30, -12), dune(18, 3.4, -1), pan(30), down(36, -15, DU, 4), ['kicker', 7, 2.6, { zone: DU }], ['gap', 10, -6], land(DU, 20), gale(34, 13), down(34, -14, DU, 4), dune(20, 4.4, -1, 3), pan(36, 4),
      down(28, -10, GY), dune(16, 3, -1), down(22, -7), dune(13, 2, -1), softFlat(8), ['gap', 3], ['flat', 7, { zone: PA, seeds: [{ at: 0.5 }] }], ['gap', 2.4], ['flat', 12, { zone: PA }], ['bowl', 22, 4, 4.2, { zone: PA }]] },
  { id: '4-B', name: 'The Long Flat', time: 'night', boss: 'flat', par: 70, music: 'boss',
    strokes: [['flat', 10, { zone: GV }], down(40, -17, DU, 4), pan(70, 5), dune(18, 3.6, 0), pan(40, 3), softFlat(10), gale(40, 14), down(32, -13, DU, 4), pan(60, 5), dune(20, 4.4, -1, 3), dune(16, 3, -1), softFlat(8), ['gap', 4, -1], land(GV, 12),
      down(34, -14), pan(80, 6), dune(18, 4, -1), gale(36, 14), down(30, -12, GV), ...hollow(28, 12, 3.6, 4.4, { zone: GV }, 4), land(GV, 18), pan(50, 4), dune(16, 3.2, -1), down(26, -9), ['flat', 12, { zone: PA }], ['bowl', 22, 4.4, 4.4, { zone: PA }]] },
];

// the ground behind the title: a mossy ledge above a long green slope
export const TITLE = (z1, z2) => ({ id: 'title', name: '', time: 'golden', strokes: [['flat', 6, { zone: z1 }], ['hill', 8, 0.9, -0.4, { zone: z2, surf: g }], ['slope', 13, -9, { zone: z2, surf: g }], ['slope', 30, -9, { zone: z1 }], ['waves', 30, 1.2, 2, -6, { zone: z2, surf: g }], ['bowl', 20, 3, 3, { zone: z2, surf: g }]] });

export const WORLDS = [
  { id: 'iceland', n: 1, name: 'Iceland', theme: iceland, music: 'iceland', can: { slide: true, roll: false, spread: true }, title: ['moss', 'meadow'], levels: ICE },
  { id: 'cappadocia', n: 2, name: 'Cappadocia', theme: cappadocia, music: 'cappadocia', can: { slide: true, roll: true, spread: true, mu: true }, title: ['tuff', 'vine'], levels: CAP },
  { id: 'galapagos', n: 3, name: 'Galápagos', theme: galapagos, music: 'galapagos', can: { slide: true, roll: true, spread: true, mu: true }, title: ['lava', 'green'], levels: GAL },
  { id: 'namib', n: 4, name: 'Namib', theme: namib, music: 'namib', can: { slide: true, roll: true, spread: true, mu: true }, title: ['gravel', 'grassy'], levels: NAM },
];
export const levelById = (id) => { for (const w of WORLDS) for (const l of w.levels) if (l.id === id) return { world: w, spec: l }; return null; };
export const ALL = WORLDS.flatMap((w) => w.levels.map((l) => l.id));
export const nextLevel = (id) => { const i = ALL.indexOf(id); return i >= 0 && i < ALL.length - 1 ? ALL[i + 1] : null; };
// Gold is a clean, quick run. Silver and bronze give more room.
export const medals = (spec) => [spec.par * 0.78, spec.par, spec.par * 1.35];
