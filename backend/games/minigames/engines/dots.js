const ROWS = 4;
const COLS = 4;

const hIdx = (r, c) => r * COLS + c;
const vIdx = (r, c) => r * (COLS + 1) + c;

export default {
  id: 'dots',
  label: 'Dots and Boxes',
  icon: '🔲',
  blurb: 'Draw lines and claim the most boxes.',
  turnMs: 60 * 1000,

  sanitizeOptions: () => ({}),

  create: (_options, first = 0) => ({
    h: Array((ROWS + 1) * COLS).fill(null),
    v: Array(ROWS * (COLS + 1)).fill(null),
    boxes: Array(ROWS * COLS).fill(null),
    scores: [0, 0],
    turn: first,
    moves: 0,
    last: null,
  }),

  view: (s) => ({
    rows: ROWS,
    cols: COLS,
    h: s.h,
    v: s.v,
    boxes: s.boxes,
    scores: s.scores,
    turn: s.turn,
    moves: s.moves,
    last: s.last,
  }),

  turnOf: (s) => s.turn,
  pending: (s) => [s.turn],

  move(s, seat, payload) {
    if (s.turn !== seat) return { error: 'not-your-turn' };
    const { t, r, c } = payload || {};
    if ((t !== 'h' && t !== 'v') || !Number.isInteger(r) || !Number.isInteger(c)) return { error: 'bad-move' };

    let touching; // boxes that share the new edge
    if (t === 'h') {
      if (r < 0 || r > ROWS || c < 0 || c >= COLS) return { error: 'bad-move' };
      if (s.h[hIdx(r, c)] !== null) return { error: 'edge-taken' };
      s.h[hIdx(r, c)] = seat;
      touching = [[r - 1, c], [r, c]];
    } else {
      if (r < 0 || r >= ROWS || c < 0 || c > COLS) return { error: 'bad-move' };
      if (s.v[vIdx(r, c)] !== null) return { error: 'edge-taken' };
      s.v[vIdx(r, c)] = seat;
      touching = [[r, c - 1], [r, c]];
    }
    s.moves += 1;
    s.last = { t, r, c };

    let claimed = 0;
    for (const [br, bc] of touching) {
      if (br < 0 || br >= ROWS || bc < 0 || bc >= COLS) continue;
      if (s.boxes[br * COLS + bc] !== null) continue;
      const done =
        s.h[hIdx(br, bc)] !== null && s.h[hIdx(br + 1, bc)] !== null &&
        s.v[vIdx(br, bc)] !== null && s.v[vIdx(br, bc + 1)] !== null;
      if (done) {
        s.boxes[br * COLS + bc] = seat;
        s.scores[seat] += 1;
        claimed += 1;
      }
    }

    if (s.scores[0] + s.scores[1] === ROWS * COLS) {
      if (s.scores[0] === s.scores[1]) return { over: { winner: null, reason: 'draw' } };
      return { over: { winner: s.scores[0] > s.scores[1] ? 0 : 1, reason: 'most-boxes' } };
    }
    if (claimed === 0) s.turn = 1 - seat;
    return {};
  },
};
