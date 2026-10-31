// COW — slow heavy hitter: big damage, armored charges, a pull move.
// What every number means: data/fighters/README.md

addFighter({
  id: "Cow",
  name: "Cow",
  title: "The Charging Bull",
  description: "Slow, but every hit lands like a ton of hay.",

  color: "#f3eee4",
  dark: "#3a302b",
  accent: "#ffb3c4",
  glow: "rgba(243, 238, 228, .22)",

  speed: 275,
  power: 5,
  agility: 2,

  // Your drawings: one picture per frame, e.g. assets/characters/cow/idle/1.png
  // (drawing guides for every frame are in assets/templates/frames/).
  sprites: "assets/characters/cow",
  spriteScale: 3, // frames are 352px with the animal drawn small, so draw them bigger

  moves: {
    punch: {
      name: "Hoof Jab",
      damage: 2,
      startup: 0.08, active: 0.1, recovery: 0.14,
      hitbox: { x: 0, y: 20, width: 66, height: 48 },
      knockback: 280, lift: 200, stun: 0.32
    },

    kick: {
      name: "Buck Kick",
      damage: 3,
      startup: 0.12, active: 0.12, recovery: 0.2,
      hitbox: { x: 0, y: 46, width: 92, height: 46 },
      knockback: 340, lift: 240, stun: 0.36
    },

    uppercut: {
      name: "Horn Hook",
      damage: 3,
      startup: 0.1, active: 0.14, recovery: 0.34,
      hitbox: { x: -6, y: -30, width: 62, height: 95 },
      knockback: 90, lift: 560, stun: 0.55,
      hop: 320, lunge: 200, shake: 11
    },

    dropkick: {
      name: "Ton of Beef",
      damage: 3,
      startup: 0.07, active: 0.6, recovery: 0.24,
      hitbox: { x: -10, y: 20, width: 84, height: 82 },
      knockback: 560, lift: 320, stun: 0.5,
      lunge: 380, dive: 300, endsOnLanding: true, shake: 10
    },

    disrupt: {
      name: "Shoulder Shove",
      damage: 1,
      startup: 0.16, active: 0.1, recovery: 0.24,
      hitbox: { x: 0, y: 20, width: 64, height: 64 },
      knockback: 260, lift: 0, stun: 0.25,
      lunge: 240, shake: 8
    },

    special: {
      name: "Milk Blast",
      damage: 3,
      startup: 0.24, active: 0.05, recovery: 0.35,
      knockback: 420, lift: 240, stun: 0.5,
      meterCost: 50, shake: 10,
      projectile: { speed: 380, width: 64, height: 40, y: 24, life: 2, color: "#f3eee4" }
    },

    specialUp: {
      name: "Over the Moon",
      damage: 3,
      startup: 0.06, active: 0.3, recovery: 0.4,
      hitbox: { x: -30, y: -40, width: 90, height: 140 },
      knockback: 140, lift: 600, stun: 0.6,
      hop: 480, invincible: true, meterCost: 45, shake: 14
    },

    specialDown: {
      name: "Stampede Stomp",
      damage: 2,
      startup: 0.26, active: 0.05, recovery: 0.36,
      knockback: 300, lift: 420, stun: 0.55,
      meterCost: 45, shake: 14,
      projectile: { speed: 480, width: 80, height: 30, y: 68, life: 0.8, color: "#f3eee4", bothWays: true }
    },

    specialForward: {
      name: "Bull Charge",
      damage: 3,
      startup: 0.12, active: 0.3, recovery: 0.3,
      hitbox: { x: -10, y: 10, width: 60, height: 85 },
      knockback: 520, lift: 200, stun: 0.5,
      lunge: 640, invincible: true, meterCost: 40, shake: 12
    },

    // Negative knockback pulls the opponent in — set up Mega Hoof!
    specialBack: {
      name: "Cowbell Pull",
      damage: 1,
      startup: 0.2, active: 0.12, recovery: 0.3,
      hitbox: { x: 0, y: 0, width: 220, height: 100 },
      knockback: -380, lift: 0, stun: 0.6,
      meterCost: 35, shake: 6
    },

    specialPunch: {
      name: "Mega Hoof",
      damage: 4,
      startup: 0.22, active: 0.12, recovery: 0.38,
      hitbox: { x: 0, y: 14, width: 86, height: 60 },
      knockback: 640, lift: 340, stun: 0.65,
      lunge: 160, guardBreak: true, meterCost: 50, shake: 16
    },

    specialKick: {
      name: "Barn Buster",
      damage: 3,
      startup: 0.14, active: 0.14, recovery: 0.34,
      hitbox: { x: 0, y: 40, width: 100, height: 56 },
      knockback: 560, lift: 260, stun: 0.55,
      meterCost: 40, shake: 13
    }
  },

  combos: [
    { name: "UDDER CHAOS",           sequence: ["punch", "kick", "uppercut"],          bonusDamage: 2 },
    { name: "JUMPED THE MOON",       sequence: ["uppercut", "specialUp"],              bonusDamage: 2 },
    { name: "STAMPEDE",              sequence: ["kick", "specialDown"],                bonusDamage: 2 },
    { name: "RING THE BELL",         sequence: ["specialBack", "specialPunch"],        bonusDamage: 3 },
    { name: "HOLY COW",              sequence: ["disrupt", "punch", "specialKick"],    bonusDamage: 3 }
  ]
});
