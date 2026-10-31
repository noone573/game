// The list of fighters and maps. Every file in data/fighters/ calls
// addFighter({...}) and every file in data/maps/ calls addMap({...}).
"use strict";

const FIGHTERS = [];
const MAPS = [];

function addFighter(data) {
  FIGHTERS.push({ moves: {}, combos: [], ...data });
}

// Every move slot a fighter can fill in, in the order the move list shows them.
const MOVE_ORDER = [
  "punch",
  "kick",
  "uppercut",
  "dropkick",
  "disrupt",
  "special",
  "specialUp",
  "specialDown",
  "specialForward",
  "specialBack",
  "specialPunch",
  "specialKick"
];

const MOVE_LABELS = {
  punch: "Punch",
  kick: "Kick",
  uppercut: "Uppercut",
  dropkick: "Dropkick",
  disrupt: "Disrupt",
  special: "Special",
  specialUp: "Special ↑",
  specialDown: "Special ↓",
  specialForward: "Special →",
  specialBack: "Special ←",
  specialPunch: "Special Punch",
  specialKick: "Special Kick"
};

// Any setting a map leaves out uses these.
const DEFAULT_MAP = {
  id: "untitled",
  name: "UNTITLED ARENA",

  // "farm" (outside), "barn" (inside the barn) or "city"
  scenery: "farm",

  // Sky (also seen through the barn window)
  skyTop: "#8fd3f4",
  skyBottom: "#fbe3b0",
  stars: 0,
  clouds: 5,
  moon: true,             // the sun in the daytime
  moonColor: "#fff3b0",
  moonSize: 46,

  // Farm
  hillColor: "#6fae4a",   // also the grass on dirt floors
  barn: true,
  barnColor: "#b5322a",
  barnPosition: 62,       // 0 = left edge, 100 = right edge
  trimColor: "#f4eadb",   // barn trim; the beams inside the barn
  fenceColor: "#8a5a33",

  // Inside the barn
  wallColor: "#7a4b2a",

  // City
  buildings: 9,
  buildingColors: ["#173454", "#351b45"],
  buildingMinHeight: 150,
  buildingMaxHeight: 320,
  windows: true,

  // Floor: "dirt", "planks", "straw" or "neon"
  floorGrid: true,        // false = don't draw a floor (your background picture has one)
  floorStyle: "dirt",
  floorColor: "#8b5e3c",
  gridColor: "#6d4528",   // floor details: pebbles, board lines, straw
  glowColor: "#ffcf6b",   // lanterns, lit windows, neon edges

  // Platforms: "hay", "wood" or "neon"
  platformStyle: "hay",

  // A picture (WIDTH x HEIGHT, see config.js) drawn instead of the scenery
  // and floor above, e.g. "assets/maps/red-barn.png".
  background: null,

  // Gaps in the floor: fall in and you lose the round. { x, width } each.
  voids: [],

  platforms: []
};

// Maps made before the barn update didn't say their scenery: keep them city.
const OLD_MAP_LOOK = {
  scenery: "city",
  floorStyle: "neon",
  platformStyle: "neon",
  moon: false,
  clouds: 0
};

function addMap(data) {
  const map = { ...DEFAULT_MAP, ...("scenery" in data ? {} : OLD_MAP_LOOK), ...data };

  map.buildingColors = [...map.buildingColors];
  map.platforms = map.platforms.map((platform) => ({ ...platform }));
  map.voids = map.voids.map((gap) => ({ ...gap }));

  const existing = MAPS.findIndex((other) => other.id === map.id);

  if (existing >= 0) {
    MAPS[existing] = map;
  } else {
    MAPS.push(map);
  }

  return map;
}

function getFighterData(id) {
  return FIGHTERS.find((fighter) => fighter.id === id) || FIGHTERS[0];
}

function getMap(id) {
  return MAPS.find((map) => map.id === id) || MAPS[0] || DEFAULT_MAP;
}
