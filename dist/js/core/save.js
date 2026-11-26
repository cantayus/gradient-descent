// What the game remembers between visits, kept in the browser. Storage can be missing or full, so every read and write is guarded.
const KEY = 'gradient-descent-v1';
const blank = () => ({ v: 1, levels: {}, cards: [], seen: {}, settings: { music: 0.7, sfx: 0.8, voice: 0.8, gfx: -1, motion: true, text: 1, assist: false, keys: null, safe: false } });
export const save = blank();
// The classroom link (?class) opens everything and keeps nothing: a teacher's slide must not write over a player's progress.
const CLASS = typeof location !== 'undefined' && /[?&]class\b/.test(location.search);
export function loadSave() { if (CLASS) return save; try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw), b = blank(); Object.assign(save, b, d, { settings: { ...b.settings, ...(d.settings || {}) } }); } } catch (e) { /* a private window, or a full disk: play on without it */ } return save; }
export function store() { if (CLASS) return; try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* as above */ } }
export function resetSave() { const b = blank(); b.settings = save.settings; for (const k of Object.keys(save)) delete save[k]; Object.assign(save, b); store(); }
// Record a finished run. Returns what was new about it.
export function record(id, res, medalTimes, assisted) {
  const L = save.levels[id] || (save.levels[id] = { best: null, medal: 0, seeds: 0, runs: 0 });
  const medal = assisted ? 0 : res.time <= medalTimes[0] ? 3 : res.time <= medalTimes[1] ? 2 : res.time <= medalTimes[2] ? 1 : 0;
  const out = { first: L.runs === 0, bestBefore: L.best, newBest: false, medal, medalBefore: L.medal }; L.runs++;
  if (!assisted && (L.best == null || res.time < L.best)) { L.best = +res.time.toFixed(3); L.ghost = thin(res.rec); L.curve = res.curve; out.newBest = true; }
  if (assisted && L.bestAssist == null || assisted && res.time < L.bestAssist) L.bestAssist = +res.time.toFixed(3);
  out.newStamp = !!res.stamp && !L.stamp; if (res.stamp) L.stamp = true; if (res.seedsAll && res.seeds === res.seedsAll) L.allSeeds = true;
  L.medal = Math.max(L.medal, medal); L.seeds = Math.max(L.seeds, res.seeds); L.done = true; store(); return out;
}
// The ghost is kept at fifteen samples a second, which is plenty to draw from and a quarter of the size.
function thin(rec) { const out = []; for (let i = 0; i < rec.length; i += 12) out.push(rec[i], rec[i + 1], rec[i + 2], rec[i + 3], rec[i + 4], rec[i + 5]); return out; }
export const ghostFor = (id) => { const g = save.levels[id]?.ghost; if (!g) return null; const out = []; for (let i = 0; i + 11 < g.length; i += 6) { out.push(...g.slice(i, i + 6)); out.push((g[i] + g[i + 6]) / 2, (g[i + 1] + g[i + 7]) / 2, (g[i + 2] + g[i + 8]) / 2, (g[i + 3] + g[i + 9]) / 2, (g[i + 4] + g[i + 10]) / 2, g[i + 5]); } return out; };
