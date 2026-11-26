// The screens round the game: title, levels, the card after a run, the notebook, settings, credits. All plain HTML over the canvas.
import { save, store, resetSave, record, ghostFor } from '../core/save.js';
import { WORLDS, levelById, ALL, nextLevel, medals, todayId } from '../data/worlds.js';
import { LAND, PRESETS, runRule } from '../data/lab.js';
import { CARDS, HINTS, TUTOR, ASK, BOSS } from '../data/notebook.js';
import { STORY, ROUTE } from '../data/story.js';
import { audio, initAudio, setVolumes, playMusic, sfx, mute } from '../core/audio.js';
import { input, DEFAULT_KEYS } from '../core/input.js';
import { drawTheta, POSE, COL, WEAR } from '../game/theta.js';
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

export function initUI(a) { api = a; hud.replaceChildren(el('div.h-lights'), el('div.h-sparks'), el('div.h-bar', {}, el('i')), el('div.h-name', {}, el('small'), el('b'), el('i')), el('div.h-clock'), el('div.h-seeds'), el('div.h-stamp', { title: 'The stamp hidden in this level' }), el('div.h-hint'), el('div.h-tutor', { hidden: true }), el('button.h-home', { type: 'button', 'aria-label': 'Title screen', title: 'Title screen (T)', on: { click: () => home() }, html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 4.5l8 7M6.5 10v9h11v-9M10.3 19v-5h3.4v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' }), el('button.h-pause', { type: 'button', 'aria-label': 'Pause', title: 'Pause (P)', on: { click: () => pause() } }, 'II')); }

// ---- title ----
// A wide, quiet look at the country with the name over it and one line asking for a key; the menu comes only after that.
// (A browser will not play sound before the player has touched something, so the first key is also what starts the music.)
let awake = false, framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }      // inside a frame the keyboard is not ours until the player has clicked
const emblem = () => el('div.emblem', { html: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="32" rx="19" ry="26" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M13.5 27 C 24 27, 27 38, 38 38 S 47 36, 50.5 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="38" cy="38" r="2.6" fill="#ffd76a"/></svg>' });
export function showTitle() {
  clear(); api.attract(); hud.hidden = true; document.getElementById('touch').hidden = true; if (awake) playMusic('title');
  const next = ALL.find((id) => !save.levels[id]?.done) || ALL[0], any = Object.keys(save.levels).length > 0;
  const items = [[any ? 'Continue' : 'New game', () => (any || save.seen.tutor ? play(next) : askTutor(next))], any && ['Levels', showLevels], ['Tutorial', () => play('T')], any && ['The story', showStory], any && ['Stamps', showAlbum], ['Notebook', showNotebook], ['The lab', showLab], ['More', showMore], ['How to play', showHow], ['Settings', () => showSettings(showTitle)], ['Also play this!', showAlso], ['Credits', showCredits]].filter(Boolean);
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

// ---- the lesson: offered once, before the first level, and always there on the menu ----
function askTutor(next) {
  clear(); document.body.classList.add('dim');
  ui.append(el('div.card.small', {}, el('h2', { text: 'First time here?' }), el('p', { text: 'There is a practice slope with a short lesson: running, jumping, rolling, a turbo, and the things there are to find. It takes about two minutes, and nothing can be lost on it.' }),
    el('div.row', {}, btn('Take the lesson', () => play('T'), 'big'), btn('Go straight in', () => { save.seen.tutor = true; store(); play(next); }))));
}
function tutorDone() {
  save.seen.tutor = true; store(); const next = ALL.find((id) => !save.levels[id]?.done) || ALL[0], any = Object.keys(save.levels).length > 0;
  setTimeout(() => { hud.hidden = true; document.body.classList.add('dim'); playMusic('card');
    ui.append(el('div.card.small', {}, el('h2', { text: 'That is all you need' }), el('p', { text: 'Run, jump, roll, and spend a spark when a gap is too wide. Look for the stamp. Find the lowest ground.' }),
      el('p.note', { text: 'One more thing comes a little later: a lift in the air from a bird called Mu. It is explained when Mu arrives.' }),
      el('div.row', {}, btn(any ? 'Continue' : 'Begin', () => play(next), 'big'), btn('Again', () => play('T')), btn('Title', showTitle)))); }, 1500);
}
// ---- playing ----
let run = null, hintT = 0;
export function play(id, told = false) {
  if (STORY[id] && !told && (!save.seen['story' + id] || api.forceIntro)) return showTale(id, () => play(id, true));
  clear(); hud.hidden = false; const f = levelById(id); run = { id, f, shown: null };
  const intro = !!f.spec.intro && (!save.seen.intro || api.forceIntro);
  const p = api.startLevel(id, { ghost: ghostFor(id), intro, meet: id === '1-3' && (!save.seen.mu || api.forceIntro) }); if (!p) return showTitle();
  ui.append(el('div.veil' + (intro ? '.slow' : '.quick')));      // every level comes up out of black
  playMusic(f.spec.music || f.world.music); hud.querySelector('.h-name small').textContent = f.world.name; hud.querySelector('.h-name b').textContent = f.spec.name; hud.classList.remove('fresh'); hud.classList.toggle('intro', intro); if (!intro) card();
  document.getElementById('touch').hidden = !('ontouchstart' in window); api.G.paused = false;
}
function card() { void hud.offsetWidth; hud.classList.add('fresh'); clearTimeout(run.cardT); run.cardT = setTimeout(() => hud.classList.remove('fresh'), 4200); }
export function muMet() { save.seen.mu = true; store(); }
export function introDone() { if (!run) return; save.seen.intro = true; store(); hud.classList.remove('intro'); card(); }
export function frameUI(p) {
  if (!p || hud.hidden || !run) return;
  if (p.started && hud.classList.contains('fresh') && p.clock > 0.6) hud.classList.remove('fresh');
  hud.querySelector('.h-clock').textContent = !p.started ? '' : p.spec.endless ? Math.max(0, Math.round(p.b.x - p.level.start.x)) + ' m' : fmt(p.clock);
  // the rules, where they can be seen: the seed's lights, and how much of its light is left
  const hl = hud.querySelector('.h-lights'); if (hl.childElementCount !== p.lightsAll) hl.replaceChildren(...Array.from({ length: p.lightsAll }, () => el('i'))); [...hl.children].forEach((n, i) => n.classList.toggle('out', i >= p.lights));
  const hs = hud.querySelector('.h-sparks'); if (hs.childElementCount !== p.sparksAll) hs.replaceChildren(...Array.from({ length: p.sparksAll }, () => el('i', { text: '✦' }))); [...hs.children].forEach((n, i) => n.classList.toggle('out', i >= p.sparks));
  const bar = hud.querySelector('.h-bar'), left = p.limit - p.clock; bar.hidden = !Number.isFinite(p.limit); if (!bar.hidden) { bar.firstChild.style.width = Math.max(0, Math.min(100, (left / p.limit) * 100)) + '%'; bar.classList.toggle('low', left < 15); }
  const tu = hud.querySelector('.h-tutor'); tu.hidden = !p.spec.tutorial || p.done;
  if (p.spec.tutorial) { const ms = p.level.marks.filter((k) => k.kind === 'tutor'); let i = 0; for (let k = 0; k < ms.length; k++) if (p.b.x >= ms[k].x - 1.5) i = k; const dev = how();
    if (run.step !== i || run.dev !== dev) { if (run.step != null && i > run.step) sfx.ui(true); run.step = i; run.dev = dev; const L = TUTOR[ms[i].text]; tu.replaceChildren(el('small', { text: `Lesson ${i + 1} of ${ms.length}` }), el('b', { text: L.name }), el('span', { text: keyed(L[dev]) })); tu.classList.remove('in'); void tu.offsetWidth; tu.classList.add('in'); } }
  const hst = hud.querySelector('.h-stamp'); hst.hidden = !p.level.items.some((i) => i.kind === 'stamp'); hst.classList.toggle('got', !!p.stamp);
  hud.querySelector('.h-seeds').textContent = p.level.seeds.length ? `${p.seeds} / ${p.level.seeds.length}` : '';
  const m = p.level.marks.find((k) => k.kind === 'hint' && p.b.x > k.x - 7 && p.b.x < k.x + 16), text = m && !p.done ? keyed(HINTS[m.text]?.[how()]) : null, h = hud.querySelector('.h-hint');
  if (text !== run.shown) { run.shown = text; h.textContent = text || ''; h.classList.toggle('on', !!text); }
}
export function pause() {
  if (!api.G.play || hud.hidden || api.G.paused || api.G.play.done) return; api.G.paused = true; document.body.classList.add('dim');
  const back = () => { clear(); api.G.paused = false; };
  ui.append(el('div.card.small', {}, el('h2', { text: 'Paused' }), el('div.menu', {}, btn('Go on', back, 'big'), btn('Start again', () => play(run.id)), btn('Settings', () => showSettings(() => { clear(); api.G.paused = false; pause(); })), btn('Levels', showLevels), btn('Title', showTitle))));
}
export function restart() { if (run && !hud.hidden) play(run.id); }
// One press, from anywhere, and the title screen is back: the T key or Home, the house in the corner of a level, Back (Select) on a pad.
export function home() { if (!api || ui.querySelector('.cine')) return; initAudio(); sfx.ui(true); showTitle(); }

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
  const ch = STORY[key]; if (!ch) return then(); clear(); hud.hidden = true; const w = WORLDS[ch.at], way = { '2-1': 'balloon', '3-1': 'current', '4-1': 'bird', '5-1': 'balloon', '6-1': 'bird', '7-1': 'bird' }[key];
  if (way && then !== showTitle && then !== showStory) api.travel(w.id, way); else api.attract(); playMusic('title'); sfx.page(); save.seen['story' + key] = true; store();
  const go = () => { sfx.ui(true); then(); };
  ui.append(el('div.tale' + (way && then !== showTitle && then !== showStory ? '.journey' : ''), {}, el('div.inner', {}, el('small', { text: 'The story' }), el('h2', { text: ch.title }), route(ch.at), ...ch.lines.map((t, i) => el('p', { style: `--i:${i}`, text: t })), el('div.row', { style: `--i:${ch.lines.length}` }, el('button.btn.big', { type: 'button', on: { click: go } }, then === showTitle || then === showStory ? 'Back' : 'Go on')))));
}
// ---- the ending: the last chapter told over the scene it describes, then the credits rolling over the same scene, then the way on ----
export function showEnding() {
  const ch = STORY.end; clear(); hud.hidden = true; document.getElementById('touch').hidden = true; api.ending(); playMusic('title'); save.seen.storyend = true; save.seen.end = true; store();
  const n = ch.lines.length, stamps = ALL.filter((id) => save.levels[id]?.stamp).length, box = el('div.tale.ending'); let stage = 0, timer = 0;
  const last = () => { stage = 2; clearTimeout(timer); box.replaceChildren(el('div.inner.last', {}, el('p.fin', { text: 'The end' }), el('p.note', { text: stamps < ALL.length ? `${stamps} of ${ALL.length} stamps are in the album. The rest are still out there.` : 'Every stamp is in the album.' }),
    el('div.row', {}, btn('Title', showTitle, 'big'), btn('The long descent', () => playEndless()), btn('The lab', showLab)))); };
  const roll = () => { stage = 1; clearTimeout(timer); const line = (cls, text) => el('p' + (cls ? '.' + cls : ''), { text });
    box.replaceChildren(el('div.roll', {}, el('div.reel', {}, line('big', 'Gradient Descent'), line('head', 'Created by'), line('big', 'Cantay Caliskan'), line('', 'He teaches data science and artificial intelligence, and studies politics and society with computational methods.'),
      el('p', {}, el('a', { href: 'https://www.cantaycaliskan.net/', target: '_blank', rel: 'noopener', text: 'cantaycaliskan.net' })),
      line('head', 'The countries'), ...WORLDS.map((w) => line('', w.name)), line('head', 'The notebook'), line('', 'The ideas in it are the work of the people named on its pages.'),
      line('head', 'Made with'), line('', 'Typefaces: Fredoka and Nunito, under the SIL Open Font Licence.'), line('', 'All pictures are drawn by the program. All sound is made in your browser.'),
      line('head', 'Also play this!'), el('p', {}, el('a', { href: 'https://thesocietyatlas.net/', target: '_blank', rel: 'noopener', text: 'The Society Atlas' })), el('p', {}, el('a', { href: 'https://cantayus.github.io/the-missing-variable/', target: '_blank', rel: 'noopener', text: 'The Missing Variable' })),
      line('big.thanks', 'Thank you for playing.'))), el('button.skip', { type: 'button', on: { click: last } }, 'Skip')); timer = setTimeout(last, 46000); };
  box.append(el('div.inner', {}, el('small', { text: ch.title }), ...ch.lines.map((t, i) => el('p', { style: `--i:${i * 3 + 2}`, text: t }))), el('button.skip', { type: 'button', on: { click: roll } }, 'Go on'));
  ui.append(box); timer = setTimeout(roll, (n * 3 + 9) * 1000);
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
  if (run.f.spec.endless) return longEnd(res, false);
  setTimeout(() => { hud.hidden = true; document.body.classList.add('dim'); playMusic('card');
    ui.append(el('div.card.small.fail', {}, el('h2', { text: why === 'time' ? 'The light faded' : 'The lights went out' }),
      el('p', { text: why === 'time' ? 'The seed’s light does not last for ever, and this time it faded before the valley.' : 'Every fall puts out one of the seed’s lights, and that was the last of them.' }), el('p.note', { text: 'It will be lit again at the top.' }),
      el('div.menu', {}, btn('Try again', () => play(run.id, true), 'big'), btn('Levels', showLevels), btn('Title', showTitle)),
      save.settings.assist ? null : el('p.note', { text: 'Assist, in Settings, gives five lights and no time limit.' }))); }, 1100);
}

// ---- the card after a run ----
export function showFinish(res) {
  if (run.f.spec.tutorial) return tutorDone(); if (run.f.spec.endless) return longEnd(res, true);
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
      f.spec.daily ? shareRow(f, res) : null,
      el('div.row', {}, nx ? btn('Next', () => (f.spec.boss && !save.seen['sort' + f.world.n] ? showSort(f.world.n, () => play(nx)) : play(nx)), 'big') : run.id === '7-B' ? btn('The ending', showEnding, 'big') : f.spec.daily ? btn('More', showMore, 'big') : btn('Levels', showLevels, 'big'), btn('Again', () => play(run.id)), nx || run.id === '7-B' ? btn('Levels', showLevels) : null, btn('Title', showTitle))));
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
  else if (kind === 'chain' || kind === 'explode' || kind === 'vanish' || kind === 'skip') {   // a chain of layers, and over each the size of the signal passed back to it from the far end
    const n = 6, bx = (i) => 26 + i * 38, by = 122; x.strokeStyle = ink; x.lineWidth = 3; x.beginPath(); x.moveTo(bx(0), by); x.lineTo(bx(n - 1), by); x.stroke();
    for (let i = 0; i < n; i++) { x.fillStyle = '#eef6ee'; x.beginPath(); x.arc(bx(i), by, 11, 0, 7); x.fill(); x.stroke(); }
    const f = kind === 'explode' ? 1.45 : kind === 'vanish' ? 0.62 : 1, h0 = kind === 'vanish' ? 80 : kind === 'explode' ? 12 : 34;
    for (let i = 0; i < n; i++) { const h = h0 * f ** (n - 1 - i); x.fillStyle = kind === 'chain' || kind === 'skip' ? teal : gold; x.fillRect(bx(i) - 8, by - 20 - h, 16, h); }
    if (kind === 'skip') { x.strokeStyle = gold; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(bx(4), by - 62); x.quadraticCurveTo(bx(2.5), by - 128, bx(1) + 8, by - 66); x.stroke(); x.fillStyle = gold; x.beginPath(); x.moveTo(bx(1) - 2, by - 58); x.lineTo(bx(1) + 16, by - 62); x.lineTo(bx(1) + 6, by - 78); x.closePath(); x.fill(); }
    arrow(bx(n - 1) - 4, by + 34, bx(0) + 12, by + 34, kind === 'chain' || kind === 'skip' ? gold : teal); }
  else if (kind === 'overfit' || kind === 'regular' || kind === 'valid') {      // examples as dots, and a line drawn through them: the plain trend, or every wobble
    const rr = (n) => { const v = Math.sin(n * 91.7) * 43758.5; return v - Math.floor(v); }, tr = (u) => 136 - 86 * u - 26 * Math.sin(u * 2.6), pts = Array.from({ length: 11 }, (_, i) => { const u = 0.06 + (0.88 * i) / 10; return [u * 240, tr(u) + (rr(i + 3) - 0.5) * 46, i % 4 === 2]; });
    const smoothLine = (col, w) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); for (let i = 0; i <= 40; i++) { const u = 0.04 + (0.92 * i) / 40; i ? x.lineTo(u * 240, tr(u)) : x.moveTo(u * 240, tr(u)); } x.stroke(); };
    if (kind === 'overfit') { x.setLineDash([4, 7]); smoothLine(teal, 3); x.setLineDash([]); x.strokeStyle = gold; x.lineWidth = 4; x.lineJoin = 'round'; x.beginPath(); pts.forEach(([px, py], i) => { if (!i) x.moveTo(px, py); else { const [qx, qy] = pts[i - 1]; x.bezierCurveTo(qx + 9, qy + (i % 2 ? 30 : -30), px - 9, py + (i % 2 ? -30 : 30), px, py); } }); x.stroke(); }
    else if (kind === 'regular') smoothLine(gold, 5); else smoothLine(teal, 3);
    for (const [px, py, aside] of pts) { const held = kind === 'valid' && aside; x.fillStyle = held ? gold : '#eef6ee'; x.strokeStyle = ink; x.lineWidth = 2.5; x.beginPath(); x.arc(px, py, held ? 8 : 6, 0, 7); x.fill(); x.stroke(); if (held) { x.strokeStyle = gold; x.lineWidth = 2; x.setLineDash([3, 4]); x.beginPath(); x.arc(px, py, 14, 0, 7); x.stroke(); x.setLineDash([]); } } }
  else if (kind === 'early') { const tra = (u) => 40 + 110 * (1 - Math.exp(-u * 3.2)), val = (u) => 36 + 86 * (1 - Math.exp(-u * 4.5)) - 150 * Math.max(0, u - 0.42) ** 1.6; x.strokeStyle = ink; x.lineWidth = 2; x.beginPath(); x.moveTo(20, 16); x.lineTo(20, 164); x.lineTo(228, 164); x.stroke();
    const curve = (f, col) => { x.strokeStyle = col; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, px = 24 + u * 196, py = f(u); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }; curve(tra, teal); curve(val, gold);
    let bu = 0, bv = -1; for (let i = 0; i <= 100; i++) { const v = val(i / 100); if (v > bv) { bv = v; bu = i / 100; } } const sx = 24 + bu * 196; x.setLineDash([4, 6]); x.strokeStyle = ink; x.lineWidth = 2; x.beginPath(); x.moveTo(sx, 20); x.lineTo(sx, 164); x.stroke(); x.setLineDash([]); hero(sx, bv - 2, 22, { expr: 'joy' }); x.fillStyle = ink; x.font = '700 14px Nunito, sans-serif'; x.fillText('stop', sx - 14, 16); }
  else if (kind === 'general') { fill(slope); hero(0.3 * 240, slope(0.3) - 2, 26); x.fillStyle = 'rgba(238,246,238,0.82)'; x.fillRect(132, 0, 108, 180); x.setLineDash([3, 7]); x.strokeStyle = ink; x.lineWidth = 3; x.beginPath(); for (let i = 132; i <= 240; i += 4) { const y = slope(i / 240) + Math.sin(i * 0.11) * 9; i > 132 ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); x.setLineDash([]); x.fillStyle = teal; x.font = '700 30px Fredoka, sans-serif'; x.fillText('?', 178, 76); }
  else if (kind === 'clip') { fill(slope); const u = 0.3, px = u * 240, py = slope(u); hero(px, py - 2, 26); x.setLineDash([4, 8]); x.strokeStyle = gold; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(px + 66, py + 44); x.lineTo(px + 150, py + 100); x.stroke(); x.setLineDash([]);
    x.strokeStyle = teal; x.lineWidth = 3; x.beginPath(); x.arc(px + 20, py + 12, 62, -0.1, 1.5); x.stroke(); arrow(px + 20, py + 12, px + 62, py + 40); }
  else if (kind === 'local' || kind === 'momentum' || kind === 'start') { // a hollow part-way down, and the deeper valley beyond its rim
    const two = (u) => 40 + 30 * u + 52 * Math.sin(Math.min(1, u / 0.5) * Math.PI) ** 1.3 * (u < 0.5 ? 1 : 0) + (u >= 0.5 ? 26 + 82 * Math.sin(((u - 0.5) / 0.5) * Math.PI) ** 1.2 : 0) - (u >= 0.5 ? 26 * (1 - (u - 0.5) * 2) : 0); fill(two);
    if (kind === 'local') { hero(0.25 * 240, two(0.25) - 2, 24, { expr: 'worry' }); x.fillStyle = teal; x.font = '700 15px Nunito, sans-serif'; x.fillText('lower', 0.66 * 240, two(0.75) - 14); }
    else if (kind === 'momentum') { x.strokeStyle = gold; x.lineWidth = 3; x.setLineDash([2, 7]); x.lineCap = 'round'; x.beginPath(); for (let i = 0; i <= 30; i++) { const u = 0.04 + (0.7 * i) / 30, y = two(u) - 12 - (u > 0.42 && u < 0.6 ? 14 * Math.sin(((u - 0.42) / 0.18) * Math.PI) : 0); i ? x.lineTo(u * 240, y) : x.moveTo(u * 240, y); } x.stroke(); x.setLineDash([]); hero(0.75 * 240, two(0.75) - 2, 24, { expr: 'glee', tuck: 1, roll: 0.6 }); }
    else { hero(0.1 * 240, two(0.1) - 2, 20); hero(0.56 * 240, two(0.56) - 2, 20); arrow(0.13 * 240, two(0.13) + 16, 0.22 * 240, two(0.22) + 10, teal); arrow(0.6 * 240, two(0.6) + 16, 0.7 * 240, two(0.7) + 10); } }
  else { fill(bowl); let u = 0.06; x.fillStyle = teal; for (let i = 0; i < 7; i++) { const nu = u + 0.075 * Math.cos(u * Math.PI) + 0.012; x.strokeStyle = teal; x.lineWidth = 3; x.beginPath(); x.moveTo(u * 240, bowl(u) - 5); x.lineTo(nu * 240, bowl(nu) - 5); x.stroke(); x.beginPath(); x.arc(u * 240, bowl(u) - 5, 4.5, 0, 7); x.fill(); u = nu; } hero(u * 240, bowl(u) - 2, 26, { expr: 'proud' }); }
  return c;
}

// ---- more to do: the valley of the day, Sort!, the long descent, the lab, the page for teachers ----
const doneLv = (id) => !!save.levels[id]?.done;
export function showMore() {
  clear(); hud.hidden = true; api.attract(); document.body.classList.add('dim'); if (awake) playMusic('title');
  const bosses = WORLDS.filter((w) => doneLv(w.levels[5].id)).length, any = api.unlockAll || doneLv('1-1'), today = save.levels[todayId()], long = save.long || { best: 0 };
  const WHY = 'Opens when the first level is finished.';
  const tile = (name, text, fn, ok = true, why = '') => el('button.tile' + (ok ? '' : '.locked'), { type: 'button', disabled: !ok, on: { click: () => { initAudio(); sfx.ui(true); fn(); } } }, el('b', { text: name }), el('span', { text: ok ? text : why }));
  ui.append(sheet('More', showTitle, el('div.tiles', {},
    tile('Today’s valley', 'One new valley every day, the same for everyone who plays it.' + (today?.best != null ? ` Your best today: ${fmt(today.best)}.` : ''), () => play(todayId()), any, WHY),
    tile('Sort!', 'Seeds from stones, as fast as they come. Under a minute.', () => showSort(Math.max(1, Math.min(6, bosses || 1)), showMore), any, WHY),
    tile('The long descent', 'One long hill that grows harder as it goes. How far can the light be carried?' + (long.best ? ` Your best: ${long.best} m.` : ''), () => playEndless(), any, WHY),
    tile('The hidden valley', 'Iceland by night, and a long way down that is meant to be flown. Nothing can be lost in it.', () => play('H'), any, WHY),
    tile('Wardrobe', 'Hats, colours and trails, earned with seeds and stamps. None of them does anything.', showWardrobe, any, WHY),
    tile('For teachers', 'Every level, the idea it shows, and a question for the class afterwards.', showTeachers, any, WHY))));
}
export function playEndless() { save.long = save.long || { runs: 0, best: 0 }; const id = 'E-' + (Math.floor(Date.now() / 864e5) * 7 + save.long.runs); save.long.runs++; store(); play(id); }
function longEnd(res, whole) {
  const d = Math.round(res.dist), L = save.long = save.long || { runs: 1, best: 0 }, was = L.best, best = d > was; if (best) { L.best = d; store(); }
  setTimeout(() => { hud.hidden = true; document.body.classList.add('dim'); playMusic('card'); if (best) sfx.medal(1);
    ui.append(el('div.card.small', {}, el('h2', { text: whole ? 'The foot of the hill' : 'The lights went out' }), el('p.dist', {}, el('b', { text: String(d) }), ' metres down the long descent'),
      el('p', { text: whole ? 'That is all of it: there is no further down to go on this hill.' : best && was ? `Further than ever before. Your best was ${was}.` : best ? 'A first mark to beat.' : `Your best is ${was}.` }),
      el('p.note', { text: `Seeds ${res.seeds} · ${res.falls} ${res.falls === 1 ? 'fall' : 'falls'}. Every run is a different hill.` }), el('div.row', {}, btn('Again', () => playEndless(), 'big'), btn('More', showMore), btn('Title', showTitle)))); }, whole ? 1500 : 1100);
}
const shareLine = (f, res) => { const d = f.spec.daily; return `Gradient Descent · ${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)} · ${f.world.name} · ${fmt(res.time)} · ${'●'.repeat(res.lights)}${'○'.repeat(res.lightsAll - res.lights)} · seeds ${res.seeds}/${res.seedsAll}${res.stamp ? ' · stamp' : ''}`; };
function shareRow(f, res) { const code = shareLine(f, res), inp = el('input.code', { value: code, readonly: '', 'aria-label': 'Your result as a line of text' }), b = btn('Copy', () => { inp.select(); try { navigator.clipboard?.writeText(code)?.catch?.(() => {}); document.execCommand?.('copy'); } catch (e) { /* the text is selected: it can be copied by hand */ } b.textContent = 'Copied'; });
  return el('div.share', {}, el('p.cap', { text: 'Today’s valley is the same for everyone. Your result, as a line to send to someone:' }), el('div.row', {}, inp, b)); }

// ---- the page for teachers ----
export function showTeachers() {
  clear(); hud.hidden = true; api.attract(); document.body.classList.add('dim'); const link = (text, href) => el('a', { href, text });
  ui.append(sheet('For teachers', showTitle,
    el('p.lead', { text: 'Each level shows one idea from the way machines learn. Below is every level, the idea it shows, and a question worth asking the class afterwards.' }),
    el('p', {}, 'Any level can be opened by its own address, so one can be put on a slide. The links on this page open the game with everything unlocked and nothing saved, so a class cannot write over anyone’s progress. ', link('The whole game, unlocked', '?class'), ' · ', link('The lab', '?class&lab'), ' · ', link('The tutorial', '?class&level=T')),
    el('p.note', { text: 'In the lab, Theta walks down a hill alone by the real rule of gradient descent, with sliders for the learning rate, the momentum and the noise. Its ready-made settings repeat what went wrong at the end of each country.' }),
    WORLDS.map((w) => el('section.teach', {}, el('h3', { text: `${w.n}. ${w.name}` }), el('table', {}, el('thead', {}, el('tr', {}, el('th', { text: 'Level' }), el('th', { text: 'The idea' }), el('th', { text: 'A question for the class' }))),
      el('tbody', {}, w.levels.map((l) => { const c = CARDS[l.card]; return el('tr', {}, el('td', {}, link(l.name, `?class&level=${l.id}`)), el('td', {}, c ? el('b', { text: c.name + '. ' }) : null, c ? c.text[0] : BOSS[l.boss] || ''), el('td', { text: ASK[l.id] || '' })); })))))));
}

// ---- the lab: any hill, any step, and Theta walking down it alone ----
export function showLab() {
  clear(); hud.hidden = true; api.attract(); document.body.classList.add('dim'); if (awake) playMusic('card');
  const st = { land: 'bowl', eta: 0.3, mu: 0, sigma: 0, limit: 0, start: LAND.bowl.start, run: null, t: 0, last: 0, say: 'Choose a hill, set the sliders, and press Go. Click on the hill to put Theta somewhere else.' };
  const cv = el('canvas.labc', { width: 900, height: 400 }), ch = el('canvas.labc.chart', { width: 900, height: 200 }), out = el('p.labout', { 'aria-live': 'polite' }), rule = el('p.labrule'), say = el('p.labsay'), lands = el('div.seg.lands'), sl = {};
  const gauss = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * Math.random()); };
  const X = (th) => 44 + (th / 10) * (cv.width - 88), Y = (L) => cv.height - 36 - (Math.min(L, 7.6) / 7.6) * (cv.height - 84), land = () => LAND[st.land];
  const text = () => { rule.textContent = st.mu > 0 ? `v ← ${st.mu.toFixed(2)} · v − ${st.eta.toFixed(2)} · g        θ ← θ + v` : `θ ← θ − ${st.eta.toFixed(2)} · g`; say.textContent = st.say;
    [...lands.children].forEach((b) => b.classList.toggle('on', b.dataset.k === st.land)); for (const k of Object.keys(sl)) { sl[k][0].value = st[k]; sl[k][1].textContent = k === 'limit' && !st.limit ? 'off' : (+st[k]).toFixed(k === 'eta' || k === 'mu' ? 2 : 1); } };
  const reset = () => { st.run = null; out.textContent = ''; text(); };
  const slider = (label, key, min, max, step, note) => { const inp = el('input', { type: 'range', min, max, step, value: st[key], 'aria-label': label, on: { input: () => { st[key] = +inp.value; reset(); } } }), o = el('output'); sl[key] = [inp, o]; return el('label.sl', {}, el('span', {}, el('b', { text: label }), note), inp, o); };
  for (const [k, L] of Object.entries(LAND)) lands.append(el('button', { type: 'button', 'data-k': k, on: { click: () => { st.land = k; st.start = L.start; st.say = L.name + '. Press Go.'; reset(); } } }, L.name));
  const go = () => { initAudio(); st.run = runRule(land(), st, { start: st.start, rand: gauss, steps: 200 }); st.t = 0; st.last = performance.now(); out.textContent = ''; sfx.ui(true); };
  cv.addEventListener('pointerdown', (e) => { const r = cv.getBoundingClientRect(), th = (((e.clientX - r.left) / r.width) * cv.width - 44) / (cv.width - 88) * 10; st.start = Math.max(0.1, Math.min(9.9, th)); reset(); });
  const ended = () => { const R = st.run, p = R.path[R.path.length - 1], n = p.n; let lo = 1e9; for (let x = 0; x <= 10; x += 0.01) lo = Math.min(lo, land().f(x));
    out.textContent = R.end === 'left' ? `After ${n} steps it had left the hill altogether. The steps grew instead of shrinking.` : R.end === 'settled' ? `Settled after ${n} steps, at a loss of ${p.loss.toFixed(2)}.` + (p.loss > lo + 0.2 ? ' That is not the lowest ground on this hill.' : ' That is the lowest ground on this hill.')
      : R.end === 'noisy' ? `After ${n} steps of shaking it stands at a loss of ${p.loss.toFixed(2)}.` + (p.loss > lo + 0.4 ? '' : ' That is close to the lowest ground.') : `Still moving after ${n} steps, at a loss of ${p.loss.toFixed(2)}.`; };
  const draw = (now) => { if (!cv.isConnected) return; requestAnimationFrame(draw); const x = cv.getContext('2d'), W = cv.width, H = cv.height, f = land().f, R = st.run;
    if (R) { const was = st.t; st.t = Math.max(0, Math.min(R.path.length - 1, st.t + (Math.max(0, now - st.last) / 1000) * (st.t > 30 ? 22 : 7))); if (was < R.path.length - 1 && st.t >= R.path.length - 1) ended(); if (Math.floor(st.t) > Math.floor(was) && st.t < 60) sfx.step(true); } st.last = now;
    x.clearRect(0, 0, W, H); const g = x.createLinearGradient(0, 40, 0, H); g.addColorStop(0, '#2f6f78'); g.addColorStop(1, '#10262c'); x.fillStyle = g; x.beginPath(); x.moveTo(X(0), H); for (let i = 0; i <= 200; i++) x.lineTo(X(i / 20), Y(f(i / 20))); x.lineTo(X(10), H); x.closePath(); x.fill();
    x.strokeStyle = '#8fe0dc'; x.lineWidth = 3; x.lineJoin = 'round'; x.beginPath(); for (let i = 0; i <= 200; i++) { const px = X(i / 20), py = Y(f(i / 20)); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
    x.fillStyle = '#a8b7c6'; x.font = '600 13px Nunito, sans-serif'; x.fillText('loss', 8, 22); x.fillText('θ', W - 26, H - 12); x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 1; x.beginPath(); x.moveTo(36, 30); x.lineTo(36, H - 28); x.lineTo(W - 34, H - 28); x.stroke();
    let th = st.start, k = 0, hop = 0; if (R) { k = Math.floor(st.t); const a = R.path[k], b = R.path[Math.min(k + 1, R.path.length - 1)], u = st.t - k, e = u * u * (3 - 2 * u); th = a.theta + (b.theta - a.theta) * e; hop = Math.sin(u * Math.PI) * Math.min(26, Math.abs(X(b.theta) - X(a.theta)) * 0.35);
      for (let i = Math.max(0, k - 40); i <= k; i++) { const q = R.path[i]; if (q.theta < -0.3 || q.theta > 10.3) continue; x.fillStyle = `rgba(255,216,122,${0.25 + 0.6 * (1 - (k - i) / 40)})`; x.beginPath(); x.arc(X(q.theta), Y(f(q.theta)) - 5, 3.2, 0, 7); x.fill(); } }
    const inside = th > -0.4 && th < 10.4, hx = X(Math.max(-0.2, Math.min(10.2, th))), hy = Y(f(Math.max(0, Math.min(10, th))));
    if (inside) { x.save(); x.translate(hx, hy - hop - 38 * 0.46); x.scale(38, 38); drawTheta(x, { ...POSE(), turn: 0.6, expr: R && R.end === 'left' && st.t > R.path.length - 3 ? 'worry' : R && st.t >= R.path.length - 1 && R.end === 'settled' ? 'joy' : 'smile', t: now / 1000 }); x.restore(); }
    else { x.fillStyle = '#ffd87a'; x.font = '700 15px Nunito, sans-serif'; x.fillText(th < 0 ? '← off the hill' : 'off the hill →', th < 0 ? 50 : W - 150, 60); }
    // the loss curve, drawing itself as the steps are taken
    const c = ch.getContext('2d'), w = ch.width, h = ch.height; c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(46, 14); c.lineTo(46, h - 30); c.lineTo(w - 16, h - 30); c.stroke(); c.fillStyle = '#a8b7c6'; c.font = '600 13px Nunito, sans-serif'; c.fillText('loss', 8, 24); c.fillText('steps', w - 54, h - 9);
    if (R) { const n = R.path.length - 1, top = Math.min(9, Math.max(...R.path.slice(0, k + 2).map((q) => q.loss), 0.5)), cx = (i) => 46 + (i / Math.max(20, n)) * (w - 70), cy = (L) => h - 30 - (Math.min(L, top) / top) * (h - 52); c.fillText(top.toFixed(1), 12, 44); c.fillText('0', 30, h - 30); c.fillText(String(Math.max(20, n)), w - 40, h - 34 + 22 - 22);
      c.strokeStyle = '#ffd87a'; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath(); for (let i = 0; i <= k; i++) { i ? c.lineTo(cx(i), cy(R.path[i].loss)) : c.moveTo(cx(i), cy(R.path[i].loss)); } const u = st.t - k, nb = R.path[Math.min(k + 1, n)]; c.lineTo(cx(k + u), cy(R.path[k].loss + (nb.loss - R.path[k].loss) * u)); c.stroke(); } };
  ui.append(el('div.card.sheet.lab', {}, el('header', {}, el('h2', { text: 'The lab' }), btn('Back', showTitle, 'ghost')), el('div.body.labgrid', {},
    el('div.labview', {}, cv, ch, out),
    el('div.labside', {}, el('h3', { text: 'The hill' }), lands, el('h3', { text: 'The rule' }),
      slider('η', 'eta', 0.01, 1.5, 0.01, ' learning rate'), slider('μ', 'mu', 0, 0.98, 0.01, ' momentum'), slider('noise', 'sigma', 0, 4, 0.1, ''), slider('limit', 'limit', 0, 10, 0.5, ' on the slope'),
      el('div.row', {}, btn('Go', go, 'big'), btn('Reset', reset)), rule,
      el('p.key', { text: 'θ (theta) is where Theta stands. g is the slope of the loss there. η (eta) is the learning rate: how long a step is. μ (mu) is momentum: how much of the last step is kept. v is the step. Noise is added to g at each step, and the limit, if there is one, holds g between −limit and +limit.' }),
      el('h3', { text: 'The seven countries again' }), el('div.presets', {}, PRESETS.map((p) => el('button.btn', { type: 'button', on: { click: () => { Object.assign(st, { land: p.land, eta: p.eta, mu: p.mu, sigma: p.sigma, limit: p.limit, start: LAND[p.land].start, say: p.say }); reset(); go(); } } }, p.name))), say))));
  text(); requestAnimationFrame(draw);
}

// ---- Sort!: seeds to the left, stones to the right, and a scorecard that says how well ----
export function showSort(stage = 1, then = showTitle) {
  clear(); hud.hidden = true; api.attract(); document.body.classList.add('dim'); if (awake) playMusic('card'); save.seen['sort' + stage] = true; store();
  const cv = el('canvas.sortc', { width: 900, height: 520 }), W = 900, H = 520, N = 20 + stage * 2, tally = { tp: 0, fp: 0, fn: 0, tn: 0 }, rr = (n) => { const v = Math.sin((n + stage * 13) * 91.7) * 43758.5; return v - Math.floor(v); };
  // each thing is a seed or a stone. Its shape tells which. Its colour, from the second stage on, sometimes lies.
  let at = 1.4; const items = Array.from({ length: N }, (_, i) => { const good = rr(i) < 0.55, liar = rr(i + 40) < 0.06 + 0.07 * stage, dur = Math.max(0.85, 1.75 - 0.045 * i - 0.05 * stage), it = { good, liar, t0: at, dur, x0: 0.5 + (rr(i + 80) - 0.5) * 0.5, side: 0, tS: 0 }; at += Math.max(0.62, 1.5 - 0.04 * i - 0.06 * stage); return it; });
  let t = 0, last = performance.now(), lean = 0, mood = 0, moodT = 0, over = false; const total = at + 2;
  const current = () => items.find((it) => !it.side && t > it.t0 + it.dur * 0.18 && t < it.t0 + it.dur);
  const send = (side) => { const it = current(); if (!it || over) return; it.side = side; it.tS = t; lean = side; const right = (side < 0) === it.good; if (side < 0) tally[it.good ? 'tp' : 'fp']++; else tally[it.good ? 'fn' : 'tn']++; mood = right ? 1 : -1; moodT = t; if (right) sfx.seed(); else sfx.back(); };
  const key = (e) => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') { send(-1); e.preventDefault(); } else if (e.code === 'ArrowRight' || e.code === 'KeyD') { send(1); e.preventDefault(); } };
  addEventListener('keydown', key); cv.addEventListener('pointerdown', (e) => { const r = cv.getBoundingClientRect(); send(e.clientX - r.left < r.width / 2 ? -1 : 1); });
  const thing = (x, it, px, py, s, rot) => { x.save(); x.translate(px, py); x.rotate(rot); x.scale(s, s);
    if (it.good) { x.fillStyle = it.liar ? '#b8b4a8' : '#ffe58a'; x.strokeStyle = it.liar ? '#7a7668' : '#c98a1e'; x.lineWidth = 0.09; x.beginPath(); x.moveTo(0, -1); x.bezierCurveTo(0.72, -0.4, 0.58, 0.62, 0, 0.64); x.bezierCurveTo(-0.58, 0.62, -0.72, -0.4, 0, -1); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.ellipse(-0.16, -0.22, 0.12, 0.24, 0.2, 0, 7); x.fill(); }
    else { x.fillStyle = it.liar ? '#e8c860' : '#8a90a0'; x.strokeStyle = it.liar ? '#a8842a' : '#4a5060'; x.lineWidth = 0.09; x.lineJoin = 'round'; x.beginPath(); x.moveTo(-0.7, 0.5); x.lineTo(-0.82, -0.12); x.lineTo(-0.3, -0.66); x.lineTo(0.42, -0.6); x.lineTo(0.84, -0.05); x.lineTo(0.6, 0.56); x.closePath(); x.fill(); x.stroke(); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.moveTo(-0.3, -0.66); x.lineTo(-0.05, 0.02); x.lineTo(0.84, -0.05); x.moveTo(-0.05, 0.02); x.lineTo(-0.7, 0.5); x.stroke(); }
    x.restore(); };
  const finish = () => { if (over) return; over = true; removeEventListener('keydown', key); for (const it of items) if (!it.side) tally[it.good ? 'fn' : 'tn']++;
    const kept = tally.tp + tally.fp, seeds = tally.tp + tally.fn, pc = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '–'), cell = (n, what, cls) => el('td' + (cls ? '.' + cls : ''), {}, el('b', { text: String(n) }), el('span', { text: what }));
    box.replaceChildren(el('div.sorthead', {}, el('small', { text: 'Sort!' }), el('h2', { text: 'The scorecard' })),
      el('table.score', {}, el('thead', {}, el('tr', {}, el('th'), el('th', { text: 'Seeds' }), el('th', { text: 'Stones' }))), el('tbody', {}, el('tr', {}, el('th', { text: 'You kept' }), cell(tally.tp, 'kept, and right', 'ok'), cell(tally.fp, 'let through', 'bad')), el('tr', {}, el('th', { text: 'You sent back' }), cell(tally.fn, 'wrongly stopped', 'bad'), cell(tally.tn, 'sent back, and right', 'ok')))),
      el('p', {}, `You kept ${kept} ${kept === 1 ? 'thing' : 'things'}, and ${tally.tp} of them ${tally.tp === 1 ? 'was a seed' : 'were seeds'}: `, el('b', { text: pc(tally.tp, kept) }), '. That share is called ', el('b', { text: 'precision' }), '.'),
      el('p', {}, `There were ${seeds} seeds, and you kept ${tally.tp} of them: `, el('b', { text: pc(tally.tp, seeds) }), '. That share is called ', el('b', { text: 'recall' }), '.'),
      el('p.note', { text: 'Keep everything and recall is perfect, but precision is poor. Keep only what you are sure of and it is the other way round. A sorter is judged by both.' }),
      el('div.row', {}, btn('Go on', then, 'big'), btn('Again', () => showSort(stage, then)))); playMusic('card'); sfx.medal(tally.tp + tally.tn >= N * 0.9 ? 2 : tally.tp + tally.tn >= N * 0.7 ? 1 : 0); };
  const frame = (now) => { if (!cv.isConnected) { removeEventListener('keydown', key); return; } if (over) return; requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; lean *= 1 - Math.min(1, dt * 5);
    const x = cv.getContext('2d'); x.clearRect(0, 0, W, H); const gy = H - 70, cx = W / 2;
    x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(0, gy, W, 3);
    // the pouch on the left, and the heap of what was sent back on the right
    x.fillStyle = '#8a6a48'; x.beginPath(); x.moveTo(110, gy); x.quadraticCurveTo(90, gy - 80, 150, gy - 84); x.lineTo(250, gy - 84); x.quadraticCurveTo(310, gy - 80, 290, gy); x.closePath(); x.fill(); x.fillStyle = '#6a4c34'; x.fillRect(132, gy - 92, 136, 12); x.fillStyle = 'rgba(255,255,255,0.82)'; x.font = '700 15px Nunito, sans-serif'; x.textAlign = 'center'; x.fillText('KEEP  ←', 200, gy + 30); x.fillText('→  SEND BACK', W - 200, gy + 30);
    x.fillStyle = 'rgba(138,144,160,0.5)'; x.beginPath(); x.moveTo(W - 300, gy); x.quadraticCurveTo(W - 200, gy - 46, W - 100, gy); x.closePath(); x.fill();
    for (const it of items) { if (t < it.t0) continue; let px, py, rot = (t - it.t0) * 3 + it.x0 * 9, s = 20;
      if (it.side) { const u = Math.min(1, (t - it.tS) / 0.5); if (u >= 1 && t - it.tS > 0.9) continue; const tx = it.side < 0 ? 200 : W - 200, sx = it.sx ?? cx, sy = it.sy ?? gy - 120; px = sx + (tx - sx) * u; py = sy + (gy - 60 - sy) * u - Math.sin(u * Math.PI) * 90; x.globalAlpha = 1 - Math.max(0, (t - it.tS - 0.5) / 0.4); }
      else { const u = Math.min(1, (t - it.t0) / it.dur); px = it.x0 * W + (cx - it.x0 * W) * u; py = -20 + (gy - 120 + 20) * (u * u); it.sx = px; it.sy = py; if (u >= 1) { it.side = 1; it.tS = t; tally[it.good ? 'fn' : 'tn']++; if (it.good) { mood = -1; moodT = t; } } }
      thing(x, it, px, py, s, rot); x.globalAlpha = 1; }
    x.save(); x.translate(cx, gy - 52 * 0.46); x.scale(52, 52); drawTheta(x, { ...POSE(), turn: 0.5 + lean * 0.5, lean: lean * 0.3, expr: t - moodT < 0.5 ? (mood > 0 ? 'joy' : 'worry') : 'smile', t }); x.restore();
    x.fillStyle = 'rgba(255,255,255,0.7)'; x.font = '600 14px Nunito, sans-serif'; x.textAlign = 'left'; const left = items.filter((it) => !it.side).length; x.fillText(`${left} to come`, 16, 26); x.textAlign = 'start';
    if (t > total || items.every((it) => it.side && t - it.tS > 0.9)) finish(); };
  const how = input.touch.used ? 'Tap the left side to keep a thing, the right side to send it back.' : '← or A keeps a thing. → or D sends it back.';
  const box = el('div.card.sort', {}, el('div.sorthead', {}, el('small', { text: 'Sort!' }), el('h2', { text: 'Seeds to the left, stones to the right' }), el('p', { text: how + (stage > 1 ? ' Go by the shape: the colour sometimes lies.' : '') })), cv, el('div.row', {}, btn('Skip', then)));
  ui.append(box); requestAnimationFrame(frame);
}

// ---- the wardrobe: hats, colours and trails, earned with seeds and stamps, and good for nothing but looking at ----
const WEARS = {
  col: [['lagoon', 'Lagoon', 0, 0, { band: '#3f8f95', bandDark: '#2b6c76', bandLight: '#69b8b8', foot: '#34808a' }], ['moss', 'Moss', 150, 0, { band: '#5f9a48', bandDark: '#3f7230', bandLight: '#8fc070', foot: '#4f8a3c' }], ['ember', 'Ember', 400, 0, { band: '#d8743c', bandDark: '#a8502a', bandLight: '#f0a070', foot: '#c0642f' }],
    ['sky', 'Sky', 800, 0, { band: '#4f98d0', bandDark: '#3070a8', bandLight: '#8fc4ec', foot: '#3f88c0' }], ['rose', 'Rose', 1200, 0, { band: '#d87a8a', bandDark: '#a85464', bandLight: '#f0a8b4', foot: '#c86a7a' }], ['slate', 'Slate', 0, 9, { band: '#5a6a78', bandDark: '#3a4854', bandLight: '#8a9aa8', foot: '#4a5a68' }]],
  hat: [[null, 'None', 0, 0], ['leaf', 'A leaf', 0, 3], ['cap', 'Wool cap', 0, 6], ['poppy', 'A poppy', 0, 12], ['straw', 'Straw hat', 0, 18], ['fern', 'Fern crown', 0, 24], ['acorn', 'Acorn cap', 0, 30], ['sprout', 'A sprout', 0, 42]],
  trail: [[null, 'None', 0, 0], ['sparks', 'Sparks', 300, 0], ['petals', 'Petals', 700, 0], ['lights', 'Fireflies', 1100, 0]],
};
const earned = () => ({ seeds: ALL.reduce((n, id) => n + (save.levels[id]?.seeds || 0), 0), stamps: ALL.filter((id) => save.levels[id]?.stamp).length });
export function applyWear() { const w = save.wear || {}, c = WEARS.col.find((k) => k[0] === (w.col || 'lagoon')) || WEARS.col[0]; Object.assign(COL, c[4]); WEAR.hat = w.hat || null; WEAR.trail = w.trail || null; }
export function showWardrobe() {
  clear(); hud.hidden = true; document.body.classList.add('dim'); const have = earned(), w = save.wear = save.wear || { col: 'lagoon', hat: null, trail: null }, cv = el('canvas.wearc', { width: 360, height: 360 });
  const open = (it) => api.unlockAll || (have.seeds >= it[2] && have.stamps >= it[3]), need = (it) => (it[2] ? `${it[2]} seeds` : `${it[3]} stamps`);
  const group = (title, key) => el('section.wear', {}, el('h3', { text: title }), el('div.chips', {}, WEARS[key].map((it) => el('button.chip' + ((w[key] || (key === 'col' ? 'lagoon' : null)) === it[0] ? '.on' : '') + (open(it) ? '' : '.locked'), { type: 'button', disabled: !open(it), on: { click: () => { w[key] = it[0]; store(); applyWear(); sfx.ui(true); showWardrobe(); } } },
    key === 'col' ? el('i', { style: `background:${it[4].band}` }) : null, el('b', { text: it[1] }), open(it) ? null : el('small', { text: need(it) })))));
  const draw = (now) => { if (!cv.isConnected) return; requestAnimationFrame(draw); const x = cv.getContext('2d'), t = now / 1000; x.clearRect(0, 0, 360, 360); x.fillStyle = 'rgba(255,255,255,0.06)'; x.beginPath(); x.ellipse(180, 292, 96, 14, 0, 0, 7); x.fill();
    x.save(); x.translate(180, 290 - 190 * 0.46); x.scale(190, 190); drawTheta(x, { ...POSE(), turn: 0.5 + 0.4 * Math.sin(t * 0.7), sy: 1 + 0.02 * Math.sin(t * 2.2), expr: 'smile', t }); x.restore(); };
  ui.append(sheet('Wardrobe', showMore, el('div.weargrid', {}, el('div', {}, cv, el('p.note', { text: `You have gathered ${have.seeds} seeds and ${have.stamps} stamps. Seeds count once for each level: your best run there.` })),
    el('div', {}, group('Colour', 'col'), group('Hat', 'hat'), group('Trail', 'trail'), el('p.note', { text: 'None of these changes how Theta runs, jumps or rolls.' })))));
  requestAnimationFrame(draw);
}
// ---- the keys ----
// The hints were written with the usual keys in them. If the player has chosen others, the names are put right as the hint is shown.
const keyed = (t) => { if (!t || !save.settings.keys || how() !== 'key') return t; const n = (a) => (input.keys[a][0] ? KEYNAME(input.keys[a][0]) : '?'); return t.replace(/← → or A D/g, `${n('left')} ${n('right')}`).replace(/→ or D/g, n('right')).replace(/\bSpace\b/g, n('jump')).replace(/\bShift\b/g, n('tuck')).replace(/\bE\b/g, n('turbo')); };
const KEYNAME = (c) => ({ ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Space', ShiftLeft: 'Left Shift', ShiftRight: 'Right Shift', ControlLeft: 'Left Ctrl', ControlRight: 'Right Ctrl' }[c] || c.replace(/^Key|^Digit/, ''));
export function showKeys(back = showTitle) {
  clear(); document.body.classList.add('dim'); const names = { left: 'Run left', right: 'Run right', jump: 'Jump, and Mu’s lift', tuck: 'Roll', turbo: 'Turbo' }; let waiting = null;
  const listen = (e) => { if (!waiting) return; e.preventDefault(); e.stopImmediatePropagation(); if (e.code !== 'Escape') { for (const k of Object.keys(input.keys)) input.keys[k] = input.keys[k].filter((c) => c !== e.code); input.keys[waiting] = [e.code]; save.settings.keys = input.keys; store(); } removeEventListener('keydown', listen, true); waiting = null; showKeys(back); };
  ui.append(sheet('Keys', () => { removeEventListener('keydown', listen, true); showSettings(back); }, el('p.lead', { text: 'Choose a key for each thing Theta does. Press Change, then the key you want.' }),
    el('dl.keys.binds', {}, Object.entries(names).flatMap(([k, label]) => { const b = btn('Change', () => { waiting = k; b.textContent = 'Press a key…'; addEventListener('keydown', listen, true); }); return [el('dt', { text: label }), el('dd', {}, el('span', { text: input.keys[k].map(KEYNAME).join('  ·  ') || 'no key' }), b)]; })),
    el('div.row', {}, btn('The usual keys', () => { input.keys = structuredClone(DEFAULT_KEYS); save.settings.keys = null; store(); showKeys(back); })),
    el('p.note', { text: 'Pause is Esc or P, start again is R, the title screen is T or Home, and sound off is M.' })));
}

// ---- the rest ----
function forget(back) { let armed = 0; const b = btn('Forget my progress', () => { if (Date.now() - armed < 5000) { resetSave(); showSettings(back); } else { armed = Date.now(); b.textContent = 'Press again to forget everything'; setTimeout(() => { if (b.isConnected) b.textContent = 'Forget my progress'; }, 5000); } }, 'ghost'); return b; }
function sheet(title, back, ...kids) { return el('div.card.sheet', {}, el('header', {}, el('h2', { text: title }), back !== showTitle ? btn('Title', showTitle, 'ghost') : null, btn('Back', back, 'ghost')), el('div.body', {}, ...kids)); }
export function showHow() {
  clear(); document.body.classList.add('dim');
  const k = how(), rows = k === 'touch' ? [['Run', 'Slide your left thumb left or right.'], ['Jump', 'The upper button. Tap for a hop, hold for a leap.'], ['Roll', 'Hold the lower button to tuck in and roll. Downhill, nothing is faster.'], ['Float', 'Hold jump in the air to spread wide and fall slowly.'], ['Lift', 'Once Mu has joined, press jump again in the air. Mu lifts Theta once between one landing and the next.'], ['Turbo', 'The star button. A burst of speed from Eta. It uses up one spark.']]
    : [['Run', '← → or A D'], ['Jump', 'Space. Tap for a hop, hold for a leap.'], ['Roll', 'Hold Shift to tuck in and roll. Downhill, nothing is faster.'], ['Float', 'Hold Space in the air to spread wide and fall slowly.'], ['Lift', 'Once Mu has joined, press Space again in the air. Mu lifts Theta once between one landing and the next.'], ['Turbo', 'E. A burst of speed from Eta. It uses up one spark.'], ['Start again', 'R'], ['Pause', 'Esc or P'], ['Title screen', 'T or Home, from anywhere'], ['Sound off', 'M']];
  ui.append(sheet('How to play', showTitle, el('p.lead', { text: 'Find the lowest ground. Every level ends in the deepest valley, where a light is waiting.' }), el('dl.keys', {}, rows.flatMap(([a, b]) => [el('dt', { text: a }), el('dd', { text: keyed(b) })])),
    el('h3', { text: 'To win a level' }), el('p', { text: 'Bring the seed to the lowest valley while it still has a light, and before that light fades.' }),
    el('h3', { text: 'How a level is lost' }), el('p', { text: 'The seed has three lights, shown at the top left. Every fall into a gap puts one out, and so does being carried off by the pigeons of the Dovecotes. When the last goes out the level is lost.' }), el('p', { text: 'The light also fades with time. The bar under the clock shows how much is left. It is generous, but it does run out.' }), el('p', { text: 'A lost level starts again from the top.' }),
    el('h3', { text: 'Sparks' }), el('p', { text: 'The small stars under the lights are sparks. You begin a level with one, and every five seeds earn another, up to three.' }), el('p', { text: 'A spark can be spent as a turbo. Or it can be kept: if Theta falls with a spark in hand, Eta makes the catch, the spark is spent and no light is lost.' }),
    el('h3', { text: 'Things to find' }), el('dl.keys.finds', {}, [['Seeds', 'Small and golden, all along the way. Five make a spark.'], ['Dewdrops', 'Blue. One relights a light that has gone out. If every light is lit, it becomes a spark.'], ['Feathers', 'Mu’s, hanging in the air once Mu has joined. Touch one after a lift and Mu can lift again.'], ['Stamps', 'One is hidden in every level, and never in the same sort of place twice. They are kept in the album.']].flatMap(([a, b]) => [el('dt', { text: a }), el('dd', { text: b })])),
    el('h3', { text: 'More than one thing to do' }), el('p', { text: 'A level asks four things, and only the first is needed to go on: reach the valley, find the stamp, gather every seed, and lose no light. The card at the end shows which were done.' }),
    el('h3', { text: 'To win the game' }), el('p', { text: 'Each country has five levels and then a harder last one. Finish that and the next country opens. Medals are for time: gold, silver, bronze.' }),
    el('p.note', { text: 'Height is the lesson. The higher you stand, the worse the guess, so the way to go is always down.' })));
}
export function showSettings(back) {
  clear(); document.body.classList.add('dim'); const s = save.settings;
  const slider = (label, key) => el('label.set', {}, el('span', { text: label }), el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s[key], on: { input: (e) => { s[key] = +e.target.value; setVolumes({ music: s.music, sfx: s.sfx, voice: s.voice }); store(); } } }));
  const pick = (label, key, opts, after) => el('label.set', {}, el('span', { text: label }), el('div.seg', {}, opts.map(([v, t]) => el('button' + (s[key] === v ? '.on' : ''), { type: 'button', on: { click: () => { s[key] = v; store(); after?.(); showSettings(back); } } }, t))));
  ui.append(sheet('Settings', back, slider('Music', 'music'), slider('Sound', 'sfx'), slider('Theta’s voice', 'voice'),
    pick('Picture', 'gfx', [[-1, 'Auto'], [0, 'Plain'], [1, 'Good'], [2, 'Full'], [3, 'Ultra (4K)']], api.applyGfx), el('p.note', { text: 'Auto chooses for your screen, and steps down by itself if the picture begins to stutter. Ultra paints up to 4K; a change shows fully from the next level.' }), pick('Motion', 'motion', [[true, 'Full'], [false, 'Reduced']]), pick('Text', 'text', [[1, 'Normal'], [1.2, 'Larger'], [1.4, 'Largest']], api.applyText),
    pick('Assist', 'assist', [[false, 'Off'], [true, 'On']]), el('p.note', { text: 'Assist slows the game by a fifth, gives the seed five lights and takes away the time limit. Times set with it are kept apart and win no medals.' }),
    pick('Colours', 'safe', [[false, 'Standard'], [true, 'High contrast']], api.applyGfx), el('p.note', { text: 'High contrast clears the mist and the tinted light, pushes the far country back, and draws a bright line along every surface that can be stood on.' }),
    el('label.set', {}, el('span', { text: 'Keys' }), el('div.seg', {}, el('button', { type: 'button', on: { click: () => showKeys(back) } }, 'Choose keys'))),
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
addEventListener('keydown', (e) => { if (e.code === 'Escape' || e.code === 'KeyP') { if (api?.G.paused) { clear(); api.G.paused = false; } else pause(); } else if (e.code === 'KeyR') restart(); else if (e.code === 'KeyM') mute(); else if ((e.code === 'KeyT' || e.code === 'Home') && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(text|search|email|url|number)$/.test(e.target?.type || '') && e.target?.tagName !== 'TEXTAREA' && !Object.values(input.keys).flat().includes(e.code)) home(); else if (e.code === 'Enter' || e.code === 'Space') { if (document.activeElement?.tagName !== 'BUTTON') { const b = ui.querySelector('.btn.big'); if (b) { b.click(); e.preventDefault(); } } }
  else if (/^Arrow(Up|Down)$|^Key[WS]$/.test(e.code)) { const list = [...ui.querySelectorAll('.titem, .menu .btn')]; if (list.length) { const i = list.indexOf(document.activeElement), d = /Up|KeyW/.test(e.code) ? -1 : 1; list[(i + d + list.length) % list.length].focus(); sfx.ui(); } } });
