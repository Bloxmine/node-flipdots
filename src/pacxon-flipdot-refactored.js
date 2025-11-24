// --- PACXON GAME FOR FLIPDOT DISPLAY ---
// Authors: Hein Dijstelbloem (prototype rendering, conversion to work on the flipdot board, score system, level system, fonts, further gameplay), Mohammed Ali Hussein (initial code, initial version of the gameplay), Christ Kastelijn (pixel art animations), Krystiana Petrova (testing).
// Date: 2025-11-21
// Version: 0.3.0 (Refactored)
// Description: Pacxon clone optimized for flipdot display

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { characters, lettersBig, animationFrames, pacmanEat, pacmanDead, pacmanDead2, pacmanDead3, titleScreen } from './characters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== CONSTANTS ==========
const GRID_W = 84;
const GRID_H = 28;
const WIN_PCT = 80;
const HIGH_SCORES_FILE = path.join(__dirname, '..', 'high-scores.json');
const MAX_LIVES = 9;
const BONUS_LIFE_INTERVAL = 3;
const CHAR_WIDTH = 7;
const CHAR_HEIGHT = 5;
// const CHAR_SPACING = 2;
const INPUT_DEBOUNCE_MS = 150;
const NAME_ENTRY_DELAY_MS = 500;
const SCORES_DISPLAY_MS = 10000;
const LEVEL_ADVANCE_DELAY_MS = 2000;
const LEVEL_TEXT_DISPLAY_MS = 1500;
const IDLE_WAIT_MS = 5000;
const ANIMATION_FRAME_MS = 100;
const SPRITE_FRAME_MS = 150;
const FLASH_INTERVAL_TICKS = 15;
const PLAYER_BLINK_TICKS = 8;
const PLAYER_MOVE_INTERVAL = 2;
const SPEED_INCREMENT = 0.05;
const IDLE_ANIMATION_SPEED = 1.5;
const FREEZE_DURATION = 135; // 9 seconds at 15 FPS
const POWERUP_BLINK_INTERVAL = 10;
const PERFECT_CLEAR_PCT = 95;
const PERFECT_FLASH_MS = 1500;

const DEATH_ANIMATIONS = [
  { frames: pacmanDead, speed: 100 },
  { frames: pacmanDead2, speed: 200 },
  { frames: pacmanDead3, speed: 200 }
];

const ENEMY_CONFIGS = [
  { x: GRID_W / 2, y: GRID_H / 2, vx: 0.5, vy: 0.37 },
  { x: GRID_W / 3, y: GRID_H / 3, vx: -0.4, vy: 0.45 },
  { x: GRID_W * 2 / 3, y: GRID_H / 2, vx: 0.45, vy: -0.42 },
  { x: GRID_W / 2, y: GRID_H * 2 / 3, vx: -0.38, vy: 0.48 },
  { x: GRID_W * 2 / 3, y: GRID_H * 2 / 3, vx: 0.42, vy: 0.4 }
];

const KEY_MAPPINGS = {
  'arrowup': 'UP', 'w': 'UP',
  'arrowdown': 'DOWN', 's': 'DOWN',
  'arrowleft': 'LEFT', 'a': 'LEFT',
  'arrowright': 'RIGHT', 'd': 'RIGHT'
};

const GAMEPAD_BUTTONS = {
  START: [9, 8, 3, 1],
  SUBMIT: [9, 0]
};

const HOW_TO_PLAY_TEXT = [
  "FILL UP", "BOXES,", "WATCH OUT", "FOR",
  "GHOSTS!", "MOVE", "AROUND", "TO DRAW."
];

// ========== MAIN CLASS ==========
export class PacxonGame {
  constructor(width, height, autoPlay = false) {
    this.width = width;
    this.height = height;
    this.tick = 0;
    this.dir = null;
    this.keys = new Set();
    this.autoPlay = autoPlay;
    this.currentLevel = 1;
    this.flashState = false;
    this.lastGamepadState = {};
    
    this.levelAnimation = this.createAnimationState();
    this.deathAnimation = this.createAnimationState();
    this.idleAnimation = this.createIdleAnimationState();
    this.howToPlay = { scrollOffset: 0, startTime: 0 };
    this.nameEntry = this.createNameEntryState();
    this.powerup = { x: -1, y: -1, active: false, blinkState: false };
    this.freezeTimer = 0;
    this.perfectClear = { active: false, startTime: 0 };
    
    this.highScores = this.loadHighScores();
    this.gameState = this.getInitialState();
    
    if (typeof window !== 'undefined') {
      this.setupInputHandlers();
    }
  }

  // ========== INITIALIZATION HELPERS ==========
  createAnimationState() {
    return { active: false, frame: 0, startTime: 0, frameCount: 0, selectedAnimation: null, speed: ANIMATION_FRAME_MS };
  }

  createIdleAnimationState() {
    return { phase: 'waiting', pacmanX: -16, ghostX: -40, frame: 0, lastFrameTime: 0, waitStartTime: Date.now() };
  }

  createNameEntryState() {
    return {
      name: ['A', 'A', 'A'],
      cursorPos: 0,
      lastInputTime: 0,
      showingScores: false,
      startTime: 0,
      scoresDisplayTime: 0,
      scrollOffset: 0
    };
  }

  getInitialState(keepScore = false, keepLevel = false, showTransition = false) {
    const walls = this.createBorderedGrid();
    const speedMultiplier = 1 + (this.currentLevel - 1) * SPEED_INCREMENT;
    const enemies = this.createEnemies(this.getEnemyCount(), speedMultiplier);
    
    return {
      scene: showTransition ? 'LEVEL_TRANSITION' : (keepScore ? 'PLAYING' : 'TITLE'),
      playing: keepScore && !showTransition,
      score: keepScore ? this.gameState.score : 0,
      lives: keepScore ? this.gameState.lives : 3,
      gameOver: false,
      win: false,
      player: { x: 1, y: 1 },
      trail: new Set(),
      walls,
      enemies
    };
  }

  createBorderedGrid() {
    const grid = this.makeEmpty(GRID_W, GRID_H, false);
    for (let x = 0; x < GRID_W; x++) {
      grid[0][x] = grid[GRID_H - 2][x] = true; // Bottom border moved up one line
    }
    for (let y = 0; y < GRID_H - 1; y++) { // Exclude the very bottom line from side borders
      grid[y][0] = grid[y][GRID_W - 1] = true;
    }
    return grid;
  }

  getEnemyCount() {
    if (this.currentLevel >= 7) return 5;
    if (this.currentLevel >= 5) return 4;
    if (this.currentLevel >= 3) return 3;
    return 2;
  }

  createEnemies(count, speedMultiplier) {
    return ENEMY_CONFIGS.slice(0, count).map(config => ({
      x: config.x,
      y: config.y,
      vx: config.vx * speedMultiplier,
      vy: config.vy * speedMultiplier
    }));
  }

  spawnPowerup(walls) {
    // Find random empty spot for powerup
    let attempts = 0;
    while (attempts < 100) {
      const x = Math.floor(Math.random() * (GRID_W - 4)) + 2;
      const y = Math.floor(Math.random() * (GRID_H - 4)) + 2;
      
      if (!walls[y][x]) {
        this.powerup = { x, y, active: true, blinkState: false };
        return;
      }
      attempts++;
    }
  }

  // ========== INPUT HANDLING ==========
  setupInputHandlers() {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys.add(key);
      
      if (this.handleSceneInput(key)) return;
      
      const direction = KEY_MAPPINGS[key];
      if (direction) {
        this.dir = direction;
      } else if (key === 'r') {
        this.restart();
      } else if (key === 'n' && this.gameState.scene === 'PLAYING') {
        // Next level for testing
        this.nextLevel();
      } else if (key === '3' && this.gameState.scene === 'TITLE') {
        // Quick test: start at level 3 to see powerup
        this.currentLevel = 3;
        this.startGame();
      }
    });

    document.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
  }

  handleSceneInput(key) {
    const { scene } = this.gameState;
    
    if (scene === 'NAME_ENTRY') {
      this.handleNameEntryInput(key);
      return true;
    }
    
    if (scene === 'HOW_TO_PLAY') {
      this.startActualGame();
      return true;
    }
    
    if (scene === 'TITLE') {
      if (this.idleAnimation.phase !== 'waiting') {
        this.resetIdleAnimation();
      } else {
        this.startGame();
      }
      return true;
    }
    
    return false;
  }

  pollGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (!gamepad) continue;

      const stateKey = `gamepad${i}`;
      const lastState = this.lastGamepadState[stateKey] || {};
      const dpad = this.getDpadState(gamepad);

      if (this.handleGamepadSceneInput(gamepad, dpad, lastState)) {
        this.lastGamepadState[stateKey] = { ...dpad, submit: this.isButtonPressed(gamepad, GAMEPAD_BUTTONS.SUBMIT) };
        continue;
      }

      this.handleGamepadDirections(dpad, lastState);
      this.handleGamepadButtons(gamepad, lastState);
      
      this.lastGamepadState[stateKey] = dpad;
    }
  }

  getDpadState(gamepad) {
    let dpadUp = gamepad.axes[1] < -0.5 || gamepad.axes[7] < -0.5;
    let dpadDown = gamepad.axes[1] > 0.5 || gamepad.axes[7] > 0.5;
    let dpadLeft = gamepad.axes[0] < -0.5 || gamepad.axes[6] < -0.5;
    let dpadRight = gamepad.axes[0] > 0.5 || gamepad.axes[6] > 0.5;

    dpadUp = dpadUp || gamepad.buttons[12]?.pressed || gamepad.buttons[4]?.pressed;
    dpadDown = dpadDown || gamepad.buttons[13]?.pressed || gamepad.buttons[5]?.pressed;
    dpadLeft = dpadLeft || gamepad.buttons[14]?.pressed || gamepad.buttons[6]?.pressed;
    dpadRight = dpadRight || gamepad.buttons[15]?.pressed || gamepad.buttons[7]?.pressed;

    return { dpadUp, dpadDown, dpadLeft, dpadRight };
  }

  isButtonPressed(gamepad, buttons) {
    return buttons.some(btn => gamepad.buttons[btn]?.pressed);
  }

  handleGamepadSceneInput(gamepad, dpad, lastState) {
    const { scene } = this.gameState;
    
    if (scene === 'NAME_ENTRY') {
      const directions = { dpadUp: 'arrowup', dpadDown: 'arrowdown', dpadLeft: 'arrowleft', dpadRight: 'arrowright' };
      for (const [key, value] of Object.entries(directions)) {
        if (dpad[key] && !lastState[key]) {
          this.handleNameEntryInput(value);
        }
      }
      if (this.isButtonPressed(gamepad, GAMEPAD_BUTTONS.SUBMIT) && !lastState.submit) {
        this.handleNameEntryInput('enter');
      }
      return true;
    }
    
    if (scene === 'TITLE') {
      const anyPressed = Object.values(dpad).some(Boolean) || gamepad.buttons.some(btn => btn?.pressed);
      if (anyPressed) {
        this.startGame();
        return true;
      }
    }
    
    return false;
  }

  handleGamepadDirections(dpad, lastState) {
    const dirMap = { dpadUp: 'UP', dpadDown: 'DOWN', dpadLeft: 'LEFT', dpadRight: 'RIGHT' };
    for (const [key, direction] of Object.entries(dirMap)) {
      if (dpad[key] && !lastState[key]) {
        this.dir = direction;
        break;
      }
    }
  }

  handleGamepadButtons(gamepad, lastState) {
    const startPressed = this.isButtonPressed(gamepad, GAMEPAD_BUTTONS.START);
    if (startPressed && !lastState.start) {
      this.restart();
    }
  }

  setDirection(direction) {
    if (this.gameState.scene === 'NAME_ENTRY') {
      const dirMap = { UP: 'arrowup', DOWN: 'arrowdown', LEFT: 'arrowleft', RIGHT: 'arrowright' };
      this.handleNameEntryInput(dirMap[direction]);
      return;
    }
    
    if (this.gameState.scene === 'TITLE') {
      this.startGame();
      return;
    }
    
    this.dir = direction;
  }

  handleButtonPress(button) {
    if (this.gameState.scene === 'HOW_TO_PLAY') {
      this.startActualGame();
      return;
    }
    
    if (this.gameState.scene === 'TITLE' && this.idleAnimation.phase !== 'waiting') {
      this.resetIdleAnimation();
      return;
    }
    
    if (this.gameState.scene === 'NAME_ENTRY' && !this.nameEntry.showingScores && 
        ['A', 'B', 'START'].includes(button)) {
      this.handleNameEntryInput('enter');
    }
  }

  // ========== GAME FLOW ==========
  startGame() {
    this.gameState.scene = 'HOW_TO_PLAY';
    this.howToPlay = { scrollOffset: 0, startTime: Date.now() };
  }

  startActualGame() {
    this.gameState.scene = 'PLAYING';
    this.gameState.playing = true;
    
    // Spawn powerup if level 3+
    if (this.currentLevel >= 3) {
      this.spawnPowerup(this.gameState.walls);
      console.log(`Powerup spawned at (${this.powerup.x}, ${this.powerup.y})`);
    }
  }

  restart() {
    this.currentLevel = 1;
    this.gameState = this.getInitialState();
    this.dir = null;
    this.tick = 0;
    this.resetIdleAnimation();
  }

  nextLevel() {
    this.currentLevel++;
    
    if (this.currentLevel % BONUS_LIFE_INTERVAL === 1 && this.currentLevel > 1 && this.gameState.lives < MAX_LIVES) {
      this.gameState.lives++;
    }
    
    this.startLevelAnimation();
    this.gameState = this.getInitialState(true, true, true);
    this.dir = null;
    this.tick = 0;
  }

  startLevelAnimation() {
    this.levelAnimation.active = true;
    this.levelAnimation.frame = 0;
    this.levelAnimation.startTime = Date.now();
    this.levelAnimation.frameCount = Object.keys(pacmanEat).length;
    
    const animationDuration = this.levelAnimation.frameCount * ANIMATION_FRAME_MS;
    
    setTimeout(() => {
      this.levelAnimation.active = false;
      setTimeout(() => {
        if (this.gameState.scene === 'LEVEL_TRANSITION') {
          this.gameState.scene = 'PLAYING';
          this.gameState.playing = true;
          
          // Spawn powerup after level starts (level 3+)
          if (this.currentLevel >= 3) {
            this.spawnPowerup(this.gameState.walls);
            console.log(`Powerup spawned at (${this.powerup.x}, ${this.powerup.y})`);
          }
        }
      }, LEVEL_TEXT_DISPLAY_MS);
    }, animationDuration);
  }

  resetIdleAnimation() {
    this.idleAnimation.phase = 'waiting';
    this.idleAnimation.waitStartTime = Date.now();
    this.idleAnimation.pacmanX = -16;
    this.idleAnimation.ghostX = -40;
  }

  // ========== GAME LOGIC ==========
  inBounds(x, y) {
    // Exclude the bottom progress bar line (y = GRID_H - 1)
    return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H - 1;
  }
  
  makeEmpty(w, h, v) {
    return Array.from({ length: h }, () => Array(w).fill(v));
  }
  
  neighbors4(x, y) {
    return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
  }

  floodKeep(walls, enemies) {
    const keep = this.makeEmpty(GRID_W, GRID_H, false);
    const seen = this.makeEmpty(GRID_W, GRID_H, false);
    const q = [];
    
    for (const e of enemies) {
      const [ex, ey] = [Math.round(e.x), Math.round(e.y)];
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

  // ========== HIGH SCORES ==========
  loadHighScores() {
    if (typeof fs === 'undefined') return [];
    
    try {
      if (fs.existsSync(HIGH_SCORES_FILE)) {
        const data = fs.readFileSync(HIGH_SCORES_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading high scores:', err);
    }
    return [];
  }

  saveHighScores() {
    if (typeof fs === 'undefined') {
      console.log('High scores (browser mode):', this.highScores);
      return;
    }
    
    try {
      fs.writeFileSync(HIGH_SCORES_FILE, JSON.stringify(this.highScores, null, 2));
      const latest = this.highScores[this.highScores.length - 1];
      if (latest) console.log(`${latest.name}: ${latest.score}`);
    } catch (err) {
      console.error('Error saving high scores:', err);
    }
  }

  addHighScore(name, score, level) {
    this.highScores.push({
      name: name.join(''),
      score,
      level,
      date: new Date().toISOString()
    });
    
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 10);
    this.saveHighScores();
  }

  handleNameEntryInput(key) {
    const now = Date.now();
    
    if (this.nameEntry.showingScores || now - this.nameEntry.startTime < NAME_ENTRY_DELAY_MS) return;
    if (now - this.nameEntry.lastInputTime < INPUT_DEBOUNCE_MS) return;
    
    this.nameEntry.lastInputTime = now;
    const pos = this.nameEntry.cursorPos;

    if (key === 'arrowup') {
      const code = this.nameEntry.name[pos].charCodeAt(0);
      this.nameEntry.name[pos] = String.fromCharCode(code === 90 ? 65 : code + 1);
    } else if (key === 'arrowdown') {
      const code = this.nameEntry.name[pos].charCodeAt(0);
      this.nameEntry.name[pos] = String.fromCharCode(code === 65 ? 90 : code - 1);
    } else if (key === 'arrowright') {
      if (pos === 2) {
        this.submitScore();
      } else {
        this.nameEntry.cursorPos++;
      }
    } else if (key === 'arrowleft') {
      this.nameEntry.cursorPos = (pos - 1 + 3) % 3;
    } else if (key === 'enter' || key === ' ') {
      this.submitScore();
    }
  }

  submitScore() {
    this.addHighScore(this.nameEntry.name, this.gameState.score, this.currentLevel);
    this.nameEntry.name = ['A', 'A', 'A'];
    this.nameEntry.cursorPos = 0;
    this.nameEntry.showingScores = true;
    this.nameEntry.scoresDisplayTime = Date.now();
    this.nameEntry.scrollOffset = 0;
  }

  // ========== ANIMATIONS ==========
  updateIdleAnimation() {
    const now = Date.now();
    
    if (this.idleAnimation.phase === 'waiting') {
      if (now - this.idleAnimation.waitStartTime >= IDLE_WAIT_MS) {
        this.idleAnimation.phase = 'chase';
        this.idleAnimation.pacmanX = -16;
        this.idleAnimation.ghostX = -40;
      }
      return;
    }
    
    if (now - this.idleAnimation.lastFrameTime > SPRITE_FRAME_MS) {
      this.idleAnimation.frame = (this.idleAnimation.frame + 1) % 2;
      this.idleAnimation.lastFrameTime = now;
    }
    
    if (this.idleAnimation.phase === 'chase') {
      this.idleAnimation.pacmanX += IDLE_ANIMATION_SPEED;
      this.idleAnimation.ghostX += IDLE_ANIMATION_SPEED;
      
      if (this.idleAnimation.pacmanX > this.width + 16) {
        this.idleAnimation.phase = 'flee';
        this.idleAnimation.ghostX = this.width + 16;
        this.idleAnimation.pacmanX = this.width + 40;
      }
    } else if (this.idleAnimation.phase === 'flee') {
      this.idleAnimation.pacmanX -= IDLE_ANIMATION_SPEED;
      this.idleAnimation.ghostX -= IDLE_ANIMATION_SPEED;
      
      if (this.idleAnimation.ghostX < -16) {
        this.idleAnimation.phase = 'waiting';
        this.idleAnimation.waitStartTime = now;
        this.idleAnimation.pacmanX = -16;
        this.idleAnimation.ghostX = -40;
      }
    }
  }

  // ========== UPDATE ==========
  update() {
    this.tick++;
    this.pollGamepad();
    
    if (this.tick % FLASH_INTERVAL_TICKS === 0) {
      this.flashState = !this.flashState;
    }
    
    if (this.tick % POWERUP_BLINK_INTERVAL === 0) {
      this.powerup.blinkState = !this.powerup.blinkState;
    }
    
    if (this.freezeTimer > 0) {
      this.freezeTimer--;
    }
    
    if (this.gameState.scene === 'TITLE') {
      this.updateIdleAnimation();
    }
    
    if (this.gameState.scene === 'NAME_ENTRY' && this.nameEntry.showingScores) {
      const elapsed = Date.now() - this.nameEntry.scoresDisplayTime;
      if (elapsed >= SCORES_DISPLAY_MS) {
        this.nameEntry.showingScores = false;
        this.restart();
        return;
      }
    }
    
    if (this.gameState.scene !== 'PLAYING' || this.gameState.gameOver || this.gameState.win || !this.gameState.playing) {
      return;
    }

    this.updateEnemies();
    this.updatePlayer();
    this.checkWinCondition();
  }

  updateEnemies() {
    // Skip enemy movement if frozen
    if (this.freezeTimer > 0) return;
    
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
  }

  updatePlayer() {
    if (!this.dir || this.tick % PLAYER_MOVE_INTERVAL !== 0) return;

    const dirMap = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] };
    const [dx, dy] = dirMap[this.dir];
    const [nx, ny] = [this.gameState.player.x + dx, this.gameState.player.y + dy];
    
    if (!this.inBounds(nx, ny)) return;
    
    this.gameState.player = { x: nx, y: ny };
    this.gameState.trail.add(`${nx},${ny}`);
    
    // Check powerup collection
    if (this.powerup.active && nx === this.powerup.x && ny === this.powerup.y) {
      this.powerup.active = false;
      this.freezeTimer = FREEZE_DURATION;
    }

    if (this.checkCollision()) {
      this.handleCollision();
    } else if (this.gameState.walls[ny][nx] && this.gameState.trail.size > 1) {
      this.fillEnclosedAreas();
    }
  }

  checkCollision() {
    return this.gameState.enemies.some(e => 
      this.gameState.trail.has(`${Math.round(e.x)},${Math.round(e.y)}`)
    );
  }

  handleCollision() {
    this.gameState.lives--;
    
    if (this.gameState.lives <= 0) {
      this.triggerDeathAnimation();
    }
    
    this.gameState.trail = new Set();
    this.gameState.player = { x: 1, y: 1 };
  }

  triggerDeathAnimation() {
    const randomIndex = Math.floor(Math.random() * DEATH_ANIMATIONS.length);
    const selected = DEATH_ANIMATIONS[randomIndex];
    
    this.deathAnimation.selectedAnimation = selected.frames;
    this.deathAnimation.speed = selected.speed;
    this.deathAnimation.active = true;
    this.deathAnimation.frame = 0;
    this.deathAnimation.startTime = Date.now();
    this.deathAnimation.frameCount = Object.keys(selected.frames).length;
    this.gameState.playing = false;
    
    setTimeout(() => {
      this.deathAnimation.active = false;
      this.gameState.gameOver = true;
      this.gameState.playing = false;
      this.gameState.lives = 0;
      this.gameState.scene = 'NAME_ENTRY';
      this.nameEntry.startTime = Date.now();
    }, this.deathAnimation.frameCount * this.deathAnimation.speed);
  }

  fillEnclosedAreas() {
    const tempWalls = this.gameState.walls.map(r => r.slice());
    this.gameState.trail.forEach(s => {
      const [sx, sy] = s.split(',').map(Number);
      if (tempWalls[sy]) tempWalls[sy][sx] = true;
    });
    
    const keep = this.floodKeep(tempWalls, this.gameState.enemies);
    let scoreGained = 0;
    
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
    this.gameState.score += scoreGained;
  }

  checkWinCondition() {
    // Calculate fill percentage (excluding borders and progress bar line)
    const playableWidth = GRID_W - 2;
    const playableHeight = GRID_H - 3;
    const totalPlayableCells = playableWidth * playableHeight;
    
    // Count filled cells in playable area only
    let filledPlayable = 0;
    for (let y = 1; y < GRID_H - 2; y++) {
      for (let x = 1; x < GRID_W - 1; x++) {
        if (this.gameState.walls[y][x]) {
          filledPlayable++;
        }
      }
    }
    
    const pct = Math.round((filledPlayable / totalPlayableCells) * 100);
    
    if (!this.gameState.win && pct >= WIN_PCT) {
      this.gameState.win = true;
      this.gameState.playing = false;
      
      // Check for perfect clear
      const isPerfect = pct >= PERFECT_CLEAR_PCT;
      
      if (isPerfect) {
        this.perfectClear.active = true;
        this.perfectClear.startTime = Date.now();
        setTimeout(() => {
          this.perfectClear.active = false;
          if (this.gameState.win) this.nextLevel();
        }, PERFECT_FLASH_MS + LEVEL_ADVANCE_DELAY_MS);
      } else {
        setTimeout(() => {
          if (this.gameState.win) this.nextLevel();
        }, LEVEL_ADVANCE_DELAY_MS);
      }
    }
  }

  // ========== RENDERING ==========
  render(ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.width, this.height);

    const sceneRenderers = {
      'NAME_ENTRY': () => this.renderNameEntry(ctx),
      'HOW_TO_PLAY': () => this.renderHowToPlay(ctx),
      'LEVEL_TRANSITION': () => this.renderLevelTransition(ctx),
      'TITLE': () => this.renderTitle(ctx),
      'PLAYING': () => this.renderGame(ctx)
    };

    const renderer = sceneRenderers[this.gameState.scene];
    if (renderer) renderer();
  }

  renderNameEntry(ctx) {
    ctx.fillStyle = "#fff";
    
    if (this.nameEntry.showingScores) {
      this.renderHighScores(ctx);
      return;
    }
    
    this.renderBigText(ctx, "GAME OVER", 16, 2);
    this.renderBigText(ctx, `SCORE: ${this.gameState.score}`, 2, 10);
    this.renderBigText(ctx, "NAME:", 2, 18);
    
    const nameStartX = 36;
    this.nameEntry.name.forEach((letter, i) => {
      const x = nameStartX + i * 8;
      this.renderBigText(ctx, letter, x, 18);
      if (i === this.nameEntry.cursorPos && this.flashState) {
        ctx.fillRect(x, 24, 5, 1);
      }
    });
  }

  renderHighScores(ctx) {
    const elapsed = Date.now() - this.nameEntry.scoresDisplayTime;
    const lineHeight = 6;
    const visibleLines = Math.floor(this.height / lineHeight);
    
    if (this.highScores.length > visibleLines) {
      const maxScroll = -(this.highScores.length - visibleLines) * lineHeight;
      const scrollProgress = Math.sin(elapsed * 0.0006);
      this.nameEntry.scrollOffset = (scrollProgress * 0.5 + 0.5) * maxScroll;
    }
    
    this.highScores.forEach((score, i) => {
      const y = 2 + (i * lineHeight) + this.nameEntry.scrollOffset;
      if (y >= -lineHeight && y < this.height) {
        this.renderBigText(ctx, `${score.name}: ${score.score}`, 2, Math.round(y));
      }
    });
  }

  renderHowToPlay(ctx) {
    ctx.fillStyle = "#fff";
    const elapsed = Date.now() - this.howToPlay.startTime;
    this.howToPlay.scrollOffset = elapsed * 0.007;
    
    const lineHeight = 7;
    const startY = this.height - this.howToPlay.scrollOffset;
    
    HOW_TO_PLAY_TEXT.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      if (y >= -lineHeight && y < this.height + lineHeight) {
        const x = Math.floor((this.width - line.length * CHAR_WIDTH) / 2);
        this.renderBigText(ctx, line, x, Math.round(y));
      }
    });
    
    const lastLineY = startY + ((HOW_TO_PLAY_TEXT.length - 1) * lineHeight);
    if (lastLineY < -lineHeight) {
      this.startActualGame();
    }
  }

  renderLevelTransition(ctx) {
    if (this.levelAnimation.active) {
      this.renderAnimationFrame(ctx, pacmanEat, this.levelAnimation);
    } else if (this.flashState) {
      ctx.fillStyle = "#fff";
      const levelText = `LEVEL ${this.currentLevel}`;
      const textWidth = levelText.length * CHAR_WIDTH;
      const x = Math.floor((this.width - textWidth) / 2);
      const y = Math.floor((this.height - CHAR_HEIGHT) / 2);
      this.renderBigText(ctx, levelText, x, y);
    }
  }

  renderTitle(ctx) {
    ctx.fillStyle = "#fff";
    
    if (this.idleAnimation.phase === 'waiting') {
      if (this.flashState) {
        // Show the titleScreen image (Pac Xon logo)
        const titleFrame = titleScreen.frame_1;
        if (titleFrame) {
          for (let y = 0; y < titleFrame.length && y < this.height; y++) {
            for (let x = 0; x < titleFrame[y].length && x < this.width; x++) {
              if (titleFrame[y][x] === 1) {
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }
        }
      } else {
        const x = Math.floor((this.width - 35) / 2);
        const y = Math.floor((this.height - 5) / 2);
        this.renderBigText(ctx, "START", x, y);
      }
    }
    
    if (this.idleAnimation.phase !== 'waiting') {
      this.renderIdleAnimation(ctx);
    }
  }

  renderIdleAnimation(ctx) {
    const animY = this.height - 18;
    const frame = this.idleAnimation.frame;
    
    if (this.idleAnimation.phase === 'chase') {
      const ghostSprite = frame === 0 ? 'ghost1' : 'ghost2';
      const pacSprite = frame === 0 ? 'pacmanmouthopenToRight' : 'pacmanfilled';
      this.renderSprite(ctx, ghostSprite, Math.round(this.idleAnimation.ghostX), animY);
      this.renderSprite(ctx, pacSprite, Math.round(this.idleAnimation.pacmanX), animY);
    } else if (this.idleAnimation.phase === 'flee') {
      const ghostSprite = frame === 0 ? 'ghostafraid1' : 'ghostafraid2';
      const pacSprite = frame === 0 ? 'pacmanmouthopenToLeft' : 'pacmanfilled';
      this.renderSprite(ctx, ghostSprite, Math.round(this.idleAnimation.ghostX), animY);
      this.renderSprite(ctx, pacSprite, Math.round(this.idleAnimation.pacmanX), animY);
    }
  }

  renderGame(ctx) {
    if (this.deathAnimation.active) {
      this.renderAnimationFrame(ctx, this.deathAnimation.selectedAnimation, this.deathAnimation);
      return;
    }
    
    // Show PERFECT! flash if active
    if (this.perfectClear.active) {
      if (this.flashState) {
        ctx.fillStyle = "#fff";
        const text = "PERFECT!";
        const textWidth = text.length * CHAR_WIDTH;
        const x = Math.floor((this.width - textWidth) / 2);
        const y = Math.floor((this.height - CHAR_HEIGHT) / 2);
        this.renderBigText(ctx, text, x, y);
      }
      return;
    }
    
    ctx.fillStyle = "#fff";
    
    // Walls
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        if (this.gameState.walls[y][x]) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    
    // Trail
    this.gameState.trail.forEach(s => {
      const [tx, ty] = s.split(',').map(Number);
      ctx.fillRect(tx, ty, 1, 1);
    });
    
    // Enemies
    this.gameState.enemies.forEach(e => {
      ctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
    });
    
    // Powerup (blinking dot)
    if (this.powerup.active && this.powerup.blinkState) {
      ctx.fillRect(this.powerup.x, this.powerup.y, 1, 1);
    }
    
    // Player (blinking)
    if (this.tick % PLAYER_BLINK_TICKS < 4) {
      const { x, y } = this.gameState.player;
      const onFilled = this.gameState.walls[y][x] || this.gameState.trail.has(`${x},${y}`);
      ctx.fillStyle = onFilled ? "#000" : "#fff";
      ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = "#fff";
    }
    
    // Lives
    this.renderLives(ctx);
    
    // Progress bar at the bottom
    this.renderProgressBar(ctx);
  }

  renderLives(ctx) {
    const livesText = this.gameState.lives.toString();
    let width = 0;
    for (let char of livesText) {
      if (characters[char]) {
        width += characters[char][0].length + 1;
      }
    }
    this.renderCustomText(ctx, livesText, this.width - width - 1, 1, 1, this.gameState.walls);
    
    // Show freeze timer below lives if active
    if (this.freezeTimer > 0) {
      const secondsLeft = Math.ceil(this.freezeTimer / 15); // Convert ticks to seconds
      const timerText = secondsLeft.toString();
      let timerWidth = 0;
      for (let char of timerText) {
        if (characters[char]) {
          timerWidth += characters[char][0].length + 1;
        }
      }
      this.renderCustomText(ctx, timerText, this.width - timerWidth - 1, 7, 1, this.gameState.walls);
    }
  }

  renderProgressBar(ctx) {
    // Calculate fill percentage (excluding borders and progress bar line)
    // Playable area is (GRID_W - 2) * (GRID_H - 3) because:
    // - 2 pixels for left/right borders
    // - 3 pixels for top, bottom border, and progress bar line
    const playableWidth = GRID_W - 2;
    const playableHeight = GRID_H - 3;
    const totalPlayableCells = playableWidth * playableHeight;
    
    // Count filled cells in playable area only (excluding borders)
    let filledPlayable = 0;
    for (let y = 1; y < GRID_H - 2; y++) {
      for (let x = 1; x < GRID_W - 1; x++) {
        if (this.gameState.walls[y][x]) {
          filledPlayable++;
        }
      }
    }
    
    const fillPct = filledPlayable / totalPlayableCells;
    
    // Progress bar fills from left to right on the bottom line with blinking effect
    const progressWidth = Math.floor(fillPct * GRID_W);
    
    // Only render if flashState is true (makes it blink)
    if (this.flashState) {
      ctx.fillStyle = "#fff";
      for (let x = 0; x < progressWidth; x++) {
        ctx.fillRect(x, GRID_H - 1, 1, 1);
      }
    }
  }

  // ========== RENDERING HELPERS ==========
  renderAnimationFrame(ctx, animation, state) {
    const now = Date.now();
    const elapsed = now - state.startTime;
    const frameIndex = Math.floor(elapsed / (state.speed || ANIMATION_FRAME_MS)) % (state.frameCount || Object.keys(animation).length);
    const frameKey = `frame_${frameIndex + 1}`;
    const frame = animation[frameKey];
    
    if (frame) {
      ctx.fillStyle = "#fff";
      for (let y = 0; y < frame.length && y < this.height; y++) {
        for (let x = 0; x < frame[y].length && x < this.width; x++) {
          if (frame[y][x] === 1) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }
  }

  renderCustomText(ctx, text, x, y, scale = 1, walls = null) {
    const charW = 5 * scale;
    const spacing = 1 * scale;
    let currentX = x;
    
    for (const char of text) {
      const matrix = characters[char.toUpperCase()] || characters[" "];
      
      for (let py = 0; py < 5; py++) {
        for (let px = 0; px < 5; px++) {
          if (matrix[py][px]) {
            const pixelX = Math.floor(currentX + px * scale);
            const pixelY = Math.floor(y + py * scale);
            
            const onFilledArea = walls && pixelY >= 0 && pixelY < walls.length && 
                                 pixelX >= 0 && pixelX < walls[0].length && walls[pixelY][pixelX];
            
            ctx.fillStyle = onFilledArea ? "#000" : "#fff";
            ctx.fillRect(pixelX, pixelY, scale, scale);
          }
        }
      }
      currentX += charW + spacing;
    }
  }

  renderBigText(ctx, text, x, y, animated = false) {
    let currentX = x;
    const spacing = 2;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toUpperCase();
      
      if (char === ' ') {
        currentX += 4;
        continue;
      }
      
      const matrix = lettersBig[char];
      if (!matrix) continue;
      
      const waveOffset = animated ? Math.floor(Math.sin((this.tick * 0.15) + (i * 0.8)) * 2) : 0;
      
      for (let py = 0; py < matrix.length; py++) {
        for (let px = 0; px < matrix[py].length; px++) {
          if (matrix[py][px]) {
            ctx.fillRect(currentX + px, y + py + waveOffset, 1, 1);
          }
        }
      }
      
      currentX += matrix[0].length + spacing;
    }
  }

  renderSprite(ctx, spriteName, x, y) {
    const sprite = animationFrames[spriteName];
    if (!sprite) return;
    
    ctx.fillStyle = "#fff";
    for (let py = 0; py < sprite.length; py++) {
      for (let px = 0; px < sprite[py].length; px++) {
        if (sprite[py][px] === 1) {
          ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    }
  }

  // ========== STATUS ==========
  getStatus() {
    const { scene, score, lives, gameOver, win } = this.gameState;
    
    if (scene === 'NAME_ENTRY') {
      if (this.nameEntry.showingScores) {
        const elapsed = Date.now() - this.nameEntry.scoresDisplayTime;
        const remaining = Math.ceil((SCORES_DISPLAY_MS - elapsed) / 1000);
        return `High Scores • Auto-restart in ${remaining}s`;
      }
      return `Enter your name: ${this.nameEntry.name.join('')} • Use arrows to change letters • Press RIGHT on last letter to submit`;
    }
    
    if (gameOver) {
      return `GAME OVER! Level: ${this.currentLevel} • Final Score: ${score}`;
    }
    
    if (win) {
      return `LEVEL ${this.currentLevel} COMPLETE! Advancing to Level ${this.currentLevel + 1}...`;
    }
    
    if (scene !== 'PLAYING') return '';
    
    const filled = this.gameState.walls.flat().filter(Boolean).length;
    const pct = Math.round((filled / (GRID_W * GRID_H)) * 100);
    return `Level: ${this.currentLevel} • Score: ${score} • ${pct}% Filled • Lives: ${lives}`;
  }
}
