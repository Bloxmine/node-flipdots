// Snake Game for Flipdot Display

export class SnakeGame {
  constructor(width, height, renderToCanvas = true) {
    this.width = width;
    this.height = height;
    this.renderToCanvas = renderToCanvas;
    
    this.gridSize = 2; // Size of each snake segment
    this.gridWidth = Math.floor(width / this.gridSize);
    this.gridHeight = Math.floor(height / this.gridSize);
    
    this.reset();
  }

  reset() {
    this.snake = [
      { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 2) }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = this.generateFood();
    this.score = 0;
    this.moveCounter = 0;
    this.moveInterval = 5; // Move every 5 frames
    this.gameOver = false;
    
    this.gameState = {
      scene: 'PLAYING',
      lives: 3,
      playing: true,
      player: { x: this.snake[0].x, y: this.snake[0].y }
    };
  }

  generateFood() {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight)
      };
    } while (this.snake.some(seg => seg.x === food.x && seg.y === food.y));
    return food;
  }

  setDirection(direction) {
    // Prevent reversing into self
    if (direction === 'UP' && this.direction.y === 0) {
      this.nextDirection = { x: 0, y: -1 };
    } else if (direction === 'DOWN' && this.direction.y === 0) {
      this.nextDirection = { x: 0, y: 1 };
    } else if (direction === 'LEFT' && this.direction.x === 0) {
      this.nextDirection = { x: -1, y: 0 };
    } else if (direction === 'RIGHT' && this.direction.x === 0) {
      this.nextDirection = { x: 1, y: 0 };
    }
  }

  handleButtonPress(button) {
    if (this.gameOver && (button === 'A' || button === 'START')) {
      this.restart();
    }
  }

  restart() {
    this.reset();
  }

  update() {
    if (this.gameOver) return;

    this.moveCounter++;
    if (this.moveCounter < this.moveInterval) return;
    this.moveCounter = 0;

    // Update direction
    this.direction = this.nextDirection;

    // Calculate new head position
    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // Check wall collision
    if (newHead.x < 0 || newHead.x >= this.gridWidth ||
        newHead.y < 0 || newHead.y >= this.gridHeight) {
      this.gameOver = true;
      this.gameState.playing = false;
      return;
    }

    // Check self collision
    if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      this.gameOver = true;
      this.gameState.playing = false;
      return;
    }

    // Add new head
    this.snake.unshift(newHead);

    // Check food collision
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score++;
      this.food = this.generateFood();
      // Speed up slightly
      if (this.moveInterval > 2) {
        this.moveInterval = Math.max(2, this.moveInterval - 0.1);
      }
    } else {
      // Remove tail if no food eaten
      this.snake.pop();
    }

    this.gameState.player = { x: newHead.x, y: newHead.y };
  }

  render(ctx) {
    ctx.fillStyle = '#fff';

    // Draw snake
    this.snake.forEach(segment => {
      ctx.fillRect(
        segment.x * this.gridSize,
        segment.y * this.gridSize,
        this.gridSize,
        this.gridSize
      );
    });

    // Draw food (blinking)
    if (Math.floor(Date.now() / 200) % 2 === 0) {
      ctx.fillRect(
        this.food.x * this.gridSize,
        this.food.y * this.gridSize,
        this.gridSize,
        this.gridSize
      );
    }

    // Draw score
    ctx.font = '5px monospace';
    ctx.fillText(`${this.score}`, 2, 2);

    // Draw game over
    if (this.gameOver) {
      const gameOverText = 'GAME OVER';
      const textWidth = gameOverText.length * 4;
      const x = Math.floor((this.width - textWidth) / 2);
      const y = Math.floor(this.height / 2);
      
      // Background
      ctx.fillStyle = '#000';
      ctx.fillRect(x - 2, y - 2, textWidth + 4, 9);
      
      // Text
      ctx.fillStyle = '#fff';
      ctx.fillText(gameOverText, x, y);
    }
  }

  getStatus() {
    if (this.gameOver) {
      return `Game Over! Score: ${this.score}`;
    }
    return `Snake - Score: ${this.score} - Length: ${this.snake.length}`;
  }
}
