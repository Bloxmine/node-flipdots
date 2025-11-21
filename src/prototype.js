import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import { FlipDotPrototypeRenderer } from "./prototype-renderer-refactored.js";
import { updatePrototypeRenderer, setGameInstance } from "./prototype-preview-refactored.js";

// Pacxon game imports
import { PacxonGame } from "./pacxon-flipdot-refactored.js";
import { Xbox360Controller } from "./controller.js";
import { NESController } from "./nes-controller.js";

const IS_DEV = process.argv.includes("--dev");
const USE_HARDWARE = process.argv.includes("--hardware");

// Create flipdot display (if using hardware)
let display = null;
let width = 84;
let height = 28;

if (USE_HARDWARE) {
	display = new Display({
		layout: LAYOUT,
		panelWidth: 28,
		isMirrored: true,
		transport: {
			type: 'serial',
			path: '/dev/ttyACM0',
			baudRate: 57600
		}
	});
	width = display.width;
	height = display.height;
	
	console.log('Flipdot Prototype with Hardware Output');
	console.log(`Mode: Physical Display + Browser Preview`);
	console.log(`Browser: http://localhost:3005`);
} else {
	console.log('Flipdot Prototype (Browser Only)');
	console.log(`Browser: http://localhost:3005`);
}

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

// Create canvas with the specified resolution (for game rendering)
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// Disable anti-aliasing and image smoothing
ctx.imageSmoothingEnabled = false;
ctx.font = "18px monospace";
ctx.textBaseline = "top";

// Create the prototype renderer
const prototypeRenderer = new FlipDotPrototypeRenderer(width, height, 8, 2);
prototypeRenderer.initialize(); // Initialize with all dots off
updatePrototypeRenderer(prototypeRenderer);

// Initialize the Pacxon game without auto-play
const pacxonGame = new PacxonGame(width, height, false);

// Set the game instance for web controls
setGameInstance(pacxonGame);

// Input handling setup
let controllerConnected = false;

// Try to initialize Xbox 360 controller first
const controller = new Xbox360Controller();

// Also try to initialize NES controller
const nesController = new NESController();

// Setup event handlers for Xbox controller
controller.on('connected', () => {
	controllerConnected = true;
	console.log('Xbox 360 controller connected!');
});

controller.on('notFound', () => {
	console.log('No Xbox 360 controller found (checked /dev/input/js*)');
});

controller.on('direction', (direction) => {
	pacxonGame.setDirection(direction);
});

controller.on('restart', () => {
	pacxonGame.restart();
});

controller.on('buttonPress', (button) => {
	// Let game handle button press (for name entry, idle animation, etc.)
	pacxonGame.handleButtonPress(button);
	
	// Handle start/restart for non-name-entry screens
	if (button === 'A' || button === 'START') {
		if (pacxonGame.gameState.scene === 'TITLE') {
			// Only start game if idle animation is waiting (not playing)
			if (pacxonGame.idleAnimation.phase === 'waiting') {
				pacxonGame.startGame();
			}
		} else if (pacxonGame.gameState.scene === 'HOW_TO_PLAY') {
			pacxonGame.startActualGame();
		} else if (pacxonGame.gameState.scene !== 'NAME_ENTRY') {
			pacxonGame.restart();
		}
	}
});

// Setup event handlers for NES controller
nesController.on('connected', () => {
	controllerConnected = true;
	console.log('NES controller ready for prototype!');
});

nesController.on('notFound', () => {
	if (!controller.isConnected) {
		console.log('Web controls and keyboard available');
		console.log('Access controls at http://localhost:3005');
	}
});

nesController.on('direction', (direction) => {
	pacxonGame.setDirection(direction);
});

nesController.on('restart', () => {
	pacxonGame.restart();
});

nesController.on('buttonPress', (button) => {
	// Let game handle button press (for name entry, idle animation, etc.)
	pacxonGame.handleButtonPress(button);
	
	// Handle start/restart for non-name-entry screens
	if (button === 'A' || button === 'START') {
		if (pacxonGame.gameState.scene === 'TITLE') {
			// Only start game if idle animation is waiting (not playing)
			if (pacxonGame.idleAnimation.phase === 'waiting') {
				pacxonGame.startGame();
			}
		} else if (pacxonGame.gameState.scene === 'HOW_TO_PLAY') {
			pacxonGame.startActualGame();
		} else if (pacxonGame.gameState.scene !== 'NAME_ENTRY') {
			pacxonGame.restart();
		}
	}
});

// Handle Ctrl+C to exit gracefully
process.on('SIGINT', () => {
	console.log('\nExiting...');
	if (controller && controller.isConnected) {
		controller.disconnect();
	}
	if (nesController && nesController.isConnected) {
		nesController.disconnect();
	}
	process.exit();
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

	// Get image data and pass to both prototype renderer and hardware (if enabled)
	const imageData = ctx.getImageData(0, 0, width, height);
	
	// Always render to prototype browser display
	const changedPixels = prototypeRenderer.renderFromImageData(imageData);

	// If hardware mode is enabled, also send to physical display
	if (USE_HARDWARE && display) {
		// Apply binary thresholding for hardware
		const hardwareImageData = ctx.getImageData(0, 0, width, height);
		const data = hardwareImageData.data;
		for (let i = 0; i < data.length; i += 4) {
			const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
			const binary = brightness > 127 ? 255 : 0;
			data[i] = binary;
			data[i + 1] = binary;
			data[i + 2] = binary;
			data[i + 3] = 255;
		}
		
		// Send to physical display
		display.setImageData(hardwareImageData);
		if (display.isDirty()) {
			display.flush();
		}
	}

	if (IS_DEV) {
		// Apply binary thresholding to the source canvas for saved output
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
			const binary = brightness > 127 ? 255 : 0;
			data[i] = binary; // R
			data[i + 1] = binary; // G
			data[i + 2] = binary; // B
			data[i + 3] = 255; // A
		}
		ctx.putImageData(imageData, 0, 0);
		
		// Save the game canvas (optional - can be disabled if not needed)
		const filename = path.join(outputDir, "frame.png");
		const buffer = canvas.toBuffer("image/png");
		fs.writeFileSync(filename, buffer);
	}
});