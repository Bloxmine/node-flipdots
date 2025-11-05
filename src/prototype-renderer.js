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
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    
    if (isOn) {
      // white dot (flipped)
      this.ctx.fillStyle = "#f0f0f0";
      this.ctx.fill();
      this.ctx.strokeStyle = "#d0d0d0";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    } else {
      // black dot (default)
      this.ctx.fillStyle = "#1a1a1a";
      this.ctx.fill();
      this.ctx.strokeStyle = "#2a2a2a";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }
  
  // render from source canvas (like the game canvas)
  renderFromCanvas(sourceCanvas) {
    // clear the prototype canvas with dark background
    this.ctx.fillStyle = "#0a0a0a";
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // get image data from source canvas
    const sourceCtx = sourceCanvas.getContext("2d");
    const imageData = sourceCtx.getImageData(0, 0, this.gridWidth, this.gridHeight);
    const data = imageData.data;
    // this is heavy crap.
    // render each pixel as a dot
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const pixelIndex = (y * this.gridWidth + x) * 4;
        
        // check if pixel is bright (should be "on")
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const brightness = (r + g + b) / 3;
        
        const isOn = brightness > 127;
        this.renderDot(x, y, isOn);
      }
    }
  }
  // this needs to be improved.
  // render from image data directly
  renderFromImageData(imageData) {
    // Clear the prototype canvas with dark background
    this.ctx.fillStyle = "#0a0a0a";
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    const data = imageData.data;
    
    // Render each pixel as a dot
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const pixelIndex = (y * this.gridWidth + x) * 4;
        
        // Check if pixel is bright (should be "on")
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const brightness = (r + g + b) / 3;
        
        const isOn = brightness > 127;
        this.renderDot(x, y, isOn);
      }
    }
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
  
  // Get canvas as buffer for web serving
  getBuffer() {
    return this.canvas.toBuffer("image/png");
  }
  
  // Clear the display (all dots off)
  clear() {
    this.ctx.fillStyle = "#0a0a0a";
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    // Render all dots in "off" state
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.renderDot(x, y, false);
      }
    }
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