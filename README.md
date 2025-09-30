# Node Flipdots

A Node.js project for controlling and simulating flipdot displays, perfect for educational purposes and creative coding exercises.

## Overview

This project provides a framework for generating animations for flipdot displays, which are electromechanical displays consisting of small discs (dots) that can be flipped to show different colors (typically black or white). The application:

- Creates bitmap graphics on a virtual canvas
- Processes these graphics for flipdot compatibility
- Provides a real-time web preview
- Outputs frames as PNG images

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

### 🎮 Controller Support
- **Xbox 360 Controller** (via USB or wireless adapter)
- **D-pad or Left Analog Stick**: Move character/cursor
- **A Button or Start**: Restart/action
- Auto-detection on startup
- Hot-plug support (connect/disconnect anytime)

### ⌨️ Keyboard Support
- **Arrow Keys or WASD**: Move character/cursor  
- **R**: Restart/action
- **Ctrl+C**: Exit application
- Always available as fallback
- Works simultaneously with controller

### Testing Input
Test your input setup before running the game:

```bash
npm run test-input
```

This will show you:
- Which controllers are detected
- Real-time input from both controller and keyboard
- Connection status updates

### Input Method Status
The application displays current input status:
- 🎮 Controller + ⌨️ Keyboard: Both active
- ⌨️ Keyboard only: Controller not detected/connected

### Troubleshooting Input
- **Controller not detected**: Check `/dev/input/js*` device files exist
- **Permission issues**: You may need to add your user to the `input` group:
  ```bash
  sudo usermod -a -G input $USER
  ```
- **Multiple controllers**: The system automatically detects js0, js1, js2

## Running the Application

Start the development server with:

```bash
npm run dev
```

This runs the application with nodemon for automatic reloading when files are modified.

Once running:
1. Open your browser and navigate to `http://localhost:3000/view`
2. You'll see the real-time preview of the flipdot display output

## Project Structure

- `src/index.js` - Main entry point that sets up the canvas, rendering loop, and Pacxon game
- `src/pacxon-flipdot.js` - Pacxon game implementation with flipdot-optimized rendering
- `src/controller.js` - Xbox 360 controller input handling
- `src/ticker.js` - Handles the timing mechanism (like requestAnimationFrame for Node.js)
- `src/preview.js` - Creates a simple HTTP server for real-time preview in the browser
- `src/settings.js` - Configuration for display resolution, panel layout, and framerate
- `output/` - Directory containing generated PNG frames

## Game Features

### 🎮 Pacxon Game
The flipdot display runs a Pacxon-style game with the following features:
- **Real-time score display** in the top-right corner using custom 3-pixel wide font
- **Fill percentage tracking** - goal is to fill 80% of the screen
- **Lives system** with enemy collision detection
- **Custom bitmap font** for all text rendering
- **Optimized for flipdot display** - pure black and white graphics

### 📊 Score Display
- **Position**: Top-right corner of the display
- **Font**: Custom 3-pixel wide bitmap numbers (0-9)
- **Size**: 5 pixels tall, optimized for readability on small displays
- **Real-time updates** as you play the game

### 🎨 Font Visualization
View the custom number font:
```bash
npm run font-demo
```

## Settings and Configuration

The display settings can be modified in `src/settings.js`:

```javascript
export const FPS = 15;                    // Frames per second
export const PANEL_RESOLUTION = [28, 14]; // Size of each panel in dots
export const PANEL_LAYOUT = [3, 2];       // Layout of panels (horizontal, vertical)
export const RESOLUTION = [               // Total resolution calculation
    PANEL_RESOLUTION[0] * PANEL_LAYOUT[0],
    PANEL_RESOLUTION[1] * PANEL_LAYOUT[1],
];
```

## Creating Your Own Animations

The main rendering loop is in `src/index.js`. To create your own animations:

1. Modify the callback function in the `ticker.start()` method
2. Use the canvas 2D context (`ctx`) to draw your graphics
3. The graphics are automatically converted to black and white for the flipdot display

Example of drawing a simple animation:

```javascript
ticker.start(({ deltaTime, elapsedTime }) => {
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    
    // Draw something (e.g., moving circle)
    const x = Math.floor(((Math.sin(elapsedTime / 1000) + 1) / 2) * width);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, height/2, 5, 0, Math.PI * 2);
    ctx.fill();
});
```

## Advanced Usage

### Binary Thresholding

The application automatically converts all drawn graphics to pure black and white using thresholding:

```javascript
// Any pixel with average RGB value > 127 becomes white, otherwise black
const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
const binary = brightness > 127 ? 255 : 0;
```

### Output

The rendered frames are saved as PNG files in the `output` directory and can be accessed via the web preview or directly from the filesystem.

## Project Extensions

Some ideas to extend this project:
- Add text scrolling animations
- Implement Conway's Game of Life
- Create a clock or countdown timer
- Add socket.io for remote control
- Create a library of animation effects
- Build an API to control the display

## Dependencies

- [`canvas`](https://www.npmjs.com/package/canvas) - For creating and manipulating graphics
- [`nodemon`](https://www.npmjs.com/package/nodemon) - For development auto-reloading 