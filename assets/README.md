# Art assets

```
assets/
├── characters/
│   ├── chicken/
│   │   ├── idle/1.png  idle/2.png  idle/3.png  idle/4.png
│   │   ├── walk/1.png … walk/6.png
│   │   ├── punch/1.png  punch/2.png  punch/3.png
│   │   ├── …one folder per animation (18 in total)…
│   │   ├── projectiles/special.png  projectiles/specialUp.png …  ← what each special throws
│   │   └── original-sheet.png   ← your old one-picture sheet, kept as a backup
│   ├── cow/   dog/   pig/       (same layout)
├── templates/
│   ├── frames/<animation>/<n>.png   ← a drawing guide for every single frame
│   └── blank-frame.png              ← an empty guide (feet line + body box)
└── maps/
    ├── red-barn.png  hayloft.png  moonlit-pasture.png  ← each arena's background (1280 × 720)
    └── map-template.png             ← a guide for painting a new one
```

Every frame is its **own picture**, so you can redraw one pose at a time.
Each fighter file points at its folder, e.g. `data/fighters/chicken.js` has
`sprites: "assets/characters/chicken"`.

## Editing a frame

1. Open the frame you want, e.g. `characters/pig/punch/2.png`.
   For a guide, open `templates/frames/punch/2.png` as a layer underneath.
2. Draw. Keep the background transparent.
3. Save over the same file and refresh the game.

## The rules for a frame

| Rule | Why |
| --- | --- |
| **Square** picture (64, 128, 256 … any size) | The game scales it to fit. All frames of one fighter should be the same size. |
| Character **faces right** | The game flips it for the player on the right. |
| **Feet on the "feet" line** (15/16 of the way down) | Otherwise the fighter floats or sinks. |
| Body roughly inside the **pink dashed box** of the guide | That's the area that gets hit. |
| Transparent background | Anything else shows up in the arena. |

Too small or too big in the arena? Add `spriteScale: 1.2` (or 0.8…) to the
fighter's file instead of redrawing everything.

## The animations

Frame 2 of every attack (marked **HIT!** in the guides) is shown while the attack can hit.

| Folder | Frames | When it plays |
| --- | --- | --- |
| `idle` | 4 | Standing still, loops |
| `walk` | 6 | Moving, loops |
| `jump` | 3 | Going up, top of the jump, falling |
| `punch` | 3 | Wind-up, hit, pull back |
| `kick` | 3 | Wind-up, hit, pull back |
| `block` | 2 | Guard up, absorbing a hit |
| `hurt` | 2 | Getting hit |
| `ko` | 3 | Stagger, falling, lying on the floor |
| `uppercut` | 3 | Crouch, rising hit, coming down |
| `dropkick` | 3 | Leap, feet out, landing |
| `disrupt` | 3 | Pull back, shove, recover |
| `special` | 3 | Charge, release (the game draws the projectile), recover |
| `specialUp` | 3 | Special + up |
| `specialDown` | 3 | Special + down |
| `specialForward` | 3 | Special + toward the opponent |
| `specialBack` | 3 | Special + away from the opponent |
| `specialPunch` | 3 | Special + punch |
| `specialKick` | 3 | Special + kick |

Extra frames (like a `block/3.png`) are ignored unless you raise that
animation's `frames` number in `js/engine/sprites.js`. A missing animation
borrows a similar one (for example `specialKick` falls back to `kick`).

## Projectiles

Every move that fires a shot has a picture in `projectiles/`, named after the
move (`special.png`, `specialDown.png` …). Draw it facing **right**, with a
transparent background; the game flips it for shots going left.

- Round shots (eggs, mud balls…) look best square, e.g. 128 × 128.
- Ground shockwaves (moves with `bothWays: true`) look best wide and short,
  e.g. 192 × 64, with the front of the wave on the right.
- Add `spin: 12` to a move's `projectile` to make the picture spin in flight.

## The sprite tool

```bash
python tools/make_sprites.py
```

- Refreshes the drawing guides in `templates/frames/`.
- If a fighter folder contains a one-picture `sprites.png` sheet, it is cut
  into separate frames (it finds each drawing and lines its feet up) and kept
  as `original-sheet.png`. Frames that already exist are never overwritten.
- A brand-new fighter with no frames gets plain stick-figure frames in its colors.
- Missing projectile pictures get a placeholder (never overwrites yours).

## Arena backgrounds

Every arena's background is one picture in `maps/`, 1280 × 720:
`red-barn.png`, `hayloft.png`, `moonlit-pasture.png`. Paint over it, save,
refresh. The picture includes the floor and the voids (dark pits); the hay
bales and ledges are drawn by the game on top, from the map file.

For a new arena, start from `maps/map-template.png` (the blue line is the
floor at y = 590, the yellow dashed line is jump height, keep the top strip
simple for the health bars) and set `background: "assets/maps/<name>.png"` in
its map file. See `data/maps/README.md`.
