import { Chess } from '/games/chess/vendor/chess.js';

const socket = io('/chess', { query: { game: 'chess' } });
const chess = new Chess();
let pendingMove = false;

const EMBEDDED = document.documentElement.classList.contains('embed');
const loaderStart = Date.now();
let loaderHidden = false;

function setLoaderText(text) {
  const el = document.getElementById('loaderText');
  if (el) el.textContent = text;
}

function hideLoader() {
  if (loaderHidden) return;
  loaderHidden = true;
  const el = document.getElementById('loader');
  if (!el) return;
  const wait = Math.max(0, 500 - (Date.now() - loaderStart));
  setTimeout(() => {
    el.classList.add('done');
    setTimeout(() => el.remove(), 400);
  }, wait);
}

socket.on('connect', hideLoader);
socket.on('connect_error', () => setLoaderText("Can't reach the server — retrying…"));
setTimeout(() => { if (!loaderHidden) setLoaderText('Still connecting…'); }, 5000);

function notifyParent(event, data) {
  if (window.parent === window) return;
  window.parent.postMessage({ type: 'chess-embed:' + event, ...data }, '*');
}

if (EMBEDDED && window.parent !== window) {
  const postHeight = () => {
    const height = Math.ceil(document.body.getBoundingClientRect().height);
    window.parent.postMessage({ type: 'chess-embed:height', height }, '*');
  };
  new ResizeObserver(postHeight).observe(document.body);
  window.addEventListener('load', postHeight);
}

const FILES = ['a','b','c','d','e','f','g','h'];

const BASE = '<path d="M25 87 H75 V81 Q75 76 70 76 H30 Q25 76 25 81 Z"/>';
const PIECE_PATHS = {
  p: BASE +
    '<path d="M40 46 Q42 64 33 76 H67 Q58 64 60 46 Z"/><rect x="35" y="41" width="30" height="6" rx="3"/><circle cx="50" cy="29" r="11"/>' +
    '<path class="d" d="M45 24 Q47 21 51 21"/>',
  r: BASE +
    '<path d="M39 46 H61 L65 76 H35 Z"/><path d="M35 34 H65 L62 46 H38 Z"/>' +
    '<path d="M31 20 H40 V26 H46 V20 H54 V26 H60 V20 H69 V34 H31 Z"/>' +
    '<path class="d" d="M42 50 L40 70 M36 37 H64"/>',
  b: BASE +
    '<path d="M41 55 Q43 66 33 76 H67 Q57 66 59 55 Z"/><rect x="35" y="50" width="30" height="6" rx="3"/>' +
    '<path d="M50 20 C62 28 66 38 61 46 Q60 50 60 50 H40 Q40 50 39 46 C34 38 38 28 50 20 Z"/><circle cx="50" cy="15" r="5"/>' +
    '<path class="d" d="M50 27 L57 37 M45 26 Q42 32 43 38"/>',
  n: BASE +
    '<path d="M31 76 C30 62 36 52 45 45 C39 46 33 49 28 54 L27 46 C29 38 38 29 43 25 L42 15 L49 21 C52 19 55 17 58 17 L59 24 C69 29 73 41 71 56 C70 64 71 70 73 76 Z"/>' +
    '<circle cx="53" cy="32" r="2.6" fill="EYE" stroke="none"/><circle cx="36" cy="46" r="1.6" fill="EYE" stroke="none"/>' +
    '<path class="d" d="M59 27 C64 36 64 48 60 58"/>',
  q: BASE +
    '<path d="M36 66 H64 L67 76 H33 Z"/>' +
    '<path d="M30 37 L37 62 H63 L70 37 L60 50 L58 32 L50 48 L42 32 L40 50 Z"/>' +
    '<circle cx="30" cy="33" r="4"/><circle cx="42" cy="27" r="4"/><circle cx="50" cy="22" r="4.5"/><circle cx="58" cy="27" r="4"/><circle cx="70" cy="33" r="4"/>' +
    '<path class="d" d="M38 56 H62"/>',
  k: BASE +
    '<path d="M38 50 C41 58 41 64 33 76 H67 C59 64 59 58 62 50 Z"/>' +
    '<rect x="31" y="61" width="38" height="8" rx="4"/>' +
    '<path d="M33 46 C29 35 37 27 50 27 C63 27 71 35 67 46 Z"/>' +
    '<rect x="32" y="44" width="36" height="7" rx="3.5"/>' +
    '<path d="M47.5 6 H52.5 V11.5 H58 V16.5 H52.5 V27 H47.5 V16.5 H42 V11.5 H47.5 Z"/>' +
    '<circle cx="41" cy="47.5" r="1.7" fill="EYE" stroke="none"/><circle cx="50" cy="47.5" r="1.7" fill="EYE" stroke="none"/><circle cx="59" cy="47.5" r="1.7" fill="EYE" stroke="none"/>' +
    '<path class="d" d="M41 43 C40 35 44 31 50 30 C56 31 60 35 59 43 M50 30 V43 M37 65 H63"/>',
};

function pieceSVG(type, color) {
  const w = color === 'w';
  const fill = w ? '#fff8ec' : '#3b3b45';
  const stroke = w ? '#3a2e28' : '#0d0d10';
  const eye = w ? '#3a2e28' : '#fff8ec';
  const det = w ? 'rgba(58,46,40,.45)' : 'rgba(255,255,255,.3)';
  const body = PIECE_PATHS[type].replace(/EYE/g, eye);
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">` +
    `<style>.d{fill:none;stroke:${det};stroke-width:2;stroke-linecap:round}</style>` +
    `<g fill="${fill}" stroke="${stroke}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
}

let myColor = null;
let myToken = null;
let gameId = null;
let orientation = 'w';
let pieceMap = {};
let squareEls = {};
let selectedSquare = null;
let legalTargets = [];
let gameOver = false;
let pendingPromotion = null;
let dragCtx = null;
let reconnectInterval = null;
let oppReconnectInterval = null;

const memorySessions = {};
function saveSession(id, token, color, name) {
  const value = { token, color, name, ts: Date.now() };
  memorySessions[id] = value;
  try { localStorage.setItem('chess_' + id, JSON.stringify(value)); } catch (e) {}
}
function loadSession(id) {
  try {
    const stored = JSON.parse(localStorage.getItem('chess_' + id) || 'null');
    if (stored) return stored;
  } catch (e) {}
  return memorySessions[id] || null;
}
function clearSession(id) {
  delete memorySessions[id];
  try { localStorage.removeItem('chess_' + id); } catch (e) {}
}

let busyButtons = [];
let busyTimer = null;
function setBusy(btn, label) {
  clearBusy();
  btn.dataset.label = btn.textContent;
  btn.textContent = label;
  btn.classList.add('is-busy');
  busyButtons = [btn];
  busyTimer = setTimeout(clearBusy, 8000);
}
function clearBusy() {
  clearTimeout(busyTimer);
  busyButtons.forEach((btn) => {
    btn.classList.remove('is-busy');
    if (btn.dataset.label) btn.textContent = btn.dataset.label;
  });
  busyButtons = [];
}

function copyText(text) {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(fallback);
  } else {
    fallback();
  }
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

let selectedTime = 5;
document.getElementById('timeOptions').addEventListener('click', (e) => {
  const btn = e.target.closest('.time-btn');
  if (!btn) return;
  document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedTime = Number(btn.dataset.time);
});

// Start options, passed by the frontend in the iframe URL:
//   ?name=Alice            prefill player name
//   &time=5|10             time control (minutes)
//   &undo=1                allow undo
//   &action=create         create a game as soon as the socket connects
//   &join=1234             join game 1234 as soon as the socket connects
const urlParams = new URLSearchParams(location.search);
const nameParam = urlParams.get('name');
if (nameParam) document.getElementById('nameInput').value = nameParam.slice(0, 20);

const timeParam = Number(urlParams.get('time'));
if (timeParam === 5 || timeParam === 10) {
  selectedTime = timeParam;
  document.querySelectorAll('.time-btn').forEach((b) =>
    b.classList.toggle('selected', Number(b.dataset.time) === timeParam));
}
if (urlParams.get('undo') === '1') document.getElementById('allowUndo').checked = true;

let autoStarted = false;
function autoStart() {
  if (autoStarted) return;
  autoStarted = true;
  const joinCode = (urlParams.get('join') || '').trim();
  if (/^\d{4}$/.test(joinCode)) {
    const saved = loadSession(joinCode);
    socket.emit('joinGame', { id: joinCode, name: getName(), token: saved ? saved.token : null });
  } else if (urlParams.get('action') === 'create') {
    socket.emit('createGame', {
      timeControl: selectedTime,
      name: getName(),
      allowUndo: document.getElementById('allowUndo').checked,
    });
  }
}
if (socket.connected) autoStart();
else socket.once('connect', autoStart);

function getName() {
  const v = document.getElementById('nameInput').value.trim();
  return v || 'Player';
}

document.getElementById('createBtn').addEventListener('click', (e) => {
  setBusy(e.currentTarget, 'Creating…');
  socket.emit('createGame', { timeControl: selectedTime, name: getName(), allowUndo: document.getElementById('allowUndo').checked });
});

document.getElementById('joinBtn').addEventListener('click', (e) => {
  const code = document.getElementById('joinCodeInput').value.trim();
  document.getElementById('joinError').textContent = '';
  if (!/^\d{4}$/.test(code)) {
    document.getElementById('joinError').textContent = 'Enter a valid 4-digit code.';
    return;
  }
  const saved = loadSession(code);
  setBusy(e.currentTarget, 'Joining…');
  socket.emit('joinGame', { id: code, name: getName(), token: saved ? saved.token : null });
});

document.getElementById('cancelWaitBtn').addEventListener('click', () => {
  socket.emit('leaveGame');
  location.reload();
});

document.getElementById('copyCodeBtn').addEventListener('click', () => {
  copyText(gameId || '');
  const btn = document.getElementById('copyCodeBtn');
  const orig = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => (btn.textContent = orig), 1200);
});

document.getElementById('resignBtn').addEventListener('click', () => {
  if (gameOver) return;
  document.getElementById('resignModal').classList.remove('hidden');
});
document.getElementById('resignNoBtn').addEventListener('click', () => {
  document.getElementById('resignModal').classList.add('hidden');
});
document.getElementById('resignYesBtn').addEventListener('click', () => {
  document.getElementById('resignModal').classList.add('hidden');
  if (!gameOver) socket.emit('resign');
});

document.getElementById('newGameBtn').addEventListener('click', () => {
  if (gameId) clearSession(gameId);
  location.reload();
});

document.getElementById('rejoinBtn').addEventListener('click', () => {
  if (!gameId) return;
  socket.emit('joinGame', { id: gameId, name: getName(), token: myToken });
});

socket.on('gameCreated', ({ id, color, token }) => {
  clearBusy();
  gameId = id;
  myColor = color;
  myToken = token;
  saveSession(id, token, color, getName());
  document.getElementById('codeDisplay').textContent = id;
  showScreen('screen-waiting');
  notifyParent('created', { id });
});

socket.on('joinError', (msg) => {
  clearBusy();
  document.getElementById('joinError').textContent = msg;
  flashStatus(msg);
  notifyParent('error', { message: msg });
});

socket.on('yourToken', ({ token, color }) => {
  myToken = token;
  myColor = color;
  if (gameId) saveSession(gameId, token, color, getName());
});

socket.on('gameStart', ({ id, names, timeControl, state }) => {
  clearBusy();
  gameId = id;
  if (!myColor) myColor = 'b';
  orientation = myColor;
  document.getElementById('activeCodeTag').textContent = id;
  document.getElementById('topName').textContent = myColor === 'w' ? names.b : names.w;
  document.getElementById('bottomName').textContent = myColor === 'w' ? names.w : names.b;
  setUndoVisible(state);
  buildBoard();
  renderFromState(state);
  updateClocksDisplay({ w: timeControl, b: timeControl });
  document.getElementById('statusText').textContent =
    myColor === 'w' ? "White to move — it's your turn" : 'White to move';
  showScreen('screen-game');
  notifyParent('started', { id, color: myColor });
});

socket.on('resynced', ({ id, color, names, timeControl, state }) => {
  clearBusy();
  gameId = id;
  myColor = color;
  orientation = color;
  hideReconnectModal();
  document.getElementById('activeCodeTag').textContent = id;
  document.getElementById('topName').textContent = myColor === 'w' ? names.b : names.w;
  document.getElementById('bottomName').textContent = myColor === 'w' ? names.w : names.b;
  gameOver = !!state.over;
  setUndoVisible(state);
  buildBoard();
  pieceMap = {};
  document.getElementById('board').querySelectorAll('.piece').forEach(p => p.remove());
  renderFromState(state);
  updateClocksDisplay(state.clocks);
  updateStatusText(state);
  showScreen('screen-game');
  if (state.over) showGameOver(state.over);
});

socket.on('moveMade', ({ from, to, promotion, state }) => {
  pendingMove = false;
  renderFromState(state, { from, to, promotion });
  clearSelection();
  updateStatusText(state);
});

function setUndoVisible(state) {
  document.getElementById('backBtn').hidden = !state.allowUndo;
}
function planUndo() {
  const plies = chess.turn() === myColor ? 2 : 1;
  const history = chess.history();
  if (history.length < plies) return null;
  const probe = new Chess();
  history.slice(0, history.length - plies).forEach((san) => probe.move(san));
  const last = probe.history({ verbose: true }).pop();
  return {
    plies,
    fen: probe.fen(),
    check: probe.inCheck(),
    lastMove: last ? { from: last.from, to: last.to } : null,
  };
}

document.getElementById('backBtn').addEventListener('click', () => {
  if (gameOver) return;
  const plan = planUndo();
  if (!plan) return flashStatus('Nothing to undo.');
  socket.emit('undoMove', plan);
});
socket.on('moveUndone', ({ plies, state }) => {
  clearSelection();
  if (chess.fen() !== state.fen) {
    try { for (let i = 0; i < plies; i++) chess.undo(); } catch (e) {}
    if (chess.fen() !== state.fen) chess.load(state.fen);
  }
  pieceMap = {};
  document.getElementById('board').querySelectorAll('.piece').forEach(p => p.remove());
  renderFromState(state);
  updateStatusText(state);
});
socket.on('undoDenied', (msg) => flashStatus(msg));

socket.on('illegalMove', () => {
  if (pendingMove) {
    chess.undo();
    pendingMove = false;
  }
  clearSelection();
  applyDiff(boardMatrixToMap(chess.board()));
  flashStatus('Illegal move');
});

socket.on('createError', (msg) => {
  clearBusy();
  document.getElementById('joinError').textContent = msg;
});

socket.on('clockUpdate', (clocks) => {
  updateClocksDisplay(clocks);
});

socket.on('gameOver', (result) => {
  gameOver = true;
  clearSelection();
  hideReconnectModal();
  hideOpponentBanner();
  document.getElementById('resignModal').classList.add('hidden');
  if (gameId) clearSession(gameId);
  showGameOver(result);
  notifyParent('over', { id: gameId, result });
});

socket.on('disconnect', () => {
  if (gameId && !gameOver && document.getElementById('screen-game').classList.contains('active')) {
    showReconnectModal();
  }
});

socket.on('opponentDisconnected', ({ graceSeconds }) => {
  showOpponentBanner(graceSeconds || 60);
});

socket.on('opponentReconnected', () => {
  hideOpponentBanner();
  flashStatus('Opponent reconnected');
});

function showReconnectModal() {
  const modal = document.getElementById('reconnectModal');
  document.getElementById('reconnectCode').textContent = gameId || '----';
  modal.classList.remove('hidden');
  let remaining = 60;
  document.getElementById('reconnectCountdown').textContent = remaining;
  clearInterval(reconnectInterval);
  reconnectInterval = setInterval(() => {
    remaining -= 1;
    document.getElementById('reconnectCountdown').textContent = Math.max(0, remaining);
    if (remaining <= 0) clearInterval(reconnectInterval);
  }, 1000);
}
function hideReconnectModal() {
  document.getElementById('reconnectModal').classList.add('hidden');
  clearInterval(reconnectInterval);
}
function showOpponentBanner(seconds) {
  const banner = document.getElementById('waitingReconnectBanner');
  banner.classList.remove('hidden');
  let remaining = seconds;
  document.getElementById('oppReconnectCountdown').textContent = remaining;
  clearInterval(oppReconnectInterval);
  oppReconnectInterval = setInterval(() => {
    remaining -= 1;
    document.getElementById('oppReconnectCountdown').textContent = Math.max(0, remaining);
    if (remaining <= 0) clearInterval(oppReconnectInterval);
  }, 1000);
}
function hideOpponentBanner() {
  document.getElementById('waitingReconnectBanner').classList.add('hidden');
  clearInterval(oppReconnectInterval);
}

function buildBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  squareEls = {};
  pieceMap = {};

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const { file, rank } = colRowToFileRank(col, row, orientation);
      const square = FILES[file] + (rank + 1);
      const sqEl = document.createElement('div');
      const isLight = (file + rank) % 2 !== 0;
      sqEl.className = 'square ' + (isLight ? 'light' : 'dark');
      sqEl.dataset.square = square;
      sqEl.style.gridColumnStart = col + 1;
      sqEl.style.gridRowStart = row + 1;

      if (col === 0) {
        const r = document.createElement('span');
        r.className = 'coord rank';
        r.textContent = rank + 1;
        sqEl.appendChild(r);
      }
      if (row === 7) {
        const f = document.createElement('span');
        f.className = 'coord file';
        f.textContent = FILES[file];
        sqEl.appendChild(f);
      }
      sqEl.addEventListener('click', () => onSquareClick(square));
      board.appendChild(sqEl);
      squareEls[square] = sqEl;
    }
  }
}

function colRowToFileRank(col, row, orient) {
  if (orient === 'w') return { file: col, rank: 7 - row };
  return { file: 7 - col, rank: row };
}

function squareToPercentPos(square, orient) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  let col, row;
  if (orient === 'w') { col = file; row = 7 - rank; }
  else { col = 7 - file; row = rank; }
  return { left: col * 12.5, top: row * 12.5 };
}

function boardMatrixToMap(board) {
  const map = {};
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell) map[cell.square] = { type: cell.type, color: cell.color };
    }
  }
  return map;
}

function syncEngine(state, mv) {
  if (chess.fen() === state.fen) return;
  if (mv) {
    try { chess.move({ from: mv.from, to: mv.to, promotion: mv.promotion || 'q' }); } catch (e) {}
  }
  if (chess.fen() !== state.fen) chess.load(state.fen);
}

function renderFromState(state, mv) {
  syncEngine(state, mv);
  applyDiff(boardMatrixToMap(chess.board()));
  highlightLastMoveAndCheck(state);
}

function applyDiff(newMap) {
  const vacated = [];
  const occupied = [];
  const allSquares = new Set([...Object.keys(pieceMap), ...Object.keys(newMap)]);

  allSquares.forEach((square) => {
    const oldEl = pieceMap[square];
    const oldPiece = oldEl ? { type: oldEl.dataset.type, color: oldEl.dataset.color } : null;
    const newPiece = newMap[square] || null;
    const same = oldPiece && newPiece && oldPiece.type === newPiece.type && oldPiece.color === newPiece.color;
    if (same) return;
    if (oldPiece) vacated.push({ square, type: oldPiece.type, color: oldPiece.color, el: oldEl });
    if (newPiece) occupied.push({ square, type: newPiece.type, color: newPiece.color });
  });

  const usedVacated = new Set();
  const matches = [];

  occupied.forEach((occ, oi) => {
    if (occ._matched) return;
    const vi = vacated.findIndex((v, idx) => !usedVacated.has(idx) && v.type === occ.type && v.color === occ.color);
    if (vi !== -1) { usedVacated.add(vi); matches.push({ vi, oi }); occ._matched = true; }
  });
  occupied.forEach((occ, oi) => {
    if (occ._matched) return;
    const vi = vacated.findIndex((v, idx) => !usedVacated.has(idx) && v.color === occ.color);
    if (vi !== -1) { usedVacated.add(vi); matches.push({ vi, oi }); occ._matched = true; }
  });

  const board = document.getElementById('board');

  const nextPieceMap = { ...pieceMap };
  vacated.forEach(v => delete nextPieceMap[v.square]);
  occupied.forEach(o => delete nextPieceMap[o.square]);

  matches.forEach(({ vi, oi }) => {
    const v = vacated[vi];
    const occ = occupied[oi];
    const el = v.el;
    if (v.type !== occ.type) {
      el.innerHTML = pieceSVG(occ.type, occ.color);
      el.dataset.type = occ.type;
    }
    const pos = squareToPercentPos(occ.square, orientation);
    el.style.left = pos.left + '%';
    el.style.top = pos.top + '%';
    nextPieceMap[occ.square] = el;
  });

  vacated.forEach((v, idx) => {
    if (usedVacated.has(idx)) return;
    v.el.classList.add('removing');
    setTimeout(() => v.el.remove(), 160);
  });

  occupied.forEach((occ) => {
    if (occ._matched) return;
    const el = document.createElement('div');
    el.className = 'piece';
    el.dataset.type = occ.type;
    el.dataset.color = occ.color;
    el.innerHTML = pieceSVG(occ.type, occ.color);
    const pos = squareToPercentPos(occ.square, orientation);
    el.style.left = pos.left + '%';
    el.style.top = pos.top + '%';
    attachDrag(el, occ.square);
    board.appendChild(el);
    nextPieceMap[occ.square] = el;
  });

  pieceMap = nextPieceMap;
}

function highlightLastMoveAndCheck(state) {
  Object.values(squareEls).forEach(el => el.classList.remove('last-move', 'check'));
  if (state.lastMove) {
    const { from, to } = state.lastMove;
    if (squareEls[from]) squareEls[from].classList.add('last-move');
    if (squareEls[to]) squareEls[to].classList.add('last-move');
  }
  if (state.check) {
    const kingSquare = Object.keys(pieceMap).find(sq => {
      const el = pieceMap[sq];
      return el.dataset.type === 'k' && el.dataset.color === state.turn;
    });
    if (kingSquare && squareEls[kingSquare]) squareEls[kingSquare].classList.add('check');
  }
}

function clearSelection() {
  if (selectedSquare && squareEls[selectedSquare]) squareEls[selectedSquare].classList.remove('selected');
  document.querySelectorAll('.move-dot').forEach(d => d.remove());
  selectedSquare = null;
  legalTargets = [];
}

function onSquareClick(square) {
  if (gameOver || pendingPromotion) return;
  const piece = pieceMap[square];

  if (selectedSquare) {
    if (square === selectedSquare) { clearSelection(); return; }
    const target = legalTargets.find(m => m.to === square);
    if (target) { attemptMove(selectedSquare, square); return; }
    if (piece && piece.dataset.color === myColor) { selectSquare(square); return; }
    clearSelection();
    return;
  }
  if (piece && piece.dataset.color === myColor) selectSquare(square);
}

function selectSquare(square) {
  clearSelection();
  selectedSquare = square;
  squareEls[square].classList.add('selected');
  legalTargets = chess.moves({ square, verbose: true }).map((m) => ({ to: m.to, flags: m.flags, promotion: m.promotion }));
  legalTargets.forEach(m => {
    const dot = document.createElement('div');
    dot.className = 'move-dot' + (pieceMap[m.to] || m.flags.includes('e') ? ' capture' : '');
    squareEls[m.to].appendChild(dot);
  });
}

function detectOver() {
  if (chess.isCheckmate()) return { reason: 'checkmate' };
  if (chess.isStalemate()) return { reason: 'stalemate' };
  if (chess.isInsufficientMaterial()) return { reason: 'insufficient material' };
  if (chess.isThreefoldRepetition()) return { reason: 'threefold repetition' };
  if (chess.isDraw()) return { reason: 'draw' };
  return null;
}

function sendMove(from, to, promotion) {
  let move = null;
  try { move = chess.move({ from, to, promotion: promotion || 'q' }); } catch (e) {}
  if (!move) {
    clearSelection();
    flashStatus('Illegal move');
    return;
  }
  pendingMove = true;
  socket.emit('makeMove', {
    from: move.from,
    to: move.to,
    san: move.san,
    promotion: move.promotion || null,
    captured: move.captured || null,
    fen: chess.fen(),
    check: chess.inCheck(),
    over: detectOver(),
  });
}

function attemptMove(from, to) {
  const piece = pieceMap[from];
  const isPromotion = piece && piece.dataset.type === 'p' && (to.endsWith('8') || to.endsWith('1'));
  if (isPromotion) {
    pendingPromotion = { from, to };
    showPromotionModal(myColor);
  } else {
    sendMove(from, to);
  }
}

function showPromotionModal(color) {
  const modal = document.getElementById('promoModal');
  const choices = document.getElementById('promoChoices');
  choices.innerHTML = '';
  ['q', 'r', 'b', 'n'].forEach(type => {
    const btn = document.createElement('button');
    btn.innerHTML = pieceSVG(type, color);
    btn.addEventListener('click', () => {
      const { from, to } = pendingPromotion;
      sendMove(from, to, type);
      pendingPromotion = null;
      modal.classList.add('hidden');
    });
    choices.appendChild(btn);
  });
  modal.classList.remove('hidden');
}

function attachDrag(el, initialSquare) {
  el.addEventListener('pointerdown', (e) => {
    if (gameOver || pendingPromotion) return;
    const square = findSquareForEl(el);
    if (!square) return;
    if (el.dataset.color !== myColor) {
      // Enemy piece: it isn't draggable, but a click on it is a capture attempt.
      // Pieces are siblings of square divs (not children), so this click would
      // otherwise never reach the square's own click handler.
      onSquareClick(square);
      return;
    }
    e.preventDefault();
    if (selectedSquare !== square) selectSquare(square);
    const boardEl = document.getElementById('board');
    const rect = boardEl.getBoundingClientRect();
    dragCtx = { el, rect, square };
    el.classList.add('dragging');
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragCtx || dragCtx.el !== el) return;
    const { rect } = dragCtx;
    let x = ((e.clientX - rect.left) / rect.width) * 100 - 6.25;
    let y = ((e.clientY - rect.top) / rect.height) * 100 - 6.25;
    x = Math.max(-6.25, Math.min(93.75, x));
    y = Math.max(-6.25, Math.min(93.75, y));
    el.style.left = x + '%';
    el.style.top = y + '%';
  });

  el.addEventListener('pointerup', (e) => {
    if (!dragCtx || dragCtx.el !== el) return;
    const { rect, square } = dragCtx;
    el.classList.remove('dragging');
    dragCtx = null;
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    let col = Math.floor(relX * 8), row = Math.floor(relY * 8);
    col = Math.max(0, Math.min(7, col));
    row = Math.max(0, Math.min(7, row));
    const { file, rank } = colRowToFileRank(col, row, orientation);
    const targetSquare = FILES[file] + (rank + 1);

    const target = legalTargets.find(m => m.to === targetSquare);
    if (target) {
      attemptMove(square, targetSquare);
    } else {
      const pos = squareToPercentPos(square, orientation);
      el.style.left = pos.left + '%';
      el.style.top = pos.top + '%';
    }
  });
}

function findSquareForEl(el) {
  return Object.keys(pieceMap).find(sq => pieceMap[sq] === el);
}

function fmt(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
}

function updateClocksDisplay(clocks) {
  const myEl = document.getElementById('bottomClock');
  const oppEl = document.getElementById('topClock');
  const mySec = clocks[myColor];
  const oppSec = clocks[myColor === 'w' ? 'b' : 'w'];
  myEl.textContent = fmt(mySec);
  oppEl.textContent = fmt(oppSec);
  myEl.classList.toggle('low', mySec <= 10);
  oppEl.classList.toggle('low', oppSec <= 10);
}

function updateStatusText(state) {
  if (state.over) return;
  const yourTurn = state.turn === myColor;
  document.getElementById('statusText').textContent = yourTurn
    ? "Your move" + (state.check ? ' — Check!' : '')
    : "Opponent's move" + (state.check ? ' — Check!' : '');
  document.querySelectorAll('.player-clock').forEach(c => c.classList.remove('active'));
  const activeEl = yourTurn ? document.getElementById('bottomClock') : document.getElementById('topClock');
  activeEl.classList.add('active');
}

function flashStatus(msg) {
  const el = document.getElementById('statusText');
  if (!el) return;
  const orig = el.textContent;
  el.textContent = msg;
  setTimeout(() => (el.textContent = orig), 1200);
}

function showGameOver(result) {
  const title = document.getElementById('overTitle');
  const desc = document.getElementById('overDesc');
  let text;
  if (!result.winner) {
    text = 'Draw';
  } else {
    const iWon = result.winner === myColor;
    text = iWon ? 'You win!' : 'You lose';
  }
  title.textContent = text;
  desc.textContent = `by ${result.reason}`;
  document.getElementById('overModal').classList.remove('hidden');
  document.getElementById('statusText').textContent = 'Game over';
}
