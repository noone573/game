// Built-in arena. To make your own, copy this file, give it a new id and
// add a <script> line for it in index.html (see data/maps/README.md).
addMap({
  id: "red-barn",
  name: "RED BARN",
  scenery: "farm",
  skyTop: "#8fd3f4",
  skyBottom: "#fbe3b0",
  stars: 0,
  clouds: 6,
  moon: true,
  moonColor: "#fff3b0",
  moonSize: 46,
  hillColor: "#6fae4a",
  barn: true,
  barnColor: "#b5322a",
  barnPosition: 62,
  trimColor: "#f4eadb",
  fenceColor: "#8a5a33",
  floorStyle: "dirt",
  floorColor: "#8b5e3c",
  gridColor: "#6d4528",
  glowColor: "#ffcf6b",
  platformStyle: "hay",
  // The whole background is this picture: edit it to change the look.
  // The settings above only matter if the picture is missing.
  floorGrid: true,
  voids: [],
  platforms: [
    { x: 275, y: 600, width: 238 },
    { x: 1088, y: 600, width: 238 }
  ]
});
