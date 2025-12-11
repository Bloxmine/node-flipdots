// GameSelector - Menu system for selecting games
import { lettersBig } from './characters.js';

export class GameSelector {
  constructor(width, height, games) {
    this.width = width;
    this.height = height;
    this.games = games;
    this.selectedIndex = 0;
    this.scrollOffset = 0; // For scrolling through long lists
    this.charWidth = 5;
    this.charHeight = 5;
    this.charSpacing = 1;
    this.lineHeight = this.charHeight + 3;
    this.blinkCounter = 0;
    this.blinkInterval = 15; // Blink every 15 frames
    
    // Calculate how many items can fit on screen
    this.maxVisibleItems = Math.floor((this.height - 4) / this.lineHeight);
  }

  /**
   * Handle directional input
   * @param {string} direction - 'up', 'down', 'left', 'right'
   */
  setDirection(direction) {
    if (direction === 'up') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      
      // Scroll up if needed
      if (this.selectedIndex < this.scrollOffset) {
        this.scrollOffset = this.selectedIndex;
      }
    } else if (direction === 'down') {
      this.selectedIndex = Math.min(this.games.length - 1, this.selectedIndex + 1);
      
      // Scroll down if needed
      if (this.selectedIndex >= this.scrollOffset + this.maxVisibleItems) {
        this.scrollOffset = this.selectedIndex - this.maxVisibleItems + 1;
      }
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
   * Render the game selector menu
   * @param {CanvasRenderingContext2D} ctx 
   */
  render(ctx) {
    // Clear screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.width, this.height);

    // Determine if selection should be visible (blink effect)
    const showSelection = Math.floor(this.blinkCounter / this.blinkInterval) % 2 === 0;

    // Calculate visible range
    const startIndex = this.scrollOffset;
    const endIndex = Math.min(startIndex + this.maxVisibleItems, this.games.length);
    const visibleGames = this.games.slice(startIndex, endIndex);

    // Starting Y position
    const startY = 2;

    // Draw up arrow if not at top
    if (this.scrollOffset > 0) {
      ctx.fillStyle = '#fff';
      // Simple up arrow
      ctx.fillRect(this.width - 4, 0, 1, 1);
      ctx.fillRect(this.width - 5, 1, 3, 1);
    }

    // Draw each visible game name
    visibleGames.forEach((game, displayIndex) => {
      const actualIndex = startIndex + displayIndex;
      const y = startY + (displayIndex * this.lineHeight);
      const textWidth = this.getTextWidth(game.name);
      const x = 2; // Left-aligned with small margin
      
      const isSelected = actualIndex === this.selectedIndex;
      
      // Draw inverted background if selected and blink is on
      if (isSelected && showSelection) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 1, y - 1, textWidth + 2, this.charHeight + 2);
        
        // Draw text in black (inverted)
        ctx.fillStyle = '#000';
        this.drawTextWithColor(ctx, game.name, x, y, '#000');
      } else {
        // Draw text in white (normal)
        ctx.fillStyle = '#fff';
        this.drawTextWithColor(ctx, game.name, x, y, '#fff');
      }
    });

    // Draw down arrow if not at bottom
    if (endIndex < this.games.length) {
      ctx.fillStyle = '#fff';
      // Simple down arrow
      ctx.fillRect(this.width - 5, this.height - 2, 3, 1);
      ctx.fillRect(this.width - 4, this.height - 1, 1, 1);
    }
  }

  /**
   * Update (animation and blink)
   */
  update() {
    this.blinkCounter++;
  }
}
