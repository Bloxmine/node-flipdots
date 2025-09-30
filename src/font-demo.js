#!/usr/bin/env node

/**
 * Number Font Visualization
 * Shows how the new 3-pixel wide numbers look
 */

// Number characters (3-pixel wide format)
const numbers = {
  "0": [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  "1": [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  "2": [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  "3": [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  "4": [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  "5": [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  "6": [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  "7": [[1,1,1],[0,0,1],[0,0,1],[0,1,0],[0,1,0]],
  "8": [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  "9": [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
};

function visualizeNumber(num) {
  console.log(`\n--- Number: ${num} ---`);
  const pattern = numbers[num];
  
  for (let row = 0; row < 5; row++) {
    let line = '';
    for (let col = 0; col < 3; col++) {
      line += pattern[row][col] ? '██' : '  ';
    }
    console.log(line);
  }
}

function visualizeScore(score) {
  console.log(`\n=== Score: ${score} ===`);
  
  const digits = score.toString().split('');
  const height = 5;
  
  for (let row = 0; row < height; row++) {
    let line = '';
    for (let i = 0; i < digits.length; i++) {
      const digit = digits[i];
      const pattern = numbers[digit];
      
      for (let col = 0; col < 3; col++) {
        line += pattern[row][col] ? '██' : '  ';
      }
      
      // Add spacing between digits
      if (i < digits.length - 1) {
        line += ' ';
      }
    }
    console.log(line);
  }
}

console.log('🔢 New 3-Pixel Wide Number Font Visualization');
console.log('==============================================');

// Show individual numbers
for (let i = 0; i <= 9; i++) {
  visualizeNumber(i.toString());
}

console.log('\n\n📊 Score Examples:');
console.log('==================');

// Show some score examples
const scoreExamples = ['0', '12', '234', '1337', '9999'];
scoreExamples.forEach(score => {
  visualizeScore(score);
});

console.log('\n✨ This is how the score appears in the top-right corner of the game!');