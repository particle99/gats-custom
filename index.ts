import Game from './src/Game';
import { config } from './src/config';

const game: Game = new Game("ffa", config);
game.updateGame();