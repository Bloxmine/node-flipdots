import express from "express";
import { FlipDotPrototypeRenderer } from "./prototype-renderer.js";

const app = express();
const PORT = 3001;

// for serving static images
app.use('/images', express.static('images'));
app.use('/audio', express.static('audio'));

// global references
let prototypeRenderer = null;
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
        <img id="prototypeDisplay" src="/frame" alt="FlipDot Prototype">
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
        
        // Auto-refresh the image every 100ms
        setInterval(() => {
          const img = document.getElementById('prototypeDisplay');
          img.src = '/frame?' + new Date().getTime();
        }, 100);
        
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

// serve the current prototype as a frame
app.get("/frame", (req, res) => {
  if (!prototypeRenderer) {
    // create a default renderer if none exists
    prototypeRenderer = new FlipDotPrototypeRenderer(84, 28);
    prototypeRenderer.renderTestPattern();
  }
  
  res.set({
    'Content-Type': 'image/png',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.send(prototypeRenderer.getBuffer());
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