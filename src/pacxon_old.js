            // --- CONFIG ---
            const GRID_W = 84;
            const GRID_H = 28;
            const DOT = 8;
            const CANVAS_W = GRID_W * DOT;
            const CANVAS_H = GRID_H * DOT;
            const WIN_PCT = 80;
            const FPS = 30;

            // --- DOM ELEMENTS ---
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            const statusDisplay = document.getElementById('statusDisplay');
            
            // Buttons
            const startBtn = document.getElementById('startBtn');
            const pauseBtn = document.getElementById('pauseBtn');
            const restartBtn = document.getElementById('restartBtn');
            const backBtn = document.getElementById('backBtn');
            const restartEndBtn = document.getElementById('restartEndBtn');
            const backEndBtn = document.getElementById('backEndBtn');

            // --- CANVAS SETUP ---
            canvas.width = CANVAS_W;
            canvas.height = CANVAS_H;

            // --- CHARACTER FONT ---
            const characters = {
              "W":[[1,0,0,0,1],[1,0,1,0,1],[1,0,1,0,1],[1,0,1,0,1],[1,1,1,1,0]],
              "E":[[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,1,1,1]],
              "L":[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
              "C":[[0,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,1]],
              "O":[[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
              "M":[[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1]],
              "T":[[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
              "A":[[0,1,1,1,0],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
              "N":[[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1]],
              "I":[[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
              "S":[[0,1,1,1,1],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
              "G":[[0,1,1,1,1],[1,0,0,0,0],[1,0,0,1,1],[1,0,0,0,1],[0,1,1,1,1]],
              "V":[[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0]],
              "R":[[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,1,0,0],[1,0,0,1,0]],
              " ":[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
              "!":[[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,1,0,0]],
            };

            // --- DOT BUFFER CLASS ---
            class DotBuffer {
                constructor(w, h) { this.w = w; this.h = h; this.data = new Uint8Array(w * h); }
                clear(v = 0) { this.data.fill(v); }
                set(x, y, v = 1) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.data[y * this.w + x] = v ? 1 : 0; }
                get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.data[y * this.w + x] : 0; }
            }
            
            const buf = new DotBuffer(GRID_W, GRID_H);

            // --- GAME STATE ---
            let gameState;
            let dir = null;
            let tick = 0;
            let gameInterval = null;

            function getInitialState() {
                const initialWalls = makeEmpty(GRID_W, GRID_H, false);
                for (let x = 0; x < GRID_W; x++) {
                    initialWalls[0][x] = initialWalls[GRID_H - 1][x] = true;
                }
                for (let y = 0; y < GRID_H; y++) {
                    initialWalls[y][0] = initialWalls[y][GRID_W - 1] = true;
                }
                return {
                    scene: 'WELCOME',
                    playing: false,
                    score: 0,
                    lives: 3,
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

            // --- GAME LOGIC & HELPERS ---
            function inBounds(x, y) { return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H; }
            function makeEmpty(w, h, v) { return Array.from({ length: h }, () => Array.from({ length: w }, () => v)); }
            function neighbors4(x, y) { return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]; }

            function floodKeep(walls, enemies) {
                const keep = makeEmpty(GRID_W, GRID_H, false);
                const seen = makeEmpty(GRID_W, GRID_H, false);
                const q = [];
                for (const e of enemies) {
                    const ex = Math.round(e.x), ey = Math.round(e.y);
                    if (!inBounds(ex, ey) || walls[ey][ex]) continue;
                    q.push([ex, ey]); seen[ey][ex] = keep[ey][ex] = true;
                }
                while (q.length) {
                    const [cx, cy] = q.shift();
                    for (const [nx, ny] of neighbors4(cx, cy)) {
                        if (!inBounds(nx, ny) || seen[ny][nx] || walls[ny][nx]) continue;
                        seen[ny][nx] = keep[ny][nx] = true;
                        q.push([nx, ny]);
                    }
                }
                return keep;
            }

            // --- MAIN UPDATE FUNCTION ---
            function updateGame() {
                if (gameState.scene !== 'PAXCON' || gameState.gameOver || gameState.win || !gameState.playing) {
                    return;
                }

                // Enemy movement
                gameState.enemies = gameState.enemies.map(e => {
                    let nx = e.x + e.vx;
                    let ny = e.y + e.vy;
                    if (gameState.walls[Math.round(e.y)]?.[Math.round(nx)]) {
                        e.vx *= -1;
                        nx = e.x + e.vx;
                    }
                    if (gameState.walls[Math.round(ny)]?.[Math.round(e.x)]) {
                        e.vy *= -1;
                        ny = e.y + e.vy;
                    }
                    return { ...e, x: nx, y: ny };
                });

                if (!dir || tick % 2 !== 0) {
                    return;
                }

                // Player movement logic
                let scoreGained = 0;
                let nx = gameState.player.x, ny = gameState.player.y;
                if (dir === 'UP') ny--; if (dir === 'DOWN') ny++; if (dir === 'LEFT') nx--; if (dir === 'RIGHT') nx++;
                
                if (inBounds(nx, ny)) {
                    gameState.player = { x: nx, y: ny };
                    gameState.trail.add(`${nx},${ny}`);

                    const onWall = gameState.walls[ny][nx];

                    const hit = gameState.enemies.some(e => gameState.trail.has(`${Math.round(e.x)},${Math.round(e.y)}`));
                    if (hit) {
                        gameState.lives--;
                        if (gameState.lives <= 0) {
                            gameState.gameOver = true;
                            gameState.playing = false;
                            gameState.lives = 0;
                        }
                        gameState.trail = new Set();
                        gameState.player = { x: 1, y: 1 };
                    } else if (onWall && gameState.trail.size > 1) {
                        const tempWalls = gameState.walls.map(r => r.slice());
                        gameState.trail.forEach(s => { const [sx, sy] = s.split(',').map(Number); if(tempWalls[sy]) tempWalls[sy][sx] = true; });
                        const keep = floodKeep(tempWalls, gameState.enemies);
                        for (let y = 1; y < GRID_H - 1; y++) {
                            for (let x = 1; x < GRID_W - 1; x++) {
                                if (!tempWalls[y][x] && !keep[y][x]) {
                                    tempWalls[y][x] = true;
                                    scoreGained++;
                                }
                            }
                        }
                        gameState.walls = tempWalls;
                        gameState.trail = new Set();
                    }
                }
                gameState.score += scoreGained;
            }

            // --- RENDER FUNCTIONS ---
            function renderCustomText(text, align, spacing = 1) {
                const charW = 5, charH = 5, totalW = text.length * (charW + spacing) - spacing;
                let startX = align === 'center' ? Math.floor((buf.w - totalW) / 2) : 0;
                const startY = Math.floor((buf.h - charH) / 2);
                for (let i = 0; i < text.length; i++) {
                    const matrix = characters[text[i].toUpperCase()] || characters[" "];
                    const offX = startX + i * (charW + spacing);
                    for (let y = 0; y < charH; y++) for (let x = 0; x < charW; x++) if (matrix[y][x]) buf.set(offX + x, startY + y, 1);
                }
            }

            function drawBuffer() {
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
                for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) {
                    const on = buf.get(x, y);
                    ctx.beginPath();
                    ctx.arc(x * DOT + DOT / 2, y * DOT + DOT / 2, DOT / 2.25, 0, Math.PI * 2);
                    ctx.fillStyle = on ? '#e5e5e5' : '#1a1a1a'; // Changed colors for better contrast
                    ctx.fill();
                }
            }
            
            function renderGame() {
                buf.clear(0);
                if (gameState.scene === 'WELCOME') {
                    renderCustomText('WELCOME TEAM', 'center');
                } else if (gameState.scene === 'PAXCON') {
                    if (gameState.gameOver) { renderCustomText('GAME OVER', 'center'); }
                    else if (gameState.win) { renderCustomText('WINNER!', 'center'); }
                    else {
                        for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) if (gameState.walls[y][x]) buf.set(x, y, 1);
                        gameState.trail.forEach(s => { const [tx, ty] = s.split(',').map(Number); buf.set(tx, ty, 1); });
                        gameState.enemies.forEach(e => buf.set(Math.round(e.x), Math.round(e.y), 1));
                        
                        if (tick % 20 < 10) { 
                            buf.set(gameState.player.x, gameState.player.y, 1); 
                        } else { 
                            buf.set(gameState.player.x, gameState.player.y, 0); 
                        }
                    }
                }
                drawBuffer();
                updateStatusDisplay();
            }

            function updateStatusDisplay() {
                if (gameState.scene !== 'PAXCON' || gameState.gameOver || gameState.win) {
                    statusDisplay.textContent = '';
                    return;
                }
                let filled = 0;
                for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) if (gameState.walls[y][x]) filled++;
                
                const pct = Math.round((filled / (GRID_W * GRID_H)) * 100);
                if (!gameState.win && pct >= WIN_PCT) {
                    gameState.win = true;
                    gameState.playing = false;
                }
                statusDisplay.textContent = `Score: ${gameState.score} • ${pct}% Filled • Lives: ${gameState.lives}`;
            }

            // --- UI MANAGEMENT ---
            function updateUI() {
                const isWelcome = gameState.scene === 'WELCOME';
                const isPlaying = gameState.scene === 'PAXCON' && !gameState.gameOver && !gameState.win;
                const isEnd = gameState.gameOver || gameState.win;

                startBtn.classList.toggle('hidden', !isWelcome);
                
                pauseBtn.classList.toggle('hidden', !isPlaying);
                restartBtn.classList.toggle('hidden', !isPlaying);
                backBtn.classList.toggle('hidden', !isPlaying);
                
                restartEndBtn.classList.toggle('hidden', !isEnd);
                backEndBtn.classList.toggle('hidden', !isEnd);

                if (gameState.playing) {
                    pauseBtn.textContent = 'Pause';
                } else {
                    pauseBtn.textContent = 'Resume';
                }
            }

            // --- EVENT HANDLERS ---
            function handleKeyDown(e) {
                if (gameState.scene !== 'PAXCON') return;
                const k = e.key.toLowerCase();
                if (k === 'arrowup') dir = 'UP';
                if (k === 'arrowdown') dir = 'DOWN';
                if (k === 'arrowleft') dir = 'LEFT';
                if (k === 'arrowright') dir = 'RIGHT';
            }

            function startPaxcon() {
                gameState = getInitialState();
                gameState.scene = 'PAXCON';
                gameState.playing = true;
                dir = null;
            }
            
            function backToWelcome() {
                gameState.scene = 'WELCOME';
                gameState.playing = false;
            }

            function togglePause() {
                gameState.playing = !gameState.playing;
            }
            
            // --- GAME LOOP ---
            function gameLoop() {
                tick++;
                updateGame();
                renderGame();
                updateUI();
            }

            // --- INITIALIZATION ---
            function init() {
                gameState = getInitialState();
                window.addEventListener('keydown', handleKeyDown);
                
                startBtn.addEventListener('click', startPaxcon);
                pauseBtn.addEventListener('click', togglePause);
                restartBtn.addEventListener('click', startPaxcon);
                backBtn.addEventListener('click', backToWelcome);
                restartEndBtn.addEventListener('click', startPaxcon);
                backEndBtn.addEventListener('click', backToWelcome);

                if (gameInterval) clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, 1000 / FPS);
            }
            
            init();