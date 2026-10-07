const N = 8;
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

const flipsFor = (board, cell, seat) => {
  const row = Math.floor(cell / N);
  const col = cell % N;
  const flips = [];
  for (const [dr, dc] of DIRS) {
    const run = [];
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < N && c >= 0 && c < N && board[r * N + c] === 1 - seat) {
      run.push(r * N + c);
      r += dr;
      c += dc;
    }
    if (run.length && r >= 0 && r < N && c >= 0 && c < N && board[r * N + c] === seat) flips.push(...run);
  }
  return flips;
};

const legalMoves = (board, seat) => {
  const out = [];
  for (let i = 0; i < N * N; i++) if (board[i] === null && flipsFor(board, i, seat).length) out.push(i);
  return out;
};

const count = (board) => [board.filter((x) => x === 0).length, board.filter((x) => x === 1).length];

export default {
  id: 'reversi',
  label: 'Reversi',
  icon: '⚪',
  blurb: 'Flank your opponent’s discs to flip them.',
  turnMs: 60 * 1000,

  sanitizeOptions: () => ({}),

  create(_options, first = 0) {
    const board = Array(N * N).fill(null);
    board[3 * N + 3] = 1;
    board[3 * N + 4] = 0;
    board[4 * N + 3] = 0;
    board[4 * N + 4] = 1;
    return { board, turn: first, moves: 0, last: null, passed: null };
  },

  view: (s) => ({
    board: s.board,
    size: N,
    turn: s.turn,
    moves: s.moves,
    last: s.last,
    passed: s.passed,
    scores: count(s.board),
    legal: legalMoves(s.board, s.turn),
  }),

  turnOf: (s) => s.turn,
  pending: (s) => [s.turn],

  move(s, seat, payload) {
    if (s.turn !== seat) return { error: 'not-your-turn' };
    const cell = payload && payload.cell;
    if (!Number.isInteger(cell) || cell < 0 || cell >= N * N) return { error: 'bad-move' };
    if (s.board[cell] !== null) return { error: 'cell-taken' };
    const flips = flipsFor(s.board, cell, seat);
    if (!flips.length) return { error: 'illegal-move' };

    s.board[cell] = seat;
    flips.forEach((i) => { s.board[i] = seat; });
    s.moves += 1;
    s.last = { cell, flipped: flips };
    s.passed = null;

    const next = 1 - seat;
    if (legalMoves(s.board, next).length) {
      s.turn = next;
    } else if (legalMoves(s.board, seat).length) {
      s.turn = seat;
      s.passed = next;
    } else {
      const [a, b] = count(s.board);
      if (a === b) return { over: { winner: null, reason: 'draw' } };
      return { over: { winner: a > b ? 0 : 1, reason: 'most-discs' } };
    }
    return {};
  },
};
