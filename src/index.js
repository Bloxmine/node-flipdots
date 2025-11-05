import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import { sendFrame } from "./preview.js";

// Pacxon game imports
import { PacxonGame } from "./pacxon-flipdot.js";
import { Xbox360Controller } from "./controller.js";
import { NESController } from "./nes-controller.js";

const IS_DEV = process.argv.includes("--dev");

// Create display
const display = new Display({
	layout: LAYOUT,
	panelWidth: 28,
	isMirrored: true,
	transport: !IS_DEV ? {
		type: 'serial',
		path: '/dev/ttyACM0',
		baudRate: 57600
	} : {
		type: 'ip',
		host: '127.0.0.1',
		port: 3000
	}
});

const { width, height } = display;

// Display startup information
console.log('🎮 Flipdot Game - Input System Status:');
console.log(`   Display: ${width}x${height} pixels`);
console.log(`   Mode: ${IS_DEV ? 'Development (http://localhost:3000/view)' : 'Production (Physical Display)'}`);

// Check for available input methods
const availableDevices = Xbox360Controller.getAvailableDevices();
if (availableDevices.length > 0) {
    console.log(`   Available controllers: ${availableDevices.join(', ')}`);
} else {
    console.log('   No controllers detected - keyboard input ready');
}
console.log('   Keyboard: Always available');
console.log('');

// Create output directory if it doesn't exist
const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

// Register fonts
registerFont(
	path.resolve(import.meta.dirname, "../fonts/OpenSans-Variable.ttf"),
	{ family: "OpenSans" },
);
registerFont(
	path.resolve(import.meta.dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"),
	{ family: "PPNeueMontreal" },
);
registerFont(path.resolve(import.meta.dirname, "../fonts/Px437_ACM_VGA.ttf"), {
	family: "Px437_ACM_VGA",
});

// Create canvas with the specified resolution
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// Disable anti-aliasing and image smoothing
ctx.imageSmoothingEnabled = false;
// Set a pixel-perfect monospace font
ctx.font = "18px monospace";
// Align text precisely to pixel boundaries
ctx.textBaseline = "top";

// Initialize the Pacxon game without auto-play
const pacxonGame = new PacxonGame(width, height, false);

// Input handling setup
let controllerConnected = false;
let keyboardInputActive = true; // Keyboard is always available

// Try to initialize Xbox 360 controller first
const controller = new Xbox360Controller();

// Also try to initialize NES controller
const nesController = new NESController();

// Setup event handlers for Xbox controller
controller.on('connected', () => {
	controllerConnected = true;
	console.log('✅ Xbox 360 controller connected! Dual input mode: Controller + Keyboard both active.');
	console.log('   Controller: D-pad/Left stick to move, A/Start to restart');
	console.log('   Keyboard: Arrow keys/WASD to move, R to restart, Ctrl+C to exit');
});

controller.on('notFound', () => {
	console.log('🔍 No Xbox 360 controller found (checked /dev/input/js*)');
});

controller.on('disconnected', () => {
	controllerConnected = false;
	console.log('🔌 Xbox 360 controller disconnected. Switched to keyboard-only input mode.');
});

controller.on('error', (error) => {
	console.error('❌ Xbox controller error:', error.message);
});

controller.on('direction', (direction) => {
	pacxonGame.setDirection(direction);
});

controller.on('restart', () => {
	pacxonGame.restart();
});

controller.on('buttonPress', (button) => {
	switch (button) {
		case 'A':
		case 'START':
			pacxonGame.restart();
			break;
	}
});

// Setup event handlers for NES controller
nesController.on('connected', () => {
	controllerConnected = true;
	console.log('✅ NES controller ready!');
	console.log('   All input methods active: NES Controller + Keyboard');
});

nesController.on('notFound', () => {
	if (!controller.isConnected) {
		console.log('⌨️  Keyboard-only input mode.');
		console.log('   Keyboard: Arrow keys/WASD to move, R to restart, Ctrl+C to exit');
		console.log('');
		console.log('💡 Tip: If you have a USB controller connected:');
		console.log('   - For NES controllers at /dev/input/event*, you may need:');
		console.log('     sudo usermod -a -G input $USER');
		console.log('   - Then log out and back in for changes to take effect');
	}
});

nesController.on('direction', (direction) => {
	pacxonGame.setDirection(direction);
});

nesController.on('restart', () => {
	pacxonGame.restart();
});

// Keyboard input setup (always available)
// Remove readline and use direct stdin handling for better terminal compatibility
let keyboardSetupComplete = false;

// Setup terminal input handling
function setupTerminalInput() {
	if (keyboardSetupComplete) return;
	
	// Enable raw mode for immediate key detection without Enter
	if (process.stdin.isTTY) {
		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
	}
	
	keyboardSetupComplete = true;
	console.log('⌨️  Keyboard input initialized');
}

// Setup input after controller initialization
setTimeout(setupTerminalInput, 100);

process.stdin.on('data', (chunk) => {
	const key = chunk.toString();
	
	// Handle Ctrl+C to exit
	if (key === '\u0003') {
		console.log('\n🛑 Exiting...');
		// Restore terminal state
		if (process.stdin.isTTY) {
			process.stdin.setRawMode(false);
		}
		// Clean up controller connection
		if (controller) {
			controller.disconnect();
		}
		process.exit(0);
	}
	
	// Handle escape sequences and regular keys
	switch (key) {
		case '\u001b[A': // Up arrow
		case 'w':
		case 'W':
			pacxonGame.setDirection('UP');
			break;
		case '\u001b[B': // Down arrow
		case 's':
		case 'S':
			pacxonGame.setDirection('DOWN');
			break;
		case '\u001b[D': // Left arrow
		case 'a':
		case 'A':
			pacxonGame.setDirection('LEFT');
			break;
		case '\u001b[C': // Right arrow
		case 'd':
		case 'D':
			pacxonGame.setDirection('RIGHT');
			break;
		case 'r':
		case 'R':
			pacxonGame.restart();
			break;
		case ' ': // Spacebar for pause/restart
			pacxonGame.restart();
			break;
	}
});

// Initialize the ticker at x frames per second
const ticker = new Ticker({ fps: FPS });

ticker.start(({ deltaTime, elapsedTime }) => {
	// Update game logic
	pacxonGame.update();

	ctx.clearRect(0, 0, width, height);

	// Fill the canvas with a black background
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width, height);

	// Render the Pacxon game
	pacxonGame.render(ctx);

	// Convert image to binary (purely black and white) for flipdot display
	{
		const imageData = ctx.getImageData(0, 0, width, height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			// Apply thresholding - any pixel above 127 brightness becomes white (255), otherwise black (0)
			const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
			const binary = brightness > 127 ? 255 : 0;
			data[i] = binary; // R
			data[i + 1] = binary; // G
			data[i + 2] = binary; // B
			data[i + 3] = 255; // The board is not transparent :-)
		}
		ctx.putImageData(imageData, 0, 0);
	}

	// Get the image data
	const imageData = ctx.getImageData(0, 0, display.width, display.height);
	
	if (IS_DEV) {
		// Send frame directly to browser via WebSocket
		sendFrame(imageData.data, imageData.width, imageData.height);
		
		// Optionally still save PNG for debugging (can be removed for even better performance)
		// const filename = path.join(outputDir, "frame.png");
		// const buffer = canvas.toBuffer("image/png");
		// fs.writeFileSync(filename, buffer);
	} else {
		// Send to physical flipdot display
		display.setImageData(imageData);
		if (display.isDirty()) {
			display.flush();
		}
	}
});

// Cleanup on process exit
process.on('SIGINT', () => {
	console.log('\n🛑 Shutting down gracefully...');
	// Restore terminal state
	if (process.stdin.isTTY) {
		process.stdin.setRawMode(false);
	}
	if (controller && controller.isConnected) {
		console.log('   Disconnecting controller...');
		controller.disconnect();
	}
	console.log('   Goodbye! 👋');
	process.exit(0);
});

process.on('SIGTERM', () => {
	console.log('\n🛑 Shutting down gracefully...');
	// Restore terminal state
	if (process.stdin.isTTY) {
		process.stdin.setRawMode(false);
	}
	if (controller && controller.isConnected) {
		console.log('   Disconnecting controller...');
		controller.disconnect();
	}
	console.log('   Goodbye! 👋');
	process.exit(0);
});

// Handle uncaught exceptions to restore terminal
process.on('uncaughtException', (error) => {
	console.error('\n❌ Uncaught exception:', error);
	if (process.stdin.isTTY) {
		process.stdin.setRawMode(false);
	}
	process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('\n❌ Unhandled rejection at:', promise, 'reason:', reason);
	if (process.stdin.isTTY) {
		process.stdin.setRawMode(false);
	}
	process.exit(1);
});
