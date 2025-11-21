// FlipDot Prototype Preview Server - Optimized with cleaner structure
import express from "express";
import { FlipDotPrototypeRenderer } from "./prototype-renderer-refactored.js";

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
  res.send(getHTMLTemplate());
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

// ========== HTML TEMPLATE ==========
function getHTMLTemplate() {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>FlipDot Prototype Display</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      min-height: 100vh;
      padding: 20px;
      color: #fff;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: url('/images/background.jpg') center/cover no-repeat fixed;
      background-color: #000;
    }
    
    h1 { margin-bottom: 20px; text-align: center; }
    h3 { margin-bottom: 15px; color: #ccc; }
    
    .display-container {
      border: 4px solid #333;
      border-radius: 8px;
      padding: 20px;
      background: #111;
      box-shadow: 0 0 20px rgba(255,255,255,0.1);
    }
    
    #prototypeDisplay {
      border: 2px solid #444;
      border-radius: 4px;
      background: #0a0a0a;
      display: block;
    }
    
    .game-controls {
      margin-top: 20px;
      text-align: center;
    }
    
    .action-buttons {
      margin-top: 20px;
    }
    
    .action-btn {
      background: #444;
      color: #fff;
      border: 2px solid #666;
      padding: 12px 24px;
      margin: 0 10px;
      border-radius: 8px;
      cursor: pointer;
      font-family: monospace;
      font-size: 14px;
      transition: all 0.1s;
    }
    
    .action-btn:hover {
      background: #666;
      border-color: #888;
    }
    
    .action-btn.restart {
      background: #633;
      border-color: #855;
    }
    
    .action-btn.restart:hover {
      background: #855;
      border-color: #a77;
    }
    
    .status-display {
      margin-top: 15px;
      padding: 10px;
      background: #222;
      border-radius: 4px;
      font-size: 12px;
      color: #ccc;
      max-width: 600px;
    }
  </style>
</head>
<body>
  <h1>FlipDot Prototype Display</h1>
  
  <div class="display-container">
    <canvas id="prototypeDisplay"></canvas>
  </div>
  
  <div class="game-controls">
    <h3>Game Controls</h3>
    <div class="action-buttons">
      <button class="action-btn restart" onclick="sendCommand('RESTART')">Restart Game</button>
    </div>
    
    <div class="status-display" id="gameStatus">Game Status: Loading...</div>
    
    <h3 style="margin-top: 30px; color: #fa0;">Debug Controls</h3>
    <div class="action-buttons">
      <button class="action-btn" onclick="sendCommand('NEXT_LEVEL')">Next Level</button>
      <button class="action-btn" onclick="sendCommand('ADD_LIFE')" style="background: #363; border-color: #585;">Add Life</button>
      <button class="action-btn" onclick="sendCommand('LOSE_LIFE')" style="background: #633; border-color: #855;">Lose Life</button>
    </div>
  </div>
  
  ${getAudioElements()}
  ${getClientScript()}
</body>
</html>
`;
}

function getAudioElements() {
  const sounds = [
    'pacman_beginning.wav',
    'pacman_chomp.wav',
    'pacman_death.wav',
    'pacman_intermission.wav',
    'pacman_extrapac.wav',
    'pacman_tutorial.mp3',
    'gameplay.mp3'
  ];
  
  return sounds.map((sound, i) => 
    `<audio id="audio${i}" src="/audio/${sound}" ${sound.includes('mp3') ? 'loop' : ''} preload="auto"></audio>`
  ).join('\n  ');
}

function getClientScript() {
  return `
  <script>
    const canvas = document.getElementById('prototypeDisplay');
    const ctx = canvas.getContext('2d');
    let consecutiveErrors = 0;
    const MAX_ERRORS = ${MAX_CONSECUTIVE_ERRORS};
    
    // Audio setup
    const audioElements = {
      'pacman_beginning.wav': document.getElementById('audio0'),
      'pacman_chomp.wav': document.getElementById('audio1'),
      'pacman_death.wav': document.getElementById('audio2'),
      'pacman_intermission.wav': document.getElementById('audio3'),
      'pacman_extrapac.wav': document.getElementById('audio4'),
      'pacman_tutorial.mp3': document.getElementById('audio5'),
      'gameplay.mp3': document.getElementById('audio6')
    };
    
    let lastSoundTime = {};
    
    function playSound(soundName) {
      const audio = audioElements[soundName];
      if (!audio) return;
      
      // Don't restart background music if playing
      if ((soundName.includes('gameplay') || soundName.includes('tutorial')) && 
          !audio.paused && audio.currentTime > 0) {
        return;
      }
      
      // Debounce chomp sound
      if (soundName === 'pacman_chomp.wav') {
        if (!audio.paused && audio.currentTime > 0 && audio.currentTime < audio.duration) return;
        const now = Date.now();
        if (lastSoundTime[soundName] && now - lastSoundTime[soundName] < 150) return;
        lastSoundTime[soundName] = now;
      }
      
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    
    function stopSound(soundName) {
      const audio = audioElements[soundName];
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    }
    
    async function updateDisplay() {
      try {
        const response = await fetch('/frame-raw');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        const width = parseInt(response.headers.get('X-Canvas-Width'));
        const height = parseInt(response.headers.get('X-Canvas-Height'));
        
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        
        const buffer = await response.arrayBuffer();
        const pixelData = new Uint8ClampedArray(buffer);
        const imageData = new ImageData(pixelData, width, height);
        ctx.putImageData(imageData, 0, 0);
        
        consecutiveErrors = 0;
      } catch (error) {
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_ERRORS) {
          console.warn('Multiple errors updating display:', error.message);
        }
      }
    }
    
    function sendCommand(command) {
      fetch('/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      }).catch(console.error);
    }
    
    // Keyboard controls
    const keyMap = {
      'arrowup': 'UP', 'w': 'UP',
      'arrowdown': 'DOWN', 's': 'DOWN',
      'arrowleft': 'LEFT', 'a': 'LEFT',
      'arrowright': 'RIGHT', 'd': 'RIGHT',
      'r': 'RESTART',
      'n': 'NEXT_LEVEL',
      '+': 'ADD_LIFE', '=': 'ADD_LIFE',
      '-': 'LOSE_LIFE', '_': 'LOSE_LIFE'
    };
    
    document.addEventListener('keydown', (e) => {
      const command = keyMap[e.key.toLowerCase()];
      if (command) {
        sendCommand(command);
        e.preventDefault();
      }
    });
    
    // Polling loops
    updateDisplay();
    setInterval(updateDisplay, ${UPDATE_INTERVAL});
    
    setInterval(() => {
      fetch('/status')
        .then(r => r.text())
        .then(s => document.getElementById('gameStatus').textContent = s || 'Game Status: Running...')
        .catch(() => document.getElementById('gameStatus').textContent = 'Game Status: Connection Error');
    }, ${STATUS_INTERVAL});
    
    setInterval(() => {
      fetch('/sound-event')
        .then(r => r.json())
        .then(d => {
          if (d.sound) playSound(d.sound);
          if (d.stop) stopSound(d.stop);
        })
        .catch(() => {});
    }, ${UPDATE_INTERVAL});
    
    document.addEventListener('DOMContentLoaded', () => {
      document.body.tabIndex = 0;
      document.body.focus();
    });
  </script>
  `;
}

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`FlipDot Prototype server running at http://localhost:${PORT}`);
});

export { app as prototypePreviewApp };
