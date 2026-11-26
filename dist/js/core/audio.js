// All sound is made here, in the browser: the music, the sounds of the ground and the air, and Theta's voice. Nothing is recorded.
// Music is written below as notes. Each world has a tune of its own; as the hero gathers speed more instruments join in.
const A = { ctx: null, master: null, music: null, sfx: null, voice: null, vol: { music: 0.7, sfx: 0.8, voice: 0.8 }, muted: false, track: null, intensity: 0, want: 0, loops: {}, noise: null, t0: 0, step: 0, timer: null, lastVoice: 0, combo: 0, comboT: 0 };
export const audio = A;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const now = () => A.ctx.currentTime;

export function initAudio() {
  // (a browser may refuse sound, or allow it only later; the game must run the same without it)
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume().catch(() => {}); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  let c; try { c = new AC(); } catch (e) { return; } A.ctx = c; if (c.state === 'suspended') c.resume().catch(() => {});
  A.master = c.createGain(); const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; A.master.connect(comp); comp.connect(c.destination);
  for (const k of ['music', 'sfx', 'voice']) { A[k] = c.createGain(); A[k].connect(A.master); }
  // a little room: two echoes fed back, shared by everything
  const d1 = c.createDelay(1), d2 = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter(), wet = c.createGain(); d1.delayTime.value = 0.23; d2.delayTime.value = 0.37; fb.gain.value = 0.32; lp.type = 'lowpass'; lp.frequency.value = 2600; wet.gain.value = 0.3;
  A.send = c.createGain(); A.send.connect(d1); A.send.connect(d2); d1.connect(lp); d2.connect(lp); lp.connect(fb); fb.connect(d1); lp.connect(wet); wet.connect(A.master);
  const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; A.noise = buf;
  setVolumes(); A.timer = setInterval(schedule, 60);
}
export function setVolumes(v) { if (v) Object.assign(A.vol, v); if (!A.ctx) return; const m = A.muted ? 0 : 1; A.master.gain.value = m; A.music.gain.value = A.vol.music * 0.5; A.sfx.gain.value = A.vol.sfx * 0.7; A.voice.gain.value = A.vol.voice * 0.6; }
export function mute(on) { A.muted = on ?? !A.muted; setVolumes(); return A.muted; }

// ---- instruments ----
function tone(dest, type, f, t, dur, vol, { a = 0.01, r = 0.2, f2 = null, det = 0, send = 0, lp = 0 } = {}) {
  const c = A.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); o.detune.value = det;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setTargetAtTime(0, t + Math.max(a, dur - r), r / 3);
  let out = g; if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; g.connect(fl); out = fl; }
  o.connect(g); out.connect(dest); if (send) { const s = c.createGain(); s.gain.value = send; out.connect(s); s.connect(A.send); }
  o.start(t); o.stop(t + dur + r * 2 + 0.05);
}
function hiss(dest, t, dur, vol, { type = 'bandpass', f = 1000, f2 = null, q = 1, a = 0.005, send = 0 } = {}) {
  const c = A.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = A.noise; s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); s.connect(fl); fl.connect(g); g.connect(dest); if (send) { const sg = c.createGain(); sg.gain.value = send; g.connect(sg); sg.connect(A.send); }
  s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
const INS = {
  pad: (n, t, d, v) => { for (const det of [-7, 6]) tone(A.music, 'triangle', midi(n), t, d, v * 0.5, { a: d * 0.3, r: d * 0.5, det, lp: 1500, send: 0.5 }); },
  keys: (n, t, d, v) => { tone(A.music, 'triangle', midi(n), t, Math.max(0.5, d), v, { a: 0.006, r: 0.7, send: 0.5, lp: 3200 }); tone(A.music, 'sine', midi(n + 12), t, 0.25, v * 0.3, { a: 0.004, r: 0.2 }); },
  bell: (n, t, d, v) => { tone(A.music, 'sine', midi(n), t, 0.9, v, { a: 0.004, r: 0.8, send: 0.7 }); tone(A.music, 'sine', midi(n) * 2.76, t, 0.3, v * 0.25, { a: 0.003, r: 0.25 }); },
  pluck: (n, t, d, v) => tone(A.music, 'sawtooth', midi(n), t, 0.3, v * 0.6, { a: 0.004, r: 0.25, lp: 1700, send: 0.35 }),
  bass: (n, t, d, v) => tone(A.music, 'sine', midi(n), t, d, v, { a: 0.02, r: 0.25 }),
  flute: (n, t, d, v) => { tone(A.music, 'sine', midi(n), t, d, v, { a: 0.07, r: 0.3, send: 0.6 }); hiss(A.music, t, Math.min(d, 0.25), v * 0.12, { f: midi(n) * 2, q: 3 }); },
  tick: (n, t, d, v) => hiss(A.music, t, 0.05, v, { type: 'highpass', f: 6500 }),
  shake: (n, t, d, v) => hiss(A.music, t, 0.11, v, { type: 'bandpass', f: 4200, q: 1.2 }),
  thump: (n, t, d, v) => tone(A.music, 'sine', 110, t, 0.22, v, { a: 0.004, r: 0.18, f2: 44 }),
  tom: (n, t, d, v) => { tone(A.music, 'sine', midi(n), t, 0.3, v, { a: 0.004, r: 0.25, f2: midi(n) * 0.6 }); hiss(A.music, t, 0.08, v * 0.3, { f: 900, q: 0.7 }); },
};

// ---- the tunes ----
// A track: bpm, the steps in a bar, and parts. Each part: an instrument, a volume, the intensity at which it joins, and its notes as
// [step, midi note, length in steps] over the whole loop. Chords are played by the pad.
const T = (s) => s.trim().split(/\s+/).map((x) => (x === '.' ? null : +x));
const line = (ins, vol, from, steps, oct = 0) => ({ ins, vol, from, notes: steps.map((n, i) => (n == null ? null : [i, n + oct, 1])).filter(Boolean) });
const hold = (notes) => { const out = []; for (const n of notes) { const last = out[out.length - 1]; out.push(n); } return out; };
const chords = (vol, bars, len) => ({ ins: 'pad', vol, from: 0, notes: bars.flatMap((ch, i) => ch.map((n) => [i * len, n, len])) });
const beat = (ins, vol, from, pat, bars) => ({ ins, vol, from, notes: Array.from({ length: bars }, (_, b) => [...pat].map((ch, i) => (ch === 'x' ? [b * pat.length + i, 50, 1] : ch === 'o' ? [b * pat.length + i, 45, 1] : null))).flat().filter(Boolean) });
const TRACKS = {
  // the title: slow, open, in F
  title: { bpm: 76, len: 64, parts: [
    chords(0.2, [[53, 60, 64, 69], [50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [53, 60, 64, 69], [50, 57, 60, 65], [46, 53, 58, 65], [48, 55, 59, 62]], 8),
    line('keys', 0.2, 0, T('72 . . 69 . 72 . 77 76 . . 72 . . . . 74 . . 70 . 74 . 77 79 . 76 . 72 . . . 81 . . 77 . 81 . 84 81 . . 77 . . 76 . 74 . 77 . 70 . 74 . 72 . . . . . . .')),
    line('bell', 0.07, 0, T('. . 84 . . . 89 . . . 88 . . . . . . . 86 . . . 89 . . . 91 . . . . . . . 96 . . . 93 . . . 89 . . . . . . . 86 . . . 82 . . . 84 . . . . .')),
    line('bass', 0.2, 0, T('41 . . . . . . . 38 . . . . . . . 34 . . . . . . . 36 . . . . . . . 41 . . . . . . . 38 . . . . . . . 34 . . . . . . . 36 . . . . . 36 .')),
  ] },
  // Iceland: wide and cold and bright, in D with a raised sixth
  iceland: { bpm: 98, len: 128, parts: [
    chords(0.17, [[50, 57, 60, 64], [46, 53, 57, 62], [41, 48, 57, 60], [48, 55, 59, 62], [50, 57, 60, 65], [46, 53, 58, 62], [43, 50, 55, 58], [45, 52, 57, 61]], 16),
    line('keys', 0.19, 0, T('69 . . . 74 . . . 77 . 76 . . . . . 74 . . . . . 72 . 69 . . . . . . . 72 . . . 77 . . . 81 . 79 . . . . . 76 . . . . . 74 . . . . . . . . . 69 . . . 74 . . . 77 . 79 . 81 . . . 82 . . . 81 . . . 77 . . . . . . . 79 . . . 77 . . . 74 . 70 . . . . . 73 . . . 76 . . . 74 . . . . . . .')),
    line('bell', 0.07, 0.25, T('. . 86 . . . 93 . . . . . 88 . . . . . 81 . . . 89 . . . . . 86 . . . . . 84 . . . 93 . . . . . 91 . . . . . 83 . . . 91 . . . . . 86 . . . . . 86 . . . 93 . . . . . 96 . . . . . 89 . . . 94 . . . . . 93 . . . . . 82 . . . 91 . . . . . 86 . . . . . 85 . . . 93 . . . . . 88 . . .')),
    line('pluck', 0.1, 0.4, T(Array.from({ length: 8 }, (_, b) => { const r = [62, 58, 53, 60, 62, 58, 55, 57][b]; return `${r} . ${r + 7} . ${r + 12} . ${r + 7} . ${r + 14} . ${r + 7} . ${r + 12} . ${r + 7} .`; }).join(' '))),
    line('bass', 0.2, 0.5, T(Array.from({ length: 8 }, (_, b) => { const r = [38, 34, 29, 36, 38, 34, 31, 33][b]; return `${r} . . . . . ${r} . . . ${r + 7} . . . ${r} .`; }).join(' '))),
    beat('thump', 0.16, 0.6, 'x.......x.....x.', 8), beat('shake', 0.045, 0.75, '..x...x...x...xx', 8), beat('tick', 0.03, 0.9, 'x.x.x.x.x.x.x.x.', 8),
  ] },
  // a boss: quicker and fuller, but the same hand wrote it
  boss: { bpm: 132, len: 64, parts: [
    chords(0.15, [[50, 57, 62, 65], [50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64]], 16),
    line('pluck', 0.14, 0, T(Array.from({ length: 4 }, (_, b) => { const r = [50, 50, 46, 48][b]; return `${r} ${r + 12} ${r + 7} ${r + 12} ${r} ${r + 12} ${r + 7} ${r + 15} ${r} ${r + 12} ${r + 7} ${r + 12} ${r} ${r + 14} ${r + 7} ${r + 12}`; }).join(' '))),
    line('keys', 0.2, 0, T('74 . . 77 . . 81 . 79 . 77 . 76 . 74 . 81 . . 82 . . 81 . 79 . . . 77 . . . 77 . . 74 . . 70 . 72 . 74 . 77 . 74 . 76 . . 79 . . 76 . 72 . . . 73 . . .')),
    line('bass', 0.24, 0, T(Array.from({ length: 4 }, (_, b) => { const r = [38, 38, 34, 36][b]; return `${r} . ${r} . . ${r} . . ${r} . ${r} . . ${r + 12} . ${r}`; }).join(' '))),
    beat('thump', 0.2, 0, 'x...x...x...x.x.', 4), beat('shake', 0.05, 0, '..x...x...x...x.', 4), beat('tom', 0.12, 0.5, '............o.o.', 4),
  ] },
  // the card after a level and the notebook: a few quiet bells
  card: { bpm: 70, len: 32, parts: [
    chords(0.15, [[53, 60, 65, 69], [48, 55, 60, 64], [50, 57, 62, 65], [46, 53, 58, 62]], 8),
    line('bell', 0.1, 0, T('77 . . 81 . . 84 . 79 . . 76 . . . . 77 . . 74 . . 81 . 77 . . 74 . . . .')),
  ] },
};
// Cappadocia: nine quick beats to the bar, counted two, two, two, three, as much Anatolian dance music is. The tune sits on D with its second and sixth
// degrees a little flat (written here as fractions of a semitone), after the makam Hüseyni; a plucked string carries it over a drone.
TRACKS.cappadocia = { bpm: 82, len: 72, parts: [
  chords(0.15, [[50, 57, 62], [50, 57, 62], [48, 55, 60], [50, 57, 62], [50, 57, 65], [48, 55, 60], [46.65, 53, 58.65], [50, 57, 62]], 9),
  line('pluck', 0.2, 0, T('69 . 69 . 67 . 69 . . 72 . 70.65 . 69 . 67 . . 69 . 67 . 65 . 67 . . 65 . 63.65 . 62 . . . . 74 . 72 . 70.65 . 72 . . 72 . 70.65 . 69 . 67 . 69 67 . 65 . 63.65 . 65 . 67 65 . 63.65 . 62 . . . .')),
  line('flute', 0.09, 0.3, T('. . . . . . 81 . . . . . . . . 79 . . . . . . . . 77 . . . . . . . . 74 . . . . . . . . 86 . . . . . . . . 81 . . . . . . . . 77 . . . . . . . . 74 . .')),
  line('bass', 0.2, 0.4, T(Array.from({ length: 8 }, (_, b) => { const r = [38, 38, 36, 38, 38, 36, 34.65, 38][b]; return `${r} . . . ${r} . ${r + 7} . .`; }).join(' '))),
  beat('tom', 0.16, 0.5, 'o.x.o.x..', 8), beat('tick', 0.035, 0.7, 'x.xxx.xxx', 8), beat('shake', 0.04, 0.85, '..x...x.x', 8),
] };
// Galápagos: light and bright, in A, six quick beats to the bar like a small wave coming in and going out; wooden notes over a rocking bass.
TRACKS.galapagos = { bpm: 104, len: 96, parts: [
  chords(0.14, [[57, 64, 69, 73], [54, 61, 66, 69], [50, 57, 62, 66], [52, 59, 64, 68], [57, 64, 69, 76], [54, 61, 66, 73], [50, 57, 66, 69], [52, 59, 64, 71]], 12),
  line('keys', 0.2, 0, T('69 . . 73 . 76 . . 73 . 69 . 66 . . 69 . 73 . . 69 . . . 74 . . 69 . 66 . . 62 . 66 . 64 . . 68 . 71 . . 68 . . . 81 . . 80 . 76 . . 73 . 76 . 78 . . 73 . 69 . . 73 . . . 74 . . 78 . 81 . . 78 . 74 . 76 . . 71 . 68 . . 64 . . .')),
  line('pluck', 0.1, 0.3, T(Array.from({ length: 8 }, (_, b) => { const r = [57, 54, 50, 52, 57, 54, 50, 52][b]; return `${r} . ${r + 7} ${r + 12} . ${r + 7} ${r + 16} . ${r + 12} ${r + 7} . ${r + 12}`; }).join(' '))),
  line('bell', 0.06, 0.45, T('. . . . . . 88 . . . . . . . . . . . 85 . . . . . . . . . . . 90 . . . . . . . . . . . 88 . . . . . . . . . . . 93 . . . . . . . . . . . 90 . . . . . . . . . . . 86 . . . . . . . . . . . 83 . . . . .')),
  line('bass', 0.2, 0.4, T(Array.from({ length: 8 }, (_, b) => { const r = [45, 42, 38, 40, 45, 42, 38, 40][b]; return `${r} . . . . . ${r + 7} . . ${r} . .`; }).join(' '))),
  beat('thump', 0.14, 0.55, 'x.....x.....', 8), beat('shake', 0.05, 0.6, '..x..x..x..x', 8), beat('tick', 0.03, 0.85, 'x.xx.xx.xx.x', 8),
] };
// Namib: slow and wide, five notes only (E, G, A, B, D), a thumb piano over a long breath, a great deal of room between the notes.
TRACKS.namib = { bpm: 84, len: 128, parts: [
  chords(0.15, [[52, 59, 64], [52, 59, 66], [50, 57, 64], [52, 59, 64], [55, 62, 67], [52, 59, 66], [50, 57, 62], [52, 59, 64]], 16),
  line('keys', 0.2, 0, T('76 . . 79 . . 81 . 79 . . . 76 . . . 74 . . 76 . . 79 . . . 76 . . . . . 81 . . 83 . . 86 . 83 . . . 81 . . . 79 . . 76 . . 74 . . . 76 . . . . . 79 . . 81 . . 83 . 81 . . . 79 . . . 76 . . 79 . . 76 . 74 . . . 71 . . . 74 . . 76 . . . . 79 . . 76 . . 74 . 71 . . 74 . 76 . . . . . . . . . . .')),
  line('flute', 0.08, 0.3, T('. . . . . . . . 88 . . . . . . . . . . . . . . . 86 . . . . . . . . . . . . . . . 91 . . . . . . . . . . . . . . . 88 . . . . . . . . . . . . . . . 86 . . . . . . . . . . . . . . . 83 . . . . . . . . . . . . . . . 86 . . . . . . . . . . . . . . . 88 . . . . . . .')),
  line('pluck', 0.08, 0.5, T(Array.from({ length: 8 }, (_, b) => { const r = [64, 64, 62, 64, 67, 64, 62, 64][b]; return `. . ${r} . . ${r + 7} . . ${r + 3} . . ${r + 7} . . ${r + 10} .`; }).join(' '))),
  line('bass', 0.2, 0.4, T(Array.from({ length: 8 }, (_, b) => { const r = [40, 40, 38, 40, 43, 40, 38, 40][b]; return `${r} . . . . . . . . . ${r} . . . . .`; }).join(' '))),
  beat('tom', 0.12, 0.55, 'o.....x...o.....', 8), beat('shake', 0.04, 0.7, '..x...x...x...x.', 8),
] };
// Zhangjiajie: five notes again, but a different five (D, E, F sharp, A, B), plucked runs like a zither's and a bamboo flute a long way off.
TRACKS.zhangjiajie = { bpm: 72, len: 128, parts: [
  chords(0.14, [[50, 57, 62, 66], [47, 54, 59, 62], [45, 52, 57, 61], [50, 57, 62, 64], [50, 57, 62, 66], [47, 54, 59, 66], [45, 52, 59, 61], [50, 57, 62, 66]], 16),
  line('pluck', 0.2, 0, T('74 76 78 . 81 . . . 78 . 76 . 74 . . . 71 . 74 . 76 . . . 74 . . . . . . . 73 . 76 . 81 . . . 83 . 81 . 78 . . . 76 78 81 . 78 . 76 . 74 . . . . . . . 81 83 86 . 83 . . . 81 . 78 . 76 . . . 78 . 81 . 83 . . . 78 . . . . . . . 76 . 73 . 76 . . . 81 . 78 . 76 . 74 . 74 . . . . . . . . . . . . . . .')),
  line('flute', 0.1, 0.25, T('. . . . . . . . . . . . 86 . . . . . . . 88 . . . . . . . 86 . . . . . . . . . . . 90 . . . . . . . 88 . . . . . . . 86 . . . 83 . . . . . . . . . . . 93 . . . . . . . 90 . . . . . . . 88 . . . 86 . . . . . . . . . . . 85 . . . . . . . 88 . . . . . . . 86 . . . . . . .')),
  line('bell', 0.05, 0.5, T(Array.from({ length: 8 }, (_, b) => `. . . . . . . . ${[90, 86, 85, 88, 93, 90, 88, 86][b]} . . . . . . .`).join(' '))),
  line('bass', 0.18, 0.4, T(Array.from({ length: 8 }, (_, b) => { const r = [38, 35, 33, 38, 38, 35, 33, 38][b]; return `${r} . . . . . . . ${r + 7} . . . . . . .`; }).join(' '))),
  beat('tick', 0.03, 0.6, 'x...x...x...x.x.', 8), beat('tom', 0.1, 0.75, 'o.......o.....x.', 8),
] };
// Patagonia: six to the bar in A minor, a plucked run like a charango's under a breathy flute, and a low drum like the wind against a tent.
TRACKS.patagonia = { bpm: 104, len: 96, parts: [
  chords(0.14, [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59], [57, 60, 64], [60, 64, 67], [55, 59, 62], [57, 60, 64]], 12),
  line('pluck', 0.18, 0, T(Array.from({ length: 8 }, (_, b) => { const c = [[69, 72, 76], [67, 71, 74], [65, 69, 72], [64, 67, 71], [69, 72, 76], [72, 76, 79], [67, 71, 74], [69, 72, 76]][b]; return `${c[0]} . ${c[1]} ${c[2]} . ${c[1]} ${c[0]} . ${c[2]} ${c[1]} . .`; }).join(' '))),
  line('flute', 0.11, 0.2, T(['81 . . . . . 84 . . 83 . .', '79 . . . . . 83 . . 81 . .', '77 . . . . . 81 . . 79 . .', '76 . . . . . . . . 79 . .', '81 . . . . . 84 . . 88 . .', '86 . . . . . 84 . . 88 . .', '86 . . 83 . . 79 . . 83 . .', '81 . . . . . . . . . . .'].join(' '))),
  line('bass', 0.2, 0.4, T(Array.from({ length: 8 }, (_, b) => { const r = [45, 43, 41, 40, 45, 48, 43, 45][b]; return `${r} . . . . . ${r + 7} . . ${r} . .`; }).join(' '))),
  beat('tom', 0.11, 0.5, 'o.....x..x..', 8), beat('shake', 0.04, 0.65, '..x..x..x..x', 8),
] };
// New Zealand: three to the bar in G, a slow tune on five notes over held chords, and now and then three clear high notes dropped in from above,
// as a bellbird drops them into a wet forest.
TRACKS.newzealand = { bpm: 88, len: 96, parts: [
  chords(0.13, [[55, 59, 62], [52, 59, 64], [48, 60, 64], [50, 57, 66], [59, 62, 67], [48, 60, 67], [57, 60, 64], [50, 57, 62]], 12),
  line('keys', 0.16, 0, T(['79 . . . . . 76 . . 74 . .', '71 . . . . . 74 . . 76 . .', '79 . . . . . 83 . . 81 . .', '78 . . . . . . . . 74 . .', '79 . . 81 . . 83 . . 86 . .', '84 . . . . . 83 . . 79 . .', '81 . . . . . 76 . . 79 . .', '74 . . . . . . . . . . .'].join(' '))),
  line('pluck', 0.1, 0.2, T(Array.from({ length: 8 }, (_, b) => { const c = [[67, 71, 74], [64, 71, 76], [64, 67, 72], [66, 69, 74], [67, 71, 74], [67, 72, 76], [64, 69, 72], [66, 69, 74]][b]; return `${c[0]} . . ${c[1]} . . ${c[2]} . . ${c[1]} . .`; }).join(' '))),
  line('flute', 0.09, 0.3, T(['. . . . . . . . . . . .', '83 . . . . . . . . . . .', '. . . . . . 86 . . . . .', '. . . . . . 81 . . . . .', '. . . . . . . . . . . .', '88 . . . . . . . . . . .', '. . . . . . 84 . . . . .', '86 . . . . . . . . . . .'].join(' '))),
  line('bell', 0.05, 0.4, T(['. . . . . . . . . . . .', '. . . . . . . . . 95 91 98', '. . . . . . . . . . . .', '. . . 93 90 . . . . . . .', '. . . . . . . . . . . .', '. . . . . . . . . 96 91 95', '. . . . . . . . . . . .', '. . . 98 93 90 . . . . . .'].join(' '))),
  line('bass', 0.18, 0.4, T(Array.from({ length: 8 }, (_, b) => { const r = [43, 40, 36, 38, 43, 36, 45, 38][b]; return `${r} . . . . . ${r + 7} . . . . .`; }).join(' '))),
  beat('shake', 0.03, 0.55, '...x.....x..', 8), beat('tom', 0.09, 0.75, 'o...........', 8),
] };
export const trackNames = () => Object.keys(TRACKS);
export function addTrack(name, def) { TRACKS[name] = def; }
export const tk = { T, line, chords, beat };

export function playMusic(name) { if (A.track === name) return; A.track = name; A.step = 0; if (A.ctx) A.t0 = now() + 0.08; A.intensity = 0; }
export function setIntensity(v) { A.want = Math.max(0, Math.min(1, v)); }
function schedule() {
  if (!A.ctx || A.ctx.state !== 'running') return; const tr = TRACKS[A.track]; if (!tr) return;
  A.intensity += (A.want - A.intensity) * 0.06;
  const sd = 60 / tr.bpm / 4, ahead = now() + 0.2;
  if (A.t0 < now() - 1) { A.t0 = now() + 0.05; }
  while (A.t0 < ahead) {
    const s = A.step % tr.len, t = A.t0;
    for (const p of tr.parts) { const g = Math.max(0, Math.min(1, (A.intensity - p.from) * 5 + (p.from === 0 ? 1 : 0))); if (g < 0.03) continue; if (!p._at) { p._at = new Map(); for (const n of p.notes) { if (!p._at.has(n[0])) p._at.set(n[0], []); p._at.get(n[0]).push(n); } } const ns = p._at.get(s); if (ns) for (const n of ns) INS[p.ins](n[1], t, n[2] * sd, p.vol * g); }
    A.step++; A.t0 += sd;
  }
}

// ---- sounds of the world ----
function loop(name, make) { if (!A.loops[name]) A.loops[name] = make(); return A.loops[name]; }
function noiseLoop(type, f, q) { const c = A.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = A.noise; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(A.sfx); s.start(); return { g, fl }; }
// Called every frame with what the body is doing: wind, rolling, sliding and nearby geysers are continuous sounds that follow it.
export function ambient(s) {
  if (!A.ctx || A.ctx.state !== 'running') return; const t = now();
  const wind = loop('wind', () => noiseLoop('bandpass', 500, 0.6)), roll = loop('roll', () => noiseLoop('lowpass', 180, 0.8)), slide = loop('slide', () => noiseLoop('bandpass', 2600, 0.9)), jet = loop('jet', () => noiseLoop('bandpass', 900, 0.5));
  const sp = s.speed || 0;
  wind.g.gain.setTargetAtTime(Math.min(0.5, Math.max(0, sp - 6) * 0.02) * (s.air ? 1.3 : 1), t, 0.1); wind.fl.frequency.setTargetAtTime(350 + sp * 32, t, 0.1);
  roll.g.gain.setTargetAtTime(s.rolling ? Math.min(0.6, sp * 0.03) : 0, t, 0.05); roll.fl.frequency.setTargetAtTime(110 + sp * 9, t, 0.1);
  slide.g.gain.setTargetAtTime(s.sliding ? Math.min(0.3, sp * 0.02) : 0, t, 0.05); slide.fl.frequency.setTargetAtTime(s.soft ? 1400 : 3200, t, 0.1);
  jet.g.gain.setTargetAtTime(Math.min(0.5, s.jet || 0), t, 0.15);
  // the weather: rain is a high hiss that thickens, snow falls silently, and the wind is heard even when the hero stands still
  const rain = loop('rain', () => noiseLoop('highpass', 3800, 0.4)), air = loop('air', () => noiseLoop('bandpass', 320, 0.9)), w = Math.abs(s.wind || 0);
  rain.g.gain.setTargetAtTime(Math.min(0.26, (s.rain || 0) * 0.26), t, 0.6); air.g.gain.setTargetAtTime(Math.min(0.3, w * 0.022 + (s.gust || 0) * 0.07), t, 0.35); air.fl.frequency.setTargetAtTime(240 + w * 45 + (s.gust || 0) * 160, t, 0.4);
}
export function quiet() { if (!A.ctx) return; for (const k in A.loops) A.loops[k].g.gain.setTargetAtTime(0, now(), 0.05); }
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
export const sfx = {
  land(impact, soft) { if (!A.ctx) return; const t = now(), v = Math.min(0.7, impact * 0.035); tone(A.sfx, 'sine', soft ? 90 : 120, t, 0.16, v, { a: 0.003, r: 0.12, f2: 45 }); hiss(A.sfx, t, soft ? 0.16 : 0.09, v * 0.5, { type: 'lowpass', f: soft ? 900 : 2400 }); },
  step(soft) { if (!A.ctx) return; hiss(A.sfx, now(), 0.04, 0.05, { type: 'bandpass', f: soft ? 800 : 2200, q: 1 }); },
  splash() { if (!A.ctx) return; const t = now(); hiss(A.sfx, t, 0.4, 0.4, { f: 2400, f2: 500, q: 0.6, send: 0.4 }); tone(A.sfx, 'sine', 300, t, 0.15, 0.2, { f2: 90 }); },
  seed() { if (!A.ctx) return; const t = now(); A.combo = t - A.comboT < 1.6 ? Math.min(A.combo + 1, 10) : 0; A.comboT = t; const n = 76 + PENTA[A.combo]; tone(A.sfx, 'sine', midi(n), t, 0.3, 0.24, { a: 0.004, r: 0.25, send: 0.6 }); tone(A.sfx, 'sine', midi(n + 7), t + 0.06, 0.3, 0.16, { a: 0.004, r: 0.25, send: 0.6 }); },
  goal() { if (!A.ctx) return; const t = now(); [62, 66, 69, 74, 78, 81, 86].forEach((n, i) => tone(A.sfx, 'triangle', midi(n), t + i * 0.085, 1.3, 0.16, { a: 0.01, r: 1, send: 0.8, lp: 4000 })); },
  medal(k) { if (!A.ctx) return; const t = now(); [[72, 76, 79], [72, 76, 79, 84], [72, 76, 79, 84, 88]][k].forEach((n, i) => tone(A.sfx, 'sine', midi(n), t + i * 0.1, 0.5, 0.2, { r: 0.4, send: 0.7 })); },
  // the long whistle of something going down a hole, the twang of the thread that stops it, and a very small engine carrying far too much
  fall(len = 1) { if (!A.ctx) return; const t = now(); tone(A.sfx, 'sine', 980, t, 0.75 * len, 0.15, { f2: 150, r: 0.25, send: 0.3 }); tone(A.sfx, 'sine', 1470, t, 0.6 * len, 0.04, { f2: 230, r: 0.2 }); },
  catch() { if (!A.ctx) return; const t = now(); tone(A.sfx, 'triangle', 150, t, 0.3, 0.2, { f2: 420, r: 0.2 }); tone(A.sfx, 'sine', midi(88), t + 0.02, 0.5, 0.1, { r: 0.4, send: 0.7 }); tone(A.sfx, 'sine', midi(93), t + 0.1, 0.5, 0.07, { r: 0.4, send: 0.7 }); },
  // pigeons: the soft double note of one disturbed, and the clatter of a whole loft leaving at once
  coo(p = 0.3) { if (!A.ctx) return; const t = now(), f = 330 + p * 90; tone(A.sfx, 'sine', f, t + 0.05, 0.16, 0.09, { f2: f * 1.18, r: 0.08, lp: 900 }); tone(A.sfx, 'sine', f * 1.2, t + 0.24, 0.3, 0.11, { f2: f * 0.92, r: 0.18, lp: 900 }); },
  flock() { if (!A.ctx) return; const t = now(); for (let i = 0; i < 26; i++) hiss(A.sfx, t + i * 0.06 + Math.random() * 0.03, 0.07, 0.22 * (1 - i / 34), { type: 'bandpass', f: 700 + Math.random() * 900, q: 0.9 }); for (let i = 0; i < 5; i++) { const f = 340 + Math.random() * 120; tone(A.sfx, 'sine', f, t + 0.1 + i * 0.27, 0.2, 0.07, { f2: f * 1.15, r: 0.1, lp: 900 }); } },
  haul(secs = 1.2) { if (!A.ctx) return; const t = now(), n = Math.floor(secs / 0.075); for (let i = 0; i < n; i++) { const u = i / n; tone(A.sfx, 'triangle', 190 + u * 150 + (i % 2) * 22, t + i * 0.075, 0.06, 0.07 * (1 - u * 0.4), { a: 0.008, r: 0.04, lp: 1400 }); } },
  back() { if (!A.ctx) return; const t = now(); tone(A.sfx, 'sine', 300, t, 0.12, 0.2, { f2: 720, r: 0.08 }); hiss(A.sfx, t, 0.12, 0.1, { f: 3000 }); },
  geyser() { if (!A.ctx) return; hiss(A.sfx, now(), 1.4, 0.3, { f: 500, f2: 2600, q: 0.5, a: 0.3 }); },
  drum(p = 0) { if (!A.ctx) return; const t = now(); tone(A.sfx, 'sine', 70 + p * 60, t, 0.5, 0.5, { a: 0.004, r: 0.4, f2: 46 + p * 30, send: 0.3 }); hiss(A.sfx, t, 0.25 + p * 0.5, 0.06 + p * 0.14, { f: 1800, f2: 4200, q: 0.7 }); },
  thunder() { if (!A.ctx) return; const t = now() + 0.8 + Math.random() * 1.4; hiss(A.sfx, t, 2.6, 0.5, { type: 'lowpass', f: 220, f2: 60, q: 0.4, a: 0.05, send: 0.6 }); },
  turbo() { if (!A.ctx) return; const t = now(); tone(A.sfx, 'sawtooth', 220, t, 0.45, 0.2, { a: 0.01, r: 0.3, f2: 1320, lp: 2600, send: 0.5 }); hiss(A.sfx, t, 0.5, 0.3, { f: 900, f2: 5200, q: 0.6, a: 0.02 }); tone(A.sfx, 'sine', midi(81), t + 0.05, 0.4, 0.14, { r: 0.3, send: 0.7 }); },
  // Mu's wings: three quick beats of air and a chirp
  hop() { if (!A.ctx) return; const t = now(); for (let i = 0; i < 3; i++) hiss(A.sfx, t + i * 0.055, 0.05, 0.16, { type: 'bandpass', f: 900 + i * 260, q: 0.8 }); tone(A.sfx, 'sine', 1500, t + 0.02, 0.09, 0.09, { f2: 2300, r: 0.05 }); },
  feather() { if (!A.ctx) return; const t = now(); hiss(A.sfx, t, 0.12, 0.1, { type: 'bandpass', f: 2600, f2: 1200, q: 0.8 }); tone(A.sfx, 'sine', midi(88), t, 0.16, 0.1, { r: 0.12, send: 0.4 }); tone(A.sfx, 'sine', midi(93), t + 0.07, 0.2, 0.09, { r: 0.15, send: 0.4 }); },
  dew() { if (!A.ctx) return; const t = now(); tone(A.sfx, 'sine', 1400, t, 0.16, 0.16, { f2: 620, r: 0.1, send: 0.5 }); tone(A.sfx, 'sine', midi(81), t + 0.12, 0.5, 0.12, { a: 0.01, r: 0.4, send: 0.6 }); },
  stamp() { if (!A.ctx) return; const t = now(); hiss(A.sfx, t, 0.09, 0.14, { type: 'bandpass', f: 1800, f2: 3400, q: 0.7 }); [74, 78, 81, 86, 90].forEach((n, i) => tone(A.sfx, 'triangle', midi(n), t + 0.05 + i * 0.07, 0.6, 0.13, { a: 0.005, r: 0.5, send: 0.6 })); },
  wake() { if (!A.ctx) return; const t = now(); [57, 64, 69, 76, 81].forEach((n, i) => tone(A.sfx, 'sine', midi(n), t + i * 0.13, 2.2, 0.13, { a: 0.02, r: 1.8, send: 0.9 })); },
  ui(up = false) { if (!A.ctx) return; tone(A.sfx, 'sine', up ? 880 : 660, now(), 0.07, 0.12, { r: 0.05 }); },
  page() { if (!A.ctx) return; hiss(A.sfx, now(), 0.16, 0.12, { f: 2600, f2: 900, q: 0.5 }); },
};

// ---- Theta's voice ----
// Wordless: a small bright throat (a saw through two moving formants) with a pitch that jumps, slides and wobbles.
// Every sound has several turns and never comes out the same twice.
const VOW = { a: [900, 1500], i: [380, 2500], u: [400, 900], o: [520, 950], e: [600, 2000] };
function say(notes, { vol = 0.3, vowel = 'a', vowel2 = null, vib = 0, breath = 0 } = {}) {
  if (!A.ctx || A.ctx.state !== 'running') return; const c = A.ctx, t = now(), o = c.createOscillator(), g = c.createGain(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), mixg = c.createGain();
  const bend = 1 + (Math.random() - 0.5) * 0.12; o.type = 'sawtooth'; let at = t, total = 0;
  g.gain.setValueAtTime(0, t);
  for (const [f, d, gap] of notes) { o.frequency.setValueAtTime(f[0] * bend, at); o.frequency.exponentialRampToValueAtTime(f[1] * bend, at + d); g.gain.linearRampToValueAtTime(vol, at + Math.min(0.02, d * 0.3)); g.gain.setTargetAtTime(0, at + d * 0.75, d * 0.12); at += d + (gap || 0); total = at - t; }
  if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 7 + Math.random() * 3; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + total + 0.2); }
  const v1 = VOW[vowel], v2 = VOW[vowel2 || vowel]; f1.type = f2.type = 'bandpass'; f1.Q.value = 5; f2.Q.value = 7;
  f1.frequency.setValueAtTime(v1[0], t); f1.frequency.linearRampToValueAtTime(v2[0], t + total); f2.frequency.setValueAtTime(v1[1], t); f2.frequency.linearRampToValueAtTime(v2[1], t + total);
  o.connect(f1); o.connect(f2); f1.connect(mixg); f2.connect(mixg); mixg.gain.value = 2.2; mixg.connect(g); g.connect(A.voice); const s = c.createGain(); s.gain.value = 0.25; g.connect(s); s.connect(A.send);
  if (breath) hiss(A.voice, t, total * 0.8, breath, { f: 2400, q: 0.8 });
  o.start(t); o.stop(t + total + 0.3);
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const voice = {
  hup(strength = 0.5) { const b = 480 + strength * 260; say([[[b, b * pick([1.4, 1.5, 1.6])], 0.09 + strength * 0.03]], { vol: 0.22, vowel: pick(['a', 'e']), vowel2: 'u' }); },
  oof(impact = 0.5) { const b = 430 - impact * 120; say([[[b, b * 0.62], 0.13 + impact * 0.1]], { vol: 0.24 + impact * 0.1, vowel: 'o', vowel2: 'u', breath: 0.05 + impact * 0.08 }); },
  whee(len = 0.5) { const b = pick([640, 700, 760]); say([[[b, b * 1.25], 0.14], [[b * 1.25, b * 1.12], 0.2 + len * 0.5]], { vol: 0.2, vowel: 'i', vowel2: 'e', vib: 14 }); },
  giggle() { const b = pick([620, 680, 740]), n = pick([3, 4]); say(Array.from({ length: n }, (_, i) => [[b * (1 + (i % 2) * 0.12 + i * 0.03), b * (1.06 + (i % 2) * 0.12 + i * 0.03)], 0.06, 0.035]), { vol: 0.2, vowel: 'e', vowel2: 'i' }); },
  trill() { const b = pick([520, 560]); say([[[b, b], 0.09, 0.02], [[b * 1.26, b * 1.26], 0.09, 0.02], [[b * 1.5, b * 1.5], 0.09, 0.02], [[b * 2, b * 1.9], 0.34]], { vol: 0.24, vowel: 'a', vowel2: 'i', vib: 12 }); },
  grumble() { const b = pick([230, 250, 270]); say([[[b, b * 0.9], 0.12, 0.03], [[b * 0.95, b * 0.8], 0.22]], { vol: 0.26, vowel: 'u', vowel2: 'o', vib: 22, breath: 0.04 }); },
  hm() { const b = pick([420, 460]); say([[[b, b * 1.18], 0.16]], { vol: 0.16, vowel: 'u', vowel2: 'e' }); },
  wail() { const b = pick([760, 820]); say([[[b * 1.15, b * 0.62], 0.62]], { vol: 0.2, vowel: 'a', vowel2: 'o', vib: 30 }); },
  wobble() { const b = pick([520, 560]); say([[[b, b * 0.96], 0.11, 0.035], [[b * 1.05, b], 0.11, 0.035], [[b * 1.1, b * 1.04], 0.11, 0.035], [[b * 1.16, b * 1.08], 0.2]], { vol: 0.17, vowel: 'o', vowel2: 'u', vib: 18 }); },
  eep() { const b = pick([820, 900]); say([[[b, b * 1.3], 0.07]], { vol: 0.2, vowel: 'i' }); },
  blub() { say([[[300, 520], 0.07, 0.02], [[340, 600], 0.08]], { vol: 0.2, vowel: 'u', vowel2: 'o' }); },
  yawn() { say([[[360, 520], 0.35], [[520, 300], 0.5]], { vol: 0.16, vowel: 'a', vowel2: 'o', vib: 5 }); },
};
