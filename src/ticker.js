/**
 * Ticker - A requestAnimationFrame-like solution for Node.js
 * with controllable framerate.
 *
 * Sleeps between frames with setTimeout instead of spinning on
 * setImmediate, so an idle frame costs ~0% CPU instead of a full core.
 * Frames are scheduled against absolute deadlines so timer jitter
 * doesn't accumulate into drift.
 */

// If we fall this many frames behind (e.g. after a long GC pause or a
// blocking call), resync instead of firing a burst of catch-up frames.
const MAX_FRAMES_BEHIND = 3;

export class Ticker {
	constructor(options = {}) {
		this.fps = options.fps || 60;
		this.callback = null;
		this.isRunning = false;
		this.lastFrameTime = 0;
		this.nextFrameTime = 0;
		this.frameInterval = 1000 / this.fps;
		this.timer = null;
	}

	start(callback) {
		if (this.isRunning) return;

		this.callback = callback;
		this.isRunning = true;
		this.lastFrameTime = performance.now();
		this.nextFrameTime = this.lastFrameTime;

		this._tick();

		return this;
	}

	stop() {
		this.isRunning = false;
		clearTimeout(this.timer);
		this.timer = null;
		return this;
	}

	_tick() {
		if (!this.isRunning) return;

		const now = performance.now();
		const timeDelta = now - this.lastFrameTime;
		this.lastFrameTime = now;

		if (this.callback) {
			try {
				this.callback({
					// Normalized delta (1.0 = exact frame rate)
					deltaTime: timeDelta / this.frameInterval,
					elapsedTime: now,
				});
			} catch (error) {
				// Never let one bad frame kill the render loop
				console.error("Error in frame callback:", error);
			}
		}

		this.nextFrameTime += this.frameInterval;
		const afterFrame = performance.now();
		if (afterFrame - this.nextFrameTime > this.frameInterval * MAX_FRAMES_BEHIND) {
			this.nextFrameTime = afterFrame;
		}

		const delay = Math.max(0, this.nextFrameTime - afterFrame);
		this.timer = setTimeout(() => this._tick(), delay);
	}
}
