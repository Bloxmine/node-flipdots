// Snake Game for Flipdot Display
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { characters, lettersBig } from './characters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HIGH_SCORES_FILE = path.join(__dirname, '..', 'snake-high-scores.json');
const INPUT_DEBOUNCE_MS = 150;
const NAME_ENTRY_DELAY_MS = 500;
const SCORES_DISPLAY_MS = 10000;

const titleScreenSnake = {
  "frame_1": [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,0,1,1,0,0,0,0,0,0,0,1,1,1,1,0,1,1,1,1,0,0,0,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,0,1,1,1,1,0,0,1,1,1,1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,1,1,1,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,1,0,1,1,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,0,0,0,0,0,1,1,1,0,1,0,1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,0,0,1,1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,1,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ],
  "frame_2": [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,0,1,1,0,0,0,0,0,0,0,1,1,1,1,0,1,1,1,1,0,0,0,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,0,1,1,1,1,0,0,1,1,1,1,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,1,1,1,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,1,0,1,1,1,1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,0,0,0,0,0,1,1,1,0,1,0,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,1,1,1,1,1,0,0,1,1,1,1,0,1,1,1,1,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1,0,0,0,1,1,1,1,1,0,1,1,1,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ]
};

export class SnakeGame {
  constructor(width, height, renderToCanvas = true) {
    this.width = width;
    this.height = height;
    this.renderToCanvas = renderToCanvas;
    
    this.gridSize = 2; // Size of each snake segment
    this.gridWidth = Math.floor(width / this.gridSize);
    this.gridHeight = Math.floor(height / this.gridSize);
    
    this.highScores = this.loadHighScores();
    this.nameEntry = this.createNameEntryState();
    
    this.reset();
  }

  createNameEntryState() {
    return {
      active: false,
      name: ['A', 'A', 'A'],
      cursorPos: 0,
      startTime: 0,
      lastInputTime: 0,
      showingScores: false,
      scoresDisplayTime: 0,
      scrollOffset: 0
    };
  }

  reset() {
    this.snake = [
      { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 2) }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = this.generateFood();
    this.score = 0;
    this.moveCounter = 0;
    this.moveInterval = 5; // Move every 5 frames
    this.gameOver = false;
    this.gameOverTime = 0;
    this.showTitle = true;
    this.titleStartTime = Date.now();
    this.titleAnimFrame = 0;
    this.titleAnimTime = Date.now();
    
    this.gameState = {
      scene: 'TITLE',
      lives: 3,
      playing: false,
      player: { x: this.snake[0].x, y: this.snake[0].y }
    };
  }

  generateFood() {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight)
      };
    } while (this.snake.some(seg => seg.x === food.x && seg.y === food.y));
    return food;
  }

  setDirection(direction) {
    // Start game from title screen
    if (this.showTitle) {
      this.showTitle = false;
      this.gameState.scene = 'PLAYING';
      this.gameState.playing = true;
      return;
    }
    
    // Handle name entry navigation
    if (this.nameEntry.active && !this.nameEntry.showingScores) {
      this.handleNameEntryInput(direction.toLowerCase());
      return;
    }
    
    // Prevent reversing into self
    if (direction === 'UP' && this.direction.y === 0) {
      this.nextDirection = { x: 0, y: -1 };
    } else if (direction === 'DOWN' && this.direction.y === 0) {
      this.nextDirection = { x: 0, y: 1 };
    } else if (direction === 'LEFT' && this.direction.x === 0) {
      this.nextDirection = { x: -1, y: 0 };
    } else if (direction === 'RIGHT' && this.direction.x === 0) {
      this.nextDirection = { x: 1, y: 0 };
    }
  }

  handleButtonPress(button) {
    // Don't start game from title screen with A/START
    if (this.showTitle) {
      return;
    }
    
    // Restart from high score display
    if (this.nameEntry.showingScores && (button === 'A' || button === 'START')) {
      this.restart();
      return;
    }
    
    if (this.nameEntry.active && !this.nameEntry.showingScores) {
      if (button === 'A' || button === 'START') {
        this.handleNameEntryInput('enter');
      }
      return;
    }
    
    if (this.gameOver && !this.nameEntry.active && (button === 'A' || button === 'START')) {
      // Check if score qualifies for high scores
      if (this.isHighScore(this.score)) {
        this.nameEntry.active = true;
        this.nameEntry.startTime = Date.now();
        this.nameEntry.showingScores = false;
        this.gameState.scene = 'NAME_ENTRY';
      } else {
        this.restart();
      }
    }
  }

  restart() {
    this.reset();
    this.nameEntry = this.createNameEntryState();
  }

  loadHighScores() {
    if (typeof fs === 'undefined') return [];
    
    try {
      if (fs.existsSync(HIGH_SCORES_FILE)) {
        const data = fs.readFileSync(HIGH_SCORES_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading Snake high scores:', err);
    }
    return [];
  }

  saveHighScores() {
    if (typeof fs === 'undefined') {
      console.log('Snake high scores (browser mode):', this.highScores);
      return;
    }
    
    try {
      fs.writeFileSync(HIGH_SCORES_FILE, JSON.stringify(this.highScores, null, 2));
      const latest = this.highScores[this.highScores.length - 1];
      if (latest) console.log(`Snake - ${latest.name}: ${latest.score}`);
    } catch (err) {
      console.error('Error saving Snake high scores:', err);
    }
  }

  isHighScore(score) {
    if (this.highScores.length < 10) return true;
    return score > this.highScores[this.highScores.length - 1].score;
  }

  addHighScore(name, score) {
    this.highScores.push({
      name: name.join(''),
      score,
      date: new Date().toISOString()
    });
    
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 10);
    this.saveHighScores();
  }

  handleNameEntryInput(key) {
    const now = Date.now();
    
    if (this.nameEntry.showingScores || now - this.nameEntry.startTime < NAME_ENTRY_DELAY_MS) return;
    if (now - this.nameEntry.lastInputTime < INPUT_DEBOUNCE_MS) return;
    
    this.nameEntry.lastInputTime = now;
    const pos = this.nameEntry.cursorPos;

    if (key === 'up') {
      const code = this.nameEntry.name[pos].charCodeAt(0);
      this.nameEntry.name[pos] = String.fromCharCode(code === 90 ? 65 : code + 1);
    } else if (key === 'down') {
      const code = this.nameEntry.name[pos].charCodeAt(0);
      this.nameEntry.name[pos] = String.fromCharCode(code === 65 ? 90 : code - 1);
    } else if (key === 'right') {
      if (pos === 2) {
        this.submitScore();
      } else {
        this.nameEntry.cursorPos++;
      }
    } else if (key === 'left') {
      this.nameEntry.cursorPos = (pos - 1 + 3) % 3;
    } else if (key === 'enter') {
      this.submitScore();
    }
  }

  submitScore() {
    this.addHighScore(this.nameEntry.name, this.score);
    this.nameEntry.name = ['A', 'A', 'A'];
    this.nameEntry.cursorPos = 0;
    this.nameEntry.showingScores = true;
    this.nameEntry.scoresDisplayTime = Date.now();
    this.nameEntry.scrollOffset = 0;
  }

  update() {
    // Title screen - wait for player input
    if (this.showTitle) {
      return;
    }
    
    if (this.nameEntry.active) {
      // Don't auto-exit from high scores, wait for button press
      return;
    }
    
    // Auto-transition to name entry or restart after game over
    if (this.gameOver) {
      if (this.gameOverTime === 0) {
        this.gameOverTime = Date.now();
      }
      
      // After 2 seconds, check for high score or restart
      if (Date.now() - this.gameOverTime > 2000) {
        if (this.isHighScore(this.score)) {
          this.nameEntry.active = true;
          this.nameEntry.startTime = Date.now();
          this.nameEntry.showingScores = false;
          this.gameState.scene = 'NAME_ENTRY';
          this.gameOver = false;
        } else {
          this.restart();
        }
      }
      return;
    }

    this.moveCounter++;
    if (this.moveCounter < this.moveInterval) return;
    this.moveCounter = 0;

    // Update direction
    this.direction = this.nextDirection;

    // Calculate new head position
    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // Wrap around screen edges
    if (newHead.x < 0) newHead.x = this.gridWidth - 1;
    if (newHead.x >= this.gridWidth) newHead.x = 0;
    if (newHead.y < 0) newHead.y = this.gridHeight - 1;
    if (newHead.y >= this.gridHeight) newHead.y = 0;

    // Check self collision
    if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      this.gameOver = true;
      this.gameState.playing = false;
      return;
    }

    // Add new head
    this.snake.unshift(newHead);

    // Check food collision
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score++;
      this.food = this.generateFood();
      // Speed up slightly
      if (this.moveInterval > 2) {
        this.moveInterval = Math.max(2, this.moveInterval - 0.1);
      }
    } else {
      // Remove tail if no food eaten
      this.snake.pop();
    }

    this.gameState.player = { x: newHead.x, y: newHead.y };
  }

  drawNumber(ctx, num, x, y) {
    const numStr = num.toString();
    let cursorX = x;
    
    for (let i = 0; i < numStr.length; i++) {
      const digit = numStr[i];
      const charData = characters[digit];
      
      if (charData) {
        for (let row = 0; row < charData.length; row++) {
          for (let col = 0; col < charData[row].length; col++) {
            if (charData[row][col] === 1) {
              ctx.fillRect(cursorX + col, y + row, 1, 1);
            }
          }
        }
        cursorX += 4; // 3 pixel width + 1 spacing
      }
    }
  }

  drawText5x5(ctx, text, x, y) {
    let cursorX = x;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === ' ') {
        cursorX += 6;
        continue;
      }
      
      const charData = lettersBig[char.toUpperCase()];
      if (charData) {
        for (let row = 0; row < charData.length; row++) {
          for (let col = 0; col < charData[row].length; col++) {
            if (charData[row][col] === 1) {
              ctx.fillRect(cursorX + col, y + row, 1, 1);
            }
          }
        }
        cursorX += 6; // 5 pixel width + 1 spacing
      }
    }
  }

  render(ctx) {
    // Title screen
    if (this.showTitle) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#fff';
      
      // Animate between frames every 500ms
      const currentTime = Date.now();
      if (currentTime - this.titleAnimTime > 500) {
        this.titleAnimFrame = (this.titleAnimFrame + 1) % 2;
        this.titleAnimTime = currentTime;
      }
      
      // Draw the current animation frame
      const frameName = this.titleAnimFrame === 0 ? 'frame_1' : 'frame_2';
      const frame = titleScreenSnake[frameName];
      
      for (let y = 0; y < frame.length; y++) {
        for (let x = 0; x < frame[y].length; x++) {
          if (frame[y][x] === 1) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      
      return;
    }
    
    // If showing name entry or high scores
    if (this.nameEntry.active) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.width, this.height);
      
      if (this.nameEntry.showingScores) {
        this.renderHighScores(ctx);
      } else {
        this.renderNameEntry(ctx);
      }
      return;
    }
    
    ctx.fillStyle = '#fff';

    // Draw snake
    this.snake.forEach(segment => {
      ctx.fillRect(
        segment.x * this.gridSize,
        segment.y * this.gridSize,
        this.gridSize,
        this.gridSize
      );
    });

    // Draw food (blinking)
    if (Math.floor(Date.now() / 200) % 2 === 0) {
      ctx.fillRect(
        this.food.x * this.gridSize,
        this.food.y * this.gridSize,
        this.gridSize,
        this.gridSize
      );
    }

    // Draw score at top left using 3x5 font
    this.drawNumber(ctx, this.score, 2, 2);

    // Draw game over using 5x5 font
    if (this.gameOver) {
      const text1 = 'GAME';
      const text2 = 'OVER';
      const width1 = text1.length * 6;
      const width2 = text2.length * 6;
      const x1 = Math.floor((this.width - width1) / 2);
      const x2 = Math.floor((this.width - width2) / 2);
      const y1 = Math.floor(this.height / 2) - 6;
      const y2 = Math.floor(this.height / 2) + 1;
      
      // Background
      ctx.fillStyle = '#000';
      ctx.fillRect(x1 - 2, y1 - 1, Math.max(width1, width2) + 4, 13);
      
      // Text
      ctx.fillStyle = '#fff';
      this.drawText5x5(ctx, text1, x1, y1);
      this.drawText5x5(ctx, text2, x2, y2);
    }
  }

  renderNameEntry(ctx) {
    ctx.fillStyle = '#fff';
    
    // Score
    const scoreText = `SCORE ${this.score}`;
    const scoreWidth = scoreText.length * 6;
    this.drawText5x5(ctx, scoreText, Math.floor((this.width - scoreWidth) / 2), 4);
    
    // Name entry boxes
    const boxWidth = 7;
    const boxHeight = 7;
    const boxSpacing = 2;
    const totalWidth = (boxWidth * 3) + (boxSpacing * 2);
    const startX = Math.floor((this.width - totalWidth) / 2);
    const boxY = 14;
    
    const blinkOn = Math.floor(Date.now() / 300) % 2 === 0;
    
    for (let i = 0; i < 3; i++) {
      const boxX = startX + (i * (boxWidth + boxSpacing));
      
      // Draw box border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      // Draw letter
      const isCursor = i === this.nameEntry.cursorPos;
      if (!isCursor || blinkOn) {
        this.drawText5x5(ctx, this.nameEntry.name[i], boxX + 1, boxY + 1);
      }
    }
  }

  renderHighScores(ctx) {
    ctx.fillStyle = '#fff';
    
    // Title
    const title = 'HIGH SCORES';
    const titleWidth = title.length * 6;
    this.drawText5x5(ctx, title, Math.floor((this.width - titleWidth) / 2), 2);
    
    // Scores list
    let y = 10;
    const displayCount = Math.min(4, this.highScores.length);
    
    for (let i = 0; i < displayCount; i++) {
      const score = this.highScores[i];
      const rank = `${i + 1}`;
      const name = score.name;
      const points = score.score.toString();
      
      // Rank
      this.drawText5x5(ctx, rank, 2, y);
      
      // Name
      this.drawText5x5(ctx, name, 10, y);
      
      // Score (right aligned)
      const scoreWidth = points.length * 6;
      this.drawText5x5(ctx, points, this.width - scoreWidth - 2, y);
      
      y += 8;
    }
  }

  getStatus() {
    if (this.gameOver) {
      return `Game Over! Score: ${this.score}`;
    }
    return `Snake - Score: ${this.score} - Length: ${this.snake.length}`;
  }
}
