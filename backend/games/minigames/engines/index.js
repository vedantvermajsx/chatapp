import tictactoe from './tictactoe.js';
import connect4 from './connect4.js';
import gomoku from './gomoku.js';
import reversi from './reversi.js';
import dots from './dots.js';
import rps from './rps.js';

// Single source of truth: add an engine here and it appears in the picker automatically.
export const ENGINES = { tictactoe, connect4, gomoku, reversi, dots, rps };
export const isGame = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(ENGINES, id);
export const GAME_LIST = Object.values(ENGINES).map(({ id, label, blurb, pieces }) => ({ id, label, blurb, pieces: pieces || null }));
