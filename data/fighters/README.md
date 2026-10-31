# Fighters

One file per fighter. Each calls `addFighter({...})` and is loaded by a
`<script>` line in `index.html`.

To add a new fighter: copy one of these files, change `id` (lowercase, no
spaces) and the rest, add a `<script src="data/fighters/<id>.js" defer></script>`
line in `index.html`, and point `sprites` at a new `assets/characters/<animal>` folder
(run `python tools/make_sprites.py` to fill it with placeholder frames in the
fighter's colors).

## Buttons → moves

| Move slot | P1 | P2 |
| --- | --- | --- |
| `punch` | F | K |
| `kick` | G | L |
| `uppercut` | hold S + F | hold ↓ + K |
| `dropkick` | G in the air | L in the air |
| `disrupt` | toward opponent + G | toward opponent + L |
| `special` | H | J |
| `specialUp` | W + H | ↑ + J |
| `specialDown` | S + H | ↓ + J |
| `specialForward` | toward opponent + H | toward opponent + J |
| `specialBack` | away from opponent + H | away from opponent + J |
| `specialPunch` | H + F | J + K |
| `specialKick` | H + G | J + L |

For the special variants you can hold the first key and tap the second, or
press both together. A slot set to `null` is empty; an empty special variant
falls back to the plain `special`.

## What every number in a move means

All times are in seconds.

| Setting | What it does |
| --- | --- |
| `name` | Shown in the move list |
| `damage` | Health removed per hit |
| `startup` | Wind-up before the move can hit |
| `active` | How long the hitbox is out |
| `recovery` | Cool-down after. Misses add a little extra (`WHIFF_PENALTY`). Once a move **hits cleanly** you can cancel it into your next move — that's how combos chain |
| `hitbox` | The area that hits, measured from the **front of your body**: `x` = distance in front (negative reaches behind you), `y` = distance down from the top of your head, `width` / `height` = size. The body is 48 × 100 |
| `knockback` | How hard the opponent is pushed away (negative pulls them **toward** you) |
| `lift` | How high the opponent is popped up (0 = stays on the ground) |
| `stun` | How long the opponent can't act after being hit |

### Optional extras

| Setting | What it does |
| --- | --- |
| `health: 1200` | (fighter, not move) This fighter's max health instead of `MAX_HEALTH` |
| `spriteScale: 1.2` | (fighter, not move) Draw this fighter's frames bigger or smaller |
| `meterCost: 50` | Needs this much SPECIAL meter (the bar is 100) |
| `cooldown: 0.5` | Seconds to wait after this move before attacking again (default `ATTACK_COOLDOWN`, or `SPECIAL_COOLDOWN` for specials, in `js/core/config.js`) |
| `hop: 300` | You jump upward when the move starts |
| `lunge: 260` | You slide forward during startup + active (negative slides backward) |
| `dive: 300` | Air moves: you dive downward at this speed |
| `endsOnLanding: true` | Active lasts until you touch the ground |
| `guardBreak: true` | Goes through blocking |
| `invincible: true` | You can't be hit until the move's recovery (you flicker) |
| `hits: 4, hitInterval: 0.1` | Hits up to 4 times, at most once every 0.1s |
| `teleport: "behind"` | Appears on the other side of the opponent when the move becomes active |
| `teleport: 200` | Jumps 200 pixels backward instead |
| `shake: 8` | Screen shake on hit |
| `projectile: {...}` | Fires a shot instead of (or as well as) the hitbox |

### Projectile settings

| Setting | What it does |
| --- | --- |
| `speed` | Horizontal speed |
| `width`, `height` | Size |
| `y` | Height on your body it comes out (0 = head, ~76 = at your feet) |
| `life` | Seconds before it fades |
| `color` | Its color |
| `vy` | Starts moving up (negative) or down (positive) |
| `gravity` | Curves it downward over time |
| `bothWays: true` | Fires one left AND one right (good for ground shockwaves) |
| `spin: 12` | Spins the picture while it flies (bigger = faster, 0 = no spin) |
| `image` | A different picture than the default `<sprites folder>/projectiles/<move>.png` |

Each projectile's picture lives in the fighter's sprites folder, e.g.
`assets/characters/chicken/projectiles/special.png`. Draw it facing **right**.
No picture? The game draws a glowing ball in the projectile's `color`.

## Combo timing

Combos are about timing, not mashing:

- Press the next move **after you see the hit land** (the short freeze). Presses
  during the freeze are remembered, and you have `CANCEL_WINDOW` seconds after it.
- Pressing an attack before your current move has hit counts as mashing: your
  attack buttons lock for a moment and "TOO EARLY" pops up.
- Blocked hits can't be cancelled, and the attacker is pushed back.
- Hitting someone while they're attacking is a **COUNTER** (extra damage and stun);
  hitting them while they recover from a miss is a **PUNISH**.
- Long chains do less damage per hit (`COMBO_SCALING`), but named combos add their bonus.
- After a move finishes you rest a moment before the next attack (`ATTACK_COOLDOWN`,
  longer after specials). Cancelling a move that hit into the next one skips the
  rest, so combos are just as fast.

All of these numbers are in `js/core/config.js`.

## Combos

```js
combos: [
  { name: "TRIPLE STRIKE", sequence: ["punch", "punch", "kick"], bonusDamage: 5 }
]
```

Land the moves in `sequence` in a row (each hit within about a second of the
last) to get `bonusDamage` and the combo name on screen. Use any move slot
name from the table above, including the specials.
