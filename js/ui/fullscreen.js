// Fullscreen — both buttons fullscreen the single arena box.
// The select overlay and the canvas are both inside it, so this works
// regardless of whether a fight is in progress or not.
"use strict";

async function toggleArenaFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await arena.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (err) {
    console.warn("Fullscreen unavailable:", err);
  }
}

fullscreenButton.addEventListener("click", toggleArenaFullscreen);
arenaFullscreen.addEventListener("click", toggleArenaFullscreen);

document.addEventListener("fullscreenchange", () => {
  const isFullscreen = !!document.fullscreenElement;
  const label = isFullscreen ? "Exit fullscreen" : "Enter fullscreen";

  fullscreenButton.title = label;
  fullscreenButton.setAttribute("aria-label", label);
  arenaFullscreen.title = label;
  arenaFullscreen.setAttribute("aria-label", label);
});
