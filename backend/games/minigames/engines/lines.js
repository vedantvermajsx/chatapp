// Shared helper for "N in a row" games on a rows x cols board stored as a flat row-major array.
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

export function runThrough(board, rows, cols, row, col, seat, min) {
  for (const [dr, dc] of DIRS) {
    const cells = [[row, col]];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < rows && c >= 0 && c < cols && board[r * cols + c] === seat) {
        cells.push([r, c]);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (cells.length >= min) return cells.map(([r, c]) => r * cols + c);
  }
  return null;
}
