// --- PACXON GAME FOR FLIPDOT DISPLAY ---

// Configuration adapted for flipdot display
const GRID_W = 84;
const GRID_H = 28;
const WIN_PCT = 80;

// Character font for text rendering
const characters = {
  // Numbers 0-9 (3-pixel wide format)
  "0":[[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  "1":[[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  "2":[[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  "3":[[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  "4":[[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  "5":[[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  "6":[[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  "7":[[1,1,1],[0,0,1],[0,0,1],[0,1,0],[0,1,0]],
  "8":[[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  "9":[[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
  "P":[[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0]],
  "X":[[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]],
};
const lettersBig = {
      "A": [
        [0,1,1,1,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
    ],
    "B": [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
    ],
    "C": [
        [0,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1],
    ],
    "D": [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
    ],
    "E": [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [1,0,0,0,0],
        [1,1,1,1,1],
    ],
    "F": [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,1,1,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
    ],
    "G": [
        [0,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,1,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
    ],
    "H": [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
    ],
    "I": [
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,1,1,1],
    ],
    "J": [
        [0,0,0,0,1],
        [0,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,1],
    ],
    "K": [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
    ],
    "L": [
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1],
    ],
    "M": [
        [0,1,1,1,1],
        [1,0,1,0,1],
        [1,0,1,0,1],
        [1,0,1,0,1],
        [1,0,0,0,1],
    ],
    "N": [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
    ],
    "O": [
        [0,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0],
    ],
    "P": [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,0,0],
    ],
    "Q": [
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,1,0,1],
        [1,0,0,1,0],
        [1,1,1,0,1],
    ],
    "R": [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
    ],
    "S": [
        [0,1,1,1,1],
        [1,0,0,0,0],
        [1,1,1,1,1],
        [0,0,0,0,1],
        [1,1,1,1,0],
    ],
    "T": [
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
    ],
    "U": [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0],
    ],
    "V": [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,0,1,0,0],
    ],
    "W": [
        [1,0,0,0,1],
        [1,0,1,0,1],
        [1,0,1,0,1],
        [1,0,1,0,1],
        [1,1,1,1,0],
    ],
    "X": [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
    ],
    "Y": [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
    ],
    "Z": [
        [1,1,1,1,1],
        [0,0,0,0,1],
        [0,1,1,1,0],
        [1,0,0,0,0],
        [1,1,1,1,1],
    ],
    "?": [
        [1,1,1,1,1],
        [0,0,0,0,1],
        [0,0,1,1,1],
        [0,0,0,0,0],
        [0,0,1,0,0],
    ],
    "!": [
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,0,0,0],
        [0,0,1,0,0],
    ],
    "(": [
        [0,0,0,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,0,1,1],
    ],
    ")": [
        [1,1,0,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,0,0,0],
    ],
    "[": [
        [0,0,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,1,1],
    ],
    "]": [
        [1,1,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,1,0,0],
    ],
    "{": [
        [0,0,1,1,1],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [0,0,1,0,0],
        [0,0,1,1,1],
    ],
    "}": [
        [1,1,1,0,0],
        [0,0,1,0,0],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [1,1,1,0,0],
    ],
    ",": [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
    ],
    ".": [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [1,0,0,0,0],
    ],
    ":": [
        [1,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [1,0,0,0,0],
    ],
    ";": [
        [1,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
    ],
    " ": [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
    ],
    "-": [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [1,1,1,1,1],
        [0,0,0,0,0],
        [0,0,0,0,0],
    ],
    "^": [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,1],
    ],
    "~": [
        [1,0,1,1,1],
        [1,0,0,0,1],
        [1,0,1,1,1],
        [0,0,0,0,0],
        [1,0,0,1,0],
    ]
};

export class PacxonGame {
  constructor(width, height, autoPlay = false) {
    this.width = width;
    this.height = height;
    this.tick = 0;
    this.dir = null;
    this.keys = new Set();
    this.autoPlay = autoPlay;
    this.lastDirectionChange = 0;
    this.gameEndTime = 0;
    this.flashState = false; // For flashing START text
    
    this.gameState = this.getInitialState();
    
    // Input handling setup (if in browser environment)
    if (typeof window !== 'undefined') {
      this.setupInputHandlers();
    }
  }

  getInitialState() {
    const initialWalls = this.makeEmpty(GRID_W, GRID_H, false);
    
    // Create border walls
    for (let x = 0; x < GRID_W; x++) {
      initialWalls[0][x] = initialWalls[GRID_H - 1][x] = true;
    }
    for (let y = 0; y < GRID_H; y++) {
      initialWalls[y][0] = initialWalls[y][GRID_W - 1] = true;
    }
    
    return {
      scene: 'TITLE', // Start with title screen
      playing: false,
      score: 0,
      lives: 6,
      gameOver: false,
      win: false,
      player: { x: 1, y: 1 },
      trail: new Set(),
      walls: initialWalls,
      enemies: [
        { x: GRID_W / 2, y: GRID_H / 2, vx: 0.5, vy: 0.37 },
        { x: GRID_W / 3, y: GRID_H / 3, vx: -0.4, vy: 0.45 }
      ],
    };
  }

  setupInputHandlers() {
    // For browser environment only
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        this.keys.add(key);
        
        // Start game from title screen on any key press
        if (this.gameState.scene === 'TITLE') {
          this.startGame();
          return;
        }
        
        if (key === 'arrowup' || key === 'w') this.dir = 'UP';
        else if (key === 'arrowdown' || key === 's') this.dir = 'DOWN';
        else if (key === 'arrowleft' || key === 'a') this.dir = 'LEFT';
        else if (key === 'arrowright' || key === 'd') this.dir = 'RIGHT';
        else if (key === 'r') this.restart();
      });

      document.addEventListener('keyup', (e) => {
        this.keys.delete(e.key.toLowerCase());
      });
    }
  }

  // Method to set direction from external input
  setDirection(direction) {
    // Start game from title screen on any direction press
    if (this.gameState.scene === 'TITLE') {
      this.startGame();
      return;
    }
    this.dir = direction;
  }

  startGame() {
    this.gameState.scene = 'PLAYING';
    this.gameState.playing = true;
  }

  restart() {
    this.gameState = this.getInitialState();
    this.dir = null;
    this.tick = 0;
  }

  // Helper functions
  inBounds(x, y) { 
    return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H; 
  }
  
  makeEmpty(w, h, v) { 
    return Array.from({ length: h }, () => Array.from({ length: w }, () => v)); 
  }
  
  neighbors4(x, y) { 
    return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]; 
  }

  floodKeep(walls, enemies) {
    const keep = this.makeEmpty(GRID_W, GRID_H, false);
    const seen = this.makeEmpty(GRID_W, GRID_H, false);
    const q = [];
    
    for (const e of enemies) {
      const ex = Math.round(e.x), ey = Math.round(e.y);
      if (!this.inBounds(ex, ey) || walls[ey][ex]) continue;
      q.push([ex, ey]); 
      seen[ey][ex] = keep[ey][ex] = true;
    }
    
    while (q.length) {
      const [cx, cy] = q.shift();
      for (const [nx, ny] of this.neighbors4(cx, cy)) {
        if (!this.inBounds(nx, ny) || seen[ny][nx] || walls[ny][nx]) continue;
        seen[ny][nx] = keep[ny][nx] = true;
        q.push([nx, ny]);
      }
    }
    return keep;
  }

  update() {
    this.tick++;
    
    // Update flash state for title screen (flash every 15 ticks, ~0.25 seconds at 60fps)
    if (this.tick % 15 === 0) {
      this.flashState = !this.flashState;
    }
    
    if (this.gameState.scene !== 'PLAYING' || this.gameState.gameOver || this.gameState.win || !this.gameState.playing) {
      return;
    }

    // Enemy movement
    this.gameState.enemies = this.gameState.enemies.map(e => {
      let nx = e.x + e.vx;
      let ny = e.y + e.vy;
      
      if (this.gameState.walls[Math.round(e.y)]?.[Math.round(nx)]) {
        e.vx *= -1;
        nx = e.x + e.vx;
      }
      if (this.gameState.walls[Math.round(ny)]?.[Math.round(e.x)]) {
        e.vy *= -1;
        ny = e.y + e.vy;
      }
      return { ...e, x: nx, y: ny };
    });

    // Player movement (every other tick for speed control)
    if (!this.dir || this.tick % 2 !== 0) {
      return;
    }

    let scoreGained = 0;
    let nx = this.gameState.player.x, ny = this.gameState.player.y;
    
    if (this.dir === 'UP') ny--;
    if (this.dir === 'DOWN') ny++;
    if (this.dir === 'LEFT') nx--;
    if (this.dir === 'RIGHT') nx++;
    
    if (this.inBounds(nx, ny)) {
      this.gameState.player = { x: nx, y: ny };
      this.gameState.trail.add(`${nx},${ny}`);

      const onWall = this.gameState.walls[ny][nx];

      // Check collision with enemies
      const hit = this.gameState.enemies.some(e => 
        this.gameState.trail.has(`${Math.round(e.x)},${Math.round(e.y)}`)
      );
      
      if (hit) {
        this.gameState.lives--;
        if (this.gameState.lives <= 0) {
          this.gameState.gameOver = true;
          this.gameState.playing = false;
          this.gameState.lives = 0;
        }
        this.gameState.trail = new Set();
        this.gameState.player = { x: 1, y: 1 };
      } else if (onWall && this.gameState.trail.size > 1) {
        // Fill enclosed areas
        const tempWalls = this.gameState.walls.map(r => r.slice());
        this.gameState.trail.forEach(s => {
          const [sx, sy] = s.split(',').map(Number);
          if (tempWalls[sy]) tempWalls[sy][sx] = true;
        });
        
        const keep = this.floodKeep(tempWalls, this.gameState.enemies);
        for (let y = 1; y < GRID_H - 1; y++) {
          for (let x = 1; x < GRID_W - 1; x++) {
            if (!tempWalls[y][x] && !keep[y][x]) {
              tempWalls[y][x] = true;
              scoreGained++;
            }
          }
        }
        this.gameState.walls = tempWalls;
        this.gameState.trail = new Set();
      }
    }
    
    this.gameState.score += scoreGained;
    
    // Check win condition
    let filled = 0;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (this.gameState.walls[y][x]) filled++;
      }
    }
    
    const pct = Math.round((filled / (GRID_W * GRID_H)) * 100);
    if (!this.gameState.win && pct >= WIN_PCT) {
      this.gameState.win = true;
      this.gameState.playing = false;
    }
  }

  renderCustomText(ctx, text, x, y, scale = 1) {
    const charW = 5 * scale;
    const charH = 5 * scale;
    const spacing = 1 * scale;
    
    let currentX = x;
    
    for (let i = 0; i < text.length; i++) {
      const matrix = characters[text[i].toUpperCase()] || characters[" "];
      
      for (let py = 0; py < 5; py++) {
        for (let px = 0; px < 5; px++) {
          if (matrix[py][px]) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(
              currentX + px * scale, 
              y + py * scale, 
              scale, 
              scale
            );
          }
        }
      }
      currentX += charW + spacing;
    }
  }

  renderBigText(ctx, text, x, y, animated = false) {
    let currentX = x;
    const spacing = 2; // Space between letters
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toUpperCase();
      
      if (char === ' ') {
        currentX += 4; // Space width
        continue;
      }
      
      const matrix = lettersBig[char];
      if (!matrix) continue;
      
      // Calculate wave offset if animated
      let waveOffset = 0;
      if (animated) {
        // Create a sine wave effect based on character position and time
        const frequency = 0.8; // Wave frequency
        const amplitude = 2; // Wave height in pixels
        waveOffset = Math.floor(Math.sin((this.tick * 0.15) + (i * frequency)) * amplitude);
      }
      
      // Draw the letter with wave offset
      for (let py = 0; py < matrix.length; py++) {
        for (let px = 0; px < matrix[py].length; px++) {
          if (matrix[py][px]) {
            ctx.fillRect(currentX + px, y + py + waveOffset, 1, 1);
          }
        }
      }
      
      // Move to next letter position
      currentX += matrix[0].length + spacing;
    }
  }

  render(ctx) {
    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.width, this.height);

    // Render title screen
    if (this.gameState.scene === 'TITLE') {
      ctx.fillStyle = "#fff";
      
      // Calculate center positions for "PAC XON"
      // PAC = 5+2+5+2+5 = 19 pixels
      // space = 4 pixels
      // XON = 5+2+5+2+5 = 19 pixels
      // Total = 19 + 4 + 19 = 42 pixels
      const titleWidth = 42;
      const titleX = Math.floor((this.width - titleWidth) / 2);
      const titleY = 6;
      
      // Render animated wavy "PAC XON" text
      this.renderBigText(ctx, "PAC XON", titleX, titleY, true);
      
      // Render flashing "START" text
      if (this.flashState) {
        // START = 5+2+5+2+5+2+5+2+5 = 35 pixels
        const startWidth = 35;
        const startX = Math.floor((this.width - startWidth) / 2);
        const startY = 18;
        
        this.renderBigText(ctx, "START", startX, startY);
      }
      
      return;
    }

    // Always render the game field, even during game over or win states
    if (this.gameState.scene === 'PLAYING') {
      ctx.fillStyle = "#fff";
      
      // Draw walls
      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          if (this.gameState.walls[y][x]) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      
      // Draw trail
      this.gameState.trail.forEach(s => {
        const [tx, ty] = s.split(',').map(Number);
        ctx.fillRect(tx, ty, 1, 1);
      });
      
      // Draw enemies
      this.gameState.enemies.forEach(e => {
        ctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
      });
      
      // Draw player (blinking rapidly for visibility)
      if (this.tick % 8 < 4) {
        const px = this.gameState.player.x;
        const py = this.gameState.player.y;
        
        // Check if player is on a filled area (wall or trail)
        const onFilledArea = this.gameState.walls[py][px] || 
                            this.gameState.trail.has(`${px},${py}`);
        
        // Invert player color if on filled area for visibility
        ctx.fillStyle = onFilledArea ? "#000" : "#fff";
        ctx.fillRect(px, py, 1, 1);
        
        // Reset fill style back to white for other elements
        ctx.fillStyle = "#fff";
      }
      
      // Draw lives in top right corner with larger font for better visibility
      const livesText = this.gameState.lives.toString();
      const livesScale = 1.0; // Increased scale for better visibility
      const livesSpacing = 1;
      
      // Calculate lives text width
      let livesWidth = 0;
      for (let char of livesText) {
        if (characters[char]) {
          livesWidth += Math.floor(characters[char][0].length * livesScale) + livesSpacing;
        }
      }
      
      // Position lives in top right (with small margin)
      const livesX = this.width - livesWidth - 1;
      const livesY = 1;
      
      // Render lives text
      this.renderCustomText(ctx, livesText, livesX, livesY, livesScale);
    }
  }

  getStatus() {
    if (this.gameState.gameOver) {
      return `GAME OVER! Final Score: ${this.gameState.score} • Press R to restart`;
    }
    
    if (this.gameState.win) {
      return `YOU WIN! Final Score: ${this.gameState.score} • Press R to restart`;
    }
    
    if (this.gameState.scene !== 'PLAYING') {
      return '';
    }
    
    let filled = 0;
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (this.gameState.walls[y][x]) filled++;
      }
    }
    
    const pct = Math.round((filled / (GRID_W * GRID_H)) * 100);
    return `Score: ${this.gameState.score} • ${pct}% Filled • Lives: ${this.gameState.lives}`;
  }
}