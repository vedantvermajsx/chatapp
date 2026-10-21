import COUNTRIES from './data/countries.js';

const METRICS = { area: 'a', population: 'p' };
const ROUND_CHOICES = [10, 25, 50, 100];

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function makePairs(n, key) {
  const pairs = [];
  const used = new Set();
  let guard = 0;
  while (pairs.length < n && guard++ < 500) {
    const [x, y] = shuffle(COUNTRIES.slice()).slice(0, 2);
    const hi = Math.max(x[key], y[key]);
    const lo = Math.min(x[key], y[key]);
    const id = [x.c, y.c].sort().join('');
    if (used.has(id) || lo === 0 || hi / lo < 1.15) continue; // skip near-ties
    used.add(id);
    pairs.push([x, y]);
  }
  return pairs;
}

export default {
  id: 'sizeduel',
  label: 'Size Duel',
  blurb: 'Which country is bigger? Faster brain wins.',
  turnMs: 30 * 1000,
  optionDefs: [
    { key: 'solo', label: 'Mode', values: [false, true], labels: ['Duel', 'Play alone'], def: false },
    { key: 'metric', label: 'Compare by', values: ['area', 'population'], labels: ['Land area', 'Population'], def: 'area' },
    { key: 'rounds', label: 'Questions', values: [10, 25, 50, 100], labels: ['10', '25', '50', '100'], def: 10 },
  ],

  sanitizeOptions(raw) {
    const metric = raw && raw.metric === 'population' ? 'population' : 'area';
    const rounds = ROUND_CHOICES.includes(Number(raw && raw.rounds)) ? Number(raw.rounds) : 10;
    const solo = !!(raw && (raw.solo === true || raw.solo === 'true'));
    return { solo, metric, rounds };
  },

  create(options) {
    const key = METRICS[options.metric];
    return {
      solo: options.solo,
      metric: options.metric,
      key,
      rounds: options.rounds,
      pairs: makePairs(options.rounds, key),
      round: 0,
      picks: [null, null],
      scores: [0, 0],
      last: null,
      history: [],
      moves: 0,
    };
  },

  view(s, seat) {
    const cur = s.pairs[s.round];
    const idle = !cur;
    return {
      metric: s.metric,
      solo: s.solo,
      rounds: s.rounds,
      round: Math.min(s.round + 1, s.rounds),
      scores: s.scores,
      history: s.history,
      pair: idle ? null : cur.map((c) => ({ n: c.n, c: c.c })),
      mine: s.picks[seat],
      oppLocked: s.picks[1 - seat] !== null,
      last: s.last,
      status: s.picks[seat] !== null
        ? { text: 'Waiting for opponent…', mine: false }
        : { text: s.picks[1 - seat] !== null ? 'Pick — they are ready' : 'Which is bigger?', mine: true },
    };
  },

  turnOf: () => null,
  pending: (s) => (s.solo ? (s.picks[0] === null ? [0] : []) : [0, 1].filter((i) => s.picks[i] === null)),

  move(s, seat, payload) {
    const pick = payload && payload.pick;
    if (pick !== 0 && pick !== 1) return { error: 'bad-move' };
    if (s.picks[seat] !== null) return { error: 'already-locked' };
    s.picks[seat] = pick;
    s.moves += 1;
    if (s.solo ? s.picks[0] === null : s.picks[0] === null || s.picks[1] === null) return {};

    const pair = s.pairs[s.round];
    const bigger = pair[0][s.key] > pair[1][s.key] ? 0 : 1;
    const right = s.picks.map((p) => p === bigger);
    if (s.solo) right[1] = false;
    right.forEach((ok, i) => { if (ok) s.scores[i] += 1; });
    s.last = {
      round: s.round + 1,
      bigger,
      picks: s.picks.slice(),
      values: pair.map((c) => c[s.key]),
      names: pair.map((c) => c.n),
    };
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
