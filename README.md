# Farm Fighter

A barnyard fighting game: two players on one keyboard, or play alone against the CPU.
Open `index.html` in a browser to play, or run `python tools/serve.py` and go to
http://localhost:5173 (that server makes sure edited files show up on refresh).

## Folder layout

```
index.html                 the page; loads every CSS and JS file below, in order
css/
  base.css                 colors, fonts, page frame, buttons
  select.css               fighter select + arena picker
  game.css                 arena, overlays, controls, move list
  mapmaker.css             map maker screen (switched off, not loaded)
js/
  core/
    config.js              game settings: sizes, gravity, round time, KEYBOARD CONTROLS
    registry.js            the fighter/map lists, addFighter(), addMap(), move slot names
    state.js               everything that changes while playing
  engine/
    sprites.js             loads each fighter's frames (one picture per frame)
    fighter.js             a fighter: movement, platforms, inputs → moves, animation
    fighter-builtin.js     the shape-drawn look used when a sprite sheet is missing
    combat.js              hits, blocking, combos, projectiles, popup text
    particles.js           hit sparks
    arena.js               draws a map (background picture, floor, voids, platforms)
    hud.js                 health bars, meters, timer, combo text, announcements
    ai.js                  the CPU opponent and its difficulty levels
    match.js               rounds, per-frame update/draw, the main loop
  ui/
    dom.js                 page element references
    select-screen.js       fighter cards, P1/P2 picking
    map-select.js          arena picker
    move-list.js           the move list under the arena
    screens.js             switching screens
    input.js               keyboard handling
    fullscreen.js          fullscreen buttons
    mapmaker.js            the map maker (switched off, not loaded)
  main.js                  starts everything
data/
  fighters/                one file per fighter: stats, colors, moves, combos (see its README)
  maps/                    one file per built-in arena
assets/
  characters/<animal>/     one folder per animation, one picture per frame (idle/1.png ...)
  maps/                    one background picture per arena (1280 × 720), e.g. red-barn.png
  templates/frames/        a drawing guide for every frame
tools/
  make_sprites.py          drawing guides, splits old sheets into frames, placeholder frames
  make-backgrounds.html    redraws each arena's built-in look as a picture to save and paint over
  serve.py                 runs the game at http://localhost:5173 without stale browser copies
```

## Common jobs

| I want to… | Go to |
| --- | --- |
| Change a fighter's moves or combos | `data/fighters/<id>.js` (every setting is explained in `data/fighters/README.md`) |
| Redraw a fighter | one frame at a time in `assets/characters/<animal>/` (see `assets/README.md`) |
| Add a fighter | copy a file in `data/fighters/`, add a `<script>` line in `index.html`, run `python tools/make_sprites.py` |
| Repaint an arena | edit its picture in `assets/maps/` (1280 × 720) and refresh |
| Move platforms or voids | the `platforms` / `voids` lists in `data/maps/<id>.js` |
| Make an arena | copy a file in `data/maps/`, give it a new `id` and picture, add a `<script>` line in `index.html` |
| Change keys, gravity, round time, max health, arena size | `js/core/config.js` |
| Change how combos feel (hit freeze, combo timing, mash lockout, rest between attacks) | the "combat feel" section of `js/core/config.js` |
| Redraw a projectile | `assets/characters/<animal>/projectiles/<move>.png` |
| Make the CPU easier or harder | `CPU_LEVELS` at the top of `js/engine/ai.js` |

## Controls

| | Player 1 | Player 2 |
| --- | --- | --- |
| Move | A / D | ← / → |
| Jump | W | ↑ |
| Block (hold) | S | ↓ |
| Punch / Kick | F / G | K / L |
| Special | H | J |
| Pause | P or Esc | |

**Playing alone?** On the select screen set *Player 2 is* to CPU (Easy, Normal or
Hard). The CPU uses each fighter's own moves, specials and named combos.

**Mind the voids.** Some arenas have gaps in the floor (or open edges). Fall in
and you lose the round. Jump over them, or knock your opponent in.

**Same animal on both sides?** Every fighter has a **P1** / **P2** (or **CPU**)
tag over their head and a ring under their feet in the player's color.

**Don't mash.** Press the next attack after you see your hit land (the game
freezes for a split second). Pressing too early locks your attacks for a moment,
and so does pressing more than once during the freeze. Only punches and kicks
can follow themselves in a combo, and you get one dropkick per jump. Missed
attacks leave you open, and so do blocked ones.

Specials change with what you hold: SPECIAL alone, or with ↑ / ↓ / toward /
away / PUNCH / KICK — six more specials per fighter. The full list for both
fighters is shown under the arena during a match.
