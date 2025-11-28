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
const WIN_VALUE_TOKEN = 256; //256
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

const savedcells = new Map<string, number | null>();

const cellRectangles = new Map<string, leaflet.Rectangle>();

function getCellStatus(i: number, j: number): number | null {
  const key = cellKey(i, j);

  // Check if we have a saved state (Memento)
  if (savedcells.has(key)) {
    return savedcells.get(key)!;
  }

  // If no saved state, return the default generation (Flyweight)
  return getCanonicalCell(i, j);
}

function saveCellStatus(i: number, j: number, value: number | null) {
  const key = cellKey(i, j);
  savedcells.set(key, value);
}

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}
/*
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
*/
function getCanonicalCell(i: number, j: number): number | null {
  const key = [i, j, "hasToken"].toString();
  // Check luck to see if a token exists by default
  if (luck(key) < TOKEN_SPAWN_PROBABILITY) {
    const valueKey = [i, j, "tokenValue"].toString();
    const possibleValues = [1, 2, 4, 8];
    const randomIndex = Math.floor(luck(valueKey) * possibleValues.length);
    return possibleValues[randomIndex];
  }
  return null;
}
/*
function getCellToken(i: number, j: number): number | null {
  return cells.get(cellKey(i, j)) ?? null;
}
*/
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

function resetGame() {
  if (!confirm("Are you sure you want to wipe your save and reset?")) return;
  localStorage.clear();
  location.reload();
}

class LocationManager {
  private watchId: number | null = null;

  // Toggle between GPS and Manual
  toggleGeolocation(enable: boolean) {
    if (enable) {
      if (this.watchId !== null) return; // Already enabled

      console.log("Enabling Geolocation...");
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handlePositionUpdate(
            position.coords.latitude,
            position.coords.longitude,
          );
        },
        (error) => console.error("Geolocation Error:", error),
        { enableHighAccuracy: true },
      );
    } else {
      if (this.watchId === null) return; // Already disabled

      console.log("Disabling Geolocation...");
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private handlePositionUpdate(lat: number, lng: number) {
    // Determine strict grid movement or free movement?
    // For this assignment, we just snap the player to the new lat/lng
    updatePlayerPosition(lat, lng);
  }
}

const locationManager = new LocationManager();

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

const sensorBtn = document.createElement("button");
sensorBtn.innerHTML = "GPS: OFF";
controlPanelDiv.append(sensorBtn);

const resetBtn = document.createElement("button");
resetBtn.innerHTML = "RESET";
controlPanelDiv.append(resetBtn);

// ====== new movement logic ======

function updatePlayerPosition(lat: number, lng: number) {
  playerPosition = leaflet.latLng(lat, lng);
  playerMarker.setLatLng(playerPosition);
  map.panTo(playerPosition);

  updateGrid();
  //saveGameState();
}

// Manual Move Helper (Relative)
function movePlayer(latOffset: number, lngOffset: number) {
  const newLat = playerPosition.lat + latOffset;
  const newLng = playerPosition.lng + lngOffset;
  updatePlayerPosition(newLat, newLng);
}

/*
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
*/
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

resetBtn.addEventListener("click", resetGame);

// Toggle GPS Listener
let isGpsActive = false;
sensorBtn.addEventListener("click", () => {
  isGpsActive = !isGpsActive;
  if (isGpsActive) {
    sensorBtn.innerHTML = "🌐 GPS: ON";
    sensorBtn.style.backgroundColor = "#ccffcc";
    locationManager.toggleGeolocation(true);
  } else {
    sensorBtn.innerHTML = "🌐 GPS: OFF";
    sensorBtn.style.backgroundColor = "";
    locationManager.toggleGeolocation(false);
  }
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
  for (const key of cellRectangles.keys()) {
    const [i, j] = key.split(",").map(Number);

    if (
      i < visible.iMin ||
      i > visible.iMax ||
      j < visible.jMin ||
      j > visible.jMax
    ) {
      //if its off screen remove it
      removeCell(i, j); // Removes the visual rectangle
    }
  }

  // 2. Create cells that are now visible but haven't been generated yet
  for (let i = visible.iMin; i <= visible.iMax; i++) {
    for (let j = visible.jMin; j <= visible.jMax; j++) {
      const key = cellKey(i, j);

      // Only create if we don't already know about this cell
      if (!cellRectangles.has(key)) {
        const value = getCellStatus(i, j); //checks the memento then flyweight

        // We only draw if there is something to show
        if (value !== null) {
          drawCell(i, j, value);
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

  rect.on("click", (e) => {
    leaflet.DomEvent.stopPropagation(e);

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

function updateCell(i: number, j: number, newValue: number | null) {
  // Remove old representation
  removeCell(i, j);
  if (newValue !== null) {
    drawCell(i, j, newValue);
  }
}

function handleCellClick(i: number, j: number) {
  // Check if cell is nearby

  if (!isNearby(i, j)) {
    statusPanelDiv.innerHTML = "That cell is too far!";
    return;
  }

  const cellToken = getCellStatus(i, j);
  //const cellToken = getCellToken(i, j);

  // Case 1: Cell has no token
  if (cellToken === null) {
    if (playerInventory !== null) {
      const valueToDrop = playerInventory;
      statusPanelDiv.innerHTML =
        `bug check: player inventory is ${playerInventory}`;

      //update state
      saveCellStatus(i, j, valueToDrop);
      playerInventory = null;

      //update visuals to add the new cell
      updateStatusPanel();
      updateCell(i, j, valueToDrop);
      //drawCell(i, j, valueToDrop);
      statusPanelDiv.innerHTML = `Dropped token with value ${valueToDrop}`;
    } else {
      statusPanelDiv.innerHTML = "This cell is empty";
    }
    return;
  }

  // Case 2: Player inventory is empty - collect the token
  if (playerInventory === null) {
    playerInventory = cellToken;

    saveCellStatus(i, j, null);

    //update ui
    updateStatusPanel();
    updateCell(i, j, null);
    statusPanelDiv.innerHTML = `collected token. Value is ${cellToken}`;
    return;
  }

  // Case 3: Player has a token - try to craft
  if (playerInventory === cellToken) {
    const newValue = playerInventory * 2;

    //update cell state
    saveCellStatus(i, j, newValue);
    playerInventory = null; //clear plyaer inventory

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

// Handle clicks on empty spots
map.on("click", (e) => {
  // Convert the mouse click lat/lng to a cell grid index
  const { i, j } = latLngToCell(e.latlng.lat, e.latlng.lng);

  // Attempt to interact with that cell
  handleCellClick(i, j);
});

map.on("moveend", () => {
  console.log("moveend");

  console.log(getVisibleCells());
  updateGrid();
});

//loadGameState();
updateStatusPanel();
updateGrid();
console.log(`Grid initialized.`);
