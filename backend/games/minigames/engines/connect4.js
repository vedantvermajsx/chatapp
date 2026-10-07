const COLS = 7;
const ROWS = 6;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

const winningRun = (board, row, col, seat) => {
  for (const [dr, dc] of DIRS) {
    const cells = [[row, col]];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === seat) {
        cells.push([r, c]);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (cells.length >= 4) return cells.map(([r, c]) => r * COLS + c);
  }
  return null;
};

export default {
  id: 'connect4',
  label: 'Connect Four',
  icon: '🔴',
  blurb: 'Drop discs and line up four in any direction.',
  turnMs: 60 * 1000,

  sanitizeOptions: () => ({}),

  create: (_options, first = 0) => ({
    board: Array(COLS * ROWS).fill(null),
    turn: first,
    moves: 0,
    last: null,
  }),

  view: (s) => ({ board: s.board, turn: s.turn, moves: s.moves, last: s.last }),

  turnOf: (s) => s.turn,
  pending: (s) => [s.turn],

  move(s, seat, payload) {
    if (s.turn !== seat) return { error: 'not-your-turn' };
    const col = payload && payload.col;
    if (!Number.isInteger(col) || col < 0 || col >= COLS) return { error: 'bad-move' };

    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (s.board[r * COLS + col] === null) { row = r; break; }
    }
    if (row < 0) return { error: 'column-full' };

    s.board[row * COLS + col] = seat;
    s.moves += 1;
    s.last = { row, col };

    const line = winningRun(s.board, row, col, seat);
    if (line) return { over: { winner: seat, reason: 'four-in-a-row', line } };
    if (s.moves === COLS * ROWS) return { over: { winner: null, reason: 'draw' } };

    s.turn = 1 - seat;
    return {};
  },
};
