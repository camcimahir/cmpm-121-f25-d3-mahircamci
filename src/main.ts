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

// game constants
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
let playerPosition = CLASSROOM_LATLNG;

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

const cells = new Map<string, number | null>();

const cellRectangles = new Map<string, leaflet.Rectangle>();

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function generateValueToken(i: number, j: number): number {
  const possibleValues = [1, 2, 4, 8];
  const randomIndex = Math.floor(
    luck([i, j, "tokenValue"].toString()) * possibleValues.length,
  );
  return possibleValues[randomIndex];
}

function initializeCell(i: number, j: number) {
  const key = cellKey(i, j);
  if (luck([i, j, "hasToken"].toString()) < TOKEN_SPAWN_PROBABILITY) {
    cells.set(key, generateValueToken(i, j));
  } else {
    cells.set(key, null); // No token
  }
}

function getCellToken(i: number, j: number): number | null {
  return cells.get(cellKey(i, j)) ?? null;
}

function latLngToCell(lat: number, lng: number): { i: number; j: number } {
  const i = Math.floor((lat - CLASSROOM_LATLNG.lat) / TILE_DEGREES);
  const j = Math.floor((lng - CLASSROOM_LATLNG.lng) / TILE_DEGREES);
  return { i, j };
}
function cellToLatLngBounds(i: number, j: number): leaflet.LatLngBounds {
  // Calculate the latitude and longitude of the cell's bottom-left corner
  const lat1 = CLASSROOM_LATLNG.lat + i * TILE_DEGREES;
  const lng1 = CLASSROOM_LATLNG.lng + j * TILE_DEGREES;

  // Calculate the latitude and longitude of the cell's top-right corner
  const lat2 = CLASSROOM_LATLNG.lat + (i + 1) * TILE_DEGREES;
  const lng2 = CLASSROOM_LATLNG.lng + (j + 1) * TILE_DEGREES;

  return leaflet.latLngBounds([
    [lat1, lng1],
    [lat2, lng2],
  ]);
}

function isNearby(i: number, j: number): boolean {
  // Get player's current cell position
  const playerCell = latLngToCell(playerPosition.lat, playerPosition.lng);

  // Check distance from player's cell to target cell
  const di = Math.abs(i - playerCell.i);
  const dj = Math.abs(j - playerCell.j);

  return di <= INTERACTION_LIMIT && dj <= INTERACTION_LIMIT;
}

//updateVisibleCells();

const playerMarker = leaflet.marker(playerPosition);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

const moveNorthBtn = document.createElement("button");
moveNorthBtn.innerHTML = "North";
controlPanelDiv.append(moveNorthBtn);

const moveSouthBtn = document.createElement("button");
moveSouthBtn.innerHTML = "South";
controlPanelDiv.append(moveSouthBtn);

const moveWestBtn = document.createElement("button");
moveWestBtn.innerHTML = "West";
controlPanelDiv.append(moveWestBtn);

const moveEastBtn = document.createElement("button");
moveEastBtn.innerHTML = "East";
controlPanelDiv.append(moveEastBtn);

// player movement functionality
function movePlayer(latOffset: number, lngOffset: number) {
  // Update player position
  playerPosition = leaflet.latLng(
    playerPosition.lat + latOffset,
    playerPosition.lng + lngOffset,
  );

  // Update player marker position
  playerMarker.setLatLng(playerPosition);

  // Re-center map on new player position
  map.panTo(playerPosition);

  // TODO: Clear old cells and regenerate around new position
  console.log(`Player moved to: ${playerPosition.lat}, ${playerPosition.lng}`);
}

//movement handlers
moveNorthBtn.addEventListener("click", () => {
  movePlayer(TILE_DEGREES, 0);
});

moveSouthBtn.addEventListener("click", () => {
  movePlayer(-1 * TILE_DEGREES, 0);
});

moveWestBtn.addEventListener("click", () => {
  movePlayer(0, -1 * TILE_DEGREES);
});

moveEastBtn.addEventListener("click", () => {
  movePlayer(0, 1 * TILE_DEGREES);
});

// === Updates the Status Panel ===
function updateStatusPanel() {
  if (playerInventory === null) {
    statusPanelDiv.innerHTML = "Inventory: Empty";
  } else {
    statusPanelDiv.innerHTML = `Inventory: Token with value ${playerInventory}`;
  }
}

updateStatusPanel(); // initalize the Status pannel

function getVisibleCells(): {
  iMin: number;
  iMax: number;
  jMin: number;
  jMax: number;
} {
  const bounds = map.getBounds(); // Get visible lat/lng area

  // Convert corners to cell coordinates
  const northWest = latLngToCell(bounds.getNorth(), bounds.getWest());
  const southEast = latLngToCell(bounds.getSouth(), bounds.getEast());

  //TODO: change naming convention
  return {
    iMin: southEast.i, // South is smaller i (lower latitude)
    iMax: northWest.i, // North is larger i (higher latitude)
    jMin: northWest.j, // West is smaller j (lower longitude)
    jMax: southEast.j, // East is larger j (higher longitude)
  };
}

function updateGrid() {
  const visible = getVisibleCells();

  // We iterate over all existing cells to see if they are still within bounds
  for (const key of cells.keys()) {
    const [i, j] = key.split(",").map(Number);

    if (
      i < visible.iMin ||
      i > visible.iMax ||
      j < visible.jMin ||
      j > visible.jMax
    ) {
      //if its off screen remove it
      removeCell(i, j); // Removes the visual rectangle
      cells.delete(key); // Deletes the data (so it respawns next time)
    }
  }

  // 2. Create cells that are now visible but haven't been generated yet
  for (let i = visible.iMin; i <= visible.iMax; i++) {
    for (let j = visible.jMin; j <= visible.jMax; j++) {
      const key = cellKey(i, j);

      // Only create if we don't already know about this cell
      if (!cells.has(key)) {
        initializeCell(i, j); // Roll the dice (luck)

        // If the luck check gave us a token, draw it
        const tokenValue = getCellToken(i, j);
        if (tokenValue !== null) {
          drawCell(i, j, tokenValue);
        }
      }
      // If cells.has(key) is true, we skip it.
      // This preserves the state: if you picked it up (value is null),
      // it stays null and we don't redraw the rectangle.
    }
  }
}

// ==============================================================

function drawCell(i: number, j: number, tokenValue: number) {
  // Calculate the lat/lng bounds for this cell
  const bounds = cellToLatLngBounds(i, j);

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

    statusPanelDiv.innerHTML = `Crafted token with value ${newValue}!`;

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

map.on("moveend", () => {
  console.log("moveend");

  console.log(getVisibleCells());
  updateGrid();
});

updateGrid();
console.log(`Initialized ${cells.size} cells`);
console.log(
  `Cells with tokens: ${
    Array.from(cells.values()).filter((v) => v !== null).length
  }`,
);
