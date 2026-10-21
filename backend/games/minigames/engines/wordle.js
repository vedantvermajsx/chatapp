import { VALID, ANSWERS } from './data/words.js';

const LENS = [4, 5, 6];
const MAX_TRIES = 6;
const SETS = {};
const ANS = {};
for (const L of LENS) {
  SETS[L] = new Set(VALID[L].split(' '));
  ANS[L] = ANSWERS[L].split(' ');
}

// g = right spot, y = wrong spot, b = absent
function score(answer, guess) {
  const r = Array(guess.length).fill('b');
  const left = {};
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) r[i] = 'g';
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (r[i] === 'g') continue;
    if (left[guess[i]] > 0) { r[i] = 'y'; left[guess[i]]--; }
  }
  return r.join('');
}

export default {
  id: 'wordle',
  label: 'Wordle Duel',
  blurb: 'Race your friend to crack the same secret word.',
  turnMs: 3 * 60 * 1000,
  optionDefs: [
    { key: 'solo', label: 'Mode', values: [false, true], labels: ['Duel', 'Play alone'], def: false },
    { key: 'len', label: 'Word length', values: [4, 5, 6], labels: ['4 letters', '5 letters', '6 letters'], def: 5 },
  ],

  sanitizeOptions(raw) {
    const len = Number(raw && raw.len);
    const solo = !!(raw && (raw.solo === true || raw.solo === 'true'));
    return { solo, len: LENS.includes(len) ? len : 5 };
  },

  create(options) {
    const list = ANS[options.len];
    return {
      solo: options.solo,
      len: options.len,
      answer: list[Math.floor(Math.random() * list.length)],
      guesses: [[], []],
      solved: [false, false],
      revealed: false,
      moves: 0,
    };
  },

  view: (s, seat) => ({
    solo: s.solo,
    len: s.len,
    maxTries: MAX_TRIES,
    mine: s.guesses[seat],
    opp: s.guesses[1 - seat].map((g) => g.r),
    oppDone: s.solved[1 - seat] || s.guesses[1 - seat].length >= MAX_TRIES,
    done: s.solved[seat] || s.guesses[seat].length >= MAX_TRIES,
    answer: s.revealed ? s.answer : null,
    status: s.solved[seat] || s.guesses[seat].length >= MAX_TRIES
      ? { text: 'Out of guesses — waiting for opponent…', mine: false }
      : { text: 'Guess the word', mine: true },
  }),

  finish: (s) => { s.revealed = true; },

  turnOf: () => null,
  pending: (s) => (s.solo ? [0] : [0, 1]).filter((i) => !s.solved[i] && s.guesses[i].length < MAX_TRIES),

  move(s, seat, payload) {
    const guess = payload && typeof payload.guess === 'string' ? payload.guess.toLowerCase() : '';
    if (s.guesses[seat].length >= MAX_TRIES || s.solved[seat]) return { error: 'no-guesses-left' };
    if (guess.length !== s.len || !/^[a-z]+$/.test(guess)) return { error: 'bad-move' };
    if (!SETS[s.len].has(guess)) return { error: 'not-a-word' };
    if (s.guesses[seat].some((g) => g.w === guess)) return { error: 'already-guessed' };

    const r = score(s.answer, guess);
    s.guesses[seat].push({ w: guess, r });
    s.moves += 1;

    if (guess === s.answer) {
      s.solved[seat] = true;
      return { over: { winner: seat, reason: 'solved' } };
    }
    if ((s.solo ? [0] : [0, 1]).every((i) => s.guesses[i].length >= MAX_TRIES)) {
      return { over: { winner: null, reason: 'no-solution' } };
    }
    return {};
  },
};
