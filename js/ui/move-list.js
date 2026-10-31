// Lists both fighters' moves and combos under the arena.
"use strict";

const KEY_SYMBOLS = {
  arrowleft: "←",
  arrowright: "→",
  arrowup: "↑",
  arrowdown: "↓"
};

function keyName(key) {
  return KEY_SYMBOLS[key] || key.toUpperCase();
}

// The buttons that perform a move, for one player's controls.
function moveInput(moveKey, c) {
  const special = keyName(c.special);

  return {
    punch: keyName(c.punch),
    kick: keyName(c.kick),
    uppercut: `${keyName(c.block)} + ${keyName(c.punch)}`,
    dropkick: `AIR ${keyName(c.kick)}`,
    disrupt: `FWD + ${keyName(c.kick)}`,
    special,
    specialUp: `${keyName(c.jump)} + ${special}`,
    specialDown: `${keyName(c.block)} + ${special}`,
    specialForward: `FWD + ${special}`,
    specialBack: `BACK + ${special}`,
    specialPunch: `${special} + ${keyName(c.punch)}`,
    specialKick: `${special} + ${keyName(c.kick)}`
  }[moveKey];
}

function moveColumn(fighter) {
  const moves = MOVE_ORDER.map((key) => {
    const def = fighter.moves[key];
    const name = def ? def.name || MOVE_LABELS[key] : "empty slot";
    const cost = def && def.meterCost ? ` <em>${def.meterCost} METER</em>` : "";

    return `
      <li class="${def ? "" : "empty"}">
        <span class="move-input">${moveInput(key, fighter.controls)}</span>
        <span class="move-type">${MOVE_LABELS[key]}</span>
        <span class="move-name">${name}${cost}</span>
      </li>`;
  }).join("");

  const combos = fighter.combos.length
    ? fighter.combos.map((combo) => `
        <li>
          <span class="move-name">${combo.name}</span>
          <span class="combo-seq">${combo.sequence.map((key) => MOVE_LABELS[key] || key).join(" → ")}</span>
          <em>+${combo.bonusDamage || 0}</em>
        </li>`).join("")
    : '<li class="empty"><span class="move-name">No combos yet — add them in the fighter file</span></li>';

  return `
    <div class="move-column" style="--fighter-color:${fighter.color}">
      <h3>P${fighter.playerNumber} · ${fighter.name}${fighter.cpu ? ` <small>CPU · ${fighter.cpu.level.label}</small>` : ""}</h3>
      <ul class="moves">${moves}</ul>
      <h4>COMBOS</h4>
      <ul class="combos">${combos}</ul>
    </div>`;
}

function renderMoveList() {
  moveListPanel.innerHTML = moveColumn(player1) + moveColumn(player2);
  p2ControlsHint.classList.toggle("cpu-controlled", Boolean(player2.cpu));
}
