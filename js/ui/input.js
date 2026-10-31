// Keyboard controls for both players.
"use strict";

window.addEventListener("keydown", (event) => {
  // Don't treat typing in the map maker's text boxes as fighting.
  if (event.target.closest && event.target.closest("input, textarea, select")) {
    return;
  }

  const key = event.key.toLowerCase();

  if (
    gameState !== "menu" &&
    ["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(key)
  ) {
    event.preventDefault();
  }

  // Prevent holding a key from repeatedly triggering punches.
  if (keys.has(key)) return;

  keys.add(key);

  if ((key === "escape" || key === "p") && gameState === "fighting") {
    setPaused(!paused);
    return;
  }

  if (gameState !== "fighting" || paused) return;

  for (const fighter of [player1, player2]) {
    // The CPU ignores the keyboard.
    if (fighter.cpu) continue;

    const action = actionForKey(fighter, key);

    if (action) fighter.pressAction(action);
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => {
  keys.clear();
});

// Which action ("punch", "left"...) a key is for this fighter, if any.
function actionForKey(fighter, key) {
  return Object.keys(fighter.controls).find((action) => fighter.controls[action] === key);
}
