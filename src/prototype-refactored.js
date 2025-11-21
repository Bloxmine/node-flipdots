// Flipdot Prototype - Unified browser + hardware system
import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import { FlipDotPrototypeRenderer } from "./prototype-renderer-refactored.js";
import { updatePrototypeRenderer, setGameInstance } from "./prototype-preview-refactored.js";
import { PacxonGame } from "./pacxon-flipdot-refactored.js";
import { Xbox360Controller } from "./controller.js";
import { NESController } from "./nes-controller.js";

// ========== CONSTANTS ==========
const IS_DEV = process.argv.includes("--dev");
const USE_HARDWARE = process.argv.includes("--hardware");
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
const pacxonGame = new PacxonGame(width, height, false);

setGameInstance(pacxonGame);
setupFonts();
ensureOutputDir();
setupControllers(pacxonGame);
setupProcessHandlers();

// ========== MAIN LOOP ==========
const ticker = new Ticker({ fps: FPS });
ticker.start(() => {
  pacxonGame.update();
  renderFrame(ctx, width, height);
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
  if (USE_HARDWARE) {
    const display = new Display({
      layout: LAYOUT,
      panelWidth: 28,
      isMirrored: true,
      transport: { type: 'serial', path: '/dev/ttyACM0', baudRate: 57600 }
    });
    console.log('🎮 Flipdot Prototype with Hardware Output');
    console.log(`   Display: ${display.width}x${display.height} pixels`);
    console.log('   Mode: Physical Display + Browser Preview');
    console.log('   Browser: http://localhost:3005');
    return { display, width: display.width, height: display.height };
  }
  
  console.log('🎮 Flipdot Prototype (Browser Only)');
  console.log('   Display: 84x28 pixels');
  console.log('   Browser: http://localhost:3005');
  return { display: null, width: 84, height: 28 };
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
    registerFont(path.resolve(import.meta.dirname, relativePath), { family });
  });
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function setupControllers(game) {
  const controllers = [
    { controller: new Xbox360Controller(), name: 'Xbox 360' },
    { controller: new NESController(), name: 'NES' }
  ];
  
  controllers.forEach(({ controller, name }) => {
    controller.on('connected', () => console.log(`✅ ${name} controller connected!`));
    controller.on('notFound', () => {
      if (!controllers.some(c => c.controller.isConnected)) {
        console.log('🔍 No controllers found. Keyboard input will be used.');
      }
    });
    controller.on('direction', (dir) => game.setDirection(dir));
    controller.on('restart', () => game.restart());
    controller.on('buttonPress', (btn) => handleButtonPress(game, btn));
  });
}

function handleButtonPress(game, button) {
  game.handleButtonPress(button);
  
  if (button !== 'A' && button !== 'START') return;
  
  const { scene } = game.gameState;
  
  if (scene === 'TITLE' && game.idleAnimation.phase === 'waiting') {
    game.startGame();
  } else if (scene === 'HOW_TO_PLAY') {
    game.startActualGame();
  } else if (scene !== 'NAME_ENTRY') {
    game.restart();
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
