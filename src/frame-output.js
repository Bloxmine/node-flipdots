// Frame Output - Turns a rendered canvas into flipdot frames and fans them out
// to the browser preview and the physical display.
//
// The canvas is read and thresholded exactly once per tick; every consumer
// works off the resulting 1-byte-per-dot buffer and only does work when the
// frame actually changed.
import { publishFrame, publishGameState } from "./prototype-preview-refactored.js";

// ========== CONSTANTS ==========
const BRIGHTNESS_THRESHOLD = 127;
// Safety net: if a drain callback never arrives (port error/unplug), resume
// sending instead of freezing the physical display forever.
const HARDWARE_DRAIN_TIMEOUT_MS = 1000;

// ========== MAIN CLASS ==========
export class FrameOutput {
  constructor({ width, height, display = null }) {
    this.width = width;
    this.height = height;
    this.display = display;

    this.frame = new Uint8Array(width * height);
    this.previousFrame = new Uint8Array(width * height);
    this.hasPreviousFrame = false;

    // Hardware state
    this.hardwareBusy = false;
    this.hardwareBusySince = 0;
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
      previous.set(frame);
      this.hasPreviousFrame = true;
    }

    publishGameState();
    if (this.display) this.flushDisplay();
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
}
