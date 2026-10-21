import tictactoe from './tictactoe.js';
import connect4 from './connect4.js';
import gomoku from './gomoku.js';
import reversi from './reversi.js';
import dots from './dots.js';
import rps from './rps.js';
import wordle from './wordle.js';
import sizeduel from './sizeduel.js';
import guesscountry from './guesscountry.js';

// Single source of truth: add an engine here and it appears in the picker automatically.
export const ENGINES = { tictactoe, connect4, gomoku, reversi, dots, rps, wordle, sizeduel, guesscountry };
export const isGame = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(ENGINES, id);
export const GAME_LIST = Object.values(ENGINES).map(({ id, label, blurb, pieces, optionDefs }) => ({ id, label, blurb, pieces: pieces || null, optionDefs: optionDefs || null }));
