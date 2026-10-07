import tictactoe from './tictactoe.js';
import connect4 from './connect4.js';
import rps from './rps.js';
import gomoku from './gomoku.js';
import reversi from './reversi.js';
import dots from './dots.js';

export const ENGINES = { tictactoe, connect4, gomoku, reversi, dots, rps };
export const isGame = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(ENGINES, id);