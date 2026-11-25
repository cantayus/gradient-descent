// The worlds and their levels. A level is a list of strokes (see js/game/level.js); lengths and heights are in units, one unit about the hero's height.
// `can` says what the hero has learned by then. `time` is the hour the level is painted in. `card` is the notebook page it opens.
// `par` is the time a good first run takes; the medal times are set from it (see medals()).
import { iceland } from '../art/worlds/iceland.js';

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

// the ground behind the title: a mossy ledge above a long green slope
export const TITLE = { id: 'title', name: '', time: 'golden', strokes: [['flat', 6, { zone: 'moss' }], ['hill', 8, 0.9, -0.4, { zone: m, surf: g }], ['slope', 13, -9, { zone: m, surf: g }], ['slope', 30, -9, { zone: 'moss' }], ['waves', 30, 1.2, 2, -6, { zone: m, surf: g }], ['bowl', 20, 3, 3, { zone: m, surf: g }]] };

export const WORLDS = [
  { id: 'iceland', n: 1, name: 'Iceland', theme: iceland, music: 'iceland', can: { slide: true, roll: false, spread: true }, levels: ICE },
];
export const levelById = (id) => { for (const w of WORLDS) for (const l of w.levels) if (l.id === id) return { world: w, spec: l }; return null; };
export const ALL = WORLDS.flatMap((w) => w.levels.map((l) => l.id));
export const nextLevel = (id) => { const i = ALL.indexOf(id); return i >= 0 && i < ALL.length - 1 ? ALL[i + 1] : null; };
// Gold is a clean, quick run. Silver and bronze give more room.
export const medals = (spec) => [spec.par * 0.78, spec.par, spec.par * 1.35];
