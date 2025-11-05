import express from "express";
import { FlipDotPrototypeRenderer } from "./prototype-renderer.js";

const app = express();
const PORT = 3001;

// for serving static images
app.use('/images', express.static('images'));
app.use('/audio', express.static('audio'));

// global references
let currentPixelData = null;
let previousPixelData = null;
let gameInstance = null;

// track game state
let previousGameState = {
  scene: null,
  lives: null,
  playerX: null,
  playerY: null,
};

// set game
export function setGameInstance(game) {
  gameInstance = game;
}

// update pixel data - now expects RGBA pixel data and converts to binary + diffs
export function updatePixelData(pixelData) {
  // Convert RGBA pixel data to binary (0 or 1) for each dot
  const gridWidth = 84;
  const gridHeight = 28;
  const binaryData = new Uint8Array(gridWidth * gridHeight);
  
  for (let i = 0; i < gridWidth * gridHeight; i++) {
    const pixelIndex = i * 4;
    const brightness = (pixelData[pixelIndex] + pixelData[pixelIndex + 1] + pixelData[pixelIndex + 2]) / 3;
    binaryData[i] = brightness > 127 ? 1 : 0;
  }
  
  // If we have previous data, calculate the diff
  if (previousPixelData) {
    const changes = [];
    for (let i = 0; i < binaryData.length; i++) {
      if (binaryData[i] !== previousPixelData[i]) {
        changes.push(i); // Store the index of changed dots
      }
    }
    
    // Only store current data if there are changes
    if (changes.length > 0) {
      currentPixelData = { data: binaryData, changes };
      previousPixelData = new Uint8Array(binaryData); // Copy for next comparison
    }
  } else {
    // First frame - send all dots
    const allIndices = Array.from({ length: binaryData.length }, (_, i) => i);
    currentPixelData = { data: binaryData, changes: allIndices };
    previousPixelData = new Uint8Array(binaryData);
  }
}

// the preview look and feel
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>FlipDot Prototype Display</title>
      <style>
        html, body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          width: 100%;
        }
        
        body {
          padding: 20px;
          color: #fff;
          font-family: monospace;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: url('/images/background.jpg') center/cover no-repeat fixed;
          background-color: #000;
        }
        
        h1 {
          margin-bottom: 20px;
          text-align: center;
        }
        
        .info {
          margin-bottom: 20px;
          text-align: center;
          opacity: 0.7;
        }
        
        .display-container {
          border: 4px solid #333;
          border-radius: 8px;
          padding: 20px;
          background: #111;
          box-shadow: 0 0 20px rgba(255,255,255,0.1);
          position: relative;
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
        
        .game-controls h3 {
          margin-bottom: 15px;
          color: #ccc;
        }
        
        .direction-pad {
          display: inline-block;
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 20px;
        }
        
        .direction-btn {
          position: absolute;
          width: 40px;
          height: 40px;
          background: #333;
          color: #fff;
          border: 2px solid #555;
          border-radius: 8px;
          cursor: pointer;
          font-family: monospace;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          transition: all 0.1s;
        }
        
        .direction-btn:hover {
          background: #555;
          border-color: #777;
        }
        
        .direction-btn:active {
          background: #777;
          transform: scale(0.95);
        }
        
        .direction-btn.up { top: 0; left: 40px; }
        .direction-btn.down { bottom: 0; left: 40px; }
        .direction-btn.left { top: 40px; left: 0; }
        .direction-btn.right { top: 40px; right: 0; }
        
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
          max-width: 400px;
        }
        
        .keyboard-hint {
          margin-top: 10px;
          font-size: 11px;
          opacity: 0.6;
        }
      </style>
    </head>
    <body>
      <h1>FlipDot Prototype Display</h1>
      <div class="info">
        Real-time simulation with physical dot representation<br>
        Dot size: 8px | Grid: 84×28 | Auto-refresh: 100ms
      </div>
      
      <div class="display-container">
        <canvas id="prototypeDisplay" width="840" height="280"></canvas>
      </div>
      
      <div class="game-controls">
        <h3>Game Controls</h3>
        
        <div class="direction-pad">
          <button class="direction-btn up" onclick="sendCommand('UP')">↑</button>
          <button class="direction-btn down" onclick="sendCommand('DOWN')">↓</button>
          <button class="direction-btn left" onclick="sendCommand('LEFT')">←</button>
          <button class="direction-btn right" onclick="sendCommand('RIGHT')">→</button>
        </div>
        
        <div class="action-buttons">
          <button class="action-btn restart" onclick="sendCommand('RESTART')">Restart Game</button>
        </div>
        
        <div class="status-display" id="gameStatus">
          Game Status: Loading...
        </div>
        
        <div class="keyboard-hint">
          You can also use arrow keys or WASD on your keyboard
        </div>
      </div>
      
      <!-- Audio elements -->
      <audio id="audioBeginning" src="/audio/pacman_beginning.wav" preload="auto"></audio>
      <audio id="audioChomp" src="/audio/pacman_chomp.wav" preload="auto"></audio>
      <audio id="audioDeath" src="/audio/pacman_death.wav" preload="auto"></audio>
      <audio id="audioIntermission" src="/audio/pacman_intermission.wav" preload="auto"></audio>
      
      <script>
        // audio elements
        const audioElements = {
          'pacman_beginning.wav': document.getElementById('audioBeginning'),
          'pacman_chomp.wav': document.getElementById('audioChomp'),
          'pacman_death.wav': document.getElementById('audioDeath'),
          'pacman_intermission.wav': document.getElementById('audioIntermission')
        };

        // track currently playing sounds to avoid overlaps
        let lastSoundTime = {};
        
        // function to play sound
        function playSound(soundName) {
          const audio = audioElements[soundName];
          if (!audio) return;
          
          // special handling for chomp sound - don't restart if still playing
          if (soundName === 'pacman_chomp.wav') {
            // Don't play if currently playing
            if (!audio.paused && audio.currentTime > 0 && audio.currentTime < audio.duration) {
              return; // Still playing, skip
            }
            
            // additional debounce - wait at least 150ms after it finishes
            const now = Date.now();
            if (lastSoundTime[soundName] && now - lastSoundTime[soundName] < 150) {
              return;
            }
            lastSoundTime[soundName] = now;
          }
          
          // stop and reset audio for non-looping sounds
          audio.pause();
          audio.currentTime = 0;
          audio.play().catch(e => console.log('Audio play failed:', e));
        }
        setInterval(() => {
          fetch('/sound-event')
            .then(response => response.json())
            .then(data => {
              if (data.sound) {
                playSound(data.sound);
              }
            })
            .catch(() => {});
        }, 100);
        
        // Auto-refresh the canvas every 100ms
        const canvas = document.getElementById('prototypeDisplay');
        const ctx = canvas.getContext('2d');
        const dotSize = 8;
        const dotSpacing = 2;
        const gridWidth = 84;
        const gridHeight = 28;
        let previousPixelData = null;

        // --- Create Dot Sprites ---
        const dotDiameter = dotSize + dotSpacing;
        const onDotCanvas = document.createElement('canvas');
        onDotCanvas.width = onDotCanvas.height = dotDiameter;
        const onCtx = onDotCanvas.getContext('2d');

        const offDotCanvas = document.createElement('canvas');
        offDotCanvas.width = offDotCanvas.height = dotDiameter;
        const offCtx = offDotCanvas.getContext('2d');

        function createDotSprites() {
          const radius = dotSize / 2;
          const center = dotDiameter / 2;

          // Draw "On" dot
          onCtx.fillStyle = '#0a0a0a';
          onCtx.fillRect(0, 0, dotDiameter, dotDiameter);
          onCtx.beginPath();
          onCtx.arc(center, center, radius, 0, Math.PI * 2);
          onCtx.fillStyle = "#f0f0f0";
          onCtx.fill();
          onCtx.strokeStyle = "#d0d0d0";
          onCtx.lineWidth = 1;
          onCtx.stroke();

          // Draw "Off" dot
          offCtx.fillStyle = '#0a0a0a';
          offCtx.fillRect(0, 0, dotDiameter, dotDiameter);
          offCtx.beginPath();
          offCtx.arc(center, center, radius, 0, Math.PI * 2);
          offCtx.fillStyle = "#1a1a1a";
          offCtx.fill();
        }

        createDotSprites();
        // --- End of Sprite Creation ---

        // Track full state on client side
        let clientState = new Uint8Array(gridWidth * gridHeight);
        let isFirstFrame = true;

        function renderChangedDots(changes, data) {
          // Clear canvas only on first frame
          if (isFirstFrame) {
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            isFirstFrame = false;
          }

          // Only render the dots that changed
          for (let i = 0; i < changes.length; i++) {
            const dotIndex = changes[i];
            const isOn = data[i] === 1;
            
            // Update client state
            clientState[dotIndex] = data[i];
            
            // Calculate position
            const x = dotIndex % gridWidth;
            const y = Math.floor(dotIndex / gridWidth);
            
            const sprite = isOn ? onDotCanvas : offDotCanvas;
            const destX = x * dotDiameter;
            const destY = y * dotDiameter;
            ctx.drawImage(sprite, destX, destY);
          }
        }

        let lastFetchTime = 0;
        const FETCH_INTERVAL = 100; // ms

        function fetchAndRender() {
          const now = Date.now();
          if (now - lastFetchTime >= FETCH_INTERVAL) {
            lastFetchTime = now;
            
            fetch('/frame')
              .then(response => response.json())
              .then(frameData => {
                if (frameData.changes && frameData.changes.length > 0) {
                  renderChangedDots(frameData.changes, frameData.data);
                }
              })
              .catch(err => console.error('Frame fetch error:', err));
          }
          
          requestAnimationFrame(fetchAndRender);
        }

        // Start the render loop
        requestAnimationFrame(fetchAndRender);
        
        // update game status every 500ms
        setInterval(() => {
          fetch('/status')
            .then(response => response.text())
            .then(status => {
              document.getElementById('gameStatus').textContent = status || 'Game Status: Running...';
            })
            .catch(() => {
              document.getElementById('gameStatus').textContent = 'Game Status: Connection Error';
            });
        }, 500);
        
        // send commands to the game
        function sendCommand(command) {
          fetch('/command', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command: command })
          }).catch(console.error);
        }
        
        // keyboard controls
        document.addEventListener('keydown', (e) => {
          switch(e.key.toLowerCase()) {
            case 'arrowup':
            case 'w':
              sendCommand('UP');
              e.preventDefault();
              break;
            case 'arrowdown':
            case 's':
              sendCommand('DOWN');
              e.preventDefault();
              break;
            case 'arrowleft':
            case 'a':
              sendCommand('LEFT');
              e.preventDefault();
              break;
            case 'arrowright':
            case 'd':
              sendCommand('RIGHT');
              e.preventDefault();
              break;
            case 'r':
              sendCommand('RESTART');
              e.preventDefault();
              break;
          }
        });
        document.addEventListener('DOMContentLoaded', () => {
          document.body.tabIndex = 0;
          document.body.focus();
        });
      </script>
    </body>
    </html>
  `);
});

// serve the current prototype as a frame (optimized: only changed dots)
app.get("/frame", (req, res) => {
  if (!currentPixelData) {
    // Create a default blank frame if no data exists
    res.json({ changes: [], data: [] });
    return;
  }
  
  res.set({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  // Send only the indices that changed and their new values
  const response = {
    changes: currentPixelData.changes,
    data: currentPixelData.changes.map(idx => currentPixelData.data[idx])
  };
  
  res.json(response);
});

// handle game commands
app.use(express.json());
app.post("/command", (req, res) => {
  if (!gameInstance) {
    return res.status(400).json({ error: "Game not initialized" });
  }
  
  const { command } = req.body;
  
  switch (command) {
    case 'UP':
      gameInstance.setDirection('UP');
      break;
    case 'DOWN':
      gameInstance.setDirection('DOWN');
      break;
    case 'LEFT':
      gameInstance.setDirection('LEFT');
      break;
    case 'RIGHT':
      gameInstance.setDirection('RIGHT');
      break;
    case 'RESTART':
      gameInstance.restart();
      break;
    default:
      return res.status(400).json({ error: "Invalid command" });
  }
  
  res.json({ success: true });
});

// get game status
app.get("/status", (req, res) => {
  if (!gameInstance) {
    return res.send("Game not initialized");
  }
  
  const status = gameInstance.getStatus();
  res.send(status || "Game running...");
});

// get sound events based on game state changes
app.get("/sound-event", (req, res) => {
  if (!gameInstance) {
    return res.json({ sound: null });
  }

  const currentState = gameInstance.gameState;
  let soundToPlay = null;

  // check for scene changes
  if (currentState.scene !== previousGameState.scene) {
    if (currentState.scene === 'TITLE') {
      soundToPlay = 'pacman_beginning.wav';
    }
    previousGameState.scene = currentState.scene;
  }

  // check if showing high scores (separate from scene change)
  if (currentState.scene === 'NAME_ENTRY' && 
      gameInstance.nameEntry.showingScores && 
      !previousGameState.showingScores) {
    soundToPlay = 'pacman_intermission.wav';
  }
  previousGameState.showingScores = gameInstance.nameEntry.showingScores;

  // check for life lost (death sound)
  if (currentState.lives !== null && 
      previousGameState.lives !== null && 
      currentState.lives < previousGameState.lives) {
    soundToPlay = 'pacman_death.wav';
  }
  previousGameState.lives = currentState.lives;

  // check for player movement (chomp sound)
  if (currentState.scene === 'PLAYING' && currentState.playing) {
    const playerX = currentState.player.x;
    const playerY = currentState.player.y;
    
    if (previousGameState.playerX !== null && 
        (playerX !== previousGameState.playerX || playerY !== previousGameState.playerY)) {
      soundToPlay = 'pacman_chomp.wav';
    }
    
    previousGameState.playerX = playerX;
    previousGameState.playerY = playerY;
  }

  res.json({ sound: soundToPlay });
});

// function to update the prototype renderer from external source
export function updatePrototypeRenderer(renderer) {
  prototypeRenderer = renderer;
}

// start the server
app.listen(PORT, () => {
  console.log(`FlipDot Prototype server running at http://localhost:${PORT}`);
});

export { app as prototypePreviewApp };