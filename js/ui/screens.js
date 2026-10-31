// Switching between the select overlay and the active fight.
"use strict";

startFightButton.addEventListener("click", startMatch);
rematchButton.addEventListener("click", startMatch);

function showCharacterSelect() {
  gameState = "menu";
  paused = false;
  keys.clear();

  matchOverlay.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  moveListPanel.classList.add("hidden");
  selectScreen.classList.remove("hidden");

  updateP2Mode();
}

function setPaused(value) {
  paused = value;
  pauseOverlay.classList.toggle("hidden", !paused);
}

// Resume button inside the pause overlay
resumeButton.addEventListener("click", () => setPaused(false));

// Main Menu button inside the pause overlay
mainMenuButton.addEventListener("click", showCharacterSelect);

if (changeFightersButton) {
  changeFightersButton.addEventListener("click", showCharacterSelect);
}
