# Winter Olympics 2026 - Retro Games

## Project Overview

NES-style retro browser games collection for the Milano-Cortina 2026 Winter Olympics. Vanilla JavaScript with canvas-based rendering at NES native resolution (256x240). No build tools or frameworks.

## Architecture

```
/                         Landing page / game menu
├── index.html            Main menu with game selection
├── css/
│   ├── main.css          Landing page styles
│   └── nes-palette.css   Shared NES color palette CSS variables
├── js/
│   └── menu.js           Menu navigation, keyboard/touch, snow animation
└── games/
    └── skiing/           Downhill Skiing game
        ├── index.html    Game entry point
        ├── css/
        │   └── skiing.css    Game layout (fullscreen canvas)
        └── js/
            ├── main.js       Game loop, state machine, scoring, high scores
            ├── renderer.js   Canvas 2D rendering (all draw calls)
            ├── input.js      Keyboard, touch, and mouse input handling
            ├── constants.js  Game dimensions, colors, tuning values
            ├── player.js     Player movement and physics
            ├── course.js     Procedural course generation (gates, obstacles)
            └── collision.js  Gate pass and obstacle collision detection
```

## Key Patterns

- **Game states**: `TITLE → COUNTDOWN → PLAYING → FINISH → RESULTS` (defined in `constants.js` as `STATE`)
- **Canvas rendering**: All drawing is pixel-art style using `fillRect` and the NES color palette. Font is "Press Start 2P" from Google Fonts.
- **Input**: Left/right halves of screen for touch steering. Arrow keys and WASD for keyboard. Touch/click position tracked for menu selection on results screen.
- **Mobile fullscreen**: Game uses `position: fixed` on body with `width/height: 100%` on canvas. Landing page uses `min-height: 100vh` with centered flex container.
- **High scores**: Stored in `localStorage` under key `skiing_highScore`.
- **Share**: Uses Web Share API (`navigator.share`) with clipboard fallback.

## Game Constants

All tuning values are in `games/skiing/js/constants.js`:
- `GAME_WIDTH=256`, `GAME_HEIGHT=240` (NES resolution)
- `COURSE.totalGates=30`, gate spacing/width ranges
- `SCORING` object controls points, combos, and penalties
- `PLAYER` object controls speed, acceleration, hitbox

## Development

No build step required. Serve with any static file server:
```bash
npx serve .
# or
python3 -m http.server
```

Open `index.html` for the landing page, or `games/skiing/index.html` directly for the skiing game.

## Adding New Games

1. Create `games/<game-name>/` directory with `index.html`, `css/`, and `js/`
2. Follow the skiing game structure as a template
3. Add menu entry in root `index.html` game list
4. Update menu navigation in `js/menu.js`
