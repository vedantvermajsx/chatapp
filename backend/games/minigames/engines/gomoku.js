import { runThrough } from './lines.js';
const SIZE = 13;

export default {
  id: 'gomoku',
  label: 'Gomoku',
  icon: '⚫',
  blurb: 'Line up five stones on a 13×13 board.',
  turnMs: 60 * 1000,

  sanitizeOptions: () => ({}),

  create: (_options, first = 0) => ({ board: Array(SIZE * SIZE).fill(null), turn: first, moves: 0, last: null }),

  view: (s) => ({ board: s.board, size: SIZE, turn: s.turn, moves: s.moves, last: s.last }),

  turnOf: (s) => s.turn,
  pending: (s) => [s.turn],

  move(s, seat, payload) {
    if (s.turn !== seat) return { error: 'not-your-turn' };
    const cell = payload && payload.cell;
    if (!Number.isInteger(cell) || cell < 0 || cell >= SIZE * SIZE) return { error: 'bad-move' };
    if (s.board[cell] !== null) return { error: 'cell-taken' };

    s.board[cell] = seat;
    s.moves += 1;
    s.last = cell;

    const row = Math.floor(cell / SIZE);
    const col = cell % SIZE;
    const line = runThrough(s.board, SIZE, SIZE, row, col, seat, 5);
    if (line) return { over: { winner: seat, reason: 'five-in-a-row', line } };
    if (s.moves === SIZE * SIZE) return { over: { winner: null, reason: 'draw' } };

    s.turn = 1 - seat;
    return {};
  },
};
