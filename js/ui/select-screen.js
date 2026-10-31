// P2 mode picker (human / CPU difficulty).
"use strict";

const P2_MODE_KEY = "neonClash.p2Mode";

function loadP2Mode() {
  try {
    const saved = localStorage.getItem(P2_MODE_KEY);
    if (saved === "human" || CPU_LEVELS[saved]) p2Mode = saved;
  } catch (error) {}
}

function setP2Mode(mode) {
  p2Mode = mode;

  try {
    localStorage.setItem(P2_MODE_KEY, mode);
  } catch (error) {}

  updateP2Mode();
}

function updateP2Mode() {
  p2ModeButtons.forEach((button) => {
    const active = button.dataset.mode === p2Mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

p2ModeButtons.forEach((button) => {
  button.addEventListener("click", () => setP2Mode(button.dataset.mode));
});
