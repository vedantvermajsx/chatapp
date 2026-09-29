# Chess mini-game

Self-contained chess module mounted into the HushLine backend.

## Routes

- `GET /start-chess` — serves the game page.
- `GET /games/chess/*` — static assets (client JS, CSS, the vendored `chess.js` rules engine).
- Socket.IO namespace `/chess` — game relay (separate from HushLine's main chat namespace/auth).

Both HTTP routes are mounted in `index.js` **ahead of** `globalLimiter`, so they use their own
limiter instead of the 200-req/15min API-wide one.

## Rate limit

`chess.limiter.js` — default **200 requests/minute** per IP. Configurable via env:

```
CHESS_RATE_LIMIT_MAX=200
CHESS_RATE_LIMIT_WINDOW_MS=60000
```

## Move validation: client-authoritative by design

The browser client runs a full chess rules engine (`vendor/chess.js`, MIT-licensed, vendored
locally — no CDN dependency) and only ever emits a `makeMove` for a move it has already checked
is legal. **The backend does not re-check chess legality.** It trusts the `fen`/`san`/`over`
fields the client sends and simply relays them to the opponent.

What the backend *does* still enforce, since these aren't rule-legality checks:
- **Turn order** — a `makeMove` is rejected with `illegalMove` unless it's that socket's seat's turn.
- **Seat ownership** — a socket can only move for the color it's connected as.
- **Payload shape** — `from`/`to` must look like board squares, `fen` must look like a FEN string,
  text fields are length-capped. This is basic input sanitation, not a rules engine.
- **Per-socket rate limiting** — a token bucket on each connection to blunt event floods.

If you later add a bot, spectator mode, or any client you don't fully trust, this trust model no
longer holds for that client and moves from it should be re-validated server-side.

## Embedding

Same as the standalone version — see the client's own README section — but the embed script now
points at `/start-chess` instead of `/`.
