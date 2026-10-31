// The computer opponent. It "presses" the same buttons a player would,
// so it can use every move, special and combo in a fighter's file.
"use strict";

// How each difficulty plays. All chances are 0-1.
//   think       seconds between decisions (lower = reacts faster)
//   block       chance to block an attack it sees coming
//   combo       chance to continue a combo after landing a hit
//   aggression  chance to attack when close instead of waiting
//   specials    chance to use special moves when it has the meter
//   antiAir     chance to punish a jumping opponent
//   punish      chance to hit back when the opponent misses or gets blocked
//   idle        chance to just stand around for a moment
const CPU_LEVELS = {
  easy:   { label: "EASY",   think: 0.5,  block: 0.15, combo: 0.25, aggression: 0.45, specials: 0.25, antiAir: 0.15, punish: 0.1, idle: 0.3 },
  normal: { label: "NORMAL", think: 0.26, block: 0.45, combo: 0.6,  aggression: 0.65, specials: 0.45, antiAir: 0.45, punish: 0.5, idle: 0.12 },
  hard:   { label: "HARD",   think: 0.12, block: 0.75, combo: 0.95, aggression: 0.8,  specials: 0.65, antiAir: 0.75, punish: 0.9, idle: 0.03 }
};

function chance(probability) {
  return Math.random() < probability;
}

function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

class CpuController {
  constructor(fighter, level) {
    this.fighter = fighter;
    this.levelName = CPU_LEVELS[level] ? level : "normal";
    this.level = CPU_LEVELS[this.levelName];

    // Virtual buttons being held, e.g. "right" or "block".
    this.held = new Set();

    this.reset();
  }

  reset() {
    this.held.clear();
    this.holdTimer = 0;
    this.thinkTimer = this.level.think;
    this.followUp = null;     // { move, delay, expires } — next move to press
    this.decidedFor = null;   // the move we already planned a follow-up for
    this.punishTarget = null; // the opponent move we already reacted to
    this.jumpingIn = false;
    this.crossing = 0;        // jumping over a void: -1 left, 1 right
  }

  get opponent() {
    return this.fighter.opponent;
  }

  // Space between the two bodies.
  gap() {
    return Math.abs(this.opponent.centerX - this.fighter.centerX) - this.fighter.width;
  }

  update(dt) {
    const me = this.fighter;

    if (!this.opponent || gameState !== "fighting" || me.health <= 0 || me.hitStun > 0) {
      this.held.clear();
      this.followUp = null;
      this.jumpingIn = false;
      this.crossing = 0;
      return;
    }

    // Jumping over a void: keep heading across and do nothing else until landing.
    if (this.crossing) {
      if (me.grounded && me.vy === 0) {
        this.crossing = 0;
      } else {
        this.held = new Set([this.crossing === 1 ? "right" : "left"]);
        this.holdTimer = 0.1;
        return;
      }
    }

    // In the air over a void: just steer for the floor (no attacks, no new plans).
    if (!me.grounded && voidAt(currentMap, me.centerX)) {
      this.watchForVoids();
      return;
    }

    // Spot a missed or blocked attack while still guarding.
    this.updatePunish();

    // Stuck in guard after blocking: keep the planned punish for when it ends.
    if (me.blockStun > 0) {
      if (this.followUp) this.followUp.delay -= dt;
      return;
    }

    // Let go of held buttons when their time is up.
    this.holdTimer -= dt;

    if (this.holdTimer <= 0) {
      this.held.clear();
    }

    this.updateFollowUp(dt);
    this.updateJumpIn();

    this.thinkTimer -= dt;

    if (this.thinkTimer <= 0) {
      // A little randomness so it doesn't feel robotic.
      this.thinkTimer = this.level.think * (0.7 + Math.random() * 0.6);
      this.think();
    }

    this.watchForVoids();
  }

  // ---------- voids ----------

  // Would a fighter at x, with feet at feetY, find something to stand on?
  groundAt(x, feetY) {
    return !voidAt(currentMap, x) || currentMap.platforms.some((platform) =>
      platform.y >= feetY - 1 && x > platform.x && x < platform.x + platform.width
    );
  }

  // Would this move's lunge carry us into a void? Moves that hop or fly
  // only need somewhere to land; ones that slide along the floor need the
  // whole way to be solid.
  safeMove(def) {
    const me = this.fighter;

    if (!def.lunge || !currentMap.voids.length) return true;

    const feetY = me.y + me.height;

    if (def.hop || !me.grounded) {
      return this.groundAt(this.landingX(def), feetY);
    }

    const travel = def.lunge * ((def.startup || 0) + (def.active || 0));

    return [0.25, 0.5, 0.75, 1].every((t) =>
      this.groundAt(me.centerX + me.facing * travel * t, feetY)
    );
  }

  // Where a hopping or diving move comes down, stepping through it the way
  // the fighter would move (lunging until the move's active part ends).
  landingX(def) {
    const me = this.fighter;
    const step = 1 / 60;
    const lungeTime = (def.startup || 0) + (def.active || 0);

    let x = me.centerX;
    let y = me.y + me.height;
    let vy = def.hop ? -def.hop : (def.dive && !me.grounded ? def.dive : me.vy);

    for (let t = 0; t < 3; t += step) {
      vy += GRAVITY * step;
      y += vy * step;

      if (t < lungeTime) x += me.facing * def.lunge * step;
      if (y >= FLOOR) break;
    }

    return x;
  }

  // Back against a void with the opponent close: jump over them to get out.
  escapeVoid() {
    const me = this.fighter;
    const behind = me.centerX - me.facing * 90;

    if (!me.grounded || me.onPlatform || this.gap() > 150) return false;
    if (this.groundAt(behind, me.y + me.height)) return false;
    if (!chance(0.25 + this.level.block * 0.6)) return false;

    this.hold([me.forwardAction], 0.8);
    me.pressAction("jump");

    return !me.grounded;
  }

  // Don't walk into a void: stop at the edge, or jump it when the opponent
  // is on the other side. Falling over one, steer back toward the floor.
  watchForVoids() {
    const me = this.fighter;
    const voids = currentMap.voids;

    if (!voids.length || me.pit) return;

    if (!me.grounded) {
      const gap = voids.find((g) => me.centerX > g.x && me.centerX < g.x + g.width);

      if (!gap || me.vy <= 0) return;

      // Head for the nearer side that has floor (screen edges have none).
      const leftFloor = gap.x > 0;
      const rightFloor = gap.x + gap.width < WIDTH;
      const nearerLeft = me.centerX - gap.x < gap.x + gap.width - me.centerX;
      const goLeft = leftFloor && (nearerLeft || !rightFloor);

      this.held.delete("left");
      this.held.delete("right");
      this.held.add(goLeft ? "left" : "right");
      return;
    }

    const dir = this.held.has("right") ? 1 : this.held.has("left") ? -1 : 0;
    const feetY = me.y + me.height;
    const ahead = me.centerX + dir * 36;

    if (!dir || this.groundAt(ahead, feetY)) return;

    const foe = this.opponent;
    const gap = voids.find((g) => ahead > g.x && ahead < g.x + g.width);
    const foeBeyond = (foe.centerX - me.centerX) * dir > 0;
    const hasFarSide = gap && gap.x > 0 && gap.x + gap.width < WIDTH;
    const jumpable = gap && gap.width < me.speed * 0.6;

    // Only jump when there's room to land: the opponent isn't standing at
    // the far edge or flying over the same void.
    const farEdge = gap && (dir === 1 ? gap.x + gap.width : gap.x);
    const roomToLand = gap &&
      (foe.centerX - farEdge) * dir > me.width * 2.5 &&
      !voidAt(currentMap, foe.centerX);

    if (foeBeyond && hasFarSide && jumpable && roomToLand && !me.move) {
      this.hold([dir === 1 ? "right" : "left"], 0.1);
      me.pressAction("jump");

      if (!me.grounded) this.crossing = dir;
    } else {
      this.held.delete("left");
      this.held.delete("right");
    }
  }

  // ---------- pressing buttons ----------

  hold(actions, seconds) {
    this.held = new Set(actions);
    this.holdTimer = seconds;
  }

  // Free to start an attack right now (not resting after the last move)?
  readyToAttack() {
    const me = this.fighter;

    return Boolean(me.move) || (me.attackCooldown <= 0 && me.mashLockout <= 0);
  }

  canUse(moveKey) {
    const me = this.fighter;
    const def = me.moves[moveKey];

    if (!this.readyToAttack()) return false;

    if (!def) return false;
    if (def.meterCost && me.meter < def.meterCost) return false;
    if (moveKey === "dropkick" && me.grounded) return false;
    if (!this.safeMove(def)) return false;

    return true;
  }

  // Holds the right direction / button and presses the right key for a move.
  perform(moveKey) {
    if (!this.canUse(moveKey)) return false;

    const me = this.fighter;
    const forward = me.forwardAction;
    const back = me.backAction;

    const [modifiers, button] = {
      punch: [[], "punch"],
      kick: [[], "kick"],
      uppercut: [["block"], "punch"],
      dropkick: [[], "kick"],
      disrupt: [[forward], "kick"],
      special: [[], "special"],
      specialUp: [["jump"], "special"],
      specialDown: [["block"], "special"],
      specialForward: [[forward], "special"],
      specialBack: [[back], "special"],
      specialPunch: [["punch"], "special"],
      specialKick: [["kick"], "special"]
    }[moveKey];

    this.hold(modifiers, 0.1);
    me.pressAction(button);

    return true;
  }

  // ---------- decisions ----------

  think() {
    const me = this.fighter;
    const foe = this.opponent;
    const level = this.level;

    // Busy with a move, or waiting for a plain SPECIAL to come out.
    if (me.move || me.specialBuffer > 0 || this.followUp || this.jumpingIn) return;

    const gap = this.gap();
    const forward = me.forwardAction;
    const back = me.backAction;

    // 1. Defend against something coming at us.
    const threat = this.incomingThreat(gap);

    if (threat && chance(level.block)) {
      if (threat === "projectile" && me.grounded && chance(0.35)) {
        this.hold([], 0);
        me.pressAction("jump");
      } else if (chance(0.15) && this.perform("specialBack")) {
        // escape / invincible move
      } else {
        this.hold(["block"], 0.3 + Math.random() * 0.25);
      }

      return;
    }

    // 2. Knock a jumping opponent out of the air.
    if (!foe.grounded && gap < 110 && chance(level.antiAir)) {
      if (chance(level.specials) && this.perform("specialUp")) return;
      if (this.perform("uppercut")) return;
    }

    // 3. Meter almost full: spend it on a special that fits the distance.
    if (me.meter >= 70 && chance(level.specials)) {
      const specials = gap > 140
        ? ["special", "specialForward", "specialDown"]
        : ["specialPunch", "specialKick", "specialDown", "specialUp"];
      const usable = specials.filter((key) => this.canUse(key));

      if (usable.length && this.perform(pickOne(usable))) return;
    }

    // 3b. Cornered against a void: get out.
    if (this.escapeVoid()) return;

    // 4. Sometimes just wait a moment.
    if (chance(level.idle)) {
      this.hold([], level.think);
      return;
    }

    // 5. Low on health: sometimes back off or escape.
    if (me.health < me.maxHealth * 0.3 && chance(0.2)) {
      if (chance(level.specials) && this.perform("specialBack")) return;
      this.hold([back], 0.3);
      return;
    }

    if (gap > 260) {
      this.farAway();
    } else if (gap > 85) {
      this.midRange(forward);
    } else {
      this.upClose(back);
    }
  }

  farAway() {
    const level = this.level;
    const forward = this.fighter.forwardAction;

    if (chance(level.specials) && this.perform("special")) return;
    if (chance(level.specials * 0.4) && this.perform("specialForward")) return;

    this.hold([forward], 0.4 + Math.random() * 0.3);
  }

  midRange(forward) {
    const me = this.fighter;
    const level = this.level;

    // Jump in and dropkick (if the landing spot isn't a void).
    const landing = me.centerX + me.facing * me.speed * 0.8;

    if (me.grounded && this.groundAt(landing, me.y + me.height) && chance(0.22 * level.aggression)) {
      this.hold([forward], 0.7);
      me.pressAction("jump");
      this.jumpingIn = true;
      return;
    }

    if (chance(level.specials * 0.35)) {
      const move = pickOne(["specialForward", "specialDown", "special"]);
      if (this.perform(move)) return;
    }

    this.hold([forward], 0.25 + Math.random() * 0.25);
  }

  upClose(back) {
    const me = this.fighter;
    const foe = this.opponent;
    const level = this.level;

    if (chance(level.aggression)) {
      // Blocking opponent: use something that breaks guard.
      if (foe.blocking) {
        const breakers = Object.keys(me.moves).filter((key) =>
          me.moves[key] && me.moves[key].guardBreak && this.canUse(key)
        );

        if (breakers.length && this.perform(pickOne(breakers))) return;
      }

      // Start one of this fighter's named combos.
      if (chance(level.combo)) {
        const combo = this.pickCombo();

        if (combo && this.perform(combo.sequence[0])) return;
      }

      const basics = ["punch", "punch", "kick", "uppercut", "disrupt"];

      if (chance(level.specials * 0.3)) basics.push("specialPunch", "specialKick");

      const options = basics.filter((key) => this.canUse(key));

      this.perform(options.length ? pickOne(options) : "punch");
      return;
    }

    // Not attacking: guard or step back.
    if (chance(0.5)) {
      this.hold(["block"], 0.3);
    } else {
      this.hold([back], 0.25);
    }
  }

  // A named combo this fighter can start right now.
  pickCombo() {
    const me = this.fighter;

    const usable = me.combos.filter((combo) => {
      const first = combo.sequence[0];
      const cost = combo.sequence.reduce((sum, key) =>
        sum + ((me.moves[key] && me.moves[key].meterCost) || 0), 0);

      return this.canUse(first) && first !== "dropkick" && cost <= me.meter;
    });

    return usable.length ? pickOne(usable) : null;
  }

  // "melee" if the opponent's attack could reach us, "projectile" if a shot
  // is flying our way, otherwise null.
  incomingThreat(gap) {
    const me = this.fighter;
    const foe = this.opponent;
    const move = foe.move;

    if (move && move.phase !== "recovery" && move.def.hitbox) {
      const box = move.def.hitbox;
      const reach = box.x + box.width + (move.def.lunge ? 140 : 0);
      const facingUs = (me.centerX - foe.centerX) * foe.facing > 0;

      if ((facingUs && gap < reach + 20) || move.def.teleport) return "melee";
    }

    for (const shot of projectiles) {
      if (shot.owner !== foe) continue;

      const comingAtUs = (me.centerX - shot.x) * shot.direction > 0;
      const distance = Math.abs(me.centerX - (shot.x + shot.width / 2));

      if (comingAtUs && distance < 260) return "projectile";
    }

    return null;
  }

  // ---------- combos ----------

  // After landing a hit, choose the next move of a combo and press it
  // after a short, human-like delay.
  updateFollowUp(dt) {
    const me = this.fighter;

    if (this.followUp) {
      this.followUp.delay -= dt;
      this.followUp.expires -= dt;

      if (this.followUp.delay <= 0 && this.readyToAttack()) {
        this.perform(this.followUp.move);
        this.followUp = null;
      } else if (this.followUp.expires <= 0) {
        this.followUp = null;
      }

      return;
    }

    const move = me.move;

    if (!move || !move.hasHit || this.decidedFor === move) return;

    // Let multi-hit moves finish all their hits first.
    if ((move.def.hits || 1) > move.hitCount && move.phase === "active") return;

    this.decidedFor = move;

    if (!chance(this.level.combo)) return;

    const next = this.nextComboMove();

    if (next) {
      const slowness = this.levelName === "easy" ? 2 : 1;
      this.followUp = { move: next, delay: (0.04 + Math.random() * 0.08) * slowness, expires: 1 };
    }
  }

  // Looks for a named combo whose start matches the end of our chain.
  nextComboMove() {
    const me = this.fighter;
    const chain = me.chain;
    let best = null;
    let bestLength = 0;

    for (const combo of me.combos) {
      const sequence = combo.sequence;

      for (let done = Math.min(chain.length, sequence.length - 1); done >= 1; done--) {
        const tail = chain.slice(chain.length - done);
        const matches = tail.every((key, i) => key === sequence[i]);

        if (matches && done > bestLength && this.canUse(sequence[done])) {
          best = sequence[done];
          bestLength = done;
        }
      }
    }

    if (best) return best;

    // No named combo fits: keep the pressure on with a basic hit.
    if (chain.length < 3 && chance(0.5)) {
      return pickOne(["punch", "kick"]);
    }

    return null;
  }

  // The opponent swung and missed (or got blocked) right next to us:
  // hit them while they recover. This is what makes mashing a bad idea.
  updatePunish() {
    const me = this.fighter;
    const move = this.opponent.move;

    if (me.move || this.followUp || !move || move.phase !== "recovery" || move.hasHit) return;
    if (this.punishTarget === move) return;

    this.punishTarget = move;

    if (this.gap() > 80 || !chance(this.level.punish)) return;

    const options = ["uppercut", "punch", "kick"].filter((key) => this.canUse(key));

    if (options.length) {
      this.followUp = { move: options[0], delay: this.level.think * 0.5, expires: 0.6 };
    }
  }

  // Jumping in: dropkick (or kick) once close enough in the air.
  updateJumpIn() {
    const me = this.fighter;

    if (!this.jumpingIn) return;

    if (me.grounded && me.vy === 0 && !me.move) {
      this.jumpingIn = false;
      return;
    }

    if (!me.grounded && !me.move && this.gap() < 100 && me.vy > -200) {
      if (!this.perform("dropkick")) this.perform("kick");
      this.jumpingIn = false;
    }
  }
}
