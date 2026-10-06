import tictactoe from './tictactoe.js';
import connect4 from './connect4.js';
import rps from './rps.js';

export const ENGINES = { tictactoe, connect4, rps };
export const isGame = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(ENGINES, id);
