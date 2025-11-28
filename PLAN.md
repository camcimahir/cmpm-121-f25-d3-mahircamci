<!-- markdownlint-disable MD025 -->

# D3: World of Bits

# Game Design Vision

{a few-sentence description of the game mechanics}

# Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

# Assignments

## D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

### Steps

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [x] draw a rectangle representing one cell on the map
- [x] use loops to draw a whole grid of cells on the map
- [x] Store cell data (track which cells have tokens and their values)
- [x] Use luck() to deterministically decide which cells start with tokens
- [x] Display token values as text labels on cells (visible without clicking)
- [x] Only draw cells that have tokens
- [x] Make cells clickable (add click handlers)
- [x] Implement token collection (click nearby cell to pick up token)
- [x] Implement place token
- [x] Update inventory display when token collected
- [x] Handle crafting logic (only combine equal values, double the result)
- [x] Add win condition detection
- [x] The player can see cells all the way to the edge of the map (make belief solution)
- [x] Implement nearyby detection
- [x] add visual update for the cell logic

## D3.b

- [x] Update cell spawning to work from any arbitrary lat/lng
- [x] Implement viewport-based cell rendering
- [x] Add map 'moveend' event listener to detect when player pans to new area
- [x] Calculate which cells should be visible in current viewport
- [x] Spawn new cells when viewport changes to show new area
- [x] random spawning to new areas (no memory held)
- [x] Clean up cells that scroll out of view
- [x] Increase win condition value

## D3.c

- [x] Refactor Data Model for to match with the new memento.
- [x] memory management. implement flyweight patterns to remembers cells that have been altered only.

## D3.d

- [x] able to move the player marker to IRL location
- [x] Add reset button to restart the game completely
- [ ] persistent game state across game states
