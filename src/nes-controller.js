import { EventEmitter } from 'events';
import fs from 'fs';

export class NESController extends EventEmitter {
    constructor() {
        super();
        this.isConnected = false;
        this.lastButtonState = {};
        this.lastAxisValues = {}; // Track last axis values for analog stick deadzone
        this.fd = null;
        this.devicePath = null;
        this.readBuffer = Buffer.alloc(24); // Linux input event size
        
        // NES controller button codes (Linux input event codes)
        this.buttonMap = {
            304: 'A',      // BTN_SOUTH / BTN_A
            305: 'B',      // BTN_EAST / BTN_B
            308: 'SELECT', // BTN_SELECT
            309: 'START',  // BTN_START
        };
        
        this.init();
    }

    init() {
        try {
            // Check multiple possible event devices
            const possibleDevices = [];
            for (let i = 0; i < 32; i++) {
                possibleDevices.push(`/dev/input/event${i}`);
            }
            
            // Try to find a device that looks like a gamepad/joystick
            for (const device of possibleDevices) {
                if (fs.existsSync(device)) {
                    try {
                        // Try to open the device
                        const testFd = fs.openSync(device, 'r');
                        
                        // Read device name to check if it's a gamepad
                        // This is a simple check - we'll accept any accessible event device
                        fs.closeSync(testFd);
                        
                        // Try to use this device
                        this.devicePath = device;
                        console.log(`🎮 Found input device at ${device}`);
                        console.log(`   Attempting to use as NES controller...`);
                        
                        this.connectToDevice();
                        if (this.isConnected) {
                            break;
                        }
                    } catch (err) {
                        // Device not accessible, try next one
                        continue;
                    }
                }
            }
            
            if (!this.isConnected) {
                console.log('🔍 No accessible NES controller found.');
                console.log('   Tip: You may need to run with sudo or add user to input group:');
                console.log('   sudo usermod -a -G input $USER');
                this.emit('notFound');
            }
            
        } catch (error) {
            console.error('❌ Error initializing NES controller:', error.message);
            this.emit('error', error);
        }
    }

    connectToDevice() {
        try {
            // Open in non-blocking mode
            this.fd = fs.openSync(this.devicePath, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
            this.isConnected = true;
            console.log(`✅ NES controller connected at ${this.devicePath}`);
            console.log('   D-pad and buttons ready!');
            this.emit('connected');
            this.startReading();
        } catch (error) {
            console.error(`❌ Could not open ${this.devicePath}:`, error.message);
            this.isConnected = false;
        }
    }

    startReading() {
        if (!this.isConnected || !this.fd) return;

        // Non-blocking read loop using setInterval to avoid blocking event loop
        this.readInterval = setInterval(() => {
            if (!this.isConnected || !this.fd) {
                if (this.readInterval) {
                    clearInterval(this.readInterval);
                }
                return;
            }

            try {
                // Try to read, but don't block if no data available
                const bytesRead = fs.readSync(this.fd, this.readBuffer, 0, 24, null);
                
                if (bytesRead === 24) {
                    this.parseEvent(this.readBuffer);
                }
            } catch (error) {
                // EAGAIN means no data available, which is fine in non-blocking mode
                if (error.code !== 'EAGAIN' && error.code !== 'EWOULDBLOCK') {
                    console.error('❌ Error reading controller:', error.message);
                    this.disconnect();
                }
            }
        }, 10); // Poll every 10ms
    }

    parseEvent(buffer) {
        // Linux input_event structure:
        // struct input_event {
        //     struct timeval time; // 16 bytes (8+8) on 64-bit
        //     __u16 type;
        //     __u16 code;
        //     __s32 value;
        // };
        
        const type = buffer.readUInt16LE(16);
        const code = buffer.readUInt16LE(18);
        const value = buffer.readInt32LE(20);

        // EV_KEY = 1 (button press/release)
        if (type === 1) {
            this.handleButton(code, value);
        }
        // EV_ABS = 3 (absolute axis - D-pad on many controllers)
        else if (type === 3) {
            this.handleAxis(code, value);
        }
    }

    handleButton(code, value) {
        const buttonName = this.buttonMap[code];
        
        if (value === 1) { // Button pressed
            console.log(`🎮 Button pressed: ${buttonName || code}`);
            
            if (buttonName === 'START' || buttonName === 'A') {
                this.emit('restart');
            }
            
            if (buttonName) {
                this.emit('buttonPress', buttonName);
            }
        } else if (value === 0) { // Button released
            if (buttonName) {
                this.emit('buttonRelease', buttonName);
            }
        }
    }

    handleAxis(code, value) {
        // ABS_X = 0 (horizontal axis - analog stick)
        // ABS_Y = 1 (vertical axis - analog stick)
        // ABS_HAT0X = 16 (D-pad horizontal)
        // ABS_HAT0Y = 17 (D-pad vertical)
        
        // For Xbox 360 controller and similar, only use D-pad (codes 16/17)
        // Ignore analog sticks (codes 0/1) to prevent input flooding
        
        // Handle D-pad horizontal (HAT0X = 16)
        if (code === 16) {
            if (value === -1) {
                console.log('🎮 D-pad LEFT');
                this.emit('direction', 'LEFT');
            } else if (value === 1) {
                console.log('🎮 D-pad RIGHT');
                this.emit('direction', 'RIGHT');
            }
        }
        // Handle D-pad vertical (HAT0Y = 17)
        else if (code === 17) {
            if (value === -1) {
                console.log('🎮 D-pad UP');
                this.emit('direction', 'UP');
            } else if (value === 1) {
                console.log('🎮 D-pad DOWN');
                this.emit('direction', 'DOWN');
            }
        }
        // Handle analog stick with deadzone (for controllers that use analog for D-pad)
        else if (code === 0) {
            const threshold = 20000; // Deadzone for analog stick
            const lastValue = this.lastAxisValues[code] || 0;
            
            // Only emit when crossing threshold (not continuously)
            if (value < -threshold && lastValue >= -threshold) {
                console.log('🎮 Analog LEFT');
                this.emit('direction', 'LEFT');
            } else if (value > threshold && lastValue <= threshold) {
                console.log('🎮 Analog RIGHT');
                this.emit('direction', 'RIGHT');
            }
            
            this.lastAxisValues[code] = value;
        }
        else if (code === 1) {
            const threshold = 20000; // Deadzone for analog stick
            const lastValue = this.lastAxisValues[code] || 0;
            
            // Only emit when crossing threshold (not continuously)
            if (value < -threshold && lastValue >= -threshold) {
                console.log('🎮 Analog UP');
                this.emit('direction', 'UP');
            } else if (value > threshold && lastValue <= threshold) {
                console.log('🎮 Analog DOWN');
                this.emit('direction', 'DOWN');
            }
            
            this.lastAxisValues[code] = value;
        }
    }

    disconnect() {
        if (this.readInterval) {
            clearInterval(this.readInterval);
            this.readInterval = null;
        }
        if (this.fd) {
            try {
                fs.closeSync(this.fd);
                this.fd = null;
                this.isConnected = false;
                this.emit('disconnected');
                console.log('🔌 NES controller disconnected.');
            } catch (error) {
                console.error('❌ Error disconnecting NES controller:', error);
            }
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            device: this.devicePath || null,
            type: 'NES Controller'
        };
    }
}
