# Node Flipdots - Pac Xon Edition

A Node.js project for controlling and simulating flipdot displays, perfect for educational purposes and creative coding exercises.

## Overview

This game is based on the classic Pacxon Flash game, adapted for flipdot displays. Players control a character to fill areas of the screen while avoiding enemies. The game features real-time score display, lives system, and optimised graphics for flipdot tech.

## Installation

Make sure you have [Node.js](https://nodejs.org/en) installed.

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd node-flipdots
npm install
```

## Input System

This application supports **dual input modes** - both controller and keyboard input work simultaneously:

### Controller Support
- **Xbox 360 Controller** (via USB or wireless adapter)
- **D-pad or Left Analog Stick**: Move character/cursor
- **A Button or Start**: Restart/action
- Auto-detection on startup
- Hot-plug support (connect/disconnect anytime)

### Keyboard Support
- **Arrow Keys**: Move character/cursor  
- **R**: Restart/action
- **N**: Next level (for testing)
- **Ctrl+C**: Exit application
- Always available as fallback
- Works simultaneously with controller

### Troubleshooting Input
- **Controller not detected**: Check `/dev/input/js*` device files exist
- **Permission issues**: You may need to add your user to the `input` group:
  ```bash
  sudo usermod -a -G input $USER
  ```
- **Multiple controllers**: The system automatically detects js0, js1, js2

## Running the Application

### Hardware Mode (Default)
Run the application with physical flipdot display + browser preview:

```bash
npm run dev
```

This is the primary mode for production use with actual hardware. Once running:
1. The physical flipdot display will show the game
2. Open your browser to `http://localhost:3005` for the web preview
3. Use controllers or keyboard for input

### Browser-Only Mode (Development)
For development without hardware:

```bash
npm run prototype
```

This runs browser-only simulation at `http://localhost:3005`

### Testing Input
Test your input setup before running the game:

```bash
npm run test-input
```

## Project Structure

- `src/index.js` - Main entry point with hardware output and browser preview
- `src/game-selector.js` - Game selection menu with 5x5 font navigation
- `src/game-loader.js` - Dynamic game loading system
- `src/pacxon-flipdot-refactored.js` - Pacxon game engine with optimized, clean code structure
- `src/pong-game.js` - Example Pong game (placeholder)
- `src/prototype-renderer-refactored.js` - Browser visualization with dot simulation
- `src/prototype-preview-refactored.js` - Express server providing web preview and controls
- `src/prototype-refactored.js` - Browser-only prototype for development without hardware
- `src/controller.js` - Xbox 360 controller input handling
- `src/nes-controller.js` - NES controller input handling
- `src/ticker.js` - Timing mechanism for consistent frame rate
- `src/settings.js` - Configuration for display resolution, panel layout, and framerate
- `games.json` - Game registry configuration
- `output/` - Directory containing generated debug frames

## Adding New Games

The system is designed to be expandable. You can easily add new games by following these steps:

### 1. Create Your Game Class

Create a new file in the `src/` directory (e.g., `src/my-game.js`). Your game class must implement these methods:

```javascript
export class MyGame {
  constructor(width, height, renderToCanvas = true) {
    this.width = width;
    this.height = height;
    this.gameState = {
      scene: 'PLAYING',
      lives: 3,
      playing: true,
      player: { x: 0, y: 0 }
    };
  }

  // Handle directional input (UP, DOWN, LEFT, RIGHT)
  setDirection(direction) {
    // Your movement logic
  }

  // Handle button presses (A, B, START, etc.)
  handleButtonPress(button) {
    // Your button logic
  }

  // Restart the game
  restart() {
    // Reset game state
  }

  // Update game logic (called every frame)
  update() {
    // Your update logic
  }

  // Render the game (called every frame)
  render(ctx) {
    // Draw to canvas context
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, width, height);
  }

  // Return status text for web UI
  getStatus() {
    return 'Game Status: Playing';
  }
}
```

### 2. Add Background Image

Place your background image in the `images/` directory (e.g., `images/my-game.jpg`).

### 3. Register in games.json

Add your game to the `games.json` configuration file:

```json
{
  "games": [
    {
      "id": "my-game",
      "name": "MY GAME",
      "module": "./src/my-game.js",
      "class": "MyGame",
      "backgroundImage": "my-game.jpg"
    }
  ]
}
```

**Configuration Fields:**
- `id`: Unique identifier for the game
- `name`: Display name in the selector menu (use uppercase for best 5x5 font rendering)
- `module`: Path to your game module (relative to project root)
- `class`: Name of the exported class
- `backgroundImage`: Filename of the background image in `images/` directory

### 4. Test Your Game

Run the application and your game will appear in the selector menu:

```bash
npm run dev
```

Use arrow keys (or controller D-pad) to navigate the menu, and press Enter (or A button) to select your game.

### Navigation Controls

**In Game Selector:**
- Arrow Up/Down: Navigate menu
- Enter/A Button: Select game

**In Game:**
- ESC/Back Button: Return to menu
- Arrow Keys/D-pad: Game controls
- R: Restart game

### Example Games

- **PAC-XON** (`src/pacxon-flipdot-refactored.js`): Full-featured game with score system, lives, and animations
- **PONG** (`src/pong-game.js`): Simple placeholder demonstrating the minimal game structure

## Game Features

### Pacxon Game
The flipdot display runs a Pacxon-style game with the following features:
- **Real-time score display** in the top-right corner using custom 3-pixel wide font
- **Fill percentage tracking** - goal is to fill 90% of the screen
- **Lives system** with enemy collision detection
- **Custom bitmap font** for all text rendering
- **Optimized for flipdot display** - pure black and white graphics

### Score Display
- **Position**: Top-right corner of the display
- **Font**: Custom 3-pixel wide bitmap numbers (0-9)
- **Size**: 5 pixels tall, optimized for readability on small displays
- **Real-time updates** as you play the game

### Key Modules

**Game Engine** (`pacxon-flipdot-refactored.js`)
- Constants for timings, speeds, and grid dimensions
- Death animations array with configurable speeds
- Scene management with data-driven transitions
- Clean separation of update/render logic

**Renderer** (`prototype-renderer-refactored.js`)
- Dot-based visualization for browser preview
- Differential rendering for performance
- Color constants for visual clarity

**Preview Server** (`prototype-preview-refactored.js`)
- Express server with WebSocket support
- Command dispatch for web controls
- Real-time game state updates
- Audio feedback system

## Dependencies

- [`canvas`](https://www.npmjs.com/package/canvas) - For creating and manipulating graphics
- [`@owowagency/flipdot-emu`](packages/owowagency-flipdot-emu-1.0.0.tgz) - Flipdot display driver
- [`express`](https://www.npmjs.com/package/express) - Web server for browser preview
- [`ws`](https://www.npmjs.com/package/ws) - WebSocket support for real-time updates
- [`joystick`](https://www.npmjs.com/package/joystick) - Controller input support
- [`node-hid`](https://www.npmjs.com/package/node-hid) - HID device communication
- [`nodemon`](https://www.npmjs.com/package/nodemon) - For development auto-reloading
