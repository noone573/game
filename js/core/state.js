// Everything that changes while the game runs, in one place.
"use strict";

// Select screen
let selectedP1 = "";
let selectedP2 = "";
let selectedMapId = "";
let activePlayer = 1;
let p2Mode = "human"; // "human", or a CPU level: "easy" | "normal" | "hard"

// Match
let player1 = null;
let player2 = null;
let currentMap = DEFAULT_MAP;
let gameState = "menu"; // "menu" | "countdown" | "fighting" | "roundOver" | "over"
let countdown = 0;
let winner = "";
let paused = false;

// Rounds
let round = 1;
let roundTimer = ROUND_TIME;
let roundOverTimer = 0;
let roundMessage = "";
let roundWinnerName = "";

// Camera
let camera = { x: 0, y: 0, scale: 1 };

// Effects
let screenShake = 0;
let hitstop = 0;     // seconds left of the freeze after a hit
let particles = [];
let projectiles = [];
let popups = [];

// Keys currently held down (lowercase names like "a" or "arrowleft").
const keys = new Set();
