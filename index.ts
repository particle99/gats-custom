import Game from './src/Game';
import { config } from './src/config';

const game: Game = new Game("CTF", config);
game.updateGame();