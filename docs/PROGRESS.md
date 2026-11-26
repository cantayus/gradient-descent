# Gradient Descent: where the build stands

Last updated 26 November 2026.

## What the owner asked for (in order received)

A fast, fun, educational browser platformer about gradient descent. Cute, Japanese-anime-like, with the mood of Ori (mood only; everything original).
Seven worlds from nature: Cappadocia, Iceland, Galápagos, Namib, Zhangjiajie, Patagonia, New Zealand (no others; see the changes of 26 November below). A lovable hero with a face, a body
that changes shape in action, and funny wordless sounds on every action. Original music. No physical errors. Addictive in the honest sense (ghosts,
medals, routes, daily valley, endless mode; nothing that nags or locks). About an hour and a half for a first play-through. Very high visual detail,
"competitive in visual appearance". Dynamic weather in every scene and screen. A title screen in the manner of Assassin's Creed Origins (a wide living
landscape, the name in thin widely spaced capitals, "press any key", then a plain text menu). An opening that convinces a player at once that the
game is of high quality. Published on GitHub Pages at the owner's word (see "Where it lives").

## The changes of 26 November (the owner's seven requests, and how each was read)

1. **"Make The Lab accessible from the start."** The lab has no lock.
2. **"Include The Lab as a separate tab on the title screen. [not under More]"** "The lab" is its own entry on the title menu, between Notebook and More, and its tile is gone from More.
3. **"Unlock access to all options in the More menu only after the first level is completed. [not after the game has been completed.]"** Every tile in More
   (Today's valley, Sort!, The long descent, The hidden valley, Wardrobe, For teachers) opens when level 1-1 is finished, and every one is locked until then.
   The teachers' page is still reached at any time by its address, `?teachers`.
4. **"Allow navigation to the main menu (title screen) with a single button press."** T or Home from anywhere (`UI.home`), a house button beside the pause
   button in a level, Back (Select) on a pad, and a Title button on every sheet and card that did not already lead straight there.
5. **"Keep Iceland, but make Cappadocia the first level."** Read as: the first country is Cappadocia and Iceland follows it. The lessons keep their order
   (loss, gradient, learning rate first; then momentum and local minima), so the two countries exchanged their ground and not their place in the teaching:
   Cappadocia now teaches the first five lessons, Iceland the second five. See the table.
6. **"Set the final level in New Zealand."** Read as: the last country is set in New Zealand (Fiordland). It takes the place of Yakushima, whose lessons,
   level designs and boss it keeps. Yakushima is no longer in the game; its picture file is in the repository's history (`dist/js/art/worlds/yakushima.js`).
7. **"Make the falling effect cuter and more realistic."** Three things: the ground no longer bumps a walker up at the lip of a gap (it was the curve
   through the samples overshooting; `CLIFF` in `physics.js`); a long fall is flailed through (`flail` in `theta.js`); and a fall into a gap is seen to its
   end, after which Eta hauls Theta back to the last safe ground on a thread of the seed's light, Theta swinging on it like a weight on a string
   (`Play._rescue`).
8. **"Add a more deep story about the name of the game and the story of the hero Theta at the beginning of the game."** (asked the same night.) Two pages now
   come before the first chapter (`name` and `theta` in `js/data/story.js`, shown by the first entry of the title menu until they have been read, and always
   listed under "The story"). The first says what the two words mean (gradient from the Latin for stepping; descent, going down), where the method comes from
   (Cauchy's three-page note to the Académie des Sciences, October 1847, wanted for the orbits of planets and comets), how it goes, and that machines learn by
   it; its picture is the method drawn by doing it. The second says who Theta is: named for θ, the letter for everything a learning machine can change about
   itself; begun somewhere high by chance; unable to see far; often wrong and corrected by the next step; and with two friends named for η and μ. Its picture is
   Theta beside the letter. The first chapter, "The seed", gained two lines that join it to them.

## The seven worlds, in order

| World | Landscape | What it teaches | Things to see |
|---|---|---|---|
| 1. Cappadocia | Fairy chimneys, soft rock valleys, cave houses, vineyards | Loss, gradient, learning rate, overshoot | Balloons at sunrise and a balloon ride up a wall, the red river to ford, chimney caps to hop, snow in one level, pigeons |
| 2. Iceland | Black sand, lava, moss, basalt, ice | Momentum, local minimum, where you start | Craters, geysers that lift the hero out of the deepest ones, puffins, northern lights in the last level |
| 3. Galápagos | Volcanic islands, lava fields, clear shallows | Stochastic gradient descent | Giant tortoises, marine iguanas, blue-footed boobies, sea lions. Surf and tide move the ground |
| 4. Namib | High red dunes, white clay pans | Plateaus, learning-rate schedules | Long flats, oryx, dead camel-thorn trees, sand on the wind |
| 5. Zhangjiajie | Sandstone pillars standing in mist | Ravines and adaptive steps | Deep narrow gorges, vines, macaques |
| 6. Patagonia | Granite towers, glaciers, hard wind | Exploding and vanishing gradients, clipping | Condors, guanacos, turquoise lakes, an ice field |
| 7. New Zealand | The rain forest of Fiordland: beech, moss, tree ferns | Overfitting, early stopping | Takahē, kea, kiwi after dark, glowworms, a fiord and its waterfalls. The finale |

Mu, who stands for momentum, joins in Cappadocia, at the start of its third level (a small scene of its own, `Play.meet`), and the lift in the air is there from
then on. Rolling is there from the first level: it is the fast way down any slope, and Cappadocia has no ice to slide on. (The belly slide still exists in the
physics for a hero who cannot roll; nothing in the game now uses it.)
The names are the Greek letters of the equations: θ the parameters, η the learning rate, μ momentum. The notebook explains this once.
The lab (a sandbox: pick a landscape, set learning rate, momentum and noise with sliders, press go) is on the title menu from the start.

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
- Iceland, now the second country (`ICE` in `js/data/worlds.js`): the ground that was first laid out for Cappadocia (hollows, rims, deep ground that stops a roll), painted as
  craters in moss, lava and warm ochre earth, with black sand for the deep ground, blue ice on some of the long runs, and geysers where balloons used to be:
  in "Where You Start" a geyser is the only way out of the deepest crater (`geyser(wall)`). Its last level, "The Craters", is by night under the aurora.
  All finished by the scripted player (`scripts/bot.mjs`, `tests/levels.test.mjs`).
- Cappadocia (`js/art/worlds/cappadocia.js`, six hours: dawn, day, golden, dusk, night, winter): fairy chimneys with rooms and lamps, poplars, apricot
  trees, vineyards, the red river, Mount Erciyes, a tableland in beds of colour, balloons in the sky (`theme.sky`), strata of ash in every cut bank.
  Now the first country (`CAP` in worlds.js): the ground that was first laid out for Iceland, painted in tuff, rose and honey rock, vineyards and dark cap rock.
  Ice slides became long chutes of bare tuff to roll down; rows of basalt became the caps of fairy chimneys; hot pools became fords of the red river on slabs
  of cap rock; geysers under a wall became a balloon (`js/game/ride.js`, stroke option `ride: { at, to, up, quick }`); the misty level became a winter one; and
  the boss, "The Dovecotes", is the Geyser's mechanism in other clothes (`boss: 'doves'`, `Geyser` in `js/game/boss.js`): thin roofs over pigeon lofts, heads at the
  pigeonholes as the birds grow frightened, and the whole flock coming up under a hero who lands too hard. Deep dust (`surf: 'dust'`) slows whatever
  comes through it fast, as powder snow does. Mu the bird (`Mu` in play.js) joins at the third level. Music in nine-eight after the makam Hüseyni.
  Every level ends in a cliff past the goal, and the goal is the lowest point of the first bowl.
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
  the seed has three lights; a fall into a gap puts one out, and so do the pigeons of the Dovecotes (as the Geyser did); at none the level is lost. The seed's light also fades with time: the limit is
  2.3 times par (2.5 for a boss), shown as a bar under the clock. A lost level starts again from the top (`Play._fail`, `UI.showFail`). With assist: five
  lights, no limit. Winning: reach the lowest valley with a light left, in time; five levels then the boss opens the next country. The rules are written
  out under "How to play". The levels test fails if the scripted player loses three lights or comes near the limit.
- Special powers (owner: "like a 'turbo' move"): sparks, Eta's gift. One at the start of a level, one more for every five seeds, three at most.
  A spark is a turbo when asked for (E, C, L or Ctrl; the star button on touch; Y on a pad): `turbo(b)` in physics.js adds 11 units a second along the
  ground, counted as work, with a test. While it burns, seeds nearby are drawn in. Or a spark is a rescue: fall with one in hand and Eta makes the catch,
  the spark is spent and no light is lost. Either way the catch is now shown (`Play._rescue`): see the changes of 26 November.
- The story (`js/data/story.js`, owner: "there should be a story about why the hero travels to these locations"). A seed of light will grow only in the
  lowest valley in the world, and nobody knows where that is. Each country is somebody's answer, fails for the reason that country teaches, and whoever
  lives there knows where to try next: Cappadocia (the whole country stands on a high plateau; the pigeons point north) → Iceland (every crater looks the
  lowest from inside, and the ground is too new, still boiling; a puffin knows where high ground ends) → Galápagos (the edge of the sea, but the tide takes
  it back) → Namib (where a river stops: flat and dry) → Zhangjiajie (deep ravines, no sky) → Patagonia (ice-cut valleys, too violent; an albatross rides
  that wind round the world) → New Zealand (the old forest: the seed takes root where things that rooted long ago still grow). A chapter is shown before the first level of each country
  (`showTale`), and all read chapters are under "The story" on the title. Chapters for countries not yet built are already written.
- `js/art/worlds/kit.js`: the stock sprites every theme shares (`stock(time, tag, palette)`), `tones`, `lamps`. New themes should start from it.
- Fairy chimneys were redrawn from the real ones at the owner's request (`P.chimney`, `P.badland`; `dist/dev/chimneys.html` lays them out to inspect).
- Screens (`js/ui/ui.js`, `css/app.css`): cinematic title with "press any key", text menu with keyboard movement, level list, pause, finish card with
  the run as a loss curve and medals, notebook with five pages, how to play, settings (volumes, picture, motion, text size, assist, contrast),
  "Also play this!", credits. Level name card at the start of each level, with a wide opening look before the first step.
- The opening scene (`Play._intro`, level 1-1, once; `?level=1-1&intro` to see it again): Theta asleep among the chimneys at dawn, a seed of light falls, the waking, the finding, Eta rising.
- Smooth movement: the body is drawn between physics steps (`b.mix`, `Play.view`), camera eased by time, turning through the front view. `python3 scripts/smooth.py` measures it.
- Sound (`js/core/audio.js`): music for title, Iceland, boss and card, written as notes; effects; Theta's wordless voice; rain and wind.
- Saves (`js/core/save.js`): best times, medals, ghosts, notebook pages, settings.

- Patagonia, the sixth world (`js/art/worlds/patagonia.js`, levels `PAT` in `worlds.js`, track `patagonia`): granite spires (ridge style `torres`), the ice field,
  a turquoise lake with bergs, red lenga woods, gold pampa, guanacos (`P.guanaco`), flag trees, a condor. Lessons: the chain rule (backpropagation), exploding
  and vanishing gradients, clipping, skip connections. Mechanics: blue-ice chutes that multiply speed, deep powder snow that limits it (a new surface, `powder`,
  with drag that grows with the square of the speed, so it is a true limit and not a fixed toll), winds at the back and in the face, glacier lakes with bergs
  afloat, and cuts bridged by two snow cornices with a jump between them.
- Mu's lift (owner request "add a mid-air hop"): from the third level of Cappadocia on, jump again in the air and Mu lifts Theta once between one footing and the next
  (`HOP_V`, `HOP_J` in `physics.js`; `b.hops`). It is a push of limited size, so it checks a fast fall and does not cancel it. It refreshes on any footing and in
  water, which means a high tide can be left without the raft; that still needs the wait for the tide, so the lesson stands.
- More than one thing to find, and more than one goal (owner request): besides seeds there are dewdrops (relight a light, or become a spark), Mu's feathers
  (give the lift back in mid-air; over gaps 5.75 wide or more, and as a stair to a high stamp) and one stamp hidden in every level. `level.js` places them
  (`items`; a level may place its own with a stroke's `items` option and `items: 'own'`). Stamp places by level number: in plain sight, a high crest,
  behind the start, a feather stair, over a gap, a high crest near the end. Each country's theme names six stamps (`stamps`), drawn from its own sprites
  (`js/art/stamps.js`). The album is on the title menu. The finish card shows four goals: the valley, the stamp, every seed, no light lost.
  `tests/items.test.mjs` proves every stamp can be reached with what the hero can do in that country.
- A tutorial (owner request): "The Practice Slope" (`TUTORIAL` in `worlds.js`, id `T`), eight lessons shown one at a time where the ground asks for them
  (run, jump, leap, roll, turbo, lights, stamps, the valley). It is in Cappadocia, as everything that comes first now is. Offered once before the first level and always on the title menu. Nothing can be lost on it.
  A check proves its three gaps ask for exactly a tap, a held jump and a turbo.

- New Zealand, the seventh and last world (`js/art/worlds/newzealand.js`, levels `NZL`, track `newzealand`): Fiordland. Great mossy trees (`P.giant`), tree ferns
  (`P.ponga`), a far canopy of beech (`P.beech`), flax, rātā in flower, hollow stumps, sky-blue mushrooms, fern fronds still rolled up, takahē and kea beside the
  path, kiwi after dark only (`kiwiNight`), glowworms on wet banks at night, and behind it all a fiord with snow on its walls and waterfalls down them. Brooks, rain.
  It was Yakushima until 26 November; the levels are the same ones. Lessons: generalising, overfitting, the validation set, early
  stopping, weight decay and dropout. Mechanics: brooks crossed on boulders (in flood the water comes over them), gullies bridged by a fallen tree, a verse of
  path sung three times and then changed (the seeds still lie where they lay), and a shelf where the light is with deeper ground beyond it where nothing is
  (the first `bowl` in a level is its goal, so strokes may follow it). The boss, The Memorizer, is an old kākāpō (a parrot that walks and does not fly, and may live ninety years) who waits at the same place in every verse.
- The ending (`Play._ending`, `ENDING` in `worlds.js`, `showEnding` in `ui.js`; `?ending` to see it): Theta sets the seed down in a mossy hollow, it takes root
  and grows, the picture draws back, and the last chapter is told beneath it. It follows level 7-B, and leads to the credits.

- The extras (owner: "Build all extras you can"), all reached from "More" on the title menu unless said otherwise, and all open once level 1-1 is finished:
  - Today's valley (`todayId`, `made` and `generated` in `worlds.js`): one generated valley a day, the same for everyone (the day is counted in universal time), in a
    country that changes daily, with a line of text to copy and send. Three weeks of them are run by the scripted player in the checks.
  - The long descent: one long generated hill (3,400 units) that grows harder; three lights, no time limit, dewdrops now and then; the score is the distance.
    (`?unlock` and `?class` open everything.)
  - Sort! (`showSort`): seeds to the left, stones to the right, under a minute, then a scorecard with precision and recall. One is offered after each country's
    last level, once; from the second on, colour sometimes lies and shape tells.
  - The lab (`showLab`, `js/data/lab.js`): seven hills in one dimension, sliders for the learning rate, momentum, noise and a limit on the slope, and Theta
    descending by the real rule while the loss curve draws itself. Six ready-made settings repeat what went wrong at the end of a country and say the one thing
    to change. `tests/lab.test.mjs` proves the rule and every caption. On the title menu, open from the start.
  - For teachers (`showTeachers`, `?teachers`): every level, its idea, and a question for the class (`ASK`, `BOSS` in `notebook.js`), with links that open any
    level with everything unlocked and nothing saved (`?class`; `save.js` neither reads nor writes with it).
  - Wardrobe (`showWardrobe`): six colours, seven hats and three trails, earned with seeds and stamps. `COL` and `WEAR` in `theta.js`.
  - Keys (Settings, "Choose keys") and a real high-contrast mode (Settings, "Colours"): no tint, mist pushed back, a bright line on everything that can be stood on.
- Story scenes: the meeting with Mu at the start of 2-1 (`Play.meet`, once), an arrival scene behind each country's chapter (`Play.trav`: balloon, bird or a
  current of air, landing in that country's title scene), the old kākāpō following Theta to the end of 7-B, and the ending grown into a tree with one or two
  animals from each country gathered round it, the credits rolling over the scene, and the lab offered afterwards.
- The story is kept true to the lesson (build prompt: "The lowest valley is the best place, and the way to it is found one step at a time"): the light
  is in the lowest hollow that can hold a root, and what lies past it is a crack in the rock, not a valley.
- Picture quality (owner: "very high quality - 4K if possible"): an Ultra setting paints up to 3840x2160; sprites are painted more finely as the setting rises
  (`Q` in `paint.js`); the far country is painted at full size on Full and Ultra; far peaks and dunes have shaded faces and lit spurs (`SPUR` in `scene.js`)
  and every far ridge has brush texture. Auto picks Ultra on a 4K screen and steps down if frames drop.

## Where it lives

- Repository: https://github.com/cantayus/gradient-descent (public). The game is played at https://cantayus.github.io/gradient-descent/.
- `.github/workflows/deploy-pages.yml` publishes `dist/` to GitHub Pages on every push to `main` that touches `dist/`. Pages is set to Source: GitHub Actions.
- First measured on a real machine through the live page (Ultra setting, canvas 1682x1424): 53 to 60 frames a second on the title, in the last country (then Yakushima) and in Patagonia.
  The page was in a background pane when measured, so treat the figure as a first reading.

## Not built yet

- Hats that react to weather, and other small surprises from the build prompt's list. (The hidden valley is built: `HIDDEN` in `worlds.js`, id `H`.)
- A play-through by hand for feel, and a frame-rate check on real hardware: every number here comes from a scripted player and a software renderer.
- Poplars and oryx could be drawn better. The Geyser as a level is gone from Iceland with the exchange of ground; its mechanism is the Dovecotes'.
- New Zealand has not been seen by its owner yet: the birds, the tree ferns and the far fiord are a first drawing.

## Checks to run

    node --test tests/*.test.mjs        # physics, levels, things to find, the lab, the countries (130 checks)
    node scripts/bot.mjs -v             # times for every level
    python3 scripts/shot.py out.png "index.html?level=1-2&x=70&run&wx=0.97" 1600 900 4000

URL switches for looking at things: `?level=1-3`, `&x=120`, `&time=dusk`, `&run` or `&run=tuck`, `&wx=0..1` (fix the weather front; 1 is foul), `&gfx=0|1|2`, `?unlock`.
