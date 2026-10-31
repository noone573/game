// Game-wide settings. Change these numbers to tune the whole game.
"use strict";

const WIDTH = 1600;  // arena size in canvas pixels (background pictures are this size too)
const HEIGHT = 900;
const FLOOR = 738;   // y position fighters stand on
const GRAVITY = 1500;
const JUMP_SPEED = 610;

// Health every fighter starts a round with. A fighter file can set its own
// with `health: 1200`. The health bars scale to whatever this is.
const MAX_HEALTH = 100;

const ROUNDS_TO_WIN = 2;
const ROUND_TIME = 60;   // seconds per round
const MAX_METER = 100;   // SPECIAL meter size

// After pressing SPECIAL, how long (seconds) the game waits for a
// direction / punch / kick to turn it into a special variant.
const SPECIAL_BUFFER = 0.12;

// ---------- combat feel ----------

// Freeze on every hit so it lands with weight (seconds).
const HITSTOP_BASE = 0.06;
const HITSTOP_BLOCKED = 0.05;
const HITSTOP_KO = 0.25;

// After a hit lands (and the freeze ends) you have this long to press the
// next move of a combo. Presses during the freeze are remembered.
const CANCEL_WINDOW = 0.18;

// Pressing an attack while your move hasn't hit yet ("mashing") locks your
// attack buttons for this long. Each extra early press restarts it.
const MASH_LOCKOUT = 0.15;

// After a move finishes, wait this long (seconds) before the next attack can
// start. Specials wait longer. A move can set its own with `cooldown: 0.5`.
// Combos aren't slowed down: cancelling a move that hit skips the wait.
const ATTACK_COOLDOWN = 0.45;
const SPECIAL_COOLDOWN = 0.6;

// Extra recovery when an attack misses completely, so whiffs can be punished.
const WHIFF_PENALTY = 0.12;

// Hitting someone during their attack. Counter = they were starting or swinging,
// punish = they were recovering. Both deal bonus damage.
const COUNTER_BONUS = 1.25;
const PUNISH_BONUS = 1.15;

// Damage multiplier for the 1st, 2nd, 3rd... hit of a chain (last one repeats).
// Long chains do less per hit; named combos still add their bonusDamage.
const COMBO_SCALING = [1, 1, 0.9, 0.8, 0.7, 0.6, 0.5];

// Each player's marker color (the arrow over their head and the ring under their feet).
const PLAYER_COLORS = { 1: "#f0b83c", 2: "#e2533f" };

const HUD_FONT = '"Lilita One", Impact, Arial, sans-serif';

const P1_CONTROLS = {
  left: "a",
  right: "d",
  jump: "w",
  block: "s",
  punch: "f",
  kick: "g",
  special: "h"
};

const P2_CONTROLS = {
  left: "arrowleft",
  right: "arrowright",
  jump: "arrowup",
  block: "arrowdown",
  punch: "k",
  kick: "l",
  special: "j"
};
