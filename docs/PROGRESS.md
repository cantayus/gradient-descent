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
- Weather (`js/game/weather.js`): one seeded state per level and hour, a pure function of time: wind and gusts, cloud cover, rain or snow (snow on
  snow and ice ground and at cold hours), fog, wet ground, cloud shadows, a rainbow only at hours when the sun is behind the viewer. A level opens fair
  and turns as the run goes on (except places marked `early`). Rain and wind are heard. The title and all menus sit over the same live scene.
- Iceland: five levels and the boss (`js/data/worlds.js`), all finished by the scripted player (`scripts/bot.mjs`, `tests/levels.test.mjs`).
  The Geyser (`js/game/boss.js`): crust ground whose pressure rises with hard landings and erupts under the hero.
- Screens (`js/ui/ui.js`, `css/app.css`): cinematic title with "press any key", text menu with keyboard movement, level list, pause, finish card with
  the run as a loss curve and medals, notebook with five pages, how to play, settings (volumes, picture, motion, text size, assist, contrast),
  "Also play this!", credits. Level name card at the start of each level, with a wide opening look before the first step.
- The opening scene (`Play._intro`, level 1-1, once; `?level=1-1&intro` to see it again): Theta asleep, a seed of light falls, the waking, the finding, Eta rising.
- Smooth movement: the body is drawn between physics steps (`b.mix`, `Play.view`), camera eased by time, turning through the front view. `python3 scripts/smooth.py` measures it.
- A private preview page exists (artifact slug `05675afd-d58f-4c1b-9fe1-b361fe6fa345`); republish `dist/` to it with `publish_files` after changes.
- Sound (`js/core/audio.js`): music for title, Iceland, boss and card, written as notes; effects; Theta's wordless voice; rain and wind.
- Saves (`js/core/save.js`): best times, medals, ghosts, notebook pages, settings.

## Not built yet

- Worlds 2 to 7 (themes, music, mechanics, bosses, notebook pages). Next: Cappadocia, with rolling, Mu the bird, balloons in the sky and the balloon ride.
- The wordless story scenes, Sort! bonus stages, the daily valley, endless mode, the lab with sliders, the teacher page, the share card.
- Key rebinding screen (the hooks exist in `input.js`), high-contrast palette (the setting exists, the palette does not), a larger landing margin for assist.
- A second look at Iceland: animals near the path (puffins, an arctic fox), a visible great geyser behind the boss level, richer ground detail.

## Checks to run

    node --test tests/*.test.mjs        # physics and levels
    node scripts/bot.mjs -v             # times for every level
    python3 scripts/shot.py out.png "index.html?level=1-2&x=70&run&wx=0.97" 1600 900 4000

URL switches for looking at things: `?level=1-3`, `&x=120`, `&time=dusk`, `&run` or `&run=tuck`, `&wx=0..1` (fix the weather front; 1 is foul), `&gfx=0|1|2`, `?unlock`.
