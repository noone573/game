// PIG — tricky mud fighter: tunnels, slides and guard breaks.
// What every number means: data/fighters/README.md

addFighter({
  id: "Pig",
  name: "Pig",
  title: "Fat Pig",
  description: "A sneaky pig that tunnels through the mud.",

  color: "#f48fb1",
  dark: "#6e2a45",
  accent: "#ffe0ea",
  glow: "rgba(244, 143, 177, .26)",

  speed: 300,
  power: 4,
  agility: 3,

  // Your drawings: one picture per frame, e.g. assets/characters/pig/idle/1.png
  // (drawing guides for every frame are in assets/templates/frames/).
  sprites: "assets/characters/pig",
  spriteScale: 3, // frames are 352px with the animal drawn small, so draw them bigger

  moves: {
    punch: {
      name: "Snout Jab",
      damage: 1,
      startup: 0.06, active: 0.1, recovery: 0.12,
      hitbox: { x: 0, y: 20, width: 65, height: 48 },
      knockback: 260, lift: 200, stun: 0.3
    },

    kick: {
      name: "Trotter Kick",
      damage: 2,
      startup: 0.1, active: 0.12, recovery: 0.17,
      hitbox: { x: 0, y: 44, width: 90, height: 46 },
      knockback: 320, lift: 220, stun: 0.34
    },

    uppercut: {
      name: "Snout Lift",
      damage: 2,
      startup: 0.08, active: 0.14, recovery: 0.3,
      hitbox: { x: -6, y: -30, width: 56, height: 95 },
      knockback: 80, lift: 540, stun: 0.55,
      hop: 340, lunge: 200, shake: 9
    },

    dropkick: {
      name: "Belly Flop",
      damage: 2,
      startup: 0.05, active: 0.6, recovery: 0.2,
      hitbox: { x: -10, y: 20, width: 80, height: 80 },
      knockback: 480, lift: 260, stun: 0.45,
      lunge: 520, dive: 260, endsOnLanding: true, shake: 8
    },

    disrupt: {
      name: "Mud Shove",
      damage: 1,
      startup: 0.12, active: 0.1, recovery: 0.2,
      hitbox: { x: 0, y: 20, width: 64, height: 60 },
      knockback: 220, lift: 0, stun: 0.25,
      lunge: 300, shake: 6
    },

    special: {
      name: "Mud Ball",
      damage: 2,
      startup: 0.12, active: 0.05, recovery: 0.25,
      knockback: 200, lift: 100, stun: 0.35,
      meterCost: 35, shake: 5,
      projectile: { speed: 760, width: 30, height: 18, y: 30, life: 1.4, color: "#8a5a3c", spin: 12 }
    },

    specialUp: {
      name: "When Pigs Fly",
      damage: 2,
      startup: 0.04, active: 0.3, recovery: 0.35,
      hitbox: { x: -20, y: -30, width: 70, height: 110 },
      knockback: 160, lift: 500, stun: 0.5,
      hop: 520, invincible: true, meterCost: 35, shake: 9
    },

    specialDown: {
      name: "Mud Slide",
      damage: 2,
      startup: 0.06, active: 0.3, recovery: 0.28,
      hitbox: { x: -10, y: 70, width: 70, height: 30 },
      knockback: 200, lift: 480, stun: 0.55,
      lunge: 600, meterCost: 30, shake: 8
    },

    specialForward: {
      name: "Truffle Tunnel",
      damage: 2,
      startup: 0.12, active: 0.12, recovery: 0.25,
      hitbox: { x: 0, y: 20, width: 60, height: 60 },
      knockback: 360, lift: 200, stun: 0.45,
      teleport: "behind", invincible: true, meterCost: 40, shake: 9
    },

    specialBack: {
      name: "Mud Hide",
      damage: 0,
      startup: 0.05, active: 0.1, recovery: 0.15,
      teleport: 220, invincible: true, meterCost: 20
    },

    specialPunch: {
      name: "Hog Slap",
      damage: 3,
      startup: 0.14, active: 0.1, recovery: 0.3,
      hitbox: { x: 0, y: 20, width: 70, height: 56 },
      knockback: 500, lift: 260, stun: 0.6,
      lunge: 180, guardBreak: true, meterCost: 40, shake: 12
    },

    specialKick: {
      name: "Curly Tail Whip",
      damage: 3,
      startup: 0.1, active: 0.16, recovery: 0.3,
      hitbox: { x: -10, y: -10, width: 90, height: 90 },
      knockback: 200, lift: 620, stun: 0.6,
      meterCost: 40, shake: 11
    }
  },

  combos: [
    { name: "OINK OINK",             sequence: ["punch", "punch", "disrupt"],              bonusDamage: 1 },
    { name: "BELLY FLOP",            sequence: ["uppercut", "dropkick"],                   bonusDamage: 2 },
    { name: "HOG WILD",              sequence: ["punch", "kick", "specialForward"],        bonusDamage: 2 },
    { name: "PIGS CAN FLY",          sequence: ["specialDown", "specialUp"],               bonusDamage: 2 },
    { name: "BRING HOME THE BACON",  sequence: ["disrupt", "specialPunch", "specialKick"], bonusDamage: 3 }
  ]
});
