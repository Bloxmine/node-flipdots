import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { FlipDotPrototypeRenderer } from "./prototype-renderer.js";
import { updatePrototypeRenderer, setGameInstance } from "./prototype-preview.js";

// Pacxon game imports
import { PacxonGame } from "./pacxon-flipdot.js";

const IS_DEV = process.argv.includes("--dev");

// Display dimensions (from settings)
const width = 84;  // LAYOUT width
const height = 28; // LAYOUT height

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
updatePrototypeRenderer(prototypeRenderer);

// Initialize the Pacxon game without auto-play
const pacxonGame = new PacxonGame(width, height, false);

// Set the game instance for web controls
setGameInstance(pacxonGame);

// Handle Ctrl+C to exit gracefully
process.on('SIGINT', () => {
	console.log('\nExiting...');
	process.exit();
});

// Initialize the ticker at x frames per second
const ticker = new Ticker({ fps: FPS });

ticker.start(({ deltaTime, elapsedTime }) => {
	// Clear the console
	console.clear();
	console.time("Write frame");
	console.log(`Rendering FlipDot Prototype: ${width}x${height} grid`);
	console.log("🌐 View prototype at http://localhost:3001");
	console.log("🎮 Use web controls to play the game");
	console.log("⌨️  Or use keyboard: Arrow Keys/WASD to move, R to restart");

	// Update game logic
	pacxonGame.update();

	ctx.clearRect(0, 0, width, height);

	// Fill the canvas with a black background
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width, height);

	// Render the Pacxon game
	pacxonGame.render(ctx);

	// Display game status in terminal only
	const status = pacxonGame.getStatus();
	if (status) {
		console.log(`Game Status: ${status}`);
	}

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

	// Update the prototype renderer
	prototypeRenderer.renderFromCanvas(canvas);

	if (IS_DEV) {
		// Save both the original canvas and prototype
		const filename = path.join(outputDir, "frame.png");
		const buffer = canvas.toBuffer("image/png");
		fs.writeFileSync(filename, buffer);
		
		// Save prototype version
		prototypeRenderer.savePrototype("prototype-frame.png");
	}

	console.log(`Elapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
	console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
	console.timeEnd("Write frame");
});