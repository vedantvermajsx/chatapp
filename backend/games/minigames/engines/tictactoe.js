const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export default {
  id: 'tictactoe',
  label: 'Tic-Tac-Toe',
  icon: '⭕',
  blurb: 'Get three in a row before your opponent does.',
  turnMs: 60 * 1000,

  sanitizeOptions: () => ({}),

  create: (_options, first = 0) => ({ board: Array(9).fill(null), turn: first, moves: 0 }),

  view: (s) => ({ board: s.board, turn: s.turn, moves: s.moves }),

  turnOf: (s) => s.turn,
  pending: (s) => [s.turn],

  move(s, seat, payload) {
    if (s.turn !== seat) return { error: 'not-your-turn' };
    const cell = payload && payload.cell;
    if (!Number.isInteger(cell) || cell < 0 || cell > 8) return { error: 'bad-move' };
    if (s.board[cell] !== null) return { error: 'cell-taken' };

    s.board[cell] = seat;
    s.moves += 1;

    const line = LINES.find((l) => l.every((i) => s.board[i] === seat));
    if (line) return { over: { winner: seat, reason: 'three-in-a-row', line } };
    if (s.moves === 9) return { over: { winner: null, reason: 'draw' } };

    s.turn = 1 - seat;
    return {};
  },
};
