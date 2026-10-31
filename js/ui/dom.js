// References to the page elements the scripts use.
"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

// The single arena box (used for fullscreen)
const arena = document.getElementById("arenaBox");

// Overlays inside the arena box
const selectScreen = document.getElementById("selectScreen");  // select overlay
const gameScreen   = { classList: { contains: () => false } }; // stub — loop gates on gameState now

// Select screen
const startFightButton = document.getElementById("startFightButton");
const p2ModeButtons    = document.querySelectorAll(".p2-mode .mode-button");
const p2PickLabel      = null;

// Labels (not shown in this layout — guarded in match.js)
const gameP1Name     = null;
const gameP2Name     = null;
const gameMapName    = null;

// Move list (hidden until first match starts)
const moveListPanel  = document.getElementById("moveList");
const p2ControlsHint = document.getElementById("p2Controls");

// Not used but kept so nothing crashes
const backToSelectButton = null;

// Fullscreen buttons
const fullscreenButton = document.getElementById("fullscreenButton");
const arenaFullscreen  = document.getElementById("arenaFullscreen");

// End of match
const matchOverlay         = document.getElementById("matchOverlay");
const winnerText           = document.getElementById("winnerText");
const rematchButton        = document.getElementById("rematchButton");
const changeFightersButton = document.getElementById("changeFightersButton");

// Pause overlay
const pauseOverlay  = document.getElementById("pauseOverlay");
const resumeButton  = document.getElementById("resumeButton");
const mainMenuButton = document.getElementById("mainMenuButton");
