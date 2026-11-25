// The screens round the game: title, levels, the card after a run, the notebook, settings, credits. All plain HTML over the canvas.
import { save, store, resetSave, record, ghostFor } from '../core/save.js';
import { WORLDS, levelById, ALL, nextLevel, medals } from '../data/worlds.js';
import { CARDS, HINTS } from '../data/notebook.js';
import { STORY, ROUTE } from '../data/story.js';
import { audio, initAudio, setVolumes, playMusic, sfx, mute } from '../core/audio.js';
import { input } from '../core/input.js';
import { drawTheta, POSE } from '../game/theta.js';
import { stampCanvas } from '../art/stamps.js';

let api = null;
const ui = document.getElementById('ui'), hud = document.getElementById('hud');
export function el(spec, attrs = {}, ...kids) {
  const [tag, ...cls] = spec.split('.'), n = document.createElement(tag || 'div'); if (cls.length) n.className = cls.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) { if (k === 'on') for (const [e, f] of Object.entries(v)) n.addEventListener(e, f); else if (k === 'text') n.textContent = v; else if (k === 'html') n.innerHTML = v; else if (v !== false && v != null) n.setAttribute(k, v); }
  for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid); return n;
}
const btn = (label, fn, cls = '') => el('button.btn' + (cls ? '.' + cls : ''), { type: 'button', on: { click: () => { initAudio(); sfx.ui(true); fn(); } } }, label);
export const fmt = (t) => (t == null ? '–' : `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`);
const clear = () => { ui.replaceChildren(); document.body.classList.remove('dim'); };
const MEDAL = ['', 'bronze', 'silver', 'gold'];
const how = () => (input.touch.used ? 'touch' : input.pad.used ? 'pad' : 'key');

export function initUI(a) { api = a; hud.replaceChildren(el('div.h-lights'), el('div.h-sparks'), el('div.h-bar', {}, el('i')), el('div.h-name', {}, el('small'), el('b'), el('i')), el('div.h-clock'), el('div.h-seeds'), el('div.h-stamp', { title: 'The stamp hidden in this level' }), el('div.h-hint'), el('button.h-pause', { type: 'button', 'aria-label': 'Pause', on: { click: () => pause() } }, 'II')); }

// ---- title ----
// A wide, quiet look at the country with the name over it and one line asking for a key; the menu comes only after that.
// (A browser will not play sound before the player has touched something, so the first key is also what starts the music.)
let awake = false, framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }      // inside a frame the keyboard is not ours until the player has clicked
const emblem = () => el('div.emblem', { html: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="32" rx="19" ry="26" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M13.5 27 C 24 27, 27 38, 38 38 S 47 36, 50.5 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="38" cy="38" r="2.6" fill="#ffd76a"/></svg>' });
export function showTitle() {
  clear(); api.attract(); hud.hidden = true; document.getElementById('touch').hidden = true; if (awake) playMusic('title');
  const next = ALL.find((id) => !save.levels[id]?.done) || ALL[0], any = Object.keys(save.levels).length > 0;
  const items = [[any ? 'Continue' : 'New game', () => play(next)], any && ['Levels', showLevels], any && ['The story', showStory], any && ['Stamps', showAlbum], ['Notebook', showNotebook], ['How to play', showHow], ['Settings', () => showSettings(showTitle)], ['Also play this!', showAlso], ['Credits', showCredits]].filter(Boolean);
  const menu = el('nav.tmenu', { 'aria-label': 'Menu' }, items.map(([t, f], i) => el('button.titem', { type: 'button', style: `--i:${i}`, on: { click: () => { sfx.ui(true); f(); }, mouseenter: (e) => e.target.focus() } }, t)));
  const root = el('div.cine' + (awake ? '.awake.seen' : ''), {}, el('div.veil'), el('div.logo', {}, emblem(), el('h1', { text: 'Gradient Descent' }), el('div.rule')), el('p.press', { text: 'ontouchstart' in window ? 'Tap to begin' : framed ? 'Click to begin' : 'Press any key' }), menu);
  ui.append(root);
  if (awake) { menu.firstChild.focus(); return; }
  const wake = (e) => { if (!root.isConnected) return off(); if (e.type === 'keydown' && /^(F\d+|Tab|Meta|Control|Alt|Shift)/.test(e.key)) return; off(); awake = true; initAudio(); playMusic('title'); sfx.wake(); root.classList.add('awake'); api.greet(); setTimeout(() => menu.firstChild.focus(), 60); e.preventDefault?.(); };
  const off = () => { removeEventListener('keydown', wake, true); removeEventListener('pointerdown', wake, true); };
  addEventListener('keydown', wake, true); addEventListener('pointerdown', wake, true);
}

// ---- levels ----
export function showLevels() {
  clear(); hud.hidden = true; api.attract(); document.body.classList.add('dim');
  const open = (id) => { const i = ALL.indexOf(id); return api.unlockAll || i === 0 || save.levels[ALL[i - 1]]?.done; };
  ui.append(sheet('Levels', showTitle,
    WORLDS.map((w) => el('section.world', {}, el('h3', {}, w.name, el('small.count', { text: `stamps ${w.levels.filter((l) => save.levels[l.id]?.stamp).length} of ${w.levels.length}` })), el('p.note', { text: w.theme.note || '' }),
      el('div.stones', {}, w.levels.map((l, i) => { const s = save.levels[l.id], ok = open(l.id);
        return el('button.stone' + (ok ? '' : '.locked') + (l.boss ? '.boss' : ''), { type: 'button', disabled: !ok, on: { click: () => { initAudio(); play(l.id); } } },
          el('span.num', { text: l.boss ? '★' : String(i + 1) }), el('span.nm', { text: l.name }), el('span.tm', { text: s?.best != null ? fmt(s.best) : ok ? 'new' : '' }), el('span.md.' + (MEDAL[s?.medal || 0] || 'none')),
          s?.done ? el('span.goals', { 'aria-label': `${s.stamp ? 'stamp found' : 'stamp not found'}, ${s.allSeeds ? 'every seed gathered' : 'seeds left behind'}` }, el('i.g-stamp' + (s.stamp ? '.on' : '')), el('i.g-seed' + (s.allSeeds ? '.on' : ''))) : null); }))))));
}

// ---- playing ----
let run = null, hintT = 0;
export function play(id, told = false) {
  if (STORY[id] && !told && (!save.seen['story' + id] || api.forceIntro)) return showTale(id, () => play(id, true));
  clear(); hud.hidden = false; const f = levelById(id); run = { id, f, shown: null };
  const intro = !!f.spec.intro && (!save.seen.intro || api.forceIntro);
  const p = api.startLevel(id, { ghost: ghostFor(id), intro }); if (!p) return showTitle();
  ui.append(el('div.veil' + (intro ? '.slow' : '.quick')));      // every level comes up out of black
  playMusic(f.spec.music || f.world.music); hud.querySelector('.h-name small').textContent = f.world.name; hud.querySelector('.h-name b').textContent = f.spec.name; hud.classList.remove('fresh'); hud.classList.toggle('intro', intro); if (!intro) card();
  document.getElementById('touch').hidden = !('ontouchstart' in window); api.G.paused = false;
}
function card() { void hud.offsetWidth; hud.classList.add('fresh'); clearTimeout(run.cardT); run.cardT = setTimeout(() => hud.classList.remove('fresh'), 4200); }
export function introDone() { if (!run) return; save.seen.intro = true; store(); hud.classList.remove('intro'); card(); }
export function frameUI(p) {
  if (!p || hud.hidden || !run) return;
  if (p.started && hud.classList.contains('fresh') && p.clock > 0.6) hud.classList.remove('fresh');
  hud.querySelector('.h-clock').textContent = p.started ? fmt(p.clock) : '';
  // the rules, where they can be seen: the seed's lights, and how much of its light is left
  const hl = hud.querySelector('.h-lights'); if (hl.childElementCount !== p.lightsAll) hl.replaceChildren(...Array.from({ length: p.lightsAll }, () => el('i'))); [...hl.children].forEach((n, i) => n.classList.toggle('out', i >= p.lights));
  const hs = hud.querySelector('.h-sparks'); if (hs.childElementCount !== p.sparksAll) hs.replaceChildren(...Array.from({ length: p.sparksAll }, () => el('i', { text: '✦' }))); [...hs.children].forEach((n, i) => n.classList.toggle('out', i >= p.sparks));
  const bar = hud.querySelector('.h-bar'), left = p.limit - p.clock; bar.hidden = !Number.isFinite(p.limit); if (!bar.hidden) { bar.firstChild.style.width = Math.max(0, Math.min(100, (left / p.limit) * 100)) + '%'; bar.classList.toggle('low', left < 15); }
  const hst = hud.querySelector('.h-stamp'); hst.hidden = !p.level.items.some((i) => i.kind === 'stamp'); hst.classList.toggle('got', !!p.stamp);
  hud.querySelector('.h-seeds').textContent = p.level.seeds.length ? `${p.seeds} / ${p.level.seeds.length}` : '';
  const m = p.level.marks.find((k) => k.kind === 'hint' && p.b.x > k.x - 7 && p.b.x < k.x + 16), text = m && !p.done ? HINTS[m.text]?.[how()] : null, h = hud.querySelector('.h-hint');
  if (text !== run.shown) { run.shown = text; h.textContent = text || ''; h.classList.toggle('on', !!text); }
}
export function pause() {
  if (!api.G.play || hud.hidden || api.G.paused || api.G.play.done) return; api.G.paused = true; document.body.classList.add('dim');
  const back = () => { clear(); api.G.paused = false; };
  ui.append(el('div.card.small', {}, el('h2', { text: 'Paused' }), el('div.menu', {}, btn('Go on', back, 'big'), btn('Start again', () => play(run.id)), btn('Settings', () => showSettings(() => { clear(); api.G.paused = false; pause(); })), btn('Levels', showLevels), btn('Title', showTitle))));
}
export function restart() { if (run && !hud.hidden) play(run.id); }

// ---- the story ----
// The road so far, drawn as a line going down, with the place the chapter is about lit.
function route(at) {
  const c = el('canvas.route', { width: 900, height: 150 }), x = c.getContext('2d'), n = ROUTE.length, px = (i) => 70 + (760 * i) / (n - 1), py = (i) => 34 + 62 * (i / (n - 1)) + 10 * Math.sin(i * 1.9);
  x.lineWidth = 2; x.setLineDash([3, 8]); x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); for (let i = 0; i < n; i++) (i ? x.lineTo(px(i), py(i)) : x.moveTo(px(i), py(i))); x.stroke();
  x.setLineDash([]); x.strokeStyle = '#ffd87a'; x.lineWidth = 3; x.beginPath(); for (let i = 0; i <= at; i++) (i ? x.lineTo(px(i), py(i)) : x.moveTo(px(i), py(i))); x.stroke();
  x.textAlign = 'center'; x.font = '400 17px Nunito, sans-serif';
  for (let i = 0; i < n; i++) { x.fillStyle = i <= at ? '#ffd87a' : 'rgba(255,255,255,0.4)'; x.beginPath(); x.arc(px(i), py(i), i === at ? 8 : 5, 0, 7); x.fill(); if (i === at) { x.strokeStyle = 'rgba(255,216,122,0.5)'; x.lineWidth = 2; x.beginPath(); x.arc(px(i), py(i), 14, 0, 7); x.stroke(); } x.fillStyle = i === at ? '#fff' : i < at ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)'; x.fillText(ROUTE[i], px(i), py(i) + 36); }
  return c;
}
export function showTale(key, then) {
  const ch = STORY[key]; if (!ch) return then(); clear(); hud.hidden = true; api.attract(); playMusic('title'); sfx.page(); save.seen['story' + key] = true; store();
  const go = () => { sfx.ui(true); then(); };
  ui.append(el('div.tale', {}, el('div.inner', {}, el('small', { text: 'The story' }), el('h2', { text: ch.title }), route(ch.at), ...ch.lines.map((t, i) => el('p', { style: `--i:${i}`, text: t })), el('div.row', { style: `--i:${ch.lines.length}` }, el('button.btn.big', { type: 'button', on: { click: go } }, then === showTitle || then === showStory ? 'Back' : 'Go on')))));
}
// ---- the album: the stamps found, a page for each country ----
export function showAlbum() {
  clear(); document.body.classList.add('dim'); const open = (w) => api.unlockAll || save.levels[w.levels[0].id]?.done || w.n === 1;
  ui.append(sheet('Stamps', showTitle, el('p.lead', { text: 'One stamp is hidden in every level. Each shows something that belongs to the country it was found in.' }),
    WORLDS.filter(open).map((w) => { const got = w.levels.map((l) => !!save.levels[l.id]?.stamp), n = got.filter(Boolean).length;
      return el('section.album' + (n === w.levels.length ? '.full' : ''), {}, el('h3', {}, w.name, el('small.count', { text: `${n} of ${w.levels.length}` })),
        el('div.leaves', {}, w.levels.map((l, i) => el('figure.leaf' + (got[i] ? '' : '.blank'), {}, got[i] ? stampCanvas(w.theme, i, 150) : el('div.gap', { text: l.boss ? '★' : String(i + 1) }), el('figcaption', { text: got[i] ? w.theme.stamps?.[i]?.name || '' : l.name })))),
        n === w.levels.length ? el('p.note', { text: 'The page is full. ' + (w.theme.note || '') }) : null); })));
}
export function showStory() {
  clear(); hud.hidden = true; api.attract(); document.body.classList.add('dim'); const keys = Object.keys(STORY).filter((k) => save.seen['story' + k]);
  ui.append(sheet('The story', showTitle, keys.length ? null : el('p.note', { text: 'It begins when you do.' }), el('div.pages', {}, keys.map((k) => el('button.stone.chapter', { type: 'button', on: { click: () => showTale(k, showStory) } }, el('span.num', { text: String(STORY[k].at + 1) }), el('span.nm', { text: STORY[k].title }), el('span.tm', { text: STORY[k].lines[0] }))))));
}

// ---- a lost level ----
export function showFail(why, res) {
  setTimeout(() => { hud.hidden = true; document.body.classList.add('dim'); playMusic('card');
    ui.append(el('div.card.small.fail', {}, el('h2', { text: why === 'time' ? 'The light faded' : 'The lights went out' }),
      el('p', { text: why === 'time' ? 'The seed’s light does not last for ever, and this time it faded before the valley.' : 'Every fall puts out one of the seed’s lights, and that was the last of them.' }), el('p.note', { text: 'It will be lit again at the top.' }),
      el('div.menu', {}, btn('Try again', () => play(run.id, true), 'big'), btn('Levels', showLevels), btn('Title', showTitle)),
      save.settings.assist ? null : el('p.note', { text: 'Assist, in Settings, gives five lights and no time limit.' }))); }, 1100);
}

// ---- the card after a run ----
export function showFinish(res) {
  const f = run.f, mt = medals(f.spec), out = record(run.id, res, mt, save.settings.assist), s = save.levels[run.id];
  const card = CARDS[f.spec.card], fresh = card && !save.cards.includes(f.spec.card); if (fresh) { save.cards.push(f.spec.card); store(); }
  setTimeout(() => {
    hud.hidden = true; document.body.classList.add('dim'); playMusic('card'); if (out.medal) sfx.medal(out.medal - 1);
    const nx = nextLevel(run.id), chart = el('canvas.curve', { width: 720, height: 300 }), st = f.world.theme.stamps?.[res.li];
    const goal = (ok, name, what) => el('li' + (ok ? '.on' : ''), {}, el('i'), el('b', { text: name }), el('span', { text: what }));
    const medalRow = el('div.medals', {}, [3, 2, 1].map((k) => el('div.medal.' + MEDAL[k] + (out.medal >= k ? '.won' : ''), {}, el('i'), el('span', { text: fmt(mt[3 - k]) }))));
    ui.append(el('div.card.finish', {},
      el('div.top', {}, el('div', {}, el('h2', { text: f.spec.name }), el('p.time', {}, el('b', { text: fmt(res.time) }), out.newBest && !out.first ? el('span.tag', { text: 'your best' }) : null, save.settings.assist ? el('span.tag.soft', { text: 'with assist' }) : null),
        el('p.sub', { text: res.falls ? `${res.falls} ${res.falls === 1 ? 'fall' : 'falls'}` : '' }),
        el('ul.goals', {}, goal(true, 'The valley', 'reached'), goal(res.stamp || s.stamp, 'The stamp', res.stamp ? (out.newStamp ? 'new: ' : '') + (st?.name || 'found') : s.stamp ? 'found before' : 'still hidden'), goal(res.seeds === res.seedsAll, 'Every seed', `${res.seeds} of ${res.seedsAll}`), goal(res.lights === res.lightsAll, 'No light lost', res.lights === res.lightsAll ? 'all ' + res.lightsAll + ' lit' : `${res.lightsAll - res.lights} out`))),
        el('div.side', {}, res.stamp && st ? el('figure.newstamp' + (out.newStamp ? '.fresh' : ''), {}, stampCanvas(f.world.theme, res.li, 150), el('figcaption', { text: st.name })) : null, medalRow)),
      el('div.chartwrap', {}, chart, el('p.cap', { text: 'Your run as a loss curve: how high you stood, moment by moment. Lower is better.' })),
      card ? el('div.note' + (fresh ? '.fresh' : ''), {}, cardArt(card.draw), el('div', {}, el('h3', { text: (fresh ? 'New in the notebook: ' : '') + card.name }), ...card.text.slice(0, fresh ? 3 : 1).map((t) => el('p', { text: t })))) : null,
      !nx && run.id !== '7-B' ? el('p.note', { text: 'That is as far as the road is built. The next country is being made.' }) : null,
      el('div.row', {}, nx ? btn('Next', () => play(nx), 'big') : btn('Levels', showLevels, 'big'), btn('Again', () => play(run.id)), nx ? btn('Levels', showLevels) : null)));
    drawCurve(chart, res.curve, out.bestBefore != null && !out.newBest ? s.curve : null, res.top, res.bottom);
  }, 1500);
}
// The run drawn the way a training chart is drawn: loss against steps.
export function drawCurve(c, curve, best, top, bottom) {
  const x = c.getContext('2d'), W = c.width, H = c.height, L = 64, R = 18, T = 18, B = 44, n = Math.max(curve.length, best ? best.length : 0, 2), lo = Math.min(bottom, ...curve) - 0.5, hi = Math.max(top, ...curve) + 0.5;
  const px = (i) => L + (i / (n - 1)) * (W - L - R), py = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  x.clearRect(0, 0, W, H); x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 1; for (let k = 0; k <= 4; k++) { const y = T + (k / 4) * (H - T - B); x.beginPath(); x.moveTo(L, y); x.lineTo(W - R, y); x.stroke(); }
  x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 2; x.beginPath(); x.moveTo(L, T); x.lineTo(L, H - B); x.lineTo(W - R, H - B); x.stroke();
  x.fillStyle = '#a8b7c6'; x.font = '700 19px Nunito, sans-serif'; x.textAlign = 'center'; x.fillText('time', (L + W - R) / 2, H - 10); x.save(); x.translate(22, (T + H - B) / 2); x.rotate(-Math.PI / 2); x.fillText('loss', 0, 0); x.restore();
  const path = (d) => { x.beginPath(); d.forEach((v, i) => (i ? x.lineTo(px(i), py(v)) : x.moveTo(px(i), py(v)))); };
  if (best) { path(best); x.strokeStyle = 'rgba(255,216,122,0.6)'; x.lineWidth = 3; x.setLineDash([8, 7]); x.stroke(); x.setLineDash([]); }
  path(curve); x.lineTo(px(curve.length - 1), H - B); x.lineTo(L, H - B); x.closePath(); const g = x.createLinearGradient(0, T, 0, H - B); g.addColorStop(0, 'rgba(111,208,208,0.4)'); g.addColorStop(1, 'rgba(111,208,208,0.03)'); x.fillStyle = g; x.fill();
  path(curve); x.strokeStyle = '#7fe0dc'; x.lineWidth = 4; x.lineJoin = 'round'; x.stroke();
  x.fillStyle = '#ffd87a'; x.strokeStyle = '#0d1322'; x.lineWidth = 2; x.beginPath(); x.arc(px(curve.length - 1), py(curve[curve.length - 1]), 7, 0, 7); x.fill(); x.stroke();
}

// ---- notebook ----
export function showNotebook() {
  clear(); hud.hidden = true; api.attract(); document.body.classList.add('dim'); sfx.page();
  const ids = Object.keys(CARDS);
  ui.append(sheet('Notebook', showTitle, ids.some((id) => save.cards.includes(id)) ? null : el('p.note', { text: 'Each level you finish adds a page here.' }),
    el('div.pages', {}, ids.map((id) => { const c = CARDS[id], has = save.cards.includes(id) || api.unlockAll;
      return has ? el('article.page', {}, cardArt(c.draw), el('div', {}, el('h3', { text: c.name }), ...c.text.map((t) => el('p', { text: t })), c.math ? el('p.math', { text: c.math }) : null, c.key ? el('p.key', { text: c.key }) : null, c.who ? el('p.who', { text: c.who }) : null))
        : el('article.page.blank', {}, el('div.q', { text: '?' }), el('div', {}, el('h3', { text: 'Not found yet' }))); }))));
}
// Small drawings for the notebook pages, made here like every other picture.
function cardArt(kind) {
  const c = el('canvas.art', { width: 240, height: 180 }), x = c.getContext('2d'), ink = '#23434d', teal = '#3f8f95', gold = '#ffc23d';
  const hill = (f) => { x.beginPath(); for (let i = 0; i <= 240; i += 4) { const y = f(i / 240); i ? x.lineTo(i, y) : x.moveTo(i, y); } };
  const fill = (f) => { hill(f); x.lineTo(240, 180); x.lineTo(0, 180); x.closePath(); const g = x.createLinearGradient(0, 40, 0, 180); g.addColorStop(0, '#bfe3df'); g.addColorStop(1, '#eef6ee'); x.fillStyle = g; x.fill(); hill(f); x.strokeStyle = ink; x.lineWidth = 3; x.lineJoin = 'round'; x.stroke(); };
  const hero = (px, py, s = 26, o = {}) => { x.save(); x.translate(px, py - s * 0.46); x.scale(s, s); drawTheta(x, { ...POSE(), turn: 0.8, ...o }); x.restore(); };
  const arrow = (x0, y0, x1, y1, col = gold) => { const a = Math.atan2(y1 - y0, x1 - x0); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); x.beginPath(); x.moveTo(x1 + Math.cos(a) * 9, y1 + Math.sin(a) * 9); x.lineTo(x1 + Math.cos(a + 2.4) * 11, y1 + Math.sin(a + 2.4) * 11); x.lineTo(x1 + Math.cos(a - 2.4) * 11, y1 + Math.sin(a - 2.4) * 11); x.closePath(); x.fill(); };
  const slope = (u) => 46 + 104 * u * u * (3 - 2 * u), vee = (u) => 44 + 96 * (1 - Math.abs(u - 0.5) * 2) ** 1.4, bowl = (u) => 50 + 100 * Math.sin(u * Math.PI) ** 1.2;
  if (kind === 'loss') { fill(slope); hero(52, slope(52 / 240) - 2, 30); x.setLineDash([5, 6]); x.strokeStyle = teal; x.lineWidth = 2; x.beginPath(); x.moveTo(214, 36); x.lineTo(214, 150); x.stroke(); x.setLineDash([]); x.fillStyle = teal; x.font = '700 17px Nunito, sans-serif'; x.fillText('high', 176, 46); x.fillText('low', 180, 142); }
  else if (kind === 'gradient') { fill(slope); const u = 0.42, px = u * 240, py = slope(u); hero(px, py - 2, 28); arrow(px + 20, py + 14, px + 78, py + 62); }
  else if (kind === 'rate') { fill(bowl); x.strokeStyle = teal; x.lineWidth = 3; x.setLineDash([2, 7]); x.lineCap = 'round'; for (const [a, b, h] of [[0.08, 0.2, 26], [0.2, 0.32, 24]]) { x.beginPath(); x.moveTo(a * 240, bowl(a) - 6); x.quadraticCurveTo((a + b) * 120, bowl(a) - h - 14, b * 240, bowl(b) - 6); x.stroke(); } x.strokeStyle = gold; x.beginPath(); x.moveTo(0.08 * 240, bowl(0.08) - 6); x.quadraticCurveTo(0.3 * 240, -14, 0.52 * 240, bowl(0.52) - 6); x.stroke(); x.setLineDash([]); hero(0.08 * 240, bowl(0.08) - 2, 24); }
  else if (kind === 'overshoot') { fill(vee); x.strokeStyle = gold; x.lineWidth = 3; x.setLineDash([2, 7]); x.lineCap = 'round'; const P = [0.3, 0.76, 0.2, 0.86]; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(P[i] * 240, vee(P[i]) - 6); x.quadraticCurveTo(120, vee(P[i]) - 70 + i * 6, P[i + 1] * 240, vee(P[i + 1]) - 6); x.stroke(); } x.setLineDash([]); hero(P[3] * 240, vee(P[3]) - 2, 24, { expr: 'worry' }); }
  else if (kind === 'plateau') { const shelf = (u) => 44 + (u < 0.22 ? 50 * (u / 0.22) ** 1.5 : u < 0.74 ? 50 + 4 * (u - 0.22) : 52 + 80 * ((u - 0.74) / 0.26) ** 1.4); fill(shelf); hero(0.45 * 240, shelf(0.45) - 2, 24, { expr: 'worry' }); x.strokeStyle = teal; x.lineWidth = 3; x.setLineDash([2, 7]); x.lineCap = 'round'; x.beginPath(); x.moveTo(0.52 * 240, shelf(0.5) - 14); x.lineTo(0.72 * 240, shelf(0.7) - 14); x.stroke(); x.setLineDash([]); arrow(0.76 * 240, shelf(0.76) - 4, 0.9 * 240, shelf(0.9) - 10); }
  else if (kind === 'batch') { const rr = (n) => { const v = Math.sin(n * 91.7) * 43758.5; return v - Math.floor(v); }; for (let i = 0; i < 70; i++) { const px = 16 + rr(i) * 208, py = 16 + rr(i + 200) * 148, on = i % 9 === 0; x.fillStyle = on ? gold : '#b9cfd2'; x.beginPath(); x.arc(px, py, on ? 7 : 4, 0, 7); x.fill(); if (on) { x.strokeStyle = ink; x.lineWidth = 2; x.stroke(); } } }
  else if (kind === 'noisy') { fill(slope); x.strokeStyle = teal; x.lineWidth = 3; x.lineJoin = 'round'; x.beginPath(); for (let i = 0; i <= 14; i++) { const u = 0.08 + (0.8 * i) / 14, y = slope(u) - 12 + (i % 2 ? -9 : 7) * (1 - i / 16); i ? x.lineTo(u * 240, y) : x.moveTo(u * 240, y); } x.stroke(); x.setLineDash([4, 6]); x.strokeStyle = gold; x.beginPath(); x.moveTo(0.08 * 240, slope(0.08) - 12); x.lineTo(0.88 * 240, slope(0.88) - 12); x.stroke(); x.setLineDash([]); hero(0.9 * 240, slope(0.9) - 2, 24, { expr: 'joy' }); }
  else if (kind === 'local' || kind === 'momentum' || kind === 'start') { // a hollow part-way down, and the deeper valley beyond its rim
    const two = (u) => 40 + 30 * u + 52 * Math.sin(Math.min(1, u / 0.5) * Math.PI) ** 1.3 * (u < 0.5 ? 1 : 0) + (u >= 0.5 ? 26 + 82 * Math.sin(((u - 0.5) / 0.5) * Math.PI) ** 1.2 : 0) - (u >= 0.5 ? 26 * (1 - (u - 0.5) * 2) : 0); fill(two);
    if (kind === 'local') { hero(0.25 * 240, two(0.25) - 2, 24, { expr: 'worry' }); x.fillStyle = teal; x.font = '700 15px Nunito, sans-serif'; x.fillText('lower', 0.66 * 240, two(0.75) - 14); }
    else if (kind === 'momentum') { x.strokeStyle = gold; x.lineWidth = 3; x.setLineDash([2, 7]); x.lineCap = 'round'; x.beginPath(); for (let i = 0; i <= 30; i++) { const u = 0.04 + (0.7 * i) / 30, y = two(u) - 12 - (u > 0.42 && u < 0.6 ? 14 * Math.sin(((u - 0.42) / 0.18) * Math.PI) : 0); i ? x.lineTo(u * 240, y) : x.moveTo(u * 240, y); } x.stroke(); x.setLineDash([]); hero(0.75 * 240, two(0.75) - 2, 24, { expr: 'glee', tuck: 1, roll: 0.6 }); }
    else { hero(0.1 * 240, two(0.1) - 2, 20); hero(0.56 * 240, two(0.56) - 2, 20); arrow(0.13 * 240, two(0.13) + 16, 0.22 * 240, two(0.22) + 10, teal); arrow(0.6 * 240, two(0.6) + 16, 0.7 * 240, two(0.7) + 10); } }
  else { fill(bowl); let u = 0.06; x.fillStyle = teal; for (let i = 0; i < 7; i++) { const nu = u + 0.075 * Math.cos(u * Math.PI) + 0.012; x.strokeStyle = teal; x.lineWidth = 3; x.beginPath(); x.moveTo(u * 240, bowl(u) - 5); x.lineTo(nu * 240, bowl(nu) - 5); x.stroke(); x.beginPath(); x.arc(u * 240, bowl(u) - 5, 4.5, 0, 7); x.fill(); u = nu; } hero(u * 240, bowl(u) - 2, 26, { expr: 'proud' }); }
  return c;
}

// ---- the rest ----
function forget(back) { let armed = 0; const b = btn('Forget my progress', () => { if (Date.now() - armed < 5000) { resetSave(); showSettings(back); } else { armed = Date.now(); b.textContent = 'Press again to forget everything'; setTimeout(() => { if (b.isConnected) b.textContent = 'Forget my progress'; }, 5000); } }, 'ghost'); return b; }
function sheet(title, back, ...kids) { return el('div.card.sheet', {}, el('header', {}, el('h2', { text: title }), btn('Back', back, 'ghost')), el('div.body', {}, ...kids)); }
export function showHow() {
  clear(); document.body.classList.add('dim');
  const k = how(), rows = k === 'touch' ? [['Run', 'Slide your left thumb left or right.'], ['Jump', 'The upper button. Tap for a hop, hold for a leap.'], ['Slide', 'Hold the lower button on ice and snow.'], ['Float', 'Hold jump in the air to spread wide and fall slowly.'], ['Roll', 'From Cappadocia on, hold the lower button to tuck in and roll.'], ['Lift', 'From Cappadocia on, press jump again in the air. Mu lifts Theta once between one landing and the next.'], ['Turbo', 'The star button. A burst of speed from Eta. It uses up one spark.']]
    : [['Run', '← → or A D'], ['Jump', 'Space. Tap for a hop, hold for a leap.'], ['Slide', 'Hold Shift on ice and snow.'], ['Float', 'Hold Space in the air to spread wide and fall slowly.'], ['Roll', 'From Cappadocia on, hold Shift to tuck in and roll.'], ['Lift', 'From Cappadocia on, press Space again in the air. Mu lifts Theta once between one landing and the next.'], ['Turbo', 'E. A burst of speed from Eta. It uses up one spark.'], ['Start again', 'R'], ['Pause', 'Esc or P'], ['Sound off', 'M']];
  ui.append(sheet('How to play', showTitle, el('p.lead', { text: 'Find the lowest ground. Every level ends in the deepest valley, where a light is waiting.' }), el('dl.keys', {}, rows.flatMap(([a, b]) => [el('dt', { text: a }), el('dd', { text: b })])),
    el('h3', { text: 'To win a level' }), el('p', { text: 'Bring the seed to the lowest valley while it still has a light, and before that light fades.' }),
    el('h3', { text: 'How a level is lost' }), el('p', { text: 'The seed has three lights, shown at the top left. Every fall puts one out, and so does being thrown by the Geyser. When the last goes out the level is lost.' }), el('p', { text: 'The light also fades with time. The bar under the clock shows how much is left. It is generous, but it does run out.' }), el('p', { text: 'A lost level starts again from the top.' }),
    el('h3', { text: 'Sparks' }), el('p', { text: 'The small stars under the lights are sparks. You begin a level with one, and every five seeds earn another, up to three.' }), el('p', { text: 'A spark can be spent as a turbo. Or it can be kept: if Theta falls with a spark in hand, Eta makes the catch, the spark is spent and no light is lost.' }),
    el('h3', { text: 'Things to find' }), el('dl.keys.finds', {}, [['Seeds', 'Small and golden, all along the way. Five make a spark.'], ['Dewdrops', 'Blue. One relights a light that has gone out. If every light is lit, it becomes a spark.'], ['Feathers', 'Mu’s, hanging in the air from Cappadocia on. Touch one after a lift and Mu can lift again.'], ['Stamps', 'One is hidden in every level, and never in the same sort of place twice. They are kept in the album.']].flatMap(([a, b]) => [el('dt', { text: a }), el('dd', { text: b })])),
    el('h3', { text: 'More than one thing to do' }), el('p', { text: 'A level asks four things, and only the first is needed to go on: reach the valley, find the stamp, gather every seed, and lose no light. The card at the end shows which were done.' }),
    el('h3', { text: 'To win the game' }), el('p', { text: 'Each country has five levels and then a harder last one. Finish that and the next country opens. Medals are for time: gold, silver, bronze.' }),
    el('p.note', { text: 'Height is the lesson. The higher you stand, the worse the guess, so the way to go is always down.' })));
}
export function showSettings(back) {
  clear(); document.body.classList.add('dim'); const s = save.settings;
  const slider = (label, key) => el('label.set', {}, el('span', { text: label }), el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s[key], on: { input: (e) => { s[key] = +e.target.value; setVolumes({ music: s.music, sfx: s.sfx, voice: s.voice }); store(); } } }));
  const pick = (label, key, opts, after) => el('label.set', {}, el('span', { text: label }), el('div.seg', {}, opts.map(([v, t]) => el('button' + (s[key] === v ? '.on' : ''), { type: 'button', on: { click: () => { s[key] = v; store(); after?.(); showSettings(back); } } }, t))));
  ui.append(sheet('Settings', back, slider('Music', 'music'), slider('Sound', 'sfx'), slider('Theta’s voice', 'voice'),
    pick('Picture', 'gfx', [[-1, 'Auto'], [0, 'Plain'], [1, 'Good'], [2, 'Full']], api.applyGfx), pick('Motion', 'motion', [[true, 'Full'], [false, 'Reduced']]), pick('Text', 'text', [[1, 'Normal'], [1.2, 'Larger'], [1.4, 'Largest']], api.applyText),
    pick('Assist', 'assist', [[false, 'Off'], [true, 'On']]), el('p.note', { text: 'Assist slows the game by a fifth, gives the seed five lights and takes away the time limit. Times set with it are kept apart and win no medals.' }),
    pick('Colours', 'safe', [[false, 'Standard'], [true, 'High contrast']], api.applyGfx),
    el('div.row', {}, forget(back))));
}
export function showAlso() {
  clear(); document.body.classList.add('dim');
  ui.append(sheet('Also play this!', showTitle, el('div.also', {},
    el('a.link', { href: 'https://thesocietyatlas.net/', target: '_blank', rel: 'noopener' }, el('b', { text: 'The Society Atlas' }), el('span', { text: 'A walk through the social sciences, campus by campus.' })),
    el('a.link', { href: 'https://cantayus.github.io/the-missing-variable/', target: '_blank', rel: 'noopener' }, el('b', { text: 'The Missing Variable' }), el('span', { text: 'Data science and artificial intelligence, and a library that keeps getting narrower.' })))));
}
export function showCredits() {
  clear(); document.body.classList.add('dim');
  ui.append(sheet('Credits', showTitle, el('section', {}, el('h3', { text: 'Created by' }), el('p.big', { text: 'Cantay Caliskan' }), el('p', { text: 'He teaches data science and artificial intelligence, and studies politics and society with computational methods.' }), el('p', {}, el('a', { href: 'https://www.cantaycaliskan.net/', target: '_blank', rel: 'noopener', text: 'cantaycaliskan.net' }))),
    el('section', {}, el('h3', { text: 'Made with' }), el('p', { text: 'Typefaces: Fredoka and Nunito, under the SIL Open Font Licence. All pictures are drawn by the program. All sound is made in your browser.' }))));
}
addEventListener('keydown', (e) => { if (e.code === 'Escape' || e.code === 'KeyP') { if (api?.G.paused) { clear(); api.G.paused = false; } else pause(); } else if (e.code === 'KeyR') restart(); else if (e.code === 'KeyM') mute(); else if (e.code === 'Enter' || e.code === 'Space') { if (document.activeElement?.tagName !== 'BUTTON') { const b = ui.querySelector('.btn.big'); if (b) { b.click(); e.preventDefault(); } } }
  else if (/^Arrow(Up|Down)$|^Key[WS]$/.test(e.code)) { const list = [...ui.querySelectorAll('.titem, .menu .btn')]; if (list.length) { const i = list.indexOf(document.activeElement), d = /Up|KeyW/.test(e.code) ? -1 : 1; list[(i + d + list.length) % list.length].focus(); sfx.ui(); } } });
