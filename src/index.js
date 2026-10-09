// Flipdot Prototype - Unified browser + hardware system
import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import { FrameOutput } from "./frame-output.js";
import { setGameInstance, setBackgroundImage, setCommandCallback } from "./prototype-preview-refactored.js";
import { GameSelector } from "./game-selector.js";
import { GameLoader } from "./game-loader.js";
import { Xbox360Controller } from "./controller.js";
import { NESController } from "./nes-controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== CONSTANTS ==========
const IS_DEV = process.argv.includes("--dev");
const USE_HARDWARE = true; //* always enabled
const FONT_PATHS = {
  OpenSans: "../fonts/OpenSans-Variable.ttf",
  PPNeueMontreal: "../fonts/PPNeueMontrealMono-Regular.ttf",
  Px437_ACM_VGA: "../fonts/Px437_ACM_VGA.ttf"
};

// ========== INITIALIZATION ==========
const { display, width, height } = initializeDisplay();
const canvas = createCanvas(width, height);
const ctx = setupCanvas(canvas);
const frameOutput = new FrameOutput({
  width,
  height,
  display: USE_HARDWARE ? display : null,
  debug: IS_DEV
});

// Game system state
let currentMode = 'SELECTOR'; // 'SELECTOR' or 'GAME'
const gameLoader = new GameLoader();
const games = GameLoader.loadGamesConfig();
const gameSelector = new GameSelector(width, height, games);
let currentGame = null;
let isLoadingGame = false;

setupFonts();
setupControllers();
setupProcessHandlers();
setBackgroundImage('background.jpg'); // Default black background
setCommandCallback(handleWebCommand);

// ========== MAIN LOOP ==========
const ticker = new Ticker({ fps: FPS });
ticker.start(() => {
  if (currentMode === 'SELECTOR') {
    gameSelector.update();
  } else if (currentMode === 'GAME' && currentGame) {
    currentGame.update();
  }

  renderFrame(ctx, width, height);
  frameOutput.push(ctx);
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

function setupFonts() {
  Object.entries(FONT_PATHS).forEach(([family, relativePath]) => {
    registerFont(path.resolve(__dirname, relativePath), { family });
  });
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
    // A/START also emit 'restart'; they're handled through buttonPress so
    // the game decides what they mean (start, launch, confirm...). Wiring
    // both made a single press restart the game on top of its own action.
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

function handleButtonPress(button) {
  if (currentMode === 'SELECTOR') {
    // Enter key to select game
    if (button === 'A' || button === 'START') {
      loadGame(gameSelector.getSelectedGame());
    }
    return;
  }

  if (currentMode !== 'GAME' || !currentGame) return;

  // ESC, SELECT, or B button to go back to menu
  if (button === 'BACK' || button === 'SELECT' || button === 'B') {
    returnToSelector();
    return;
  }

  const sceneBefore = currentGame.gameState?.scene;
  currentGame.handleButtonPress(button);

  // Games that don't start from the title screen on A/START themselves
  // (Pac-Xon) get started here. If the game already reacted (scene changed)
  // leave it alone.
  if ((button === 'A' || button === 'START') &&
      sceneBefore === 'TITLE' &&
      currentGame.gameState?.scene === 'TITLE' &&
      currentGame.idleAnimation?.phase === 'waiting') {
    currentGame.startGame?.();
  }
}

async function loadGame(gameConfig) {
  if (isLoadingGame) return;
  isLoadingGame = true;
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
  } finally {
    isLoadingGame = false;
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
  // Browser input goes through the same paths as the physical controllers
  if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(command)) {
    handleDirection(command);
  } else if (command === 'RESTART') {
    handleRestart();
  } else {
    handleButtonPress(command);
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
