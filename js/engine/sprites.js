// Sprite frames: each fighter's drawings, one picture per frame (see assets/README.md).
"use strict";

// Each fighter file sets `sprites` to a folder, for example
// "assets/characters/chicken". Inside it every animation has its own folder
// with numbered frames:  idle/1.png, idle/2.png ... punch/1.png ...
//
// Frames face RIGHT, are square, and can be any size (64, 128, 256...).
// Missing frames borrow a similar animation (see FALLBACK_ANIMATIONS);
// a fighter with no frames at all uses the built-in shapes.
const SPRITE = {
  displaySize: 128, // how big one frame is drawn in the arena (fighters can set spriteScale)
  anchorX: 0.5,     // feet position inside a frame (0-1)
  anchorY: 0.9375,  // 240 / 256 — the blue "feet" line in the drawing guides
  animations: {
    idle:           { frames: 4, fps: 6 },
    walk:           { frames: 6, fps: 12 },
    jump:           { frames: 3 },          // rising, top, falling
    punch:          { frames: 3 },          // wind-up, hit, recover
    kick:           { frames: 3 },
    block:          { frames: 2 },          // guard, absorbing a hit
    hurt:           { frames: 2, fps: 10 },
    ko:             { frames: 3 },          // stagger, falling, on the floor
    uppercut:       { frames: 3 },
    dropkick:       { frames: 3 },
    disrupt:        { frames: 3 },
    special:        { frames: 3 },          // charge, fire, recover
    specialUp:      { frames: 3 },
    specialDown:    { frames: 3 },
    specialForward: { frames: 3 },
    specialBack:    { frames: 3 },
    specialPunch:   { frames: 3 },
    specialKick:    { frames: 3 }
  }
};

// If an animation has no frames, show this one instead.
const FALLBACK_ANIMATIONS = {
  walk: "idle",
  jump: "idle",
  block: "idle",
  hurt: "idle",
  ko: "hurt",
  punch: "idle",
  kick: "punch",
  uppercut: "punch",
  dropkick: "kick",
  disrupt: "punch",
  special: "punch",
  specialUp: "uppercut",
  specialDown: "special",
  specialForward: "special",
  specialBack: "block",
  specialPunch: "punch",
  specialKick: "kick"
};

// sprites[fighterId] = { idle: [Image, Image, ...], punch: [...], ... }
// A frame that hasn't loaded (or doesn't exist) is null.
const sprites = {};

// projectileImages[fighterId][moveKey] = Image of that move's shot, e.g.
// assets/characters/chicken/projectiles/special.png. A move can point at a
// different picture with `projectile: { image: "..." }`.
const projectileImages = {};

function loadSprites() {
  FIGHTERS.forEach((fighter) => {
    if (!fighter.sprites) return;

    const folder = fighter.sprites.replace(/\/$/, "");
    const set = {};

    Object.entries(SPRITE.animations).forEach(([name, anim]) => {
      set[name] = [];

      for (let i = 0; i < anim.frames; i++) {
        const image = new Image();

        set[name][i] = null;

        image.onload = () => {
          set[name][i] = image;

          if (name === "idle" && i === 0) updateCardArt(fighter.id);
        };

        // Not drawn yet: a similar animation (or the built-in look) is used.
        image.onerror = () => {};

        image.src = `${folder}/${name}/${i + 1}.png`;
      }
    });

    sprites[fighter.id] = set;

    // Pictures for every move that fires a projectile.
    projectileImages[fighter.id] = {};

    Object.entries(fighter.moves || {}).forEach(([moveKey, def]) => {
      if (!def || !def.projectile) return;

      const image = new Image();

      image.onload = () => {
        projectileImages[fighter.id][moveKey] = image;
      };

      // No picture yet: the game draws a glowing ball instead.
      image.onerror = () => {};

      image.src = def.projectile.image || `${folder}/projectiles/${moveKey}.png`;
    });
  });
}

// The picture to show for an animation frame, or null if there's nothing to show.
function getSpriteFrame(fighterId, name, frame) {
  const set = sprites[fighterId];
  let current = name;

  for (let tries = 0; set && current && tries < 6; tries++) {
    const frames = set[current] || [];
    const image = frames[frame] || frames[0];

    if (image) return image;

    current = FALLBACK_ANIMATIONS[current];
  }

  return null;
}
