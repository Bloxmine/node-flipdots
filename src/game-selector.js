// GameSelector - Menu system for selecting games
import { lettersBig } from './characters.js';

const selectionScreen = {
  "frame_1": [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,1,1,1,0,0,1,1,1,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,1,1,1,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,0,1,0,0,0,0,0,1,1,1,1,1,0,0,1,1,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,1,1,1,1,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,1,1,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,0,1,0,0,1,0,0,1,1,1,0,0,1,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,1,0,1,1,1,1,1,0,1,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,0,1,0,0,1,0,1,1,1,0,0,0,1,0,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,1,0,1,1,1,1,1,0,1,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,0,1,0,0,1,0,0,1,1,1,0,0,1,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]
};

// 9x9 game icons
const gameIcons = {
  "pacxon": [
    [0,1,1,1,1,1,1,1,0],
    [1,0,0,0,0,0,0,0,1],
    [1,0,0,1,1,1,0,0,1],
    [1,0,1,1,1,1,1,0,1],
    [1,0,1,1,1,0,0,0,1],
    [1,0,1,1,1,1,1,0,1],
    [1,0,0,1,1,1,0,0,1],
    [1,0,0,0,0,0,0,0,1],
    [0,1,1,1,1,1,1,1,0]
  ],
  "pong": [
    [0,1,1,1,1,1,1,1,0],
    [1,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,0,1],
    [1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1],
    [1,0,0,0,0,0,1,0,1],
    [1,0,0,0,0,0,0,0,1],
    [0,1,1,1,1,1,1,1,0]
  ],
  "snake": [
    [0,1,1,1,1,1,1,1,0],
    [1,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1],
    [0,1,1,1,1,1,1,1,0]
  ],
  "breakout": [
    [0,1,1,1,1,1,1,1,0],
    [1,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1],
    [0,1,1,1,1,1,1,1,0]
  ]
};

export class GameSelector {
  constructor(width, height, games) {
    this.width = width;
    this.height = height;
    this.games = games;
    this.selectedIndex = 0;
    this.charWidth = 5;
    this.charHeight = 5;
    this.charSpacing = 1;
    this.blinkCounter = 0;
    this.blinkInterval = 15; // Blink every 15 frames
    
    this.iconSize = 9;
    this.iconSpacing = 2;
    
    // Calculate starting position to center icons
    const totalWidth = (this.iconSize + this.iconSpacing) * this.games.length - this.iconSpacing;
    this.iconsStartX = Math.floor((this.width - totalWidth) / 2);
    this.iconsY = 16; // Icons positioned lower to make room for text and arrow
  }

  /**
   * Handle directional input
   * @param {string} direction - 'up', 'down', 'left', 'right'
   */
  setDirection(direction) {
    if (direction === 'left') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    } else if (direction === 'right') {
      this.selectedIndex = Math.min(this.games.length - 1, this.selectedIndex + 1);
    }
  }

  /**
   * Get the currently selected game
   * @returns {Object} The selected game configuration
   */
  getSelectedGame() {
    return this.games[this.selectedIndex];
  }

  /**
   * Draw a single character using 5x5 lettersBig font
   * @param {CanvasRenderingContext2D} ctx 
   * @param {string} char 
   * @param {number} x 
   * @param {number} y 
   * @param {string} color - Color to draw the character
   */
  drawChar(ctx, char, x, y, color = '#fff') {
    const charData = lettersBig[char.toUpperCase()];
    if (!charData) return this.charWidth + this.charSpacing;

    ctx.fillStyle = color;
    for (let row = 0; row < charData.length; row++) {
      for (let col = 0; col < charData[row].length; col++) {
        if (charData[row][col] === 1) {
          ctx.fillRect(x + col, y + row, 1, 1);
        }
      }
    }

    return this.charWidth + this.charSpacing;
  }

  /**
   * Draw text using 5x5 lettersBig font with specified color
   * @param {CanvasRenderingContext2D} ctx 
   * @param {string} text 
   * @param {number} x 
   * @param {number} y 
   * @param {string} color - Color to draw the text
   */
  drawTextWithColor(ctx, text, x, y, color) {
    let cursorX = x;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === ' ') {
        cursorX += this.charWidth + this.charSpacing;
        continue;
      }
      
      const charWidth = this.drawChar(ctx, char, cursorX, y, color);
      cursorX += charWidth;
    }
    
    return cursorX - x;
  }

  /**
   * Get the width of text in pixels
   * @param {string} text 
   * @returns {number}
   */
  getTextWidth(text) {
    let width = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ') {
        width += this.charWidth + this.charSpacing;
      } else if (lettersBig[char.toUpperCase()]) {
        width += this.charWidth + this.charSpacing;
      }
    }
    return width - this.charSpacing;
  }

  /**
   * Draw a 9x9 game icon
   * @param {CanvasRenderingContext2D} ctx 
   * @param {string} gameId 
   * @param {number} x 
   * @param {number} y 
   */
  drawIcon(ctx, gameId, x, y) {
    const icon = gameIcons[gameId];
    if (!icon) return;

    ctx.fillStyle = '#fff';
    for (let row = 0; row < icon.length; row++) {
      for (let col = 0; col < icon[row].length; col++) {
        if (icon[row][col] === 1) {
          ctx.fillRect(x + col, y + row, 1, 1);
        }
      }
    }
  }

  /**
   * Render the game selector menu
   * @param {CanvasRenderingContext2D} ctx 
   */
  render(ctx) {
    // Clear screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.width, this.height);

    const selectedGame = this.games[this.selectedIndex];
    
    // Draw game name at the top
    const nameWidth = this.getTextWidth(selectedGame.name);
    const nameX = Math.floor((this.width - nameWidth) / 2);
    this.drawTextWithColor(ctx, selectedGame.name, nameX, 2, '#fff');

    // Draw down arrow pointing to selected icon (with blink)
    const showArrow = Math.floor(this.blinkCounter / this.blinkInterval) % 2 === 0;
    
    if (showArrow) {
      const selectedIconX = this.iconsStartX + this.selectedIndex * (this.iconSize + this.iconSpacing);
      const arrowX = selectedIconX + Math.floor(this.iconSize / 2);
      const arrowY = 10;
      
      ctx.fillStyle = '#fff';
      // Arrow pointing down: simple v shape
      ctx.fillRect(arrowX - 2, arrowY, 5, 1);
      ctx.fillRect(arrowX - 1, arrowY + 1, 3, 1);
      ctx.fillRect(arrowX, arrowY + 2, 1, 1);
    }

    // Draw all game icons horizontally
    for (let i = 0; i < this.games.length; i++) {
      const game = this.games[i];
      const iconX = this.iconsStartX + i * (this.iconSize + this.iconSpacing);
      
      this.drawIcon(ctx, game.id, iconX, this.iconsY);
    }
  }

  /**
   * Update (animation and blink)
   */
  update() {
    this.blinkCounter++;
  }
}