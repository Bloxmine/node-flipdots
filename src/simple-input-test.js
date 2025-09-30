#!/usr/bin/env node

/**
 * Simple Terminal Input Test
 * Tests raw terminal input without game loop conflicts
 */

console.log('🎮 Simple Terminal Input Test');
console.log('==============================');
console.log('');

// Setup raw terminal input
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
}

console.log('✅ Terminal ready for input!');
console.log('   Press keys to test: w/a/s/d, arrows, r, space');
console.log('   Press Ctrl+C to exit');
console.log('');

let inputCount = 0;

process.stdin.on('data', (chunk) => {
    const key = chunk.toString();
    inputCount++;
    
    // Handle Ctrl+C to exit
    if (key === '\u0003') {
        console.log('\n🛑 Exiting...');
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        process.exit(0);
    }
    
    // Handle different key types
    let keyName = 'Unknown';
    switch (key) {
        case '\u001b[A':
            keyName = 'UP ARROW';
            break;
        case '\u001b[B':
            keyName = 'DOWN ARROW';
            break;
        case '\u001b[D':
            keyName = 'LEFT ARROW';
            break;
        case '\u001b[C':
            keyName = 'RIGHT ARROW';
            break;
        case 'w':
        case 'W':
            keyName = 'W (UP)';
            break;
        case 's':
        case 'S':
            keyName = 'S (DOWN)';
            break;
        case 'a':
        case 'A':
            keyName = 'A (LEFT)';
            break;
        case 'd':
        case 'D':
            keyName = 'D (RIGHT)';
            break;
        case 'r':
        case 'R':
            keyName = 'R (RESTART)';
            break;
        case ' ':
            keyName = 'SPACE';
            break;
        default:
            if (key.charCodeAt(0) >= 32 && key.charCodeAt(0) <= 126) {
                keyName = `'${key}'`;
            } else {
                keyName = `Code: ${key.charCodeAt(0)}`;
            }
    }
    
    console.log(`⌨️  Input #${inputCount}: ${keyName}`);
});

// Cleanup
process.on('SIGINT', () => {
    console.log('\n👋 Terminal test completed!');
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
    }
    process.exit(0);
});

process.on('exit', () => {
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
    }
});

console.log('⏳ Waiting for input...');