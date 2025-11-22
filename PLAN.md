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
- [X] Make cells clickable (add click handlers)
- [X] Implement token collection (click nearby cell to pick up token)
- [X] Implement place token
- [X] Update inventory display when token collected
- [X] Handle crafting logic (only combine equal values, double the result)
- [X] Add win condition detection
- [ ] The player can see cells all the way to the edge of the map

## D3.b
