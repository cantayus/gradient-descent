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
- Do not push or publish to GitHub until he says so. Commit messages end with the two trailer lines given in the session.
- Real people are described in the third person, with nothing invented put in their mouths. Only places listed in the brief are used.

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
a pom tail, teal feet, a plain smile, and a warm light low on the belly where the seed is kept (a pouch drawn there read as a second mouth and was removed at the owner's word; the band was plum and he asked for a calmer colour). Eta (a firefly) is the learning rate; Mu (a small bird, from the second world) is momentum.
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
- **The Geyser** only costs time. Pressure rises on landings harder than 8 units a second on `drum` ground, leaks at 0.1 a second, and after an eruption
  the crust is spent for 7 seconds. The eruption is an ordinary jet with `grip` (sideways drag) so the hero is held in the column.
- **Panels** are dark glass over the live, blurred scene; thin tracked capitals for headings; gold only for the thing to press.

- **Far things** are entries in a ridge's `stamps` (see `Scene._stamp` for the kinds: fall, steam, geyser, smoke, graze, flock, beam, erupt) and in a
  lake's `things`. A stamp with `drop: [a, b]` stands on the face of the hill, that fraction of the ridge's height below its skyline. Sprites face right.
- **Page veils.** The three `<i>` in `#grade` blend with the canvas (soft-light tint, overlay grain, vignette). Their holder is `display: contents` on
  purpose: a positioned holder would be a layer of its own and the blends would have nothing under them.
