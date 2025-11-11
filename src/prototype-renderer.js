import { createCanvas } from "canvas";
import fs from "node:fs";
import path from "node:path";

export class FlipDotPrototypeRenderer {
  constructor(width, height, dotSize = 8, dotSpacing = 2) {
    this.gridWidth = width;
    this.gridHeight = height;
    this.dotSize = dotSize;
    this.dotSpacing = dotSpacing;
    
    // calculate canvas size based on grid and dot parameters
    this.canvasWidth = (this.gridWidth * (this.dotSize + this.dotSpacing)) - this.dotSpacing;
    this.canvasHeight = (this.gridHeight * (this.dotSize + this.dotSpacing)) - this.dotSpacing;
    
    // create a larger canvas for the prototype display
    this.canvas = createCanvas(this.canvasWidth, this.canvasHeight);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false; // no AA
    
    // Track previous state for differential rendering
    this.previousPixelState = new Uint8Array(this.gridWidth * this.gridHeight);
    this.previousPixelState.fill(255); // Initialize as all "off" (0 = on, 255 = off for consistency)
    
    // Track if there are any changes
    this.hasChanges = true;
    
    // create output directory if it doesn't exist
    const outputDir = "./output";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }
  
  // render a single dot at grid position (x, y)
  renderDot(x, y, isOn = true) {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
    
    const centerX = x * (this.dotSize + this.dotSpacing) + this.dotSize / 2;
    const centerY = y * (this.dotSize + this.dotSpacing) + this.dotSize / 2;
    const radius = this.dotSize / 2;
    
    // Clear the area around the dot first to remove old outline
    const clearRadius = radius + 2; // Add extra margin for stroke
    this.ctx.fillStyle = "#0a0a0a";
    this.ctx.fillRect(
      centerX - clearRadius,
      centerY - clearRadius,
      clearRadius * 2,
      clearRadius * 2
    );
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    
    if (isOn) {
      // white dot (flipped)
      this.ctx.fillStyle = "#f0f0f0";
      this.ctx.fill();
      this.ctx.strokeStyle = "#c0c0c0";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    } else {
      // black dot (default)
      this.ctx.fillStyle = "#1a1a1a";
      this.ctx.fill();
      this.ctx.strokeStyle = "#0a0a0a";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }
  
  // render from source canvas (like the game canvas)
  renderFromCanvas(sourceCanvas) {
    // get image data from source canvas
    const sourceCtx = sourceCanvas.getContext("2d");
    const imageData = sourceCtx.getImageData(0, 0, this.gridWidth, this.gridHeight);
    
    // use the optimized ImageData method
    this.renderFromImageData(imageData);
  }
  
  // render from image data directly (optimized - only updates changed pixels)
  renderFromImageData(imageData, forceFullRender = false) {
    const data = imageData.data;
    let changedPixels = 0;
    
    // First pass: detect changes and render only changed dots
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const pixelIndex = (y * this.gridWidth + x) * 4;
        const stateIndex = y * this.gridWidth + x;
        
        // Calculate brightness and determine if pixel should be "on"
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const brightness = (r + g + b) / 3;
        
        const isOn = brightness > 127;
        const currentState = isOn ? 1 : 0;
        
        // Only render if changed or force full render
        if (forceFullRender || this.previousPixelState[stateIndex] !== currentState) {
          this.renderDot(x, y, isOn);
          this.previousPixelState[stateIndex] = currentState;
          changedPixels++;
        }
      }
    }
    
    this.hasChanges = changedPixels > 0;
    return changedPixels;
  }
  
  // Save the prototype display as PNG
  savePrototype(filename = "prototype.png") {
    const outputPath = path.join("./output", filename);
    const buffer = this.canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }
  
  // Get the canvas for direct manipulation or display
  getCanvas() {
    return this.canvas;
  }
  
  // Get canvas as buffer for web serving (PNG - slower)
  getBuffer() {
    return this.canvas.toBuffer("image/png");
  }
  
  // Get raw pixel data for efficient transmission (no PNG encoding)
  getRawPixelData() {
    const imageData = this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    return {
      data: Array.from(imageData.data), // Convert Uint8ClampedArray to regular array for JSON
      width: this.canvasWidth,
      height: this.canvasHeight
    };
  }
  
  // Get raw pixel data as binary buffer (even more efficient)
  getRawPixelBuffer() {
    const imageData = this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    return {
      buffer: Buffer.from(imageData.data),
      width: this.canvasWidth,
      height: this.canvasHeight
    };
  }
  
  // Check if there have been changes since last check
  hasFrameChanges() {
    return this.hasChanges;
  }
  
  // Reset the changes flag
  resetChangesFlag() {
    this.hasChanges = false;
  }
  
  // Clear the display (all dots off)
  clear() {
      this.ctx.fillStyle = "#1a1a1a";
      this.ctx.strokeStyle = "#c0c0c0";
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Render all dots in "off" state
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.renderDot(x, y, false);
      }
    }
    
    // Reset previous state
    this.previousPixelState.fill(0); // All off
    this.hasChanges = true;
  }
  
  // Initialize canvas with background and all dots off
  initialize() {
      this.ctx.fillStyle = "#1a1a1a";
      this.ctx.strokeStyle = "#c0c0c0";
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Render all dots in "off" state initially
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.renderDot(x, y, false);
      }
    }
    
    this.hasChanges = true;
  }
  
  // Test pattern to verify the display
  renderTestPattern() {
    this.clear();
    
    // Render a checkerboard pattern
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const isOn = (x + y) % 2 === 0;
        this.renderDot(x, y, isOn);
      }
    }
  }
}