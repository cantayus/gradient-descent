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
- Zhangjiajie (`js/art/worlds/zhangjiajie.js`): ranks of flat-topped pillars in mist (`pillar` ridge style), near pillars of stacked blocks (`P.pillar`),
  pines, bamboo, macaques, a pavilion, waterfalls. Five levels and a boss, all finished by the scripted player. Blocks: `tops(widths, gaps)` (pillar tops
  with gaps of differing width, so every jump is a different length) and `ravine(L, depth, bridge)` (steep both ways but always walkable out of; a vine
  bridge across the mouth for the fast line). Five pages (ravine, side to side, a step for each direction, recent memory, Adam).
- Rules for losing and winning (owner: "the player should also be able to fail… set some rules for failing and some rules for winning"):
  the seed has three lights; a fall or a Geyser eruption puts one out; at none the level is lost. The seed's light also fades with time: the limit is
  2.3 times par (2.5 for a boss), shown as a bar under the clock. A lost level starts again from the top (`Play._fail`, `UI.showFail`). With assist: five
  lights, no limit. Winning: reach the lowest valley with a light left, in time; five levels then the boss opens the next country. The rules are written
  out under "How to play". The levels test fails if the scripted player loses three lights or comes near the limit.
- Special powers (owner: "like a 'turbo' move"): sparks, Eta's gift. One at the start of a level, one more for every five seeds, three at most.
  A spark is a turbo when asked for (E, C, L or Ctrl; the star button on touch; Y on a pad): `turbo(b)` in physics.js adds 11 units a second along the
  ground, counted as work, with a test. While it burns, seeds nearby are drawn in. Or a spark is a rescue: fall with one in hand and Eta makes the catch,
  the spark is spent and no light is lost.
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

- Patagonia, the sixth world (`js/art/worlds/patagonia.js`, levels `PAT` in `worlds.js`, track `patagonia`): granite spires (ridge style `torres`), the ice field,
  a turquoise lake with bergs, red lenga woods, gold pampa, guanacos (`P.guanaco`), flag trees, a condor. Lessons: the chain rule (backpropagation), exploding
  and vanishing gradients, clipping, skip connections. Mechanics: blue-ice chutes that multiply speed, deep powder snow that limits it (a new surface, `powder`,
  with drag that grows with the square of the speed, so it is a true limit and not a fixed toll), winds at the back and in the face, glacier lakes with bergs
  afloat, and cuts bridged by two snow cornices with a jump between them.
- Mu's lift (owner request "add a mid-air hop"): from Cappadocia on, jump again in the air and Mu lifts Theta once between one footing and the next
  (`HOP_V`, `HOP_J` in `physics.js`; `b.hops`). It is a push of limited size, so it checks a fast fall and does not cancel it. It refreshes on any footing and in
  water, which means a high tide can be left without the raft; that still needs the wait for the tide, so the lesson stands.
- More than one thing to find, and more than one goal (owner request): besides seeds there are dewdrops (relight a light, or become a spark), Mu's feathers
  (give the lift back in mid-air; over gaps 5.75 wide or more, and as a stair to a high stamp) and one stamp hidden in every level. `level.js` places them
  (`items`; a level may place its own with a stroke's `items` option and `items: 'own'`). Stamp places by level number: in plain sight, a high crest,
  behind the start, a feather stair, over a gap, a high crest near the end. Each country's theme names six stamps (`stamps`), drawn from its own sprites
  (`js/art/stamps.js`). The album is on the title menu. The finish card shows four goals: the valley, the stamp, every seed, no light lost.
  `tests/items.test.mjs` proves every stamp can be reached with what the hero can do in that country.
- A tutorial (owner request): "The Practice Slope" (`TUTORIAL` in `worlds.js`, id `T`), eight lessons shown one at a time where the ground asks for them
  (run, jump, leap, slide, turbo, lights, stamps, the valley). Offered once before the first level and always on the title menu. Nothing can be lost on it.
  A check proves its three gaps ask for exactly a tap, a held jump and a turbo.

- Yakushima, the seventh and last world (`js/art/worlds/yakushima.js`, levels `YAK`, track `yakushima`): the old cedars (`P.cedar`), far cedars (`P.sugi`),
  hollow stumps, moss, toadstools, Yaku deer (`P.deer`) and grey Yaku macaques, brooks, rain. Lessons: generalising, overfitting, the validation set, early
  stopping, weight decay and dropout. Mechanics: brooks crossed on boulders (in flood the water comes over them), gullies bridged by a fallen cedar, a verse of
  path sung three times and then changed (the seeds still lie where they lay), and a shelf where the light is with deeper ground beyond it where nothing is
  (the first `bowl` in a level is its goal, so strokes may follow it). The boss, The Memorizer, is an old macaque who waits at the same place in every verse.
- The ending (`Play._ending`, `ENDING` in `worlds.js`, `showEnding` in `ui.js`; `?ending` to see it): Theta sets the seed down in a mossy hollow, it takes root
  and grows, the picture draws back, and the last chapter is told beneath it. It follows level 7-B, and leads to the credits.

- The extras (owner: "Build all extras you can"), all reached from "More" on the title menu unless said otherwise:
  - Today's valley (`todayId`, `made` and `generated` in `worlds.js`): one generated valley a day, the same for everyone (the day is counted in universal time), in a
    country that changes daily, with a line of text to copy and send. Three weeks of them are run by the scripted player in the checks.
  - The long descent: one long generated hill (3,400 units) that grows harder; three lights, no time limit, dewdrops now and then; the score is the distance.
    Opens when the journey is finished (or with `?unlock` / `?class`).
  - Sort! (`showSort`): seeds to the left, stones to the right, under a minute, then a scorecard with precision and recall. One is offered after each country's
    last level, once; from the second on, colour sometimes lies and shape tells.
  - The lab (`showLab`, `js/data/lab.js`): seven hills in one dimension, sliders for the learning rate, momentum, noise and a limit on the slope, and Theta
    descending by the real rule while the loss curve draws itself. Six ready-made settings repeat what went wrong at the end of a country and say the one thing
    to change. `tests/lab.test.mjs` proves the rule and every caption. Opens after the ending.
  - For teachers (`showTeachers`, `?teachers`): every level, its idea, and a question for the class (`ASK`, `BOSS` in `notebook.js`), with links that open any
    level with everything unlocked and nothing saved (`?class`; `save.js` neither reads nor writes with it).
  - Wardrobe (`showWardrobe`): six colours, seven hats and three trails, earned with seeds and stamps. `COL` and `WEAR` in `theta.js`.
  - Keys (Settings, "Choose keys") and a real high-contrast mode (Settings, "Colours"): no tint, mist pushed back, a bright line on everything that can be stood on.
- Story scenes: the meeting with Mu at the start of 2-1 (`Play.meet`, once), an arrival scene behind each country's chapter (`Play.trav`: balloon, bird or a
  current of air, landing in that country's title scene), the old macaque following Theta to the end of 7-B, and the ending grown into a tree with one or two
  animals from each country gathered round it, the credits rolling over the scene, and the lab offered afterwards.
- The story is kept true to the lesson (build prompt: "The lowest valley is the best place, and the way to it is found one step at a time"): Yakushima's light
  is in the lowest hollow that can hold a root, and what lies past it is a crack in the rock, not a valley.
- Picture quality (owner: "very high quality - 4K if possible"): an Ultra setting paints up to 3840x2160; sprites are painted more finely as the setting rises
  (`Q` in `paint.js`); the far country is painted at full size on Full and Ultra; far peaks and dunes have shaded faces and lit spurs (`SPUR` in `scene.js`)
  and every far ridge has brush texture. Auto picks Ultra on a 4K screen and steps down if frames drop.

## Not built yet

- A hidden level, hats that react to weather, and other small surprises from the build prompt's list.
- A play-through by hand for feel, and a frame-rate check on real hardware: every number here comes from a scripted player and a software renderer.
- Cappadocia's last level still has no mechanic of its own. Poplars and oryx could be drawn better. Iceland wants a great geyser behind its boss level.
- The in-level hints name the usual keys even after the keys have been changed.

## Checks to run

    node --test tests/*.test.mjs        # physics and levels
    node scripts/bot.mjs -v             # times for every level
    python3 scripts/shot.py out.png "index.html?level=1-2&x=70&run&wx=0.97" 1600 900 4000

URL switches for looking at things: `?level=1-3`, `&x=120`, `&time=dusk`, `&run` or `&run=tuck`, `&wx=0..1` (fix the weather front; 1 is foul), `&gfx=0|1|2`, `?unlock`.
