// Game Loader - Dynamically load and manage games
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GameLoader {
  constructor() {
    this.currentGame = null;
    this.currentGameConfig = null;
  }

  /**
   * Load the games configuration from games.json
   * @returns {Array} Array of game configurations
   */
  static loadGamesConfig() {
    const configPath = path.join(__dirname, '..', 'games.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    return config.games;
  }

  /**
   * Load a game dynamically based on its configuration
   * @param {Object} gameConfig - Game configuration from games.json
   * @param {number} width - Display width
   * @param {number} height - Display height
   * @returns {Promise<Object>} The instantiated game object
   */
  async loadGame(gameConfig, width, height) {
    try {
      // Resolve the module path
      const modulePath = path.resolve(__dirname, '..', gameConfig.module);
      
      // Dynamically import the game module
      const gameModule = await import(`file://${modulePath}`);
      
      // Get the game class from the module
      const GameClass = gameModule[gameConfig.class];
      
      if (!GameClass) {
        throw new Error(`Game class ${gameConfig.class} not found in module ${gameConfig.module}`);
      }
      
      // Instantiate the game
      const gameInstance = new GameClass(width, height, false);
      
      this.currentGame = gameInstance;
      this.currentGameConfig = gameConfig;
      
      return gameInstance;
    } catch (error) {
      console.error(`Failed to load game ${gameConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Get the current game instance
   * @returns {Object|null}
   */
  getCurrentGame() {
    return this.currentGame;
  }

  /**
   * Get the current game configuration
   * @returns {Object|null}
   */
  getCurrentGameConfig() {
    return this.currentGameConfig;
  }

  /**
   * Unload the current game (cleanup)
   */
  unloadGame() {
    this.currentGame = null;
    this.currentGameConfig = null;
  }
}
