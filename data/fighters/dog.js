// DOG — loyal all-rounder: quick, reliable attacks.
// What every number means: data/fighters/README.md

addFighter({
  id: "Dog",
  name: "Dog",
  title: "The Guard Dog",
  description: "A loyal all-rounder with quick, reliable attacks.",

  // Colors used by the HUD, effects and the built-in look.
  color: "#d08c4c",
  dark: "#4a2c16",
  accent: "#ffe2bd",
  glow: "rgba(208, 140, 76, .28)",

  speed: 300,
  power: 3,   // bars shown on the select card (1-5)
  agility: 4,

  // Your drawings: one picture per frame, e.g. assets/characters/dog/idle/1.png
  // (drawing guides for every frame are in assets/templates/frames/).
  sprites: "assets/characters/dog",
  spriteScale: 3, // frames are 352px with the animal drawn small, so draw them bigger

  moves: {
    punch: {
      name: "Paw Jab",
      damage: 1,
      startup: 0.06, active: 0.1, recovery: 0.12,
      hitbox: { x: 0, y: 20, width: 65, height: 48 },
      knockback: 260, lift: 200, stun: 0.3
    },

    kick: {
      name: "Hind Kick",
      damage: 2,
      startup: 0.1, active: 0.12, recovery: 0.16,
      hitbox: { x: 0, y: 48, width: 88, height: 44 },
      knockback: 320, lift: 220, stun: 0.34
    },

    uppercut: {
      name: "Fetch Uppercut",
      damage: 2,
      startup: 0.07, active: 0.14, recovery: 0.3,
      hitbox: { x: -6, y: -30, width: 60, height: 95 },
      knockback: 80, lift: 520, stun: 0.55,
      hop: 380, lunge: 220, shake: 9
    },

    dropkick: {
      name: "Pounce Drop",
      damage: 3,
      startup: 0.06, active: 0.6, recovery: 0.2,
      hitbox: { x: -10, y: 20, width: 80, height: 80 },
      knockback: 520, lift: 300, stun: 0.45,
      lunge: 420, dive: 120, endsOnLanding: true, shake: 8
    },

    disrupt: {
      name: "Bark Shove",
      damage: 1,
      startup: 0.14, active: 0.1, recovery: 0.2,
      hitbox: { x: 0, y: 24, width: 60, height: 60 },
      knockback: 200, lift: 0, stun: 0.25,
      lunge: 260, shake: 6
    },

    special: {
      name: "Bark Wave",
      damage: 2,
      startup: 0.18, active: 0.05, recovery: 0.3,
      knockback: 320, lift: 180, stun: 0.45,
      meterCost: 50, shake: 7,
      projectile: { speed: 560, width: 46, height: 26, y: 34, life: 1.6, color: "#d08c4c" }
    },

    specialUp: {
      name: "Frisbee Leap",
      damage: 1,
      startup: 0.05, active: 0.3, recovery: 0.35,
      hitbox: { x: -20, y: -40, width: 70, height: 130 },
      knockback: 60, lift: 420, stun: 0.5,
      hop: 560, lunge: 120, hits: 3, hitInterval: 0.09,
      invincible: true, meterCost: 35, shake: 8
    },

    specialDown: {
      name: "Dig Quake",
      damage: 2,
      startup: 0.2, active: 0.05, recovery: 0.35,
      knockback: 260, lift: 380, stun: 0.5,
      meterCost: 40, shake: 9,
      projectile: { speed: 420, width: 60, height: 22, y: 76, life: 0.9, color: "#d08c4c", bothWays: true }
    },

    specialForward: {
      name: "Zoomies",
      damage: 2,
      startup: 0.08, active: 0.22, recovery: 0.25,
      hitbox: { x: -10, y: 24, width: 60, height: 56 },
      knockback: 380, lift: 160, stun: 0.4,
      lunge: 900, meterCost: 30, shake: 8
    },

    specialBack: {
      name: "Guard Growl",
      damage: 1,
      startup: 0.04, active: 0.3, recovery: 0.3,
      hitbox: { x: -90, y: 0, width: 150, height: 100 },
      knockback: 420, lift: 260, stun: 0.4,
      invincible: true, meterCost: 30, shake: 7
    },

    specialPunch: {
      name: "Bone Breaker",
      damage: 3,
      startup: 0.16, active: 0.1, recovery: 0.3,
      hitbox: { x: 0, y: 16, width: 80, height: 56 },
      knockback: 560, lift: 300, stun: 0.55,
      lunge: 200, guardBreak: true, meterCost: 40, shake: 14
    },

    specialKick: {
      name: "Tail Spin",
      damage: 1,
      startup: 0.08, active: 0.4, recovery: 0.25,
      hitbox: { x: -110, y: 30, width: 220, height: 56 },
      knockback: 120, lift: 120, stun: 0.35,
      hits: 4, hitInterval: 0.1, meterCost: 40
    }
  },

  combos: [
    { name: "GOOD BOY",              sequence: ["punch", "punch", "kick"],          bonusDamage: 1 },
    { name: "FETCH!",                sequence: ["punch", "kick", "uppercut"],       bonusDamage: 2 },
    { name: "BAD DOG",               sequence: ["disrupt", "punch", "uppercut"],    bonusDamage: 2 },
    { name: "BONE DROP",             sequence: ["uppercut", "dropkick"],            bonusDamage: 2 },
    { name: "HOWL AT THE MOON",      sequence: ["punch", "kick", "special"],        bonusDamage: 2 },
    { name: "ZOOMIES",               sequence: ["punch", "kick", "specialForward"], bonusDamage: 2 },
    { name: "FRISBEE CATCH",         sequence: ["uppercut", "specialUp"],           bonusDamage: 2 },
    { name: "TOP DOG",               sequence: ["disrupt", "specialPunch"],         bonusDamage: 3 }
  ]
});
