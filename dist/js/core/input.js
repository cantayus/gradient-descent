// Keys, touch and gamepad, all read into one small state: move (-1..1), jump (held), jumpNow (pressed since last read), tuck (held).
const KEYS = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['Space', 'KeyZ', 'KeyW', 'ArrowUp', 'KeyK'], tuck: ['ShiftLeft', 'ShiftRight', 'KeyX', 'ArrowDown', 'KeyS', 'KeyJ'], turbo: ['KeyE', 'KeyC', 'KeyL', 'ControlLeft', 'ControlRight'],
};
export const DEFAULT_KEYS = KEYS;
export const input = { move: 0, jump: false, jumpNow: false, turboNow: false, tuck: false, any: false, keys: structuredClone(KEYS), down: new Set(), touch: { move: 0, jump: false, tuck: false }, pad: { move: 0, jump: false, tuck: false }, on: {} };
const has = (name) => input.keys[name].some((k) => input.down.has(k));

export function initInput(el = window) {
  addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (input.on.rebind) { input.on.rebind(e.code); e.preventDefault(); return; }
    if (e.repeat) { if (Object.values(input.keys).flat().includes(e.code)) e.preventDefault(); return; }
    input.down.add(e.code); input.any = true; input.touch.used = false; input.pad.used = false;
    if (input.keys.jump.includes(e.code)) input.jumpNow = true;
    if (input.keys.turbo.includes(e.code)) input.turboNow = true;
    if (Object.values(input.keys).flat().includes(e.code)) e.preventDefault();
    const f = input.on[e.code]; if (f) f(e);
  });
  addEventListener('keyup', (e) => input.down.delete(e.code));
  addEventListener('blur', () => input.down.clear());
}
// Touch: the left half of the screen is a thumb pad (slide left or right of where the thumb came down); two buttons sit on the right.
export function initTouch(root) {
  const pad = root.querySelector('.tpad'), bj = root.querySelector('.tjump'), bt = root.querySelector('.ttuck'); if (!pad) return;
  let id = null, x0 = 0;
  const mv = (e) => { for (const t of e.changedTouches) if (t.identifier === id) { const d = t.clientX - x0; input.touch.move = Math.abs(d) < 12 ? 0 : d > 0 ? 1 : -1; if (Math.abs(d) > 60) x0 = t.clientX - Math.sign(d) * 60; } };
  pad.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; id = t.identifier; x0 = t.clientX; input.any = true; input.touch.used = true; e.preventDefault(); }, { passive: false });
  pad.addEventListener('touchmove', (e) => { mv(e); e.preventDefault(); }, { passive: false });
  const end = (e) => { for (const t of e.changedTouches) if (t.identifier === id) { id = null; input.touch.move = 0; } };
  pad.addEventListener('touchend', end); pad.addEventListener('touchcancel', end);
  const hold = (b, key) => { b.addEventListener('touchstart', (e) => { input.touch[key] = true; if (key === 'jump') input.jumpNow = true; input.any = true; e.preventDefault(); }, { passive: false }); const up = (e) => { input.touch[key] = false; e.preventDefault(); }; b.addEventListener('touchend', up); b.addEventListener('touchcancel', up); };
  hold(bj, 'jump'); hold(bt, 'tuck'); const bx = root.querySelector('.tturbo'); if (bx) bx.addEventListener('touchstart', (e) => { input.turboNow = true; input.any = true; e.preventDefault(); }, { passive: false });
}
let padJump = false, padTurbo = false;
export function readInput() {
  const gp = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find((g) => g && g.connected);
  if (gp) { const ax = gp.axes[0] || 0, dl = gp.buttons[14]?.pressed, dr = gp.buttons[15]?.pressed; input.pad.move = dl ? -1 : dr ? 1 : Math.abs(ax) > 0.3 ? Math.sign(ax) : 0; const j = gp.buttons[0]?.pressed; if (j && !padJump) input.jumpNow = true; padJump = j; input.pad.jump = j; const tb = gp.buttons[3]?.pressed || gp.buttons[2]?.pressed || gp.buttons[5]?.pressed; if (tb && !padTurbo) input.turboNow = true; padTurbo = tb; input.pad.tuck = gp.buttons[1]?.pressed || gp.buttons[7]?.pressed || (gp.axes[1] || 0) > 0.6; if (j || input.pad.move) { input.any = true; input.pad.used = true; input.touch.used = false; } }
  else input.pad.move = 0, input.pad.jump = false, input.pad.tuck = false;
  input.move = (has('right') ? 1 : 0) - (has('left') ? 1 : 0) || input.touch.move || input.pad.move;
  input.jump = has('jump') || input.touch.jump || input.pad.jump; input.tuck = has('tuck') || input.touch.tuck || input.pad.tuck;
  return input;
}
