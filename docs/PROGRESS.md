# Gradient Descent: where the build stands

Last updated 25 November 2026.

## What the owner asked for (in order received)

A fast, fun, educational browser platformer about gradient descent. Cute, Japanese-anime-like, with the mood of Ori (mood only; everything original).
Seven worlds from nature: Iceland, Galápagos, Cappadocia, Namib, Zhangjiajie, Patagonia, Yakushima (no others). A lovable hero with a face, a body
that changes shape in action, and funny wordless sounds on every action. Original music. No physical errors. Addictive in the honest sense (ghosts,
medals, routes, daily valley, endless mode; nothing that nags or locks). About an hour and a half for a first play-through. Very high visual detail,
"competitive in visual appearance". Dynamic weather in every scene and screen. A title screen in the manner of Assassin's Creed Origins (a wide living
landscape, the name in thin widely spaced capitals, "press any key", then a plain text menu). An opening that convinces a player at once that the
game is of high quality. To be published on GitHub Pages later: **do not push or publish until the owner says so.**

## The seven worlds, in the order the owner approved (from the build prompt doc)

| World | Landscape | What it teaches | Things to see |
|---|---|---|---|
| 1. Iceland | Black sand, basalt columns, glaciers, waterfalls | Loss, gradient, learning rate | Geysers, hot springs, puffins, northern lights in the last level |
| 2. Cappadocia | Fairy chimneys, soft rock valleys, cave houses | Local minimum, momentum, where you start | Hot-air balloons at sunrise. A balloon ride sets the hero down at a new start |
| 3. Galápagos | Volcanic islands, lava fields, clear shallows | Stochastic gradient descent | Giant tortoises, marine iguanas, blue-footed boobies, sea lions. Surf and tide move the ground |
| 4. Namib | High red dunes, white clay pans | Plateaus, learning-rate schedules | Long flats, oryx, dead camel-thorn trees, sand on the wind |
| 5. Zhangjiajie | Sandstone pillars standing in mist | Ravines and adaptive steps | Deep narrow gorges, vines, macaques |
| 6. Patagonia | Granite towers, glaciers, hard wind | Exploding and vanishing gradients, clipping | Condors, guanacos, turquoise lakes, an ice field |
| 7. Yakushima | Ancient cedar forest, moss, rain | Overfitting, early stopping | Yaku deer, Yaku macaques, streams. The finale |

Mu, who stands for momentum, joins in Cappadocia ("something fitting, such as a small bird that rides the wind behind Theta"). Rolling is the gift of that world.
The names are the Greek letters of the equations: θ the parameters, η the learning rate, μ momentum. The notebook explains this once.
After the last world a sandbox opens: pick a landscape, set learning rate, momentum and noise with sliders, press go.

## Built and working

- Physics (`js/game/physics.js`), 8 tests. Wind from the weather acts on the body through air drag (`T.air`).
- Hero Theta (`js/game/theta.js`): drawn in code, rig with springs, expressions, ears and tail that answer the wind, wet look in rain.
- Renderer (`js/art/scene.js`, `paint.js`), world theme `js/art/worlds/iceland.js` at six hours (dawn, day, mist, golden, dusk, night with aurora).
  Far ridges with gullies, crest light and valley mist; a lake with sun glitter; birds; light shafts behind the ground; sun bloom; foreground silhouettes.
- Backgrounds (owner: "more colorful, with more dynamic elements and a lot greater amount of details"). The standard every world must now meet, as Iceland does:
  a painted sky (colour washes per hour, cirrus above heaped cloud, a moon with seas and a halo, the band of the galaxy, falling stars), a cloud bank on
  the horizon, six or more far layers each with its own colour bands, things standing on the faces of hills as well as on skylines (`drop`), and many
  that move: waterfalls, far geysers, chimney smoke, grazing animals, flocks, a lighthouse beam, a far eruption that glows after dark, a fjord with ice
  adrift, a boat and a whale (`things` on a lake), light dancing on rivers (`glint`). Beside the path: cairns, a turf house with lamp and smoke, horses,
  puffins that blink, steam vents (`behind` props with `frames`, `roam`, `glow`, `emit`).
- Cost of a frame: the far country is painted at 0.5 to 0.75 of the screen's resolution into `scene.farC` and laid in as one picture; tint, grain and
  vignette are page veils (`#grade` in index.html, css) and not canvas fills; the canvas is capped at 1440p on Full. `python3 scripts/perf.py` times a frame.
- Weather (`js/game/weather.js`): one seeded state per level and hour, a pure function of time: wind and gusts, cloud cover, rain or snow (snow on
  snow and ice ground and at cold hours), fog, wet ground, cloud shadows, a rainbow only at hours when the sun is behind the viewer. A level opens fair
  and turns as the run goes on (except places marked `early`). Rain and wind are heard. The title and all menus sit over the same live scene.
- Iceland: five levels and the boss (`js/data/worlds.js`), all finished by the scripted player (`scripts/bot.mjs`, `tests/levels.test.mjs`).
  The Geyser (`js/game/boss.js`): crust ground whose pressure rises with hard landings and erupts under the hero.
- Cappadocia (`js/art/worlds/cappadocia.js`, six hours: dawn, day, golden, dusk, night, winter): fairy chimneys with rooms and lamps, poplars, apricot
  trees, vineyards, the red river, Mount Erciyes, a tableland in beds of colour, balloons in the sky (`theme.sky`), strata of ash in every cut bank.
  Five levels and a boss, all finished by the scripted player. Rolling (the ball), hollows with rims too steep to walk (`hollow()` in worlds.js),
  deep dust that slows a roll, Mu the bird (`Mu` in play.js), the balloon ride (`js/game/ride.js`, stroke option `ride: { at, to, up }`),
  music in nine-eight after the makam Hüseyni, five notebook pages (momentum, local minimum, over the rim, where you start, too much momentum).
  Every level now ends in a cliff past the goal, and the goal is the lowest point of the last bowl.
- Galápagos (`js/art/worlds/galapagos.js`, six hours incl. the garúa mist): lava and red cinder, white beaches, prickly-pear trees, sesuvium, the sea with
  islets and boats, tortoises, marine iguanas, boobies, sea lions, crabs. Five levels and a boss, all finished by the scripted player.
  Tide and surf (`js/game/tide.js`, stroke options `water` + `tide`), rafts afloat (`float`), sea turtles that swim to and fro (`walk`),
  lagoons (dry is the fast line, falling in only costs time) and tide basins (stand on the raft, the tide lifts it, hop out). Music in six-eight, five pages
  (a handful at a time, a noisy slope, stochastic gradient descent, shaken loose, settling).
- Namib (`js/art/worlds/namib.js`, six hours incl. sea fog): dune seas with a lit and a shadowed face, white clay pans, dead trees (`P.deadtree`), acacias,
  oryx, sand on the wind (wind zones now show as streaks). Five levels and a boss, all finished by the scripted player. Blocks in worlds.js: `pan` (hard, level
  clay: a ball keeps its speed), `softFlat` (a roll dies), `dune` (up and over), `gale` (a tail wind to sail on with the float). Music on five notes, five pages
  (plateau, keep going, a schedule for the steps, shorter and shorter, warming up).
- The story (`js/data/story.js`, owner: "there should be a story about why the hero travels to these locations"). A seed of light will grow only in the
  lowest valley in the world, and nobody knows where that is. Each country is somebody's answer, fails for the reason that country teaches, and whoever
  lives there knows where to try next: Iceland (too new, still boiling) → Cappadocia (all hollows, all on a high plateau) → Galápagos (the edge of the sea,
  but the tide takes it back) → Namib (where a river stops: flat and dry) → Zhangjiajie (deep ravines, no sky) → Patagonia (ice-cut valleys, too violent)
  → Yakushima (the old forest: the seed takes root where things planted long ago still grow). A chapter is shown before the first level of each country
  (`showTale`), and all read chapters are under "The story" on the title. Chapters for countries not yet built are already written.
- `js/art/worlds/kit.js`: the stock sprites every theme shares (`stock(time, tag, palette)`), `tones`, `lamps`. New themes should start from it.
- Fairy chimneys were redrawn from the real ones at the owner's request (`P.chimney`, `P.badland`; `dist/dev/chimneys.html` lays them out to inspect).
- Screens (`js/ui/ui.js`, `css/app.css`): cinematic title with "press any key", text menu with keyboard movement, level list, pause, finish card with
  the run as a loss curve and medals, notebook with five pages, how to play, settings (volumes, picture, motion, text size, assist, contrast),
  "Also play this!", credits. Level name card at the start of each level, with a wide opening look before the first step.
- The opening scene (`Play._intro`, level 1-1, once; `?level=1-1&intro` to see it again): Theta asleep, a seed of light falls, the waking, the finding, Eta rising.
- Smooth movement: the body is drawn between physics steps (`b.mix`, `Play.view`), camera eased by time, turning through the front view. `python3 scripts/smooth.py` measures it.
- A private preview page exists (artifact slug `05675afd-d58f-4c1b-9fe1-b361fe6fa345`); republish `dist/` to it with `publish_files` after changes.
- Sound (`js/core/audio.js`): music for title, Iceland, boss and card, written as notes; effects; Theta's wordless voice; rain and wind.
- Saves (`js/core/save.js`): best times, medals, ghosts, notebook pages, settings.

## Not built yet

- Worlds 5 to 7 (themes, music, mechanics, bosses, notebook pages). Next: Zhangjiajie (ravines and adaptive steps; sandstone pillars in mist, deep narrow gorges, vines, macaques).
- An ending scene for the last chapter of the story.
- Cappadocia still wants: a scene in which Mu joins (like the opening scene), a boss with something of its own (now it is a hard run of hollows), a play-through by hand for feel, better poplars.
- The wordless story scenes, Sort! bonus stages, the daily valley, endless mode, the lab with sliders, the teacher page, the share card.
- Key rebinding screen (the hooks exist in `input.js`), high-contrast palette (the setting exists, the palette does not), a larger landing margin for assist.
- Iceland still wants: a visible great geyser behind the boss level, an arctic fox, richer detail in the cut earth.

## Checks to run

    node --test tests/*.test.mjs        # physics and levels
    node scripts/bot.mjs -v             # times for every level
    python3 scripts/shot.py out.png "index.html?level=1-2&x=70&run&wx=0.97" 1600 900 4000

URL switches for looking at things: `?level=1-3`, `&x=120`, `&time=dusk`, `&run` or `&run=tuck`, `&wx=0..1` (fix the weather front; 1 is foul), `&gfx=0|1|2`, `?unlock`.
