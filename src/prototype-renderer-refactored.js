// FlipDot Prototype Renderer
import { createCanvas } from "canvas";
import fs from "node:fs";
import path from "node:path";

// ========== CONSTANTS ==========
const OUTPUT_DIR = "./output";
const BRIGHTNESS_THRESHOLD = 127;
const DOT_COLORS = {
  ON: { fill: "#f0f0f0", stroke: "#c0c0c0" },
  OFF: { fill: "#1a1a1a", stroke: "#0a0a0a" }
};
const BACKGROUND_COLOR = "#0a0a0a";
const CLEAR_COLOR = "#0a0a0a";

// ========== MAIN CLASS ==========
export class FlipDotPrototypeRenderer {
  constructor(width, height, dotSize = 8, dotSpacing = 2) {
    this.gridWidth = width;
    this.gridHeight = height;
    this.dotSize = dotSize;
    this.dotSpacing = dotSpacing;
    
    this.canvasWidth = (width * (dotSize + dotSpacing)) - dotSpacing;
    this.canvasHeight = (height * (dotSize + dotSpacing)) - dotSpacing;
    
    this.canvas = createCanvas(this.canvasWidth, this.canvasHeight);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    
    this.previousPixelState = new Uint8Array(width * height);
    this.previousPixelState.fill(0); // All off initially
    this.hasChanges = true;
    
    this.ensureOutputDir();
  }
  
  // ========== INITIALIZATION ==========
  ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  }
  
  initialize() {
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.renderDot(x, y, false);
      }
    }
    
    this.hasChanges = true;
  }
  
  clear() {
    this.initialize();
    this.previousPixelState.fill(0);
  }
  
  // ========== RENDERING ==========
  renderDot(x, y, isOn = true) {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
    
    const centerX = x * (this.dotSize + this.dotSpacing) + this.dotSize / 2;
    const centerY = y * (this.dotSize + this.dotSpacing) + this.dotSize / 2;
    const radius = this.dotSize / 2;
    const clearRadius = radius + 2;
    
    // Clear area
    this.ctx.fillStyle = CLEAR_COLOR;
    this.ctx.fillRect(
      centerX - clearRadius,
      centerY - clearRadius,
      clearRadius * 2,
      clearRadius * 2
    );
    
    // Draw dot
    const colors = isOn ? DOT_COLORS.ON : DOT_COLORS.OFF;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = colors.fill;
    this.ctx.fill();
    this.ctx.strokeStyle = colors.stroke;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
  
  renderFromCanvas(sourceCanvas) {
    const sourceCtx = sourceCanvas.getContext("2d");
    const imageData = sourceCtx.getImageData(0, 0, this.gridWidth, this.gridHeight);
    return this.renderFromImageData(imageData);
  }
  
  renderFromImageData(imageData, forceFullRender = false) {
    const data = imageData.data;
    let changedPixels = 0;
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const pixelIndex = (y * this.gridWidth + x) * 4;
        const stateIndex = y * this.gridWidth + x;
        
        const brightness = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
        const currentState = brightness > BRIGHTNESS_THRESHOLD ? 1 : 0;
        
        if (forceFullRender || this.previousPixelState[stateIndex] !== currentState) {
          this.renderDot(x, y, currentState === 1);
          this.previousPixelState[stateIndex] = currentState;
          changedPixels++;
        }
      }
    }
    
    this.hasChanges = changedPixels > 0;
    return changedPixels;
  }
  
  renderTestPattern() {
    this.clear();
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const isOn = (x + y) % 2 === 0;
        this.renderDot(x, y, isOn);
        this.previousPixelState[y * this.gridWidth + x] = isOn ? 1 : 0;
      }
    }
    
    this.hasChanges = true;
  }
  
  // ========== OUTPUT ==========
  savePrototype(filename = "prototype.png") {
    const outputPath = path.join(OUTPUT_DIR, filename);
    const buffer = this.canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }
  
  getCanvas() {
    return this.canvas;
  }
  
  getBuffer() {
    return this.canvas.toBuffer("image/png");
  }
  
  getRawPixelBuffer() {
    const imageData = this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    return {
      buffer: Buffer.from(imageData.data),
      width: this.canvasWidth,
      height: this.canvasHeight
    };
  }
  
  // ========== STATE ==========
  hasFrameChanges() {
    return this.hasChanges;
  }
  
  resetChangesFlag() {
    this.hasChanges = false;
  }
}
