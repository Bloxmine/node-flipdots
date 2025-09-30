#!/usr/bin/env node

/**
 * Input Test Script - Test both controller and keyboard input
 * This script helps verify that both input methods work correctly
 */

import { Xbox360Controller } from "./controller.js";

console.log('🎮 Input System Test');
console.log('===================');
console.log('');

// Test controller detection
console.log('🔍 Checking for controllers...');
const availableDevices = Xbox360Controller.getAvailableDevices();
if (availableDevices.length > 0) {
    console.log(`✅ Found controllers: ${availableDevices.join(', ')}`);
} else {
    console.log('❌ No controllers detected');
}

console.log('');
console.log('🎯 Testing Input Methods:');
console.log('');

// Initialize controller
const controller = new Xbox360Controller();
let controllerActive = false;

controller.on('connected', () => {
    controllerActive = true;
    console.log('✅ Controller connected and ready!');
    console.log('   Try using D-pad, left stick, or A button');
});

controller.on('notFound', () => {
    console.log('ℹ️  No controller found - keyboard only mode');
});

controller.on('disconnected', () => {
    controllerActive = false;
    console.log('❌ Controller disconnected');
});

controller.on('error', (error) => {
    console.error('❌ Controller error:', error.message);
});

// Test controller inputs
controller.on('direction', (direction) => {
    console.log(`🎮 Controller direction: ${direction}`);
});

controller.on('buttonPress', (button) => {
    console.log(`🎮 Controller button: ${button}`);
});

// Setup keyboard input
console.log('⌨️  Setting up keyboard input...');

// Don't use readline interface, use direct stdin handling
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
}

console.log('✅ Keyboard input ready');
console.log('   Use WASD or arrow keys for movement, R for restart, Ctrl+C to exit');
console.log('');

process.stdin.on('data', (chunk) => {
    const key = chunk.toString();
    
    if (key === '\u0003') {
        console.log('\n🛑 Exiting test...');
        // Restore terminal state
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        if (controller) {
            controller.disconnect();
        }
        process.exit(0);
    }
    
    // Test keyboard inputs
    switch (key) {
        case '\u001b[A': // Up arrow
        case 'w':
        case 'W':
            console.log('⌨️  Keyboard direction: UP');
            break;
        case '\u001b[B': // Down arrow
        case 's':
        case 'S':
            console.log('⌨️  Keyboard direction: DOWN');
            break;
        case '\u001b[D': // Left arrow
        case 'a':
        case 'A':
            console.log('⌨️  Keyboard direction: LEFT');
            break;
        case '\u001b[C': // Right arrow
        case 'd':
        case 'D':
            console.log('⌨️  Keyboard direction: RIGHT');
            break;
        case 'r':
        case 'R':
            console.log('⌨️  Keyboard action: RESTART');
            break;
        default:
            if (key.charCodeAt(0) >= 32 && key.charCodeAt(0) <= 126) {
                console.log(`⌨️  Key pressed: ${key}`);
            }
    }
});

console.log('🚀 Test started! Try using both controller and keyboard...');
console.log('');

// Show status every 5 seconds
setInterval(() => {
    const status = controllerActive ? '🎮 Controller + ⌨️  Keyboard' : '⌨️  Keyboard only';
    console.log(`📊 Current input status: ${status}`);
}, 5000);

// Cleanup
process.on('SIGINT', () => {
    console.log('\n👋 Test completed!');
    // Restore terminal state
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
    }
    if (controller) {
        controller.disconnect();
    }
    process.exit(0);
});

// Handle cleanup on exit
process.on('exit', () => {
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
    }
});