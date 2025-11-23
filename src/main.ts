// deno-lint-ignore-file
// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

// Create basic UI elements

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 32;
const TOKEN_SPAWN_PROBABILITY = 0.1;
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
); // Our classroom location
const WIN_VALUE_TOKEN = 16; //256
const INTERACTION_LIMIT = 3; //test this out 4 might work better

// === Game State ===
let playerInventory: number | null = null;

const cells = new Map<string, number | null>();

const cellRectangles = new Map<string, leaflet.Rectangle>();

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function initializeCell(i: number, j: number) {
  const key = cellKey(i, j);
  if (luck([i, j, "hasToken"].toString()) < TOKEN_SPAWN_PROBABILITY) {
    cells.set(key, 1); // All initial tokens have value 1
  } else {
    cells.set(key, null); // No token
  }
}

function getCellToken(i: number, j: number): number | null {
  return cells.get(cellKey(i, j)) ?? null;
}

function isNearby(i: number, j: number): boolean {
  return Math.abs(i) <= INTERACTION_LIMIT && Math.abs(j) <= INTERACTION_LIMIT;
}

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// === Player Marker ===
const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

// === Updates the Status Panel ===
function updateStatusPanel() {
  if (playerInventory === null) {
    statusPanelDiv.innerHTML = "Inventory: Empty";
  } else {
    statusPanelDiv.innerHTML = `Inventory: Token with value ${playerInventory}`;
  }
}

updateStatusPanel(); // initalize the Status pannel

// ==============================================================

function drawCell(i: number, j: number, tokenValue: number) {
  // Calculate the lat/lng bounds for this cell
  const origin = CLASSROOM_LATLNG;
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);

  // Create a rectangle for this cell
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  // Bind a tooltip that shows the token value
  rect.bindTooltip(`${tokenValue}`, {
    permanent: true,
    direction: "center",
    className: "token-value-label",
  });

  rect.on("click", () => {
    handleCellClick(i, j);
  });

  cellRectangles.set(cellKey(i, j), rect);
}

function removeCell(i: number, j: number) {
  const key = cellKey(i, j);
  const rect = cellRectangles.get(key);
  if (rect) {
    rect.unbindTooltip();
    rect.remove();
    cellRectangles.delete(key);
  }
}

function updateCell(i: number, j: number, newValue: number) {
  // Remove old representation
  removeCell(i, j);
  // Draw new one
  drawCell(i, j, newValue);
}

function handleCellClick(i: number, j: number) {
  // Check if cell is nearby

  if (!isNearby(i, j)) {
    statusPanelDiv.innerHTML = "That cell is too far!";
    return;
  }

  const cellToken = getCellToken(i, j);

  // Case 1: Cell has no token
  if (cellToken === null) {
    statusPanelDiv.innerHTML = "This cell is empty.";
    return;
  }

  // Case 2: Player inventory is empty - collect the token
  if (playerInventory === null) {
    playerInventory = cellToken;
    cells.set(cellKey(i, j), null); // Remove token from cell
    updateStatusPanel();
    removeCell(i, j);
    statusPanelDiv.innerHTML = `collected token. Value is ${cellToken}`;
    return;
  }

  // Case 3: Player has a token - try to craft
  if (playerInventory === cellToken) {
    // Tokens match! Craft a new token of double value
    const newValue = playerInventory * 2;
    cells.set(cellKey(i, j), newValue); // Update cell with new token
    playerInventory = null; // Clear inventory
    updateStatusPanel();
    updateCell(i, j, newValue);

    statusPanelDiv.innerHTML = `✨ Crafted token with value ${newValue}!`;

    // Check win condition
    if (newValue >= WIN_VALUE_TOKEN) {
      statusPanelDiv.innerHTML = `YOU WIN!you got to: ${newValue}!`;
    }
  } else {
    // Tokens don't match
    statusPanelDiv.innerHTML =
      `Cannot craft: your token doesn't match cell token`;
  }
}

for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    // Initialize cell data
    initializeCell(i, j);

    // Only draw cells that have tokens
    const tokenValue = getCellToken(i, j);
    if (tokenValue !== null) {
      drawCell(i, j, tokenValue);
    }
  }
}

console.log(`Initialized ${cells.size} cells`);
console.log(
  `Cells with tokens: ${
    Array.from(cells.values()).filter((v) => v !== null).length
  }`,
);
