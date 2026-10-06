// Minigames client. The server is authoritative: this file only sends intents ("move") and
// renders whatever snapshot the server last sent. Query params:
//   ?game=tictactoe|connect4|rps   preselect a game (omit to show the picker)
//   &embed=1                       compact layout + postMessage to the parent window
//   &name=Alice                    prefill player name
//   &rounds=3|5                    rock-paper-scissors match length
//   &action=create                 create a game as soon as the socket connects
//   &join=1234                     join game 1234 as soon as the socket connects
const socket = io('/minigames');
const $ = (id) => document.getElementById(id);

const EMBEDDED = document.documentElement.classList.contains('embed');
const MARKS = {
  x: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round"><path d="M22 22 L78 78 M78 22 L22 78"/></svg>',
  o: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="14"><circle cx="50" cy="50" r="29"/></svg>',
};
const HANDS = { rock: '✊', paper: '✋', scissors: '✌️' };

const GAMES = {
  tictactoe: { label: 'Tic-Tac-Toe', icon: '⭕', blurb: 'Get three in a row before your opponent does.' },
  connect4: { label: 'Connect Four', icon: '🔴', blurb: 'Drop discs and line up four in any direction.' },
  rps: { label: 'Rock Paper Scissors', icon: '✊', blurb: 'Lock in your pick and out-guess your friend.' },
};

/* ───────────── state ───────────── */
const params = new URLSearchParams(location.search);
let gameType = GAMES[params.get('game')] ? params.get('game') : null;
let gameId = null;
let mySeat = null;
let myToken = null;
let names = ['Player 1', 'Player 2'];
let snap = null;
let gameOver = false;
let opponentAway = false;
let pendingMove = false;
let deadlineAt = 0;
let rpsRounds = Number(params.get('rounds')) === 5 ? 5 : 3;
let everConnected = false;
let overTimer = null;
let builtFor = null;
let prevMoves = -1;
let shownRound = 0;

/* ───────────── helpers ───────────── */
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('mg:' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('mg:' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  del(k) { try { localStorage.removeItem('mg:' + k); } catch { /* storage blocked */ } },
};

function notify(event, data) {
  if (window.parent === window) return;
  window.parent.postMessage({ type: 'minigame-embed:' + event, ...data }, '*');
}

if (EMBEDDED && window.parent !== window) {
  const postHeight = () => notify('height', { height: Math.ceil(document.body.getBoundingClientRect().height) });
  new ResizeObserver(postHeight).observe(document.body);
  window.addEventListener('load', postHeight);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

const modal = (id, show) => $(id).classList.toggle('hidden', !show);

function cleanUrl(extra = {}) {
  const p = new URLSearchParams(location.search);
  ['action', 'join'].forEach((k) => p.delete(k));
  Object.entries(extra).forEach(([k, v]) => p.set(k, v));
  return location.pathname + '?' + p.toString();
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* ignore */ }
  ta.remove();
}

const getName = () => {
  const v = $('nameInput').value.trim();
  if (v) store.set('name', v);
  return v || 'Player';
};

let busyBtn = null;
function setBusy(btn, text) {
  busyBtn = { btn, label: btn.textContent };
  btn.disabled = true;
  btn.textContent = text;
  setTimeout(clearBusy, 6000);
}
function clearBusy() {
  if (!busyBtn) return;
  busyBtn.btn.disabled = false;
  busyBtn.btn.textContent = busyBtn.label;
  busyBtn = null;
}

/* ───────────── loader & connection ───────────── */
let loaderHidden = false;
const loaderStart = Date.now();
function hideLoader() {
  if (loaderHidden) return;
  loaderHidden = true;
  const el = $('loader');
  if (!el) return;
  setTimeout(() => {
    el.classList.add('done');
    setTimeout(() => el.remove(), 400);
  }, Math.max(0, 500 - (Date.now() - loaderStart)));
}
setTimeout(() => { if (!loaderHidden) $('loaderText').textContent = 'Still connecting…'; }, 5000);

let reconnectTimer = null;
function startReconnectCountdown(el, seconds) {
  clearInterval(reconnectTimer);
  let left = seconds;
  el.textContent = left;
  reconnectTimer = setInterval(() => {
    left -= 1;
    el.textContent = Math.max(0, left);
    if (left <= 0) clearInterval(reconnectTimer);
  }, 1000);
}

function rejoin() {
  if (!gameId || !myToken || gameOver) return;
  socket.emit('joinGame', { id: gameId, token: myToken, name: getName() });
}

socket.on('connect', () => {
  hideLoader();
  if (everConnected) rejoin();
  everConnected = true;
});
socket.on('connect_error', () => { if (!loaderHidden) $('loaderText').textContent = "Can't reach the server — retrying…"; });
socket.on('disconnect', () => {
  if (!gameId || gameOver || !snap || !snap.started) return;
  $('reconnectCode').textContent = gameId;
  startReconnectCountdown($('reconnectCountdown'), 60);
  modal('reconnectModal', true);
});

/* ───────────── picker & lobby ───────────── */
function buildPicker() {
  const list = $('gameList');
  Object.entries(GAMES).forEach(([id, g]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'game-card';
    btn.innerHTML = '<span class="gi"></span><span><div class="gt"></div><div class="gb"></div></span>';
    btn.querySelector('.gi').textContent = g.icon;
    btn.querySelector('.gt').textContent = g.label;
    btn.querySelector('.gb').textContent = g.blurb;
    btn.addEventListener('click', () => selectGame(id));
    list.appendChild(btn);
  });
}

function selectGame(id) {
  gameType = id;
  const g = GAMES[id];
  $('homeIcon').textContent = g.icon;
  $('homeTitle').textContent = g.label;
  $('homeBlurb').textContent = g.blurb;
  $('rpsOptions').hidden = id !== 'rps';
  $('joinError').textContent = '';
  showScreen('screen-home');
}

function syncRoundsButtons() {
  document.querySelectorAll('#roundsOptions .seg-btn').forEach((b) =>
    b.classList.toggle('selected', Number(b.dataset.rounds) === rpsRounds));
}

buildPicker();
syncRoundsButtons();
$('nameInput').value = (params.get('name') || store.get('name') || '').slice(0, 20);

document.querySelectorAll('#roundsOptions .seg-btn').forEach((b) =>
  b.addEventListener('click', () => { rpsRounds = Number(b.dataset.rounds); syncRoundsButtons(); }));

$('backToPick').addEventListener('click', () => { gameType = null; showScreen('screen-pick'); });

$('createBtn').addEventListener('click', (e) => {
  if (!gameType) return;
  setBusy(e.currentTarget, 'Creating…');
  socket.emit('createGame', { game: gameType, name: getName(), options: { rounds: rpsRounds } });
});

$('joinBtn').addEventListener('click', (e) => {
  const code = $('joinCodeInput').value.trim();
  $('joinError').textContent = '';
  if (!/^\d{4}$/.test(code)) { $('joinError').textContent = 'Enter a valid 4-digit code.'; return; }
  const saved = store.get('session:' + code);
  setBusy(e.currentTarget, 'Joining…');
  socket.emit('joinGame', { id: code, game: gameType, name: getName(), token: saved ? saved.token : null });
});
$('joinCodeInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('joinBtn').click(); });

$('cancelWaitBtn').addEventListener('click', () => {
  notify('idle', {});
  socket.emit('leaveGame');
  if (gameId) store.del('session:' + gameId);
  location.href = cleanUrl(gameType ? { game: gameType } : {});
});

$('copyCodeBtn').addEventListener('click', () => {
  copyText(gameId || '');
  const btn = $('copyCodeBtn');
  const orig = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => (btn.textContent = orig), 1200);
});

$('resignBtn').addEventListener('click', () => { if (!gameOver) modal('resignModal', true); });
$('resignNoBtn').addEventListener('click', () => modal('resignModal', false));
$('resignYesBtn').addEventListener('click', () => { modal('resignModal', false); if (!gameOver) socket.emit('resign'); });
$('rejoinBtn').addEventListener('click', rejoin);

$('rematchBtn').addEventListener('click', () => socket.emit('rematch'));
$('leaveBtn').addEventListener('click', () => {
  notify('idle', {});
  socket.emit('leaveGame');
  if (gameId) store.del('session:' + gameId);
  location.href = cleanUrl(gameType ? { game: gameType } : {});
});

/* ───────────── socket events ───────────── */
socket.on('gameCreated', (d) => {
  clearBusy();
  gameId = d.id;
  gameType = d.game;
  mySeat = d.seat;
  myToken = d.token;
  store.set('session:' + d.id, { token: d.token, seat: d.seat, game: d.game });
  $('codeDisplay').textContent = d.id;
  $('waitingGame').textContent = GAMES[d.game].label;
  showScreen('screen-waiting');
  notify('created', { id: d.id, game: d.game });
});

socket.on('createError', (msg) => { clearBusy(); $('joinError').textContent = msg; notify('error', { message: msg }); });
socket.on('joinError', (msg) => {
  clearBusy();
  $('joinError').textContent = msg;
  notify('error', { message: msg });
  // Mid-game reconnect: the server may not have noticed our old socket drop yet. Keep retrying
  // while the "connection lost" dialog is up.
  if (gameId && !gameOver && !$('reconnectModal').classList.contains('hidden')) setTimeout(rejoin, 1500);
});

socket.on('gameStart', (d) => {
  clearBusy();
  enterGame(d);
  notify('started', { id: d.id, game: d.game });
});

socket.on('resynced', (d) => {
  clearInterval(reconnectTimer);
  enterGame(d);
});

socket.on('state', (d) => applySnapshot(d));

socket.on('moveRejected', ({ reason }) => {
  pendingMove = false;
  if (reason === 'opponent-away') flashBanner('Opponent is away — hold on…');
  renderAll();
});

socket.on('opponentDisconnected', ({ graceSeconds }) => {
  opponentAway = true;
  deadlineAt = 0;
  startReconnectCountdown($('oppReconnectCountdown'), graceSeconds || 60);
  modal('awayBanner', true);
  renderAll();
});
socket.on('opponentReconnected', () => {
  opponentAway = false;
  clearInterval(reconnectTimer);
  modal('awayBanner', false);
  renderAll();
});
socket.on('opponentLeft', () => {
  $('rematchBtn').disabled = true;
  $('rematchNote').textContent = 'Your opponent has left.';
});
socket.on('rematchDenied', (msg) => {
  $('rematchBtn').disabled = true;
  $('rematchNote').textContent = msg;
});

let overNotified = false;
socket.on('gameOver', (over) => {
  if (overNotified) return;
  overNotified = true;
  notify('over', { id: gameId, game: gameType, winner: over.winner, mine: over.winner === mySeat });
});

/* ───────────── auto start (embed params) ───────────── */
let autoStarted = false;
function autoStart() {
  if (autoStarted) return;
  autoStarted = true;
  const joinCode = (params.get('join') || '').trim();
  if (/^\d{4}$/.test(joinCode)) {
    const saved = store.get('session:' + joinCode);
    socket.emit('joinGame', { id: joinCode, game: gameType, name: getName(), token: saved ? saved.token : null });
  } else if (params.get('action') === 'create' && gameType) {
    socket.emit('createGame', { game: gameType, name: getName(), options: { rounds: rpsRounds } });
  }
}
if (socket.connected) autoStart(); else socket.once('connect', autoStart);

if (gameType) selectGame(gameType); else showScreen('screen-pick');

/* ───────────── game screen ───────────── */
function enterGame(d) {
  gameId = d.id;
  gameType = d.game;
  if (d.seat === 0 || d.seat === 1) mySeat = d.seat;
  if (d.token) myToken = d.token;
  names = d.names || names;
  gameOver = false;
  overNotified = false;
  opponentAway = false;
  pendingMove = false;
  clearTimeout(overTimer);
  store.set('session:' + gameId, { token: myToken, seat: mySeat, game: gameType });

  $('meName').textContent = names[mySeat] || 'You';
  $('oppName').textContent = names[1 - mySeat] || 'Opponent';
  $('meDot').className = 'dot p' + mySeat;
  $('oppDot').className = 'dot p' + (1 - mySeat);
  $('activeCodeTag').textContent = gameId;
  $('gameLabel').textContent = GAMES[gameType].label;
  $('resignBtn').hidden = false;
  ['overModal', 'resignModal', 'reconnectModal', 'awayBanner'].forEach((m) => modal(m, false));

  buildStage(true);
  showScreen('screen-game');
  applySnapshot(d);
}

function applySnapshot(d) {
  snap = d;
  pendingMove = false;
  deadlineAt = d.turnMsLeft != null ? Date.now() + d.turnMsLeft : 0;

  if (d.event === 'rematchStarted') {
    clearTimeout(overTimer);
    gameOver = false;
    overNotified = false;
    modal('overModal', false);
    $('resignBtn').hidden = false;
    buildStage(true);
    notify('started', { id: gameId, game: gameType });
  }
  renderAll();
  if (d.over) showOver(d.over, d.rematch || [false, false]);
}

const canAct = () => !!snap && snap.started && !gameOver && !opponentAway && !pendingMove &&
  (snap.turn === null || snap.turn === mySeat);

function sendMove(payload) {
  if (!canAct()) return;
  pendingMove = true;
  socket.emit('move', payload);
  renderAll();
  setTimeout(() => { if (pendingMove) { pendingMove = false; renderAll(); } }, 1500);
}

$('stage').addEventListener('click', (e) => {
  const el = e.target.closest('[data-move]');
  if (!el || el.disabled) return;
  try { sendMove(JSON.parse(el.dataset.move)); } catch { /* ignore */ }
});

/* ───────────── renderers ───────────── */
const RENDER = {
  tictactoe: {
    build(stage) {
      const board = document.createElement('div');
      board.className = 'ttt-board';
      for (let i = 0; i < 9; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ttt-cell';
        b.dataset.move = JSON.stringify({ cell: i });
        b.setAttribute('aria-label', 'Cell ' + (i + 1));
        board.appendChild(b);
      }
      stage.appendChild(board);
    },
    update(s, over) {
      const cells = $('stage').querySelectorAll('.ttt-cell');
      const line = over && over.line ? over.line : [];
      cells.forEach((c, i) => {
        const v = s.board[i];
        const key = v === null ? '' : String(v);
        if (c.dataset.v !== key) {
          c.dataset.v = key;
          c.innerHTML = v === null ? '' : v === 0 ? MARKS.x : MARKS.o;
          c.classList.toggle('p0', v === 0);
          c.classList.toggle('p1', v === 1);
        }
        c.classList.toggle('win', line.includes(i));
        c.disabled = v !== null || !canAct();
      });
    },
  },

  connect4: {
    build(stage) {
      const board = document.createElement('div');
      board.className = 'c4-board';
      for (let c = 0; c < 7; c++) {
        const col = document.createElement('button');
        col.type = 'button';
        col.className = 'c4-col';
        col.dataset.move = JSON.stringify({ col: c });
        col.setAttribute('aria-label', 'Drop in column ' + (c + 1));
        for (let r = 0; r < 6; r++) {
          const cell = document.createElement('div');
          cell.className = 'c4-cell';
          col.appendChild(cell);
        }
        board.appendChild(col);
      }
      stage.appendChild(board);
    },
    update(s, over) {
      const cols = $('stage').querySelectorAll('.c4-col');
      const win = new Set(over && over.line ? over.line : []);
      const fresh = s.moves > prevMoves && prevMoves !== -1;
      cols.forEach((col, c) => {
        [...col.children].forEach((cell, r) => {
          const idx = r * 7 + c;
          const v = s.board[idx];
          cell.classList.toggle('p0', v === 0);
          cell.classList.toggle('p1', v === 1);
          cell.classList.toggle('win', win.has(idx));
          const isLast = s.last && s.last.row === r && s.last.col === c;
          cell.classList.toggle('drop', !!(fresh && isLast));
        });
        col.disabled = s.board[c] !== null || !canAct();
      });
      prevMoves = s.moves;
    },
  },

  rps: {
    build(stage) {
      stage.innerHTML =
        '<div class="rps-info" id="rpsInfo"></div>' +
        '<div class="rps-arena">' +
        '<div class="rps-side"><span class="rps-label">You</span><div class="rps-hand" id="rpsMe">❔</div></div>' +
        '<div class="rps-vs">VS</div>' +
        '<div class="rps-side"><span class="rps-label">Opponent</span><div class="rps-hand" id="rpsOpp">❔</div></div>' +
        '</div>' +
        '<div class="rps-result" id="rpsResult"></div>' +
        '<div class="rps-choices"></div>' +
        '<div class="rps-history" id="rpsHist"></div>';
      const choices = stage.querySelector('.rps-choices');
      Object.entries(HANDS).forEach(([k, em]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'rps-choice';
        b.dataset.move = JSON.stringify({ choice: k });
        b.dataset.choice = k;
        b.innerHTML = '<span class="em"></span><span></span>';
        b.firstChild.textContent = em;
        b.lastChild.textContent = k[0].toUpperCase() + k.slice(1);
        choices.appendChild(b);
      });
    },
    update(s, over) {
      $('rpsInfo').textContent = over ? 'Match finished' : `Round ${s.round} · first to ${s.target} wins`;
      const me = $('rpsMe');
      const opp = $('rpsOpp');
      const res = $('rpsResult');
      me.classList.remove('won');
      opp.classList.remove('won');

      if (s.mine) {
        me.textContent = HANDS[s.mine];
        opp.textContent = s.oppLocked ? '🔒' : '❔';
        res.textContent = s.oppLocked ? '' : 'Locked in — waiting for opponent…';
      } else if (s.oppLocked) {
        me.textContent = '❔';
        opp.textContent = '🔒';
        res.textContent = 'Your opponent has locked in!';
      } else if (s.last) {
        const l = s.last;
        me.textContent = HANDS[l.picks[mySeat]];
        opp.textContent = HANDS[l.picks[1 - mySeat]];
        if (l.winner === null) res.textContent = 'Tie — go again';
        else if (l.winner === mySeat) { res.textContent = 'You win the round!'; me.classList.add('won'); }
        else { res.textContent = 'They win the round'; opp.classList.add('won'); }
        if (l.round !== shownRound) {
          shownRound = l.round;
          [me, opp].forEach((h) => { h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); });
        }
      } else {
        me.textContent = '❔';
        opp.textContent = '❔';
        res.textContent = '';
      }

      $('stage').querySelectorAll('.rps-choice').forEach((b) => {
        b.classList.toggle('selected', s.mine === b.dataset.choice);
        b.disabled = s.mine !== null || !canAct();
      });

      $('rpsHist').innerHTML = '';
      s.history.forEach((h) => {
        const chip = document.createElement('span');
        const r = h.winner === null ? 'T' : h.winner === mySeat ? 'W' : 'L';
        chip.className = 'chip ' + r;
        chip.textContent = r;
        $('rpsHist').appendChild(chip);
      });
    },
  },
};

function buildStage(force) {
  if (!force && builtFor === gameType) return;
  builtFor = gameType;
  prevMoves = -1;
  shownRound = 0;
  const stage = $('stage');
  stage.innerHTML = '';
  RENDER[gameType].build(stage);
}

function renderAll() {
  if (!snap || !gameType) return;
  RENDER[gameType].update(snap.state, snap.over);

  const scores = snap.state.scores;
  ['meScore', 'oppScore'].forEach((id, i) => {
    $(id).hidden = !scores;
    if (scores) $(id).textContent = scores[i === 0 ? mySeat : 1 - mySeat];
  });
  updateBanner();
}

function flashBanner(text) {
  $('bannerText').textContent = text;
  setTimeout(updateBanner, 1600);
}

function updateBanner() {
  if (!snap) return;
  const banner = $('banner');
  const opp = names[1 - mySeat] || 'Opponent';
  let text;
  let cls = '';
  if (snap.over) {
    text = snap.over.winner === null ? "It's a draw" : snap.over.winner === mySeat ? 'You won!' : `${opp} won`;
    cls = 'over';
  } else if (opponentAway) {
    text = 'Opponent disconnected…';
  } else if (snap.turn !== null) {
    const mine = snap.turn === mySeat;
    text = mine ? 'Your turn' : `${opp}'s turn`;
    cls = mine ? 'mine' : '';
  } else {
    const s = snap.state;
    if (s.mine) text = 'Waiting for opponent…';
    else if (s.oppLocked) { text = 'Make your pick — they are ready'; cls = 'mine'; }
    else { text = 'Make your pick'; cls = 'mine'; }
  }
  banner.className = 'banner ' + cls;
  $('bannerText').textContent = text;
}

setInterval(() => {
  const el = $('timer');
  if (!deadlineAt || gameOver || opponentAway) { el.textContent = ''; el.classList.remove('low'); return; }
  const secs = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
  el.textContent = secs + 's';
  el.classList.toggle('low', secs <= 10);
}, 250);

/* ───────────── game over ───────────── */
function describeOver(over) {
  const mine = over.winner === mySeat;
  switch (over.reason) {
    case 'three-in-a-row': return 'Three in a row.';
    case 'four-in-a-row': return 'Four in a row.';
    case 'best-of': return mine ? 'You took the match.' : 'They took the match.';
    case 'draw': return 'Nobody could win this one.';
    case 'resignation': return mine ? 'Your opponent resigned.' : 'You resigned.';
    case 'timeout': return mine ? 'Your opponent ran out of time.' : 'You ran out of time.';
    case 'inactivity': return 'Neither player moved in time.';
    case 'disconnect': return mine ? 'Your opponent disconnected.' : 'You were disconnected for too long.';
    default: return '';
  }
}

function showOver(over, rematch) {
  if (!gameOver) {
    gameOver = true;
    deadlineAt = 0;
    renderAll();
    clearTimeout(overTimer);
    // Let the player see the winning line / final reveal before the dialog covers the board.
    const delay = gameType === 'rps' ? 1600 : over.reason === 'resignation' || over.reason === 'timeout' || over.reason === 'disconnect' ? 0 : 800;
    overTimer = setTimeout(() => modal('overModal', true), delay);
    modal('resignModal', false);
    $('resignBtn').hidden = true;
    notify('over', { id: gameId, game: gameType, winner: over.winner, mine: over.winner === mySeat });
    overNotified = true;
  }

  $('overTitle').textContent = over.winner === null ? "It's a draw" : over.winner === mySeat ? 'You win! 🎉' : 'You lose';
  $('overDesc').textContent = describeOver(over);

  const iAsked = !!rematch[mySeat];
  const theyAsked = !!rematch[1 - mySeat];
  const btn = $('rematchBtn');
  btn.disabled = iAsked;
  btn.textContent = iAsked ? 'Waiting for opponent…' : theyAsked ? 'Accept rematch' : 'Rematch';
  $('rematchNote').textContent = theyAsked && !iAsked ? `${names[1 - mySeat] || 'Your opponent'} wants a rematch.` : '';
}
