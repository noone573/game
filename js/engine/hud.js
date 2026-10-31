// Health bars, meters, round pips, timer, combo text and big announcements.
"use strict";

// The HUD is laid out for a 960 x 540 screen and scaled up to the arena size,
// so it stays the same size on screen however big the arena is.
const HUD_WIDTH = 960;
const HUD_HEIGHT = 540;
const HUD_SCALE = WIDTH / HUD_WIDTH;

// Text with a dark outline so it stays readable on bright skies.
function outlinedText(text, x, y, lineWidth = 4) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#1a0f08";
  ctx.strokeText(text, x, y);
  ctx.restore();
  ctx.fillText(text, x, y);
}

function drawHealthBar(fighter, x, y, width, flip) {
  const height = 23;

  ctx.fillStyle = "#2a1a0e";
  ctx.fillRect(x, y, width, height);

  // Fills grow from the outside edge toward the middle of the screen.
  // `amount` is health, drawn as a share of the fighter's max health.
  const fillRect = (amount, top, barHeight) => {
    const share = Math.max(0, Math.min(1, amount / fighter.maxHealth));
    const fillWidth = width * share;
    ctx.fillRect(flip ? x + width - fillWidth : x, top, fillWidth, barHeight);
  };

  // Recent damage shows as a white strip that drains away.
  ctx.fillStyle = "#ffffffcc";
  fillRect(fighter.displayHealth, y, height);

  // Low health turns the bar red.
  ctx.fillStyle = fighter.health <= fighter.maxHealth * 0.25 ? "#ff4d5e" : fighter.color;
  fillRect(fighter.health, y, height);

  ctx.strokeStyle = "#9a7650";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // SPECIAL meter under the health bar.
  const meterY = y + height + 5;
  const meterWidth = width * 0.6;
  const meterX = flip ? x + width - meterWidth : x;

  ctx.fillStyle = "#2a1a0e";
  ctx.fillRect(meterX, meterY, meterWidth, 7);

  ctx.save();
  ctx.fillStyle = fighter.accent;

  if (fighter.meter >= 50) {
    ctx.shadowColor = fighter.color;
    ctx.shadowBlur = 10 + Math.sin(performance.now() / 120) * 5;
  }

  const meterFill = meterWidth * fighter.meter / MAX_METER;
  ctx.fillRect(flip ? meterX + meterWidth - meterFill : meterX, meterY, meterFill, 7);
  ctx.restore();

  // Half-way mark: one special costs 50 by default.
  ctx.fillStyle = "#9a7650";
  ctx.fillRect(meterX + meterWidth / 2 - 1, meterY, 2, 7);

  ctx.fillStyle = "#ffffff";
  ctx.font = `14px ${HUD_FONT}`;
  ctx.textAlign = flip ? "left" : "right";
  outlinedText(`${Math.ceil(fighter.health)} HP`, flip ? x : x + width, y - 7, 3);
}

// Small diamonds under the health bar: one per round won.
function drawRoundPips(fighter, x, y, flip) {
  for (let i = 0; i < ROUNDS_TO_WIN; i++) {
    const px = flip ? x - i * 22 : x + i * 22;
    const won = i < fighter.wins;

    ctx.save();
    ctx.translate(px, y);
    ctx.rotate(Math.PI / 4);

    ctx.fillStyle = won ? "#ffe08a" : "#2a1a0e";
    ctx.strokeStyle = won ? "#ffe08a" : "#9a7650";
    ctx.shadowColor = "#ffe08a";
    ctx.shadowBlur = won ? 10 : 0;

    ctx.fillRect(-5, -5, 10, 10);
    ctx.strokeRect(-5, -5, 10, 10);

    ctx.restore();
  }
}

// Show combo text while the combo is active.
function drawCombo(fighter, x) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = fighter.color;
  ctx.shadowColor = fighter.color;
  ctx.shadowBlur = 14;

  if (fighter.comboCount >= 2 && fighter.comboDisplayTimer > 0) {
    ctx.font = `28px ${HUD_FONT}`;
    outlinedText(`${fighter.comboCount} HIT COMBO!`, x, 135, 5);
  }

  if (fighter.comboNameTimer > 0) {
    const pop = 1 + Math.max(0, fighter.comboNameTimer - 1.4) * 2;

    ctx.globalAlpha = Math.min(1, fighter.comboNameTimer * 2);
    ctx.fillStyle = "#ffe08a";
    ctx.shadowColor = "#ffe08a";
    ctx.font = `${Math.round(36 * pop)}px ${HUD_FONT}`;
    outlinedText(fighter.comboName, x, 172, 6);
  }

  ctx.restore();
}

function drawHUD() {
  ctx.save();
  ctx.scale(HUD_SCALE, HUD_SCALE);

  drawHealthBar(player1, 40, 45, 350, false);
  drawHealthBar(player2, 570, 45, 350, true);

  drawRoundPips(player1, 46, 98, false);
  drawRoundPips(player2, 914, 98, true);

  ctx.font = `20px ${HUD_FONT}`;

  ctx.textAlign = "left";
  ctx.fillStyle = player1.color;
  outlinedText(player1.name, 40, 32);

  ctx.textAlign = "right";
  ctx.fillStyle = player2.color;
  outlinedText(player2.name, 920, 32);

  // Tag the computer-controlled side.
  for (const [fighter, x, align] of [[player1, 40, "left"], [player2, 920, "right"]]) {
    if (!fighter.cpu) continue;

    const nameWidth = ctx.measureText(fighter.name).width;

    ctx.save();
    ctx.font = `12px ${HUD_FONT}`;
    ctx.textAlign = align;
    ctx.fillStyle = "#e8d5b5";
    outlinedText(
      `CPU · ${fighter.cpu.level.label}`,
      align === "left" ? x + nameWidth + 10 : x - nameWidth - 10,
      31,
      3
    );
    ctx.restore();
  }

  // Round clock between the bars.
  const seconds = Math.ceil(roundTimer);

  ctx.textAlign = "center";
  ctx.fillStyle = seconds <= 10 ? "#ff4d5e" : "#ffffff";
  ctx.font = `40px ${HUD_FONT}`;
  outlinedText(String(seconds).padStart(2, "0"), HUD_WIDTH / 2, 70, 6);

  ctx.fillStyle = "#e8d5b5";
  ctx.font = `12px ${HUD_FONT}`;
  outlinedText(`ROUND ${round}`, HUD_WIDTH / 2, 88, 3);

  drawCombo(player1, 220);
  drawCombo(player2, 740);

  ctx.restore();
}

function drawOverlay(title, subtitle, color, dim = true) {
  if (dim) {
    ctx.fillStyle = "#1a0f08b0";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.save();
  ctx.scale(HUD_SCALE, HUD_SCALE);

  ctx.textAlign = "center";

  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
  ctx.fillStyle = color;
  ctx.font = `72px ${HUD_FONT}`;
  outlinedText(title, HUD_WIDTH / 2, 230, 8);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = `22px ${HUD_FONT}`;
  outlinedText(subtitle, HUD_WIDTH / 2, 272, 4);

  ctx.restore();
}
