# How long one frame takes to draw, in this headless browser (software drawing, so several times slower than a real machine; use it to compare, not to judge).
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot import serve
from playwright.sync_api import sync_playwright
JS = """() => { const G = window.__G, p = G.play, ctx = document.getElementById('view').getContext('2d'); G.paused = true; const t0 = performance.now(); for (let i = 0; i < 40; i++) { p.update(1 / 60, { move: 1, jump: false, jumpNow: false, tuck: false }); p.draw(ctx); } ctx.getImageData(0, 0, 1, 1); return (performance.now() - t0) / 40; }"""
s = serve()
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    for lvl in sys.argv[1:] or ['1-2']:
        for gfx in (2, 1, 0):
            pg = b.new_page(viewport={'width': 1600, 'height': 900}); pg.goto(f'http://127.0.0.1:8765/index.html?level={lvl}&gfx={gfx}'); pg.wait_for_timeout(1500)
            print(f'{lvl} picture {gfx}: {pg.evaluate(JS):.1f} ms a frame'); pg.close()
    b.close()
s.shutdown()
