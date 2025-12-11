// Flipdot Prototype - Unified browser + hardware system
import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import { FlipDotPrototypeRenderer } from "./prototype-renderer-refactored.js";
import { updatePrototypeRenderer, setGameInstance, setBackgroundImage, setCommandCallback } from "./prototype-preview-refactored.js";
import { GameSelector } from "./game-selector.js";
import { GameLoader } from "./game-loader.js";
import { Xbox360Controller } from "./controller.js";
import { NESController } from "./nes-controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== CONSTANTS ==========
const IS_DEV = process.argv.includes("--dev");
const USE_HARDWARE = true; //* always enabled
const OUTPUT_DIR = "./output";
const BRIGHTNESS_THRESHOLD = 127;
const FONT_PATHS = {
  OpenSans: "../fonts/OpenSans-Variable.ttf",
  PPNeueMontreal: "../fonts/PPNeueMontrealMono-Regular.ttf",
  Px437_ACM_VGA: "../fonts/Px437_ACM_VGA.ttf"
};

// ========== INITIALIZATION ==========
const { display, width, height } = initializeDisplay();
const canvas = createCanvas(width, height);
const ctx = setupCanvas(canvas);
const prototypeRenderer = setupRenderer(width, height);

// Game system state
let currentMode = 'SELECTOR'; // 'SELECTOR' or 'GAME'
const gameLoader = new GameLoader();
const games = GameLoader.loadGamesConfig();
const gameSelector = new GameSelector(width, height, games);
let currentGame = null;

setupFonts();
ensureOutputDir();
setupControllers();
setupProcessHandlers();
setBackgroundImage('background.jpg'); // Default black background
setCommandCallback(handleWebCommand);

// ========== MAIN LOOP ==========
const ticker = new Ticker({ fps: FPS });
ticker.start(() => {
  if (currentMode === 'SELECTOR') {
    gameSelector.update();
    renderFrame(ctx, width, height);
  } else if (currentMode === 'GAME' && currentGame) {
    currentGame.update();
    renderFrame(ctx, width, height);
  }
  
  const imageData = ctx.getImageData(0, 0, width, height);
  
  prototypeRenderer.renderFromImageData(imageData);
  
  if (USE_HARDWARE && display) {
    sendToHardware(display, ctx, width, height);
  }
  
  if (IS_DEV) {
    saveDebugFrame(ctx, imageData, width, height);
  }
});

// ========== HELPER FUNCTIONS ==========
function initializeDisplay() {
  const display = new Display({
    layout: LAYOUT,
    panelWidth: 28,
    isMirrored: true,
    transport: { type: 'serial', path: '/dev/ttyACM0', baudRate: 57600 }
  });
  console.log('Flipdot running');
  return { display, width: display.width, height: display.height };
}

function setupCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.font = "18px monospace";
  ctx.textBaseline = "top";
  return ctx;
}

function setupRenderer(width, height) {
  const renderer = new FlipDotPrototypeRenderer(width, height, 8, 2);
  renderer.initialize();
  updatePrototypeRenderer(renderer);
  return renderer;
}

function setupFonts() {
  Object.entries(FONT_PATHS).forEach(([family, relativePath]) => {
    registerFont(path.resolve(__dirname, relativePath), { family });
  });
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function setupControllers() {
  const controllers = [
    { controller: new Xbox360Controller(), name: 'Xbox 360' },
    { controller: new NESController(), name: 'NES' }
  ];
  
  controllers.forEach(({ controller, name }) => {
    controller.on('connected', () => console.log(`✅ ${name} controller connected!`));
    controller.on('notFound', () => {
      if (!controllers.some(c => c.controller.isConnected)) {
        console.log('No controllers found. Keyboard input will be used.');
      }
    });
    controller.on('direction', (dir) => handleDirection(dir));
    controller.on('restart', () => handleRestart());
    controller.on('buttonPress', (btn) => handleButtonPress(btn));
  });
}

function handleDirection(dir) {
  if (currentMode === 'SELECTOR') {
    gameSelector.setDirection(dir);
  } else if (currentMode === 'GAME' && currentGame) {
    currentGame.setDirection(dir);
  }
}

function handleRestart() {
  if (currentMode === 'GAME' && currentGame) {
    currentGame.restart();
  }
}

async function handleButtonPress(button) {
  if (currentMode === 'SELECTOR') {
    // Enter key to select game
    if (button === 'A' || button === 'START') {
      const selectedGame = gameSelector.getSelectedGame();
      await loadGame(selectedGame);
    }
  } else if (currentMode === 'GAME') {
    // ESC or SELECT to go back to menu
    if (button === 'BACK' || button === 'SELECT') {
      returnToSelector();
    } else if (currentGame) {
      currentGame.handleButtonPress(button);
      
      if (button !== 'A' && button !== 'START') return;
      
      const { scene } = currentGame.gameState;
      
      if (scene === 'TITLE' && currentGame.idleAnimation?.phase === 'waiting') {
        currentGame.startGame();
      } else if (scene === 'HOW_TO_PLAY') {
        currentGame.startActualGame();
      } else if (scene !== 'NAME_ENTRY') {
        currentGame.restart();
      }
    }
  }
}

async function loadGame(gameConfig) {
  try {
    console.log(`Loading game: ${gameConfig.name}`);
    currentGame = await gameLoader.loadGame(gameConfig, width, height);
    setGameInstance(currentGame);
    setBackgroundImage(gameConfig.backgroundImage);
    currentMode = 'GAME';
    console.log(`Game loaded: ${gameConfig.name}`);
  } catch (error) {
    console.error('Failed to load game:', error);
    currentMode = 'SELECTOR';
  }
}

function returnToSelector() {
  console.log('Returning to game selector');
  currentMode = 'SELECTOR';
  currentGame = null;
  gameLoader.unloadGame();
  setGameInstance(null);
  setBackgroundImage('background.jpg'); // Reset to black background
}

function handleWebCommand(command) {
  // Handle web interface commands
  if (currentMode === 'SELECTOR') {
    if (command === 'LEFT') gameSelector.setDirection('left');
    else if (command === 'RIGHT') gameSelector.setDirection('right');
    else if (command === 'START' || command === 'A') {
      const selectedGame = gameSelector.getSelectedGame();
      loadGame(selectedGame);
    }
  } else if (currentMode === 'GAME') {
    if (command === 'BACK' || command === 'SELECT') {
      returnToSelector();
    }
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
  
  if (currentMode === 'SELECTOR') {
    gameSelector.render(ctx);
  } else if (currentMode === 'GAME' && currentGame) {
    currentGame.render(ctx);
  }
}

function applyBinaryThreshold(imageData) {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const binary = brightness > BRIGHTNESS_THRESHOLD ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = binary;
    data[i + 3] = 255;
  }
}

function sendToHardware(display, ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  applyBinaryThreshold(imageData);
  display.setImageData(imageData);
  if (display.isDirty()) {
    display.flush();
  }
}

function saveDebugFrame(ctx, imageData, width, height) {
  applyBinaryThreshold(imageData);
  ctx.putImageData(imageData, 0, 0);
  const filename = path.join(OUTPUT_DIR, "frame.png");
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filename, buffer);
}
