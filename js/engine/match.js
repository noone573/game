// A match from start to finish: rounds, the per-frame update and draw, and the main loop.
"use strict";

function createPlayers() {
  player1 = new Fighter(getFighterData(selectedP1), 500, P1_CONTROLS, 1);
  player2 = new Fighter(getFighterData(selectedP2), WIDTH - 620, P2_CONTROLS, 2);

  player1.opponent = player2;
  player2.opponent = player1;

  // Player 2 can be the computer (picked on the select screen).
  if (p2Mode !== "human") {
    player2.cpu = new CpuController(player2, p2Mode);
  }

  // These DOM refs are null in the single-box layout — guard them.
  if (gameP1Name) gameP1Name.textContent = player1.name;
  if (gameP2Name) gameP2Name.textContent = player2.cpu ? `${player2.name} (CPU)` : player2.name;
}

function startMatch() {
  currentMap = getMap(selectedMapId);
  createPlayers();

  round = 1;
  winner = "";
  paused = false;

  renderMoveList();
  moveListPanel.classList.remove("hidden");

  matchOverlay.classList.add("hidden");
  selectScreen.classList.add("hidden");

  startRound();
}

function startRound() {
  player1.reset();
  player2.reset();

  for (const fighter of [player1, player2]) {
    if (fighter.cpu) fighter.cpu.reset();
  }

  keys.clear();
  particles = [];
  projectiles = [];
  popups = [];
  screenShake = 0;
  hitstop = 0;
  camera = { x: WIDTH / 2, y: HEIGHT / 2, scale: 1 };
  roundTimer = ROUND_TIME;
  countdown = 2.5;
  gameState = "countdown";
}

function playerLabel(fighter) {
  return fighter.cpu ? "CPU" : `PLAYER ${fighter.playerNumber}`;
}

// Called when someone is knocked out or the clock hits zero.
function finishRound() {
  const knockout = player1.health <= 0 || player2.health <= 0;

  let roundWinner = null;

  if (player1.health > player2.health) roundWinner = player1;
  if (player2.health > player1.health) roundWinner = player2;

  if (roundWinner) {
    roundWinner.wins += 1;
  }

  roundMessage = player1.fellOut || player2.fellOut
    ? "INTO THE VOID!"
    : knockout ? "K.O.!" : "TIME!";
  roundWinnerName = roundWinner
    ? `${playerLabel(roundWinner)} (${roundWinner.name}) TAKES ROUND ${round}`
    : "DRAW — NO POINT";

  roundOverTimer = 2.6;
  gameState = "roundOver";
}

function endMatch() {
  const w = player1.wins > player2.wins ? player1 : player2;

  winner = playerLabel(w);

  gameState = "over";

  winnerText.textContent = `${playerLabel(w)} (${w.name}) WINS!`;
  matchOverlay.classList.remove("hidden");
}

// Stop fighters from walking through each other.
// (They can still jump over, since the bodies stop overlapping in the air.)
function separateFighters() {
  const minX = 10;
  const maxX = WIDTH - player1.width - 10;

  const verticalOverlap =
    player1.y < player2.y + player2.height &&
    player2.y < player1.y + player1.height;

  if (!verticalOverlap) return;

  const overlap =
    Math.min(player1.x + player1.width, player2.x + player2.width) -
    Math.max(player1.x, player2.x);

  if (overlap <= 0) return;

  // Push each fighter half the overlap, away from the other.
  const left = player1.centerX <= player2.centerX ? player1 : player2;
  const right = left === player1 ? player2 : player1;

  // Bodies don't shove each other into a void: whoever is over one, or
  // would be pushed over one, stays put and the other takes the whole push.
  const pushedIn = (fighter, dx) =>
    voidAt(currentMap, fighter.centerX) || voidAt(currentMap, fighter.centerX + dx);

  let leftShare = overlap / 2;

  if (pushedIn(left, -leftShare)) leftShare = 0;
  else if (pushedIn(right, overlap - leftShare)) leftShare = overlap;

  left.x = Math.max(minX, left.x - leftShare);
  right.x = Math.min(maxX, right.x + overlap - leftShare);

  // If one is pinned against a wall, the other takes the rest of the push.
  right.x = Math.max(right.x, left.x + left.width);
  left.x = Math.min(left.x, right.x - left.width);
}

function update(dt) {
  if (paused) return;

  // Hit freeze: fighters and shots hold still, sparks keep flying.
  if (hitstop > 0) {
    hitstop -= dt;
    updateParticles(dt);
    updatePopups(dt);
    return;
  }

  if (gameState === "countdown") {
    countdown -= dt;

    if (countdown <= 0) {
      gameState = "fighting";
    }
  }

  if (gameState === "fighting") {
    // The CPU picks its buttons before the fighters move.
    if (player1.cpu) player1.cpu.update(dt);
    if (player2.cpu) player2.cpu.update(dt);

    player1.update(dt, player2);
    player2.update(dt, player1);
    separateFighters();

    player1.tryHit(player2);
    player2.tryHit(player1);
    updateProjectiles(dt);

    roundTimer = Math.max(0, roundTimer - dt);

    if (
      player1.health <= 0 ||
      player2.health <= 0 ||
      roundTimer <= 0
    ) {
      finishRound();
    }
  } else if (gameState === "roundOver") {
    // Slow motion right after a K.O.
    const slowMo = roundOverTimer > 1.8 ? 0.3 : 1;

    player1.update(dt * slowMo, player2);
    player2.update(dt * slowMo, player1);
    separateFighters();

    roundOverTimer -= dt;

    if (roundOverTimer <= 0) {
      if (
        player1.wins >= ROUNDS_TO_WIN ||
        player2.wins >= ROUNDS_TO_WIN
      ) {
        endMatch();
      } else {
        round += 1;
        startRound();
      }
    }
  }

  updateParticles(dt);
  updatePopups(dt);

  screenShake = Math.max(0, screenShake - 25 * dt);
}

function draw() {
  ctx.save();

  if (screenShake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake
    );
  }

  drawArena(ctx, currentMap);

  if (player1 && player2) {
    player1.draw();
    player2.draw();
  }

  drawProjectiles();
  drawParticles();
  drawPopups();

  if (player1 && player2) {
    drawHUD();
  }

  ctx.restore();

  if (gameState === "countdown") {
    const isFinal =
      player1.wins === ROUNDS_TO_WIN - 1 &&
      player2.wins === ROUNDS_TO_WIN - 1;

    drawOverlay(
      countdown > 1 ? (isFinal ? "FINAL ROUND" : `ROUND ${round}`) : "FIGHT!",
      `FIRST TO ${ROUNDS_TO_WIN} ROUNDS WINS`,
      countdown > 1 ? "#ffffff" : "#ffe08a"
    );

    if (countdown > 1) {
      ctx.save();
      ctx.scale(HUD_SCALE, HUD_SCALE);
      ctx.fillStyle = "#e2533f";
      ctx.font = `70px ${HUD_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(Math.ceil(countdown - 1), HUD_WIDTH / 2, 360);
      ctx.restore();
    }
  }

  if (gameState === "roundOver") {
    drawOverlay(roundMessage, roundWinnerName, "#ff4d5e", false);
  }
}

let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.033);

  lastTime = timestamp;

  // Only run the fight logic when a match is actually in progress.
  if (gameState !== "menu") {
    update(dt);
    draw();
  }

  requestAnimationFrame(gameLoop);
}
