// Frame Output - Turns a rendered canvas into flipdot frames and fans them out
// to the browser preview, the physical display and the debug PNG.
//
// The canvas is read and thresholded exactly once per tick; every consumer
// works off the resulting 1-byte-per-dot buffer and only does work when the
// frame actually changed.
import { createCanvas } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { publishFrame, publishGameState } from "./prototype-preview-refactored.js";

// ========== CONSTANTS ==========
const BRIGHTNESS_THRESHOLD = 127;
const OUTPUT_DIR = "./output";
const DEBUG_FRAME_INTERVAL_MS = 1000;
// Safety net: if a drain callback never arrives (port error/unplug), resume
// sending instead of freezing the physical display forever.
const HARDWARE_DRAIN_TIMEOUT_MS = 1000;

// ========== MAIN CLASS ==========
export class FrameOutput {
  constructor({ width, height, display = null, debug = false }) {
    this.width = width;
    this.height = height;
    this.display = display;
    this.debug = debug;

    this.frame = new Uint8Array(width * height);
    this.previousFrame = new Uint8Array(width * height);
    this.hasPreviousFrame = false;

    // Hardware state
    this.hardwareBusy = false;
    this.hardwareBusySince = 0;

    // Debug PNG state
    this.lastDebugWrite = 0;
    this.debugDirty = false;
    this.debugWriteInProgress = false;
    if (debug) {
      this.debugCanvas = createCanvas(width, height);
      this.debugCtx = this.debugCanvas.getContext("2d");
      this.debugImageData = this.debugCtx.createImageData(width, height);
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  }

  /**
   * Read the rendered frame from the canvas context and push it to all outputs.
   * @param {CanvasRenderingContext2D} ctx
   */
  push(ctx) {
    const { data } = ctx.getImageData(0, 0, this.width, this.height);
    const frame = this.frame;
    const previous = this.previousFrame;
    let changed = !this.hasPreviousFrame;

    for (let i = 0, p = 0; i < frame.length; i++, p += 4) {
      const on = (data[p] + data[p + 1] + data[p + 2]) / 3 > BRIGHTNESS_THRESHOLD ? 1 : 0;
      frame[i] = on;
      if (on !== previous[i]) changed = true;
    }

    if (changed) {
      publishFrame(frame, this.width, this.height);
      if (this.display) this.updateDisplay(frame, previous);
      if (this.debug) this.debugDirty = true;
      previous.set(frame);
      this.hasPreviousFrame = true;
    }

    publishGameState();
    if (this.display) this.flushDisplay();
    if (this.debug) this.maybeWriteDebugFrame();
  }

  // ========== HARDWARE ==========
  updateDisplay(frame, previous) {
    const { width } = this;
    const full = !this.hasPreviousFrame;
    for (let i = 0; i < frame.length; i++) {
      if (full || frame[i] !== previous[i]) {
        this.display.setPixel(i % width, (i / width) | 0, frame[i] === 1);
      }
    }
  }

  /**
   * Send dirty panels to the display, but never queue more than one frame on
   * the serial line. At 57600 baud a full 12-panel update takes ~67ms, so
   * writing blindly every tick lets the OS buffer grow and the physical
   * display drifts further and further behind the game. Instead we wait for
   * the previous frame to drain; panels stay dirty so the newest state is
   * sent as soon as the line is free.
   */
  flushDisplay() {
    const display = this.display;
    if (!display.isDirty()) return;

    if (this.hardwareBusy) {
      if (Date.now() - this.hardwareBusySince < HARDWARE_DRAIN_TIMEOUT_MS) return;
      this.hardwareBusy = false;
    }

    display.flush();

    const port = display.transport?.port;
    if (port && typeof port.drain === "function" && port.isOpen) {
      this.hardwareBusy = true;
      this.hardwareBusySince = Date.now();
      port.drain(() => {
        this.hardwareBusy = false;
      });
    }
  }

  // ========== DEBUG ==========
  maybeWriteDebugFrame() {
    if (!this.debugDirty || this.debugWriteInProgress) return;

    const now = Date.now();
    if (now - this.lastDebugWrite < DEBUG_FRAME_INTERVAL_MS) return;

    const pixels = this.debugImageData.data;
    for (let i = 0, p = 0; i < this.frame.length; i++, p += 4) {
      const value = this.frame[i] ? 255 : 0;
      pixels[p] = pixels[p + 1] = pixels[p + 2] = value;
      pixels[p + 3] = 255;
    }
    this.debugCtx.putImageData(this.debugImageData, 0, 0);

    this.debugDirty = false;
    this.debugWriteInProgress = true;
    this.lastDebugWrite = now;

    // Encode and write off the main thread so the game loop never waits on disk
    this.debugCanvas.toBuffer((err, buffer) => {
      if (err) {
        this.debugWriteInProgress = false;
        return;
      }
      fs.writeFile(path.join(OUTPUT_DIR, "frame.png"), buffer, () => {
        this.debugWriteInProgress = false;
      });
    }, "image/png");
  }
}
