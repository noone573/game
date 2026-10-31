// CHICKEN — fast rushdown: quick multi-hit pecks and egg throws.
// What every number means: data/fighters/README.md

addFighter({
  id: "Chicken",
  name: "Chicken",
  title: "Alarm ",
  description: "Fast But Weak",

  color: "#ffd75e",
  dark: "#574116",
  accent: "#fff3b0",
  glow: "rgba(255, 215, 94, .24)",

  speed: 340,
  power: 2,
  agility: 5,

  // Your drawings: one picture per frame, e.g. assets/characters/chicken/idle/1.png
  // (drawing guides for every frame are in assets/templates/frames/).
  sprites: "assets/characters/chicken",
  spriteScale: 1.2, // draw the frames a bit bigger (1 = normal size)

  moves: {
    punch: {
      name: "Peck",
      damage: 1,
      startup: 0.05, active: 0.09, recovery: 0.1,
      hitbox: { x: 0, y: 20, width: 62, height: 48 },
      knockback: 220, lift: 180, stun: 0.3
    },

    kick: {
      name: "Claw Kick",
      damage: 2,
      startup: 0.08, active: 0.11, recovery: 0.14,
      hitbox: { x: 0, y: 48, width: 84, height: 44 },
      knockback: 300, lift: 200, stun: 0.32
    },

    uppercut: {
      name: "Wing Uppercut",
      damage: 2,
      startup: 0.05, active: 0.12, recovery: 0.26,
      hitbox: { x: -6, y: -30, width: 56, height: 95 },
      knockback: 80, lift: 520, stun: 0.5,
      hop: 360, lunge: 240, shake: 8
    },

    dropkick: {
      name: "Talon Drop",
      damage: 2,
      startup: 0.04, active: 0.6, recovery: 0.16,
      hitbox: { x: -10, y: 20, width: 80, height: 80 },
      knockback: 460, lift: 280, stun: 0.42,
      lunge: 520, dive: 160, endsOnLanding: true, shake: 7
    },

    disrupt: {
      name: "Flap Shove",
      damage: 1,
      startup: 0.1, active: 0.1, recovery: 0.18,
      hitbox: { x: 0, y: 24, width: 60, height: 60 },
      knockback: 200, lift: 0, stun: 0.25,
      lunge: 320, shake: 6
    },

    special: {
      name: "Egg Toss",
      damage: 2,
      startup: 0.1, active: 0.05, recovery: 0.22,
      knockback: 260, lift: 140, stun: 0.4,
      meterCost: 40, shake: 6,
      projectile: { speed: 640, width: 26, height: 32, y: 28, life: 1.4, color: "#fff6e0", spin: 12 }
    },

    specialUp: {
      name: "Sky Egg",
      damage: 2,
      startup: 0.1, active: 0.05, recovery: 0.25,
      knockback: 120, lift: 400, stun: 0.45,
      meterCost: 30, shake: 7,
      projectile: { speed: 360, vy: -520, width: 26, height: 26, y: 10, life: 1, color: "#fff6e0", spin: 12 }
    },

    specialDown: {
      name: "Egg Bounce",
      damage: 2,
      startup: 0.16, active: 0.05, recovery: 0.3,
      knockback: 200, lift: 300, stun: 0.5,
      meterCost: 35, shake: 8,
      projectile: { speed: 300, width: 70, height: 24, y: 74, life: 0.6, color: "#fff6e0", bothWays: true }
    },

    specialForward: {
      name: "Feather Flurry",
      damage: 1,
      startup: 0.06, active: 0.36, recovery: 0.25,
      hitbox: { x: -10, y: 20, width: 60, height: 70 },
      knockback: 60, lift: 60, stun: 0.3,
      lunge: 700, hits: 5, hitInterval: 0.07, meterCost: 40, shake: 5
    },

    specialBack: {
      name: "Hop & Egg",
      damage: 1,
      startup: 0.06, active: 0.05, recovery: 0.2,
      knockback: 220, lift: 120, stun: 0.35,
      teleport: 180, invincible: true, meterCost: 35,
      projectile: { speed: 640, width: 24, height: 30, y: 30, life: 1.2, color: "#fff6e0", spin: 12 }
    },

    specialPunch: {
      name: "Peck-a-Peck",
      damage: 1,
      startup: 0.06, active: 0.4, recovery: 0.25,
      hitbox: { x: 0, y: 20, width: 70, height: 50 },
      knockback: 40, lift: 0, stun: 0.25,
      lunge: 80, hits: 6, hitInterval: 0.065, meterCost: 35, shake: 4
    },

    specialKick: {
      name: "Rooster Kick",
      damage: 1,
      startup: 0.06, active: 0.3, recovery: 0.25,
      hitbox: { x: -6, y: 20, width: 80, height: 70 },
      knockback: 300, lift: 340, stun: 0.45,
      hop: 300, lunge: 380, hits: 2, hitInterval: 0.12, meterCost: 35, shake: 8
    }
  },

  combos: [
    { name: "PECKING ORDER",         sequence: ["punch", "punch", "punch"],          bonusDamage: 1 },
    { name: "FOWL PLAY",             sequence: ["punch", "kick", "specialPunch"],    bonusDamage: 2 },
    { name: "CHICKEN DINNER",        sequence: ["kick", "uppercut", "dropkick"],     bonusDamage: 2 },
    { name: "FREE RANGE",            sequence: ["disrupt", "specialForward"],        bonusDamage: 2 },
    { name: "SCRAMBLED",             sequence: ["punch", "specialKick"],             bonusDamage: 2 }
  ]
});
