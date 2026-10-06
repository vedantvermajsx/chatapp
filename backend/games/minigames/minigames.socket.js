import crypto from 'crypto';
import { ENGINES, isGame } from './engines/index.js';

const NAMESPACE = '/minigames';
const GRACE_MS = 60 * 1000;
const FINISHED_TTL_MS = 5 * 60 * 1000;
const MAX_GAMES = parseInt(process.env.MINIGAMES_MAX_GAMES, 10) || 2000;

const cleanName = (n, fallback) => {
  if (typeof n !== 'string') return fallback;
  // eslint-disable-next-line no-control-regex
  const s = n.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 20);
  return s || fallback;
};

export function setupMinigamesSocket(io) {
  const nsp = io.of(NAMESPACE);
  const games = new Map();

  const genId = () => {
    for (let i = 0; i < 25; i++) {
      const id = String(crypto.randomInt(1000, 10000));
      if (!games.has(id)) return id;
    }
    return null;
  };

  const connected = (p) => !!(p && p.connected && p.socketId);
  const bothHere = (g) => connected(g.players[0]) && connected(g.players[1]);
  const anyoneGone = (g) => !g.players[0] || !g.players[1] || !g.players[0].connected || !g.players[1].connected;
  const seatOf = (socket, g) => {
    const s = socket.data.seat;
    return s === 0 || s === 1 ? (g.players[s] && g.players[s].socketId === socket.id ? s : null) : null;
  };
  const names = (g) => [g.players[0] ? g.players[0].name : null, g.players[1] ? g.players[1].name : null];

  const snapshot = (g, seat) => ({
    game: g.type,
    options: g.options,
    state: g.engine.view(g.state, seat),
    turn: g.engine.turnOf(g.state),
    started: g.started,
    over: g.over,
    rematch: g.rematch,
    turnMsLeft: g.deadline ? Math.max(0, g.deadline - Date.now()) : null,
  });

  const emitState = (g, extra) => {
    [0, 1].forEach((seat) => {
      const p = g.players[seat];
      if (connected(p)) nsp.to(p.socketId).emit('state', { ...snapshot(g, seat), ...extra });
    });
  };

  const clearTurnTimer = (g) => {
    clearTimeout(g.turnTimer);
    g.turnTimer = null;
    g.deadline = 0;
  };

  const clearPlayerTimers = (g) => [0, 1].forEach((s) => g.players[s] && clearTimeout(g.players[s].disconnectTimer));

  const destroyGame = (id) => {
    const g = games.get(id);
    if (!g) return;
    clearTurnTimer(g);
    clearTimeout(g.cleanupTimer);
    clearPlayerTimers(g);
    games.delete(id);
  };

  const scheduleCleanup = (id, g) => {
    clearTimeout(g.cleanupTimer);
    g.cleanupTimer = setTimeout(() => destroyGame(id), FINISHED_TTL_MS);
    g.cleanupTimer.unref?.();
  };

  const endGame = (id, g, result) => {
    if (g.over) return;
    clearTurnTimer(g);
    clearPlayerTimers(g);
    g.over = { winner: result.winner ?? null, reason: result.reason, line: result.line || null };
    g.rematch = [false, false];
    emitState(g);
    nsp.to(id).emit('gameOver', g.over);
    scheduleCleanup(id, g);
  };

  // Inactivity: whoever the game is waiting on forfeits; if it is waiting on both, it's a draw.
  const armTurnTimer = (id, g) => {
    clearTurnTimer(g);
    if (!g.started || g.over || anyoneGone(g)) return;
    g.deadline = Date.now() + g.engine.turnMs;
    g.turnTimer = setTimeout(() => {
      const cur = games.get(id);
      if (!cur || cur.over) return;
      const waiting = cur.engine.pending(cur.state);
      if (waiting.length === 1) endGame(id, cur, { winner: 1 - waiting[0], reason: 'timeout' });
      else endGame(id, cur, { winner: null, reason: 'inactivity' });
    }, g.engine.turnMs);
    g.turnTimer.unref?.();
  };

  const attach = (socket, id, seat) => {
    socket.join(id);
    socket.data.gameId = id;
    socket.data.seat = seat;
  };

  const reconnectPlayer = (socket, id, g, seat) => {
    const p = g.players[seat];
    if (p.connected) return socket.emit('joinError', 'That seat is already connected elsewhere.');
    clearTimeout(p.disconnectTimer);
    p.disconnectTimer = null;
    p.connected = true;
    p.socketId = socket.id;
    attach(socket, id, seat);

    if (g.started && !g.over && !anyoneGone(g)) armTurnTimer(id, g);

    socket.emit('resynced', { id, seat, names: names(g), ...snapshot(g, seat) });
    const opp = g.players[1 - seat];
    if (connected(opp)) nsp.to(opp.socketId).emit('opponentReconnected');
    if (g.started && !g.over) emitState(g);
  };

  const detach = (sock) => {
    const id = sock.data.gameId;
    const seat = sock.data.seat;
    const g = games.get(id);
    sock.data.gameId = null;
    sock.data.seat = null;
    if (id) sock.leave(id);
    if (!g || (seat !== 0 && seat !== 1)) return;
    const p = g.players[seat];
    if (!p || p.socketId !== sock.id) return;

    p.connected = false;
    p.socketId = null;
    clearTurnTimer(g);

    const opp = g.players[1 - seat];

    if (!g.started) {
      p.disconnectTimer = setTimeout(() => {
        const cur = games.get(id);
        if (cur && cur.players[seat] && !cur.players[seat].connected) destroyGame(id);
      }, GRACE_MS);
      p.disconnectTimer.unref?.();
      return;
    }

    if (g.over) {
      if (connected(opp)) nsp.to(opp.socketId).emit('opponentLeft');
      return;
    }

    if (connected(opp)) nsp.to(opp.socketId).emit('opponentDisconnected', { seat, graceSeconds: GRACE_MS / 1000 });

    p.disconnectTimer = setTimeout(() => {
      const cur = games.get(id);
      if (!cur || cur.over) return;
      if (!cur.players[seat].connected) endGame(id, cur, { winner: 1 - seat, reason: 'disconnect' });
    }, GRACE_MS);
    p.disconnectTimer.unref?.();
  };

  const throttle = (socket) => {
    let tokens = 20;
    let last = Date.now();
    socket.use((packet, next) => {
      const now = Date.now();
      tokens = Math.min(20, tokens + ((now - last) / 1000) * 10);
      last = now;
      if (tokens < 1) return next(new Error('rate-limited'));
      tokens -= 1;
      next();
    });
  };

  const safe = (name, fn) => (...args) => {
    try {
      fn(...args);
    } catch (err) {
      console.error(`[minigames] ${name} failed:`, err.message);
    }
  };

  nsp.on('connection', (socket) => {
    socket.data.gameId = null;
    socket.data.seat = null;
    throttle(socket);

    socket.on('createGame', safe('createGame', (payload) => {
      const { game: type, name, options } = payload || {};
      if (!isGame(type)) return socket.emit('createError', 'Unknown game.');

      const existing = games.get(socket.data.gameId);
      if (existing && !existing.over) return socket.emit('createError', 'You are already in a game.');
      if (existing) detach(socket);

      if (games.size >= MAX_GAMES) return socket.emit('createError', 'Too many games right now, try again in a minute.');
      const id = genId();
      if (!id) return socket.emit('createError', 'Server is busy, try again.');

      const engine = ENGINES[type];
      const opts = engine.sanitizeOptions(options);
      const token = crypto.randomBytes(12).toString('hex');

      games.set(id, {
        id,
        type,
        engine,
        options: opts,
        firstSeat: 0,
        state: engine.create(opts, 0),
        players: [
          { token, name: cleanName(name, 'Player 1'), connected: true, socketId: socket.id, disconnectTimer: null },
          null,
        ],
        started: false,
        over: null,
        rematch: [false, false],
        turnTimer: null,
        deadline: 0,
        cleanupTimer: null,
      });

      attach(socket, id, 0);
      socket.emit('gameCreated', { id, game: type, options: opts, seat: 0, token });
    }));

    socket.on('joinGame', safe('joinGame', (payload) => {
      const { id, name, token, game: wanted } = payload || {};
      if (typeof id !== 'string' || !/^\d{4}$/.test(id)) return socket.emit('joinError', 'Game code not found.');
      const g = games.get(id);
      if (!g) return socket.emit('joinError', 'Game code not found.');
      if (isGame(wanted) && wanted !== g.type) {
        return socket.emit('joinError', `That code is for ${g.engine.label}, not ${ENGINES[wanted].label}.`);
      }

      for (const seat of [0, 1]) {
        const p = g.players[seat];
        if (p && typeof token === 'string' && token && p.token === token) {
          return reconnectPlayer(socket, id, g, seat);
        }
      }

      if (g.players[1]) {
        return socket.emit('joinError', anyoneGone(g) ? 'A player is reconnecting to this game — try again shortly.' : 'Game is already full.');
      }
      if (!g.players[0].connected) {
        return socket.emit('joinError', 'The creator disconnected — waiting for them to reconnect.');
      }
      if (socket.data.gameId && socket.data.gameId !== id) {
        const cur = games.get(socket.data.gameId);
        if (cur && !cur.over) return socket.emit('joinError', 'You are already in a game.');
        detach(socket);
      }

      const newToken = crypto.randomBytes(12).toString('hex');
      g.players[1] = { token: newToken, name: cleanName(name, 'Player 2'), connected: true, socketId: socket.id, disconnectTimer: null };
      attach(socket, id, 1);
      g.started = true;
      armTurnTimer(id, g);

      const base = { id, game: g.type, options: g.options, names: names(g) };
      nsp.to(g.players[0].socketId).emit('gameStart', { ...base, seat: 0, ...snapshot(g, 0) });
      socket.emit('gameStart', { ...base, seat: 1, token: newToken, ...snapshot(g, 1) });
    }));

    socket.on('move', safe('move', (payload) => {
      const id = socket.data.gameId;
      const g = games.get(id);
      if (!g || g.over || !g.started) return;
      const seat = seatOf(socket, g);
      if (seat === null) return;
      if (anyoneGone(g)) return socket.emit('moveRejected', { reason: 'opponent-away' });

      const res = g.engine.move(g.state, seat, payload);
      if (res.error) return socket.emit('moveRejected', { reason: res.error });

      if (res.over) return endGame(id, g, res.over);

      emitState(g);
      // Turn-based games reset the clock on every move. Simultaneous games (rps) only reset
      // when a round resolves, so one player locking in early doesn't extend the other's time.
      if (g.engine.turnOf(g.state) !== null || g.engine.pending(g.state).length === 2) armTurnTimer(id, g);
    }));

    socket.on('rematch', safe('rematch', () => {
      const id = socket.data.gameId;
      const g = games.get(id);
      if (!g || !g.over) return;
      const seat = seatOf(socket, g);
      if (seat === null) return;
      if (!bothHere(g)) return socket.emit('rematchDenied', 'Your opponent has left.');

      g.rematch[seat] = true;
      if (!(g.rematch[0] && g.rematch[1])) return emitState(g);

      clearTimeout(g.cleanupTimer);
      g.firstSeat = 1 - g.firstSeat;
      g.state = g.engine.create(g.options, g.firstSeat);
      g.over = null;
      g.rematch = [false, false];
      armTurnTimer(id, g);
      emitState(g, { event: 'rematchStarted' });
    }));

    socket.on('resign', safe('resign', () => {
      const id = socket.data.gameId;
      const g = games.get(id);
      if (!g || g.over || !g.started) return;
      const seat = seatOf(socket, g);
      if (seat === null) return;
      endGame(id, g, { winner: 1 - seat, reason: 'resignation' });
    }));

    socket.on('leaveGame', safe('leaveGame', () => detach(socket)));
    socket.on('disconnect', safe('disconnect', () => detach(socket)));
  });

  return nsp;
}
