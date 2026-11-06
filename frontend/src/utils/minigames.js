import { Grid3x3, Grid2x2, CircleDot, Circle, Contrast, Scissors } from 'lucide-react';

export const MINIGAMES = {
  tictactoe: { label: 'Tic-Tac-Toe', Icon: Grid3x3 },
  connect4: { label: 'Connect Four', Icon: CircleDot },
  gomoku: { label: 'Gomoku', Icon: Circle },
  reversi: { label: 'Reversi', Icon: Contrast },
  dots: { label: 'Dots and Boxes', Icon: Grid2x2 },
  rps: { label: 'Rock Paper Scissors', Icon: Scissors },
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

export const isMinigameCommand = (text) =>
  Object.prototype.hasOwnProperty.call(MINIGAME_COMMANDS, (text || '').trim().toLowerCase());

export const isMinigame = (id) => Object.prototype.hasOwnProperty.call(MINIGAMES, id);

export const minigameLabel = (game) => (MINIGAMES[game] ? MINIGAMES[game].label : 'Minigames');

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