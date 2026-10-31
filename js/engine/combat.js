// What happens when attacks connect: damage, blocking, combos,
// projectiles and floating text.
"use strict";

function boxesOverlap(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

// direction: which way the hit travels (1 = right, -1 = left).
// isFollowUp: extra hits of a multi-hit move (they don't count toward named combos).
// Returns { blocked } so the attacker knows whether it can combo.
function applyHit(attacker, defender, moveKey, def, direction, isFollowUp = false) {
  const blocking = defender.blocking && defender.facing === -direction;
  const guardBroken = blocking && def.guardBreak;
  const blocked = blocking && !def.guardBreak;

  let damage = def.damage;
  let combo = null;

  // Caught them mid-move? Starting/swinging = counter, recovering = punish.
  let bonusTag = "";

  if (!blocked && defender.move && !isFollowUp) {
    bonusTag = defender.move.phase === "recovery" ? "PUNISH!" : "COUNTER!";
    damage *= bonusTag === "PUNISH!" ? PUNISH_BONUS : COUNTER_BONUS;
  }

  if (!blocked) {
    // Track the chain of moves that hit in a row.
    const continuing = attacker.comboTimer > 0;

    attacker.comboCount = continuing ? attacker.comboCount + 1 : 1;
    attacker.comboTimer = 1;
    attacker.comboDisplayTimer = 1;

    if (!isFollowUp) {
      attacker.chain = continuing ? [...attacker.chain, moveKey] : [moveKey];
      combo = findCombo(attacker);
    }

    // Long chains do less damage per hit, so mashing out hits isn't the best plan.
    damage *= COMBO_SCALING[Math.min(attacker.comboCount, COMBO_SCALING.length) - 1];

    if (combo) {
      damage += combo.bonusDamage || 0;
      attacker.comboName = combo.name;
      attacker.comboNameTimer = 1.6;
    }
  } else {
    damage *= 0.2;
  }

  defender.health = Math.max(0, defender.health - Math.round(damage));

  attacker.meter = Math.min(MAX_METER, attacker.meter + (moveKey.startsWith("special") ? 0 : blocked ? 3 : 9));
  defender.meter = Math.min(MAX_METER, defender.meter + 5);

  // Knockback pushes the defender away from the attacker.
  defender.knockbackX = direction * (blocked ? 100 : def.knockback || 0);

  if (blocked) {
    // The blocker is stuck in guard briefly; the attacker gets pushed back.
    defender.hurtTimer = 0.1;
    defender.blockStun = 0.1 + def.damage * 0.008;
    attacker.knockbackX = -direction * 160;
  } else {
    if (def.lift) {
      defender.vy = -def.lift;
      defender.grounded = false;
    }

    defender.hitStun = (def.stun || 0.25) + (bonusTag === "COUNTER!" ? 0.15 : 0);
    defender.hurtTimer = Math.min(defender.hitStun, 0.3);
    defender.move = null;
    defender.specialBuffer = 0;
  }

  if (guardBroken) {
    addPopup("GUARD BREAK!", defender.centerX, defender.y - 18, "#ffe08a", 20);
  } else if (bonusTag) {
    addPopup(bonusTag, defender.centerX, defender.y - 18, "#ff8b5e", 20);
  }

  // Freeze both fighters for a moment so the hit has weight.
  const freeze = defender.health <= 0
    ? HITSTOP_KO
    : blocked
      ? HITSTOP_BLOCKED
      : HITSTOP_BASE + Math.min(def.damage, 20) * 0.003 + (bonusTag ? 0.04 : 0);

  hitstop = Math.max(hitstop, freeze);

  const big = combo || attacker.comboCount >= 3;

  screenShake = blocked ? 2 : big ? 12 : def.shake || 5;

  const hitX = defender.centerX;
  const hitY = defender.y + defender.height * 0.45;

  createHitParticles(
    hitX,
    hitY,
    blocked ? "#ffffff" : defender.color,
    big ? 22 : blocked ? 7 : 12
  );

  if (big) {
    createHitParticles(hitX, hitY, attacker.color, 14);
  }

  return { blocked };
}

// Does the end of the attacker's chain match one of their named combos?
function findCombo(attacker) {
  const chain = attacker.chain;

  // Check longer combos first so they win over shorter ones.
  const combos = [...attacker.combos].sort(
    (a, b) => b.sequence.length - a.sequence.length
  );

  return combos.find((combo) => {
    const sequence = combo.sequence;

    if (chain.length < sequence.length) return false;

    const tail = chain.slice(chain.length - sequence.length);

    return tail.every((key, i) => key === sequence[i]);
  }) || null;
}

// ---------- projectiles ----------

// projectile options (in a move's `projectile: {...}`):
//   speed, width, height, y (height on the body), life, color,
//   vy (start moving up/down), gravity (curves downward), bothWays (fires left AND right)
function spawnProjectile(owner, moveKey, def) {
  const shot = def.projectile;
  const directions = shot.bothWays ? [1, -1] : [owner.facing];

  for (const direction of directions) {
    projectiles.push({
      owner,
      moveKey,
      def,
      direction,
      x: direction === 1 ? owner.x + owner.width : owner.x - shot.width,
      y: owner.y + (shot.y ?? 34),
      vy: shot.vy || 0,
      gravity: shot.gravity || 0,
      width: shot.width,
      height: shot.height,
      speed: shot.speed,
      life: shot.life ?? 1.5,
      color: shot.color || owner.color,
      spin: shot.spin || 0,
      image: (projectileImages[owner.data.id] || {})[moveKey] || null,
      age: 0
    });
  }
}

function updateProjectiles(dt) {
  for (const shot of projectiles) {
    shot.x += shot.direction * shot.speed * dt;
    shot.vy += shot.gravity * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    shot.age += dt;

    // Shots that reach the floor fizzle out.
    if (shot.y + shot.height > FLOOR + 4) {
      shot.life = 0;
      createHitParticles(shot.x + shot.width / 2, FLOOR, shot.color, 6);
      continue;
    }

    const target = shot.owner === player1 ? player2 : player1;

    if (
      shot.life > 0 &&
      target.health > 0 &&
      !target.isInvincible() &&
      boxesOverlap(shot, target)
    ) {
      shot.life = 0;
      applyHit(shot.owner, target, shot.moveKey, shot.def, shot.direction);
    }
  }

  // Shots from different players cancel each other out.
  for (const a of projectiles) {
    for (const b of projectiles) {
      if (a.owner !== b.owner && a.life > 0 && b.life > 0 && boxesOverlap(a, b)) {
        a.life = 0;
        b.life = 0;
        createHitParticles((a.x + b.x) / 2 + a.width / 2, a.y + a.height / 2, "#ffffff", 16);
      }
    }
  }

  projectiles = projectiles.filter((shot) =>
    shot.life > 0 && shot.x > -100 && shot.x < WIDTH + 100 && shot.y > -200
  );
}

function drawProjectiles() {
  for (const shot of projectiles) {
    const cx = shot.x + shot.width / 2;
    const cy = shot.y + shot.height / 2;
    const pulse = 1 + Math.sin(shot.age * 30) * 0.08;
    const fade = Math.min(1, shot.life * 3);

    // The move's projectile picture, facing the way it flies.
    if (shot.image) {
      // Scale the picture to cover the shot's box (a bit bigger), keeping its shape.
      const scale = Math.max(shot.width / shot.image.naturalWidth, shot.height / shot.image.naturalHeight) * 1.6;
      const w = shot.image.naturalWidth * scale;
      const h = shot.image.naturalHeight * scale;

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(cx, cy);
      ctx.scale(shot.direction, 1);
      ctx.rotate(shot.age * shot.spin);
      ctx.shadowColor = shot.color;
      ctx.shadowBlur = 10;
      ctx.drawImage(shot.image, -w / 2, -h / 2, w, h);
      ctx.restore();
      continue;
    }

    ctx.save();
    ctx.shadowColor = shot.color;
    ctx.shadowBlur = 24;
    ctx.fillStyle = shot.color;

    // Fading trail behind the shot.
    for (let i = 3; i >= 1; i--) {
      ctx.globalAlpha = fade * 0.18 * (4 - i);
      ctx.beginPath();
      ctx.ellipse(
        cx - shot.direction * i * 16,
        cy - shot.vy * i * 0.02,
        Math.max(2, shot.width / 2 - i * 4),
        Math.max(2, shot.height / 2 - i * 2),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.ellipse(cx, cy, shot.width / 2 * pulse, shot.height / 2 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(cx, cy, shot.width / 5, shot.height / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ---------- floating text like "GUARD BREAK!" ----------

function addPopup(text, x, y, color, size = 18) {
  popups.push({ text, x, y, color, size, life: 0.9 });
}

function updatePopups(dt) {
  for (const popup of popups) {
    popup.y -= 40 * dt;
    popup.life -= dt;
  }

  popups = popups.filter((popup) => popup.life > 0);
}

function drawPopups() {
  ctx.save();
  ctx.textAlign = "center";

  for (const popup of popups) {
    ctx.globalAlpha = Math.min(1, popup.life * 2);
    ctx.font = `${popup.size}px ${HUD_FONT}`;
    ctx.fillStyle = popup.color;
    ctx.shadowColor = popup.color;
    ctx.shadowBlur = 10;
    ctx.fillText(popup.text, popup.x, popup.y);
  }

  ctx.restore();
}
