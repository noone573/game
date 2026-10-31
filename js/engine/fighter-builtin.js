// The original shape-based fighter look. Used for any fighter whose
// sprite sheet (assets/characters/<id>/sprites.png) is missing.
"use strict";

// Special moves borrow the pose of a similar basic move.
const BUILT_IN_POSES = {
  specialUp: "uppercut",
  specialDown: "special",
  specialForward: "punch",
  specialBack: "disrupt",
  specialPunch: "punch",
  specialKick: "kick"
};

Fighter.prototype.drawBuiltIn = function drawBuiltIn() {
  const id = this.data.id;
  const moveKey = this.move ? (BUILT_IN_POSES[this.move.key] || this.move.key) : "";
  const phase = this.move ? this.move.phase : "";
  const striking = phase === "active" || phase === "recovery";

  // Smooth idle breathing and walking bounce.
  const walking = Math.abs(this.vx) > 1;

  const bob = this.grounded && !this.move
    ? Math.sin(this.animTime * (walking ? 13 : 3)) * (walking ? 3 : 1.5)
    : 0;

  // Knocked out fighters tip over backwards.
  if (this.health <= 0) {
    ctx.rotate(-Math.min(1, this.koTimer / 0.45) * Math.PI / 2);
  }

  // Dropkick: lean way back with the feet out front.
  if (moveKey === "dropkick" && phase !== "recovery") {
    ctx.translate(0, -50);
    ctx.rotate(-0.95);
    ctx.translate(0, 50);
  }

  ctx.translate(0, -this.height + bob);

  // Glow effect.
  ctx.shadowColor = this.color;
  ctx.shadowBlur = this.hurtTimer > 0 ? 25 : 14;

  // Cape / back silhouette.
  ctx.fillStyle = this.dark;
  ctx.beginPath();

  if (id === "nova") {
    ctx.moveTo(-18, 35);
    ctx.lineTo(-30, 57);
    ctx.lineTo(-24, 94);
    ctx.lineTo(0, 78);
    ctx.lineTo(18, 94);
    ctx.lineTo(22, 43);
  } else if (id === "phantom") {
    ctx.moveTo(-18, 35);
    ctx.lineTo(-34, 58);
    ctx.lineTo(-25, 96);
    ctx.lineTo(0, 82);
    ctx.lineTo(18, 67);
    ctx.lineTo(20, 40);
  } else {
    ctx.moveTo(-18, 35);
    ctx.lineTo(-27, 64);
    ctx.lineTo(-20, 95);
    ctx.lineTo(0, 78);
    ctx.lineTo(19, 95);
    ctx.lineTo(19, 37);
  }

  ctx.closePath();
  ctx.fill();

  // Legs.
  ctx.fillStyle = this.color;
  ctx.fillRect(-17, 65, 14, 30);
  ctx.fillRect(4, 65, 14, 30);

  // Boots.
  ctx.fillStyle = "#11172a";
  ctx.fillRect(-21, 88, 21, 10);
  ctx.fillRect(1, 88, 21, 10);

  // Body armor.
  ctx.fillStyle = this.hurtTimer > 0 ? "#ffffff" : this.color;
  ctx.beginPath();

  if (id === "volt") {
    ctx.moveTo(-20, 29);
    ctx.lineTo(0, 35);
    ctx.lineTo(20, 29);
    ctx.lineTo(14, 68);
    ctx.lineTo(-14, 68);
  } else if (id === "nova") {
    ctx.moveTo(-23, 30);
    ctx.lineTo(0, 24);
    ctx.lineTo(23, 30);
    ctx.lineTo(17, 68);
    ctx.lineTo(-17, 68);
  } else {
    ctx.moveTo(-21, 30);
    ctx.lineTo(20, 30);
    ctx.lineTo(16, 68);
    ctx.lineTo(-16, 68);
  }

  ctx.closePath();
  ctx.fill();

  // Chest emblem.
  ctx.shadowBlur = 0;
  ctx.fillStyle = this.dark;
  ctx.fillRect(-10, 40, 20, 15);

  ctx.fillStyle = this.accent;

  if (id === "volt") {
    ctx.beginPath();
    ctx.moveTo(3, 40);
    ctx.lineTo(-4, 49);
    ctx.lineTo(1, 49);
    ctx.lineTo(-3, 56);
    ctx.lineTo(7, 46);
    ctx.lineTo(2, 46);
    ctx.closePath();
    ctx.fill();
  } else if (id === "nova") {
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(4, 46);
    ctx.lineTo(10, 48);
    ctx.lineTo(4, 51);
    ctx.lineTo(0, 57);
    ctx.lineTo(-4, 51);
    ctx.lineTo(-10, 48);
    ctx.lineTo(-4, 46);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-6, 44, 12, 3);
    ctx.fillRect(-3, 49, 6, 3);
  }

  // Head.
  ctx.shadowColor = this.color;
  ctx.shadowBlur = 12;

  ctx.fillStyle = "#dce9ff";
  ctx.fillRect(-14, 5, 28, 26);

  // Different helmet designs.
  if (id === "volt") {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-14, 9);
    ctx.lineTo(-20, 1);
    ctx.lineTo(-5, 7);
    ctx.lineTo(4, 3);
    ctx.lineTo(15, 0);
    ctx.lineTo(12, 12);
    ctx.closePath();
    ctx.fill();
  } else if (id === "nova") {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-15, 12);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-6, 7);
    ctx.lineTo(0, -3);
    ctx.lineTo(7, 7);
    ctx.lineTo(20, 0);
    ctx.lineTo(14, 15);
    ctx.closePath();
    ctx.fill();
  } else if (id === "phantom") {
    ctx.fillStyle = this.dark;
    ctx.beginPath();
    ctx.moveTo(-14, 5);
    ctx.lineTo(14, 5);
    ctx.lineTo(10, 32);
    ctx.lineTo(0, 39);
    ctx.lineTo(-10, 32);
    ctx.closePath();
    ctx.fill();
  }

  // Visor.
  ctx.fillStyle = this.dark;
  ctx.fillRect(-12, 12, 24, 9);

  ctx.fillStyle = this.accent;
  ctx.fillRect(-8, 15, 16, 3);

  // Front arm: changes with the move being performed.
  ctx.fillStyle = this.color;

  if (this.blocking) {
    // Guard pose: both arms raised in front of the body.
    ctx.save();
    ctx.rotate(-0.12);
    ctx.fillRect(8, 25, 13, 28);
    ctx.fillRect(19, 25, 13, 25);
    ctx.fillStyle = this.accent;
    ctx.fillRect(14, 23, 17, 8);
    ctx.restore();
  } else if (moveKey === "punch") {
    const reach = striking ? 12 : 0;
    ctx.fillRect(12, 33, 30 + reach, 12);
    ctx.fillRect(39 + reach, 31, 15, 15);
  } else if (moveKey === "uppercut") {
    if (striking) {
      // Fist straight up.
      ctx.fillRect(10, -12, 12, 48);
      ctx.fillStyle = this.accent;
      ctx.fillRect(8, -24, 16, 15);
    } else {
      // Fist pulled low, ready to rise.
      ctx.fillRect(10, 44, 12, 22);
      ctx.fillRect(14, 62, 14, 12);
    }
  } else if (moveKey === "disrupt") {
    // Two-handed shove.
    const reach = striking ? 14 : -4;
    ctx.fillRect(12, 30, 26 + reach, 11);
    ctx.fillRect(12, 46, 26 + reach, 11);
    ctx.fillStyle = this.accent;
    ctx.fillRect(36 + reach, 27, 8, 33);
  } else if (moveKey === "special") {
    // Arm out, hand glowing while it charges.
    ctx.fillRect(12, 33, 34, 12);

    if (phase === "startup") {
      ctx.fillStyle = this.accent;
      ctx.shadowColor = this.accent;
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(52, 39, 8 + this.move.phaseTime * 30, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Idle arm movement.
    const armSwing = Math.sin(this.animTime * 5) * 2;
    ctx.fillRect(12, 34 + armSwing, 12, 30);
  }

  // Back arm.
  ctx.fillStyle = this.color;
  ctx.fillRect(-23, 35, 12, 25);

  // Glowing blade ornament for Volt and Nova.
  if (id === "volt" || id === "nova") {
    ctx.fillStyle = this.accent;
    ctx.shadowColor = this.accent;
    ctx.shadowBlur = 14;
    ctx.fillRect(-29, 43, 5, 36);
  }

  // Kicking leg.
  if (moveKey === "kick" || moveKey === "dropkick") {
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;

    const reach = striking || moveKey === "dropkick" ? 0 : -18;

    ctx.fillRect(3, 63, 48 + reach, 12);
    ctx.fillRect(41 + reach, 59, 15, 20);

    if (moveKey === "dropkick") {
      // Both feet out.
      ctx.fillRect(3, 78, 44, 11);
      ctx.fillRect(39, 75, 14, 17);
    }
  }
};
