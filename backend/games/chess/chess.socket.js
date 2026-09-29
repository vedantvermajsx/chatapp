import crypto from 'crypto';

const NAMESPACE = '/chess';
const GRACE_MS = 60 * 1000;
const FINISHED_TTL_MS = 5 * 60 * 1000;
const MAX_GAMES = parseInt(process.env.CHESS_MAX_GAMES, 10) || 2000;
const ALLOWED_MINUTES = new Set([5, 10]);
const DRAW_REASONS = new Set(['stalemate', 'insufficient material', 'threefold repetition', 'draw']);
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const SQUARE = /^[a-h][1-8]$/;
const isSquare = (s) => typeof s === 'string' && SQUARE.test(s);
const isFen = (f) => typeof f === 'string' && f.length <= 100 && f.split(' ').length === 6;
const isShortText = (t) => t == null || (typeof t === 'string' && t.length <= 8);
const cleanName = (n, fallback) => (typeof n === 'string' && n.trim() ? n.trim().slice(0, 20) : fallback);
const other = (color) => (color === 'w' ? 'b' : 'w');

export function setupChessSocket(io) {
  const nsp = io.of(NAMESPACE);
  const games = new Map();

  const genId = () => {
    for (let i = 0; i < 25; i++) {
      const id = String(crypto.randomInt(1000, 10000));
      if (!games.has(id)) return id;
    }
    return null;
  };

  const publicState = (game) => ({
    fen: game.fen,
    turn: game.turn,
    clocks: game.clocks,
    started: game.started,
    over: game.over,
    lastMove: game.lastMove,
    check: game.check,
    allowUndo: game.allowUndo,
    moveCount: game.moveCount,
  });

  const stopClock = (game) => {
    if (game.interval) {
      clearInterval(game.interval);
      game.interval = null;
    }
  };

  const anyoneDisconnected = (game) =>
    (game.players.w && !game.players.w.connected) || (game.players.b && !game.players.b.connected);

  const destroyGame = (id) => {
    const game = games.get(id);
    if (!game) return;
    stopClock(game);
    clearTimeout(game.cleanupTimer);
    ['w', 'b'].forEach((c) => game.players[c] && clearTimeout(game.players[c].disconnectTimer));
    games.delete(id);
  };

  const endGame = (id, game, result) => {
    if (game.over) return;
    stopClock(game);
    game.over = result;
    ['w', 'b'].forEach((c) => game.players[c] && clearTimeout(game.players[c].disconnectTimer));
    nsp.to(id).emit('gameOver', result);
    clearTimeout(game.cleanupTimer);
    game.cleanupTimer = setTimeout(() => destroyGame(id), FINISHED_TTL_MS);
    game.cleanupTimer.unref?.();
  };

  const startClock = (id, game) => {
    if (!game.started || game.over || anyoneDisconnected(game)) return;
    stopClock(game);
    game.lastTick = Date.now();
    game.interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - game.lastTick) / 1000;
      game.lastTick = now;
      const turn = game.turn;
      game.clocks[turn] = Math.max(0, game.clocks[turn] - elapsed);

      const shown = `${Math.round(game.clocks.w)}:${Math.round(game.clocks.b)}`;
      if (shown !== game.lastShown) {
        game.lastShown = shown;
        nsp.to(id).emit('clockUpdate', game.clocks);
      }
      if (game.clocks[turn] <= 0) {
        endGame(id, game, { reason: 'timeout', winner: other(turn) });
      }
    }, 250);
  };

  const seat = (socket, game) => {
    const color = socket.data.color;
    return color && game.players[color] && game.players[color].socketId === socket.id ? color : null;
  };

  const reconnectPlayer = (socket, id, game, color) => {
    const player = game.players[color];
    if (player.connected) {
      return socket.emit('joinError', 'That seat is already connected elsewhere.');
    }
    clearTimeout(player.disconnectTimer);
    player.disconnectTimer = null;
    player.connected = true;
    player.socketId = socket.id;
    socket.join(id);
    socket.data.gameId = id;
    socket.data.color = color;

    socket.emit('resynced', {
      id,
      color,
      names: { w: game.players.w ? game.players.w.name : null, b: game.players.b ? game.players.b.name : null },
      timeControl: game.timeControl,
      state: publicState(game),
    });

    const opp = game.players[other(color)];
    if (opp && opp.connected && opp.socketId) {
      nsp.to(opp.socketId).emit('opponentReconnected');
    }
    if (game.started && !game.over) startClock(id, game);
  };

  const cleanupSocket = (sock) => {
    const id = sock.data.gameId;
    const color = sock.data.color;
    const game = games.get(id);
    if (!game || !color) return;
    const player = game.players[color];
    if (!player || player.socketId !== sock.id) return;

    player.connected = false;
    player.socketId = null;
    stopClock(game);

    const opponentColor = other(color);
    const opp = game.players[opponentColor];

    if (!game.started) {
      player.disconnectTimer = setTimeout(() => {
        const g = games.get(id);
        if (g && g.players[color] && !g.players[color].connected) destroyGame(id);
      }, GRACE_MS);
      player.disconnectTimer.unref?.();
      return;
    }

    if (game.over) return;

    if (opp && opp.connected && opp.socketId) {
      nsp.to(opp.socketId).emit('opponentDisconnected', { color, graceSeconds: GRACE_MS / 1000 });
    }

    player.disconnectTimer = setTimeout(() => {
      const g = games.get(id);
      if (!g || g.over) return;
      if (!g.players[color].connected) {
        endGame(id, g, { reason: 'opponent disconnected too long', winner: opponentColor });
      }
    }, GRACE_MS);
    player.disconnectTimer.unref?.();
  };

  const throttle = (socket) => {
    let tokens = 30;
    let last = Date.now();
    socket.use((packet, next) => {
      const now = Date.now();
      tokens = Math.min(30, tokens + ((now - last) / 1000) * 20);
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
      console.error(`[chess] ${name} failed:`, err.message);
    }
  };

  nsp.on('connection', (socket) => {
    socket.data.gameId = null;
    socket.data.color = null;
    throttle(socket);

    socket.on('createGame', safe('createGame', (payload) => {
      const { timeControl, name, allowUndo } = payload || {};
      const existing = games.get(socket.data.gameId);
      if (existing && !existing.over) {
        return socket.emit('createError', 'You are already in a game.');
      }
      if (games.size >= MAX_GAMES) {
        return socket.emit('createError', 'Too many games right now, try again in a minute.');
      }
      const id = genId();
      if (!id) return socket.emit('createError', 'Server is busy, try again.');

      const minutes = ALLOWED_MINUTES.has(Number(timeControl)) ? Number(timeControl) : 5;
      const seconds = minutes * 60;
      const token = crypto.randomBytes(12).toString('hex');

      games.set(id, {
        fen: START_FEN,
        turn: 'w',
        moveCount: 0,
        lastMove: null,
        check: false,
        clocks: { w: seconds, b: seconds },
        timeControl: seconds,
        allowUndo: !!allowUndo,
        players: {
          w: { token, name: cleanName(name, 'Player 1'), connected: true, socketId: socket.id, disconnectTimer: null },
          b: null,
        },
        started: false,
        over: null,
        interval: null,
        lastTick: 0,
        lastShown: '',
        cleanupTimer: null,
      });

      socket.join(id);
      socket.data.gameId = id;
      socket.data.color = 'w';
      socket.emit('gameCreated', { id, color: 'w', token });
    }));

    socket.on('joinGame', safe('joinGame', (payload) => {
      const { id, name, token } = payload || {};
      if (typeof id !== 'string' || !/^\d{4}$/.test(id)) {
        return socket.emit('joinError', 'Game code not found.');
      }
      const game = games.get(id);
      if (!game) return socket.emit('joinError', 'Game code not found.');

      for (const color of ['w', 'b']) {
        const p = game.players[color];
        if (p && typeof token === 'string' && token && p.token === token) {
          return reconnectPlayer(socket, id, game, color);
        }
      }

      if (!game.players.b) {
        if (!game.players.w.connected) {
          return socket.emit('joinError', 'The creator disconnected — waiting for them to reconnect.');
        }
        const newToken = crypto.randomBytes(12).toString('hex');
        game.players.b = { token: newToken, name: cleanName(name, 'Player 2'), connected: true, socketId: socket.id, disconnectTimer: null };
        socket.join(id);
        socket.data.gameId = id;
        socket.data.color = 'b';
        game.started = true;

        nsp.to(id).emit('gameStart', {
          id,
          names: { w: game.players.w.name, b: game.players.b.name },
          timeControl: game.timeControl,
          state: publicState(game),
        });
        socket.emit('yourToken', { token: newToken, color: 'b' });
        startClock(id, game);
        return;
      }

      if (anyoneDisconnected(game)) {
        return socket.emit('joinError', 'A player is reconnecting to this game — try again shortly.');
      }
      return socket.emit('joinError', 'Game is already full.');
    }));

    socket.on('makeMove', safe('makeMove', (payload) => {
      const id = socket.data.gameId;
      const game = games.get(id);
      if (!game || game.over || !game.started) return;
      const color = seat(socket, game);
      const { from, to, promotion, san, captured, fen, check, over } = payload || {};

      if (!color || game.turn !== color) {
        return socket.emit('illegalMove', { from, to, reason: 'not-your-turn' });
      }
      if (!isSquare(from) || !isSquare(to) || !isFen(fen) || !isShortText(san) || !isShortText(captured) || !isShortText(promotion)) {
        return socket.emit('illegalMove', { from, to, reason: 'bad-payload' });
      }

      game.fen = fen;
      game.turn = other(color);
      game.moveCount += 1;
      game.lastMove = { from, to };
      game.check = check === true;

      nsp.to(id).emit('moveMade', {
        from,
        to,
        san: san || null,
        promotion: promotion || null,
        captured: captured || null,
        state: publicState(game),
      });

      if (over && typeof over.reason === 'string') {
        if (over.reason === 'checkmate') {
          return endGame(id, game, { reason: 'checkmate', winner: color });
        }
        if (DRAW_REASONS.has(over.reason)) {
          return endGame(id, game, { reason: over.reason, winner: null });
        }
      }
      startClock(id, game);
    }));

    socket.on('undoMove', safe('undoMove', (payload) => {
      const id = socket.data.gameId;
      const game = games.get(id);
      if (!game || game.over || !game.started || !game.allowUndo) return;
      const color = seat(socket, game);
      if (!color) return;

      const { plies, fen, check, lastMove } = payload || {};
      const expected = game.turn === color ? 2 : 1;
      if (plies !== expected || game.moveCount < expected || !isFen(fen)) {
        return socket.emit('undoDenied', 'Nothing to undo.');
      }
      if (lastMove && (!isSquare(lastMove.from) || !isSquare(lastMove.to))) {
        return socket.emit('undoDenied', 'Nothing to undo.');
      }

      game.fen = fen;
      game.turn = color;
      game.moveCount -= expected;
      game.lastMove = lastMove ? { from: lastMove.from, to: lastMove.to } : null;
      game.check = check === true;

      nsp.to(id).emit('moveUndone', { plies: expected, by: color, state: publicState(game) });
      startClock(id, game);
    }));

    socket.on('resign', safe('resign', () => {
      const id = socket.data.gameId;
      const game = games.get(id);
      if (!game || game.over || !game.started) return;
      const color = seat(socket, game);
      if (!color) return;
      endGame(id, game, { reason: 'resignation', winner: other(color) });
    }));

    socket.on('leaveGame', safe('leaveGame', () => cleanupSocket(socket)));
    socket.on('disconnect', safe('disconnect', () => cleanupSocket(socket)));
  });

  return nsp;
}
