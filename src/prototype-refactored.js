// Flipdot Prototype - Unified browser + hardware system
import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import { FrameOutput } from "./frame-output.js";
import { setGameInstance, setCommandCallback } from "./prototype-preview-refactored.js";
import { PacxonGame } from "./pacxon-flipdot-refactored.js";
import { Xbox360Controller } from "./controller.js";
import { NESController } from "./nes-controller.js";

// ========== CONSTANTS ==========
const USE_HARDWARE = process.argv.includes("--hardware");
const FONT_PATHS = {
  OpenSans: "../fonts/OpenSans-Variable.ttf",
  PPNeueMontreal: "../fonts/PPNeueMontrealMono-Regular.ttf",
  Px437_ACM_VGA: "../fonts/Px437_ACM_VGA.ttf"
};

// ========== INITIALIZATION ==========
const { display, width, height } = initializeDisplay();
const canvas = createCanvas(width, height);
const ctx = setupCanvas(canvas);
const frameOutput = new FrameOutput({ width, height, display });
const pacxonGame = new PacxonGame(width, height, false);

setGameInstance(pacxonGame);
setCommandCallback((command) => handleCommand(pacxonGame, command));
setupFonts();
setupControllers(pacxonGame);
setupProcessHandlers();

// ========== MAIN LOOP ==========
const ticker = new Ticker({ fps: FPS });
ticker.start(() => {
  pacxonGame.update();
  renderFrame(ctx, width, height);
  frameOutput.push(ctx);
});

// ========== HELPER FUNCTIONS ==========
function initializeDisplay() {
  if (USE_HARDWARE) {
    const display = new Display({
      layout: LAYOUT,
      panelWidth: 28,
      isMirrored: true,
      transport: { type: 'serial', path: '/dev/ttyACM0', baudRate: 57600 }
    });
    console.log('Flipdot Prototype with Hardware Output');
    console.log(`Display: ${display.width}x${display.height} pixels`);
    console.log('Mode: Physical Display + Browser Preview');
    console.log('Browser: http://localhost:3005');
    return { display, width: display.width, height: display.height };
  }
  
  console.log('Flipdot Prototype (Browser Only)');
  console.log('Display: 84x28 pixels');
  console.log('Browser: http://localhost:3005');
  return { display: null, width: 84, height: 28 };
}

function setupCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.font = "18px monospace";
  ctx.textBaseline = "top";
  return ctx;
}

function setupFonts() {
  Object.entries(FONT_PATHS).forEach(([family, relativePath]) => {
    registerFont(path.resolve(import.meta.dirname, relativePath), { family });
  });
}

function setupControllers(game) {
  const controllers = [
    { controller: new Xbox360Controller(), name: 'Xbox 360' },
    { controller: new NESController(), name: 'NES' }
  ];
  
  controllers.forEach(({ controller, name }) => {
    controller.on('connected', () => console.log(`${name} controller connected!`));
    controller.on('notFound', () => {
      if (!controllers.some(c => c.controller.isConnected)) {
        console.log('🔍 No controllers found. Keyboard input will be used.');
      }
    });
    controller.on('direction', (dir) => game.setDirection(dir));
    // A/START also emit 'restart'; handled via buttonPress only so one press
    // doesn't both act and restart the game.
    controller.on('buttonPress', (btn) => handleButtonPress(game, btn));
  });
}

function handleButtonPress(game, button) {
  const sceneBefore = game.gameState.scene;
  game.handleButtonPress(button);

  if ((button === 'A' || button === 'START') &&
      sceneBefore === 'TITLE' &&
      game.gameState.scene === 'TITLE' &&
      game.idleAnimation.phase === 'waiting') {
    game.startGame();
  }
}

function handleCommand(game, command) {
  if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(command)) {
    game.setDirection(command);
  } else if (command === 'RESTART') {
    game.restart();
  } else {
    handleButtonPress(game, command);
  }
}

function setupProcessHandlers() {
  process.on('SIGINT', () => {
    console.log('\nExiting...');
    process.exit();
  });
}

function renderFrame(ctx, width, height) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  pacxonGame.render(ctx);
}
