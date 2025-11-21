import Joystick from 'joystick';
import { EventEmitter } from 'events';
import fs from 'fs';

export class Xbox360Controller extends EventEmitter {
    constructor() {
        super();
        this.joystick = null;
        this.isConnected = false;
        this.lastButtonState = {};
        this.lastAxisValues = {};
        
        // Xbox 360 controller button mapping (Linux joystick interface)
        this.buttonMap = {
            0: 'A',
            1: 'B', 
            2: 'X',
            3: 'Y',
            4: 'LEFT_BUMPER',
            5: 'RIGHT_BUMPER',
            6: 'BACK',
            7: 'START',
            8: 'XBOX_BUTTON',
            9: 'LEFT_STICK',
            10: 'RIGHT_STICK'
        };
        
        // Xbox 360 axis mapping
        this.axisMap = {
            0: 'LEFT_STICK_X',
            1: 'LEFT_STICK_Y', 
            2: 'LEFT_TRIGGER',
            3: 'RIGHT_STICK_X',
            4: 'RIGHT_STICK_Y',
            5: 'RIGHT_TRIGGER',
            6: 'DPAD_X', // D-pad horizontal
            7: 'DPAD_Y'  // D-pad vertical
        };
        
        this.init();
    }

    init() {
        try {
            // Check multiple possible joystick devices
            const possibleDevices = ['/dev/input/js0', '/dev/input/js1', '/dev/input/js2'];
            let joystickPath = null;
            
            for (const device of possibleDevices) {
                if (fs.existsSync(device)) {
                    joystickPath = device;
                    break;
                }
            }
            
            if (!joystickPath) {
                console.log('No 360 controller found. Keyboard input will be used.');
                this.emit('notFound');
                return;
            }

            console.log(`Xbox 360 controller detected at ${joystickPath}`);
            
            const deviceIndex = parseInt(joystickPath.match(/js(\d+)$/)[1]);
            this.joystick = new Joystick(deviceIndex, 3500, 350); // device, deadzone, sensitivity
            this.isConnected = true;
            this.setupEventHandlers();
            this.emit('connected');
            
        } catch (error) {
            console.error('❌ Error initializing Xbox 360 controller:', error.message);
            this.emit('error', error);
        }
    }

    setupEventHandlers() {
        if (!this.joystick) return;

        // Handle button events
        this.joystick.on('button', (data) => {
            const buttonName = this.buttonMap[data.number];
            if (buttonName) {
                if (data.value === 1) {
                    this.emit('buttonPress', buttonName);
                    
                    // Handle movement via D-pad buttons (some controllers)
                    switch (buttonName) {
                        case 'A':
                        case 'START':
                            this.emit('restart');
                            break;
                    }
                } else if (data.value === 0) {
                    this.emit('buttonRelease', buttonName);
                }
            }
        });

        // Handle axis events (analog sticks and D-pad)
        this.joystick.on('axis', (data) => {
            const axisName = this.axisMap[data.number];
            if (!axisName) return;
            
            const value = data.value;
            const deadzone = 0.25; // Slightly reduced deadzone for better responsiveness
            const lastValue = this.lastAxisValues[axisName] || 0;
            
            // Handle D-pad
            if (axisName === 'DPAD_X') {
                if (value > deadzone && lastValue <= deadzone) {
                    this.emit('direction', 'RIGHT');
                } else if (value < -deadzone && lastValue >= -deadzone) {
                    this.emit('direction', 'LEFT');
                }
            } else if (axisName === 'DPAD_Y') {
                if (value > deadzone && lastValue <= deadzone) {
                    this.emit('direction', 'DOWN');
                } else if (value < -deadzone && lastValue >= -deadzone) {
                    this.emit('direction', 'UP');
                }
            }
            // Handle left analog stick
            else if (axisName === 'LEFT_STICK_X') {
                if (Math.abs(value) > deadzone && Math.abs(lastValue) <= deadzone) {
                    this.emit('direction', value > 0 ? 'RIGHT' : 'LEFT');
                }
            } else if (axisName === 'LEFT_STICK_Y') {
                if (Math.abs(value) > deadzone && Math.abs(lastValue) <= deadzone) {
                    // Note: Y axis is inverted on most controllers
                    this.emit('direction', value > 0 ? 'DOWN' : 'UP');
                }
            }
            
            this.lastAxisValues[axisName] = value;
        });

        this.joystick.on('error', (error) => {
            console.error('Controller error:', error);
            this.isConnected = false;
            this.emit('disconnected');
        });
    }

    disconnect() {
        if (this.joystick) {
            try {
                this.joystick.close();
                this.isConnected = false;
                this.emit('disconnected');
                console.log('🔌 Controller disconnected successfully.');
            } catch (error) {
                console.error('❌ Error disconnecting controller:', error);
            }
        }
    }

    // Get current connection status
    getStatus() {
        return {
            connected: this.isConnected,
            device: this.joystick ? 'Xbox 360 Controller' : null,
            inputMethods: this.isConnected ? ['controller', 'keyboard'] : ['keyboard']
        };
    }

    // Static method to check if any controller is available
    static isAvailable() {
        const possibleDevices = ['/dev/input/js0', '/dev/input/js1', '/dev/input/js2'];
        return possibleDevices.some(device => fs.existsSync(device));
    }

    // Static method to get available devices
    static getAvailableDevices() {
        const possibleDevices = ['/dev/input/js0', '/dev/input/js1', '/dev/input/js2'];
        return possibleDevices.filter(device => fs.existsSync(device));
    }
}