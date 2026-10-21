import COUNTRIES from './data/countries.js';

const MODES = ['flag', 'capital'];
const ROUND_CHOICES = [10, 25, 50, 100];

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function makeQuestions(n, mode) {
  const pool = shuffle(COUNTRIES.slice());
  return pool.slice(0, n).map((ans) => {
    // distractors from the same region look more plausible
    const near = shuffle(COUNTRIES.filter((c) => c.c !== ans.c && c.r === ans.r));
    const far = shuffle(COUNTRIES.filter((c) => c.c !== ans.c && c.r !== ans.r));
    const opts = shuffle([ans, ...near.concat(far).slice(0, 3)]);
    return {
      code: ans.c,
      prompt: mode === 'capital' ? ans.k : null,
      options: opts.map((o) => ({ n: o.n, c: o.c })),
      correct: opts.findIndex((o) => o.c === ans.c),
    };
  });
}

export default {
  id: 'guesscountry',
  label: 'Guess the Country',
  blurb: 'Name the country from its flag or capital before your friend.',
  turnMs: 30 * 1000,
  optionDefs: [
    { key: 'solo', label: 'Mode', values: [false, true], labels: ['Duel', 'Play alone'], def: false },
    { key: 'mode', label: 'Clue', values: ['flag', 'capital'], labels: ['Flag', 'Capital city'], def: 'flag' },
    { key: 'rounds', label: 'Questions', values: [10, 25, 50, 100], labels: ['10', '25', '50', '100'], def: 10 },
  ],

  sanitizeOptions(raw) {
    const mode = MODES.includes(raw && raw.mode) ? raw.mode : 'flag';
    const rounds = ROUND_CHOICES.includes(Number(raw && raw.rounds)) ? Number(raw.rounds) : 10;
    const solo = !!(raw && (raw.solo === true || raw.solo === 'true'));
    return { solo, mode, rounds };
  },

  create(options) {
    return {
      solo: options.solo,
      mode: options.mode,
      rounds: options.rounds,
      qs: makeQuestions(options.rounds, options.mode),
      round: 0,
      picks: [null, null],
      scores: [0, 0],
      last: null,
      history: [],
      moves: 0,
    };
  },

  view(s, seat) {
    const q = s.qs[s.round];
    return {
      mode: s.mode,
      solo: s.solo,
      rounds: s.rounds,
      round: Math.min(s.round + 1, s.rounds),
      scores: s.scores,
      history: s.history,
      q: q ? { code: s.mode === 'flag' ? q.code : null, prompt: q.prompt, options: q.options } : null,
      mine: s.picks[seat],
      oppLocked: s.picks[1 - seat] !== null,
      last: s.last,
      status: s.picks[seat] !== null
        ? { text: 'Waiting for opponent…', mine: false }
        : { text: s.picks[1 - seat] !== null ? 'Pick — they are ready' : 'Choose the country', mine: true },
    };
  },

  turnOf: () => null,
  pending: (s) => (s.solo ? (s.picks[0] === null ? [0] : []) : [0, 1].filter((i) => s.picks[i] === null)),

  move(s, seat, payload) {
    const pick = payload && payload.pick;
    if (!Number.isInteger(pick) || pick < 0 || pick > 3) return { error: 'bad-move' };
    if (s.picks[seat] !== null) return { error: 'already-locked' };
    s.picks[seat] = pick;
    s.moves += 1;
    if (s.solo ? s.picks[0] === null : s.picks[0] === null || s.picks[1] === null) return {};

    const q = s.qs[s.round];
    const right = s.picks.map((p) => p === q.correct);
    if (s.solo) right[1] = false;
    right.forEach((ok, i) => { if (ok) s.scores[i] += 1; });
    s.last = { round: s.round + 1, correct: q.correct, picks: s.picks.slice(), answer: q.options[q.correct].n, options: q.options };
    s.history.push(right);
    s.picks = [null, null];
    s.round += 1;

    if (s.round >= s.rounds) {
      if (s.solo) return { over: { winner: 0, reason: 'solo-done' } };
      const [a, b] = s.scores;
      return { over: { winner: a === b ? null : a > b ? 0 : 1, reason: a === b ? 'draw' : 'best-score' } };
    }
    return {};
  },
};
