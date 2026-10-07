export const MINIGAMES = {
  tictactoe: { label: 'Tic-Tac-Toe' },
  connect4: { label: 'Connect Four' },
  gomoku: { label: 'Gomoku' },
  reversi: { label: 'Reversi' },
  dots: { label: 'Dots and Boxes' },
  rps: { label: 'Rock Paper Scissors' },
};

// Chat slash commands. `null` opens the game picker.
export const MINIGAME_COMMANDS = {
  '/games': null,
  '/start-tictactoe': 'tictactoe',
  '/start-connect4': 'connect4',
  '/start-gomoku': 'gomoku',
  '/start-reversi': 'reversi',
  '/start-dots': 'dots',
  '/start-rps': 'rps',
};

export const isMinigame = (id) => Object.prototype.hasOwnProperty.call(MINIGAMES, id);

export const inviteText = (game, code) => `Join the ${MINIGAMES[game].label} game with code: ${code}`;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const INVITE_RE = new RegExp(
  `^Join the (${Object.values(MINIGAMES).map((g) => escapeRe(g.label)).join('|')}) game with code: (\\d{4})$`
);

// -> { game, code } | null
export const parseInvite = (text) => {
  const m = typeof text === 'string' ? text.match(INVITE_RE) : null;
  if (!m) return null;
  const game = Object.keys(MINIGAMES).find((k) => MINIGAMES[k].label === m[1]);
  return game ? { game, code: m[2] } : null;
};