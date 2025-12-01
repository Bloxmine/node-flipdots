// FlipDot Prototype Preview Server
import express from "express";
import { FlipDotPrototypeRenderer } from "./prototype-renderer-refactored.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ========== CONSTANTS ==========
const PORT = 3005;
const UPDATE_INTERVAL = 100;
const STATUS_INTERVAL = 500;
const MAX_CONSECUTIVE_ERRORS = 3;

// ========== STATE ==========
let prototypeRenderer = null;
let gameInstance = null;
let previousGameState = {
  scene: null,
  lives: null,
  playerX: null,
  playerY: null,
  showingScores: false,
};

// ========== API ==========
export function setGameInstance(game) {
  gameInstance = game;
}

export function updatePrototypeRenderer(renderer) {
  prototypeRenderer = renderer;
}

// ========== SERVER ==========
const app = express();
app.use(express.json());
app.use('/images', express.static('images'));
app.use('/audio', express.static('audio'));

// ========== ROUTES ==========
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "prototype-preview.html"));
});

app.get("/frame-raw", (req, res) => {
  if (!prototypeRenderer) {
    prototypeRenderer = new FlipDotPrototypeRenderer(84, 28);
    prototypeRenderer.renderTestPattern();
  }
  
  const pixelData = prototypeRenderer.getRawPixelBuffer();
  
  res.set({
    'Content-Type': 'application/octet-stream',
    'X-Canvas-Width': pixelData.width.toString(),
    'X-Canvas-Height': pixelData.height.toString(),
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.send(pixelData.buffer);
});

app.post("/command", (req, res) => {
  if (!gameInstance) {
    return res.status(400).json({ error: "Game not initialized" });
  }
  
  const { command } = req.body;
  
  const commandHandlers = {
    'UP': () => gameInstance.setDirection('UP'),
    'DOWN': () => gameInstance.setDirection('DOWN'),
    'LEFT': () => gameInstance.setDirection('LEFT'),
    'RIGHT': () => gameInstance.setDirection('RIGHT'),
    'RESTART': () => gameInstance.restart(),
    'NEXT_LEVEL': () => gameInstance.nextLevel?.(),
    'ADD_LIFE': () => {
      if (gameInstance.gameState?.lives !== undefined) {
        gameInstance.gameState.lives = Math.min(gameInstance.gameState.lives + 1, 9);
      }
    },
    'LOSE_LIFE': () => {
      if (gameInstance.gameState?.lives > 0) {
        gameInstance.gameState.lives--;
      }
    }
  };
  
  const handler = commandHandlers[command];
  if (!handler) {
    return res.status(400).json({ error: "Invalid command" });
  }
  
  handler();
  res.json({ success: true });
});

app.get("/status", (req, res) => {
  if (!gameInstance) {
    return res.send("Game not initialized");
  }
  
  res.send(gameInstance.getStatus() || "Game running...");
});

app.get("/sound-event", (req, res) => {
  if (!gameInstance) {
    return res.json({ sound: null });
  }

  const currentState = gameInstance.gameState;
  const soundEvent = detectSoundEvent(currentState);
  
  res.json(soundEvent);
});

// ========== SOUND DETECTION ==========
function detectSoundEvent(currentState) {
  let soundToPlay = null;
  let soundToStop = null;

  // Scene changes
  if (currentState.scene !== previousGameState.scene) {
    const sceneTransitions = {
      'TITLE': { play: 'pacman_beginning.wav', stop: 'gameplay.mp3' },
      'LEVEL_TRANSITION': { play: 'pacman_extrapac.wav' },
      'HOW_TO_PLAY': { play: 'pacman_tutorial.mp3', stop: 'gameplay.mp3' },
      'PLAYING': { play: 'gameplay.mp3' },
      'NAME_ENTRY': { stop: 'gameplay.mp3' }
    };
    
    const transition = sceneTransitions[currentState.scene];
    if (transition) {
      soundToPlay = transition.play;
      soundToStop = transition.stop;
    }
    
    // Stop tutorial when leaving HOW_TO_PLAY
    if (previousGameState.scene === 'HOW_TO_PLAY' && currentState.scene !== 'HOW_TO_PLAY' && !soundToStop) {
      soundToStop = 'pacman_tutorial.mp3';
    }
    
    previousGameState.scene = currentState.scene;
  }

  // High scores display
  if (currentState.scene === 'NAME_ENTRY' && 
      gameInstance.nameEntry.showingScores && 
      !previousGameState.showingScores) {
    soundToPlay = 'pacman_intermission.wav';
  }
  previousGameState.showingScores = gameInstance.nameEntry.showingScores;

  // Life lost
  if (currentState.lives !== null && 
      previousGameState.lives !== null && 
      currentState.lives < previousGameState.lives) {
    soundToPlay = 'pacman_death.wav';
  }
  previousGameState.lives = currentState.lives;

  // Player movement (commented out chomp sound = annoying)
  if (currentState.scene === 'PLAYING' && currentState.playing) {
    const playerX = currentState.player.x;
    const playerY = currentState.player.y;
    
    if (previousGameState.playerX !== null && 
        (playerX !== previousGameState.playerX || playerY !== previousGameState.playerY)) {
      // soundToPlay = 'pacman_chomp.wav';
    }
    
    previousGameState.playerX = playerX;
    previousGameState.playerY = playerY;
  }

  return { sound: soundToPlay, stop: soundToStop };
}

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`FlipDot Prototype server running at http://localhost:${PORT}`);
});

export { app as prototypePreviewApp };
