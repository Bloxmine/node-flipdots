import http from "node:http";
import { WebSocketServer } from "ws";

// Store the current frame data
let currentFrameData = null;
let frameWidth = 84;
let frameHeight = 28;

// Create HTTP server
const server = http.createServer((req, res) => {
	if (req.url === "/view") {
		res.writeHead(200, { "Content-Type": "text/html" });
		res.end(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Flipdot Display Preview</title>
  <style>
    body {
      margin: 0;
      background: #1a1a1a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: monospace;
      color: #fff;
    }
    #container {
      text-align: center;
    }
    #canvas {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      border: 2px solid #333;
      background: #000;
    }
    #status {
      margin-top: 10px;
      font-size: 14px;
      color: #888;
    }
    .connected { color: #0f0; }
    .disconnected { color: #f00; }
  </style>
</head>
<body>
  <div id="container">
    <canvas id="canvas"></canvas>
    <div id="status">Connecting...</div>
  </div>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const status = document.getElementById('status');
    
    // Disable image smoothing for crisp pixel rendering
    ctx.imageSmoothingEnabled = false;
    
    let ws;
    let reconnectTimer;
    
    function connect() {
      ws = new WebSocket('ws://' + location.host);
      
      ws.onopen = () => {
        status.innerHTML = '<span class="connected">● Connected</span>';
        clearTimeout(reconnectTimer);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'init') {
          // Initialize canvas with correct dimensions
          canvas.width = data.width;
          canvas.height = data.height;
          // Scale up for better visibility
          const scale = Math.min(
            Math.floor(window.innerWidth * 0.8 / data.width),
            Math.floor(window.innerHeight * 0.8 / data.height),
            10
          );
          canvas.style.width = (data.width * scale) + 'px';
          canvas.style.height = (data.height * scale) + 'px';
        } else if (data.type === 'frame') {
          // Convert base64 to binary data
          const binaryString = atob(data.data);
          const len = binaryString.length;
          const bytes = new Uint8ClampedArray(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Create ImageData and draw to canvas
          const imageData = new ImageData(bytes, data.width, data.height);
          ctx.putImageData(imageData, 0, 0);
        }
      };
      
      ws.onerror = (error) => {
        status.innerHTML = '<span class="disconnected">● Connection Error</span>';
      };
      
      ws.onclose = () => {
        status.innerHTML = '<span class="disconnected">● Disconnected - Reconnecting...</span>';
        // Attempt to reconnect after 1 second
        reconnectTimer = setTimeout(connect, 1000);
      };
    }
    
    connect();
  </script>
</body>
</html>
    `);
	} else {
		res.writeHead(404);
		res.end("Not found");
	}
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
	console.log("📱 Browser connected to preview");
	
	// Send initial dimensions
	ws.send(JSON.stringify({
		type: "init",
		width: frameWidth,
		height: frameHeight
	}));
	
	// Send current frame if available
	if (currentFrameData) {
		ws.send(JSON.stringify({
			type: "frame",
			width: frameWidth,
			height: frameHeight,
			data: currentFrameData
		}));
	}
});

// Function to broadcast frame to all connected clients
export function sendFrame(imageData) {
	// Update dimensions if they changed
	if (imageData.width !== frameWidth || imageData.height !== frameHeight) {
		frameWidth = imageData.width;
		frameHeight = imageData.height;
	}
	
	// Convert Uint8ClampedArray to base64 for efficient transmission
	const base64 = Buffer.from(imageData.data.buffer).toString('base64');
	currentFrameData = base64;
	
	const message = JSON.stringify({
		type: "frame",
		width: frameWidth,
		height: frameHeight,
		data: base64
	});
	
	// Broadcast to all connected clients
	wss.clients.forEach((client) => {
		if (client.readyState === 1) { // WebSocket.OPEN
			client.send(message);
		}
	});
}

server.listen(3000, () => {
	console.log("🌐 Preview server running at http://localhost:3000/view");
});
