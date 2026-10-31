// A fighter in the arena: movement, jumping, platforms, moves and animation.
// How moves hit is in combat.js; the fallback drawing is in fighter-builtin.js.
"use strict";

class Fighter {
  constructor(data, x, controls, playerNumber) {
    this.data = data;
    this.name = data.name;
    this.color = data.color;
    this.dark = data.dark;
    this.accent = data.accent;
    this.glow = data.glow;
    this.moves = data.moves || {};
    this.combos = data.combos || [];

    this.startX = x;
    this.controls = controls;
    this.playerNumber = playerNumber;
    this.playerColor = PLAYER_COLORS[playerNumber];

    this.width = 48;
    this.height = 100;
    this.speed = data.speed;
    this.maxHealth = data.health || MAX_HEALTH;

    // Rounds won this match (reset() runs every round, so this lives here).
    this.wins = 0;
    this.opponent = null;

    // Set to a CpuController (ai.js) when the computer plays this fighter.
    this.cpu = null;

    this.reset();
  }

  reset() {
    this.x = this.startX;
    this.y = FLOOR - this.height;

    this.vx = 0;
    this.vy = 0;

    this.health = this.maxHealth;
    this.displayHealth = this.maxHealth; // trails behind health to show recent damage
    this.meter = 0;           // SPECIAL meter, fills when you hit or get hit
    this.facing = this.startX < WIDTH / 2 ? 1 : -1;

    this.grounded = true;
    this.dropThrough = 0;
    this.dropkickUsed = false;  // one dropkick per jump
    this.jumpCancelUsed = false; // one move-cancel-into-jump until you land
    this.doubleJumpUsed = false; // one free double jump after a jump cancel
    this.pit = null;          // the void being fallen into, if any
    this.fellOut = false;     // fell all the way down: lost the round

    // The move being performed right now (null when free).
    this.move = null;
    this.specialBuffer = 0;

    // Animation state
    this.animTime = Math.random() * 10;
    this.hurtTimer = 0;
    this.hitStun = 0;
    this.blockStun = 0;      // stuck in guard after blocking a hit
    this.blocking = false;
    this.koTimer = 0;

    // Input timing
    this.attackCooldown = 0; // wait after a move before the next attack
    this.mashLockout = 0;    // attack buttons ignored while > 0
    this.mashHintTimer = 0;   // keeps the "TOO EARLY" hint from spamming
    this.bufferedMove = null; // move pressed during a hit freeze, done right after
    this.bufferTimer = 0;

    // Combo state
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboDisplayTimer = 0;
    this.chain = [];          // moves that hit in a row, e.g. ["punch", "kick"]
    this.comboName = "";
    this.comboNameTimer = 0;

    // Separate movement from knockback.
    this.knockbackX = 0;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  // "left" or "right", depending on which way the fighter faces.
  get forwardAction() {
    return this.facing === 1 ? "right" : "left";
  }

  get backAction() {
    return this.facing === 1 ? "left" : "right";
  }

  // Is this action ("left", "block", "punch"...) being held right now?
  // Humans hold keyboard keys; the CPU holds virtual buttons.
  isHeld(action) {
    if (this.cpu) return this.cpu.held.has(action);

    return keys.has(this.controls[action]);
  }

  get onPlatform() {
    return this.grounded && this.y + this.height < FLOOR - 0.5;
  }

  canAct() {
    return gameState === "fighting" &&
      this.health > 0 &&
      this.hitStun <= 0 &&
      this.blockStun <= 0;
  }

  // Moves with `invincible: true` can't be hit until their recovery.
  isInvincible() {
    return Boolean(
      this.move &&
      this.move.def.invincible &&
      this.move.phase !== "recovery"
    );
  }

  // ---------- every frame ----------

  update(dt, opponent) {
    this.opponent = opponent;
    this.animTime += dt;

    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.hitStun = Math.max(0, this.hitStun - dt);
    this.blockStun = Math.max(0, this.blockStun - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.mashLockout = Math.max(0, this.mashLockout - dt);
    this.mashHintTimer = Math.max(0, this.mashHintTimer - dt);
    this.bufferTimer = Math.max(0, this.bufferTimer - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    this.comboDisplayTimer = Math.max(0, this.comboDisplayTimer - dt);
    this.comboNameTimer = Math.max(0, this.comboNameTimer - dt);
    this.dropThrough = Math.max(0, this.dropThrough - dt);

    if (this.comboTimer <= 0) {
      this.comboCount = 0;
      this.chain = [];
    }

    if (this.health <= 0) {
      this.koTimer += dt;
      this.move = null;
      this.specialBuffer = 0;
    }

    // SPECIAL pressed on its own: once the wait is over, do the plain special.
    if (this.specialBuffer > 0) {
      this.specialBuffer -= dt;

      if (this.specialBuffer <= 0) {
        this.startMove("special");
      }
    }

    // The white "recent damage" bar drains after the real health bar.
    this.displayHealth = Math.max(
      this.health,
      this.displayHealth - this.maxHealth * 0.45 * dt
    );

    // A move pressed during the hit freeze happens now.
    if (this.bufferedMove) {
      const key = this.bufferedMove;

      this.bufferedMove = null;

      if (this.bufferTimer > 0) {
        if (key.startsWith("special")) {
          this.startSpecial(key);
        } else {
          this.startMove(key);
        }
      }
    }

    // Always face the opponent while standing and not mid-move.
    if (this.health > 0 && gameState === "fighting" && !this.move) {
      this.facing = opponent.centerX > this.centerX ? 1 : -1;
    }

    // Holding the block key activates defense (and blocking a hit keeps you
    // in guard for a moment).
    this.blocking = this.blockStun > 0 || (
      this.canAct() &&
      this.isHeld("block") &&
      this.grounded &&
      !this.move &&
      this.specialBuffer <= 0
    );

    // Normal movement.
    let walk = 0;

    if (this.canAct() && !this.move && !this.blocking) {
      if (this.isHeld("left")) walk -= 1;
      if (this.isHeld("right")) walk += 1;
    }

    this.vx = walk * this.speed;
    this.x += this.vx * dt;

    this.updateMove(dt);

    // Knockback gradually slows down.
    this.x += this.knockbackX * dt;
    this.knockbackX *= Math.exp(-7 * dt);

    if (Math.abs(this.knockbackX) < 5) {
      this.knockbackX = 0;
    }

    this.updateVertical(dt);

    // Keep fighters inside the arena.
    this.x = Math.max(10, Math.min(WIDTH - this.width - 10, this.x));

    // Below the floor in a void: its sides are walls, no climbing back out.
    if (this.pit) {
      this.x = Math.max(this.pit.x, Math.min(this.pit.x + this.pit.width - this.width, this.x));
    }
  }

  updateVertical(dt) {
    // Already gone off the bottom of the screen.
    if (this.fellOut) return;

    const previousBottom = this.y + this.height;

    if (!this.grounded) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
    }

    const bottom = this.y + this.height;

    // Dropped below the floor through a void.
    if (bottom > FLOOR + 1 && !this.pit) {
      this.pit = currentMap.voids.find((gap) =>
        this.centerX > gap.x - this.width && this.centerX < gap.x + gap.width + this.width
      ) || null;
    }

    // Fell off the bottom of the screen: out of the round.
    if (this.y > HEIGHT + 400) {
      this.fellOut = true;
      this.health = 0;
      this.vy = 0;
      this.knockbackX = 0;
      return;
    }

    // Land on the floor (not over a void, and not from inside one).
    if (bottom >= FLOOR && previousBottom <= FLOOR + 1 && !voidAt(currentMap, this.centerX)) {
      this.y = FLOOR - this.height;
      this.vy = 0;
      this.grounded = true;
      this.dropkickUsed = false;
      this.jumpCancelUsed = false;
      this.doubleJumpUsed = false;
      return;
    }

    // Land on a platform (only when falling onto it from above).
    if (!this.grounded && this.vy >= 0 && this.dropThrough <= 0) {
      const platform = this.platformUnder(previousBottom, bottom);

      if (platform) {
        this.y = platform.y - this.height;
        this.vy = 0;
        this.grounded = true;
        this.dropkickUsed = false;
        this.jumpCancelUsed = false;
        this.doubleJumpUsed = false;
        return;
      }
    }

    // Walked off the edge of a platform, or onto a void.
    if (this.grounded && !this.platformUnder(bottom - 1, bottom + 1)) {
      this.grounded = false;
      this.vy = 0;
    }
  }

  platformUnder(fromY, toY) {
    return currentMap.platforms.find((platform) =>
      this.x + this.width > platform.x &&
      this.x < platform.x + platform.width &&
      fromY <= platform.y + 0.5 &&
      toY >= platform.y
    );
  }

  // ---------- button presses (from input.js, or from ai.js for the CPU) ----------

  // action: "left", "right", "jump", "block", "punch", "kick" or "special".
  pressAction(action) {
    // Pressed right after SPECIAL? Then it picks the special variant instead.
    if (this.completeSpecial(action)) return;

    // SPECIAL pressed during a hit freeze, then a second button: upgrade it.
    if (this.bufferedMove === "special" && this.specialVariantFor(action)) {
      this.bufferedMove = this.specialVariantFor(action);
      return;
    }

    if (action === "punch" || action === "kick" || action === "special") {
      const timing = this.attackTiming(action);

      // One press during the hit freeze is remembered; pressing again is mashing.
      if (timing === "buffer" && this.bufferedMove) {
        this.bufferedMove = null;
        this.mashLockout = MASH_LOCKOUT;
      } else if (timing === "buffer") {
        this.bufferMove(action);
        return;
      }

      if (timing === "early") {
        this.mashLockout = MASH_LOCKOUT;
      }

      // Still mashing: remind them now and then.
      if (this.mashLockout > 0 && this.mashHintTimer <= 0 && !this.cpu) {
        addPopup("TOO EARLY", this.centerX, this.y - 14, "#e8d5b5", 13);
        this.mashHintTimer = 0.8;
      }

      if (timing !== "ok") return;
    }

    if (action === "special") this.pressSpecial();
    if (action === "jump") this.jump();
    if (action === "punch") this.pressAttack("punch");
    if (action === "kick") this.pressAttack("kick");
  }

  jump() {
    if (!this.canAct()) return;

    if (!this.grounded) {
      // Cancel an active air move into a second jump (once per airtime).
      if (this.move && !this.jumpCancelUsed) {
        this.jumpCancelUsed = true;
        this.doubleJumpUsed = true;
        this.move = null;
        this.attackCooldown = 0;
        this.specialBuffer = 0;
        this.vy = -JUMP_SPEED;
        return;
      }

      // After a jump cancel, one free double jump so you can still attack in the air.
      if (this.jumpCancelUsed && !this.doubleJumpUsed) {
        this.doubleJumpUsed = true;
        this.vy = -JUMP_SPEED;
        return;
      }

      return;
    }

    // BLOCK + JUMP on a platform drops down through it.
    if (this.isHeld("block")) {
      if (this.onPlatform) {
        this.dropThrough = 0.25;
        this.grounded = false;
        this.vy = 60;
      }

      return;
    }

    this.vy = -JUMP_SPEED;
    this.grounded = false;
  }

  // Punch or kick, turned into a different move by what else is held.
  pressAttack(button) {
    this.startMove(this.attackFor(button));
  }

  attackFor(button) {
    if (button === "punch" && this.isHeld("block") && this.moves.uppercut) return "uppercut";
    // In the air, KICK is the dropkick, and only once until you land.
    if (button === "kick" && !this.grounded && this.moves.dropkick) {
      return this.dropkickUsed ? null : "dropkick";
    }
    if (button === "kick" && this.isHeld(this.forwardAction) && this.moves.disrupt) return "disrupt";

    return button;
  }

  // Pressed during a hit freeze: work out the move NOW, while the direction
  // or BLOCK is still held, and do it as soon as the freeze ends.
  bufferMove(action) {
    if (action === "special") {
      this.bufferedMove = this.heldSpecialVariant() || "special";
    } else if (this.bufferedMove === "special") {
      this.bufferedMove = this.specialVariantFor(action);
    } else {
      this.bufferedMove = this.attackFor(action);
    }

    this.bufferTimer = 0.2;
  }

  // SPECIAL + direction / punch / kick picks a special variant.
  // If nothing else is held yet, wait a moment (SPECIAL_BUFFER) in case
  // the player presses the second button right after.
  pressSpecial() {
    const variant = this.heldSpecialVariant();

    if (variant) {
      this.startSpecial(variant);
    } else {
      this.specialBuffer = SPECIAL_BUFFER;
    }
  }

  heldSpecialVariant() {
    if (this.isHeld("punch")) return "specialPunch";
    if (this.isHeld("kick")) return "specialKick";
    if (this.isHeld("jump")) return "specialUp";
    if (this.isHeld("block")) return "specialDown";
    if (this.isHeld(this.forwardAction)) return "specialForward";
    if (this.isHeld(this.backAction)) return "specialBack";

    return null;
  }

  // Which special variant a second button turns SPECIAL into (or null).
  specialVariantFor(action) {
    return {
      punch: "specialPunch",
      kick: "specialKick",
      jump: "specialUp",
      block: "specialDown",
      [this.forwardAction]: "specialForward",
      [this.backAction]: "specialBack"
    }[action] || null;
  }

  // While waiting after SPECIAL, another button picks the variant.
  // Returns true when the press was used up this way.
  completeSpecial(action) {
    if (this.specialBuffer <= 0) return false;

    const variant = this.specialVariantFor(action);

    if (!variant) return false;

    this.specialBuffer = 0;
    this.startSpecial(variant);

    return true;
  }

  // Empty special slots fall back to the plain special.
  startSpecial(variant) {
    this.startMove(this.moves[variant] ? variant : "special");
  }

  // ---------- moves ----------

  // Is now a good moment to press an attack?
  //   "ok"     - go
  //   "buffer" - the hit freeze is on; remember the press for right after
  //   "early"  - your move hasn't landed yet: that's mashing
  //   "ignore" - can't attack right now (stunned, locked out, missed the window)
  attackTiming(action) {
    if (gameState !== "fighting" || this.health <= 0) return "ignore";
    if (this.hitStun > 0 || this.blockStun > 0) return "ignore";

    if (this.mashLockout > 0) {
      this.mashLockout = MASH_LOCKOUT;
      return "ignore";
    }

    const move = this.move;

    // Still cooling down from the last move: pressing now counts as mashing.
    if (!move) return this.attackCooldown > 0 ? "early" : "ok";

    // Pressing PUNCH/KICK and SPECIAL together.
    if (action === "special" && move.age < 0.1 && !move.key.startsWith("special")) {
      return "ok";
    }

    if (move.hasHit) {
      if (hitstop > 0) return "buffer";
      return move.sinceHit <= CANCEL_WINDOW ? "ok" : "ignore";
    }

    return "early";
  }

  // Free to start a new move? A move that hit can be cancelled into the next
  // one during the cancel window (that's how combos chain), but only punches
  // and kicks can follow themselves, so no move can be repeated forever.
  // Specials can also cancel a move that only just started, so
  // PUNCH + SPECIAL together works.
  canStartMove(key) {
    const move = this.move;

    if (!move) return this.attackCooldown <= 0;

    if (move.hasHit && move.sinceHit <= CANCEL_WINDOW) {
      return key !== move.key || key === "punch" || key === "kick";
    }

    const isSpecial = key.startsWith("special");

    return isSpecial && move.age < 0.1 && !move.key.startsWith("special");
  }

  startMove(key) {
    const def = key && this.moves[key];

    // Empty move slot.
    if (!def) return;

    if (!this.canAct() || !this.canStartMove(key)) return;

    if (def.meterCost) {
      if (this.meter < def.meterCost) {
        addPopup("NEED METER", this.centerX, this.y - 14, "#e8d5b5", 14);
        return;
      }

      this.meter -= def.meterCost;
    }

    this.move = {
      key,
      def,
      phase: "startup",
      phaseTime: 0,
      age: 0,
      hasHit: false,   // landed a clean hit (allows cancelling)
      sinceHit: 0,     // seconds since that hit
      whiffed: false,
      hitCount: 0,
      rehitTimer: 0,
      fired: false,
      teleported: false
    };

    if (key === "dropkick") this.dropkickUsed = true;

    if (def.hop) {
      this.vy = -def.hop;
      this.grounded = false;
    }

    if (def.dive && !this.grounded) {
      this.vy = def.dive;
    }

    if (key.startsWith("special")) {
      createHitParticles(this.centerX, this.y + 40, this.color, 6);
    }
  }

  updateMove(dt) {
    const move = this.move;

    if (!move) return;

    const def = move.def;

    move.phaseTime += dt;
    move.age += dt;

    if (move.hasHit) move.sinceHit += dt;
    move.rehitTimer = Math.max(0, move.rehitTimer - dt);

    if (def.lunge && move.phase !== "recovery") {
      this.x += this.facing * def.lunge * dt;
    }

    if (move.phase === "startup" && move.phaseTime >= def.startup) {
      move.phase = "active";
      move.phaseTime = 0;

      if (def.teleport && !move.teleported) {
        move.teleported = true;
        this.teleport(def.teleport);
      }

      if (def.projectile && !move.fired) {
        move.fired = true;
        spawnProjectile(this, move.key, def);
      }
    }

    if (move.phase === "active") {
      const landed = def.endsOnLanding && this.grounded;

      if (move.phaseTime >= def.active || landed) {
        move.phase = "recovery";
        move.phaseTime = 0;

        // Swung and touched nothing: a little longer to recover.
        move.whiffed = Boolean(def.hitbox) && move.hitCount === 0;
      }
    }

    const recovery = def.recovery + (move.whiffed ? WHIFF_PENALTY : 0);

    if (move.phase === "recovery" && move.phaseTime >= recovery) {
      this.move = null;

      // Rest before the next attack (combos skip this by cancelling early).
      this.attackCooldown = def.cooldown ?? (
        move.key.startsWith("special") ? SPECIAL_COOLDOWN : ATTACK_COOLDOWN
      );
    }
  }

  // teleport: "behind" jumps to the other side of the opponent,
  // a number jumps that far backwards.
  teleport(where) {
    createHitParticles(this.centerX, this.y + 50, this.color, 14);

    const opponent = this.opponent;

    if (where === "behind" && opponent) {
      const fromLeft = this.centerX < opponent.centerX;

      this.x = fromLeft
        ? opponent.x + opponent.width + 8
        : opponent.x - this.width - 8;
      this.x = Math.max(10, Math.min(WIDTH - this.width - 10, this.x));
      this.facing = opponent.centerX > this.centerX ? 1 : -1;
    } else if (typeof where === "number") {
      this.x -= this.facing * where;
      this.x = Math.max(10, Math.min(WIDTH - this.width - 10, this.x));
    }

    createHitParticles(this.centerX, this.y + 50, this.accent, 14);
  }

  getHitbox() {
    const box = this.move.def.hitbox;

    return {
      x: this.facing === 1
        ? this.x + this.width + box.x
        : this.x - box.x - box.width,
      y: this.y + box.y,
      width: box.width,
      height: box.height
    };
  }

  tryHit(opponent) {
    const move = this.move;

    if (
      !move ||
      move.phase !== "active" ||
      !move.def.hitbox ||
      opponent.health <= 0 ||
      opponent.isInvincible()
    ) {
      return;
    }

    // Multi-hit moves (`hits: 3`) can land again after `hitInterval`.
    const maxHits = move.def.hits || 1;

    if (move.hitCount >= maxHits || move.rehitTimer > 0) return;

    if (!boxesOverlap(this.getHitbox(), opponent)) return;

    const isFollowUp = move.hitCount > 0;

    move.hitCount += 1;
    move.rehitTimer = move.def.hitInterval || 0.08;

    const result = applyHit(this, opponent, move.key, move.def, this.facing, isFollowUp);

    // Only clean hits can be cancelled into a combo - blocked ones can't.
    if (!result.blocked && !move.hasHit) {
      move.hasHit = true;
      move.sinceHit = 0;
    }
  }

  // ---------- drawing ----------

  // Picks which animation row and frame to show right now.
  getAnimation() {
    const loop = (name) => {
      const anim = SPRITE.animations[name];
      return {
        name,
        frame: Math.floor(this.animTime * anim.fps) % anim.frames
      };
    };

    if (this.health <= 0) {
      const frame = this.koTimer < 0.2 ? 0 : this.koTimer < 0.45 ? 1 : 2;
      return { name: "ko", frame };
    }

    if (this.blocking) {
      // Frame 1 = absorbing a hit; otherwise cycle both frames at a slow pace.
      const frame = this.hurtTimer > 0 ? 1 : Math.floor(this.animTime * 4) % 2;
      return { name: "block", frame };
    }

    if (this.hurtTimer > 0 || this.hitStun > 0) {
      return loop("hurt");
    }

    if (this.move) {
      const frame = { startup: 0, active: 1, recovery: 2 }[this.move.phase];
      return { name: this.move.key, frame };
    }

    if (!this.grounded) {
      const frame = this.vy < -150 ? 0 : this.vy < 150 ? 1 : 2;
      return { name: "jump", frame };
    }

    if (Math.abs(this.vx) > 1) {
      return loop("walk");
    }

    return loop("idle");
  }

  draw() {
    ctx.save();

    // Shadow under the fighter, on whatever they're standing above,
    // ringed in the player's color so P1 and P2 are easy to tell apart.
    const shadowY = this.shadowY();

    if (shadowY !== null) {
      ctx.fillStyle = "#1a0f0899";
      ctx.beginPath();
      ctx.ellipse(this.centerX, shadowY + 2, 37, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = this.playerColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Shake while frozen by a hit.
    if (hitstop > 0 && this.hurtTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3);
    }

    // Invincible moves flicker.
    if (this.isInvincible()) {
      ctx.globalAlpha = 0.55 + Math.sin(performance.now() / 30) * 0.25;
    }

    // From here on, (0, 0) is between the fighter's feet
    // and +x points the way the fighter is facing.
    ctx.translate(this.centerX, this.y + this.height);
    ctx.scale(this.facing, 1);

    const { name, frame } = this.getAnimation();
    const image = getSpriteFrame(this.data.id, name, frame);

    if (image) {
      this.drawSprite(image);
    } else {
      this.drawBuiltIn();
    }

    ctx.restore();

    this.drawPlayerTag();
  }

  // "P1" / "P2" (or "CPU") with an arrow, floating above the fighter's head.
  drawPlayerTag() {
    if (this.fellOut || this.health <= 0) return;

    const x = this.centerX;
    const y = this.y - 14;
    const label = this.cpu ? "CPU" : `P${this.playerNumber}`;

    ctx.save();
    ctx.fillStyle = this.playerColor;

    ctx.beginPath();
    ctx.moveTo(x - 8, y - 6);
    ctx.lineTo(x + 8, y - 6);
    ctx.lineTo(x, y + 4);
    ctx.closePath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1a0f08";
    ctx.stroke();
    ctx.fill();

    ctx.font = `18px ${HUD_FONT}`;
    ctx.textAlign = "center";
    outlinedText(label, x, y - 10, 4);
    ctx.restore();
  }

  // Where the shadow goes, or null over a void.
  shadowY() {
    const bottom = this.y + this.height;
    let best = voidAt(currentMap, this.centerX) || bottom > FLOOR + 1 ? null : FLOOR;

    for (const platform of currentMap.platforms) {
      const below = platform.y >= bottom - 1 && (best === null || platform.y < best);
      const under = this.centerX > platform.x && this.centerX < platform.x + platform.width;

      if (below && under) best = platform.y;
    }

    return best;
  }

  drawSprite(image) {
    const frameSize = image.naturalWidth;
    const size = SPRITE.displaySize * (this.data.spriteScale || 1);

    // Small frames are pixel art: keep the pixels crisp.
    ctx.imageSmoothingEnabled = frameSize >= size;

    // Same animal on both sides? Glow in the player's color instead.
    ctx.shadowColor = this.opponent && this.opponent.data === this.data
      ? this.playerColor
      : this.color;
    ctx.shadowBlur = this.opponent && this.opponent.data === this.data ? 16 : 12;

    if (this.hurtTimer > 0) {
      ctx.filter = "brightness(1.9)";
    }

    ctx.drawImage(
      image,
      -size * SPRITE.anchorX,
      -size * SPRITE.anchorY,
      size,
      size
    );

    ctx.filter = "none";
  }
}
