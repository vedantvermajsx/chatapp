const CHOICES = ['rock', 'paper', 'scissors'];
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const MAX_ROUNDS_PLAYED = 30; // safety valve against endless ties

export default {
  id: 'rps',
  label: 'Rock Paper Scissors',
  blurb: 'Lock in your pick and out-guess your friend.',
  turnMs: 30 * 1000,

  sanitizeOptions(raw) {
    const rounds = Number(raw && raw.rounds);
    return { rounds: rounds === 5 ? 5 : 3 };
  },

  create: (options) => ({
    rounds: options.rounds,
    target: Math.ceil(options.rounds / 2),
    scores: [0, 0],
    picks: [null, null],
    round: 1,
    history: [],
    last: null,
    moves: 0,
  }),

  view: (s, seat) => ({
    rounds: s.rounds,
    target: s.target,
    scores: s.scores,
    round: s.round,
    mine: s.picks[seat],
    oppLocked: s.picks[1 - seat] !== null,
    last: s.last,
    history: s.history,
  }),

  turnOf: () => null,
  pending: (s) => [0, 1].filter((i) => s.picks[i] === null),

  move(s, seat, payload) {
    const choice = payload && payload.choice;
    if (!CHOICES.includes(choice)) return { error: 'bad-move' };
    if (s.picks[seat] !== null) return { error: 'already-locked' };

    s.picks[seat] = choice;
    s.moves += 1;
    if (s.picks[0] === null || s.picks[1] === null) return {};

    const [a, b] = s.picks;
    const winner = a === b ? null : BEATS[a] === b ? 0 : 1;
    if (winner !== null) s.scores[winner] += 1;
    s.last = { round: s.round, picks: [a, b], winner };
    s.history.push({ picks: [a, b], winner });
    s.picks = [null, null];
    s.round += 1;

    if (winner !== null && s.scores[winner] >= s.target) {
      return { over: { winner, reason: 'best-of' } };
    }
    if (s.history.length >= MAX_ROUNDS_PLAYED) {
      const w = s.scores[0] === s.scores[1] ? null : s.scores[0] > s.scores[1] ? 0 : 1;
      return { over: { winner: w, reason: w === null ? 'draw' : 'best-of' } };
    }
    return {};
  },
};
