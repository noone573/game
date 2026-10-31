// Starts the game once every script, fighter and map file has loaded.
"use strict";

window.addEventListener("DOMContentLoaded", () => {
  loadP2Mode();
  updateP2Mode();

  selectedP1 = "chicken";
  selectedP2 = "chicken";
  selectedMapId = "red-barn";
  currentMap = getMap(selectedMapId);

  createPlayers();
  loadSprites();

  requestAnimationFrame(gameLoop);
});
