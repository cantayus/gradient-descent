# Gradient Descent: working notes

Read this before changing anything. `docs/PROGRESS.md` records what is built, what is not, and the choices made along the way.
The brief the game is built from is the doc "Gradient Descent: build prompt" (a Claude doc; never fetch its link from the web).

## What it is

A fast side-scrolling platform game for the browser that teaches gradient descent. Height stands for error; the hero, Theta, looks for the lowest valley.
Seven worlds of wild country, each teaching one or two ideas. A static site in `dist/`: no build step, no server, no network calls in play, no AI at any time.
Everything seen is drawn by the program and everything heard is made in the browser.

## House rules (from the owner)

- Fast and fun first; calm in mood; true in content. Nothing unsuitable for a child.
- Text is sparse and human: no slogans, no counts as boasts, nothing that reads as machine-written. Facts are checked.
- Credits: "Created by Cantay Caliskan", one modest sentence, his site. Nothing about how the code was written, no AI tools named, no jokes. His university and courses are never named in the game.
- The link to his other games is headed "Also play this!" and never uses the word "sister".
- The hero is always easy to see. No see-through shells round things. No timers that lock play, no streak penalties, no purchases.
- The repository is public and every push to `main` that touches `dist/` goes live on GitHub Pages: push only work he has asked for. Commit messages end with the two trailer lines given in the session.
- Real people are described in the third person, with nothing invented put in their mouths. Only places he has named are used: the seven in the brief, with New Zealand in Yakushima's place at his word (26 November).

## Run and test

- `node --test tests/*.test.mjs` runs the physics tests. They are the promise of "no physical errors": keep them passing.
- `python3 scripts/shot.py out.png "index.html?..." [w h wait]` takes a picture with headless Chromium (software rendering).
- `dist/dev/sheet.html` is the hero's design sheet; `docs/theta-design-sheet.png` is a saved copy.

## Layout

- `dist/js/game/physics.js`: the ground (a smooth height field, ledges, water, jets, wind) and the hero as a body. Pure logic, fixed step of 1/240 s.
  Modes: `run` (legs: drive and braking limited by grip), `slide` (belly: sliding friction of the surface), `ball` (a solid ball with spin; rolls without slipping when friction allows).
  `b.work` adds up every bit of energy put in by legs, jets, wind and water, so a test can check that energy never rises on its own.
- `dist/js/game/level.js`: a level is a list of strokes (`flat`, `slope`, `line`, `valley`, `hill`, `waves`, `kicker`, `steps`, `bowl`, `gap`) with options
  (`surf`, `water`, `plat`, `jets`, `wind`, `seeds`, `mark`, `zone`). `build(spec)` makes the ground and everything on it. The goal is the bottom of the `bowl`.
- `dist/js/game/theta.js`: the hero's drawing (`drawTheta(ctx, pose)`) and the rig that turns the body's motion into a pose with springs.

## The hero

Theta: rice-cake cream, gumdrop when standing and a ball when tucked, a teal band at eye level (the bar of θ; it shows the spin), gold eyes, round teal-tipped ears,
a pom tail, teal feet, a plain smile, and a warm light low on the belly where the seed is kept (a pouch drawn there read as a second mouth and was removed at the owner's word; the band was plum and he asked for a calmer colour). Eta (a firefly) is the learning rate; Mu (a small bird, who joins at the third level of the first country) is momentum.
The design is original and must stay clear of any known character.


## Weather, the title, the boss (added 25 November)

- **Weather is part of the physics.** `Weather` is a pure function of time, seeded by level id and hour, so every run of a level meets the same wind.
  `Play` sets `T.air = (t) => weather.windAt(t)` and physics takes air drag against that moving air. The scripted player and the level tests use the same
  weather. Wet ground does not change grip: each surface's friction is the one for the surface as drawn, and the showers here are light. If that is ever
  changed, the ground must also look different enough to read (the rule is honest ground).
- **A rainbow is opposite the sun.** It is drawn only at hours whose settings have `bow: true`, and those must be hours with no sun in the picture.
- **Mist and light shafts are drawn before the ground**, so that they lie over the far country and never over the cut earth or the hero.
- **The title** is a `Play` with `cine: true`: no input, a wide slow camera (`Play._cine`), the sun moved over the valley, the far country dropped a
  little (`scene.drop`). Its hour follows the player's clock. The first key press starts the sound (browsers allow none before it) and brings in the menu.
- **The Geyser** (now the Dovecotes of Cappadocia: the same code with `kind: 'doves'`, pigeons for water) costs a light when it goes off. Pressure rises on landings harder than 8 units a second on `drum` ground, leaks at 0.1 a second, and after an eruption
  the crust is spent for 7 seconds. The eruption is an ordinary jet with `grip` (sideways drag) so the hero is held in the column.
- **Panels** are dark glass over the live, blurred scene; thin tracked capitals for headings; gold only for the thing to press.

- **Far things** are entries in a ridge's `stamps` (see `Scene._stamp` for the kinds: fall, steam, geyser, smoke, graze, flock, beam, erupt) and in a
  lake's `things`. A stamp with `drop: [a, b]` stands on the face of the hill, that fraction of the ridge's height below its skyline. Sprites face right.
- **Page veils.** The three `<i>` in `#grade` blend with the canvas (soft-light tint, overlay grain, vignette). Their holder is `display: contents` on
  purpose: a positioned holder would be a layer of its own and the blends would have nothing under them.

## Notes added with worlds 6 and 7, the things to find, the tutorial and the ending

- The goal of a level is the lowest point of its FIRST `bowl` stroke. Strokes may follow it (Yakushima's shelf: the light is not at the lowest place).
  Nothing past the goal is given seeds, checkpoints or things to find.
- Things to find live in `level.items` (`stamp`, `dew`, `feather`). `build(spec, { mu })` places them; pass `mu` or the feather stairs are left out.
  A level places its own with a stroke's `items: [{ kind, at, up }]` and `items: 'own'` on the spec (the tutorial does). `items: false` for none.
- A feather is taken only by wings that need it, and a dewdrop only when a light is out or a spark is short. Do not change that: it is what makes them
  worth leaving for later.
- Mu's flyer is kept in `Play.muF`. Do not find it by its place in `flyers`; the ending adds a flyer after it.
- `powder` is the only surface with `plough` (drag with the square of the speed). No other ground slows a rolling ball by much: sand and snow do not.
  If a level needs the hero slowed, use powder or a rise, and check with `node scripts/bot.mjs -v`.
- Every zone a level names must have a skin in its country's `ground()`. A missing one used to crash the picture when it scrolled into view; the scene now
  falls back to the country's base zone, but the look will be wrong. `/tmp`-style check: build each level and compare `zones` with `Object.keys(skin)`.
- Hints wrap now, but keep them under about ninety characters.
- The tutorial (`TUTORIAL`, id `T`) is not in `WORLDS` or `ALL`; `levelById('T')` knows it. Its lessons are `TUTOR` in `notebook.js`, keyed by the
  `text` of marks of kind `tutor`. Finishing it is not recorded as a level.
- The ending is a `Play` with `cine` and `ending` set (`main.js` `ending()`); `attract()` will not reuse it for the title.

## Notes added on 26 November: the order of the countries, New Zealand, the fall, the menus

- **The order of the countries is not the order of the lessons' ground.** `CAP` (ids `1-x`) is Cappadocia and holds the level designs first made for Iceland;
  `ICE` (ids `2-x`) is Iceland and holds the ones first made for Cappadocia. Ids, lessons, notebook pages and class questions did not move, so a saved game
  still means what it meant. `tests/worlds.test.mjs` fixes the order of countries and lessons, and checks that every level has its page, question, hints,
  hour and ground.
- **Every world can roll and has Mu,** except levels `1-1`, `1-2` and the practice slope, which set `can: { mu: false }` (Mu arrives at `1-3`; the meeting is
  `Play.meet`, asked for by `ui.js` for that id). The scripted player is `cautious` in Cappadocia as it is among Zhangjiajie's pillars: it does not roll at a
  row of chimney caps.
- **The lip of a gap is level.** `Terrain.h` and `dh` no longer let a cliff in the next sample bend the piece before it (`CLIFF`, 1.5 units between samples:
  only a gap's wall is that steep; a geyser wall of 11 in 2.5 is 1.1). Before this every gap had a bump 0.18 high in its last quarter unit, which kicked a
  walker up and back, and carried careless ones over narrow gaps. If a `line` steeper than 6 in 1 is ever wanted, raise `CLIFF` or it will be treated as a lip.
- **A fall into a gap** (`Play._rescue`, `Play._eye`): the camera stops going down 2.2 units below the rim, so the hero drops out of the picture; `fell()` still
  fires 9 units down; then Eta catches Theta on a thread and flies a curve back to the checkpoint, Theta hanging as a damped pendulum from it (`rig.hang`,
  `rig.swing`). The clock, the ghost's record and the loss curve all stand still for it. With a spark it is quicker and no light is lost; with the last light
  gone there is no catch and the card comes up. Nothing in it touches the physics step, so the scripted player (which has its own, older way back) is unaffected.
- **Deep dust** (`surf: 'dust'`) has `plough`, like powder. The `dust` zone must always carry it: same look, same physics. Sand does not stop a ball.
- **New Zealand** (`js/art/worlds/newzealand.js`). Kiwi are painted at every hour (the stamp needs them) but stand beside the path only after dark, through the
  sprite names `kiwiNight`/`kiwiNightB`, which exist only then. `glow` (glowworms) is an empty sprite by day. The Memorizer's sprites are still called
  `elder`/`elderB`, because `Play` looks for those names; they are a kākāpō now. Facts used in the words were checked on 26 November: rain on about 182 days
  a year at Milford Sound; kākāpō flightless, nocturnal, long-lived, and inclined to freeze; royal albatrosses breeding in New Zealand, wintering off
  southern South America and going round the Southern Ocean downwind; Cappadocian dovecotes cut in the rock with painted doors.
- **One press to the title:** `UI.home()`. The T key is ignored if the player has given T to something in "Choose keys".
- **More** opens tile by tile on one condition, `doneLv('1-1')` (or `?unlock`/`?class`). The lab is not in it.
- **The title menu** has twelve entries once a level is finished; its type and spacing are sized by the window's height (`.titem`, end of `app.css`).
