# Minigames

Two-player real-time games mounted into the backend, same pattern as `games/chess`:
a static page served in an iframe, plus a Socket.IO namespace. One module, one shared
lobby/room system, one engine per game.

| Game | id | Notes |
| --- | --- | --- |
| Tic-Tac-Toe | `tictactoe` | 60s per move |
| Connect Four | `connect4` | 7x6 board, 60s per move |
| Gomoku | `gomoku` | 13x13, five in a row, 60s per move |
| Reversi | `reversi` | 8x8, auto-pass, legal-move hints, 60s per move |
| Dots and Boxes | `dots` | 4x4 boxes, extra turn on a claimed box, 60s per move |
| Rock Paper Scissors | `rps` | best of 3 or 5, picks stay hidden until both lock in, 30s per round |

## Routes

- `GET /start-minigame?game=<id>&embed=1` — the game page. Omit `game` for a picker.
  Other params: `name`, `rounds` (3 or 5, rps), `action=create`, `join=<4-digit code>`.
- `GET /games/minigames/*` — static assets.
- Socket.IO namespace `/minigames` — game relay (separate from the main chat namespace and from `/chess`).

Both HTTP routes are mounted in `index.js` ahead of `globalLimiter` and use their own limiter.

## Server-authoritative

Unlike chess, **the server owns the game state and validates every move**. Clients send
intents (`move` with `{cell}`, `{col}` or `{choice}`) and render whatever `state` snapshot
the server sends back. A tampered client can't make an illegal move, move out of turn, or
peek at the opponent's Rock-Paper-Scissors pick (the server only includes your own pick in
your snapshot).

## Lifecycle (shared by all games)

- 4-digit join codes; creator is seat 0, joiner seat 1. Who moves first alternates on rematch.
- Reconnect: each seat has a token (client keeps it in `localStorage`). A dropped player has
  60s to return; otherwise the opponent wins (`disconnect`). Turn clocks pause while anyone is away.
- Inactivity: whoever the game is waiting on forfeits when the clock runs out (`timeout`);
  if it's waiting on both players (rps) the game is a draw (`inactivity`).
- Resign, rematch (both players must accept), leave. Finished games are cleaned up after 5 minutes.
- Per-socket token-bucket rate limit and strict payload validation.

## Env (all optional)

```
MINIGAMES_RATE_LIMIT_MAX=200
MINIGAMES_RATE_LIMIT_WINDOW_MS=60000
MINIGAMES_MAX_GAMES=2000
MINIGAMES_EMBED_ORIGINS=https://app.example.com   # falls back to CHESS_EMBED_ORIGINS, then CLIENT_URL
```

## Adding a game

1. Create `engines/<id>.js` exporting `{ id, label, turnMs, sanitizeOptions, create, view, turnOf, pending, move }`
   (copy `tictactoe.js` — it's ~35 lines). `move` mutates state and returns `{}`, `{ error }`,
   or `{ over: { winner: 0|1|null, reason, line? } }`.
2. Register it in `engines/index.js`.
3. In `public/app.js`, add `RENDER.<id> = { build(stage, state), update(state, over) }` (square boards: `gridRenderer('<css-prefix>')`).
   The picker reads `GAME_LIST` from `/games/minigames/games.json`, so no `GAMES` entry is needed.
   Put clickable elements' payload in `data-move='{"..."}'` and the shared click handler sends it.
4. Frontend: add it to `frontend/src/utils/minigames.js` (label, icon, `/start-<id>` command).

## Embedding events (iframe -> parent `postMessage`)

`minigame-embed:height | created {id,game} | started {id,game} | over {id,game,winner,mine} | idle | error {message}`
