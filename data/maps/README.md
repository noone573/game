# Arenas

One file per arena. Each calls `addMap({ ... })`; anything left out uses
`DEFAULT_MAP` in `js/core/registry.js`.

The arena is **1280 × 720** (`WIDTH` / `HEIGHT` in `js/core/config.js`) and
fighters stand on the floor at **y = 590** (`FLOOR`).

## The settings that matter

| Setting | What it does |
| --- | --- |
| `background` | The picture drawn behind everything, e.g. `"assets/maps/red-barn.png"`. Paint it at 1280 × 720. |
| `floorGrid` | `false` when the picture already shows the floor (the built-in maps). `true` draws a floor over the picture. |
| `voids` | Gaps in the floor: `{ x, width }`. Fall in and you lose the round. A void at `x: 0` or ending at 1280 is an open edge. |
| `platforms` | Ledges to stand on: `{ x, y, width }`. `y` is the top edge; a jump reaches about 120 above where you stand. |

The other settings (`scenery`, `skyTop`, `barnColor`, …) only draw the
built-in look, used when the picture is missing.

## Repainting an arena

1. Open its picture in `assets/maps/`, paint, save over it, refresh the game.
2. Keep the floor line at y = 590, and keep the voids where `voids` says
   they are. If you move a void in the picture, change `voids` to match.

Want a fresh copy of the built-in look (say, after changing colors or voids)?
Run the game's server and open `/tools/make-backgrounds.html`; it draws every
arena so you can save the picture again.

## A new arena

Copy one of these files, give it a new `id`, `name` and `background`, and add
a `<script src="data/maps/<file>.js" defer></script>` line in `index.html`
under `<!-- Maps -->`.
