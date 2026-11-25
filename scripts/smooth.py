# Measures how evenly the hero moves on screen. Runs a level with the right key held, records the drawn position every frame,
# and reports how far each frame's movement is from speed x frame time. usage: python3 scripts/smooth.py [level]
import sys, os, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot import serve
from playwright.sync_api import sync_playwright
lvl = sys.argv[1] if len(sys.argv) > 1 else '1-1'
# The game's own loop is paused and the level is stepped by hand with uneven frame times, as a busy machine or a 144 Hz screen would give.
JS = """(hz) => { const G = window.__G, p = G.play, out = []; G.paused = true; let now = 0, seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const inp = { move: 1, jump: false, jumpNow: false, tuck: false };
  for (let n = 0; n < 900; n++) { const dt = (1 / hz) * (0.8 + 0.4 * rnd()); now += dt * 1000; p.update(dt, inp); const b = p.b, v = p.view; out.push([now, v.x, v.y, b.x, b.y, b.vx, b.vy, p.cam.x, p.cam.y, p.rig.p.lean, p.rig.p.sy, p.dead > 0 ? 1 : 0]); }
  return out; }"""
s = serve()
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 960, 'height': 540}); pg.goto(f'http://127.0.0.1:8765/index.html?level={lvl}&gfx=0'); pg.wait_for_timeout(2000)
    runs = {hz: pg.evaluate(JS, hz) for hz in (144, 60, 37)} if True else {}; b.close()
s.shutdown()
for hz, rows in runs.items():
  print(f'--- about {hz} frames a second, each frame up to a fifth early or late ---')
  if True:
    def stats(ix, iy):
        e = []
        for a, c in zip(rows, rows[1:]):
            dt = (c[0] - a[0]) / 1000
            if dt <= 0 or dt > 0.05 or a[11] or c[11] or abs(c[5] - a[5]) > 60 * dt or abs(c[6] - a[6]) > 60 * dt: continue      # skip respawns and the frame of a landing
            vx, vy = (a[5] + c[5]) / 2, (a[6] + c[6]) / 2
            e.append(math.hypot(c[ix] - a[ix] - vx * dt, c[iy] - a[iy] - vy * dt))
        e.sort(); return sum(e) / len(e), e[int(len(e) * 0.95)], e[-1]
    dts = [(c[0] - a[0]) for a, c in zip(rows, rows[1:])]
    print(f'frames {len(rows)}, frame time {min(dts):.1f} to {max(dts):.1f} ms, top speed {max(math.hypot(r[5], r[6]) for r in rows):.1f} units/s')
    for name, ix, iy in (('as drawn (between steps)', 1, 2), ('raw physics position', 3, 4)):
        m, p95, mx = stats(ix, iy); print(f'  {name:26s} error per frame: mean {m * 1000:.1f}  95% {p95 * 1000:.1f}  worst {mx * 1000:.1f}  (thousandths of a unit; one unit is about 43 px at 540p)')
    # the camera and the pose should never jump: largest change in one frame
    jc = max(math.hypot(c[7] - a[7], c[8] - a[8]) / max((c[0] - a[0]) / 1000, 1e-3) for a, c in zip(rows, rows[1:]))
    jl = max(abs(c[9] - a[9]) for a, c in zip(rows, rows[1:])); js = max(abs(c[10] - a[10]) for a, c in zip(rows, rows[1:]))
    print(f'  camera top speed {jc:.1f} units/s; largest change in one frame: lean {jl:.3f} rad, squash {js:.3f}')
