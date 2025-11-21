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
- `src/pacxon-flipdot-refactored.js` - Pacxon game engine with optimized, clean code structure
- `src/prototype-renderer-refactored.js` - Browser visualization with dot simulation
- `src/prototype-preview-refactored.js` - Express server providing web preview and controls
- `src/prototype-refactored.js` - Browser-only prototype for development without hardware
- `src/controller.js` - Xbox 360 controller input handling
- `src/nes-controller.js` - NES controller input handling
- `src/ticker.js` - Timing mechanism for consistent frame rate
- `src/settings.js` - Configuration for display resolution, panel layout, and framerate
- `output/` - Directory containing generated debug frames

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
