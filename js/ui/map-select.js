// Arena picker on the select screen, and maps saved by the (switched off) map maker.
"use strict";

const CUSTOM_MAPS_KEY = "neonClash.customMaps";

// Maps made in the map maker are kept in this browser's storage.
function loadCustomMaps() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_MAPS_KEY) || "[]");
    saved.forEach((map) => addMap({ ...map, custom: true }));
  } catch (error) {
    console.warn("Could not load saved maps:", error);
  }
}

function saveCustomMaps() {
  const custom = MAPS.filter((map) => map.custom);

  try {
    localStorage.setItem(CUSTOM_MAPS_KEY, JSON.stringify(custom));
    return true;
  } catch (error) {
    console.warn("Could not save maps:", error);
    return false;
  }
}

function renderMapList() {
  mapList.innerHTML = "";

  MAPS.forEach((map) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "map-card";
    button.classList.toggle("selected", map.id === selectedMapId);
    button.setAttribute("aria-label", `Fight in ${map.name}`);

    const thumb = document.createElement("canvas");

    thumb.width = 192;
    thumb.height = 108;

    const thumbCtx = thumb.getContext("2d");

    thumbCtx.scale(thumb.width / WIDTH, thumb.height / HEIGHT);
    drawArena(thumbCtx, map);

    const label = document.createElement("span");

    label.className = "map-name";
    label.textContent = map.name;

    if (map.custom) {
      const badge = document.createElement("small");
      badge.textContent = "CUSTOM";
      label.appendChild(badge);
    }

    button.append(thumb, label);

    button.addEventListener("click", () => {
      selectedMapId = map.id;
      renderMapList();
    });

    mapList.appendChild(button);
  });
}

window.addEventListener("mapimageload", () => {
  if (!selectScreen.classList.contains("hidden")) {
    renderMapList();
  }
});
