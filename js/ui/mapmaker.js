// Map maker
// Design an arena, save it in this browser, or copy it as code for data/maps/.
"use strict";

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");

const mmSource = document.getElementById("mmSource");
const mmName = document.getElementById("mmName");
const mmFields = document.getElementById("mmFields");
const mmPicture = document.getElementById("mmPicture");
const mmRemovePicture = document.getElementById("mmRemovePicture");
const mmStatus = document.getElementById("mmStatus");
const mmCode = document.getElementById("mmCode");
const mmDeleteMap = document.getElementById("mmDelete");

const PLATFORM_HEIGHT = 14;
const PLATFORM_MIN_Y = 150;          // keeps platforms below the health bars
const PLATFORM_MAX_Y = FLOOR - 40;
const PLATFORM_MIN_WIDTH = 40;
const JUMP_REACH = (JUMP_SPEED * JUMP_SPEED) / (2 * GRAVITY); // ≈124px
const SNAP = 10;

// Every setting shown in the side panel. `only` = shown for that scenery only.
const MAP_FIELDS = [
  { group: "SCENERY" },
  {
    key: "scenery", label: "Where", type: "select",
    options: [["farm", "Farm (outside)"], ["barn", "Inside the barn"], ["city", "City"]]
  },

  { group: "SKY" },
  { key: "skyTop", label: "Sky top", type: "color" },
  { key: "skyBottom", label: "Sky bottom", type: "color" },
  { key: "clouds", label: "Clouds", type: "range", min: 0, max: 12, step: 1, only: "farm" },
  { key: "stars", label: "Stars", type: "range", min: 0, max: 200, step: 5 },
  { key: "moon", label: "Sun / moon", type: "checkbox" },
  { key: "moonColor", label: "Sun / moon color", type: "color" },
  { key: "moonSize", label: "Sun / moon size", type: "range", min: 10, max: 120, step: 2 },

  { group: "FARM", only: "farm" },
  { key: "hillColor", label: "Hills + grass", type: "color", only: "farm" },
  { key: "barn", label: "Show the barn", type: "checkbox", only: "farm" },
  { key: "barnColor", label: "Barn color", type: "color", only: "farm" },
  { key: "trimColor", label: "Barn trim", type: "color", only: "farm" },
  { key: "barnPosition", label: "Barn position", type: "range", min: 10, max: 85, step: 1, only: "farm" },
  { key: "fenceColor", label: "Fence", type: "color", only: "farm" },

  { group: "INSIDE THE BARN", only: "barn" },
  { key: "wallColor", label: "Wall planks", type: "color", only: "barn" },
  { key: "trimColor", label: "Beams + window frame", type: "color", only: "barn" },
  { key: "glowColor", label: "Lantern light", type: "color", only: "barn" },

  { group: "CITY", only: "city" },
  { key: "buildings", label: "Buildings", type: "range", min: 0, max: 20, step: 1, only: "city" },
  { key: "buildingColors.0", label: "Building color 1", type: "color", only: "city" },
  { key: "buildingColors.1", label: "Building color 2", type: "color", only: "city" },
  { key: "buildingMinHeight", label: "Shortest building", type: "range", min: 40, max: 420, step: 10, only: "city" },
  { key: "buildingMaxHeight", label: "Tallest building", type: "range", min: 40, max: 420, step: 10, only: "city" },
  { key: "windows", label: "Lit windows", type: "checkbox", only: "city" },
  { key: "glowColor", label: "Window + neon glow", type: "color", only: "city" },

  { group: "FLOOR" },
  { key: "floorGrid", label: "Draw a floor", type: "checkbox" },
  {
    key: "floorStyle", label: "Floor type", type: "select",
    options: [["dirt", "Dirt + grass"], ["planks", "Wooden boards"], ["straw", "Straw"], ["neon", "Neon grid"]]
  },
  { key: "floorColor", label: "Floor color", type: "color" },
  { key: "gridColor", label: "Floor details", type: "color" },

  { group: "PLATFORMS" },
  {
    key: "platformStyle", label: "Platform type", type: "select",
    options: [["hay", "Hay bales"], ["wood", "Wooden shelves"], ["neon", "Neon"]]
  }
];

let editing = null;        // the map being edited (a copy until saved)
let selectedPlatform = -1;
let drag = null;

// ---------- reading and writing settings like "buildingColors.0" ----------

function getField(map, path) {
  return path.split(".").reduce((value, part) => value[part], map);
}

function setField(map, path, value) {
  const parts = path.split(".");
  const last = parts.pop();
  const target = parts.reduce((object, part) => object[part], map);

  target[last] = value;
}

function newMapId() {
  return `custom-${Date.now().toString(36)}`;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---------- opening the editor ----------

function openMapMaker(mapId) {
  gameState = "menu";
  paused = false;
  keys.clear();

  selectScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  mapMakerScreen.classList.remove("hidden");

  loadIntoEditor(mapId);
  window.scrollTo(0, 0);
}

function loadIntoEditor(mapId) {
  if (mapId === "__blank") {
    editing = {
      ...structuredClone(DEFAULT_MAP),
      id: newMapId(),
      name: "MY ARENA",
      custom: true
    };
  } else {
    const source = getMap(mapId);

    editing = structuredClone(source);

    // Built-in maps live in maps/*.js, so edits become a new custom copy.
    if (!source.custom) {
      editing.id = newMapId();
      editing.name = `${source.name} COPY`.slice(0, 24);
      editing.custom = true;
    }
  }

  selectedPlatform = -1;
  drag = null;
  mmCode.classList.add("hidden");
  setStatus("");

  renderSourceList(mapId);
  renderFields();
  renderMapMaker();
}

function renderSourceList(currentId) {
  mmSource.innerHTML = "";

  const blank = new Option("— Blank arena —", "__blank");
  mmSource.add(blank);

  MAPS.forEach((map) => {
    const label = map.custom ? `${map.name} (custom)` : `${map.name} (built-in)`;
    mmSource.add(new Option(label, map.id));
  });

  mmSource.value = MAPS.some((map) => map.id === editing.id) ? editing.id : currentId;
}

function renderFields() {
  mmName.value = editing.name;
  mmFields.innerHTML = "";

  MAP_FIELDS.forEach((field) => {
    if (field.only && field.only !== editing.scenery) return;

    if (field.group) {
      const heading = document.createElement("div");
      heading.className = "mm-group";
      heading.textContent = field.group;
      mmFields.appendChild(heading);
      return;
    }

    const row = document.createElement("label");
    row.className = `mm-field mm-${field.type}`;

    const label = document.createElement("span");
    label.textContent = field.label;

    const input = document.createElement(field.type === "select" ? "select" : "input");

    if (field.type === "select") {
      field.options.forEach(([value, text]) => input.add(new Option(text, value)));
    } else {
      input.type = field.type;
    }

    const value = getField(editing, field.key);
    const output = document.createElement("output");

    if (field.type === "checkbox") {
      input.checked = Boolean(value);
    } else {
      input.value = value;
    }

    if (field.type === "range") {
      input.min = field.min;
      input.max = field.max;
      input.step = field.step;
      output.textContent = value;
    }

    input.addEventListener("input", () => {
      let newValue = input.value;

      if (field.type === "checkbox") newValue = input.checked;
      if (field.type === "range") {
        newValue = Number(input.value);
        output.textContent = newValue;
      }

      setField(editing, field.key, newValue);

      // A different scenery shows different settings.
      if (field.key === "scenery") renderFields();

      renderMapMaker();
    });

    row.append(label, input);

    if (field.type === "range") row.appendChild(output);

    mmFields.appendChild(row);
  });

  mmRemovePicture.disabled = !editing.background;
}

function setStatus(text, isError = false) {
  mmStatus.textContent = text;
  mmStatus.classList.toggle("error", isError);
}

// ---------- drawing the editor canvas ----------

function renderMapMaker() {
  if (!editing) return;

  mapCtx.save();
  drawArena(mapCtx, editing);

  // Health bar area: keep it readable.
  mapCtx.fillStyle = "#e2533f1f";
  mapCtx.fillRect(0, 0, WIDTH, 110);
  mapCtx.fillStyle = "#ffd0a0";
  mapCtx.font = `13px ${HUD_FONT}`;
  mapCtx.textAlign = "center";
  mapCtx.fillText("HEALTH BARS + TIMER", WIDTH / 2, 102);

  // How high a fighter can jump from the floor.
  mapCtx.setLineDash([10, 8]);
  mapCtx.strokeStyle = "#ffe08aaa";
  mapCtx.lineWidth = 2;
  mapCtx.beginPath();
  mapCtx.moveTo(0, FLOOR - JUMP_REACH);
  mapCtx.lineTo(WIDTH, FLOOR - JUMP_REACH);
  mapCtx.stroke();

  mapCtx.textAlign = "left";
  mapCtx.fillStyle = "#ffe08a";
  mapCtx.fillText("JUMP REACH FROM THE FLOOR", 10, FLOOR - JUMP_REACH - 8);

  // Where the fighters start.
  mapCtx.strokeStyle = "#ffffff66";
  [220, 690].forEach((x, i) => {
    mapCtx.strokeRect(x, FLOOR - 100, 48, 100);
    mapCtx.fillStyle = "#ffffffaa";
    mapCtx.textAlign = "center";
    mapCtx.fillText(`P${i + 1}`, x + 24, FLOOR - 108);
  });

  mapCtx.setLineDash([]);

  // Highlight the selected platform.
  const selected = editing.platforms[selectedPlatform];

  if (selected) {
    mapCtx.strokeStyle = "#ffe08a";
    mapCtx.lineWidth = 2;
    mapCtx.setLineDash([6, 4]);
    mapCtx.strokeRect(selected.x - 4, selected.y - 4, selected.width + 8, PLATFORM_HEIGHT + 8);
    mapCtx.setLineDash([]);
  }

  // Platform being drawn right now.
  if (drag && drag.mode === "draw") {
    const x = Math.min(drag.startX, drag.endX);
    const width = Math.abs(drag.endX - drag.startX);

    mapCtx.globalAlpha = width >= PLATFORM_MIN_WIDTH ? 0.8 : 0.35;
    mapCtx.fillStyle = editing.glowColor;
    mapCtx.fillRect(x, drag.y, width, PLATFORM_HEIGHT);
    mapCtx.globalAlpha = 1;
  }

  mapCtx.restore();
}

window.addEventListener("mapimageload", renderMapMaker);

// ---------- placing platforms with the mouse / touch ----------

function snap(value) {
  return Math.round(value / SNAP) * SNAP;
}

function clampY(y) {
  return Math.max(PLATFORM_MIN_Y, Math.min(PLATFORM_MAX_Y, y));
}

function canvasPoint(event) {
  const rect = mapCanvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * WIDTH / rect.width,
    y: (event.clientY - rect.top) * HEIGHT / rect.height
  };
}

function platformAt(point) {
  for (let i = editing.platforms.length - 1; i >= 0; i--) {
    const platform = editing.platforms[i];

    if (
      point.x >= platform.x &&
      point.x <= platform.x + platform.width &&
      point.y >= platform.y - 8 &&
      point.y <= platform.y + PLATFORM_HEIGHT + 8
    ) {
      return i;
    }
  }

  return -1;
}

mapCanvas.addEventListener("pointerdown", (event) => {
  const point = canvasPoint(event);
  const index = platformAt(point);

  mapCanvas.setPointerCapture(event.pointerId);

  if (index >= 0) {
    const platform = editing.platforms[index];

    selectedPlatform = index;
    drag = {
      mode: "move",
      offsetX: point.x - platform.x,
      offsetY: point.y - platform.y
    };
  } else {
    selectedPlatform = -1;
    drag = {
      mode: "draw",
      startX: snap(point.x),
      endX: snap(point.x),
      y: clampY(snap(point.y))
    };
  }

  renderMapMaker();
});

mapCanvas.addEventListener("pointermove", (event) => {
  const point = canvasPoint(event);

  if (!drag) {
    mapCanvas.style.cursor = platformAt(point) >= 0 ? "move" : "crosshair";
    return;
  }

  if (drag.mode === "move") {
    const platform = editing.platforms[selectedPlatform];

    platform.x = Math.max(0, Math.min(WIDTH - platform.width, snap(point.x - drag.offsetX)));
    platform.y = clampY(snap(point.y - drag.offsetY));
  } else {
    drag.endX = snap(Math.max(0, Math.min(WIDTH, point.x)));
  }

  renderMapMaker();
});

mapCanvas.addEventListener("pointerup", () => {
  if (drag && drag.mode === "draw") {
    const width = Math.abs(drag.endX - drag.startX);

    if (width >= PLATFORM_MIN_WIDTH) {
      editing.platforms.push({
        x: Math.min(drag.startX, drag.endX),
        y: drag.y,
        width
      });

      selectedPlatform = editing.platforms.length - 1;
    }
  }

  drag = null;
  renderMapMaker();
});

function deleteSelectedPlatform() {
  if (selectedPlatform < 0) return;

  editing.platforms.splice(selectedPlatform, 1);
  selectedPlatform = -1;
  renderMapMaker();
}

window.addEventListener("keydown", (event) => {
  if (mapMakerScreen.classList.contains("hidden")) return;
  if (event.target.closest && event.target.closest("input, textarea, select")) return;

  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelectedPlatform();
  }
});

document.getElementById("mmDeletePlatform").addEventListener("click", deleteSelectedPlatform);

document.getElementById("mmClearPlatforms").addEventListener("click", () => {
  editing.platforms = [];
  selectedPlatform = -1;
  renderMapMaker();
});

// ---------- side panel ----------

mmSource.addEventListener("change", () => loadIntoEditor(mmSource.value));

mmName.addEventListener("input", () => {
  editing.name = mmName.value.toUpperCase().slice(0, 24) || "UNTITLED ARENA";
});

mmPicture.addEventListener("change", () => {
  const file = mmPicture.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    editing.background = reader.result;
    mmRemovePicture.disabled = false;
    renderMapMaker();

    if (file.size > 2_000_000) {
      setStatus("Big picture! It may be too large to save in the browser. Try one under 2 MB.", true);
    }
  };

  reader.readAsDataURL(file);
  mmPicture.value = "";
});

mmRemovePicture.addEventListener("click", () => {
  editing.background = null;
  mmRemovePicture.disabled = true;
  renderMapMaker();
});

function saveEditingMap() {
  editing.name = mmName.value.trim().toUpperCase().slice(0, 24) || "UNTITLED ARENA";

  addMap({ ...editing, custom: true });

  if (!saveCustomMaps()) {
    setStatus("Couldn't save — the browser storage is full. Try a smaller background picture.", true);
    return false;
  }

  selectedMapId = editing.id;
  renderSourceList(editing.id);
  setStatus(`Saved "${editing.name}". It's in the arena list on the select screen.`);

  return true;
}

document.getElementById("mmSave").addEventListener("click", saveEditingMap);

document.getElementById("mmTest").addEventListener("click", () => {
  saveEditingMap();
  selectedMapId = editing.id;
  startMatch();
});

// Turns the map into code you can paste into a new file in maps/.
function mapToCode(map) {
  const id = slugify(map.name) || map.id;
  const hasUploadedPicture = Boolean(map.background && map.background.startsWith("data:"));

  const data = {};

  Object.keys(DEFAULT_MAP).forEach((key) => {
    data[key] = map[key];
  });

  data.id = id;

  if (hasUploadedPicture) {
    data.background = `assets/maps/${id}.png`;
  }

  const lines = [
    `// Save this as data/maps/${id}.js, then add this line to index.html next to the other maps:`,
    `// <script src="data/maps/${id}.js" defer></script>`
  ];

  if (hasUploadedPicture) {
    lines.push(`// Also save your background picture as assets/maps/${id}.png`);
  }

  return `${lines.join("\n")}\naddMap(${JSON.stringify(data, null, 2)});\n`;
}

document.getElementById("mmCopy").addEventListener("click", async () => {
  const code = mapToCode(editing);

  mmCode.value = code;
  mmCode.classList.remove("hidden");

  try {
    await navigator.clipboard.writeText(code);
    setStatus("Code copied! Paste it into a new file in data/maps (see the top of the code).");
  } catch (error) {
    mmCode.select();
    setStatus("Copy the code from the box below.");
  }
});

mmDeleteMap.addEventListener("click", () => {
  const index = MAPS.findIndex((map) => map.id === editing.id && map.custom);

  if (index < 0) {
    setStatus("This map isn't saved yet, so there's nothing to delete.");
    return;
  }

  if (!confirm(`Delete "${MAPS[index].name}"? This can't be undone.`)) return;

  MAPS.splice(index, 1);
  saveCustomMaps();

  if (selectedMapId === editing.id) {
    selectedMapId = MAPS[0].id;
  }

  loadIntoEditor(MAPS[0].id);
  setStatus("Map deleted.");
});

document.getElementById("mmBack").addEventListener("click", showCharacterSelect);
mapMakerButton.addEventListener("click", () => openMapMaker(selectedMapId));
