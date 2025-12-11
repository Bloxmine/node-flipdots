// Breakout Game for Flipdot Display
import { characters, lettersBig } from './characters.js';

export class BreakoutGame {
  constructor(width, height, renderToCanvas = true) {
    this.width = width;
    this.height = height;
    this.renderToCanvas = renderToCanvas;
    
    this.reset();
  }

  reset() {
    // Paddle
    this.paddle = {
      x: this.width / 2 - 6,
      y: this.height - 4,
      width: 12,
      height: 2,
      speed: 2
    };

    // Ball
    this.ball = {
      x: this.width / 2,
      y: this.height / 2,
      vx: 0.5,
      vy: -1.2,
      size: 2,
      stuck: true
    };

    // Bricks
    this.bricks = [];
    const brickWidth = 8;
    const brickHeight = 3;
    const brickPadding = 1;
    const rows = 4; // Reduced from 5 to 4
    const cols = Math.floor(this.width / (brickWidth + brickPadding));
    const offsetX = Math.floor((this.width - (cols * (brickWidth + brickPadding))) / 2);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.bricks.push({
          x: offsetX + col * (brickWidth + brickPadding),
          y: 2 + row * (brickHeight + brickPadding), // Moved up from 4
          width: brickWidth,
          height: brickHeight,
          active: true
        });
      }
    }

    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.won = false;

    this.gameState = {
      scene: 'PLAYING',
      lives: this.lives,
      playing: true,
      player: { x: this.paddle.x, y: this.paddle.y }
    };
  }

  setDirection(direction) {
    if (direction === 'LEFT') {
      this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
    } else if (direction === 'RIGHT') {
      this.paddle.x = Math.min(this.width - this.paddle.width, this.paddle.x + this.paddle.speed);
    } else if (direction === 'UP' && this.ball.stuck) {
      this.ball.stuck = false;
      // Add slight random variation to launch angle
      this.ball.vx = (Math.random() - 0.5) * 0.8;
      this.ball.vy = -1.2;
    }
    this.gameState.player.x = this.paddle.x;
  }

  handleButtonPress(button) {
    if (button === 'A' || button === 'START') {
      if (this.ball.stuck) {
        this.ball.stuck = false;
        // Add slight random variation to launch angle
        this.ball.vx = (Math.random() - 0.5) * 0.8;
        this.ball.vy = -1.2;
      } else if (this.gameOver || this.won) {
        this.restart();
      }
    }
  }

  restart() {
    this.reset();
  }

  update() {
    if (this.gameOver || this.won) return;

    // Ball stuck to paddle
    if (this.ball.stuck) {
      this.ball.x = this.paddle.x + this.paddle.width / 2;
      this.ball.y = this.paddle.y - this.ball.size;
      return;
    }

    // Move ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Wall collision
    if (this.ball.x <= 0 || this.ball.x >= this.width - this.ball.size) {
      this.ball.vx = -this.ball.vx;
      this.ball.x = Math.max(0, Math.min(this.width - this.ball.size, this.ball.x));
    }

    if (this.ball.y <= 0) {
      this.ball.vy = -this.ball.vy;
      this.ball.y = 0;
    }

    // Paddle collision
    if (this.ball.y + this.ball.size >= this.paddle.y &&
        this.ball.y <= this.paddle.y + this.paddle.height &&
        this.ball.x + this.ball.size >= this.paddle.x &&
        this.ball.x <= this.paddle.x + this.paddle.width) {
      this.ball.vy = -Math.abs(this.ball.vy);
      
      // Add spin based on where ball hits paddle (reduced from 3 to 1.5)
      const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
      this.ball.vx = (hitPos - 0.5) * 1.5;
    }

    // Brick collision
    this.bricks.forEach(brick => {
      if (!brick.active) return;

      if (this.ball.x + this.ball.size >= brick.x &&
          this.ball.x <= brick.x + brick.width &&
          this.ball.y + this.ball.size >= brick.y &&
          this.ball.y <= brick.y + brick.height) {
        brick.active = false;
        this.score += 10;
        this.ball.vy = -this.ball.vy;
      }
    });

    // Check win condition
    if (this.bricks.every(brick => !brick.active)) {
      this.won = true;
      this.gameState.playing = false;
    }

    // Ball out of bounds
    if (this.ball.y > this.height) {
      this.lives--;
      this.gameState.lives = this.lives;
      
      if (this.lives <= 0) {
        this.gameOver = true;
        this.gameState.playing = false;
      } else {
        this.ball.stuck = true;
        this.ball.vx = 0.5;
        this.ball.vy = -1.2;
      }
    }
  }

  drawNumber(ctx, num, x, y) {
    const numStr = num.toString();
    let cursorX = x;
    
    for (let i = 0; i < numStr.length; i++) {
      const digit = numStr[i];
      const charData = characters[digit];
      
      if (charData) {
        for (let row = 0; row < charData.length; row++) {
          for (let col = 0; col < charData[row].length; col++) {
            if (charData[row][col] === 1) {
              ctx.fillRect(cursorX + col, y + row, 1, 1);
            }
          }
        }
        cursorX += 4; // 3 pixel width + 1 spacing
      }
    }
  }

  drawText5x5(ctx, text, x, y) {
    let cursorX = x;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === ' ') {
        cursorX += 6;
        continue;
      }
      
      const charData = lettersBig[char.toUpperCase()];
      if (charData) {
        for (let row = 0; row < charData.length; row++) {
          for (let col = 0; col < charData[row].length; col++) {
            if (charData[row][col] === 1) {
              ctx.fillRect(cursorX + col, y + row, 1, 1);
            }
          }
        }
        cursorX += 6; // 5 pixel width + 1 spacing
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = '#fff';

    // Draw paddle
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

    // Draw ball
    ctx.fillRect(Math.floor(this.ball.x), Math.floor(this.ball.y), this.ball.size, this.ball.size);

    // Draw bricks
    this.bricks.forEach(brick => {
      if (brick.active) {
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      }
    });

    // Draw score at bottom right
    const scoreStr = this.score.toString();
    const scoreWidth = scoreStr.length * 4;
    this.drawNumber(ctx, this.score, this.width - scoreWidth - 1, this.height - 6);

    // Draw game over or win
    if (this.gameOver || this.won) {
      const text = this.won ? 'YOU WIN!' : 'GAME OVER';
      const textWidth = text.length * 6; // 5x5 font is 6 pixels wide with spacing
      const x = Math.floor((this.width - textWidth) / 2);
      const y = Math.floor(this.height / 2) - 2;
      
      ctx.fillStyle = '#000';
      ctx.fillRect(x - 2, y - 1, textWidth + 4, 7);
      
      ctx.fillStyle = '#fff';
      this.drawText5x5(ctx, text, x, y);
    }
  }

  getStatus() {
    if (this.won) return `You Win! Score: ${this.score}`;
    if (this.gameOver) return `Game Over! Score: ${this.score}`;
    return `Breakout - Score: ${this.score} - Lives: ${this.lives}`;
  }
}
