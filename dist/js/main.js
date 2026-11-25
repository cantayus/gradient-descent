// Start-up and the frame loop. The screens (title, levels, card, notebook, settings) are in js/ui/; this file runs a level, or the scene behind the title,
// and turns what happens in it into sound.
import { input, initInput, initTouch, readInput } from './core/input.js';
import { Play } from './game/play.js';
import { WORLDS, levelById, TITLE, ALL } from './data/worlds.js';
import { save, loadSave } from './core/save.js';
import { setVolumes, setIntensity, ambient, quiet, sfx, voice } from './core/audio.js';
import * as UI from './ui/ui.js';

const view = document.getElementById('view'), ctx = view.getContext('2d', { alpha: false });
const q = new URLSearchParams(location.search);
export const G = { play: null, mode: null, W: 1, H: 1, dpr: 1, gfx: 2, auto: 2, paused: false, last: 0, fps: 60, slow: 0, hooks: {} };
window.__G = G;   // for the scripted player and the tests in scripts/
const IDLE = { move: 0, jump: false, jumpNow: false, tuck: false };

function resize() {
  const cap = G.gfx >= 2 ? 2 : G.gfx === 1 ? 1.25 : 1, dpr = Math.min(window.devicePixelRatio || 1, cap), w = innerWidth, h = innerHeight;
  // a painted picture in many layers costs by the pixel, so there is a ceiling on how many are painted: 1440p on Full, 1080p on Good, 720p on Plain
  const lim = G.gfx >= 2 ? 2560 * 1440 : G.gfx === 1 ? 1920 * 1080 : 1280 * 720, k = Math.min(1, Math.sqrt(lim / (w * h * dpr * dpr)));
  G.dpr = dpr * k; G.W = view.width = Math.round(w * G.dpr); G.H = view.height = Math.round(h * G.dpr);
  if (G.play) G.play.resize(G.W, G.H);
}
addEventListener('resize', resize);
function applyGfx() { const s = save.settings.gfx; G.gfx = q.has('gfx') ? +q.get('gfx') : s < 0 ? G.auto : s; resize(); if (G.play) G.play.scene.q = G.gfx; document.body.dataset.gfx = G.gfx; document.body.classList.toggle('safe', !!save.settings.safe); }
function applyText() { document.documentElement.style.setProperty('--fs', save.settings.text || 1); }

export function startLevel(id, opt = {}) {
  const f = levelById(id); if (!f) return null;
  G.play = new Play({ spec: f.spec, theme: f.world.theme, can: { ...f.world.can, ...(f.spec.can || {}) }, ghost: opt.ghost || null, hooks: G.hooks, intro: !!opt.intro });
  G.play.scene.q = G.gfx; G.play.resize(G.W, G.H); G.levelId = id; G.mode = 'level'; S.reset(); return G.play;
}
// The country behind the title and the menus: the hero on a ledge, looking out, at whatever hour it is where the player is.
function attract() {
  if (G.mode === 'title' && G.play) return G.play;
  const h = new Date().getHours(), time = q.get('time') || (h < 5 ? 'night' : h < 8 ? 'dawn' : h < 16 ? 'day' : h < 19 ? 'golden' : h < 22 ? 'dusk' : 'night');
  const reached = WORLDS.findLast((w) => w.levels.some((l) => save.levels[l.id]?.done)) || WORLDS[0];
  G.play = new Play({ spec: { ...TITLE, time }, theme: reached.theme, can: reached.can, cine: true, hooks: {} });
  G.play.scene.q = G.gfx; G.play.resize(G.W, G.H); G.mode = 'title'; G.paused = false; S.reset(); return G.play;
}
function greet() { const p = G.play; if (!p || G.mode !== 'title') return; p.rig.feel('joy', 1.8); p.rig.sq.kick(5); setTimeout(() => voice.trill(), 350); }

// ---- what the hero's doings sound like ----
const S = { steps: 0, air: 0, wheed: false, idle: 0, yawned: false, last: 0, seeds: 0, reset() { this.steps = this.air = this.idle = this.seeds = 0; this.wheed = this.yawned = false; } };
const SOFT = { snow: 1, sand: 1, grass: 1, moss: 1, clay: 1 };
const say = (fn, gap = 0.25) => { const t = performance.now() / 1000; if (t - S.last < gap) return; S.last = t; fn(); };
G.hooks = {
  start() {},
  event(name, b, extra) {
    if (name === 'jump') say(() => voice.hup(Math.min(1, Math.abs(b.vx) / 12)), 0.08);
    else if (name === 'land') { sfx.land(b.impact, !!SOFT[b.surf]); if (b.impact > 13) say(() => voice.oof(Math.min(1, b.impact / 24))); }
    else if (name === 'splash') { sfx.splash(); say(() => voice.blub()); }
    else if (name === 'slide') say(() => voice.whee(0.3), 0.8);
    else if (name === 'seed') { sfx.seed(); if (++S.seeds % 6 === 0) say(() => voice.giggle(), 0.6); }
    else if (name === 'fall') { sfx.fall(); say(() => voice.eep(), 0); }
    else if (name === 'back') { sfx.back(); setTimeout(() => voice.grumble(), 250); }
    else if (name === 'goal') { sfx.goal(); setTimeout(() => voice.trill(), 300); }
    else if (name === 'thump') sfx.drum(extra);
    else if (name === 'intro') { if (extra === 'fall') sfx.wake(); else if (extra === 'land') sfx.seed(); else if (extra === 'wake') voice.hm(); else if (extra === 'take') { sfx.goal(); setTimeout(() => voice.trill(), 250); } else if (extra === 'end') UI.introDone(); }
    else if (name === 'erupt') { sfx.geyser(); sfx.drum(1); say(() => voice.eep(), 0); setTimeout(() => voice.whee(1), 600); }
  },
  finish(res) { UI.showFinish(res); },
};
function sounds(p, dt) {
  const b = p.b, sp = b.speed(), wx = p.weather, live = G.mode === 'level' && !p.done;
  ambient({ speed: live ? sp : 0, air: !b.grounded, rolling: live && b.grounded && b.mode === 'ball', sliding: live && b.grounded && b.mode === 'slide', soft: !!SOFT[b.surf], jet: Math.max(b.inJet, p.boss ? p.boss.p * 0.25 : 0), rain: wx.rain * (1 - p.scene.coldNow), wind: wx.wind, gust: wx.gust });
  if (wx.thunder) { wx.thunder = false; sfx.thunder(); }
  if (!live) return; setIntensity(Math.min(1, Math.max(0, (sp - 5) / 15)));
  if (b.grounded && b.mode === 'run' && sp > 1.5) { S.steps += sp * dt; if (S.steps > 1.15) { S.steps = 0; sfx.step(!!SOFT[b.surf]); } }
  // a long fall or a long flight gets a cry of its own, once
  if (b.grounded) { S.air = 0; S.wheed = false; } else { S.air += dt; if (S.air > 0.85 && !S.wheed && !b.inJet) { S.wheed = true; say(() => voice.whee(Math.min(1, S.air))); } }
  S.idle = b.grounded && sp < 0.2 && p.started ? S.idle + dt : 0; if (S.idle > 14 && !S.yawned) { S.yawned = true; voice.yawn(); } if (S.idle === 0) S.yawned = false;
}

function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - G.last) / 1000 || 0.016); G.last = now; for (const hz of [60, 120, 144, 90, 75, 165, 240]) if (Math.abs(dt - 1 / hz) < 0.0011) { dt = 1 / hz; break; } G.fps += (1 / Math.max(dt, 0.001) - G.fps) * 0.05;
  const inp = readInput(), p = G.play;
  if (p) {
    if (!G.paused) {
      if (G.mode === 'level' && save.settings.assist) dt *= 0.8;         // assist: everything a fifth slower
      p.update(dt, G.mode === 'title' ? IDLE : G.autoPlay ? G.autoPlay(p, inp) : inp);
      if (!save.settings.motion) p.scene.shake = 0;
      sounds(p, dt);
    } else quiet();
    p.draw(ctx); inp.jumpNow = false; UI.frameUI(p);
  }
  // on Auto, step the picture down if the machine cannot keep up, and say nothing about it
  if (save.settings.gfx < 0 && !G.paused && !q.has('gfx')) { G.slow = G.fps < 42 ? G.slow + dt : 0; if (G.slow > 3 && G.auto > 0) { G.auto--; G.slow = 0; applyGfx(); } }
}

// film grain, made once and handed to the page to lay over the picture
{ const c = document.createElement('canvas'); c.width = c.height = 180; const x = c.getContext('2d'), im = x.createImageData(180, 180); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 30; } x.putImageData(im, 0, 0); const g = document.querySelector('#grade .grain'); if (g) g.style.backgroundImage = `url(${c.toDataURL()})`; }
loadSave(); applyText(); applyGfx(); setVolumes({ music: save.settings.music, sfx: save.settings.sfx, voice: save.settings.voice });
initInput(); initTouch(document.getElementById('touch'));
UI.initUI({ G, startLevel, attract, greet, applyGfx, applyText, unlockAll: q.has('unlock') || q.has('class'), forceIntro: q.has('intro') });
// For looking at one level directly: ?level=1-1, with &x= to stand somewhere along it, &time= to change the hour, &run to hold right and &wx=0..1 to fix the weather.
if (q.has('level')) {
  const f = levelById(q.get('level')); if (f && q.has('time')) f.spec.time = q.get('time');
  UI.play(q.get('level')); const p = G.play;
  if (p && q.has('x')) { const x = +q.get('x'); p.b.x = x; p.b.y = p.T.h(x) + 0.5; p.cam.update(p.b, 0.016, G.W / G.H, true); p.eta.x = x; p.eta.y = p.b.y + 1; }
  if (q.has('run')) G.autoPlay = () => ({ move: 1, jump: false, jumpNow: false, tuck: q.get('run') === 'tuck' });
} else UI.showTitle();
if (q.has('wx') && G.play) { const v = +q.get('wx'), w = G.play.weather; w.front = () => v; }
window.__ready = true;
requestAnimationFrame(frame);
