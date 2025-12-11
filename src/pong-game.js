// Placeholder Pong Game
// This is a simple placeholder to demonstrate the game selector system
import { characters } from './characters.js';

export class PongGame {
  constructor(width, height, renderToCanvas = true) {
    this.width = width;
    this.height = height;
    this.renderToCanvas = renderToCanvas;
    
    this.playerScore = 0;
    this.computerScore = 0;
    
    this.gameState = {
      scene: 'PLAYING',
      lives: 3,
      playing: true,
      player: { x: 0, y: 0 }
    };
    
    // Simple paddle positions
    this.leftPaddle = { x: 5, y: height / 2, width: 2, height: 8 };
    this.rightPaddle = { x: width - 7, y: height / 2, width: 2, height: 8 };
    this.ball = { x: width / 2, y: height / 2, vx: 1, vy: 0.5, size: 2 };
  }

  setDirection(direction) {
    // Move left paddle with arrow keys
    if (direction === 'UP') {
      this.leftPaddle.y = Math.max(0, this.leftPaddle.y - 2);
    } else if (direction === 'DOWN') {
      this.leftPaddle.y = Math.min(this.height - this.leftPaddle.height, this.leftPaddle.y + 2);
    }
  }

  handleButtonPress(button) {
    // Placeholder
  }

  restart() {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.vx = 1;
    this.ball.vy = 0.5;
  }
  
  resetPoint(scoredOnLeft) {
    if (scoredOnLeft) {
      this.computerScore++;
    } else {
      this.playerScore++;
    }
    
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.vx = scoredOnLeft ? 1 : -1;
    this.ball.vy = (Math.random() - 0.5) * 2;
  }

  update() {
    // Move ball
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    
    // Bounce off top and bottom
    if (this.ball.y <= 0 || this.ball.y >= this.height - this.ball.size) {
      this.ball.vy = -this.ball.vy;
    }
    
    // Simple AI for right paddle
    if (this.ball.y < this.rightPaddle.y + this.rightPaddle.height / 2) {
      this.rightPaddle.y = Math.max(0, this.rightPaddle.y - 1);
    } else {
      this.rightPaddle.y = Math.min(this.height - this.rightPaddle.height, this.rightPaddle.y + 1);
    }
    
    // Paddle collision
    if (this.ball.x <= this.leftPaddle.x + this.leftPaddle.width &&
        this.ball.y >= this.leftPaddle.y &&
        this.ball.y <= this.leftPaddle.y + this.leftPaddle.height) {
      this.ball.vx = Math.abs(this.ball.vx);
    }
    
    if (this.ball.x >= this.rightPaddle.x - this.ball.size &&
        this.ball.y >= this.rightPaddle.y &&
        this.ball.y <= this.rightPaddle.y + this.rightPaddle.height) {
      this.ball.vx = -Math.abs(this.ball.vx);
    }
    
    // Reset if ball goes out of bounds
    if (this.ball.x < 0) {
      this.resetPoint(true); // Computer scored
    } else if (this.ball.x > this.width) {
      this.resetPoint(false); // Player scored
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

  render(ctx) {
    // Draw score at top middle
    ctx.fillStyle = '#fff';
    
    // Player score (left side)
    const leftScoreX = Math.floor(this.width / 2) - 10;
    this.drawNumber(ctx, this.playerScore, leftScoreX, 1);
    
    // Separator
    ctx.fillRect(Math.floor(this.width / 2) - 1, 2, 1, 1);
    ctx.fillRect(Math.floor(this.width / 2) - 1, 4, 1, 1);
    
    // Computer score (right side)
    const rightScoreX = Math.floor(this.width / 2) + 4;
    this.drawNumber(ctx, this.computerScore, rightScoreX, 1);
    
    // Draw paddles
    ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.leftPaddle.width, this.leftPaddle.height);
    ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.rightPaddle.width, this.rightPaddle.height);
    
    // Draw ball
    ctx.fillRect(Math.floor(this.ball.x), Math.floor(this.ball.y), this.ball.size, this.ball.size);
    
    // Draw center line
    for (let y = 8; y < this.height; y += 4) {
      ctx.fillRect(this.width / 2 - 1, y, 1, 2);
    }
  }

  getStatus() {
    return `Pong - Player: ${this.playerScore} | Computer: ${this.computerScore}`;
  }
}
