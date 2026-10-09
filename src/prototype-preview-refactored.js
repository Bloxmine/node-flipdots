// FlipDot Prototype Preview Server
//
// Everything is pushed to the browser over a single WebSocket the moment it
// changes, instead of the browser polling several HTTP endpoints:
//   - frames: binary, 1 bit per dot (~300 bytes for 84x28), only when changed
//   - status / background / sound: small JSON messages, only when changed
// The browser draws the dots itself, so the server never rasterises them.
import express from "express";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ========== CONSTANTS ==========
const PORT = 3005;
const FRAME_HEADER_BYTES = 4; // uint16 width, uint16 height (little endian)
const SCENE_SOUNDS = {
  'TITLE': { play: 'pacman_beginning.wav', stop: 'gameplay.mp3' },
  'LEVEL_TRANSITION': { play: 'pacman_extrapac.wav' },
  'HOW_TO_PLAY': { play: 'pacman_tutorial.mp3', stop: 'gameplay.mp3' },
  'PLAYING': { play: 'gameplay.mp3' },
  'NAME_ENTRY': { stop: 'gameplay.mp3' }
};
// Looping tracks a freshly connected browser should pick up mid-scene
const SCENE_MUSIC = {
  'HOW_TO_PLAY': 'pacman_tutorial.mp3',
  'PLAYING': 'gameplay.mp3'
};
const DEBUG_COMMANDS = {
  'NEXT_LEVEL': (game) => game.nextLevel?.(),
  'ADD_LIFE': (game) => {
    if (game.gameState?.lives !== undefined) {
      game.gameState.lives = Math.min(game.gameState.lives + 1, 9);
    }
  },
  'LOSE_LIFE': (game) => {
    if (game.gameState?.lives > 0) {
      game.gameState.lives--;
    }
  }
};

// ========== STATE ==========
let gameInstance = null;
let currentBackgroundImage = 'background.jpg';
let commandCallback = null;
let lastFrameMessage = null;
let lastStatus = null;
let previousGameState = createPreviousGameState();

function createPreviousGameState() {
  return { scene: null, lives: null, showingScores: false };
}

// ========== API ==========
export function setGameInstance(game) {
  if (!game && gameInstance) {
    // Leaving a game: silence its looping music
    broadcastJSON({ type: 'sound', sound: null, stop: Object.values(SCENE_MUSIC) });
  }
  gameInstance = game;
  // Don't let the previous game's lives/scene trigger sounds in the new one
  previousGameState = createPreviousGameState();
}

export function setBackgroundImage(imageName) {
  if (imageName === currentBackgroundImage) return;
  currentBackgroundImage = imageName;
  broadcastJSON({ type: 'background', background: imageName });
}

/**
 * Register the handler for commands coming from the browser
 * (directions, START, BACK, RESTART). Debug commands are handled here.
 */
export function setCommandCallback(callback) {
  commandCallback = callback;
}

/**
 * Publish a new frame to all connected browsers. Call once per tick; the
 * frame is only sent if it changed, but status and sound events are checked
 * every call so they stay in sync with the game.
 * @param {Uint8Array} frame - 1 byte per dot (0 = off, 1 = on), row major
 */
export function publishFrame(frame, width, height) {
  const message = Buffer.alloc(FRAME_HEADER_BYTES + Math.ceil(frame.length / 8));
  message.writeUInt16LE(width, 0);
  message.writeUInt16LE(height, 2);
  for (let i = 0; i < frame.length; i++) {
    if (frame[i]) message[FRAME_HEADER_BYTES + (i >> 3)] |= 1 << (i & 7);
  }
  lastFrameMessage = message;
  broadcast(message, true);
}

/**
 * Check for status/sound changes. Call once per tick.
 */
export function publishGameState() {
  const status = gameInstance ? (gameInstance.getStatus?.() || "Game running...") : "Select a game";
  if (status !== lastStatus) {
    lastStatus = status;
    broadcastJSON({ type: 'status', status });
  }

  const soundEvent = detectSoundEvent(gameInstance?.gameState);
  if (soundEvent.sound || soundEvent.stop) {
    broadcastJSON({ type: 'sound', ...soundEvent });
  }
}

// ========== COMMANDS ==========
function dispatchCommand(command) {
  if (typeof command !== 'string') return;

  const debugHandler = DEBUG_COMMANDS[command];
  if (debugHandler) {
    if (gameInstance) debugHandler(gameInstance);
    return;
  }

  if (commandCallback) {
    commandCallback(command);
    return;
  }

  // Fallback when no app-level handler is registered
  if (!gameInstance) return;
  if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(command)) {
    gameInstance.setDirection(command);
  } else if (command === 'RESTART') {
    gameInstance.restart();
  } else {
    gameInstance.handleButtonPress?.(command);
  }
}

// ========== SERVER ==========
const app = express();
app.use(express.json());
app.use('/images', express.static('images', { maxAge: '1h' }));
app.use('/audio', express.static('audio', { maxAge: '1h' }));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "prototype-preview.html"));
});

// Kept for scripts/tools; the page itself uses the WebSocket
app.post("/command", (req, res) => {
  dispatchCommand(req.body?.command);
  res.json({ success: true });
});

app.get("/status", (req, res) => {
  res.send(lastStatus || "Game not initialized");
});

app.get("/background", (req, res) => {
  res.json({ background: currentBackgroundImage });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`FlipDot Prototype server running at http://localhost:${PORT}`);
});

// ========== WEBSOCKET ==========
const wss = new WebSocketServer({ server, path: '/ws', perMessageDeflate: false });

wss.on('connection', (socket) => {
  socket.on('message', (data, isBinary) => {
    if (isBinary) return;
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'command') dispatchCommand(message.command);
    } catch {
      // Ignore malformed messages
    }
  });

  // Bring the new client up to date immediately
  socket.send(JSON.stringify({ type: 'background', background: currentBackgroundImage }));
  if (lastStatus) socket.send(JSON.stringify({ type: 'status', status: lastStatus }));
  const music = SCENE_MUSIC[previousGameState.scene];
  if (music) socket.send(JSON.stringify({ type: 'sound', sound: music, stop: null }));
  if (lastFrameMessage) socket.send(lastFrameMessage, { binary: true });
});

function broadcast(data, binary = false) {
  for (const client of wss.clients) {
    if (client.readyState !== client.OPEN) continue;
    // Skip frames for clients that can't keep up rather than queueing stale
    // frames behind them; they'll get the next one.
    if (binary && client.bufferedAmount > 64 * 1024) continue;
    client.send(data, { binary });
  }
}

function broadcastJSON(message) {
  if (wss.clients.size === 0) return;
  broadcast(JSON.stringify(message));
}

// ========== SOUND DETECTION ==========
function detectSoundEvent(currentState) {
  if (!currentState) {
    return { sound: null, stop: null };
  }

  let soundToPlay = null;
  let soundToStop = null;

  // Scene changes
  if (currentState.scene !== previousGameState.scene) {
    const transition = SCENE_SOUNDS[currentState.scene];
    if (transition) {
      soundToPlay = transition.play || null;
      soundToStop = transition.stop || null;
    }

    // Stop tutorial when leaving HOW_TO_PLAY
    if (previousGameState.scene === 'HOW_TO_PLAY' && currentState.scene !== 'HOW_TO_PLAY' && !soundToStop) {
      soundToStop = 'pacman_tutorial.mp3';
    }

    previousGameState.scene = currentState.scene;
  }

  // High scores display (only if gameInstance has nameEntry property)
  const showingScores = gameInstance.nameEntry?.showingScores || false;
  if (currentState.scene === 'NAME_ENTRY' && showingScores && !previousGameState.showingScores) {
    soundToPlay = 'pacman_intermission.wav';
  }
  previousGameState.showingScores = showingScores;

  // Life lost
  if (currentState.lives != null &&
      previousGameState.lives != null &&
      currentState.lives < previousGameState.lives) {
    soundToPlay = 'pacman_death.wav';
  }
  previousGameState.lives = currentState.lives ?? null;

  return { sound: soundToPlay, stop: soundToStop };
}

export { app as prototypePreviewApp };
