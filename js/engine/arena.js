// Draws a map: its background picture (or the built-in scenery when it has
// none), the floor with its voids, and the platforms.
"use strict";

// Background pictures for maps, loaded once and reused.
const mapImages = {};
const MAP_IMAGE_VERSION = Date.now();

function getMapImage(src) {
  if (!mapImages[src]) {
    const image = new Image();

    image.onload = () => {
      window.dispatchEvent(new Event("mapimageload"));
    };

    // A fresh copy every time the page loads, so an edited picture shows up
    // on the next refresh instead of an old one the browser kept.
    image.src = src.startsWith("data:") ? src : `${src}?v=${MAP_IMAGE_VERSION}`;
    mapImages[src] = image;
  }

  return mapImages[src];
}

// Same number in, same "random" number out — keeps a map's
// clouds, stars and straw in the same place every frame.
function seeded(n) {
  const value = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

// Mixes two "#rrggbb" colors; t = 0 gives a, t = 1 gives b.
function mixColor(a, b, t) {
  const pa = parseInt(a.slice(1, 7), 16);
  const pb = parseInt(b.slice(1, 7), 16);
  const channel = (shift) => Math.round(
    ((pa >> shift) & 255) + (((pb >> shift) & 255) - ((pa >> shift) & 255)) * t
  );

  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

// Draws a map onto any canvas context (the arena, thumbnails).
function drawArena(c, map) {
  c.save();

  const picture = map.background ? getMapImage(map.background) : null;

  if (picture && picture.complete && picture.naturalWidth) {
    c.drawImage(picture, 0, 0, WIDTH, HEIGHT);

    // The picture has its own floor unless the map asks for a drawn one.
    if (map.floorGrid) {
      drawFloor(c, map);
    }
  } else {
    // No picture (or it hasn't loaded yet): draw the built-in look.
    drawBuiltInBackground(c, map);
  }

  drawPlatforms(c, map);

  c.restore();
}

// Everything behind the platforms, drawn from the map's settings.
// tools/make-backgrounds.html saves this as each map's starting picture.
function drawBuiltInBackground(c, map) {
  if (map.scenery === "barn") {
    drawBarnInside(c, map);
  } else if (map.scenery === "city") {
    drawCity(c, map);
  } else {
    drawFarm(c, map);
  }

  if (map.floorGrid) {
    drawFloor(c, map);
  }
}

// Is x over a void (a gap in the floor fighters fall through)?
function voidAt(map, x) {
  return map.voids.some((gap) => x > gap.x && x < gap.x + gap.width);
}

// ---------- sky pieces shared by every scenery ----------

function drawSkyGradient(c, map, x = 0, y = 0, w = WIDTH, h = FLOOR) {
  const gradient = c.createLinearGradient(0, y, 0, y + h);

  gradient.addColorStop(0, map.skyTop);
  gradient.addColorStop(1, map.skyBottom);

  c.fillStyle = gradient;
  c.fillRect(x, y, w, h);
}

function drawStars(c, map, area = { x: 0, y: 0, w: WIDTH, h: FLOOR - 80 }) {
  for (let i = 0; i < map.stars; i++) {
    c.globalAlpha = 0.3 + seeded(i + 900) * 0.6;
    c.fillStyle = "#ffffff";

    const size = 1 + seeded(i + 1300) * 1.6;

    c.fillRect(area.x + seeded(i) * area.w, area.y + seeded(i + 500) * area.h, size, size);
  }

  c.globalAlpha = 1;
}

function drawMoon(c, map, x = WIDTH * 0.2, y = 110) {
  if (!map.moon) return;

  c.save();
  c.shadowColor = map.moonColor;
  c.shadowBlur = map.moonSize;
  c.fillStyle = map.moonColor;
  c.beginPath();
  c.arc(x, y, map.moonSize, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawClouds(c, map) {
  for (let i = 0; i < (map.clouds || 0); i++) {
    const x = seeded(i + 40) * (WIDTH + 200) - 100;
    const y = 130 + seeded(i + 60) * 120; // below the health bars
    const size = 26 + seeded(i + 80) * 26;

    c.fillStyle = "#ffffffd9";
    c.beginPath();
    c.ellipse(x, y, size * 1.8, size * 0.7, 0, 0, Math.PI * 2);
    c.ellipse(x - size, y + 4, size, size * 0.6, 0, 0, Math.PI * 2);
    c.ellipse(x + size * 0.6, y - size * 0.4, size, size * 0.8, 0, 0, Math.PI * 2);
    c.fill();
  }
}

// ---------- scenery: outside on the farm ----------

function drawFarm(c, map) {
  const barnX = map.barnPosition ?? 62;

  drawSkyGradient(c, map);
  drawStars(c, map);
  // Sun/moon on the opposite side of the barn, below the health bars.
  drawMoon(c, map, WIDTH * (barnX < 50 ? 0.8 : 0.2), 165);
  drawClouds(c, map);

  // Two rows of rolling hills.
  const hills = [
    { color: mixColor(map.hillColor, map.skyBottom, 0.45), base: FLOOR - 110, size: 46, seed: 3 },
    { color: map.hillColor, base: FLOOR - 60, size: 34, seed: 9 }
  ];

  for (const hill of hills) {
    c.fillStyle = hill.color;
    c.beginPath();
    c.moveTo(0, FLOOR);

    for (let x = 0; x <= WIDTH; x += 20) {
      const wave = Math.sin(x / 140 + hill.seed) + Math.sin(x / 63 + hill.seed * 2) * 0.4;
      c.lineTo(x, hill.base - wave * hill.size);
    }

    c.lineTo(WIDTH, FLOOR);
    c.closePath();
    c.fill();
  }

  // A few round trees on the hills.
  const treeColor = mixColor(map.hillColor, "#000000", 0.3);

  for (let i = 0; i < 4; i++) {
    const x = 60 + seeded(i + 120) * (WIDTH - 120);
    const y = FLOOR - 120 - seeded(i + 140) * 30;

    c.fillStyle = "#4a2f1b";
    c.fillRect(x - 4, y, 8, 34);
    c.fillStyle = treeColor;
    c.beginPath();
    c.arc(x, y - 8, 22, 0, Math.PI * 2);
    c.arc(x - 14, y + 2, 15, 0, Math.PI * 2);
    c.arc(x + 14, y + 2, 15, 0, Math.PI * 2);
    c.fill();
  }

  if (map.barn) {
    drawBarnBuilding(c, map, WIDTH * barnX / 100);
  }

  drawFence(c, map);
}

function drawBarnBuilding(c, map, centerX) {
  const width = 230;
  const wallHeight = 130;
  const bottom = FLOOR - 26;
  const left = centerX - width / 2;
  const wallTop = bottom - wallHeight;
  const dark = mixColor(map.barnColor, "#000000", 0.28);

  // Silo next to the barn.
  const siloX = left + width + 18;

  c.fillStyle = "#c9c2b5";
  c.fillRect(siloX, bottom - 190, 56, 190);
  c.fillStyle = "#b1aa9c";

  for (let y = bottom - 180; y < bottom; y += 22) {
    c.fillRect(siloX, y, 56, 3);
  }

  c.fillStyle = dark;
  c.beginPath();
  c.arc(siloX + 28, bottom - 190, 28, Math.PI, 0);
  c.fill();

  // Walls with planks.
  c.fillStyle = map.barnColor;
  c.fillRect(left, wallTop, width, wallHeight);
  c.fillStyle = dark;

  for (let x = left + 18; x < left + width; x += 18) {
    c.fillRect(x, wallTop, 2, wallHeight);
  }

  // Gambrel (barn-shaped) roof.
  c.fillStyle = dark;
  c.beginPath();
  c.moveTo(left - 14, wallTop + 4);
  c.lineTo(left + 22, wallTop - 58);
  c.lineTo(centerX, wallTop - 92);
  c.lineTo(left + width - 22, wallTop - 58);
  c.lineTo(left + width + 14, wallTop + 4);
  c.closePath();
  c.fill();

  c.fillStyle = map.barnColor;
  c.beginPath();
  c.moveTo(left + 6, wallTop);
  c.lineTo(left + 32, wallTop - 50);
  c.lineTo(centerX, wallTop - 80);
  c.lineTo(left + width - 32, wallTop - 50);
  c.lineTo(left + width - 6, wallTop);
  c.closePath();
  c.fill();

  // White trim: hayloft door and the big X doors.
  c.strokeStyle = map.trimColor;
  c.lineWidth = 6;
  c.strokeRect(centerX - 24, wallTop - 56, 48, 40);

  c.fillStyle = mixColor(map.barnColor, "#000000", 0.45);
  c.fillRect(centerX - 21, wallTop - 53, 42, 34);

  const doorWidth = 92;
  const doorTop = bottom - 92;

  c.strokeRect(centerX - doorWidth / 2, doorTop, doorWidth, 92);
  c.beginPath();
  c.moveTo(centerX - doorWidth / 2, doorTop);
  c.lineTo(centerX + doorWidth / 2, bottom);
  c.moveTo(centerX + doorWidth / 2, doorTop);
  c.lineTo(centerX - doorWidth / 2, bottom);
  c.moveTo(centerX, doorTop);
  c.lineTo(centerX, bottom);
  c.stroke();

  c.strokeRect(left, wallTop, width, wallHeight);
}

function drawFence(c, map) {
  const top = FLOOR - 50;

  c.fillStyle = map.fenceColor;

  for (let x = 10; x < WIDTH; x += 70) {
    c.fillRect(x, top, 10, 50);
  }

  c.fillRect(0, top + 8, WIDTH, 8);
  c.fillRect(0, top + 28, WIDTH, 8);

  c.fillStyle = "#00000022";
  c.fillRect(0, top + 14, WIDTH, 2);
  c.fillRect(0, top + 34, WIDTH, 2);
}

// ---------- scenery: inside the barn ----------

function drawBarnInside(c, map) {
  // Laid out for a 540-tall arena; s stretches it to the real height.
  const s = HEIGHT / 540;

  // Wooden plank wall.
  c.fillStyle = map.wallColor;
  c.fillRect(0, 0, WIDTH, FLOOR);

  for (let x = 0, i = 0; x < WIDTH; x += 34, i++) {
    c.fillStyle = mixColor(map.wallColor, i % 2 ? "#000000" : "#ffffff", 0.06 + seeded(i) * 0.06);
    c.fillRect(x, 0, 34, FLOOR);
    c.fillStyle = mixColor(map.wallColor, "#000000", 0.35);
    c.fillRect(x, 0, 2, FLOOR);

    // knots in the wood
    c.beginPath();
    c.ellipse(x + 17, (60 + seeded(i + 30) * 300) * s, 3, 5, 0, 0, Math.PI * 2);
    c.fill();
  }

  // Open hayloft window showing the sky.
  const win = { x: WIDTH / 2 - 90 * s, y: 150 * s, w: 180 * s, h: 130 * s };

  drawSkyGradient(c, map, win.x, win.y, win.w, win.h);
  c.save();
  c.beginPath();
  c.rect(win.x, win.y, win.w, win.h);
  c.clip();
  drawStars(c, map, { x: win.x, y: win.y, w: win.w, h: win.h });
  drawMoon(c, { ...map, moonSize: Math.min(map.moonSize, 26) * s }, win.x + win.w * 0.7, win.y + 40 * s);
  c.restore();

  c.strokeStyle = map.trimColor;
  c.lineWidth = 10;
  c.strokeRect(win.x, win.y, win.w, win.h);
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(win.x + win.w / 2, win.y);
  c.lineTo(win.x + win.w / 2, win.y + win.h);
  c.moveTo(win.x, win.y + win.h / 2);
  c.lineTo(win.x + win.w, win.y + win.h / 2);
  c.stroke();

  // Big beams and braces.
  c.fillStyle = map.trimColor;
  c.fillRect(0, 112 * s, WIDTH, 26 * s);
  c.fillRect(110 * s, 0, 26 * s, FLOOR);
  c.fillRect(WIDTH - 136 * s, 0, 26 * s, FLOOR);

  c.strokeStyle = map.trimColor;
  c.lineWidth = 16 * s;
  c.beginPath();
  c.moveTo(136 * s, 210 * s);
  c.lineTo(220 * s, 138 * s);
  c.moveTo(WIDTH - 136 * s, 210 * s);
  c.lineTo(WIDTH - 220 * s, 138 * s);
  c.stroke();

  // Hanging lanterns with a warm glow.
  for (const x of [WIDTH * 0.26, WIDTH / 2, WIDTH * 0.74]) {
    c.save();
    c.translate(x, 0);
    c.scale(s, s);

    const glow = c.createRadialGradient(0, 190, 4, 0, 190, 110);

    glow.addColorStop(0, `${map.glowColor}88`);
    glow.addColorStop(1, `${map.glowColor}00`);
    c.fillStyle = glow;
    c.fillRect(-110, 80, 220, 220);

    c.strokeStyle = "#2a1a0e";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 138);
    c.lineTo(0, 172);
    c.stroke();

    c.fillStyle = "#2a1a0e";
    c.fillRect(-10, 172, 20, 6);
    c.fillRect(-10, 202, 20, 6);
    c.fillStyle = map.glowColor;
    c.fillRect(-8, 178, 16, 24);
    c.restore();
  }

  // Hay piled against the wall.
  for (let i = 0; i < 9; i++) {
    const x = seeded(i + 200) * WIDTH;
    const w = 90 + seeded(i + 220) * 90;

    c.fillStyle = mixColor("#e2b84f", "#000000", 0.08 + seeded(i + 240) * 0.12);
    c.beginPath();
    c.ellipse(x, FLOOR, w, 26 + seeded(i + 260) * 22, 0, Math.PI, 0);
    c.fill();
  }
}

// ---------- scenery: city (the original neon look) ----------

function drawCity(c, map) {
  drawSkyGradient(c, map);
  drawStars(c, map);
  drawMoon(c, map, WIDTH * 0.76, 130);

  const count = Math.max(0, Math.round(map.buildings));

  if (count === 0) return;

  const slot = WIDTH / count;
  const width = slot * 0.62;

  for (let i = 0; i < count; i++) {
    const height = map.buildingMinHeight +
      seeded(i + 31) * (map.buildingMaxHeight - map.buildingMinHeight);
    const x = i * slot + (slot - width) / 2;
    const y = FLOOR - height;

    c.fillStyle = map.buildingColors[i % map.buildingColors.length];
    c.fillRect(x, y, width, height);

    c.fillStyle = "#ffffff0b";
    c.fillRect(x + 7, y + 10, 5, height - 10);

    if (map.windows) {
      c.fillStyle = map.glowColor;

      for (let wy = y + 14; wy < FLOOR - 16; wy += 18) {
        for (let wx = x + 18; wx < x + width - 8; wx += 12) {
          if (seeded(i * 97 + wy * 13 + wx) > 0.62) {
            c.globalAlpha = 0.18 + seeded(wx + wy) * 0.3;
            c.fillRect(wx, wy, 4, 6);
          }
        }
      }

      c.globalAlpha = 1;
    }
  }
}

// ---------- floors ----------

function drawFloor(c, map) {
  drawFloorSurface(c, map);
  drawVoids(c, map);
}

// The gaps in the floor: dark pits that fade to black.
function drawVoids(c, map) {
  for (const gap of map.voids) {
    const pitDepth = HEIGHT + 500;
    const pit = c.createLinearGradient(0, FLOOR - 4, 0, FLOOR + 200);

    pit.addColorStop(0, "#1a0f08");
    pit.addColorStop(1, "#000000");
    c.fillStyle = pit;
    c.fillRect(gap.x, FLOOR - 4, gap.width, pitDepth);

    // Crumbly edges so the drop is easy to see.
    c.fillStyle = mixColor(map.floorColor, "#000000", 0.45);
    c.fillRect(gap.x - 4, FLOOR - 4, 4, pitDepth);
    c.fillRect(gap.x + gap.width, FLOOR - 4, 4, pitDepth);
  }
}

function drawFloorSurface(c, map) {
  c.fillStyle = map.floorColor;
  c.fillRect(0, FLOOR, WIDTH, HEIGHT - FLOOR);

  if (map.floorStyle === "neon") {
    drawNeonFloor(c, map);
  } else if (map.floorStyle === "planks") {
    // Wooden floorboards.
    c.fillStyle = map.gridColor;

    for (let y = FLOOR + 16, row = 0; y < HEIGHT; y += 18, row++) {
      c.fillRect(0, y, WIDTH, 2);

      for (let x = (row % 2) * 60; x < WIDTH; x += 120) {
        c.fillRect(x, y - 16, 2, 16);
      }
    }

    c.fillStyle = mixColor(map.floorColor, "#000000", 0.4);
    c.fillRect(0, FLOOR, WIDTH, 4);
  } else if (map.floorStyle === "straw") {
    // Loose straw.
    c.strokeStyle = map.gridColor;
    c.lineWidth = 2;

    for (let i = 0; i < 160; i++) {
      const x = seeded(i + 400) * WIDTH;
      const y = FLOOR + 6 + seeded(i + 600) * (HEIGHT - FLOOR - 10);
      const angle = seeded(i + 800) * Math.PI;

      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(angle) * 12, y + Math.sin(angle) * 4);
      c.stroke();
    }

    c.fillStyle = mixColor(map.floorColor, "#000000", 0.25);
    c.fillRect(0, FLOOR, WIDTH, 3);
  } else {
    // Dirt with a grassy edge.
    c.fillStyle = map.gridColor;

    for (let i = 0; i < 70; i++) {
      c.beginPath();
      c.ellipse(
        seeded(i + 300) * WIDTH,
        FLOOR + 14 + seeded(i + 350) * (HEIGHT - FLOOR - 20),
        2 + seeded(i + 370) * 4,
        1.5 + seeded(i + 390) * 2,
        0, 0, Math.PI * 2
      );
      c.fill();
    }

    const grass = map.hillColor || "#6fae4a";

    c.fillStyle = grass;
    c.fillRect(0, FLOOR - 2, WIDTH, 8);

    for (let x = 0; x < WIDTH; x += 9) {
      const h = 6 + seeded(x) * 8;

      c.beginPath();
      c.moveTo(x, FLOOR + 2);
      c.lineTo(x + 3, FLOOR - h);
      c.lineTo(x + 6, FLOOR + 2);
      c.fill();
    }
  }
}

function drawNeonFloor(c, map) {
  c.strokeStyle = map.gridColor;
  c.lineWidth = 1;

  for (let y = FLOOR + 10; y < HEIGHT; y += 18) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(WIDTH, y);
    c.stroke();
  }

  for (let x = -500; x <= 1400; x += 80) {
    c.beginPath();
    c.moveTo(WIDTH / 2, FLOOR);
    c.lineTo(x, HEIGHT);
    c.stroke();
  }

  // Glowing floor edge.
  c.save();
  c.shadowColor = map.glowColor;
  c.shadowBlur = 15;
  c.strokeStyle = map.glowColor;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, FLOOR);
  c.lineTo(WIDTH, FLOOR);
  c.stroke();
  c.restore();
}

// ---------- platforms (fighters stand on the top edge) ----------

function drawPlatforms(c, map) {
  for (const platform of map.platforms) {
    const { x, y, width } = platform;

    if (map.platformStyle === "neon") {
      c.fillStyle = "#070a16e0";
      c.fillRect(x, y, width, 14);

      c.save();
      c.shadowColor = map.glowColor;
      c.shadowBlur = 12;
      c.fillStyle = map.glowColor;
      c.fillRect(x, y, width, 3);
      c.restore();
    } else if (map.platformStyle === "wood") {
      // Wooden shelf on two brackets.
      c.fillStyle = "#5a3820";
      c.fillRect(x + 10, y + 14, 8, 26);
      c.fillRect(x + width - 18, y + 14, 8, 26);
      c.fillStyle = "#9a6538";
      c.fillRect(x, y, width, 16);
      c.fillStyle = "#c08a55";
      c.fillRect(x, y, width, 4);
      c.fillStyle = "#3a2414";

      for (let nx = x + 8; nx < x + width; nx += 40) {
        c.fillRect(nx, y + 8, 3, 3);
      }
    } else {
      // Hay bale.
      const height = 30;

      c.fillStyle = "#d9a83e";
      c.fillRect(x, y, width, height);
      c.fillStyle = "#e8c160";
      c.fillRect(x, y, width, 6);
      c.strokeStyle = "#b9862c";
      c.lineWidth = 2;

      for (let sx = x + 6; sx < x + width - 4; sx += 8) {
        c.beginPath();
        c.moveTo(sx, y + 8);
        c.lineTo(sx + 3, y + height - 2);
        c.stroke();
      }

      // twine
      c.fillStyle = "#7a4a22";
      c.fillRect(x + width * 0.28, y, 4, height);
      c.fillRect(x + width * 0.68, y, 4, height);

      // straw sticking out on top
      c.strokeStyle = "#f0d27a";

      for (let sx = x + 4; sx < x + width; sx += 11) {
        c.beginPath();
        c.moveTo(sx, y + 2);
        c.lineTo(sx + 4, y - 5);
        c.stroke();
      }
    }
  }
}
